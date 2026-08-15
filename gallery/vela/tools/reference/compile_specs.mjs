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

fs.mkdirSync(SPEC_DIR, { recursive: true });
const SHOWCASE_DIR = path.join(SPEC_DIR, 'showcase');
fs.mkdirSync(SHOWCASE_DIR, { recursive: true });

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

console.log(`\n${Object.keys(SPECS).length} specs + ${SHOWCASE.charts.length} showcase specs written to ${path.relative(process.cwd(), SPEC_DIR)}`);
