// headless_check.cjs — drive the model_viewer_wasm guest with mock host imports
// and assert that it discovers the preloaded models through rg_list_resources and
// that the left / right arrows cycle the visible one. No SDL, no display: it
// instantiates logic.wasm, provides the rg_* imports the host would, records
// rg_set_visible calls, and checks discovery + init + arrow stepping.
//
//   node gallery/game_engine/games/model_viewer_wasm/tools/headless_check.cjs
const fs = require('fs');
const path = require('path');

const WASM = path.join(__dirname, '..', 'logic.wasm');
const MODELS_DIR = path.join(__dirname, '..', 'models');

// Mirror of the real host registry: wasm3d_runner.rgr preloads <game>/models/*.glb
// and registers each basename into a std::map<std::string,int>, so the guest sees
// them in alphabetical order. Deriving the list from the directory (instead of
// hardcoding it) keeps this test honest when models are added or removed.
function realModelNames() {
  return fs.readdirSync(MODELS_DIR)
    .filter((f) => f.toLowerCase().endsWith('.glb'))
    .map((f) => f.slice(0, -4))
    .sort();
}

// A fresh mock host serving `names` from rg_list_resources, mimicking the C++
// rgfx_scene_resource_names contract: NUL-separated, only whole names written,
// returns the byte size the full list needs.
function makeHost(names) {
  const h = {
    mem: null,
    loadOrder: [],
    visible: new Set(),
    entityName: {},
    listCalls: 0,
    lights: [],
    cam: 0,
    camPos: null,
    _lastName: null,
  };
  const meshByName = {};
  let nextMesh = 100;
  let nextEntity = 1;

  const readStr = (ptr, len) => Buffer.from(h.mem.buffer, ptr, len).toString('utf8');

  h.env = {
    rg_list_resources(kindPtr, kindLen, outPtr, outCap) {
      h.listCalls++;
      const kind = readStr(kindPtr, kindLen);
      if (kind !== 'models') return 0;
      let need = 0;
      let off = 0;
      const out = Buffer.from(h.mem.buffer, outPtr, outCap);
      for (const n of names) {
        const b = Buffer.from(n, 'utf8');
        need += b.length + 1;
        if (off + b.length + 1 <= outCap) {
          b.copy(out, off);
          out[off + b.length] = 0;
          off += b.length + 1;
        }
      }
      return need;
    },
    rg_load_model(ptr, len) {
      const name = readStr(ptr, len);
      h.loadOrder.push(name);
      if (!(name in meshByName)) meshByName[name] = nextMesh++;
      h._lastName = name;
      return meshByName[name];
    },
    rg_create_mesh_entity(_mesh, _tex) {
      const e = nextEntity++;
      h.entityName[e] = h._lastName;
      return e;
    },
    rg_create_camera() { h.cam = nextEntity++; return h.cam; },
    rg_create_light(kind, _color, _intensity) {
      h.lights.push(kind);
      return nextEntity++;
    },
    rg_set_position(e, x, y, z) {
      if (e === h.cam) h.camPos = { x, y, z };
    },
    rg_set_target() {},
    rg_set_rotation() {},
    rg_set_visible(e, on) { if (on) h.visible.add(e); else h.visible.delete(e); },
    rg_set_active_camera() {},
  };

  h.visibleName = () => {
    const ids = [...h.visible];
    if (ids.length !== 1) return `<${ids.length} visible>`;
    return h.entityName[ids[0]];
  };
  return h;
}

async function boot(names) {
  const h = makeHost(names);
  const { instance } = await WebAssembly.instantiate(fs.readFileSync(WASM), { env: h.env });
  h.ex = instance.exports;
  h.mem = h.ex.memory;
  h.ex.init();
  return h;
}

// Read the guest's RGU1 HUD document straight out of linear memory — the exact
// bytes wasm3d_runner/WasmUiDoc will parse. Layout per wasm/wasm_ui_abi.h:
// header u32 magic@0, revision@8, node_offset@16/count@20, prop_offset@24/
// count@28, string_offset@32, flags@40; node kind u16@8 of a 32-byte record;
// prop key u16@0, type u8@2, value_a u32@4, value_b u32@8 of a 16-byte record.
const RGU1_MAGIC = 0x31554752;
const KIND_TEXT = 2, KEY_TEXT = 1, TYPE_STRING = 4, FLAG_VALID = 1;

