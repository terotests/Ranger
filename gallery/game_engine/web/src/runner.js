// ============================================================================
// runner.js — drive a Ranger GameRunner onto an HTML canvas (browser only).
// ============================================================================
//
// Ties the pieces together: mounts a game package into a VFS, instantiates the
// engine, then runs a requestAnimationFrame loop that feeds keyboard input into
// runner.frame(...) and blits runner.raw() (a 480x270 RGBA ArrayBuffer) to the
// canvas with putImageData. No engine changes — the same GameRunner used by the
// native/SDL host and the Node smoke test.
// ============================================================================

(function (root) {
  "use strict";

  const DEFAULT_KEYMAP = {
    // engine frame() args: (dtMs, up, down, left, action, right, quit)
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    KeyW: "up",
    KeyS: "down",
    KeyA: "left",
    KeyD: "right",
    Space: "action",
    Enter: "action",
  };

  class GameSession {
    constructor(config) {
      this.width = config.width || 480;
      this.height = config.height || 270;
      this.canvas = config.canvas;
      this.ctx = this.canvas.getContext("2d");
      this.vfs = config.vfs; // the RangerVFS the engine reads from
      this.runner = config.runner; // an engine GameRunner instance
      this.scriptDir = config.scriptDir;
      this.scriptFile = config.scriptFile;
      this.keymap = config.keymap || DEFAULT_KEYMAP;
      this.keys = { up: false, down: false, left: false, right: false, action: false, quit: false };
      this._raf = 0;
      this._last = 0;
      this._image = this.ctx.createImageData(this.width, this.height);
      this._onKey = this._onKey.bind(this);
      this._tick = this._tick.bind(this);
      this.onStats = config.onStats || null;
    }

    setup() {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.runner.init(this.width, this.height);
      const src = this.vfs.readText(this.scriptDir + "/" + this.scriptFile);
      if (this.runner.setScriptDir) this.runner.setScriptDir(this.scriptDir);
      this.runner.loadScript(src);
      this.runner.setupScene();
      return this;
    }

    start() {
      window.addEventListener("keydown", this._onKey);
      window.addEventListener("keyup", this._onKey);
      this._last = performance.now();
      this._raf = requestAnimationFrame(this._tick);
      return this;
    }

    stop() {
      window.removeEventListener("keydown", this._onKey);
      window.removeEventListener("keyup", this._onKey);
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = 0;
    }

    _onKey(e) {
      const slot = this.keymap[e.code];
      if (!slot) return;
      this.keys[slot] = e.type === "keydown";
      if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault();
    }

    // Advance and present exactly one frame (also used by headless screenshot).
    step(dtMs) {
      const dt = Math.max(1, Math.min(50, dtMs | 0)) || 16;
      const k = this.keys;
      this.runner.frame(dt, k.up, k.down, k.left, k.action, k.right, k.quit);
      this.runner.draw();
      const raw = this.runner.raw(); // ArrayBuffer, width*height*4 RGBA
      const bytes = raw instanceof ArrayBuffer ? new Uint8Array(raw) : new Uint8Array(raw.buffer || raw);
      this._image.data.set(bytes.subarray(0, this._image.data.length));
      this.ctx.putImageData(this._image, 0, 0);
    }

    _tick(now) {
      const dt = now - this._last;
      this._last = now;
      this.step(dt);
      if (this.onStats && this.runner.entityX) {
        this.onStats({
          score1: this.runner.score1,
          score2: this.runner.score2,
        });
      }
      this._raf = requestAnimationFrame(this._tick);
    }
  }

  // High-level entry: given a fetched engine bundle + game package, build and
  // start a session on a canvas. Returns the GameSession.
  async function launch(config) {
    const vfs = new root.RangerVFS();
    root.__vfs = vfs;
    if (config.zipBuffer) vfs.mountZip(config.zipBuffer);
    if (config.manifest) vfs.mountManifest(config.manifest);

    const engine = root.RangerEngineHost.createEngine(config.bundleSource, vfs, {
      onWrite: config.onWrite,
    });
    const runner = new engine.GameRunner();

    const session = new GameSession({
      width: config.width,
      height: config.height,
      canvas: config.canvas,
      vfs,
      runner,
      scriptDir: config.scriptDir,
      scriptFile: config.scriptFile,
      keymap: config.keymap,
      onStats: config.onStats,
    });
    session.setup();
    if (config.autostart !== false) session.start();
    return session;
  }

  root.RangerRunner = { GameSession, launch };
})(typeof globalThis !== "undefined" ? globalThis : this);
