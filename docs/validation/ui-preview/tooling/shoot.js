const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, 'web');
const types = { '.html': 'text/html', '.js': 'application/javascript', '.png': 'image/png', '.otf': 'font/otf', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const p = path.join(root, url === '/' ? 'index.html' : url);
  if (!fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
const css = `
@font-face { font-family: 'Inter_400Regular'; src: url(/fonts/Inter-Regular.otf); }
@font-face { font-family: 'Inter_500Medium'; src: url(/fonts/Inter-Medium.otf); }
@font-face { font-family: 'Inter_600SemiBold'; src: url(/fonts/Inter-SemiBold.otf); }
@font-face { font-family: 'Inter_700Bold'; src: url(/fonts/Inter-Bold.otf); }
html, body, #root { height: 100%; margin: 0; }`;
(async () => {
  await new Promise((r) => server.listen(8765, r));
  const browser = await chromium.launch();
  const out = path.join(__dirname, 'shots');
  fs.mkdirSync(out, { recursive: true });
  for (const n of process.argv.slice(2)) {
    const full = n.endsWith('!');
    const id = n.replace(/!$/, '');
    const page = await browser.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(`http://localhost:8765/#${id}`);
    await page.addStyleTag({ content: css });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(out, `${id.split('?')[0]}.png`) });
    if (errors.length) console.log(id, 'ERRORS:', errors.slice(0, 3).join(' | ').slice(0, 600));
    await page.close();
  }
  await browser.close();
  server.close();
})();
