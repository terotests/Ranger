#!/usr/bin/env node
/**
 * Interactive present host for the Ranger EVG DataGrid / spreadsheet prototype.
 *
 *   INPUT   browser events → POST /input → UIInput → GridApp (Node)
 *   RENDER  GridApp.sceneJson() → EVGDisplayList → GET /scene.json
 *           → gallery/evg/gl/evg-webgl.js (WebGL 2)
 *
 *   node gallery/datagrid/web/serve.mjs [--port 8766] [--open] [--headless-smoke]
 *
 *   --db <engine>   open a DATABASE sheet instead of an .xlsx: "auto" (DuckDB
 *                   if installed, else SQLite, else RangerDB), or name one.
 *                   --db-dsn (default :memory:), --db-table (default sales),
 *                   --db-rows (rows to seed an empty table with).
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

const PORT = parseInt(argVal("--port", "8766"), 10);
const DO_OPEN = hasFlag("--open");
const HEADLESS_SMOKE = hasFlag("--headless-smoke");

// A database sheet needs the module that carries the engine adapters with it;
// the plain viewer build deliberately does not have them, so that the C++ /
// SDL build never compiles a JavaScript host binding.
const DB_DRIVER = argVal("--db", "");
const modName = DB_DRIVER ? "grid_db_module.cjs" : "grid_app_module.cjs";
const modPath = path.resolve(__dirname, "../bin/" + modName);
if (!fs.existsSync(modPath)) {
  console.error("Missing " + modPath);
  console.error("Run: npm run " + (DB_DRIVER ? "datagrid:db:module" : "datagrid:module"));
  process.exit(1);
}

// Where the compiled Ranger finds its SQL host. Resolved here rather than from
// the process's working directory, so the server runs from anywhere.
process.env.RANGERDB_HOST =
  process.env.RANGERDB_HOST ||
  path.resolve(ROOT, "gallery/rangerdb/host/sync_sql.cjs");

const { GridApp, UIInput, UIKey, GridDbLauncher } = require(modPath);
const fontDir = path.resolve(ROOT, "gallery/pdf_writer/assets/fonts");
const evgGlDir = path.resolve(ROOT, "gallery/evg/gl");

const app = new GridApp();
app.init(fontDir);
// Default showcase workbook (M4+): multi-sheet, formats, formulas, CF.
// Override: node serve.mjs --xlsx gallery/datagrid/fixtures/sales.xlsx
let dbLauncher = null;
const DB_SEED_ROWS = parseInt(argVal("--db-rows", "120"), 10);
if (DB_DRIVER) {
  dbLauncher = new GridDbLauncher();
  const ok = dbLauncher.start(
    app,
    DB_DRIVER === "auto" ? "" : DB_DRIVER,
    argVal("--db-dsn", ":memory:"),
    argVal("--db-table", "sales"),
    DB_SEED_ROWS,
  );
  console.log("  engines: " + GridDbLauncher.availableList());
  console.log((ok ? "  " : "  database failed: ") + dbLauncher.status);
  if (!ok) process.exit(1);
}
const xlsxArg = argVal("--xlsx", "");
const xlsxPath = path.resolve(
  ROOT,
  xlsxArg || "gallery/datagrid/fixtures/business-workbook.xlsx",
);
if (DB_DRIVER) {
  // The database sheet IS the document here; loading a workbook on top of it
  // would replace the book the sheet lives in.
} else if (fs.existsSync(xlsxPath)) {
  const password = argVal("--password", "");
  const ok = password
    ? app.loadXlsxPassword(xlsxPath, password)
    : app.loadXlsx(xlsxPath);
  console.log(ok ? "  loaded " + xlsxPath : "  xlsx load failed: " + app.loadError);
  // Prefer Summary sheet when present (KPIs + CF demo).
  if (ok && typeof app.book?.sheetCount === "function") {
    const n = app.book.sheetCount();
    for (let i = 0; i < n; i++) {
      const sh = app.book.sheetAt(i);
      if (sh && sh.name === "Summary") {
        app.setActiveSheet(i);
        break;
      }
    }
  }
} else {
  console.log("  (no " + xlsxPath + " — using demo sheet)");
}

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
  pageUp: () => UIKey.pageUp(),
  pageDown: () => UIKey.pageDown(),
  f2: () => UIKey.f2(),
};

// Last TSV this host handed to the browser clipboard. When it comes back on a
// paste we know nothing external changed it, so the formula-aware block paste
// (which translates relative refs) is still the right one to run.
let lastExportedTsv = "";
let lastClipboardSeq = 0;
// The last scene handed out, and a number for it. Unchanged scenes are not
// sent again — see the /scene.json route.
let lastSceneBody = "";
let sceneSeq = 0;

let lastX = 80;
let lastY = 80;

/** Returns a JSON-able reply, or null for "nothing to send back". */
/** The bytes of one media part, from whichever sheet carries it.
 *  A Ranger `buffer` arrives here as an ArrayBuffer, which has byteLength
 *  rather than length — asking for the wrong one silently reads undefined and
 *  turns every picture into a 404. */
