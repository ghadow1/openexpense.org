import { readdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GENERATED_ASSET = /^(app|chunk-[A-Z0-9]+)\.js$/;

for (const entry of await readdir(ROOT)) {
    if (!GENERATED_ASSET.test(entry)) continue;
    await rm(resolve(ROOT, entry), { force: true });
}
