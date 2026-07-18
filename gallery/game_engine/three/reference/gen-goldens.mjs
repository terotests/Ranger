// ============================================================================
// gen-goldens.mjs — compute value-parity golden numbers from the REAL three.js.
//
//   node gen-goldens.mjs > goldens.json
//
// Each entry mirrors a probe function in a three/tsx/parity/*.tsx scene: the
// same construction, run against real three.js. The Ranger value-parity suite
// (three_value_parity_test.rgr) interprets the .tsx on the façade and asserts
// the engine's returned values equal these — so a mismatch is a proven
// divergence from three.js, not a guess. Regenerate after bumping the pinned
// version in fetch-three-reference.sh.
//
// Keep every probe here in lock-step with its .tsx twin (same name, same math).
// ============================================================================
import * as THREE from './vendor/current/build/three.module.js';

const G = {};
const r6 = (n) => Math.round(n * 1e6) / 1e6;      // stabilise float noise
const vec = (v) => ({ x: r6(v.x), y: r6(v.y), z: r6(v.z) });

// --- Vector3 ---------------------------------------------------------------
{
  const a = new THREE.Vector3(1, 2, 3);
  const b = new THREE.Vector3(4, 5, 6);
  G.v3_add = { ...vec(a.clone().add(b)), len: r6(a.clone().add(b).length()) };
  G.v3_sub = vec(a.clone().sub(b));
  G.v3_cross = vec(a.clone().cross(b));
  G.v3_dot = { dot: r6(a.dot(b)) };
  G.v3_normalize = { ...vec(new THREE.Vector3(3, 0, 4).clone().normalize()) };
  G.v3_lengthSq = { v: r6(new THREE.Vector3(3, 0, 4).lengthSq()) };
  G.v3_distanceTo = { d: r6(a.distanceTo(b)) };
  G.v3_lerp = vec(a.clone().lerp(b, 0.25));
  G.v3_multiplyScalar = vec(a.clone().multiplyScalar(2.5));
  G.v3_applyMatrix4 = vec(
    new THREE.Vector3(1, 2, 3).applyMatrix4(
      new THREE.Matrix4().makeTranslation(10, 20, 30)
    )
  );
  G.v3_applyQuaternion = vec(
    new THREE.Vector3(1, 0, 0).applyQuaternion(
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2)
    )
  );
}

// --- Vector2 ---------------------------------------------------------------
{
  const a = new THREE.Vector2(3, 4);
  G.v2_length = { v: r6(a.length()) };
  G.v2_add = { x: r6(a.clone().add(new THREE.Vector2(1, 1)).x), y: r6(a.clone().add(new THREE.Vector2(1, 1)).y) };
  G.v2_angle = { v: r6(new THREE.Vector2(1, 1).angle()) };
}

// --- Matrix4 ---------------------------------------------------------------
{
  const m = new THREE.Matrix4().makeRotationY(Math.PI / 2);
  const p = new THREE.Vector3(1, 0, 0).applyMatrix4(m);
  G.m4_rotY_applied = vec(p);
  const c = new THREE.Matrix4().compose(
    new THREE.Vector3(1, 2, 3),
    new THREE.Quaternion(),
    new THREE.Vector3(1, 1, 1)
  );
  G.m4_compose_elements = { e: c.elements.map(r6) };
  const det = new THREE.Matrix4().makeScale(2, 3, 4).determinant();
  G.m4_determinant = { v: r6(det) };
}

// --- Quaternion ------------------------------------------------------------
{
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  G.quat_axisAngle = { x: r6(q.x), y: r6(q.y), z: r6(q.z), w: r6(q.w) };
  const e = new THREE.Euler(0.1, 0.2, 0.3, 'XYZ');
  const q2 = new THREE.Quaternion().setFromEuler(e);
  G.quat_fromEuler = { x: r6(q2.x), y: r6(q2.y), z: r6(q2.z), w: r6(q2.w) };
}

// --- Euler -----------------------------------------------------------------
{
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  const e = new THREE.Euler().setFromQuaternion(q, 'XYZ');
  G.euler_fromQuat = { x: r6(e.x), y: r6(e.y), z: r6(e.z) };
}

// --- Color -----------------------------------------------------------------
{
  const c = new THREE.Color(0xff8800);
  G.color_channels = { r: r6(c.r), g: r6(c.g), b: r6(c.b) };
  const c2 = new THREE.Color('red');
  G.color_named = { hex: c2.getHex() };
  const c3 = new THREE.Color().setHSL(0.5, 1.0, 0.5);
  G.color_hsl = { r: r6(c3.r), g: r6(c3.g), b: r6(c3.b) };
}

// --- Object3D --------------------------------------------------------------
{
  const o = new THREE.Object3D();
  o.position.set(0, 0, 0);
  o.lookAt(0, 0, -1);
  G.o3d_lookAt_quat = { x: r6(o.quaternion.x), y: r6(o.quaternion.y), z: r6(o.quaternion.z), w: r6(o.quaternion.w) };

  const parent = new THREE.Object3D();
  parent.position.set(10, 0, 0);
  const child = new THREE.Object3D();
  child.position.set(0, 5, 0);
  parent.add(child);
  parent.updateMatrixWorld(true);
  const wp = new THREE.Vector3();
  child.getWorldPosition(wp);
  G.o3d_worldPos = vec(wp);
  G.o3d_childCount = { n: parent.children.length };
  G.o3d_parentIsSet = { same: child.parent === parent, kids: parent.children.length };   // identity — the interpreter blocker

  const g = new THREE.Group();
  g.add(new THREE.Object3D());
  g.add(new THREE.Object3D());
  let visited = 0;
  g.traverse(() => { visited++; });
  G.o3d_traverse = { visited };                            // group + 2 children = 3
}

// --- MathUtils -------------------------------------------------------------
{
  G.math_degToRad = { v: r6(THREE.MathUtils.degToRad(90)) };
  G.math_clamp = { v: r6(THREE.MathUtils.clamp(5, 0, 3)) };
  G.math_lerp = { v: r6(THREE.MathUtils.lerp(0, 10, 0.3)) };
}

process.stdout.write(JSON.stringify(G, null, 2) + '\n');
