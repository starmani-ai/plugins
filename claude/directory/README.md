# StarMani for Claude (sign-in)

StarMani's tools in Claude over MCP (`https://api.starmani.com/mcp`). No key needed: the first time, Claude opens starmani.com, you sign in and press Approve, and it stays connected.

```sh
claude plugin marketplace add starmani-ai/plugins
claude plugin install starmani@starmani-ai
```

Then type `/mcp`, pick starmani and choose Authenticate. Paid tools use your StarMani credits; finding a place and checking your account are free.

Try: "Check my StarMani credit balance", then "Calculate the birth chart for 1 January 1990, 12:00, Chennai".

To stop: disconnect it under Connected apps on [starmani.com/developers](https://starmani.com/developers), or uninstall the plugin.

## Privacy policy

Tools send the calculation inputs you give them to StarMani and return the results to Claude. The package has no telemetry or database of its own. See [starmani.com/privacy](https://starmani.com/privacy) and [terms](https://starmani.com/terms). Help: StarMani.App@gmail.com.
