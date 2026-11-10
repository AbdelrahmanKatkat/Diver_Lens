/* Dive ColorLab – GPU renderer (WebGL2). Same maths as Engine.process, but runs in real time.
   Used for live preview, photo export and the fast MP4 video export. Everything stays on the device. */
const GLR = (() => {
  const VS = `#version 300 es
in vec2 p; out vec2 vUv;
void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

  const FS_MAIN = `#version 300 es
precision highp float; precision highp int;
uniform sampler2D uSrc; uniform sampler2D uTrans; uniform sampler2D uCurve;
uniform vec2 uTexel; uniform float uDenoise;
uniform int uSkin, uHasTrans, uCurves, uWOn, uNB;
uniform float uKR, uKB, uDz, uA1min, uL, uBk, uCt, uHi, uSh, uVib, uSat, uEx;
uniform vec3 uGain, uA1, uLo, uSc, uW0, uW1, uW2;
uniform vec4 uBand[9];
in vec2 vUv; out vec4 o;

float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
float softc(float v){ return v > 0.85 ? 0.85 + 0.15 * tanh((v - 0.85) / 0.15) : v; }
vec3 stage1(vec3 c){
  float warm = uSkin != 0 ? clamp((c.r / (max(c.g, c.b) + 0.03) - 1.0) / 0.5, 0.0, 1.0) : 0.0;
  float r = c.r + uKR * (1.0 - c.r) * c.g * (1.0 - warm);
  float b = c.b + uKB * (1.0 - c.b) * c.g;
  vec3 q = vec3(r, c.g, b) * uGain;
  return vec3(softc(q.r), softc(q.g), softc(q.b));
}
float skinMask(vec3 c){
  if (uSkin == 0 || c.r < 0.12 || c.r < c.g || c.g < c.b * 0.95) return 0.0;
  float gr = c.g / c.r;
  return clamp(min((gr - 0.3) / 0.15, (0.95 - gr) / 0.1), 0.0, 1.0);
}
float hueF(float pp, float q, float t){
  t = fract(t);
  if (t < 1.0 / 6.0) return pp + (q - pp) * 6.0 * t;
  if (t < 0.5) return q;
  if (t < 2.0 / 3.0) return pp + (q - pp) * (2.0 / 3.0 - t) * 6.0;
  return pp;
}
void main(){
  vec3 raw = texture(uSrc, vUv).rgb;
  if (uDenoise > 0.0) {
    vec3 s = vec3(0.0);
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) s += texture(uSrc, vUv + vec2(float(i), float(j)) * uTexel).rgb;
    raw = mix(raw, s / 9.0, uDenoise);
  }
  float m0 = skinMask(raw);
  vec3 c = stage1(raw);
  if (uDz > 0.0) {
    float t = uHasTrans != 0 ? texture(uTrans, vec2(vUv.x, 1.0 - vUv.y)).r : 1.0 - 0.95 * min(1.0, min(c.g, c.b) / uA1min);
    t = 1.0 - uDz * (1.0 - m0 * 0.95) * (1.0 - t); t = max(t, 0.3);
    c = (c - uA1) / t + uA1;
  }
  if (uL > 0.0) {
    float Lp = uL * (1.0 - 0.9 * max(m0, skinMask(c)));
    c += ((c - uLo) * uSc - c) * Lp;
  }
  c = clamp(c, 0.0, 1.0);
  float Y = luma(c);
  if (uBk > 0.0) {
    float s = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
    float t = clamp((Y - 0.55) / 0.35, 0.0, 1.0);
    float wgt = clamp(1.0 - s * 3.0, 0.0, 1.0) * t * t * (3.0 - 2.0 * t) * uBk * 0.35;
    c *= 1.0 - wgt;
  }
  if (uCt != 1.0) c = (c - 0.5) * uCt + 0.5;
  if (uHi != 0.0 || uSh != 0.0) {
    Y = clamp(luma(c), 0.0, 1.0);
    c += uHi * Y * Y + uSh * (1.0 - Y) * (1.0 - Y);
  }
  if (uVib != 0.0 || uSat != 1.0) {
    c = clamp(c, 0.0, 1.0);
    float sm = max(m0, skinMask(c));
    float mx = max(c.r, max(c.g, c.b)), mi = min(c.r, min(c.g, c.b));
    float f = (1.0 + (uSat - 1.0) * (1.0 - 0.8 * sm)) * (1.0 + uVib * (1.0 - sm) * (1.0 - (mx - mi)));
    Y = luma(c);
    c = Y + (c - Y) * f;
  }
  c = clamp(c, 0.0, 1.0);
  if (uCurves != 0) {
    c = vec3(texelFetch(uCurve, ivec2(int(c.r * 255.0 + 0.5), 0), 0).r,
             texelFetch(uCurve, ivec2(int(c.g * 255.0 + 0.5), 0), 0).g,
             texelFetch(uCurve, ivec2(int(c.b * 255.0 + 0.5), 0), 0).b);
  }
  if (uWOn != 0) {
    float yy = luma(c);
    float ws = clamp(1.0 - yy * 2.0, 0.0, 1.0), wm = 1.0 - abs(2.0 * yy - 1.0), wi = clamp(2.0 * yy - 1.0, 0.0, 1.0);
    c = clamp(c + uW0 * ws + uW1 * wm + uW2 * wi, 0.0, 1.0);
  }
  if (uNB > 0) {
    float mx = max(c.r, max(c.g, c.b)), mi = min(c.r, min(c.g, c.b)), d = mx - mi;
    if (d > 1e-5) {
      float l = (mx + mi) * 0.5, s = l > 0.5 ? d / (2.0 - mx - mi) : d / (mx + mi), hh;
      if (mx == c.r) hh = ((c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0)) * 60.0;
      else if (mx == c.g) hh = ((c.b - c.r) / d + 2.0) * 60.0;
      else hh = ((c.r - c.g) / d + 4.0) * 60.0;
      float dh = 0.0, ds = 0.0, dl = 0.0;
      for (int k = 0; k < 9; k++) {
        if (k >= uNB) break;
        vec4 bd = uBand[k];
        float dist = abs(mod(hh - bd.x + 540.0, 360.0) - 180.0);
        if (dist < 45.0) {
          float wt = (0.5 + 0.5 * cos(3.14159265 * dist / 45.0)) * min(1.0, s * 2.5);
          dh += bd.y * 0.3 * wt; ds += bd.z / 100.0 * wt; dl += bd.w / 100.0 * 0.25 * wt;
        }
      }
      hh = mod(hh + dh + 360.0, 360.0); s = clamp(s * (1.0 + ds), 0.0, 1.0); l = clamp(l + dl, 0.0, 1.0);
      float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s, pp = 2.0 * l - q, hk = hh / 360.0;
      c = vec3(hueF(pp, q, hk + 1.0 / 3.0), hueF(pp, q, hk), hueF(pp, q, hk - 1.0 / 3.0));
    }
  }
  if (m0 > 0.0) {
    float wk = min(1.0, m0 * 1.6) * 0.8;
    float yo = luma(c), yr = max(0.02, luma(raw)), sc2 = yo / yr;
    c += (clamp(raw * sc2, 0.0, 1.0) - c) * wk;
    float cIn = max(raw.r, max(raw.g, raw.b)) - min(raw.r, min(raw.g, raw.b));
    float cOut = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
    float lim = cIn * max(1.0, uEx) * 1.02 + 0.01;
    if (cOut > lim) {
      float k = 1.0 - min(1.0, m0 * 1.6) * (1.0 - lim / cOut), yy = luma(c);
      c = yy + (c - yy) * k;
    }
  }
  o = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

  const FS_DOWN = `#version 300 es
precision highp float; uniform sampler2D uTex; uniform float uLod; in vec2 vUv; out vec4 o;
void main(){ o = vec4(dot(textureLod(uTex, vUv, uLod).rgb, vec3(0.2126, 0.7152, 0.0722)), 0.0, 0.0, 1.0); }`;

  const FS_BLUR = `#version 300 es
precision highp float; uniform sampler2D uTex; uniform vec2 uDir; uniform int uR; in vec2 vUv; out vec4 o;
void main(){
  float s = 0.0;
  for (int k = -64; k <= 64; k++) { if (k < -uR || k > uR) continue; s += texture(uTex, vUv + uDir * float(k)).r; }
  o = vec4(s / float(2 * uR + 1), 0.0, 0.0, 1.0);
}`;

  const FS_FINAL = `#version 300 es
precision highp float; uniform sampler2D uMain; uniform sampler2D uBlur; uniform float uK; in vec2 vUv; out vec4 o;
void main(){
  vec3 c = texture(uMain, vUv).rgb;
  float Y = dot(c, vec3(0.2126, 0.7152, 0.0722)), B = texture(uBlur, vUv).r;
  float g = clamp(1.0 + uK * (Y - B) / (Y + 0.08), 0.6, 1.6);
  o = vec4(clamp(c * g, 0.0, 1.0), 1.0);
}`;

  let supportCache = null, progId = 0;
  function supported() {
    if (supportCache === null) {
      try { const c = document.createElement('canvas'); const g = c.getContext('webgl2'); supportCache = !!g; if (g) { const e = g.getExtension('WEBGL_lose_context'); e && e.loseContext(); } } catch (e) { supportCache = false; }
    }
    return supportCache;
  }

  class Renderer {
    constructor() {
      this.canvas = document.createElement('canvas'); this.canvas.width = this.canvas.height = 16;
      const gl = (this.gl = this.canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' }));
      this.ok = !!gl; if (!gl) return;
      this.maxSize = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 8192);
      this.floatRT = !!gl.getExtension('EXT_color_buffer_float');
      this.progs = { main: this.mk(FS_MAIN), down: this.mk(FS_DOWN), blur: this.mk(FS_BLUR), fin: this.mk(FS_FINAL) };
      this.vao = gl.createVertexArray(); gl.bindVertexArray(this.vao);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      for (const k in this.progs) { const l = gl.getAttribLocation(this.progs[k], 'p'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0); }
      this.texSrc = this.tex(gl.LINEAR_MIPMAP_LINEAR, gl.LINEAR);
      this.texTrans = this.tex(gl.LINEAR, gl.LINEAR);
      this.texCurve = this.tex(gl.NEAREST, gl.NEAREST);
      this.texA = this.tex(gl.LINEAR_MIPMAP_NEAREST, gl.LINEAR);
      this.texS1 = this.tex(gl.LINEAR, gl.LINEAR); this.texS2 = this.tex(gl.LINEAR, gl.LINEAR);
      this.fbA = gl.createFramebuffer(); this.fbS1 = gl.createFramebuffer(); this.fbS2 = gl.createFramebuffer();
      this.locs = new Map(); this.w = 0; this.h = 0; this._transFor = null; this.hasTrans = false;
    }
    mk(fs) {
      const gl = this.gl, sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
      const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
      p.__id = ++progId; gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
    }
    tex(min, mag) {
      const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, min); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mag);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }
    u(prog, name) {
      const k = prog.__id + ':' + name; let l = this.locs.get(k);
      if (l === undefined) { l = this.gl.getUniformLocation(prog, name); this.locs.set(k, l); }
      return l;
    }
    alloc(t, fb, w, h, float) {
      const gl = this.gl; gl.bindTexture(gl.TEXTURE_2D, t);
      if (float) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    }
    setSize(w, h) {
      w = Math.max(2, Math.min(this.maxSize, Math.round(w))); h = Math.max(2, Math.min(this.maxSize, Math.round(h)));
      if (w === this.w && h === this.h) return;
      this.w = this.canvas.width = w; this.h = this.canvas.height = h;
      this.sw = Math.max(2, Math.ceil(w / 8)); this.sh = Math.max(2, Math.ceil(h / 8));
      this.alloc(this.texA, this.fbA, w, h, false);
      this.alloc(this.texS1, this.fbS1, this.sw, this.sh, this.floatRT);
      this.alloc(this.texS2, this.fbS2, this.sw, this.sh, this.floatRT);
    }
    /* src: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap */
    upload(src) {
      const gl = this.gl; gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texSrc);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.generateMipmap(gl.TEXTURE_2D);
    }
    setTrans(st) {
      if (this._transFor === st) return;
      this._transFor = st; this.hasTrans = !!st.trans; if (!st.trans) return;
      const gl = this.gl; gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.texTrans);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, st.tw, st.th, 0, gl.RED, gl.FLOAT, st.trans);
    }
    pass(prog, fb, w, h) { const gl = this.gl; gl.useProgram(prog); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.viewport(0, 0, w, h); }
    draw() { this.gl.drawArrays(this.gl.TRIANGLES, 0, 3); }

    /* params p, stats st, levels lv = Engine.getLevels(...) */
    render(p, st, lv) {
      const gl = this.gl, w = this.w, h = this.h, P = this.progs.main, U = (n) => this.u(P, n);
      const core = Engine.makeCore(p, st, w, h), cv = Engine.curveTables(p), wh = Engine.wheelVectors(p), bands = Engine.activeBands(p);
      this.setTrans(st);
      const lut = new Float32Array(256 * 4);
      for (let i = 0; i < 256; i++) { lut[i * 4] = cv.cR[i]; lut[i * 4 + 1] = cv.cG[i]; lut[i * 4 + 2] = cv.cB[i]; lut[i * 4 + 3] = 1; }
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.texCurve); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 256, 1, 0, gl.RGBA, gl.FLOAT, lut);
      const clar = p.clarity ? true : false;
      this.pass(P, clar ? this.fbA : null, w, h);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texSrc);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.texTrans);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.texCurve);
      gl.uniform1i(U('uSrc'), 0); gl.uniform1i(U('uTrans'), 1); gl.uniform1i(U('uCurve'), 2);
      gl.uniform2f(U('uTexel'), 1 / w, 1 / h);
      gl.uniform1f(U('uDenoise'), p.noise && p.noiseAmt > 0 ? Math.min(1, p.noiseAmt / 100) : 0);
      gl.uniform1i(U('uSkin'), core.skin ? 1 : 0);
      gl.uniform1f(U('uKR'), core.kR); gl.uniform1f(U('uKB'), core.kB);
      gl.uniform3f(U('uGain'), core.gain[0], core.gain[1], core.gain[2]);
      gl.uniform1f(U('uDz'), core.dz); gl.uniform3f(U('uA1'), core.A1[0], core.A1[1], core.A1[2]); gl.uniform1f(U('uA1min'), core.A1min);
      gl.uniform1i(U('uHasTrans'), this.hasTrans ? 1 : 0);
      gl.uniform1f(U('uL'), lv.L); gl.uniform3f(U('uLo'), lv.lo[0], lv.lo[1], lv.lo[2]); gl.uniform3f(U('uSc'), lv.sc[0], lv.sc[1], lv.sc[2]);
      gl.uniform1f(U('uBk'), p.backscatter ? p.backAmt / 100 : 0);
      gl.uniform1f(U('uCt'), 1 + p.contrast / 100);
      gl.uniform1f(U('uHi'), p.highlights / 100 * 0.4); gl.uniform1f(U('uSh'), p.shadows / 100 * 0.4);
      gl.uniform1f(U('uVib'), p.vibrance / 100); gl.uniform1f(U('uSat'), 1 + p.saturation / 100); gl.uniform1f(U('uEx'), core.ex);
      gl.uniform1i(U('uCurves'), cv.on ? 1 : 0);
      gl.uniform3f(U('uW0'), wh[0].r, wh[0].g, wh[0].b); gl.uniform3f(U('uW1'), wh[1].r, wh[1].g, wh[1].b); gl.uniform3f(U('uW2'), wh[2].r, wh[2].g, wh[2].b);
      gl.uniform1i(U('uWOn'), wh.some((o) => o.on) ? 1 : 0);
      const bd = new Float32Array(36); bands.forEach((b, i) => { bd[i * 4] = b.c; bd[i * 4 + 1] = b.h; bd[i * 4 + 2] = b.s; bd[i * 4 + 3] = b.l; });
      gl.uniform4fv(U('uBand'), bd); gl.uniform1i(U('uNB'), bands.length);
      this.draw();
      if (!clar) return;

      // clarity: luma blurred at 1/8 size, then applied as local contrast
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, this.texA); gl.generateMipmap(gl.TEXTURE_2D);
      const D = this.progs.down; this.pass(D, this.fbS1, this.sw, this.sh);
      gl.uniform1i(this.u(D, 'uTex'), 3); gl.uniform1f(this.u(D, 'uLod'), 3); this.draw();
      const B = this.progs.blur, rad = Math.max(6, Math.round(Math.max(w, h) / 40)), rs = Math.min(64, Math.max(1, Math.round(rad / 8)));
      const bl = (srcTex, fb, dx, dy) => {
        this.pass(B, fb, this.sw, this.sh); gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, srcTex);
        gl.uniform1i(this.u(B, 'uTex'), 3); gl.uniform2f(this.u(B, 'uDir'), dx / this.sw, dy / this.sh); gl.uniform1i(this.u(B, 'uR'), rs); this.draw();
      };
      bl(this.texS1, this.fbS2, 1, 0); bl(this.texS2, this.fbS1, 0, 1); bl(this.texS1, this.fbS2, 1, 0); bl(this.texS2, this.fbS1, 0, 1);
      const F = this.progs.fin; this.pass(F, null, w, h);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, this.texA); gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, this.texS1);
      gl.uniform1i(this.u(F, 'uMain'), 3); gl.uniform1i(this.u(F, 'uBlur'), 4); gl.uniform1f(this.u(F, 'uK'), p.clarity / 100 * 1.3); this.draw();
    }
    dispose() { if (!this.ok) return; const e = this.gl.getExtension('WEBGL_lose_context'); e && e.loseContext(); this.ok = false; }
  }

  function create() { try { const r = new Renderer(); return r.ok ? r : null; } catch (e) { console.warn('GPU renderer unavailable, using CPU', e); return null; } }
  return { create, supported };
})();
