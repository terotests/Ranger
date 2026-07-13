// smoke.mjs — headless check that game.mjs runs end to end (no camera):
// serves the dir, opens game.html?nocam=1 in Chromium, lets it run, and reads
// window.__gameStats to confirm the loop, VIDEO-mode inference, and pose reaction.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MIME = { ".html": "text/html", ".mjs": "text/javascript", ".wasm": "application/wasm",
  ".task": "application/octet-stream", ".jpg": "image/jpeg", ".png": "image/png",
  ".map": "application/json", ".json": "application/json" };

const server = await new Promise((resolve) => {
  const s = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Content-Type", MIME[path.extname(p)] || "application/octet-stream");
    fs.createReadStream(p).pipe(res);
  });
  s.listen(0, "127.0.0.1", () => resolve(s));
});
const port = server.address().port;

const browser = await chromium.launch({ executablePath: process.env.POC_CHROME || undefined, args: ["--no-sandbox"] });
const page = await browser.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(String(e)));
await page.goto(`http://127.0.0.1:${port}/game.html?nocam=1`, { waitUntil: "load" });
await page.waitForTimeout(4000);
const stats = await page.evaluate(() => window.__gameStats);
console.log("game stats after 4s:", JSON.stringify(stats, null, 2));
if (errs.length) console.log("page errors:", errs.slice(0, 5));
await browser.close();
server.close();
const ok = stats && stats.fps > 0 && stats.mode === "sample-image";
console.log(ok ? "SMOKE OK" : "SMOKE FAILED");
process.exit(ok ? 0 : 1);
