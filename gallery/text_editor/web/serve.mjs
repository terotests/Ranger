#!/usr/bin/env node
/**
 * Interactive present host for the Ranger EVG text editor.
 *
 * Runs EditorApp (SoftCanvas) in Node, serves a tiny browser UI that blits
 * raw RGBA frames and posts pointer/keyboard events mapped to UIInput.
 *
 *   node gallery/text_editor/web/serve.mjs [--port 8765] [--open] [--headless-smoke]
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const require = createRequire(import.meta.url);

function argVal(name, def) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf(name);
  if (i >= 0 && argv[i + 1]) return argv[i + 1];
  return def;
}
function hasFlag(name) {
  return process.argv.slice(2).includes(name);
}

const PORT = parseInt(argVal("--port", "8765"), 10);
const DO_OPEN = hasFlag("--open");
const HEADLESS_SMOKE = hasFlag("--headless-smoke");

const modPath = path.resolve(__dirname, "../bin/editor_app_module.cjs");
if (!fs.existsSync(modPath)) {
  console.error("Missing " + modPath);
  console.error("Run: npm run text_editor:module");
  process.exit(1);
}

const { EditorApp, UIInput, UIKey } = require(modPath);
const fontDir = path.resolve(ROOT, "gallery/pdf_writer/assets/fonts");

const app = new EditorApp();
app.init(fontDir);
app.setDocument(
  [
    "Ranger EVG Text Editor",
    "",
    "Click here and type.",
    "Shift+arrows select · Ctrl+A select all · Ctrl+Z undo",
    "Wheel scrolls. Try opening a thought and editing it.",
    "",
  ].join("\n")
);
app.render();

const liveInput = new UIInput();

const KEY = {
  backspace: () => UIKey.backspace(),
  enter: () => UIKey.enter(),
  tab: () => UIKey.tab(),
  escape: () => UIKey.escape(),
  left: () => UIKey.left(),
  right: () => UIKey.right(),
  up: () => UIKey.up(),
  down: () => UIKey.down(),
  del: () => UIKey.del(),
  home: () => UIKey.home(),
  end: () => UIKey.end(),
};

let lastX = 40;
let lastY = 40;
let dirty = true;

function applyEvent(ev) {
  liveInput.newFrame();
  if (ev.type === "pointer") {
    lastX = ev.x | 0;
    lastY = ev.y | 0;
    liveInput.setPointerPos(lastX, lastY);
    liveInput.setPointerDown(!!ev.down);
    liveInput.setModifiers(!!ev.shift, !!ev.ctrl);
  } else if (ev.type === "wheel") {
    liveInput.setPointerPos(lastX, lastY);
    liveInput.addScroll(ev.delta | 0);
  } else if (ev.type === "key") {
    liveInput.setPointerPos(lastX, lastY);
    liveInput.setModifiers(!!ev.shift, !!ev.ctrl);
    const fn = KEY[ev.key];
    if (fn) liveInput.pushKey(fn());
  } else if (ev.type === "text") {
    liveInput.setPointerPos(lastX, lastY);
    liveInput.setModifiers(!!ev.shift, !!ev.ctrl);
    liveInput.pushText(String(ev.text || ""));
  } else {
    return;
  }
  app.update(liveInput);
  dirty = true;
}

function frameBytes() {
  if (dirty) {
    app.render();
    dirty = false;
  }
  const raw = app.raw();
  // Ranger buffers are ArrayBuffer (+ optional ._view). Copy to a Node Buffer.
  return Buffer.from(raw.byteLength ? raw : raw);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1");

  if (url.pathname === "/favicon.ico") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === "/frame.bin") {
    const bytes = frameBytes();
    res.writeHead(200, {
      "content-type": "application/octet-stream",
      "content-length": bytes.length,
      "x-frame-width": String(app.W),
      "x-frame-height": String(app.H),
      "cache-control": "no-store",
    });
    res.end(bytes);
    return;
  }

  if (url.pathname === "/input" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    try {
      const ev = JSON.parse(body || "{}");
      applyEvent(ev);
      res.writeHead(204);
      res.end();
    } catch (e) {
      res.writeHead(400, { "content-type": "text/plain" });
      res.end(String(e && e.message ? e.message : e));
    }
    return;
  }

  if (url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, w: app.W, h: app.H }));
    return;
  }

  let rel = url.pathname === "/" ? "/index.html" : url.pathname;
  const fp = path.normalize(path.join(__dirname, rel));
  if (!fp.startsWith(__dirname) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    res.writeHead(404);
    res.end("not found");
    return;
  }
  res.writeHead(200, { "content-type": MIME[path.extname(fp)] || "application/octet-stream" });
  fs.createReadStream(fp).pipe(res);
});

function findChrome() {
  const env = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  const candidates = [
    env,
    "/usr/local/bin/google-chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function headlessSmoke(url) {
  let puppeteer;
  try {
    puppeteer = require(
      path.resolve(__dirname, "../bench/compare/node_modules/puppeteer-core")
    );
  } catch {
    throw new Error(
      "puppeteer-core missing — run: npm --prefix gallery/text_editor/bench/compare install"
    );
  }
  const chrome = findChrome();
  if (!chrome) throw new Error("no chrome for smoke");
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 960, height: 700 });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForSelector("#screen");
    await page.waitForFunction(
      () => document.getElementById("status")?.textContent === "live",
      { timeout: 15000 }
    );
    await page.click("#screen");
    await page.keyboard.type("Window smoke OK");
    await new Promise((r) => setTimeout(r, 500));
    const status = await page.$eval("#status", (el) => el.textContent);
    const text = app.documentText();
    console.log("[smoke] status=" + status);
    console.log("[smoke] doc snippet=" + JSON.stringify(text.slice(0, 120)));
    if (!text.includes("Window smoke OK")) {
      throw new Error("typed text not in document");
    }
    console.log("[smoke] PASS");
  } finally {
    await browser.close();
    server.close();
  }
}

server.listen(PORT, "127.0.0.1", async () => {
  const url = `http://127.0.0.1:${PORT}/`;
  console.log("Ranger EVG text editor window host");
  console.log("  " + url);
  console.log("  fonts: " + fontDir);

  if (HEADLESS_SMOKE) {
    try {
      await headlessSmoke(url);
      process.exit(0);
    } catch (e) {
      console.error("[smoke] FAIL", e);
      process.exit(1);
    }
    return;
  }

  if (DO_OPEN) {
    const chrome = findChrome();
    if (chrome) {
      spawn(chrome, ["--new-window", url], {
        detached: true,
        stdio: "ignore",
      }).unref();
      console.log("  opened " + chrome);
    } else {
      console.log("  (no chrome found — open the URL manually)");
    }
  } else {
    console.log("  tip: pass --open to launch Chrome");
  }
});
