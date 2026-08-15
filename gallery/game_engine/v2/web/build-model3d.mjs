// ============================================================================
// build-model3d.mjs — assemble the browser 3D-model viewer demo.
// ============================================================================
//
//   node gallery/game_engine/web/build-model3d.mjs [--out <dir>]
//
// Compiles web_model_viewer.rgr (ModelLoader + SoftRenderer3D, host-side, no
// WASM / no GPU) to a JS factory bundle, packages a few committed GLB models
// into a stored zip at their repo-relative paths, and copies the runtime + page.
// The result renders real glTF models to a canvas entirely in the browser.
// ============================================================================

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { compileRgr } from "../../build-support/rgr-compile.mjs";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const SRC = path.join(HERE, "src");
const argv = process.argv.slice(2);
const outArg = argv.indexOf("--out");
const OUT = path.resolve(outArg >= 0 ? argv[outArg + 1] : path.join(HERE, "dist", "model3d"));

const VIEWER_RGR = "gallery/game_engine/web/web_model_viewer.rgr";
const MODEL_DIR = "gallery/game_engine/games/model_viewer_wasm/models";

// The picker's models (all already committed in the repo). `size` seeds the
// canvas; the camera auto-frames so any GLB works.
const MODELS = [
  { id: "duck", title: "Duck (Khronos sample)", file: "Duck.glb" },
  { id: "box", title: "Textured Box", file: "BoxTextured.glb" },
  { id: "tree", title: "Tree", file: "tree_1.glb" },
  { id: "pine", title: "Pine", file: "tree_pine_1.glb" },
];

const log = (...a) => console.log("[model3d-build]", ...a);
const sh = (cmd, args, opts) => execFileSync(cmd, args, { stdio: "inherit", cwd: ROOT, ...opts });

// --- stored zip (matches vfs.mountZip) --------------------------------------
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function makeStoredZip(entries) {
  const chunks = [], central = []; let offset = 0; const enc = new TextEncoder();
  for (const { name, bytes } of entries) {
    const nb = enc.encode(name), crc = crc32(bytes);
    const l = Buffer.alloc(30);
    l.writeUInt32LE(0x04034b50, 0); l.writeUInt16LE(20, 4); l.writeUInt16LE(0, 8);
    l.writeUInt32LE(crc, 14); l.writeUInt32LE(bytes.length, 18); l.writeUInt32LE(bytes.length, 22);
    l.writeUInt16LE(nb.length, 26);
    chunks.push(l, Buffer.from(nb), Buffer.from(bytes));
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6);
    cd.writeUInt32LE(crc, 16); cd.writeUInt32LE(bytes.length, 20); cd.writeUInt32LE(bytes.length, 24);
    cd.writeUInt16LE(nb.length, 28); cd.writeUInt32LE(offset, 42);
    central.push(cd, Buffer.from(nb));
    offset += l.length + nb.length + bytes.length;
  }
  const cdStart = offset; let cdSize = 0; for (const c of central) cdSize += c.length;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cdSize, 12); end.writeUInt32LE(cdStart, 16);
  return Buffer.concat([...chunks, ...central, end]);
}

// --- build ------------------------------------------------------------------
fs.mkdirSync(OUT, { recursive: true });

const rawDir = path.join(OUT, "_raw");
fs.mkdirSync(rawDir, { recursive: true });
log("compiling viewer:", VIEWER_RGR);
compileRgr({ root: ROOT, src: VIEWER_RGR, outDir: path.relative(ROOT, rawDir), outName: "viewer.raw.js", log });
let src = fs.readFileSync(path.join(rawDir, "viewer.raw.js"), "utf8").replace(/^#![^\n]*\n/, "");
src = src.replace(/\n__js_main\(\);\s*$/, "\n").replace(/\n[A-Za-z_$][\w$]*\(\);\s*$/, "\n");
src += "\n;return { WebModelViewer };\n";
fs.writeFileSync(path.join(OUT, "viewer.bundle.js"), src);
fs.rmSync(rawDir, { recursive: true, force: true });
log("wrote viewer.bundle.js (" + (src.length / 1024).toFixed(0) + " KB)");

// Package the models at their repo-relative VFS paths.
const entries = MODELS.map((m) => ({ name: MODEL_DIR + "/" + m.file, bytes: fs.readFileSync(path.join(ROOT, MODEL_DIR, m.file)) }));
fs.writeFileSync(path.join(OUT, "models.zip"), makeStoredZip(entries));
fs.writeFileSync(path.join(OUT, "models.json"), JSON.stringify(
  MODELS.map((m) => ({ id: m.id, title: m.title, dir: MODEL_DIR, file: m.file })), null, 2));
log("packaged " + MODELS.length + " models");

// Runtime + page.
for (const f of ["vfs.js", "engine-host.js", "model-viewer.js"]) {
  fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
}
fs.copyFileSync(path.join(HERE, "model3d.html"), path.join(OUT, "index.html"));
log("done ->", OUT);
