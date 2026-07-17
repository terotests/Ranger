// ============================================================================
// tsx3d-gl-viewer.js — run the 1:1 Three.js cube (.tsx) on the GPU in a canvas.
// ============================================================================
//
// Mounts the three.tsx façade + the unmodified cube.tsx into a VFS, instantiates
// the compiled Ranger host (WebTsx3dGlHost), points it at a <canvas>, and runs a
// requestAnimationFrame loop. Unlike the software model-viewer this does NOT blit
// an RGB buffer: the Ranger host acquires a real WebGL context on the canvas (via
// the three_gl operator layer) and draws to it directly — the cube is rendered on
// the GPU, driven by the interpreted animate() loop.
// ============================================================================

(function (root) {
  "use strict";

  let _idSeq = 0;

  // Parse a binary PPM (P6) into { w, h, rgba } — no image decoder needed, so a
  // repo .ppm (e.g. cube3d_wasm's crate) can be used as a texture directly.
  function parsePPM(arrayBuffer) {
    const b = new Uint8Array(arrayBuffer);
    let p = 0;
    const ws = (c) => c === 32 || c === 9 || c === 10 || c === 13;
    function tok() {
      while (p < b.length && ws(b[p])) p++;
      let s = p;
      while (p < b.length && !ws(b[p])) p++;
      return String.fromCharCode.apply(null, b.subarray(s, p));
    }
    const magic = tok();
    if (magic !== "P6") throw new Error("unsupported PPM magic: " + magic);
    const w = parseInt(tok(), 10), h = parseInt(tok(), 10);
    tok(); // maxval
    p++; // single whitespace after maxval, then binary RGB
    const rgb = b.subarray(p);
    const rgba = new Uint8Array(w * h * 4);
    for (let i = 0, j = 0; i < w * h; i++, j += 3) {
      rgba[i * 4] = rgb[j];
      rgba[i * 4 + 1] = rgb[j + 1];
      rgba[i * 4 + 2] = rgb[j + 2];
      rgba[i * 4 + 3] = 255;
    }
    return { w, h, rgba };
  }

  class Tsx3dSession {
    constructor(config) {
      this.canvas = config.canvas;
      this.host = config.host; // engine WebTsx3dGlHost instance
      this.dir = config.dir;
      this.facade = config.facade;
      this.script = config.script;
      this.texturePath = config.texturePath || null;
      this.textureUrl = config.textureUrl || null;
      // The Ranger GL layer finds the drawing surface via
      // document.getElementById(canvasId), so the canvas needs a stable id.
      if (!this.canvas.id) this.canvas.id = "rtsx3d-canvas-" + _idSeq++;
      this.dpr = Math.min(root.devicePixelRatio || 1, 2);
      this._raf = 0;
      this._tick = this._tick.bind(this);
      this._sizeToDisplay();
    }

    _sizeToDisplay() {
      const cssW = this.canvas.clientWidth || 480;
      const cssH = this.canvas.clientHeight || 360;
      const w = Math.max(1, Math.round(cssW * this.dpr));
      const h = Math.max(1, Math.round(cssH * this.dpr));
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
      }
      this._w = w;
      this._h = h;
    }

    async start() {
      // Acquire the GL context on this canvas and load + init the scene.
      if (!this.host.setupGL(this.canvas.id)) {
        throw new Error("WebGL context could not be created on #" + this.canvas.id);
      }
      const r = this.host.loadFromVfs(this.dir, this.facade, this.script, this._w, this._h, this.dpr);
      if (r !== "ok") throw new Error("tsx3d load failed: " + r);
      // Hand real texture pixels to the bridge BEFORE the first frame builds the
      // mesh (else it falls back to a generated checker for that path).
      if (this.texturePath && this.textureUrl) {
        try {
          const buf = await (await fetch(this.textureUrl)).arrayBuffer();
          const { w, h, rgba } = parsePPM(buf);
          this.host.setTexture(this.texturePath, rgba, w, h);
        } catch (e) {
          console.warn("tsx3d: texture load failed, using checker fallback:", e.message);
        }
      }
      if (!this._raf) this._raf = requestAnimationFrame(this._tick);
      return this;
    }

    stop() {
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = 0;
    }

    _tick() {
      this._sizeToDisplay();
      this.host.setSize(this._w, this._h);
      this.host.frame(); // advance interpreted animate() + draw to the GL canvas
      this._raf = requestAnimationFrame(this._tick);
    }
  }

  async function launch(config) {
    const vfs = new root.RangerVFS();
    if (config.zipBuffer) vfs.mountZip(config.zipBuffer);
    const engine = root.RangerEngineHost.createEngine(config.bundleSource, vfs, {});
    const host = new engine.WebTsx3dGlHost();
    const session = new Tsx3dSession({
      canvas: config.canvas,
      host,
      dir: config.dir,
      facade: config.facade,
      script: config.script,
      texturePath: config.texturePath,
      textureUrl: config.textureUrl,
    });
    if (config.autostart !== false) await session.start();
    return session;
  }

  root.RangerTsx3dViewer = { Tsx3dSession, launch };
})(typeof globalThis !== "undefined" ? globalThis : this);