function readHud(h) {
  const ptr = h.ex.rg_ui_ptr();
  const dv = new DataView(h.mem.buffer, ptr, h.ex.rg_ui_size());
  const nodeOff = dv.getUint32(16, true), nodeCount = dv.getUint32(20, true);
  const propOff = dv.getUint32(24, true), propCount = dv.getUint32(28, true);
  const strOff = dv.getUint32(32, true);

  let textNodes = 0;
  for (let i = 0; i < nodeCount; i++) {
    if (dv.getUint16(nodeOff + i * 32 + 8, true) === KIND_TEXT) textNodes++;
  }
  let text = null;
  for (let i = 0; i < propCount; i++) {
    const b = propOff + i * 16;
    if (dv.getUint16(b, true) === KEY_TEXT && dv.getUint8(b + 2) === TYPE_STRING) {
      const a = dv.getUint32(b + 4, true), len = dv.getUint32(b + 8, true);
      text = Buffer.from(h.mem.buffer, ptr + strOff + a, len).toString('utf8');
    }
  }
  return {
    magic: dv.getUint32(0, true),
    valid: (dv.getUint32(40, true) & FLAG_VALID) === FLAG_VALID,
    revision: h.ex.rg_ui_revision(),
    textNodes,
    text,
  };
}

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
}

