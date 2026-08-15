import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const entries = await readdir(root);

await Promise.all(entries
    .filter((entry) => entry === 'app.js' || /^chunk-[A-Z0-9]+\.js$/.test(entry))
    .map((entry) => rm(join(root, entry), { force: true })));
