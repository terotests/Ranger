#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// What a UI test costs in a browser, and what the same test costs with no
// browser at all.
//
//   npm run ui:runner:bench
//   node gallery/ui/bench/runner-vs-browser.mjs [--tests 20] [--json] [--no-browser]
//
// `ui-bench.mjs` beside this file answers "which phase of a frame do I fix".
// This one answers a different question: an e2e suite is usually Playwright,
// and an EVG app can be driven in-process instead — by how much, and where
// does the difference actually come from.
//
// WHAT THE BROWSER HALF MEASURES, AND WHAT IT DOES NOT. It drives Chromium
// over raw CDP against a page holding one canvas and a `__ready` flag. No
// Playwright, no framework, no application. That is deliberate: it is the
// FLOOR — the part of a browser test that is charged before your app has done
// anything, and that no amount of tuning removes. A real Playwright test pays
// this plus its driver process, its selector engine, its actionability polling
// and the app's own boot, so treat every browser number here as generous to
// the browser.
//
// WHAT THE RUNNER HALF MEASURES. The same twenty tests against real demo
// apps: a fresh instance per test (isolation), `init` with the real
// stylesheet, then five interactions, each followed by three assertions read
// off the three channels a host already reads — the display list, the
// accessible tree, and the hit test.
//
// The asymmetry that makes the comparison honest: the browser's per-test cost
// is a constant you cannot optimise, and the runner's is YOUR APP'S FRAME.
// A cheap page beats the floor by an order of magnitude. A page that rebuilds
// a chart runtime on every frame does not beat it at all — which is a finding
// about the page, not about the method, and `perCall` below is where it shows.

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);

const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};
const TESTS = Number(arg("--tests", "20"));
const AS_JSON = argv.includes("--json");
const NO_BROWSER = argv.includes("--no-browser");

const t = () => Number(process.hrtime.bigint()) / 1e6;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const avg = (n, f) => { const a = t(); for (let i = 0; i < n; i++) f(i); return (t() - a) / n; };
const ms = (v) => (v < 1 ? v.toFixed(3) : v.toFixed(v < 10 ? 2 : 1));

// --- the apps ---------------------------------------------------------------
// Two on purpose, and they bracket the answer: a transcript that rebuilds
// cheaply, and a dashboard that rebuilds a table and a Vega chart every frame.

const APPS = [
  { name: "MessageDemo",   mod: "gallery/ui/bin/MessageDemo.cjs",
    css: "gallery/ui/demo/message.css",   ctor: "MessageDemo",
    hover: ["msg-1", "msg-2", "msg-3"] },
  { name: "DashboardDemo", mod: "gallery/ui/bin/DashboardDemo.cjs",
    css: "gallery/ui/demo/dashboard.css", ctor: "DashboardDemo",
    hover: ["card-0", "card-1", "card-2"] },
];

function loadApp(a) {
  const p = path.join(ROOT, a.mod);
  if (!fs.existsSync(p)) {
    console.error(`missing ${a.mod} — run: npm run ui:demo:build`);
    process.exit(1);
  }
  const t0 = t();
  const M = require(p);
  const loadMs = t() - t0;
  const CSS = fs.readFileSync(path.join(ROOT, a.css), "utf8");
  return { M, CSS, loadMs };
}

// One interaction and its three assertions. `hitIdCached` where the app has it,
// because `hitId` re-renders the whole page before testing a point and the
// difference between the two is most of what a dashboard test costs.
function step(d, a, i) {
  d.setHover(a.hover[i % a.hover.length]);
  if (d.tick) d.tick(16);
  const list = d.displayListJson();
  const a11y = d.a11yJson(i + 1, "");
  const hit = d.hitIdCached ? d.hitIdCached(100, 40) : d.hitId(100, 40);
  return list.length + a11y.length + hit.length;
}

