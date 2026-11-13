import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import JSZip from 'jszip';

const dist = new URL('../dist/', import.meta.url);
const version = JSON.parse(await fs.readFile(new URL('../release.json', import.meta.url), 'utf8')).version;
const expected = [`starmani-openai-${version}.zip`, `starmani-claude-api-key-${version}.zip`,
  `starmani-claude-directory-${version}.zip`, `starmani-${version}.vsix`];
for (const name of expected) {
  const zip = await JSZip.loadAsync(await fs.readFile(new URL(name, dist)));
  const files = Object.values(zip.files);
  for (const file of files) {
    const original = file.unsafeOriginalName ?? file.name;
    assert.ok(!original.split(/[\\/]/).some(part => ['..', '.git', 'node_modules', '.env'].includes(part)), `Unexpected archive path in ${name}`);
    assert.ok(!/^(?:[\\/]|[a-z]:)/i.test(original), `Absolute archive path in ${name}`);
  }
  if (name.endsWith('.vsix')) {
    const allowed = /^(?:\[Content_Types\]\.xml|extension\.vsixmanifest|extension\/(?:package\.json|readme\.md|changelog\.md|LICENSE\.txt|assets\/icon\.png|out\/(?:extension|settings)\.js))$/;
    for (const file of files.filter(item => !item.dir)) {
      assert.ok(allowed.test(file.name), `Unexpected extension payload: ${file.name}`);
    }
    assert.ok(zip.file('extension/out/extension.js'));
    assert.ok(zip.file('extension/assets/icon.png'));
  } else if (name.includes('openai')) {
    assert.ok(zip.file('plugin.json') && zip.file('mcp.json'));
  } else {
    assert.ok(zip.file('.claude-plugin/plugin.json') && zip.file('.mcp.json'));
  }
  console.log(`Verified archive contents: ${name}`);
}
