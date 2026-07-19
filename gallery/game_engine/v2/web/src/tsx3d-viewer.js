// ============================================================================
// tsx3d-viewer.js — drive a TSX-script-declared 3D scene onto a canvas.
// ============================================================================
//
// The script-driven cousin of model-viewer.js. Instead of load(dir,file), it
// runs a short .tsx script whose init() declares the scene (addModel / spin)
// through the host's WebTsx3dHost; the host loads the GLB and software-renders
// it (SoftRenderer3D). Same VFS + engine-host + RGB→canvas blit as the model
// viewer; the orbit speed comes from the script's spin() value.
// ============================================================================

(function (root) {
  "use strict";

  class Tsx3dSession {
    constructor(config) {
      this.canvas = config.canvas;
      this.ctx = this.canvas.getContext("2d");
      this.host = config.host; // engine WebTsx3dHost instance
      this.size = config.size || 384;
      this.canvas.width = this.size;
      this.canvas.height = this.size;
      this._image = this.ctx.createImageData(this.size, this.size);
      this.orbit = 0.6;
      this._spinRate = 0.6; // rad/sec, overwritten from the script's spin()
      this.autospin = true;
      this._raf = 0;
      this._dragging = false;
      this._lastX = 0;
      this._last = 0;
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

    // Run the script's init() so it declares the scene, then render frame 0.
    loadScript(dir, file) {
      const ok = this.host.loadScriptFile(dir, file);
      if (!ok) throw new Error("scene load failed: " + this.host.error());
      const rate = this.host.spinRate();
      if (rate) this._spinRate = rate;
      this.renderOnce();
      return ok;
    }

    // The scene .tsx source, so the editor pane can show (and later reload) it.
    getSource() {
      return this.host.sourceText();
    }

    renderOnce() {
      this.host.setOrbit(this.orbit);
      this.host.render(this.size, this.size);
      const rgb = new Uint8Array(this.host.raw()); // w*h*3
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
      // advance the orbit by the script's spin rate (rad/sec); idle when static.
      if (this.autospin) {
        const dt = this._last ? Math.min((now - this._last) / 1000, 0.1) : 0.016;
        this.orbit += this._spinRate * dt;
      }
      this._last = now;
      this.renderOnce();
      this._raf = requestAnimationFrame(this._tick);
    }
  }

  async function launch(config) {
    const vfs = new root.RangerVFS();
    if (config.zipBuffer) vfs.mountZip(config.zipBuffer);
    const engine = root.RangerEngineHost.createEngine(config.bundleSource, vfs, {});
    const host = new engine.WebTsx3dHost();
    const session = new Tsx3dSession({ canvas: config.canvas, host, size: config.size });
    session.loadScript(config.scriptDir, config.scriptFile);
    if (config.autostart !== false) session.start();
    return session;
  }

  root.RangerTsx3d = { Tsx3dSession, launch };
})(typeof globalThis !== "undefined" ? globalThis : this);
