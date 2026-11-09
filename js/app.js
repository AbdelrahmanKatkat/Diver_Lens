/* Dive ColorLab – UI. Files are opened locally via the File API; nothing is ever uploaded. */
(() => {
'use strict';
const E = Engine;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = E.clamp;

/* ---------------- icons ---------------- */
const ICONS = {
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5',
  presets: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
  compare: 'M12 3v18M4 6h5v12H4zM15 6h5v12h-5z',
  export: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z',
  help: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
  image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6',
  bolt: 'M13 3L5 14h6l-1 7 8-11h-6z',
  down: 'M6 9l6 6 6-6',
  play: 'M7 4l13 8-13 8z',
  pause: 'M7 4h4v16H7zM13 4h4v16h-4z',
  volume: 'M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6',
  mute: 'M4 9v6h4l5 4V5L8 9zM17 9l4 6M21 9l-4 6',
  full: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  left: 'M15 6l-6 6 6 6', right: 'M9 6l6 6-6 6',
  curve: 'M3 21C8 21 8 3 21 3',
  wheel: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
  hsl: 'M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2s0-2 1.5-2h2a3 3 0 0 0 3-3A9 9 0 0 0 12 3z',
  lr: 'M9 7l-5 5 5 5M15 7l5 5-5 5',
  sliders: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M13 4v4M7 10v4M15 16v4',
  wand: 'M4 20L15 9M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1z',
  tools: 'M4 20l8-8M14 4a4 4 0 0 0-1 5l-9 9 2 2 9-9a4 4 0 0 0 5-1l-3 1-2-2z',
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  cloud: 'M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z',
  alert: 'M12 3l10 18H2zM12 10v5M12 18h.01',
  pipette: 'M14 4l6 6-9 9H5v-6zM12 6l6 6',
  wave: 'M3 12h2M7 7v10M11 4v16M15 8v8M19 11v2',
  reset: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
  x: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  film: 'M3 5h18v14H3zM8 5v14M16 5v14M3 10h5M3 14h5M16 10h5M16 14h5',
};
function setIcon(svg, name) { svg.setAttribute('viewBox', '0 0 24 24'); svg.innerHTML = `<path d="${ICONS[name] || ''}"/>`; svg.dataset.i = name; }
const hydrateIcons = (root = document) => $$('svg[data-i]', root).forEach((s) => setIcon(s, s.dataset.i));
hydrateIcons();
const icon = (n, c = 'i') => `<svg class="${c}" data-i="${n}"></svg>`;

/* ---------------- state ---------------- */
const WORK_IMG = 1400, WORK_VID = 960;
const SAMPLES = [
  { key: 'turtle', name: 'Sea turtle' }, { key: 'clownfish', name: 'Clownfish' }, { key: 'manta', name: 'Manta ray' },
  { key: 'wreck', name: 'Shipwreck' }, { key: 'reef', name: 'Coral reef' },
];
const CREDITS = [
  ['Sea turtle', 'David Vogel (public domain)', 'https://commons.wikimedia.org/wiki/File:Green-sea-turtle.jpg'],
  ['Clownfish', 'Janderk (public domain)', 'https://commons.wikimedia.org/wiki/File:Common_clownfish.jpg'],
  ['Manta ray', 'NOAA National Marine Sanctuaries (public domain)', 'https://commons.wikimedia.org/wiki/File:FGBNMS_manta_ray_near_diver_(49040811011).jpg'],
  ['Shipwreck', 'W. Strickling (CC BY-SA 4.0)', 'https://commons.wikimedia.org/wiki/File:Ship_wreck_Carnatic_2017-04-22_Egypt-7947.jpg'],
  ['Coral reef', 'NOAA Photo Library (public domain)', 'https://commons.wikimedia.org/wiki/File:Reef2050_(9717674080).jpg'],
  ['Background', 'AI-generated cinematic coral reef artwork supplied with the project', null],
];
const S = {
  items: [], cur: -1, mode: 'split', pos: 50, filter: null, view: 'home', curveCh: 'rgb', hslBand: 'cyan', rt: 'cc',
  work: null, steps: { imported: false, corrected: false, compared: false, exported: false }, uid: 1, abort: false, quick: null, raf: 0,
};
const cur = () => S.items[S.cur];

/* ---------------- elements ---------------- */
const stage = $('#stage'), cmp = $('#cmp'), cB = $('#cBefore'), cA = $('#cAfter');
const xB = cB.getContext('2d'), xA = cA.getContext('2d', { willReadFrequently: true });
const handle = $('#handle'), playBtn = $('#playBtn'), seek = $('#seek'), timeTxt = $('#timeTxt');
const toastEl = $('#toast');

let toastT;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 3200); }
function busy(msg) { const b = $('#busy'); if (msg) { $('#busyTxt').textContent = msg; b.hidden = false; } else b.hidden = true; }
const safeLS = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
const baseName = (n) => n.replace(/\.[^.]+$/, '');
const slug = (n) => baseName(n).replace(/[^\w\-]+/g, '-').replace(/^-+|-+$/g, '') || 'media';

