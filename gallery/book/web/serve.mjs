#!/usr/bin/env node
/**
 * Interactive host for the Ranger book editor.
 *
 *   INPUT   browser events → POST /input → UIInput → BookApp (Node)
 *   RENDER  BookApp.sceneJson() → EVGDisplayList → WebGL 2
 *
 *   node gallery/book/web/serve.mjs [--port 8767] [--open] [--headless-smoke]
 *
 * The editor itself is Ranger. This file is a pipe: it turns a click into a
 * UIInput frame, hands it to the app, and serves whatever display list comes
 * back. Nothing here knows what a page, a frame or a story is — which is the
 * test of whether the host seam in BookApp is in the right place.
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
const hasFlag = (name) => process.argv.slice(2).includes(name);

const PORT = parseInt(argVal("--port", "8767"), 10);
const DO_OPEN = hasFlag("--open");
const HEADLESS_SMOKE = hasFlag("--headless-smoke");

const modPath = path.resolve(__dirname, "../bin/book_app_module.cjs");
if (!fs.existsSync(modPath)) {
  console.error("Missing " + modPath);
  console.error("Run: npm run book:module");
  process.exit(1);
}

const { BookApp, UIInput, UIKey } = require(modPath);
const fontDir = path.resolve(ROOT, "gallery/pdf_writer/assets/fonts");
const evgGlDir = path.resolve(ROOT, "gallery/evg/gl");

/** A Node Buffer as the ArrayBuffer-with-a-DataView that Ranger's `buffer` is. */
function asRangerBuffer(nodeBuf) {
  const ab = nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.byteLength);
  ab._view = new DataView(ab);
  return ab;
}

const app = new BookApp();
app.init(fontDir);
app.loadSample("gallery/pdf_writer/assets/images/");
// The pictures. The app decodes them for the CPU canvas; the browser fetches
// the same paths through /asset/ for its textures.
for (const rel of app.assetPaths()) {
  const full = path.resolve(ROOT, rel);
  if (fs.existsSync(full)) app.addImageBytes(rel, asRangerBuffer(fs.readFileSync(full)));
}
app.render();

const liveInput = new UIInput();
const KEY = {
  left: () => UIKey.left(),
  right: () => UIKey.right(),
  up: () => UIKey.up(),
  down: () => UIKey.down(),
  home: () => UIKey.home(),
  end: () => UIKey.end(),
  escape: () => UIKey.escape(),
  delete: () => UIKey.del(),
  enter: () => UIKey.enter(),
};

let lastX = 40;
let lastY = 40;

