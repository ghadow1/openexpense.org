import { readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const names = await readdir(root);
const generatedAsset = /^(app|chunk-[A-Z0-9]+)\.js$/;

await Promise.all(
    names
        .filter(name => generatedAsset.test(name))
        .map(name => rm(join(root, name), { force: true }))
);