/* ---------------- theme ---------------- */
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('dcl.theme', t); } catch (e) {}
  setIcon($('#themeBtn svg'), t === 'dark' ? 'sun' : 'moon');
  drawCurve();
}
$('#themeBtn').onclick = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
setIcon($('#themeBtn svg'), document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon');

/* ---------------- loading media ---------------- */
const once = (el, ev) => new Promise((res, rej) => { el.addEventListener(ev, res, { once: true }); el.addEventListener('error', () => rej(new Error('decode')), { once: true }); });

async function loadImageItem(src, name, extra = {}) {
  const img = new Image();
  img.decoding = 'async';
  img.src = src;
  await img.decode();
  return { id: S.uid++, kind: 'image', name, url: src, thumb: src, el: img, w: img.naturalWidth, h: img.naturalHeight, params: E.defaultParams(), edited: false, ...extra };
}
async function loadVideoItem(src, name) {
  const v = document.createElement('video');
  v.playsInline = true; v.preload = 'auto'; v.loop = false; v.src = src; v.crossOrigin = 'anonymous';
  Object.assign(v.style, { position: 'fixed', left: '-9999px', width: '2px', height: '2px', opacity: '0', pointerEvents: 'none' });
  document.body.appendChild(v);
  await once(v, 'loadeddata');
  const item = { id: S.uid++, kind: 'video', name, url: src, el: v, w: v.videoWidth, h: v.videoHeight, duration: v.duration, params: E.defaultParams(), edited: false };
  // thumbnail + statistics from a representative frame
  v.currentTime = Math.min(1, (v.duration || 1) * 0.1);
  await once(v, 'seeked');
  const sc = Math.min(1, WORK_VID / Math.max(item.w, item.h)), w = Math.round(item.w * sc), h = Math.round(item.h * sc);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(v, 0, 0, w, h);
  item.st = E.computeStats(x.getImageData(0, 0, w, h).data, w, h);
  const t = document.createElement('canvas'); t.width = 240; t.height = Math.round(240 * item.h / item.w);
  t.getContext('2d').drawImage(v, 0, 0, t.width, t.height);
  item.thumb = t.toDataURL('image/jpeg', 0.7);
  v.currentTime = 0;
  v.addEventListener('timeupdate', () => { if (cur() === item) updateTime(); });
  v.addEventListener('seeked', () => { if (cur() === item) { drawVideoFrame(); updateTime(); } });
  v.addEventListener('play', () => { if (cur() === item) { setIcon($('svg', playBtn), 'pause'); videoLoop(); } });
  v.addEventListener('pause', () => { if (cur() === item) setIcon($('svg', playBtn), 'play'); });
  v.addEventListener('ended', () => { if (cur() === item) setIcon($('svg', playBtn), 'play'); });
  return item;
}

async function addFiles(fileList) {
  const files = [...fileList];
  if (!files.length) return;
  busy('Opening files…');
  let first = -1, ok = 0, bad = [];
  for (const f of files) {
    try {
      const url = URL.createObjectURL(f); // local blob URL, never leaves the device
      const isVid = f.type.startsWith('video/') || /\.(mp4|m4v|mov|webm|mkv|ogv)$/i.test(f.name);
      let item;
      try { item = isVid ? await loadVideoItem(url, f.name) : await loadImageItem(url, f.name, { file: f }); }
      catch (e) { URL.revokeObjectURL(url); throw e; }
      S.items.push(item);
      if (first < 0) first = S.items.length - 1;
      ok++;
    } catch (e) { bad.push(f.name); }
  }
  busy();
  if (bad.length) toast(`Your browser can't open: ${bad.slice(0, 3).join(', ')}${bad.length > 3 ? '…' : ''}`);
  if (ok) { S.steps.imported = true; if (S.filter) S.filter = null; renderFilm(); await selectItem(first); toast(`Opened ${ok} file${ok > 1 ? 's' : ''} locally. Nothing was uploaded.`); }
  updateSteps(); updateCounts();
}

/* ---------------- working data & render ---------------- */
function prepare(item, maxSide = WORK_IMG) {
  const sc = Math.min(1, maxSide / Math.max(item.w, item.h));
  const w = Math.max(1, Math.round(item.w * sc)), h = Math.max(1, Math.round(item.h * sc));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.imageSmoothingQuality = 'high';
  x.drawImage(item.el, 0, 0, w, h);
  const id = x.getImageData(0, 0, w, h);
  item.st = E.computeStats(id.data, w, h);
  return { w, h, id, src: id.data, out: x.createImageData(w, h) };
}

async function selectItem(i) {
  const prev = cur();
  if (prev && prev.kind === 'video') prev.el.pause();
  if (i < 0 || i >= S.items.length) { S.cur = -1; S.work = null; $('#empty').hidden = false; cmp.hidden = true; renderFilm(); return; }
  S.cur = i; S.work = null;
  const it = cur();
  $('#empty').hidden = true; cmp.hidden = false;
  busy('Preparing…');
  await new Promise((r) => setTimeout(r, 15));
  if (it.kind === 'image') {
    S.work = prepare(it);
    cB.width = cA.width = S.work.w; cB.height = cA.height = S.work.h;
    xB.putImageData(S.work.id, 0, 0);
  } else {
    const sc = Math.min(1, WORK_VID / Math.max(it.w, it.h)), w = Math.round(it.w * sc), h = Math.round(it.h * sc);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    S.work = { w, h, c, x, out: x.createImageData(w, h) };
    cB.width = cA.width = w; cB.height = cA.height = h;
  }
  if (!it.inited) { it.inited = true; it.params = Object.assign(E.neutralParams(), E.autoParams(it.st)); }
  busy();
  $('#playbar').classList.toggle('photo', it.kind === 'image');
  setIcon($('svg', playBtn), 'play');
  setIcon($('#muteBtn svg'), it.kind === 'video' && it.el.muted ? 'mute' : 'volume');
  updateTime();
  fit(); syncUI(); renderFilm(); render();
  $('#exName').textContent = it.name;
}

function requestRender() { if (S.raf) return; S.raf = requestAnimationFrame(() => { S.raf = 0; render(); }); }
function render() {
  const it = cur(); if (!it || !S.work) return;
  if (it.kind === 'video') { drawVideoFrame(); return; }
  if (!S.work.src) return;
  const { w, h, src, out } = S.work;
  E.process(src, out.data, w, h, it.params, it.st);
  xA.putImageData(out, 0, 0);
}
function drawVideoFrame() {
  const it = cur(); if (!it || it.kind !== 'video' || !S.work || !S.work.x) return;
  const { w, h, x, out } = S.work;
  if (it.el.readyState < 2) return;
  x.drawImage(it.el, 0, 0, w, h);
  xB.drawImage(S.work.c, 0, 0);
  const id = x.getImageData(0, 0, w, h);
  E.process(id.data, out.data, w, h, it.params, it.st);
  xA.putImageData(out, 0, 0);
}
function videoLoop() {
  const it = cur(); if (!it || it.kind !== 'video') return;
  const v = it.el;
  const step = () => {
    if (cur() !== it || v.paused || v.ended) return;
    drawVideoFrame();
    if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(step); else requestAnimationFrame(step);
  };
  step();
}

/* ---------------- stage layout / compare ---------------- */
function fit() {
  if (!S.work) return;
  const r = stage.getBoundingClientRect();
  let ar = S.work.w / S.work.h; if (S.mode === 'side') ar *= 2;
  const pw = Math.max(50, r.width - 16), ph = Math.max(50, r.height - 16);
  let w = pw, h = w / ar; if (h > ph) { h = ph; w = h * ar; }
  cmp.style.width = w + 'px'; cmp.style.height = h + 'px';
}
new ResizeObserver(fit).observe(stage);
function setPos(p) { S.pos = clamp(p, 0, 100); cmp.style.setProperty('--pos', S.pos + '%'); handle.setAttribute('aria-valuenow', Math.round(S.pos)); }
setPos(50);
function setMode(m) {
  S.mode = m;
  cmp.classList.toggle('side', m === 'side'); cmp.classList.toggle('orig', m === 'orig');
  fit(); markStep('compared');
}
let dragging = false;
const moveTo = (e) => { const r = cmp.getBoundingClientRect(); setPos((e.clientX - r.left) / r.width * 100); };
cmp.addEventListener('pointerdown', (e) => { if (S.mode !== 'split') return; dragging = true; cmp.setPointerCapture(e.pointerId); moveTo(e); markStep('compared'); });
cmp.addEventListener('pointermove', (e) => { if (dragging) moveTo(e); });
cmp.addEventListener('pointerup', () => (dragging = false));
cmp.addEventListener('pointercancel', () => (dragging = false));
handle.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') { setPos(S.pos - 3); e.preventDefault(); } if (e.key === 'ArrowRight') { setPos(S.pos + 3); e.preventDefault(); } });
$('#compareBtn').onclick = () => { setMode(S.mode === 'split' ? 'side' : S.mode === 'side' ? 'orig' : 'split'); toast({ split: 'Split view', side: 'Side-by-side', orig: 'Showing original' }[S.mode]); };

/* ---------------- playback ---------------- */
const fmt = (t) => { t = Math.max(0, t || 0); return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`; };
function updateTime() {
  const it = cur();
  if (!it || it.kind !== 'video') { timeTxt.textContent = 'Photo'; seek.value = 0; seek.style.setProperty('--v', '0%'); return; }
  timeTxt.textContent = `${fmt(it.el.currentTime)} / ${fmt(it.el.duration)}`;
  const v = (it.el.currentTime / (it.el.duration || 1)) * 1000; seek.value = v; seek.style.setProperty('--v', v / 10 + '%');
}
playBtn.onclick = () => { const it = cur(); if (it && it.kind === 'video') it.el.paused ? it.el.play() : it.el.pause(); };
seek.oninput = () => { const it = cur(); if (it && it.kind === 'video') it.el.currentTime = (seek.value / 1000) * it.el.duration; };
$('#muteBtn').onclick = () => { const it = cur(); if (it && it.kind === 'video') { it.el.muted = !it.el.muted; setIcon($('#muteBtn svg'), it.el.muted ? 'mute' : 'volume'); } };
$('#fsBtn').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else if (stage.requestFullscreen) stage.requestFullscreen(); };
document.addEventListener('fullscreenchange', () => setTimeout(fit, 50));

/* ---------------- filmstrip & counts ---------------- */
function renderFilm() {
  const strip = $('#film'); strip.innerHTML = '';
  S.items.forEach((it, i) => {
    if (S.filter && it.kind !== S.filter) return;
    const b = document.createElement('div');
    b.className = 'th' + (i === S.cur ? ' on' : ''); b.tabIndex = 0; b.setAttribute('role', 'button'); b.setAttribute('aria-label', 'Open ' + it.name);
    b.innerHTML = `<img alt="" src="${it.thumb}"><span class="k">${it.kind === 'video' ? 'Video' : it.sample ? it.name : 'Photo'}</span>${it.sample ? '' : `<button class="x" aria-label="Remove ${it.name}">${icon('x')}</button>`}`;
    b.onclick = (e) => { if (e.target.closest('.x')) { removeItem(i); return; } selectItem(i); };
    b.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectItem(i); } };
    strip.appendChild(b);
  });
  hydrateIcons(strip);
  if (!strip.children.length) strip.innerHTML = '<p class="muted" style="margin:18px">No media in this filter yet. Use Import Media.</p>';
}
function removeItem(i) {
  const it = S.items[i];
  if (it.kind === 'video') { it.el.pause(); it.el.remove(); }
  if (!it.sample) URL.revokeObjectURL(it.url);
  S.items.splice(i, 1);
  const next = S.items.length ? Math.min(i, S.items.length - 1) : -1;
  S.cur = -1; selectItem(next); updateCounts();
}
$('#filmNext').onclick = () => $('#film').scrollBy({ left: 320 });
$('#filmPlay').onclick = () => $('#film').scrollBy({ left: -320 });
function updateCounts() {
  $('#cVideos').textContent = S.items.filter((i) => i.kind === 'video').length;
  $('#cPhotos').textContent = S.items.filter((i) => i.kind === 'image').length;
  $('#cProjects').textContent = S.items.filter((i) => i.edited).length;
  $('#cPresets').textContent = BUILTIN.length + userPresets().length;
  $$('[data-filter]').forEach((b) => b.classList.toggle('on', b.dataset.filter === S.filter));
}
$$('[data-filter]').forEach((b) => (b.onclick = () => { S.filter = S.filter === b.dataset.filter ? null : b.dataset.filter; renderFilm(); updateCounts(); }));

/* ---------------- controls: sliders, toggles ---------------- */
const rainbow = 'linear-gradient(90deg,#ff3b3b,#ffd23b,#3bff6a,#3bd0ff,#7a3bff,#ff3bd0)';
const SL = {
  wb: [
    { k: 'temp', l: 'Temperature', min: -100, max: 100, tr: 'linear-gradient(90deg,#3a8dff,#c9c9c9,#ffc83a)' },
    { k: 'tint', l: 'Tint', min: -100, max: 100, tr: 'linear-gradient(90deg,#c43aff,#c9c9c9,#3aff7a)' },
  ],
  tone: [
    { k: 'exposure', l: 'Exposure', min: -2, max: 2, step: 0.01, dec: 2 },
    { k: 'contrast', l: 'Contrast', min: -100, max: 100 },
    { k: 'highlights', l: 'Highlights', min: -100, max: 100 },
    { k: 'shadows', l: 'Shadows', min: -100, max: 100 },
    { k: 'vibrance', l: 'Vibrance', min: -100, max: 100, tr: rainbow },
    { k: 'saturation', l: 'Saturation', min: -100, max: 100, tr: rainbow },
  ],
  adv: [
    { k: 'clarity', l: 'Clarity', min: -100, max: 100 },
    { k: 'castAmt', l: 'Cast removal', min: 0, max: 100 },
    { k: 'dehazeAmt', l: 'Dehaze', min: 0, max: 100 },
    { k: 'backAmt', l: 'Backscatter', min: 0, max: 100 },
    { k: 'noiseAmt', l: 'Noise red.', min: 0, max: 100 },
  ],
};
const TOGGLES = [
  { k: 'cast', l: 'Remove Color Cast (Blue/Green)', i: 'drop' },
  { k: 'dehaze', l: 'Dehaze / Clarity', i: 'cloud' },
  { k: 'backscatter', l: 'Backscatter Reduction', i: 'wave' },
  { k: 'noise', l: 'Noise Reduction', i: 'sliders' },
];
const showVal = (v, dec = 0) => (v > 0 ? '+' : '') + (dec ? v.toFixed(dec) : Math.round(v));
const refs = {};

function slider(def, get, set, container) {
  const row = document.createElement('div'); row.className = 'sl';
  const id = 'sl_' + Math.random().toString(36).slice(2, 8);
  row.innerHTML = `<label for="${id}" title="Double-click to reset">${def.l}</label><input id="${id}" type="range" min="${def.min}" max="${def.max}" step="${def.step || 1}"><input type="text" inputmode="decimal" aria-label="${def.l} value">`;
  const [lab, rng, num] = [row.children[0], row.children[1], row.children[2]];
  if (def.tr) rng.style.setProperty('--tr', def.tr);
  rng.oninput = () => { const v = +rng.value; num.value = showVal(v, def.dec); set(v); };
  num.onchange = () => { const v = clamp(parseFloat(num.value) || 0, def.min, def.max); rng.value = v; num.value = showVal(v, def.dec); set(v); };
  lab.ondblclick = () => { const v = def.min < 0 ? 0 : (E.neutralParams()[def.k] ?? 0); rng.value = v; num.value = showVal(v, def.dec); set(v); };
  container.appendChild(row);
  return () => { const v = get(); rng.value = v; num.value = showVal(v, def.dec); };
}
function paramSet(k) { return (v) => { cur().params[k] = v; changed(); }; }
function changed() {
  const it = cur(); if (!it) return;
  it.edited = true; S.quick = null; $$('#quick button').forEach((b) => b.classList.remove('on'));
  markStep('corrected'); updateCounts(); requestRender(); drawCurve();
}

function buildControls() {
  [['wb', '#sl-wb'], ['tone', '#sl-tone'], ['adv', '#sl-adv']].forEach(([g, sel]) => {
    SL[g].forEach((d) => { refs[d.k] = slider(d, () => cur().params[d.k], paramSet(d.k), $(sel)); });
  });
  const tg = $('#toggles');
  TOGGLES.forEach((t) => {
    const row = document.createElement('div'); row.className = 'tg';
    row.innerHTML = `${icon(t.i)}<span>${t.l}</span><button class="sw" role="switch" aria-checked="false" aria-label="${t.l}"></button>`;
    const sw = $('.sw', row);
    const flip = () => { const v = sw.getAttribute('aria-checked') !== 'true'; sw.setAttribute('aria-checked', v); cur().params[t.k] = v; changed(); };
    row.onclick = (e) => { if (e.target !== sw) flip(); };
    sw.onclick = flip;
    refs['t_' + t.k] = () => sw.setAttribute('aria-checked', !!cur().params[t.k]);
    tg.appendChild(row);
  });
  hydrateIcons();
  $$('.rh.tog').forEach((h) => (h.onclick = () => h.closest('.rsec').classList.toggle('collapsed')));
  $$('.rsec').forEach((s) => { const d = [...s.children].filter((c) => !c.matches('h3')); const w = document.createElement('div'); w.className = 'rows'; d.forEach((c) => w.appendChild(c)); s.appendChild(w); });
}

/* ---------------- curves ---------------- */
const curveCv = $('#curveCv'), cx = curveCv.getContext('2d');
const CH_COL = { rgb: '#ffffff', r: '#ff5a5a', g: '#4bff7a', b: '#4aa8ff' };
function sizeCurve() {
  const r = curveCv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
  if (!r.width) return;
  curveCv.width = Math.round(r.width * d); curveCv.height = Math.round(r.height * d);
}
function drawCurve() {
  const it = cur(); if (!it) return;
  if (!curveCv.width) sizeCurve();
  const W = curveCv.width, H = curveCv.height, light = document.documentElement.dataset.theme === 'light';
  cx.clearRect(0, 0, W, H);
  cx.strokeStyle = light ? 'rgba(0,60,90,.2)' : 'rgba(255,255,255,.14)'; cx.lineWidth = 1;
  for (let i = 1; i < 4; i++) { cx.beginPath(); cx.moveTo(W * i / 4, 0); cx.lineTo(W * i / 4, H); cx.moveTo(0, H * i / 4); cx.lineTo(W, H * i / 4); cx.stroke(); }
  if (it.st) {
    const hist = it.st.hist; let mx = 0; for (let i = 1; i < 255; i++) mx = Math.max(mx, hist[i]);
    cx.fillStyle = light ? 'rgba(0,100,150,.25)' : 'rgba(150,200,230,.28)';
    for (let i = 0; i < 256; i++) { const hh = Math.min(1, hist[i] / (mx || 1)) * H * 0.85; cx.fillRect(i / 256 * W, H - hh, W / 256 + 1, hh); }
  }
  const pts = it.params.curves[S.curveCh], lut = E.curveLUT(pts);
  cx.strokeStyle = S.curveCh === 'rgb' ? (light ? '#0a2740' : '#fff') : CH_COL[S.curveCh]; cx.lineWidth = 2 * (window.devicePixelRatio || 1) * 0.8;
  cx.beginPath(); for (let i = 0; i < 256; i++) { const x = i / 255 * W, y = H - lut[i] * H; i ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke();
  cx.fillStyle = '#ffd21f';
  pts.forEach((p) => { cx.beginPath(); cx.arc(p[0] * W, H - p[1] * H, 5 * (window.devicePixelRatio || 1) * 0.9, 0, 7); cx.fill(); cx.strokeStyle = '#000'; cx.lineWidth = 1; cx.stroke(); });
}
let cDrag = null;
const cPos = (e) => { const r = curveCv.getBoundingClientRect(); return [clamp((e.clientX - r.left) / r.width, 0, 1), clamp(1 - (e.clientY - r.top) / r.height, 0, 1), r]; };
function nearest(pts, e) { const [x, y, r] = cPos(e); let bi = -1, bd = 1e9; pts.forEach((p, i) => { const d = Math.hypot((p[0] - x) * r.width, (p[1] - y) * r.height); if (d < bd) { bd = d; bi = i; } }); return bd < 14 ? bi : -1; }
curveCv.addEventListener('pointerdown', (e) => {
  const it = cur(); if (!it) return;
  const pts = it.params.curves[S.curveCh]; let i = nearest(pts, e);
  if (i < 0) { if (pts.length >= 9) return; const [x, y] = cPos(e); pts.push([x, y]); pts.sort((a, b) => a[0] - b[0]); i = pts.findIndex((p) => p[0] === x && p[1] === y); }
  cDrag = pts[i]; curveCv.setPointerCapture(e.pointerId); changed();
});
curveCv.addEventListener('pointermove', (e) => {
  if (!cDrag) return;
  const pts = cur().params.curves[S.curveCh], i = pts.indexOf(cDrag), [x, y] = cPos(e);
  if (i > 0 && i < pts.length - 1) cDrag[0] = clamp(x, pts[i - 1][0] + 0.02, pts[i + 1][0] - 0.02);
  cDrag[1] = y; changed();
});
['pointerup', 'pointercancel'].forEach((ev) => curveCv.addEventListener(ev, () => (cDrag = null)));
curveCv.addEventListener('dblclick', (e) => { const pts = cur().params.curves[S.curveCh], i = nearest(pts, e); if (i > 0 && i < pts.length - 1) { pts.splice(i, 1); changed(); } });
$$('#curveTabs button').forEach((b) => (b.onclick = () => { S.curveCh = b.dataset.ch; $$('#curveTabs button').forEach((x) => x.classList.toggle('on', x === b)); drawCurve(); }));
new ResizeObserver(() => { sizeCurve(); drawCurve(); }).observe(curveCv);

/* ---------------- colour wheels ---------------- */
const WHEELS = [['shadows', 'Shadows'], ['mid', 'Midtones'], ['high', 'Highlights']];
function buildWheels() {
  const box = $('#wheels');
  WHEELS.forEach(([k, label]) => {
    const w = document.createElement('div'); w.className = 'wheel-w';
    w.innerHTML = `<small>${label}</small><div class="wheel" role="application" aria-label="${label} colour wheel. Drag to tint, double-click to reset"><i></i></div><input type="range" min="-100" max="100" value="0" aria-label="${label} luminance">`;
    const wheel = $('.wheel', w), dot = $('i', w), lum = $('input', w);
    const place = () => { const o = cur().params.wheels[k]; dot.style.left = 50 + o.x * 50 + '%'; dot.style.top = 50 + o.y * 50 + '%'; lum.value = o.l; };
    const move = (e) => {
      const r = wheel.getBoundingClientRect();
      let x = ((e.clientX - r.left) / r.width - 0.5) * 2, y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
      const o = cur().params.wheels[k]; o.x = +x.toFixed(3); o.y = +y.toFixed(3); place(); changed();
    };
    let d = false;
    wheel.onpointerdown = (e) => { d = true; wheel.setPointerCapture(e.pointerId); move(e); };
    wheel.onpointermove = (e) => d && move(e);
    wheel.onpointerup = wheel.onpointercancel = () => (d = false);
    wheel.ondblclick = () => { const o = cur().params.wheels[k]; o.x = o.y = 0; place(); changed(); };
    lum.oninput = () => { cur().params.wheels[k].l = +lum.value; changed(); };
    lum.ondblclick = () => { lum.value = 0; cur().params.wheels[k].l = 0; changed(); };
    refs['w_' + k] = place;
    box.appendChild(w);
  });
}

/* ---------------- HSL ---------------- */
function buildHSL() {
  const dots = $('#hslDots');
  E.BANDS.forEach((b) => {
    const d = document.createElement('button'); d.className = 'dot'; d.style.setProperty('--c', b.color); d.title = b.id; d.setAttribute('aria-label', b.id);
    d.onclick = () => { S.hslBand = b.id; syncHSL(); }; dots.appendChild(d);
  });
  [['h', 'Hue', 'linear-gradient(90deg,#4aa8ff,#c9c9c9,#ff5a8a)'], ['s', 'Saturation', 'linear-gradient(90deg,#888,#ff5a5a)'], ['l', 'Luminance', 'linear-gradient(90deg,#222,#ffd21f)']].forEach(([k, l, tr]) => {
    refs['hsl_' + k] = slider({ k, l, min: -100, max: 100, tr }, () => cur().params.hsl[S.hslBand][k], (v) => { cur().params.hsl[S.hslBand][k] = v; changed(); }, $('#hslSliders'));
  });
}
function syncHSL() {
  $$('#hslDots .dot').forEach((d, i) => d.classList.toggle('on', E.BANDS[i].id === S.hslBand));
  ['h', 's', 'l'].forEach((k) => refs['hsl_' + k]());
}

/* ---------------- sync ---------------- */
function syncUI() {
  if (!cur()) return;
  Object.keys(refs).forEach((k) => { if (!k.startsWith('hsl_')) refs[k](); });
  syncHSL(); drawCurve();
}

/* ---------------- quick actions & presets ---------------- */
const QUICK = [
  { n: 'Auto Enhance', i: 'wand', f: (it) => ({ ...E.neutralParams(), ...E.autoParams(it.st) }) },
  { n: 'Color Restore', i: 'drop', f: () => ({ cast: true, castAmt: 100, temp: 10, vibrance: 22, saturation: 12 }) },
  { n: 'Remove Haze', i: 'cloud', f: () => ({ dehaze: true, dehazeAmt: 65, backscatter: true, backAmt: 40, clarity: 12 }) },
  { n: 'Dehaze + Contrast', i: 'alert', f: () => ({ dehaze: true, dehazeAmt: 55, contrast: 28, clarity: 22, shadows: 10 }) },
  { n: 'Underwater WB', i: 'pipette', f: () => ({ cast: true, castAmt: 100, temp: 0, tint: 0 }) },
  { n: 'Denoise', i: 'wave', f: () => ({ noise: true, noiseAmt: 60 }) },
];
function applyPatch(patch) {
  const it = cur(); if (!it) { toast('Open a photo or video first'); return; }
  Object.assign(it.params, JSON.parse(JSON.stringify(patch)));
  syncUI(); requestRender(); it.edited = true; markStep('corrected'); updateCounts();
}
function buildQuick() {
  const ul = $('#quick');
  QUICK.forEach((q, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button>${icon(q.i)} ${q.n}</button>`;
    li.firstChild.onclick = () => { const it = cur(); if (!it) return toast('Open a photo or video first'); applyPatch(q.f(it)); S.quick = i; $$('#quick button').forEach((b, j) => b.classList.toggle('on', j === i)); };
    ul.appendChild(li);
  });
  hydrateIcons(ul);
  $('#autoWB').onclick = () => { applyPatch({ cast: true, castAmt: 90, temp: 6, tint: 0 }); toast('Underwater white balance applied'); };
}

