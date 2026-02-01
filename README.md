# opencode-qwen-auth

OAuth authentication plugin for [OpenCode CLI](https://opencode.ai) that enables Qwen3-Coder models through your [qwen.ai](https://chat.qwen.ai) account with **2,000 free requests per day**.

[Leia em Português](./README.pt-BR.md)

## Features

- **OAuth Device Flow** - Secure browser-based authentication (RFC 8628)
- **Automatic Polling** - Automatically detects when you authorize in the browser
- **2,000 req/day free** - No credit card required
- **1M context window** - Models with 1 million token context windows
- **Auto-refresh** - Automatically renews tokens when they expire
- **qwen-code compatible** - Reuses existing credentials from `~/.qwen/oauth_creds.json`

## Installation

### 1. Add the plugin to OpenCode

Edit `~/.opencode/package.json`:

```json
{
  "dependencies": {
    "opencode-qwen-auth": "github:gustavodiasdev/opencode-qwen-auth"
  }
}
```

Edit `~/.opencode/opencode.jsonc`:

```json
{
  "plugin": ["opencode-qwen-auth"]
}
```

### 2. Install dependencies

```bash
cd ~/.opencode && npm install
```

### 3. Authenticate

Start OpenCode and select the **Qwen Code** provider:

```bash
opencode
```

Or via command line (select "Other" and type `qwen-code`):

```bash
opencode auth login
```

Choose **"Qwen Code (qwen.ai OAuth)"** and authorize in your browser.

### 4. Use Qwen models

```bash
opencode --provider qwen-code --model qwen3-coder-plus
```

## Available Models

| Model | Context | Output | Description |
|-------|---------|--------|-------------|
| `qwen3-coder-plus` | 1M tokens | 64K tokens | Most capable coding model |
| `qwen3-coder-flash` | 1M tokens | 64K tokens | Faster responses |

## How It Works

1. **Device Flow (RFC 8628)**: When logging in, the plugin opens your browser to `chat.qwen.ai`
2. **Automatic Polling**: The plugin automatically detects when you authorize (no need to press Enter)
3. **Storage**: Credentials are saved to `~/.qwen/oauth_creds.json` (compatible with qwen-code)
4. **Auto-refresh**: Tokens are automatically renewed 30 seconds before expiration

## Usage Limits

| Plan | Rate Limit | Daily Limit |
|------|------------|-------------|
| Free (OAuth) | 60 req/min | 2,000 req/day |

## Local Development

```bash
# Clone the repository
git clone https://github.com/gustavodiasdev/opencode-qwen-auth.git
cd opencode-qwen-auth

# Install dependencies
bun install

# Type check
bun run typecheck

# Local link in OpenCode
# Edit ~/.opencode/package.json:
{
  "dependencies": {
    "opencode-qwen-auth": "file:/absolute/path/to/opencode-qwen-auth"
  }
}

# Reinstall
cd ~/.opencode && npm install
```

## Project Structure

```
src/
├── constants.ts        # Constants (OAuth endpoints, models)
├── types.ts            # TypeScript interfaces
├── index.ts            # Main plugin
├── cli.ts              # Standalone CLI (optional)
├── qwen/
│   └── oauth.ts        # OAuth Device Flow + PKCE logic
└── plugin/
    ├── auth.ts         # Credentials management
    ├── client.ts       # Qwen API client
    └── utils.ts        # Utilities
```

## Troubleshooting

### Token expired

The plugin automatically renews tokens. If issues persist:

```bash
# Remove old credentials
rm ~/.qwen/oauth_creds.json

# Re-authenticate
opencode auth login
```

### Provider not showing in `auth login`

The `qwen-code` provider is added via plugin. In the `opencode auth login` command:
1. Select **"Other"**
2. Type `qwen-code`

In the TUI (OpenCode graphical interface), the provider appears automatically.

### Rate limit exceeded

If you hit the daily limit (2,000 requests):
- Wait until midnight UTC for quota reset
- Consider using an API Key from [DashScope](https://dashscope.aliyun.com) for higher limits

## Related Projects

- [qwen-code](https://github.com/QwenLM/qwen-code) - Official Qwen coding CLI
- [OpenCode](https://opencode.ai) - AI CLI for development
- [opencode-gemini-auth](https://github.com/jenslys/opencode-gemini-auth) - Similar plugin for Google Gemini

## License

MIT
