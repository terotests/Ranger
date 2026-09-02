#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The panel, in a real browser, over the PPTX slide editor.
//
//   npm run evg:inspect:web
//
// `inspect-check.mjs` gates the four channels in Node, where the app is an
// object. This gates the half that only exists in a page: that `?inspect=1`
// actually attaches something, that the tree it read has rows in it, and that
// selecting a node fills the panes. The wiring between a host and the panel is
// three functions long and therefore exactly the kind of thing that breaks
// without any test noticing.
//
// The SVG editor is the target because it needs no GPU: `--dump-dom` in
// headless Chromium is enough, and the page draws the same picture the WebGL
// one does.

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const DIST = path.join(ROOT, "gallery/pptx/web/html/dist");
const PORT = 8117;
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json",
  ".ttf": "font/ttf", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".odp": "application/vnd.oasis.opendocument.presentation", ".png": "image/png",
};

function findChrome() {
  const named = [process.env.CHROME_PATH, "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean);
  for (const c of named) { try { if (fs.existsSync(c)) return c; } catch { /* keep looking */ } }
  const pw = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  try {
    for (const dir of fs.readdirSync(pw)) {
      const c = path.join(pw, dir, "chrome-linux", "chrome");
      if (fs.existsSync(c)) return c;
    }
  } catch { /* none */ }
  return null;
}

function serve() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent((req.url || "/").split("?")[0]);
    const file = path.join(DIST, rel === "/" ? "index.html" : rel);
    if (!file.startsWith(DIST) || !fs.existsSync(file)) { res.writeHead(404); res.end("no"); return; }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    res.end(fs.readFileSync(file));
  });
  return new Promise((r) => server.listen(PORT, "127.0.0.1", () => r(server)));
}

function runChrome(bin, args) {
  return new Promise((resolve) => {
    const child = spawn(bin, args, {
      env: { ...process.env, HTTP_PROXY: "", HTTPS_PROXY: "", http_proxy: "", https_proxy: "", NO_PROXY: "*", no_proxy: "*" },
    });
    let out = "", err = "";
    const kill = setTimeout(() => child.kill("SIGKILL"), 120000);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (status) => { clearTimeout(kill); resolve({ stdout: out, stderr: err, status }); });
    child.on("error", (error) => { clearTimeout(kill); resolve({ stdout: out, stderr: err, status: -1, error }); });
  });
}

if (!fs.existsSync(path.join(DIST, "pptx_web.js"))) {
  console.error("no build in " + path.relative(ROOT, DIST) + " — run: npm run pptx:html");
  process.exit(1);
}
const chrome = findChrome();
if (!chrome) { console.error("no Chrome found — set CHROME_PATH to one"); process.exit(1); }

const server = await serve();
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) console.log("  ok " + name);
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};

try {
  // The panel opens on the root, so a dumped DOM already carries a selection
  // and a filled pane — no script has to be injected to make it interesting.
  const url = `http://127.0.0.1:${PORT}/index.html?inspect=1`;
  const run = await runChrome(chrome, ["--headless=new", "--no-sandbox", "--no-proxy-server",
    "--proxy-bypass-list=<-loopback>", "--disable-dev-shm-usage",
    "--virtual-time-budget=25000", "--dump-dom", url]);
  const dom = run.stdout || "";
  if (process.env.SMOKE_DEBUG) fs.writeFileSync("/tmp/evg-inspect-dom.html", dom);

  ok("the panel attached", /class="evgi"/.test(dom));
  const rows = (dom.match(/class="evgi-row/g) || []).length;
  ok("the tree has rows", rows >= 3, rows + " rows");
  const foot = (dom.match(/class="evgi-foot"[^>]*>([^<]*)/) || [])[1] || "";
  ok("the footer counted nodes and commands", /\d+ nodes/.test(foot) && /\d+ commands/.test(foot), JSON.stringify(foot));
  ok("the box-model diagram is there", /evgi-bm/.test(dom));
  ok("the overlay is mounted over the picture", /class="evgi-ov"/.test(dom));
  ok("a node is selected", /evgi-row sel/.test(dom));
  ok("the panes filled", /evgi-kv/.test(dom));
  if (failed && process.env.SMOKE_DEBUG !== "1") console.log("\n  re-run with SMOKE_DEBUG=1 to dump the DOM to /tmp");
} finally {
  server.close();
}

console.log(failed ? `\n${failed} failed\n` : "\nthe inspector attached to the slide editor and read its tree\n");
process.exit(failed ? 1 : 0);
