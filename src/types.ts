/**
 * Type Definitions for Qwen Auth Plugin
 */

export interface QwenCredentials {
  accessToken: string;
  tokenType?: string;      // "Bearer"
  refreshToken?: string;
  resourceUrl?: string;    // "portal.qwen.ai" - base URL da API
  expiryDate?: number;     // timestamp em ms (formato qwen-code)
  scope?: string;          // "openid profile email"
}
