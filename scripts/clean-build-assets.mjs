import { readdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const buildAssetPattern = /^(app|chunk-[A-Z0-9]+)\.js$/;

const entries = await readdir(root);
await Promise.all(
    entries
        .filter((name) => buildAssetPattern.test(name))
        .map((name) => rm(resolve(root, name), { force: true }))
);
