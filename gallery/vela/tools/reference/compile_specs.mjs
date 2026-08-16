// =============================================================================
// compile_specs.mjs — the Vega-Lite sources of the test specs, and their
// compiled Vega form.
// =============================================================================
// The `.vg.json` files under tests/specs are the input Vela actually runs, and
// they are generated, not hand-written: `vegaLite.compile(spec).spec` from the
// official compiler, so they are exactly what a real Vega-Lite chart produces
// and cannot drift into something convenient.
//
//   node gallery/vela/tools/reference/compile_specs.mjs
//
// Re-run it to regenerate after a Vega-Lite version bump; the diff on the
// committed `.vg.json` files is then the upstream change, which is worth
// seeing on its own.
// =============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPEC_DIR = path.resolve(__dirname, '..', '..', 'tests', 'specs');

let vl;
try {
  vl = await import('vega-lite');
} catch {
  console.log('vega-lite is not installed — no specs were generated.');
  console.log('install it to regenerate:  npm install --no-save vega vega-lite');
  process.exit(0);
}

// One small data set for every chart, so a difference between two specs is the
// chart and not the numbers.
const values = [
  { a: 'A', b: 28, c: 5, g: 'x' }, { a: 'B', b: 55, c: 9, g: 'y' },
  { a: 'C', b: 43, c: 2, g: 'x' }, { a: 'D', b: 91, c: 7, g: 'y' },
  { a: 'E', b: 81, c: 4, g: 'x' }, { a: 'F', b: 53, c: 6, g: 'y' },
  { a: 'G', b: 19, c: 8, g: 'x' }, { a: 'H', b: 87, c: 1, g: 'y' },
  { a: 'I', b: 52, c: 3, g: 'x' },
];

