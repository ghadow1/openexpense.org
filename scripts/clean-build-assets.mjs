import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Keep GitHub Pages deploy assets from accumulating stale hashed chunks.
const rootDir = join(fileURLToPath(new URL('..', import.meta.url)));
const generatedAssetPattern = /^(app|chunk-[A-Z0-9]+)\.js$/;

const entries = await readdir(rootDir);

await Promise.all(entries
    .filter(name => generatedAssetPattern.test(name))
    .map(name => rm(join(rootDir, name), { force: true })));

