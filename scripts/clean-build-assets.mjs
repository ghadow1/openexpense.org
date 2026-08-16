import { readdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootPath = dirname(dirname(fileURLToPath(import.meta.url)));
const generatedAssetPattern = /^(app\.js|chunk-[A-Za-z0-9_-]+\.js)$/;

for (const entry of await readdir(rootPath)) {
    if (!generatedAssetPattern.test(entry)) continue;
    await rm(join(rootPath, entry), { force: true });
}
