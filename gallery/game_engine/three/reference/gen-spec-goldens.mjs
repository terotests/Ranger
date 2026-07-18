// ============================================================================
// gen-spec-goldens.mjs — golden values for the data-driven spec runner.
//
//   node gen-spec-goldens.mjs > spec_goldens.json
//
// One description file, several features, all computed from the REAL three.js and
// all testable WITHOUT rendering. The single compiled runner
// (three/tests/spec/three_spec_runner.rgr) interprets one scene, reconciles it
// into the Ranger host, then checks the internal objects against these values.
//
// Color note: the Ranger object-model Color stores raw hex/255 (no sRGB decode —
// a documented limitation, THREE.md §7). To compare like with like we disable
// three.js color management here, so `color.r` is the same raw channel the engine
// produces. (The sRGB-linearization gap is tracked separately in value_parity.)
// ============================================================================
import * as THREE from './vendor/current/build/three.module.js';

THREE.ColorManagement.enabled = false;

const r5 = (n) => Math.round(n * 1e5) / 1e5;
const G = {};

// --- camera + matrix: the perspective projection matrix (ThreeMatrix4) --------
const FOV = 50, ASPECT = 1.5, NEAR = 0.1, FAR = 100;
{
  const cam = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR);
  cam.updateProjectionMatrix();
  G.camera = {
    fov: FOV, aspect: ASPECT, near: NEAR, far: FAR,
    projection: cam.projectionMatrix.elements.map(r5),   // 16 elements, column-major
  };
}

// --- matrix: a mesh world matrix from a known TRS (compose) -------------------
{
  const o = new THREE.Object3D();
  o.position.set(10, 20, 30);
  o.rotation.set(0.3, 0.5, 0.7);
  o.scale.set(2, 3, 4);
  o.updateMatrix();
  G.worldMatrix = {
    position: [10, 20, 30], euler: [0.3, 0.5, 0.7], scale: [2, 3, 4],
    matrix: o.matrix.elements.map(r5),                   // local == world (no parent)
  };
}

// --- color families: raw hex -> rgb channels ---------------------------------
const families = {
  background: 0x336699,
  warm: 0xff8800,
  green: 0x00ff00,
  dark: 0x123456,
  white: 0xffffff,
};
G.colors = {};
for (const [k, hex] of Object.entries(families)) {
  const c = new THREE.Color(hex);
  G.colors[k] = { hex, r: r5(c.r), g: r5(c.g), b: r5(c.b) };
}

// --- culling: frustum from the camera projection matrix (camera space) --------
{
  const cam = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR);
  cam.updateProjectionMatrix();
  const frustum = new THREE.Frustum().setFromProjectionMatrix(cam.projectionMatrix);
  const pts = [
    { x: 0, y: 0, z: -5 },     // straight ahead, inside
    { x: 0, y: 0, z: 5 },      // behind the camera
    { x: 0, y: 0, z: -0.05 },  // nearer than the near plane
    { x: 0, y: 0, z: -200 },   // beyond the far plane
    { x: 100, y: 0, z: -5 },   // far off to the side
    { x: 0.5, y: 0.5, z: -5 }, // slightly off-axis, inside
  ];
  G.cullPoints = pts.map((p) => ({
    ...p, inside: frustum.containsPoint(new THREE.Vector3(p.x, p.y, p.z)),
  }));
  const sph = [
    { x: 0, y: 0, z: -5, r: 1 },      // inside
    { x: 0, y: 0, z: 5, r: 0.5 },     // behind
    { x: 10, y: 0, z: -5, r: 0.2 },   // outside to the side
    { x: 10, y: 0, z: -5, r: 20 },    // big sphere reaching into the frustum
  ];
  G.cullSpheres = sph.map((s) => ({
    ...s, inside: frustum.intersectsSphere(
      new THREE.Sphere(new THREE.Vector3(s.x, s.y, s.z), s.r)),
  }));
}

process.stdout.write(JSON.stringify(G, null, 2) + '\n');
