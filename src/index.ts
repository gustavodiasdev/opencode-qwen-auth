/**
 * OpenCode Qwen Auth Plugin
 *
 * Plugin de autenticacao OAuth para Qwen, baseado no qwen-code.
 * Implementa Device Flow (RFC 8628) para autenticacao.
 *
 * Provider: qwen-code -> portal.qwen.ai/v1
 * Modelos: qwen3-coder-plus, qwen3-coder-flash, coder-model, vision-model
 */

import { spawn } from 'node:child_process';

import { QWEN_PROVIDER_ID, QWEN_API_CONFIG, QWEN_MODELS } from './constants.js';
import type { QwenCredentials } from './types.js';
import { saveCredentials } from './plugin/auth.js';
import {
  generatePKCE,
  requestDeviceAuthorization,
  pollDeviceToken,
  tokenResponseToCredentials,
  refreshAccessToken,
  SlowDownError,
} from './qwen/oauth.js';
import { logTechnicalDetail } from './errors.js';

// ============================================
// Helpers
// ============================================

function openBrowser(url: string): void {
  try {
    const platform = process.platform;
    const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'rundll32' : 'xdg-open';
    const args = platform === 'win32' ? ['url.dll,FileProtocolHandler', url] : [url];
    const child = spawn(command, args, { stdio: 'ignore', detached: true });
    child.unref?.();
  } catch {
    // Ignore errors
  }
}

/** Obtem um access token valido (com refresh se necessario) */
async function getValidAccessToken(
  getAuth: () => Promise<{ type: string; access?: string; refresh?: string; expires?: number }>,
): Promise<string | null> {
  const auth = await getAuth();

  if (!auth || auth.type !== 'oauth') {
    return null;
  }

  let accessToken = auth.access;

  // Refresh se expirado (com margem de 60s)
  if (accessToken && auth.expires && Date.now() > auth.expires - 60_000 && auth.refresh) {
    try {
      const refreshed = await refreshAccessToken(auth.refresh);
      accessToken = refreshed.accessToken;
      saveCredentials(refreshed);
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      logTechnicalDetail(`Token refresh falhou: ${detail}`);
      accessToken = undefined;
    }
  }

  return accessToken ?? null;
}

// ============================================
// Plugin Principal
// ============================================

export const QwenAuthPlugin = async (_input: unknown) => {
  return {
    auth: {
      provider: QWEN_PROVIDER_ID,

      loader: async (
        getAuth: () => Promise<{ type: string; access?: string; refresh?: string; expires?: number }>,
        provider: { models?: Record<string, { cost?: { input: number; output: number } }> },
      ) => {
        // Zerar custo dos modelos (gratuito via OAuth)
        if (provider?.models) {
          for (const model of Object.values(provider.models)) {
            if (model) model.cost = { input: 0, output: 0 };
          }
        }

        const accessToken = await getValidAccessToken(getAuth);
        if (!accessToken) return null;

        return {
          apiKey: accessToken,
          baseURL: QWEN_API_CONFIG.baseUrl,
        };
      },

      methods: [
        {
          type: 'oauth' as const,
          label: 'Qwen Code (qwen.ai OAuth)',
          authorize: async () => {
            const { verifier, challenge } = generatePKCE();

            try {
              const deviceAuth = await requestDeviceAuthorization(challenge);
              openBrowser(deviceAuth.verification_uri_complete);

              const POLLING_MARGIN_MS = 3000;

              return {
                url: deviceAuth.verification_uri_complete,
                instructions: `Codigo: ${deviceAuth.user_code}`,
                method: 'auto' as const,
                callback: async () => {
                  const startTime = Date.now();
                  const timeoutMs = deviceAuth.expires_in * 1000;
                  let interval = 5000;

                  while (Date.now() - startTime < timeoutMs) {
                    await new Promise(resolve => setTimeout(resolve, interval + POLLING_MARGIN_MS));

                    try {
                      const tokenResponse = await pollDeviceToken(deviceAuth.device_code, verifier);

                      if (tokenResponse) {
                        const credentials = tokenResponseToCredentials(tokenResponse);
                        saveCredentials(credentials);

                        return {
                          type: 'success' as const,
                          access: credentials.accessToken,
                          refresh: credentials.refreshToken ?? '',
                          expires: credentials.expiryDate || Date.now() + 3600000,
                        };
                      }
                    } catch (e) {
                      if (e instanceof SlowDownError) {
                        interval = Math.min(interval + 5000, 15000);
                      } else if (!(e instanceof Error) || !e.message.includes('authorization_pending')) {
                        return { type: 'failed' as const };
                      }
                    }
                  }

                  return { type: 'failed' as const };
                },
              };
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'Erro desconhecido';
              return {
                url: '',
                instructions: `Erro: ${msg}`,
                method: 'auto' as const,
                callback: async () => ({ type: 'failed' as const }),
              };
            }
          },
        },
      ],
    },

    config: async (config: Record<string, unknown>) => {
      const providers = (config.provider as Record<string, unknown>) || {};

      providers[QWEN_PROVIDER_ID] = {
        npm: '@ai-sdk/openai-compatible',
        name: 'Qwen Code',
        options: { baseURL: QWEN_API_CONFIG.baseUrl },
        models: Object.fromEntries(
          Object.entries(QWEN_MODELS).map(([id, m]) => [
            id,
            {
              id: m.id,
              name: m.name,
              reasoning: m.reasoning,
              limit: { context: m.contextWindow, output: m.maxOutput },
              cost: m.cost,
              modalities: { input: ['text'], output: ['text'] },
            },
          ])
        ),
      };

      config.provider = providers;
    },
  };
};

export default QwenAuthPlugin;
