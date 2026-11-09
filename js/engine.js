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
      temp: 0, tint: 0, exposure: 0, contrast: 0, highlights: 0, shadows: 0, vibrance: 0, saturation: 0, clarity: 0,
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

  /* ---------- statistics ---------- */
  function computeStats(data, w, h) {
    let r = 0, g = 0, b = 0, mn = 0, c = 0;
    const hist = new Uint32Array(256);
    for (let i = 0; i < data.length; i += 4) {
      const R = data[i], G = data[i + 1], B = data[i + 2];
      r += R; g += G; b += B; mn += Math.min(R, G, B);
      hist[(0.2126 * R + 0.7152 * G + 0.0722 * B) | 0]++;
      c++;
    }
    const cut = (q) => { let a = 0; const t = c * q; for (let i = 0; i < 256; i++) { a += hist[i]; if (a >= t) return i / 255; } return 1; };
    return {
      r: Math.max(r / c / 255, 0.004), g: Math.max(g / c / 255, 0.004), b: Math.max(b / c / 255, 0.004),
      minMean: mn / c / 255, hist, p1: cut(0.01), p99: cut(0.99), p50: cut(0.5),
    };
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

  /* ---------- the pipeline ---------- */
  function process(src, dst, w, h, p, st) {
    let input = src;
    if (p.noise && p.noiseAmt > 0) input = denoise(src, w, h, clamp(p.noiseAmt / 100, 0, 1));

    // multiplicative gains: underwater cast, temperature, tint, exposure
    let gr = 1, gg = 1, gb = 1;
    if (p.cast) {
      const a = p.castAmt / 100, avg = (st.r + st.g + st.b) / 3;
      gr = 1 + (clamp(avg / st.r, 0.6, 2.6) - 1) * a;
      gg = 1 + (clamp(avg / st.g, 0.6, 2.6) - 1) * a;
      gb = 1 + (clamp(avg / st.b, 0.6, 2.6) - 1) * a;
    }
    const ex = Math.pow(2, p.exposure);
    gr *= (1 + p.temp * 0.004) * ex; gb *= (1 - p.temp * 0.004) * ex; gg *= (1 + p.tint * 0.003) * ex;

    const dz = p.dehaze ? (p.dehazeAmt / 100) * 0.8 : 0;
    const bk = p.backscatter ? p.backAmt / 100 : 0;
    const cl = p.clarity / 100 * 0.6;
    const ct = 1 + p.contrast / 100;
    const hi = p.highlights / 100 * 0.4, sh = p.shadows / 100 * 0.4;
    const vib = p.vibrance / 100, sat = 1 + p.saturation / 100;

    const lm = curveLUT(p.curves.rgb), lr = curveLUT(p.curves.r), lg = curveLUT(p.curves.g), lb = curveLUT(p.curves.b);
    const useCurves = !(isIdentity(p.curves.rgb) && isIdentity(p.curves.r) && isIdentity(p.curves.g) && isIdentity(p.curves.b));
    const cR = new Float32Array(256), cG = new Float32Array(256), cB = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const m = lm[i], j = (m * 255 + 0.5) | 0;
      cR[i] = lr[j]; cG[i] = lg[j]; cB[i] = lb[j];
    }

    // colour wheels
    const wh = ['shadows', 'mid', 'high'].map((k) => {
      const o = p.wheels[k], mag = Math.min(1, Math.hypot(o.x, o.y)), ang = Math.atan2(o.x, -o.y);
      return { r: Math.cos(ang) * mag * 0.16 + o.l / 100 * 0.25, g: Math.cos(ang - 2.0944) * mag * 0.16 + o.l / 100 * 0.25, b: Math.cos(ang - 4.18879) * mag * 0.16 + o.l / 100 * 0.25, on: mag > 0.001 || o.l !== 0 };
    });
    const wheelsOn = wh.some((o) => o.on);

    // HSL bands
    const bands = BANDS.map((b) => ({ c: b.c, ...p.hsl[b.id] })).filter((b) => b.h || b.s || b.l);
    const hslOn = bands.length > 0;

    const out = dst;
    const n = w * h * 4;
    for (let i = 0; i < n; i += 4) {
      let r = input[i] / 255 * gr, g = input[i + 1] / 255 * gg, b = input[i + 2] / 255 * gb;
      if (r > 0.85) r = 0.85 + 0.15 * Math.tanh((r - 0.85) / 0.15);
      if (g > 0.85) g = 0.85 + 0.15 * Math.tanh((g - 0.85) / 0.15);
      if (b > 0.85) b = 0.85 + 0.15 * Math.tanh((b - 0.85) / 0.15);

      if (dz > 0) {
        const v = Math.min(r, g, b) * dz, iv = 1 / (1 - v);
        r = (r - v) * iv; g = (g - v) * iv; b = (b - v) * iv;
      }
      let Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (bk > 0) {
        const s = Math.max(r, g, b) - Math.min(r, g, b);
        const t = clamp((Y - 0.55) / 0.35, 0, 1);
        const wgt = clamp(1 - s * 3, 0, 1) * t * t * (3 - 2 * t) * bk * 0.35;
        r *= 1 - wgt; g *= 1 - wgt; b *= 1 - wgt;
      }
      if (cl) {
        r = clamp(r, 0, 1); g = clamp(g, 0, 1); b = clamp(b, 0, 1);
        r += cl * (r * r * (3 - 2 * r) - r); g += cl * (g * g * (3 - 2 * g) - g); b += cl * (b * b * (3 - 2 * b) - b);
      }
      if (ct !== 1) { r = (r - 0.5) * ct + 0.5; g = (g - 0.5) * ct + 0.5; b = (b - 0.5) * ct + 0.5; }
      Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (hi || sh) {
        const yc = clamp(Y, 0, 1);
        const add = hi * yc * yc + sh * (1 - yc) * (1 - yc);
        r += add; g += add; b += add;
      }
      if (vib || sat !== 1) {
        r = clamp(r, 0, 1); g = clamp(g, 0, 1); b = clamp(b, 0, 1);
        const mx = Math.max(r, g, b), mi = Math.min(r, g, b);
        const f = sat * (1 + vib * (1 - (mx - mi)));
        Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = Y + (r - Y) * f; g = Y + (g - Y) * f; b = Y + (b - Y) * f;
      }
      r = clamp(r, 0, 1); g = clamp(g, 0, 1); b = clamp(b, 0, 1);
      if (useCurves) { r = cR[(r * 255 + 0.5) | 0]; g = cG[(g * 255 + 0.5) | 0]; b = cB[(b * 255 + 0.5) | 0]; }

      if (wheelsOn) {
        const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const ws = clamp(1 - y * 2, 0, 1), wm = 1 - Math.abs(2 * y - 1), wi = clamp(2 * y - 1, 0, 1);
        r += wh[0].r * ws + wh[1].r * wm + wh[2].r * wi;
        g += wh[0].g * ws + wh[1].g * wm + wh[2].g * wi;
        b += wh[0].b * ws + wh[1].b * wm + wh[2].b * wi;
        r = clamp(r, 0, 1); g = clamp(g, 0, 1); b = clamp(b, 0, 1);
      }

      if (hslOn) {
        const mx = Math.max(r, g, b), mi = Math.min(r, g, b), d = mx - mi;
        if (d > 1e-5) {
          let l = (mx + mi) / 2, s = l > 0.5 ? d / (2 - mx - mi) : d / (mx + mi), hh;
          if (mx === r) hh = ((g - b) / d + (g < b ? 6 : 0)) * 60;
          else if (mx === g) hh = ((b - r) / d + 2) * 60;
          else hh = ((r - g) / d + 4) * 60;
          let dh = 0, ds = 0, dl = 0;
          for (let k = 0; k < bands.length; k++) {
            const bd = bands[k], dist = Math.abs(((hh - bd.c + 540) % 360) - 180);
            if (dist < 45) {
              const wt = (0.5 + 0.5 * Math.cos(Math.PI * dist / 45)) * Math.min(1, s * 2.5);
              dh += bd.h * 0.3 * wt; ds += bd.s / 100 * wt; dl += bd.l / 100 * 0.25 * wt;
            }
          }
          hh = (hh + dh + 360) % 360; s = clamp(s * (1 + ds), 0, 1); l = clamp(l + dl, 0, 1);
          const q = l < 0.5 ? l * (1 + s) : l + s - l * s, pp = 2 * l - q, hk = hh / 360;
          const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? pp + (q - pp) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? pp + (q - pp) * (2 / 3 - t) * 6 : pp; };
          r = f(hk + 1 / 3); g = f(hk); b = f(hk - 1 / 3);
        }
      }
      out[i] = r * 255 + 0.5; out[i + 1] = g * 255 + 0.5; out[i + 2] = b * 255 + 0.5; out[i + 3] = 255;
    }
  }

  /* ---------- auto routines ---------- */
  function autoParams(st) {
    const avg = (st.r + st.g + st.b) / 3;
    const afterY = 0.2126 * Math.min(3.2, avg / st.r) * st.r + 0.7152 * Math.min(3.2, avg / st.g) * st.g + 0.0722 * Math.min(3.2, avg / st.b) * st.b;
    const spread = st.p99 - st.p1;
    return {
      cast: true, castAmt: 70,
      exposure: +clamp(Math.log2(0.42 / Math.max(afterY, 0.02)), -1, 1).toFixed(2),
      contrast: Math.round(clamp((0.82 - spread) * 90, 0, 38)),
      vibrance: 28, saturation: 8, shadows: 16, highlights: -8,
      dehaze: true, dehazeAmt: Math.round(clamp(st.minMean * 130, 12, 60)),
      backscatter: true, backAmt: 30, temp: 6, tint: 0,
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

  return { BANDS, neutralParams, defaultParams, clone, curveLUT, computeStats, process, autoParams, makeZip, clamp };
})();
