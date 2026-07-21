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

console.log("[mesh-editor smoke] OK", {
  fullVerts: (full.positions.length / 3) | 0,
  parts: host.partCount(),
  litPixels: lit,
});
