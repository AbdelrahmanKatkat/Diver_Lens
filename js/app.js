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
  rotl: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5', rotr: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5',
  flipH: 'M12 3v18M9 7l-5 5 5 5zM15 7l5 5-5 5z', flipV: 'M3 12h18M7 9l5-5 5 5zM7 15l5 5 5-5z',
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

/* ---------------- geometry & clip edits (crop / rotate / flip / trim / speed / fades) ---------------- */
const defaultEdit = () => ({ crop: { x: 0, y: 0, w: 1, h: 1 }, rot: 0, fx: false, fy: false, aspect: 'free', tIn: 0, tOut: null, speed: 1, fadeIn: 0, fadeOut: 0, mute: false });
const normRot = (r) => ((Math.round(r / 90) * 90) % 360 + 360) % 360;
const isIdentity = (e) => e.crop.x < 1e-4 && e.crop.y < 1e-4 && e.crop.w > 0.9999 && e.crop.h > 0.9999 && !normRot(e.rot) && !e.fx && !e.fy;
const geoKey = (e) => `${e.crop.x.toFixed(4)},${e.crop.y.toFixed(4)},${e.crop.w.toFixed(4)},${e.crop.h.toFixed(4)},${normRot(e.rot)},${+e.fx},${+e.fy}`;
// rotated (uncropped) size rw x rh and cropped output size ow x oh for a source of sw x sh
function sanitizeEdit(s) {
  const e = defaultEdit(), n = (v, lo, hi, d) => (typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
  if (!s || typeof s !== 'object') return e;
  const c = s.crop || {};
  const w = n(c.w, 0.02, 1, 1), h = n(c.h, 0.02, 1, 1);
  e.crop = { x: n(c.x, 0, 1 - w, 0), y: n(c.y, 0, 1 - h, 0), w, h };
  e.rot = n(s.rot, -360, 360, 0); e.fx = s.fx === true; e.fy = s.fy === true;
  e.aspect = typeof s.aspect === 'string' ? s.aspect.slice(0, 8) : 'free';
  e.tIn = n(s.tIn, 0, 1e6, 0); e.tOut = s.tOut == null ? null : n(s.tOut, 0, 1e6, null);
  e.speed = n(s.speed, 0.25, 4, 1); e.fadeIn = n(s.fadeIn, 0, 60, 0); e.fadeOut = n(s.fadeOut, 0, 60, 0); e.mute = s.mute === true;
  return e;
}
function outDims(e, sw, sh) {
  const swap = normRot(e.rot) % 180 !== 0, rw = swap ? sh : sw, rh = swap ? sw : sh;
  return { rw, rh, ow: Math.max(2, Math.round(e.crop.w * rw)), oh: Math.max(2, Math.round(e.crop.h * rh)) };
}
// draw `src` (sw x sh) onto ctx (ow x oh) with rotation, flip (applied after rotation) and crop
function drawGeo(ctx, src, sw, sh, e, ow, oh) {
  const { rw, rh } = outDims(e, sw, sh);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ow, oh);
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(ow / (e.crop.w * rw), oh / (e.crop.h * rh));
  ctx.translate(-e.crop.x * rw, -e.crop.y * rh);
  ctx.translate(rw / 2, rh / 2);
  ctx.scale(e.fx ? -1 : 1, e.fy ? -1 : 1);
  ctx.rotate(normRot(e.rot) * Math.PI / 180);
  ctx.drawImage(src, -sw / 2, -sh / 2, sw, sh);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
// clip length read live from the element (some files report it late or only roughly when first opened)
function clipLen(it) {
  const d = it.el.duration; if (isFinite(d) && d > 0) return d;
  try { const s = it.el.seekable; if (s && s.length) return s.end(s.length - 1); } catch (e) { /* not seekable yet */ }
  return it.duration || 0;
}
// duration of a separate export element; falls back to what the loaded clip reported, and refuses to run on an unknown length
function srcDuration(v, it) {
  let d = v.duration;
  if (!(isFinite(d) && d > 0)) { try { const s = v.seekable; if (s && s.length) d = s.end(s.length - 1); } catch (e) {} }
  if (!(isFinite(d) && d > 0)) d = clipLen(it);
  if (!(isFinite(d) && d > 0)) throw new Error('could not read the length of this video');
  return d;
}
const trimOf = (it) => { const D = clipLen(it), a = Math.min(it.edit.tIn || 0, D), b = Math.min(D, it.edit.tOut == null ? D : it.edit.tOut); return { a, b: Math.max(a + 0.05, b) }; };
// 0..1 brightness factor for fade in / out at output time t of a clip D seconds long
const fadeAt = (e, t, D) => Math.max(0, Math.min(1, e.fadeIn > 0 ? t / e.fadeIn : 1, e.fadeOut > 0 ? (D - t) / e.fadeOut : 1));
// size to process at: about `base` px on the long edge of the *output*, at most `cap` px on the source
function procDims(it, e, base, cap) {
  const d = outDims(e, it.w, it.h), sc = Math.min(1, base / Math.max(d.ow, d.oh), cap / Math.max(it.w, it.h));
  return { w: Math.max(2, Math.round(it.w * sc)), h: Math.max(2, Math.round(it.h * sc)) };
}

/* ---------------- elements ---------------- */
const stage = $('#stage'), cmp = $('#cmp'), cB = $('#cBefore'), cA = $('#cAfter');
const xB = cB.getContext('2d'), xA = cA.getContext('2d');
const handle = $('#handle'), playBtn = $('#playBtn'), seek = $('#seek'), timeTxt = $('#timeTxt');
const toastEl = $('#toast');

let toastT;
function toast(msg, label, fn) {
  toastEl.textContent = msg; toastEl.classList.toggle('act', !!label);
  if (label) { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.onclick = () => { toastEl.classList.remove('on'); fn(); }; toastEl.appendChild(b); }
  toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), label ? 9000 : 3200);
}
function busy(msg) { const b = $('#busy'); if (msg) { $('#busyTxt').textContent = msg; b.hidden = false; } else b.hidden = true; }
const safeLS = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
  // small thumbnail for the filmstrip, so many big photos do not keep full-size copies on screen
  let thumb = src;
  try { const tw = 240, th = Math.max(1, Math.round(240 * img.naturalHeight / img.naturalWidth)), tc = document.createElement('canvas'); tc.width = tw; tc.height = th; tc.getContext('2d').drawImage(img, 0, 0, tw, th); thumb = tc.toDataURL('image/jpeg', 0.75); } catch (e) { /* keep the full image */ }
  return { id: S.uid++, kind: 'image', name, url: src, thumb, el: img, w: img.naturalWidth, h: img.naturalHeight, params: E.defaultParams(), edit: defaultEdit(), edited: false, ...extra };
}
async function loadVideoItem(src, name) {
  const v = document.createElement('video');
  v.playsInline = true; v.preload = 'auto'; v.loop = false; v.src = src; v.crossOrigin = 'anonymous';
  Object.assign(v.style, { position: 'fixed', left: '-9999px', width: '2px', height: '2px', opacity: '0', pointerEvents: 'none' });
  document.body.appendChild(v);
  try { await once(v, 'loadeddata'); } catch (e) { v.remove(); throw e; }   // do not leave a dead element behind
  const item = { id: S.uid++, kind: 'video', name, url: src, el: v, w: v.videoWidth, h: v.videoHeight, duration: v.duration, params: E.defaultParams(), edit: defaultEdit(), edited: false };
  // thumbnail from an early frame; colour statistics from frames spread over the whole clip (tiled into one reference), so a clip that
  // goes from dark water to a bright shaft or reef is corrected for the whole clip, not for one early frame
  const D0 = isFinite(v.duration) && v.duration > 0 ? v.duration : 1;
  v.currentTime = Math.min(1, D0 * 0.1);
  await once(v, 'seeked');
  const t = document.createElement('canvas'); t.width = 240; t.height = Math.round(240 * item.h / item.w);
  t.getContext('2d').drawImage(v, 0, 0, t.width, t.height);
  item.thumb = t.toDataURL('image/jpeg', 0.7);
  const NREF = D0 < 1.5 ? 1 : 6, cols = Math.min(3, NREF), rows = Math.ceil(NREF / cols);
  const tile = Math.max(2, Math.round(Math.min(item.w, WORK_VID) / cols)), tileH = Math.max(2, Math.round(tile * item.h / item.w));
  const mc = document.createElement('canvas'); mc.width = tile * cols; mc.height = tileH * rows;
  const mx = mc.getContext('2d', { willReadFrequently: true });
  for (let i = 0; i < NREF; i++) {
    const ti = NREF === 1 ? Math.min(1, D0 * 0.1) : Math.min(D0 - 0.05, D0 * (0.03 + 0.94 * i / (NREF - 1)));
    try { if (Math.abs(v.currentTime - ti) > 0.02) { v.currentTime = ti; await once(v, 'seeked'); } } catch (e) { /* keep what we have */ }
    mx.drawImage(v, (i % cols) * tile, Math.floor(i / cols) * tileH, tile, tileH);
  }
  item.st = E.computeStats(mx.getImageData(0, 0, mc.width, mc.height).data, mc.width, mc.height, { video: true });
  v.currentTime = 0;
  v.addEventListener('durationchange', () => { if (isFinite(v.duration) && v.duration > 0) { item.duration = v.duration; if (cur() === item) { updateTime(); if (refs.e_tIn) { refs.e_tIn(); refs.e_tOut(); } } } });
  v.addEventListener('timeupdate', () => { if (cur() === item) { if (!v.paused && v.currentTime >= trimOf(item).b) v.pause(); updateTime(); } });
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
      item.file = f; item.saved = loadSaved(item);
      S.items.push(item);
      if (first < 0) first = S.items.length - 1;
      ok++;
    } catch (e) { bad.push(f.name); }
  }
  busy();
  if (bad.length) toast(`Your browser can't open: ${bad.slice(0, 3).join(', ')}${bad.length > 3 ? '…' : ''}.${bad.some((n) => /\.(mov|mp4|m4v|mkv)$/i.test(n)) ? ' Phone and action-camera video is often H.265 (HEVC); convert it to H.264 or use a browser with HEVC support (Safari, or Edge with the HEVC extension).' : ''}`);
  if (ok) { S.steps.imported = true; if (S.filter) S.filter = null; renderFilm(); toast(`Opened ${ok} file${ok > 1 ? 's' : ''} locally. Nothing was uploaded.`); await selectItem(first); }
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
  if (item.depthMap && window.Depth) item.st.depth = Depth.resample(item.depthMap, item.st.tw, item.st.th);
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
  const mid = document.createElement('canvas'), midx = mid.getContext('2d');   // CPU-path result before crop / rotate
  if (it.kind === 'image') {
    S.work = prepare(it);
    mid.width = S.work.w; mid.height = S.work.h; Object.assign(S.work, { mid, midx });
  } else {
    const sc = Math.min(1, WORK_VID / Math.max(it.w, it.h)), w = Math.round(it.w * sc), h = Math.round(it.h * sc);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    mid.width = w; mid.height = h;
    S.work = { w, h, c, x, out: x.createImageData(w, h), mid, midx };
  }
  S.beforeKey = '';
  if (!it.inited) { it.inited = true; it.params = Object.assign(E.neutralParams(), E.autoParams(it.st)); it.autoAmt = 100; }
  commitNow(); hist(it); updateUndoBtns();
  busy();
  $('#playbar').classList.toggle('photo', it.kind === 'image');
  setIcon($('svg', playBtn), 'play');
  if (it.kind === 'video') applyVideoPrefs(it);
  setIcon($('#muteBtn svg'), it.kind === 'video' && it.el.muted ? 'mute' : 'volume');
  updateTime();
  syncUI(); renderFilm(); updateCropMode(true); render(); fit();
  $('#exName').textContent = it.name;
  renderPresets(); resetZoom();
  if (it.saved && !it.askedRestore) { it.askedRestore = true; toast('You edited this file before.', 'Restore', () => restoreSaved(it)); }
}
function applyVideoPrefs(it) {
  const v = it.el; v.playbackRate = it.edit.speed || 1;
  try { v.preservesPitch = false; v.mozPreservesPitch = false; v.webkitPreservesPitch = false; } catch (e) {}   // matches the exported audio
  v.muted = !!(it.edit.mute || it.userMuted);
}

