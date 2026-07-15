// Instantiate the AS guest and verify the RGU1 selectable-menu bytes + the
// activation round-trip. Run: node gallery/game_engine/games/ui_menu/src/tools/parity.cjs
const fs = require('fs');
const path = require('path');
const wasmPath = path.join(__dirname, '..', 'build', 'logic.wasm');
const bytes = fs.readFileSync(wasmPath);
const mod = new WebAssembly.Module(bytes);
// The guest imports env.rg_ui_effect to trigger host-run UI effects. The real
// host queues these and drives its UIAnimator; here we just record them so we
// can assert the guest requests an effect on activation.
const fxCalls = [];
const imports = {
  env: {
    rg_ui_effect: (kind, target, node, durMs, delayMs, r, g, b, tag) => {
      fxCalls.push({ kind, target, node, durMs, delayMs, r, g, b, tag });
    },
  },
};
const inst = new WebAssembly.Instance(mod, imports);
const e = inst.exports;
const mem = new Uint8Array(e.memory.buffer);
const dv = () => new DataView(e.memory.buffer);

function readDoc() {
  const base = e.rg_ui_ptr();
  const size = e.rg_ui_size();
  const d = dv();
  const magic = d.getUint32(base + 0, true);
  const nodeOff = d.getUint32(base + 16, true);
  const nodeCount = d.getUint32(base + 20, true);
  return { base, size, magic, nodeOff, nodeCount, d };
}
function nodeById(doc, id) {
  for (let i = 0; i < doc.nodeCount; i++) {
    const nb = doc.base + doc.nodeOff + i * 32;
    if (doc.d.getUint32(nb, true) === id) {
      return {
        id,
        flags: doc.d.getUint16(nb + 10, true),
        eventMask: doc.d.getUint32(nb + 20, true),
        kind: doc.d.getUint16(nb + 8, true),
      };
    }
  }
  return null;
}

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('  PASS ' + name); } else { fail++; console.log('  FAIL ' + name); } }

e.init();
let doc = readDoc();
ok('magic RGU1', doc.magic === 0x31554752);
ok('has nodes', doc.nodeCount >= 6);

const newGame = nodeById(doc, 20);
ok('New Game is BUTTON kind', newGame && newGame.kind === 5);
ok('New Game selectable flag', newGame && (newGame.flags & 0x0001) !== 0);
ok('New Game default flag', newGame && (newGame.flags & 0x0004) !== 0);
ok('New Game subscribes ACTIVATE', newGame && (newGame.eventMask & 0x0001) !== 0);

const status = nodeById(doc, 90);
ok('status line NOT selectable', status && (status.flags & 0x0001) === 0);

const rev0 = e.rg_ui_revision();
ok('plays starts 0', e.plays() === 0);
// host recognizes the action button on the selected node -> forwards to guest
e.rg_ui_event(20, 0x0001, 0);
ok('plays incremented after activate', e.plays() === 1);
ok('revision bumped', e.rg_ui_revision() === rev0 + 1);

// New Game (20) requests a white node glow that navigates on completion (tag 1).
ok('activation requested one effect', fxCalls.length === 1);
const fx = fxCalls[0] || {};
ok('effect is a glow (kind 1)', fx.kind === 1);
ok('effect targets the node (target 0)', fx.target === 0);
ok('effect targets New Game (node 20)', fx.node === 20);
ok('effect carries the navigate tag (1)', fx.tag === 1);

// The host now reports the effect finished; the guest navigates (NAVS++).
e.rg_ui_effect_done(fx.node, fx.tag);
ok('navigation fired on completion', e.navs() === 1);

console.log('RESULT: ' + pass + ' passed, ' + fail + ' failed');
console.log(fail === 0 ? 'ALL PASS' : 'SOME FAILED');
process.exit(fail === 0 ? 0 : 1);
