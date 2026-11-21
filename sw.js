/* Offline shell for Dive ColorLab. Caches the app files only, never the user's photos or videos (they are opened locally and not fetched). */
const VERSION = 'dcl-v1';
const SHELL = ['./', 'index.html', 'css/style.css', 'js/theme.js', 'js/engine.js', 'js/gl.js', 'js/app.js', 'js/vendor/mp4-muxer.js', 'manifest.webmanifest', 'assets/logo.svg', 'assets/bg.jpg', 'assets/reef.jpg', 'assets/turtle.jpg', 'assets/clownfish.jpg', 'assets/manta.jpg', 'assets/wreck.jpg', 'assets/credits.json'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
// network first (so updates arrive), cache as the offline fallback
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then((res) => { if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(r, copy)); } return res; }).catch(() => caches.match(r, { ignoreSearch: true })));
});
