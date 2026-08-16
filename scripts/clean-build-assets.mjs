import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const generatedAsset = /^(app|chunk-[A-Z0-9]+)\.js$/;

for (const file of readdirSync(root)) {
  if (generatedAsset.test(file)) {
    rmSync(join(root, file), { force: true });
  }
}