function requestRender() { if (S.raf) return; S.raf = requestAnimationFrame(() => { S.raf = 0; render(); }); }
let glr, glx;   // preview renderer / export renderer (WebGL2); null = CPU fallback
const getGL = () => (glr === undefined ? (glr = GLR.create()) : glr);
// after a GPU error (for example a lost context) draw this frame on the CPU and try a fresh renderer, at most three times
let gpuFails = 0;
function gpuFailed() { try { glr && glr.dispose(); } catch (e) {} glr = ++gpuFails > 3 ? null : undefined; }
const getExportGL =() => (glx === undefined ? (glx = GLR.create()) : glx);
function render() {
  const it = cur(); if (!it || !S.work) return;
  if (it.kind === 'video') { drawVideoFrame(); return; }
  if (!S.work.src) return;
  const { w, h, src, out } = S.work, e = geoOf(it);
  const g = getGL();
  if (g) {
    try {
      const pd = procDims(it, e, WORK_IMG, 3000);
      if (g.srcItem !== it) { g.upload(it.el); g.srcItem = it; }
      g.setSize(pd.w, pd.h); g.render(it.params, it.st, E.getLevels(it.params, it.st, src, w, h));
      present(it, g.canvas, pd.w, pd.h, e); return;
    } catch (err) { console.warn('GPU render failed, using CPU', err); gpuFailed(); }
  }
  E.process(src, out.data, w, h, it.params, it.st);
  S.work.midx.putImageData(out, 0, 0);
  present(it, S.work.mid, w, h, e);
}
// the picture being edited: while the Crop tab is open the whole (rotated) frame is shown so the crop frame can be dragged on it
const geoOf = (it) => (S.cropMode && it === cur() ? { ...it.edit, crop: { x: 0, y: 0, w: 1, h: 1 } } : it.edit);
// put a processed frame on the preview canvases (cropped / rotated / flipped); "before" is the untouched original through the same geometry
function present(it, pcv, sw, sh, e) {
  const o = outDims(e, sw, sh);
  if (cA.width !== o.ow || cA.height !== o.oh) { cA.width = cB.width = o.ow; cA.height = cB.height = o.oh; S.beforeKey = ''; fit(); }
  drawGeo(xA, pcv, sw, sh, e, o.ow, o.oh);
  histSoon();
  if (it.kind === 'video') drawGeo(xB, it.el, it.w, it.h, e, o.ow, o.oh);
  else { const k = it.id + '|' + geoKey(e) + '|' + o.ow; if (S.beforeKey !== k) { drawGeo(xB, it.el, it.w, it.h, e, o.ow, o.oh); S.beforeKey = k; } }
}
function drawVideoFrame() {
  const it = cur(); if (!it || it.kind !== 'video' || !S.work || !S.work.x) return;
  const { w, h, x, out } = S.work, e = geoOf(it);
  if (it.el.readyState < 2) return;
  const g = getGL();
  let ok = false;
  if (g) {
    try {
      const pd = procDims(it, e, WORK_VID, 2000);
      g.setSize(pd.w, pd.h); g.upload(it.el); g.srcItem = it;
      g.render(it.params, it.st, E.getLevels(it.params, it.st, null, 0, 0));
      present(it, g.canvas, pd.w, pd.h, e); ok = true;
    } catch (err) { console.warn('GPU render failed, using CPU', err); gpuFailed(); }
  }
  if (!ok) {
    x.drawImage(it.el, 0, 0, w, h);
    const id = x.getImageData(0, 0, w, h);
    E.process(id.data, out.data, w, h, it.params, it.st);
    S.work.midx.putImageData(out, 0, 0);
    present(it, S.work.mid, w, h, e);
  }
  if (!S.cropMode && (it.edit.fadeIn > 0 || it.edit.fadeOut > 0)) {   // preview the fades
    const t = Math.max(0, (it.el.currentTime - it.edit.tIn) / it.edit.speed), tb = trimOf(it), f = fadeAt(it.edit, t, (tb.b - tb.a) / it.edit.speed);
    if (f < 1) { xA.fillStyle = `rgba(0,0,0,${1 - f})`; xA.fillRect(0, 0, cA.width, cA.height); }
  }
}
function videoLoop() {
  const it = cur(); if (!it || it.kind !== 'video') return;
  const v = it.el;
  const step = () => {
    if (cur() !== it || v.paused || v.ended) return;
    if (v.currentTime >= trimOf(it).b) { v.pause(); drawVideoFrame(); updateTime(); return; }
    try { drawVideoFrame(); } catch (e) { console.warn('frame draw failed', e); }   // one bad frame must not stop the preview
    if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(step); else requestAnimationFrame(step);
  };
  step();
}

/* ---------------- stage layout / compare ---------------- */
function fit() {
  if (!S.work || !cA.width) return;
  const r = stage.getBoundingClientRect();
  let ar = cA.width / cA.height; if (S.mode === 'side' && !S.cropMode) ar *= 2;
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
  const { a, b } = trimOf(it), rel = clamp(it.el.currentTime - a, 0, b - a), sp = it.edit.speed || 1;   // the bar shows the trimmed clip
  timeTxt.textContent = `${fmt(rel / sp)} / ${fmt((b - a) / sp)}`;
  const v = (rel / (b - a)) * 1000; seek.value = v; seek.style.setProperty('--v', v / 10 + '%');
}
playBtn.onclick = () => {
  const it = cur(); if (!it || it.kind !== 'video') return;
  if (!it.el.paused) { it.el.pause(); return; }
  const { a, b } = trimOf(it); if (it.el.currentTime >= b - 0.05 || it.el.currentTime < a - 0.05) it.el.currentTime = a;
  it.el.play();
};
seek.oninput = () => { const it = cur(); if (it && it.kind === 'video') { const { a, b } = trimOf(it), t = a + (seek.value / 1000) * (b - a); if (isFinite(t)) it.el.currentTime = t; } };
$('#muteBtn').onclick = () => { const it = cur(); if (it && it.kind === 'video') { it.userMuted = !it.userMuted; applyVideoPrefs(it); setIcon($('#muteBtn svg'), it.el.muted ? 'mute' : 'volume'); } };
$('#fsBtn').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else if (stage.requestFullscreen) stage.requestFullscreen(); };
document.addEventListener('fullscreenchange', () => setTimeout(fit, 50));

