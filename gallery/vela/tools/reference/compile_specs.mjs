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

fs.mkdirSync(SPEC_DIR, { recursive: true });
for (const [name, spec] of Object.entries(SPECS)) {
  fs.writeFileSync(path.join(SPEC_DIR, `${name}.vl.json`), JSON.stringify(spec, null, 2) + '\n');
  const compiled = vl.compile(spec).spec;
  fs.writeFileSync(path.join(SPEC_DIR, `${name}.vg.json`), JSON.stringify(compiled, null, 2) + '\n');
  console.log(`${name}.vg.json`);
}
console.log(`\n${Object.keys(SPECS).length} specs written to ${path.relative(process.cwd(), SPEC_DIR)}`);
