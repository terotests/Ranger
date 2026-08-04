// ============================================================================
// build-pages.mjs — assemble the v2 interpreter demos + Monaco live editor
// ============================================================================
//
//   node gallery/game_engine/v2/web/build-pages.mjs [--out <dir>]
//
// Builds LIVE-path browser demos (staged v2 ComponentEngine), a Monaco editor
// hub at the out root, and a per-demo editor page for each game. Used by
// deploy-pages.yml → /games/v2/.
// ============================================================================

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const SRC = path.join(HERE, "src");
const ROOT = (() => {
  let d = HERE;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(d, "bin", "output.js"))) return d;
    d = path.dirname(d);
  }
  return path.resolve(HERE, "..", "..", "..", "..");
})();

const argv = process.argv.slice(2);
const outArg = argv.indexOf("--out");
const OUT = path.resolve(outArg >= 0 ? argv[outArg + 1] : path.join(HERE, "dist", "pages"));

const log = (...a) => console.log("[v2-pages]", ...a);
const sh = (cmd, args) => execFileSync(cmd, args, { stdio: "inherit", cwd: ROOT });

const DEMOS = [
  {
    id: "live2d",
    title: "Ylos2 — live ranger:2d",
    blurb: "Real v2 climber game: ComponentEngine → RgRegistryBridge → software 2D present.",
    kind: "live2d",
    bundle: "live2d.bundle.js",
    width: 480,
    height: 270,
    clearRgb: 0x4f96cf,
    editPath: "gallery/game_engine/v2/games/ylos2/index.tsx",
    controls: "Arrow keys / A-D move · Space / W jump",
    build: (outDir) =>
      sh("node", ["gallery/game_engine/v2/web/build-live2d.mjs", "--out", outDir]),
  },
  {
    id: "live3d",
    title: "Cube — live ranger:three",
    blurb: "Canonical cube on the live registry path (no reconciler).",
    kind: "live3d",
    bundle: "live3d.bundle.js",
    width: 480,
    height: 480,
    editPath: "gallery/game_engine/v2/web/guests/three/cube_live.tsx",
    controls: "Auto-spinning cube (edit tick() to change motion)",
    build: (outDir) =>
      sh("node", [
        "gallery/game_engine/v2/web/build-live3d.mjs",
        "--guest",
        "cube_live.tsx",
        "--out",
        outDir,
      ]),
  },
  {
    id: "teapot",
    title: "Teapot — live ranger:three",
    blurb: "Utah teapot guest on the same live 3D host.",
    kind: "live3d",
    bundle: "live3d.bundle.js",
    width: 480,
    height: 480,
    editPath: "gallery/game_engine/v2/web/guests/three/teapot_live.tsx",
    controls: "Edit teapot_live.tsx — reload rebuilds the scene",
    build: (outDir) =>
      sh("node", [
        "gallery/game_engine/v2/web/build-live3d.mjs",
        "--guest",
        "teapot_live.tsx",
        "--out",
        outDir,
      ]),
  },
  {
    id: "courtyard",
    title: "Courtyard — live ranger:three",
    blurb: "Procedural courtyard (planes + boxes) on the live path.",
    kind: "live3d",
    bundle: "live3d.bundle.js",
    width: 480,
    height: 480,
    editPath: "gallery/game_engine/v2/web/guests/three/courtyard_live.tsx",
    controls: "Edit courtyard_live.tsx — reload rebuilds the scene",
    build: (outDir) =>
      sh("node", [
        "gallery/game_engine/v2/web/build-live3d.mjs",
        "--guest",
        "courtyard_live.tsx",
        "--out",
        outDir,
      ]),
  },
  {
    id: "model",
    title: "glTF model — live ranger:three",
    blurb: "Loads diamond.glb through the live GLTFModel path.",
    kind: "live3d",
    bundle: "live3d.bundle.js",
    width: 480,
    height: 480,
    editPath: "gallery/game_engine/v2/web/guests/three/model_live.tsx",
    controls: "Edit model_live.tsx — reload rebuilds the scene",
    build: (outDir) =>
      sh("node", [
        "gallery/game_engine/v2/web/build-live3d.mjs",
        "--guest",
        "model_live.tsx",
        "--asset",
        "games/ylos3d/models/diamond.glb",
        "--out",
        outDir,
      ]),
  },
];

function demoManifest(d) {
  return {
    id: d.id,
    title: d.title,
    blurb: d.blurb,
    kind: d.kind,
    bundle: d.bundle,
    width: d.width,
    height: d.height,
    clearRgb: d.clearRgb || 0,
    editPath: d.editPath,
    controls: d.controls || "",
    href: "./" + d.id + "/",
  };
}

