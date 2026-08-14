import { readdir, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generatedAsset = /^(app|chunk-[A-Z0-9]+)\.js$/;

for (const entry of await readdir(repoRoot)) {
    if (!generatedAsset.test(entry)) continue;
    await unlink(join(repoRoot, entry));
}
