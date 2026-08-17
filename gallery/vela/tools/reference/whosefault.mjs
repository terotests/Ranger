// Which half is wrong — the compiler or the runtime?
//
// A chart that comes out different can be different for two quite separate
// reasons, and they need different work. So each chart is drawn twice: once
// from OUR compiled Vega and once from the REFERENCE'S, both through our own
// runtime and renderer, and both compared against the reference's SVG.
//
//   ours ✗  theirs ✓   the compiler is wrong; the runtime already draws it
//   ours ✗  theirs ✗   the runtime is wrong, whatever the compiler says
//   ours ✓             it already agrees
//
// That splits the remaining list into two piles that can be worked
// separately, instead of guessing chart by chart.
import fs from 'fs';
import path from 'path';
import { parseSvg, comparePrimitives } from './svgcompare.mjs';

import { fileURLToPath } from 'url';
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
  return lines.slice(1).map(l => {
    const parts = l.split(',');
    const row = {};
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

async function referenceSvg(vgSpec) {
  const view = new vega.View(vega.parse(vgSpec), { renderer: 'none' });
  await view.runAsync();
  return view.toSVG();
}

function drawsLike(vgSpec, refSvg) {
  let answer;
  try { answer = JSON.parse(VelaWeb.render(JSON.stringify(vgSpec), '')); }
  catch (e) { return { ok: false, why: 'threw: ' + e.message }; }
  if (!answer.ok) return { ok: false, why: (answer.errors || []).join(' | ').slice(0, 90) };
  const result = comparePrimitives(parseSvg(refSvg), parseSvg(answer.svg));
  return { ok: result.findings.length === 0, matched: result.matched, total: result.total,
           why: String(result.findings[0] || '').slice(0, 90) };
}

const compilerFault = [], runtimeFault = [], fine = [], skipped = [];
for (const name of process.argv.slice(2)) {
  const file = path.join(CORPUS, 'specs', name + '.vl.json');
  if (!fs.existsSync(file)) { skipped.push(name + ' (no spec)'); continue; }
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
  inlineData(spec);
  let theirVg;
  try { theirVg = vl.compile(JSON.parse(JSON.stringify(spec))).spec; }
  catch (e) { skipped.push(name + ' (reference would not compile)'); continue; }
  let refSvg;
  try { refSvg = await referenceSvg(theirVg); }
  catch (e) { skipped.push(name + ' (reference would not draw)'); continue; }

  const answer = JSON.parse(VelaWeb.render(JSON.stringify(spec), ''));
  if (!answer.ok || !answer.vega) { skipped.push(name + ' (we would not compile)'); continue; }
  const mine = drawsLike(JSON.parse(answer.vega), refSvg);
  if (mine.ok) { fine.push(name); continue; }
  const theirs = drawsLike(theirVg, refSvg);
  const line = `${name.padEnd(40)} ours ${String(mine.matched)}/${mine.total}   theirs ${theirs.ok ? 'EXACT' : theirs.matched + '/' + theirs.total}`;
  (theirs.ok ? compilerFault : runtimeFault).push(line + (theirs.ok ? '' : '   ' + theirs.why));
}

console.log('\n=== the COMPILER is at fault (our runtime draws the reference\'s Vega exactly) ===');
console.log(compilerFault.join('\n') || '(none)');
console.log('\n=== the RUNTIME is at fault (wrong either way) ===');
console.log(runtimeFault.join('\n') || '(none)');
console.log('\n=== already agree ===\n' + (fine.join(', ') || '(none)'));
console.log('\n=== not measured ===\n' + (skipped.join(', ') || '(none)'));
console.log(`\ncompiler ${compilerFault.length} · runtime ${runtimeFault.length} · agree ${fine.length} · skipped ${skipped.length}`);
