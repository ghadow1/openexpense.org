import { readdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generatedChunkPattern = /^chunk-[A-Z0-9]+\.js$/;

const entries = await readdir(rootDir, { withFileTypes: true });

await Promise.all(entries
    .filter((entry) => entry.isFile() && generatedChunkPattern.test(entry.name))
    .map((entry) => rm(resolve(rootDir, entry.name))));
