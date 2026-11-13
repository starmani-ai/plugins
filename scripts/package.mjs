import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const root = fileURLToPath(new URL('../', import.meta.url));
const { version } = JSON.parse(await fs.readFile(path.join(root, 'release.json'), 'utf8'));
const dist = path.join(root, 'dist');
await fs.mkdir(dist, { recursive: true });

async function addDirectory(zip, directory, prefix = '') {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const location = path.join(directory, entry.name);
    const relative = prefix + entry.name;
    if (entry.isSymbolicLink()) { throw new Error('Package contains a symlink'); }
    if (entry.isDirectory()) { await addDirectory(zip, location, relative + '/'); }
    else { zip.file(relative, await fs.readFile(location), { date: new Date('2026-11-05T00:00:00Z') }); }
  }
}

for (const [directory, output] of [
  ['openai', `starmani-openai-${version}-draft.zip`],
  ['claude/api-key', `starmani-claude-api-key-${version}.zip`],
  ['claude/directory', `starmani-claude-directory-${version}-draft.zip`]
]) {
  const zip = new JSZip();
  await addDirectory(zip, path.join(root, directory));
  for (const name of ['LICENSE', 'NOTICE.md']) {
    zip.file(name, await fs.readFile(path.join(root, name)), { date: new Date('2026-11-05T00:00:00Z') });
  }
  await fs.writeFile(path.join(dist, output), await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  console.log(`Prepared dist/${output}`);
}
console.log('Directory archives are drafts. Run npm run release:check before preparing a store submission.');