const SPECS = {
  bar: {
    description: 'A simple bar chart with embedded data.',
    data: { values },
    mark: 'bar',
    encoding: {
      x: { field: 'a', type: 'nominal', axis: { labelAngle: 0 } },
      y: { field: 'b', type: 'quantitative' },
    },
  },
  scatter: {
    data: { values },
    mark: 'point',
    encoding: {
      x: { field: 'c', type: 'quantitative' },
      y: { field: 'b', type: 'quantitative' },
    },
  },
  line: {
    data: { values },
    mark: 'line',
    encoding: {
      x: { field: 'c', type: 'quantitative' },
      y: { field: 'b', type: 'quantitative' },
    },
  },
  area: {
    data: { values },
    mark: 'area',
    encoding: {
      x: { field: 'c', type: 'quantitative' },
      y: { field: 'b', type: 'quantitative' },
    },
  },
  tick: {
    data: { values },
    mark: 'tick',
    encoding: {
      x: { field: 'b', type: 'quantitative' },
      y: { field: 'a', type: 'nominal' },
    },
  },
  bar_stacked: {
    data: { values },
    mark: 'bar',
    encoding: {
      x: { field: 'g', type: 'nominal' },
      y: { field: 'b', type: 'quantitative', aggregate: 'sum' },
      color: { field: 'a', type: 'nominal' },
    },
  },
  bar_grouped: {
    data: { values },
    mark: 'bar',
    encoding: {
      x: { field: 'g', type: 'nominal' },
      y: { field: 'b', type: 'quantitative' },
      xOffset: { field: 'a', type: 'nominal' },
    },
  },
  bubble: {
    data: { values },
    mark: 'point',
    encoding: {
      x: { field: 'c', type: 'quantitative' },
      y: { field: 'b', type: 'quantitative' },
      size: { field: 'b', type: 'quantitative' },
    },
  },
  histogram: {
    data: { values },
    mark: 'bar',
    encoding: {
      x: { field: 'b', type: 'quantitative', bin: true },
      y: { aggregate: 'count' },
    },
  },
  pie: {
    data: { values },
    mark: 'arc',
    encoding: {
      theta: { field: 'b', type: 'quantitative' },
      color: { field: 'a', type: 'nominal' },
    },
  },
  text_labels: {
    data: { values },
    mark: 'text',
    encoding: {
      x: { field: 'c', type: 'quantitative' },
      y: { field: 'b', type: 'quantitative' },
      text: { field: 'a', type: 'nominal' },
    },
  },
  scatter_colored: {
    data: { values },
    mark: 'point',
    encoding: {
      x: { field: 'c', type: 'quantitative' },
      y: { field: 'b', type: 'quantitative' },
      color: { field: 'g', type: 'nominal' },
    },
  },
  // Charts the triage found reachable, graduated into the parity set: a
  // candidate that matches the reference is not a candidate any more.
  bar_labelled: {
    data: { values },
    layer: [
      { mark: 'bar', encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } } },
      { mark: { type: 'text', dy: -6 }, encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'b', type: 'quantitative' }, text: { field: 'b', type: 'quantitative' } } },
    ],
  },
  bar_normalized: {
    data: { values },
    mark: 'bar',
    encoding: {
      x: { field: 'g', type: 'nominal' },
      y: { field: 'b', type: 'quantitative', aggregate: 'sum', stack: 'normalize' },
      color: { field: 'a', type: 'nominal' },
    },
  },
  line_coloured: {
    data: { values },
    mark: 'line',
    encoding: {
      x: { field: 'c', type: 'quantitative' },
      y: { field: 'b', type: 'quantitative' },
      color: { field: 'g', type: 'nominal' },
    },
  },
  line_temporal: {
    data: { values: values.map((d, i) => ({ ...d, t: `2024-0${(i % 9) + 1}-01` })) },
    mark: 'line',
    encoding: {
      x: { field: 't', type: 'temporal' },
      y: { field: 'b', type: 'quantitative' },
    },
  },
  streamgraph: {
    data: { values },
    mark: 'area',
    encoding: {
      x: { field: 'c', type: 'quantitative' },
      y: { field: 'b', type: 'quantitative', stack: 'center' },
      color: { field: 'g', type: 'nominal' },
    },
  },
  heatmap: {
    data: { values },
    mark: 'rect',
    encoding: {
      x: { field: 'a', type: 'nominal' },
      y: { field: 'g', type: 'nominal' },
      color: { field: 'b', type: 'quantitative' },
    },
  },
  boxplot: {
    data: { values },
    mark: 'boxplot',
    encoding: { x: { field: 'g', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } },
  },
  donut: {
    data: { values },
    mark: { type: 'arc', innerRadius: 30 },
    encoding: { theta: { field: 'b', type: 'quantitative' }, color: { field: 'a', type: 'nominal' } },
  },
  facet_columns: {
    data: { values },
    mark: 'bar',
    encoding: {
      x: { field: 'a', type: 'nominal' },
      y: { field: 'b', type: 'quantitative' },
      column: { field: 'g', type: 'nominal' },
    },
  },
  // Six-hourly readings across the European Union's spring clock change
  // (2024-03-31 01:00 UTC). Its whole job is to be drawn in more than one wall
  // clock: tools/reference/zones.mjs runs it in eight, and the hours either
  // side of a transition are where a zone implementation is wrong if it is
  // wrong anywhere. The dates are written out rather than generated so the spec
  // is the same file on every run.
  line_dst: {
    data: {
      values: Array.from({ length: 20 }, (unused, i) => ({
        t: new Date(Date.UTC(2024, 2, 30, 0) + i * 6 * 3600e3).toISOString(),
        b: 20 + (i % 7) * 9,
      })),
    },
    mark: 'line',
    encoding: {
      x: { field: 't', type: 'temporal' },
      y: { field: 'b', type: 'quantitative' },
    },
  },
  // Six-hourly readings across the European Union's 1995 autumn change, which
  // was in SEPTEMBER — the union moved it to October the following year. Its
  // whole job is to be drawn in a zone whose rule has since changed:
  // tools/reference/zones.mjs runs it in eight, and a runtime carrying only
  // each zone's current rule is an hour out on every one of these rows.
  line_historical: {
    data: {
      values: Array.from({ length: 20 }, (unused, i) => ({
        t: new Date(Date.UTC(1995, 8, 23, 0) + i * 6 * 3600e3).toISOString(),
        b: 20 + (i % 7) * 9,
      })),
    },
    mark: 'line',
    encoding: {
      x: { field: 't', type: 'temporal' },
      y: { field: 'b', type: 'quantitative' },
    },
  },
  // The other two ways a trellis can be arranged. A row facet stacks the cells
  // and turns the shared title on its side; a wrapped facet has neither row
  // headers nor column headers and titles every cell instead, its grid sized by
  // a `sequence` over the facet domain.
  facet_rows: {
    data: { values },
    mark: 'bar',
    encoding: {
      x: { field: 'a', type: 'nominal' },
      y: { field: 'b', type: 'quantitative' },
      row: { field: 'g', type: 'nominal' },
    },
  },
  facet_wrapped: {
    data: { values },
    mark: 'bar',
    columns: 2,
    encoding: {
      x: { field: 'g', type: 'nominal' },
      y: { field: 'b', type: 'quantitative' },
      facet: { field: 'a', type: 'nominal' },
    },
  },
  concat_two: {
    data: { values },
    hconcat: [
      { mark: 'bar', encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } } },
      { mark: 'point', encoding: { x: { field: 'c', type: 'quantitative' }, y: { field: 'b', type: 'quantitative' } } },
    ],
  },
  scatter_log: {
    data: { values },
    mark: 'point',
    encoding: {
      x: { field: 'c', type: 'quantitative' },
      y: { field: 'b', type: 'quantitative', scale: { type: 'log' } },
    },
  },
  layered: {
    data: { values },
    layer: [
      { mark: 'line', encoding: { x: { field: 'c', type: 'quantitative' }, y: { field: 'b', type: 'quantitative' } } },
      { mark: 'point', encoding: { x: { field: 'c', type: 'quantitative' }, y: { field: 'b', type: 'quantitative' } } },
    ],
  },
};

