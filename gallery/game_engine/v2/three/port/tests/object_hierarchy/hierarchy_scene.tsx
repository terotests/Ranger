// ============================================================================
// hierarchy_scene.tsx — a nested scene graph, driven from the interpreter. Args
// come from here; the host builds the real Ranger Object3D tree with parenting,
// and the core's updateMatrixWorld composes each node's world transform. The test
// reads those world matrices back and checks them against real three.js.
//
// Tree (DFS build order = host handle order, see the goldens):
//   1 group      pos(10,0,0) rot(0,0.5,0)
//   2  meshA     pos(0,5,0)
//   3  subgroup  pos(0,0,3) scale(2,2,2)
//   4   meshB    pos(1,0,0)
//   5 loneMesh   pos(-4,0,0)   (second top-level node, no children — flat path)
// ============================================================================

import * as THREE from 'three';

let scene, camera, renderer;

export function init() {
  camera = new THREE.PerspectiveCamera(50, 1.5, 0.1, 100);
  scene = new THREE.Scene();

  const group = new THREE.Group();
  group.position.set(10, 0, 0);
  group.rotation.set(0, 0.5, 0);

  const meshA = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  meshA.position.set(0, 5, 0);

  const subgroup = new THREE.Group();
  subgroup.position.set(0, 0, 3);
  subgroup.scale.set(2, 2, 2);

  const meshB = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  meshB.position.set(1, 0, 0);

  subgroup.add(meshB);
  group.add(meshA);
  group.add(subgroup);
  scene.add(group);

  const loneMesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  loneMesh.position.set(-4, 0, 0);
  scene.add(loneMesh);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(300, 200);
}

export function tick() { renderer.render(scene, camera); }
