// ============================================================================
// build.mjs — assemble the browser "games" site from the Ranger engine.
// ============================================================================
//
//   node gallery/game_engine/web/build.mjs [--out <dir>]
//
// Steps:
//   1. Compile the engine (a GameRunner-bearing runner .rgr) to es6 JS.
//   2. Transform it into engine.bundle.js: strip the shebang + trailing
//      auto-run main, append `return { GameRunner };` so engine-host.js can
//      instantiate it inside a VFS-backed require scope.
//   3. Package each game's scripts/assets as a *stored* zip whose entry names
//      are the repo-relative paths the engine hardcodes.
//   4. Copy the runtime (vfs/engine-host/runner) + index.html into <out>.
//
// The compiler is Node-only; this runs at build time (locally or in CI). The
// emitted site is fully static and self-contained.
// ============================================================================

import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import url from "node:url";
import zlib from "node:zlib";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const SRC = path.join(HERE, "src");

const argv = process.argv.slice(2);
const outArg = argv.indexOf("--out");
const OUT = path.resolve(outArg >= 0 ? argv[outArg + 1] : path.join(HERE, "dist"));

// ---------------------------------------------------------------- game registry
// Each game shares one engine bundle (the GameRunner host). `package` lists the
// repo-relative files mounted into the VFS; `script` is the entry the runner
// loads. Add games here — the car (WASM) and a GPU 3D demo come next.
const GAMES = [
  {
    id: "pong",
    title: "Pong",
    kind: "ranger", // pure-Ranger game logic (no WASM guest)
    width: 480,
    height: 270,
    scriptDir: "gallery/game_engine/scripting",
    script: "pong.game.tsx",
    package: [
      "gallery/game_engine/scripting/pong.game.tsx",
      "gallery/game_engine/scripting/game_helpers.tsx",
    ],
    controls: "W / S or ↑ / ↓ to move the left paddle.",
  },
  {
    id: "ylos3",
    title: "Ylos 3 (Viidakko Pomppija)",
    kind: "ranger",
    width: 480,
    height: 270,
    scriptDir: "gallery/game_engine/games/ylos3",
    script: "index.tsx",
    package: [
      "gallery/game_engine/games/ylos3/index.tsx",
      "gallery/game_engine/games/ylos3/level2.tsx",
      "gallery/game_engine/games/ylos3/level3.tsx",
      "gallery/game_engine/games/ylos3/ylos3_shared.tsx",
      "gallery/game_engine/games/ylos3/levels/forest.tsx",
      "gallery/game_engine/games/ylos3/levels/vines.tsx",
      "gallery/game_engine/games/ylos3/levels/temple.tsx",
      "gallery/game_engine/scripting/game_helpers.tsx",
      "gallery/game_engine/games/ylos3/assets/p1_walk.png",
      "gallery/game_engine/games/ylos3/assets/p2_walk.png",
      "gallery/game_engine/games/ylos3/assets/p1_super.png",
      "gallery/game_engine/games/ylos3/assets/p2_super.png",
      "gallery/game_engine/games/ylos3/assets/enemy_walk.png",
    ],
    controls: "P1: WASD + Space · 3 jungle levels · collect diamonds for super power.",
  },
  {
    id: "ylos2",
    title: "Ylos 2 (Pomppija)",
    kind: "ranger", // pure-Ranger logic; loads PNG sprite sheets via the VFS
    width: 480,
    height: 270,
    scriptDir: "gallery/game_engine/games/ylos2",
    script: "index.tsx",
    package: [
      "gallery/game_engine/games/ylos2/index.tsx",
      "gallery/game_engine/scripting/game_helpers.tsx",
      "gallery/game_engine/games/ylos2/assets/p1_walk.png",
      "gallery/game_engine/games/ylos2/assets/p2_walk.png",
      "gallery/game_engine/games/ylos2/assets/p1_super.png",
      "gallery/game_engine/games/ylos2/assets/p2_super.png",
      "gallery/game_engine/games/ylos2/assets/enemy_walk.png",
    ],
    controls: "P1: WASD + Space · P2: ↑ ↓ ← → · split-screen platformer with PNG sprites.",
  },
  {
    id: "breakout",
    title: "Breakout",
    kind: "ranger",
    width: 480,
    height: 270,
    scriptDir: "gallery/game_engine/games/breakout",
    script: "index.tsx",
    package: [
      "gallery/game_engine/games/breakout/index.tsx",
      "gallery/game_engine/games/breakout/breakout_bricks.tsx",
      "gallery/game_engine/lib/game_helpers.tsx",
    ],
    controls: "← → or A / D to move · Space to launch/restart · sound on brick/wall/win.",
  },
];