function runner(a) {
  const { M, CSS, loadMs } = loadApp(a);
  const fresh = () => { const d = new M[a.ctor](); d.init(CSS); d.displayListJson(); return d; };

  const warm = fresh();
  const perCall = {
    boot: avg(20, () => fresh()),
    frame: avg(50, () => warm.displayListJson()),
    a11y: avg(50, (i) => warm.a11yJson(i + 1, "")),
    hit: avg(50, () => warm.hitId(100, 40)),
    hitCached: warm.hitIdCached ? avg(50, () => warm.hitIdCached(100, 40)) : null,
  };

  let sink = 0;
  const t0 = t();
  for (let k = 0; k < TESTS; k++) {
    const d = fresh();
    for (let i = 0; i < 5; i++) sink += step(d, a, i);
  }
  const runMs = t() - t0;
  return { app: a.name, loadMs, perTestMs: runMs / TESTS, totalMs: loadMs + runMs, perCall, sink: sink > 0 };
}

// --- the browser floor ------------------------------------------------------

const PAGE = `<!doctype html><meta charset=utf-8><title>floor</title>
<style>body{margin:0}#c{width:1240px;height:560px;background:#111}</style>
<canvas id=c width=1240 height=560></canvas>
<script>
  const ctx = document.getElementById('c').getContext('2d');
  ctx.fillStyle = '#2f2f33'; ctx.fillRect(20, 20, 200, 40);
  window.__ready = true; window.__n = 0;
  document.addEventListener('click', () => { window.__n++; });
</script>`;

function findChromium() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  const cands = [];
  if (fs.existsSync(base)) {
    for (const d of fs.readdirSync(base)) {
      cands.push(path.join(base, d, "chrome-linux", "headless_shell"));
      cands.push(path.join(base, d, "chrome-linux", "chrome"));
      cands.push(path.join(base, d, "Chromium.app", "Contents", "MacOS", "Chromium"));
    }
  }
  cands.push("/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome");
  return cands.find((c) => fs.existsSync(c)) || null;
}

