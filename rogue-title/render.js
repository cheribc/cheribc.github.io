const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [,, mode, outDir] = process.argv; // mode: test | full
(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const browser = await chromium.launch({ proxy, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 }, ignoreHTTPSErrors: false });
  const page = await ctx.newPage();
  page.on('console', m => console.log('console:', m.text()));
  page.on('pageerror', e => console.log('pageerror:', e.message));
  await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**', r => {
    const rel = r.request().url().split('three@0.160.0/')[1];
    r.fulfill({ path: path.join(__dirname, 'node_modules/three', rel), contentType: 'application/javascript' });
  });
  const html = fs.readFileSync(path.join(__dirname, 'rogue.html'), 'utf8');
  await page.route('http://local/', r => r.fulfill({ body: '<!doctype html><html><head><meta charset=utf8></head><body>' + html + '</body></html>', contentType: 'text/html' }));
  await page.goto('http://local/');
  await page.waitForFunction(() => window.__seq, null, { timeout: 60000 });
  await page.evaluate(() => window.__seq.ready);
  console.log('fonts:', await page.evaluate(() => document.fonts.check('700 40px Syncopate')));
  await page.evaluate(() => window.__seq.setRenderSize(1920, 1080));
  fs.mkdirSync(outDir, { recursive: true });
  const frames = mode === 'test' ? [0.5, 2, 3.5, 4.6, 6, 7.5, 8.8, 10, 11, 12.2].map(t => Math.round(t*24)) : [...Array(337).keys()];
  const t0 = Date.now();
  for (const f of frames) {
    const data = await page.evaluate(f => { window.__seq.renderAt(f/24); return document.getElementById('view').toDataURL('image/jpeg', 0.93); }, f);
    fs.writeFileSync(path.join(outDir, `f${String(f).padStart(4,'0')}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
    if (f % 24 === 0) console.log('frame', f, ((Date.now()-t0)/1000).toFixed(0)+'s');
  }
  if (mode === 'test') await page.screenshot({ path: path.join(outDir, 'page.png'), fullPage: true });
  await browser.close();
})();