const BUILTIN = [
  { n: 'Tropical Reef', d: 'Warm, punchy shallow reef', g: 'linear-gradient(90deg,#19c3ff,#ffd21f,#ff5a8a)', p: { cast: true, castAmt: 70, temp: 22, vibrance: 40, saturation: 14, contrast: 16, dehaze: true, dehazeAmt: 35 } },
  { n: 'Blue Water', d: 'Remove deep-blue cast', g: 'linear-gradient(90deg,#0b3d91,#19c3ff,#ffb02a)', p: { cast: true, castAmt: 90, temp: 35, tint: 4, contrast: 12, dehaze: true, dehazeAmt: 45, shadows: 18, vibrance: 28 } },
  { n: 'Green Water', d: 'Lakes, cenotes, quarries', g: 'linear-gradient(90deg,#1c6b3a,#7be37b,#d9b3ff)', p: { cast: true, castAmt: 80, temp: 10, tint: -22, saturation: 10, dehaze: true, dehazeAmt: 50, contrast: 20 } },
  { n: 'Cave / Low Light', d: 'Lift shadows, calm noise', g: 'linear-gradient(90deg,#050a14,#3a5a8a,#ffe8b0)', p: { exposure: 0.6, shadows: 35, highlights: -20, noise: true, noiseAmt: 50, cast: true, castAmt: 60, vibrance: 25 } },
  { n: 'Wreck Cinematic', d: 'Teal shadows, warm highlights', g: 'linear-gradient(90deg,#0a4a5a,#6a7a7a,#ff9a3a)', p: { contrast: 28, saturation: -8, temp: -6, cast: true, castAmt: 60, dehaze: true, dehazeAmt: 40, wheels: { shadows: { x: 0, y: 0.55, l: 0 }, mid: { x: 0, y: 0, l: 0 }, high: { x: 0.3, y: -0.52, l: 0 } } } },
  { n: 'Macro Pop', d: 'Vivid colour, extra clarity', g: 'linear-gradient(90deg,#ff3b3b,#ffd23b,#3bd0ff)', p: { vibrance: 45, saturation: 22, clarity: 25, contrast: 20, shadows: 12, cast: true, castAmt: 60 } },
];
const userPresets = () => safeLS.get('dcl.presets', []);
function applyPreset(p) {
  const it = cur(); if (!it) return toast('Open a photo or video first');
  const base = E.neutralParams();
  it.params = Object.assign(base, E.clone(p));
  syncUI(); requestRender(); it.edited = true; markStep('corrected'); updateCounts();
}
function renderPresets() {
  [$('#presetGrid'), $('#presetGrid2')].forEach((grid) => {
    grid.innerHTML = '';
    BUILTIN.forEach((b) => {
      const el = document.createElement('button'); el.className = 'pr'; el.innerHTML = `<div class="sw8" style="--g:${b.g}"></div><b>${b.n}</b><small>${b.d}</small>`;
      el.onclick = () => { applyPreset(b.p); toast(`Preset: ${b.n}`); }; grid.appendChild(el);
    });
    userPresets().forEach((u, i) => {
      const el = document.createElement('div'); el.className = 'pr'; el.tabIndex = 0; el.setAttribute('role', 'button');
      el.innerHTML = `<div class="sw8" style="--g:linear-gradient(90deg,#ffd21f,#19c3ff)"></div><b>${u.name.replace(/</g, '&lt;')}</b><small>My preset</small><button class="del" aria-label="Delete preset">${icon('trash')}</button>`;
      el.onclick = (e) => { if (e.target.closest('.del')) { const l = userPresets(); l.splice(i, 1); safeLS.set('dcl.presets', l); renderPresets(); updateCounts(); return; } applyPreset(u.params); toast(`Preset: ${u.name}`); };
      grid.appendChild(el);
    });
    hydrateIcons(grid);
  });
}
function savePreset() {
  const it = cur(); if (!it) return;
  const name = (prompt('Name for this preset:', 'My look') || '').trim(); if (!name) return;
  const l = userPresets(); l.push({ name, params: E.clone(it.params) }); safeLS.set('dcl.presets', l);
  renderPresets(); updateCounts(); toast('Preset saved in this browser');
}
$('#savePreset').onclick = $('#savePreset2').onclick = savePreset;

