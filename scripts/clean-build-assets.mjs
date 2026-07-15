import { readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const entries = await readdir(root);
const buildAssetPattern = /^(app|chunk-[A-Z0-9]+)\.js$/;

await Promise.all(
    entries
        .filter((name) => buildAssetPattern.test(name))
        .map((name) => rm(join(root, name), { force: true }))
);
