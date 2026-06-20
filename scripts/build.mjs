import { readdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = new URL('..', import.meta.url);

for (const entry of readdirSync(root)) {
    if (entry === 'app.js' || /^chunk-[A-Z0-9]+\.js$/.test(entry)) {
        rmSync(join(root.pathname, entry), { force: true });
    }
}

execFileSync('npx', [
    'esbuild',
    'src/main.js',
    '--bundle',
    '--format=esm',
    '--minify',
    '--target=es2020',
    '--splitting',
    '--outdir=.',
    '--entry-names=app',
    '--chunk-names=chunk-[hash]'
], { cwd: root, stdio: 'inherit' });
