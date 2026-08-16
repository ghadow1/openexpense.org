import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const generatedAssetPattern = /^(app|chunk-[A-Za-z0-9_-]+)\.js$/;

const entries = await readdir(root, { withFileTypes: true });

await Promise.all(entries
    .filter(entry => entry.isFile() && generatedAssetPattern.test(entry.name))
    .map(entry => rm(join(root, entry.name))));