function mediaBytes(part) {
  for (let si = 0; si < app.book.sheetCount(); si++) {
    const sheet = app.book.sheetAt(si);
    for (let i = 0; i < sheet.imageCount(); i++) {
      const img = sheet.imageAt(i);
      if (img.src !== part || !img.bytes) continue;
      const view = img.bytes instanceof ArrayBuffer
        ? new Uint8Array(img.bytes)
        : img.bytes;
      if (view.length || view.byteLength) return Buffer.from(view);
    }
  }
  return null;
}

// The app cannot open a database itself - naming an engine is the host's job,
// the same way opening a file picker is - so the connection window leaves a
// request behind and this reads it. A host that ignored it would simply keep
// the sheet it already has.
function serviceDbRequest() {
  if (typeof app.takeDbRequest !== "function") return;
  const req = app.takeDbRequest();
  if (req !== "connect") return;
  if (!dbLauncher) {
    dbLauncher = new GridDbLauncher();
  }
  const driver = app.dbRequestDriver === "auto" ? "" : String(app.dbRequestDriver || "");
  const dsn = String(app.dbRequestDsn || ":memory:");
  const table = String(app.dbRequestTable || "sales");
  // Demo rows are only seeded into an in-memory database. Pointed at a file,
  // a table that is not there has to say so rather than be invented.
  const seed = dsn === ":memory:" ? DB_SEED_ROWS : 0;
  const ok = dbLauncher.start(app, driver, dsn, table, seed);
  console.log((ok ? "  connected: " : "  connect failed: ") + dbLauncher.status);
}

function applyEvent(ev) {
  if (ev.type === "paste") {
    // OS clipboard → grid. Text we exported ourselves keeps the structured
    // block (formulas translate); anything else pastes as plain TSV values.
    const text = String(ev.text || "");
    if (!(text && text === lastExportedTsv)) {
      app.setClipboardText(text);
    }
    app.pasteClipboard();
    return null;
  }
  liveInput.newFrame();
  if (ev.type === "pointer") {
    lastX = ev.x | 0;
    lastY = ev.y | 0;
    liveInput.setPointerPos(lastX, lastY);
    liveInput.setPointerDown(!!ev.down);
    liveInput.setModifiers(!!ev.shift, !!ev.ctrl);
  } else if (ev.type === "wheel") {
    liveInput.setPointerPos(lastX, lastY);
    if (ev.axis === "x") liveInput.addScrollX(ev.delta | 0);
    else liveInput.addScroll(ev.delta | 0);
  } else if (ev.type === "key") {
    liveInput.setPointerPos(lastX, lastY);
    liveInput.setModifiers(!!ev.shift, !!ev.ctrl);
    const fn = KEY[ev.key];
    if (fn) liveInput.pushKey(fn());
  } else if (ev.type === "dblclick") {
    // Double-click a column header (or its edge) auto-fits the width.
    lastX = ev.x | 0;
    lastY = ev.y | 0;
    app.autoFitAt(lastX, lastY);
    return null;
  } else if (ev.type === "text") {
    liveInput.setPointerPos(lastX, lastY);
    liveInput.setModifiers(!!ev.shift, !!ev.ctrl);
    liveInput.pushText(String(ev.text || ""));
  } else {
    return null;
  }
  app.update(liveInput);
  serviceDbRequest();
  // Anything at all may have copied: Ctrl+C, Ctrl+X, or the Copy button on a
  // chart window, which arrives as an ordinary pointer click. The app counts
  // copies, so noticing one is a comparison rather than a guess about which
  // events can cause it.
  return takeClipboard();
}

