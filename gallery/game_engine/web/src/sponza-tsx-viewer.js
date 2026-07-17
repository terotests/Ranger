// ============================================================================
// sponza-tsx-viewer.js — the light-probe Sponza scene on the GPU, interpreted.
// ============================================================================
//
// Sponza counterpart to teapot-tsx-viewer. sponza.tsx runs in the interpreter
// against the three.tsx façade and renders on the GPU through WebSponzaTsxHost
// (ComponentEngine + ThreeSponzaTsxBridge + ThreeGLBackend). The real glTF model
// + its textures are fetched at runtime from the Khronos sample-assets repo (they
// are far too big to bundle): the model bytes go into the engine VFS, and each
// JPEG/PNG is canvas-decoded and streamed into the host's materials (the Ranger
// host can't decode JPEG/PNG in the browser). First-person controls: WASD / arrows
// move, drag to look.
// ============================================================================

(function (root) {
  "use strict";

  const W = 640, H = 400, MAXTEX = 1024;
  const MODEL_BASE =
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Sponza/glTF";

  async function fetchU8(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error("fetch " + url + " -> " + r.status);
    return new Uint8Array(await r.arrayBuffer());
  }

  // decode an image url to {rgba, w, h}, V-flipped (glTF top-left -> GL bottom-left)
  // and downscaled to MAXTEX so texture memory stays reasonable.
  async function decodeImage(url) {
    const blob = await (await fetch(url)).blob();
    const bmp = await createImageBitmap(blob);
    let w = bmp.width, h = bmp.height;
    const s = Math.min(1, MAXTEX / Math.max(w, h));
    w = Math.max(1, Math.round(w * s));
    h = Math.max(1, Math.round(h * s));
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    ctx.translate(0, h); ctx.scale(1, -1);
    ctx.drawImage(bmp, 0, 0, w, h);
    return { rgba: ctx.getImageData(0, 0, w, h).data.buffer, w, h };
  }

  class SponzaTsxSession {
    constructor(config) {
      this.canvas = config.canvas;
      this.engine = config.engine;
      this.host = config.host;
      this.vfs = config.vfs;
      this.facadeSrc = config.facadeSrc;
      this.scriptSrc = config.scriptSrc;
      this.onStatus = config.onStatus || function () {};
      if (!this.canvas.id) this.canvas.id = "rsponza-tsx-canvas";
      this._raf = 0;
      this._tick = this._tick.bind(this);
      this._down = false;
      this._lx = 0; this._ly = 0;
      this._textures = [];   // cached decoded textures, re-applied on hot reload
      this._sizeCanvas();
      this._makeProgress();
    }

    _sizeCanvas() {
      this.canvas.width = W; this.canvas.height = H;
      this.canvas.style.width = W + "px";
      this.canvas.style.height = H + "px";
    }

    // A loading bar overlaid on the canvas while the model + textures stream in.
    _makeProgress() {
      const parent = this.canvas.parentElement;
      if (parent && getComputedStyle(parent).position === "static") {
        parent.style.position = "relative";
      }
      const wrap = document.createElement("div");
      wrap.style.cssText =
        "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);" +
        "width:70%;max-width:420px;font:12px/1.4 system-ui,sans-serif;color:#e8ecff;" +
        "text-align:center;z-index:10;pointer-events:none;text-shadow:0 1px 2px #000";
      const label = document.createElement("div");
      label.textContent = "Loading Sponza…";
      label.style.marginBottom = "6px";
      const track = document.createElement("div");
      track.style.cssText = "height:6px;border-radius:3px;background:rgba(255,255,255,.18);overflow:hidden";
      const fill = document.createElement("div");
      fill.style.cssText = "height:100%;width:0%;background:#6ea8fe;transition:width .2s ease";
      track.appendChild(fill);
      wrap.appendChild(label); wrap.appendChild(track);
      if (parent) parent.appendChild(wrap);
      this._progWrap = wrap; this._progLabel = label; this._progFill = fill;
    }
    _setProgress(frac, text) {
      if (this._progFill) this._progFill.style.width = Math.round(Math.max(0, Math.min(1, frac)) * 100) + "%";
      if (text && this._progLabel) this._progLabel.textContent = text;
    }
    _hideProgress() {
      if (this._progWrap && this._progWrap.parentElement) this._progWrap.parentElement.removeChild(this._progWrap);
      this._progWrap = this._progLabel = this._progFill = null;
    }

    async start() {
      if (this._loaded) { this._resume(); return this; }
      if (!this.host.setupGL(this.canvas.id)) {
        throw new Error("WebGL context could not be created on #" + this.canvas.id);
      }
      // 1) model bytes -> VFS (the host decodes geometry from these).
      this._setProgress(0.02, "Downloading model…");
      this.onStatus("Sponza — downloading model…");
      const gltf = await fetchU8(MODEL_BASE + "/Sponza.gltf");
      this._setProgress(0.08, "Downloading model…");
      const bin = await fetchU8(MODEL_BASE + "/Sponza.bin");
      this.vfs.write("model/Sponza.gltf", gltf);
      this.vfs.write("model/Sponza.bin", bin);
      // 2) build the scene around the real model.
      this._setProgress(0.2, "Building scene…");
      this.onStatus("Sponza — building scene…");
      const r = this.host.loadWithModel(this.facadeSrc, this.scriptSrc, "model", "Sponza.gltf", W, H, 1);
      if (r !== "ok") throw new Error("sponza load failed: " + r);
      this.host.frame();
      // 3) stream the textures in (canvas-decoded); redraw as they arrive. Cache
      // each so a hot reload can re-attach them without re-downloading/decoding.
      const n = this.host.modelImageCount();
      for (let i = 0; i < n; i++) {
        const uri = this.host.modelImageUri(i);
        if (!uri) continue;
        try {
          const d = await decodeImage(MODEL_BASE + "/" + uri);
          this.host.setModelImage(i, d.rgba, d.w, d.h);
          this._textures.push({ i, rgba: d.rgba, w: d.w, h: d.h });
        } catch (e) { /* skip an image the browser can't decode */ }
        const frac = 0.25 + 0.75 * ((i + 1) / n);
        this._setProgress(frac, "Textures " + (i + 1) + " / " + n + "…");
        if ((i & 3) === 0) { this.host.frame(); this.onStatus("Sponza — textures " + (i + 1) + "/" + n + "…"); }
      }
      this.host.frame();
      this._hideProgress();
      this.onStatus("Sponza — WASD / arrows to move, drag to look", true);
      this._wireInput();
      this._loaded = true;
      this._resume();
      return this;
    }

    _wireInput() {
      const c = this.canvas;
      const keymap = (e) => e.key;
      this._onKeyDown = (e) => { this.host.keyDown(keymap(e)); };
      this._onKeyUp = (e) => { this.host.keyUp(keymap(e)); };
      window.addEventListener("keydown", this._onKeyDown);
      window.addEventListener("keyup", this._onKeyUp);
      c.addEventListener("pointerdown", (e) => {
        this._down = true; this._lx = e.offsetX; this._ly = e.offsetY;
        c.setPointerCapture(e.pointerId);
      });
      c.addEventListener("pointermove", (e) => {
        if (!this._down) return;
        this.host.look(e.offsetX - this._lx, e.offsetY - this._ly);
        this._lx = e.offsetX; this._ly = e.offsetY;
      });
      c.addEventListener("pointerup", () => { this._down = false; });
    }

    getSource() { return this.scriptSrc; }

    // Hot reload: a fresh host re-runs the edited sponza.tsx on the same canvas +
    // VFS (model bytes + decoded textures are already there — no re-download).
    reload(src) {
      this.scriptSrc = src;
      if (!this.engine) return false;
      this.stop();
      this.host = new this.engine.WebSponzaTsxHost();
      this.host.setupGL(this.canvas.id);
      const r = this.host.loadWithModel(this.facadeSrc, src, "model", "Sponza.gltf", W, H, 1);
      if (r !== "ok") throw new Error("sponza reload failed: " + r);
      // re-attach the already-decoded textures to the fresh materials (no
      // re-download / re-decode) so the hot-reloaded scene stays textured.
      for (const t of this._textures) this.host.setModelImage(t.i, t.rgba, t.w, t.h);
      this.host.frame();
      this._resume();
      return true;
    }

    setMuted() {}
    stop() { if (this._raf) cancelAnimationFrame(this._raf); this._raf = 0; }
    _resume() { if (!this._raf) this._raf = requestAnimationFrame(this._tick); }
    _tick() { this.host.frame(); this._raf = requestAnimationFrame(this._tick); }

    dispose() {
      this.stop();
      this._hideProgress();
      if (this._onKeyDown) window.removeEventListener("keydown", this._onKeyDown);
      if (this._onKeyUp) window.removeEventListener("keyup", this._onKeyUp);
    }
  }

  async function launch(config) {
    const vfs = new root.RangerVFS();
    const engine = root.RangerEngineHost.createEngine(config.bundleSource, vfs, {});
    const host = new engine.WebSponzaTsxHost();
    const session = new SponzaTsxSession({
      canvas: config.canvas, engine, host, vfs,
      facadeSrc: config.facadeSrc, scriptSrc: config.scriptSrc,
      onStatus: config.onStatus,
    });
    if (config.autostart !== false) await session.start();
    return session;
  }

  root.RangerSponzaTsxViewer = { SponzaTsxSession, launch };
})(typeof globalThis !== "undefined" ? globalThis : this);
