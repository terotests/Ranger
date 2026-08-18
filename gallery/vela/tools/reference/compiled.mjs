// The two compiled Vega specifications side by side — ours and the
// reference's — for one chart. `specdiff` ranks the differences across the
// whole gallery; this is for reading one chart's in full, which is what you
// want once the difference is a scale property or a transform nobody emits.
//
//   node compiled.mjs bar_grouped_repeated          (both)
//   node compiled.mjs bar_grouped_repeated ours     (only ours)
//   node compiled.mjs bar_grouped_repeated theirs   (only the reference's)
//
// Inline data is replaced by "<<data>>": a gallery specification's rows are
// thousands of lines and never the thing that differs.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const VELA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CORPUS = path.join(VELA, 'tests', 'corpus');
const vl = await import('vega-lite');

const source = fs.readFileSync(path.join(VELA, 'bin', 'vela_web.js'), 'utf8').replace(/^#![^\n]*\n/, '');
const VelaWeb = new Function('require', `${source}\n; return VelaWeb;`)(undefined);

function loadData(url) {
  const file = path.join(CORPUS, url);
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, 'utf8');
  if (url.endsWith('.json')) return JSON.parse(text);
  const lines = text.trim().split('\n');
  const head = lines[0].split(',');
  return lines.slice(1).map(line => {
    const parts = line.split(','), row = {};
    head.forEach((h, i) => { const v = parts[i]; row[h] = v !== '' && !isNaN(v) ? +v : v; });
    return row;
  });
}
function inlineData(node) {
  if (Array.isArray(node)) { node.forEach(inlineData); return; }
  if (!node || typeof node !== 'object') return;
  if (node.data && node.data.url) { const rows = loadData(node.data.url); if (rows) node.data = { values: rows }; }
  for (const k of Object.keys(node)) inlineData(node[k]);
}

const name = process.argv[2];
const which = process.argv[3] || 'both';
const file = name.includes('/') || name.endsWith('.json')
  ? name : path.join(CORPUS, 'specs', name + '.vl.json');
const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
inlineData(spec);

// A data set's rows are the one thing that is never the difference.
const hide = o => JSON.stringify(o, (k, v) => (k === 'values' && Array.isArray(v)) ? '<<data>>' : v, 1);

if (which !== 'ours') {
  console.log('===== the reference =====');
  console.log(hide(vl.compile(JSON.parse(JSON.stringify(spec))).spec));
}
if (which !== 'theirs') {
  const answer = JSON.parse(VelaWeb.render(JSON.stringify(spec), ''));
  console.log('===== ours =====');
  console.log(answer.ok ? hide(JSON.parse(answer.vega)) : JSON.stringify(answer.errors, null, 1));
}
