import { readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const generatedAssetPattern = /^(app|chunk-[A-Z0-9]+)\.js$/;

for (const file of await readdir(root)) {
    if (!generatedAssetPattern.test(file)) continue;
    await rm(join(root, file), { force: true });
}