$('#resetBtn').onclick = () => { const it = cur(); if (!it) return; it.params = E.neutralParams(); S.quick = null; $$('#quick button').forEach((b) => b.classList.remove('on')); syncUI(); requestRender(); toast('Reset to the untouched original'); };

/* right-hand tabs */
$$('#rtabs button').forEach((b) => (b.onclick = () => {
  S.rt = b.dataset.rt; $$('#rtabs button').forEach((x) => x.classList.toggle('on', x === b));
  ['cc', 'adv', 'pre'].forEach((k) => ($('#rt-' + k).hidden = k !== S.rt));
}));

/* ---------------- workflow steps ---------------- */
function markStep(k) { if (!S.steps[k]) { S.steps[k] = true; updateSteps(); } }
function updateSteps() {
  const order = ['imported', 'corrected', 'compared', 'exported'];
  let curStep = order.findIndex((k) => !S.steps[k]); if (curStep < 0) curStep = 3;
  $$('#steps li').forEach((li, i) => { li.classList.toggle('done', S.steps[order[i]]); li.classList.toggle('cur', i === curStep && !S.steps[order[i]]); });
}
$$('#steps button').forEach((b) => (b.onclick = () => {
  const n = +b.dataset.step;
  if (n === 1) $('#fileInput').click();
  if (n === 2) { setView('home'); $('#rbody').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  if (n === 3) { setView('home'); setMode(S.mode === 'split' ? 'side' : 'split'); }
  if (n === 4) openExport();
}));

/* ---------------- navigation ---------------- */
function setView(v) {
  if (v === 'export') { openExport(); return; }
  S.view = v;
  $('#view-ws').hidden = !(v === 'home' || v === 'edit' || v === 'compare');
  $('#view-batch').hidden = v !== 'batch'; $('#view-presets').hidden = v !== 'presets';
  document.body.classList.toggle('focus', v === 'edit');
  if (v === 'compare') setMode('side'); else if (v === 'home' || v === 'edit') { if (S.mode === 'side' && v !== 'compare') setMode('split'); }
  $$('#mainNav .tab').forEach((t) => t.classList.toggle('on', t.dataset.nav === v));
  if (v === 'batch') renderBatch();
  if (v === 'presets') renderPresets();
  requestAnimationFrame(() => { fit(); sizeCurve(); drawCurve(); });
  window.scrollTo({ top: 0 });
}
$$('[data-nav]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); setView(b.dataset.nav); }));

/* ---------------- saving files ---------------- */
async function pickSave(name, mime, ext) {
  if (!window.showSaveFilePicker) return null;
  try { return await window.showSaveFilePicker({ suggestedName: name, types: [{ description: ext.toUpperCase() + ' file', accept: { [mime]: ['.' + ext] } }] }); }
  catch (e) { if (e && e.name === 'AbortError') throw e; return null; }
}
async function saveBlob(blob, name, handle) {
  if (handle) { const w = await handle.createWritable(); await w.write(blob); await w.close(); return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
const toBlob = (cv, type, q) => new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), type, q));
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

async function renderFull(item, maxSide) {
  if (!item.st) prepare(item);
  const cap = Math.min(maxSide || 8192, 8192), sc = Math.min(1, cap / Math.max(item.w, item.h));
  const w = Math.max(1, Math.round(item.w * sc)), h = Math.max(1, Math.round(item.h * sc));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.imageSmoothingQuality = 'high'; x.drawImage(item.el, 0, 0, w, h);
  const id = x.getImageData(0, 0, w, h), out = x.createImageData(w, h);
  E.process(id.data, out.data, w, h, item.params, item.st);
  x.putImageData(out, 0, 0);
  return c;
}
async function encodeImage(item, fmtType, q, maxSide) {
  const c = await renderFull(item, maxSide);
  return toBlob(c, fmtType, q);
}
const exOpts = () => ({ type: $('#exFmt').value, q: $('#exQ').value / 100, size: +$('#exSize').value });

async function exportVideo(item, prog) {
  if (!window.MediaRecorder) throw new Error('This browser cannot record video. Try Chrome, Edge or Firefox.');
  const v = document.createElement('video'); v.playsInline = true; v.preload = 'auto'; v.src = item.url;
  await once(v, 'loadeddata');
  const sc = Math.min(1, WORK_VID / Math.max(item.w, item.h)), w = Math.round(item.w * sc) & ~1, h = Math.round(item.h * sc) & ~1;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const x = cv.getContext('2d', { willReadFrequently: true }), out = x.createImageData(w, h);
  const stream = cv.captureStream(30);
  let ac = null;
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const dest = ac.createMediaStreamDestination(); ac.createMediaElementSource(v).connect(dest);
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    await ac.resume();
  } catch (e) { /* video without audio is still fine */ }
  const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m));
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8e6 }), chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise((res) => (rec.onstop = () => res(new Blob(chunks, { type: 'video/webm' }))));
  const frame = () => {
    x.drawImage(v, 0, 0, w, h);
    const id = x.getImageData(0, 0, w, h);
    E.process(id.data, out.data, w, h, item.params, item.st);
    x.putImageData(out, 0, 0);
    prog(v.currentTime / (v.duration || 1));
    if (S.abort) { v.pause(); rec.state !== 'inactive' && rec.stop(); return; }
    if (!v.ended) (v.requestVideoFrameCallback ? v.requestVideoFrameCallback(frame) : requestAnimationFrame(frame));
  };
  v.onended = () => setTimeout(() => rec.state !== 'inactive' && rec.stop(), 150);
  rec.start(250); await v.play(); frame();
  const blob = await done;
  if (ac) ac.close();
  v.removeAttribute('src'); v.load();
  return S.abort ? null : blob;
}

