// ============================================================================
// build-live3d.mjs — assemble the browser "LIVE ranger:three cube" demo.
// ============================================================================
//
//   node gallery/game_engine/v2/web/build-live3d.mjs [--out <dir>]
//
// Compiles web_live3d_host.rgr (ComponentEngine + the LIVE RgRegistryBridge +
// RgRangerThree + ThreeSceneHost) to a JS factory bundle, packages the
// ranger:three façade and the cube_live guest at their repo-relative VFS paths
// (so `import * as THREE from "ranger:three"` resolves to the registered façade
// source), and copies the runtime (vfs / engine-host) + the live viewer + page.
// The result runs a cube built by DIRECT façade method-calls — no reconciler —
// and software-renders it to a 2D canvas. Mirrors build-tsx3d.mjs.
// ============================================================================

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
// Repo root — walk up until bin/output.js is found (robust to the web/ dir depth).
function findRoot(start) {
  let d = start;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(d, "bin", "output.js"))) return d;
    d = path.dirname(d);
  }
  return path.resolve(start, "..", "..", "..", "..");
}
const ROOT = findRoot(HERE);
const SRC = path.join(HERE, "src");
const argv = process.argv.slice(2);
const outArg = argv.indexOf("--out");
const OUT = path.resolve(outArg >= 0 ? argv[outArg + 1] : path.join(HERE, "dist", "live3d"));

// v2 host + façade + guest, all at their repo-relative paths.
const HOST_RGR = "gallery/game_engine/v2/web/web_live3d_host.rgr";
const FACADE_DIR = "gallery/game_engine/v2/modules/ranger_three";
const FACADE_FILE = "ranger_three.tsx";
const GUEST_DIR = "gallery/game_engine/v2/web/guests/three";
const GUEST_FILE = "cube_live.tsx";

const log = (...a) => console.log("[live3d-build]", ...a);
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
src += "\n;return { WebLive3dHost };\n";
fs.writeFileSync(path.join(OUT, "live3d.bundle.js"), src);
fs.rmSync(rawDir, { recursive: true, force: true });
log("wrote live3d.bundle.js (" + (src.length / 1024).toFixed(0) + " KB)");

// Package the façade + the live guest at their repo-relative VFS paths so the
// host's buffer_read_file(dir,file) and `import "ranger:three"` both resolve.
const entries = [
  { name: FACADE_DIR + "/" + FACADE_FILE, bytes: fs.readFileSync(path.join(ROOT, FACADE_DIR, FACADE_FILE)) },
  { name: GUEST_DIR + "/" + GUEST_FILE, bytes: fs.readFileSync(path.join(ROOT, GUEST_DIR, GUEST_FILE)) },
];
fs.writeFileSync(path.join(OUT, "scene.zip"), makeStoredZip(entries));
fs.writeFileSync(path.join(OUT, "scene.json"), JSON.stringify(
  { facadeDir: FACADE_DIR, facadeFile: FACADE_FILE, guestDir: GUEST_DIR, guestFile: GUEST_FILE, size: 480 }, null, 2));
log("packaged façade + live guest (" + entries.length + " files)");

// Runtime + page.
for (const f of ["vfs.js", "engine-host.js", "live3d-viewer.js"]) {
  fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
}
fs.copyFileSync(path.join(HERE, "live3d.html"), path.join(OUT, "index.html"));
log("done ->", OUT);