// The payload the browser puts on the OS clipboard, or null when nothing new
// was copied. A Node process cannot reach the clipboard itself.
function takeClipboard() {
  const seq = app.clipboardSeq | 0;
  if (seq === lastClipboardSeq) return null;
  lastClipboardSeq = seq;
  lastExportedTsv = app.clipboardTsv || "";
  const out = {
    clipboard: lastExportedTsv,
    clipboardHtml: app.clipboardHtml || "",
    clipboardKind: app.clipboardKind || "cells",
  };
  // A chart also travels as a picture: the PNG is what Excel and Word paste,
  // the SVG is there for a host that can take vector.
  if (out.clipboardKind === "chart") {
    out.clipboardPng = app.clipboardPng || "";
    out.clipboardSvg = app.clipboardSvg || "";
    out.clipboardName = app.clipboardName || "chart";
    // The chart as a Vela document — the specification, its numbers and how it
    // is presented. It also rides inside the HTML flavour, which is how the
    // DOCX editor gets it through a plain OS paste; this is for a host that
    // wants it directly.
    out.clipboardChart = app.clipboardChartJson || "";
  }
  return out;
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

  // The render seam: the app's display list, as JSON, for the browser to draw
  // with WebGL. The client asks once per animation frame — it has no way to
  // know the app changed — so most of those frames are the same scene as the
  // last one. `?seen=<n>` says which one the client already has, and an
  // unchanged scene answers 204 instead of resending 50 KB sixty times a
  // second. The scene is still BUILT every time: that is what makes the caret
  // blink and a drag follow the pointer.
  if (url.pathname === "/scene.json") {
    const body = sceneBody();
    if (body !== lastSceneBody) {
      lastSceneBody = body;
      sceneSeq += 1;
    }
    const seen = parseInt(url.searchParams.get("seen") || "-1", 10);
    if (seen === sceneSeq) {
      res.writeHead(204, { "x-scene-seq": String(sceneSeq), "cache-control": "no-store" });
      res.end();
      return;
    }
    res.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-scene-seq": String(sceneSeq),
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
      const reply = applyEvent(JSON.parse(body || "{}"));
      if (reply) {
        const payload = JSON.stringify(reply);
        res.writeHead(200, {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        });
        res.end(payload);
      } else {
        res.writeHead(204);
        res.end();
      }
    } catch (e) {
      res.writeHead(400, { "content-type": "text/plain" });
      res.end(String(e && e.message ? e.message : e));
    }
    return;
  }

  // The command surface, over HTTP: what the grid can do, and doing it. This
  // is the same table the app itself dispatches through — a host driving the
  // grid from outside runs exactly the paths the keyboard does.
  if (url.pathname === "/commands") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(app.commands.toJson());
    return;
  }

  if (url.pathname === "/command" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    let payload = {};
    try {
      payload = JSON.parse(body || "{}");
    } catch {
      res.writeHead(400, { "content-type": "text/plain" });
      res.end("bad json");
      return;
    }
    const ran = app.runCommand(String(payload.id || ""), String(payload.arg || ""));
    serviceDbRequest();
    // A custom tool leaves its id in the app's mailbox; the host is the only
    // thing that knows what its own tool means, so it is handed back here.
    const custom = app.takeCustomCommand();
    const customArg = custom ? app.takeCustomArg() : "";
    // `chart.copy` (and `edit.copy`) leave something on the clipboard; a host
    // driving over HTTP gets it in the same reply rather than having to know
    // which commands copy.
    const clip = takeClipboard();
    res.writeHead(ran ? 200 : 404, {
      "content-type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify({ ran, custom, customArg, active: app.activeLabel(), clip }));
    return;
  }

  // What is on the clipboard now, in every flavour — including the SVG, which
  // a browser will not put on the system clipboard but a host may want to save
  // or send somewhere. Reading does not consume it.
  if (url.pathname === "/clipboard") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({
      kind: app.clipboardKind || "cells",
      name: app.clipboardName || "",
      text: app.clipboardTsv || "",
      html: app.clipboardHtml || "",
      png: app.clipboardPng || "",
      svg: app.clipboardSvg || "",
      chart: app.clipboardChartJson || "",
      note: app.clipboardNote || "",
      seq: app.clipboardSeq | 0,
    }));
    return;
  }

  // A sheet's pictures. They came out of the .xlsx while it was open and now
  // live on the model; the browser asks for them by package part name, which
  // is exactly what the IMAGE commands in the scene carry.
  if (url.pathname.startsWith("/media/")) {
    const part = decodeURIComponent(url.pathname.slice("/media/".length));
    const bytes = mediaBytes(part);
    if (!bytes) {
      res.writeHead(404);
      res.end("no such part");
      return;
    }
    res.writeHead(200, {
      "content-type": part.endsWith(".png") ? "image/png" : "image/jpeg",
      "cache-control": "no-store",
    });
    res.end(bytes);
    return;
  }

  // Where the charts are, and where their tools are inside them. A chart's
  // buttons used to be labelled, so a test could find them by reading the
  // scene for "Copy"; they are icons now, and an icon has no text to find.
  // This is the same question asked of the app instead of of the pixels.
  if (url.pathname === "/charts") {
    const layer = app.view.chartLayer;
    const out = [];
    for (let i = 0; i < layer.count(); i += 1) {
      const p = layer.panelAt(i);
      const win = p.win;
      const tools = [];
      for (const c of win.controls) {
        // 8 is EVGControlKind.tool(); `value` names the glyph.
        if (c.kind === 8) {
          tools.push({ glyph: c.value, x: win.x + c.x, y: win.y + c.y, w: c.w, h: c.h });
        }
      }
      out.push({
        id: p.chart.id,
        x: win.x,
        y: win.y,
        w: win.w,
        h: win.h,
        bare: !!win.bare,
        selected: !!win.toolsOpen,
        tools,
      });
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ charts: out }));
    return;
  }

  if (url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        w: app.W,
        h: app.H,
        render: "webgl-displaylist",
        active: app.activeLabel(),
        rows: app.model.rowCount,
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
      path.resolve(ROOT, "gallery/text_editor/bench/compare/node_modules/puppeteer-core")
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
    await page.setViewport({ width: 1100, height: 760 });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForSelector("#screen");
    await page.waitForFunction(
      () => document.getElementById("status")?.textContent === "live",
      { timeout: 20000 }
    );
    const backend = await page.$eval("#backend", (el) => el.textContent);
    const cmds = await page.$eval("#cmds", (el) => el.textContent);
    await page.click("#screen", { offset: { x: 120, y: 90 } });
    await page.keyboard.type("GridOK");
    await page.keyboard.press("Enter");
    await new Promise((r) => setTimeout(r, 600));
    const status = await page.$eval("#status", (el) => el.textContent);
    const stats = await page.evaluate(() => window.__evgStats || null);
    const active = app.activeLabel();
    const cell = app.model.getCell(0, 0);
    console.log("[smoke] status=" + status + " backend=" + backend + " cmds=" + cmds);
    console.log("[smoke] evgStats=" + JSON.stringify(stats));
    console.log("[smoke] active=" + active + " A1=" + JSON.stringify(cell));
    if (backend !== "webgl2") throw new Error("expected webgl2 backend");
    if (!stats || !(stats.drawn > 0)) throw new Error("WebGL drew no quads");
    if (!String(cell).includes("GridOK") && app.model.getCell(0, 0) !== "GridOK") {
      // typing may land on whichever cell was hit — accept any committed GridOK
      let found = false;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (String(app.model.getCell(r, c)).includes("GridOK")) found = true;
        }
      }
      if (!found && !String(app.editBuf || "").includes("GridOK")) {
        throw new Error("typed text not found in sheet");
      }
    }
    console.log("[smoke] PASS");
  } finally {
    await browser.close();
    server.close();
  }
}

server.listen(PORT, "127.0.0.1", async () => {
  const url = `http://127.0.0.1:${PORT}/`;
  console.log("Ranger EVG DataGrid / XLSX viewer — input/UIInput + render/WebGL");
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
