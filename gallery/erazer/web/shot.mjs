#!/usr/bin/env node
/**
 * Screenshot HTML UI fixtures, run Erazer on them, and capture the live demo.
 *
 * Uses headless Chrome (not Playwright). The cloud wrapper at
 * /usr/local/bin/google-chrome pins a shared profile and port 9222; this
 * script calls google-chrome-stable with an isolated --user-data-dir.
 *
 *   npm run erazer:web
 *   node gallery/erazer/web/shot.mjs
 *
 * Writes PNGs to gallery/erazer/shots/ (source, overlay composite, demo page).
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const DIST = path.join(HERE, "dist");
const SHOTS = path.join(HERE, "../shots");
const ART = "/opt/cursor/artifacts/screenshots";
const COMPONENTS = path.join(HERE, "components.html");
const CLI = path.join(HERE, "../bin/erazer_cli.js");
const NAMES = ["login", "settings", "tabs", "menu", "toolbar", "dialog", "buttons", "nav"];

// Headless Chrome's --window-size is the outer window; a slice of that is
// chrome UI even in headless=new. Short viewports clipped 36px tabs/buttons
// down to a 13px strip. Leave generous slack around every fixture.
const SIZES = {
  login: [520, 520],
  settings: [520, 420],
  tabs: [520, 320],
  menu: [420, 420],
  toolbar: [640, 320],
  dialog: [520, 480],
  buttons: [560, 320],
  nav: [420, 460],
};

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome-stable",
    "/opt/pw-browsers/chromium/chrome-linux/chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  try {
    for (const dir of fs.readdirSync("/opt/pw-browsers")) {
      const c = path.join("/opt/pw-browsers", dir, "chrome-linux", "chrome");
      if (fs.existsSync(c)) return c;
    }
  } catch { /* none */ }
  return null;
}

if (!fs.existsSync(path.join(DIST, "index.html")) ||
    !fs.existsSync(path.join(DIST, "erazer.js"))) {
  console.error("no Erazer page — run: npm run erazer:web");
  process.exit(1);
}
if (!fs.existsSync(CLI)) {
  console.error("no erazer CLI — run: npm run erazer");
  process.exit(1);
}
if (!fs.existsSync(COMPONENTS)) {
  console.error("missing " + COMPONENTS);
  process.exit(1);
}

const chrome = findChrome();
if (!chrome) {
  console.error("no Chrome found — set CHROME_PATH");
  process.exit(1);
}

fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(ART, { recursive: true });

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};

function serve(root) {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent((req.url || "/").split("?")[0]);
    let file = path.join(root, rel === "/" ? "index.html" : rel);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!file.startsWith(root) || !fs.existsSync(file)) {
      res.writeHead(404); res.end("missing"); return;
    }
    const ext = path.extname(file);
    res.writeHead(200, { "Content-Type": TYPES[ext] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(fs.readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => {
    resolve({ server, port: server.address().port });
  }));
}

function runChrome(args, profile) {
  const dir = profile || path.join("/tmp/erazer-chrome", String(Date.now()) + "-" + Math.random().toString(16).slice(2));
  fs.mkdirSync(dir, { recursive: true });
  const flags = [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--no-first-run",
    "--no-default-browser-check",
    "--user-data-dir=" + dir,
    ...args,
  ];
  return new Promise((resolve, reject) => {
    const child = spawn(chrome, flags, {
      env: { ...process.env, HTTP_PROXY: "", HTTPS_PROXY: "", http_proxy: "", https_proxy: "", NO_PROXY: "*", no_proxy: "*" },
    });
    let out = "";
    let err = "";
    const kill = setTimeout(() => child.kill("SIGKILL"), 90000);
    child.stdout.on("data", (d) => { out += d; });
    child.stderr.on("data", (d) => { err += d; });
    child.on("close", (status) => {
      clearTimeout(kill);
      resolve({ stdout: out, stderr: err, status });
    });
    child.on("error", (error) => {
      clearTimeout(kill);
      reject(error);
    });
  });
}

