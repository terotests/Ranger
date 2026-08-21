/**
 * parity.mjs — the meter.
 *
 * Three inputs, none of them an opinion:
 *
 *   harness/out/reactflow.json   computed by @xyflow/system  (React Flow itself)
 *   harness/out/d3_force.json    computed by d3-force
 *   harness/out/rangerflow.json  computed by RangerFlow, same inputs
 *
 * and two kinds of comparison:
 *
 *   GEOMETRY   the same question asked of both, answered in numbers, compared
 *              with a tolerance. An edge path is compared by RESAMPLING both
 *              curves by arc length — not by string equality — because what
 *              matters is whether the line goes through the same places, not
 *              whether it was written with the same commands.
 *
 *   BEHAVIOUR  a capability list taken from React Flow's own documented
 *              feature set, where every row that claims to be done is backed
 *              by a probe that drove the real FlowEditor. No probe means the
 *              row is `todo`, whatever anybody believes; a probe that failed
 *              means the row is red, which is worse than todo because it means
 *              the documentation lies.
 *
 *   npm run rangerflow:parity
 *   npm run rangerflow:parity -- --todo        only what is missing
 *   npm run rangerflow:parity -- --check 85    non-zero exit below 85%
 *   npm run rangerflow:parity -- --worst 12    the twelve largest deviations
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const OUT = path.join(ROOT, "harness", "out");
const DOC = path.join(ROOT, "docs", "PARITY.md");

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const value = (name, dflt) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};

// How close counts as what. A tenth of a pixel is below anything a screen or a
// printer can show; half a pixel is invisible in practice; five is a
// difference you would notice if you looked for it.
const EXACT = 0.001;
const MATCH = 0.5;
const CLOSE = 5;

function read(name) {
  const p = path.join(OUT, name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// ---------------------------------------------------------------- paths ----
/** Parse the `M`/`L`/`C`/`Q` subset both libraries emit into a dense polyline. */
function flatten(d, steps = 64) {
  const tokens = d.match(/[MLCQZmlcqz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  const pts = [];
  let i = 0;
  let cx = 0;
  let cy = 0;
  const num = () => parseFloat(tokens[i++]);
  const bez3 = (x1, y1, x2, y2, x3, y3, x4, y4) => {
    for (let s = 1; s <= steps; s += 1) {
      const t = s / steps;
      const mt = 1 - t;
      const a = mt * mt * mt, b = 3 * mt * mt * t, c = 3 * mt * t * t, e = t * t * t;
      pts.push([a * x1 + b * x2 + c * x3 + e * x4, a * y1 + b * y2 + c * y3 + e * y4]);
    }
  };
  const bez2 = (x1, y1, x2, y2, x3, y3) => {
    for (let s = 1; s <= steps; s += 1) {
      const t = s / steps;
      const mt = 1 - t;
      pts.push([mt * mt * x1 + 2 * mt * t * x2 + t * t * x3,
                mt * mt * y1 + 2 * mt * t * y2 + t * t * y3]);
    }
  };
  while (i < tokens.length) {
    const op = tokens[i];
    if (/^[MLCQZmlcqz]$/.test(op)) i += 1;
    if (op === "M" || op === "m") { cx = num(); cy = num(); pts.push([cx, cy]); continue; }
    if (op === "L" || op === "l") { cx = num(); cy = num(); pts.push([cx, cy]); continue; }
    if (op === "C" || op === "c") {
      const x2 = num(), y2 = num(), x3 = num(), y3 = num(), x4 = num(), y4 = num();
      bez3(cx, cy, x2, y2, x3, y3, x4, y4); cx = x4; cy = y4; continue;
    }
    if (op === "Q" || op === "q") {
      const x2 = num(), y2 = num(), x3 = num(), y3 = num();
      bez2(cx, cy, x2, y2, x3, y3); cx = x3; cy = y3; continue;
    }
    if (op === "Z" || op === "z") continue;
    // A bare number after a command repeats it; both libraries emit explicit
    // commands, so anything reaching here is a shape we did not expect.
    i += 1;
  }
  return pts;
}

/** Resample a polyline to `n` points spaced evenly along its length. */
function resample(pts, n = 64) {
  const clean = pts.filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (clean.length < 2) return clean.length ? new Array(n).fill(clean[0]) : [];
  const seg = [0];
  let total = 0;
  for (let i = 1; i < clean.length; i += 1) {
    total += Math.hypot(clean[i][0] - clean[i - 1][0], clean[i][1] - clean[i - 1][1]);
    seg.push(total);
  }
  if (total === 0) return new Array(n).fill(clean[0]);
  const out = [];
  let k = 1;
  for (let s = 0; s < n; s += 1) {
    const want = (total * s) / (n - 1);
    while (k < seg.length - 1 && seg[k] < want) k += 1;
    const span = seg[k] - seg[k - 1] || 1;
    const t = (want - seg[k - 1]) / span;
    out.push([
      clean[k - 1][0] + (clean[k][0] - clean[k - 1][0]) * t,
      clean[k - 1][1] + (clean[k][1] - clean[k - 1][1]) * t,
    ]);
  }
  return out;
}

function pathDeviation(a, b) {
  const pa = resample(flatten(a));
  const pb = resample(flatten(b));
  if (!pa.length || !pb.length) return Infinity;
  let worst = 0;
  for (let i = 0; i < pa.length; i += 1) {
    worst = Math.max(worst, Math.hypot(pa[i][0] - pb[i][0], pa[i][1] - pb[i][1]));
  }
  return worst;
}

// ------------------------------------------------------------ comparison ----
function compareCase(ref, got) {
  if (ref.kind === "path") {
    const geom = pathDeviation(ref.d, got.d);
    const label = Math.hypot(ref.labelX - got.labelX, ref.labelY - got.labelY);
    return { deviation: geom, extra: { label } };
  }
  if (ref.kind === "point") {
    return { deviation: Math.hypot(ref.x - got.x, ref.y - got.y) };
  }
  if (ref.kind === "viewport") {
    // Zoom is unitless; a 1% zoom error is worth about as much attention as a
    // pixel of translation on a 100px box, so it is scaled to compare.
    const dxy = Math.hypot(ref.x - got.x, ref.y - got.y);
    const dz = Math.abs(ref.zoom - got.zoom) * 100;
    return { deviation: Math.max(dxy, dz), extra: { dxy, dzoom: Math.abs(ref.zoom - got.zoom) } };
  }
  if (ref.kind === "rect") {
    return {
      deviation: Math.max(
        Math.abs(ref.x - got.x), Math.abs(ref.y - got.y),
        Math.abs(ref.width - got.width), Math.abs(ref.height - got.height),
      ),
    };
  }
  if (ref.kind === "scalar") {
    return { deviation: Math.abs(ref.value - got.value) };
  }
  return { deviation: Infinity };
}

const FAMILY = [
  ["Edge geometry", (id) => id.startsWith("path:"), "getBezierPath, getStraightPath, getSmoothStepPath"],
  ["Viewport algebra", (id) => id.startsWith("vp:toflow") || id.startsWith("vp:toscreen"), "pointToRendererPoint, rendererPointToPoint"],
  ["fitView", (id) => id.startsWith("vp:fit"), "getViewportForBounds"],
  ["Node bounds", (id) => id.startsWith("bounds:"), "getNodesBounds"],
  ["Selection overlap", (id) => id.startsWith("overlap:"), "getRectsOverlappingArea"],
];

function verdict(dev) {
  if (dev <= EXACT) return "exact";
  if (dev <= MATCH) return "match";
  if (dev <= CLOSE) return "close";
  return "differs";
}

// ------------------------------------------------------- the capabilities ---
// The denominator comes from React Flow, not from us: every row is a
// capability React Flow documents for itself (a prop, a component, or an
// example it ships). `probe` names the check in tests/ParityDump.rgr that has
// to pass before the row may be called done — a row with no probe is `todo`
// however finished it feels.
const CAPABILITIES = [
  ["Viewport", [
    ["Pan the pane", "panOnDrag", "pan"],
    ["Zoom at the cursor", "zoomOnScroll", "zoomAtCursor"],
    ["minZoom / maxZoom", "minZoom, maxZoom", "zoomLimits"],
    ["fitView", "fitView()", "fitView"],
    ["Controls: zoom in / out", "<Controls />", "controlsZoomIn"],
    ["Controls: fit view", "<Controls />", "controlsFit"],
    ["Pinch to zoom", "zoomOnPinch", null],
    ["Pan on scroll", "panOnScroll", null],
  ]],
  ["Selection", [
    ["Click to select", "elementsSelectable", "clickSelect"],
    ["Shift-click adds", "multiSelectionKeyCode", "shiftAddSelect"],
    ["Shift-click removes", "multiSelectionKeyCode", "shiftRemoveSelect"],
    ["Rectangle selection", "selectionOnDrag", "boxSelect"],
    ["Select all", "Ctrl+A", "selectAll"],
    ["Escape clears", "onPaneClick", "escapeClears"],
    ["Delete selection", "deleteKeyCode", "deleteSelection"],
    ["Deleting a node deletes its edges", "onNodesDelete", "deleteTakesEdges"],
    ["Per-node selectable", "node.selectable", "perNodeSelectable"],
    ["Hidden nodes", "node.hidden", "hiddenNodes"],
  ]],
  ["Dragging", [
    ["Drag a node", "nodesDraggable", "dragNode"],
    ["Drag a multi-selection", "onSelectionDrag", "dragMultiple"],
    ["Per-node draggable", "node.draggable", "perNodeDraggable"],
    ["Snap to grid", "snapToGrid, snapGrid", "snapPosition"],
    ["Snap while resizing", "snapToGrid", "snapSize"],
    ["Undo a move", "(example: undo/redo)", "undoMove"],
    ["Redo a move", "(example: undo/redo)", "redoMove"],
    ["Undo a delete", "(example: undo/redo)", "undoDelete"],
    ["Drag handle selector", "node.dragHandle", null],
    ["Helper lines / alignment", "(example: helper lines)", null],
  ]],
  ["Connecting", [
    ["Connect handle to handle", "onConnect", "connectPorts"],
    ["Live connection line", "connectionLineType", "connectPreview"],
    ["Reject duplicate connections", "isValidConnection", "connectValidationDuplicate"],
    ["Reject self connections", "isValidConnection", "connectValidationSelf"],
    ["Connection limit per handle", "(example: connection limit)", "connectionLimit"],
    ["Source / target handle roles", "<Handle type=…>", "portRoles"],
    ["Several handles per node", "(example: multiple handles)", "multipleHandles"],
    ["Reconnect an edge by its end", "onReconnect", null],
    ["Connect on click", "connectOnClick", null],
  ]],
  ["Nodes and edges", [
    ["Custom node types", "nodeTypes", "edgeTypes"],
    ["Node resizing", "<NodeResizer />", "resizeNode"],
    ["Minimum node size", "<NodeResizer minWidth>", "resizeMinSize"],
    ["Edge selection", "edgesFocusable", "edgeSelect"],
    ["Four edge types", "edgeTypes", "edgeTypes"],
    ["Edge labels", "edge.label", "edgeLabels"],
    ["Edge markers", "markerEnd", "markers"],
    ["Node toolbar", "<NodeToolbar />", null],
    ["Sub-flows / parenting", "node.parentId", null],
  ]],
  ["Chrome and rendering", [
    ["Background variants", "<Background variant>", "backgroundVariants"],
    ["MiniMap", "<MiniMap />", "minimap"],
    ["Viewport-limited rendering", "onlyRenderVisibleElements", "culling"],
    ["Dark mode", "colorMode", "darkTheme"],
  ]],
];

// ------------------------------------------------------------------ main ----
const reactflow = read("reactflow.json");
const d3force = read("d3_force.json");
const ranger = read("rangerflow.json");

if (!ranger) {
  console.error("no harness/out/rangerflow.json — run: npm run rangerflow:parity");
  process.exit(2);
}

const gotById = new Map(ranger.cases.map((c) => [c.id, c]));
const results = [];
const idProblems = [];

if (reactflow) {
  const refIds = new Set(reactflow.cases.map((c) => c.id));
  for (const id of gotById.keys()) {
    if (!refIds.has(id) && !id.startsWith("force:")) idProblems.push(`RangerFlow produced '${id}', the oracle did not`);
  }
  for (const ref of reactflow.cases) {
    const got = gotById.get(ref.id);
    if (!got) {
      idProblems.push(`the oracle produced '${ref.id}', RangerFlow did not`);
      continue;
    }
    const cmp = compareCase(ref, got);
    results.push({ id: ref.id, kind: ref.kind, ...cmp, verdict: verdict(cmp.deviation) });
  }
}

// --- force layout -----------------------------------------------------------
// Compared two ways. The absolute deviation says how far a node ended up from
// where d3 put it; the SHAPE error compares every pairwise distance instead,
// which is what a layout actually is — two runs that differ by a rotation or a
// translation are the same layout, and a metric that says otherwise is
// measuring the wrong thing.
const forceRows = [];
if (d3force && ranger.force) {
  for (const tick of d3force.ticks) {
    const key = "t" + tick;
    const ref = d3force.frames[key];
    const got = ranger.force[key];
    if (!ref || !got) continue;
    const byId = new Map(got.map((n) => [n.id, n]));
    let worst = 0;
    let sum = 0;
    for (const r of ref) {
      const g = byId.get(r.id);
      if (!g) continue;
      const d = Math.hypot(r.x - g.x, r.y - g.y);
      worst = Math.max(worst, d);
      sum += d * d;
    }
    const rms = Math.sqrt(sum / ref.length);
    // pairwise-distance error, normalised by the reference layout's own scale
    let num = 0;
    let den = 0;
    for (let i = 0; i < ref.length; i += 1) {
      for (let j = i + 1; j < ref.length; j += 1) {
        const a = byId.get(ref[i].id), b = byId.get(ref[j].id);
        if (!a || !b) continue;
        const dRef = Math.hypot(ref[i].x - ref[j].x, ref[i].y - ref[j].y);
        const dGot = Math.hypot(a.x - b.x, a.y - b.y);
        num += Math.abs(dRef - dGot);
        den += dRef;
      }
    }
    forceRows.push({ tick, worst, rms, shape: den ? (num / den) * 100 : 0 });
  }
}

// --- behaviour --------------------------------------------------------------
const probeById = new Map((ranger.probes || []).map((p) => [p.id, p]));
const capRows = [];
for (const [section, rows] of CAPABILITIES) {
  for (const [name, source, probe] of rows) {
    let status = "todo";
    let note = "";
    if (probe) {
      const p = probeById.get(probe);
      if (!p) {
        status = "FAIL";
        note = `probe '${probe}' is named here but not produced`;
      } else if (p.ok) {
        status = "done";
        note = p.note;
      } else {
        status = "FAIL";
        note = p.note;
      }
    }
    capRows.push({ section, name, source, probe, status, note });
  }
}

const unusedProbes = [...probeById.keys()].filter(
  (id) => !capRows.some((r) => r.probe === id),
);

// ----------------------------------------------------- deliberate gaps -----
// Divergences that are known, understood, and NOT going to be fixed. Each one
// has to say why, because "we decided to differ" and "we never noticed" look
// identical in a table of numbers.
const DELIBERATE = [
  {
    match: (id) => id.startsWith("overlap:"),
    reason:
      "React Flow rounds the overlap area UP (`Math.ceil`). RangerFlow keeps " +
      "the true area. Only the sign of the number decides whether a node is " +
      "selected, and both agree on that, so the rounding is not reproduced.",
  },
  {
    match: (id) => id === "force:jiggle",
    reason:
      "d3 gives each force its own seeded generator; RangerFlow has one. The " +
      "jiggle only fires on exactly-coincident points and is 1e-6 wide, which " +
      "is the residue left at tick 300.",
  },
];

// ------------------------------------------------------------- reporting ---
const WEIGHT = { done: 1, todo: 0, FAIL: 0 };
const behaviourScore = capRows.reduce((a, r) => a + WEIGHT[r.status], 0);
const behaviourTotal = capRows.length;
const geomScore = results.filter((r) => r.verdict === "exact" || r.verdict === "match").length;
const geomTotal = results.length;

// A layout tick counts as matching when its SHAPE error — every pairwise
// distance, normalised — is under half a percent. Absolute position is the
// wrong test for a layout: a rotation is not a disagreement.
const FORCE_SHAPE_OK = 0.5;
const forceScore = forceRows.filter((r) => r.shape <= FORCE_SHAPE_OK).length;
const forceTotal = forceRows.length;

/** Every family as one percentage, so no family can be drowned out by another
 *  simply for having more cases in it. */
function families() {
  const out = [];
  for (const [name, match, fn] of FAMILY) {
    const rows = results.filter((r) => match(r.id));
    if (!rows.length) continue;
    const ok = rows.filter((r) => r.verdict === "exact" || r.verdict === "match").length;
    const worst = rows.reduce((m, r) => Math.max(m, r.deviation), 0);
    out.push({ name, fn, ok, total: rows.length, worst, unit: "px" });
  }
  if (forceTotal) {
    const worst = forceRows.reduce((m, r) => Math.max(m, r.shape), 0);
    out.push({
      name: "Force layout",
      fn: "d3-force",
      ok: forceScore,
      total: forceTotal,
      worst,
      unit: "% shape",
    });
  }
  out.push({
    name: "Behaviour",
    fn: "probes against FlowEditor",
    ok: behaviourScore,
    total: behaviourTotal,
    worst: 0,
    unit: "",
  });
  return out;
}

function bar(fraction, width = 24) {
  const filled = Math.round(fraction * width);
  return "█".repeat(filled) + "·".repeat(width - filled);
}

const pct = (a, b) => (b ? (a / b) * 100 : 0);

console.log("React Flow parity — gallery/rangerflow");
console.log("=".repeat(70));
if (!reactflow) {
  console.log("  no oracle: harness/out/reactflow.json is missing.");
  console.log("  Geometry is UNMEASURED — run `npm run rangerflow:parity:oracles`.");
} else {
  console.log(`  oracle: ${reactflow.source}`);
  for (const [name, match, fn] of FAMILY) {
    const rows = results.filter((r) => match(r.id));
    if (!rows.length) continue;
    const ok = rows.filter((r) => r.verdict === "exact" || r.verdict === "match").length;
    const worst = rows.reduce((m, r) => Math.max(m, r.deviation), 0);
    console.log(
      `  ${name.padEnd(20)} ${bar(pct(ok, rows.length) / 100)} ` +
      `${String(ok).padStart(3)}/${String(rows.length).padEnd(3)} ` +
      `worst ${worst === Infinity ? "—" : worst.toFixed(3) + " px"}   ${fn}`,
    );
  }
}
console.log("-".repeat(70));
if (forceRows.length) {
  console.log("  force layout vs d3-force");
  for (const r of forceRows) {
    console.log(
      `    tick ${String(r.tick).padStart(3)}  max ${r.worst.toFixed(3).padStart(9)} px` +
      `  rms ${r.rms.toFixed(3).padStart(9)} px  shape error ${r.shape.toFixed(2)}%`,
    );
  }
} else if (d3force) {
  console.log("  force layout: RangerFlow produced no frames to compare");
} else {
  console.log("  force layout: no d3 oracle — UNMEASURED");
}
console.log("-".repeat(70));
console.log(
  `  behaviour  ${bar(pct(behaviourScore, behaviourTotal) / 100)} ` +
  `${behaviourScore}/${behaviourTotal} capabilities, every one proved by a probe`,
);
const failing = capRows.filter((r) => r.status === "FAIL");
for (const r of failing) console.log(`    FAIL ${r.name} — ${r.note}`);
if (flag("--todo")) {
  for (const r of capRows.filter((r) => r.status === "todo")) {
    console.log(`    todo ${r.section} / ${r.name}   (${r.source})`);
  }
}
const worstN = parseInt(value("--worst", "0"), 10);
if (worstN > 0) {
  console.log("-".repeat(70));
  console.log(`  the ${worstN} largest deviations`);
  for (const r of [...results].sort((a, b) => b.deviation - a.deviation).slice(0, worstN)) {
    console.log(`    ${r.deviation.toFixed(3).padStart(10)} px  ${r.id}`);
  }
}
for (const p of idProblems.slice(0, 10)) console.log("  MISMATCH " + p);
for (const p of unusedProbes) console.log(`  note: probe '${p}' is produced but no capability claims it`);

// The mean of the family percentages, not the mean of the cases: 320 edge
// paths and 50 capabilities are not 370 equally important facts, and a score
// that says so would move whenever a case was added.
const fam = families();
const overall = fam.reduce((a, f) => a + pct(f.ok, f.total), 0) / (fam.length || 1);
console.log("=".repeat(70));
console.log(`  overall ${overall.toFixed(1)}%   ${bar(overall / 100, 34)}   (mean of ${fam.length} families)`);

// ------------------------------------------------------------- the report --
const lines = [];
lines.push("# React Flow parity — measured");
lines.push("");
lines.push("**Generated by `npm run rangerflow:parity`. Do not edit by hand.**");
lines.push("");
lines.push("A scorecard we wrote from imagination would only measure our imagination.");
lines.push("So the reference answers in the geometry tables below are not written down —");
lines.push("they are computed by React Flow itself. `harness/oracles/reactflow_oracle.mjs`");
lines.push("calls `getBezierPath`, `getSmoothStepPath`, `getStraightPath`,");
lines.push("`getViewportForBounds`, `pointToRendererPoint` and `getNodesBounds` out of");
lines.push("`@xyflow/system` — the package React Flow is built on, the same functions a");
lines.push("React Flow app calls — and RangerFlow is asked the same questions in");
lines.push("`tests/ParityDump.rgr`.");
lines.push("");
lines.push("Edge paths are compared by **resampling both curves by arc length**, not by");
lines.push("string equality: what matters is whether the line goes through the same");
lines.push("places, not whether it was written with the same commands.");
lines.push("");
lines.push("| Family | Reference | Score | Worst |");
lines.push("| --- | --- | ---: | ---: |");
for (const f of fam) {
  const worst = f.unit ? `${f.worst.toFixed(3)} ${f.unit}` : "—";
  lines.push(`| ${f.name} | \`${f.fn}\` | ${f.ok}/${f.total} — ${pct(f.ok, f.total).toFixed(0)}% | ${worst} |`);
}
lines.push(`| **Overall** | mean of the ${fam.length} families | **${overall.toFixed(1)}%** | |`);
lines.push("");
lines.push("The overall figure is the mean of the family percentages, not of the cases:");
lines.push("320 edge paths and 50 capabilities are not 370 equally important facts, and a");
lines.push("score that said so would move whenever a case was added.");
lines.push("");
lines.push("## Geometry");
lines.push("");
if (!reactflow) {
  lines.push("**Unmeasured** — `harness/out/reactflow.json` is missing. Run");
  lines.push("`npm run rangerflow:parity:oracles` with a registry available.");
} else {
  lines.push("`exact` ≤ 0.001 px · `match` ≤ 0.5 px · `close` ≤ 5 px · `differs` beyond that.");
  lines.push("");
  lines.push("| Family | React Flow function | Cases | exact | match | close | differs | Worst |");
  lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const [name, match, fn] of FAMILY) {
    const rows = results.filter((r) => match(r.id));
    if (!rows.length) continue;
    const c = (v) => rows.filter((r) => r.verdict === v).length;
    const worst = rows.reduce((m, r) => Math.max(m, r.deviation), 0);
    lines.push(
      `| ${name} | \`${fn}\` | ${rows.length} | ${c("exact")} | ${c("match")} | ` +
      `${c("close")} | ${c("differs")} | ${worst.toFixed(3)} px |`,
    );
  }
  const bad = results.filter((r) => r.verdict === "close" || r.verdict === "differs");
  if (bad.length) {
    lines.push("");
    lines.push("### Where it differs");
    lines.push("");
    lines.push("| Case | Deviation |");
    lines.push("| --- | ---: |");
    for (const r of bad.sort((a, b) => b.deviation - a.deviation).slice(0, 25)) {
      lines.push(`| \`${r.id}\` | ${r.deviation.toFixed(3)} px |`);
    }
    if (bad.length > 25) lines.push(`| …and ${bad.length - 25} more | |`);
  }
}
lines.push("");
lines.push("## Force layout against d3-force");
lines.push("");
if (!forceRows.length) {
  lines.push("**Unmeasured** — no `harness/out/d3_force.json`, or RangerFlow produced no frames.");
} else {
  lines.push("The same 30-node graph, the same four forces in the same order, the same");
  lines.push("parameters, ticked by hand. `max` and `rms` are how far a node ended up from");
  lines.push("where d3 put it. **Shape error** compares every pairwise distance instead,");
  lines.push("normalised by the reference layout's own scale — two runs that differ by a");
  lines.push("rotation or a translation are the same layout, and that is the number worth");
  lines.push("reading.");
  lines.push("");
  lines.push("| Tick | Max deviation | RMS | Shape error |");
  lines.push("| ---: | ---: | ---: | ---: |");
  for (const r of forceRows) {
    lines.push(`| ${r.tick} | ${r.worst.toFixed(3)} px | ${r.rms.toFixed(3)} px | ${r.shape.toFixed(2)}% |`);
  }
}
lines.push("");
lines.push("## Behaviour");
lines.push("");
lines.push("Every row is a capability **React Flow documents for itself** — a prop, a");
lines.push("component, or an example it ships. `done` requires a named probe in");
lines.push("`tests/ParityDump.rgr` that drove the real `FlowEditor` through");
lines.push("`pointerDown` / `pointerMove` / `pointerUp` and passed. A row with no probe is");
lines.push("`todo` however finished it feels, and a probe that fails turns the row red —");
lines.push("which is worse than `todo`, because it means the documentation lies.");
lines.push("");
for (const [section] of CAPABILITIES) {
  const rows = capRows.filter((r) => r.section === section);
  const ok = rows.filter((r) => r.status === "done").length;
  lines.push(`### ${section} — ${ok}/${rows.length}`);
  lines.push("");
  lines.push("| Capability | React Flow | Status | Probe |");
  lines.push("| --- | --- | --- | --- |");
  for (const r of rows) {
    const mark = r.status === "done" ? "✓ done" : r.status === "FAIL" ? "**✗ FAIL**" : "· todo";
    lines.push(`| ${r.name} | \`${r.source}\` | ${mark} | ${r.probe ? "`" + r.probe + "`" : "—"} |`);
  }
  lines.push("");
}
lines.push("## Deliberate divergences");
lines.push("");
lines.push("Known, understood, and not going to be fixed — listed because \"we decided to");
lines.push("differ\" and \"we never noticed\" look identical in a table of numbers.");
lines.push("");
for (const d of DELIBERATE) {
  const hit = results.filter((r) => d.match(r.id)).length;
  lines.push(`- **${hit ? hit + " geometry cases" : "the force layout"}** — ${d.reason}`);
}
lines.push("");
lines.push("## What this does not measure");
lines.push("");
lines.push("- **Pixels.** RangerFlow draws through EVG and React Flow through the DOM;");
lines.push("  comparing rendered images would measure font hinting, not parity.");
lines.push("- **Anything with no probe.** A `todo` row means nobody has proved it, not");
lines.push("  that it is known to be absent — though for the rows above, it is.");
lines.push("- **React Flow's React-ness.** Hooks, controlled state, SSR and the component");
lines.push("  API are outside what a non-React library can be scored against.");
lines.push("");

fs.writeFileSync(DOC, lines.join("\n"));
console.log(`  wrote ${path.relative(process.cwd(), DOC)}`);

const threshold = parseFloat(value("--check", "NaN"));
if (failing.length) process.exit(1);
if (idProblems.length) process.exit(1);
if (!Number.isNaN(threshold) && overall < threshold) {
  console.error(`  below the --check threshold of ${threshold}%`);
  process.exit(1);
}
