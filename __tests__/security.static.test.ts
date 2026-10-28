/**
 * Static security and data-integrity checks over the app source (M1 baseline).
 * These complement ESLint `no-restricted-imports` and the gitleaks CI job.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');
const APP_SOURCE_DIRS = ['app', 'src', 'components', 'context', 'hooks', 'firebase', 'errors', 'utils', 'constants'];
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

function listFiles(dir: string): string[] {
  const absolute = path.join(ROOT, dir);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(relative);
    return SOURCE_EXTENSIONS.has(path.extname(entry.name)) ? [relative] : [];
  });
}

const appFiles = APP_SOURCE_DIRS.flatMap(listFiles);
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

// Public, non-secret build-time variables allowed in the app (see .env.example).
const ALLOWED_PUBLIC_VARIABLES = new Set([
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
  'EXPO_PUBLIC_REVENUECAT_IOS_KEY',
  'EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN',
]);

const SECRET_PATTERNS: [string, RegExp][] = [
  ['Google API key', /AIza[0-9A-Za-z_-]{35}/],
  ['OpenAI-style key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/],
  ['Anthropic key', /\bsk-ant-[A-Za-z0-9_-]{20,}/],
  ['Apify token', /apify_api_[A-Za-z0-9]{20,}/],
  ['RapidAPI key', /[0-9a-f]{10}msh[0-9a-f]{14,}/],
  ['Private key block', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];

describe('app source', () => {
  it('is non-empty (sanity check for the scanner)', () => {
    expect(appFiles.length).toBeGreaterThan(20);
  });

  it('does not import AI provider SDKs or axios', () => {
    const banned = /from\s+['"](@google\/generative-ai|@google\/genai|openai|@anthropic-ai\/sdk|axios)['"]|require\(\s*['"](@google\/generative-ai|@google\/genai|openai|@anthropic-ai\/sdk|axios)['"]\s*\)/;
    const offenders = appFiles.filter((file) => banned.test(read(file)));
    expect(offenders).toEqual([]);
  });

  it('only uses allow-listed EXPO_PUBLIC_ variables', () => {
    const used = new Set(appFiles.flatMap((file) => read(file).match(/EXPO_PUBLIC_[A-Z0-9_]+/g) ?? []));
    const unexpected = [...used].filter((name) => !ALLOWED_PUBLIC_VARIABLES.has(name));
    expect(unexpected).toEqual([]);
  });

  it.each(SECRET_PATTERNS)('contains no %s', (_label, pattern) => {
    const files = [...appFiles, 'app.config.ts', 'eas.json'];
    const offenders = files.filter((file) => fs.existsSync(path.join(ROOT, file)) && pattern.test(read(file)));
    expect(offenders).toEqual([]);
  });

  it('contains no hard-coded Firebase project configuration', () => {
    const offenders = appFiles.filter((file) => /intellishop-1f62f/.test(read(file)));
    expect(offenders).toEqual([]);
  });

  it('contains no V1 fabricated-data markers', () => {
    const markers = /MOCK_RECIPES|Generate realistic UK supermarket prices|local_fallback|Math\.random\(\)/;
    const offenders = appFiles.filter((file) => markers.test(read(file)));
    expect(offenders).toEqual([]);
  });

  it('does not log passwords or form values on sign-in', () => {
    const offenders = appFiles.filter((file) => /console\.(log|info|debug)\([^)]*(password|values)/i.test(read(file)));
    expect(offenders).toEqual([]);
  });
});

describe('build configuration', () => {
  it('eas.json defines APP_ENV for every profile and no EXPO_PUBLIC_ values', () => {
    const eas = JSON.parse(read('eas.json'));
    for (const profile of ['development', 'preview', 'production']) {
      expect(eas.build[profile].env.APP_ENV).toBeDefined();
      const keys = Object.keys(eas.build[profile].env);
      expect(keys.filter((key) => key.startsWith('EXPO_PUBLIC_'))).toEqual([]);
    }
  });

  it('removed V1 client-side AI, price and mock modules stay removed', () => {
    const removed = [
      'lib/gemini.js',
      'services/geminiService.js',
      'services/priceComparison.js',
      'services/freeAPIsPrice.js',
      'services/recipeApiService.js',
      'services/smartShoppingService.js',
      'context/AIContext.jsx',
      'app/(auth)/recipe/[id].jsx',
    ];
    expect(removed.filter((file) => fs.existsSync(path.join(ROOT, file)))).toEqual([]);
  });
});
