// ============================================================================
// build-pinball3d.mjs — assemble the browser "pinball table on the GPU" demo.
// ============================================================================
//
//   node gallery/game_engine/v2/web/build-pinball3d.mjs [--out <dir>]
//
// Compiles web_tsx3d_gl_host.rgr (ComponentEngine + ThreeTsxBridge +
// ThreeGLBackend) to a JS factory bundle, packages the canonical three.tsx
// façade + the pinball_live.tsx scene at their VFS paths + the playfield texture
// (a raw P6 PPM the harness parses), and copies the runtime + WebGL harness +
// page. The result runs the pinball table 1:1 in the TSX interpreter and renders
// it with REAL WebGL — hardware Phong lighting, a PCF shadow map and ACES tone
// mapping. Mirrors build-tsx3d.mjs (the cube demo); only the guest + texture
// differ.
// ============================================================================

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { computeParts } from "../chart2part/transform.mjs";
import { compileRgr } from "../../build-support/rgr-compile.mjs";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
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
const OUT = path.resolve(outArg >= 0 ? argv[outArg + 1] : path.join(HERE, "dist", "pinball3d"));

const HOST_RGR = "gallery/game_engine/web/web_tsx3d_gl_host.rgr";
// The canonical three.js façade (shared with the cube demo) + the pinball scene.
const FACADE_ABS = path.join(ROOT, "gallery/game_engine/three/tsx/three.tsx");
const SCRIPT_ABS = path.join(HERE, "guests/three/pinball_live.tsx");
const VFS_DIR = "gallery/game_engine/three/tsx"; // where the host reads façade+script
const FACADE = "three.tsx";
const SCRIPT = "pinball_live.tsx";
// Textures — single-sourced from the committed game assets and decoded
// in-browser (createImageBitmap). Keys match the scene's TextureLoader().load(…).
const GAME_DIR = path.join(ROOT, "gallery/game_engine/v2/games/pinball");
const TEXTURES = [
  { path: "playfield.png", file: "playfield.png" },
  { path: "dmd.png", file: "dmd.png" },
];

const log = (...a) => console.log("[pinball3d-build]", ...a);
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
compileRgr({ root: ROOT, src: HOST_RGR, outDir: path.relative(ROOT, rawDir), outName: "host.raw.js", log });
let src = fs.readFileSync(path.join(rawDir, "host.raw.js"), "utf8").replace(/^#![^\n]*\n/, "");
src = src.replace(/\n__js_main\(\);\s*$/, "\n").replace(/\n[A-Za-z_$][\w$]*\(\);\s*$/, "\n");
src += "\n;return { WebTsx3dGlHost };\n";
fs.writeFileSync(path.join(OUT, "tsx3d-gl.bundle.js"), src);
fs.rmSync(rawDir, { recursive: true, force: true });
log("wrote tsx3d-gl.bundle.js (" + (src.length / 1024).toFixed(0) + " KB)");

// Transformer: compute world parts from the chart pixel measurements and inject
// them into the guest, so the scene carries NO hand-typed coordinates — every
// position comes from a chart pixel via chart2part/transform.mjs (see PROCESS.md).
const chart = JSON.parse(fs.readFileSync(path.join(HERE, "../chart2part/playfield_chart.json"), "utf8"));
const derived = computeParts(chart);
const inject = {
  cal: {
    width: derived.calibration.width, length: derived.calibration.length,
    halfW: derived.calibration.halfW, zMin: derived.calibration.zMin, zMax: derived.calibration.zMax,
  },
  parts: derived.parts,
};
const prelude = "const CHART = " + JSON.stringify(inject) + ";\n";
log("injected CHART: table " + inject.cal.width.toFixed(1) + "x" + inject.cal.length.toFixed(1) +
    ", " + Object.keys(inject.parts).length + " measured parts");

// Package the façade + the pinball scene (prelude-injected) at their VFS paths.
const entries = [
  { name: VFS_DIR + "/" + FACADE, bytes: fs.readFileSync(FACADE_ABS) },
  { name: VFS_DIR + "/" + SCRIPT, bytes: Buffer.from(prelude + fs.readFileSync(SCRIPT_ABS, "utf8"), "utf8") },
];
fs.writeFileSync(path.join(OUT, "scene.zip"), makeStoredZip(entries));

// The textures (served alongside the page; the harness decodes them in-browser).
for (const t of TEXTURES) fs.copyFileSync(path.join(GAME_DIR, t.file), path.join(OUT, t.file));
fs.writeFileSync(path.join(OUT, "scene.json"), JSON.stringify(
  { dir: VFS_DIR, facade: FACADE, script: SCRIPT,
    textures: TEXTURES.map((t) => ({ path: t.path, url: t.file })),
    // env skybox off while the scene is in WIRE/blueprint mode (flat background);
    // set back to 64 for the shaded hero render (chrome-ball reflections).
    environment: 0 }, null, 2));
log("packaged façade + pinball scene + " + TEXTURES.length + " textures");

// Runtime + page.
for (const f of ["vfs.js", "engine-host.js", "tsx3d-gl-viewer.js"]) {
  fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
}
fs.copyFileSync(path.join(HERE, "tsx3d.html"), path.join(OUT, "index.html"));
log("done ->", OUT);
