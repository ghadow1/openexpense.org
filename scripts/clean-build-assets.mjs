import { readdir, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const staleAssets = new Set(['app.js']);

for (const entry of await readdir(rootDir)) {
    if (/^chunk-[A-Z0-9]+\.js$/.test(entry)) staleAssets.add(entry);
}

await Promise.all([...staleAssets].map(async (asset) => {
    try {
        await unlink(join(rootDir, asset));
        console.log(`removed ${asset}`);
    } catch (err) {
        if (err?.code !== 'ENOENT') throw err;
    }
}));
