/**
 * capacity.mjs — how many points fit in a chart before it stops being a chart?
 *
 *   npm run evg:bench:capacity
 *   node gallery/evg/bench/capacity.mjs --sizes 1000,10000,100000 --shapes scatter,line
 *   node gallery/evg/bench/capacity.mjs --budget 20000 --no-reference
 *
 * The other two benchmarks here ask how Vela compares at ordinary sizes. This
 * one asks where it stops: a point-intensive chart is the case where a chart
 * runtime either scales or does not, and the answer differs by an order of
 * magnitude between shapes that look alike on the page.
 *
 * A scatter of N points is N marks, N symbols and N elements in the document.
 * A line through N points is ONE mark and one element with N vertices in its
 * `d`. The two cost nothing like the same, and knowing which one a chart is
 * decides how much data can go on it.
 *
 * Everything here runs headless in node — no browser, no compositor — so what
 * it measures is the runtime and the renderer, not the DOM. The reference
 * implementation is measured the same way through `view.toSVG()`, which is
 * vega's own SVG renderer with no page under it either.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const BUNDLE = path.join(ROOT, "gallery/vela/web/dist/vela_web.js");
const LIBS = path.join(HERE, ".libs/node_modules");

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf("--" + n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const SIZES = flag("sizes", "1000,3000,10000,30000,100000,300000,1000000").split(",").map(Number);
const BUDGET = Number(flag("budget", "20000"));      // ms; a shape stops when one render passes this
const REPS = Number(flag("reps", "1"));
const OUT = path.resolve(flag("out", path.join(HERE, "results")));
const WANT = flag("shapes", "").split(",").filter(Boolean);
const REFERENCE = !argv.includes("--no-reference");

if (!fs.existsSync(BUNDLE)) {
  console.error("no Vela bundle — run: npm run vela:web");
  process.exit(1);
}

// ------------------------------------------------------------------- vela ---
globalThis.require = undefined;
const raw = fs.readFileSync(BUNDLE, "utf8");
(0, eval)(raw.split("\n").slice(2, -3).join("\n") + `
globalThis.__V = { VlJsonParser, VlCompile, VlRuntime, VlSceneCommands, VlSvgWriter };`);
const V = globalThis.__V;

// -------------------------------------------------------------- reference ---
let vega = null, vegaLite = null;
if (REFERENCE) {
  try {
    vega = await import(path.join(LIBS, "vega/build/vega.module.js"));
    vegaLite = await import(path.join(LIBS, "vega-lite/build/index.js"));
  } catch {
    console.log("the reference is not installed — run npm run evg:bench:libs once, or pass --no-reference\n");
  }
}

// ----------------------------------------------------------------- shapes ---
// Each one is point-intensive in a different way. The comment is what the
// renderer is actually asked for, which is the thing that decides the cost.
const SHAPES = [
  {
    id: "scatter",
    what: "N point marks, four colour series — one <path> each",
    spec: (n) => ({
      width: 600, height: 400, data: { values: rowsXY(n, true) }, mark: "point",
      encoding: {
        x: { field: "x", type: "quantitative" }, y: { field: "y", type: "quantitative" },
        color: { field: "c", type: "nominal" },
      },
    }),
  },
  {
    id: "scatter-plain",
    what: "N point marks, one colour — the same without a colour scale",
    spec: (n) => ({
      width: 600, height: 400, data: { values: rowsXY(n, false) }, mark: "point",
      encoding: { x: { field: "x", type: "quantitative" }, y: { field: "y", type: "quantitative" } },
    }),
  },
  {
    id: "line",
    what: "one line through N points — ONE mark, one <path> with N vertices",
    spec: (n) => ({
      width: 600, height: 400, data: { values: rowsXY(n, false) }, mark: "line",
      encoding: { x: { field: "x", type: "quantitative" }, y: { field: "y", type: "quantitative" } },
    }),
  },
  {
    id: "line-8",
    what: "eight lines of N/8 points — eight paths",
    spec: (n) => ({
      width: 600, height: 400, data: { values: rowsSeries(n, 8) }, mark: "line",
      encoding: {
        x: { field: "x", type: "quantitative" }, y: { field: "y", type: "quantitative" },
        color: { field: "c", type: "nominal" },
      },
    }),
  },
  {
    id: "tick",
    what: "N tick marks — a strip plot, one rule each",
    spec: (n) => ({
      width: 600, height: 400, data: { values: rowsXY(n, true) }, mark: "tick",
      encoding: { x: { field: "x", type: "quantitative" }, y: { field: "c", type: "nominal" } },
    }),
  },
  {
    id: "rect",
    what: "N rect cells — a heat map, one <path> each",
    spec: (n) => ({
      width: 600, height: 400, data: { values: rowsGrid(n) }, mark: "rect",
      encoding: {
        x: { field: "x", type: "ordinal" }, y: { field: "y", type: "ordinal" },
        color: { field: "v", type: "quantitative" },
      },
    }),
  },
  {
    id: "area",
    what: "one filled area over N points — one path, 2N vertices",
    spec: (n) => ({
      width: 600, height: 400, data: { values: rowsXY(n, false) }, mark: "area",
      encoding: { x: { field: "x", type: "quantitative" }, y: { field: "y", type: "quantitative" } },
    }),
  },
  // Not point-intensive in MARKS but in DATA: the rows all go through the
  // dataflow and come out as a handful of marks. If a chart can be aggregated
  // or binned, this is the row count that matters rather than the mark count.
  {
    id: "bar-agg",
    what: "N rows summed into 20 bars — the data is large, the drawing is not",
    spec: (n) => ({
      width: 600, height: 400, data: { values: rowsCategory(n, 20) }, mark: "bar",
      encoding: {
        x: { field: "k", type: "nominal" },
        y: { field: "v", type: "quantitative", aggregate: "sum" },
      },
    }),
  },
  {
    id: "histogram",
    what: "N rows binned into 40 bars — one bin pass over everything",
    spec: (n) => ({
      width: 600, height: 400, data: { values: rowsXY(n, false) }, mark: "bar",
      encoding: {
        x: { field: "y", type: "quantitative", bin: { maxbins: 40 } },
        y: { aggregate: "count", type: "quantitative" },
      },
    }),
  },
  {
    id: "stacked",
    what: "N rows into 20 stacked bars of 8 series — aggregate, then stack",
    spec: (n) => ({
      width: 600, height: 400, data: { values: rowsCategory(n, 20, 8) }, mark: "bar",
      encoding: {
        x: { field: "k", type: "nominal" },
        y: { field: "v", type: "quantitative", aggregate: "sum" },
        color: { field: "c", type: "nominal" },
      },
    }),
  },
].filter((s) => !WANT.length || WANT.includes(s.id));

function rowsXY(n, series) {
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = series
      ? { x: (i * 37) % 9973, y: Math.sin(i / 131) * 100 + 100 + (i % 17), c: "s" + (i % 4) }
      : { x: i, y: Math.sin(i / 131) * 100 + 100 + (i % 17) };
  }
  return out;
}
function rowsSeries(n, k) {
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = { x: (i / k) | 0, y: Math.sin(i / 97) * 50 + 50 + (i % 8), c: "s" + (i % k) };
  return out;
}
function rowsCategory(n, cats, series) {
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = { k: "c" + (i % cats), v: (i * 13) % 97 };
    if (series) out[i].c = "s" + (i % series);
  }
  return out;
}
function rowsGrid(n) {
  const side = Math.max(1, Math.round(Math.sqrt(n)));
  const out = [];
  for (let a = 0; a < side; a++) for (let b = 0; b < side; b++) out.push({ x: a, y: b, v: (a * 31 + b * 17) % 100 });
  return out.slice(0, n);
}

// -------------------------------------------------------------- measuring ---
const mb = (b) => Math.round(b / 1048576);
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };

function velaRender(specText) {
  const t0 = Date.now();
  const source = new V.VlJsonParser().parse(specText);
  const compiled = new V.VlCompile().compileSpec(source);
  const tCompile = Date.now() - t0;

  const t1 = Date.now();
  const rt = new V.VlRuntime();
  rt.timeZoneName = "UTC";
  const scene = rt.run(compiled);
  if (rt.errors.length) throw new Error(rt.errors.join(" · "));
  const tScene = Date.now() - t1;

  const t2 = Date.now();
  const list = V.VlSceneCommands.build(scene);
  const root = scene.items[0];
  const svg = new V.VlSvgWriter().writeDocument(
    list, root.number("viewWidth"), root.number("viewHeight"),
    root.number("originX"), root.number("originY"), rt.background,
  );
  const tSvg = Date.now() - t2;

  return { tCompile, tScene, tSvg, total: tCompile + tScene + tSvg, commands: list.count(), bytes: svg.length,
    elements: (svg.match(/<(path|rect|line|text|circle)\b/g) || []).length };
}

async function vegaRender(spec) {
  const t0 = Date.now();
  const vg = vegaLite.compile(spec).spec;
  const tCompile = Date.now() - t0;
  const t1 = Date.now();
  const view = new vega.View(vega.parse(vg), { renderer: "none" });
  await view.runAsync();
  const tScene = Date.now() - t1;
  const t2 = Date.now();
  const svg = await view.toSVG();
  const tSvg = Date.now() - t2;
  view.finalize();
  return { tCompile, tScene, tSvg, total: tCompile + tScene + tSvg, bytes: svg.length,
    elements: (svg.match(/<(path|rect|line|text|circle)\b/g) || []).length };
}

// ------------------------------------------------------------------- sweep ---
console.log(`sizes: ${SIZES.join(", ")} · budget ${BUDGET} ms per render · node ${process.version}`);
console.log(`heap limit ${mb(require_v8_heap())} MB\n`);
function require_v8_heap() {
  // The ceiling this process actually has, which is what "it ran out" means.
  try { return process.availableMemory ? process.availableMemory() : 0; } catch { return 0; }
}

// A warm-up, so the first size of the first shape is not paying for every JIT
// tier the rest then enjoy. Without it a thousand-point scatter "took" 136 ms
// and a later, larger one took less.
{
  const warm = SHAPES[0].spec(500);
  const text = JSON.stringify(warm);
  for (let i = 0; i < 3; i++) velaRender(text);
  if (vega) for (let i = 0; i < 3; i++) await vegaRender(warm);
}

const rows = [];
for (const shape of SHAPES) {
  console.log(`${shape.id} — ${shape.what}`);
  for (const n of SIZES) {
    const entry = { shape: shape.id, n };
    let spec;
    try {
      spec = shape.spec(n);
    } catch (err) {
      entry.vela = { error: "the data would not even be built: " + err.message };
      rows.push(entry);
      break;
    }
    const specText = JSON.stringify(spec);
    entry.specBytes = specText.length;

    // Vela
    try {
      const before = process.memoryUsage().rss;
      const runs = [];
      let last = null;
      for (let i = 0; i < REPS; i++) last = velaRender(specText);
      runs.push(last.total);
      entry.vela = { ...last, rssMb: mb(process.memoryUsage().rss - before) };
    } catch (err) {
      entry.vela = { error: String(err.message || err).slice(0, 160) };
    }

    // The reference, the same way
    if (vega) {
      try {
        entry.vega = await vegaRender(spec);
      } catch (err) {
        entry.vega = { error: String(err.message || err).slice(0, 160) };
      }
    }

    const v = entry.vela, r = entry.vega;
    const say = (x) => (!x ? "—" : x.error ? `FAILED: ${x.error}` :
      `${String(x.total).padStart(6)} ms (scene ${String(x.tScene).padStart(5)}, svg ${String(x.tSvg).padStart(5)}) · ${String(x.elements).padStart(7)} elements · ${String(mb(x.bytes)).padStart(4)} MB`);
    console.log(`  ${String(n).padStart(8)}  vela ${say(v)}`);
    if (r) console.log(`  ${" ".repeat(8)}  vega ${say(r)}`);
    rows.push(entry);

    if (v && !v.error && v.total > BUDGET) {
      console.log(`  ${" ".repeat(8)}  (over the ${BUDGET} ms budget — this shape stops here)`);
      break;
    }
    if (v && v.error) break;
  }
  console.log("");
  if (global.gc) global.gc();
}

// ------------------------------------------------------------------ report ---
fs.mkdirSync(OUT, { recursive: true });
const result = { node: process.version, sizes: SIZES, budget: BUDGET, rows,
  reference: vega ? "vega " + (vega.version || "") : null };
fs.writeFileSync(path.join(OUT, "capacity.json"), JSON.stringify(result, null, 2));

const byShape = new Map();
for (const r of rows) {
  if (!byShape.has(r.shape)) byShape.set(r.shape, []);
  byShape.get(r.shape).push(r);
}
const largestUnder = (list, ms) => {
  let best = null;
  for (const r of list) if (r.vela && !r.vela.error && r.vela.total <= ms) best = r.n;
  return best;
};
const fmtN = (n) => (n === null ? "—" : n.toLocaleString("en-US").replace(/,/g, " "));

let md = `# How many points fit\n\n`;
md += `One chart, headless, no browser: the Vela runtime and its SVG renderer against the `;
md += `reference implementation's, both measured the same way (\`view.toSVG()\` for vega). `;
md += `Node ${process.version}, budget ${BUDGET} ms per render.\n\n`;
md += `The number that matters is not one number: a scatter of N points is N marks and N `;
md += `elements, a line through N points is ONE mark and one element with N vertices, and the `;
md += `two differ by more than an order of magnitude.\n\n`;

md += `## The ceiling, by what the chart is made of\n\n`;
md += `| shape | what it is | ≤ 100 ms | ≤ 1 s | ≤ 10 s | largest measured |\n`;
md += `|---|---|---:|---:|---:|---|\n`;
for (const shape of SHAPES) {
  const list = byShape.get(shape.id) || [];
  const ok = list.filter((r) => r.vela && !r.vela.error);
  const last = ok[ok.length - 1];
  const failed = list.find((r) => r.vela && r.vela.error);
  md += `| \`${shape.id}\` | ${shape.what} | ${fmtN(largestUnder(list, 100))} | ${fmtN(largestUnder(list, 1000))} `;
  md += `| ${fmtN(largestUnder(list, 10000))} | ${last ? `${fmtN(last.n)} in ${(last.vela.total / 1000).toFixed(1)} s` : "—"}`;
  md += `${failed ? ` (failed at ${fmtN(failed.n)})` : ""} |\n`;
}

for (const shape of SHAPES) {
  const list = byShape.get(shape.id) || [];
  md += `\n## \`${shape.id}\` — ${shape.what}\n\n`;
  md += `| points | vela total | scene | svg | elements | svg size | vega total | vela ÷ vega |\n`;
  md += `|---:|---:|---:|---:|---:|---:|---:|---:|\n`;
  for (const r of list) {
    const v = r.vela, g = r.vega;
    if (v && v.error) { md += `| ${fmtN(r.n)} | **${v.error}** | | | | | | |\n`; continue; }
    const ratio = v && g && !g.error ? (v.total / g.total).toFixed(2) + "×" : "—";
    md += `| ${fmtN(r.n)} | ${v.total} ms | ${v.tScene} ms | ${v.tSvg} ms | ${fmtN(v.elements)} | ${mb(v.bytes)} MB `;
    md += `| ${g ? (g.error ? "**" + g.error + "**" : g.total + " ms") : "—"} | ${ratio} |\n`;
  }
}

fs.writeFileSync(path.join(OUT, "capacity.md"), md);
console.log(`wrote ${path.relative(ROOT, path.join(OUT, "capacity.md"))} and capacity.json`);
