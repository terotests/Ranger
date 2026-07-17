// ============================================================================
// build-tsx3d.mjs — assemble the browser "Three.js cube on the GPU" demo.
// ============================================================================
//
//   node gallery/game_engine/web/build-tsx3d.mjs [--out <dir>]
//
// Compiles web_tsx3d_gl_host.rgr (ComponentEngine + ThreeTsxBridge +
// ThreeGLBackend) to a JS factory bundle, packages the thin three.tsx façade and
// the UNMODIFIED Three.js cube.tsx at their repo-relative VFS paths, and copies
// the runtime (vfs / engine-host) + the WebGL harness + page. The result runs the
// canonical Three.js cube 1:1 in the TSX interpreter and renders it with real
// WebGL — no three.js JavaScript, the 3D engine is Ranger.
// ============================================================================

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const SRC = path.join(HERE, "src");
const argv = process.argv.slice(2);
const outArg = argv.indexOf("--out");
const OUT = path.resolve(outArg >= 0 ? argv[outArg + 1] : path.join(HERE, "dist", "tsx3d"));

const HOST_RGR = "gallery/game_engine/web/web_tsx3d_gl_host.rgr";
const TSX_DIR = "gallery/game_engine/three/tsx";
const TSX_FILES = ["three.tsx", "cube.tsx"];
// A real crate texture (the wooden crate from the cube3d_wasm game) stands in
// for the example's `textures/crate.gif`. It ships as a raw PPM (P6) — the
// harness parses it (no image decoder needed) and hands the RGBA pixels to the
// host via setTexture(). TEXTURE_PATH is the key cube.tsx loads it under.
const TEXTURE_ASSET = "gallery/game_engine/games/cube3d_wasm/assets/crate.ppm";
const TEXTURE_PATH = "textures/crate.gif";

const log = (...a) => console.log("[tsx3d-build]", ...a);
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
log("compiling host:", HOST_RGR);
sh("node", ["bin/output.js", "-es6", HOST_RGR, "-d=" + path.relative(ROOT, rawDir), "-o=host.raw.js", "-nodecli"], {
  env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
});
let src = fs.readFileSync(path.join(rawDir, "host.raw.js"), "utf8").replace(/^#![^\n]*\n/, "");
src = src.replace(/\n__js_main\(\);\s*$/, "\n").replace(/\n[A-Za-z_$][\w$]*\(\);\s*$/, "\n");
src += "\n;return { WebTsx3dGlHost };\n";
fs.writeFileSync(path.join(OUT, "tsx3d-gl.bundle.js"), src);
fs.rmSync(rawDir, { recursive: true, force: true });
log("wrote tsx3d-gl.bundle.js (" + (src.length / 1024).toFixed(0) + " KB)");

// Package the façade + the 1:1 cube at their repo-relative VFS paths.
const entries = TSX_FILES.map((f) => ({ name: TSX_DIR + "/" + f, bytes: fs.readFileSync(path.join(ROOT, TSX_DIR, f)) }));
fs.writeFileSync(path.join(OUT, "scene.zip"), makeStoredZip(entries));

// The crate texture (served alongside the page; the harness fetches + parses it).
fs.copyFileSync(path.join(ROOT, TEXTURE_ASSET), path.join(OUT, "crate.ppm"));
fs.writeFileSync(path.join(OUT, "scene.json"), JSON.stringify(
  { dir: TSX_DIR, facade: "three.tsx", script: "cube.tsx", texturePath: TEXTURE_PATH, textureUrl: "crate.ppm" }, null, 2));
log("packaged " + entries.length + " tsx files + crate texture");

// Runtime + page.
for (const f of ["vfs.js", "engine-host.js", "tsx3d-gl-viewer.js"]) {
  fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
}
fs.copyFileSync(path.join(HERE, "tsx3d.html"), path.join(OUT, "index.html"));
log("done ->", OUT);
