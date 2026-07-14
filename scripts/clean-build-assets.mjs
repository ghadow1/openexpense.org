import { readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const generatedAssetPattern = /^(app|chunk-[A-Z0-9]+)\.js$/;

const entries = await readdir(ROOT);
await Promise.all(entries
    .filter((entry) => generatedAssetPattern.test(entry))
    .map((entry) => rm(join(ROOT, entry), { force: true })));