/* ---------------- filmstrip & counts ---------------- */
function renderFilm() {
  const strip = $('#film'); strip.innerHTML = '';
  S.items.forEach((it, i) => {
    if (S.filter && it.kind !== S.filter) return;
    const b = document.createElement('div');
    b.className = 'th' + (i === S.cur ? ' on' : '');
    b.innerHTML = `<img alt="" src="${it.thumb}"><span class="k">${it.kind === 'video' ? 'Video' : it.sample ? esc(it.name) : 'Photo'}</span><button class="open" aria-label="Open ${esc(it.name)}"${i === S.cur ? ' aria-current="true"' : ''}></button>${it.sample ? '' : `<button class="x" aria-label="Remove ${esc(it.name)}">${icon('x')}</button>`}`;
    b.onclick = (e) => { if (e.target.closest('.x')) { removeItem(i); return; } selectItem(i); };
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
  chan: [
    { k: 'gainR', l: 'Red gain', min: -100, max: 100, tr: 'linear-gradient(90deg,#222,#ff4a4a)' },
    { k: 'gainG', l: 'Green gain', min: -100, max: 100, tr: 'linear-gradient(90deg,#222,#3bff7a)' },
    { k: 'gainB', l: 'Blue gain', min: -100, max: 100, tr: 'linear-gradient(90deg,#222,#4a8dff)' },
  ],
  adv: [
    { k: 'redRecover', l: 'Red recov.', min: 0, max: 100 },
    { k: 'clarity', l: 'Clarity', min: -100, max: 100 },
    { k: 'castAmt', l: 'Red comp.', min: 0, max: 100 },
    { k: 'levels', l: 'Auto levels', min: 0, max: 100 },
    { k: 'dehazeAmt', l: 'Dehaze', min: 0, max: 100 },
    { k: 'backAmt', l: 'Backscatter', min: 0, max: 100 },
    { k: 'noiseAmt', l: 'Noise red.', min: 0, max: 100 },
  ],
};
const TOGGLES = [
  { k: 'cast', l: 'Remove Color Cast (Blue/Green)', i: 'drop' },
  { k: 'dehaze', l: 'Dehaze / Clarity', i: 'cloud' },
  { k: 'backscatter', l: 'Backscatter Reduction', i: 'wave' },
  { k: 'skin', l: 'Protect Skin Tones', i: 'drop' },
  { k: 'noise', l: 'Noise Reduction', i: 'sliders' },
];
const showVal = (v, dec = 0) => (v > 0 ? '+' : '') + (dec ? v.toFixed(dec) : Math.round(v));
const refs = {};

function slider(def, get, set, container) {
  const row = document.createElement('div'); row.className = 'sl';
  const id = 'sl_' + Math.random().toString(36).slice(2, 8);
  row.innerHTML = `<label for="${id}" title="Double-click to reset">${def.l}</label><input id="${id}" type="range" min="${def.min}" max="${def.max}" step="${def.step || 1}"><input type="text" inputmode="decimal" aria-label="${def.l} value">`;
  const [lab, rng, num] = [row.children[0], row.children[1], row.children[2]];
  const mx = () => (typeof def.max === 'function' ? def.max() : def.max), sv = (v) => (def.fmt ? def.fmt(v) : showVal(v, def.dec));
  if (def.tr) rng.style.setProperty('--tr', def.tr);
  rng.oninput = () => { const v = +rng.value; num.value = sv(v); set(v); };
  num.onchange = () => { const v = clamp(parseFloat(num.value) || 0, def.min, mx()); rng.value = v; num.value = sv(v); set(v); };
  lab.ondblclick = () => { const v = def.reset !== undefined ? (typeof def.reset === 'function' ? def.reset() : def.reset) : def.min < 0 ? 0 : (E.neutralParams()[def.k] ?? 0); rng.value = v; num.value = sv(v); set(v); };
  const rb = document.createElement('button'); rb.type = 'button'; rb.className = 'rs'; rb.title = 'Reset'; rb.setAttribute('aria-label', 'Reset ' + def.l); rb.textContent = '\u21ba'; rb.onclick = (e) => { e.preventDefault(); lab.ondblclick(); }; lab.appendChild(rb);
  container.appendChild(row);
  return () => { rng.max = mx(); const v = get(); rng.value = v; num.value = sv(v); };
}
const TOOL_OF = { castAmt: 'cast', dehazeAmt: 'dehaze', backAmt: 'backscatter', noiseAmt: 'noise' };
function paramSet(k) {
  return (v) => {
    const p = cur().params; p[k] = v;
    if (TOOL_OF[k] && v > 0 && !p[TOOL_OF[k]]) { p[TOOL_OF[k]] = true; refs['t_' + TOOL_OF[k]](); }   // moving a strength slider switches its tool on
    changed();
  };
}
function changed() {
  const it = cur(); if (!it) return;
  it.edited = true; S.quick = null; $$('#quick button').forEach((b) => b.classList.remove('on'));
  markStep('corrected'); updateCounts(); requestRender(); drawCurve(); commit();
}

function buildControls() {
  [['wb', '#sl-wb'], ['chan', '#sl-chan'], ['tone', '#sl-tone'], ['adv', '#sl-adv']].forEach(([g, sel]) => {
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

/* ---------------- crop / rotate / flip, trim / speed / fades ---------------- */
const cropUI = $('#cropUI'), cropRect = $('#cropRect');
function updateCropMode(noRender) {
  const on = S.rt === 'crop' && !!cur();
  const was = !!S.cropMode; S.cropMode = on;
  cmp.classList.toggle('cropping', on); cropUI.hidden = !on;
  if (on) placeCrop();
  if (was !== on && !noRender) { S.beforeKey = ''; render(); fit(); }
}
function placeCrop() {
  const it = cur(); if (!it) return;
  const c = it.edit.crop, d = outDims(it.edit, it.w, it.h);
  Object.assign(cropRect.style, { left: c.x * 100 + '%', top: c.y * 100 + '%', width: c.w * 100 + '%', height: c.h * 100 + '%' });
  $('#cropInfo').textContent = `Output: ${Math.round(c.w * d.rw)} × ${Math.round(c.h * d.rh)} px`;
}
const aspectVal = (e, rw, rh) => (e.aspect === 'free' ? null : e.aspect === 'orig' ? rw / rh : +e.aspect);
function editTouched() { const it = cur(); it.edited = true; markStep('corrected'); updateCounts(); saveEdit(it); }
function setCrop(c) { cur().edit.crop = c; placeCrop(); editTouched(); }
function computeCrop(c, h, dx, dy) {
  const it = cur(), e = it.edit, { rw, rh } = outDims(e, it.w, it.h), MIN = 0.04, A = aspectVal(e, rw, rh);
  if (h === 'move') return { x: clamp(c.x + dx, 0, 1 - c.w), y: clamp(c.y + dy, 0, 1 - c.h), w: c.w, h: c.h };
  let l = c.x, t = c.y, r = c.x + c.w, b = c.y + c.h;
  if (h.includes('w')) l = clamp(c.x + dx, 0, r - MIN);
  if (h.includes('e')) r = clamp(c.x + c.w + dx, l + MIN, 1);
  if (h.includes('n')) t = clamp(c.y + dy, 0, b - MIN);
  if (h.includes('s')) b = clamp(c.y + c.h + dy, t + MIN, 1);
  if (A) {   // keep the chosen aspect ratio
    const q = A * rh / rw, H = /[we]/.test(h), V = /[ns]/.test(h), gx = h.includes('w') ? -1 : 1, gy = h.includes('n') ? -1 : 1;
    const ax = gx < 0 ? r : l, ay = gy < 0 ? b : t, cx = (l + r) / 2, cy = (t + b) / 2;
    let w = r - l, hh = b - t;
    if (V && !H) w = hh * q; else hh = w / q;
    const maxW = H ? (gx < 0 ? ax : 1 - ax) : 2 * Math.min(cx, 1 - cx), maxH = V ? (gy < 0 ? ay : 1 - ay) : 2 * Math.min(cy, 1 - cy);
    w = Math.max(MIN, Math.min(w, maxW, maxH * q)); hh = w / q;
    if (H) { if (gx < 0) { r = ax; l = ax - w; } else { l = ax; r = ax + w; } } else { l = cx - w / 2; r = cx + w / 2; }
    if (V) { if (gy < 0) { b = ay; t = ay - hh; } else { t = ay; b = ay + hh; } } else { t = cy - hh / 2; b = cy + hh / 2; }
  }
  return { x: l, y: t, w: r - l, h: b - t };
}
let cd = null;
cropUI.addEventListener('pointerdown', (ev) => ev.stopPropagation());
cropRect.addEventListener('pointerdown', (ev) => {
  const it = cur(); if (!it) return;
  cd = { h: ev.target.dataset.h || 'move', x: ev.clientX, y: ev.clientY, r: cmp.getBoundingClientRect(), c: { ...it.edit.crop } };
  cropRect.setPointerCapture(ev.pointerId); ev.preventDefault();
});
cropRect.addEventListener('pointermove', (ev) => { if (cd) setCrop(computeCrop(cd.c, cd.h, (ev.clientX - cd.x) / cd.r.width, (ev.clientY - cd.y) / cd.r.height)); });
['pointerup', 'pointercancel'].forEach((n) => cropRect.addEventListener(n, () => (cd = null)));
function applyAspect() {   // fit the chosen ratio inside the current crop, around its centre
  const it = cur(); if (!it) return;
  const e = it.edit, c = e.crop, { rw, rh } = outDims(e, it.w, it.h), A = aspectVal(e, rw, rh);
  if (A) {
    let wp = c.w * rw, hp = c.h * rh; if (wp / hp > A) wp = hp * A; else hp = wp / A;
    const w = wp / rw, h = hp / rh, cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    setCrop({ x: clamp(cx - w / 2, 0, 1 - w), y: clamp(cy - h / 2, 0, 1 - h), w, h });
  }
  refs.e_misc();
}
function geoChanged() { const it = cur(); S.beforeKey = ''; placeCrop(); editTouched(); render(); fit(); }
function rotate(dir) {   // the picture turns, flips swap axes, and the crop frame turns with it
  const it = cur(); if (!it) return; const e = it.edit, c = e.crop;
  e.rot = normRot(e.rot + dir * 90); [e.fx, e.fy] = [e.fy, e.fx];
  e.crop = dir > 0 ? { x: 1 - (c.y + c.h), y: c.x, w: c.h, h: c.w } : { x: c.y, y: 1 - (c.x + c.w), w: c.h, h: c.w };
  geoChanged();
}
function flip(axis) {
  const it = cur(); if (!it) return; const e = it.edit, c = e.crop;
  if (axis === 'x') { e.fx = !e.fx; e.crop = { ...c, x: 1 - (c.x + c.w) }; } else { e.fy = !e.fy; e.crop = { ...c, y: 1 - (c.y + c.h) }; }
  geoChanged();
}
function buildEditUI() {
  $$('#aspSeg button').forEach((b) => (b.onclick = () => { const it = cur(); if (!it) return; const a = b.dataset.a; it.edit.aspect = a === 'free' || a === 'orig' ? a : +a; applyAspect(); }));
  $('#rotL').onclick = () => rotate(-1); $('#rotR').onclick = () => rotate(1);
  $('#flipH').onclick = () => flip('x'); $('#flipV').onclick = () => flip('y');
  $('#cropReset').onclick = () => { const it = cur(); if (!it) return; const e = it.edit; Object.assign(e, { crop: { x: 0, y: 0, w: 1, h: 1 }, rot: 0, fx: false, fy: false, aspect: 'free' }); refs.e_misc(); geoChanged(); };
  const dur = () => (cur() && cur().duration) || 1, E_ = () => cur().edit;
  const tgo = (t) => { const it = cur(); it.el.currentTime = t; };
  const trimChanged = () => { editTouched(); updateTime(); };
  refs.e_tIn = slider({ k: 'tIn', l: 'Start', min: 0, max: dur, step: 0.01, fmt: (v) => v.toFixed(2), reset: 0 },
    () => E_().tIn || 0,
    (v) => { const e = E_(), end = e.tOut == null ? dur() : e.tOut; e.tIn = Math.min(v, end - 0.1); refs.e_tIn(); tgo(e.tIn); trimChanged(); }, $('#sl-trim'));
  refs.e_tOut = slider({ k: 'tOut', l: 'End', min: 0, max: dur, step: 0.01, fmt: (v) => v.toFixed(2), reset: dur },
    () => (E_().tOut == null ? dur() : E_().tOut),
    (v) => { const e = E_(); e.tOut = Math.max(v, e.tIn + 0.1); if (e.tOut >= dur() - 0.005) e.tOut = null; refs.e_tOut(); tgo(Math.max(e.tIn, (e.tOut == null ? dur() : e.tOut) - 0.05)); trimChanged(); }, $('#sl-trim'));
  $('#setIn').onclick = () => { const it = cur(), e = it.edit, t = Math.min(it.el.currentTime, (e.tOut == null ? dur() : e.tOut) - 0.1); e.tIn = Math.max(0, t); refs.e_tIn(); trimChanged(); };
  $('#setOut').onclick = () => { const it = cur(), e = it.edit, t = Math.max(it.el.currentTime, e.tIn + 0.1); e.tOut = t >= dur() - 0.005 ? null : t; refs.e_tOut(); trimChanged(); };
  refs.e_fi = slider({ k: 'fadeIn', l: 'Fade in', min: 0, max: 3, step: 0.1, fmt: (v) => v.toFixed(1), reset: 0 }, () => E_().fadeIn, (v) => { E_().fadeIn = v; editTouched(); drawVideoFrame(); }, $('#sl-fade'));
  refs.e_fo = slider({ k: 'fadeOut', l: 'Fade out', min: 0, max: 3, step: 0.1, fmt: (v) => v.toFixed(1), reset: 0 }, () => E_().fadeOut, (v) => { E_().fadeOut = v; editTouched(); drawVideoFrame(); }, $('#sl-fade'));
  $$('#spdSeg button').forEach((b) => (b.onclick = () => { const it = cur(); if (!it) return; it.edit.speed = +b.dataset.s; applyVideoPrefs(it); refs.e_misc(); editTouched(); updateTime(); }));
  const swm = $('#swMute'), flipMute = () => { const it = cur(); if (!it) return; it.edit.mute = !it.edit.mute; applyVideoPrefs(it); refs.e_misc(); editTouched(); setIcon($('#muteBtn svg'), it.el.muted ? 'mute' : 'volume'); };
  swm.onclick = flipMute; $('#tgMute').onclick = (ev) => { if (ev.target !== swm) flipMute(); };
  refs.e_misc = () => {
    const it = cur(); if (!it) return; const e = it.edit;
    $('#vidEdit').hidden = it.kind !== 'video';
    $$('#aspSeg button').forEach((b) => b.classList.toggle('on', b.dataset.a === String(e.aspect)));
    $$('#spdSeg button').forEach((b) => b.classList.toggle('on', +b.dataset.s === e.speed));
    swm.setAttribute('aria-checked', !!e.mute);
    if (S.cropMode) placeCrop();
  };
}

/* ---------------- quick actions & presets ---------------- */
const QUICK = [
  { n: 'Auto Enhance', i: 'wand', f: (it) => ({ ...E.neutralParams(), ...E.autoParams(it.st) }) },
  { n: 'Color Restore', i: 'drop', f: () => ({ cast: true, castAmt: 100, levels: 80, vibrance: 20 }) },
  { n: 'Remove Haze', i: 'cloud', f: () => ({ dehaze: true, dehazeAmt: 65, backscatter: true, backAmt: 40, clarity: 12 }) },
  { n: 'Dehaze + Contrast', i: 'alert', f: () => ({ dehaze: true, dehazeAmt: 55, contrast: 28, clarity: 22, shadows: 10 }) },
  { n: 'Underwater WB', i: 'pipette', f: () => ({ cast: true, castAmt: 100, levels: 70, temp: 0, tint: 0 }) },
  { n: 'Denoise', i: 'wave', f: () => ({ noise: true, noiseAmt: 60 }) },
];
function applyPatch(patch) {
  const it = cur(); if (!it) { toast('Open a photo or video first'); return; }
  Object.assign(it.params, JSON.parse(JSON.stringify(patch)));
  syncUI(); requestRender(); it.edited = true; markStep('corrected'); updateCounts(); commit();
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
  $('#autoWB').onclick = () => { applyPatch({ cast: true, castAmt: 100, levels: 70, temp: 0, tint: 0 }); toast('Underwater white balance applied'); };
}

const BUILTIN = [
  { n: 'Tropical Reef', d: 'Warm, punchy shallow reef', g: 'linear-gradient(90deg,#19c3ff,#ffd21f,#ff5a8a)', p: { cast: true, castAmt: 70, levels: 50, temp: 12, vibrance: 40, saturation: 14, contrast: 16, dehaze: true, dehazeAmt: 35 } },
  { n: 'Blue Water', d: 'Remove deep-blue cast', g: 'linear-gradient(90deg,#0b3d91,#19c3ff,#ffb02a)', p: { cast: true, castAmt: 90, levels: 60, temp: 10, tint: 0, contrast: 12, dehaze: true, dehazeAmt: 45, shadows: 18, vibrance: 28 } },
  { n: 'Green Water', d: 'Lakes, cenotes, quarries', g: 'linear-gradient(90deg,#1c6b3a,#7be37b,#d9b3ff)', p: { cast: true, castAmt: 90, levels: 70, temp: 0, tint: -12, saturation: 10, dehaze: true, dehazeAmt: 50, contrast: 20 } },
  { n: 'Cave / Low Light', d: 'Lift shadows, calm noise', g: 'linear-gradient(90deg,#050a14,#3a5a8a,#ffe8b0)', p: { exposure: 0.6, shadows: 35, highlights: -20, noise: true, noiseAmt: 50, cast: true, castAmt: 60, vibrance: 25 } },
  { n: 'Wreck Cinematic', d: 'Teal shadows, warm highlights', g: 'linear-gradient(90deg,#0a4a5a,#6a7a7a,#ff9a3a)', p: { contrast: 28, saturation: -8, temp: -6, cast: true, castAmt: 60, dehaze: true, dehazeAmt: 40, wheels: { shadows: { x: 0, y: 0.55, l: 0 }, mid: { x: 0, y: 0, l: 0 }, high: { x: 0.3, y: -0.52, l: 0 } } } },
  { n: 'Macro Pop', d: 'Vivid colour, extra clarity', g: 'linear-gradient(90deg,#ff3b3b,#ffd23b,#3bd0ff)', p: { vibrance: 45, saturation: 22, clarity: 25, contrast: 20, shadows: 12, cast: true, castAmt: 60 } },
];
const userPresets = () => safeLS.get('dcl.presets', []);
function applyPreset(p) {
  const it = cur(); if (!it) return toast('Open a photo or video first');
  const base = E.neutralParams();
  it.params = Object.assign(base, E.clone(p));
  syncUI(); requestRender(); it.edited = true; markStep('corrected'); updateCounts(); commit();
}
// preview of a preset on the picture that is open (small copy, CPU engine)
function presetThumb(p) {
  const it = cur(), sm = it && it.st && it.st.small; if (!sm) return null;
  try {
    const s2 = Object.assign({}, it.st); s2._lvKey = null;
    const o = new Uint8ClampedArray(sm.data.length); E.process(sm.data, o, sm.w, sm.h, Object.assign(E.neutralParams(), E.clone(p)), s2);
    const c = document.createElement('canvas'); c.width = sm.w; c.height = sm.h; c.getContext('2d').putImageData(new ImageData(o, sm.w, sm.h), 0, 0);
    return c.toDataURL('image/jpeg', 0.7);
  } catch (e) { return null; }
}
function renderPresets() {
  [$('#presetGrid'), $('#presetGrid2')].forEach((grid) => {
    grid.innerHTML = '';
    BUILTIN.forEach((b) => {
      const el = document.createElement('button'); el.className = 'pr'; const th = presetThumb(b.p); el.innerHTML = `${th ? `<img class="pth" alt="" src="${th}">` : `<div class="sw8" style="--g:${b.g}"></div>`}<b>${b.n}</b><small>${b.d}</small>`;
      el.onclick = () => { applyPreset(b.p); toast(`Preset: ${b.n}`); }; grid.appendChild(el);
    });
    userPresets().forEach((u, i) => {
      const el = document.createElement('div'); el.className = 'pr'; el.tabIndex = 0; el.setAttribute('role', 'button');
      const th2 = presetThumb(u.params); el.innerHTML = `${th2 ? `<img class="pth" alt="" src="${th2}">` : '<div class="sw8" style="--g:linear-gradient(90deg,#ffd21f,#19c3ff)"></div>'}<b>${u.name.replace(/</g, '&lt;')}</b><small>My preset</small><button class="del" aria-label="Delete preset">${icon('trash')}</button>`;
      el.onclick = (e) => { if (e.target.closest('.del')) { const l = userPresets(); l.splice(i, 1); safeLS.set('dcl.presets', l); renderPresets(); updateCounts(); return; } applyPreset(u.params); toast(`Preset: ${u.name}`); };
      grid.appendChild(el);
    });
    hydrateIcons(grid);
  });
}
function askName(def) {
  return new Promise((res) => {
    const d = $('#dlgName'), i = $('#nameIn'); i.value = def; d.returnValue = '';
    d.addEventListener('close', () => res(d.returnValue === 'ok' ? i.value.trim() : ''), { once: true });
    $('#nameOk').onclick = () => d.close('ok'); i.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); d.close('ok'); } };
    d.showModal(); i.select();
  });
}
async function savePreset() {
  const it = cur(); if (!it) return;
  const name = await askName('My look'); if (!name) return;
  const l = userPresets(); l.push({ name, params: E.clone(it.params) }); safeLS.set('dcl.presets', l);
  renderPresets(); updateCounts(); toast('Preset saved in this browser');
}
$('#savePreset').onclick = $('#savePreset2').onclick = savePreset;

$('#resetBtn').onclick = () => { const it = cur(); if (!it) return; it.params = E.neutralParams(); it.autoAmt = 100; it.water = 'auto'; it.aggr = false; S.quick = null; $$('#quick button').forEach((b) => b.classList.remove('on')); syncUI(); requestRender(); commit(); toast('Reset to the untouched original. Undo brings it back.'); };

/* ---------------- Auto amount, undo / redo, grey-point picker, histogram, pro tools ---------------- */
function applyAuto(amt) {
  const it = cur(); if (!it) return toast('Open a photo or video first');
  it.autoAmt = amt;
  it.params = Object.assign(E.neutralParams(), E.autoParams(it.st, amt / 100, it.water, it.useDepth && !!it.st.depth));
  if (it.aggr) { const p = it.params; p.redRecover = Math.round(clamp(80 * amt / 100, 0, 100)); p.gainB = Math.round(clamp(50 * Math.log2(Math.min(1, it.st.g / Math.max(it.st.b, 0.004))) * 0.9, -70, 0) * Math.min(1, amt / 100)); p.cast = true; p.castAmt = Math.min(100, p.castAmt + 15); p.levels = Math.min(100, p.levels + 8); }
  it.edited = true; S.quick = null; $$('#quick button').forEach((b) => b.classList.remove('on'));
  markStep('corrected'); updateCounts(); syncUI(); requestRender(); commit();
}
refs.swAggr = () => { const it = cur(); if (it) $('#swAggr').setAttribute('aria-checked', !!it.aggr); };
function toggleAggr() { const it = cur(); if (!it) return toast('Open a photo or video first'); it.aggr = !it.aggr; applyAuto(it.autoAmt == null ? 100 : it.autoAmt); refs.swAggr(); toast(it.aggr ? 'Aggressive red recovery on' : 'Aggressive red recovery off'); }
$('#swAggr').onclick = toggleAggr; $('#tgAggr').onclick = (e) => { if (e.target.id !== 'swAggr') toggleAggr(); };
/* Depth-aware switch: loads the depth model only when it is turned on */
refs.swDepth = () => {
  const it = cur(), sw = $('#swDepth'); if (!it) return;
  sw.setAttribute('aria-checked', !!(it.useDepth && it.st && it.st.depth));
  $('#depthSub').textContent = it.kind === 'video' ? 'Not available for video yet.' : Depth.isLoaded() ? 'Model ready. Works offline.' : 'Photos only. Downloads about 38 MB once.';
};
async function toggleDepth() {
  const it = cur(); if (!it) return;
  if (it.kind === 'video') return toast('Depth-aware works on photos for now');
  const on = $('#swDepth').getAttribute('aria-checked') !== 'true';
  if (!on) { it.useDepth = false; applyAuto(it.autoAmt == null ? 100 : it.autoAmt); return refs.swDepth(); }
  try {
    busy('Loading the depth model…');
    await Depth.load((m) => ($('#busyTxt').textContent = m));
    if (!it.depthMap) { $('#busyTxt').textContent = 'Estimating distances…'; await new Promise((r) => setTimeout(r, 20)); it.depthMap = await Depth.estimate(it.el, it.w, it.h, 364); }
    it.st.depth = Depth.resample(it.depthMap, it.st.tw, it.st.th); it.useDepth = true;
    busy(); applyAuto(it.autoAmt == null ? 100 : it.autoAmt); refs.swDepth(); toast('Depth-aware on. Use Amount to dial it, or switch it off.');
  } catch (e) { busy(); console.warn('depth model failed', e); it.useDepth = false; refs.swDepth(); toast('Could not load the depth model here. Everything else still works.'); }
}
$('#swDepth').onclick = toggleDepth; $('#tgDepth').onclick = (e) => { if (e.target.id !== 'swDepth') toggleDepth(); };
const WATER_LABEL = { blue: 'Blue', green: 'Green', turbid: 'Turbid', shallow: 'Shallow', corrected: 'Corrected' };
refs.waterSeg = () => {
  const it = cur(); if (!it) return; const w = it.water || 'auto', det = it.st ? E.sceneOf(it.st).kind : null;
  $$('#waterSeg button').forEach((b) => { b.classList.toggle('on', b.dataset.w === w); if (b.dataset.w === 'auto') b.textContent = det ? 'Auto (' + WATER_LABEL[det] + ')' : 'Auto'; });
};
$$('#waterSeg button').forEach((b) => (b.onclick = () => { const it = cur(); if (!it) return; it.water = b.dataset.w; applyAuto(it.autoAmt == null ? 100 : it.autoAmt); toast(b.dataset.w === 'auto' ? 'Water type: detected automatically' : 'Water type: ' + WATER_LABEL[b.dataset.w]); }));
$('#autoBtn').onclick = () => { applyAuto(100); toast('Auto Enhance applied. Use Amount to dial it up or down.'); };
refs.autoAmt = slider({ k: 'autoAmt', l: 'Amount', min: 0, max: 150, reset: 100, fmt: (v) => Math.round(v) + '%' }, () => (cur().autoAmt == null ? 100 : cur().autoAmt), (v) => applyAuto(v), $('#sl-auto'));
refs.autoNote = () => {
  const it = cur(), n = $('#autoNote'); if (!it || !it.st) { n.textContent = ''; return; }
  const sc = E.sceneOf(it.st), bits = [];
  if (sc.conf < 0.15) bits.push('Colours already look balanced, so Auto stays gentle.');
  else bits.push(sc.blueExcess > 0.15 ? 'Blue water detected.' : sc.greenExcess > 0.15 ? 'Green water detected.' : 'Water colour cast detected.');
  if (sc.redLoss > 0.85) bits.push('Almost no red is left at this depth, so the recovery is limited.');
  else if (sc.redLoss > 0.5) bits.push('Much of the red is lost.');
  if (sc.dark) bits.push('A dark scene: noise reduction is on.');
  n.textContent = bits.join(' ');
};

// history: one snapshot of the settings per finished change, per picture
const H_MAX = 80; let commitT = 0, commitItem = null;
const snap = (it) => JSON.stringify({ p: it.params, a: it.autoAmt == null ? 100 : it.autoAmt, w: it.water || 'auto' });
const hist = (it) => it.hist || (it.hist = { s: [snap(it)], i: 0 });
function commit() { commitItem = cur(); clearTimeout(commitT); commitT = setTimeout(commitNow, 350); }
function commitNow() {
  clearTimeout(commitT); const it = commitItem || cur(); commitItem = null; if (!it) return;
  const h = hist(it), j = snap(it);
  if (h.s[h.i] === j) return;
  h.s.length = h.i + 1; h.s.push(j); if (h.s.length > H_MAX) h.s.shift(); h.i = h.s.length - 1; updateUndoBtns(); saveEdit(it);
}
function updateUndoBtns() { const it = cur(), h = it && it.hist; $('#undoBtn').disabled = !h || h.i <= 0; $('#redoBtn').disabled = !h || h.i >= h.s.length - 1; }
function undoRedo(d) {
  const it = cur(); if (!it) return; commitNow();
  const h = hist(it), n = h.i + d; if (n < 0 || n >= h.s.length) return;
  h.i = n; const o = JSON.parse(h.s[n]); it.params = o.p; it.autoAmt = o.a; it.water = o.w || 'auto'; it.useDepth = !!(o.p && o.p.depth); it.aggr = !!(o.p && o.p.redRecover >= 40); it.edited = true; S.quick = null;
  syncUI(); requestRender(); updateUndoBtns();
}
$('#undoBtn').onclick = () => undoRedo(-1); $('#redoBtn').onclick = () => undoRedo(1);

// grey-point picker: click something that should be neutral, the temperature / tint are adjusted so it is
let picking = false;
function setPick(on) { picking = on; cmp.classList.toggle('picking', on); $('#pickWB').classList.toggle('on', on); if (on) toast('Click something that should be grey or white'); }
$('#pickWB').onclick = () => setPick(!picking);
cmp.addEventListener('pointerdown', (e) => {
  if (!picking) return; e.preventDefault(); e.stopPropagation();
  const it = cur(); if (!it) return setPick(false);
  const r = cA.getBoundingClientRect(), px = Math.round((e.clientX - r.left) / r.width * cA.width), py = Math.round((e.clientY - r.top) / r.height * cA.height), k = 3;
  const x0 = clamp(px - k, 0, cA.width - 1), y0 = clamp(py - k, 0, cA.height - 1), w = Math.min(2 * k + 1, cA.width - x0), h = Math.min(2 * k + 1, cA.height - y0);
  let R = 0, G = 0, B = 0, n = 0;
  try { const d = xA.getImageData(x0, y0, w, h).data; for (let i = 0; i < d.length; i += 4) { R += d[i]; G += d[i + 1]; B += d[i + 2]; n++; } } catch (err) { return setPick(false); }
  R = R / n; G = G / n; B = B / n;
  if (n < 1 || (R + G + B) / 3 < 14 || (R + G + B) / 3 > 245) { toast('Pick a mid-tone area, not pure black or white'); return; }
  if (R < G * 0.12 || B < G * 0.12) { toast('That spot has almost no red or blue to balance. Pick a greyer area.'); return; }
  const p = it.params, gr0 = 1 + p.temp * 0.004, gb0 = 1 - p.temp * 0.004, gg0 = 1 + p.tint * 0.003;
  const q = (gr0 / gb0) * (B / Math.max(R, 1)), T = clamp((q - 1) / (q + 1) / 0.004, -100, 100);
  const gr1 = 1 + T * 0.004, gb1 = 1 - T * 0.004, avg = ((R * gr1 / gr0) + (B * gb1 / gb0)) / 2;
  p.temp = Math.round(T); p.tint = Math.round(clamp(((gg0 * avg / Math.max(G, 1)) - 1) / 0.003, -60, 60));
  setPick(false); changed(); syncUI(); toast('White point set. Click again to refine it.');
}, true);

// histogram of the corrected picture; warns when red is missing
const histCv = $('#histCv'), hx = histCv.getContext('2d'), hs = document.createElement('canvas'), hsx = hs.getContext('2d', { willReadFrequently: true });
let histT = 0;
function histSoon() { const t = performance.now(); if (t - histT < 180 || S.rt !== 'cc') return; histT = t; requestAnimationFrame(drawHist); }
function drawHist() {
  if (!cA.width) return;
  const w = 96, h = Math.max(2, Math.round(96 * cA.height / cA.width)); hs.width = w; hs.height = h; hsx.drawImage(cA, 0, 0, w, h);
  let d; try { d = hsx.getImageData(0, 0, w, h).data; } catch (e) { return; }
  const bins = [new Float32Array(64), new Float32Array(64), new Float32Array(64)];
  for (let i = 0; i < d.length; i += 4) { bins[0][d[i] >> 2]++; bins[1][d[i + 1] >> 2]++; bins[2][d[i + 2] >> 2]++; }
  const W = histCv.width, H = histCv.height, mx = Math.max(1, ...bins.map((b) => Math.max(...b))) * 0.9;
  hx.clearRect(0, 0, W, H); hx.globalCompositeOperation = 'lighter';
  ['rgba(255,70,70,.8)', 'rgba(60,230,100,.8)', 'rgba(70,150,255,.8)'].forEach((col, c) => {
    hx.fillStyle = col; hx.beginPath(); hx.moveTo(0, H);
    for (let i = 0; i < 64; i++) hx.lineTo(i * W / 63, H - Math.min(1, bins[c][i] / mx) * H);
    hx.lineTo(W, H); hx.closePath(); hx.fill();
  });
  hx.globalCompositeOperation = 'source-over';
}

// pro tools (curves, wheels, HSL) stay out of the way until asked for
(function proTools() {
  const panels = document.querySelector('.panels'), bar = document.createElement('div'); bar.className = 'probar';
  bar.innerHTML = '<span>Pro tools: Curves, Color Wheels, HSL</span><button class="btn sm" id="proBtn" aria-expanded="false"></button>';
  panels.parentNode.insertBefore(bar, panels);
  const btn = bar.querySelector('button');
  const set = (open) => { panels.hidden = !open; btn.textContent = open ? 'Hide' : 'Show'; btn.setAttribute('aria-expanded', open); safeLS.set('dcl.pro', open); requestAnimationFrame(() => { fit(); sizeCurve(); drawCurve(); }); };
  btn.onclick = () => set(panels.hidden);
  set(!!safeLS.get('dcl.pro', false));
})();

// shortcuts
let heldMode = null;
window.addEventListener('keydown', (e) => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && document.activeElement.type !== 'range';
  if (typing || document.querySelector('dialog[open]')) return;
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (mod && k === 'z') { e.preventDefault(); undoRedo(e.shiftKey ? 1 : -1); }
  else if (mod && k === 'y') { e.preventDefault(); undoRedo(1); }
  else if (e.key === 'Escape' && picking) setPick(false);
  else if (!mod && k === 'w' && cur()) { e.preventDefault(); setPick(!picking); }
  else if (e.key === '\\' && !e.repeat && cur() && heldMode === null) { e.preventDefault(); heldMode = S.mode; setMode('orig'); }
});
window.addEventListener('keyup', (e) => { if (e.key === '\\' && heldMode !== null) { setMode(heldMode); heldMode = null; } });

/* right-hand tabs */
$$('#rtabs button').forEach((b) => (b.onclick = () => {
  S.rt = b.dataset.rt; $$('#rtabs button').forEach((x) => x.classList.toggle('on', x === b));
  ['cc', 'adv', 'pre', 'crop'].forEach((k) => ($('#rt-' + k).hidden = k !== S.rt));
  updateCropMode();
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
  const wk = prepare(item);   // fresh statistics + working-resolution data (levels are measured from this)
  if (!item.inited) { item.inited = true; item.params = Object.assign(E.neutralParams(), E.autoParams(item.st)); }   // same look the editor would show
  const ed = item.edit, full = outDims(ed, item.w, item.h);
  // the size limit applies to the cropped result; the uncropped source is processed at most 8192 px wide
  const sc = Math.min(1, Math.min(maxSide || 8192, 8192) / Math.max(full.ow, full.oh), 8192 / Math.max(item.w, item.h));
  const w = Math.max(2, Math.round(item.w * sc)), h = Math.max(2, Math.round(item.h * sc)), o = outDims(ed, w, h);
  const res = document.createElement('canvas'); res.width = o.ow; res.height = o.oh;
  const gx = getExportGL();
  if (gx) {
    try {
      gx.setSize(w, h); gx.upload(item.el); gx.srcItem = item;
      gx.render(item.params, item.st, E.getLevels(item.params, item.st, wk.src, wk.w, wk.h));
      drawGeo(res.getContext('2d'), gx.canvas, w, h, ed, o.ow, o.oh); gx.setSize(16, 16);
      return res;
    } catch (e) { console.warn('GPU export failed, using CPU', e); try { glx && glx.dispose(); } catch (e2) {} glx = undefined; }
  }
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.imageSmoothingQuality = 'high'; x.drawImage(item.el, 0, 0, w, h);
  const id = x.getImageData(0, 0, w, h), out = x.createImageData(w, h);
  E.process(id.data, out.data, w, h, item.params, item.st);
  x.putImageData(out, 0, 0);
  drawGeo(res.getContext('2d'), c, w, h, ed, o.ow, o.oh);
  return res;
}
async function encodeImage(item, fmtType, q, maxSide) {
  const c = await renderFull(item, maxSide);
  return toBlob(c, fmtType, q);
}
const exOpts = () => ({ type: $('#exFmt').value, q: $('#exQ').value / 100, size: +$('#exSize').value });

async function exportVideoRealtime(item, prog) {
  if (!window.MediaRecorder) throw new Error('This browser cannot record video. Try Chrome, Edge or Firefox.');
  const v = document.createElement('video'); v.playsInline = true; v.preload = 'auto'; v.src = item.url;
  await once(v, 'loadeddata');
  const vdur = srcDuration(v, item);
  const ed = item.edit, tIn = ed.tIn || 0, tOut = Math.min(vdur, ed.tOut == null ? vdur : ed.tOut), D = (tOut - tIn) / ed.speed;
  const full = outDims(ed, item.w, item.h), sc = Math.min(1, WORK_VID / Math.max(full.ow, full.oh));
  const sw = Math.max(2, Math.round(item.w * sc)), sh = Math.max(2, Math.round(item.h * sc)), od = outDims(ed, sw, sh), w = od.ow & ~1, h = od.oh & ~1;
  const pc = document.createElement('canvas'); pc.width = sw; pc.height = sh;   // colour-corrected full frame
  const x = pc.getContext('2d', { willReadFrequently: true }), out = x.createImageData(sw, sh);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;     // cropped / rotated result that gets recorded
  const ox = cv.getContext('2d');
  const stream = cv.captureStream(30);
  let ac = null;
  try {
    if (ed.mute) throw 0;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const dest = ac.createMediaStreamDestination(); ac.createMediaElementSource(v).connect(dest);
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    await ac.resume();
  } catch (e) { /* video without audio is still fine */ }
  v.currentTime = tIn; if (Math.abs(v.currentTime - tIn) > 1e-3) await once(v, 'seeked');
  v.playbackRate = ed.speed; try { v.preservesPitch = false; } catch (e) {}
  const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m));
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8e6 }), chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise((res) => (rec.onstop = () => res(new Blob(chunks, { type: 'video/webm' }))));
  const finish = () => setTimeout(() => rec.state !== 'inactive' && rec.stop(), 150);
  const frame = () => {
    x.drawImage(v, 0, 0, sw, sh);
    const id = x.getImageData(0, 0, sw, sh);
    E.process(id.data, out.data, sw, sh, item.params, item.st);
    x.putImageData(out, 0, 0);
    drawGeo(ox, pc, sw, sh, ed, w, h);
    const f = fadeAt(ed, Math.max(0, (v.currentTime - tIn) / ed.speed), D);
    if (f < 1) { ox.fillStyle = `rgba(0,0,0,${1 - f})`; ox.fillRect(0, 0, w, h); }
    prog(clamp((v.currentTime - tIn) / Math.max(0.001, tOut - tIn), 0, 1));
    if (S.abort) { v.pause(); rec.state !== 'inactive' && rec.stop(); return; }
    if (v.currentTime >= tOut - 0.001) { v.pause(); finish(); return; }
    if (!v.ended) (v.requestVideoFrameCallback ? v.requestVideoFrameCallback(frame) : requestAnimationFrame(frame));
  };
  v.onended = finish;
  rec.start(250); await v.play(); frame();
  const blob = await done;
  if (ac) ac.close();
  v.removeAttribute('src'); v.load();
  return S.abort ? null : blob;
}