function pngSize(file) {
  const buf = fs.readFileSync(file);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

async function screenshot(url, dest, w, h, budgetMs) {
  const abs = path.resolve(dest);
  const run = await runChrome([
    "--virtual-time-budget=" + String(budgetMs || 4000),
    "--window-size=" + w + "," + h,
    "--screenshot=" + abs,
    url,
  ]);
  if (!fs.existsSync(abs)) {
    throw new Error("chrome wrote no screenshot for " + url + "\n" + run.stderr.slice(-800));
  }
  return run;
}

const fixtureRoot = path.join(HERE, ".fixtures");
fs.mkdirSync(fixtureRoot, { recursive: true });
fs.copyFileSync(COMPONENTS, path.join(fixtureRoot, "index.html"));

const fx = await serve(fixtureRoot);
const results = [];
try {
  for (const name of NAMES) {
    const [w, h] = SIZES[name] || [400, 300];
    const srcPng = path.join(SHOTS, `${name}.png`);
    await screenshot(`http://127.0.0.1:${fx.port}/?shot=${name}`, srcPng, w, h, 2000);
    const jsonPath = path.join(SHOTS, `${name}.evg.json`);
    const overlayPath = path.join(SHOTS, `${name}.overlay.svg`);
    const outline = execFileSync(process.execPath, [
      CLI, srcPng, jsonPath, "--overlay", overlayPath, "--outline",
    ], { cwd: ROOT, encoding: "utf8" });
    fs.writeFileSync(path.join(SHOTS, `${name}.outline.txt`), outline);
    results.push({ name, srcPng, overlayPath, outline });
    process.stdout.write(`  ${name}  ${pngSize(srcPng).w}x${pngSize(srcPng).h}\n${outline.split("\n").slice(0, 10).join("\n")}\n`);
  }
} finally {
  fx.server.close();
}

for (const r of results) {
  const svg = fs.readFileSync(r.overlayPath, "utf8");
  const size = pngSize(r.srcPng);
  const html = `<!doctype html><html><head><meta charset="utf-8">
<style>
  html, body { margin: 0; background: #12151b; }
  .stage { position: relative; display: inline-block; }
  .stage img { display: block; }
  .stage svg { position: absolute; left: 0; top: 0; pointer-events: none; }
</style></head><body>
<div class="stage"><img src="${path.basename(r.srcPng)}" alt="">${svg}</div>
</body></html>`;
  fs.writeFileSync(path.join(SHOTS, `${r.name}.overlay.html`), html);
}

const gallery = `<!doctype html><html><head><meta charset="utf-8">
<style>
  body { margin: 0; background: #12151b; color: #e8ecf4; font: 14px/1.4 system-ui, sans-serif; }
  h1 { font-size: 22px; margin: 0 0 6px; }
  .lead { color: #97a1b4; margin: 0 0 16px; max-width: 80ch; }
  .wrap { padding: 22px 22px 28px; }
  .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
  .card { background: #171b23; border: 1px solid #2a3040; border-radius: 10px; overflow: hidden; }
  .head { padding: 7px 10px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #97a1b4; border-bottom: 1px solid #2a3040; }
  .stage { background: #e8ecf0; position: relative; }
  .stage img { display: block; width: 100%; height: auto; }
  .stage svg { position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; }
</style></head><body><div class="wrap">
<h1>Erazer on HTML UI components</h1>
<p class="lead">Real HTML/CSS widgets (form, tabs, menu, dialog, toolbar, buttons, nav). Coloured boxes are what Erazer guessed.</p>
<div class="grid">
${results.map((r) => {
  const svg = fs.readFileSync(r.overlayPath, "utf8");
  const png = path.basename(r.srcPng);
  return `<div class="card"><div class="head">${r.name}</div>
    <div class="stage"><img src="${png}" alt="${r.name}">${svg}</div></div>`;
}).join("\n")}
</div></div></body></html>`;
fs.writeFileSync(path.join(SHOTS, "gallery.html"), gallery);

const review = `<!doctype html><html><head><meta charset="utf-8">
<style>
  body { margin: 0; background: #12151b; color: #e8ecf4; font: 14px/1.4 system-ui, sans-serif; }
  h1 { font-size: 22px; margin: 0 0 8px; }
  .lead { color: #97a1b4; margin: 0 0 24px; max-width: 70ch; }
  .grid { display: flex; flex-direction: column; gap: 28px; padding: 28px; }
  .pair { display: grid; grid-template-columns: auto 1fr; gap: 18px; align-items: start; }
  .card { background: #171b23; border: 1px solid #2a3040; border-radius: 10px; overflow: hidden; }
  .head { padding: 8px 12px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #97a1b4; border-bottom: 1px solid #2a3040; }
  .stage { background: #e8ecf0; padding: 12px; position: relative; display: inline-block; }
  .stage img { display: block; }
  .stage svg { position: absolute; left: 12px; top: 12px; pointer-events: none; }
  pre { margin: 0; padding: 12px; font: 11px/1.4 ui-monospace, monospace; color: #8fd39a; white-space: pre-wrap; max-height: 280px; overflow: auto; }
</style></head><body><div class="grid">
<h1>Erazer on HTML UI components</h1>
<p class="lead">Each fixture is a real HTML/CSS widget (form, tabs, menu, dialog, toolbar, nav). The overlay is what Erazer guessed: nested boxes, widget class, text size and colour.</p>
${results.map((r) => {
  const svg = fs.readFileSync(r.overlayPath, "utf8");
  const png = path.basename(r.srcPng);
  const tree = fs.readFileSync(path.join(SHOTS, `${r.name}.outline.txt`), "utf8")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<div class="pair">
    <div class="card"><div class="head">${r.name} · source + overlay</div>
      <div class="stage"><img src="${png}" alt="${r.name}">${svg}</div>
    </div>
    <div class="card"><div class="head">widget tree</div><pre>${tree}</pre></div>
  </div>`;
}).join("\n")}
</div></body></html>`;
fs.writeFileSync(path.join(SHOTS, "review.html"), review);

const rev = await serve(SHOTS);
try {
  for (const r of results) {
    const size = pngSize(r.srcPng);
    await screenshot(
      `http://127.0.0.1:${rev.port}/${r.name}.overlay.html`,
      path.join(SHOTS, `${r.name}-overlay.png`),
      Math.max(size.w + 80, 480),
      Math.max(size.h + 120, 320),
      1500,
    );
  }
  await screenshot(
    `http://127.0.0.1:${rev.port}/gallery.html`,
    path.join(SHOTS, "html-components.png"),
    1280,
    860,
    3000,
  );
} finally {
  rev.server.close();
}

