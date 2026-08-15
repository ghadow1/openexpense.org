import { readdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const entries = await readdir(root);
const generatedAsset = /^(app|chunk-[A-Z0-9]+)\.js$/;

await Promise.all(entries
    .filter((name) => generatedAsset.test(name))
    .map((name) => rm(join(root, name), { force: true })));
