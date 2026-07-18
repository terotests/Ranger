// ============================================================================
// gen-animation-goldens.mjs — animation sampling goldens from the real three.js.
//
//   node gen-animation-goldens.mjs > animation_goldens.json
//
// Builds the same clip the Ranger test builds (animation_scene.tsx): a position
// (vector, linear), a quaternion (slerp) and a scale (vector, linear) track on one
// object, played by an AnimationMixer. For each seek time it records the object's
// resulting TRS — the values the Ranger mixer must reproduce. No rendering.
//
// Keep tracks + times + values in lock-step with the .tsx.
// ============================================================================
import * as THREE from './vendor/current/build/three.module.js';

const r5 = (n) => Math.round(n * 1e5) / 1e5;

// quaternion keyframes: identity, 90° about Y, 180° about Y
const qy = (deg) => {
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (deg * Math.PI) / 180);
  return [q.x, q.y, q.z, q.w];
};
const Q0 = qy(0), Q1 = qy(90), Q2 = qy(180);

const posTrack = new THREE.VectorKeyframeTrack('.position', [0, 1, 2], [0, 0, 0, 10, 20, 30, -5, 0, 5]);
const quatTrack = new THREE.QuaternionKeyframeTrack('.quaternion', [0, 1, 2],
  [...Q0, ...Q1, ...Q2]);
const scaleTrack = new THREE.VectorKeyframeTrack('.scale', [0, 2], [1, 1, 1, 3, 3, 3]);

const clip = new THREE.AnimationClip('demo', 2, [posTrack, quatTrack, scaleTrack]);

const obj = new THREE.Object3D();
const mixer = new THREE.AnimationMixer(obj);
mixer.clipAction(clip).play();

const TIMES = [0, 0.5, 1, 1.5, 1.9];
// samples is an ARRAY parallel to TIMES (index-addressed — no float-string keys).
const samples = TIMES.map((t) => {
  mixer.setTime(t);                       // absolute seek from 0
  return {
    t,
    pos: [r5(obj.position.x), r5(obj.position.y), r5(obj.position.z)],
    quat: [r5(obj.quaternion.x), r5(obj.quaternion.y), r5(obj.quaternion.z), r5(obj.quaternion.w)],
    scale: [r5(obj.scale.x), r5(obj.scale.y), r5(obj.scale.z)],
  };
});

process.stdout.write(JSON.stringify({ times: TIMES, samples }, null, 2) + '\n');
