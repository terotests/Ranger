// Capture N frames of a built GL demo at intervals — to eyeball motion/physics.
//   node tests/multishot.mjs <dir> <outPrefix> [ms1 ms2 ...]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire("/opt/node22/lib/node_modules/x");
const { chromium } = require("playwright");
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const DIR = path.resolve(process.argv[2]);
const OUT = process.argv[3] || path.join(DIR, "frame");
const TIMES = process.argv.slice(4).map((s) => parseInt(s, 10));
const MIME = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".ppm": "application/octet-stream" };
const server = http.createServer((req, res) => {
  const p = path.join(DIR, decodeURIComponent(req.url.split("?")[0]));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); } else { res.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream" }); res.end(b); } });
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const browser = await chromium.launch({ executablePath: CHROME, args: ["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 480, height: 480 } });
await page.goto(`http://localhost:${port}/index.html`, { waitUntil: "load" });
let last = 0;
for (let i = 0; i < TIMES.length; i++) {
  await page.waitForTimeout(TIMES[i] - last); last = TIMES[i];
  const el = await page.$("#screen");
  await el.screenshot({ path: `${OUT}_${TIMES[i]}.png` });
  console.log("shot", `${OUT}_${TIMES[i]}.png`);
}
await browser.close();
server.close();
