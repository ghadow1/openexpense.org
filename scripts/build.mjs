import { readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { build } from 'esbuild';

const workspaceRoot = fileURLToPath(new URL('..', import.meta.url));

async function cleanGeneratedBundles() {
    const entries = await readdir(workspaceRoot);
    await Promise.all(entries
        .filter((name) => name === 'app.js' || /^chunk-[A-Z0-9]+\.js$/.test(name))
        .map((name) => rm(join(workspaceRoot, name), { force: true })));
}

await cleanGeneratedBundles();

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
