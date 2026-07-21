// ============================================================================
// build-host.mjs — compile WebMeshEditorHost → browser factory bundle.
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
  throw new Error("repo root not found");
}
const ROOT = findRoot(HERE);
const OUT_DIR = path.join(HERE, "dist");
const RAW_DIR = path.join(OUT_DIR, "_raw");
const HOST_RGR = "gallery/game_engine/v2/mesh_editor/host/web_mesh_editor_host.rgr";

fs.mkdirSync(RAW_DIR, { recursive: true });
console.log("[mesh-editor-host] compiling", HOST_RGR);
execFileSync(
  "node",
  [
    "bin/output.js",
    "-es6",
    HOST_RGR,
    "-d=" + path.relative(ROOT, RAW_DIR),
    "-o=host.raw.js",
    "-nodecli",
  ],
  {
    stdio: "inherit",
    cwd: ROOT,
    env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
  },
);

let src = fs.readFileSync(path.join(RAW_DIR, "host.raw.js"), "utf8").replace(/^#![^\n]*\n/, "");
src = src.replace(/\n__js_main\(\);\s*$/, "\n").replace(/\n[A-Za-z_$][\w$]*\(\);\s*$/, "\n");
src += "\n;return { WebMeshEditorHost };\n";
fs.writeFileSync(path.join(OUT_DIR, "mesh_editor.bundle.js"), src);
fs.rmSync(RAW_DIR, { recursive: true, force: true });

// Copy engine-host + vfs runtime next to the bundle for the Vite app public/.
const WEB_SRC = path.join(HERE, "..", "web", "src");
for (const f of ["engine-host.js", "vfs.js"]) {
  fs.copyFileSync(path.join(WEB_SRC, f), path.join(OUT_DIR, f));
}
console.log(
  "[mesh-editor-host] wrote",
  path.relative(ROOT, path.join(OUT_DIR, "mesh_editor.bundle.js")),
  "(" + (src.length / 1024).toFixed(0) + " KB)",
);
