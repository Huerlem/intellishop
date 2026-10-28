// Usage: node scripts/audit/offline-npm-audit.cjs <package-lock.json> <advisory-database/advisories/github-reviewed> [prod|all]
// For environments without registry access. CI uses the real `npm audit`.
// Offline approximation of `npm audit --omit=dev` using the GitHub Advisory Database (OSV JSON).
const fs = require('fs'), path = require('path');
const semver = require('semver');
const [lockPath, dbRoot, mode = 'prod'] = process.argv.slice(2);
const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
const pkgs = new Map(); // name -> Map(version -> [paths])
for (const [k, v] of Object.entries(lock.packages)) {
  if (!k) continue;
  if (mode === 'prod' && v.dev) continue;
  const name = v.name || k.split('node_modules/').pop();
  if (!pkgs.has(name)) pkgs.set(name, new Map());
  const m = pkgs.get(name); m.set(v.version, [...(m.get(v.version) || []), k]);
}
function walk(d, out) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p, out) : p.endsWith('.json') && out.push(p); } return out; }
const files = walk(dbRoot, []);
const hits = [];
const cmp = (a, b) => semver.compare(semver.coerce(a) && semver.valid(a) ? a : semver.coerce(a).version, semver.valid(b) ? b : semver.coerce(b).version);
for (const f of files) {
  const a = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (a.withdrawn) continue;
  for (const af of a.affected || []) {
    if (af.package?.ecosystem !== 'npm' || !pkgs.has(af.package.name)) continue;
    for (const [ver, where] of pkgs.get(af.package.name)) {
      if (!semver.valid(ver)) continue;
      let affected = (af.versions || []).includes(ver);
      let fixed = null;
      for (const r of af.ranges || []) {
        if (r.type !== 'ECOSYSTEM' && r.type !== 'SEMVER') continue;
        let intro = null;
        for (const ev of r.events) {
          if (ev.introduced !== undefined) intro = ev.introduced === '0' ? '0.0.0' : ev.introduced;
          else if (intro !== null && (ev.fixed !== undefined || ev.last_affected !== undefined)) {
            const upper = ev.fixed ?? ev.last_affected;
            const geIntro = cmp(ver, intro) >= 0;
            const below = ev.fixed !== undefined ? cmp(ver, upper) < 0 : cmp(ver, upper) <= 0;
            if (geIntro && below) { affected = true; fixed = ev.fixed ?? null; }
            intro = null;
          }
        }
        if (intro !== null && cmp(ver, intro) >= 0) affected = true; // open-ended
      }
      if (affected) hits.push({ sev: a.database_specific?.severity || '?', id: a.id, cve: (a.aliases || []).join(','), name: af.package.name, ver, fixed, summary: a.summary, where });
    }
  }
}
const order = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3, '?': 4 };
hits.sort((x, y) => order[x.sev] - order[y.sev] || x.name.localeCompare(y.name));
for (const h of hits) console.log(`${h.sev.padEnd(9)} ${h.name}@${h.ver} fixed:${h.fixed ?? 'none'} ${h.id} ${h.cve} — ${h.summary}\n          at ${h.where.slice(0, 3).join(' | ')}`);
console.log(`\n${hits.length} findings; ${hits.filter((h) => h.sev === 'HIGH' || h.sev === 'CRITICAL').length} high/critical`);
