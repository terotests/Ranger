/**
 * report.mjs — the tables, from a run that already happened.
 *
 *   node gallery/evg/bench/report.mjs results/bench.json > results/bench.md
 *
 * Kept apart from the measuring so a wording change to the report does not
 * mean measuring everything again.
 */
import fs from "node:fs";

export const DOM_IDS = ["svg-vela", "svg-evg", "html-evg"];
const GL_IDS = ["webgl", "webgl-batch", "webgl-sdf"];
const COLS = [...DOM_IDS, ...GL_IDS];

const fmt = (x, d = 1) => (x === undefined || x === null || Number.isNaN(x) ? "—" : x.toFixed(d));
const cell = (r, key, d) => (r && !r.error && r[key] !== undefined ? fmt(r[key], d) : "—");
const row = (first, cells) => `| ${first} | ${cells.join(" | ")} |\n`;
const header = (first, names) => row(first, names) + `|---:|${names.map(() => "---:").join("|")}|\n`;

export function renderReport(result) {
  const { rows, renderer, frames, dpr, chart } = result;

  let md = `# Chart backends by node count\n\n`;
  md += `Renderer: \`${renderer}\` · up to ${frames} timed frames per backend · dpr ${dpr} · `;
  md += `${chart.width}×${chart.height} scatter plot, one point mark per node.\n\n`;

  md += `## Total time to the first picture (ms)\n\n`;
  md += `Everything: the Vela runtime, the emitter, the JSON parse, attaching what came out `;
  md += `and one frame. The three GPU columns and \`svg-evg\` share the EVG pipeline, which is `;
  md += `what dominates them.\n\n`;
  md += header("nodes", COLS);
  for (const { n, built, measured } of rows) {
    const evgPipe = built.ms.evgSource + built.ms.displayList + built.ms.jsonParse;
    const upstream = {
      "svg-vela": built.ms.velaSvg,
      "svg-evg": evgPipe + built.ms.svgMarkup,
      "html-evg": evgPipe + built.ms.htmlMarkup,
      "webgl": evgPipe,
      "webgl-batch": evgPipe,
      "webgl-sdf": evgPipe,
    };
    md += row(n, COLS.map((id) => {
      const r = measured[id];
      return r && !r.error ? fmt(upstream[id] + r.firstPaintMs, 0) : "—";
    }));
  }

  md += `\n## Attach and first paint (ms)\n\n`;
  md += `The browser's half only: the SVG string and the display list already exist.\n\n`;
  md += header("nodes", COLS);
  for (const { n, measured } of rows) {
    md += row(n, COLS.map((id) => cell(measured[id], "firstPaintMs")));
  }

  md += `\n## Redraw — one frame with every node touched (ms, median)\n\n`;
  md += `An empty canvas of the same size costs a frame of its own here — the \`gl-empty\` `;
  md += `column — because this machine has no GPU and the surface is rasterised and copied in `;
  md += `software.\n\n`;
  md += header("nodes", [...COLS, "gl-empty", "best DOM ÷ webgl-sdf"]);
  for (const { n, measured } of rows) {
    const dom = DOM_IDS.map((k) => measured[k]).filter((r) => r && !r.error).map((r) => r.frameMs);
    const best = dom.length ? Math.min(...dom) : null;
    const sdf = measured["webgl-sdf"] && !measured["webgl-sdf"].error ? measured["webgl-sdf"].frameMs : null;
    md += row(n, [
      ...COLS.map((id) => cell(measured[id], "frameMs", 2)),
      cell(measured["gl-empty"], "frameMs", 2),
      best && sdf ? `${(best / sdf).toFixed(2)}×` : "—",
    ]);
  }

  md += `\n## Where a redraw goes (ms, median)\n\n`;
  md += `\`cpu\` is the JavaScript half — mutating the nodes and forcing style and layout for the `;
  md += `DOM backends, building and submitting the frame for the GPU ones. Everything else in the `;
  md += `frame above is rasterising and compositing, which is the part this machine does in `;
  md += `software.\n\n`;
  md += header("nodes", COLS.map((id) => `${id} cpu`));
  for (const { n, measured } of rows) {
    md += row(n, COLS.map((id) => cell(measured[id], "cpuMs", 2)));
  }

  md += `\n## Marginal cost per node (µs), from the two biggest sizes\n\n`;
  md += `How much one more mark costs, redraw and JavaScript separately.\n\n`;
  if (rows.length >= 2) {
    const a = rows[rows.length - 2], b = rows[rows.length - 1];
    md += header(`${a.n} → ${b.n}`, COLS);
    for (const key of ["frameMs", "cpuMs"]) {
      md += row(key === "frameMs" ? "frame" : "cpu", COLS.map((id) => {
        const ra = a.measured[id], rb = b.measured[id];
        if (!ra || !rb || ra.error || rb.error) return "—";
        return fmt(((rb[key] - ra[key]) / (b.n - a.n)) * 1000, 1);
      }));
    }
  }

  md += `\n## The scene itself\n\n`;
  md += header("nodes", ["vela cmds", "display cmds", "polygon points", "vela svg", "display list json"]);
  for (const { n, built } of rows) {
    const kb = (b) => `${Math.round(b / 1024)} KB`;
    md += row(n, [built.velaCommands, built.displayCmds, built.points | 0,
      kb(built.bytes.velaSvg), kb(built.bytes.dlJson)]);
  }

  const failed = [];
  for (const { n, measured } of rows) {
    for (const id of COLS) if (measured[id] && measured[id].error) failed.push(`\`${id}\` at ${n} nodes: ${measured[id].error}`);
  }
  if (failed.length) {
    md += `\n## What would not run\n\n`;
    for (const f of failed) md += `- ${f}\n`;
  }
  if (result.problems && result.problems.length) {
    md += `\n## The browser complained\n\n`;
    for (const p of [...new Set(result.problems)].slice(0, 10)) md += `- \`${p}\`\n`;
  }
  return md;
}

