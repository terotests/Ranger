// ============================================================================
// parity_probes.tsx — value-parity probes: NATURAL three.js code, one exported
// function per golden key in three/reference/goldens.json (computed from the
// real three.js). The Ranger value-parity suite interprets this on the façade
// and asserts each returned value equals the golden — so every function here is
// a "would this random three.js snippet return the right value?" test.
//
// These deliberately use idiomatic three.js (constructor args, method chains,
// subclass-free), NOT the façade's current 5-method subset — so most report a
// GAP today. That is the measurement. As the façade grows, GAPs flip to OK and
// the parity % rises. Keep every function in lock-step with gen-goldens.mjs.
// ============================================================================

import * as THREE from 'three';

// --- Vector3 ---------------------------------------------------------------
export function v3_add() {
  const a = new THREE.Vector3(1, 2, 3);
  const b = new THREE.Vector3(4, 5, 6);
  const c = a.clone().add(b);
  return { x: c.x, y: c.y, z: c.z, len: c.length() };
}
export function v3_sub() {
  const c = new THREE.Vector3(1, 2, 3).sub(new THREE.Vector3(4, 5, 6));
  return { x: c.x, y: c.y, z: c.z };
}
export function v3_cross() {
  const c = new THREE.Vector3(1, 2, 3).cross(new THREE.Vector3(4, 5, 6));
  return { x: c.x, y: c.y, z: c.z };
}
export function v3_dot() {
  return { dot: new THREE.Vector3(1, 2, 3).dot(new THREE.Vector3(4, 5, 6)) };
}
export function v3_normalize() {
  const c = new THREE.Vector3(3, 0, 4).normalize();
  return { x: c.x, y: c.y, z: c.z };
}
export function v3_lengthSq() {
  return { v: new THREE.Vector3(3, 0, 4).lengthSq() };
}
export function v3_distanceTo() {
  return { d: new THREE.Vector3(1, 2, 3).distanceTo(new THREE.Vector3(4, 5, 6)) };
}
export function v3_lerp() {
  const c = new THREE.Vector3(1, 2, 3).lerp(new THREE.Vector3(4, 5, 6), 0.25);
  return { x: c.x, y: c.y, z: c.z };
}
export function v3_multiplyScalar() {
  const c = new THREE.Vector3(1, 2, 3).multiplyScalar(2.5);
  return { x: c.x, y: c.y, z: c.z };
}
export function v3_applyMatrix4() {
  const m = new THREE.Matrix4().makeTranslation(10, 20, 30);
  const c = new THREE.Vector3(1, 2, 3).applyMatrix4(m);
  return { x: c.x, y: c.y, z: c.z };
}
export function v3_applyQuaternion() {
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
  const c = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
  return { x: c.x, y: c.y, z: c.z };
}

// --- Vector2 ---------------------------------------------------------------
export function v2_length() {
  return { v: new THREE.Vector2(3, 4).length() };
}
export function v2_add() {
  const c = new THREE.Vector2(3, 4).add(new THREE.Vector2(1, 1));
  return { x: c.x, y: c.y };
}
export function v2_angle() {
  return { v: new THREE.Vector2(1, 1).angle() };
}

// --- Matrix4 ---------------------------------------------------------------
export function m4_rotY_applied() {
  const m = new THREE.Matrix4().makeRotationY(Math.PI / 2);
  const c = new THREE.Vector3(1, 0, 0).applyMatrix4(m);
  return { x: c.x, y: c.y, z: c.z };
}
export function m4_compose_elements() {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(1, 2, 3),
    new THREE.Quaternion(),
    new THREE.Vector3(1, 1, 1)
  );
  return { e: m.elements };
}
export function m4_determinant() {
  return { v: new THREE.Matrix4().makeScale(2, 3, 4).determinant() };
}

// --- Quaternion ------------------------------------------------------------
export function quat_axisAngle() {
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  return { x: q.x, y: q.y, z: q.z, w: q.w };
}
export function quat_fromEuler() {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, 0.2, 0.3, 'XYZ'));
  return { x: q.x, y: q.y, z: q.z, w: q.w };
}

// --- Euler -----------------------------------------------------------------
export function euler_fromQuat() {
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  const e = new THREE.Euler().setFromQuaternion(q, 'XYZ');
  return { x: e.x, y: e.y, z: e.z };
}

// --- Color -----------------------------------------------------------------
export function color_channels() {
  const c = new THREE.Color(0xff8800);
  return { r: c.r, g: c.g, b: c.b };
}
export function color_named() {
  return { hex: new THREE.Color('red').getHex() };
}
export function color_hsl() {
  const c = new THREE.Color().setHSL(0.5, 1.0, 0.5);
  return { r: c.r, g: c.g, b: c.b };
}

// --- Object3D --------------------------------------------------------------
export function o3d_lookAt_quat() {
  const o = new THREE.Object3D();
  o.position.set(0, 0, 0);
  o.lookAt(0, 0, -1);
  return { x: o.quaternion.x, y: o.quaternion.y, z: o.quaternion.z, w: o.quaternion.w };
}
export function o3d_worldPos() {
  const parent = new THREE.Object3D();
  parent.position.set(10, 0, 0);
  const child = new THREE.Object3D();
  child.position.set(0, 5, 0);
  parent.add(child);
  parent.updateMatrixWorld(true);
  const wp = new THREE.Vector3();
  child.getWorldPosition(wp);
  return { x: wp.x, y: wp.y, z: wp.z };
}
export function o3d_childCount() {
  const parent = new THREE.Object3D();
  parent.add(new THREE.Object3D());
  return { n: parent.children.length };
}
export function o3d_parentIsSet() {
  const parent = new THREE.Object3D();
  const child = new THREE.Object3D();
  parent.add(child);
  // `same` exercises the identity blocker; `kids` keeps null===null from
  // coincidentally passing (real add() also sets .parent AND pushes a child).
  return { same: child.parent === parent, kids: parent.children.length };
}
export function o3d_traverse() {
  const g = new THREE.Group();
  g.add(new THREE.Object3D());
  g.add(new THREE.Object3D());
  let visited = 0;
  g.traverse(() => { visited = visited + 1; });
  return { visited: visited };
}

// --- MathUtils -------------------------------------------------------------
export function math_degToRad() {
  return { v: THREE.MathUtils.degToRad(90) };
}
export function math_clamp() {
  return { v: THREE.MathUtils.clamp(5, 0, 3) };
}
export function math_lerp() {
  return { v: THREE.MathUtils.lerp(0, 10, 0.3) };
}

// --- Baseline: idioms the façade supports TODAY (regression gate, not golden) --
// These must stay OK; if one breaks, the façade regressed. Expected values are
// asserted directly in three_value_parity_test.rgr (no goldens.json entry).
export function base_v3_set() {
  const v = new THREE.Vector3().set(1, 2, 3);
  return { x: v.x, y: v.y, z: v.z };
}
export function base_v3_clone_indep() {
  const v = new THREE.Vector3().set(1, 2, 3);
  const c = v.clone();
  c.setScalar(9);
  return { vx: v.x, cx: c.x };          // v unchanged (1), clone diverged (9)
}
export function base_scene_children() {
  const s = new THREE.Scene();
  const m = new THREE.Mesh();
  s.add(m);
  const after1 = s.children.length;
  s.remove(m);
  const after2 = s.children.length;
  return { after1: after1, after2: after2 };
}
export function base_spherical() {
  const v = new THREE.Vector3().setFromSphericalCoords(1, Math.PI / 2, 0);
  return { x: v.x, y: v.y, z: v.z };    // -> (0, 0, 1)
}
