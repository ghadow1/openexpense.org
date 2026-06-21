import { readdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const generatedAssetPattern = /^chunk-[A-Z0-9]+\.js$/;
const entries = await readdir(rootDir);
const generatedAssets = entries.filter((name) => name === 'app.js' || generatedAssetPattern.test(name));

await Promise.all(generatedAssets.map((name) => rm(join(rootDir, name), { force: true })));

if (generatedAssets.length) {
    console.log(`[build] removed ${generatedAssets.length} generated asset(s)`);
}
