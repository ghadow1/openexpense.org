import { readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const removable = [/^app\.js$/, /^chunk-[A-Z0-9]+\.js$/];

for (const entry of await readdir(root)) {
    if (!removable.some(pattern => pattern.test(entry))) continue;
    await rm(join(root, entry), { force: true });
}
