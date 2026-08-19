/**
 * Reproducible GitHub Pages production build.
 *
 * The repository root is the deployment directory, so fixed entry bundles and
 * hashed lazy chunks are written beside index.html. Keeping esbuild options in
 * JavaScript makes the two entry points reviewable and avoids an opaque shell
 * command in package.json.
 */
import { build } from 'esbuild';

await import('./write-sitemap.mjs');
await import('./clean-chunks.mjs');

const sharedOptions = {
    bundle: true,
    format: 'esm',
    minify: true,
    target: 'es2020',
    logLevel: 'info'
};

await build({
    ...sharedOptions,
    entryPoints: ['src/main.js'],
    splitting: true,
    alias: {
        'onnxruntime-web': 'onnxruntime-web/wasm'
    },
    outdir: '.',
    entryNames: 'app',
    chunkNames: 'chunk-[hash]'
});

await build({
    ...sharedOptions,
    entryPoints: ['src/engine/index.js'],
    outfile: 'engine.js'
});
