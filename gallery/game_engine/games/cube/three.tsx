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
  setScalar(s) { this.x = s; this.y = s; this.z = s; return this; }
  clone() { const v = new Vector3(); v.x = this.x; v.y = this.y; v.z = this.z; return v; }
  // r, phi (polar from +Y), theta (azimuth) -> position on a sphere.
  setFromSphericalCoords(r, phi, theta) {
    const sp = r * Math.sin(phi);
    this.x = sp * Math.sin(theta);
    this.y = r * Math.cos(phi);
    this.z = sp * Math.cos(theta);
    return this;
  }
}

// Tone-mapping constant referenced by the scene (renderer.toneMapping).
const ACESFilmicToneMapping = 4;

// Constants the teapot example references (side, wrapping, colour space).
const FrontSide = 0;
const BackSide = 1;
const DoubleSide = 2;
const RepeatWrapping = 1000;

class Color {
  isColor = true;
  hex = 0;
  constructor(hex) { this.hex = hex; }
}

class Scene {
  isScene = true;
  position = new Vector3();
  rotation = new Vector3();
  scale = new Vector3().set(1, 1, 1);
  children = [];
  background = null;
  add(o) { this.children.push(o); return this; }
  remove(o) {
    const next = [];
    let i = 0;
    while (i < this.children.length) {
      if (this.children[i] !== o) { next.push(this.children[i]); }
      i = i + 1;
    }
    this.children = next;
    return this;
  }
}

class AmbientLight {
  isLight = true;
  isAmbientLight = true;
  color = 16777215;
  intensity = 1;
  position = new Vector3();
  constructor(color, intensity) {
    this.color = color;
    this.intensity = intensity;
  }
}

class OrthoShadowCamera {
  left = -5;
  right = 5;
  top = 5;
  bottom = -5;
  near = 0.5;
  far = 500;
}

class DirectionalLightShadow {
  mapSize = 512;
  camera = new OrthoShadowCamera();
}

class LightTarget {
  isObject3D = true;
  position = new Vector3();
  updateMatrixWorld() { }
}

class DirectionalLight {
  isLight = true;
  isDirectionalLight = true;
  color = 16777215;
  intensity = 1;
  position = new Vector3();
  castShadow = false;
  target = new LightTarget();
  shadow = new DirectionalLightShadow();
  constructor(color, intensity) {
    this.color = color;
    this.intensity = intensity;
  }
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
  wrapS = 0;
  wrapT = 0;
  anisotropy = 1;
  needsUpdate = true;
}

class TextureLoader {
  load(path) {
    const t = new Texture();
    t.path = path;
    return t;
  }
}

class CubeTexture {
  isCubeTexture = true;
  path = "";
  urls = [];
}

class CubeTextureLoader {
  path = "";
  setPath(p) { this.path = p; return this; }
  load(urls) {
    const t = new CubeTexture();
    t.path = this.path;
    t.urls = urls;
    return t;
  }
}

// TeapotGeometry(size, tessellation, bottom, lid, body, fitLid, blinn). Thin data
// holder — the bridge builds the real Ranger ThreeTeapotGeometry from these.
class TeapotGeometry {
  isTeapotGeometry = true;
  size = 300;
  segments = 10;
  bottom = true;
  lid = true;
  body = true;
  fitLid = true;
  blinn = true;
  constructor(size, segments, bottom, lid, body, fitLid, blinn) {
    this.size = size;
    this.segments = segments;
    this.bottom = bottom;
    this.lid = lid;
    this.body = body;
    this.fitLid = fitLid;
    this.blinn = blinn;
  }
  dispose() { }
}

class MeshBasicMaterial {
  isMeshBasicMaterial = true;
  map = null;
  color = 16777215;
  wireframe = false;
  side = 0;
  constructor(params) {
    this.map = params.map;
    this.color = params.color;
    this.wireframe = params.wireframe;
    this.side = params.side;
  }
}

class MeshLambertMaterial {
  isMeshLambertMaterial = true;
  map = null;
  color = 16777215;
  side = 0;
  constructor(params) {
    this.map = params.map;
    this.color = params.color;
    this.side = params.side;
  }
}

class MeshPhongMaterial {
  isMeshPhongMaterial = true;
  map = null;
  envMap = null;
  color = 16777215;
  specular = 1118481;
  shininess = 30;
  flatShading = false;
  side = 0;
  constructor(params) {
    this.map = params.map;
    this.envMap = params.envMap;
    this.color = params.color;
    this.specular = params.specular;
    this.shininess = params.shininess;
    this.flatShading = params.flatShading;
    this.side = params.side;
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
  // Tone mapping is real, interpreter-visible state the bridge reads (so the
  // scene's renderer.toneMapping / .toneMappingExposure actually drive the render
  // instead of being dropped). Defaults match three.js (NoToneMapping, exposure 1).
  toneMapping = 0;
  toneMappingExposure = 1;
  constructor(params) { }
  setPixelRatio(r) { this.pixelRatio = r; }
  setSize(w, h) { this.width = w; this.height = h; }
  setAnimationLoop(fn) { this.loop = fn; this.hasLoop = 1; }
  // The bridge to the Ranger core renderer lands here (three_render(...));
  // for now it just counts frames so the PoC can confirm the loop drives it.
  render(scene, camera) { this.frames = this.frames + 1; }
}

// --- Sponza light-probe-volume additions ------------------------------------
// Preetham sky dome. Flat data holder (the scattering shader is Ranger-side).
class Sky {
  isSky = true;
  position = new Vector3();
  rotation = new Vector3();
  scale = new Vector3().set(1, 1, 1);
  turbidity = 10;
  rayleigh = 3;
  mieCoefficient = 0.005;
  mieDirectionalG = 0.7;
  sunPosition = new Vector3().set(0, 1, 0);
}

// A grid of SH light probes (diffuse GI). The bridge builds + bakes the real
// ThreeLightProbeGrid from these dims/counts; the interpreter just declares them.
class LightProbeGrid {
  isLightProbeGrid = true;
  position = new Vector3();
  rotation = new Vector3();
  scale = new Vector3().set(1, 1, 1);
  visible = true;
  sizeX = 1;
  sizeY = 1;
  sizeZ = 1;
  countX = 2;
  countY = 2;
  countZ = 2;
  bounces = 1;
  constructor(sizeX, sizeY, sizeZ, countX, countY, countZ) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.sizeZ = sizeZ;
    this.countX = countX;
    this.countY = countY;
    this.countZ = countZ;
  }
  dispose() { }
}

class LightProbeGridHelper {
  isLightProbeGridHelper = true;
  visible = false;
  size = 0.2;
  constructor(probes, size) { this.size = size; }
  update() { }
  dispose() { }
}

// A model the host loads (Sponza) — declared in the scene by name; the bridge
// attaches the host-decoded geometry and measures its bounds. Stands in for the
// async GLTFLoader (the network fetch + parse is host-side, not interpreted).
class GLTFModel {
  isModel = true;
  isObject3D = true;
  name = "";
  position = new Vector3();
  rotation = new Vector3();
  scale = new Vector3().set(1, 1, 1);
  children = [];
  constructor(name) { this.name = name; }
  add(o) { this.children.push(o); return this; }
}
