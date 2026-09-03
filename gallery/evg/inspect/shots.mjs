#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The two screenshots in the README, regenerated from the running pages.
//
//   npm run evg:inspect:shots
//
// A picture of a dev tool is the only way to show what it is, and a picture
// checked in without a way to remake it is a claim about a version of the code
// that may no longer exist. This drives both hosts in headless Chromium over
// CDP — the dashboard on the WebGL painter through SwiftShader, the slide
// editor on the SVG one, which needs no GPU at all — selects something worth
// looking at in each, and writes the frames beside this file.

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const OUT = path.join(HERE, "shots");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json",
  ".ttf": "font/ttf", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".odp": "application/vnd.oasis.opendocument.presentation",
};

function findChrome() {
  const named = [process.env.CHROME_PATH, "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome"].filter(Boolean);
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

function serve(root) {
  const server = http.createServer((q, s) => {
    const rel = decodeURIComponent((q.url || "/").split("?")[0]);
    const file = path.join(root, rel === "/" ? "index.html" : rel);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      s.writeHead(404); s.end("no"); return;
    }
    s.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    s.end(fs.readFileSync(file));
  });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r(server)));
}

const CHROME = findChrome();
if (!CHROME) { console.error("no Chrome found — set CHROME_PATH to one"); process.exit(1); }

// SwiftShader, because the dashboard is painted with WebGL 2 and this machine
// has no GPU. The slide editor does not need it and does not care.
const profile = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "evgshots-"));
const proc = spawn(CHROME, ["--headless=new", "--no-sandbox", "--no-proxy-server",
  "--proxy-bypass-list=<-loopback>", "--disable-dev-shm-usage",
  "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader",
  "--force-device-scale-factor=1", "--remote-debugging-port=9391",
  `--user-data-dir=${profile}`, "about:blank"], {
  stdio: "ignore",
  env: { ...process.env, HTTP_PROXY: "", HTTPS_PROXY: "", http_proxy: "", https_proxy: "", NO_PROXY: "*", no_proxy: "*" },
});
let ver = null;
for (let i = 0; i < 3000 && !ver; i++) {
  try { const r = await fetch("http://127.0.0.1:9391/json/version"); if (r.ok) ver = await r.json(); } catch { /* not up */ }
  if (!ver) await sleep(5);
}
if (!ver) { proc.kill(); console.error("chromium did not open a devtools endpoint"); process.exit(1); }

const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener("message", (m) => {
  const g = JSON.parse(m.data);
  if (g.id && pending.has(g.id)) { pending.get(g.id)(g); pending.delete(g.id); }
});
const send = (method, params = {}, S) => new Promise((res) => {
  const i = ++id; pending.set(i, res);
  ws.send(JSON.stringify({ id: i, method, params, ...(S ? { sessionId: S } : {}) }));
});

async function shot({ root, url, out, ready, drive, w = 1900, h = 1120 }) {
  const server = await serve(root);
  const port = server.address().port;
  const { result: tgt } = await send("Target.createTarget", { url: "about:blank" });
  const { result: att } = await send("Target.attachToTarget", { targetId: tgt.targetId, flatten: true });
  const S = att.sessionId;
  await send("Page.enable", {}, S);
  await send("Runtime.enable", {}, S);
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false }, S);
  await send("Page.navigate", { url: `http://127.0.0.1:${port}${url}` }, S);
  let up = false;
  for (let i = 0; i < 400 && !up; i++) {
    const r = await send("Runtime.evaluate", { expression: `(()=>{try{return !!(${ready})}catch(e){return false}})()`, returnByValue: true }, S);
    up = r.result?.result?.value === true;
    if (!up) await sleep(50);
  }
  if (!up) console.log("  (timed out waiting for the page — shooting it anyway)");
  if (drive) {
    const r = await send("Runtime.evaluate", { expression: drive, returnByValue: true, awaitPromise: true }, S);
    if (r.result?.exceptionDetails) console.log("  drive failed: " + (r.result.exceptionDetails.exception?.description || ""));
    await sleep(500);
  }
  await sleep(600);
  const png = await send("Page.captureScreenshot", { format: "png" }, S);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(out, Buffer.from(png.result.data, "base64"));
  console.log("  " + path.relative(ROOT, out) + "  " + Math.round(png.result.data.length * 0.75 / 1024) + " KB");
  await send("Target.closeTarget", { targetId: tgt.targetId });
  server.close();
}

