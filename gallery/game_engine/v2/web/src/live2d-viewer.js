// ============================================================================
// live2d-viewer.js — drive a LIVE ranger:2d game onto a 2D canvas.
// ============================================================================
//
// The 2D cousin of live3d-viewer.js. Boots a TSX game through WebLive2dHost
// (generic RgGameHost). load() evaluates index.tsx + runs __rgGameInit(); each
// rAF we call host.frame(dtMs) — one host-owned tick then present pane 0 through
// the sampling backend — and blit host.framePixels() (w*h*3 RGB) onto the canvas.
// Arrow keys + space drive player 0's left/right/action through host.input().
// Optional config.clearRgb (0xRRGGBB) sets the presenter clear colour (title
// palettes stay in the viewer/demo, not the engine host).
//
// Live editor: getSource() / reload(src) write the guest into the VFS and rebuild
// a fresh WebLive2dHost (RgGameHost.load already mints a new ComponentEngine).
// ============================================================================

(function (root) {
  "use strict";

  class Live2dSession {
    constructor(config) {
      this.canvas = config.canvas;
      this.ctx = this.canvas.getContext("2d");
      this.host = config.host; // engine WebLive2dHost instance
      this.engine = config.engine; // Ranger engine module (for fresh hosts)
      this.vfs = config.vfs;
      this.gameDir = config.gameDir || "";
      this.gameFile = config.gameFile || "index.tsx";
      this.w = config.width || 480;
      this.h = config.height || 270;
      this.clearRgb = config.clearRgb | 0;
      this.canvas.width = this.w;
      this.canvas.height = this.h;
      this._image = this.ctx.createImageData(this.w, this.h);
      this._raf = 0;
      this._last = 0;
      this._keys = { left: false, right: false, action: false };
      this._keysBound = false;
      this._tick = this._tick.bind(this);
      this._onKeyDown = (e) => this._setKey(e, true);
      this._onKeyUp = (e) => this._setKey(e, false);
    }

    // Register the ranger:* modules + evaluate the game + run __rgGameInit();
    // packageDir arrives implicitly via RgGameHost.load(dir,...) which sets the
    // bridge packageDir to `dir` so pkg:// atlases + PNG sheets resolve against
    // the mounted VFS zip exactly like the headless boot. Render frame 0.
    load(dir, file) {
      this.gameDir = dir;
      this.gameFile = file;
      this.host.setup();
      if (this.host.setClearRgb) this.host.setClearRgb(this.clearRgb);
      const ok = this.host.loadFromVfs
        ? this.host.loadFromVfs(dir, file, this.w, this.h)
        : this.host.load(dir, file, this.w, this.h);
      if (ok !== "ok" || this.host.errorCount() > 0) {
        throw new Error("live2d game load failed: " + this.host.lastError());
      }
      this.renderOnce(0.016 * 1000);
      return ok;
    }

    getSource() {
      if (!this.vfs || !this.gameDir) return "";
      return this.vfs.readText(this.gameDir + "/" + this.gameFile);
    }

    // Persist edited source into the VFS and rebuild a fresh host.
    reload(src) {
      if (!this.vfs || !this.engine) throw new Error("live2d reload: missing vfs/engine");
      this.vfs.writeText(this.gameDir + "/" + this.gameFile, src);
      const wasRunning = !!this._raf;
      this.stop();
      this.host = new this.engine.WebLive2dHost();
      this.load(this.gameDir, this.gameFile);
      if (wasRunning) this.start();
      return true;
    }

    _applyInput() {
      // Player 0 driven by the keyboard; player 1 stays attract/idle.
      this.host.input(0, this._keys.left, this._keys.right, this._keys.action);
    }

    renderOnce(dtMs) {
      this._applyInput();
      this.host.frame(dtMs);
      const rgb = new Uint8Array(this.host.framePixels()); // w*h*3
      const out = this._image.data; // w*h*4
      for (let i = 0, j = 0; j + 2 < rgb.length && i + 3 < out.length; i += 4, j += 3) {
        out[i] = rgb[j];
        out[i + 1] = rgb[j + 1];
        out[i + 2] = rgb[j + 2];
        out[i + 3] = 255;
      }
      this.ctx.putImageData(this._image, 0, 0);
    }

    _setKey(e, down) {
      let hit = true;
      switch (e.key) {
        case "ArrowLeft": case "a": case "A": this._keys.left = down; break;
        case "ArrowRight": case "d": case "D": this._keys.right = down; break;
        case "ArrowUp": case " ": case "w": case "W": this._keys.action = down; break;
        default: hit = false;
      }
      if (hit) e.preventDefault();
    }

    bindKeys(target) {
      if (this._keysBound) return this;
      const t = target || root;
      t.addEventListener("keydown", this._onKeyDown);
      t.addEventListener("keyup", this._onKeyUp);
      this._keyTarget = t;
      this._keysBound = true;
      return this;
    }

    dispose() {
      this.stop();
      if (this._keysBound && this._keyTarget) {
        this._keyTarget.removeEventListener("keydown", this._onKeyDown);
        this._keyTarget.removeEventListener("keyup", this._onKeyUp);
        this._keysBound = false;
      }
    }

    start() {
      if (!this._raf) {
        this._last = 0;
        this._raf = requestAnimationFrame(this._tick);
      }
      return this;
    }
    stop() {
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = 0;
    }

    _tick(now) {
      const dt = this._last ? Math.min(now - this._last, 100) : 16;
      this._last = now;
      this.renderOnce(dt);
      this._raf = requestAnimationFrame(this._tick);
    }
  }

  async function launch(config) {
    const vfs = new root.RangerVFS();
    if (config.zipBuffer) vfs.mountZip(config.zipBuffer);
    const engine = root.RangerEngineHost.createEngine(config.bundleSource, vfs, {});
    const host = new engine.WebLive2dHost();
    const session = new Live2dSession({
      canvas: config.canvas,
      host,
      engine,
      vfs,
      width: config.width,
      height: config.height,
      clearRgb: config.clearRgb | 0,
      gameDir: config.gameDir,
      gameFile: config.gameFile,
    });
    session.load(config.gameDir, config.gameFile);
    if (config.bindKeys !== false) session.bindKeys(root);
    if (config.autostart !== false) session.start();
    return session;
  }

  root.RangerLive2d = { Live2dSession, launch };
})(typeof globalThis !== "undefined" ? globalThis : this);
