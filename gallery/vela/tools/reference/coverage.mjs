// =============================================================================
// coverage.mjs — how much of the published Vega-Lite gallery does Vela draw?
// =============================================================================
//   node gallery/vela/tools/reference/coverage.mjs [--fetch] [--verbose] [name…]
//
// The suite in `tests/specs` is a set of charts CHOSEN to be implementable, and
// every one of them passes to a quarter of a pixel. That is a strong statement
// about the charts in it and no statement at all about the ones that are not:
// paste something from the Vega-Lite gallery and you find out, one paste at a
// time, that a transform is missing or a channel is read wrongly. A suite that
// only contains what already works cannot tell you what does not.
//
// So this runs the OFFICIAL gallery — every example on the Vega-Lite site — and
// reports a verdict for each:
//
//   same      Vela's SVG and the reference's SVG agree, ink for ink
//   differs   both drew, and they are not the same picture
//   refused   Vela said what it could not do, and did not draw
//   crashed   Vela threw, or produced something that is not an SVG
//   skipped   the example needs something this harness cannot supply
//
// The summary that matters is the last one: refusals grouped by reason, in
// order of how many examples each one blocks. That is the implementation queue,
// ranked by the only measure that counts — how much of the real corpus each
// missing piece would unlock.
//
// THE SPECS ARE VENDORED, the data is not. `tests/corpus/specs` holds the
// examples themselves, which are small and change rarely; `--fetch` populates
// `tests/corpus/data` from vega-datasets. Both implementations are handed the
// same rows, so nothing about a comparison depends on which copy is on disk —
// but a comparison cannot run at all without one, and those examples are
// reported as skipped rather than passed.
// =============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { parseSvg, comparePrimitives } from './svgcompare.mjs';
import { DIFFICULT, isDifficult } from './difficult.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VELA = path.resolve(__dirname, '..', '..');
const ROOT = path.resolve(VELA, '..', '..');
const CORPUS = path.join(VELA, 'tests', 'corpus');
const SPECS = path.join(CORPUS, 'specs');
const DATA = path.join(CORPUS, 'data');
const BUNDLE = path.join(VELA, 'bin', 'vela_web.js');

const DATA_SOURCE = 'https://raw.githubusercontent.com/vega/vega-datasets/main/data/';

const args = process.argv.slice(2);
const FETCH = args.includes('--fetch');
const VERBOSE = args.includes('--verbose');
const only = args.filter((a) => !a.startsWith('--'));

let vega, vegaLite;
try {
  vega = await import('vega');
  vegaLite = await import('vega-lite');
} catch {
  console.log('vega and vega-lite are not installed — nothing was compared.');
  console.log('install the reference to run this:  npm install --no-save vega vega-lite');
  process.exit(0);
}

// -----------------------------------------------------------------------------
// the corpus
// -----------------------------------------------------------------------------

if (!fs.existsSync(SPECS)) {
  console.error(`missing ${path.relative(ROOT, SPECS)}`);
  process.exit(1);
}

/** Every `data/…` file the corpus reads, whether or not it is on disk. */
function dataFilesWanted() {
  const wanted = new Set();
  for (const file of fs.readdirSync(SPECS)) {
    const text = fs.readFileSync(path.join(SPECS, file), 'utf8');
    for (const m of text.matchAll(/"url"\s*:\s*"data\/([^"]+)"/g)) wanted.add(m[1]);
  }
  return [...wanted].sort();
}

if (FETCH) {
  fs.mkdirSync(DATA, { recursive: true });
  const wanted = dataFilesWanted();
  let got = 0;
  for (const name of wanted) {
    const target = path.join(DATA, name);
    if (fs.existsSync(target)) { got++; continue; }
    try {
      const res = await fetch(DATA_SOURCE + name);
      if (!res.ok) { console.log(`  could not fetch ${name}: HTTP ${res.status}`); continue; }
      fs.writeFileSync(target, Buffer.from(await res.arrayBuffer()));
      got++;
    } catch (err) {
      console.log(`  could not fetch ${name}: ${err.message}`);
    }
  }
  console.log(`${got}/${wanted.length} data files in ${path.relative(ROOT, DATA)}\n`);
}

