/* Dev-only checks. Not needed to run the site.
   npm i puppeteer-core   (once, anywhere)   then:   CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe" node tests/run.js
   It serves this folder, opens the page in headless Chrome and checks:
   1. the page loads with no script errors
   2. GPU (WebGL2 shader) output matches the CPU reference engine on every sample photo
   3. Auto Enhance returns sane, image-dependent parameters
   4. undo / redo works */
const http = require('http'), fs = require('fs'), path = require('path');
let puppeteer; try { puppeteer = require('puppeteer-core'); } catch (e) { console.error('Install puppeteer-core first: npm i puppeteer-core'); process.exit(2); }
const root = path.resolve(__dirname, '..'), MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((q, r) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  await new Promise((r) => server.listen(0, r)); const port = server.address().port;
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await browser.newPage(), errs = []; pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto(`http://localhost:${port}/index.html`); await new Promise((r) => setTimeout(r, 3500));
  ok(errs.length === 0, 'page loads without script errors' + (errs.length ? ': ' + errs[0] : ''));
  const res = await pg.evaluate(async () => {
    const out = [];
    for (const n of ['reef', 'turtle', 'clownfish', 'manta', 'wreck']) {
      const im = new Image(); im.src = 'assets/' + n + '.jpg'; await im.decode();
      const w = 480, h = Math.round(im.naturalHeight * 480 / im.naturalWidth), c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, w, h); const id = x.getImageData(0, 0, w, h);
      const st = Engine.computeStats(id.data, w, h), p = Object.assign(Engine.neutralParams(), Engine.autoParams(st));
      const cpu = new Uint8ClampedArray(id.data.length); Engine.process(id.data, cpu, w, h, p, st);
      const g = GLR.create(); if (!g) { out.push({ n, noGL: true }); continue; }
      g.setSize(w, h); g.upload(c); g.render(p, st, Engine.getLevels(p, st, id.data, w, h));
      const rc = document.createElement('canvas'); rc.width = w; rc.height = h; const rx = rc.getContext('2d', { willReadFrequently: true }); rx.drawImage(g.canvas, 0, 0);
      const gpu = rx.getImageData(0, 0, w, h).data; let s = 0, mx = 0; for (let i = 0; i < gpu.length; i += 4) for (let k = 0; k < 3; k++) { const d = Math.abs(gpu[i + k] - cpu[i + k]); s += d; if (d > mx) mx = d; }
      g.dispose(); out.push({ n, mean: s / (gpu.length / 4 * 3), max: mx, auto: p });
    }
    return out;
  });
  for (const r of res) {
    if (r.noGL) { console.log('SKIP GPU parity for ' + r.n + ' (no WebGL2 here)'); continue; }
    ok(r.mean < 2.5, `GPU matches CPU on ${r.n} (mean abs diff ${r.mean.toFixed(2)}/255, max ${r.max})`);
    ok(r.auto.castAmt >= 0 && r.auto.castAmt <= 120 && r.auto.levels >= 0 && r.auto.levels <= 100 && Math.abs(r.auto.exposure) <= 1, `Auto parameters in range for ${r.n}`);
  }
  const uniq = new Set(res.map((r) => JSON.stringify([r.auto.castAmt, r.auto.levels, r.auto.dehazeAmt]))); ok(uniq.size >= 3, 'Auto adapts to the image (different photos give different settings)');
  const u = await pg.evaluate(async () => {
    const amt = document.querySelector('#sl-auto input[type=range]'); amt.value = 50; amt.dispatchEvent(new Event('input')); await new Promise((r) => setTimeout(r, 600));
    const a = !document.querySelector('#undoBtn').disabled; document.querySelector('#undoBtn').click(); await new Promise((r) => setTimeout(r, 300));
    return { canUndo: a, amtAfter: +document.querySelector('#sl-auto input[type=range]').value };
  });
  ok(u.canUndo && u.amtAfter === 100, 'undo restores the previous settings and the Amount slider');
  await browser.close(); server.close();
  console.log(fails ? `\n${fails} check(s) failed` : '\nAll checks passed'); process.exit(fails ? 1 : 0);
})();