/* export dialog */
const dlgEx = $('#dlgExport');
function setProg(el, p, txt) { el.hidden = false; $('i', el).style.width = Math.round(p * 100) + '%'; $('span', el).textContent = txt || Math.round(p * 100) + '%'; }
function openExport() {
  const it = cur(); if (!it) return toast('Open a photo or video first');
  $('#exName').textContent = it.name;
  $('#exImg').hidden = it.kind === 'video'; $('#exVid').hidden = it.kind !== 'video';
  $('#exProg').hidden = true; $('#exGo').disabled = false;
  if (!dlgEx.open) dlgEx.showModal();
}
$('#exQ').oninput = () => ($('#exQv').textContent = $('#exQ').value);
$('#exFmt').onchange = () => ($('#exQ').disabled = $('#exFmt').value === 'image/png');
$('#exCancel').onclick = () => { S.abort = true; };
$('#exGo').onclick = async (e) => {
  e.preventDefault();
  const it = cur(); if (!it) return;
  S.abort = false; $('#exGo').disabled = true;
  try {
    if (it.kind === 'image') {
      const o = exOpts(), ext = EXT[o.type], name = `${slug(it.name)}_colorlab.${ext}`;
      const handle = await pickSave(name, o.type, ext);
      setProg($('#exProg'), 0.3, 'Rendering full resolution…');
      await new Promise((r) => setTimeout(r, 30));
      const blob = await encodeImage(it, o.type, o.q, o.size || 0);
      await saveBlob(blob, name, handle);
      setProg($('#exProg'), 1, 'Saved ✓');
    } else {
      const name = `${slug(it.name)}_colorlab.webm`;
      const handle = await pickSave(name, 'video/webm', 'webm');
      it.el.pause();
      const blob = await exportVideo(it, (p) => setProg($('#exProg'), p, `Rendering ${Math.round(p * 100)}%`));
      if (!blob) throw new Error('cancelled');
      await saveBlob(blob, name, handle);
      setProg($('#exProg'), 1, 'Saved ✓');
    }
    markStep('exported'); toast('Exported. Your file is saved on your device.');
    setTimeout(() => dlgEx.open && dlgEx.close(), 700);
  } catch (err) {
    $('#exProg').hidden = true;
    if (err && err.name !== 'AbortError' && err.message !== 'cancelled') toast('Export failed: ' + (err.message || err));
  } finally { $('#exGo').disabled = false; S.abort = false; }
};
$('#exportBtn').onclick = openExport;
dlgEx.addEventListener('close', () => (S.abort = true));

