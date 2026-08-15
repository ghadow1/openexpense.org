import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const entries = await readdir(root);
const chunks = entries.filter((name) => /^chunk-.+\.js$/.test(name)).sort();
const bundles = ['app.js', ...chunks];
const referencedChunks = new Set();
const missingChunks = new Set();

for (const bundle of bundles) {
    let source;
    try {
        source = await readFile(join(root, bundle), 'utf8');
    } catch (err) {
        if (bundle === 'app.js') throw new Error('app.js is missing; run npm run build.');
        throw err;
    }

    for (const match of source.matchAll(/["'](?:\.\/)?(chunk-[^"']+\.js)["']/g)) {
        const chunk = match[1];
        referencedChunks.add(chunk);
        if (!chunks.includes(chunk)) missingChunks.add(chunk);
    }
}

const orphanChunks = chunks.filter((chunk) => !referencedChunks.has(chunk));

if (missingChunks.size || orphanChunks.length) {
    if (missingChunks.size) {
        console.error(`Missing referenced chunks: ${[...missingChunks].join(', ')}`);
    }
    if (orphanChunks.length) {
        console.error(`Orphan chunks: ${orphanChunks.join(', ')}`);
    }
    process.exit(1);
}

console.log(`Bundle check passed (${chunks.length} chunk${chunks.length === 1 ? '' : 's'}).`);
