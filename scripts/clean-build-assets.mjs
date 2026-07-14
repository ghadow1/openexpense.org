import { readdir, rm } from 'node:fs/promises';

const generatedAssetPattern = /^(app|chunk-[A-Z0-9]+)\.js$/;
const entries = await readdir(process.cwd(), { withFileTypes: true });

await Promise.all(entries
    .filter((entry) => entry.isFile() && generatedAssetPattern.test(entry.name))
    .map((entry) => rm(entry.name)));
