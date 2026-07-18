// ============================================================================
// geom_probes.tsx — a scene of primitive + complex geometries, driven from the
// INTERPRETER. Random three.js geometry code: the args come from here; the real
// vertex data is built in the Ranger host (three_scene_host.geometry*) from those
// args — the objects do NOT live in JS. The test (three_geometry_parity_test.rgr)
// interprets this, reconciles it through ThreeTsxBridge into the host, then reads
// the REAL Ranger geometry back and validates it against real-three.js goldens.
//
// One mesh per geometry, in the same order as reference/geom_goldens.json, so the
// host registry handle 1..N lines up with the golden keys.
// ============================================================================

import * as THREE from 'three';

let scene, camera, renderer;

export function init() {
  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 5);

  scene = new THREE.Scene();
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // order MUST match the golden order (host handles are assigned in add() order)
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 3, 2, 2), mat));            // 1 plane
  scene.add(new THREE.Mesh(new THREE.CircleGeometry(1, 8), mat));                 // 2 circle
  scene.add(new THREE.Mesh(new THREE.RingGeometry(0.5, 1, 8, 1), mat));           // 3 ring
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), mat));             // 4 sphere
  scene.add(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 8, 1), mat));      // 5 cylinder
  scene.add(new THREE.Mesh(new THREE.ConeGeometry(1, 2, 8), mat));               // 6 cone
  scene.add(new THREE.Mesh(new THREE.TorusGeometry(1, 0.4, 6, 12), mat));         // 7 torus
  scene.add(new THREE.Mesh(new THREE.TorusKnotGeometry(1, 0.4, 32, 6, 2, 3), mat)); // 8 torusknot
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat));                // 9 box

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(200, 200);
}

export function tick() { renderer.render(scene, camera); }