$('#snapBtn').onclick = async () => {
  const it = cur(); if (!it) return;
  try {
    const name = `${slug(it.name)}_frame_colorlab.png`;
    const blob = it.kind === 'image' ? await encodeImage(it, 'image/png', 1, 0) : await toBlob(cA, 'image/png');
    await saveBlob(blob, name, null); toast('Frame saved as PNG');
  } catch (e) { toast('Could not save frame'); }
};

/* ---------------- batch ---------------- */
const photos = () => S.items.filter((i) => i.kind === 'image');
function renderBatch() {
  const ul = $('#batchList'); ul.innerHTML = '';
  const ps = photos();
  if (!ps.length) ul.innerHTML = '<li class="muted">No photos yet. Use Import Media on the Home tab. Videos are exported one at a time.</li>';
  ps.forEach((p) => { const li = document.createElement('li'); li.innerHTML = `<img alt="" src="${p.thumb}"><span class="n">${p.name}</span><span class="st" data-id="${p.id}">${p.edited ? 'edited' : 'unedited'}</span>`; ul.appendChild(li); });
  $('#zipAll').disabled = $('#applyAll').disabled = !ps.length;
  $('#folderAll').hidden = !window.showDirectoryPicker;
}
$('#applyAll').onclick = () => { const c = cur(); if (!c) return; photos().forEach((p) => { p.params = E.clone(c.params); p.edited = true; }); updateCounts(); renderBatch(); toast('Current settings applied to every photo'); };
async function batchExport(toFolder) {
  const ps = photos(); if (!ps.length) return;
  const o = exOpts(), ext = EXT[o.type], files = [], used = new Set();
  let dir = null;
  try { if (toFolder) dir = await window.showDirectoryPicker({ mode: 'readwrite' }); } catch (e) { return; }
  const prog = $('#batchProg'); S.abort = false;
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i]; setProg(prog, i / ps.length, `Processing ${i + 1} / ${ps.length}: ${p.name}`);
    await new Promise((r) => setTimeout(r, 20));
    let name = `${slug(p.name)}_colorlab.${ext}`, n = 2; while (used.has(name)) name = `${slug(p.name)}_colorlab_${n++}.${ext}`; used.add(name);
    const blob = await encodeImage(p, o.type, o.q, o.size || 0);
    if (dir) { const fh = await dir.getFileHandle(name, { create: true }); const w = await fh.createWritable(); await w.write(blob); await w.close(); }
    else files.push({ name, data: new Uint8Array(await blob.arrayBuffer()) });
    const st = $(`.st[data-id="${p.id}"]`); if (st) st.textContent = 'done ✓';
  }
  if (!dir) await saveBlob(E.makeZip(files), `dive-colorlab_${new Date().toISOString().slice(0, 10)}.zip`, null);
  setProg(prog, 1, 'Finished ✓'); markStep('exported'); toast(dir ? 'Saved to your folder' : 'ZIP saved to your device');
}
$('#zipAll').onclick = () => batchExport(false);
$('#folderAll').onclick = () => batchExport(true);

