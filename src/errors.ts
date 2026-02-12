/**
 * Erros customizados do plugin Qwen Auth
 *
 * Fornece mensagens amigáveis para o usuário em vez de JSON bruto da API.
 * Detalhes técnicos só aparecem com OPENCODE_QWEN_DEBUG=1.
 */

const REAUTH_HINT =
  'Execute "opencode auth login" e selecione "Qwen Code (qwen.ai OAuth)" para autenticar.';

// ============================================
// Erro de Autenticação
// ============================================

export type AuthErrorKind = 'token_expired' | 'refresh_failed' | 'auth_required';

const AUTH_MESSAGES: Record<AuthErrorKind, string> = {
  token_expired: `[Qwen] Token expirado. ${REAUTH_HINT}`,
  refresh_failed: `[Qwen] Falha ao renovar token. ${REAUTH_HINT}`,
  auth_required: `[Qwen] Autenticacao necessaria. ${REAUTH_HINT}`,
};

export class QwenAuthError extends Error {
  public readonly kind: AuthErrorKind;
  public readonly technicalDetail?: string;

  constructor(kind: AuthErrorKind, technicalDetail?: string) {
    super(AUTH_MESSAGES[kind]);
    this.name = 'QwenAuthError';
    this.kind = kind;
    this.technicalDetail = technicalDetail;
  }
}

// ============================================
// Erro de API
// ============================================

function classifyApiStatus(statusCode: number): string {
  if (statusCode === 401 || statusCode === 403) {
    return `[Qwen] Token invalido ou expirado. ${REAUTH_HINT}`;
  }
  if (statusCode === 429) {
    return '[Qwen] Limite de requisicoes atingido. Aguarde alguns minutos antes de tentar novamente.';
  }
  if (statusCode >= 500) {
    return `[Qwen] Servidor Qwen indisponivel (erro ${statusCode}). Tente novamente em alguns minutos.`;
  }
  return `[Qwen] Erro na API Qwen (${statusCode}). Verifique sua conexao e tente novamente.`;
}

export class QwenApiError extends Error {
  public readonly statusCode: number;
  public readonly technicalDetail?: string;

  constructor(statusCode: number, technicalDetail?: string) {
    super(classifyApiStatus(statusCode));
    this.name = 'QwenApiError';
    this.statusCode = statusCode;
    this.technicalDetail = technicalDetail;
  }
}

// ============================================
// Helper de log condicional
// ============================================

/**
 * Loga detalhes técnicos apenas quando debug está ativo.
 */
export function logTechnicalDetail(detail: string): void {
  if (process.env.OPENCODE_QWEN_DEBUG === '1') {
    console.debug('[Qwen Debug]', detail);
  }
}
