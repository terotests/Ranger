// Batch structural diff: our compiled Vega vs the reference's, over every
// chart the coverage report says we draw differently. Prints one line per
// differing key-path per chart, then a frequency table over the paths — so
// the question "what should I fix next" is answered by how many charts a
// cause appears in rather than by which chart looks closest.
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
const VELA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CORPUS = path.join(VELA, 'tests', 'corpus');
const vl = await import('vega-lite');

const source = fs.readFileSync(path.join(VELA, 'bin', 'vela_web.js'), 'utf8').replace(/^#![^\n]*\n/, '');
const VelaWeb = new Function('require', `${source}\n; return VelaWeb;`)(undefined);

// Data the corpus ships, inlined the way the coverage harness does.
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
  if (node.data && node.data.url) {
    const rows = loadData(node.data.url);
    if (rows) node.data = { values: rows };
  }
  for (const k of Object.keys(node)) inlineData(node[k]);
}

// Every key-path where the two objects disagree, described by KIND of
// disagreement rather than by value: a chart that is missing `domainRaw` and
// a chart that spells it differently are the same finding.

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
    for (const k of new Set([...Object.keys(ours), ...Object.keys(theirs)])) {
      walk(ours[k], theirs[k], at ? at + '.' + k : k, out);
    }
    return;
  }
  if (Array.isArray(ours) && Array.isArray(theirs)) {
    const a = keyed(ours), b = keyed(theirs);
    if (a && b) {
      for (const k of new Set([...a.keys(), ...b.keys()])) walk(a.get(k), b.get(k), at + '[' + k + ']', out);
      return;
    }
    const n = Math.max(ours.length, theirs.length);
    if (ours.length !== theirs.length) out.push([at + '[]', 'LENGTH']);
    for (let i = 0; i < n; i++) walk(ours[i], theirs[i], at + '[' + i + ']', out);
    return;
  }
  if (ours === undefined && theirs !== undefined) { out.push([at, 'MISSING']); return; }
  if (ours !== undefined && theirs === undefined) { out.push([at, 'EXTRA']); return; }
  if (JSON.stringify(ours) !== JSON.stringify(theirs)) out.push([at, 'VALUE']);
}

// Index digits carry no meaning across charts — marks[3] here is marks[0]
// there — so they are collapsed before the paths are counted.
const generalise = p => p.replace(/\[[^\]]*\]/g, '[]');

const names = process.argv.slice(2);
const perChart = new Map();
const tally = new Map();

for (const name of names) {
  const file = path.join(CORPUS, 'specs', name + '.vl.json');
  if (!fs.existsSync(file)) { console.log(name, 'NO SPEC'); continue; }
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
  inlineData(spec);
  let theirs;
  try { theirs = vl.compile(JSON.parse(JSON.stringify(spec))).spec; }
  catch (e) { console.log(name, 'REFERENCE WOULD NOT COMPILE:', e.message); continue; }
  const answer = JSON.parse(VelaWeb.render(JSON.stringify(spec), ''));
  if (!answer.ok) { console.log(name, 'WE WOULD NOT DRAW:', (answer.errors || []).join(' | ')); continue; }
  if (!answer.vega) { console.log(name, 'ALREADY VEGA'); continue; }
  const ours = JSON.parse(answer.vega);
  const out = [];
  walk(ours, theirs, '', out);
  // Things neither side means: descriptions are prose, aria is not drawing.
  const noise = /description|aria|tooltip|\$schema|\.name$|signals\[\]\.on|events|cursor/;
  const kept = out.filter(([p]) => !noise.test(p));
  perChart.set(name, kept);
  for (const [p, kind] of kept) {
    const key = generalise(p) + ' ' + kind;
    if (!tally.has(key)) tally.set(key, new Set());
    tally.get(key).add(name);
  }
}

console.log('\n=== differences by how many charts they appear in ===');
const rows = [...tally.entries()].sort((a, b) => b[1].size - a[1].size);
for (const [key, charts] of rows.slice(0, 40)) {
  console.log(String(charts.size).padStart(3), key, ' ·', [...charts].slice(0, 4).join(', '));
}
console.log('\n=== charts whose compiled Vega already agrees ===');
console.log([...perChart.entries()].filter(([, d]) => d.length === 0).map(([n]) => n).join(', ') || '(none)');
