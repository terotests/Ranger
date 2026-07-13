// dump-reference.mjs — write golden MediaPipe landmarks for the sample images,
// as the behavioral reference the native pipeline is validated against
// (NATIVE_EMBED.md milestone 2). Output: reference/landmarks.json.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MIME = { ".html": "text/html", ".mjs": "text/javascript", ".wasm": "application/wasm",
  ".task": "application/octet-stream", ".jpg": "image/jpeg", ".png": "image/png",
  ".map": "application/json", ".json": "application/json" };

const server = await new Promise((res) => {
  const s = http.createServer((req, rq) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rq.writeHead(404); rq.end(); return; }
    rq.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    rq.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    rq.setHeader("Content-Type", MIME[path.extname(p)] || "application/octet-stream");
    fs.createReadStream(p).pipe(rq);
  });
  s.listen(0, "127.0.0.1", () => res(s));
});
const port = server.address().port;

const browser = await chromium.launch({ executablePath: process.env.POC_CHROME || undefined, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "load" });
await page.waitForFunction("window.__pocReady === true", { timeout: 30000 });

const result = await page.evaluate((cfg) => window.dumpReference(cfg), {
  model: "./assets/models/pose_landmarker_lite.task",
  images: ["./assets/images/pose.jpg", "./assets/images/portrait.jpg"],
});
await browser.close();
server.close();

fs.mkdirSync(path.join(ROOT, "reference"), { recursive: true });
const outPath = path.join(ROOT, "reference", "landmarks.json");
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
for (const r of result.reference)
  console.log(`${r.image}: present=${r.present} landmarks=${r.landmarks.length}` +
    (r.landmarks[0] ? `  nose=(${r.landmarks[0].x},${r.landmarks[0].y})` : ""));
console.log(`wrote ${outPath} (model ${result.model})`);
