// ============================================================================
// build-pages.mjs — assemble the v2 interpreter demos for GitHub Pages /games/v2/
// ============================================================================
//
//   node gallery/game_engine/v2/web/build-pages.mjs [--out <dir>]
//
// Builds the LIVE-path browser demos that run the staged v2 ComponentEngine
// (interp/migrate/src) through RgGameHost / RgRegistryBridge, then writes a
// small hub index.html so /games/v2/ is browsable. Used by deploy-pages.yml.
// ============================================================================

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
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
    build: () =>
      sh("node", [
        "gallery/game_engine/v2/web/build-live2d.mjs",
        "--out",
        path.join(OUT, "live2d"),
      ]),
  },
  {
    id: "live3d",
    title: "Cube — live ranger:three",
    blurb: "Canonical cube on the live registry path (no reconciler).",
    build: () =>
      sh("node", [
        "gallery/game_engine/v2/web/build-live3d.mjs",
        "--guest",
        "cube_live.tsx",
        "--out",
        path.join(OUT, "live3d"),
      ]),
  },
  {
    id: "teapot",
    title: "Teapot — live ranger:three",
    blurb: "Utah teapot guest on the same live 3D host.",
    build: () =>
      sh("node", [
        "gallery/game_engine/v2/web/build-live3d.mjs",
        "--guest",
        "teapot_live.tsx",
        "--out",
        path.join(OUT, "teapot"),
      ]),
  },
  {
    id: "courtyard",
    title: "Courtyard — live ranger:three",
    blurb: "Procedural courtyard (planes + boxes) on the live path.",
    build: () =>
      sh("node", [
        "gallery/game_engine/v2/web/build-live3d.mjs",
        "--guest",
        "courtyard_live.tsx",
        "--out",
        path.join(OUT, "courtyard"),
      ]),
  },
  {
    id: "model",
    title: "glTF model — live ranger:three",
    blurb: "Loads diamond.glb through the live GLTFModel path.",
    build: () =>
      sh("node", [
        "gallery/game_engine/v2/web/build-live3d.mjs",
        "--guest",
        "model_live.tsx",
        "--asset",
        "games/ylos3d/models/diamond.glb",
        "--out",
        path.join(OUT, "model"),
      ]),
  },
];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

for (const demo of DEMOS) {
  log("building", demo.id);
  demo.build();
}

const cards = DEMOS.map(
  (d) => `      <a class="card" href="./${d.id}/">
        <h2>${d.title}</h2>
        <p>${d.blurb}</p>
        <span class="go">Open →</span>
      </a>`
).join("\n");

const hub = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ranger v2 interpreter — live demos</title>
    <link
      rel="icon"
      href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><text y='14' font-size='14'>⚡</text></svg>"
    />
    <style>
      :root {
        color-scheme: dark;
        --bg: #0c1020;
        --panel: #151a2e;
        --ink: #e6e9f3;
        --muted: #97a0bd;
        --accent: #6ea8ff;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        color: var(--ink);
        font: 15px/1.5 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        background: radial-gradient(1200px 600px at 50% -10%, #1b2140, var(--bg));
        padding: 36px 20px 64px;
      }
      .wrap { max-width: 920px; margin: 0 auto; }
      h1 { margin: 0 0 6px; font-size: 26px; letter-spacing: -0.02em; }
      .sub { color: var(--muted); margin: 0 0 28px; max-width: 720px; }
      .sub code { color: var(--accent); }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 14px;
      }
      a.card {
        display: block;
        text-decoration: none;
        color: inherit;
        background: var(--panel);
        border: 1px solid #262d47;
        border-radius: 14px;
        padding: 18px 18px 16px;
        box-shadow: 0 20px 60px -30px #000a;
        transition: border-color 0.12s ease, transform 0.12s ease;
      }
      a.card:hover { border-color: var(--accent); transform: translateY(-1px); }
      a.card h2 { margin: 0 0 8px; font-size: 16px; }
      a.card p { margin: 0 0 14px; color: var(--muted); font-size: 13.5px; min-height: 3.2em; }
      a.card .go { color: var(--accent); font-size: 13px; }
      footer { margin-top: 28px; color: var(--muted); font-size: 13px; }
      footer a { color: var(--accent); }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>Ranger v2 interpreter</h1>
      <p class="sub">
        These demos run the staged v2 <code>ComponentEngine</code>
        (<code>gallery/game_engine/v2/interp/migrate/src</code>) in the browser —
        live registry transport, no classic reconciler. The main
        <a href="../">/games/</a> editor still ships the v1 GameRunner path.
      </p>
      <div class="grid">
${cards}
      </div>
      <footer>
        Built from <code>gallery/game_engine/v2/web/build-pages.mjs</code>.
        Back to <a href="../">all games</a> · <a href="../../">playground</a> ·
        <a href="../../docs/">docs</a>.
      </footer>
    </div>
  </body>
</html>
`;

fs.writeFileSync(path.join(OUT, "index.html"), hub);
fs.writeFileSync(
  path.join(OUT, "demos.json"),
  JSON.stringify(
    DEMOS.map((d) => ({ id: d.id, title: d.title, blurb: d.blurb, href: `./${d.id}/` })),
    null,
    2
  )
);
log("wrote hub →", OUT);
log("demos:", DEMOS.map((d) => d.id).join(", "));
