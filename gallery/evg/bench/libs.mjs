/**
 * libs.mjs — Ranger against the libraries people actually use.
 *
 *   npm run evg:bench:libs
 *   node gallery/evg/bench/libs.mjs --marks 100,1000,10000 --updates 10
 *
 * The other benchmark in this directory asks which of EVG's own backends is
 * quickest. This one asks the question that decides whether any of it is worth
 * having: the same scatter plot, the same data, drawn by
 *
 *   vela-svg      Ranger — the Vela runtime and its SVG renderer
 *   evg-webgl     Ranger — the EVG layout, the display list, the WebGL viewer
 *   vega-svg      the reference implementation, SVG renderer
 *   vega-canvas   the reference implementation, canvas renderer
 *   chartjs       Chart.js, 2-D canvas, animation off
 *
 * measured twice over: from a specification and a data set to a picture, and
 * from new numbers to a new picture. Vela and Vega are given the SAME
 * Vega-Lite specification; Chart.js has no grammar, so it is handed the four
 * series directly, which is the fastest it goes.
 *
 * The libraries are installed on demand into gallery/evg/bench/.libs, which is
 * not checked in. Needs Playwright and the Vela web bundles (npm run vela:web).
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { renderLibsReport } from "./report.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const DIST = path.join(ROOT, "gallery/vela/web/dist");
const LIBS = path.join(HERE, ".libs");

const argv = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = argv.indexOf("--" + name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};
const MARKS = flag("marks", "100,300,1000,3000,10000,30000").split(",").map(Number);
const UPDATES = Number(flag("updates", "10"));
const FIRSTS = Number(flag("firsts", "3"));
const DPR = Number(flag("dpr", "1"));
const OUT = path.resolve(flag("out", path.join(HERE, "results")));
const SHOTS = argv.includes("--shots") ? path.join(OUT, "shots-libs") : null;
const SHOT_AT = Number(flag("shot-at", "1000"));

const IDS = ["vela-svg", "vela-svg-vg", "evg-webgl", "vega-svg", "vega-canvas", "chartjs"];

// The three libraries, fetched once into a directory of their own so the
// repository's own dependencies are not touched.
const NEEDED = [
  ["vega", "build/vega.min.js"],
  ["vega-lite", "build/vega-lite.min.js"],
  ["chart.js", "dist/chart.umd.js"],
];
if (NEEDED.some(([pkg, file]) => !fs.existsSync(path.join(LIBS, "node_modules", pkg, file)))) {
  console.log("installing vega, vega-lite and chart.js into gallery/evg/bench/.libs …");
  fs.mkdirSync(LIBS, { recursive: true });
  fs.writeFileSync(path.join(LIBS, "package.json"), '{"name":"evg-bench-libs","private":true}\n');
  try {
    execFileSync("npm", ["install", "--silent", "--no-audit", "--no-fund", "vega", "vega-lite", "chart.js"],
      { cwd: LIBS, stdio: "inherit" });
  } catch {
    console.error("could not install the libraries — this benchmark needs network access once.");
    process.exit(1);
  }
}
const version = (pkg) => JSON.parse(fs.readFileSync(path.join(LIBS, "node_modules", pkg, "package.json"), "utf8")).version;

if (!fs.existsSync(path.join(DIST, "vela_targets.js"))) {
  console.log("building the Vela web bundles first (npm run vela:web)…");
  execFileSync("bash", [path.join(ROOT, "gallery/vela/web/build.sh")], { cwd: ROOT, stdio: "inherit" });
}

function loadPlaywright() {
  for (const anchor of ["/opt/node22/lib/node_modules/x", path.join(ROOT, "package.json"), import.meta.url]) {
    for (const name of ["playwright", "playwright-core"]) {
      try { return createRequire(anchor)(name); } catch { /* next */ }
    }
  }
  return null;
}
const pw = loadPlaywright();
if (!pw) {
  console.log("Playwright is not available — nothing was measured.");
  process.exit(0);
}

