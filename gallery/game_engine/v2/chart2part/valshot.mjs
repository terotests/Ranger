// valshot.mjs — screenshot a built demo at high pixel density for validation.
//   node valshot.mjs <distDir> <out.png> [dpr] [ms]
// Higher DPR ⇒ the small parts cover more pixels ⇒ silhouette IoU is robust to
// sub-pixel anti-aliasing.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire("/opt/node22/lib/node_modules/x");
const { chromium } = require("playwright");
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const DIR = path.resolve(process.argv[2] || "/home/user/Ranger/tmp/pinball3d");
const OUT = process.argv[3] || path.join(DIR, "val.png");
const DPR = parseFloat(process.argv[4] || "2.5");
const MS = parseInt(process.argv[5] || "1000", 10);
const MIME = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".ppm": "application/octet-stream" };
const server = http.createServer((req, res) => {
  const p = path.join(DIR, decodeURIComponent(req.url.split("?")[0]));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); } else { res.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream" }); res.end(b); } });
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const browser = await chromium.launch({ executablePath: CHROME, args: ["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 520, height: 520 }, deviceScaleFactor: DPR });
await page.goto(`http://localhost:${port}/index.html`, { waitUntil: "load" });
await page.waitForTimeout(MS);
const el = await page.$("#screen");
await el.screenshot({ path: OUT });
const box = await el.boundingBox();
console.log("val shot:", OUT, "css", Math.round(box.width) + "x" + Math.round(box.height), "dpr", DPR);
await browser.close();
server.close();
