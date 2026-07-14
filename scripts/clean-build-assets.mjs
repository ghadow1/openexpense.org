import { readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const entries = await readdir(root);
const generatedAssets = entries.filter((name) => name === 'app.js' || /^chunk-[A-Z0-9]+\.js$/.test(name));

await Promise.all(generatedAssets.map((name) => rm(join(root, name), { force: true })));
