import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const generatedAssetPattern = /^(app|chunk-[A-Z0-9]+)\.js$/;

for (const entry of await readdir(root)) {
    if (generatedAssetPattern.test(entry)) {
        await rm(join(root, entry), { force: true });
    }
}
