// compare.mjs — diff native_bench landmarks against the browser MediaPipe golden
// reference (NATIVE_EMBED.md milestone 2). Plain node, no browser — runs on the Pi.
//
//   ./pose_bench det.tflite lm.tflite pose.ppm --json | \
//     node compare.mjs ../mediapipe_poc/reference/landmarks.json -
//   node compare.mjs ../mediapipe_poc/reference/landmarks.json native.json
//
// Reports per-landmark error in NORMALIZED image units (0..1). As a rule of thumb
// a good match is mean < ~0.02; large per-landmark errors localize the bug
// (ROI/rotation vs a single joint vs global offset = normalization).
import fs from "node:fs";

const NAMES = ["nose","l.eye.inner","l.eye","l.eye.outer","r.eye.inner","r.eye","r.eye.outer",
  "l.ear","r.ear","mouth.l","mouth.r","l.shoulder","r.shoulder","l.elbow","r.elbow",
  "l.wrist","r.wrist","l.pinky","r.pinky","l.index","r.index","l.thumb","r.thumb",
  "l.hip","r.hip","l.knee","r.knee","l.ankle","r.ankle","l.heel","r.heel","l.foot","r.foot"];

const [, , refPath, natPath] = process.argv;
if (!refPath || !natPath) {
  console.error("usage: node compare.mjs reference/landmarks.json <native.json|->");
  process.exit(1);
}
const ref = JSON.parse(fs.readFileSync(refPath, "utf8"));
const natRaw = natPath === "-" ? fs.readFileSync(0, "utf8") : fs.readFileSync(natPath, "utf8");
const nat = JSON.parse(natRaw);
const natImages = Array.isArray(nat) ? nat : (nat.reference || [nat]);

const stem = (s) => s.replace(/\.[^.]+$/, "");

let worstOverall = 0;
for (const n of natImages) {
  const r = ref.reference.find((x) => stem(x.image) === stem(n.image));
  if (!r) { console.log(`no reference for ${n.image}`); continue; }
  const N = Math.min(r.landmarks.length, n.landmarks.length);
  const errs = [];
  for (let i = 0; i < N; i++) {
    const dx = r.landmarks[i].x - n.landmarks[i].x;
    const dy = r.landmarks[i].y - n.landmarks[i].y;
    errs.push({ i, e: Math.hypot(dx, dy) });
  }
  const es = errs.map((x) => x.e).sort((a, b) => a - b);
  const mean = es.reduce((a, b) => a + b, 0) / es.length;
  const median = es[Math.floor(es.length / 2)];
  const max = es[es.length - 1];
  worstOverall = Math.max(worstOverall, max);
  const verdict = mean < 0.02 ? "OK" : mean < 0.06 ? "CLOSE" : "OFF";
  console.log(`\n${n.image} vs ${r.image}  (${N} landmarks)  [${verdict}]`);
  console.log(`  error (normalized):  mean ${mean.toFixed(4)}  median ${median.toFixed(4)}  max ${max.toFixed(4)}`);
  const worst = [...errs].sort((a, b) => b.e - a.e).slice(0, 5);
  console.log("  worst: " + worst.map((w) => `${NAMES[w.i] || w.i}=${w.e.toFixed(3)}`).join("  "));
  if (n.timingMs) console.log(`  timing(ms): detector ${n.timingMs.detector} landmark ${n.timingMs.landmark} total ${n.timingMs.total}`);
}
process.exit(worstOverall < 0.06 ? 0 : 2);
