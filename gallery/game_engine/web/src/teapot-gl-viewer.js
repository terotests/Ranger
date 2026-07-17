// ============================================================================
// teapot-gl-viewer.js — run the Three.js teapot example on the GPU in a canvas.
// ============================================================================
//
// Unlike the cube (which is interpreted from cube.tsx), the teapot is a COMPILED
// Ranger scene (WebTeapotProbe, from web_teapot_gl_probe.rgr): lighting, the Utah
// TeapotGeometry, OrbitControls, a lil-gui-style panel, and cube-map reflections
// — the full webgl_geometry_teapot example. This viewer instantiates that host,
// gives it a real WebGL canvas, composites the GUI panel as a small 2D overlay,
// and routes pointer input (orbit + panel clicks). The editor pane shows the
// scene's Ranger source for reading; the compiled scene re-runs on reload (the
// interpreter/hot-reload path for the full teapot is future work).
// ============================================================================

(function (root) {
  "use strict";

  const SIZE = 480; // fixed square (1:1 CSS px == device px keeps clicks simple)

  class TeapotSession {
    constructor(config) {
      this.canvas = config.canvas;
      this.engine = config.engine;
      this.probe = config.probe;
      this.source = config.source || "";
      if (!this.canvas.id) this.canvas.id = "rteapot-canvas";
      this._raf = 0;
      this._spin = 0.0035;
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

    // A 2D canvas stacked over the top-right of the WebGL canvas for the panel.
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
      // top-right corner of the canvas, within the (relative) parent
      ovl.style.left = (this.canvas.offsetLeft + SIZE - gw) + "px";
      ovl.style.top = this.canvas.offsetTop + "px";
      this._octx = ovl.getContext("2d");
    }

    _drawOverlay() {
      if (!this._octx) return;
      const gw = this.probe.guiW(), gh = this.probe.guiH();
      const buf = this.probe.guiRGBA();
      const bytes = new Uint8ClampedArray(buf);
      this._octx.putImageData(new ImageData(bytes, gw, gh), 0, 0);
    }

    async start() {
      if (this._loaded) { this._resume(); return this; }
      if (!this.probe.setupGL(this.canvas.id)) {
        throw new Error("WebGL context could not be created on #" + this.canvas.id);
      }
      this.probe.setSize(SIZE, SIZE);
      this.probe.frame();
      this._positionOverlay(this.probe.guiW(), this.probe.guiH());
      this._drawOverlay();
      this._wirePointer();
      this._loaded = true;
      this._resume();
      return this;
    }

    _wirePointer() {
      const c = this.canvas;
      const gw = this.probe.guiW(), gh = this.probe.guiH();
      const inPanel = (x, y) => x >= (SIZE - gw) && y <= gh;
      c.addEventListener("pointerdown", (e) => {
        const x = e.offsetX, y = e.offsetY;
        if (inPanel(x, y)) {
          if (this.probe.guiPointerDown(x - (SIZE - gw), y)) {
            this._drawOverlay();
          }
          return;
        }
        c.setPointerCapture(e.pointerId);
        this.probe.onPointerDown(x, y, e.button | 0);
      });
      c.addEventListener("pointermove", (e) => this.probe.onPointerMove(e.offsetX, e.offsetY));
      c.addEventListener("pointerup", () => this.probe.onPointerUp());
      c.addEventListener("wheel", (e) => { e.preventDefault(); this.probe.onWheel(e.deltaY); }, { passive: false });
    }

    // --- session API the live editor drives -------------------------------
    getSource() {
      return this.source;
    }

    // Compiled scene: a reload gives a clean teapot (edits to the shown source
    // are not recompiled in-browser). Returns false so the editor says "state
    // kept" rather than implying the source drove a rebuild.
    reload() {
      if (!this.engine) return false;
      this.stop();
      this.probe = new this.engine.WebTeapotProbe();
      this.probe.setupGL(this.canvas.id);
      this.probe.setSize(SIZE, SIZE);
      this.probe.frame();
      this._drawOverlay();
      this._resume();
      return false;
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
      // gentle idle spin keeps the scene alive; orbit composes on top
      this.probe.spin(this._spin);
      this.probe.frame();
      this._raf = requestAnimationFrame(this._tick);
    }

    dispose() {
      this.stop();
      if (this.overlay && this.overlay.parentElement) {
        this.overlay.parentElement.removeChild(this.overlay);
      }
    }
  }

  async function launch(config) {
    const vfs = new root.RangerVFS();
    const engine = root.RangerEngineHost.createEngine(config.bundleSource, vfs, {});
    const probe = new engine.WebTeapotProbe();
    const session = new TeapotSession({
      canvas: config.canvas,
      engine,
      probe,
      source: config.source,
    });
    if (config.autostart !== false) await session.start();
    return session;
  }

  root.RangerTeapotViewer = { TeapotSession, launch };
})(typeof globalThis !== "undefined" ? globalThis : this);
