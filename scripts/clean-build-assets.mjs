import { readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const files = await readdir(root);
const generatedAsset = /^(app|chunk-[A-Z0-9]+)\.js$/;

await Promise.all(
    files
        .filter((file) => generatedAsset.test(file))
        .map((file) => rm(join(root, file), { force: true }))
);
