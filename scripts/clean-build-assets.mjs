import { readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const generatedAsset = /^(app|chunk-[A-Z0-9]+)\.js$/;

for (const file of await readdir(repoRoot)) {
    if (!generatedAsset.test(file)) continue;
    await rm(join(repoRoot, file), { force: true });
}
