import { readdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GENERATED_ASSET_RE = /^(app|chunk-[A-Z0-9]+)\.js$/;

const entries = await readdir(ROOT);
await Promise.all(entries
    .filter(name => GENERATED_ASSET_RE.test(name))
    .map(name => rm(resolve(ROOT, name))));