// Runner .rgr that defines the WebGameHost class used by every "ranger" game.
// It wires GameRunner + the host bridge (so createStaticBg backgrounds render)
// and exposes a flat two-player frame the JS harness drives.
const RUNNER_RGR = "gallery/game_engine/web/web_game_host.rgr";

// TSX-script-driven 3D scene (kind:"tsx3d"). A short .tsx init() declares the
// scene (addModel / spin) through the interpreter; the host loads the GLB and
// software-renders it (web_tsx3d_host.rgr = ComponentEngine + SoftScene3dBridge
// + SoftRenderer3D, no WASM / no GPU), driven by src/tsx3d-viewer.js. Reuses the
// #333 model3d-web software path; the native SDL2/GL path is desktop-only.
const TSX3D_RGR = "gallery/game_engine/web/web_tsx3d_host.rgr";
const TSX3D_SCENES = [
  {
    id: "tsx3d_box",
    title: "3D Scene (TSX)",
    scriptDir: "gallery/game_engine/games/model_viewer_tsx",
    script: "index.tsx",
    package: [
      "gallery/game_engine/games/model_viewer_tsx/index.tsx",
      "gallery/game_engine/games/model_viewer_tsx/models/BoxTextured.glb",
    ],
    controls: "The .tsx init() declares the scene; the host loads the GLB + software-renders it. Drag to rotate.",
  },
];

// ------------------------------------------------------------------- helpers
function log(...a) {
  console.log("[web-build]", ...a);
}

function sh(cmd, args, opts) {
  return execFileSync(cmd, args, { stdio: "inherit", cwd: ROOT, ...opts });
}

// CRC32 (for zip local headers).
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Build a *stored* (method 0) zip from [{name, bytes}]. Matches vfs.mountZip.
function makeStoredZip(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;
  const enc = new TextEncoder();
  for (const { name, bytes } of entries) {
    const nameBytes = enc.encode(name);
    const crc = crc32(bytes);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // local file header sig
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(0, 8); // method 0 = stored
    local.writeUInt16LE(0, 10); // mod time
    local.writeUInt16LE(0, 12); // mod date
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(bytes.length, 18); // comp size
    local.writeUInt32LE(bytes.length, 22); // uncomp size
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28); // extra len
    chunks.push(local, Buffer.from(nameBytes), Buffer.from(bytes));

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(0, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(bytes.length, 20);
    cd.writeUInt32LE(bytes.length, 24);
    cd.writeUInt16LE(nameBytes.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, Buffer.from(nameBytes));
    offset += local.length + nameBytes.length + bytes.length;
  }
  const cdStart = offset;
  let cdSize = 0;
  for (const c of central) cdSize += c.length;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cdSize, 12);
  end.writeUInt32LE(cdStart, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...chunks, ...central, end]);
}