async function browserFloor(chrome) {
  const srv = http.createServer((q, s) => { s.writeHead(200, { "content-type": "text/html" }); s.end(PAGE); });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const PORT = srv.address().port;
  const CDP = 9400 + (process.pid % 100);
  const profile = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "evgbench-"));

  const t0 = t();
  const proc = spawn(chrome, [
    "--headless", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage",
    `--remote-debugging-port=${CDP}`, `--user-data-dir=${profile}`, "about:blank",
  ], { stdio: "ignore" });

  let ver = null;
  for (let i = 0; i < 2000 && !ver; i++) {
    try { const r = await fetch(`http://127.0.0.1:${CDP}/json/version`); if (r.ok) ver = await r.json(); } catch {}
    if (!ver) await sleep(5);
  }
  if (!ver) { proc.kill(); srv.close(); throw new Error("chromium did not open a devtools endpoint"); }
  const launchMs = t() - t0;

  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (m) => {
    const g = JSON.parse(m.data);
    if (g.id && pending.has(g.id)) { pending.get(g.id)(g); pending.delete(g.id); }
  });
  const send = (method, params = {}, sessionId) => new Promise((res) => {
    const i = ++id; pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) }));
  });

  const openPage = async () => {
    const { result: tgt } = await send("Target.createTarget", { url: "about:blank" });
    const { result: att } = await send("Target.attachToTarget", { targetId: tgt.targetId, flatten: true });
    await send("Page.enable", {}, att.sessionId);
    await send("Runtime.enable", {}, att.sessionId);
    return { targetId: tgt.targetId, S: att.sessionId };
  };
  const gotoReady = async (S) => {
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/` }, S);
    for (;;) {
      const r = await send("Runtime.evaluate", { expression: "window.__ready === true", returnByValue: true }, S);
      if (r.result?.result?.value === true) return;
      await sleep(2);
    }
  };

  // the per-call costs, on one page
  const one = await openPage();
  await gotoReady(one.S);
  const N = 100;
  let a = t();
  for (let i = 0; i < N; i++) await send("Runtime.evaluate", { expression: "window.__n", returnByValue: true }, one.S);
  const evaluateMs = (t() - a) / N;
  await send("DOM.enable", {}, one.S);
  a = t();
  for (let i = 0; i < N; i++) {
    const doc = await send("DOM.getDocument", { depth: 1 }, one.S);
    await send("DOM.querySelector", { nodeId: doc.result.root.nodeId, selector: "#c" }, one.S);
  }
  const domQueryMs = (t() - a) / N;
  a = t();
  for (let i = 0; i < N; i++) {
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: 100, y: 40, button: "left", clickCount: 1 }, one.S);
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: 100, y: 40, button: "left", clickCount: 1 }, one.S);
  }
  const clickMs = (t() - a) / N;
  a = t();
  for (let i = 0; i < 20; i++) await send("Page.captureScreenshot", { format: "png" }, one.S);
  const screenshotMs = (t() - a) / 20;
  await send("Target.closeTarget", { targetId: one.targetId });

  // the suite: a fresh page per test, five clicks and five assertions each
  const tS = t();
  for (let k = 0; k < TESTS; k++) {
    const p = await openPage();
    await gotoReady(p.S);
    for (let i = 0; i < 5; i++) {
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x: 100, y: 40, button: "left", clickCount: 1 }, p.S);
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: 100, y: 40, button: "left", clickCount: 1 }, p.S);
      await send("Runtime.evaluate", { expression: "window.__n", returnByValue: true }, p.S);
    }
    await send("Target.closeTarget", { targetId: p.targetId });
  }
  const runMs = t() - tS;

  ws.close(); proc.kill(); srv.close();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  return { launchMs, perTestMs: runMs / TESTS, totalMs: launchMs + runMs,
           perCall: { evaluateMs, domQueryMs, clickMs, screenshotMs } };
}

// --- run --------------------------------------------------------------------

const out = { tests: TESTS, node: process.version, runner: APPS.map(runner) };

if (!NO_BROWSER) {
  const chrome = findChromium();
  if (!chrome) {
    out.browser = { skipped: "no chromium found (set PLAYWRIGHT_BROWSERS_PATH)" };
  } else {
    out.browserBinary = chrome;
    try { out.browser = await browserFloor(chrome); }
    catch (e) { out.browser = { skipped: String(e.message) }; }
  }
} else {
  out.browser = { skipped: "--no-browser" };
}

if (AS_JSON) {
  console.log(JSON.stringify(out, null, 2));
} else {
  console.log(`\n${TESTS} tests, each: fresh instance/page, 5 interactions, 5 assertions\n`);
  console.log("  target                      start-up      per test      suite total");
  console.log("  ------------------------------------------------------------------");
  for (const r of out.runner) {
    console.log(`  EVG runner / ${r.app.padEnd(15)}${ms(r.loadMs).padStart(8)} ms  ${ms(r.perTestMs).padStart(8)} ms  ${ms(r.totalMs).padStart(9)} ms`);
  }
  if (out.browser?.perTestMs) {
    const b = out.browser;
    console.log(`  ${"Chromium floor (no app)".padEnd(28)}${ms(b.launchMs).padStart(8)} ms  ${ms(b.perTestMs).padStart(8)} ms  ${ms(b.totalMs).padStart(9)} ms`);
    console.log("\n  per call");
    console.log(`    browser: evaluate ${ms(b.perCall.evaluateMs)} ms · DOM query ${ms(b.perCall.domQueryMs)} ms · click ${ms(b.perCall.clickMs)} ms · screenshot ${ms(b.perCall.screenshotMs)} ms`);
  } else {
    console.log(`\n  browser half skipped: ${out.browser?.skipped}`);
  }
  for (const r of out.runner) {
    const c = r.perCall;
    console.log(`    ${r.app}: boot ${ms(c.boot)} ms · frame ${ms(c.frame)} ms · a11y ${ms(c.a11y)} ms · hit ${ms(c.hit)} ms` +
      (c.hitCached === null ? "" : ` · hit(cached) ${ms(c.hitCached)} ms`));
  }
  if (out.browser?.perTestMs) {
    console.log("\n  ratio, per test");
    for (const r of out.runner) {
      const x = out.browser.perTestMs / r.perTestMs;
      console.log(`    ${r.app.padEnd(16)} ${x >= 1 ? x.toFixed(1) + "x faster than the browser floor" : (1 / x).toFixed(1) + "x SLOWER than the browser floor — see per-call above"}`);
    }
  }
  console.log("\n  The browser column is a floor: one canvas, no framework, no app.");
  console.log("  A real Playwright test pays this plus its driver, its selector");
  console.log("  engine, its auto-waiting and the app's own boot.\n");
}