for (const name of NAMES) {
  const src = path.join(SHOTS, `${name}.png`);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(DIST, `${name}.png`));
}

const demo = await serve(DIST);
try {
  await screenshot(`http://127.0.0.1:${demo.port}/`, path.join(SHOTS, "demo.png"), 1280, 860, 3000);
  for (const [q, name] of [
    ["sample=form", "demo-form"],
    ["sample=tabs", "demo-tabs"],
    ["sample=menu", "demo-menu"],
    ["sample=icon", "demo-icon"],
    ["png=login.png", "demo-html-login"],
    ["png=tabs.png", "demo-html-tabs"],
    ["png=dialog.png", "demo-html-dialog"],
    ["png=toolbar.png", "demo-html-toolbar"],
    ["png=nav.png", "demo-html-nav"],
  ]) {
    await screenshot(
      `http://127.0.0.1:${demo.port}/?${q}`,
      path.join(SHOTS, name + ".png"),
      1280,
      860,
      8000,
    );
    process.stdout.write("  shot " + name + "\n");
  }
} finally {
  demo.server.close();
}

fs.rmSync(fixtureRoot, { recursive: true, force: true });

for (const f of fs.readdirSync(SHOTS)) {
  if (!f.endsWith(".png")) continue;
  fs.copyFileSync(path.join(SHOTS, f), path.join(ART, "erazer-" + f));
}

console.log("Wrote shots to " + path.relative(ROOT, SHOTS));
