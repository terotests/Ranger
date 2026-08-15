// =============================================================================
// triage.mjs — which chart types can this runtime already draw?
// =============================================================================
// The Vega-Lite example gallery has a hundred-odd charts, and the useful
// question about any of them is not "is it interesting" but "does the runtime
// already produce it, and if not, what is missing". This answers that for a
// list of candidates without committing any of them:
//
//   node gallery/vela/tools/reference/triage.mjs
//   node gallery/vela/tools/reference/triage.mjs --keep   # leave the specs
//
// Each candidate is a Vega-Lite specification written HERE, over this
// project's own data — the gallery's specs are BSD-licensed but their data
// sets are not this project's to redistribute, and the chart type is what is
// being tested, not the numbers. It is compiled by the official Vega-Lite,
// run through both implementations, and reported as one of:
//
//   ok        every mark matches the reference, item for item
//   DIFF      it draws, and something is wrong — the first differences shown
//   PARTIAL   Vela produced a scene but the reference has marks it does not
//   FAILED    Vela refused, with the reason it gave
//
// A candidate that reports `ok` is a chart that could go on a showcase page
// today. Everything else is a feature request with evidence attached.
// =============================================================================

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VELA = path.resolve(__dirname, '..', '..');
const ROOT = path.resolve(VELA, '..', '..');
const SCENE_TOOL = path.join(VELA, 'bin', 'vela_scene.js');

const TOLERANCE = 1e-6;
const IGNORED = new Set(['exit', 'zindex', 'bounds', 'mark', 'datum', 'source', 'clip', 'strokeForeground', 'context']);

let vega, vl;
try {
  vega = await import('vega');
  vl = await import('vega-lite');
} catch {
  console.log('vega / vega-lite are not installed — nothing was triaged.');
  console.log('install them to run this:  npm install --no-save vega vega-lite');
  process.exit(0);
}

if (!fs.existsSync(SCENE_TOOL)) {
  console.error(`missing ${path.relative(ROOT, SCENE_TOOL)} — build it with gallery/vela/tests/run.sh`);
  process.exit(1);
}

// The same nine rows the parity specs use, so a difference is the chart type.
const values = [
  { a: 'A', b: 28, c: 5, g: 'x' }, { a: 'B', b: 55, c: 9, g: 'y' },
  { a: 'C', b: 43, c: 2, g: 'x' }, { a: 'D', b: 91, c: 7, g: 'y' },
  { a: 'E', b: 81, c: 4, g: 'x' }, { a: 'F', b: 53, c: 6, g: 'y' },
  { a: 'G', b: 19, c: 8, g: 'x' }, { a: 'H', b: 87, c: 1, g: 'y' },
  { a: 'I', b: 52, c: 3, g: 'x' },
];
// A second set for the charts that need a date, which exists to show exactly
// where the missing time scale stops the runtime rather than to be drawn.
const dated = values.map((d, i) => ({ ...d, t: `2024-0${(i % 9) + 1}-01` }));

const size = { width: 200, height: 120 };