// The showcase draws several charts on one printed page, so it uses the same
// specs at a size that fits. They are compiled the same way — a Vega-Lite spec
// with a width and a height is still a Vega-Lite spec — and kept apart from the
// parity specs so that shrinking a chart for the page cannot change what the
// comparison measures.
const SHOWCASE = {
  width: 170,
  height: 100,
  charts: ['bar', 'bar_stacked', 'line', 'area', 'scatter', 'histogram', 'pie'],
  // The showcase draws its charts on a transparent background, over a page that
  // is cream in one theme and near-black in the other. The default guide colour
  // is #000, which disappears against the dark one, so these specs ask for a
  // mid grey that reads on both. It is a property of the chart, not of the
  // theme — a chart carries its own colours — so it belongs in the spec.
  config: {
    axis: {
      labelColor: '#8a8f98',
      titleColor: '#8a8f98',
      domainColor: '#8a8f98',
      tickColor: '#8a8f98',
      gridColor: '#8a8f98',
      gridOpacity: 0.25,
    },
    // The plot frame is a style, not an axis.
    style: { cell: { stroke: '#8a8f98', strokeOpacity: 0.4 } },
  },
};

// The showcase's SECOND chart page, which exists to be varied rather than
// pretty: the chart types the first page does not show, and the features that
// only appear on some of them — a size legend whose rows are all different
// heights, a stroke legend, a log axis that labels only some of its ticks, two
// marks in one plot, and a text mark. Eight charts to a page rather than six,
// so each one is smaller.
// A third generated page: the chart types the runtime learned most recently,
// which are also the ones that exercise the most of it — a colour ramp with a
// gradient key, a series that is a faceted group, a stack centred on a common
// line, a calendar on an axis.
const MORE = {
  width: 150,
  height: 78,
  charts: ['heatmap', 'boxplot', 'line_coloured', 'streamgraph', 'line_temporal', 'donut', 'bar_normalized', 'bar_labelled'],
};

// A fourth generated page: the charts that are more than one chart. These are
// the ones whose SIZE is not the size of a plot — a trellis is as wide as its
// panels and the furniture around them, so the width and height below are per
// PANEL and the page has to hold whatever that adds up to. Four to a page
// rather than eight, because each one is a grid.

const PLOTS_CONFIG = {
  ...SHOWCASE.config,
  // A text mark is the one data mark whose default colour is black, which
  // disappears on the dark theme the same way the guides would. Same reason,
  // same answer: the chart states a colour that reads on both.
  text: { color: '#8a8f98' },
};

const PLOTS = {
  width: 150,
  height: 78,
  charts: ['bar_grouped', 'area', 'bubble', 'scatter_colored', 'scatter_log', 'layered', 'text_labels', 'tick'],
  config: PLOTS_CONFIG,
};

const VIEWS = {
  width: 78,
  height: 62,
  charts: ['facet_columns', 'facet_rows', 'facet_wrapped', 'concat_two'],
  config: {
    ...PLOTS_CONFIG,
    // The furniture only a multi-view chart has: the value each panel stands
    // for, and the field the panels are split by. They are drawn as GROUP
    // titles rather than as axis or legend text, so the axis colours above do
    // not reach them, and on the dark theme they would be near-black on
    // near-black.
    style: {
      ...PLOTS_CONFIG.style,
      'guide-label': { fill: '#8a8f98' },
      'guide-title': { fill: '#8a8f98' },
    },
  },
};

fs.mkdirSync(SPEC_DIR, { recursive: true });
const SHOWCASE_DIR = path.join(SPEC_DIR, 'showcase');
fs.mkdirSync(SHOWCASE_DIR, { recursive: true });
const PLOTS_DIR = path.join(SPEC_DIR, 'plots');
fs.mkdirSync(PLOTS_DIR, { recursive: true });
const MORE_DIR = path.join(SPEC_DIR, 'more');
fs.mkdirSync(MORE_DIR, { recursive: true });

