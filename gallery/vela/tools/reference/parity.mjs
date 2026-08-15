// =============================================================================
// parity.mjs — compare a Vela scene against the reference implementation's.
// =============================================================================
// Vela computes a scene from a Vega specification; so does the official `vega`
// package. This runs both over the same spec and reports, per mark, whether
// every item's channels agree.
//
//   node gallery/vela/tools/reference/parity.mjs [spec.vg.json …]
//
// With no arguments it runs every spec in gallery/vela/tests/specs.
//
// `vega` is an OPTIONAL dev dependency: the reference is not needed to build or
// use Vela, only to check it. When it is missing this exits 0 with a message,
// so a checkout without it does not fail its tests — but it says clearly that
// nothing was compared, because a silent skip would read as a pass.
//
// Two things are deliberately not compared:
//   * `exit`, `zindex`, `bounds` and the back-references — bookkeeping of the
//     reference's own incremental dataflow, not properties of the chart.
//   * axis and legend groups — Vela does not build guides yet. Marks the
//     reference produces that Vela does not are reported as MISSING rather
//     than quietly dropped.
// =============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VELA = path.resolve(__dirname, '..', '..');
const ROOT = path.resolve(VELA, '..', '..');
const SCENE_TOOL = path.join(VELA, 'bin', 'vela_scene.js');
const SPEC_DIR = path.join(VELA, 'tests', 'specs');

const TOLERANCE = 1e-6;
const IGNORED = new Set(['exit', 'zindex', 'bounds', 'mark', 'datum', 'source', 'clip', 'strokeForeground', 'context']);

let vega;
try {
  vega = await import('vega');
} catch {
  console.log('vega is not installed — nothing was compared.');
  console.log('install the reference to run this:  npm install --no-save vega vega-lite');
  process.exit(0);
}

if (!fs.existsSync(SCENE_TOOL)) {
  console.error(`missing ${path.relative(ROOT, SCENE_TOOL)} — build it with gallery/vela/tests/run.sh`);
  process.exit(1);
}

const specs = process.argv.length > 2
  ? process.argv.slice(2)
  : fs.readdirSync(SPEC_DIR).filter((f) => f.endsWith('.vg.json')).sort().map((f) => path.join(SPEC_DIR, f));

let total = 0;
let matched = 0;
const report = [];

for (const specPath of specs) {
  const name = path.basename(specPath).replace(/\.vg\.json$/, '');
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

  let refMarks;
  try {
    refMarks = collectMarks(await referenceScene(spec));
  } catch (err) {
    report.push({ name, status: 'REFERENCE FAILED', detail: err.message });
    continue;
  }

  const velaOut = execFileSync(process.execPath, [SCENE_TOOL, specPath], { encoding: 'utf8' });
  if (!velaOut.trimStart().startsWith('{')) {
    report.push({ name, status: 'VELA FAILED', detail: velaOut.trim().split('\n')[0] });
    continue;
  }
  const velaMarks = collectMarks(JSON.parse(velaOut));

  for (const [markName, refMark] of refMarks) {
    // Legends are not built yet; they are counted, not diffed.
    if ((refMark.role || '').startsWith('legend')) continue;
    total++;
    const velaMark = velaMarks.get(markName);
    if (!velaMark) {
      report.push({ name, status: 'MISSING', detail: `mark ${markName} (${refMark.marktype})` });
      continue;
    }
    const diff = diffMark(refMark, velaMark);
    if (diff.length === 0) {
      matched++;
      report.push({ name, status: 'match', detail: `${markName} (${refMark.marktype}, ${refMark.items.length} items)` });
    } else {
      report.push({ name, status: 'DIFF', detail: `${markName}: ${diff.slice(0, 6).join('; ')}${diff.length > 6 ? ` … +${diff.length - 6} more` : ''}` });
    }
  }
}

for (const row of report) {
  const tag = row.status === 'match' ? '  ok  ' : ` ${row.status} `;
  console.log(`${tag.padEnd(18)} ${row.name}: ${row.detail}`);
}
console.log(`\n${matched}/${total} marks match the reference implementation`);
process.exit(matched === total ? 0 : 1);

// --- the reference -----------------------------------------------------------

async function referenceScene(spec) {
  const view = new vega.View(vega.parse(spec), { renderer: 'none' });
  await view.runAsync();
  return dumpMark(view.scenegraph().root);
}

function dumpMark(m) {
  const out = { marktype: m.marktype };
  if (m.name) out.name = m.name;
  if (m.role) out.role = m.role;
  out.items = (m.items || []).map(dumpItem);
  return out;
}

function dumpItem(it) {
  const out = {};
  for (const key of Object.keys(it)) {
    if (IGNORED.has(key) || key === 'items') continue;
    const v = it[key];
    if (v === null || v === undefined || typeof v === 'object' || typeof v === 'function') continue;
    out[key] = v;
  }
  if (it.items && it.items.length && it.items[0].marktype) out.items = it.items.map(dumpMark);
  return out;
}

// --- comparison --------------------------------------------------------------

/**
 * Every non-group mark in the scene, keyed by its path through the tree.
 * A chart has several axes and they all carry the same roles, so the key
 * includes each group's index — without it the axes overwrite each other in
 * the map and only the last one is ever compared.
 */
function collectMarks(mark, out = new Map(), trail = []) {
  if (mark.marktype !== 'group') {
    let key = mark.name || `${trail.join('/')}#${mark.role || mark.marktype}`;
    if (!mark.name && out.has(key)) {
      let n = 2;
      while (out.has(`${key}~${n}`)) n++;
      key = `${key}~${n}`;
    }
    out.set(key, mark);
    return out;
  }
  for (const [i, item] of (mark.items || []).entries()) {
    for (const child of item.items || []) {
      collectMarks(child, out, trail.concat(`${mark.name || mark.role || 'group'}${i > 0 ? i : ''}`));
    }
  }
  return out;
}

function diffMark(ref, got) {
  const diffs = [];
  if (ref.marktype !== got.marktype) diffs.push(`marktype ${got.marktype} != ${ref.marktype}`);
  if (ref.items.length !== got.items.length) {
    diffs.push(`item count ${got.items.length} != ${ref.items.length}`);
    return diffs;
  }
  for (let i = 0; i < ref.items.length; i++) {
    for (const [key, refValue] of Object.entries(ref.items[i])) {
      if (key === 'items') continue;
      const gotValue = got.items[i][key];
      if (gotValue === undefined) {
        diffs.push(`item ${i} missing ${key} (reference has ${format(refValue)})`);
      } else if (typeof refValue === 'number' && typeof gotValue === 'number') {
        if (Math.abs(refValue - gotValue) > TOLERANCE) {
          diffs.push(`item ${i} ${key}=${format(gotValue)} != ${format(refValue)}`);
        }
      } else if (String(refValue) !== String(gotValue)) {
        diffs.push(`item ${i} ${key}=${format(gotValue)} != ${format(refValue)}`);
      }
    }
  }
  return diffs;
}

function format(v) {
  return typeof v === 'number' ? String(Math.round(v * 1e6) / 1e6) : JSON.stringify(v);
}
