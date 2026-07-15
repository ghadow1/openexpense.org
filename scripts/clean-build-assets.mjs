import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const generatedChunkPattern = /^chunk-[A-Z0-9]+\.js$/;

const entries = await readdir(rootDir);
await Promise.all(entries
    .filter(name => generatedChunkPattern.test(name))
    .map(name => rm(join(rootDir, name), { force: true })));
