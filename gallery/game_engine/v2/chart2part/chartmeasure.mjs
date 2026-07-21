// ============================================================================
// chartmeasure.mjs — measurement microscope for a 2D reference chart.
// ============================================================================
// Loads a chart image in headless Chromium (reliable JPEG decode) as a data URI
// (no canvas taint), then renders either a labeled coordinate grid over the whole
// chart or a zoomed crop with a fine grid — so pixel coordinates of solid
// elements can be read off precisely.
//
//   node chartmeasure.mjs <image> grid [gridPx]
//   node chartmeasure.mjs <image> crop <x> <y> <w> <h> <scale> [gridPx] <out.png>
// ============================================================================
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire("/opt/node22/lib/node_modules/x");
const { chromium } = require("playwright");
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const IMG = process.argv[2];
const MODE = process.argv[3];
const b64 = fs.readFileSync(IMG).toString("base64");
const ext = path.extname(IMG).slice(1).toLowerCase();
const dataUri = `data:image/${ext === "jpg" ? "jpeg" : ext};base64,${b64}`;

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();
await page.setContent(`<canvas id="c"></canvas>`);

const nat = await page.evaluate(async (uri) => {
  const img = new Image();
  await new Promise((r, j) => { img.onload = r; img.onerror = j; img.src = uri; });
  window.__img = img;
  return { w: img.naturalWidth, h: img.naturalHeight };
}, dataUri);
console.log("natural size:", nat.w, "x", nat.h);

if (MODE === "grid") {
  const grid = parseInt(process.argv[4] || "50", 10);
  const out = await page.evaluate((g) => {
    const img = window.__img, w = img.naturalWidth, h = img.naturalHeight;
    const c = document.getElementById("c"); c.width = w; c.height = h;
    const x = c.getContext("2d");
    x.drawImage(img, 0, 0);
    x.strokeStyle = "rgba(255,0,0,0.5)"; x.fillStyle = "red"; x.font = "16px monospace"; x.lineWidth = 1;
    for (let px = 0; px <= w; px += g) { x.beginPath(); x.moveTo(px, 0); x.lineTo(px, h); x.stroke(); x.fillText(px, px + 2, 14); }
    for (let py = 0; py <= h; py += g) { x.beginPath(); x.moveTo(0, py); x.lineTo(w, py); x.stroke(); x.fillText(py, 2, py + 14); }
    return c.toDataURL("image/png");
  }, grid);
  fs.writeFileSync("/home/user/Ranger/tmp/measure/grid.png", Buffer.from(out.split(",")[1], "base64"));
  console.log("wrote /home/user/Ranger/tmp/measure/grid.png");
} else if (MODE === "crop") {
  const [cx, cy, cw, ch, scale] = process.argv.slice(4, 9).map(Number);
  const grid = parseInt(process.argv[9] || "10", 10);
  const outPath = process.argv[10] || "/home/user/Ranger/tmp/measure/crop.png";
  const out = await page.evaluate((a) => {
    const img = window.__img;
    const c = document.getElementById("c"); c.width = a.cw * a.scale; c.height = a.ch * a.scale;
    const x = c.getContext("2d"); x.imageSmoothingEnabled = false;
    x.drawImage(img, a.cx, a.cy, a.cw, a.ch, 0, 0, c.width, c.height);
    x.strokeStyle = "rgba(0,120,255,0.6)"; x.fillStyle = "#08f"; x.font = "12px monospace"; x.lineWidth = 1;
    for (let px = 0; px <= a.cw; px += a.grid) { const sx = px * a.scale; x.beginPath(); x.moveTo(sx, 0); x.lineTo(sx, c.height); x.stroke(); x.fillText(a.cx + px, sx + 1, 11); }
    for (let py = 0; py <= a.ch; py += a.grid) { const sy = py * a.scale; x.beginPath(); x.moveTo(0, sy); x.lineTo(c.width, sy); x.stroke(); x.fillText(a.cy + py, 1, sy + 11); }
    return c.toDataURL("image/png");
  }, { cx, cy, cw, ch, scale, grid });
  fs.writeFileSync(outPath, Buffer.from(out.split(",")[1], "base64"));
  console.log("wrote", outPath);
}
await browser.close();
