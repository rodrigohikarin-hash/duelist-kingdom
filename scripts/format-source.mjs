import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as prettier from 'prettier';
import { sharedModules, syncCore } from './sync-core.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const write = process.argv.includes('--write');
const options = await prettier.resolveConfig(path.join(root, 'package.json'));
const ignored = new Set([
  'public/qrcode-lib.mjs',
  'public/index.html', // Generated from app/entrada.html.
  ...sharedModules.map(([, file]) => `public/${file}`),
]);
const extensions = new Set(['.js', '.jsx', '.mjs', '.css', '.html']);

async function filesIn(directory) {
  const result = [];
  for (const entry of await readdir(path.join(root, directory), {
    withFileTypes: true,
  })) {
    const file = `${directory}/${entry.name}`;
    if (ignored.has(file)) continue;
    if (entry.isDirectory()) {
      if (['chibi', 'worlds'].includes(entry.name)) continue;
      result.push(...(await filesIn(file)));
    } else if (extensions.has(path.extname(entry.name))) {
      result.push(file);
    }
  }
  return result;
}

const files = (await Promise.all(['app', 'lib', 'public', 'tests'].map(filesIn))).flat();
files.push('scripts/format-source.mjs', 'scripts/sync-core.mjs');
const unformatted = [];
for (const file of files) {
  const filename = path.join(root, file);
  const source = await readFile(filename, 'utf8');
  if (write) {
    await writeFile(
      filename,
      await prettier.format(source, { ...options, filepath: filename }),
    );
  } else if (!(await prettier.check(source, { ...options, filepath: filename }))) {
    unformatted.push(file);
  }
}
await syncCore({ check: !write });
if (unformatted.length) {
  throw new Error(`Run npm run format:\n${unformatted.join('\n')}`);
}
console.log(`${files.length} source files ${write ? 'formatted' : 'checked'}.`);
