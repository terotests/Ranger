// Structural differences between the reference's compiled Vega and ours.
import fs from 'fs';
const OUT = '/tmp/claude-0/-home-user-Ranger/927540c9-ecc0-5daa-bb4e-9f8716a367ac/scratchpad';
const ref = JSON.parse(fs.readFileSync(`${OUT}/ref.vg.json`, 'utf8'));
const got = JSON.parse(fs.readFileSync(`${OUT}/got.vg.json`, 'utf8'));
const seen = [];
function walk(a, b, path) {
  if (JSON.stringify(a) === JSON.stringify(b)) return;
  if (a === undefined) { seen.push(`+ ${path} = ${JSON.stringify(b)}`.slice(0, 200)); return; }
  if (b === undefined) { seen.push(`- ${path} = ${JSON.stringify(a)}`.slice(0, 200)); return; }
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    seen.push(`~ ${path}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`.slice(0, 220)); return;
  }
  if (Array.isArray(a) !== Array.isArray(b)) { seen.push(`~ ${path}: shape`); return; }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) walk(a[k], b[k], `${path}.${k}`);
}
for (const part of ['width', 'height', 'padding', 'signals', 'scales', 'axes', 'legends', 'marks']) {
  walk(ref[part], got[part], part);
}
console.log(seen.slice(0, Number(process.argv[2] || 30)).join('\n'));
console.log(`(${seen.length} differences)`);
