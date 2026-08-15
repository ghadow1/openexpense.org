import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const generatedAsset = /^(app|chunk-.+)\.js$/;

const entries = await readdir(root);
await Promise.all(entries
    .filter((name) => generatedAsset.test(name))
    .map((name) => rm(join(root, name), { force: true })));
