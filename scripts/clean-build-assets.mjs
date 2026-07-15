import { rm, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const rootPath = fileURLToPath(new URL('..', import.meta.url));
const generatedAsset = /^(app|chunk-[A-Z0-9]+)\.js$/;

const entries = await readdir(rootPath);

await Promise.all(entries
    .filter((entry) => generatedAsset.test(entry))
    .map((entry) => rm(join(rootPath, entry), { force: true })));
