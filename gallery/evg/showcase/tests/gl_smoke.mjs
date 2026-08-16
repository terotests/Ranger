/**
 * gl_smoke.mjs — does the WebGL viewer actually draw the pages?
 *
 *   node gallery/evg/showcase/tests/gl_smoke.mjs [dist]
 *
 * The PDF and PNG targets have suites that would have caught a missing shape;
 * the GPU backend had none, and a page of charts came out as bare text — every
 * path silently dropped, because the display list had no path commands and the
 * viewer had nothing to draw them with. This asserts what that failure looked
 * like: how many paths each page draws, and that none were skipped.
 *
 * Needs a built showcase (`npm run showcase`) and Playwright. Without
 * Playwright it says so and exits 0, the way the Vela parity harness does —
 * a silent skip would read as a pass.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../../..");
const DIST = path.resolve(process.argv[2] || path.join(HERE, "..", "dist"));

// What each page must draw. A page that draws fewer paths than this has lost
// geometry, which is exactly the regression this file exists for.
const EXPECT = [
  { list: "charts-editorial.json", minPaths: 40, minText: 40 },
  { list: "charts-autumn.json", minPaths: 40, minText: 40 },
  { list: "plots-editorial.json", minPaths: 40, minText: 60 },
  { list: "plots-studio.json", minPaths: 40, minText: 60 },
  { list: "more-editorial.json", minPaths: 40, minText: 60 },
  { list: "views-editorial.json", minPaths: 20, minText: 40 },
  { list: "variants-editorial.json", minPaths: 40, minText: 60 },
  { list: "tables-editorial.json", minPaths: 10, minText: 20 },
  { list: "drawing-editorial.json", minPaths: 20, minText: 30 },
  { list: "vector-editorial.json", minPaths: 8, minText: 5 },
  { list: "album-editorial.json", minPaths: 0, minText: 3, minImages: 4 },
];

function loadPlaywright() {
  const anchors = [
    "/opt/node22/lib/node_modules/x",
    path.join(ROOT, "package.json"),
    path.join(process.cwd(), "package.json"),
    import.meta.url,
  ];
  for (const anchor of anchors) {
    for (const name of ["playwright", "playwright-core"]) {
      try {
        return createRequire(anchor)(name);
      } catch { /* try the next anchor */ }
    }
  }
  return null;
}

const pw = loadPlaywright();
if (!pw) {
  console.log("Playwright is not available — the WebGL viewer was not checked.");
  process.exit(0);
}
if (!fs.existsSync(path.join(DIST, "gl", "view.html"))) {
  console.error(`no build in ${path.relative(ROOT, DIST)} — run: npm run showcase`);
  process.exit(1);
}

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png" };
const server = http.createServer((req, res) => {
  const file = path.join(DIST, req.url.split("?")[0]);
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

// SwiftShader, because CI has no GPU. It is a software rasterizer for the same
// GL calls, so it exercises every code path a real driver would.
const browser = await pw.chromium.launch({
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});

let failed = 0;
for (const want of EXPECT) {
  const page = await browser.newPage({ viewport: { width: 700, height: 950 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${port}/gl/view.html?list=${want.list}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const s = await page.evaluate(() => window.__evgStats || null);
  await page.close();

  const problems = [];
  if (!s) problems.push("the viewer reported no stats at all");
  else {
    if (s.error) problems.push(s.error);
    if ((s.paths || 0) < want.minPaths) problems.push(`${s.paths || 0} paths, expected at least ${want.minPaths}`);
    if ((s.textRuns || 0) < want.minText) problems.push(`${s.textRuns || 0} text runs, expected at least ${want.minText}`);
    if (want.minImages && (s.images || 0) < want.minImages) problems.push(`${s.images || 0} images, expected ${want.minImages}`);
    if (s.skippedFills) problems.push(`${s.skippedFills} fills skipped — the context has no stencil buffer`);
    if (s.missingImages) problems.push(`${s.missingImages} images could not be loaded`);
  }
  for (const e of errors.slice(0, 3)) problems.push("console: " + e);

  if (problems.length) {
    failed += 1;
    console.log(`  FAIL ${want.list}`);
    for (const p of problems) console.log(`       ${p}`);
  } else {
    console.log(`  ok   ${want.list}: ${s.drawn} quads, ${s.paths} paths, ${s.textRuns} text runs, ${s.images} images`);
  }
}

await browser.close();
server.close();
console.log(failed ? `\n${failed} page(s) failed` : `\n${EXPECT.length} pages drawn by the GPU backend`);
process.exit(failed ? 1 : 0);