/* ---------------- projects ---------------- */
$('#projectsBtn').onclick = () => $('#dlgProj').showModal();
$('#projSave').onclick = async () => {
  const data = { app: 'dive-colorlab', version: 1, items: S.items.map((i) => ({ name: i.name, kind: i.kind, w: i.w, h: i.h, params: i.params })), presets: userPresets() };
  await saveBlob(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }), 'dive-colorlab-project.json', null);
  toast('Project file saved');
};
$('#projOpen').onclick = () => $('#projInput').click();
$('#projInput').onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const d = JSON.parse(await f.text()); if (d.app !== 'dive-colorlab') throw 0;
    let n = 0; d.items.forEach((x) => { const m = S.items.find((i) => i.name === x.name && i.kind === x.kind); if (m) { m.params = Object.assign(E.neutralParams(), x.params); m.edited = true; n++; } });
    if (Array.isArray(d.presets) && d.presets.length) { const l = userPresets(); d.presets.forEach((p) => !l.some((q) => q.name === p.name) && l.push(p)); safeLS.set('dcl.presets', l); renderPresets(); }
    syncUI(); requestRender(); updateCounts(); $('#dlgProj').close(); toast(n ? `Settings restored for ${n} file(s)` : 'No matching files are open. Import the same files first.');
  } catch (err) { toast('That is not a valid Dive ColorLab project file'); }
};

