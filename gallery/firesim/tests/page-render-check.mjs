#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The console page, in a real browser.
//
//   npm run firesim:demo:frame
//
// `console-check.mjs` drives the app with no browser and asserts on the tree
// it builds. That check cannot see the one failure a page has and an app does
// not: a script that 404s, a module that will not parse, a WebGL context that
// is never created, an accessibility mirror that is never attached. Three
// wiring defects of exactly that kind survived every Node assertion in
// `gallery/ui` while its page was dead, which is why that suite exists and
// why this one does.
//
// It needs `playwright-core` and a Chromium. Without them it SKIPS loudly
// rather than passing quietly — a gate that reports success when it did not
// run is worse than no gate.

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEMO = path.join(HERE, "..", "demo");
const require_ = createRequire(import.meta.url);

let chromium;
try {
  ({ chromium } = require_("playwright-core"));
} catch {
  process.stdout.write("\n  playwright-core is not installed — the browser gate is SKIPPED\n");
  process.stdout.write("    npm i -D playwright-core && npx playwright-core install chromium\n\n");
  process.exit(0);
}

for (const name of ["generated-host.js", "generated.js", "evg/gl/evg-webgl.js"]) {
  if (!fs.existsSync(path.join(DEMO, name))) {
    console.error(`the page is not built — run \`npm run firesim:demo:page\` first (${name} is missing)`);
    process.exit(3);
  }
}

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const server = http.createServer((req, res) => {
  const name = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const file = path.join(DEMO, path.normalize(name).replace(/^(\.\.[/\\])+/, ""));
  if (!file.startsWith(DEMO) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream" });
  res.end(fs.readFileSync(file));
});
await new Promise((done) => server.listen(0, done));
const URL_BASE = `http://127.0.0.1:${server.address().port}`;

let passed = 0;
const failures = [];
const ok = (name, cond, detail) => (cond ? (passed += 1) : failures.push(`${name}${detail ? `\n      ${detail}` : ""}`));

let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.RANGER_CHROMIUM || undefined,
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
  });
} catch (e) {
  process.stdout.write(`\n  Chromium would not launch — the browser gate is SKIPPED\n    ${String(e).split("\n")[0]}\n\n`);
  await new Promise((done) => server.close(done));
  process.exit(0);
}

const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
const problems = [];
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`console: ${m.text()}`);
});
page.on("requestfailed", (r) => problems.push(`request failed: ${r.url()}`));
// A 404 for anything the page asked for. The browser reports it only as a
// console line with no URL in it, so the response is watched instead — a
// missing module and a missing icon look identical from the console and are
// very different problems.
page.on("response", (r) => {
  if (r.status() >= 400) problems.push(`${r.status()} ${r.url()}`);
});

await page.goto(`${URL_BASE}/`, { waitUntil: "load" });
await page.waitForFunction(() => !!window.__lastA11y, null, { timeout: 15000 });

ok("the page loads with nothing in the console", problems.length === 0, problems.join("\n      "));
ok("the app's error line is empty", (await page.textContent("#err")) === "", await page.textContent("#err"));

// The pixels: a WebGL 2 context, and a framebuffer that is not one flat
// colour. A page that threw after clearing draws a uniform rectangle and
// every DOM assertion above still passes.
const painted = await page.evaluate(() => {
  const c = document.getElementById("c");
  const gl = c.getContext("webgl2", { preserveDrawingBuffer: true });
  if (!gl) return { ok: false, why: "no webgl2" };
  const w = c.width;
  const h = c.height;
  const px = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const seen = new Set();
  for (let i = 0; i < px.length; i += 4 * 997) seen.add(`${px[i]},${px[i + 1]},${px[i + 2]}`);
  return { ok: true, colours: seen.size, w, h };
});
ok("there is a WebGL 2 context", painted.ok, painted.why);
ok("the frame is a drawing and not one flat colour", painted.colours > 4, JSON.stringify(painted));
ok("the canvas fills the window", painted.w >= 1280 && painted.h >= 800, JSON.stringify(painted));

// The accessibility mirror: real DOM over the canvas, which is the only thing
// a screen reader can read on a page that draws.
const mirrored = await page.evaluate(() => {
  const roles = {};
  for (const el of document.querySelectorAll("[role]")) {
    roles[el.getAttribute("role")] = (roles[el.getAttribute("role")] ?? 0) + 1;
  }
  return roles;
});
ok("the tree is mirrored into DOM", (mirrored.tab ?? 0) === 5, JSON.stringify(mirrored));
ok("…including the identity and dataset radios", (mirrored.radio ?? 0) === 6, JSON.stringify(mirrored));