/* ---- fast MP4 export: GPU frames -> WebCodecs (H.264) + AAC audio -> mp4-muxer. Frame-accurate, not real-time. ---- */
async function detectFps(v) {
  if (!v.requestVideoFrameCallback) return 30;
  return new Promise((res) => {
    const ts = []; let done = false;
    const fin = () => {
      if (done) return; done = true; v.pause();
      const d = []; for (let i = 1; i < ts.length; i++) if (ts[i] - ts[i - 1] > 1e-4) d.push(ts[i] - ts[i - 1]);
      if (d.length < 3) return res(30);
      d.sort((a, b) => a - b); const f = 1 / d[d.length >> 1];
      res([23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60].reduce((a, b) => (Math.abs(b - f) < Math.abs(a - f) ? b : a)));
    };
    const cb = (now, meta) => { ts.push(meta.mediaTime); if (ts.length >= 12) fin(); else v.requestVideoFrameCallback(cb); };
    v.requestVideoFrameCallback(cb); v.play().catch(fin); setTimeout(fin, 2500);
  });
}
let streamW = null;   // open file stream of an MP4 export in progress (aborted if the export fails)
const canMP4 = () => !!(window.VideoEncoder && window.Mp4Muxer && GLR.supported());

async function exportVideoMP4(item, prog, handle) {
  const maxSide = +$('#vSize').value, bpp = +$('#vQ').value;
  const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = item.url;
  await once(v, 'loadeddata');
  const dur = srcDuration(v, item), fps = clamp(Math.round(await detectFps(v)), 1, 30);
  const ed = item.edit, tIn = clamp(ed.tIn || 0, 0, dur), tOut = Math.min(dur, ed.tOut == null ? dur : ed.tOut), speed = ed.speed || 1, D = Math.max(0.1, (tOut - tIn) / speed);
  // the resolution setting limits the cropped result; frames are rendered at the scaled full size, then cropped / rotated
  const full = outDims(ed, item.w, item.h), sc = Math.min(1, maxSide / Math.max(full.ow, full.oh));
  const plain = isIdentity(ed) && !(ed.fadeIn > 0) && !(ed.fadeOut > 0);   // nothing to do after the colour pass
  let sw = Math.max(2, Math.round(item.w * sc)), sh = Math.max(2, Math.round(item.h * sc));
  if (plain) { sw &= ~1; sh &= ~1; }
  const od = outDims(ed, sw, sh), w = Math.max(2, od.ow & ~1), h = Math.max(2, od.oh & ~1);
  const g = GLR.create(); if (!g) throw new Error('no GPU');
  const oc = plain ? null : document.createElement('canvas'); if (oc) { oc.width = w; oc.height = h; }
  const ocx = oc && oc.getContext('2d');
  try {
    g.setSize(sw, sh);
    const bitrate = Math.round(clamp(w * h * fps * bpp, 2e6, 80e6)), big = w * h > 1920 * 1088;
    let cfg = null;
    for (const k of [{ c: 'avc1.' + (big ? '640033' : '640028'), m: 'avc' }, { c: 'avc1.4d0028', m: 'avc' }, { c: 'vp09.00.40.08', m: 'vp9' }]) {
      try { const conf = { codec: k.c, width: w, height: h, bitrate, framerate: fps, latencyMode: 'quality' }; if ((await VideoEncoder.isConfigSupported(conf)).supported) { cfg = { conf, m: k.m }; break; } } catch (e) {}
    }
    if (!cfg) throw new Error('this browser cannot encode H.264');

    // audio: decode locally, re-encode as AAC (the picture changes, the sound is kept)
    let audio = null;
    if (window.AudioEncoder && !ed.mute) {
      try {
        const ac = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 });
        const buf = await ac.decodeAudioData(await (await fetch(item.url)).arrayBuffer()); ac.close();
        const ch = Math.min(2, buf.numberOfChannels);
        for (const k of [{ c: 'mp4a.40.2', m: 'aac' }, { c: 'opus', m: 'opus' }]) {
          try { if ((await AudioEncoder.isConfigSupported({ codec: k.c, sampleRate: 48000, numberOfChannels: ch, bitrate: 160000 })).supported) { audio = { buf, ch, k }; break; } } catch (e) {}
        }
      } catch (e) { audio = null; }
    }
    // with a save-file handle the MP4 streams straight to disk (memory stays flat, even for long 4K clips); otherwise it is built in memory
    let writable = null;
    if (handle) { try { writable = await handle.createWritable(); } catch (e) { writable = null; } }
    let wchain = Promise.resolve(), wErr = null;
    const target = writable
      ? new Mp4Muxer.StreamTarget({ chunked: true, chunkSize: 8 * 1024 * 1024, onData: (data, position) => { const d = data.slice(); wchain = wchain.then(() => writable.write({ type: 'write', data: d, position })).catch((e) => { wErr = e; }); } })
      : new Mp4Muxer.ArrayBufferTarget();
    streamW = writable;
    const mux = new Mp4Muxer.Muxer({ target, video: { codec: cfg.m, width: w, height: h, frameRate: fps }, audio: audio ? { codec: audio.k.m, numberOfChannels: audio.ch, sampleRate: 48000 } : undefined, fastStart: writable ? false : 'in-memory' });
    let encErr = null;
    const tick = () => new Promise((r) => setTimeout(r, 0));

    if (audio) {
      const aenc = new AudioEncoder({ output: (c, m) => mux.addAudioChunk(c, m), error: (e) => (encErr = e) });
      aenc.configure({ codec: audio.k.c, sampleRate: 48000, numberOfChannels: audio.ch, bitrate: 160000 });
      const total = Math.round(D * 48000), CH = 48000, sr = audio.buf.sampleRate;
      for (let off = 0; off < total; off += CH) {
        // trim + speed: read the source at tIn + t * speed (linear interpolation), apply the fades
        const n = Math.min(CH, total - off), data = new Float32Array(n * audio.ch);
        for (let c = 0; c < audio.ch; c++) {
          const sd = audio.buf.getChannelData(c);
          for (let k = 0; k < n; k++) {
            const t = (off + k) / 48000, pos = (tIn + t * speed) * sr, i0 = Math.floor(pos), fr = pos - i0;
            const s0 = i0 < sd.length ? sd[i0] : 0, s1 = i0 + 1 < sd.length ? sd[i0 + 1] : s0;
            data[c * n + k] = (s0 + (s1 - s0) * fr) * fadeAt(ed, t, D);
          }
        }
        const ad = new AudioData({ format: 'f32-planar', sampleRate: 48000, numberOfFrames: n, numberOfChannels: audio.ch, timestamp: Math.round(off / 48000 * 1e6), data });
        aenc.encode(ad); ad.close();
        if (aenc.encodeQueueSize > 20) await tick();
        if (S.abort) throw new Error('cancelled');
      }
      await aenc.flush(); aenc.close();
    }

    const venc = new VideoEncoder({ output: (c, m) => mux.addVideoChunk(c, m), error: (e) => (encErr = e) });
    venc.configure(cfg.conf);
    const N = Math.max(1, Math.floor(D * fps)), dt = 1e6 / fps, t0 = performance.now();
    const seekTo = (t) => new Promise((res) => {
      if (Math.abs(v.currentTime - t) < 1e-4) return res();
      let done = false; const fin = () => { if (done) return; done = true; v.removeEventListener('seeked', fin); res(); };
      v.addEventListener('seeked', fin); setTimeout(fin, 4000); v.currentTime = t;
    });
    const T = { seek: 0, gpu: 0, encode: 0, wait: 0 }, now = () => performance.now();
    for (let i = 0; i < N; i++) {
      if (S.abort) throw new Error('cancelled');
      if (encErr) throw encErr;
      let m = now();
      await seekTo(Math.min(dur - 0.001, tIn + (i + 0.25) / fps * speed));
      for (let k = 0; v.readyState < 2 && k < 200; k++) await tick();   // wait until the frame is really decodable
      T.seek += now() - m; m = now();
      g.upload(v);
      g.render(item.params, item.st, E.getLevels(item.params, item.st, null, 0, 0));
      let srcCv = g.canvas;
      if (oc) {
        drawGeo(ocx, g.canvas, sw, sh, ed, w, h);
        const f = fadeAt(ed, i / fps, D); if (f < 1) { ocx.fillStyle = `rgba(0,0,0,${1 - f})`; ocx.fillRect(0, 0, w, h); }
        srcCv = oc;
      }
      const fr = new VideoFrame(srcCv, { timestamp: Math.round(i * dt), duration: Math.round(dt) }); T.gpu += now() - m; m = now();
      venc.encode(fr, { keyFrame: i % (fps * 2) === 0 }); fr.close(); T.encode += now() - m; m = now();
      while (venc.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 4));
      T.wait += now() - m;
      if (i % 3 === 0) {
        const el = (performance.now() - t0) / 1000, rate = (i + 1) / Math.max(el, 0.001), left = Math.max(0, Math.round((N - i - 1) / rate));
        prog((i + 1) / N, `Frame ${i + 1} / ${N} · ${rate.toFixed(1)} fps · about ${left}s left`);
        await tick();
      }
    }
    await venc.flush(); venc.close();
    console.info('[export] ms/frame ' + JSON.stringify(Object.fromEntries(Object.entries(T).map(([k, x]) => [k, +(x / N).toFixed(1)]))) + ' codec', cfg.conf.codec, 'fps', fps, w + 'x' + h);
    if (encErr) throw encErr;
    mux.finalize();
    if (writable) { await wchain; if (wErr) throw wErr; await writable.close(); streamW = null; return { saved: true, ext: 'mp4', mime: 'video/mp4' }; }
    return { blob: new Blob([target.buffer], { type: 'video/mp4' }), ext: 'mp4', mime: 'video/mp4' };
  } finally { if (streamW) { try { await streamW.abort(); } catch (e) {} } g.dispose(); v.removeAttribute('src'); v.load(); }
}


