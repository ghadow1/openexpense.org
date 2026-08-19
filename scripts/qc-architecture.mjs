/**
 * Architecture quality controls.
 *
 * These tests treat relative ES-module imports as a graph. They catch common
 * file-structure refactor mistakes before esbuild hides them inside a bundle:
 * unresolved paths, circular imports, and dependencies that point against the
 * documented layer direction.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = resolve(ROOT, 'src');

async function javascriptFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(entries.map((entry) => {
        const path = resolve(directory, entry.name);
        if (entry.isDirectory()) return javascriptFiles(path);
        return entry.isFile() && entry.name.endsWith('.js') ? [path] : [];
    }));
    return nested.flat();
}

function importSpecifiers(source) {
    const specifiers = [];
    const staticImport = /\b(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
    const dynamicImport = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
    for (const pattern of [staticImport, dynamicImport]) {
        for (const match of source.matchAll(pattern)) specifiers.push(match[1]);
    }
    return specifiers;
}

const files = await javascriptFiles(SOURCE_ROOT);
const sourceFiles = new Set(files);
const importsByFile = new Map();

for (const file of files) {
    const source = await readFile(file, 'utf8');
    const relativeImports = importSpecifiers(source).filter((specifier) => specifier.startsWith('.'));
    importsByFile.set(file, relativeImports.map((specifier) => resolve(dirname(file), specifier)));
}

const projectPath = (absolutePath) => relative(ROOT, absolutePath).replaceAll('\\', '/');

test('every relative source import resolves to an authored module', () => {
    for (const [importer, dependencies] of importsByFile) {
        for (const dependency of dependencies) {
            assert.ok(
                sourceFiles.has(dependency),
                `${projectPath(importer)} imports missing ${projectPath(dependency)}`
            );
        }
    }
});

test('the authored ES-module graph is acyclic', () => {
    const visited = new Set();
    const active = new Set();
    const stack = [];

    function visit(file) {
        if (active.has(file)) {
            const cycleStart = stack.indexOf(file);
            const cycle = [...stack.slice(cycleStart), file].map(projectPath).join(' -> ');
            assert.fail(`circular source dependency: ${cycle}`);
        }
        if (visited.has(file)) return;
        active.add(file);
        stack.push(file);
        for (const dependency of importsByFile.get(file) || []) visit(dependency);
        stack.pop();
        active.delete(file);
        visited.add(file);
    }

    for (const file of files) visit(file);
});

test('pure and headless layers do not depend on browser feature layers', () => {
    for (const [importer, dependencies] of importsByFile) {
        const importerPath = projectPath(importer);
        const forbiddenPrefixes = importerPath.startsWith('src/core/')
            ? ['src/app/', 'src/features/', 'src/ui/', 'src/engine/']
            : importerPath.startsWith('src/engine/')
                ? ['src/app/', 'src/features/', 'src/ui/']
                : [];
        for (const dependency of dependencies) {
            const dependencyPath = projectPath(dependency);
            assert.equal(
                forbiddenPrefixes.some((prefix) => dependencyPath.startsWith(prefix)),
                false,
                `${importerPath} must not depend on higher browser layer ${dependencyPath}`
            );
        }
    }
});

test('optional heavy features stay behind explicit lazy boundaries', async () => {
    const [main, ledger, ledgerFile, bundle, legacyZip] = await Promise.all([
        readFile(resolve(SOURCE_ROOT, 'main.js'), 'utf8'),
        readFile(resolve(SOURCE_ROOT, 'features/ledger.js'), 'utf8'),
        readFile(resolve(SOURCE_ROOT, 'core/ledger-file.js'), 'utf8'),
        readFile(resolve(SOURCE_ROOT, 'core/bundle.js'), 'utf8'),
        readFile(resolve(SOURCE_ROOT, 'core/legacy-zip.js'), 'utf8')
    ]);

    assert.doesNotMatch(main, /from ['"]\.\/features\/receipt\.js['"]/);
    assert.match(main, /import\(['"]\.\/features\/receipt\.js['"]\)/);
    assert.doesNotMatch(ledger, /from ['"]\.\.\/core\/bundle\.js['"]/);
    assert.match(ledger, /import\(['"]\.\.\/core\/bundle\.js['"]\)/);
    assert.match(ledger, /import\(['"]\.\.\/core\/legacy-zip\.js['"]\)/);
    assert.match(ledgerFile, /from ['"]\.\/bundle-format\.js['"]/);
    assert.doesNotMatch(bundle, /from ['"]fflate['"]/);
    assert.match(legacyZip, /from ['"]fflate['"]/);
});
