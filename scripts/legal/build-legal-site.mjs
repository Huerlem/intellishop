#!/usr/bin/env node
/**
 * Builds IntelliShop's static legal website and the in-app legal bundle from docs/legal/*.md.
 *
 *   node scripts/legal/build-legal-site.mjs                 # draft site → legal-site/dist (DRAFT banner, noindex)
 *   node scripts/legal/build-legal-site.mjs --release       # fails if any document still has owner/pending markers
 *   node scripts/legal/build-legal-site.mjs --emit-app      # regenerate src/legal/documents.generated.ts
 *   node scripts/legal/build-legal-site.mjs --check-app     # CI: fail if the generated app bundle is stale
 *   node scripts/legal/build-legal-site.mjs --report        # list publication blockers per document
 *
 * No dependencies; uses Node's built-in TypeScript type stripping (Node >= 22.18) to load
 * shared/legal/markdownLite.ts. Nothing is deployed: hosting is an owner-approved step.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  escapeHtml,
  findPublicationBlockers,
  parseDocument,
  renderBlocksHtml,
} from '../../shared/legal/markdownLite.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sourceDir = join(root, 'docs', 'legal');
const outDir = join(root, 'legal-site', 'dist');
const appModule = join(root, 'src', 'legal', 'documents.generated.ts');
const args = new Set(process.argv.slice(2));
const release = args.has('--release');

/** Public documents in navigation order. `file` → URL path is fixed by the approved architecture. */
export const DOCUMENTS = [
  { file: 'PRIVACY_POLICY.md', path: 'privacy' },
  { file: 'TERMS_AND_CONDITIONS.md', path: 'terms' },
  { file: 'AI_TRANSPARENCY.md', path: 'ai' },
  { file: 'FOOD_SAFETY_AND_ALLERGENS.md', path: 'food-safety' },
  { file: 'SUBSCRIPTION_TERMS.md', path: 'subscriptions' },
  { file: 'PRICING_DATA_DISCLAIMER.md', path: 'pricing-data' },
  { file: 'ACCOUNT_DELETION_POLICY.md', path: 'account-deletion' },
  { file: 'ACCEPTABLE_USE.md', path: 'acceptable-use' },
  { file: 'SUPPORT_AND_COMPLAINTS.md', path: 'support' },
  { file: 'CHANGELOG.md', path: 'legal/changes' },
];

function load() {
  const present = new Set(readdirSync(sourceDir));
  return DOCUMENTS.map((doc) => {
    if (!present.has(doc.file)) throw new Error(`Missing legal document: docs/legal/${doc.file}`);
    const source = readFileSync(join(sourceDir, doc.file), 'utf8');
    const parsed = parseDocument(source);
    const fm = parsed.frontMatter;
    for (const key of ['title', 'version', 'status', 'effective', 'last_updated']) {
      if (!fm[key]) throw new Error(`docs/legal/${doc.file}: front matter "${key}" is required`);
    }
    return { ...doc, source, ...parsed, blockers: findPublicationBlockers(source) };
  });
}

const CSS = `
:root{--primary:#4338CA;--primary-pressed:#3730A3;--text:#0F172A;--text-2:#475569;--muted:#64748B;--canvas:#F8FAFC;--card:#FFFFFF;--border:#CBD5E1;--warn:#B45309;--warn-bg:#FFFBEB;--info-bg:#EFF6FF}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--canvas);color:var(--text);font:400 1rem/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
a{color:var(--primary);text-underline-offset:2px}
a:hover{color:var(--primary-pressed)}
:focus-visible{outline:2px solid var(--primary);outline-offset:2px}
.skip{position:absolute;left:-999px;top:0;background:var(--card);padding:8px 12px}
.skip:focus{left:8px;top:8px;z-index:10}
header,main,footer{max-width:46rem;margin:0 auto;padding:0 16px}
header{padding-top:24px}
header nav ul{list-style:none;display:flex;flex-wrap:wrap;gap:8px 16px;padding:0;margin:12px 0 0;font-size:.9375rem}
header nav a[aria-current="page"]{font-weight:600;text-decoration:none;color:var(--text)}
.brand{font-weight:700;font-size:1.25rem;color:var(--text);text-decoration:none}
main{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px 20px;margin-top:16px}
h1{font-size:1.75rem;line-height:1.2;margin:0 0 8px}
h2{font-size:1.375rem;line-height:1.25;margin:32px 0 8px}
h3{font-size:1.125rem;margin:24px 0 8px}
.meta{color:var(--text-2);font-size:.875rem;margin:0 0 16px}
.draft{background:var(--warn-bg);border:2px solid var(--warn);border-radius:8px;padding:12px 16px;margin:16px auto 0;max-width:46rem;font-weight:600}
.notice{background:var(--info-bg);border-left:4px solid var(--primary);padding:8px 16px;margin:16px 0;border-radius:4px}
.table-wrap{overflow-x:auto;margin:16px 0}
table{border-collapse:collapse;width:100%;font-size:.9375rem}
th,td{border:1px solid var(--border);padding:8px;text-align:left;vertical-align:top}
th{background:var(--canvas)}
code{font-size:.875em;background:var(--canvas);padding:0 4px;border-radius:4px}
footer{color:var(--muted);font-size:.875rem;padding:24px 16px 48px}
@media (prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
`;

