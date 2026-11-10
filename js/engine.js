/* Dive ColorLab – colour engine (runs 100% in the browser, nothing is uploaded) */
const Engine = (() => {
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  const BANDS = [
    { id: 'red', c: 0, color: '#ff2a2a' },
    { id: 'orange', c: 30, color: '#ff8a1c' },
    { id: 'yellow', c: 55, color: '#ffc61a' },
    { id: 'lime', c: 85, color: '#d4f021' },
    { id: 'green', c: 130, color: '#1fd35a' },
    { id: 'cyan', c: 185, color: '#18c8f0' },
    { id: 'blue', c: 225, color: '#2a6cff' },
    { id: 'purple', c: 270, color: '#9a4dff' },
    { id: 'magenta', c: 320, color: '#ff2fc8' },
  ];

  function neutralParams() {
    const hsl = {};
    BANDS.forEach((b) => (hsl[b.id] = { h: 0, s: 0, l: 0 }));
    return {
      temp: 0, tint: 0, exposure: 0, contrast: 0, highlights: 0, shadows: 0, vibrance: 0, saturation: 0, clarity: 0, levels: 0, skin: true,
      cast: false, castAmt: 70, dehaze: false, dehazeAmt: 40, backscatter: false, backAmt: 35, noise: false, noiseAmt: 40,
      curves: { rgb: [[0, 0], [1, 1]], r: [[0, 0], [1, 1]], g: [[0, 0], [1, 1]], b: [[0, 0], [1, 1]] },
      wheels: { shadows: { x: 0, y: 0, l: 0 }, mid: { x: 0, y: 0, l: 0 }, high: { x: 0, y: 0, l: 0 } },
      hsl,
    };
  }

  /* Starting look, matches the reference design */
  function defaultParams() {
    const p = neutralParams();
    Object.assign(p, {
      temp: 28, tint: 6, exposure: 0.3, contrast: 18, highlights: -12, shadows: 20, vibrance: 32, saturation: 18,
      cast: true, dehaze: true, backscatter: true, noise: false,
    });
    p.curves.rgb = [[0, 0], [0.25, 0.21], [0.75, 0.8], [1, 1]];
    return p;
  }

  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* ---------- curves (monotone cubic) ---------- */
  function curveLUT(pts) {
    const P = pts.slice().sort((a, b) => a[0] - b[0]);
    const n = P.length;
    const lut = new Float32Array(256);
    if (n < 2) { for (let i = 0; i < 256; i++) lut[i] = i / 255; return lut; }
    const x = P.map((p) => p[0]), y = P.map((p) => p[1]);
    const d = [], m = new Array(n);
    for (let k = 0; k < n - 1; k++) d[k] = (y[k + 1] - y[k]) / Math.max(1e-6, x[k + 1] - x[k]);
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let k = 1; k < n - 1; k++) m[k] = d[k - 1] * d[k] <= 0 ? 0 : (d[k - 1] + d[k]) / 2;
    for (let k = 0; k < n - 1; k++) {
      if (d[k] === 0) { m[k] = 0; m[k + 1] = 0; continue; }
      const a = m[k] / d[k], b = m[k + 1] / d[k], s = a * a + b * b;
      if (s > 9) { const t = 3 / Math.sqrt(s); m[k] = t * a * d[k]; m[k + 1] = t * b * d[k]; }
    }
    let seg = 0;
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      if (t <= x[0]) { lut[i] = clamp(y[0], 0, 1); continue; }
      if (t >= x[n - 1]) { lut[i] = clamp(y[n - 1], 0, 1); continue; }
      while (seg < n - 2 && t > x[seg + 1]) seg++;
      const h = x[seg + 1] - x[seg], u = (t - x[seg]) / h, u2 = u * u, u3 = u2 * u;
      const v = (2 * u3 - 3 * u2 + 1) * y[seg] + (u3 - 2 * u2 + u) * h * m[seg] + (-2 * u3 + 3 * u2) * y[seg + 1] + (u3 - u2) * h * m[seg + 1];
      lut[i] = clamp(v, 0, 1);
    }
    return lut;
  }

  const isIdentity = (pts) => pts.length === 2 && pts[0][0] === 0 && pts[0][1] === 0 && pts[1][0] === 1 && pts[1][1] === 1;

  /* ---------- image helpers ---------- */
  function boxBlur(src, w, h, r) {
    const out = new Float32Array(w * h), tmp = new Float32Array(w * h), P = new Float32Array(Math.max(w, h) + 1);
    for (let y = 0; y < h; y++) {
      const o = y * w; P[0] = 0;
      for (let x = 0; x < w; x++) P[x + 1] = P[x] + src[o + x];
      for (let x = 0; x < w; x++) { const a = x - r < 0 ? 0 : x - r, b = x + r > w - 1 ? w - 1 : x + r; tmp[o + x] = (P[b + 1] - P[a]) / (b - a + 1); }
    }
    for (let x = 0; x < w; x++) {
      P[0] = 0;
      for (let y = 0; y < h; y++) P[y + 1] = P[y] + tmp[y * w + x];
      for (let y = 0; y < h; y++) { const a = y - r < 0 ? 0 : y - r, b = y + r > h - 1 ? h - 1 : y + r; out[y * w + x] = (P[b + 1] - P[a]) / (b - a + 1); }
    }
    return out;
  }
  function minFilter(src, w, h, r) {
    const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      const o = y * w;
      for (let x = 0; x < w; x++) { let m = 9; const b = Math.min(w - 1, x + r); for (let k = Math.max(0, x - r); k <= b; k++) if (src[o + k] < m) m = src[o + k]; tmp[o + x] = m; }
    }
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) { let m = 9; const b = Math.min(h - 1, y + r); for (let k = Math.max(0, y - r); k <= b; k++) { const v = tmp[k * w + x]; if (v < m) m = v; } out[y * w + x] = m; }
    }
    return out;
  }
  function guidedFilter(I, p, w, h, r, eps) {
    const n = w * h, Ip = new Float32Array(n), II = new Float32Array(n);
    for (let i = 0; i < n; i++) { Ip[i] = I[i] * p[i]; II[i] = I[i] * I[i]; }
    const mI = boxBlur(I, w, h, r), mp = boxBlur(p, w, h, r), mIp = boxBlur(Ip, w, h, r), mII = boxBlur(II, w, h, r);
    const a = new Float32Array(n), b = new Float32Array(n);
    for (let i = 0; i < n; i++) { const v = mII[i] - mI[i] * mI[i], c = mIp[i] - mI[i] * mp[i]; a[i] = c / (v + eps); b[i] = mp[i] - a[i] * mI[i]; }
    const ma = boxBlur(a, w, h, r), mb = boxBlur(b, w, h, r), q = new Float32Array(n);
    for (let i = 0; i < n; i++) q[i] = ma[i] * I[i] + mb[i];
    return q;
  }

  /* ---------- statistics (+ underwater haze model) ---------- */
  function computeStats(data, w, h, opts) {
    opts = opts || {};
    const n = w * h, hist = new Uint32Array(256);
    let r = 0, g = 0, b = 0, mn = 0;
    for (let i = 0; i < data.length; i += 4) {
      const R = data[i], G = data[i + 1], B = data[i + 2];
      r += R; g += G; b += B; mn += Math.min(R, G, B);
      hist[(0.2126 * R + 0.7152 * G + 0.0722 * B) | 0]++;
    }
    const cut = (q) => { let a = 0; const t = n * q; for (let i = 0; i < 256; i++) { a += hist[i]; if (a >= t) return i / 255; } return 1; };
    const st = {
      r: Math.max(r / n / 255, 0.004), g: Math.max(g / n / 255, 0.004), b: Math.max(b / n / 255, 0.004),
      minMean: mn / n / 255, hist, p1: cut(0.01), p99: cut(0.99), p50: cut(0.5), A: null, trans: null, tw: w, th: h,
    };
    if (opts.video) st.ref = { data, w, h };   // video: levels are measured once on this reference frame (no flicker)
    if (opts.video || n < 64) return st;

    // Underwater dark channel prior: only G and B (red is already absorbed), local minimum, refined with a guided filter
    const gb = new Float32Array(n), Y = new Float32Array(n);
    for (let i = 0, j = 0; i < n; i++, j += 4) {
      gb[i] = Math.min(data[j + 1], data[j + 2]) / 255;
      Y[i] = (0.2126 * data[j] + 0.7152 * data[j + 1] + 0.0722 * data[j + 2]) / 255;
    }
    const big = Math.max(w, h);
    const dark = minFilter(gb, w, h, Math.max(2, Math.round(big / 200)));
    const dh = new Uint32Array(256);
    for (let i = 0; i < n; i++) dh[Math.min(255, (dark[i] * 255) | 0)]++;
    let acc = 0, thr = 255; for (let v = 255; v >= 0; v--) { acc += dh[v]; if (acc >= n * 0.001) { thr = v; break; } }
    let ar = 0, ag = 0, ab = 0, cn = 0;
    for (let i = 0, j = 0; i < n; i++, j += 4) if (dark[i] * 255 >= thr) { ar += data[j]; ag += data[j + 1]; ab += data[j + 2]; cn++; }
    const A = [clamp(ar / cn / 255, 0.12, 1), clamp(ag / cn / 255, 0.2, 1), clamp(ab / cn / 255, 0.2, 1)];
    const Amin = Math.min(A[1], A[2]), t0 = new Float32Array(n);
    for (let i = 0; i < n; i++) t0[i] = 1 - 0.95 * Math.min(1, dark[i] / Amin);
    const t = guidedFilter(Y, t0, w, h, Math.max(4, Math.round(big / 80)), 1e-3);
    for (let i = 0; i < n; i++) t[i] = clamp(t[i], 0.05, 1);
    st.A = A; st.trans = t;
    return st;
  }

  /* ---------- denoise (3x3 mean blend) ---------- */
  function denoise(src, w, h, amt) {
    const tmp = new Uint8ClampedArray(src.length), out = new Uint8ClampedArray(src.length);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4, l = x > 0 ? i - 4 : i, r = x < w - 1 ? i + 4 : i;
        for (let k = 0; k < 3; k++) tmp[i + k] = (src[l + k] + src[i + k] + src[r + k]) / 3;
        tmp[i + 3] = 255;
      }
    }
    for (let y = 0; y < h; y++) {
      const up = (y > 0 ? y - 1 : y) * w, dn = (y < h - 1 ? y + 1 : y) * w, cu = y * w;
      for (let x = 0; x < w; x++) {
        const i = (cu + x) * 4, a = (up + x) * 4, b = (dn + x) * 4;
        for (let k = 0; k < 3; k++) {
          const blur = (tmp[a + k] + tmp[i + k] + tmp[b + k]) / 3;
          out[i + k] = src[i + k] + (blur - src[i + k]) * amt;
        }
        out[i + 3] = 255;
      }
    }
    return out;
  }

  /* ---------- the pipeline ----------
     1 red/blue compensation (Ancuti-style, protects already-red pixels)  2 temperature / tint / exposure
     3 underwater dark-channel dehaze (per-pixel transmission)           4 per-channel percentile stretch
     5 backscatter, contrast, shadows/highlights, vibrance, curves, wheels, HSL   6 local-contrast clarity
     The same maths lives in js/gl.js (GPU). This CPU version is the fallback and the reference. */
  function makeCore(p, st, w, h) {
    const skin = p.skin !== false;
    const a = p.cast ? clamp(p.castAmt / 100, 0, 1.2) : 0;
    const kR = Math.max(0, st.g - st.r) * a, kB = Math.max(0, st.g - st.b) * a;
    const ex = Math.pow(2, p.exposure);
    const gr = (1 + p.temp * 0.004) * ex, gb = (1 - p.temp * 0.004) * ex, gg = (1 + p.tint * 0.003) * ex;
    const dz = p.dehaze ? clamp(p.dehazeAmt / 100, 0, 1) : 0;
    const tr = st.trans, tw = st.tw, th = st.th, sx = tw / w, sy = th / h;
    const C = { r: 0, g: 0, b: 0 };
    const stage1 = (r, g, b) => {
      const warm = skin ? clamp((r / (Math.max(g, b) + 0.03) - 1) / 0.5, 0, 1) : 0;
      r += kR * (1 - r) * g * (1 - warm); b += kB * (1 - b) * g;
      r *= gr; g *= gg; b *= gb;
      if (r > 0.85) r = 0.85 + 0.15 * Math.tanh((r - 0.85) / 0.15);
      if (g > 0.85) g = 0.85 + 0.15 * Math.tanh((g - 0.85) / 0.15);
      if (b > 0.85) b = 0.85 + 0.15 * Math.tanh((b - 0.85) / 0.15);
      C.r = r; C.g = g; C.b = b;
    };
    const Araw = st.A || [0.3, 0.55, 0.75];
    stage1(Araw[0], Araw[1], Araw[2]);
    const A1r = C.r, A1g = C.g, A1b = C.b, A1min = Math.max(0.05, Math.min(A1g, A1b));
    const dehaze = (x, y, prot) => {
      let t = tr ? tr[((y * sy) | 0) * tw + ((x * sx) | 0)] : 1 - 0.95 * Math.min(1, Math.min(C.g, C.b) / A1min);
      t = 1 - dz * (1 - prot * 0.95) * (1 - t); if (t < 0.3) t = 0.3;
      C.r = (C.r - A1r) / t + A1r; C.g = (C.g - A1g) / t + A1g; C.b = (C.b - A1b) / t + A1b;
    };
    // soft mask for skin-like hues (orange, g/r about 0.45-0.9, blue below green)
    const skinMask = (r, g, b) => {
      if (!skin || r < 0.12 || r < g || g < b * 0.95) return 0;
      const gr2 = g / r;
      return clamp(Math.min((gr2 - 0.3) / 0.15, (0.95 - gr2) / 0.1), 0, 1);
    };
    return { skin, kR, kB, ex, gain: [gr, gg, gb], dz, A1: [A1r, A1g, A1b], A1min, hasTrans: !!tr, stage1, dehaze, skinMask, C };
  }

  /* Per-channel percentile stretch. Measured once per clip/image and cached, so video does not flicker. */
  function getLevels(p, st, data, w, h) {
    const L = clamp((p.levels || 0) / 100, 0, 1);
    if (L <= 0) return { L: 0, lo: [0, 0, 0], sc: [1, 1, 1] };
    if (st.ref) { data = st.ref.data; w = st.ref.w; h = st.ref.h; }
    const key = [p.levels, p.cast, p.castAmt, p.temp, p.tint, p.exposure, p.dehaze, p.dehazeAmt, p.skin, w, h].join('|');
    if (st._lvKey === key) return st._lv;
    const core = makeCore(p, st, w, h), dz = core.dz, C = core.C;
    const H = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)], step = Math.max(2, Math.round(Math.sqrt(w * h / 40000)));
    let cnt = 0;
    for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4;
      core.stage1(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
      if (dz > 0) core.dehaze(x, y, 0);
      H[0][clamp((C.r * 255) | 0, 0, 255)]++; H[1][clamp((C.g * 255) | 0, 0, 255)]++; H[2][clamp((C.b * 255) | 0, 0, 255)]++; cnt++;
    }
    const lo = [0, 0, 0], sc = [1, 1, 1], minRange = [0.7, 0.45, 0.45];
    for (let c = 0; c < 3; c++) {
      let acc = 0, l = 0, hgh = 255, gotL = false;
      for (let v = 0; v < 256; v++) { acc += H[c][v]; if (!gotL && acc >= cnt * 0.005) { l = v; gotL = true; } if (acc >= cnt * 0.995) { hgh = v; break; } }
      lo[c] = Math.min(l / 255, 0.3);
      sc[c] = 1 / Math.max(hgh / 255 - lo[c], minRange[c]);
    }
    st._lvKey = key; st._lv = { L, lo, sc };
    return st._lv;
  }

  /* curve lookup tables, shared by CPU and GPU */
  function curveTables(p) {
    const lm = curveLUT(p.curves.rgb), lr = curveLUT(p.curves.r), lg = curveLUT(p.curves.g), lb = curveLUT(p.curves.b);
    const on = !(isIdentity(p.curves.rgb) && isIdentity(p.curves.r) && isIdentity(p.curves.g) && isIdentity(p.curves.b));
    const cR = new Float32Array(256), cG = new Float32Array(256), cB = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const j = (lm[i] * 255 + 0.5) | 0; cR[i] = lr[j]; cG[i] = lg[j]; cB[i] = lb[j]; }
    return { on, cR, cG, cB };
  }
  function wheelVectors(p) {
    return ['shadows', 'mid', 'high'].map((k) => {
      const o = p.wheels[k], mag = Math.min(1, Math.hypot(o.x, o.y)), ang = Math.atan2(o.x, -o.y), l = o.l / 100 * 0.25;
      return { r: Math.cos(ang) * mag * 0.16 + l, g: Math.cos(ang - 2.0944) * mag * 0.16 + l, b: Math.cos(ang - 4.18879) * mag * 0.16 + l, on: mag > 0.001 || o.l !== 0 };
    });
  }
  const activeBands = (p) => BANDS.map((b) => ({ c: b.c, ...p.hsl[b.id] })).filter((b) => b.h || b.s || b.l);

  function process(src, dst, w, h, p, st) {
    let input = src;
    if (p.noise && p.noiseAmt > 0) input = denoise(src, w, h, clamp(p.noiseAmt / 100, 0, 1));
    const core = makeCore(p, st, w, h), C = core.C, dz = core.dz, ex = core.ex, skinMask = core.skinMask;
    const lv = getLevels(p, st, src, w, h), L = lv.L, lo = lv.lo, sc = lv.sc;
    const cv = curveTables(p), cR = cv.cR, cG = cv.cG, cB = cv.cB, useCurves = cv.on;
    const bk = p.backscatter ? p.backAmt / 100 : 0;
    const ct = 1 + p.contrast / 100;
    const hi = p.highlights / 100 * 0.4, sh = p.shadows / 100 * 0.4;
    const vib = p.vibrance / 100, sat = 1 + p.saturation / 100;
    const wh = wheelVectors(p), wheelsOn = wh.some((o) => o.on);
    const bands = activeBands(p), hslOn = bands.length > 0;

    const out = dst;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r0 = input[i] / 255, g0 = input[i + 1] / 255, b0 = input[i + 2] / 255;
        const m0 = skinMask(r0, g0, b0);   // judged on the ORIGINAL pixel: near-surface skin is already warm
        core.stage1(r0, g0, b0);
        if (dz > 0) core.dehaze(x, y, m0);
        let r = C.r, g = C.g, b = C.b;
        if (L > 0) {
          const Lp = L * (1 - 0.9 * Math.max(m0, skinMask(r, g, b)));
          r += ((r - lo[0]) * sc[0] - r) * Lp; g += ((g - lo[1]) * sc[1] - g) * Lp; b += ((b - lo[2]) * sc[2] - b) * Lp;
        }
        r = r < 0 ? 0 : r > 1 ? 1 : r; g = g < 0 ? 0 : g > 1 ? 1 : g; b = b < 0 ? 0 : b > 1 ? 1 : b;

        let Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (bk > 0) {
          const s = Math.max(r, g, b) - Math.min(r, g, b), t = clamp((Y - 0.55) / 0.35, 0, 1);
          const wgt = clamp(1 - s * 3, 0, 1) * t * t * (3 - 2 * t) * bk * 0.35;
          r *= 1 - wgt; g *= 1 - wgt; b *= 1 - wgt;
        }
        if (ct !== 1) { r = (r - 0.5) * ct + 0.5; g = (g - 0.5) * ct + 0.5; b = (b - 0.5) * ct + 0.5; }
        if (hi || sh) {
          Y = clamp(0.2126 * r + 0.7152 * g + 0.0722 * b, 0, 1);
          const add = hi * Y * Y + sh * (1 - Y) * (1 - Y);
          r += add; g += add; b += add;
        }
        if (vib || sat !== 1) {
          r = clamp(r, 0, 1); g = clamp(g, 0, 1); b = clamp(b, 0, 1);
          const sm = Math.max(m0, skinMask(r, g, b)), mx = Math.max(r, g, b), mi = Math.min(r, g, b);
          const f = (1 + (sat - 1) * (1 - 0.8 * sm)) * (1 + vib * (1 - sm) * (1 - (mx - mi)));
          Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          r = Y + (r - Y) * f; g = Y + (g - Y) * f; b = Y + (b - Y) * f;
        }
        r = clamp(r, 0, 1); g = clamp(g, 0, 1); b = clamp(b, 0, 1);
        if (useCurves) { r = cR[(r * 255 + 0.5) | 0]; g = cG[(g * 255 + 0.5) | 0]; b = cB[(b * 255 + 0.5) | 0]; }

        if (wheelsOn) {
          const yy = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          const ws = clamp(1 - yy * 2, 0, 1), wm = 1 - Math.abs(2 * yy - 1), wi = clamp(2 * yy - 1, 0, 1);
          r += wh[0].r * ws + wh[1].r * wm + wh[2].r * wi; g += wh[0].g * ws + wh[1].g * wm + wh[2].g * wi; b += wh[0].b * ws + wh[1].b * wm + wh[2].b * wi;
          r = clamp(r, 0, 1); g = clamp(g, 0, 1); b = clamp(b, 0, 1);
        }
        if (hslOn) {
          const mx = Math.max(r, g, b), mi = Math.min(r, g, b), d = mx - mi;
          if (d > 1e-5) {
            let l = (mx + mi) / 2, s = l > 0.5 ? d / (2 - mx - mi) : d / (mx + mi), hh;
            if (mx === r) hh = ((g - b) / d + (g < b ? 6 : 0)) * 60; else if (mx === g) hh = ((b - r) / d + 2) * 60; else hh = ((r - g) / d + 4) * 60;
            let dh = 0, ds = 0, dl = 0;
            for (let k = 0; k < bands.length; k++) {
              const bd = bands[k], dist = Math.abs(((hh - bd.c + 540) % 360) - 180);
              if (dist < 45) { const wt = (0.5 + 0.5 * Math.cos(Math.PI * dist / 45)) * Math.min(1, s * 2.5); dh += bd.h * 0.3 * wt; ds += bd.s / 100 * wt; dl += bd.l / 100 * 0.25 * wt; }
            }
            hh = (hh + dh + 360) % 360; s = clamp(s * (1 + ds), 0, 1); l = clamp(l + dl, 0, 1);
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s, pp = 2 * l - q, hk = hh / 360;
            const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? pp + (q - pp) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? pp + (q - pp) * (2 / 3 - t) * 6 : pp; };
            r = f(hk + 1 / 3); g = f(hk); b = f(hk - 1 / 3);
          }
        }
        if (m0 > 0) {   // keep the shot's own hue on skin: change brightness/contrast only
          const wk = Math.min(1, m0 * 1.6) * 0.8, yo = 0.2126 * r + 0.7152 * g + 0.0722 * b, yr = Math.max(0.02, 0.2126 * r0 + 0.7152 * g0 + 0.0722 * b0), sc2 = yo / yr;
          r += (clamp(r0 * sc2, 0, 1) - r) * wk; g += (clamp(g0 * sc2, 0, 1) - g) * wk; b += (clamp(b0 * sc2, 0, 1) - b) * wk;
          const cIn = Math.max(r0, g0, b0) - Math.min(r0, g0, b0), cOut = Math.max(r, g, b) - Math.min(r, g, b);
          const lim = cIn * Math.max(1, ex) * 1.02 + 0.01;   // skin must never end up more saturated than it was shot
          if (cOut > lim) {
            const k = 1 - Math.min(1, m0 * 1.6) * (1 - lim / cOut), yy = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            r = yy + (r - yy) * k; g = yy + (g - yy) * k; b = yy + (b - yy) * k;
          }
        }
        out[i] = r * 255 + 0.5; out[i + 1] = g * 255 + 0.5; out[i + 2] = b * 255 + 0.5; out[i + 3] = 255;
      }
    }

    // clarity = real local contrast (detail relative to a wide blur), not a global curve
    if (p.clarity) {
      const n = w * h, Yp = new Float32Array(n);
      for (let i = 0, j = 0; i < n; i++, j += 4) Yp[i] = (0.2126 * out[j] + 0.7152 * out[j + 1] + 0.0722 * out[j + 2]) / 255;
      const rad = Math.max(6, Math.round(Math.max(w, h) / 40)), B = boxBlur(boxBlur(Yp, w, h, rad), w, h, rad), k = p.clarity / 100 * 1.3;
      for (let i = 0, j = 0; i < n; i++, j += 4) {
        const gain = clamp(1 + k * (Yp[i] - B[i]) / (Yp[i] + 0.08), 0.6, 1.6);
        out[j] *= gain; out[j + 1] *= gain; out[j + 2] *= gain;
      }
    }
  }

  /* ---------- auto routine ---------- */
  function autoParams(st) {
    return {
      cast: true, castAmt: 100, levels: 75,
      dehaze: true, dehazeAmt: Math.round(clamp(st.minMean * 180, 22, 55)),
      backscatter: true, backAmt: 25,
      exposure: +clamp(Math.log2(0.4 / Math.max(st.p50, 0.05)) * 0.5, -0.4, 0.8).toFixed(2),
      contrast: 6, clarity: 18, vibrance: 18, saturation: 0, shadows: 8, highlights: -6, temp: 0, tint: 0,
    };
  }

  /* ---------- store-only ZIP writer ---------- */
  const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (u8) => { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = crcT[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  function makeZip(files) {
    const enc = new TextEncoder(), parts = [], central = [];
    let offset = 0;
    const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    for (const f of files) {
      const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, time, true); lh.setUint16(12, date, true); lh.setUint32(14, crc, true); lh.setUint32(18, size, true); lh.setUint32(22, size, true);
      lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      parts.push(lh.buffer, name, f.data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, time, true); ch.setUint16(14, date, true); ch.setUint32(16, crc, true); ch.setUint32(20, size, true); ch.setUint32(24, size, true);
      ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
      central.push(ch.buffer, name);
      offset += 30 + name.length + size;
    }
    let csize = 0; central.forEach((c) => (csize += c.byteLength || c.length));
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, csize, true); end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, end.buffer], { type: 'application/zip' });
  }

  return { BANDS, neutralParams, defaultParams, clone, curveLUT, curveTables, wheelVectors, activeBands, computeStats, makeCore, getLevels, process, autoParams, makeZip, clamp };
})();