/* ---- decoder-based MP4 export (Mediabunny): the file is demuxed and decoded by the browser, every frame goes through the GPU
   colour engine, and the result is encoded and written as it goes. Keeps the source frame rate (60 fps, variable-rate phone clips),
   needs no seeking, and streams audio instead of loading the whole file. Falls back to the seek-based path if anything is unsupported. ---- */
let MB = null;
const loadMediabunny = async () => MB || (MB = await import('./vendor/mediabunny.min.mjs'));
async function exportVideoDecode(item, prog, handle) {
  if (!item.file || !window.VideoDecoder || !window.VideoEncoder || !GLR.supported()) throw new Error('decoder path unavailable');
  const M = await loadMediabunny();
  const ed = item.edit, maxSide = +$('#vSize').value, bpp = +$('#vQ').value;
  const input = new M.Input({ source: new M.BlobSource(item.file), formats: M.ALL_FORMATS });
  const vt = await input.getPrimaryVideoTrack(); if (!vt) throw new Error('no video track');
  const dur = await input.computeDuration();
  if (!(isFinite(dur) && dur > 0)) throw new Error('unknown length');
  let fps = 30; try { const ps = await vt.computePacketStats(120); if (ps && ps.averagePacketRate > 1) fps = clamp(ps.averagePacketRate, 5, 120); } catch (e) { /* keep 30 */ }
  const tIn = clamp(ed.tIn || 0, 0, dur), tOut = Math.min(dur, ed.tOut == null ? dur : ed.tOut), speed = ed.speed || 1, D = Math.max(0.1, (tOut - tIn) / speed);
  const full = outDims(ed, item.w, item.h), sc = Math.min(1, maxSide / Math.max(full.ow, full.oh));
  const sw = Math.max(2, Math.round(item.w * sc)) & ~1, sh = Math.max(2, Math.round(item.h * sc)) & ~1, od = outDims(ed, sw, sh), w = Math.max(2, od.ow & ~1), h = Math.max(2, od.oh & ~1);
  const g = GLR.create(); if (!g) throw new Error('no GPU');
  const src = document.createElement('canvas'); src.width = sw; src.height = sh; const sx = src.getContext('2d');
  const oc = document.createElement('canvas'); oc.width = w; oc.height = h; const ocx = oc.getContext('2d');
  let writable = null, wstream = null, conv = null, done = false;
  try {
    g.setSize(sw, sh);
    if (handle) { try { writable = await handle.createWritable(); } catch (e) { writable = null; } }
    if (writable) wstream = new WritableStream({ write: (c) => writable.write({ type: 'write', data: c.data, position: c.position }), close: () => {}, abort: () => {} });
    const target = wstream ? new M.StreamTarget(wstream, { chunked: true, chunkSize: 8 * 1024 * 1024 }) : new M.BufferTarget();
    const output = new M.Output({ format: new M.Mp4OutputFormat({ fastStart: wstream ? false : 'in-memory' }), target });
    const plain = isIdentity(ed) && !(ed.fadeIn > 0) && !(ed.fadeOut > 0) && w === sw && h === sh;
    let base = null, lastOut = -1, minGap = 1 / Math.min(60, fps) * 0.85;
    const bitrate = Math.round(clamp(w * h * Math.min(60, fps) * bpp, 2e6, 80e6));
    const videoProcess = (s) => {
      if (base === null) base = (tIn > 0.2 && Math.abs(s.timestamp - tIn) < 0.5) ? tIn : 0;   // are timestamps source time or time since the trim start?
      const t = (s.timestamp - base) / speed;
      if (speed > 1 && lastOut >= 0 && t - lastOut < minGap) return null;                    // fast-forward: keep the frame rate sane
      lastOut = t;
      if (plain && !s.rotation && !s.flip) {                                                    // nothing to crop, rotate or fade: decoded frame straight to the GPU and out
        const vf = s.toVideoFrame(); g.upload(vf); vf.close();
        g.render(item.params, item.st, E.getLevels(item.params, item.st, null, 0, 0));
        return new M.VideoSample(g.canvas, { timestamp: Math.max(0, t), duration: s.duration / speed });
      }
      sx.clearRect(0, 0, sw, sh); s.draw(sx, 0, 0, sw, sh);                                   // handles rotation metadata
      g.upload(src); g.render(item.params, item.st, E.getLevels(item.params, item.st, null, 0, 0));
      drawGeo(ocx, g.canvas, sw, sh, ed, w, h);
      const f = fadeAt(ed, Math.max(0, t), D);
      if (f < 1) { ocx.fillStyle = `rgba(0,0,0,${1 - f})`; ocx.fillRect(0, 0, w, h); }
      return new M.VideoSample(oc, { timestamp: Math.max(0, t), duration: s.duration / speed });
    };
    const needAudioProc = speed !== 1 || ed.fadeIn > 0 || ed.fadeOut > 0;
    const audioProcess = (s) => {
      const ch = s.numberOfChannels, sr = s.sampleRate, n = s.numberOfFrames, m = Math.max(1, Math.floor(n / speed)), ts = (s.timestamp - (base || 0)) / speed;
      const out = new Float32Array(ch * m), tmp = new Float32Array(n);
      for (let c = 0; c < ch; c++) {
        s.copyTo(tmp, { planeIndex: c, format: 'f32-planar' });
        for (let k = 0; k < m; k++) {
          const pos = k * speed, i0 = Math.floor(pos), fr = pos - i0, a = tmp[Math.min(i0, n - 1)], b = tmp[Math.min(i0 + 1, n - 1)];
          out[c * m + k] = (a + (b - a) * fr) * fadeAt(ed, Math.max(0, ts + k / sr), D);
        }
      }
      return new M.AudioSample({ data: out, format: 'f32-planar', numberOfChannels: ch, sampleRate: sr, timestamp: Math.max(0, ts) });
    };
    conv = await M.Conversion.init({
      input, output, showWarnings: false,
      trim: { start: tIn, end: tOut },
      video: { codec: 'avc', bitrate, process: videoProcess, processedWidth: w, processedHeight: h, forceTranscode: true },
      audio: ed.mute ? { discard: true } : needAudioProc ? { process: audioProcess, forceTranscode: true } : {},
    });
    if (!conv.isValid) throw new Error('this browser cannot encode this video here');
    const watch = setInterval(() => { if (S.abort && conv) conv.cancel(); }, 200);
    const t0 = performance.now();
    conv.onProgress = (p) => { const el = (performance.now() - t0) / 1000, left = p > 0.02 ? Math.round(el / p * (1 - p)) : null; prog(p, `Rendering ${Math.round(p * 100)}%${left != null ? ` · about ${left}s left` : ''}`); };
    try { await conv.execute(); } finally { clearInterval(watch); }
    done = true;
    if (writable) { await writable.close(); return { saved: true, ext: 'mp4', mime: 'video/mp4' }; }
    return { blob: new Blob([target.buffer], { type: 'video/mp4' }), ext: 'mp4', mime: 'video/mp4' };
  } catch (e) {
    if (S.abort || (e && e.name === 'ConversionCanceledError')) { if (writable) { try { await writable.abort(); } catch (e2) {} writable = null; } return null; }
    throw e;
  } finally {
    if (writable && !done) { try { await writable.abort(); } catch (e) {} }
    g.dispose(); try { input.dispose && input.dispose(); } catch (e) {}
  }
}

