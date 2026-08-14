import { readdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generatedAssetPattern = /^(app|chunk-[A-Z0-9]+)\.js$/;

for (const entry of await readdir(root)) {
    if (generatedAssetPattern.test(entry)) {
        await rm(resolve(root, entry), { force: true });
    }
}
