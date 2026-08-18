#!/usr/bin/env node
/**
 * Interactive present host for the Ranger EVG text editor.
 *
 * Layer split (matches the SDL / GPU architecture):
 *
 *   INPUT   browser events → POST /input → UIInput → EditorApp (Node)
 *   RENDER  EditorApp.sceneJson() → EVGDisplayList → GET /scene.json
 *           → gallery/evg/gl/evg-webgl.js (WebGL 2 in the browser)
 *
 * SoftCanvas remains available as /frame.bin for CPU/SDL-style present.
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
const evgGlDir = path.resolve(ROOT, "gallery/evg/gl");

const app = new EditorApp();
app.init(fontDir);
app.setDocument(
  [
    "Ranger EVG Text Editor",
    "",
    "Click here and type.",
    "Input: UIInput  ·  Render: EVGDisplayList → WebGL 2",
    "Shift+arrows select · Ctrl+A · Ctrl+Z undo · wheel scrolls",
    "",
  ].join("\n")
);

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
}

function sceneBody() {
  return app.sceneJson();
}

function frameBytes() {
  app.render();
  const raw = app.raw();
  return Buffer.from(raw.byteLength ? raw : raw);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function sendFile(res, fp) {
  if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    res.writeHead(404);
    res.end("not found");
    return;
  }
  res.writeHead(200, {
    "content-type": MIME[path.extname(fp)] || "application/octet-stream",
    "cache-control": "no-store",
  });
  fs.createReadStream(fp).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1");

  if (url.pathname === "/favicon.ico") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === "/scene.json") {
    const body = sceneBody();
    res.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    });
    res.end(body);
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
      applyEvent(JSON.parse(body || "{}"));
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
    res.end(JSON.stringify({ ok: true, w: app.W, h: app.H, render: "webgl-displaylist" }));
    return;
  }

  if (url.pathname === "/state.json") {
    res.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    });
    res.end(
      JSON.stringify({
        caretLine: app.sel.caret.line,
        caretCol: app.sel.caret.col,
        anchorLine: app.sel.anchor.line,
        anchorCol: app.sel.anchor.col,
        focused: app.view.focused,
        lines: app.buf.lineCount(),
        text: app.documentText(),
      })
    );
    return;
  }

  if (url.pathname.startsWith("/evg/gl/")) {
    const rel = url.pathname.slice("/evg/gl/".length);
    const fp = path.normalize(path.join(evgGlDir, rel));
    if (!fp.startsWith(evgGlDir)) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }
    sendFile(res, fp);
    return;
  }

  if (url.pathname.startsWith("/fonts/")) {
    const rel = url.pathname.slice("/fonts/".length);
    const fp = path.normalize(path.join(fontDir, rel));
    if (!fp.startsWith(fontDir)) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }
    sendFile(res, fp);
    return;
  }

  let rel = url.pathname === "/" ? "/index.html" : url.pathname;
  const fp = path.normalize(path.join(__dirname, rel));
  if (!fp.startsWith(__dirname)) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  sendFile(res, fp);
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
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--use-gl=angle",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
    ],
  });
  try {
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.error("[pageerror]", e.message));
    await page.setViewport({ width: 960, height: 700 });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForSelector("#screen");
    await page.waitForFunction(
      () => document.getElementById("status")?.textContent === "live",
      { timeout: 20000 }
    );
    const backend = await page.$eval("#backend", (el) => el.textContent);
    const cmds = await page.$eval("#cmds", (el) => el.textContent);

    // Click into line 2 body text (layout page coords → CSS via canvas box).
    // Line 0 at padY≈6, lineHeight≈20 → line 2 around y≈50; contentX≈56.
    await page.evaluate(() => {
      const c = document.getElementById("screen");
      const r = c.getBoundingClientRect();
      const pageW = 720;
      const pageH = 480;
      const px = 120;
      const py = 55;
      const clientX = r.left + (px / pageW) * r.width;
      const clientY = r.top + (py / pageH) * r.height;
      c.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          clientX,
          clientY,
          pointerId: 1,
          pointerType: "mouse",
          buttons: 1,
        })
      );
      c.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          clientX,
          clientY,
          pointerId: 1,
          pointerType: "mouse",
          buttons: 0,
        })
      );
    });
    await new Promise((r) => setTimeout(r, 150));
    const afterClick = await (await fetch(`http://127.0.0.1:${PORT}/state.json`)).json();
    console.log("[smoke] caret after click=" + afterClick.caretLine + ":" + afterClick.caretCol);
    if (afterClick.caretLine < 1) {
      throw new Error("click did not move caret onto a later line");
    }

    await page.click("#screen");
    await page.keyboard.type("Window smoke OK");
    await new Promise((r) => setTimeout(r, 600));
    const status = await page.$eval("#status", (el) => el.textContent);
    const stats = await page.evaluate(() => window.__evgStats || null);
    const text = app.documentText();
    console.log("[smoke] status=" + status + " backend=" + backend + " cmds=" + cmds);
    console.log("[smoke] evgStats=" + JSON.stringify(stats));
    console.log("[smoke] doc snippet=" + JSON.stringify(text.slice(0, 140)));
    if (backend !== "webgl2") throw new Error("expected webgl2 backend");
    if (!stats || !(stats.drawn > 0)) throw new Error("WebGL drew no quads");
    if (!text.includes("Window smoke OK")) throw new Error("typed text not in document");
    console.log("[smoke] PASS");
  } finally {
    await browser.close();
    server.close();
  }
}

server.listen(PORT, "127.0.0.1", async () => {
  const url = `http://127.0.0.1:${PORT}/`;
  console.log("Ranger EVG text editor — input/UIInput + render/WebGL display list");
  console.log("  " + url);
  console.log("  fonts: " + fontDir);
  console.log("  gl:    " + evgGlDir);

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
      spawn(chrome, ["--new-window", url], { detached: true, stdio: "ignore" }).unref();
      console.log("  opened " + chrome);
    } else {
      console.log("  (no chrome found — open the URL manually)");
    }
  } else {
    console.log("  tip: pass --open to launch Chrome");
  }
});