async function exportVideo(item, prog, handle) {
  if (window.VideoDecoder && item.file && GLR.supported() && !S.noDecodePath) {
    try { return await exportVideoDecode(item, prog, handle); }
    catch (e) { if (e && e.message === 'cancelled') return null; console.warn('decoder export unavailable, using the compatible path:', e); }
    if (S.abort) return null;
  }
  if (canMP4()) {
    try { return await exportVideoMP4(item, prog, handle); }
    catch (e) { if (e && e.message === 'cancelled') return null; console.warn('MP4 export failed', e); toast('MP4 export unavailable here (' + (e.message || e) + '). Using compatible WebM mode.'); }
  }
  const blob = await exportVideoRealtime(item, prog);
  return blob ? { blob, ext: 'webm', mime: 'video/webm' } : null;
}

/* export dialog */
const dlgEx = $('#dlgExport');
function setProg(el, p, txt) { el.hidden = false; $('i', el).style.width = Math.round(p * 100) + '%'; $('span', el).textContent = txt || Math.round(p * 100) + '%'; }
function openExport() {
  const it = cur(); if (!it) return toast('Open a photo or video first');
  $('#exName').textContent = it.name;
  $('#exImg').hidden = it.kind === 'video'; $('#exVid').hidden = it.kind !== 'video';
  $('#exProg').hidden = true; $('#exGo').disabled = false;
  if (it.kind === 'video' && !canMP4()) $('#vNote').innerHTML = 'This browser cannot create MP4 here, so the video is saved as <b>WebM</b> in compatible mode (slower, up to 960 px). Use a recent Chrome or Edge for fast MP4 export.';
  updateEx();
  if (!dlgEx.open) dlgEx.showModal();
}
$('#exQ').oninput = () => ($('#exQv').textContent = $('#exQ').value);
$('#exFmt').onchange = () => ($('#exQ').disabled = $('#exFmt').value === 'image/png');
$('#exCancel').onclick = () => { S.abort = true; };
let wake = null;
$('#exGo').onclick = async (e) => {
  e.preventDefault();
  const it = cur(); if (!it) return;
  S.abort = false; $('#exGo').disabled = true; S.noDecodePath = !!$('#vCompat').checked;
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
      const want = canMP4() ? 'mp4' : 'webm';
      let handle = await pickSave(`${slug(it.name)}_colorlab.${want}`, want === 'mp4' ? 'video/mp4' : 'video/webm', want);
      it.el.pause();
      try { wake = navigator.wakeLock ? await navigator.wakeLock.request('screen') : null; } catch (e) { wake = null; }   // keep the screen on while it renders
      const res = await exportVideo(it, (p, txt) => setProg($('#exProg'), p, txt || `Rendering ${Math.round(p * 100)}%`), want === 'mp4' ? handle : null);
      if (!res) throw new Error('cancelled');
      if (res.ext !== want) handle = null;   // fell back to another format: use a normal download instead
      if (!res.saved) await saveBlob(res.blob, `${slug(it.name)}_colorlab.${res.ext}`, handle);
      setProg($('#exProg'), 1, 'Saved ✓');
    }
    markStep('exported'); toast('Exported. Your file is saved on your device.');
    setTimeout(() => dlgEx.open && dlgEx.close(), 700);
  } catch (err) {
    $('#exProg').hidden = true;
    if (err && err.name !== 'AbortError' && err.message !== 'cancelled') toast('Export failed: ' + (err.message || err));
  } finally { $('#exGo').disabled = false; S.abort = false; try { wake && wake.release(); } catch (e) {} wake = null; }
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
  ps.forEach((p) => { const li = document.createElement('li'); li.innerHTML = `<input type="checkbox" class="bsel" data-id="${p.id}" aria-label="Select ${esc(p.name)}"><img alt="" src="${p.thumb}"><span class="n">${esc(p.name)}</span><span class="st" data-id="${p.id}">${p.edited ? 'edited' : 'unedited'}</span>`; ul.appendChild(li); });
  $('#zipAll').disabled = $('#applyAll').disabled = !ps.length;
  $('#folderAll').hidden = !window.showDirectoryPicker;
}
$('#copySet').onclick = () => { const c = cur(); if (!c) return toast('Open a photo first'); S.clip = { params: E.clone(c.params), autoAmt: c.autoAmt, water: c.water }; $('#pasteSet').disabled = false; toast('Settings copied. Tick photos below and press Paste.'); };
$('#pasteSet').onclick = () => {
  if (!S.clip) return; const ids = $$('#batchList .bsel:checked').map((x) => +x.dataset.id); if (!ids.length) return toast('Tick the photos to paste onto first');
  photos().filter((p) => ids.includes(p.id)).forEach((p) => { p.params = E.clone(S.clip.params); p.autoAmt = S.clip.autoAmt; p.water = S.clip.water; p.inited = true; p.edited = true; p.hist = null; saveEdit(p); });
  updateCounts(); renderBatch(); toast(`Pasted onto ${ids.length} photo${ids.length > 1 ? 's' : ''}`);
};
$('#applyAll').onclick = () => { const c = cur(); if (!c) return; photos().forEach((p) => { p.params = E.clone(c.params); p.inited = true; p.edited = true; p.hist = null; }); updateCounts(); renderBatch(); toast('Current settings applied to every photo'); };
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
  const data = { app: 'dive-colorlab', version: 1, items: S.items.map((i) => ({ name: i.name, kind: i.kind, w: i.w, h: i.h, params: i.params, edit: i.edit })), presets: userPresets() };
  await saveBlob(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }), 'dive-colorlab-project.json', null);
  toast('Project file saved');
};
$('#projOpen').onclick = () => $('#projInput').click();
$('#projInput').onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const d = JSON.parse(await f.text()); if (d.app !== 'dive-colorlab') throw 0;
    let n = 0; d.items.forEach((x) => { const m = S.items.find((i) => i.name === x.name && i.kind === x.kind); if (m) { m.params = Object.assign(E.neutralParams(), E.sanitizeParams ? E.sanitizeParams(x.params) : x.params); m.inited = true; m.hist = null; if (x.edit && x.edit.crop) { m.edit = sanitizeEdit(x.edit); if (m.kind === 'video') applyVideoPrefs(m); } m.edited = true; n++; } });
    if (Array.isArray(d.presets) && d.presets.length) { const l = userPresets(); d.presets.forEach((p) => !l.some((q) => q.name === p.name) && l.push(p)); safeLS.set('dcl.presets', l); renderPresets(); }
    S.beforeKey = ''; syncUI(); updateCropMode(); requestRender(); updateCounts(); $('#dlgProj').close(); toast(n ? `Settings restored for ${n} file(s)` : 'No matching files are open. Import the same files first.');
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