/* ---------------- help ---------------- */
$('#helpBtn').onclick = () => $('#dlgHelp').showModal();
$('#credits').innerHTML = CREDITS.map(([n, a, u]) => `<li>${n}: ${a}${u ? ` – <a href="${u}" target="_blank" rel="noopener">source</a>` : ''}</li>`).join('');
$$('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d && d !== dlgEx) d.close(); }));

/* ---------------- import: picker + drag & drop ---------------- */
$('#importBtn').onclick = () => $('#fileInput').click();
$('#fileInput').onchange = (e) => { addFiles(e.target.files); e.target.value = ''; };
let dragDepth = 0;
const hasFiles = (e) => e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
window.addEventListener('dragenter', (e) => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth++; $('#dropveil').hidden = false; });
window.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
window.addEventListener('dragleave', (e) => { if (!hasFiles(e)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $('#dropveil').hidden = true; });
window.addEventListener('drop', (e) => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth = 0; $('#dropveil').hidden = true; setView('home'); addFiles(e.dataTransfer.files); });
// open files handed over by the OS (installed PWA / file handlers), when supported
if ('launchQueue' in window) window.launchQueue.setConsumer(async (p) => { const fs = []; for (const h of p.files || []) fs.push(await h.getFile()); addFiles(fs); });

/* ---------------- boot ---------------- */
buildControls(); buildWheels(); buildHSL(); buildQuick(); renderPresets(); updateCounts(); updateSteps();
(async function boot() {
  busy('Loading sample reef…');
  try {
    const first = SAMPLES[0];
    S.items.push(await loadImageItem(`assets/${first.key}.jpg`, first.name, { sample: true }));
    await selectItem(0);
    for (const s of SAMPLES.slice(1)) { try { S.items.push(await loadImageItem(`assets/${s.key}.jpg`, s.name, { sample: true })); } catch (e) {} renderFilm(); }
  } catch (e) { busy(); $('#empty').hidden = false; cmp.hidden = true; }
  busy(); updateCounts();
})();
window.addEventListener('keydown', (e) => { if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement.tagName) && cur() && cur().kind === 'video') { e.preventDefault(); playBtn.click(); } });
})();
