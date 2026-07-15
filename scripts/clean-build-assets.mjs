import { readdir, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const generatedAssets = [/^app\.js$/, /^chunk-[A-Z0-9]+\.js$/];

for (const entry of await readdir(root)) {
    if (!generatedAssets.some(pattern => pattern.test(entry))) continue;
    await unlink(join(root, entry));
}
