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
      depth: false, depthAmt: 60, depthRR: 4, gainR: 0, gainG: 0, gainB: 0, redRecover: 0,
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

  /* Keep only known fields of a (possibly hand-edited) project file, with sane types and ranges */
  function sanitizeParams(src) {
    const base = neutralParams(), out = {};
    if (!src || typeof src !== 'object') return out;
    const num = (v, lo, hi) => (typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : undefined);
    for (const k in base) {
      const b = base[k], v = src[k];
      if (typeof b === 'number') { const n = num(v, -1000, 1000); if (n !== undefined) out[k] = n; }
      else if (typeof b === 'boolean') { if (typeof v === 'boolean') out[k] = v; }
    }
    if (src.curves && typeof src.curves === 'object') {
      out.curves = clone(base.curves);
      for (const ch of ['rgb', 'r', 'g', 'b']) {
        const pts = src.curves[ch];
        if (Array.isArray(pts) && pts.length >= 2 && pts.length <= 32 && pts.every((p) => Array.isArray(p) && num(p[0], 0, 1) !== undefined && num(p[1], 0, 1) !== undefined)) out.curves[ch] = pts.map((p) => [p[0], p[1]]);
      }
    }
    if (src.wheels && typeof src.wheels === 'object') {
      out.wheels = clone(base.wheels);
      for (const k in base.wheels) { const w = src.wheels[k]; if (w && typeof w === 'object') for (const f of ['x', 'y', 'l']) if (typeof w[f] === 'number' && isFinite(w[f])) out.wheels[k][f] = Math.min(100, Math.max(-100, w[f])); }
    }
    if (src.hsl && typeof src.hsl === 'object') {
      out.hsl = clone(base.hsl);
      for (const k in base.hsl) { const h = src.hsl[k]; if (h && typeof h === 'object') for (const f of ['h', 's', 'l']) if (typeof h[f] === 'number' && isFinite(h[f])) out.hsl[k][f] = Math.min(100, Math.max(-100, h[f])); }
    }
    return out;
  }

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
    {   // tiny copy (about 112 px) that Auto scores its candidate looks on
      const sc = Math.min(1, 112 / Math.max(w, h)), sw = Math.max(2, Math.round(w * sc)), sh = Math.max(2, Math.round(h * sc)), sd = new Uint8ClampedArray(sw * sh * 4);
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) { const s = ((Math.min(h - 1, Math.floor((y + 0.5) / sc))) * w + Math.min(w - 1, Math.floor((x + 0.5) / sc))) * 4, d = (y * sw + x) * 4; sd[d] = data[s]; sd[d + 1] = data[s + 1]; sd[d + 2] = data[s + 2]; sd[d + 3] = 255; }
      st.small = { data: sd, w: sw, h: sh };
    }
    if (opts.video) st.ref = { data, w, h };   // video: levels are measured once on this reference (no flicker)
    if (n < 64) return st;
    if (opts.video) {   // veil colour from the brightest dark-channel pixels of the reference; no per-pixel transmission map for video
      const gbv = new Float32Array(n);
      for (let i = 0, j = 0; i < n; i++, j += 4) gbv[i] = Math.min(data[j + 1], data[j + 2]) / 255;
      const darkv = minFilter(gbv, w, h, Math.max(2, Math.round(Math.max(w, h) / 200))), dhv = new Uint32Array(256);
      for (let i = 0; i < n; i++) dhv[Math.min(255, (darkv[i] * 255) | 0)]++;
      let accv = 0, thv = 255; for (let v = 255; v >= 0; v--) { accv += dhv[v]; if (accv >= n * 0.005) { thv = v; break; } }
      let r2 = 0, g2 = 0, b2 = 0, c2 = 0;
      for (let i = 0, j = 0; i < n; i++, j += 4) if (darkv[i] * 255 >= thv) { r2 += data[j]; g2 += data[j + 1]; b2 += data[j + 2]; c2++; }
      if (c2) st.A = [clamp(r2 / c2 / 255, 0.12, 1), clamp(g2 / c2 / 255, 0.2, 1), clamp(b2 / c2 / 255, 0.2, 1)];
      return st;
    }
    {   // smooth local red/green ratio: the colour that red recovery rebuilds red from (fine detail comes from green, so red noise is not amplified)
      const rgm = new Float32Array(n);
      for (let i = 0, j = 0; i < n; i++, j += 4) rgm[i] = Math.min(2, data[j] / (data[j + 1] + 3));
      const rad = Math.max(4, Math.round(Math.max(w, h) / 60));
      st.rg = boxBlur(boxBlur(rgm, w, h, rad), w, h, rad);
    }

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
    const gr = (1 + p.temp * 0.004) * ex * Math.pow(2, (p.gainR || 0) / 50), gb = (1 - p.temp * 0.004) * ex * Math.pow(2, (p.gainB || 0) / 50), gg = (1 + p.tint * 0.003) * ex * Math.pow(2, (p.gainG || 0) / 50);
    const dz = p.dehaze ? clamp(p.dehazeAmt / 100, 0, 1) : 0;
    // depth-aware mode: per-channel transmission exp(-k_c * z), z = relative distance (0 near .. 1 far) from the depth model.
    // red is absorbed fastest (k_r = rr), green about 1+0.3(rr-1) times blue; far water is brought back the most.
    const dd = !!(p.depth && st.depth), dA = clamp((p.depthAmt == null ? 60 : p.depthAmt) / 100, 0, 1.5), rr = p.depthRR || 4;
    const Kd = [dA * 0.55 * rr, dA * 0.55 * (1 + (rr - 1) * 0.3), dA * 0.55], TMIN = 0.18;
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
    // red recovery: where red is missing (local r/g ratio low) rebuild it from green * a lifted ratio; keeps real red where it exists
    const rrw = clamp((p.redRecover || 0) / 100, 0, 1), rgGlobal = st.r / Math.max(st.g, 0.004);
    const red = (r, g, x, y) => {
      if (rrw <= 0) return r;
      const rg = st.rg ? st.rg[((y * sy) | 0) * tw + ((x * sx) | 0)] : rgGlobal, need = Math.max(0, 0.85 - rg), T = rg + rrw * 0.9 * need, w = rrw * clamp(need / 0.5, 0, 1);
      return r + w * (g * T - r);
    };
    const tmin = st.ref ? 0.5 : 0.3;   // video: at most 2x boost, bright shafts no longer clip to white
    const Araw = st.A || [0.3, 0.55, 0.75];
    stage1(Araw[0], Araw[1], Araw[2]);
    const A1r = C.r, A1g = C.g, A1b = C.b, A1min = Math.max(0.05, Math.min(A1g, A1b));
    const dehaze = (x, y, prot) => {
      if (dd) {
        const z = st.depth[((y * sy) | 0) * tw + ((x * sx) | 0)], m = 1 - prot * 0.95;
        const tR = 1 - m * (1 - Math.max(TMIN, Math.exp(-Kd[0] * z))), tG = 1 - m * (1 - Math.max(TMIN, Math.exp(-Kd[1] * z))), tB = 1 - m * (1 - Math.max(TMIN, Math.exp(-Kd[2] * z)));
        C.r = (C.r - A1r) / tR + A1r; C.g = (C.g - A1g) / tG + A1g; C.b = (C.b - A1b) / tB + A1b;
        return;
      }
      let t = tr ? tr[((y * sy) | 0) * tw + ((x * sx) | 0)] : 1 - 0.95 * Math.min(1, Math.min(C.g, C.b) / A1min);
      t = 1 - dz * (1 - prot * 0.95) * (1 - t); if (t < tmin) t = tmin;
      C.r = (C.r - A1r) / t + A1r; C.g = (C.g - A1g) / t + A1g; C.b = (C.b - A1b) / t + A1b;
    };
    // soft mask for skin-like hues (orange, g/r about 0.45-0.9, blue below green)
    const skinMask = (r, g, b) => {
      if (!skin || r < 0.12 || r < g || g < b * 0.95) return 0;
      const gr2 = g / r;
      return clamp(Math.min((gr2 - 0.3) / 0.15, (0.95 - gr2) / 0.1), 0, 1);
    };
    return { skin, kR, kB, ex, gain: [gr, gg, gb], dz, A1: [A1r, A1g, A1b], A1min, hasTrans: !!tr, tmin, dd, Kd, rrw, rgGlobal, red, stage1, dehaze, skinMask, C };
  }

  /* Per-channel percentile stretch. Measured once per clip/image and cached, so video does not flicker. */
  function getLevels(p, st, data, w, h) {
    const L = clamp((p.levels || 0) / 100, 0, 1);
    if (L <= 0) return { L: 0, lo: [0, 0, 0], sc: [1, 1, 1] };
    if (st.ref) { data = st.ref.data; w = st.ref.w; h = st.ref.h; }
    const key = [p.levels, p.cast, p.castAmt, p.temp, p.tint, p.exposure, p.dehaze, p.dehazeAmt, p.skin, p.gainR, p.gainG, p.gainB, p.redRecover, p.depth, p.depthAmt, p.depthRR, w, h].join('|');
    if (st._lvKey === key) return st._lv;
    const core = makeCore(p, st, w, h), dz = core.dz, C = core.C;
    const H = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)], step = Math.max(2, Math.round(Math.sqrt(w * h / 40000)));
    let cnt = 0;
    for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4;
      { const gv = data[i + 1] / 255; core.stage1(core.red(data[i] / 255, gv, x, y), gv, data[i + 2] / 255); }
      if (dz > 0 || core.dd) core.dehaze(x, y, 0);
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
        core.stage1(core.red(r0, g0, x, y), g0, b0);
        if (dz > 0 || core.dd) core.dehaze(x, y, m0);
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
  /* Scene-adaptive Auto.
     1 read the scene: how much red is lost, blue or green water, haze, contrast, brightness, and a confidence that it is an underwater shot at all
     2 build a base recipe from those numbers (continuous, not fixed)
     3 try a few variations on a small copy of the picture and keep the one with the most natural colour balance, no clipping and no orange skin
     `amt` (0..1.5) scales the whole look, so one slider moves between "off" and "stronger". */
  function sceneOf(st) {
    const g = Math.max(st.g, 0.02), redLoss = clamp(1 - st.r / g, 0, 1), blueExcess = clamp((st.b - g) / g, 0, 1), greenExcess = clamp((g - st.b) / g, 0, 1);
    const conf = clamp((Math.max(st.g, st.b) - st.r) / Math.max(st.g, st.b, 0.02) / 0.3, 0, 1);   // 0: colours already balanced / not underwater
    const spread = st.p99 - st.p1;
    const kind = conf < 0.15 ? 'corrected' : (st.minMean > 0.28 && spread < 0.65) ? 'turbid' : redLoss < 0.4 ? 'shallow' : (g - st.b) / g > 0.08 ? 'green' : 'blue';
    return { redLoss, blueExcess, greenExcess, conf, haze: st.minMean, spread, dark: st.p50 < 0.2, kind };
  }
  // each water type nudges the base recipe in the direction that suits it
  const WATER_TYPES = ['blue', 'green', 'turbid', 'shallow', 'corrected'];
  function tuneForWater(r, kind, sc) {
    const o = Object.assign({}, r);
    if (kind === 'blue') { o.cast = true; o.temp = Math.max(o.temp, Math.round(10 * Math.max(sc.blueExcess, 0.3))); o.castAmt = Math.max(o.castAmt, 70); }
    else if (kind === 'green') { o.cast = true; o.tint = Math.min(o.tint, -10); o.castAmt = Math.max(o.castAmt, 70); }
    else if (kind === 'turbid') { o.dehaze = true; o.dehazeAmt = Math.max(o.dehazeAmt, 58); o.backscatter = true; o.backAmt = 45; o.clarity = Math.max(o.clarity, 24); o.levels = Math.min(o.levels, 70); o.castAmt = Math.round(o.castAmt * 0.85); }
    else if (kind === 'shallow') { o.castAmt = Math.min(Math.max(o.castAmt, 35), 55); o.levels = Math.min(o.levels, 55); o.dehazeAmt = Math.round(o.dehazeAmt * 0.6); o.vibrance = Math.max(o.vibrance, 22); }
    else if (kind === 'corrected') { o.cast = false; o.castAmt = 0; o.levels = 30; o.dehazeAmt = Math.min(o.dehazeAmt, 15); o.backAmt = 10; o.clarity = Math.min(o.clarity, 10); o.vibrance = 10; o.temp = 0; o.tint = 0; }
    return o;
  }
  function baseRecipe(st, sc, kind) {
    const k = 0.35 + 0.65 * sc.conf;   // weak evidence of water cast -> gentle recipe
    return tuneForWater({
      cast: sc.conf > 0.05, castAmt: Math.round(clamp((60 + 55 * sc.redLoss) * k, 0, 110)),
      levels: Math.round((sc.redLoss > 0.7 ? 70 : 78) * k),
      dehaze: true, dehazeAmt: Math.round(clamp(st.minMean * 180, 22, 55) * (0.4 + 0.6 * sc.conf) * (sc.spread > 0.85 ? 0.6 : 1)),
      backscatter: true, backAmt: Math.round(25 * k),
      exposure: +clamp(Math.log2(0.4 / Math.max(st.p50, 0.05)) * 0.5, -0.4, 0.8).toFixed(2),
      contrast: 6, clarity: sc.dark ? 8 : Math.round(14 + 12 * clamp(sc.haze / 0.35, 0, 1)),
      vibrance: Math.round(12 + 10 * sc.redLoss), saturation: 0, shadows: 8, highlights: -6,
      temp: Math.round(10 * sc.blueExcess * k), tint: -Math.round(10 * sc.greenExcess * k),
      noise: sc.dark && sc.redLoss > 0.4, noiseAmt: 25,
    }, kind || sc.kind, sc);
  }
  // 0 = good, higher = worse. Natural underwater look: red recovered but not orange, no clipping, healthy spread.
  function scoreLook(o, n) {
    let R = 0, G = 0, B = 0, clip = 0, orange = 0; const hist = new Uint32Array(256);
    for (let i = 0; i < n * 4; i += 4) {
      const r = o[i], g = o[i + 1], b = o[i + 2]; R += r; G += g; B += b;
      if (r < 3 || g < 3 || b < 3 || r > 252 || g > 252 || b > 252) clip++;
      if (r > 200 && g < r * 0.62 && b < g) orange++;
      hist[(0.2126 * r + 0.7152 * g + 0.0722 * b) | 0]++;
    }
    R = R / n + 1; G = G / n + 1; B = B / n + 1;
    const cut = (q) => { let a = 0; for (let i = 0; i < 256; i++) { a += hist[i]; if (a >= n * q) return i / 255; } return 1; };
    const spread = cut(0.99) - cut(0.01);
    return Math.abs(Math.log(R / G / 0.9)) + 0.7 * Math.abs(Math.log(B / G / 1.05)) + 4 * clip / n + 6 * orange / n + 0.6 * Math.abs(spread - 0.85);
  }
  const lerpNum = (a, b, t) => a + (b - a) * t;
  function scaleRecipe(r, amt) {
    const o = Object.assign({}, r), A = clamp(amt, 0, 1.5);
    for (const k of ['castAmt', 'levels', 'dehazeAmt', 'depthAmt', 'backAmt', 'noiseAmt', 'exposure', 'contrast', 'clarity', 'vibrance', 'shadows', 'highlights', 'temp', 'tint']) {
      if (typeof o[k] === 'number') o[k] = k === 'exposure' ? +(o[k] * A).toFixed(2) : Math.round(k.endsWith('Amt') || k === 'levels' ? clamp(o[k] * A, 0, 100) : o[k] * A);
    }
    return o;
  }
  // water: 'auto' (use what was detected) or one of WATER_TYPES chosen by the user
  function autoParams(st, amt, water, useDepth) {
    amt = amt == null ? 1 : amt;
    const kind = water && water !== 'auto' ? water : sceneOf(st).kind, dep = !!(useDepth && st.depth), key = kind + (dep ? '|d' : '');
    st._auto = st._auto || {};
    if (!st._auto[key]) st._auto[key] = dep ? autoBestDepth(st, kind) : autoBest(st, kind);   // the search runs once per picture and type; the Amount slider only rescales it
    return scaleRecipe(st._auto[key], amt);
  }
  // depth-aware Auto: the distance map is given, so the search is over how strongly (and how red-heavy) the water is, scored like the normal search
  function autoBestDepth(st, kind) {
    const sc = sceneOf(st), base = baseRecipe(st, sc, kind), sm = st.small;
    const out = new Uint8ClampedArray(sm.data.length), n = sm.w * sm.h, s2 = Object.assign({}, st);
    let best = null, bs = Infinity;
    for (const da of [35, 60, 85]) for (const rr of [2.5, 4, 6]) for (const cs of [0.35, 0.7]) {
      const cand = Object.assign({}, base, { depth: true, depthAmt: da, depthRR: rr, castAmt: Math.round(base.castAmt * cs), levels: Math.round(base.levels * 0.8) });
      s2._lvKey = null; process(sm.data, out, sm.w, sm.h, Object.assign(neutralParams(), cand), s2);
      const sco = scoreLook(out, n); if (sco < bs) { bs = sco; best = cand; }
    }
    return best || Object.assign({}, base, { depth: true });
  }
  function autoBest(st, kind) {
    const sc = sceneOf(st), base = baseRecipe(st, sc, kind);
    let best = base;
    const sm = st.small;
    if (sm && kind !== 'corrected' && sc.conf > 0.05) {
      const s2 = Object.assign({}, st); s2._lvKey = null;   // keep the real statistics' cache untouched
      const out = new Uint8ClampedArray(sm.data.length), n = sm.w * sm.h;
      let bs = Infinity;
      for (const cs of [0.55, 0.8, 1, 1.2]) for (const ls of [0.8, 1, 1.15]) {
        const cand = Object.assign({}, base, { castAmt: Math.round(clamp(base.castAmt * cs, 0, 120)), levels: Math.round(base.levels * ls) });
        const p = Object.assign(neutralParams(), cand);
        s2._lvKey = null; process(sm.data, out, sm.w, sm.h, p, s2);
        // mild preference for the base recipe so ties never wander off
        const sco = scoreLook(out, n) + (cs === 1 && ls === 1 ? 0 : 0.03);
        if (sco < bs) { bs = sco; best = cand; }
      }
    }
    return best;
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

  return { BANDS, neutralParams, defaultParams, clone, sanitizeParams, curveLUT, curveTables, wheelVectors, activeBands, computeStats, makeCore, getLevels, process, autoParams, sceneOf, WATER_TYPES, makeZip, clamp };
})();
