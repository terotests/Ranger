// Where the reference PUTS things, straight out of its scenegraph: every group
// with its position, its declared size and the box its contents cover.
//
//   node refbounds.mjs trellis_scatter          (a chart in the corpus)
//   node refbounds.mjs /tmp/variant.json        (a spec file)
//   ALL=1 node refbounds.mjs interactive_overview_detail   (leaf marks too)
//
// A page that comes out a few pixels wrong is nearly always a group placed a
// few pixels wrong, and the numbers here are the ones the reference's own
// layout worked from: `b=[x1,y1,x2,y2]` is what a panel COVERS, which is what
// its pitch and the page's margins are computed from, and it is rarely the
// rectangle the panel declared.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const VELA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CORPUS = path.join(VELA, 'tests', 'corpus');
const vega = await import('vega');
const vl = await import('vega-lite');

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
const file = name.includes('/') || name.endsWith('.json')
  ? name : path.join(CORPUS, 'specs', name + '.vl.json');
const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
inlineData(spec);

const view = new vega.View(vega.parse(vl.compile(spec).spec), { renderer: 'none' });
await view.runAsync();

const box = b => b ? `[${[b.x1, b.y1, b.x2, b.y2].map(v => Math.round(v * 1e4) / 1e4).join(',')}]` : '[]';

function walk(mark, depth) {
  for (const item of mark.items || []) {
    if (mark.marktype === 'group') {
      console.log('  '.repeat(depth) + (mark.role || mark.name || 'group')
        + ` x=${item.x || 0} y=${item.y || 0} w=${item.width} h=${item.height} b=${box(item.bounds)}`);
      for (const child of item.items || []) walk(child, depth + 1);
    } else if (process.env.ALL) {
      console.log('  '.repeat(depth) + (mark.role || mark.marktype)
        + ` b=${box(item.bounds)} ${item.text !== undefined ? JSON.stringify(item.text) : ''}`);
    }
  }
}
walk(view.scenegraph().root, 0);
