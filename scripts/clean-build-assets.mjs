import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.cwd();
const generatedAsset = /^(app|chunk-[A-Z0-9]+)\.js$/;

for (const entry of await readdir(ROOT)) {
    if (!generatedAsset.test(entry)) continue;
    await rm(join(ROOT, entry), { force: true });
}