// -----------------------------------------------------------------------------
// data, inlined
// -----------------------------------------------------------------------------
// Vela's runtime has no loader — it compiles to eight targets and seven of them
// have no idea what a URL is — so the rows are read here and handed to it as
// values. The reference is given the SAME object, so a difference between the
// two is never a difference in what they read.

function parseDelimited(text, sep) {
  const rows = text.replace(/\r\n/g, '\n').trim().split('\n');
  if (!rows.length) return [];
  const head = splitLine(rows[0], sep);
  return rows.slice(1).map((line) => {
    const cells = splitLine(line, sep);
    const row = {};
    head.forEach((name, i) => {
      const cell = cells[i];
      row[name] = cell === undefined || cell === '' ? null
        : Number.isNaN(Number(cell)) ? cell : Number(cell);
    });
    return row;
  });
}

/** A delimited line, honouring the quoting the data sets actually use. */
function splitLine(line, sep) {
  const out = [];
  let cell = '', quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) { out.push(cell); cell = ''; }
    else cell += c;
  }
  out.push(cell);
  return out;
}

class Unsupplied extends Error {}

function loadRows(url, format) {
  if (!url.startsWith('data/')) throw new Unsupplied(`the data comes from ${url}`);
  const file = path.join(DATA, url.slice('data/'.length));
  if (!fs.existsSync(file)) throw new Unsupplied(`no local copy of ${url} (run with --fetch)`);
  const text = fs.readFileSync(file, 'utf8');
  const type = (format && format.type) || (url.endsWith('.csv') ? 'csv'
    : url.endsWith('.tsv') ? 'tsv' : 'json');
  if (type === 'csv') return parseDelimited(text, ',');
  if (type === 'tsv') return parseDelimited(text, '\t');
  if (type === 'json') {
    const parsed = JSON.parse(text);
    // A topojson file is an object, not an array of rows, and unpacking one is
    // a projection away from anything this draws.
    if (!Array.isArray(parsed)) throw new Unsupplied(`${url} is not an array of rows`);
    return parsed;
  }
  throw new Unsupplied(`a ${type} data format`);
}

/** Every `data.url` in the spec, replaced by the rows it names. */
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

// -----------------------------------------------------------------------------
// the two implementations
// -----------------------------------------------------------------------------

