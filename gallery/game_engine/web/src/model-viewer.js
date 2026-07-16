// ============================================================================
// model-viewer.js — drive a Ranger WebModelViewer onto a canvas (browser only).
// ============================================================================
//
// Mounts a GLB package into a VFS, instantiates the compiled 3D viewer, and runs
// a requestAnimationFrame loop that orbits the camera and blits the renderer's
// RGB buffer to the canvas. Drag to rotate; it auto-spins when idle.
// ============================================================================

(function (root) {
  "use strict";

  class ModelSession {
    constructor(config) {
      this.canvas = config.canvas;
      this.ctx = this.canvas.getContext("2d");
      this.viewer = config.viewer; // engine WebModelViewer instance
      this.size = config.size || 384;
      this.canvas.width = this.size;
      this.canvas.height = this.size;
      this._image = this.ctx.createImageData(this.size, this.size);
      this.orbit = 0.6;
      this.autospin = true;
      this._raf = 0;
      this._dragging = false;
      this._lastX = 0;
      this._tick = this._tick.bind(this);
      this._bindDrag();
    }

    _bindDrag() {
      const c = this.canvas;
      c.style.cursor = "grab";
      c.addEventListener("pointerdown", (e) => {
        this._dragging = true;
        this.autospin = false;
        this._lastX = e.clientX;
        c.setPointerCapture(e.pointerId);
        c.style.cursor = "grabbing";
      });
      c.addEventListener("pointermove", (e) => {
        if (!this._dragging) return;
        this.orbit += (e.clientX - this._lastX) * 0.01;
        this._lastX = e.clientX;
      });
      const end = () => { this._dragging = false; c.style.cursor = "grab"; };
      c.addEventListener("pointerup", end);
      c.addEventListener("pointercancel", end);
    }

    load(dir, file) {
      const ok = this.viewer.load(dir, file);
      if (!ok) throw new Error("model load failed: " + this.viewer.error());
      this.renderOnce();
      return ok;
    }

    renderOnce() {
      this.viewer.setOrbit(this.orbit);
      this.viewer.render(this.size, this.size);
      const rgb = new Uint8Array(this.viewer.raw()); // w*h*3
      const out = this._image.data; // w*h*4
      for (let i = 0, j = 0; j < rgb.length; i += 4, j += 3) {
        out[i] = rgb[j];
        out[i + 1] = rgb[j + 1];
        out[i + 2] = rgb[j + 2];
        out[i + 3] = 255;
      }
      this.ctx.putImageData(this._image, 0, 0);
    }

    start() {
      if (!this._raf) this._raf = requestAnimationFrame(this._tick);
      return this;
    }
    stop() {
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = 0;
    }

    _tick() {
      if (this.autospin) this.orbit += 0.02;
      this.renderOnce();
      this._raf = requestAnimationFrame(this._tick);
    }
  }

  async function launch(config) {
    const vfs = new root.RangerVFS();
    if (config.zipBuffer) vfs.mountZip(config.zipBuffer);
    const engine = root.RangerEngineHost.createEngine(config.bundleSource, vfs, {});
    const viewer = new engine.WebModelViewer();
    const session = new ModelSession({ canvas: config.canvas, viewer, size: config.size });
    session.load(config.dir, config.file);
    if (config.autostart !== false) session.start();
    return session;
  }

  root.RangerModelViewer = { ModelSession, launch };
})(typeof globalThis !== "undefined" ? globalThis : this);
