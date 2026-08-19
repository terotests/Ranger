#!/usr/bin/env node
/**
 * SoftCanvas present host for the Ranger DOCX viewer.
 *
 *   npm run docx_viewer:window
 *   → http://127.0.0.1:8770/
 *
 * Renders fixture .docx files to PNG pages (CPU SoftCanvas), no WebGL yet.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const FIXTURES = path.resolve(__dirname, "../fixtures");
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

const PORT = parseInt(argVal("--port", "8770"), 10);
const DO_OPEN = hasFlag("--open");

const modPath = path.resolve(__dirname, "../bin/docx_viewer_module.cjs");
if (!fs.existsSync(modPath)) {
  console.error("Missing " + modPath);
  console.error("Run: npm run docx_viewer:module");
  process.exit(1);
}

const { DocxViewer } = require(modPath);
const fontDir = path.resolve(ROOT, "gallery/pdf_writer/assets/fonts");

const viewer = new DocxViewer();
viewer.init(fontDir);

function listDocs() {
  return fs
    .readdirSync(FIXTURES)
    .filter((f) => f.endsWith(".docx"))
    .sort();
}

let currentFile = listDocs().includes("20-business-report.docx")
  ? "20-business-report.docx"
  : (listDocs()[0] || "hello.docx");
let currentPage = 0;

function openDoc(file) {
  const name = path.basename(String(file || ""));
  if (!name.endsWith(".docx")) {
    return { ok: false, error: "expected .docx" };
  }
  const fp = path.join(FIXTURES, name);
  if (!fs.existsSync(fp)) {
    return { ok: false, error: "not found: " + name };
  }
  const ok = viewer.openFile(FIXTURES, name);
  if (!ok) {
    return { ok: false, error: viewer.lastError || "open failed" };
  }
  currentFile = name;
  currentPage = 0;
  viewer.renderPage(0);
  return {
    ok: true,
    file: name,
    pageCount: viewer.pageCount(),
    width: viewer.pageWidth(),
    height: viewer.pageHeight(),
  };
}

openDoc(currentFile);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
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
  try {
    await handleRequest(req, res);
  } catch (e) {
    console.error("request error", req.url, e);
    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "application/json" });
    }
    res.end(JSON.stringify({ ok: false, error: String(e && e.message ? e.message : e) }));
  }
});

async function handleRequest(req, res) {
  const url = new URL(req.url || "/", "http://127.0.0.1");

  if (url.pathname === "/favicon.ico") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === "/api/docs") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        docs: listDocs(),
        current: currentFile,
        page: currentPage,
        pageCount: viewer.pageCount(),
      })
    );
    return;
  }

  if (url.pathname === "/api/state") {
    res.writeHead(200, { "content-type": "application/json" });
    let caret = { active: false };
    try {
      caret = JSON.parse(viewer.caretInfoJson());
    } catch (_) {}
    res.end(
      JSON.stringify({
        file: currentFile,
        page: currentPage,
        pageCount: viewer.pageCount(),
        width: viewer.pageWidth(),
        height: viewer.pageHeight(),
        text: String(viewer.plainText() || "").slice(0, 200),
        editMode: !!viewer.editMode(),
        caret,
      })
    );
    return;
  }

  if (url.pathname === "/api/edit" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const ev = JSON.parse(body || "{}");
    if (typeof ev.enabled === "boolean") {
      viewer.setEditMode(ev.enabled);
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, editMode: !!viewer.editMode() }));
    return;
  }

  if (url.pathname === "/api/open" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    try {
      const ev = JSON.parse(body || "{}");
      const out = openDoc(ev.file);
      viewer.setEditMode(false);
      res.writeHead(out.ok ? 200 : 400, { "content-type": "application/json" });
      res.end(JSON.stringify(out));
    } catch (e) {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: String(e && e.message ? e.message : e) }));
    }
    return;
  }

  if (url.pathname === "/api/input" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const ev = JSON.parse(body || "{}");
    const type = ev.type || "";
    // Filled by copy / cut so the browser can put it on the OS clipboard
    // (a Node process cannot reach it directly).
    let clipboardOut = "";
    if (type === "click") {
      viewer.clickAt(ev.x | 0, ev.y | 0, !!ev.shift);
    } else if (type === "text") {
      viewer.typeText(String(ev.text || ""));
    } else if (type === "backspace") {
      viewer.keyBackspace();
    } else if (type === "delete") {
      viewer.keyDelete();
    } else if (type === "enter") {
      viewer.keyEnter();
    } else if (type === "undo") {
      viewer.keyUndo();
    } else if (type === "redo") {
      viewer.keyRedo();
    } else if (type === "bold") {
      viewer.toggleBold();
    } else if (type === "font") {
      viewer.setFont(String(ev.font || "Open Sans"));
    } else if (type === "paste") {
      // text/html from a spreadsheet copy becomes a table; otherwise plain text.
      viewer.pasteClipboard(String(ev.html || ""), String(ev.text || ""));
    } else if (type === "move") {
      // Caret navigation. `shift` extends the selection, `ctrl` widens the step.
      const shift = !!ev.shift;
      const ctrl = !!ev.ctrl;
      const dir = String(ev.dir || "");
      if (dir === "left") viewer.keyLeft(shift);
      else if (dir === "right") viewer.keyRight(shift);
      else if (dir === "up") viewer.keyUp(shift);
      else if (dir === "down") viewer.keyDown(shift);
      else if (dir === "pageUp") viewer.keyPageUp(shift);
      else if (dir === "pageDown") viewer.keyPageDown(shift);
      else if (dir === "home") viewer.keyHome(shift, ctrl);
      else if (dir === "end") viewer.keyEnd(shift, ctrl);
    } else if (type === "selectAll") {
      viewer.keySelectAll();
    } else if (type === "copy") {
      clipboardOut = viewer.copySelection();
    } else if (type === "cut") {
      clipboardOut = viewer.cutSelection();
    }
    // Follow the caret: `| currentPage` OR-ed the old page in, so moving back
    // to an earlier page (page 0 especially) never took effect.
    currentPage = viewer.currentPage | 0;
    let caret = { active: false };
    try {
      caret = JSON.parse(viewer.caretInfoJson());
    } catch (_) {}
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        pageCount: viewer.pageCount(),
        page: currentPage,
        caret,
        editMode: !!viewer.editMode(),
        clipboard: clipboardOut,
      })
    );
    return;
  }

  if (url.pathname === "/page.png") {
    const page = parseInt(url.searchParams.get("page") || "0", 10) || 0;
    currentPage = page;
    viewer.renderPage(page);
    const buf = viewer.pngBytes();
    const bytes = Buffer.from(buf);
    res.writeHead(200, {
      "content-type": "image/png",
      "content-length": bytes.length,
      "cache-control": "no-store",
    });
    res.end(bytes);
    return;
  }

  if (url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, file: currentFile, render: "softcanvas-png" }));
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
}

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

server.listen(PORT, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${PORT}/`;
  console.log("Ranger DOCX viewer — SoftCanvas PNG present");
  console.log("  " + url);
  console.log("  fixtures: " + FIXTURES);
  console.log("  tip: npm run docx_viewer:window");
  if (DO_OPEN) {
    const chrome = findChrome();
    if (chrome) {
      spawn(chrome, ["--new-window", url], { detached: true, stdio: "ignore" }).unref();
      console.log("  opened " + chrome);
    } else {
      console.log("  (no chrome found — open the URL manually)");
    }
  }
});