async function buildEditor(outDir) {
  let esbuild;
  try {
    esbuild = await import("esbuild");
  } catch {
    log("esbuild not installed — skipping Monaco (npm ci in gallery/game_engine/v2/web)");
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
  await esbuild.build({
    ...common,
    entryPoints: [path.join(SRC, "editor.entry.mjs")],
    outfile: path.join(outDir, "editor.bundle.js"),
  });
  await esbuild.build({
    ...common,
    entryPoints: { "editor.worker": editorWorker, "ts.worker": tsWorker },
    outdir: outDir,
  });
  const kb = (fs.statSync(path.join(outDir, "editor.bundle.js")).size / 1024).toFixed(0);
  log("bundled Monaco editor (" + kb + " KB + workers)");
  return true;
}

function copySharedRuntime(outDir) {
  for (const f of [
    "vfs.js",
    "engine-host.js",
    "live2d-viewer.js",
    "live3d-viewer.js",
    "live-editor.js",
  ]) {
    fs.copyFileSync(path.join(SRC, f), path.join(outDir, f));
  }
}

function cacheBustHtml(htmlPath, names, rootDir) {
  const h = crypto.createHash("sha1");
  for (const n of names) {
    const p = path.join(rootDir, n);
    if (fs.existsSync(p)) h.update(fs.readFileSync(p));
  }
  const ver = h.digest("hex").slice(0, 10);
  let html = fs.readFileSync(htmlPath, "utf8");
  for (const n of names) {
    html = html.replaceAll("./" + n, "./" + n + "?v=" + ver);
    html = html.replaceAll("../" + n, "../" + n + "?v=" + ver);
  }
  fs.writeFileSync(htmlPath, html);
  return ver;
}

function writePerDemoEditor(demoDir, demo, editorOk) {
  // Self-contained demos.json so the locked page (and browser_smoke) work when
  // the static server root is the demo folder itself.
  fs.writeFileSync(
    path.join(demoDir, "demos.json"),
    JSON.stringify([demoManifest(demo)], null, 2)
  );
  // Each game folder gets a Monaco editor locked to that demo; shared Monaco /
  // viewers load from the parent /games/v2/ directory.
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${demo.title} — v2 live editor</title>
    <link
      rel="icon"
      href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><text y='14' font-size='14'>⚡</text></svg>"
    />
    <link rel="stylesheet" href="../editor.bundle.css" />
    <style>
      :root {
        color-scheme: dark;
        --bg: #0c1020; --panel: #151a2e; --ink: #e6e9f3; --muted: #97a0bd;
        --accent: #6ea8ff; --good: #58d38c;
      }
      * { box-sizing: border-box; }
      html, body { height: 100%; }
      body {
        margin: 0;
        font: 14px/1.5 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        background: radial-gradient(1200px 600px at 50% -10%, #1b2140, var(--bg));
        color: var(--ink);
        display: flex; flex-direction: column; min-height: 100vh;
      }
      header { padding: 18px 22px 6px; }
      h1 { margin: 0; font-size: 20px; letter-spacing: -0.02em; }
      .sub { color: var(--muted); margin: 2px 0 0; font-size: 13px; }
      .sub code, .sub a { color: var(--accent); }
      .toolbar {
        display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
        padding: 10px 22px;
      }
      select, button {
        font: inherit; color: var(--ink); background: #1e2540;
        border: 1px solid #313a5c; border-radius: 8px; padding: 7px 11px; cursor: pointer;
      }
      button:hover, select:hover { border-color: var(--accent); }
      label.chk { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); cursor: pointer; }
      .status { margin-left: auto; color: var(--muted); font-size: 13px; min-width: 0; }
      .status .ok { color: var(--good); }
      main {
        --editor-pct: 55%;
        flex: 1; display: flex; gap: 0; padding: 4px 22px 22px;
        align-items: stretch; min-height: 0;
      }
      .card {
        background: var(--panel); border: 1px solid #262d47; border-radius: 12px;
        overflow: hidden; box-shadow: 0 20px 60px -30px #000a;
        display: flex; flex-direction: column; min-height: 0;
      }
      .card .cap {
        padding: 8px 12px; color: var(--muted); font-size: 12px;
        border-bottom: 1px solid #262d47; flex: 0 0 auto;
      }
      .editor-pane { flex: 0 0 var(--editor-pct); min-width: 240px; max-width: calc(100% - 210px); }
      .view-pane { flex: 1 1 auto; min-width: 200px; }
      .splitter {
        flex: 0 0 10px; margin: 0 2px; cursor: col-resize; touch-action: none;
        position: relative; align-self: stretch; border-radius: 6px;
      }
      .splitter::before {
        content: ""; position: absolute; top: 12px; bottom: 12px; left: 3px; right: 3px;
        border-radius: 3px; background: #262d47;
      }
      .splitter:hover::before, body.splitting .splitter::before { background: var(--accent); }
      body.splitting { cursor: col-resize; user-select: none; }
      #editor { flex: 1; min-height: 280px; width: 100%; height: 100%; }
      .stage { padding: 14px; flex: 1; min-width: 0; }
      canvas {
        display: block; image-rendering: pixelated;
        width: 100%; max-width: 100%; height: auto; aspect-ratio: 16 / 9;
        border-radius: 8px; background: #0a0e1a;
      }
      canvas.square { aspect-ratio: 1 / 1; image-rendering: auto; }
      .controls { color: var(--muted); font-size: 12.5px; margin-top: 10px; }
      .hint { color: var(--muted); font-size: 12px; padding: 0 22px 18px; }
      .hint a, .hint code { color: var(--accent); }
      main.no-editor .editor-pane, main.no-editor .splitter { display: none; }
      main.no-editor .view-pane { flex: 1 1 auto; max-width: none; }
      @media (max-width: 900px) {
        main { flex-direction: column; gap: 14px; }
        .editor-pane { flex: none; width: 100%; max-width: none; }
        .splitter { display: none; }
        #editor { height: 45vh; flex: none; }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>${demo.title}</h1>
      <p class="sub">
        v2 interpreter live editor —
        <a href="../">all v2 games</a> ·
        <a href="../../">v1 games</a>
      </p>
    </header>
    <div class="toolbar">
      <label>Game <select id="game"></select></label>
      <label class="chk"><input type="checkbox" id="autoreload" checked /> Auto-reload on edit</label>
      <button id="reload">Reload now</button>
      <button id="restart">Restart</button>
      <button id="pause">Pause</button>
      <span class="status" id="status">loading…</span>
    </div>
    <main id="split">
      <section class="card editor-pane">
        <div class="cap" id="filecap">script</div>
        <div id="editor"></div>
      </section>
      <div class="splitter" id="splitter" role="separator" aria-orientation="vertical"
        aria-label="Resize editor and game view" aria-valuemin="20" aria-valuemax="80"
        aria-valuenow="55" tabindex="0"></div>
      <section class="card view-pane">
        <div class="cap">canvas — v2 interpreter</div>
        <div class="stage">
          <canvas id="screen" width="${demo.width}" height="${demo.height}" tabindex="0"></canvas>
          <div class="controls" id="controls"></div>
        </div>
      </section>
    </main>
    <p class="hint">
      Edit the guest <code>.tsx</code>; auto-reload rebuilds a fresh host.
      ${editorOk ? "" : "Monaco bundle missing — rebuild with <code>npm ci</code> in <code>v2/web</code>."}
    </p>
    <script>window.RangerEditorBase = "../";</script>
    <script>window.RANGER_V2_ASSET_BASE = "./";</script>
    <script>window.RANGER_V2_DEMOS_JSON = "./demos.json";</script>
    <script>window.RANGER_V2_LOCKED_DEMO = ${JSON.stringify(demo.id)};</script>
    <script src="../vfs.js"></script>
    <script src="../engine-host.js"></script>
    <script src="../live2d-viewer.js"></script>
    <script src="../live3d-viewer.js"></script>
    <script src="../editor.bundle.js"></script>
    <script src="../live-editor.js"></script>
  </body>
</html>
`;
  fs.writeFileSync(path.join(demoDir, "index.html"), html);
}

// --- main -------------------------------------------------------------------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

for (const demo of DEMOS) {
  log("building", demo.id);
  const demoOut = path.join(OUT, demo.id);
  demo.build(demoOut);
  // Drop the view-only index from build-live*; replace with editor page below.
}

copySharedRuntime(OUT);
const editorOk = await buildEditor(OUT);
fs.copyFileSync(path.join(HERE, "editor.html"), path.join(OUT, "index.html"));

const manifest = DEMOS.map(demoManifest);
fs.writeFileSync(path.join(OUT, "demos.json"), JSON.stringify(manifest, null, 2));

for (const demo of DEMOS) {
  writePerDemoEditor(path.join(OUT, demo.id), demo, editorOk);
  // Keep a view-only fallback next to the editor for smoke tests that only
  // need the canvas (browser_smoke loads #screen without Monaco).
  // The editor index is the default; smoke uses the same page (canvas still present).
}

const sharedNames = [
  "vfs.js",
  "engine-host.js",
  "live2d-viewer.js",
  "live3d-viewer.js",
  "live-editor.js",
  "editor.bundle.js",
  "editor.bundle.css",
  "demos.json",
];
const ver = cacheBustHtml(path.join(OUT, "index.html"), sharedNames, OUT);
for (const demo of DEMOS) {
  cacheBustHtml(path.join(OUT, demo.id, "index.html"), sharedNames, OUT);
}
fs.writeFileSync(
  path.join(OUT, "build-info.json"),
  JSON.stringify({ editor: editorOk, demos: manifest.map((d) => d.id), version: ver }, null, 2)
);

log("wrote hub + per-demo editors →", OUT);
log("demos:", DEMOS.map((d) => d.id).join(", "), editorOk ? "(with Monaco)" : "(no Monaco)");
