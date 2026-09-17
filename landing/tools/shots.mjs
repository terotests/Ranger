/**
 * shots.mjs — build landing/assets/shots/*.jpg from the pictures the demos
 * already produce.
 *
 *   node landing/tools/shots.mjs
 *
 * Every source below is a file this repository builds: an artifact committed
 * beside its gallery project, or a page captured from the demo's own build
 * output (see CAPTURED, which says how each of those was taken). Nothing here
 * is drawn by hand, so a demo that changes and is re-shot changes the front
 * page too.
 *
 * The scaling runs in headless Chromium — it is already installed for the
 * browser smoke tests — so this file adds no dependency. A missing source is
 * an error: a front page with a broken picture on it should not build.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const OUT = path.join(ROOT, "landing/assets/shots");
const STAGE = path.join(ROOT, ".landing_tmp/shots");

/**
 * Pictures a gallery project keeps in the repository. Left as-is apart from
 * the scale-down.
 */
const COMMITTED = [
  { src: "gallery/rangerflow/artifacts/01_schema_editor_webgl.png", out: "rangerflow.jpg", w: 1280 },
  { src: "gallery/evg/inspect/shots/css.png", out: "evg-css.jpg", w: 1280 },
];

/**
 * Pictures taken from a demo's own build output. The command that builds the
 * page is beside each one; `node landing/tools/capture.mjs` runs them.
 */
const CAPTURED = [
  { src: ".landing_tmp/capture/figma.png", out: "figma.jpg", w: 1440,
    how: "npm run figma:web, then the page in headless Chromium" },
  { src: ".landing_tmp/capture/game.png", out: "game.jpg", w: 1280, cropBottom: 0.13,
    how: "node gallery/game_engine/web/build.mjs, then the ylos4 canvas" },
  { src: ".landing_tmp/capture/r5.png", out: "r5.jpg", w: 1440,
    how: "bash gallery/r5/web/build.sh, then the page with the mermaid document open" },
  { src: "gallery/evg/showcase/dist/charts-studio.png", out: "vela.jpg", w: 900,
    how: "npm run showcase — the Vela chart page, studio theme" },
];

const jobs = [...COMMITTED, ...CAPTURED];
const missing = jobs.filter((j) => !fs.existsSync(path.join(ROOT, j.src)));
if (missing.length) {
  console.error("missing sources:");
  for (const m of missing) console.error(`  ${m.src}${m.how ? `   (${m.how})` : ""}`);
  process.exit(1);
}

function playwright() {
  for (const anchor of ["/opt/node22/lib/node_modules/x", path.join(ROOT, "package.json"), import.meta.url]) {
    for (const name of ["playwright", "playwright-core"]) {
      try { return createRequire(anchor)(name); } catch { /* next */ }
    }
  }
  return null;
}

const pw = playwright();
if (!pw) {
  console.error("playwright is not installed — cannot rescale the pictures");
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(STAGE, { recursive: true });

const browser = await pw.chromium.launch();
const page = await browser.newPage();

for (const job of jobs) {
  const abs = path.join(ROOT, job.src);
  const b64 = fs.readFileSync(abs).toString("base64");
  const jpeg = await page.evaluate(async ({ b64, w, cropBottom }) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const srcW = img.naturalWidth;
    const srcH = Math.round(img.naturalHeight * (1 - (cropBottom || 0)));
    const scale = Math.min(1, w / srcW);
    const c = document.createElement("canvas");
    c.width = Math.round(srcW * scale);
    c.height = Math.round(srcH * scale);
    const ctx = c.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, srcW, srcH, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.84).split(",")[1];
  }, { b64, w: job.w, cropBottom: job.cropBottom });
  const dst = path.join(OUT, job.out);
  fs.writeFileSync(dst, Buffer.from(jpeg, "base64"));
  const kb = (fs.statSync(dst).size / 1024).toFixed(0);
  console.log(`  ${job.out.padEnd(18)} ${kb.padStart(5)} KB   <- ${job.src}`);
}

await browser.close();
console.log(`wrote ${jobs.length} pictures to landing/assets/shots`);
