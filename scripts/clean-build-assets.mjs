import { readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const generatedAssetPattern = /^(app|chunk-[A-Z0-9]+)\.js$/;

for (const entry of await readdir(rootDir)) {
    if (!generatedAssetPattern.test(entry)) continue;
    await rm(join(rootDir, entry), { force: true });
}
