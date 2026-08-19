/**
 * canvas-editor adapter — real Chromium via puppeteer-core + system Chrome.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { OPS } from "../corpus.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGE_ROOT = path.resolve(__dirname, "..");

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".map": "application/json",
};

function findChrome() {
  const env =
    process.env.CHROME_PATH ||
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  const candidates = [
    env,
    "/usr/local/bin/google-chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/opt/google/chrome/chrome",
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("No Chrome/Chromium found for puppeteer-core");
}

function serve(root) {
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }
    if (urlPath === "/") urlPath = "/page/index.html";
    const fp = path.normalize(path.join(root, urlPath));
    if (!fp.startsWith(root) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
      res.writeHead(404);
      res.end("not found: " + urlPath);
      return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(fp)] || "application/octet-stream" });
    fs.createReadStream(fp).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

export async function runCanvasEditorBench({ lines }) {
  const server = await serve(PAGE_ROOT);
  const port = server.address().port;
  const chrome = findChrome();
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  const ops = {};
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const t = m.text();
      // favicon / harmless missing static assets
      if (/Failed to load resource/.test(t) && /favicon/i.test(t)) return;
      if (t === "Failed to load resource: the server responded with a status of 404 (Not Found)") {
        return;
      }
      errors.push(t);
    });

    await page.goto(`http://127.0.0.1:${port}/page/index.html`, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });
    await page.waitForFunction(() => window.__bench && window.__bench.ready, {
      timeout: 30000,
    });

    ops.init = await page.evaluate(() => window.__bench.init());
    ops.open_document = await page.evaluate(
      (n) => window.__bench.openDocument(n),
      lines
    );
    ops.first_paint = await page.evaluate(() => window.__bench.firstPaint());
    ops.scroll_1000_lines = await page.evaluate(() => window.__bench.scroll1000());
    ops.insert_char = await page.evaluate(() => window.__bench.insertChar());
    ops.insert_1000_chars = await page.evaluate(() => window.__bench.insert1000());
    ops.backspace = await page.evaluate(() => window.__bench.backspace());
    ops.select_100_lines = await page.evaluate(() => window.__bench.select100());
    ops.replace_selection = await page.evaluate(() =>
      window.__bench.replaceSelection()
    );
    ops.select_all = await page.evaluate(() => window.__bench.selectAll());
    ops.resize_window = await page.evaluate(() => window.__bench.resize(800, 600));
    const jumpTo = lines >= 1000 ? 900 : Math.floor(lines / 2);
    ops.jump_line = await page.evaluate(
      (n) => window.__bench.jumpLine(n),
      Math.min(jumpTo, lines - 1)
    );

    if (errors.length) {
      return {
        engine: "canvas-editor",
        host: "chromium",
        lines,
        ops: Object.fromEntries(OPS.map((k) => [k, ops[k] ?? null])),
        errors: errors.slice(0, 12),
      };
    }

    return {
      engine: "canvas-editor",
      host: "chromium",
      lines,
      ops: Object.fromEntries(OPS.map((k) => [k, ops[k] ?? null])),
    };
  } finally {
    await browser.close().catch(() => {});
    server.close();
  }
}
