const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const settings = require('../out/settings');
const key = 'sm_' + 'live_' + 'A'.repeat(32);

function harness() {
  let provider;
  let endpoint = settings.DEFAULT_ENDPOINT;
  let answer;
  let prompts = 0;
  const values = new Map();
  const commands = new Map();
  const noop = { dispose() {} };
  class EventEmitter {
    event = () => noop;
    fire() {}
    dispose() {}
  }
  class HttpDefinition {
    constructor(label, uri, headers, version) { Object.assign(this, { label, uri, headers, version }); }
  }
  const vscode = {
    EventEmitter,
    McpHttpServerDefinition: HttpDefinition,
    Uri: { parse: value => ({ toString: () => value }) },
    workspace: {
      getConfiguration: () => ({ get: () => endpoint }),
      onDidChangeConfiguration: () => noop
    },
    window: {
      showInputBox: async options => { assert.equal(options.password, true); prompts++; return answer; },
      showInformationMessage() {},
      showErrorMessage() {}
    },
    commands: { registerCommand: (name, callback) => { commands.set(name, callback); return noop; } },
    env: { openExternal: async () => true },
    lm: { registerMcpServerDefinitionProvider: (_name, value) => { provider = value; return noop; } }
  };
  const context = {
    subscriptions: [],
    secrets: {
      get: async name => values.get(name),
      store: async (name, value) => { values.set(name, value); },
      delete: async name => { values.delete(name); },
      onDidChange: () => noop
    }
  };
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, '../out/extension.js'), 'utf8');
  vm.runInNewContext(source, {
    exports: module.exports, module, URL,
    require: name => name === 'vscode' ? vscode : settings
  });
  module.exports.activate(context);
  return {
    provider, values, commands,
    answer: value => { answer = value; },
    endpoint: value => { endpoint = value; },
    prompts: () => prompts
  };
}

test('endpoint requires HTTPS and rejects credential/query/fragment injection', () => {
  for (const value of ['http://starmani.com/mcp', 'https://user:pass@starmani.com/mcp',
    'https://starmani.com/mcp?token=x', 'https://starmani.com/mcp#x', 'https://starmani.com/other', 'not a url']) {
    assert.throws(() => settings.normalizeEndpoint(value));
  }
  assert.equal(settings.normalizeEndpoint(' https://STARMANI.com:443/mcp '), 'https://starmani.com/mcp');
});

test('key validation rejects malformed credentials', () => {
  assert.equal(settings.keyProblem(key), undefined);
  for (const value of ['true', 'sm_live_', 'Bearer ' + key, key + '\r\nother-header:value']) {
    assert.ok(settings.keyProblem(value));
  }
});

test('discovered server contains no credentials', () => {
  const h = harness();
  const definition = h.provider.provideMcpServerDefinitions()[0];
  assert.equal(Object.keys(definition.headers).length, 0);
  assert.equal(h.prompts(), 0);
});

test('key is stored in SecretStorage and attached only during resolution', async () => {
  const h = harness();
  h.answer(key);
  await h.commands.get('starmani.setApiKey')();
  assert.equal(h.values.get(settings.secretId(settings.DEFAULT_ENDPOINT)), key);
  const discovered = h.provider.provideMcpServerDefinitions()[0];
  assert.equal(Object.keys(discovered.headers).length, 0);
  const resolved = await h.provider.resolveMcpServerDefinition(discovered);
  assert.equal(resolved.headers.Authorization, 'Bearer ' + key);
  assert.equal(h.prompts(), 1);
});

test('cancelled credential prompt does not connect or store a key', async () => {
  const h = harness();
  const resolved = await h.provider.resolveMcpServerDefinition(h.provider.provideMcpServerDefinitions()[0]);
  assert.equal(resolved, undefined);
  assert.equal(h.values.size, 0);
});

test('changing endpoint never forwards the previous endpoint credential', async () => {
  const h = harness();
  h.answer(key);
  await h.commands.get('starmani.setApiKey')();
  const old = h.provider.provideMcpServerDefinitions()[0];
  h.endpoint('https://other.example/mcp');
  h.answer(undefined);
  await assert.rejects(() => h.provider.resolveMcpServerDefinition(old), /endpoint changed/);
  assert.equal(await h.provider.resolveMcpServerDefinition(h.provider.provideMcpServerDefinitions()[0]), undefined);
  assert.equal(h.values.size, 1);
});

test('removing saved credentials requires a new key on subsequent resolution', async () => {
  const h = harness();
  h.answer(key);
  await h.commands.get('starmani.setApiKey')();
  await h.commands.get('starmani.disconnect')();
  assert.equal(h.values.size, 0);
  h.answer(undefined);
  assert.equal(await h.provider.resolveMcpServerDefinition(h.provider.provideMcpServerDefinitions()[0]), undefined);
});