// A real click at a real rectangle, and the app answers.
async function clickNamed(role, name) {
  const box = await page.evaluate(
    ([r, n]) => {
      const tree = JSON.parse(window.__lastA11y);
      const node = tree.nodes.find((x) => x.role === r && (x.name ?? "") === n);
      return node && node.b ? node.b : null;
    },
    [role, name],
  );
  if (!box) return false;
  await page.mouse.click(box[0] + box[2] / 2, box[1] + box[3] / 2);
  await page.waitForTimeout(120);
  return true;
}

// The browser walks the tree with real clicks.
ok("a collection is a click", await clickNamed("button", "products"));
await page.waitForTimeout(700);
ok("a document is a click", await clickNamed("button", "kb-87"));
await page.waitForTimeout(300);
const fields = await page.evaluate(() =>
  JSON.parse(window.__lastA11y).nodes.filter((n) => n.role === "cell").map((n) => n.name ?? ""),
);
ok("…and its fields are drawn with their types", fields.includes("timestamp") && fields.includes("array"), JSON.stringify(fields.slice(0, 12)));

ok("a click switches the view", await clickNamed("tab", "Rules"));
await page.waitForTimeout(300);
const grid = await page.evaluate(() =>
  JSON.parse(window.__lastA11y).nodes.filter((n) => n.role === "cell").map((n) => n.name ?? ""),
);
ok("…and the permission grid is drawn", grid.includes("signed out get products/kb-87: allowed"), JSON.stringify(grid.slice(0, 3)));

// The clock is really running: a write lands and the LISTENER reports it,
// in the browser, with nothing polling it but the frame loop.
await clickNamed("tab", "Data");
await clickNamed("radio", "root");
await page.waitForTimeout(900);
const before = await page.evaluate(() => window.__firesim.docCount());
await clickNamed("button", "Add a document");
await page.waitForTimeout(1500);
const after = await page.evaluate(() => window.__firesim.docCount());
const note = await page.evaluate(() => window.__firesim.noteText());
ok("a write lands through the listener, in the browser", after === before + 1 && note.includes("added"), `${before} → ${after}: ${note}`);

// And the dataset the host has to FETCH: 747 documents over the wire.
ok("the RealTrainer dataset is a click", await clickNamed("radio", "RealTrainer"));
await page.waitForTimeout(2500);
const loaded = await page.evaluate(() => ({ name: window.__firesim.datasetName(), n: window.__firesim.storeCount() }));
ok("…and the host fetched and loaded it", loaded.name === "RealTrainer" && loaded.n === 747, JSON.stringify(loaded));

// `--shots DIR` walks the four views and saves each — the pictures the README
// shows, taken from the page that is running rather than drawn by hand.
if (process.argv.includes("--shots")) {
  const dir = process.argv[process.argv.indexOf("--shots") + 1];
  fs.mkdirSync(dir, { recursive: true });
  const views = [
    ["Data", "data"],
    ["Query", "query"],
    ["Rules", "rules"],
    ["Users", "users"],
    ["Traffic", "traffic"],
  ];
  // Back to the sample dataset: the checks above left the RealTrainer one
  // loaded, and the pictures should show the thing the page opens on.
  await clickNamed("tab", "Data");
  await clickNamed("radio", "Sample");
  await page.waitForTimeout(900);
  await clickNamed("radio", "ada");
  await page.waitForTimeout(700);
  await clickNamed("button", "users");
  await page.waitForTimeout(700);
  await clickNamed("button", "uid-1");
  await page.waitForTimeout(400);
  for (const [name, file] of views) {
    await clickNamed("tab", name);
    if (file === "query") {
      await clickNamed("button", "Run");
      await page.waitForTimeout(700);
    }
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(dir, `firesim-console-${file}.png`) });
  }
  process.stdout.write(`  wrote ${views.length} screenshots into ${path.relative(process.cwd(), dir)}\n`);
}

if (process.argv.includes("--png")) {
  const out = process.argv[process.argv.indexOf("--png") + 1] ?? path.join(DEMO, "shots", "firesim-console.png");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out });
  process.stdout.write(`  wrote ${path.relative(process.cwd(), out)}\n`);
}

ok("nothing went wrong while it was driven", problems.length === 0, problems.join("\n      "));

await browser.close();
await new Promise((done) => server.close(done));

process.stdout.write(`\n  ${passed} passed`);
if (failures.length) {
  process.stdout.write(`, ${failures.length} FAILED\n\n`);
  for (const f of failures) process.stdout.write(`  ✗ ${f}\n`);
  process.stdout.write("\n");
  process.exit(1);
}
process.stdout.write(", 0 failed\n\n  ALL PASS\n\n");