/* ---------------- remember edits per file, so reopening the same file offers them back ---------------- */
const fileKey = (it) => (it.file && !it.sample ? `${it.name}|${it.file.size}|${it.file.lastModified}` : null);
function loadSaved(it) { const k = fileKey(it); return k ? safeLS.get('dcl.e.' + k, null) : null; }
function saveEdit(it) {
  const k = fileKey(it); if (!k || !it.params) return;
  safeLS.set('dcl.e.' + k, { p: it.params, a: it.autoAmt == null ? 100 : it.autoAmt, w: it.water || 'auto', e: it.edit, t: Date.now() });
  const list = safeLS.get('dcl.elist', []).filter((x) => x !== k); list.push(k);
  while (list.length > 60) { try { localStorage.removeItem('dcl.e.' + list.shift()); } catch (e) {} }
  safeLS.set('dcl.elist', list);
}
function restoreSaved(it) {
  const sv = it.saved; if (!sv) return;
  it.params = Object.assign(E.neutralParams(), E.sanitizeParams(sv.p)); it.autoAmt = sv.a; it.water = sv.w || 'auto';
  if (sv.e && sv.e.crop) { it.edit = sanitizeEdit(sv.e); if (it.kind === 'video') applyVideoPrefs(it); }
  it.inited = true; it.edited = true; it.hist = null; S.beforeKey = '';
  if (cur() === it) { syncUI(); updateCropMode(); requestRender(); hist(it); updateUndoBtns(); }
  updateCounts(); toast('Previous edit restored');
}

