/**
 * tracer/smoke.mjs — does the bitmap tracer page run in a browser?
 *
 *   npm run evg:trace:web && npm run evg:trace:web:smoke
 *
 * Checks that the compiled bundle loads, the sample image vectorizes, and the
 * SVG stage ends up with a real <svg>/<path>.
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../../..");
const DIST = path.resolve(process.argv[2] || path.join(HERE, "dist"));

function loadPlaywright() {
  const anchors = [
    "/opt/node22/lib/node_modules/x",
    path.join(ROOT, "package.json"),
    path.join(process.cwd(), "package.json"),
    import.meta.url,
  ];
  for (const anchor of anchors) {
    for (const name of ["playwright", "playwright-core"]) {
      try {
        return createRequire(anchor)(name);
      } catch { /* next */ }
    }
  }
  return null;
}

function findChrome() {
  const fixed = [process.env.CHROME_PATH, "/usr/bin/chromium", "/usr/bin/google-chrome",
                 "/usr/local/bin/google-chrome"].filter(Boolean);
  for (const c of fixed) if (fs.existsSync(c)) return c;
  return null;
}

const pw = loadPlaywright();
if (!pw) {
  console.log("Playwright is not available — tracer page was not checked.");
  process.exit(0);
}
if (!fs.existsSync(path.join(DIST, "index.html")) ||
    !fs.existsSync(path.join(DIST, "evg_bitmap_tracer.js"))) {
  console.error(`no tracer page in ${path.relative(ROOT, DIST)} — run: npm run evg:trace:web`);
  process.exit(1);
}

const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};
const server = http.createServer((req, res) => {
  let file = path.join(DIST, decodeURIComponent(req.url.split("?")[0]));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!file.startsWith(DIST) || !fs.existsSync(file)) {
    res.writeHead(404); res.end("missing"); return;
  }
  const ext = path.extname(file);
  res.writeHead(200, { "Content-Type": TYPES[ext] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const url = `http://127.0.0.1:${port}/`;

const { chromium } = pw;
const browser = await chromium.launch({
  executablePath: findChrome() || undefined,
  headless: true,
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (msg) => {
  if (msg.type() !== "error") return;
  const t = msg.text();
  if (/favicon\.ico|Failed to load resource.*404/i.test(t)) return;
  errors.push(t);
});

await page.goto(url, { waitUntil: "networkidle" });
const ready = await page.evaluate(() =>
  typeof EvgBitmapTracer === "function" && typeof ImageBuffer === "function"
);
if (!ready) {
  console.error("bundle did not publish EvgBitmapTracer / ImageBuffer");
  process.exitCode = 1;
} else {
  await page.click("#sample");
  await page.waitForFunction(() => {
    const st = document.getElementById("status");
    return st && /OK/.test(st.textContent || "");
  }, { timeout: 60000 });
  const info = await page.evaluate(() => {
    const out = document.getElementById("outStage");
    const svg = out && out.querySelector("svg");
    const paths = svg ? svg.querySelectorAll("path").length : 0;
    return {
      status: document.getElementById("status").textContent,
      hasSvg: !!svg,
      paths,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  if (!info.hasSvg || info.paths < 1) {
    console.error("expected an SVG with at least one path");
    process.exitCode = 1;
  }

  // Color mode: the posterize path is the one with the moving parts.
  await page.evaluate(() => {
    document.getElementById("status").textContent = "…";
    const cc = document.getElementById("colorCount");
    cc.value = "8";
    cc.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForFunction(() => {
    const st = document.getElementById("status");
    return st && /OK/.test(st.textContent || "");
  }, { timeout: 60000 });
  const color = await page.evaluate(() => {
    const out = document.getElementById("outStage");
    const svg = out && out.querySelector("svg");
    const fills = svg
      ? Array.from(svg.querySelectorAll("path")).map((p) => p.getAttribute("fill"))
      : [];
    return {
      status: document.getElementById("status").textContent,
      paths: fills.length,
      distinctFills: new Set(fills).size,
      swatches: document.querySelectorAll("#palette .sw").length,
    };
  });
  console.log(JSON.stringify(color, null, 2));
  if (color.paths < 2 || color.distinctFills < 2) {
    console.error("expected several colored paths in posterize mode");
    process.exitCode = 1;
  }
  if (color.swatches !== color.paths) {
    console.error("palette swatches should match the emitted layers");
    process.exitCode = 1;
  }
  if (!process.exitCode) {
    console.log("tracer smoke OK");
  }
}

if (errors.length) {
  console.error("page errors:\n" + errors.join("\n"));
  process.exitCode = 1;
}

await browser.close();
server.close();
process.exit(process.exitCode || 0);
