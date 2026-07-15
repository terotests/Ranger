// Instantiate the effects-showcase guest and verify each button requests the
// right host effect (env.rg_ui_effect) + the completion round-trip.
// Run: node gallery/game_engine/games/ui_effects/src/tools/parity.cjs
const fs = require('fs');
const path = require('path');
const wasmPath = path.join(__dirname, '..', 'build', 'logic.wasm');
const mod = new WebAssembly.Module(fs.readFileSync(wasmPath));
const fx = [];
const inst = new WebAssembly.Instance(mod, {
  env: { rg_ui_effect: (kind, target, node, durMs, delayMs, r, g, b, tag) =>
    fx.push({ kind, target, node, durMs, delayMs, r, g, b, tag }) },
});
const e = inst.exports;

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('  PASS ' + name); } else { fail++; console.log('  FAIL ' + name); } }

e.init();
ok('fired starts 0', e.fired() === 0);

// each button (ACTIVATE = 1) requests one distinct effect
const cases = [
  { id: 20, kind: 1, target: 0, r: 255, g: 220, b: 120, name: 'Glow: warm node glow' },
  { id: 21, kind: 2, target: 0, r: 120, g: 255, b: 160, name: 'Pulse: green node pulse' },
  { id: 22, kind: 2, target: 1, r: 255, g: 80,  b: 80,  name: 'Screen (red): red screen pulse' },
  { id: 23, kind: 2, target: 1, r: 120, g: 180, b: 255, name: 'Screen (blue): blue screen pulse' },
];
for (const c of cases) {
  fx.length = 0;
  e.rg_ui_event(c.id, 1, 0);
  const g = fx[0] || {};
  ok(c.name, g.kind === c.kind && g.target === c.target &&
             g.r === c.r && g.g === c.g && g.b === c.b && g.tag === c.id);
}
ok('fired == 4', e.fired() === 4);

// host reports one effect complete -> guest counts it
e.rg_ui_effect_done(22, 22);
ok('done == 1 after completion', e.done() === 1);

console.log('RESULT: ' + pass + ' passed, ' + fail + ' failed');
console.log(fail === 0 ? 'ALL PASS' : 'SOME FAILED');
process.exit(fail === 0 ? 0 : 1);