(async () => {
  // ---- discovery against the real models/ directory -----------------------
  const names = realModelNames();
  console.log(`models/ has ${names.length} glb files`);
  const h = await boot(names);

  check('asked the host for the model list', h.listCalls === 1, `listCalls=${h.listCalls}`);
  check('discovered every preloaded model', h.ex.model_count() === names.length,
    `${h.ex.model_count()} of ${names.length}`);
  check('loaded all models by name, in host order',
    JSON.stringify(h.loadOrder) === JSON.stringify(names),
    `${h.loadOrder.length} loaded: ${h.loadOrder.slice(0, 3).join(',')}...`);
  check('start on model 0 (' + names[0] + ')',
    h.ex.current_index() === 0 && h.visibleName() === names[0], h.visibleName());
  check('exactly one visible after init', h.visible.size === 1);

  // ---- the RGU1 HUD document the host draws over the scene ---------------
  let hud = readHud(h);
  check('HUD doc is a valid RGU1 block', hud.magic === RGU1_MAGIC && hud.valid,
    `magic=0x${hud.magic.toString(16)} valid=${hud.valid}`);
  check('HUD has exactly one text node', hud.textNodes === 1, `${hud.textNodes}`);
  check('HUD names the visible model (' + names[0] + ')', hud.text === names[0], `${hud.text}`);
  check('HUD revision is published', hud.revision > 0, `${hud.revision}`);

  // helper: press an arrow (turn = +1 right / -1 left) then release, one frame each
  const press = (t) => { h.ex.update(16, 0, 0, t, 0); h.ex.update(16, 0, 0, 0, 0); };

  // right steps forward through the discovered list
  for (let i = 1; i <= 3; i++) {
    press(1);
    check('right -> ' + names[i], h.ex.current_index() === i && h.visibleName() === names[i], h.visibleName());
    check('  still exactly one visible', h.visible.size === 1);
    const next = readHud(h);
    check('  HUD text follows the model (' + names[i] + ')', next.text === names[i], `${next.text}`);
    check('  HUD revision bumped on switch', next.revision > hud.revision,
      `${hud.revision} -> ${next.revision}`);
    hud = next;
  }

  // the host re-reads the doc only when the revision moves, so idle frames must
  // not bump it
  const revBefore = readHud(h).revision;
  h.ex.update(16, 0, 0, 0, 0);
  h.ex.update(16, 0, 0, 0, 0);
  check('idle frames do not bump the HUD revision', readHud(h).revision === revBefore,
    `${revBefore} -> ${readHud(h).revision}`);
  // left steps back
  press(-1);
  check('left -> ' + names[2], h.ex.current_index() === 2 && h.visibleName() === names[2], h.visibleName());

  // wrap-around in both directions over the full list
  while (h.ex.current_index() !== 0) press(-1);
  press(-1);
  check('left from 0 wraps to last (' + names[names.length - 1] + ')',
    h.ex.current_index() === names.length - 1 && h.visibleName() === names[names.length - 1],
    h.visibleName());
  press(1);
  check('right from last wraps to 0', h.ex.current_index() === 0 && h.visibleName() === names[0], h.visibleName());

  // holding the arrow (no release) must not keep advancing — one step per press
  const before = h.ex.current_index();
  h.ex.update(16, 0, 0, 1, 0);
  h.ex.update(16, 0, 0, 1, 0);
  h.ex.update(16, 0, 0, 1, 0);
  check('held arrow advances only once', h.ex.current_index() === (before + 1) % names.length,
    `${before} -> ${h.ex.current_index()}`);

  // ---- lights and the camera dolly ---------------------------------------
  // kinds: 3 = ambient, 4 = directional (gfx_sdl.rgr RGE_AMBIENT / RGE_DIR)
  const LIGHT_AMBIENT = 3, LIGHT_DIR = 4;
  check('lit by an ambient + a key/fill/back directional rig',
    h.lights.filter((k) => k === LIGHT_AMBIENT).length === 1 &&
    h.lights.filter((k) => k === LIGHT_DIR).length === 3, `kinds=${h.lights.join(',')}`);
  check('  directional count stays within the renderer\'s MAXDIR (4)',
    h.lights.filter((k) => k === LIGHT_DIR).length <= 4);

  // camera sits along a fixed eye vector; recover the dolly distance from z.
  const EYE_Z = 0.945, FP = 256;
  const dist = () => h.camPos.z / FP / EYE_Z;
  const d0 = dist();
  check('camera starts at the default distance', Math.abs(d0 - 2.75) < 0.05, `${d0.toFixed(2)}`);

  h.ex.update(100, 1, 0, 0, 0); // up arrow held for 100ms
  const dIn = dist();
  check('up arrow dollies the camera closer', dIn < d0 - 0.1, `${d0.toFixed(2)} -> ${dIn.toFixed(2)}`);

  h.ex.update(100, -1, 0, 0, 0);
  h.ex.update(100, -1, 0, 0, 0);
  check('down arrow pulls the camera back', dist() > dIn + 0.1, `${dIn.toFixed(2)} -> ${dist().toFixed(2)}`);

  for (let i = 0; i < 100; i++) h.ex.update(100, 1, 0, 0, 0); // hold up way past the limit
  check('zoom clamps at the near limit', Math.abs(dist() - 0.6) < 0.05, `${dist().toFixed(2)}`);
  for (let i = 0; i < 200; i++) h.ex.update(100, -1, 0, 0, 0); // and past the far one
  check('zoom clamps at the far limit', Math.abs(dist() - 12.0) < 0.05, `${dist().toFixed(2)}`);

  // zooming must not disturb the model selection
  check('dolly leaves the visible model alone', h.visible.size === 1);

  // ---- edge cases on the discovery contract ------------------------------
  const empty = await boot([]);
  check('no models: init survives and shows nothing',
    empty.ex.model_count() === 0 && empty.visible.size === 0);
  empty.ex.update(16, 0, 0, 1, 0); // must not divide by zero / wrap on an empty list
  check('no models: arrow press is a no-op', empty.ex.current_index() === 0);
  const emptyHud = readHud(empty);
  check('no models: HUD still publishes a valid doc',
    emptyHud.magic === RGU1_MAGIC && emptyHud.valid && emptyHud.text === 'no models', `${emptyHud.text}`);

  // more models than the guest's MAX_MODELS (64) — extras ignored, no overrun
  const many = await boot(Array.from({ length: 100 }, (_, i) => 'm' + String(i).padStart(3, '0')));
  check('over-long list is capped at MAX_MODELS', many.ex.model_count() === 64, `${many.ex.model_count()}`);
  check('  capped list still loads only whole names',
    many.loadOrder.length === 64 && many.loadOrder.every((n) => /^m\d{3}$/.test(n)));

  // a list too large for the guest's 2048-byte name buffer must truncate at a
  // name boundary — never a partial/garbled name
  const bigNames = Array.from({ length: 60 }, (_, i) => 'model_' + String(i).padStart(2, '0') + '_'.repeat(30));
  const big = await boot(bigNames);
  const served = new Set(bigNames);
  check('oversized list truncates rather than overruns',
    big.ex.model_count() > 0 && big.ex.model_count() < bigNames.length, `${big.ex.model_count()}`);
  check('  every discovered name is a whole, valid name',
    big.loadOrder.length > 0 && big.loadOrder.every((n) => served.has(n)),
    big.loadOrder.find((n) => !served.has(n)) || 'ok');

  console.log(`\npassed=${pass} failed=${fail}`);
  if (fail === 0) console.log('ALL PASS'); else { console.log('SOME FAILED'); process.exit(1); }
})();
