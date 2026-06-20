import { readdir, rm } from 'node:fs/promises';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url);
const entries = await readdir(root);
const generatedAsset = /^(app\.js|chunk-[A-Z0-9]+\.js)$/;

await Promise.all(
    entries
        .filter((name) => generatedAsset.test(name))
        .map((name) => rm(new URL(name, root), { force: true }))
);

await build({
    entryPoints: ['src/main.js'],
    bundle: true,
    format: 'esm',
    minify: true,
    target: 'es2020',
    splitting: true,
    outdir: '.',
    entryNames: 'app',
    chunkNames: 'chunk-[hash]'
});
