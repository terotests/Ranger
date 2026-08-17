// =============================================================================
// save.mjs — put one gallery example's two answers on disk, side by side.
// =============================================================================
//   node gallery/vela/tools/reference/save.mjs <name> [dir]
//
// The coverage run says WHICH examples disagree; this says what the two sides
// actually wrote. It drops four files in `dir` (default /tmp):
//
//   <name>.ref.svg   what the reference renderer drew
//   <name>.got.svg   what Vela drew
//   <name>.ref.vg    the Vega specification vega-lite compiled
//   <name>.got.vg    the Vega specification Vela compiled
//
// The pair of specifications is usually the faster read: a page that comes out
// the wrong size is nearly always a layout property that was never emitted,
// and that is visible in the specification long before it is visible in a
// thousand lines of SVG.
// =============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VELA = path.resolve(__dirname, '..', '..');
const CORPUS = path.join(VELA, 'tests', 'corpus');
const SPECS = path.join(CORPUS, 'specs');
const DATA = path.join(CORPUS, 'data');
const BUNDLE = path.join(VELA, 'bin', 'vela_web.js');

const [name, outDir = '/tmp'] = process.argv.slice(2);
if (!name) {
  console.error('usage: save.mjs <example-name> [dir]');
  process.exit(1);
}

const vega = await import('vega');
const vegaLite = await import('vega-lite');

function parseDelimited(text, sep) {
  const lines = text.split(/\r?\n/).filter((l) => l.length);
  const head = lines.shift().split(sep);
  return lines.map((line) => {
    const cells = line.split(sep);
    const row = {};
    head.forEach((key, i) => {
      const cell = cells[i];
      row[key] = cell === '' || cell === undefined ? null
        : Number.isNaN(Number(cell)) ? cell : Number(cell);
    });
    return row;
  });
}

function loadRows(url, format) {
  const file = path.join(DATA, url.replace(/^data\//, ''));
  const text = fs.readFileSync(file, 'utf8');
  const type = (format && format.type)
    || (url.endsWith('.csv') ? 'csv' : url.endsWith('.tsv') ? 'tsv' : 'json');
  if (type === 'csv') return parseDelimited(text, ',');
  if (type === 'tsv') return parseDelimited(text, '\t');
  return JSON.parse(text);
}

function inlineData(node) {
  if (Array.isArray(node)) { node.forEach(inlineData); return; }
  if (!node || typeof node !== 'object') return;
  if (typeof node.url === 'string') {
    node.values = loadRows(node.url, node.format);
    delete node.url;
    delete node.format;
  }
  for (const key of Object.keys(node)) inlineData(node[key]);
}

const spec = JSON.parse(fs.readFileSync(path.join(SPECS, `${name}.vl.json`), 'utf8'));
inlineData(spec);

const VelaWeb = (function () {
  const source = fs.readFileSync(BUNDLE, 'utf8').replace(/^#![^\n]*\n/, '');
  // eslint-disable-next-line no-new-func
  return new Function('require', `${source}\n; return VelaWeb;`)(undefined);
})();

// The data is inlined by now and would drown the specification it is attached
// to, so both compiled specifications are printed with their rows replaced by
// how many there were.
function withoutRows(node) {
  if (Array.isArray(node)) return node.map(withoutRows);
  if (!node || typeof node !== 'object') return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    out[key] = key === 'values' && Array.isArray(value)
      ? `«${value.length} rows»` : withoutRows(value);
  }
  return out;
}

const wrote = [];
function write(suffix, text) {
  const file = path.join(outDir, `${name}.${suffix}`);
  fs.writeFileSync(file, text);
  wrote.push(`${file}  ${text.length} bytes`);
}

const refVg = vegaLite.compile(structuredClone(spec)).spec;
write('ref.vg', JSON.stringify(withoutRows(refVg), null, 2));

const view = new vega.View(vega.parse(structuredClone(refVg)), { renderer: 'none' });
await view.runAsync();
write('ref.svg', await view.toSVG());

const answer = JSON.parse(VelaWeb.render(JSON.stringify(spec), ''));
if (!answer.ok) {
  console.log(`Vela refused it: ${(answer.errors || [])[0]}`);
} else {
  write('got.svg', answer.svg);
}
if (answer.vega) write('got.vg', JSON.stringify(withoutRows(JSON.parse(answer.vega)), null, 2));

console.log(wrote.join('\n'));
