#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// WHEN THE VISITOR SEES SOMETHING, and when they can use it.
//
//   npm run rt:boot                 (after: npm run rt:page)
//   npm run rt:boot -- --fast       no throttling, for a local number
//
// The ladder in PLAN_WEB_LOADING.md S2 is stated in milliseconds, and a plan
// stated in milliseconds that nobody measures is a plan stated in adjectives.
// This drives the real page in Chromium over a throttled connection and takes
// two times, both of them from the browser's own clock:
//
//   first paint   — anything at all on the screen. With the baked picture in
//                   the document (web/snapshot.mjs) this is one round trip and
//                   owes nothing to the bundle.
//   first frame   — the app has PAINTED. `window.__lastStats` is written by a
//                   draw, so it is the first moment the picture on screen is
//                   the app's own rather than the build's.
//
// It runs the engine on the main thread and in a Worker, because which of
// those the deployed page should default to is a question with a number.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import zlib from "node:zlib";
import { requireDom, findChromium } from "../../ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
if (!fs.existsSync(path.join(HERE, "bundle.js"))) {
  console.error("bundle.js missing — run `npm run rt:page` first");
  process.exit(3);
}

const argv = process.argv.slice(2);
const FAST = argv.includes("--fast");
const RUNS = Number(argv[argv.indexOf("--runs") + 1]) || 3;
// A mid connection rather than a bad one: enough that bytes are visible in the
// number, not so little that everything is dominated by the same stall.
const MBPS = Number(argv[argv.indexOf("--mbps") + 1]) || 4;
const BYTES_PER_SEC = (MBPS * 1024 * 1024) / 8;
const LATENCY_MS = 60;
// And a phone's CPU. Parse and boot are most of what is being compared, and a
// desktop hides them.
const CPU_SLOWDOWN = 4;

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".cjs": "text/javascript", ".css": "text/css", ".json": "application/json",
};
// THE THROTTLE IS HERE, not in the browser. Chromium's own network emulation
// is attached to the page's target and a dedicated Worker's requests go around
// it — which made the Worker variant look four times faster than it is, on the
// same bytes. A server that hands out its bytes slowly cannot be gone around.
//
// Responses are gzipped, because that is what a real host serves and half of
// the point of these measurements is how many bytes are on the wire.
const CHUNK = 16 * 1024;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const server = createServer(async (req, res) => {
  const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = path.join(ROOT, rel.slice(1));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end("not found");
    return;
  }
  const type = TYPES[path.extname(file)] || "application/octet-stream";
  const raw = fs.readFileSync(file);
  const body = /text|json|javascript/.test(type) ? zlib.gzipSync(raw, { level: 6 }) : raw;
  const headers = { "content-type": type, "content-length": String(body.length) };
  if (body !== raw) headers["content-encoding"] = "gzip";
  if (!FAST) await sleep(LATENCY_MS);
  res.writeHead(200, headers);
  if (FAST) {
    res.end(body);
    return;
  }
  const perChunkMs = (CHUNK / BYTES_PER_SEC) * 1000;
  for (let i = 0; i < body.length; i += CHUNK) {
    res.write(body.subarray(i, i + CHUNK));
    await sleep(perChunkMs);
  }
  res.end();
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const { chromium } = requireDom("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });

/** One cold load, in a context of its own so nothing is cached from the last. */
async function once(query) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  // The CPU throttle DOES reach the worker (it is a renderer-wide setting);
  // the network one does not, which is why the server holds the bytes back.
  if (!FAST) await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_SLOWDOWN });
  const bytes = { total: 0 };
  page.on("response", async (r) => {
    const len = Number(r.headers()["content-length"] || 0);
    bytes.total += len;
  });
  const t0 = Date.now();
  await page.goto(`http://127.0.0.1:${port}/gallery/realtrainer/web/index.html${query}`, { waitUntil: "commit" });
  await page.waitForFunction("window.__lastStats !== undefined", null, { timeout: 120000 });
  const wall = Date.now() - t0;
  const paint = await page.evaluate(() => {
    const at = (name) => {
      const e = performance.getEntriesByType("paint").find((x) => x.name === name);
      return e ? Math.round(e.startTime) : null;
    };
    return {
      // `first-paint` is the baked picture: boxes of colour, which is a paint
      // and not "contentful". `first-contentful-paint` waits for the canvas.
      fp: at("first-paint"),
      fcp: at("first-contentful-paint"),
      frame: Math.round(performance.now()),
      timeline: performance.getEntriesByType("resource").map((r) => ({
        name: r.name.split("/").pop(),
        end: Math.round(r.responseEnd),
      })),
    };
  });
  await ctx.close();
  return { ...paint, wall, bytes: bytes.total };
}

const median = (xs) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];

console.log(
  FAST ? "no throttling" : `${MBPS} Mbps (served slowly, gzipped), ${LATENCY_MS} ms per request, ${CPU_SLOWDOWN}x CPU`,
  `— ${RUNS} runs each, 390x844`,
);
console.log("");
console.log("  variant                first paint   contentful   app painted    bytes");
for (const [name, query] of [
  ["engine on this thread", "?engine=main"],
  ["engine in a Worker", "?engine=worker"],
]) {
  const runs = [];
  for (let i = 0; i < RUNS; i += 1) runs.push(await once(query));
  const fp = median(runs.map((r) => r.fp ?? r.frame));
  const fcp = median(runs.map((r) => r.fcp ?? r.frame));
  const frame = median(runs.map((r) => r.frame));
  const kb = Math.round(median(runs.map((r) => r.bytes)) / 1024);
  console.log(
    `  ${name.padEnd(22)} ${String(fp + " ms").padStart(9)}   ${String(fcp + " ms").padStart(10)}   ${String(frame + " ms").padStart(9)}    ${kb} KB`,
  );
  if (argv.includes("--timeline")) {
    for (const r of runs[0].timeline) console.log(`      ${String(r.end + " ms").padStart(8)}  ${r.name}`);
  }
}

await browser.close();
server.close();