// ---------------------------------------------------------------------------
// The other benchmark: Ranger against the libraries, from libs.json.
// ---------------------------------------------------------------------------

/** Least squares slope of ms against node count, in µs per node. */
function slope(rows, id, key) {
  const pts = rows
    .map(({ n, measured }) => [n, measured[id]])
    .filter(([, r]) => r && !r.error && r[key] !== undefined)
    .map(([n, r]) => [n, r[key]]);
  if (pts.length < 2) return null;
  const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const my = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  let num = 0, den = 0;
  for (const [x, y] of pts) { num += (x - mx) * (y - my); den += (x - mx) ** 2; }
  return den ? (num / den) * 1000 : null;
}

export function renderLibsReport(result) {
  const { rows, versions, dpr, updates, ids } = result;
  const IDS = ids;
  let md = `# Ranger against Vega and Chart.js\n\n`;
  md += `vega ${versions.vega} · vega-lite ${versions.vegaLite} · chart.js ${versions.chartjs} · `;
  md += `dpr ${dpr} · median of ${result.firsts || 1} first renders and up to ${updates} updates `;
  md += `per size · 600×400 scatter plot, four series.\n\n`;
  md += `Vela and Vega are given the same Vega-Lite specification and compile it themselves. `;
  md += `\`vela-svg-vg\` is the same Vela renderer handed the Vega specification *vega-lite* `;
  md += `compiled, so the gap between it and \`vela-svg\` is Vela's own Vega-Lite compiler. `;
  md += `Chart.js has no grammar, so it is handed the four series directly with animation off.\n\n`;

  md += `## Specification and data to a picture (ms)\n\n`;
  md += header("nodes", IDS);
  for (const { n, measured } of rows) md += row(n, IDS.map((id) => cell(measured[id], "firstMs", 1)));

  md += `\n## New numbers to a new picture (ms, median)\n\n`;
  md += `Every point moves. Vega keeps its dataflow and reuses what it can; Chart.js keeps its `;
  md += `chart and swaps the datasets; Ranger has no incremental path, so both of its columns `;
  md += `run the whole pipeline again.\n\n`;
  md += header("nodes", [...IDS, "vela-svg ÷ best other"]);
  for (const { n, measured } of rows) {
    const others = IDS.filter((i) => !i.startsWith("vela") && !i.startsWith("evg"))
      .map((i) => measured[i]).filter((r) => r && !r.error).map((r) => r.updateMs);
    const best = others.length ? Math.min(...others) : null;
    const vela = measured["vela-svg"] && !measured["vela-svg"].error ? measured["vela-svg"].updateMs : null;
    md += row(n, [...IDS.map((id) => cell(measured[id], "updateMs", 1)),
      vela && best ? `${(vela / best).toFixed(1)}×` : "—"]);
  }

  md += `\n## Marginal cost per node (µs)\n\n`;
  md += `A least-squares slope over every size measured, rather than a difference between the `;
  md += `last two — one noisy reading at one size should not decide the number.\n\n`;
  md += header("", IDS);
  for (const [label, key] of [["first render", "firstMs"], ["update", "updateMs"]]) {
    md += row(label, IDS.map((id) => {
      const s = slope(rows, id, key);
      return s === null ? "—" : fmt(s, 1);
    }));
  }

  md += `\n## What each one put on the page\n\n`;
  md += header("nodes", IDS.map((id) => `${id} nodes`));
  for (const { n, measured } of rows) {
    md += row(n, IDS.map((id) => (measured[id] && !measured[id].error ? String(measured[id].nodes) : "—")));
  }

  const failed = [];
  for (const { n, measured } of rows) {
    for (const id of IDS) if (measured[id] && measured[id].error) failed.push(`\`${id}\` at ${n}: ${measured[id].error}`);
  }
  if (failed.length) { md += `\n## What would not run\n\n`; for (const f of failed) md += `- ${f}\n`; }
  if (result.problems && result.problems.length) {
    md += `\n## The browser complained\n\n`;
    for (const p of [...new Set(result.problems)].slice(0, 10)) md += `- \`${p}\`\n`;
  }
  return md;
}

if (process.argv[1] && process.argv[1].endsWith("report.mjs") && process.argv[2]) {
  const data = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  process.stdout.write(data.ids ? renderLibsReport(data) : renderReport(data));
}
