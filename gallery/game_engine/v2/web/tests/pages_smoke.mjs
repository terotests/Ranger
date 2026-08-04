// ============================================================================
// pages_smoke.mjs — smoke every demo under a build-pages.mjs output dir.
// ============================================================================
//
//   node gallery/game_engine/v2/web/build-pages.mjs --out dist/pages
//   node gallery/game_engine/v2/web/tests/pages_smoke.mjs dist/pages
//
// Serves the hub root (so per-demo pages can load ../editor.bundle.js etc.),
// opens each /<id>/ editor page, and asserts #screen is non-blank.
// ============================================================================

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import url from "node:url";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const DIR = path.resolve(process.argv[2] || path.join(HERE, "..", "dist", "pages"));
const MS = process.argv.includes("--ms")
  ? process.argv[process.argv.indexOf("--ms") + 1]
  : "3500";
const MIN_COLORS = process.argv.includes("--min-colors")
  ? process.argv[process.argv.indexOf("--min-colors") + 1]
  : "6";

if (!fs.existsSync(DIR)) {
  console.error("[pages-smoke] missing dir:", DIR);
  process.exit(2);
}

let demos = [];
const manifest = path.join(DIR, "demos.json");
if (fs.existsSync(manifest)) {
  demos = JSON.parse(fs.readFileSync(manifest, "utf8")).map((d) => d.id);
} else {
  demos = fs
    .readdirSync(DIR)
    .filter((n) => fs.existsSync(path.join(DIR, n, "index.html")));
}

if (demos.length === 0) {
  console.error("[pages-smoke] no demos in", DIR);
  process.exit(2);
}

function loadPlaywright() {
  const anchors = [
    "/opt/node22/lib/node_modules/x",
    path.join(path.resolve(HERE, "../../../../.."), "package.json"),
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
  for (const p of [
    env,
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/opt/google/chrome/chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].filter(Boolean)) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".zip": "application/zip",
  ".ppm": "application/octet-stream",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".glb": "model/gltf-binary",
  ".atlas": "text/plain",
  ".tsx": "text/plain",
  ".info": "text/plain",
};

function serve(dir) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p.endsWith("/")) p += "index.html";
    if (p === "/") p = "/index.html";
    const fp = path.join(dir, p);
    if (!fp.startsWith(dir) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
      res.writeHead(404);
      res.end("nf");
      return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(fp)] || "application/octet-stream" });
    fs.createReadStream(fp).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

const { chromium } = loadPlaywright();
const CHROME = findChrome();
const consoleErrors = [];
let server;
let failed = 0;

