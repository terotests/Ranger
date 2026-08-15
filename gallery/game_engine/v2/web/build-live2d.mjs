// ============================================================================
// build-live2d.mjs — assemble the browser "LIVE ylos2 (ranger:2d) game" demo.
// ============================================================================
//
//   node gallery/game_engine/v2/web/build-live2d.mjs [--out <dir>]
//
// The 2D-live cousin of build-live3d.mjs. Compiles web_live2d_host.rgr
// (RgGameHost + Rg2DPresenter, the SAME generic host that boots ylos2 headlessly)
// to a JS factory bundle, packages the real ylos2 game + ALL its assets AND the
// ranger:core / ranger:2d / ranger:three façade sources into a VFS zip at their
// REPO-relative names, so the host's buffer_read_file(dir,file) resolves the
// game, the ranger:* virtual modules, and every pkg:// atlas + PNG sheet exactly
// like the in-engine boot. Then copies the runtime (vfs / engine-host) + the
// live 2D viewer + page. The result runs the real game and software-renders it
// to a 2D canvas. Mirrors build-live3d.mjs.
// ============================================================================

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { compileRgr } from "../../build-support/rgr-compile.mjs";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const V2 = path.dirname(HERE); // gallery/game_engine/v2
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
const arg = (name, def) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : def; };

const OUT = path.resolve(arg("--out", path.join(HERE, "dist", "live2d")));
const WIDTH = parseInt(arg("--width", "480"), 10);
const HEIGHT = parseInt(arg("--height", "270"), 10);

// v2 host .rgr — compiled to a JS factory bundle.
const HOST_RGR = "gallery/game_engine/v2/web/web_live2d_host.rgr";

// The ranger:* façade sources RgGameHost.load reads from modules/ under v2Root
// and registers as virtual modules (guest `import "ranger:core"|"ranger:2d"`
// resolves to these). ranger:three is read too (load registers all three even
// when the guest never imports it), so it must be present in the VFS.
const FACADES = [
  "gallery/game_engine/v2/modules/ranger_core/ranger_core.tsx",
  "gallery/game_engine/v2/modules/ranger_2d/ranger_2d.tsx",
  "gallery/game_engine/v2/modules/ranger_three/ranger_three.tsx",
  // RgGameHost.load registers ranger:cannon alongside the other façades even
  // when the guest never imports it — omit and the browser VFS throws ENOENT.
  "gallery/game_engine/v2/modules/ranger_cannon/ranger_cannon.tsx",
];

// The real ylos2 game: index.tsx + the atlases it loads via pkg:// + the real
// LPC PNG walk sheets each atlas `image` line references (assets/*.png). Every
// path is packaged at its repo-relative name; RgGameHost.load(GAME_DIR, ...)
// sets packageDir = GAME_DIR so pkg://p1.atlas → <GAME_DIR>/p1.atlas and the
// atlas's `image assets/p1_walk.png` → <GAME_DIR>/assets/p1_walk.png resolve.
const GAME_DIR = "gallery/game_engine/v2/games/ylos2";
const GAME_FILE = "index.tsx";
// Package every file under the game dir (atlases + PNG sheets + index.tsx).
// Skipping tests/ keeps the zip small; anything the guest loads via pkg:// must
// be present or the browser VFS throws ENOENT at load time.
function listGameAssets(relDir) {
  const abs = path.join(ROOT, relDir);
  const out = [];
  const walk = (dir, rel) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === "tests" || ent.name === "." || ent.name === "..") continue;
      const absPath = path.join(dir, ent.name);
      const relPath = rel + "/" + ent.name;
      if (ent.isDirectory()) walk(absPath, relPath);
      else out.push(relPath.split(path.sep).join("/"));
    }
  };
  walk(abs, relDir);
  return out.sort();
}
const GAME_ASSETS = listGameAssets(GAME_DIR);

const log = (...a) => console.log("[live2d-build]", ...a);
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
src += "\n;return { WebLive2dHost };\n";
fs.writeFileSync(path.join(OUT, "live2d.bundle.js"), src);
fs.rmSync(rawDir, { recursive: true, force: true });
log("wrote live2d.bundle.js (" + (src.length / 1024).toFixed(0) + " KB)");

// Package façades + game + assets at their repo-relative VFS paths.
const entries = [];
const addRepoFile = (repoName) => {
  const absPath = path.join(ROOT, repoName);
  if (!fs.existsSync(absPath)) throw new Error("missing package file: " + repoName);
  entries.push({ name: repoName, bytes: fs.readFileSync(absPath) });
};
for (const f of FACADES) addRepoFile(f);
for (const f of GAME_ASSETS) addRepoFile(f);

fs.writeFileSync(path.join(OUT, "scene.zip"), makeStoredZip(entries));
// Demo-side clear colour for this title (0x4f96cf). Kept in scene.json — not
// baked into WebLive2dHost — so the engine host stays title-neutral.
fs.writeFileSync(path.join(OUT, "scene.json"), JSON.stringify(
  { gameDir: GAME_DIR, gameFile: GAME_FILE, width: WIDTH, height: HEIGHT, clearRgb: 0x4f96cf }, null, 2));
log("packaged " + FACADES.length + " façade(s) + game + assets (" + entries.length + " files)");
for (const e of entries) log("  packaged:", e.name);

// Runtime + page.
for (const f of ["vfs.js", "engine-host.js", "live2d-viewer.js"]) {
  fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
}
fs.copyFileSync(path.join(HERE, "live2d.html"), path.join(OUT, "index.html"));
log("done ->", OUT);