/** The candidates, grouped the way the example gallery groups them. */
const CANDIDATES = {
  // --- bar ------------------------------------------------------------------
  bar_negative: {
    group: 'bar',
    spec: {
      data: { values: values.map((d) => ({ ...d, b: d.b - 50 })) },
      mark: 'bar',
      encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } },
    },
  },
  bar_horizontal: {
    group: 'bar',
    spec: {
      data: { values },
      mark: 'bar',
      encoding: { y: { field: 'a', type: 'nominal' }, x: { field: 'b', type: 'quantitative' } },
    },
  },
  bar_normalized: {
    group: 'bar',
    spec: {
      data: { values },
      mark: 'bar',
      encoding: {
        x: { field: 'g', type: 'nominal' },
        y: { field: 'b', type: 'quantitative', aggregate: 'sum', stack: 'normalize' },
        color: { field: 'a', type: 'nominal' },
      },
    },
  },
  bar_labelled: {
    group: 'bar',
    spec: {
      data: { values },
      layer: [
        { mark: 'bar', encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } } },
        { mark: { type: 'text', dy: -6 }, encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'b', type: 'quantitative' }, text: { field: 'b', type: 'quantitative' } } },
      ],
    },
  },
  bar_gantt: {
    group: 'bar',
    spec: {
      data: { values },
      mark: 'bar',
      encoding: {
        y: { field: 'a', type: 'nominal' },
        x: { field: 'c', type: 'quantitative' },
        x2: { field: 'b' },
      },
    },
  },
  // --- line and area --------------------------------------------------------
  line_step: {
    group: 'line',
    spec: {
      data: { values },
      mark: { type: 'line', interpolate: 'step-after' },
      encoding: { x: { field: 'c', type: 'quantitative' }, y: { field: 'b', type: 'quantitative' } },
    },
  },
  line_with_points: {
    group: 'line',
    spec: {
      data: { values },
      mark: { type: 'line', point: true },
      encoding: { x: { field: 'c', type: 'quantitative' }, y: { field: 'b', type: 'quantitative' } },
    },
  },
  line_coloured: {
    group: 'line',
    spec: {
      data: { values },
      mark: 'line',
      encoding: {
        x: { field: 'c', type: 'quantitative' },
        y: { field: 'b', type: 'quantitative' },
        color: { field: 'g', type: 'nominal' },
      },
    },
  },
  area_stacked: {
    group: 'area',
    spec: {
      data: { values },
      mark: 'area',
      encoding: {
        x: { field: 'c', type: 'quantitative' },
        y: { field: 'b', type: 'quantitative' },
        color: { field: 'g', type: 'nominal' },
      },
    },
  },
  area_streamgraph: {
    group: 'area',
    spec: {
      data: { values },
      mark: 'area',
      encoding: {
        x: { field: 'c', type: 'quantitative' },
        y: { field: 'b', type: 'quantitative', stack: 'center' },
        color: { field: 'g', type: 'nominal' },
      },
    },
  },
  // --- point ----------------------------------------------------------------
  strip_plot: {
    group: 'point',
    spec: {
      data: { values },
      mark: 'tick',
      encoding: { x: { field: 'b', type: 'quantitative' } },
    },
  },
  scatter_shapes: {
    group: 'point',
    spec: {
      data: { values },
      mark: 'point',
      encoding: {
        x: { field: 'c', type: 'quantitative' },
        y: { field: 'b', type: 'quantitative' },
        shape: { field: 'g', type: 'nominal' },
      },
    },
  },
  scatter_mean_rule: {
    group: 'point',
    spec: {
      data: { values },
      layer: [
        { mark: 'point', encoding: { x: { field: 'c', type: 'quantitative' }, y: { field: 'b', type: 'quantitative' } } },
        { mark: 'rule', encoding: { y: { field: 'b', type: 'quantitative', aggregate: 'mean' } } },
      ],
    },
  },
  // --- table-like -----------------------------------------------------------
  heatmap: {
    group: 'table',
    spec: {
      data: { values },
      mark: 'rect',
      encoding: {
        x: { field: 'a', type: 'nominal' },
        y: { field: 'g', type: 'nominal' },
        color: { field: 'b', type: 'quantitative' },
      },
    },
  },
  heatmap_with_labels: {
    group: 'table',
    spec: {
      data: { values },
      layer: [
        { mark: 'rect', encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'g', type: 'nominal' }, color: { field: 'b', type: 'quantitative' } } },
        { mark: 'text', encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'g', type: 'nominal' }, text: { field: 'b', type: 'quantitative' } } },
      ],
    },
  },
  // --- circular -------------------------------------------------------------
  donut: {
    group: 'circular',
    spec: {
      data: { values },
      mark: { type: 'arc', innerRadius: 30 },
      encoding: { theta: { field: 'b', type: 'quantitative' }, color: { field: 'a', type: 'nominal' } },
    },
  },
  radial: {
    group: 'circular',
    spec: {
      data: { values },
      mark: { type: 'arc', innerRadius: 12, stroke: '#fff' },
      encoding: {
        theta: { field: 'b', type: 'quantitative', stack: true },
        radius: { field: 'b', scale: { type: 'sqrt', zero: true, rangeMin: 20 } },
        color: { field: 'a', type: 'nominal' },
      },
    },
  },
  // --- composite and multi-view --------------------------------------------
  boxplot: {
    group: 'composite',
    spec: {
      data: { values },
      mark: 'boxplot',
      encoding: { x: { field: 'g', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } },
    },
  },
  errorbar: {
    group: 'composite',
    spec: {
      data: { values },
      mark: 'errorbar',
      encoding: { x: { field: 'g', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } },
    },
  },
  facet_columns: {
    group: 'multi-view',
    spec: {
      data: { values },
      mark: 'bar',
      encoding: {
        x: { field: 'a', type: 'nominal' },
        y: { field: 'b', type: 'quantitative' },
        column: { field: 'g', type: 'nominal' },
      },
    },
  },
  concat_two: {
    group: 'multi-view',
    spec: {
      data: { values },
      hconcat: [
        { mark: 'bar', encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } } },
        { mark: 'point', encoding: { x: { field: 'c', type: 'quantitative' }, y: { field: 'b', type: 'quantitative' } } },
      ],
    },
  },
  // --- time -----------------------------------------------------------------
  line_temporal: {
    group: 'time',
    spec: {
      data: { values: dated },
      mark: 'line',
      encoding: { x: { field: 't', type: 'temporal' }, y: { field: 'b', type: 'quantitative' } },
    },
  },
};

// -----------------------------------------------------------------------------

const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'vela-triage-'));
const keep = process.argv.includes('--keep');

