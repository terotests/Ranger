/**
 * zones.mjs — does a time axis agree with the reference OUTSIDE UTC?
 *
 *   node gallery/vela/tools/reference/zones.mjs
 *
 * A `time` scale is read in a wall clock, and until now Vela's was always UTC.
 * That agreed with the reference on this project's machines and nowhere else,
 * because the reference reads the clock of the machine it runs on — which a
 * runtime compiling to eight targets cannot do and should not want to. So the
 * zone is SUPPLIED to Vela (`--zone=Europe/Helsinki`) and read from `TZ` by the
 * reference, and this asserts that the two produce the same chart.
 *
 * It runs the parity harness once per zone, so every mark of every dated spec
 * is compared, not a sample of them. The zones are chosen to exercise each
 * summer-time rule and each thing that can go wrong with one:
 *
 *   UTC                no rule at all, the baseline
 *   Europe/Helsinki    the EU rule, two hours east
 *   Europe/London      the EU rule at zero, where standard time IS UTC and a
 *                      naive implementation stops being able to tell them apart
 *   America/New_York   the United States rule, west of UTC, transitions stated
 *                      in local time rather than in UTC
 *   America/Phoenix    west of UTC with NO rule, next door to one that has one
 *   Australia/Sydney   a SOUTHERN summer: the window wraps the new year, so the
 *                      test is an OR and not an AND
 *   Pacific/Auckland   southern, and the furthest east — where a day boundary
 *                      is half a day away from UTC's
 *   Asia/Kolkata       a half-hour offset, which catches anything that stored
 *                      an offset in whole hours
 *
 * Needs the reference (`npm install --no-save vega vega-lite`).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VELA = path.resolve(__dirname, '..', '..');
const ROOT = path.resolve(VELA, '..', '..');
const SPEC_DIR = path.join(VELA, 'tests', 'specs');
const PARITY = path.join(__dirname, 'parity.mjs');

try {
  await import('vega');
} catch {
  console.log('vega is not installed — no time zone was compared.');
  process.exit(0);
}

const ZONES = [
  'UTC',
  'Europe/Helsinki',
  'Europe/London',
  'America/New_York',
  'America/Phoenix',
  'Australia/Sydney',
  'Pacific/Auckland',
  'Asia/Kolkata',
];

// Only the specs with a date in them: everything else is the same chart in
// every zone, and comparing it eight times would say nothing.
function datedSpecs(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...datedSpecs(full));
    else if (entry.name.endsWith('.vg.json')) {
      const text = fs.readFileSync(full, 'utf8');
      if (text.includes('"time"') || text.includes('"utc"')) out.push(full);
    }
  }
  return out;
}

const specs = datedSpecs(SPEC_DIR);
if (specs.length === 0) {
  console.log('no spec with a time scale — nothing to compare.');
  process.exit(0);
}

let failed = 0;
for (const zone of ZONES) {
  let out;
  let ok = true;
  try {
    out = execFileSync(process.execPath, [PARITY, ...specs], {
      encoding: 'utf8',
      env: { ...process.env, TZ: zone, VELA_ZONE: zone },
    });
  } catch (err) {
    ok = false;
    out = (err.stdout || '') + (err.stderr || '');
  }
  const tally = out.trim().split('\n').pop();
  if (ok) {
    console.log(`  ok   ${zone.padEnd(18)} ${tally}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${zone.padEnd(18)} ${tally}`);
    for (const line of out.split('\n').filter((l) => /DIFF|MISSING|FAILED/.test(l)).slice(0, 5)) {
      console.log(`       ${line.trim()}`);
    }
  }
}

const what = `${specs.length} dated spec${specs.length === 1 ? '' : 's'}`;
console.log(failed ? `\n${failed} zone(s) disagree` : `\n${what} agree with the reference in ${ZONES.length} time zones`);
process.exit(failed ? 1 : 0);
