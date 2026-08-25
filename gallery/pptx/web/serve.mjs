#!/usr/bin/env node
/**
 * Interactive present host for the Ranger PPTX Lite viewer.
 *
 *   INPUT   browser events → POST /input → UIInput → PptxApp (Node)
 *   RENDER  PptxApp.sceneJson() → EVGDisplayList → WebGL 2
 *
 *   node gallery/pptx/web/serve.mjs [--port 8766] [--open] [--headless-smoke]
 *                                   [--file gallery/pptx/fixtures/01-text.pptx]
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const PPTX = path.resolve(__dirname, "..");
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

const PORT = parseInt(argVal("--port", "8766"), 10);
const DO_OPEN = hasFlag("--open");
const HEADLESS_SMOKE = hasFlag("--headless-smoke");
let FILE = argVal("--file", "gallery/pptx/fixtures/01-text.pptx");

const modPath = path.resolve(__dirname, "../bin/pptx_app_module.cjs");
if (!fs.existsSync(modPath)) {
  console.error("Missing " + modPath);
  console.error("Run: npm run pptx:module");
  process.exit(1);
}

const { PptxApp, UIInput, UIKey } = require(modPath);
const fontDir = path.resolve(ROOT, "gallery/pdf_writer/assets/fonts");
const evgGlDir = path.resolve(ROOT, "gallery/evg/gl");
const fixturesDir = path.join(PPTX, "fixtures");
const manifestPath = path.join(PPTX, "harness/manifest.json");

function loadManifest() {
  if (!fs.existsSync(manifestPath)) return { fixtures: [] };
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function resolveFile(relOrAbs) {
  return path.isAbsolute(relOrAbs) ? relOrAbs : path.resolve(ROOT, relOrAbs);
}

const app = new PptxApp();
app.init(fontDir);
if (!app.load(resolveFile(FILE))) {
  console.error("Failed to open " + FILE);
  process.exit(1);
}
app.render();

const liveInput = new UIInput();
// Every special key the app knows, not the five a viewer needed: this window
// is the editor, and an editor that cannot be typed into is a viewer with
// draggable boxes — which is exactly what it was.
const KEY = {
  left: () => UIKey.left(),
  right: () => UIKey.right(),
  up: () => UIKey.up(),
  down: () => UIKey.down(),
  home: () => UIKey.home(),
  end: () => UIKey.end(),
  escape: () => UIKey.escape(),
  enter: () => UIKey.enter(),
  backspace: () => UIKey.backspace(),
  del: () => UIKey.del(),
  tab: () => UIKey.tab(),
  pageUp: () => UIKey.pageUp(),
  pageDown: () => UIKey.pageDown(),
  f2: () => UIKey.f2(),
  f5: () => UIKey.f5(),
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
  } else if (ev.type === "key") {
    liveInput.setPointerPos(lastX, lastY);
    liveInput.setModifiers(!!ev.shift, !!ev.ctrl);
    const fn = KEY[ev.key];
    if (fn) liveInput.pushKey(fn());
  } else if (ev.type === "text") {
    // What was typed, with the modifiers that were held: a Ctrl chord is a
    // character too, and the app is what decides which ones mean anything.
    liveInput.setPointerPos(lastX, lastY);
    liveInput.setModifiers(!!ev.shift, !!ev.ctrl);
    if (typeof ev.text === "string" && ev.text.length > 0) liveInput.pushText(ev.text);
  } else if (ev.type === "wheel") {
    liveInput.setPointerPos(lastX, lastY);
    liveInput.addScroll(ev.delta | 0);
    // `UIInput` keeps X positive LEFTWARDS where the browser reports it
    // positive rightwards, so the negation belongs here, at the edge.
    liveInput.addScrollX(-(ev.deltaX | 0));
  } else {
    return;
  }
  app.update(liveInput);
}

function send(res, code, type, body) {
  res.writeHead(code, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

function fixtureList() {
  const man = loadManifest();
  return (man.fixtures || []).map((f) => ({
    file: f.file,
    title: f.title || f.file,
    features: f.features || [],
  }));
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url || "/", "http://127.0.0.1");
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }
  if (u.pathname === "/scene.json") {
    send(res, 200, "application/json; charset=utf-8", app.sceneJson());
    return;
  }
  if (u.pathname.startsWith("/part/")) {
    // WebGL loadImages fetches OPC media paths as /part/ppt/media/…
    let part = decodeURIComponent(u.pathname.slice("/part/".length));
    if (part.startsWith("/")) part = part.slice(1);
    if (!/^ppt\/media\/[A-Za-z0-9._-]+$/.test(part)) {
      send(res, 400, "text/plain", "bad part");
      return;
    }
    const bytes = Buffer.from(app.readMediaPart(part));
    if (!bytes.length) {
      send(res, 404, "text/plain", "missing part");
      return;
    }
    const lower = part.toLowerCase();
    let type = "application/octet-stream";
    if (lower.endsWith(".png")) type = "image/png";
    else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) type = "image/jpeg";
    else if (lower.endsWith(".gif")) type = "image/gif";
    else if (lower.endsWith(".webp")) type = "image/webp";
    send(res, 200, type, bytes);
    return;
  }
  if (u.pathname === "/inspect.json") {
    send(res, 200, "application/json; charset=utf-8", app.inspectJson());
    return;
  }
  if (u.pathname === "/frame.bin") {
    const buf = Buffer.from(app.raw());
    send(res, 200, "application/octet-stream", buf);
    return;
  }
  if (u.pathname === "/fixtures.json") {
    send(res, 200, "application/json; charset=utf-8", JSON.stringify({ current: path.basename(FILE), fixtures: fixtureList() }));
    return;
  }
  if (u.pathname === "/meta.json") {
    send(
      res,
      200,
      "application/json; charset=utf-8",
      JSON.stringify({
        width: app.W,
        height: app.H,
        slides: app.slideCount(),
        index: app.index,
        file: FILE,
        basename: path.basename(FILE),
      })
    );
    return;
  }
  if (u.pathname === "/open" && req.method === "POST") {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      try {
        const body = JSON.parse(raw || "{}");
        const name = String(body.file || "");
        if (!/^[A-Za-z0-9._-]+\.pptx$/.test(name)) {
          send(res, 400, "application/json", JSON.stringify({ ok: false, error: "bad file name" }));
          return;
        }
        const full = path.join(fixturesDir, name);
        if (!full.startsWith(fixturesDir) || !fs.existsSync(full)) {
          send(res, 404, "application/json", JSON.stringify({ ok: false, error: "missing fixture" }));
          return;
        }
        if (!app.load(full)) {
          send(res, 500, "application/json", JSON.stringify({ ok: false, error: "load failed" }));
          return;
        }
        FILE = path.relative(ROOT, full).split(path.sep).join("/");
        app.render();
        send(res, 200, "application/json", JSON.stringify({ ok: true, file: FILE, slides: app.slideCount() }));
      } catch (e) {
        send(res, 400, "text/plain", String(e));
      }
    });
    return;
  }
  if (u.pathname === "/input" && req.method === "POST") {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      try {
        applyEvent(JSON.parse(raw || "{}"));
        send(res, 200, "application/json", JSON.stringify({ ok: true, index: app.index }));
      } catch (e) {
        send(res, 400, "text/plain", String(e));
      }
    });
    return;
  }
  if (u.pathname === "/evg-webgl.js") {
    send(res, 200, "text/javascript; charset=utf-8", fs.readFileSync(path.join(evgGlDir, "evg-webgl.js")));
    return;
  }
  if (u.pathname.startsWith("/evg/gl/")) {
    const rel = u.pathname.slice("/evg/gl/".length);
    const file = path.join(evgGlDir, rel);
    if (!file.startsWith(evgGlDir) || !fs.existsSync(file)) {
      send(res, 404, "text/plain", "not found");
      return;
    }
    send(res, 200, "text/javascript; charset=utf-8", fs.readFileSync(file));
    return;
  }
  if (u.pathname === "/" || u.pathname === "/index.html") {
    send(res, 200, "text/html; charset=utf-8", fs.readFileSync(path.join(__dirname, "index.html")));
    return;
  }
  if (u.pathname === "/client.mjs") {
    send(res, 200, "text/javascript; charset=utf-8", fs.readFileSync(path.join(__dirname, "client.mjs")));
    return;
  }
  send(res, 404, "text/plain", "not found");
});

server.listen(PORT, "127.0.0.1", async () => {
  const url = `http://127.0.0.1:${PORT}/`;
  console.log("PPTX viewer at " + url + "  file=" + FILE);
  if (HEADLESS_SMOKE) {
    try {
      const scene = JSON.parse(app.sceneJson());
      const cmds = scene?.list?.cmds || [];
      if (!cmds.length) throw new Error("empty display list");
      const imgs = cmds.filter((c) => c.k === 2 && c.src);
      for (const c of imgs) {
        const bytes = Buffer.from(app.readMediaPart(c.src));
        if (!bytes.length) throw new Error("missing media part " + c.src);
      }
      // The window is the editor, so the smoke has to prove the editor is
      // reachable THROUGH IT and not just that the app can draw. This window
      // once forwarded five keys and nothing else: boxes could be dragged and
      // their words could not be changed, and no test noticed.
      const shapes = app.editor.editableShapes();
      if (!shapes.length) throw new Error("nothing to edit on the first slide");
      const target = shapes[0];
      const scale = app.ptScale();
      const cx = Math.round((target.x + target.width / 2) * scale + app.slideOriginX());
      const cy = Math.round((target.y + target.height / 2) * scale + app.slideOriginY());
      applyEvent({ type: "pointer", x: cx, y: cy, down: true });
      applyEvent({ type: "pointer", x: cx, y: cy, down: false });
      if (app.editor.selectionCount() !== 1) throw new Error("a press did not select a shape");
      const before = target.text.plainText();
      applyEvent({ type: "key", key: "f2" });
      if (!app.editor.isEditingText()) throw new Error("F2 did not put a caret in the shape");
      applyEvent({ type: "text", text: "Z" });
      const after = app.editor.findShape(target.editId);
      if (!after) throw new Error("the shape went away");
      if (after.text.plainText() === before) throw new Error("typing changed nothing");
      applyEvent({ type: "key", key: "escape" });
      applyEvent({ type: "text", text: "z", ctrl: true });
      const undone = app.editor.findShape(target.editId);
      if (undone && undone.text.plainText() !== before) throw new Error("Ctrl+Z did not undo the typing");
      console.log(
        "smoke ok cmds=" +
          cmds.length +
          " images=" +
          imgs.length +
          " slides=" +
          app.slideCount() +
          " editing=reachable"
      );
      server.close();
      process.exit(0);
    } catch (e) {
      console.error("smoke failed", e);
      process.exit(1);
    }
  }
  if (DO_OPEN) {
    const opener =
      process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
    spawn(opener, [url], { stdio: "ignore", detached: true }).unref();
  }
});
