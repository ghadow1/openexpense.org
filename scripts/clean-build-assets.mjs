import { readdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const buildAssetPattern = /^(app|chunk-[A-Za-z0-9]+)\.js$/;

const entries = await readdir(root);
await Promise.all(
    entries
        .filter((entry) => buildAssetPattern.test(entry))
        .map((entry) => rm(join(root, entry), { force: true }))
);
