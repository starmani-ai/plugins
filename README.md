# StarMani plugins

Connect your AI app to [StarMani](https://starmani.com): Vedic birth charts, dashas, divisional charts, compatibility, transits and Panchang as tools.

- **MCP address:** `https://api.starmani.com/mcp`
- **Sign-in:** the first time, your app opens starmani.com; sign in and press Approve. It stays connected.
- **Or a key:** create one at [starmani.com/developers/keys](https://starmani.com/developers/keys) (starts with `sm_live_`)
- **Setup for every app, tools and prices:** [starmani.com/developers](https://starmani.com/developers)

## Claude Code

```sh
claude plugin marketplace add starmani-ai/plugins
claude plugin install starmani@starmani-ai
```

Then type `/mcp`, pick starmani and choose Authenticate. Prefer a key? Install `starmani-api-key@starmani-ai` instead; Claude Code asks for it once and keeps it in your system's secure credential store. Then ask: "Check my StarMani credit balance".

## VS Code, Cursor, Codex and other apps

Use the one-click buttons and copy-ready settings on [starmani.com/developers](https://starmani.com/developers). In VS Code you can also search `@mcp StarMani` in the Extensions view. StarMani is listed in the [MCP Registry](https://registry.modelcontextprotocol.io) as `com.starmani/starmani`.

Any MCP app: add a remote (Streamable HTTP) server at `https://api.starmani.com/mcp`. Apps that support MCP sign-in (OAuth) connect with your StarMani account; others can send the header `Authorization: Bearer <your key>`.

## What is in this repository

| Folder | Contents |
| --- | --- |
| `claude/directory` | Claude plugin `starmani` (signs in) |
| `claude/api-key` | Claude Code plugin `starmani-api-key` (asks for your key) |
| `openai` | ChatGPT / Codex package (signs in) |
| `vscode` | VS Code extension source |
| `examples` | Settings for Codex and VS Code |
| `server.json` | MCP Registry entry |

The tool list comes from the server, so new tools appear in every app without a new package. Build and check: `npm ci && npm run validate && npm test && npm run package` (Node.js 22 or later).

Help: [StarMani.App@gmail.com](mailto:StarMani.App@gmail.com) or this repository's Issues. [Privacy](docs/privacy.md) · [StarMani privacy policy](https://starmani.com/privacy) · [Terms](https://starmani.com/terms)

The code here is MIT-licensed; see [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md).
