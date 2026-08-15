import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const removable = /^(app|chunk-[A-Z0-9]+)\.js$/;

for (const entry of await readdir(root)) {
    if (removable.test(entry)) {
        await rm(join(root, entry));
    }
}
