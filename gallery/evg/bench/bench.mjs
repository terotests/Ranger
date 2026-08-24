/**
 * bench.mjs — how many nodes does a chart need before the GPU is the faster
 * way to draw it?
 *
 *   node gallery/evg/bench/bench.mjs                      # default sweep
 *   node gallery/evg/bench/bench.mjs --marks 100,1000,10000 --frames 20
 *   node gallery/evg/bench/bench.mjs --out gallery/evg/bench/results
 *
 * EVG can put the same chart on screen four ways, and this measures them
 * against each other at growing node counts:
 *
 *   svg-vela   Vela's own SVG renderer — the string `vela_web.js` returns
 *   svg-evg    SVG built from EVG's display list (same geometry as the GPU)
 *   html-evg   absolutely positioned <div>s built from the same list
 *   webgl      the display list drawn by gallery/evg/gl/evg-webgl.js
 *
 * Each is timed at three points: the work above the browser (runtime, emitter,
 * parse), attaching what came out and getting it to pixels once, and then a
 * loop of frames in which every node is touched again — the case an
 * interactive chart lives in.
 *
 * Needs the Vela web bundles (npm run vela:web) and Playwright.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { renderReport, DOM_IDS } from "./report.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const DIST = path.join(ROOT, "gallery/vela/web/dist");

const argv = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = argv.indexOf("--" + name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};
const MARKS = flag("marks", "100,300,1000,3000,10000,30000").split(",").map(Number);
const FRAMES = Number(flag("frames", "20"));
const DPR = Number(flag("dpr", "1"));
const OUT = path.resolve(flag("out", path.join(HERE, "results")));
const WIDTH = Number(flag("width", "600"));
// Screenshots of what each backend left on the stage. A backend that draws
// nothing is very fast, and a table of milliseconds cannot tell you that.
const SHOTS = argv.includes("--shots") ? path.join(OUT, "shots") : null;
const SHOT_AT = Number(flag("shot-at", "1000"));
const HEIGHT = Number(flag("height", "400"));

// The four backends, in the order they are reported.
const BACKENDS = [
  { id: "svg-vela", label: "SVG (Vela renderer)", call: "svgVela" },
  { id: "svg-evg", label: "SVG (from display list)", call: "svgList" },
  { id: "html-evg", label: "HTML divs (from display list)", call: "html" },
  { id: "webgl", label: "WebGL 2 (the shipped viewer)", call: "gl" },
  { id: "webgl-batch", label: "WebGL 2, geometry built once", call: "glBatched" },
  { id: "webgl-sdf", label: "WebGL 2, one instanced quad per mark", call: "glSdf" },
  { id: "gl-empty", label: "WebGL 2 drawing nothing (baseline)", call: "glBaseline" },
];

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
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".ttf": "font/ttf", ".png": "image/png" };
const server = http.createServer((req, res) => {
  const name = decodeURIComponent(req.url.split("?")[0]);
  const file = name === "/" || name === "/bench.html"
    ? path.join(HERE, "bench.html")
    : path.join(DIST, name);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;

// ------------------------------------------------------------------- browser --
// SwiftShader: this machine has no GPU, so WebGL is rasterised on the CPU.
// That understates the GPU backend and nothing else, which makes every
// crossover found here an upper bound.
const browser = await pw.chromium.launch({
  args: [
    "--use-gl=swiftshader",
    "--enable-unsafe-swiftshader",
    // Frames as fast as the pipeline can make them, and a rAF that fires only
    // once the previous frame is actually on the screen.
    "--disable-gpu-vsync",
    "--disable-frame-rate-limit",
    "--run-all-compositor-stages-before-draw",
    "--disable-new-content-rendering-timeout",
    "--js-flags=--expose-gc",
  ],
});
const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
const problems = [];
page.on("pageerror", (e) => problems.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") problems.push(m.text()); });
page.setDefaultTimeout(0);

await page.goto(base, { waitUntil: "load" });
await page.waitForFunction(() => window.__bench && window.__bench.ready(), null, { timeout: 60000 });
const renderer = await page.evaluate(() => {
  const gl = document.createElement("canvas").getContext("webgl2");
  const dbg = gl && gl.getExtension("WEBGL_debug_renderer_info");
  return gl ? (dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)) : "none";
});
await page.evaluate(() => window.__bench.init());
await page.evaluate((ms) => window.__bench.budget(ms), Number(flag("budget", "4000")));
console.log(`renderer: ${renderer}`);
console.log(`marks: ${MARKS.join(", ")} · frames per backend: ${FRAMES} · dpr: ${DPR}\n`);

// The size the screenshots are taken at: the one asked for, or the nearest.
const shotN = MARKS.reduce((a, b) => (Math.abs(b - SHOT_AT) < Math.abs(a - SHOT_AT) ? b : a), MARKS[0]);

const rows = [];
for (const n of MARKS) {
  process.stdout.write(`N=${n}\n`);
  let built;
  try {
    built = await page.evaluate(([n, w, h]) => window.__bench.build(n, w, h), [n, WIDTH, HEIGHT]);
  } catch (err) {
    console.log(`  the pipeline would not build ${n} marks: ${String(err).split("\n")[0]}`);
    break;
  }
  process.stdout.write(
    `  scene: ${built.velaCommands} vela commands, ${built.displayCmds} display commands, `
    + `${built.points | 0} polygon points\n`
    + `  build: vela-svg ${built.ms.velaSvg.toFixed(0)}ms · evg-source ${built.ms.evgSource.toFixed(0)}ms · `
    + `display-list ${built.ms.displayList.toFixed(0)}ms · parse ${built.ms.jsonParse.toFixed(0)}ms\n`,
  );

  const measured = {};
  for (const b of BACKENDS) {
    try {
      const r = await page.evaluate(
        ([call, frames, dpr]) => window.__bench[call](frames, dpr),
        [b.call, FRAMES, DPR],
      );
      measured[b.id] = r;
      if (SHOTS && n === shotN) {
        fs.mkdirSync(SHOTS, { recursive: true });
        await page.locator("#stage").screenshot({ path: path.join(SHOTS, `${b.id}-${n}.png`) });
      }
      console.log(
        `  ${b.id.padEnd(11)} attach ${r.attachMs.toFixed(1).padStart(8)}ms · `
        + `first paint ${r.firstPaintMs.toFixed(1).padStart(8)}ms · `
        + `frame ${r.frameMs.toFixed(2).padStart(8)}ms (${(1000 / r.frameMs).toFixed(1)} fps)`
        + (r.cpuMs === undefined ? "" : ` · cpu ${r.cpuMs.toFixed(2)}ms`)
        + (r.drawCalls === undefined ? "" : ` · ${r.drawCalls} draw calls`)
        + ` · ${r.frames.length} frames`,
      );
    } catch (err) {
      measured[b.id] = { error: String(err).split("\n")[0] };
      console.log(`  ${b.id.padEnd(11)} failed: ${measured[b.id].error}`);
    }
  }
  rows.push({ n, built, measured });
  await page.evaluate(() => window.__bench.clear());
  console.log("");
}

await browser.close();
server.close();

// ------------------------------------------------------------------- report --
fs.mkdirSync(OUT, { recursive: true });
const result = {
  renderer,
  frames: FRAMES,
  dpr: DPR,
  chart: { width: WIDTH, height: HEIGHT, mark: "point" },
  node: process.version,
  rows,
  problems,
};
fs.writeFileSync(path.join(OUT, "bench.json"), JSON.stringify(result, null, 2));
if (SHOTS) console.log(`screenshots of every backend at ${shotN} nodes: ${path.relative(ROOT, SHOTS)}`);
fs.writeFileSync(path.join(OUT, "bench.md"), renderReport(result));
console.log(`wrote ${path.relative(ROOT, path.join(OUT, "bench.json"))} and bench.md`);

function crossover(id) {
  return rows.find(({ measured }) => {
    const gl = measured[id];
    const dom = DOM_IDS.map((k) => measured[k]).filter((r) => r && !r.error);
    return gl && !gl.error && dom.length && Math.min(...dom.map((r) => r.frameMs)) > gl.frameMs;
  });
}
for (const id of ["webgl", "webgl-batch", "webgl-sdf"]) {
  const c = crossover(id);
  console.log(c
    ? `${id}: redraws faster than every DOM backend from ${c.n} nodes up.`
    : `${id}: never faster than the DOM in this sweep.`);
}