// ------------------------------------------------------------------- compile
function compileEngineBundle() {
  const rawDir = path.join(OUT, "_raw");
  fs.mkdirSync(rawDir, { recursive: true });
  // The compiler joins -d onto its cwd (ROOT), so pass a ROOT-relative path.
  const rawDirRel = path.relative(ROOT, rawDir);
  log("compiling engine:", RUNNER_RGR);
  sh("node", [
    "bin/output.js",
    "-es6",
    RUNNER_RGR,
    "-d=" + rawDirRel,
    "-o=engine.raw.js",
    "-nodecli",
  ], {
    env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
    stdio: "inherit",
  });

  let src = fs.readFileSync(path.join(rawDir, "engine.raw.js"), "utf8");
  src = src.replace(/^#![^\n]*\n/, ""); // strip shebang
  // Remove the trailing auto-run of main (name varies; match the last call).
  src = src.replace(/\n__js_main\(\);\s*$/, "\n");
  src = src.replace(/\n[A-Za-z_$][\w$]*\(\);\s*$/, "\n"); // fallback
  src += "\n;return { WebGameHost };\n";
  fs.writeFileSync(path.join(OUT, "engine.bundle.js"), src);
  log("wrote engine.bundle.js (" + (src.length / 1024).toFixed(0) + " KB)");
  fs.rmSync(rawDir, { recursive: true, force: true });
}

// Compile web_tsx3d_host.rgr -> tsx3d.bundle.js (exports WebTsx3dHost). Same
// transform as the games engine bundle; loaded only when a tsx3d entry is picked.
function compileTsx3dBundle() {
  const rawDir = path.join(OUT, "_rawtsx3d");
  fs.mkdirSync(rawDir, { recursive: true });
  const rawDirRel = path.relative(ROOT, rawDir);
  log("compiling TSX 3D host:", TSX3D_RGR);
  sh("node", [
    "bin/output.js",
    "-es6",
    TSX3D_RGR,
    "-d=" + rawDirRel,
    "-o=tsx3d.raw.js",
    "-nodecli",
  ], {
    env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
    stdio: "inherit",
  });
  let src = fs.readFileSync(path.join(rawDir, "tsx3d.raw.js"), "utf8");
  src = src.replace(/^#![^\n]*\n/, "");
  src = src.replace(/\n__js_main\(\);\s*$/, "\n");
  src = src.replace(/\n[A-Za-z_$][\w$]*\(\);\s*$/, "\n");
  src += "\n;return { WebTsx3dHost };\n";
  fs.writeFileSync(path.join(OUT, "tsx3d.bundle.js"), src);
  log("wrote tsx3d.bundle.js (" + (src.length / 1024).toFixed(0) + " KB)");
  fs.rmSync(rawDir, { recursive: true, force: true });
}

// ------------------------------------------------------------------- packages
function packageGames() {
  const gamesOut = path.join(OUT, "games");
  fs.mkdirSync(gamesOut, { recursive: true });
  const registry = [];
  for (const g of GAMES) {
    const entries = g.package.map((rel) => ({
      name: rel,
      bytes: fs.readFileSync(path.join(ROOT, rel)),
    }));
    const zip = makeStoredZip(entries);
    fs.writeFileSync(path.join(gamesOut, g.id + ".zip"), zip);
    registry.push({
      id: g.id,
      title: g.title,
      kind: g.kind,
      width: g.width,
      height: g.height,
      scriptDir: g.scriptDir,
      script: g.script,
      pkg: "games/" + g.id + ".zip",
      controls: g.controls || "",
    });
    log("packaged", g.id, "(" + (zip.length / 1024).toFixed(1) + " KB, " + entries.length + " files)");
  }
  // TSX-driven 3D scenes — packaged like a game (script + its GLB), but flagged
  // kind:"tsx3d" so index.html runs them through WebTsx3dHost, not GameRunner.
  for (const s of TSX3D_SCENES) {
    const entries = s.package.map((rel) => ({
      name: rel,
      bytes: fs.readFileSync(path.join(ROOT, rel)),
    }));
    const zip = makeStoredZip(entries);
    fs.writeFileSync(path.join(gamesOut, s.id + ".zip"), zip);
    registry.push({
      id: s.id,
      title: s.title,
      kind: "tsx3d",
      size: 480,
      scriptDir: s.scriptDir,
      script: s.script,
      pkg: "games/" + s.id + ".zip",
      controls: s.controls || "",
    });
    log("packaged tsx3d", s.id, "(" + (zip.length / 1024).toFixed(1) + " KB, " + entries.length + " files)");
  }
  fs.writeFileSync(path.join(OUT, "games.json"), JSON.stringify(registry, null, 2));
}

// ------------------------------------------------------------------- editor
// Bundle Monaco (+ its workers) with esbuild into self-contained files so the
// Pages site needs no CDN. Graceful: if esbuild/monaco aren't installed the
// games site still builds, just without the editor pane.
async function buildEditor() {
  let esbuild;
  try {
    esbuild = await import("esbuild");
  } catch {
    log("esbuild not installed — skipping Monaco editor (run `npm ci` in web/)");
    return false;
  }
  const req = createRequire(import.meta.url);
  let editorWorker, tsWorker;
  try {
    editorWorker = req.resolve("monaco-editor/esm/vs/editor/editor.worker.js");
    tsWorker = req.resolve("monaco-editor/esm/vs/language/typescript/ts.worker.js");
  } catch {
    log("monaco-editor not installed — skipping editor");
    return false;
  }
  const common = {
    bundle: true,
    format: "iife",
    loader: { ".ttf": "dataurl" },
    legalComments: "none",
    logLevel: "silent",
  };
  // Editor entry (exposes window.RangerEditor) + its CSS (emitted as editor.bundle.css).
  await esbuild.build({
    ...common,
    entryPoints: [path.join(SRC, "editor.entry.mjs")],
    outfile: path.join(OUT, "editor.bundle.js"),
  });
  // Language workers, referenced by MonacoEnvironment.getWorker.
  await esbuild.build({
    ...common,
    entryPoints: { "editor.worker": editorWorker, "ts.worker": tsWorker },
    outdir: OUT,
  });
  const kb = (fs.statSync(path.join(OUT, "editor.bundle.js")).size / 1024).toFixed(0);
  log("bundled Monaco editor (" + kb + " KB + workers)");
  return true;
}

// ------------------------------------------------------------------- assets
function copyRuntime() {
  for (const f of ["vfs.js", "engine-host.js", "runner.js", "tsx3d-viewer.js"]) {
    fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
  }
  fs.copyFileSync(path.join(HERE, "index.html"), path.join(OUT, "index.html"));
}

// Cache-bust local asset references in index.html so a redeploy never serves a
// stale runner.js against a newer index.html (which was the "getSource is not a
// function" symptom). The version is a short content hash of the runtime files,
// so it only changes when they actually change.
function cacheBust() {
  const names = [
    "vfs.js", "engine-host.js", "runner.js", "tsx3d-viewer.js",
    "engine.bundle.js", "tsx3d.bundle.js", "games.json",
    "editor.bundle.js", "editor.bundle.css",
  ];
  const h = crypto.createHash("sha1");
  for (const n of names) {
    const p = path.join(OUT, n);
    if (fs.existsSync(p)) h.update(fs.readFileSync(p));
  }
  const ver = h.digest("hex").slice(0, 10);
  const idx = path.join(OUT, "index.html");
  let html = fs.readFileSync(idx, "utf8");
  for (const n of names) {
    // Match ./name in both <script src>/<link href> and fetch("./name") literals.
    html = html.replaceAll("./" + n, "./" + n + "?v=" + ver);
  }
  fs.writeFileSync(idx, html);
  log("cache-bust version", ver);
}

// ------------------------------------------------------------------- main
fs.mkdirSync(OUT, { recursive: true });
compileEngineBundle();
compileTsx3dBundle();
packageGames();
const editorOk = await buildEditor();
copyRuntime();
cacheBust();
// Expose editor availability to the page without probing globals.
fs.writeFileSync(
  path.join(OUT, "build-info.json"),
  JSON.stringify({ editor: editorOk }, null, 2),
);
log("done ->", OUT, editorOk ? "(with editor)" : "(no editor)");
