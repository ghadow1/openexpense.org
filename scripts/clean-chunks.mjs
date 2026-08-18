// Drop the previous build's code-split chunks.
//
// esbuild writes chunk-[hash].js next to app.js and never removes the chunks a
// prior build produced. Because the hash changes whenever the code does, every
// build used to leave its predecessors behind: the repo had grown to 19 chunks
// of which only 6 were still reachable from app.js. Clearing them first means
// the tree only ever holds the chunks the current bundle actually loads.
//
// Only the hashed chunks are touched. app.js and engine.js keep fixed names and
// are overwritten by the build, and index.html references app.js directly.

import { readdir, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHUNK = /^chunk-[A-Z0-9]+\.js$/;

const names = (await readdir(ROOT)).filter((name) => CHUNK.test(name));
await Promise.all(names.map((name) => unlink(join(ROOT, name))));

if (names.length) console.log(`cleaned ${names.length} stale chunk${names.length === 1 ? '' : 's'}`);