const rows = [];
for (const [name, entry] of Object.entries(CANDIDATES)) {
  const source = { ...size, ...entry.spec };
  let compiled;
  try {
    compiled = vl.compile(source).spec;
  } catch (err) {
    rows.push({ name, group: entry.group, status: 'FAILED', detail: `vega-lite: ${err.message}` });
    continue;
  }
  const specPath = path.join(OUT, `${name}.vg.json`);
  fs.writeFileSync(specPath, JSON.stringify(compiled, null, 2));

  let refMarks;
  try {
    refMarks = collectMarks(await referenceScene(compiled));
  } catch (err) {
    rows.push({ name, group: entry.group, status: 'FAILED', detail: `reference: ${err.message}` });
    continue;
  }

  let velaOut;
  try {
    velaOut = execFileSync(process.execPath, [SCENE_TOOL, specPath], { encoding: 'utf8' });
  } catch (err) {
    velaOut = String(err.stdout || '') + String(err.stderr || '');
  }
  if (!velaOut.trimStart().startsWith('{')) {
    rows.push({ name, group: entry.group, status: 'FAILED', detail: firstLine(velaOut) });
    continue;
  }

  const velaMarks = collectMarks(JSON.parse(velaOut));
  const diffs = [];
  let missing = 0;
  let total = 0;
  for (const [markName, refMark] of refMarks) {
    total++;
    const got = velaMarks.get(markName);
    if (!got) { missing++; continue; }
    const d = diffMark(refMark, got);
    if (d.length) diffs.push(`${markName}: ${d[0]}`);
  }

  if (missing) {
    rows.push({ name, group: entry.group, status: 'PARTIAL', detail: `${missing} of ${total} marks not built` });
  } else if (diffs.length) {
    rows.push({ name, group: entry.group, status: 'DIFF', detail: diffs.slice(0, 2).join(' | ') });
  } else {
    rows.push({ name, group: entry.group, status: 'ok', detail: `${total} marks` });
  }
}

let group = '';
for (const row of rows) {
  if (row.group !== group) {
    group = row.group;
    console.log(`\n${group}`);
  }
  const tag = row.status === 'ok' ? '  ok   ' : ` ${row.status} `;
  console.log(`${tag.padEnd(10)} ${row.name.padEnd(20)} ${row.detail}`);
}

const ok = rows.filter((r) => r.status === 'ok').length;
console.log(`\n${ok}/${rows.length} candidates already match the reference implementation`);
if (keep) console.log(`specs left in ${OUT}`);
else fs.rmSync(OUT, { recursive: true, force: true });

// --- the same comparison the parity harness makes ----------------------------

function round(v) { return Math.round(v * 1e6) / 1e6; }
function firstLine(text) { return (text.trim().split('\n')[0] || 'no output').slice(0, 120); }

async function referenceScene(spec) {
  const view = new vega.View(vega.parse(spec), { renderer: 'none' });
  await view.runAsync();
  return dumpMark(view.scenegraph().root);
}

function dumpMark(m) {
  const out = { marktype: m.marktype };
  if (m.name) out.name = m.name;
  if (m.role) out.role = m.role;
  out.items = (m.items || []).map(dumpItem);
  return out;
}

function dumpItem(it) {
  const out = {};
  for (const key of Object.keys(it)) {
    if (IGNORED.has(key) || key === 'items') continue;
    const v = it[key];
    if (v === null || v === undefined || typeof v === 'object' || typeof v === 'function') continue;
    out[key] = v;
  }
  if (it.items && it.items.length && it.items[0].marktype) out.items = it.items.map(dumpMark);
  return out;
}

function collectMarks(mark, out = new Map(), trail = []) {
  let key = mark.name || `${trail.join('/')}#${mark.role || mark.marktype}`;
  if (!mark.name && out.has(key)) {
    let n = 2;
    while (out.has(`${key}~${n}`)) n++;
    key = `${key}~${n}`;
  }
  out.set(key, mark);
  if (mark.marktype !== 'group') return out;
  for (const [i, item] of (mark.items || []).entries()) {
    for (const child of item.items || []) {
      collectMarks(child, out, trail.concat(`${mark.name || mark.role || 'group'}${i > 0 ? i : ''}`));
    }
  }
  return out;
}

function diffMark(ref, got) {
  const diffs = [];
  if (ref.marktype !== got.marktype) diffs.push(`marktype ${got.marktype} != ${ref.marktype}`);
  if (ref.items.length !== got.items.length) {
    diffs.push(`item count ${got.items.length} != ${ref.items.length}`);
    return diffs;
  }
  for (let i = 0; i < ref.items.length; i++) {
    for (const [key, refValue] of Object.entries(ref.items[i])) {
      if (key === 'items') continue;
      const gotValue = got.items[i][key];
      if (gotValue === undefined) diffs.push(`item ${i} missing ${key}`);
      else if (typeof refValue === 'number' && typeof gotValue === 'number') {
        if (Math.abs(refValue - gotValue) > TOLERANCE) diffs.push(`item ${i} ${key}=${round(gotValue)} != ${round(refValue)}`);
      } else if (String(refValue) !== String(gotValue)) {
        diffs.push(`item ${i} ${key}=${JSON.stringify(gotValue)} != ${JSON.stringify(refValue)}`);
      }
    }
  }
  return diffs;
}

