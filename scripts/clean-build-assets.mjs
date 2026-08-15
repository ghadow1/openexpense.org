import { readdir, rm } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const generatedAsset = /^(app|chunk-[A-Z0-9]+)\.js$/;

for (const entry of await readdir(root)) {
    if (!generatedAsset.test(entry)) continue;
    await rm(new URL(entry, root));
}
