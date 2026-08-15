import { readdir, rm } from 'node:fs/promises';

const rootUrl = new URL('../', import.meta.url);
const generatedAsset = /^(app|chunk-[A-Z0-9]+)\.js$/;

const entries = await readdir(rootUrl);
await Promise.all(
    entries
        .filter((name) => generatedAsset.test(name))
        .map((name) => rm(new URL(name, rootUrl), { force: true }))
);
