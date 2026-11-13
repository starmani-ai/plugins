# Privacy

These packages only connect your AI app to StarMani at `https://api.starmani.com/mcp`. They have no telemetry and no database of their own.

- **Your key** is stored by your app: Claude Code keeps it in your system's secure credential store, VS Code in its secret storage, Codex reads it from an environment variable you set. It is sent only to the StarMani address above.
- **Birth details** you give a tool go to StarMani for the calculation, and the result returns to your AI app. Your AI provider's own policies cover what it does with the conversation.
- **To disconnect:** remove or disable the plugin or server in your app, and revoke the key at [starmani.com/developers/keys](https://starmani.com/developers/keys).

Full policy: [starmani.com/privacy](https://starmani.com/privacy). Questions: StarMani.App@gmail.com.
