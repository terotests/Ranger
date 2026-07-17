// ============================================================================
// teapot-tsx-viewer.js — run the teapot example (teapot.tsx) on the GPU, edited.
// ============================================================================
//
// Like the cube viewer, the teapot's *scene* code (teapot.tsx) is interpreted at
// runtime against the three.tsx façade and rendered with WebGL through the Ranger
// host (WebTeapotTsxHost). The editor shows teapot.tsx and edits hot-reload — a
// fresh host re-runs the edited script on the same GL canvas. OrbitControls + the
// lil-gui panel are host plumbing: this viewer stacks the panel as a 2D overlay
// and routes pointer input (orbit + panel clicks) into the host.
// ============================================================================

(function (root) {
  "use strict";

  const SIZE = 480;

  class TeapotTsxSession {
    constructor(config) {
      this.canvas = config.canvas;
      this.engine = config.engine;
      this.host = config.host;
      this.facadeSrc = config.facadeSrc;
      this.scriptSrc = config.scriptSrc;
      if (!this.canvas.id) this.canvas.id = "rteapot-tsx-canvas";
      this._raf = 0;
      this._tick = this._tick.bind(this);
      this._sizeCanvas();
      this._makeOverlay();
    }

    _sizeCanvas() {
      this.canvas.width = SIZE;
      this.canvas.height = SIZE;
      this.canvas.style.width = SIZE + "px";
      this.canvas.style.height = SIZE + "px";
    }

    _makeOverlay() {
      const parent = this.canvas.parentElement;
      if (parent && getComputedStyle(parent).position === "static") {
        parent.style.position = "relative";
      }
      const ovl = document.createElement("canvas");
      ovl.style.position = "absolute";
      ovl.style.pointerEvents = "none";
      ovl.style.zIndex = "5";
      this.overlay = ovl;
      this._octx = null;
      if (parent) parent.appendChild(ovl);
    }

    _positionOverlay(gw, gh) {
      const ovl = this.overlay;
      ovl.width = gw;
      ovl.height = gh;
      ovl.style.width = gw + "px";
      ovl.style.height = gh + "px";
      ovl.style.left = (this.canvas.offsetLeft + SIZE - gw) + "px";
      ovl.style.top = this.canvas.offsetTop + "px";
      this._octx = ovl.getContext("2d");
    }

    _drawOverlay() {
      if (!this._octx) return;
      const gw = this.host.guiW(), gh = this.host.guiH();
      const bytes = new Uint8ClampedArray(this.host.guiRGBA());
      this._octx.putImageData(new ImageData(bytes, gw, gh), 0, 0);
    }

    async start() {
      if (this._loaded) { this._resume(); return this; }
      if (!this.host.setupGL(this.canvas.id)) {
        throw new Error("WebGL context could not be created on #" + this.canvas.id);
      }
      const r = this.host.load(this.facadeSrc, this.scriptSrc, SIZE, SIZE, 1);
      if (r !== "ok") throw new Error("teapot.tsx load failed: " + r);
      this.host.frame();
      this._positionOverlay(this.host.guiW(), this.host.guiH());
      this._drawOverlay();
      this._wirePointer();
      this._loaded = true;
      this._resume();
      return this;
    }

    _wirePointer() {
      const c = this.canvas;
      const gw = this.host.guiW(), gh = this.host.guiH();
      const inPanel = (x, y) => x >= (SIZE - gw) && y <= gh;
      c.addEventListener("pointerdown", (e) => {
        const x = e.offsetX, y = e.offsetY;
        if (inPanel(x, y)) {
          if (this.host.guiPointerDown(x - (SIZE - gw), y)) {
            if (this.host.needsRender()) this.host.frame();
            this._drawOverlay();
          }
          return;
        }
        c.setPointerCapture(e.pointerId);
        this.host.onPointerDown(x, y, e.button | 0);
      });
      c.addEventListener("pointermove", (e) => {
        this.host.onPointerMove(e.offsetX, e.offsetY);
        if (this.host.needsRender()) this.host.frame();
      });
      c.addEventListener("pointerup", () => this.host.onPointerUp());
      c.addEventListener("wheel", (e) => {
        e.preventDefault();
        this.host.onWheel(e.deltaY);
        if (this.host.needsRender()) this.host.frame();
      }, { passive: false });
    }

    // --- editor session API ------------------------------------------------
    getSource() {
      return this.scriptSrc;
    }

    // Hot reload: a fresh host re-runs the edited teapot.tsx on the same canvas.
    reload(src) {
      this.scriptSrc = src;
      if (!this.engine) return false;
      this.stop();
      this.host = new this.engine.WebTeapotTsxHost();
      this.host.setupGL(this.canvas.id);
      const r = this.host.load(this.facadeSrc, src, SIZE, SIZE, 1);
      if (r !== "ok") throw new Error("teapot.tsx reload failed: " + r);
      this.host.frame();
      this._drawOverlay();
      this._resume();
      return true; // scene rebuilt from the edited source
    }

    setMuted() {}

    stop() {
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = 0;
    }
    _resume() {
      if (!this._raf) this._raf = requestAnimationFrame(this._tick);
    }

    _tick() {
      // on-demand: only redraw when the controls/GUI marked the scene dirty
      if (this.host.needsRender()) this.host.frame();
      this._raf = requestAnimationFrame(this._tick);
    }
  }

  async function launch(config) {
    const vfs = new root.RangerVFS();
    const engine = root.RangerEngineHost.createEngine(config.bundleSource, vfs, {});
    const host = new engine.WebTeapotTsxHost();
    const session = new TeapotTsxSession({
      canvas: config.canvas,
      engine,
      host,
      facadeSrc: config.facadeSrc,
      scriptSrc: config.scriptSrc,
    });
    if (config.autostart !== false) await session.start();
    return session;
  }

  root.RangerTeapotTsxViewer = { TeapotTsxSession, launch };
})(typeof globalThis !== "undefined" ? globalThis : this);
