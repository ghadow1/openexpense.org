import { readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const removable = [/^app\.js$/, /^chunk-[A-Z0-9]+\.js$/];

for (const entry of await readdir(root)) {
    if (!removable.some((pattern) => pattern.test(entry))) continue;
    await rm(resolve(root, entry), { force: true });
}
