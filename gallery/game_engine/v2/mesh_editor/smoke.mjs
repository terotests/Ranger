// ============================================================================
// smoke.mjs — headless tessellate + software-render smoke for the mesh editor.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { SplineLathe } from "./tessellate/spline_lathe.mjs";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");

function loadRuntime() {
  const root = globalThis;
  eval(fs.readFileSync(path.join(DIST, "vfs.js"), "utf8"));
  eval(fs.readFileSync(path.join(DIST, "engine-host.js"), "utf8"));
  const bundle = fs.readFileSync(path.join(DIST, "mesh_editor.bundle.js"), "utf8");
  const vfs = new root.RangerVFS();
  const engine = root.RangerEngineHost.createEngine(bundle, vfs, {});
  return new engine.WebMeshEditorHost();
}

function gradientBytes() {
  const w = 4;
  const h = 32;
  const out = [];
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1);
    const r = (126 + (255 - 126) * t) | 0;
    const g = (207 + (180 - 207) * t) | 0;
    const b = (106 + (84 - 106) * t) | 0;
    for (let x = 0; x < w; x++) out.push(r, g, b, 255);
  }
  return { bytes: out, w, h };
}

const knots = SplineLathe.defaultKnots();
const full = SplineLathe.sampleAndLatheEx(knots, 0, 8, 16, Math.PI * 2, true);
const half = SplineLathe.sampleAndLatheEx(knots, 0, 8, 16, Math.PI, false);
if (full.positions.length < 30 || half.indices.length >= full.indices.length) {
  throw new Error("unexpected tessellation sizes");
}

const orbitKnots = SplineLathe.defaultOrbitKnots();
const orbit = SplineLathe.sampleClosedOrbit(orbitKnots, 0, 8);
const viaOrbit = SplineLathe.sampleAndLatheOrbit(
  knots,
  0,
  8,
  orbit.orbitX,
  orbit.orbitY,
  0,
  orbit.orbitX.length,
  true,
);
const classicMatch = SplineLathe.sampleAndLatheEx(knots, 0, 8, orbit.orbitX.length, Math.PI * 2, true);
let maxAbs = 0;
for (let i = 0; i < classicMatch.positions.length; i++) {
  maxAbs = Math.max(maxAbs, Math.abs(classicMatch.positions[i] - viaOrbit.positions[i]));
}
if (maxAbs > 0.02) {
  throw new Error("orbit unit-circle lathe diverges from cos/sin: maxAbs=" + maxAbs);
}
if (viaOrbit.orbitX.length !== orbit.orbitX.length) {
  throw new Error("orbit samples not stashed on mesh");
}

const host = loadRuntime();
host.init(96, 96);
host.beginParts();
const grad = gradientBytes();
// two fake parts (same geo) with different colours / map
const mid = SplineLathe.sampleAndLatheEx(
  [knots[0], knots[1]],
  0,
  6,
  12,
  Math.PI * 2,
  true,
);
host.addPart(mid.positions, mid.normals, mid.uvs, mid.indices, 0x7ecf6a, 180, 1, 0, grad.bytes, grad.w, grad.h);
const top = SplineLathe.sampleAndLatheEx(
  [knots[1], knots[2]],
  0,
  6,
  12,
  Math.PI * 2,
  true,
);
host.addPart(top.positions, top.normals, top.uvs, top.indices, 0x6ec8ff, 40, 1, 0.2, [], 0, 0);
host.frame(16);
const pix = new Uint8Array(host.framePixels());
let lit = 0;
for (let i = 0; i < pix.length; i += 3) {
  if (pix[i] > 40 || pix[i + 1] > 40 || pix[i + 2] > 45) lit++;
}
if (lit < 40) throw new Error("software preview produced too few lit pixels: " + lit);
if (host.partCount() !== 2) throw new Error("expected 2 parts, got " + host.partCount());

// Shared atlas path: upload once, apply to two parts without re-copying bytes.
if (typeof host.setPartMapBuffer !== "function") {
  throw new Error("host missing setPartMapBuffer");
}
const shared = new Uint8Array(8 * 8 * 4);
for (let i = 0; i < shared.length; i += 4) {
  shared[i] = 220;
  shared[i + 1] = 80;
  shared[i + 2] = 40;
  shared[i + 3] = 255;
}
const ab = shared.buffer.slice(shared.byteOffset, shared.byteOffset + shared.byteLength);
ab._view = new DataView(ab);
host.beginParts();
host.setPartMapBuffer(ab, 8, 8);
host.addPart(mid.positions, mid.normals, mid.uvs, mid.indices, 0xffffff, 120, 1, 0, [], 8, 8);
host.addPart(top.positions, top.normals, top.uvs, top.indices, 0xffffff, 120, 1, 0, [], 8, 8);
host.frame(16);
if (host.partCount() !== 2) throw new Error("shared-map expected 2 parts, got " + host.partCount());

// Hot-swap atlas without rebuild
if (typeof host.updatePartMapBuffer !== "function") {
  throw new Error("host missing updatePartMapBuffer");
}
const swapped = new Uint8Array(8 * 8 * 4);
for (let i = 0; i < swapped.length; i += 4) {
  swapped[i] = 40;
  swapped[i + 1] = 180;
  swapped[i + 2] = 220;
  swapped[i + 3] = 255;
}
const ab2 = swapped.buffer.slice(swapped.byteOffset, swapped.byteOffset + swapped.byteLength);
ab2._view = new DataView(ab2);
host.updatePartMapBuffer(ab2, 8, 8);
host.frame(16);
if (host.partCount() !== 2) throw new Error("updatePartMapBuffer must keep parts");

console.log("[mesh-editor smoke] OK", {
  fullVerts: (full.positions.length / 3) | 0,
  orbitVerts: (viaOrbit.positions.length / 3) | 0,
  orbitMaxAbsDiff: maxAbs,
  parts: host.partCount(),
  litPixels: lit,
  sharedMap: true,
  atlasHotSwap: true,
});
