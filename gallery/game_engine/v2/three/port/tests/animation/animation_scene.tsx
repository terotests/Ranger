// ============================================================================
// animation_scene.tsx — keyframe animation driven through the interpreter. The
// track data (times/values) comes from here; sampling (linear + slerp) and the
// mixer application run in the Ranger core, writing onto the target entity's TRS.
//
// A static mesh is added first so the animated mesh is NOT handle 1 — the bridge
// must resolve the mixer's target by its __uid (host handle 2), proving real
// target binding, not "first mesh".
//
// seek(t) sets absolute mixer time; the test seeks to each golden time, reconciles,
// and reads the animated entity's position / quaternion / scale back.
// ============================================================================

import * as THREE from 'three';

let scene, camera, renderer, mixer;

export function init() {
  camera = new THREE.PerspectiveCamera(50, 1.5, 0.1, 100);
  scene = new THREE.Scene();

  // handle 1 — a static bystander (so the animated target isn't the first entity)
  const staticMesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  staticMesh.position.set(100, 0, 0);
  scene.add(staticMesh);

  // handle 2 — the animated mesh
  const animMesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  scene.add(animMesh);

  // quaternion keyframes: identity, 90° about Y, 180° about Y (as raw x,y,z,w)
  const s = 0.7071067811865476;
  const posTrack = new THREE.VectorKeyframeTrack('.position', [0, 1, 2],
    [0, 0, 0,  10, 20, 30,  -5, 0, 5]);
  const quatTrack = new THREE.QuaternionKeyframeTrack('.quaternion', [0, 1, 2],
    [0, 0, 0, 1,   0, s, 0, s,   0, 1, 0, 0]);
  const scaleTrack = new THREE.VectorKeyframeTrack('.scale', [0, 2],
    [1, 1, 1,  3, 3, 3]);

  const clip = new THREE.AnimationClip('demo', 2, [posTrack, quatTrack, scaleTrack]);

  mixer = new THREE.AnimationMixer(animMesh);
  mixer.clipAction(clip).play();

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(300, 200);
}

// the test drives time: absolute seek, then read the animated entity back
export function seek(t) { mixer.setTime(t); }

export function tick() { renderer.render(scene, camera); }
