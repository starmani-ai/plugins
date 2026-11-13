import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory = new URL('../dist/', import.meta.url);
const checksums = {};
for (const name of (await fs.readdir(directory)).sort()) {
  if (!/\.(zip|vsix)$/.test(name)) { continue; }
  checksums[name] = createHash('sha256').update(await fs.readFile(new URL(name, directory))).digest('hex');
}
await fs.writeFile(new URL('checksums.json', directory), JSON.stringify(checksums, null, 2) + '\n');
console.log('Wrote dist/checksums.json');
