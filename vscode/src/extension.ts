import * as vscode from 'vscode';
import { DEFAULT_ENDPOINT, normalizeEndpoint, secretId, keyProblem } from './settings';

export function activate(context: vscode.ExtensionContext): void {
  const changed = new vscode.EventEmitter<void>();
  context.subscriptions.push(changed);

  const endpoint = (): string => normalizeEndpoint(
    vscode.workspace.getConfiguration('starmani').get<string>('mcpUrl', DEFAULT_ENDPOINT)
  );

  async function connect(url: string): Promise<string | undefined> {
    const value = await vscode.window.showInputBox({
      title: `Connect StarMani to ${new URL(url).host}`,
      prompt: 'Use an API key from your StarMani account. Paid tools spend your StarMani credits.',
      password: true,
      ignoreFocusOut: true,
      validateInput: keyProblem
    });
    if (value === undefined) { return undefined; }
    const key = value.trim();
    const problem = keyProblem(key);
    if (problem) { throw new Error(problem); }
    // Bind credentials to the complete endpoint, never a workspace setting.
    await context.secrets.store(secretId(url), key);
    return key;
  }

  async function report(action: () => Promise<void>): Promise<void> {
    try { await action(); }
    catch (error) {
      // Only local input/configuration errors reach here. Never log keys or headers.
      void vscode.window.showErrorMessage(error instanceof Error ? error.message : 'StarMani setup failed.');
    }
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('starmani.setApiKey', () => report(async () => {
      if (await connect(endpoint())) {
        changed.fire();
        void vscode.window.showInformationMessage('StarMani key saved. Enable StarMani in your agent\'s MCP tools.');
      }
    })),
    vscode.commands.registerCommand('starmani.disconnect', () => report(async () => {
      await context.secrets.delete(secretId(endpoint()));
      changed.fire();
      void vscode.window.showInformationMessage(
        'Saved key removed for this endpoint. Stop the StarMani MCP server to end an active connection. Revoke the key in StarMani to invalidate other copies.'
      );
    })),
    vscode.commands.registerCommand('starmani.openAccount', () =>
      vscode.env.openExternal(vscode.Uri.parse('https://starmani.com/developers/keys'))
    ),
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('starmani.mcpUrl')) { changed.fire(); }
    }),
    context.secrets.onDidChange(() => changed.fire()),
    vscode.lm.registerMcpServerDefinitionProvider('starmani.mcp', {
      onDidChangeMcpServerDefinitions: changed.event,
      provideMcpServerDefinitions: () => {
        try {
          // The discovery definition never contains credentials.
          return [new vscode.McpHttpServerDefinition('StarMani', vscode.Uri.parse(endpoint()), {}, '1')];
        } catch { return []; }
      },
      resolveMcpServerDefinition: async definition => {
        const url = endpoint();
        if (!(definition instanceof vscode.McpHttpServerDefinition) || definition.uri.toString() !== url) {
          throw new Error('StarMani endpoint changed. Refresh the MCP server before connecting.');
        }
        // With a saved key, send it. Otherwise VS Code signs in to StarMani when the server asks.
        const key = await context.secrets.get(secretId(url));
        const headers: Record<string, string> = key ? { Authorization: `Bearer ${key}` } : {};
        return new vscode.McpHttpServerDefinition('StarMani', vscode.Uri.parse(url), headers, '1');
      }
    })
  );
}
