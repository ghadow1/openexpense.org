import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const rootDir = new URL('..', import.meta.url);
const rootPath = rootDir.pathname;
const generatedAssetPattern = /^(app|chunk-[A-Z0-9]+)\.js$/;

for (const entry of await readdir(rootPath)) {
    if (!generatedAssetPattern.test(entry)) continue;
    await rm(join(rootPath, entry), { force: true });
}
