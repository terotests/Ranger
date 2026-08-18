// The same comparison as specdiff_batch, but for ONE key-path pattern, showing
// what each side actually says. The frequency table says which cause to chase;
// this says what the cause is.
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

// Arrays of named things — scales, data sets, marks, signals — are compared by
// NAME rather than by position. Both sides emit the same scales in different
// orders, and lining them up by index reports every one of them as different,
// which buries the handful that really are.
function keyed(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  if (!list.every(e => e && typeof e === 'object' && typeof e.name === 'string')) return null;
  const map = new Map();
  for (const e of list) map.set(e.name, e);
  return map.size === list.length ? map : null;
}

function walk(ours, theirs, at, out) {
  const bothObj = ours && theirs && typeof ours === 'object' && typeof theirs === 'object'
    && !Array.isArray(ours) && !Array.isArray(theirs);
  if (bothObj) {
    for (const k of new Set([...Object.keys(ours), ...Object.keys(theirs)])) walk(ours[k], theirs[k], at ? at + '.' + k : k, out);
    return;
  }
  if (Array.isArray(ours) && Array.isArray(theirs)) {
    const a = keyed(ours), b = keyed(theirs);
    if (a && b) {
      for (const k of new Set([...a.keys(), ...b.keys()])) walk(a.get(k), b.get(k), at + '[' + k + ']', out);
      return;
    }
    const n = Math.max(ours.length, theirs.length);
    for (let i = 0; i < n; i++) walk(ours[i], theirs[i], at + '[' + i + ']', out);
    return;
  }
  if (JSON.stringify(ours) !== JSON.stringify(theirs)) out.push([at, ours, theirs]);
}
const generalise = p => p.replace(/\[[^\]]*\]/g, '[]');

const pattern = process.argv[2];
for (const name of process.argv.slice(3)) {
  const file = path.join(CORPUS, 'specs', name + '.vl.json');
  if (!fs.existsSync(file)) continue;
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
  inlineData(spec);
  let theirs;
  try { theirs = vl.compile(JSON.parse(JSON.stringify(spec))).spec; } catch { continue; }
  const answer = JSON.parse(VelaWeb.render(JSON.stringify(spec), ''));
  if (!answer.ok || !answer.vega) continue;
  const out = [];
  walk(JSON.parse(answer.vega), theirs, '', out);
  // Match either the raw path (so a named set can be asked for) or the
  // generalised one (so a shape of path can be).
  const hits = out.filter(([p]) => p.includes(pattern) || generalise(p).includes(pattern));
  const cap = Number(process.env.SPECDIFF_MAX || 12);
  for (const [p, a, b] of hits.slice(0, cap)) {
    console.log(name.padEnd(38), p, '\n    ours', String(JSON.stringify(a)).slice(0, 160), '\n    ref ', String(JSON.stringify(b)).slice(0, 160));
  }
  if (hits.length > cap) console.log(name.padEnd(38), `… and ${hits.length - cap} more (raise SPECDIFF_MAX)`);
}
