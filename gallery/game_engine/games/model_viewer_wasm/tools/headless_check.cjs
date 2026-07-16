// headless_check.cjs — drive the model_viewer_wasm guest with mock host imports
// and assert that the left / right arrows cycle the visible model. No SDL, no
// display: it instantiates logic.wasm, provides the rg_* imports the host would,
// records rg_set_visible calls, and checks init + arrow stepping.
//
//   node gallery/game_engine/games/model_viewer_wasm/tools/headless_check.cjs
const fs = require('fs');
const path = require('path');

const WASM = path.join(__dirname, '..', 'logic.wasm');
const NAMES = ['Box', 'BoxTextured', 'BoxVertexColors', 'Duck'];

let mem = null;
const meshByName = {};     // name -> mesh id
let nextMesh = 100, nextEntity = 1;
const entityName = {};     // entity id -> model name (for readable assertions)
let visible = new Set();   // entity ids currently visible
let loadOrder = [];

function readStr(ptr, len) {
  return Buffer.from(mem.buffer, ptr, len).toString('utf8');
}

const env = {
  rg_load_model(ptr, len) {
    const name = readStr(ptr, len);
    loadOrder.push(name);
    if (!(name in meshByName)) meshByName[name] = nextMesh++;
    env._lastName = name;
    return meshByName[name];
  },
  rg_create_mesh_entity(_mesh, _tex) {
    const e = nextEntity++;
    entityName[e] = env._lastName;
    return e;
  },
  rg_create_camera() { return nextEntity++; },
  rg_create_light() { return nextEntity++; },
  rg_set_position() {},
  rg_set_target() {},
  rg_set_rotation() {},
  rg_set_visible(e, on) { if (on) visible.add(e); else visible.delete(e); },
  rg_set_active_camera() {},
};

function visibleName() {
  const ids = [...visible];
  if (ids.length !== 1) return `<${ids.length} visible>`;
  return entityName[ids[0]];
}

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
}

(async () => {
  const bytes = fs.readFileSync(WASM);
  const { instance } = await WebAssembly.instantiate(bytes, { env });
  const ex = instance.exports;
  mem = ex.memory;

  ex.init();
  check('loaded all models by name', JSON.stringify(loadOrder) === JSON.stringify(NAMES), loadOrder.join(','));
  check('start on model 0 (Box)', ex.current_index() === 0 && visibleName() === 'Box', visibleName());
  check('exactly one visible after init', visible.size === 1);

  // helper: press an arrow (turn = +1 right / -1 left) then release, one frame each
  function press(turn) {
    ex.update(16, 0, 0, turn, 0); // press edge
    ex.update(16, 0, 0, 0, 0);    // release
  }

  // right, right, right, right -> Box -> BoxTextured -> BoxVertexColors -> Duck -> Box
  const rightSeq = ['BoxTextured', 'BoxVertexColors', 'Duck', 'Box'];
  for (let i = 0; i < rightSeq.length; i++) {
    press(1);
    check('right -> ' + rightSeq[i], ex.current_index() === (i + 1) % 4 && visibleName() === rightSeq[i], visibleName());
    check('  still exactly one visible', visible.size === 1);
  }

  // left twice from Box -> Duck -> BoxVertexColors
  const leftSeq = ['Duck', 'BoxVertexColors'];
  for (let i = 0; i < leftSeq.length; i++) {
    press(-1);
    check('left -> ' + leftSeq[i], visibleName() === leftSeq[i], visibleName());
  }

  // holding the arrow (no release) must not keep advancing — one step per press
  const before = ex.current_index();
  ex.update(16, 0, 0, 1, 0); // press, held
  ex.update(16, 0, 0, 1, 0); // still held
  ex.update(16, 0, 0, 1, 0); // still held
  check('held arrow advances only once', ex.current_index() === (before + 1) % 4, `${before} -> ${ex.current_index()}`);

  console.log(`\npassed=${pass} failed=${fail}`);
  if (fail === 0) console.log('ALL PASS'); else { console.log('SOME FAILED'); process.exit(1); }
})();
