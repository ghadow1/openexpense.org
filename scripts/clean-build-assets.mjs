import { readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const generatedAssetPattern = /^(app|chunk-[A-Z0-9]+)\.js$/;

const entries = await readdir(root);
await Promise.all(entries
    .filter(name => generatedAssetPattern.test(name))
    .map(name => rm(resolve(root, name), { force: true })));
