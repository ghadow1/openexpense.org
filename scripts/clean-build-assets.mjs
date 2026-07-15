import { readdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const generatedAsset = /^(app|chunk-[a-z0-9]+)\.js$/i;

const entries = await readdir(root);

await Promise.all(entries
    .filter(name => generatedAsset.test(name))
    .map(name => rm(join(root, name), { force: true }))
);
