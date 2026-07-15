import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const generatedPatterns = [/^app\.js$/, /^chunk-[A-Z0-9]+\.js$/];

for (const entry of await readdir(root)) {
    if (!generatedPatterns.some((pattern) => pattern.test(entry))) continue;
    await rm(join(root, entry), { force: true });
}