// --------------------------------------------------------------------- serve --
const LIB_FILES = {
  "/lib/vega.min.js": path.join(LIBS, "node_modules/vega/build/vega.min.js"),
  "/lib/vega-lite.min.js": path.join(LIBS, "node_modules/vega-lite/build/vega-lite.min.js"),
  "/lib/chart.umd.js": path.join(LIBS, "node_modules/chart.js/dist/chart.umd.js"),
};
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".ttf": "font/ttf", ".png": "image/png" };
const server = http.createServer((req, res) => {
  const name = decodeURIComponent(req.url.split("?")[0]);
  const file = LIB_FILES[name] || (name === "/" || name === "/libs.html"
    ? path.join(HERE, "libs.html")
    : path.join(DIST, name));
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;

// ------------------------------------------------------------------- browser --
const browser = await pw.chromium.launch({
  args: [
    "--use-gl=swiftshader", "--enable-unsafe-swiftshader",
    "--disable-gpu-vsync", "--disable-frame-rate-limit",
    "--run-all-compositor-stages-before-draw", "--disable-new-content-rendering-timeout",
  ],
});
const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
const problems = [];
page.on("pageerror", (e) => problems.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") problems.push(m.text()); });
page.setDefaultTimeout(0);
await page.goto(base, { waitUntil: "load" });
await page.waitForFunction(() => window.__libs && window.__libs.ready(), null, { timeout: 60000 });
const versions = await page.evaluate(() => window.__libs.init());
await page.evaluate((ms) => window.__libs.budget(ms), Number(flag("budget", "4000")));

console.log(`vega ${versions.vega} · vega-lite ${versions.vegaLite} · chart.js ${versions.chartjs}`);
console.log(`marks: ${MARKS.join(", ")} · median of ${FIRSTS} first renders · up to ${UPDATES} updates each · dpr ${DPR}\n`);

// A warm-up pass at the smallest size. Without it the first backend measured
// pays for every JIT tier the others then benefit from, and the hundred-node
// row says more about the order of the columns than about the libraries.
process.stdout.write("warming up… ");
for (const id of IDS) {
  try { await page.evaluate(([id, dpr]) => window.__libs.run(id, 200, dpr, 3, 2), [id, DPR]); } catch { /* reported below */ }
  await page.evaluate(() => window.__libs.clear());
}
console.log("done\n");

const shotN = MARKS.reduce((a, b) => (Math.abs(b - SHOT_AT) < Math.abs(a - SHOT_AT) ? b : a), MARKS[0]);
const rows = [];
for (const n of MARKS) {
  console.log(`N=${n}`);
  const measured = {};
  for (const id of IDS) {
    try {
      const r = await page.evaluate(([id, n, dpr, updates, firsts]) => window.__libs.run(id, n, dpr, updates, firsts),
        [id, n, DPR, UPDATES, FIRSTS]);
      measured[id] = r;
      console.log(
        `  ${id.padEnd(11)} first ${r.firstMs.toFixed(1).padStart(9)}ms · `
        + `update ${r.updateMs.toFixed(1).padStart(9)}ms (${(1000 / r.updateMs).toFixed(1)} fps) · `
        + `${r.nodes} nodes · ${r.updates} updates`,
      );
      if (SHOTS && n === shotN) {
        fs.mkdirSync(SHOTS, { recursive: true });
        await page.locator("#stage").screenshot({ path: path.join(SHOTS, `${id}-${n}.png`) });
      }
    } catch (err) {
      measured[id] = { error: String(err).split("\n")[0].slice(0, 200) };
      console.log(`  ${id.padEnd(11)} failed: ${measured[id].error}`);
    }
    await page.evaluate(() => window.__libs.clear());
  }
  rows.push({ n, measured });
  console.log("");
}

await browser.close();
server.close();

// -------------------------------------------------------------------- report --
fs.mkdirSync(OUT, { recursive: true });
const result = { versions, dpr: DPR, updates: UPDATES, firsts: FIRSTS, ids: IDS, rows, problems };
fs.writeFileSync(path.join(OUT, "libs.json"), JSON.stringify(result, null, 2));

fs.writeFileSync(path.join(OUT, "libs.md"), renderLibsReport(result));
console.log(`wrote ${path.relative(ROOT, path.join(OUT, "libs.json"))} and libs.md`);
if (SHOTS) console.log(`screenshots at ${shotN} nodes: ${path.relative(ROOT, SHOTS)}`);
