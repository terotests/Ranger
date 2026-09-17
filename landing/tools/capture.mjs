/**
 * capture.mjs — take the front-page pictures that are not committed anywhere
 * else: the Fig reader with a real Figma export open, the game engine running
 * in a tab, and the markdown reader with its diagrams drawn.
 *
 *   node landing/tools/capture.mjs          # build the demos, then shoot them
 *   node landing/tools/capture.mjs --no-build
 *
 * The output lands in .landing_tmp/capture and is read by
 * landing/tools/shots.mjs, which scales it into landing/assets/shots.
 * Splitting the two means a re-scale does not need the demos rebuilt.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const OUT = path.join(ROOT, ".landing_tmp/capture");
const build = !process.argv.includes("--no-build");

fs.mkdirSync(OUT, { recursive: true });

const require_ = (() => {
  for (const anchor of ["/opt/node22/lib/node_modules/x", path.join(ROOT, "package.json"), import.meta.url]) {
    try { const r = createRequire(anchor); r.resolve("playwright"); return r; } catch { /* next */ }
  }
  return null;
})();
if (!require_) {
  console.error("playwright is not installed — cannot capture the pages");
  process.exit(1);
}
const { chromium } = require_("playwright");

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".png": "image/png",
  ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".wasm": "application/wasm",
  ".ttf": "font/ttf", ".woff2": "font/woff2", ".ogg": "audio/ogg", ".wav": "audio/wav",
};

/** Serve a built demo directory on a free port, for the length of one shot. */
async function serve(dir) {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p.endsWith("/")) p += "index.html";
    const f = path.join(dir, p);
    if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      res.writeHead(404); res.end("not found"); return;
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => srv.listen(0, r));
  return { port: srv.address().port, close: () => srv.close() };
}

function run(cmd, args) {
  console.log(`  $ ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, { cwd: ROOT, stdio: ["ignore", "ignore", "inherit"] });
}

const browser = await chromium.launch({
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"],
});

// ---- the Fig reader, opened on fixtures/health.fig ------------------------
{
  if (build) run("bash", ["gallery/figma/web/standalone/build.sh"]);
  const dir = path.join(ROOT, "gallery/figma/web/standalone/dist");
  const s = await serve(dir);
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(`http://localhost:${s.port}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(8000);
  await page.screenshot({ path: path.join(OUT, "figma.png") });
  await page.close(); s.close();
  console.log("  figma.png");
}

// ---- the game engine, running ylos4 in a tab ------------------------------
{
  const dir = path.join(ROOT, ".landing_tmp/games");
  if (build) run("node", ["gallery/game_engine/web/build.mjs", "--out", dir]);
  const s = await serve(dir);
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  await page.goto(`http://localhost:${s.port}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  // The catalogue is a <select> of indices into games.json; pick ylos4 by name.
  const picked = await page.evaluate(async () => {
    const games = await (await fetch("games.json")).json();
    const names = (Array.isArray(games) ? games : games.games || []).map((g) => g.id || g.name);
    const i = names.indexOf("ylos4");
    const sel = document.querySelector("#game");
    if (i < 0 || !sel) return false;
    sel.value = String(i);
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  });
  if (!picked) { console.error("  could not select ylos4 in the game catalogue"); process.exit(1); }
  await page.waitForTimeout(16000);   // load the pack, then play far enough in to have a scene
  const box = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return { x: Math.max(0, r.x), y: Math.max(0, r.y), w: r.width, h: r.height };
  });
  if (!box) { console.error("  the game drew no canvas"); process.exit(1); }
  const vp = page.viewportSize();
  await page.screenshot({
    path: path.join(OUT, "game.png"),
    clip: { x: box.x, y: box.y, width: Math.min(box.w, vp.width - box.x), height: Math.min(box.h, vp.height - box.y) },
  });
  await page.close(); s.close();
  console.log("  game.png");
}

// ---- the markdown reader, with the mermaid document open -----------------
{
  const dir = path.join(ROOT, ".landing_tmp/r5");
  if (build) run("bash", ["gallery/r5/web/build.sh", "--out", dir]);
  const s = await serve(dir);
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(`http://localhost:${s.port}/`, { waitUntil: "networkidle" });
  // The document is parsed, laid out and painted in the tab; give the GPU
  // path time to put the diagrams on the page before the shutter.
  await page.waitForTimeout(9000);
  await page.screenshot({ path: path.join(OUT, "r5.png") });
  await page.close(); s.close();
  console.log("  r5.png");
}

await browser.close();
console.log(`captured into ${path.relative(ROOT, OUT)} — now: node landing/tools/shots.mjs`);
