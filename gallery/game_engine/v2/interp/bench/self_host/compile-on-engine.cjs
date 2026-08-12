#!/usr/bin/env node
// Compile a .rgr file with the Ranger compiler running ON ComponentEngine, and
// compare the result against the same compile run natively on Node.
//
//   node compile-on-engine.cjs <input.rgr> [outName]
//
// The engine never writes to disk: the compiler's writes are captured through
// the host bridge and diffed against the Node oracle in memory. Exit status is
// 0 only when every emitted file matches byte for byte.
const fs = require('fs');
const os = require('os');
const pathMod = require('path');
const { execFileSync } = require('child_process');
const { HostBridge, loadCompiler, ROOT, ComponentEngine, EvHandle } = require('./engine-host.cjs');

const input = process.argv[2];
if (!input) {
  console.error('usage: compile-on-engine.cjs <input.rgr> [outName]');
  process.exit(2);
}
const inputAbs = pathMod.resolve(input);
const outName = process.argv[3] || pathMod.basename(inputAbs).replace(/\.rgr$/, '.js');
// The compiler resolves -d against ITS OWN cwd, so both runs are given a
// directory under the repo root -- otherwise the two resolve differently and
// the oracle lands somewhere the comparison cannot find.
const scratch = fs.mkdtempSync(pathMod.join(ROOT, '.selfhost-'));
const outDir = pathMod.join(scratch, 'engine');
const oracleDir = pathMod.join(scratch, 'node');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(oracleDir, { recursive: true });
// -d is passed RELATIVE to the root: the compiler joins it onto its own cwd
// even when it looks absolute, so an absolute path lands under ROOT twice.
const outRel = './' + pathMod.relative(ROOT, outDir);
const oracleRel = './' + pathMod.relative(ROOT, oracleDir);
const argv = ['node', pathMod.join(ROOT, 'bin/output.js'), '-es6', inputAbs, '-nodecli', '-d=' + outRel, '-o=' + outName];

// ---- the engine run -------------------------------------------------------
const stats = { reads: 0, exists: 0, writes: 0 };
const engine = new ComponentEngine();
engine.quiet = true;
const bridge = new HostBridge(stats);
engine.setNativeBridge(bridge);

const guest = [];
const origLog = console.log;
console.log = (...a) => guest.push(a.join(' '));
const t0 = Date.now();
let loadMs = 0;
try {
  loadCompiler(engine, argv);
  loadMs = Date.now() - t0;
  engine.callFunction('__boot', EvHandle.null());
  // The entry is async. Drain until the job queue stops producing work, so a
  // chain of awaits (every file read is one) runs to completion.
  let state = 'no';
  for (let i = 0; i < 1000000; i++) {
    engine.drainJobs();
    const r = engine.callFunction('__bootState', EvHandle.null());
    state = r.isString() ? r.stringOf() : '?';
    if (state !== 'no') break;
  }
  console.log = origLog;
  if (state !== 'resolved') {
    console.error('engine run did not resolve: ' + state);
    guest.filter((l) => /FAIL|error/i.test(l)).slice(0, 8).forEach((l) => console.error('  ' + l));
    process.exit(1);
  }
} catch (e) {
  console.log = origLog;
  console.error('engine run threw: ' + e.message);
  process.exit(1);
}
const engineMs = Date.now() - t0;
const engineFiles = bridge.writes;

// ---- the Node oracle ------------------------------------------------------
const t1 = Date.now();
execFileSync(process.execPath, [pathMod.join(ROOT, 'bin/output.js'), '-es6', inputAbs, '-nodecli', '-d=' + oracleRel, '-o=' + outName], {
  cwd: ROOT,
  env: Object.assign({}, process.env, { RANGER_LIB: './compiler/Lang.rgr:./lib/stdops.rgr' }),
  stdio: 'pipe',
});
const nodeMs = Date.now() - t1;

// The compiler resolves -d against its own cwd, so find what it actually wrote.
const found = [];
(function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = pathMod.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else found.push(p);
  }
})(oracleDir);

console.log('engine : ' + engineMs + ' ms (load ' + loadMs + ' ms), reads ' + stats.reads + ', exists ' + stats.exists);
console.log('node   : ' + nodeMs + ' ms');

let bad = 0;
const engineKeys = Object.keys(engineFiles);
if (engineKeys.length === 0) {
  console.error('engine wrote nothing');
  process.exit(1);
}
for (const key of engineKeys) {
  const base = pathMod.basename(key);
  const oracle = found.find((f) => pathMod.basename(f) === base);
  if (!oracle) {
    console.error('no Node oracle for ' + base);
    bad++;
    continue;
  }
  const a = engineFiles[key];
  const b = fs.readFileSync(oracle, 'utf8');
  if (a === b) {
    console.log('MATCH  : ' + base + ' (' + a.length + ' chars)');
  } else {
    console.error('DIFFER : ' + base + ' engine ' + a.length + ' vs node ' + b.length);
    bad++;
  }
}
fs.rmSync(scratch, { recursive: true, force: true });
process.exit(bad ? 1 : 0);
