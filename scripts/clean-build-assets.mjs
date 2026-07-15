import { readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const files = await readdir(root);

await Promise.all(files
    .filter((file) => file === 'app.js' || /^chunk-[A-Z0-9]+\.js$/.test(file))
    .map((file) => rm(join(root, file), { force: true })));
