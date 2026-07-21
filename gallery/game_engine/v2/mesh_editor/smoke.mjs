// ============================================================================
// smoke.mjs — headless tessellate + software-render smoke for the mesh editor.
// ============================================================================
//   node gallery/game_engine/v2/mesh_editor/smoke.mjs
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

const knots = SplineLathe.defaultKnots();
const full = SplineLathe.sampleAndLatheEx(knots, 0, 8, 16, Math.PI * 2, true);
const half = SplineLathe.sampleAndLatheEx(knots, 0, 8, 16, Math.PI, false);
if (full.positions.length < 30 || half.indices.length >= full.indices.length) {
  throw new Error("unexpected tessellation sizes");
}

const host = loadRuntime();
host.init(96, 96);
host.setMesh(full.positions, full.normals, full.uvs, full.indices);
host.setMaterialMode(3);
host.frame(16);
const pix = new Uint8Array(host.framePixels());
let lit = 0;
for (let i = 0; i < pix.length; i += 3) {
  if (pix[i] > 40 || pix[i + 1] > 40 || pix[i + 2] > 45) lit++;
}
if (lit < 50) throw new Error("software preview produced too few lit pixels: " + lit);

console.log("[mesh-editor smoke] OK", {
  fullVerts: (full.positions.length / 3) | 0,
  halfTris: (half.indices.length / 3) | 0,
  litPixels: lit,
});