if (!fs.existsSync(BUNDLE)) {
  console.error(`missing ${path.relative(ROOT, BUNDLE)} — build it with gallery/vela/tests/run.sh`);
  process.exit(1);
}
// Loaded with `require` undefined, which is also the check the web page needs:
// a bundle that reached for the file system would fail here rather than in a
// browser where nobody would see it.
const VelaWeb = (function () {
  // The shebang is for the shell, and a Function body is not a file.
  const source = fs.readFileSync(BUNDLE, 'utf8').replace(/^#![^\n]*\n/, '');
  // eslint-disable-next-line no-new-func
  return new Function('require', `${source}\n; return VelaWeb;`)(undefined);
})();

async function referenceSvg(spec) {
  const vgSpec = spec.$schema && spec.$schema.includes('/vega/')
    ? spec
    : vegaLite.compile(spec).spec;
  const view = new vega.View(vega.parse(vgSpec), { renderer: 'none' });
  await view.runAsync();
  return view.toSVG();
}

// -----------------------------------------------------------------------------
// the run
// -----------------------------------------------------------------------------

const names = (only.length ? only : fs.readdirSync(SPECS).filter((f) => f.endsWith('.vl.json')))
  .map((f) => f.replace(/\.vl\.json$/, ''))
  .sort();

const rows = [];
for (const name of names) {
  const file = path.join(SPECS, `${name}.vl.json`);
  if (!fs.existsSync(file)) { rows.push({ name, verdict: 'skipped', why: 'no such example' }); continue; }
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'));

  try {
    inlineData(spec);
  } catch (err) {
    if (err instanceof Unsupplied) { rows.push({ name, verdict: 'skipped', why: err.message }); continue; }
    throw err;
  }

  let refSvg;
  try {
    refSvg = await referenceSvg(structuredClone(spec));
  } catch (err) {
    // The reference could not draw it either, so there is nothing to hold Vela
    // to. Said out loud rather than counted as a pass.
    rows.push({ name, verdict: 'skipped', why: `the reference refused it: ${short(err.message)}` });
    continue;
  }

  let answer;
  try {
    answer = JSON.parse(VelaWeb.render(JSON.stringify(spec), ''));
  } catch (err) {
    rows.push({ name, verdict: 'crashed', why: short(err.message) });
    continue;
  }

  if (!answer.ok) {
    rows.push({ name, verdict: 'refused', why: (answer.errors || ['(said nothing)'])[0] });
    continue;
  }

  let result;
  try {
    result = comparePrimitives(parseSvg(refSvg), parseSvg(answer.svg));
  } catch (err) {
    rows.push({ name, verdict: 'crashed', why: `comparing: ${short(err.message)}` });
    continue;
  }
  if (result.findings.length === 0) {
    rows.push({ name, verdict: 'same', why: `${result.matched} primitives` });
    continue;
  }
  // A page of the wrong size moves every mark on it, so every primitive then
  // reads as a difference. Reported as the one cause it is, or the count says
  // a hundred things are wrong when one is.
  const refSize = pageSize(refSvg);
  const gotSize = pageSize(answer.svg);
  const sized = refSize !== gotSize ? `the page comes out ${gotSize} instead of ${refSize}` : '';
  const cause = sized || result.findings[0];
  rows.push({
    name,
    verdict: 'differs',
    why: `${result.matched}/${result.total} — ${cause}`,
    cause,
    sized: Boolean(sized),
    // A page of the wrong size moves every mark on it, so the size is reported
    // first — but it is rarely the whole story, and the ranking below is only
    // useful if it can also see PAST it to whatever else is wrong.
    findings: result.findings
  });
}

/** The size of the drawing, as the document itself states it. */
function pageSize(svg) {
  const w = /\bwidth="([0-9.]+)"/.exec(svg);
  const h = /\bheight="([0-9.]+)"/.exec(svg);
  return `${w ? w[1] : '?'}x${h ? h[1] : '?'}`;
}

function short(text) {
  const line = String(text).split('\n')[0];
  return line.length > 120 ? `${line.slice(0, 117)}…` : line;
}

/** The part of a refusal that names the CAUSE, so two of them can be counted
 *  as one. "the transform 'pivot' is not compiled here" and the same sentence
 *  about 'fold' are two reasons; the same sentence twice is one. */
function reasonKey(why) {
  return String(why)
    .replace(/'[^']*'/g, "'…'")
    .replace(/"[^"]*"/g, '"…"')
    .replace(/-?\d+(\.\d+)?/g, 'N');
}

/** A finding with its coordinates and measurements taken out, so that the same
 *  KIND of difference on twenty charts counts as one thing to fix. */
function shapeOf(finding) {
  return String(finding)
    .replace(/\(#[0-9a-f]{3,8}\)/gi, '(colour)')
    .replace(/at -?[\d.]+,-?[\d.]+/g, 'at x,y')
    .replace(/-?[\d.]+x-?[\d.]+/g, 'WxH')
    .replace(/by [\d.]+px/g, 'by Npx')
    .replace(/"[^"]*"/g, '"…"');
}

const TAG = { same: '  ok  ', differs: ' DIFF ', refused: ' no   ', crashed: ' CRASH', skipped: ' --   ' };
for (const row of rows) {
  if (row.verdict === 'same' && !VERBOSE) continue;
  // A chart on the difficult list is marked wherever it appears, so that one
  // of them turning up among fifty differences is not read as one of fifty.
  const mark = isDifficult(row.name) ? '*' : ' ';
  console.log(`${TAG[row.verdict]}${mark}${row.name.padEnd(44)} ${row.why}`);
  if (VERBOSE && row.findings) for (const f of row.findings.slice(1, 6)) console.log(`         ${f}`);
}

const count = (v) => rows.filter((r) => r.verdict === v).length;
const drawn = count('same') + count('differs');
const judged = drawn + count('refused') + count('crashed');

console.log(`\n${rows.length} examples from the Vega-Lite gallery`);
console.log(`  ${String(count('same')).padStart(4)} drawn exactly as the reference draws them`);
console.log(`  ${String(count('differs')).padStart(4)} drawn, but not the same picture`);
console.log(`  ${String(count('refused')).padStart(4)} refused, with a reason`);
console.log(`  ${String(count('crashed')).padStart(4)} crashed`);
console.log(`  ${String(count('skipped')).padStart(4)} skipped (no data, or the reference would not draw it either)`);
if (judged > 0) {
  const pct = (n) => `${((100 * n) / judged).toFixed(1)}%`;
  console.log(`\nof the ${judged} it was asked to draw: ${pct(count('same'))} exact, `
    + `${pct(drawn)} drawn at all`);
}

/** Rank the causes of a verdict by how many examples each accounts for. */
function tally(wanted, describe) {
  const reasons = new Map();
  for (const row of rows) {
    if (!wanted.includes(row.verdict)) continue;
    const literal = describe(row);
    const key = reasonKey(literal);
    if (!reasons.has(key)) reasons.set(key, { count: 0, examples: [], literal });
    const entry = reasons.get(key);
    entry.count += 1;
    if (entry.examples.length < 3) entry.examples.push(row.name);
  }
  return [...reasons.values()].sort((a, b) => b.count - a.count);
}

function report(title, entries, limit) {
  if (!entries.length) return;
  console.log(`\n${title}`);
  for (const entry of entries.slice(0, limit)) {
    console.log(`  ${String(entry.count).padStart(3)}  ${entry.literal}`);
    console.log(`       e.g. ${entry.examples.join(', ')}`);
  }
  const rest = entries.length - Math.min(limit, entries.length);
  if (rest > 0) console.log(`       … and ${rest} more, one or two examples each`);
}

report('what stops it drawing at all, and how many examples each blocks:',
  tally(['refused', 'crashed'], (r) => r.why), 12);

// Of the charts it DOES draw, what is wrong with them — the same ranking, on
// the other side of the line. A page of the wrong size dominates this list
// when a layout rule is off, which is exactly what should be fixed first.
const sizedOff = rows.filter((r) => r.verdict === 'differs' && r.sized).length;
if (sizedOff) {
  console.log(`\nof the ${count('differs')} drawn differently, ${sizedOff} come out a different size`);
}

// What is wrong INSIDE the drawing, with the coordinates taken out so that the
// same kind of difference on twenty charts counts as one thing to fix.
report('what it draws differently, and how many examples each affects:',
  tally(['differs'], (r) => shapeOf(r.findings[0])), 14);

// The charts whose exactness was hard-won, and whether they are still exact.
// A coverage report is a measurement rather than a gate, so nothing here stops
// a build — but a chart that took a rounding order or a float crumb to get
// right can be made wrong again by one line somewhere else, and it would come
// back as a single DIFF among fifty. It is said plainly instead.
const slipped = Object.keys(DIFFICULT).filter(
  (name) => rows.some((r) => r.name === name && r.verdict !== 'same'));
const marked = Object.keys(DIFFICULT).filter(
  (name) => rows.some((r) => r.name === name));
if (marked.length) {
  console.log(`\n${marked.length - slipped.length} of the ${marked.length} charts marked difficult are still exact`);
  for (const name of slipped) {
    const row = rows.find((r) => r.name === name);
    console.log(`  SLIPPED  ${name}`);
    console.log(`           it was won by: ${DIFFICULT[name]}`);
    console.log(`           now: ${row.verdict} — ${row.why}`);
  }
  if (slipped.length) {
    console.log('  (see tools/reference/difficult.mjs, and the commit that says the same at length)');
  }
}

// A coverage report is a measurement, not a gate: it exits 0 whatever it found,
// because the number going down is the news and a failing exit code would only
// stop anyone from seeing it. `render.mjs` is the gate.
process.exit(0);
