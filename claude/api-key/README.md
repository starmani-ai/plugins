# StarMani for Claude Code (API key)

For people who prefer a key to signing in. Most people should use `starmani@starmani-ai`, which signs in.

StarMani's tools in Claude Code over MCP (`https://api.starmani.com/mcp`). You need a StarMani account and an API key from [starmani.com/developers/keys](https://starmani.com/developers/keys). Paid tools use that account's credits; account and place checks are free.

```sh
claude plugin marketplace add starmani-ai/plugins
claude plugin install starmani-api-key@starmani-ai
```

When the plugin is switched on, Claude Code asks for your key, hides it as you type, and stores it in your system's secure credential store. To change it later, open `/plugin`, pick StarMani and reconfigure it.

Try: "Check my StarMani credit balance", then "Calculate the birth chart for 1 January 1990, 12:00, Chennai".

To stop: disable or uninstall the plugin, and revoke the key on StarMani.

## Privacy policy

The plugin sends your key only to the StarMani address above and has no telemetry or database of its own. Birth details you give a tool go to StarMani for the calculation and the results return to Claude. See [starmani.com/privacy](https://starmani.com/privacy) and [terms](https://starmani.com/terms). Help: StarMani.App@gmail.com.
