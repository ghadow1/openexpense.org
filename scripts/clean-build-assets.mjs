import { readdir, rm } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const generatedAssetPattern = /^(app|chunk-[A-Za-z0-9]+)\.js$/;

const entries = await readdir(projectRoot);
await Promise.all(entries
    .filter((entry) => generatedAssetPattern.test(basename(entry)))
    .map((entry) => rm(join(projectRoot, entry), { force: true })));
