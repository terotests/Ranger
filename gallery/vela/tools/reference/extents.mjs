// =============================================================================
// extents.mjs — WHERE does a chart come out a different size?
// =============================================================================
//   node gallery/vela/tools/reference/extents.mjs [name…]
//
// coverage.mjs says a chart is 15 pixels too wide. That is a symptom: the page
// is the plot plus what the guides around it reserved, so a wrong page means a
// wrong guide, and which guide it is decides what to go and read. This takes
// both SVGs apart and reports the four margins separately, plus the plot the
// margins are around — so "the legend on the right is 15 wider" and "the plot
// itself is 15 wider" stop looking like the same fact.
// =============================================================================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VELA = path.resolve(__dirname, '..', '..');
const CORPUS = path.join(VELA, 'tests', 'corpus');
const BUNDLE = path.join(VELA, 'bin', 'vela_web.js');

const vega = await import('vega');
const vegaLite = await import('vega-lite');

const VelaWeb = (function () {
  const source = fs.readFileSync(BUNDLE, 'utf8').replace(/^#![^\n]*\n/, '');
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
    if (!fs.existsSync(file)) throw new Error(`no local copy of ${node.url}`);
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

// The four numbers that describe a laid-out chart: the page, the plot inside
// it, and where the plot sits. Everything else follows from those. The two
// renderers write the plot rectangle differently — one as a relative box, one
// as absolute corners — so each is read on its own terms rather than by a
// pattern that happens to match both.
function shape(svg) {
  const size = /<svg[^>]*width="([\d.]+)"[^>]*height="([\d.]+)"/.exec(svg);
  const page = size ? [Number(size[1]), Number(size[2])] : [NaN, NaN];
  let left = NaN, top = NaN, w = NaN, h = NaN;
  if (svg.includes('role-frame')) {
    const root = /<g fill="none"[^>]*transform="translate\(([-\d.]+),([-\d.]+)\)"/.exec(svg);
    const box = /<path class="background"[^>]*d="M[\d.]+,[\d.]+h([-\d.]+)v([-\d.]+)/.exec(svg);
    if (root) { left = Number(root[1]); top = Number(root[2]); }
    if (box) { w = Number(box[1]); h = Number(box[2]); }
  } else {
    const box = /<path d="M([\d.]+),([\d.]+) L([\d.]+),\2 L\3,([\d.]+)/.exec(svg);
    if (box) {
      left = Number(box[1]) - 0.5; top = Number(box[2]) - 0.5;
      w = Number(box[3]) - Number(box[1]); h = Number(box[4]) - Number(box[2]);
    }
  }
  return { page, plot: [w, h], left, top, right: page[0] - left - w, bottom: page[1] - top - h };
}

const names = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(path.join(CORPUS, 'specs')).map((f) => f.replace(/\.vl\.json$/, ''));

console.log('name'.padEnd(42) + '  page        plot        left  right top   bottom');
for (const name of names) {
  const file = path.join(CORPUS, 'specs', `${name}.vl.json`);
  if (!fs.existsSync(file)) { console.log(`${name}: no such spec`); continue; }
  let mine, theirs;
  try {
    const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
    inlineData(spec);
    const view = new vega.View(vega.parse(vegaLite.compile(spec).spec), { renderer: 'none' });
    await view.runAsync();
    theirs = shape(await view.toSVG());
    const r = JSON.parse(VelaWeb.render(JSON.stringify(spec), 'UTC'));
    if (!r.ok) { console.log(`${name.padEnd(42)}  refused: ${(r.errors || []).join('; ').slice(0, 60)}`); continue; }
    mine = shape(r.svg);
  } catch (e) {
    console.log(`${name.padEnd(42)}  ${String(e.message).slice(0, 60)}`);
    continue;
  }
  const d = (a, b) => { const v = Math.round((a - b) * 100) / 100; return v === 0 ? '  ·  ' : String(v).padStart(5); };
  const same = ['page', 'plot'].every((k) => mine[k].every((v, i) => Math.abs(v - theirs[k][i]) < 0.01))
    && ['left', 'top', 'right', 'bottom'].every((k) => Math.abs(mine[k] - theirs[k]) < 0.01);
  if (same) continue;
  console.log(
    name.padEnd(42) + '  '
    + `${d(mine.page[0], theirs.page[0])},${d(mine.page[1], theirs.page[1])}  `
    + `${d(mine.plot[0], theirs.plot[0])},${d(mine.plot[1], theirs.plot[1])}  `
    + `${d(mine.left, theirs.left)} ${d(mine.right, theirs.right)} ${d(mine.top, theirs.top)} ${d(mine.bottom, theirs.bottom)}`);
}
