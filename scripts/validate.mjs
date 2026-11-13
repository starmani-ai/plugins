import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const release = read('release.json');
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

for (const [file, schema] of [['openai/plugin.json', 'plugin'], ['openai/mcp.json', 'mcp']]) {
  const validate = ajv.compile(read(`schemas/${schema}.schema.json`));
  assert.ok(validate(read(file)), `${file}: ${JSON.stringify(validate.errors)}`);
}

for (const file of ['package.json', 'vscode/package.json', 'openai/plugin.json', 'server.json',
  'claude/api-key/.claude-plugin/plugin.json', 'claude/directory/.claude-plugin/plugin.json']) {
  assert.equal(read(file).version, release.version, `Version mismatch: ${file}`);
}

for (const file of ['openai/mcp.json', 'claude/api-key/.mcp.json', 'claude/directory/.mcp.json']) {
  const servers = read(file).mcpServers;
  assert.deepEqual(Object.keys(servers), ['starmani']);
  assert.equal(servers.starmani.url, release.mcpUrl, `Endpoint mismatch: ${file}`);
}
assert.equal(read('vscode/package.json').contributes.configuration.properties['starmani.mcpUrl'].default, release.mcpUrl);
assert.equal(read('examples/vscode-mcp.json').servers.starmani.url, release.mcpUrl);
assert.ok(fs.readFileSync(path.join(root, 'examples/codex-config.toml'), 'utf8').includes(`url = "${release.mcpUrl}"`));
assert.ok(fs.readFileSync(path.join(root, 'vscode/src/settings.ts'), 'utf8').includes(`'${release.mcpUrl}'`));
const endpoint = new URL(release.mcpUrl);
assert.equal(endpoint.protocol, 'https:');
assert.equal(endpoint.pathname, '/mcp');
assert.ok(!endpoint.username && !endpoint.password && !endpoint.search && !endpoint.hash);
assert.equal(read('claude/api-key/.mcp.json').mcpServers.starmani.headers.Authorization, 'Bearer ${user_config.api_key}');
const keyOption = read('claude/api-key/.claude-plugin/plugin.json').userConfig?.api_key;
assert.ok(keyOption && keyOption.sensitive === true && keyOption.required === true, 'Claude plugin must ask for a sensitive key');
const registry = read('server.json');
assert.equal(registry.name, release.registryName);
assert.equal(registry.version, release.version);
assert.ok(registry.description.length <= 100, 'Registry description over 100 characters');
assert.deepEqual(registry.remotes.map(remote => remote.url), [release.mcpUrl]);
assert.ok(registry.remotes[0].headers.every(header => header.isSecret && !/sm_live_/.test(header.value || '')));
assert.ok(!read('claude/directory/.mcp.json').mcpServers.starmani.headers);
assert.ok(!read('openai/mcp.json').mcpServers.starmani.headers);

for (const plugin of read('.claude-plugin/marketplace.json').plugins) {
  const location = path.resolve(root, plugin.source);
  assert.ok(location.startsWith(root), 'Marketplace path escapes repository');
  assert.equal(JSON.parse(fs.readFileSync(path.join(location, '.claude-plugin/plugin.json'), 'utf8')).name, plugin.name);
}
for (const file of ['assets/icon.png', 'openai/assets/icon.png', 'vscode/assets/icon.png', 'claude/api-key/icon.png', 'claude/directory/icon.png']) {
  assert.equal(fs.readFileSync(path.join(root, file)).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
}


// Check the authored tree, not generated archives/dependencies or Git internals.
// No credential value is included in any diagnostic.
function inspect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', 'out'].includes(entry.name)) { continue; }
    const location = path.join(directory, entry.name);
    const relative = path.relative(root, location);
    if (entry.isSymbolicLink()) { throw new Error(`Symlink not allowed in packages: ${relative}`); }
    if (entry.isDirectory()) { inspect(location); continue; }
    assert.ok(!/^\.env(?:\.|$)/.test(entry.name) && !/\.(pem|pfx|key)$/i.test(entry.name), `Private file: ${relative}`);
    if (/\.(png|jpg|ico)$/i.test(entry.name)) { continue; }
    const text = fs.readFileSync(location, 'utf8');
    if (entry.name.endsWith('.json')) { JSON.parse(text); }
    const suspicious = /sm_live_[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/;
    assert.ok(!suspicious.test(text), `Possible embedded credential: ${relative}`);
  }
}
inspect(root);
console.log('Validated schemas, versions, address, registry entry, Claude paths, icons and files.');
