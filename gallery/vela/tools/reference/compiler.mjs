/**
 * compiler.mjs — does the Ranger Vega-Lite compiler draw the same chart?
 *
 *   node gallery/vela/tools/reference/compiler.mjs
 *
 * Every committed `.vl.json` goes down two paths:
 *
 *        a Vega-Lite specification
 *          │                    │
 *   official vega-lite     bin/vela_compile.js   <- Ranger
 *          │                    │
 *      official vega       bin/vela_scene.js     <- Ranger
 *          │                    │
 *          └──────── diff ──────┘
 *
 * The comparison is on the SCENE, not on the intermediate JSON. Two compilers
 * may reach the same chart by different specifications, and holding one to the
 * other's spelling would test the wrong thing — what has to agree is the
 * drawing. (The JSON is compared too, but only as a note: an exact match is
 * pleasant and a mismatch is not a failure.)
 *
 * Coverage is reported rather than assumed. A specification this compiler does
 * not cover — a layer, a facet, a concatenation, a composite mark that expands
 * into one — refuses out loud and is counted as `skipped`, not as passing.
 *
 * Needs the reference (`npm install --no-save vega vega-lite`) and a built
 * runtime (`bash gallery/vela/tests/run.sh`).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VELA = path.resolve(__dirname, '..', '..');
const ROOT = path.resolve(VELA, '..', '..');
const SPEC_DIR = path.join(VELA, 'tests', 'specs');
const COMPILE_TOOL = path.join(VELA, 'bin', 'vela_compile.js');
const SCENE_TOOL = path.join(VELA, 'bin', 'vela_scene.js');

const TOLERANCE = 1e-6;
const IGNORED = new Set(['exit', 'zindex', 'bounds', 'mark', 'datum', 'source', 'clip', 'strokeForeground', 'context', 'zdirty']);

let vega, vl;
try {
  vega = await import('vega');
  vl = await import('vega-lite');
} catch {
  console.log('vega / vega-lite are not installed — the compiler was not compared.');
  process.exit(0);
}
if (!fs.existsSync(COMPILE_TOOL)) {
  console.error(`missing ${path.relative(ROOT, COMPILE_TOOL)} — build it with gallery/vela/tests/run.sh`);
  process.exit(1);
}

const sources = fs.readdirSync(SPEC_DIR).filter((f) => f.endsWith('.vl.json')).sort();
const rows = [];
let compared = 0;
let matched = 0;

for (const file of sources) {
  const name = file.replace(/\.vl\.json$/, '');
  const sourcePath = path.join(SPEC_DIR, file);

  const mineText = execFileSync(process.execPath, [COMPILE_TOOL, sourcePath], { encoding: 'utf8' });
  if (!mineText.trimStart().startsWith('{')) {
    rows.push({ name, status: 'skipped', detail: mineText.trim().split('\n')[0].replace(/^error: /, '') });
    continue;
  }

  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const theirs = vl.compile(source).spec;
  const mine = JSON.parse(mineText);
  const sameJson = JSON.stringify(theirs) === JSON.stringify(mine);

  // The scene from each side. Theirs runs in official Vega; mine runs in Vela,
  // because the point is that this toolchain draws the chart end to end.
  let refMarks;
  try {
    const view = new vega.View(vega.parse(theirs), { renderer: 'none' });
    await view.runAsync();
    refMarks = collectMarks(dumpMark(view.scenegraph().root));
  } catch (err) {
    rows.push({ name, status: 'REFERENCE FAILED', detail: err.message });
    continue;
  }

  const tmp = path.join(VELA, 'bin', `${name}.compiled.vg.json`);
  fs.writeFileSync(tmp, mineText);
  const sceneText = execFileSync(process.execPath, [SCENE_TOOL, tmp], { encoding: 'utf8' });
  if (!sceneText.trimStart().startsWith('{')) {
    rows.push({ name, status: 'VELA FAILED', detail: sceneText.trim().split('\n')[0] });
    continue;
  }
  const mineMarks = collectMarks(JSON.parse(sceneText));

  const problems = [];
  for (const [markName, refMark] of refMarks) {
    const got = mineMarks.get(markName);
    if (!got) { problems.push(`missing ${markName}`); continue; }
    const d = diffMark(refMark, got);
    if (d.length) problems.push(`${markName}: ${d.slice(0, 3).join('; ')}`);
  }

  compared += 1;
  if (problems.length === 0) {
    matched += 1;
    rows.push({ name, status: 'ok', detail: `${refMarks.size} marks${sameJson ? ', and the same specification' : ''}` });
  } else {
    rows.push({ name, status: 'DIFF', detail: problems.slice(0, 3).join(' | ') });
  }
}

const width = Math.max(...rows.map((r) => r.name.length));
for (const row of rows) {
  const tag = row.status === 'ok' ? '  ok  ' : row.status === 'skipped' ? '  --  ' : ` ${row.status} `;
  console.log(`${tag.padEnd(10)} ${row.name.padEnd(width)}  ${row.detail}`);
}
const skipped = rows.filter((r) => r.status === 'skipped').length;
console.log(`\n${matched}/${compared} charts compile in Ranger and draw the same scene` +
  (skipped ? ` (${skipped} not covered by this compiler)` : ''));
process.exit(matched === compared ? 0 : 1);

// --- the same comparison the parity harness makes ----------------------------
// Copied from parity.mjs on purpose: the compiler is held to the standard the
// runtime is held to, and a second, subtly different standard would be a second
// thing to keep right.

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

function collectMarks(mark, out = new Map(), trail = []) {
  let key = mark.name || `${trail.join('/')}#${mark.role || mark.marktype}`;
  if (out.has(key)) {
    let n = 2;
    while (out.has(`${key}~${n}`)) n++;
    key = `${key}~${n}`;
  }
  out.set(key, mark);
  if (mark.marktype !== 'group') return out;
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
        if (Math.abs(refValue - gotValue) > TOLERANCE) diffs.push(`item ${i} ${key}=${format(gotValue)} != ${format(refValue)}`);
      } else if (String(refValue) !== String(gotValue)) {
        diffs.push(`item ${i} ${key}=${format(gotValue)} != ${format(refValue)}`);
      }
      if (diffs.length > 6) return diffs;
    }
  }
  return diffs;
}

function format(v) {
  if (v === undefined) return 'missing';
  if (typeof v === 'number') return String(Math.round(v * 1e6) / 1e6);
  return typeof v === 'string' ? v : JSON.stringify(v);
}
