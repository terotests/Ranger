// ============================================================================
// crossfade_scene.tsx — TWO clips playing at once on one mesh, blended by
// per-action weight (crossfade), driven through the interpreter. clipA drives the
// mesh one way, clipB another; the host mixer blends them (weighted lerp for
// position, incremental slerp for quaternion) exactly like three.js.
//
// setWeights(p) sets the two effective weights (p.a / p.b); the test seeks once and
// reads the blended entity TRS for several weight splits.
// ============================================================================

import * as THREE from 'three';

let scene, camera, renderer, mixer, actionA, actionB;

export function init() {
  camera = new THREE.PerspectiveCamera(50, 1.5, 0.1, 100);
  scene = new THREE.Scene();

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  scene.add(mesh);   // host handle 1 — the animated target

  const s = 0.7071067811865476;
  // clipA: pos -> (10,0,0), rot identity -> +90° Y
  const clipA = new THREE.AnimationClip('A', 2, [
    new THREE.VectorKeyframeTrack('.position', [0, 1], [0, 0, 0, 10, 0, 0]),
    new THREE.QuaternionKeyframeTrack('.quaternion', [0, 1], [0, 0, 0, 1, 0, s, 0, s]),
  ]);
  // clipB: pos -> (0,10,0), rot identity -> -90° Y
  const clipB = new THREE.AnimationClip('B', 2, [
    new THREE.VectorKeyframeTrack('.position', [0, 1], [0, 0, 0, 0, 10, 0]),
    new THREE.QuaternionKeyframeTrack('.quaternion', [0, 1], [0, 0, 0, 1, 0, -s, 0, s]),
  ]);

  mixer = new THREE.AnimationMixer(mesh);
  actionA = mixer.clipAction(clipA); actionA.play();
  actionB = mixer.clipAction(clipB); actionB.play();
  mixer.setTime(1);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(300, 200);
}

// the test drives the blend weights (crossfade position)
export function setWeights(p) {
  actionA.setEffectiveWeight(p.a);
  actionB.setEffectiveWeight(p.b);
}

export function tick() { renderer.render(scene, camera); }
