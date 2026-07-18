// ============================================================================
// gen-hierarchy-goldens.mjs — nested world-transform goldens from real three.js.
//
//   node gen-hierarchy-goldens.mjs > hierarchy_goldens.json
//
// Builds the same nested graph the Ranger test builds (hierarchy_scene.tsx) and
// captures each node's WORLD matrix + world position after updateMatrixWorld — the
// values the Ranger host must reproduce once the interpreted graph is reconciled
// with real parenting. Keep the tree shape + transforms in lock-step with the .tsx.
//
// Tree (DFS build order = host handle order):
//   1 group      pos(10,0,0) rot(0,0.5,0)
//   2  meshA     pos(0,5,0)
//   3  subgroup  pos(0,0,3) scale(2,2,2)
//   4   meshB    pos(1,0,0)
//   5 loneMesh   pos(-4,0,0)   (a second top-level node, no children)
// ============================================================================
import * as THREE from './vendor/current/build/three.module.js';

const r5 = (n) => Math.round(n * 1e5) / 1e5;
const mat = (o) => o.matrixWorld.elements.map(r5);
const wpos = (o) => { const v = new THREE.Vector3(); o.getWorldPosition(v); return [r5(v.x), r5(v.y), r5(v.z)]; };

const scene = new THREE.Scene();

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

const loneMesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
loneMesh.position.set(-4, 0, 0);

subgroup.add(meshB);
group.add(meshA);
group.add(subgroup);
scene.add(group);
scene.add(loneMesh);

scene.updateMatrixWorld(true);

// handles match the host's DFS build order (see the header)
const G = {
  nodes: {
    group:     { handle: 1, world: mat(group),     worldPos: wpos(group) },
    meshA:     { handle: 2, world: mat(meshA),     worldPos: wpos(meshA) },
    subgroup:  { handle: 3, world: mat(subgroup),  worldPos: wpos(subgroup) },
    meshB:     { handle: 4, world: mat(meshB),     worldPos: wpos(meshB) },
    loneMesh:  { handle: 5, world: mat(loneMesh),  worldPos: wpos(loneMesh) },
  },
  // traversal: scene has 5 descendants (group, meshA, subgroup, meshB, loneMesh)
  descendantCount: (() => { let n = 0; scene.traverse(() => n++); return n - 1; })(),
  childCounts: { scene: scene.children.length, group: group.children.length, subgroup: subgroup.children.length },
};

process.stdout.write(JSON.stringify(G, null, 2) + '\n');