/* ---------------- zoom and pan on the preview ---------------- */
S.z = 1; S.tx = 0; S.ty = 0;
function applyView() {
  const z = S.z; cmp.style.transform = z === 1 ? '' : `translate(${S.tx}px,${S.ty}px) scale(${z})`;
  cmp.classList.toggle('zoomed', z > 1);
}
function setZoom(nz, cx, cy) {   // cx, cy: client point that stays put
  const r = stage.getBoundingClientRect(), mx = r.left + r.width / 2, my = r.top + r.height / 2;
  nz = clamp(nz, 1, 8); if (cx == null) { cx = mx; cy = my; }
  const px = (cx - mx - S.tx) / S.z, py = (cy - my - S.ty) / S.z;
  S.z = nz; S.tx = cx - mx - px * nz; S.ty = cy - my - py * nz;
  const lx = cmp.offsetWidth * nz / 2, ly = cmp.offsetHeight * nz / 2; S.tx = clamp(S.tx, -lx, lx); S.ty = clamp(S.ty, -ly, ly);
  if (nz === 1) { S.tx = 0; S.ty = 0; }
  applyView();
}
function resetZoom() { S.z = 1; S.tx = S.ty = 0; applyView(); }
stage.addEventListener('wheel', (e) => { if (S.cropMode || !cur()) return; e.preventDefault(); setZoom(S.z * Math.exp(-e.deltaY * 0.0018), e.clientX, e.clientY); }, { passive: false });
$('#zIn').onclick = () => setZoom(S.z * 1.5); $('#zOut').onclick = () => setZoom(S.z / 1.5); $('#zFit').onclick = resetZoom;
$('#z100').onclick = () => { if (cA.width && cmp.offsetWidth) setZoom(cA.width / (cmp.offsetWidth / (S.mode === 'side' ? 2 : 1))); };
let panning = null;
cmp.addEventListener('pointerdown', (e) => {
  if (S.z <= 1 || picking || S.cropMode || e.target.closest('.handle')) return;
  panning = { x: e.clientX, y: e.clientY, tx: S.tx, ty: S.ty }; cmp.classList.add('panning'); cmp.setPointerCapture(e.pointerId); e.stopImmediatePropagation();
}, true);
cmp.addEventListener('pointermove', (e) => { if (!panning) return; S.tx = panning.tx + e.clientX - panning.x; S.ty = panning.ty + e.clientY - panning.y; setZoom(S.z, null, null, true); });
['pointerup', 'pointercancel'].forEach((ev) => cmp.addEventListener(ev, () => { panning = null; cmp.classList.remove('panning'); }));

/* ---------------- export size estimate, keep-awake, tour ---------------- */
function updateEx() {
  const it = cur(), el = $('#exEst'); if (!it) { el.textContent = ''; return; }
  const full = outDims(it.edit, it.w, it.h);
  if (it.kind === 'image') {
    const o = exOpts(), lim = o.size || 8192, sc = Math.min(1, lim / Math.max(full.ow, full.oh)), w = Math.round(full.ow * sc), h = Math.round(full.oh * sc);
    const bpp = o.type === 'image/png' ? 2.4 : o.type === 'image/webp' ? 0.1 + 0.5 * o.q * o.q * 0.5 : 0.12 + 0.55 * o.q * o.q;
    el.textContent = `Result: ${w} × ${h} px, roughly ${fmtMB(w * h * bpp)}.`;
  } else {
    const side = +$('#vSize').value, sc = Math.min(1, side / Math.max(full.ow, full.oh)), w = (Math.round(full.ow * sc)) & ~1, h = (Math.round(full.oh * sc)) & ~1, tb = trimOf(it);
    const dur = (tb.b - tb.a) / (it.edit.speed || 1), br = clamp(w * h * 30 * +$('#vQ').value, 2e6, 80e6);
    el.textContent = `Result: ${w} × ${h} px, ${fmt(dur)} long, roughly ${fmtMB(br * dur / 8)}.`;
  }
}
const fmtMB = (b) => (b > 1e9 ? (b / 1e9).toFixed(1) + ' GB' : Math.max(0.1, b / 1e6).toFixed(1) + ' MB');
['exFmt', 'exQ', 'exSize', 'vSize', 'vQ'].forEach((id) => $('#' + id).addEventListener('input', updateEx));
$('#tourBtn').onclick = () => { $('#dlgHelp').close(); $('#dlgTour').showModal(); };
$('#dlgTour').addEventListener('close', () => safeLS.set('dcl.tour', true));
setTimeout(() => { if (!safeLS.get('dcl.tour', false) && !document.querySelector('dialog[open]')) $('#dlgTour').showModal(); }, 1800);

// offline use: cache the app files (not your media) once the page has loaded over http(s)
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

/* ---------------- boot ---------------- */
buildControls(); buildWheels(); buildHSL(); buildEditUI(); buildQuick(); renderPresets(); updateCounts(); updateSteps();
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
