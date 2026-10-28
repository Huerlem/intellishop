#!/usr/bin/env node
/**
 * Scans an exported app bundle (e.g. `expo export --platform ios --output-dir dist`) for
 * credential patterns. Hermes bytecode keeps string literals readable, so .hbc files are scanned
 * as raw bytes too.
 *
 * Prints file names and pattern names only — never the matched values.
 * The public Firebase web API key for the build (EXPO_PUBLIC_FIREBASE_API_KEY) is expected in the
 * bundle and is ignored when it matches exactly.
 *
 * Usage: node scripts/scan-bundle-for-secrets.mjs <dir>
 * Exit codes: 0 = clean, 1 = findings, 2 = usage / empty bundle.
 */
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) {
  console.error(`Bundle directory not found: ${dir ?? '(none given)'}`);
  process.exit(2);
}

const PATTERNS = [
  ['Google API key', /AIza[0-9A-Za-z_-]{35}/g],
  ['OpenAI-style secret key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/g],
  ['Anthropic secret key', /\bsk-ant-[A-Za-z0-9_-]{20,}/g],
  ['Apify token', /apify_api_[A-Za-z0-9]{20,}/g],
  ['RapidAPI key', /[0-9a-f]{10}msh[0-9a-f]{14,}/g],
  ['RevenueCat secret key', /\bsk_[A-Za-z0-9]{20,}/g],
  ['Private key block', /-----BEGIN [A-Z ]*PRIVATE KEY-----/g],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{30,}/g],
];

const allowedValues = new Set([process.env.EXPO_PUBLIC_FIREBASE_API_KEY].filter(Boolean));

function walk(current) {
  return fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(current, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(dir).filter((file) => /\.(js|hbc|json|map|txt|html)$/i.test(file));
if (files.length === 0) {
  console.error(`No bundle files found in ${dir}`);
  process.exit(2);
}

let findings = 0;
for (const file of files) {
  const content = fs.readFileSync(file).toString('latin1');
  for (const [name, pattern] of PATTERNS) {
    const matches = (content.match(pattern) ?? []).filter((value) => !allowedValues.has(value));
    if (matches.length > 0) {
      findings += matches.length;
      console.error(`FINDING: ${name} ×${matches.length} in ${path.relative(process.cwd(), file)}`);
    }
  }
}

console.log(`Scanned ${files.length} file(s) in ${dir}: ${findings} finding(s).`);
process.exit(findings > 0 ? 1 : 0);
