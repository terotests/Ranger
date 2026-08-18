// =============================================================================
// geo.mjs — VlGeo against d3, projection by projection.
// =============================================================================
// Runs `bin/geo_check.js` and `geo_oracle.mjs` over the same places and
// reports the largest disagreement per projection. A projection is a page of
// constants and a rotation convention; this is what says the convention was
// read the way the reference reads it.
//
//   node gallery/vela/tools/reference/geo.mjs
// =============================================================================
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..', '..');
const TOL = 0.0005;   // half a thousandth of a pixel

function parse(text) {
  const out = {};
  let current = null;
  for (const line of text.split('\n')) {
    const head = /^##\s+(\S+)/.exec(line);
    if (head) { current = out[head[1]] = { points: [], fit: null }; continue; }
    if (!current) continue;
    const fit = /fit(?:Size\(\[500,300\]\))?\s+scale=\s*([-\d.]+)\s+translate=\s*\[?\s*([-\d.]+),?\s+([-\d.]+)/.exec(line);
    if (fit) { current.fit = [+fit[1], +fit[2], +fit[3]]; continue; }
    if (/->\s*null/.test(line)) { current.points.push(null); continue; }
    const pt = /->\s*\[?\s*([-\d.]+),?\s+([-\d.]+)/.exec(line);
    if (pt) current.points.push([+pt[1], +pt[2]]);
  }
  return out;
}

const ours = parse(execFileSync('node', [path.join(ROOT, 'gallery/vela/bin/geo_check.js')], { encoding: 'utf8' }));
const theirs = parse(execFileSync('node', [path.join(HERE, 'geo_oracle.mjs')], { encoding: 'utf8' }));

let bad = 0;
for (const name of Object.keys(ours)) {
  const a = ours[name], b = theirs[name];
  if (!b) { console.log(` ??  ${name}: the oracle does not know it`); continue; }
  let worst = 0, note = '';
  const n = Math.max(a.points.length, b.points.length);
  for (let i = 0; i < n; i++) {
    const p = a.points[i], q = b.points[i];
    if (!p !== !q) { worst = Infinity; note = `point ${i}: ${p ? 'drawn' : 'dropped'} where the reference ${q ? 'draws' : 'drops'} it`; break; }
    if (!p) continue;
    const d = Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1]));
    if (d > worst) { worst = d; note = `point ${i}: ${JSON.stringify(p)} vs ${JSON.stringify(q)}`; }
  }
  if (a.fit && b.fit) {
    for (let i = 0; i < 3; i++) {
      const d = Math.abs(a.fit[i] - b.fit[i]);
      if (d > worst) { worst = d; note = `fit: ${JSON.stringify(a.fit)} vs ${JSON.stringify(b.fit)}`; }
    }
  }
  const ok = worst <= TOL;
  if (!ok) bad++;
  console.log(` ${ok ? 'ok ' : 'BAD'}  ${name.padEnd(18)} worst ${worst === Infinity ? '—' : worst.toExponential(2)}${ok ? '' : '  ' + note}`);
}
console.log(bad === 0
  ? '\nevery projection agrees with d3 to within half a thousandth of a pixel'
  : `\n${bad} projection(s) disagree`);
process.exit(bad === 0 ? 0 : 1);