for (const [name, spec] of Object.entries(SPECS)) {
  fs.writeFileSync(path.join(SPEC_DIR, `${name}.vl.json`), JSON.stringify(spec, null, 2) + '\n');
  const compiled = vl.compile(spec).spec;
  fs.writeFileSync(path.join(SPEC_DIR, `${name}.vg.json`), JSON.stringify(compiled, null, 2) + '\n');
  console.log(`${name}.vg.json`);
}

for (const name of SHOWCASE.charts) {
  const spec = { ...SPECS[name], width: SHOWCASE.width, height: SHOWCASE.height, config: SHOWCASE.config };
  // An arc chart is square: its radius is min(width, height) / 2.
  if (name === 'pie') { spec.width = 130; spec.height = 130; }
  // The page paints the background, so the chart does not.
  spec.background = null;
  const compiled = vl.compile(spec).spec;
  fs.writeFileSync(path.join(SHOWCASE_DIR, `${name}.vg.json`), JSON.stringify(compiled, null, 2) + '\n');
  console.log(`showcase/${name}.vg.json`);
}

for (const name of PLOTS.charts) {
  const spec = { ...SPECS[name], width: PLOTS.width, height: PLOTS.height, config: PLOTS.config };
  // A tick chart's y axis is one band per category, so it needs room per row
  // rather than a fixed height; nine of them at 78px would overprint.
  if (name === 'tick') { spec.height = 108; }
  spec.background = null;
  const compiled = vl.compile(spec).spec;
  fs.writeFileSync(path.join(PLOTS_DIR, `${name}.vg.json`), JSON.stringify(compiled, null, 2) + '\n');
  console.log(`plots/${name}.vg.json`);
}

for (const name of MORE.charts) {
  const spec = { ...SPECS[name], width: MORE.width, height: MORE.height, config: PLOTS.config };
  // A heat map is a grid of cells, so it needs a row per category rather than
  // a fixed height, and a donut is square.
  if (name === 'donut') { spec.width = 110; spec.height = 110; }
  spec.background = null;
  const compiled = vl.compile(spec).spec;
  fs.writeFileSync(path.join(MORE_DIR, `${name}.vg.json`), JSON.stringify(compiled, null, 2) + '\n');
  console.log(`more/${name}.vg.json`);
}

const VIEWS_DIR = path.join(SPEC_DIR, 'views');
fs.mkdirSync(VIEWS_DIR, { recursive: true });
for (const name of VIEWS.charts) {
  const spec = { ...SPECS[name], width: VIEWS.width, height: VIEWS.height, config: VIEWS.config };
  // These are the only charts whose page size is not their plot size, and the
  // page is what constrains them: a printed column is about 250pt wide, so a
  // trellis has to be shaped to fit rather than sized to fit.
  //
  // A row facet stacks its panels, so each has to be short enough that the
  // column of them fits.
  if (name === 'facet_rows') { spec.height = 44; }
  // Nine panels two across is five rows and taller than the page. Three across
  // is three rows, which is also a better picture of what wrapping IS.
  if (name === 'facet_wrapped') { spec.columns = 3; spec.width = 40; spec.height = 32; }
  // A concatenation is as wide as its panes, and a band pane is as wide as its
  // BANDS — nine of them at the default step is wider than the page on its own.
  // So the left pane here counts two groups rather than nine categories.
  if (name === 'concat_two') {
    // A pane sizes itself: a concatenation has no width of its own to hand
    // down, so each pane says how big it is.
    spec.hconcat = [
      { width: 40, height: 62, mark: 'bar', encoding: { x: { field: 'g', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } } },
      { width: 84, height: 62, mark: 'point', encoding: { x: { field: 'c', type: 'quantitative' }, y: { field: 'b', type: 'quantitative' } } },
    ];
    delete spec.width;
    delete spec.height;
  }
  spec.background = null;
  const compiled = vl.compile(spec).spec;
  fs.writeFileSync(path.join(VIEWS_DIR, `${name}.vg.json`), JSON.stringify(compiled, null, 2) + '\n');
  console.log(`views/${name}.vg.json`);
}

console.log(`\n${Object.keys(SPECS).length} specs + ${SHOWCASE.charts.length} showcase + ${PLOTS.charts.length} plot specs written to ${path.relative(process.cwd(), SPEC_DIR)}`);
