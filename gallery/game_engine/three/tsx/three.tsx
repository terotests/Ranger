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

// A process-wide id counter so the bridge can bind a mixer to its target across
// the interpreter's broken object identity (=== on objects is unreliable). Every
// bindable node stamps a unique __uid in its constructor.
let __threeUid = 0;

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
  add(o) { o.__removed = false; this.children.push(o); return this; }
  // NOTE: the TSX interpreter's object-identity `!==` does not distinguish
  // instances, so filter on a removal flag set on the object instead (identity via
  // a marker). This makes scene.remove actually shrink children — the teapot's
  // rebuild (remove old mesh + add new) depends on it, and the generic bridge then
  // reconciles the current children faithfully.
  remove(o) {
    o.__removed = true;
    const next = [];
    let i = 0;
    while (i < this.children.length) {
      if (this.children[i].__removed !== true) { next.push(this.children[i]); }
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

// --- Primitive + complex geometries -----------------------------------------
// Thin arg holders ONLY: the vertex data is built in the Ranger host from these
// args (the bridge reads them and commands host.geometry*()). No geometry math in
// JS — the objects live in Ranger. Omitted args stay undefined; the bridge/host
// supplies the three.js default (single place), matching the Box path.
class PlaneGeometry {
  isPlaneGeometry = true;
  constructor(width, height, widthSegments, heightSegments) {
    this.width = width; this.height = height;
    this.widthSegments = widthSegments; this.heightSegments = heightSegments;
  }
  dispose() { }
}
class CircleGeometry {
  isCircleGeometry = true;
  constructor(radius, segments, thetaStart, thetaLength) {
    this.radius = radius; this.segments = segments;
    this.thetaStart = thetaStart; this.thetaLength = thetaLength;
  }
  dispose() { }
}
class RingGeometry {
  isRingGeometry = true;
  constructor(innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength) {
    this.innerRadius = innerRadius; this.outerRadius = outerRadius;
    this.thetaSegments = thetaSegments; this.phiSegments = phiSegments;
    this.thetaStart = thetaStart; this.thetaLength = thetaLength;
  }
  dispose() { }
}
class SphereGeometry {
  isSphereGeometry = true;
  constructor(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength) {
    this.radius = radius; this.widthSegments = widthSegments; this.heightSegments = heightSegments;
    this.phiStart = phiStart; this.phiLength = phiLength;
    this.thetaStart = thetaStart; this.thetaLength = thetaLength;
  }
  dispose() { }
}
class CylinderGeometry {
  isCylinderGeometry = true;
  constructor(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength) {
    this.radiusTop = radiusTop; this.radiusBottom = radiusBottom; this.height = height;
    this.radialSegments = radialSegments; this.heightSegments = heightSegments;
    this.openEnded = openEnded; this.thetaStart = thetaStart; this.thetaLength = thetaLength;
  }
  dispose() { }
}
class ConeGeometry {
  isConeGeometry = true;
  constructor(radius, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength) {
    this.radius = radius; this.height = height;
    this.radialSegments = radialSegments; this.heightSegments = heightSegments;
    this.openEnded = openEnded; this.thetaStart = thetaStart; this.thetaLength = thetaLength;
  }
  dispose() { }
}
// Sweep a circular tube of `radius` along a polyline path. Unlike upstream
// three.js (which takes a Curve), this port takes an explicit flat point array
// `points` = [x0,y0,z0, x1,y1,z1, …] so a scene can build precise wireform /
// outline shapes (e.g. a flipper's rubber edge). closed stitches the last ring
// back to the first. The host (ThreeTubeGeometry) builds the real vertices.
class TubeGeometry {
  isTubeGeometry = true;
  constructor(points, radius, radialSegments, closed) {
    this.points = points;
    this.radius = radius;
    this.radialSegments = radialSegments;
    this.closed = closed;
  }
  dispose() { }
}
class TorusGeometry {
  isTorusGeometry = true;
  constructor(radius, tube, radialSegments, tubularSegments, arc) {
    this.radius = radius; this.tube = tube;
    this.radialSegments = radialSegments; this.tubularSegments = tubularSegments; this.arc = arc;
  }
  dispose() { }
}
class TorusKnotGeometry {
  isTorusKnotGeometry = true;
  constructor(radius, tube, tubularSegments, radialSegments, p, q) {
    this.radius = radius; this.tube = tube;
    this.tubularSegments = tubularSegments; this.radialSegments = radialSegments;
    this.p = p; this.q = q;
  }
  dispose() { }
}

// --- Animation --------------------------------------------------------------
// Thin arg holders: the sampling (linear / slerp) and the mixer application run
// in the Ranger core (three_animation). Track names are three.js property paths
// ('.position' / '.quaternion' / '.scale'); stride = components per keyframe.
class VectorKeyframeTrack {
  isKeyframeTrack = true;
  constructor(name, times, values) {
    this.name = name; this.times = times; this.values = values;
    this.stride = 3; this.isQuaternion = false;
  }
}
class NumberKeyframeTrack {
  isKeyframeTrack = true;
  constructor(name, times, values) {
    this.name = name; this.times = times; this.values = values;
    this.stride = 1; this.isQuaternion = false;
  }
}
class QuaternionKeyframeTrack {
  isKeyframeTrack = true;
  constructor(name, times, values) {
    this.name = name; this.times = times; this.values = values;
    this.stride = 4; this.isQuaternion = true;
  }
}
class AnimationClip {
  isAnimationClip = true;
  constructor(name, duration, tracks) {
    this.name = name; this.duration = duration; this.tracks = tracks;
  }
}
class AnimationAction {
  constructor(clip) { this.clip = clip; this.running = false; this.weight = 1; }
  play() { this.running = true; return this; }
  stop() { this.running = false; return this; }
  setEffectiveWeight(w) { this.weight = w; return this; }   // crossfade weight
}
class AnimationMixer {
  isAnimationMixer = true;
  constructor(target) {
    this.target = target; this.time = 0;
    this.actions = [];        // all playing clips (blended by weight — crossfade)
    this.action = null;       // last, for single-clip convenience
  }
  clipAction(clip) {
    const a = new AnimationAction(clip);
    this.actions.push(a);
    this.action = a;
    return a;
  }
  update(dt) { this.time = this.time + dt; return this; }   // advance (accumulate)
  setTime(t) { this.time = t; return this; }                // absolute seek
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
  children = [];
  __uid = 0;
  constructor(geometry, material) {
    this.geometry = geometry;
    this.material = material;
    __threeUid = __threeUid + 1;
    this.__uid = __threeUid;
  }
  // real add now — the bridge recurses into children and builds them in the host
  // parented to this mesh (nested world transforms compose in the Ranger core).
  add(o) { o.__removed = false; this.children.push(o); return this; }
}

// A transform-only node (no geometry). THREE.Group / THREE.Object3D — the parents
// that make a scene a hierarchy. Same flat-node shape (own TRS + children); the
// bridge builds a host Object3D and parents this node's children under it.
class Group {
  isGroup = true;
  isObject3D = true;
  position = new Vector3();
  rotation = new Vector3();
  scale = new Vector3().set(1, 1, 1);
  children = [];
  add(o) { o.__removed = false; this.children.push(o); return this; }
  remove(o) {
    o.__removed = true;
    const next = [];
    let i = 0;
    while (i < this.children.length) {
      if (this.children[i].__removed !== true) { next.push(this.children[i]); }
      i = i + 1;
    }
    this.children = next;
    return this;
  }
}

class Object3D {
  isObject3D = true;
  position = new Vector3();
  rotation = new Vector3();
  scale = new Vector3().set(1, 1, 1);
  children = [];
  add(o) { o.__removed = false; this.children.push(o); return this; }
  remove(o) {
    o.__removed = true;
    const next = [];
    let i = 0;
    while (i < this.children.length) {
      if (this.children[i].__removed !== true) { next.push(this.children[i]); }
      i = i + 1;
    }
    this.children = next;
    return this;
  }
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
  // Real shadow-map toggle the bridge reads (renderer.shadowMap.enabled).
  shadowMap = { enabled: false };
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

// A grid of SH light probes (diffuse GI). The bridge builds the real
// ThreeLightProbeVolume from these dims/counts and, when bake() is called, runs
// the capture bake (probes.bake(renderer, scene, opts) -> ThreeLightProbeVolume
// .bakeFromScene) — the same generic Three.js LightProbeGenerator path, no analytic
// tints. bake() records the opts + bumps bakeRequest; the bridge does the GPU work
// (the interpreter can't). showProbes/probeSize drive the volume's own helper (the
// upstream example's separate LightProbeGridHelper is folded into the volume here).
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
  showProbes = false;
  probeSize = 0.2;
  // capture-bake opts the bridge reads (defaults match probes.bake({...}) upstream).
  cubemapSize = 32;
  near = 0.05;
  far = 1000;
  bakeRequest = 0;
  constructor(sizeX, sizeY, sizeZ, countX, countY, countZ) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.sizeZ = sizeZ;
    this.countX = countX;
    this.countY = countY;
    this.countZ = countZ;
  }
  // Bake the diffuse-GI probe volume by CAPTURING the real scene at each probe.
  // Records the opts + signals the bridge (which owns the renderer + host scene) to
  // run ThreeLightProbeVolume.bakeFromScene. Callers pass a full opts object.
  bake(renderer, scene, opts) {
    this.cubemapSize = opts.cubemapSize;
    this.near = opts.near;
    this.far = opts.far;
    this.bounces = opts.bounces;
    this.bakeRequest = this.bakeRequest + 1;
  }
  dispose() { }
}

// Axis-aligned bounds (THREE.Box3). The interpreter can't traverse decoded geometry,
// so setFromObject(model) copies the host-measured bounds the host publishes as the
// `__hostBounds` global (min/max) BEFORE init() runs — the single decoded host model.
// getSize/getCenter then mirror THREE.Box3 so the scene derives light distance,
// shadow extents and probe far exactly like the upstream example.
class Box3 {
  isBox3 = true;
  minX = 0; minY = 0; minZ = 0;
  maxX = 0; maxY = 0; maxZ = 0;
  setFromObject(obj) {
    const b = __hostBounds;
    this.minX = b.minX; this.minY = b.minY; this.minZ = b.minZ;
    this.maxX = b.maxX; this.maxY = b.maxY; this.maxZ = b.maxZ;
    return this;
  }
  getSize(target) {
    target.x = this.maxX - this.minX;
    target.y = this.maxY - this.minY;
    target.z = this.maxZ - this.minZ;
    return target;
  }
  getCenter(target) {
    target.x = (this.minX + this.maxX) * 0.5;
    target.y = (this.minY + this.maxY) * 0.5;
    target.z = (this.minZ + this.maxZ) * 0.5;
    return target;
  }
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