try {
  server = await serve(DIR);
  const port = server.address().port;
  const launchOpts = {
    args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--no-sandbox"],
  };
  if (CHROME) launchOpts.executablePath = CHROME;
  const browser = await chromium.launch(launchOpts);

  console.log(`[pages-smoke] ${demos.length} demo(s) under ${DIR}`);

  for (const id of demos) {
    console.log(`\n[pages-smoke] >>> ${id}`);
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    const errs = [];
    page.on("console", (m) => {
      if (m.type() === "error") errs.push(m.text());
    });
    page.on("pageerror", (e) => errs.push("pageerror: " + e.message));

    const pageUrl = `http://127.0.0.1:${port}/${id}/`;
    const shot = path.join(DIR, id, "_smoke.png");
    try {
      await page.goto(pageUrl, { waitUntil: "load", timeout: 45000 });
      await page.waitForSelector("#screen", { timeout: 20000 });
      // Wait until status shows ready / reload text, or timeout.
      await page.waitForFunction(
        () => {
          const s = document.getElementById("status");
          const t = (s && s.textContent) || "";
          return t.includes("edit") || t.includes("reloaded") || t.includes("RENDER") || t.includes("interpreter");
        },
        { timeout: 20000 }
      ).catch(() => {});
      await page.waitForTimeout(parseInt(MS, 10));

      const stats = await page.evaluate(() => {
        const c = document.querySelector("#screen");
        if (!c) return { ok: false };
        const w = c.width, h = c.height;
        let data = null;
        try {
          const g2 = c.getContext("2d");
          if (g2) data = g2.getImageData(0, 0, w, h).data;
        } catch (_) {}
        if (!data) return { ok: true, webgl: true, w, h };
        const seen = new Set();
        let nonZero = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] === 0) continue;
          const r = data[i] >> 5, g = data[i + 1] >> 5, b = data[i + 2] >> 5;
          seen.add((r << 6) | (g << 3) | b);
          if (data[i] + data[i + 1] + data[i + 2] > 24) nonZero++;
        }
        return { ok: true, webgl: false, w, h, colors: seen.size, nonZero, total: w * h };
      });

      const el = await page.$("#screen");
      await el.screenshot({ path: shot });

      let colors = stats.colors, nonZero = stats.nonZero, total = stats.total;
      if (stats.webgl || colors === undefined) {
        const png = fs.readFileSync(shot);
        const b64 = png.toString("base64");
        const s2 = await page.evaluate(async (dataB64) => {
          const img = new Image();
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
            img.src = "data:image/png;base64," + dataB64;
          });
          const cv = document.createElement("canvas");
          cv.width = img.width;
          cv.height = img.height;
          const g = cv.getContext("2d");
          g.drawImage(img, 0, 0);
          const d = g.getImageData(0, 0, cv.width, cv.height).data;
          const seen = new Set();
          let nz = 0;
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i] >> 5, gg = d[i + 1] >> 5, bb = d[i + 2] >> 5;
            seen.add((r << 6) | (gg << 3) | bb);
            if (d[i] + d[i + 1] + d[i + 2] > 24) nz++;
          }
          return { colors: seen.size, nonZero: nz, total: cv.width * cv.height };
        }, b64);
        colors = s2.colors;
        nonZero = s2.nonZero;
        total = s2.total;
      }

      const coverage = nonZero / total;
      const rendered = colors >= parseInt(MIN_COLORS, 10) && coverage > 0.02;
      console.log(
        `  canvas #screen  distinct-colours=${colors} (need >=${MIN_COLORS})  coverage=${(coverage * 100).toFixed(1)}% (need >2%)`
      );
      console.log(`  screenshot: ${shot}`);
      if (errs.length) {
        console.log("  console errors:");
        errs.slice(0, 8).forEach((e) => console.log("    " + e));
      }
      if (rendered) console.log("  RESULT: RENDERED ✓");
      else {
        console.log("  RESULT: BLANK / NOT RENDERED ✗");
        failed += 1;
      }
    } catch (e) {
      console.log("  RESULT: ERROR", e.message);
      if (errs.length) errs.slice(0, 8).forEach((x) => console.log("    " + x));
      failed += 1;
    }
    await page.close();
  }

  // Hub page smoke: Monaco present + first game renders.
  console.log(`\n[pages-smoke] >>> hub`);
  const hub = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  try {
    await hub.goto(`http://127.0.0.1:${port}/`, { waitUntil: "load", timeout: 45000 });
    await hub.waitForSelector("#editor", { timeout: 15000 });
    await hub.waitForSelector("#screen", { timeout: 15000 });
    await hub.waitForTimeout(parseInt(MS, 10));
    const hasMonaco = await hub.evaluate(() => !!(window.RangerEditor && document.querySelector(".monaco-editor")));
    const hubShot = path.join(DIR, "_hub_smoke.png");
    await hub.screenshot({ path: hubShot, fullPage: true });
    console.log(`  monaco=${hasMonaco ? "yes" : "no"}  screenshot: ${hubShot}`);
    if (!hasMonaco) {
      console.log("  RESULT: NO MONACO ✗");
      failed += 1;
    } else {
      console.log("  RESULT: HUB OK ✓");
    }
  } catch (e) {
    console.log("  RESULT: ERROR", e.message);
    failed += 1;
  }
  await hub.close();

  await browser.close();
  server.close();

  if (failed) {
    console.error(`\n[pages-smoke] FAILED ${failed} check(s)`);
    process.exit(1);
  }
  console.log(`\n[pages-smoke] ALL ${demos.length} DEMOS + HUB OK ✓`);
  process.exit(0);
} catch (e) {
  if (server) try { server.close(); } catch {}
  console.error("[pages-smoke] ERROR:", e.message);
  process.exit(2);
}
