import { readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const generatedAssetPattern = /^(app|chunk-[A-Z0-9]+)\.js$/;

const entries = await readdir(rootDir);

await Promise.all(
    entries
        .filter((entry) => generatedAssetPattern.test(entry))
        .map((entry) => rm(join(rootDir, entry), { force: true }))
);
