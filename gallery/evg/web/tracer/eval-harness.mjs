/**
 * tracer/eval-harness.mjs — serve the built page and open it in Chromium.
 * Shared by eval.mjs; the smoke test carries its own copy of this because it
 * also checks the page's own console for errors.
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");
const TYPES = { ".html": "text/html", ".js": "text/javascript",
                ".png": "image/png", ".svg": "image/svg+xml" };

function loadPlaywright() {
  for (const anchor of ["/opt/node22/lib/node_modules/x", import.meta.url]) {
    for (const name of ["playwright", "playwright-core"]) {
      try { return createRequire(anchor)(name); } catch { /* next */ }
    }
  }
  return null;
}

export async function openPage() {
  const pw = loadPlaywright();
  if (!pw) throw new Error("Playwright is not available");
  const server = http.createServer((req, res) => {
    let file = path.join(DIST, decodeURIComponent(req.url.split("?")[0]));
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!file.startsWith(DIST) || !fs.existsSync(file)) { res.writeHead(404); res.end("missing"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address();
  const browser = await pw.chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  return { page, errors, close: async () => { await browser.close(); server.close(); } };
}

export async function waitOk(page, timeout = 120000) {
  await page.waitForFunction(() => {
    const st = document.getElementById("status");
    return st && /OK|virhe|Virhe/.test(st.textContent || "");
  }, { timeout });
}
