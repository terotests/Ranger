/**
 * chart_api.mjs — do the charts the API BUILDS draw what the reference draws?
 *
 *   npm run vela:chart                       # write them
 *   node gallery/vela/tools/reference/chart_api.mjs
 *
 * `tools/vela_chart.rgr` builds its charts by calling `VlChart` — there is no
 * specification text in that file — and writes each one out twice: the
 * Vega-Lite the API produced, and the SVG Vela drew from it. This takes the
 * first and gives it to the official implementations:
 *
 *          the Vega-Lite the API built
 *              │                  │
 *     official vega-lite       VlCompile      ← already drawn by vela_chart
 *              │                  │
 *        official vega         VlRuntime
 *              │                  │
 *        view.toSVG()           VlSvg
 *              │                  │
 *              └─── ink diff ─────┘
 *
 * The comparison is `svgcompare.mjs`, the same one the renderer harness uses:
 * outlines to a quarter of a pixel, text by its anchor. It is deliberately
 * NOT a comparison of mark names or of scene structure — two compilers may
 * name a group differently and draw the same chart, and what a caller of this
 * API cares about is the picture.
 *
 * A measurement rather than a gate, for the reason `coverage.mjs` is: what it
 * finds is a queue, and a chart that does not match is more useful reported
 * than removed from the demo.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseSvg, comparePrimitives } from './svgcompare.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VELA = path.resolve(__dirname, '..', '..');
const ROOT = path.resolve(VELA, '..', '..');
const DIR = process.argv[2] ? path.resolve(ROOT, process.argv[2]) : path.join(VELA, 'bin', 'chart-api');

let vega, vegaLite;
try {
  vega = await import('vega');
  vegaLite = await import('vega-lite');
} catch {
  console.log('vega and vega-lite are not installed — the chart api was not compared.');
  console.log('install the reference to run this:  npm install --no-save vega vega-lite');
  process.exit(0);
}

if (!fs.existsSync(DIR)) {
  console.error(`${path.relative(ROOT, DIR)} does not exist — write the charts first: npm run vela:chart`);
  process.exit(1);
}

const names = fs.readdirSync(DIR)
  .filter((f) => f.endsWith('.vl.json'))
  .map((f) => f.replace(/\.vl\.json$/, ''))
  .sort();

if (names.length === 0) {
  console.error(`no specifications in ${path.relative(ROOT, DIR)} — write them first: npm run vela:chart`);
  process.exit(1);
}

const rows = [];
for (const name of names) {
  const spec = JSON.parse(fs.readFileSync(path.join(DIR, `${name}.vl.json`), 'utf8'));
  const drawnPath = path.join(DIR, `${name}.svg`);
  if (!fs.existsSync(drawnPath)) {
    rows.push({ name, verdict: 'missing', why: 'the API built it but Vela drew nothing' });
    continue;
  }

  let refSvg;
  try {
    const view = new vega.View(vega.parse(vegaLite.compile(spec).spec), { renderer: 'none' });
    await view.runAsync();
    refSvg = await view.toSVG();
  } catch (err) {
    rows.push({ name, verdict: 'skipped', why: `the reference refused it: ${err.message}` });
    continue;
  }

  const result = comparePrimitives(parseSvg(refSvg), parseSvg(fs.readFileSync(drawnPath, 'utf8')));
  if (result.findings.length === 0) {
    rows.push({ name, verdict: 'same', why: `${result.matched} primitives` });
  } else {
    rows.push({ name, verdict: 'differs', why: `${result.findings.length} of ${result.findings.length + result.matched}: ${result.findings[0]}` });
  }
}

const width = Math.max(...rows.map((r) => r.name.length));
for (const row of rows) {
  const tag = row.verdict === 'same' ? '  ok  ' : ` ${row.verdict.toUpperCase()} `;
  console.log(`${tag.padEnd(10)} ${row.name.padEnd(width)}  ${row.why}`);
}
const same = rows.filter((r) => r.verdict === 'same').length;
console.log(`\n${same}/${rows.length} charts built by the API draw what the reference draws`);
