import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url);
const removable = [/^app\.js$/, /^chunk-[A-Z0-9]+\.js$/];

const entries = await readdir(root);
await Promise.all(entries
    .filter(name => removable.some(pattern => pattern.test(name)))
    .map(name => rm(join(root.pathname, name), { force: true })));
