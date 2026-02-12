/**
 * Qwen Credentials Management
 *
 * Handles saving credentials to ~/.qwen/oauth_creds.json
 */

import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';

import type { QwenCredentials } from '../types.js';

/**
 * Get the path to the credentials file
 */
export function getCredentialsPath(): string {
  const homeDir = homedir();
  return join(homeDir, '.qwen', 'oauth_creds.json');
}

/**
 * Save credentials to file in qwen-code compatible format
 */
export function saveCredentials(credentials: QwenCredentials): void {
  const credPath = getCredentialsPath();
  const dir = join(homedir(), '.qwen');

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Save in qwen-code format for compatibility
  const data = {
    access_token: credentials.accessToken,
    token_type: credentials.tokenType || 'Bearer',
    refresh_token: credentials.refreshToken,
    resource_url: credentials.resourceUrl,
    expiry_date: credentials.expiryDate,
    scope: credentials.scope,
  };

  writeFileSync(credPath, JSON.stringify(data, null, 2));
}
