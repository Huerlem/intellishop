#!/usr/bin/env node
/**
 * Fails if any package in package-lock.json resolves from somewhere other than the official
 * npm registry (https://registry.npmjs.org/). Used by CI and the "Generate lockfile" workflow.
 * Usage: node scripts/check-lockfile-registry.mjs [path/to/package-lock.json]  (default: ./package-lock.json)
 * Exit codes: 0 = all packages from the official registry, 1 = other sources found, 2 = no lockfile.
 */
import fs from 'node:fs';

const OFFICIAL = 'https://registry.npmjs.org/';
const file = process.argv[2] ?? 'package-lock.json';

if (!fs.existsSync(file)) {
  console.error(`${file} not found`);
  process.exit(2);
}

const lock = JSON.parse(fs.readFileSync(file, 'utf8'));
const packages = Object.entries(lock.packages ?? {});
const outside = packages
  .filter(([, pkg]) => pkg.resolved && !pkg.resolved.startsWith(OFFICIAL))
  .map(([name, pkg]) => `${name || '(root)'} -> ${pkg.resolved}`);

console.log(`${file}: lockfileVersion ${lock.lockfileVersion}; ${packages.length} entries; ${outside.length} outside ${OFFICIAL}`);
if (outside.length > 0) {
  console.error(outside.join('\n'));
  process.exit(1);
}
