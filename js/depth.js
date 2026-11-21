/* Dive ColorLab – optional depth estimation (Depth Anything V2 Small, runs in the browser with ONNX Runtime Web / WebAssembly).
   Nothing is downloaded until Depth.load() is called (the "Depth-aware" switch). The photo never leaves the device. */
const Depth = (() => {
  const BASE = (document.currentScript && document.currentScript.src ? document.currentScript.src : location.href).replace(/[^/]*$/, '');
  let ort = null, sess = null, loading = null;
  const MEAN = [0.485, 0.456, 0.406], STD = [0.229, 0.224, 0.225];

  async function fetchModel(onStatus) {
    const res = await fetch(BASE + '../models/depth-anything-v2-small-q.onnx');
    if (!res.ok) throw new Error('depth model not found');
    const total = +res.headers.get('Content-Length') || 27.3e6;
    if (!res.body || !res.body.getReader) return new Uint8Array(await res.arrayBuffer());
    const rd = res.body.getReader(), parts = []; let got = 0;
    for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; onStatus && onStatus(`Downloading depth model ${Math.round(got / total * 100)}%`); }
    const out = new Uint8Array(got); let o = 0; parts.forEach((p) => { out.set(p, o); o += p.length; });
    return out;
  }
  function load(onStatus) {
    if (sess) return Promise.resolve(sess);
    if (loading) return loading;
    loading = (async () => {
      onStatus && onStatus('Loading depth engine…');
      ort = await import(BASE + 'vendor/ort/ort.wasm.min.mjs');
      ort.env.wasm.wasmPaths = BASE + 'vendor/ort/'; ort.env.wasm.numThreads = 1; ort.env.wasm.proxy = false;
      const bytes = await fetchModel(onStatus);
      onStatus && onStatus('Starting depth model…');
      sess = await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
      return sess;
    })().catch((e) => { loading = null; throw e; });
    return loading;
  }
  const isLoaded = () => !!sess;

  /* canvas: any CanvasImageSource-sized picture. Returns { z: Float32Array(w*h) in 0..1 where 0 = nearest, 1 = farthest, w, h }. */
  async function estimate(source, sw, sh, longSide) {
    await load();
    const s = (longSide || 364) / Math.max(sw, sh), W = Math.max(14, Math.round(sw * s / 14) * 14), H = Math.max(14, Math.round(sh * s / 14) * 14);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingQuality = 'high'; x.drawImage(source, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H).data, n = W * H, f = new Float32Array(3 * n);
    for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) f[k * n + i] = (d[i * 4 + k] / 255 - MEAN[k]) / STD[k];
    const input = new ort.Tensor('float32', f, [1, 3, H, W]);
    const out = await sess.run({ [sess.inputNames[0]]: input });
    const t = out[sess.outputNames[0]], raw = t.data, dims = t.dims, oh = dims[dims.length - 2], ow = dims[dims.length - 1];
    // relative inverse depth (bigger = closer) -> robust 0..1 "farness"
    const sorted = Float32Array.from(raw).sort(), lo = sorted[Math.floor(sorted.length * 0.02)], hi = sorted[Math.floor(sorted.length * 0.98)], span = Math.max(1e-6, hi - lo);
    const z = new Float32Array(ow * oh);
    for (let i = 0; i < z.length; i++) z[i] = 1 - Math.min(1, Math.max(0, (raw[i] - lo) / span));
    return { z, w: ow, h: oh };
  }
  /* bilinear resample of a depth map to tw x th (the size the colour engine analyses at) */
  function resample(d, tw, th) {
    const out = new Float32Array(tw * th);
    for (let y = 0; y < th; y++) {
      const fy = (y + 0.5) / th * d.h - 0.5, y0 = Math.max(0, Math.min(d.h - 1, Math.floor(fy))), y1 = Math.min(d.h - 1, y0 + 1), wy = Math.min(1, Math.max(0, fy - y0));
      for (let x = 0; x < tw; x++) {
        const fx = (x + 0.5) / tw * d.w - 0.5, x0 = Math.max(0, Math.min(d.w - 1, Math.floor(fx))), x1 = Math.min(d.w - 1, x0 + 1), wx = Math.min(1, Math.max(0, fx - x0));
        out[y * tw + x] = (d.z[y0 * d.w + x0] * (1 - wx) + d.z[y0 * d.w + x1] * wx) * (1 - wy) + (d.z[y1 * d.w + x0] * (1 - wx) + d.z[y1 * d.w + x1] * wx) * wy;
      }
    }
    return out;
  }
  return { load, isLoaded, estimate, resample };
})();