if (fs.existsSync(path.join(ROOT, "gallery/ui/demo/bundle.js"))) {
  await shot({
    root: ROOT,
    url: "/gallery/ui/demo/index.html?inspect=1&demo=dashboard",
    out: path.join(OUT, "dashboard.png"),
    ready: "document.querySelectorAll('.evgi-row').length > 3",
    // The chart's title: deep in the tree, with real text and a real box, so
    // the picture shows the tree expanded to it and the overlay on it.
    // A card: it carries a class four elements share, so the cascade pane
    // shows the rule, its declarations, and the "4 elements" badge that says
    // what editing it would reach.
    drive: `(async () => {
      const i = window.__inspector;
      await i.ready;
      await i.select('0/2/0/0/0/0');
      document.querySelectorAll('.evgi-tab')[1].click();
      return i.selection;
    })()`,
  });
} else {
  console.log("  (skipping the dashboard — run: npm run ui:demo:build && node gallery/ui/demo/build.mjs)");
}

if (fs.existsSync(path.join(ROOT, "gallery/ui/demo/bundle.js"))) {
  await shot({
    root: ROOT,
    url: "/gallery/ui/demo/index.html?inspect=1&demo=dashboard",
    out: path.join(OUT, "css.png"),
    ready: "document.querySelectorAll('.evgi-row').length > 3",
    // The sheet, edited in the panel and applied — the cards go cream with
    // square corners, which is the whole claim in one picture: an input
    // changed and the app did the rest.
    drive: `(async () => {
      const i = window.__inspector;
      await i.ready;
      await i.select('0/2/0/0/0/0');
      document.querySelectorAll('.evgi-tab')[2].click();
      // The pane reads the sheet through the adapter, which may answer on a
      // later tick, so the editor is waited for rather than assumed.
      let ta = null;
      for (let k = 0; k < 60 && !ta; k++) {
        await new Promise(r => setTimeout(r, 50));
        ta = document.querySelector('.evgi-css textarea');
      }
      ta.value += '\\n/* typed in the inspector */\\n.db-card { border-radius: 2px; background-color: #fff7e0; }\\n';
      ta.dispatchEvent(new Event('input'));
      [...document.querySelectorAll('.evgi-btn')].find(b => b.textContent === 'apply').click();
      return i.selection;
    })()`,
  });
}

if (fs.existsSync(path.join(ROOT, "gallery/ui/demo/bundle.js"))) {
  await shot({
    root: ROOT,
    url: "/gallery/ui/demo/index.html?inspect=1&demo=dashboard",
    out: path.join(OUT, "state.png"),
    ready: "document.querySelectorAll('.evgi-row').length > 3",
    // The brand row, with its hover held on. The pointer is nowhere near it —
    // that is the point — and the cascade below shows the ordinary
    // `.db-brand:hover` rule winning, because a held bit is an ordinary state.
    drive: `(async () => {
      const i = window.__inspector;
      await i.ready;
      await i.select('0/0/0');
      document.querySelectorAll('.evgi-tab')[1].click();
      await new Promise(r => setTimeout(r, 200));
      const hov = [...document.querySelectorAll('.evgi-hov button')].find(b => b.textContent === ':hover');
      hov.click();
      await new Promise(r => setTimeout(r, 700));
      return i.selection;
    })()`,
  });
}

if (fs.existsSync(path.join(ROOT, "gallery/pptx/web/html/dist/pptx_web.js"))) {
  await shot({
    root: path.join(ROOT, "gallery/pptx/web/html/dist"),
    url: "/index.html?inspect=1",
    out: path.join(OUT, "pptx-slide.png"),
    ready: "document.querySelectorAll('.evgi-row').length > 2",
    // Slide 4 is the shape sheet. Its second shape is the ellipse, which is
    // the one worth showing: the overlay lands on a shape that is not a
    // rectangle, and the commands pane shows the RECT and BORDER it became.
    drive: `(async () => {
      const next = [...document.querySelectorAll('button')].find(b => /Next/.test(b.textContent));
      for (let k = 0; k < 3; k++) { next.click(); await new Promise(r => setTimeout(r, 400)); }
      await new Promise(r => setTimeout(r, 700));
      window.__inspector.refresh();
      await new Promise(r => setTimeout(r, 300));
      window.__inspector.select('0/3/1');
      document.querySelectorAll('.evgi-tab')[2].click();
      return window.__inspector.selection;
    })()`,
  });
} else {
  console.log("  (skipping the slide editor — run: npm run pptx:html)");
}

ws.close(); proc.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* chrome is still letting go */ }
process.exit(0);
