import { readdir, rm } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const chunkPattern = /^chunk-[A-Za-z0-9]+\.js$/;

const entries = await readdir(root);
await Promise.all(
    entries
        .filter((name) => chunkPattern.test(name))
        .map((name) => rm(new URL(name, root), { force: true }))
);
