// ============================================================================
// live3d-viewer.js — drive a LIVE ranger:three scene onto a 2D canvas.
// ============================================================================
//
// The live-path cousin of tsx3d-viewer.js. Instead of a reconciled Three.js
// script, it runs a guest that calls the ranger:three façade directly through
// WebLive3dHost (ComponentEngine + the LIVE RgRegistryBridge). init() builds the
// scene once; each rAF we call host.frame(dtMs) — which runs the guest's tick()
// then software-renders the live scene — and blit host.framePixels() (w*h*3 RGB)
// onto the canvas. Same VFS + engine-host runtime as the software model viewer.
// ============================================================================

(function (root) {
  "use strict";

  class Live3dSession {
    constructor(config) {
      this.canvas = config.canvas;
      this.ctx = this.canvas.getContext("2d");
      this.host = config.host; // engine WebLive3dHost instance
      this.size = config.size || 480;
      this.canvas.width = this.size;
      this.canvas.height = this.size;
      this._image = this.ctx.createImageData(this.size, this.size);
      this._raf = 0;
      this._last = 0;
      this._tick = this._tick.bind(this);
    }

    // Register the façade + evaluate the guest + run init(); render frame 0.
    load(facadeDir, facadeFile, guestDir, guestFile) {
      this.host.setup();
      const ok = this.host.loadFromVfs(
        facadeDir, facadeFile, guestDir, guestFile, this.size, this.size);
      if (ok !== "ok" || this.host.errorCount() > 0) {
        throw new Error("live scene load failed: " + this.host.lastError());
      }
      this.renderOnce(0.016 * 1000);
      return ok;
    }

    renderOnce(dtMs) {
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
    const host = new engine.WebLive3dHost();
    const session = new Live3dSession({ canvas: config.canvas, host, size: config.size });
    session.load(config.facadeDir, config.facadeFile, config.guestDir, config.guestFile);
    if (config.autostart !== false) session.start();
    return session;
  }

  root.RangerLive3d = { Live3dSession, launch };
})(typeof globalThis !== "undefined" ? globalThis : this);
