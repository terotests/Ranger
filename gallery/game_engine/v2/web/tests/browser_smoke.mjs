// ============================================================================
// browser_smoke.mjs — headless-Chromium smoke test for a built web GL demo.
// ============================================================================
//
//   node build-tsx3d.mjs --out dist/tsx3d
//   node tests/browser_smoke.mjs dist/tsx3d [--canvas '#screen'] [--ms 1500] \
//        [--shot out.png] [--min-colors 8]
//
// Serves <dir> statically, loads index.html in the pre-installed Chromium,
// lets the render loop run, screenshots the canvas, and asserts the canvas is
// NOT blank (enough distinct colours + non-background coverage). Exit 0 = the
// demo actually rendered pixels; non-zero = blank / error. This makes the GL
// demos behaviour-verifiable (not just compile-checked).
// ============================================================================

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

function loadPlaywright() {
  const anchors = [
    "/opt/node22/lib/node_modules/x",
    path.join(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../.."),
      "package.json"
    ),
    path.join(process.cwd(), "package.json"),
    import.meta.url,
  ];
  let last;
  for (const anchor of anchors) {
    try {
      return createRequire(anchor)("playwright");
    } catch (e) {
      last = e;
    }
  }
  throw new Error("playwright not resolvable: " + (last && last.message));
}

function findChrome() {
  const env = process.env.CHROME_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  const candidates = [
    env,
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/opt/google/chrome/chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined; // let Playwright pick its bundled Chromium
}

const { chromium } = loadPlaywright();
const CHROME = findChrome();

const argv = process.argv.slice(2);
const DIR = path.resolve(argv[0] || "dist/tsx3d");
const opt = (name, def) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : def; };
const CANVAS = opt("--canvas", "#screen");
const MS = parseInt(opt("--ms", "1800"), 10);
const SHOT = opt("--shot", path.join(DIR, "_smoke.png"));
const MIN_COLORS = parseInt(opt("--min-colors", "8"), 10);

const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".json": "application/json", ".zip": "application/zip", ".ppm": "application/octet-stream",
  ".wasm": "application/wasm", ".png": "image/png", ".glb": "model/gltf-binary" };

function serve(dir) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p === "/") p = "/index.html";
    const fp = path.join(dir, p);
    if (!fp.startsWith(dir) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
      res.writeHead(404); res.end("nf"); return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(fp)] || "application/octet-stream" });
    fs.createReadStream(fp).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

// Analyse a PNG screenshot: count distinct quantised colours + non-uniform pixels.
function analyzePng(buf) {
  // Minimal PNG IHDR read + rely on Chromium's screenshot being RGBA raw via
  // the browser instead — simpler: we re-read pixels in-page. This fn is a
  // fallback; primary check is done in-page (getImageData). Returns null here.
  return null;
}

const consoleErrors = [];
let server;
try {
  server = await serve(DIR);
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/`;

  const launchOpts = {
    args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--no-sandbox"],
  };
  if (CHROME) launchOpts.executablePath = CHROME;
  const browser = await chromium.launch(launchOpts);
  const page = await browser.newPage({ viewport: { width: 640, height: 640 } });
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));

  await page.goto(url, { waitUntil: "load", timeout: 30000 });
  await page.waitForSelector(CANVAS, { timeout: 15000 });
  await page.waitForTimeout(MS); // let the rAF render loop run

  // Read the canvas pixels IN-PAGE (works for a 2D canvas; for WebGL we fall
  // back to an element screenshot below if this yields nothing).
  const stats = await page.evaluate((sel) => {
    const c = document.querySelector(sel);
    if (!c) return { ok: false, reason: "no canvas" };
    const w = c.width, h = c.height;
    let data = null;
    try {
      const g2 = c.getContext("2d");
      if (g2) data = g2.getImageData(0, 0, w, h).data;
    } catch (e) {}
    if (!data) return { ok: true, webgl: true, w, h }; // WebGL: use screenshot path
    const seen = new Set(); let nonZero = 0;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a === 0) continue;
      const r = data[i] >> 5, g = data[i + 1] >> 5, b = data[i + 2] >> 5;
      seen.add((r << 6) | (g << 3) | b);
      if (data[i] + data[i + 1] + data[i + 2] > 24) nonZero++;
    }
    return { ok: true, webgl: false, w, h, colors: seen.size, nonZero, total: (w * h) };
  }, CANVAS);

  const el = await page.$(CANVAS);
  await el.screenshot({ path: SHOT });

  let colors = stats.colors, nonZero = stats.nonZero, total = stats.total;
  if (stats.webgl || colors === undefined) {
    // WebGL canvas: analyse the element screenshot via a fresh in-page image.
    const png = fs.readFileSync(SHOT);
    const b64 = png.toString("base64");
    const s2 = await page.evaluate(async (dataB64) => {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = "data:image/png;base64," + dataB64; });
      const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
      const g = cv.getContext("2d"); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, cv.width, cv.height).data;
      const seen = new Set(); let nz = 0;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i] >> 5, gg = d[i + 1] >> 5, bb = d[i + 2] >> 5;
        seen.add((r << 6) | (gg << 3) | bb);
        if (d[i] + d[i + 1] + d[i + 2] > 24) nz++;
      }
      return { colors: seen.size, nonZero: nz, total: cv.width * cv.height };
    }, b64);
    colors = s2.colors; nonZero = s2.nonZero; total = s2.total;
  }

  await browser.close();
  server.close();

  const coverage = (nonZero / total);
  const rendered = colors >= MIN_COLORS && coverage > 0.02;
  console.log(`[browser-smoke] ${DIR}`);
  console.log(`  canvas ${CANVAS}  distinct-colours=${colors} (need >=${MIN_COLORS})  coverage=${(coverage * 100).toFixed(1)}% (need >2%)`);
  console.log(`  screenshot: ${SHOT}`);
  if (consoleErrors.length) { console.log("  console errors:"); consoleErrors.slice(0, 8).forEach((e) => console.log("    " + e)); }
  if (rendered) { console.log("  RESULT: RENDERED ✓"); process.exit(0); }
  console.log("  RESULT: BLANK / NOT RENDERED ✗");
  process.exit(1);
} catch (e) {
  if (server) try { server.close(); } catch {}
  console.error("[browser-smoke] ERROR:", e.message);
  if (consoleErrors.length) consoleErrors.slice(0, 8).forEach((x) => console.error("    " + x));
  process.exit(2);
}
