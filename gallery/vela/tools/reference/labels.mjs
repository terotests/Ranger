// =============================================================================
// labels.mjs — which words does each side put on the chart?
// =============================================================================
//   node gallery/vela/tools/reference/labels.mjs [name…]
//
// coverage.mjs compares ink and stops at the first difference, which is the
// right thing for a verdict and the wrong thing for a diagnosis: a chart whose
// page is four pixels wide of the reference's usually has a label the other
// one does not, and the label says what went wrong far more directly than the
// geometry does. This prints the two sets of drawn TEXT and the difference
// between them — a tick that was formatted differently, an axis title that
// names one column too many, a legend that should not be there at all.
//
// Labels hidden by the overlap pass are excluded from both sides, so an axis
// that thins its labels the same way reads as agreeing.
// =============================================================================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VELA = path.resolve(__dirname, '..', '..');
const CORPUS = path.join(VELA, 'tests', 'corpus');

const vega = await import('vega');
const vegaLite = await import('vega-lite');

const VelaWeb = (function () {
  const source = fs.readFileSync(path.join(VELA, 'bin', 'vela_web.js'), 'utf8').replace(/^#![^\n]*\n/, '');
  return new Function('require', `${source}\n; return VelaWeb;`)(undefined);
})();

function splitRow(line, sep) {
  const out = []; let cell = '', quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) { if (c === '"') { if (line[i + 1] === '"') { cell += '"'; i++; } else quoted = false; } else cell += c; }
    else if (c === '"') quoted = true;
    else if (c === sep) { out.push(cell); cell = ''; }
    else cell += c;
  }
  out.push(cell); return out;
}
function parseDelimited(text, sep) {
  const lines = text.split(/\r?\n/).filter((l) => l.length);
  const head = splitRow(lines[0], sep);
  return lines.slice(1).map((l) => {
    const cells = splitRow(l, sep); const row = {};
    head.forEach((h, i) => {
      const v = cells[i];
      row[h] = v === undefined || v === '' ? null : (v.trim() === '' || isNaN(Number(v)) ? v : Number(v));
    });
    return row;
  });
}
function inlineData(node) {
  if (Array.isArray(node)) { node.forEach(inlineData); return; }
  if (!node || typeof node !== 'object') return;
  if (typeof node.url === 'string') {
    const file = path.join(CORPUS, 'data', path.basename(node.url));
    const text = fs.readFileSync(file, 'utf8');
    const type = (node.format && node.format.type) || (node.url.endsWith('.csv') ? 'csv'
      : node.url.endsWith('.tsv') ? 'tsv' : 'json');
    node.values = type === 'csv' ? parseDelimited(text, ',')
      : type === 'tsv' ? parseDelimited(text, '\t') : JSON.parse(text);
    delete node.url; delete node.format;
    return;
  }
  for (const key of Object.keys(node)) inlineData(node[key]);
}

/** The text a reader can actually see: what is drawn, minus what was thinned. */
function visibleText(svg) {
  const out = [];
  for (const m of svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)) {
    const opacity = /opacity="([\d.]+)"/.exec(m[0]);
    if (opacity && Number(opacity[1]) === 0) continue;
    out.push(m[1]);
  }
  return out;
}

const names = process.argv.slice(2);
if (!names.length) {
  console.log('usage: node gallery/vela/tools/reference/labels.mjs <name…>');
  process.exit(0);
}

for (const name of names) {
  try {
    const spec = JSON.parse(fs.readFileSync(path.join(CORPUS, 'specs', `${name}.vl.json`), 'utf8'));
    inlineData(spec);
    const view = new vega.View(vega.parse(vegaLite.compile(spec).spec), { renderer: 'none' });
    await view.runAsync();
    const theirs = visibleText(await view.toSVG());
    const answer = JSON.parse(VelaWeb.render(JSON.stringify(spec), 'UTC'));
    const mine = answer.ok ? visibleText(answer.svg) : [`refused: ${(answer.errors || []).join('; ')}`];
    const inMine = new Set(mine), inTheirs = new Set(theirs);
    const onlyTheirs = theirs.filter((t) => !inMine.has(t));
    const onlyMine = mine.filter((t) => !inTheirs.has(t));
    if (!onlyTheirs.length && !onlyMine.length) { console.log(`${name}: the labels agree`); continue; }
    console.log(name);
    console.log('   only the reference:', JSON.stringify(onlyTheirs.slice(0, 12)));
    console.log('   only this one     :', JSON.stringify(onlyMine.slice(0, 12)));
  } catch (e) {
    console.log(`${name}: ${String(e.message).slice(0, 80)}`);
  }
}