function page({ title, bodyHtml, current, docs, meta }) {
  const nav = docs
    .map((d) => `<li><a href="/${d.path}/"${d.path === current ? ' aria-current="page"' : ''}>${escapeHtml(d.frontMatter.title)}</a></li>`)
    .join('');
  const draftBanner = release
    ? ''
    : '<p class="draft" role="note">DRAFT — not published. For owner review only. Not reviewed by a lawyer.</p>';
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — IntelliShop</title>
${release ? '' : '<meta name="robots" content="noindex, nofollow">'}
<meta name="referrer" content="no-referrer">
<style>${CSS}</style>
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<header><a class="brand" href="/">IntelliShop</a><nav aria-label="Legal documents"><ul>${nav}</ul></nav></header>
${draftBanner}
<main id="content">
${meta ? `<p class="meta">${meta}</p>` : ''}
${bodyHtml}
</main>
<footer>IntelliShop · This site sets no cookies and uses no analytics or third-party scripts.</footer>
</body>
</html>
`;
}

function buildSite(docs) {
  if (existsSync(outDir)) rmSync(outDir, { recursive: true });
  for (const doc of docs) {
    const fm = doc.frontMatter;
    const meta = `Version ${escapeHtml(fm.version)} · Effective ${escapeHtml(fm.effective)} · Last updated ${escapeHtml(fm.last_updated)}`;
    const html = page({ title: fm.title, bodyHtml: renderBlocksHtml(doc.blocks), current: doc.path, docs, meta });
    const dir = join(outDir, doc.path);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), html);
    if (release) {
      const archive = join(outDir, 'legal', 'archive', doc.path.replace(/\//g, '-'), fm.version);
      mkdirSync(archive, { recursive: true });
      writeFileSync(join(archive, 'index.html'), html);
    }
  }
  const index = `<h1>IntelliShop legal information</h1><ul>${docs
    .map((d) => `<li><a href="/${d.path}/">${escapeHtml(d.frontMatter.title)}</a> — version ${escapeHtml(d.frontMatter.version)}</li>`)
    .join('')}</ul>`;
  writeFileSync(join(outDir, 'index.html'), page({ title: 'Legal information', bodyHtml: index, current: '', docs }));
  writeFileSync(join(outDir, '404.html'), page({ title: 'Page not found', bodyHtml: '<h1>Page not found</h1><p><a href="/">Legal information</a></p>', current: '', docs }));
  console.log(`Built ${docs.length} documents → ${outDir}${release ? ' (release)' : ' (draft)'}`);
}

function appModuleSource(docs) {
  const entries = docs.map((d) => ({
    slug: d.path,
    title: d.frontMatter.title,
    version: d.frontMatter.version,
    status: d.frontMatter.status,
    effective: d.frontMatter.effective,
    lastUpdated: d.frontMatter.last_updated,
    markdown: d.source,
  }));
  return `/* eslint-disable */
// GENERATED by scripts/legal/build-legal-site.mjs --emit-app. Do not edit by hand:
// edit docs/legal/*.md and regenerate. CI fails if this file is stale (--check-app).
import type { LegalDocument } from './types';

export const LEGAL_DOCUMENTS: readonly LegalDocument[] = ${JSON.stringify(entries, null, 2)};
`;
}

const docs = load();

if (args.has('--report') || release) {
  let total = 0;
  for (const doc of docs) {
    total += doc.blockers.length;
    console.log(`${doc.file.padEnd(30)} v${doc.frontMatter.version.padEnd(12)} blockers: ${doc.blockers.length}`);
  }
  if (release && (total > 0 || docs.some((d) => /draft/i.test(d.frontMatter.status) || /-draft$/.test(d.frontMatter.version)))) {
    console.error(`\nRELEASE BLOCKED: ${total} owner/pending/legal-review markers and/or draft statuses remain. Nothing was built.`);
    process.exit(1);
  }
}

if (args.has('--emit-app') || args.has('--check-app')) {
  const next = appModuleSource(docs);
  if (args.has('--check-app')) {
    const current = existsSync(appModule) ? readFileSync(appModule, 'utf8') : '';
    if (current !== next) {
      console.error('src/legal/documents.generated.ts is stale. Run: node scripts/legal/build-legal-site.mjs --emit-app');
      process.exit(1);
    }
    console.log('In-app legal bundle is up to date.');
  } else {
    mkdirSync(dirname(appModule), { recursive: true });
    writeFileSync(appModule, next);
    console.log(`Wrote ${appModule}`);
  }
}

if (!args.has('--report') && !args.has('--emit-app') && !args.has('--check-app')) buildSite(docs);
