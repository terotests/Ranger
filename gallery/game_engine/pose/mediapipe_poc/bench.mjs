// bench.mjs — headless driver for the MediaPipe pose PoC.
//
// Serves this directory over localhost with cross-origin-isolation headers
// (COOP/COEP, so the threaded/SAB MediaPipe path is available too), launches the
// pre-installed Chromium via Playwright, runs window.runBench() for each model
// variant, and prints a latency report.
//
// NOTE ON NUMBERS: this measures the x86 container, NOT a Raspberry Pi 5. Treat
// absolute ms as a ceiling-ish baseline and a relative model comparison; the real
// Pi figure comes from running this same page in the Pi's Chromium. What it does
// prove here: the integration works and landmarks map cleanly into RGP1.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MIME = {
  ".html": "text/html", ".mjs": "text/javascript", ".js": "text/javascript",
  ".wasm": "application/wasm", ".task": "application/octet-stream",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".map": "application/json", ".json": "application/json",
};

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    const filePath = path.join(ROOT, urlPath === "/" ? "index.html" : urlPath);
    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404); res.end("not found"); return;
    }
    // cross-origin isolation enables SharedArrayBuffer + wasm threads
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Content-Type", MIME[path.extname(filePath)] || "application/octet-stream");
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

const MODELS = [
  "./assets/models/pose_landmarker_lite.task",
  "./assets/models/pose_landmarker_full.task",
];
const IMAGES = ["./assets/images/pose.jpg", "./assets/images/portrait.jpg"];

function fmt(t) {
  return `min ${t.min}  median ${t.median} (${t.fps_median} fps)  mean ${t.mean}  p95 ${t.p95}  max ${t.max}`;
}

async function main() {
  const server = await startServer();
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  console.log(`[bench] serving ${ROOT} at ${base}`);

  const browser = await chromium.launch({
    executablePath: process.env.POC_CHROME || undefined,
    args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    const t = m.text();
    if (/error|fail|exception/i.test(t)) console.log("  [page]", t);
  });

  await page.goto(`${base}/index.html`, { waitUntil: "load" });
  await page.waitForFunction("window.__pocReady === true", { timeout: 30000 });

  const delegate = process.env.POC_DELEGATE || "CPU";
  console.log(`[bench] delegate=${delegate}  iters=20  warmup=3\n`);

  const report = [];
  for (const model of MODELS) {
    let res;
    try {
      res = await page.evaluate(
        (cfg) => window.runBench(cfg),
        { model, images: IMAGES, delegate, warmup: 3, iters: 20 }
      );
    } catch (e) {
      console.log(`[bench] ${model} FAILED: ${e}`);
      continue;
    }
    report.push(res);
    console.log(`=== ${res.model}  (delegate ${res.delegate}, init ${res.initMs} ms) ===`);
    for (const im of res.perImage) {
      console.log(`  ${im.image}  ${im.w}x${im.h}  poses=${im.detected}`);
      console.log(`    detect: ${fmt(im.timing)}`);
      console.log(`    RGP1  : present=${im.rgp1.present} gesture=${im.rgp1.gesture} ` +
        `count=${im.rgp1.count} nose=(${im.rgp1.noseX},${im.rgp1.noseY}) ` +
        `[fp ${im.rgp1.noseXfp},${im.rgp1.noseYfp}]`);
    }
    console.log("");
  }

  if (errors.length) {
    console.log("[bench] page errors:");
    for (const e of errors.slice(0, 5)) console.log("  ", e);
  }

  await browser.close();
  server.close();

  // machine-readable summary for the record
  fs.writeFileSync(path.join(ROOT, "last_bench.json"), JSON.stringify(report, null, 2));
  console.log("[bench] wrote last_bench.json");
}

main().catch((e) => { console.error(e); process.exit(1); });
