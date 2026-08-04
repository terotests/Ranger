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
//
// Live editor: getSource() / reload(src) rebuild a fresh WebLive3dHost with the
// edited guest text (facade unchanged).
// ============================================================================

(function (root) {
  "use strict";

  class Live3dSession {
    constructor(config) {
      this.canvas = config.canvas;
      this.ctx = this.canvas.getContext("2d");
      this.host = config.host; // engine WebLive3dHost instance
      this.engine = config.engine;
      this.vfs = config.vfs;
      this.facadeDir = config.facadeDir || "";
      this.facadeFile = config.facadeFile || "";
      this.guestDir = config.guestDir || "";
      this.guestFile = config.guestFile || "";
      this.packageDir = config.packageDir || "";
      this.facadeSrc = config.facadeSrc || "";
      this.guestSrc = config.guestSrc || "";
      this.size = config.size || 480;
      this.canvas.width = this.size;
      this.canvas.height = this.size;
      this._image = this.ctx.createImageData(this.size, this.size);
      this._raf = 0;
      this._last = 0;
      this._tick = this._tick.bind(this);
    }

    // Register the façade + evaluate the guest + run init(); render frame 0.
    // packageDir (optional) is the bridge's asset root: guests that load real
    // models via `new THREE.GLTFModel("pkg://…")` need it set BEFORE loadFromVfs
    // (init() runs the model load), so pkg:// resolves against the mounted VFS
    // zip exactly like an in-engine game. Primitive guests leave it "".
    load(facadeDir, facadeFile, guestDir, guestFile, packageDir) {
      this.facadeDir = facadeDir;
      this.facadeFile = facadeFile;
      this.guestDir = guestDir;
      this.guestFile = guestFile;
      if (packageDir != null) this.packageDir = packageDir || "";
      this.host.setup();
      if (this.packageDir) this.host.bridge.packageDir = this.packageDir;
      const ok = this.host.loadFromVfs(
        facadeDir, facadeFile, guestDir, guestFile, this.size, this.size);
      if (ok !== "ok" || this.host.errorCount() > 0) {
        throw new Error("live scene load failed: " + this.host.lastError());
      }
      if (this.vfs) {
        this.facadeSrc = this.vfs.readText(facadeDir + "/" + facadeFile);
        this.guestSrc = this.vfs.readText(guestDir + "/" + guestFile);
      }
      this.renderOnce(0.016 * 1000);
      return ok;
    }

    loadSources(facadeSrc, guestSrc) {
      this.facadeSrc = facadeSrc;
      this.guestSrc = guestSrc;
      this.host.setup();
      if (this.packageDir) this.host.bridge.packageDir = this.packageDir;
      const ok = this.host.load(facadeSrc, guestSrc, this.size, this.size);
      if (ok !== "ok" || this.host.errorCount() > 0) {
        throw new Error("live scene load failed: " + this.host.lastError());
      }
      this.renderOnce(0.016 * 1000);
      return ok;
    }

    getSource() {
      return this.guestSrc || "";
    }

    reload(src) {
      if (!this.engine) throw new Error("live3d reload: missing engine");
      this.guestSrc = src;
      if (this.vfs && this.guestDir && this.guestFile) {
        this.vfs.writeText(this.guestDir + "/" + this.guestFile, src);
      }
      const wasRunning = !!this._raf;
      this.stop();
      this.host = new this.engine.WebLive3dHost();
      this.loadSources(this.facadeSrc, this.guestSrc);
      if (wasRunning) this.start();
      return true;
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

    dispose() {
      this.stop();
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
    const session = new Live3dSession({
      canvas: config.canvas,
      host,
      engine,
      vfs,
      size: config.size,
      facadeDir: config.facadeDir,
      facadeFile: config.facadeFile,
      guestDir: config.guestDir,
      guestFile: config.guestFile,
      packageDir: config.packageDir || "",
    });
    session.load(
      config.facadeDir,
      config.facadeFile,
      config.guestDir,
      config.guestFile,
      config.packageDir || ""
    );
    if (config.autostart !== false) session.start();
    return session;
  }

  root.RangerLive3d = { Live3dSession, launch };
})(typeof globalThis !== "undefined" ? globalThis : this);
