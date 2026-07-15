import { readdir, unlink } from 'node:fs/promises';

const chunkPattern = /^chunk-[A-Z0-9]+\.js$/;
const files = await readdir(process.cwd());

await Promise.all(
    files
        .filter((file) => chunkPattern.test(file))
        .map((file) => unlink(file))
);