function applyEvent(ev) {
  liveInput.newFrame();
  liveInput.setModifiers(!!ev.shift, !!ev.ctrl);
  if (ev.type === "pointer") {
    lastX = ev.x | 0;
    lastY = ev.y | 0;
    liveInput.setPointerPos(lastX, lastY);
    liveInput.setPointerDown(!!ev.down);
  } else if (ev.type === "key") {
    liveInput.setPointerPos(lastX, lastY);
    const fn = KEY[ev.key];
    if (fn) liveInput.pushKey(fn());
  } else if (ev.type === "chord") {
    // Ctrl chords arrive as the letter: the app reads them off textInput the
    // same way a native host would.
    liveInput.setPointerPos(lastX, lastY);
    liveInput.setModifiers(!!ev.shift, true);
    liveInput.pushText(String(ev.text || ""));
  } else if (ev.type === "command") {
    app.runCommand(String(ev.id || ""), String(ev.arg || ""));
    app.render();
    return;
  } else if (ev.type === "scroll") {
    liveInput.setPointerPos(lastX, lastY);
    liveInput.addScroll(ev.delta | 0);
  } else if (ev.type === "resize") {
    app.resize(ev.width | 0, ev.height | 0);
    app.render();
    return;
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

function metaJson() {
  const d = app.document();
  const report = app.runPreflight();
  return JSON.stringify({
    width: app.W,
    height: app.H,
    title: d.title,
    author: d.author,
    pages: d.pageCount(),
    spreads: d.spreadCount(),
    spread: app.editor.spreadIndex(),
    page: app.editor.pageIndex,
    editing: app.editor.editMode,
    selected: app.editor.selectionCount(),
    overset: app.editor.overset(),
    errors: report.errorCount(),
    warnings: report.warningCount(),
    status: app.statusLine(),
  });
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
  if (u.pathname === "/meta.json") {
    send(res, 200, "application/json; charset=utf-8", metaJson());
    return;
  }
  if (u.pathname === "/frame.bin") {
    send(res, 200, "application/octet-stream", Buffer.from(app.raw()));
    return;
  }
  if (u.pathname.startsWith("/asset/")) {
    // The display list carries the document's own asset paths, so the browser
    // asks for exactly those — resolved under the repo root and nowhere else.
    const rel = decodeURIComponent(u.pathname.slice("/asset/".length));
    const full = path.resolve(ROOT, rel);
    if (!full.startsWith(ROOT) || !fs.existsSync(full) || !/\.(jpe?g|png|gif|webp)$/i.test(full)) {
      send(res, 404, "text/plain", "no such asset");
      return;
    }
    const lower = full.toLowerCase();
    const type = lower.endsWith(".png")
      ? "image/png"
      : lower.endsWith(".gif")
        ? "image/gif"
        : lower.endsWith(".webp")
          ? "image/webp"
          : "image/jpeg";
    send(res, 200, type, fs.readFileSync(full));
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
        send(res, 200, "application/json", JSON.stringify({ ok: true }));
      } catch (e) {
        send(res, 400, "text/plain", String(e));
      }
    });
    return;
  }
  if (u.pathname.startsWith("/fonts/")) {
    // The page needs the same faces the engine measured with, for its own
    // text atlas. They are the repository's, served by name.
    const name = path.basename(decodeURIComponent(u.pathname));
    if (!/^[A-Za-z0-9_-]+\.ttf$/.test(name)) {
      send(res, 400, "text/plain", "bad face");
      return;
    }
    const dirs = ["Open_Sans", "Cinzel", "Josefin_Sans"];
    for (const dir of dirs) {
      const full = path.join(fontDir, dir, name);
      if (fs.existsSync(full)) {
        send(res, 200, "font/ttf", fs.readFileSync(full));
        return;
      }
    }
    send(res, 404, "text/plain", "no such face");
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
  console.log("Book editor at " + url);
  if (HEADLESS_SMOKE) {
    try {
      const first = JSON.parse(app.sceneJson())?.list?.cmds || [];
      if (!first.length) throw new Error("empty display list");
      // The editor has to answer input, not merely paint one frame.
      applyEvent({ type: "chord", text: "e" });
      if (!app.editor.editMode) throw new Error("Ctrl+E did not arm editing");
      applyEvent({ type: "command", id: "nav.next", arg: "" });
      if (app.editor.spreadIndex() !== 1) throw new Error("nav.next did not turn the spread");
      // The opening spread is a title page; the pictures start on the next one,
      // so counting them on spread 0 would pass while proving nothing.
      const cmds = JSON.parse(app.sceneJson())?.list?.cmds || [];
      if (!cmds.length) throw new Error("empty list after input");
      const imgs = cmds.filter((c) => c.k === 2 && c.src);
      if (!imgs.length) throw new Error("no pictures reached the display list");
      for (const c of imgs) {
        const full = path.resolve(ROOT, c.src);
        if (!fs.existsSync(full)) throw new Error("missing asset " + c.src);
      }
      const clips = cmds.filter((c) => c.k === 4).length;
      if (!clips) throw new Error("a cropped picture must be clipped");
      console.log(
        "smoke ok cmds=" + cmds.length + " images=" + imgs.length + " clips=" + clips +
        " pages=" + app.document().pageCount() + " spreads=" + app.document().spreadCount()
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
