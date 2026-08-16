import { readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const generatedAssetPattern = /^(app|chunk-[A-Za-z0-9_-]+)\.js$/;

const entries = await readdir(root);

await Promise.all(entries
    .filter((entry) => generatedAssetPattern.test(entry))
    .map((entry) => unlink(join(root, entry))));
