#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Drive the Erazer live page in a real browser and check the layout lab.
//
//   node gallery/erazer/web/build.mjs && node gallery/erazer/web/lab-check.mjs
//
// WHY THIS EXISTS. `smoke.mjs` runs the bundle in `vm` and proves the exports
// are there. Everything the lab is FOR happens outside that: IndexedDB, an
// HTML fixture rendered and measured, `foreignObject` rasterised to a canvas,
// and a training run that ends by writing weights the page keeps. None of it
// is reachable from Node.
//
// It was not a hypothetical gap. The first version of the lab trained a fresh
// random net on the eight HTML fixtures and adopted the result: a four-label
// column that the shipped model called `list` at 91% came back `nav` at 100%,
// and the eight synthetic archetypes fell from 8/8 to 2/8 — saved to
// IndexedDB and localStorage, so one click degraded the page until the user
// cleared site data. Every Node assertion passed through all of it.
//
// So: build the test set the way the button does, train the way the button
// does, and fail if the model that comes out is worse than the one that went
// in.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { requireHostTool, findChromium } from "../../ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = process.argv[2] ? path.resolve(process.argv[2]) : path.join(HERE, "dist");

if (!fs.existsSync(path.join(DIST, "erazer.js"))) {
  console.error("dist missing — run `node gallery/erazer/web/build.mjs` first");
  process.exit(3);
}

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".png": "image/png",
  ".svg": "image/svg+xml",
};
const server = createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  // The browser asks for a favicon the page never declares; a 404 for it is
  // the browser's habit, not the page's defect, and this check fails on any
  // console error.
  if (rel === "/favicon.ico") {
    res.writeHead(204).end();
    return;
  }
  const file = path.join(DIST, rel === "/" ? "index.html" : rel.slice(1));
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" })
    .end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const { chromium } = requireHostTool("playwright-core");
// The flags ask for WebGPU over SwiftShader where the runner can give it. It
// is not required: `trainOnDemand` falls back to the CPU path, and this check
// asserts the OUTCOME, not which device produced it.
const browser = await chromium.launch({
  executablePath: findChromium(),
  args: ["--enable-unsafe-webgpu", "--use-angle=swiftshader", "--enable-features=Vulkan"],
});
const page = await browser.newPage();

const problems = [];
page.on("pageerror", (e) => problems.push(`uncaught: ${e.message.split("\n")[0]}`));
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`console.error: ${m.text().split("\n")[0]}`);
});
page.on("requestfailed", (r) => problems.push(`request failed: ${r.url()}`));

let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) console.log("  PASS " + name);
  else { failed++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};

// The eight archetypes the Ranger net seeds itself from. They are the floor:
// whatever the lab learns from HTML, a vertical column of labels is still a
// list and three panels in a row are still a grid.
const ARCHETYPES = `(() => {
  const net = ErazerLayoutNet.shared();
  const cases = [
    ["list", net.synthList(4, 16)], ["list", net.synthList(6, 16)],
    ["form", net.synthForm(16)], ["toolbar", net.synthToolbar(4, 16)],
    ["nav", net.synthNav(16)], ["property_row", net.synthRows(16)],
    ["grid", net.synthGrid(16)], ["card", net.synthCard(16)]
  ];
  const wrong = [];
  for (const [want, boxes] of cases) {
    const p = net.predict(boxes);
    if (p.type !== want) wrong.push(want + "->" + p.type);
  }
  return { ok: cases.length - wrong.length, n: cases.length, wrong };
})()`;

console.log("--- the page loads ---");
await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "load" });
ok("no error on first paint", problems.length === 0, [...new Set(problems)].join("; "));
const before = await page.evaluate(ARCHETYPES);
ok("the shipped model names every archetype", before.ok === before.n, before.wrong.join(","));

console.log("--- the HTML test set builds ---");
await page.click("#buildSetBtn");
await page.waitForFunction(() => document.documentElement.hasAttribute("data-lab-done"), null,
  { timeout: 120000 }).catch(() => {});
ok("the capture finished", (await page.getAttribute("html", "data-lab-done")) === "1",
  (await page.textContent("#layoutOut")).split("\n").slice(-3).join(" | "));
const set = await page.evaluate(async () => {
  const s = await ErazerLayoutLab.listSamples();
  const by = {};
  for (const x of s) by[x.source] = (by[x.source] || 0) + 1;
  return { n: s.length, by, labels: [...new Set(s.map((x) => x.label))].sort() };
});
ok("enough samples to train", set.n >= 8, JSON.stringify(set));
// Both halves matter: the DOM boxes are the ground truth, the Erazer boxes are
// what the page will actually see at prediction time. A run that silently lost
// the rasteriser would still reach eight samples on the DOM half alone.
ok("both the DOM and the Erazer half recorded", set.by.dom > 0 && set.by.erazer > 0,
  JSON.stringify(set.by));
ok("the capture log survived the run",
  (await page.textContent("#layoutOut")).includes("1/3 renderöidään"));
ok("no error while capturing", problems.length === 0, [...new Set(problems)].join("; "));

console.log("--- training does not make the model worse ---");
problems.length = 0;
await page.click("#trainGpuBtn");
await page.waitForFunction(() => document.documentElement.hasAttribute("data-lab-trained"), null,
  { timeout: 180000 }).catch(() => {});
const run = await page.evaluate(() => ({
  backend: document.documentElement.getAttribute("data-lab-trained"),
  adopted: document.documentElement.getAttribute("data-lab-adopted"),
  score: Number(document.documentElement.getAttribute("data-lab-score")),
  scoreBefore: Number(document.documentElement.getAttribute("data-lab-score-before")),
  core: Number(document.documentElement.getAttribute("data-lab-core")),
  coreBefore: Number(document.documentElement.getAttribute("data-lab-core-before")),
}));
ok("a training run finished", !!run.backend, JSON.stringify(run));
ok("it scored at least as well as the model it replaced", run.score >= run.scoreBefore,
  run.scoreBefore + " -> " + run.score);
ok("and it kept the archetypes it started with", run.core >= run.coreBefore,
  run.coreBefore + " -> " + run.core);
ok("and it was adopted", run.adopted === "1", JSON.stringify(run));
const after = await page.evaluate(ARCHETYPES);
ok("the archetypes still hold after training", after.ok === after.n, after.wrong.join(","));
ok("no error while training", problems.length === 0, [...new Set(problems)].join("; "));

console.log("--- the trained weights round-trip ---");
const trip = await page.evaluate(() => {
  const dump = ErazerLayoutNet.shared().dumpWeights();
  const fresh = new ErazerLayoutNet();
  if (!fresh.loadWeights(dump)) return { loaded: false };
  const boxes = ErazerLayoutNet.shared().synthList(4, 16);
  return {
    loaded: true,
    same: fresh.predict(boxes).type === ErazerLayoutNet.shared().predict(boxes).type,
    stored: (localStorage.getItem("erazer-layout-weights") || "").slice(0, 2) === "v1",
  };
});
ok("a dump of the trained net loads back", trip.loaded && trip.same, JSON.stringify(trip));
ok("and the page kept it", trip.stored === true, JSON.stringify(trip));

await browser.close();
server.close();

console.log(failed ? `\nerazer lab check FAILED (${failed})` : "\nerazer lab check ok");
process.exit(failed ? 1 : 0);
