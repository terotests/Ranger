// ============================================================================
// spec_scene.tsx — one interpreted scene that exercises several no-render
// features at once: a perspective CAMERA (→ projection MATRIX), COLOR families on
// materials + the scene background, a transformed mesh (→ world MATRIX), and the
// camera used for CULLING. The single data-driven runner (three_spec_runner.rgr)
// reconciles this into the Ranger host and checks the internal objects against
// spec_goldens.json (from the real three.js). Args come from here; objects live
// in Ranger.
//
// Handle order (host assigns 1-based in add() order):
//   entities/materials 1..4 = warm, green, dark, transformed-white.
// ============================================================================

import * as THREE from 'three';

let scene, camera, renderer;

export function init() {
  // camera at the origin, no rotation → identity view, so a frustum built from
  // its projection matrix is expressed in camera space (matches the goldens).
  camera = new THREE.PerspectiveCamera(50, 1.5, 0.1, 100);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x336699);

  // color families (distinct materials, no dedup — handles 1..4 in order)
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ color: 0xff8800 })));
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ color: 0x00ff00 })));
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ color: 0x123456 })));

  // a transformed mesh → its world matrix exercises Matrix4.compose(T,R,S)
  const m = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  m.position.set(10, 20, 30);
  m.rotation.set(0.3, 0.5, 0.7);
  m.scale.set(2, 3, 4);
  scene.add(m);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(300, 200);
}

export function tick() { renderer.render(scene, camera); }
