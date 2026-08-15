import { readdir, rm } from 'node:fs/promises';

for (const entry of await readdir(process.cwd())) {
    if (entry === 'app.js' || /^chunk-[A-Za-z0-9]+\.js$/.test(entry)) {
        await rm(entry, { force: true });
    }
}
