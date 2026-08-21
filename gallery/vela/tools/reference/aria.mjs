/**
 * aria.mjs — is the chart the same chart to somebody who cannot see it?
 *
 *   node gallery/vela/tools/reference/aria.mjs
 *
 * The renderer comparison holds Vela to the reference's INK. This holds it to
 * what a screen reader is handed: every `aria-label` the two documents carry,
 * in the order they carry them, and the role each one claims.
 *
 *          a Vega specification
 *            │             │
 *   official vega       vela_svg
 *            │             │
 *     view.toSVG()      SVG text
 *            │             │
 *            └──── diff ───┘     labels, roles, and what is hidden
 *
 * There are two halves to that text and they come from different places. The
 * per-mark sentence ("c: A; v: 30") is computed from the data and lives in the
 * SCENE, so it is already compared item for item by the parity harness. The
 * sentence about a guide ("X-axis titled 'c' for a discrete scale with 4
 * values: A, B, C, D") is computed by the RENDERER, from the scale, and is in
 * neither scenegraph — which is why it needs a harness of its own.
 *
 * Needs the reference (`npm install --no-save vega vega-lite`) and a built
 * renderer (`bash gallery/vela/tests/run.sh`).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VELA = path.resolve(__dirname, '..', '..');
const ROOT = path.resolve(VELA, '..', '..');
const SPECS = path.join(VELA, 'tests', 'specs');
const SVG_TOOL = path.join(VELA, 'bin', 'vela_svg.js');

let vega;
try {
  vega = await import('vega');
} catch {
  console.log('vega is not installed — the accessibility markup was not compared.');
  console.log('install the reference to run this:  npm install --no-save vega vega-lite');
  process.exit(0);
}
if (!fs.existsSync(SVG_TOOL)) {
  console.error(`missing ${path.relative(ROOT, SVG_TOOL)} — build it with gallery/vela/tests/run.sh`);
  process.exit(1);
}

/** Every labelled element, in document order: what it says and what it claims to be. */
function spoken(svg) {
  const out = [];
  const tag = /<[^>]+>/g;
  let m;
  while ((m = tag.exec(svg))) {
    const text = m[0];
    const label = /aria-label="([^"]*)"/.exec(text);
    if (!label) continue;
    const role = /aria-roledescription="([^"]*)"/.exec(text);
    out.push(`${role ? role[1] : '?'}: ${label[1]}`);
  }
  return out;
}

/** How much of the document is announced as nothing. */
function hidden(svg) {
  return (svg.match(/aria-hidden="true"/g) || []).length;
}

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.vg.json')) files.push(full);
  }
})(SPECS);
files.sort();

const rows = [];
let matched = 0;
let compared = 0;
let labels = 0;

for (const file of files) {
  const name = path.relative(SPECS, file).replace(/\.vg\.json$/, '');
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'));

  let refSvg;
  try {
    const view = new vega.View(vega.parse(spec), { renderer: 'none' });
    await view.runAsync();
    refSvg = await view.toSVG();
  } catch (err) {
    rows.push({ name, status: 'skipped', detail: `the reference refused it: ${err.message}` });
    continue;
  }

  const ourSvg = execFileSync(process.execPath, [SVG_TOOL, file], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (!ourSvg.trimStart().startsWith('<svg')) {
    rows.push({ name, status: 'FAILED', detail: ourSvg.trim().split('\n')[0] });
    continue;
  }

  const want = spoken(refSvg);
  const got = spoken(ourSvg);
  compared += 1;
  labels += want.length;

  if (want.length !== got.length) {
    const missing = want.filter((w) => !got.includes(w))[0];
    const extra = got.filter((g) => !want.includes(g))[0];
    rows.push({
      name, status: 'DIFF',
      detail: `${got.length} labels, not ${want.length}` + (missing ? ` — missing “${missing}”` : '')
        + (extra ? ` — extra “${extra}”` : ''),
    });
    continue;
  }
  const wrong = want.findIndex((w, i) => w !== got[i]);
  if (wrong >= 0) {
    rows.push({ name, status: 'DIFF', detail: `“${got[wrong]}” != “${want[wrong]}”` });
    continue;
  }
  matched += 1;
  rows.push({ name, status: 'ok', detail: `${want.length} labels, ${hidden(ourSvg)} elements hidden` });
}

const width = Math.max(...rows.map((r) => r.name.length));
for (const row of rows) {
  const tag = row.status === 'ok' ? '  ok  ' : row.status === 'skipped' ? '  --  ' : ` ${row.status} `;
  console.log(`${tag.padEnd(8)} ${row.name.padEnd(width)}  ${row.detail}`);
}
console.log(`\n${matched}/${compared} charts say the same thing to a screen reader (${labels} labels)`);
process.exit(matched === compared ? 0 : 1);
