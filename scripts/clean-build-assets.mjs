import { readdir, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const GENERATED_ASSET = /^(app|chunk-[A-Z0-9]+)\.js$/;

for (const name of await readdir(ROOT)) {
    if (!GENERATED_ASSET.test(name)) continue;
    await unlink(join(ROOT, name));
    console.log(`removed ${name}`);
}
