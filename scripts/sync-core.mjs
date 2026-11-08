import { copyFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
export const sharedModules = [
  ['swiss-core.mjs', 'swiss-core.mjs'],
  ['ranking.mjs', 'ranking-core.mjs'],
  ['monthly-titles.mjs', 'monthly-titles.mjs'],
  ['top-cut.mjs', 'top-cut.mjs'],
];

export async function syncCore({ check = false } = {}) {
  const sharedFiles = [
    ...sharedModules.map(([source, destination]) => [
      `lib/${source}`,
      `public/${destination}`,
    ]),
    ['app/entrada.html', 'public/index.html'],
  ];
  for (const [source, destination] of sharedFiles) {
    const from = path.join(root, source);
    const to = path.join(root, destination);
    if (check) {
      if ((await readFile(from, 'utf8')) !== (await readFile(to, 'utf8'))) {
        throw new Error(`Run npm run sync:core: ${destination} is outdated.`);
      }
    } else {
      await copyFile(from, to);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await syncCore({ check: process.argv.includes('--check') });
}
