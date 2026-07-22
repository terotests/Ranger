/** Boot / drive WebMeshEditorHost for the 3D preview canvas. */

/**
 * Build a Ranger ES6 `buffer` (ArrayBuffer + DataView) from RGBA bytes.
 * One memcpy — avoids host.bytesToBuffer's per-element loop.
 * @param {Uint8Array|Uint8ClampedArray|ArrayLike<number>} rgba
 */
function toRangerBuffer(rgba) {
  const src = rgba instanceof Uint8Array ? rgba : new Uint8Array(rgba);
  const ab = new ArrayBuffer(src.byteLength);
  new Uint8Array(ab).set(src);
  ab._view = new DataView(ab);
  return ab;
}

function hasMap(part) {
  return !!(part?.mapRgba && part.mapRgba.length && part.mapW > 0 && part.mapH > 0);
}

export async function createPreviewSession(canvas, size = 420, opts = {}) {
  const bundleSource = await fetch("/ranger/mesh_editor.bundle.js").then((r) => r.text());
  const vfs = new window.RangerVFS();
  const engine = window.RangerEngineHost.createEngine(bundleSource, vfs, {});
  const host = new engine.WebMeshEditorHost();

  if (!canvas.id) canvas.id = "mesh-editor-preview";
  canvas.width = size;
  canvas.height = size;

  let useGL = false;
  try {
    useGL = !!host.setupGL(canvas.id);
  } catch {
    useGL = false;
  }

  host.init(size, size);

  const ctx = useGL ? null : canvas.getContext("2d");
  const image = ctx ? ctx.createImageData(size, size) : null;

  let raf = 0;
  let last = performance.now();
  let running = false;
  let lastMesh = null;
  let lastMode = 3;
  const placeModeGetter = opts.placeModeGetter || (() => false);

  function blit() {
    if (useGL || !ctx || !image) return;
    const rgb = new Uint8Array(host.framePixels());
    const out = image.data;
    for (let i = 0, j = 0; j + 2 < rgb.length && i + 3 < out.length; i += 4, j += 3) {
      out[i] = rgb[j];
      out[i + 1] = rgb[j + 1];
      out[i + 2] = rgb[j + 2];
      out[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }

  function tick(now) {
    if (!running) return;
    const dt = Math.min(64, now - last);
    last = now;
    host.frame(dt);
    blit();
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  /**
   * Upload each distinct atlas once (by object identity), then addPart geometry.
   * Empty mapBytes + hasPartMap on the host applies the shared ThreeTexture.
   */
  function pushMesh(mesh) {
    if (!mesh) return;
    host.setMaterialMode(lastMode | 0);
    if (mesh.parts && mesh.parts.length) {
      host.beginParts();
      let currentMap = null;
      const emptyMap = [];
      const canShare =
        typeof host.setPartMapBuffer === "function" && typeof host.clearPartMap === "function";

      for (const part of mesh.parts) {
        if (hasMap(part)) {
          if (canShare) {
            if (part.mapRgba !== currentMap) {
              host.setPartMapBuffer(toRangerBuffer(part.mapRgba), part.mapW | 0, part.mapH | 0);
              currentMap = part.mapRgba;
            }
            host.addPart(
              part.positions,
              part.normals,
              part.uvs,
              part.indices,
              part.colorHex | 0,
              part.shininess || 120,
              part.opacity == null ? 1 : part.opacity,
              part.reflectivity || 0,
              emptyMap,
              part.mapW | 0,
              part.mapH | 0,
            );
          } else {
            // Older host bundle: fall back to per-part upload (still TypedArray-safe).
            const mapBytes =
              part.mapRgba instanceof Uint8Array
                ? part.mapRgba
                : Array.from(part.mapRgba);
            host.addPart(
              part.positions,
              part.normals,
              part.uvs,
              part.indices,
              part.colorHex | 0,
              part.shininess || 120,
              part.opacity == null ? 1 : part.opacity,
              part.reflectivity || 0,
              mapBytes,
              part.mapW | 0,
              part.mapH | 0,
            );
          }
        } else {
          if (canShare && currentMap !== null) {
            host.clearPartMap();
            currentMap = null;
          }
          host.addPart(
            part.positions,
            part.normals,
            part.uvs,
            part.indices,
            part.colorHex | 0,
            part.shininess || 120,
            part.opacity == null ? 1 : part.opacity,
            part.reflectivity || 0,
            emptyMap,
            0,
            0,
          );
        }
      }
      host.frame(0);
      blit();
      return;
    }
    if (mesh.positions) {
      host.setMesh(mesh.positions, mesh.normals, mesh.uvs, mesh.indices);
      host.frame(0);
      blit();
    }
  }

  function setMesh(mesh) {
    lastMesh = mesh;
    pushMesh(mesh);
  }

  function setMaterialMode(mode) {
    lastMode = mode | 0;
    host.setMaterialMode(lastMode);
    if (lastMesh) pushMesh(lastMesh);
    else {
      host.frame(0);
      blit();
    }
  }

  function setAutoRotate(_on) {
    // Autorotate removed — always keep the mesh fixed for stable UV picks.
    host.setAutoRotate?.(false);
  }

  function getView() {
    try {
      return {
        cam: [host.viewCamX(), host.viewCamY(), host.viewCamZ()],
        target: [host.viewTargetX(), host.viewTargetY(), host.viewTargetZ()],
        fovDeg: host.viewFov(),
        width: host.viewWidth(),
        height: host.viewHeight(),
        meshAngle: host.viewMeshAngle(),
        meshTilt: host.viewMeshTilt(),
      };
    } catch {
      return null;
    }
  }

  function wirePointer() {
    const onDown = (e) => {
      // In place mode, Preview3D capture handlers own left-click; still allow right orbit via host.
      if (placeModeGetter() && e.button === 0) return;
      canvas.setPointerCapture(e.pointerId);
      host.pointerDown(e.offsetX, e.offsetY, e.button);
    };
    const onMove = (e) => {
      if (placeModeGetter() && e.buttons === 1) return;
      host.pointerMove(e.offsetX, e.offsetY);
    };
    const onUp = () => host.pointerUp();
    const onWheel = (e) => {
      e.preventDefault();
      host.wheel(e.deltaY);
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }

  const unwire = wirePointer();
  start();

  return {
    host,
    useGL,
    setMesh,
    setMaterialMode,
    setAutoRotate,
    getView,
    start,
    stop,
    dispose() {
      stop();
      unwire();
    },
  };
}
