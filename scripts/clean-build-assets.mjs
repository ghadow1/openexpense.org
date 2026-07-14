import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const generatedAsset = /^(app|chunk-[A-Z0-9]+)\.js$/;

for (const name of await readdir(root)) {
    if (!generatedAsset.test(name)) continue;
    await rm(join(root, name), { force: true });
}
