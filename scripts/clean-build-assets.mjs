import { readdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const files = await readdir(root);
const staleChunks = files.filter((file) => /^chunk-[A-Z0-9]+\.js$/.test(file));

await Promise.all(staleChunks.map((file) => rm(join(root, file), { force: true })));
