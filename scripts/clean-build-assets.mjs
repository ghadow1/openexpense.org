import { readdir, unlink } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const generatedAsset = /^(app|chunk-[a-z0-9]+)\.js$/i;

for (const entry of await readdir(root)) {
    if (!generatedAsset.test(entry)) continue;
    await unlink(new URL(entry, root));
}
