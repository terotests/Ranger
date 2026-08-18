// Every way one chart is drawn differently, listed. `whosefault` says WHICH
// half is wrong and `specdiff` says which cause affects the most charts; this
// says, for one chart, exactly what came out in the wrong place — which is
// what you need once you have chosen the chart and are down to the pixel.
//
//   node differences.mjs bar_layered_weather layer_likert
//   node differences.mjs /tmp/variant.json          (a spec file, to bisect)
//   THEIRS=1 node differences.mjs trellis_barley    (draw the REFERENCE's Vega
//                                                    through our runtime)
//   N=40 node differences.mjs …                     (how many to print)
//
// Bisecting is what the file form is for: copy the spec, take one property
// out, and see which finding goes away.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseSvg, comparePrimitives } from './svgcompare.mjs';

const VELA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CORPUS = path.join(VELA, 'tests', 'corpus');
const vega = await import('vega');
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

const limit = Number(process.env.N || 30);
const useTheirs = process.env.THEIRS === '1';

for (const name of process.argv.slice(2)) {
  // A name is a chart in the corpus; anything with a slash or a suffix is a
  // spec file, which is how a cut-down variant gets measured.
  const file = name.includes('/') || name.endsWith('.json')
    ? name : path.join(CORPUS, 'specs', name + '.vl.json');
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
  inlineData(spec);

  let refSvg;
  try {
    const theirVg = vl.compile(JSON.parse(JSON.stringify(spec))).spec;
    const view = new vega.View(vega.parse(theirVg), { renderer: 'none' });
    await view.runAsync();
    refSvg = await view.toSVG();
    if (useTheirs) spec.__vg = theirVg;
  } catch (e) {
    console.log(`=== ${name}  the reference would not draw it: ${e.message}`);
    continue;
  }

  const answer = JSON.parse(VelaWeb.render(JSON.stringify(useTheirs ? spec.__vg : spec), ''));
  if (!answer.ok) {
    console.log(`=== ${name}  we would not draw it: ${(answer.errors || []).join(' | ')}`);
    continue;
  }
  const result = comparePrimitives(parseSvg(refSvg), parseSvg(answer.svg));
  console.log(`=== ${name}  matched ${result.matched}/${result.total}  findings ${result.findings.length}`);
  for (const finding of result.findings.slice(0, limit)) console.log('   ' + finding);
  if (result.findings.length > limit) console.log(`   … and ${result.findings.length - limit} more`);
}
