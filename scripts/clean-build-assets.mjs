import { readdir, rm } from 'node:fs/promises';

const projectRoot = new URL('../', import.meta.url);
const generatedAsset = /^(app|chunk-[A-Z0-9]+)\.js$/;

const entries = await readdir(projectRoot);
const assets = entries.filter((name) => generatedAsset.test(name));

await Promise.all(assets.map((name) => rm(new URL(name, projectRoot), { force: true })));

if (assets.length) {
    console.log(`Removed ${assets.length} generated build asset${assets.length === 1 ? '' : 's'}.`);
}
