// ============================================================================
// gen-crossfade-goldens.mjs — blended (crossfade) animation goldens.
//
//   node gen-crossfade-goldens.mjs > crossfade_goldens.json
//
// Two clips play at once on one object with per-action weights; three.js blends
// them (NormalAnimationBlendMode: weighted lerp for vector, incremental slerp for
// quaternion). Records the resulting TRS for several weight splits at a fixed time
// — the values the Ranger blended mixer must reproduce. No rendering.
// ============================================================================
import * as THREE from './vendor/current/build/three.module.js';

const r5 = (n) => Math.round(n * 1e5) / 1e5;
const qy = (deg) => {
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (deg * Math.PI) / 180);
  return [q.x, q.y, q.z, q.w];
};

// clipA: pos -> (10,0,0), rot identity -> +90° Y ; clipB: pos -> (0,10,0), rot -> -90° Y
const makeClips = () => {
  const clipA = new THREE.AnimationClip('A', 2, [
    new THREE.VectorKeyframeTrack('.position', [0, 1], [0, 0, 0, 10, 0, 0]),
    new THREE.QuaternionKeyframeTrack('.quaternion', [0, 1], [...qy(0), ...qy(90)]),
  ]);
  const clipB = new THREE.AnimationClip('B', 2, [
    new THREE.VectorKeyframeTrack('.position', [0, 1], [0, 0, 0, 0, 10, 0]),
    new THREE.QuaternionKeyframeTrack('.quaternion', [0, 1], [...qy(0), ...qy(-90)]),
  ]);
  return [clipA, clipB];
};

const cases = [
  { wa: 1.0, wb: 0.0 },   // pure A (sanity)
  { wa: 0.5, wb: 0.5 },
  { wa: 0.25, wb: 0.75 },
];

const T = 1;
const results = cases.map(({ wa, wb }) => {
  const [clipA, clipB] = makeClips();
  const obj = new THREE.Object3D();
  const mixer = new THREE.AnimationMixer(obj);
  const aA = mixer.clipAction(clipA); aA.play(); aA.setEffectiveWeight(wa);
  const aB = mixer.clipAction(clipB); aB.play(); aB.setEffectiveWeight(wb);
  mixer.setTime(T);
  return {
    wa, wb,
    pos: [r5(obj.position.x), r5(obj.position.y), r5(obj.position.z)],
    quat: [r5(obj.quaternion.x), r5(obj.quaternion.y), r5(obj.quaternion.z), r5(obj.quaternion.w)],
  };
});

process.stdout.write(JSON.stringify({ time: T, cases: results }, null, 2) + '\n');
