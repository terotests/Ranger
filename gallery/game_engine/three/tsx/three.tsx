// ============================================================================
// three.tsx — thin TSX façade for the Ranger Three clone (capability: 'three').
// ============================================================================
//
// Layer 1 of IDEAL_THREE: the THREE.* classes the browser TSX interpreter sees,
// so the canonical Three.js script runs 1:1. These are THIN — plain data +
// trivial methods; all math + GPU is the Ranger core (three/src), reached by the
// render bridge at renderer.render(). Mutable per-frame state (position/rotation)
// lives here and is re-read each render (the needsUpdate model — no proxies).
//
// Interpreter constraints honoured: no `extends`/`super` (flattened — each node
// carries its own position/rotation/scale), no `=== undefined`.
// ============================================================================

class Vector3 {
  x = 0;
  y = 0;
  z = 0;
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
}

class Scene {
  isScene = true;
  position = new Vector3();
  rotation = new Vector3();
  scale = new Vector3().set(1, 1, 1);
  children = [];
  add(o) { this.children.push(o); return this; }
}

class PerspectiveCamera {
  isCamera = true;
  isPerspectiveCamera = true;
  position = new Vector3();
  rotation = new Vector3();
  scale = new Vector3().set(1, 1, 1);
  fov = 50;
  aspect = 1;
  near = 0.1;
  far = 2000;
  constructor(fov, aspect, near, far) {
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
  }
  updateProjectionMatrix() { }
}

class BoxGeometry {
  isBoxGeometry = true;
  width = 1;
  height = 1;
  depth = 1;
}

class Texture {
  isTexture = true;
  path = "";
  colorSpace = "srgb-linear";
  needsUpdate = true;
}

class TextureLoader {
  load(path) {
    const t = new Texture();
    t.path = path;
    return t;
  }
}

class MeshBasicMaterial {
  isMeshBasicMaterial = true;
  map = null;
  color = 16777215;
  constructor(params) {
    this.map = params.map;
  }
}

class Mesh {
  isMesh = true;
  position = new Vector3();
  rotation = new Vector3();
  scale = new Vector3().set(1, 1, 1);
  geometry = null;
  material = null;
  constructor(geometry, material) {
    this.geometry = geometry;
    this.material = material;
  }
  add(o) { return this; }
}

class WebGLRenderer {
  domElement = {};
  width = 300;
  height = 150;
  pixelRatio = 1;
  frames = 0;
  hasLoop = 0;
  constructor(params) { }
  setPixelRatio(r) { this.pixelRatio = r; }
  setSize(w, h) { this.width = w; this.height = h; }
  setAnimationLoop(fn) { this.loop = fn; this.hasLoop = 1; }
  // The bridge to the Ranger core renderer lands here (three_render(...));
  // for now it just counts frames so the PoC can confirm the loop drives it.
  render(scene, camera) { this.frames = this.frames + 1; }
}
