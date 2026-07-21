// ============================================================================
// build.mjs — compile spline_lathe.rgr → ESM module for the Vite editor.
// ============================================================================
//   node gallery/game_engine/v2/mesh_editor/tessellate/build.mjs
// ============================================================================

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
function findRoot(start) {
  let d = start;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(d, "bin", "output.js"))) return d;
    d = path.dirname(d);
  }
  throw new Error("repo root (bin/output.js) not found from " + start);
}
const ROOT = findRoot(HERE);
const RAW_DIR = path.join(HERE, "_raw");
const OUT = path.join(HERE, "spline_lathe.mjs");

fs.mkdirSync(RAW_DIR, { recursive: true });
execFileSync(
  "node",
  [
    "bin/output.js",
    "-es6",
    "gallery/game_engine/v2/mesh_editor/tessellate/spline_lathe.rgr",
    "-d=" + path.relative(ROOT, RAW_DIR),
    "-o=spline_lathe.raw.js",
    "-nodecli",
  ],
  {
    stdio: "inherit",
    cwd: ROOT,
    env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
  },
);

let src = fs.readFileSync(path.join(RAW_DIR, "spline_lathe.raw.js"), "utf8");
src = src.replace(/^#![^\n]*\n/, "");
src = src.replace(/\n__js_main\(\);\s*$/, "\n");
src = src.replace(/\n[A-Za-z_$][\w$]*\(\);\s*$/, "\n");

const esm =
  src +
  `
export { SplineVec2, SplineKnot, SplineMesh, SplineLathe };
export default SplineLathe;
`;

fs.writeFileSync(OUT, esm);
fs.rmSync(RAW_DIR, { recursive: true, force: true });
console.log("[spline-lathe] wrote", path.relative(ROOT, OUT), "(" + (esm.length / 1024).toFixed(1) + " KB)");
