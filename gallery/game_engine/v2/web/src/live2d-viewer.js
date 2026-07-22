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
// ============================================================================

(function (root) {
  "use strict";

  class Live2dSession {
    constructor(config) {
      this.canvas = config.canvas;
      this.ctx = this.canvas.getContext("2d");
      this.host = config.host; // engine WebLive2dHost instance
      this.w = config.width || 480;
      this.h = config.height || 270;
      this.clearRgb = config.clearRgb | 0;
      this.canvas.width = this.w;
      this.canvas.height = this.h;
      this._image = this.ctx.createImageData(this.w, this.h);
      this._raf = 0;
      this._last = 0;
      this._keys = { left: false, right: false, action: false };
      this._tick = this._tick.bind(this);
    }

    // Register the ranger:* modules + evaluate the game + run __rgGameInit();
    // packageDir arrives implicitly via RgGameHost.load(dir,...) which sets the
    // bridge packageDir to `dir` so pkg:// atlases + PNG sheets resolve against
    // the mounted VFS zip exactly like the headless boot. Render frame 0.
    load(dir, file) {
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

    bindKeys(target) {
      const set = (e, down) => {
        let hit = true;
        switch (e.key) {
          case "ArrowLeft": case "a": case "A": this._keys.left = down; break;
          case "ArrowRight": case "d": case "D": this._keys.right = down; break;
          case "ArrowUp": case " ": case "w": case "W": this._keys.action = down; break;
          default: hit = false;
        }
        if (hit) e.preventDefault();
      };
      (target || root).addEventListener("keydown", (e) => set(e, true));
      (target || root).addEventListener("keyup", (e) => set(e, false));
      return this;
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
      canvas: config.canvas, host,
      width: config.width, height: config.height,
    });
    session.load(config.gameDir, config.gameFile);
    if (config.bindKeys !== false) session.bindKeys(root);
    if (config.autostart !== false) session.start();
    return session;
  }

  root.RangerLive2d = { Live2dSession, launch };
})(typeof globalThis !== "undefined" ? globalThis : this);
