#!/usr/bin/env node
// Real end-to-end check of the pose guest: load pose_arena.wasm in Node's
// native WebAssembly, stream RGP1 pose the way the host would, tick it, and
// assert BOTH surfaces the launcher renders:
//   - the RGSP1 sprite slot (a catalog character follows the head), and
//   - the RGU1 HUD text (the latest pose event, shown as text — the minimum
//     requirement).
// No SDL / wasm3 needed.
//
//   node gallery/game_engine/games/pose_arena/src/verify.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const wasm = readFileSync(join(here, "..", "pose_arena.wasm"));
const { instance } = await WebAssembly.instantiate(wasm, {});
const ex = instance.exports;
const dv = () => new DataView(ex.memory.buffer);

let fails = 0;
const ok = (label, cond) => {
  console.log(`  ${cond ? "ok  " : "FAIL"} ${label}`);
  if (!cond) fails++;
};

// ---- RGSP1 (sprite) host view -------------------------------------------------
const sBase = () => ex.sprite_ptr();
const sRd = (off) => dv().getInt32(sBase() + off, true);
const sWr = (off, v) => dv().setInt32(sBase() + off, v, true);
const slot = (i, f) => sRd(64 + i * 32 + f); // CHARID0 ANIM4 DIR8 FLAGS12 X16 Y20 CLOCK24

// ---- RGP1 (pose) — the host streams this into the guest before each tick ------
const pBase = () => ex.rg_pose_ptr();
const pWr = (off, v) => dv().setInt32(pBase() + off, v, true);
const FP = 256;
function streamPose({ present, gesture, lm = [], time = 0, dt = 16, rev = 2, flags = 3 }) {
  pWr(0, 0x31504752); // magic 'RGP1'
  pWr(4, 2); // version
  pWr(8, 856); // size
  pWr(12, rev); // revision (even = stable)
  pWr(16, present ? 1 : 0);
  pWr(20, gesture);
  pWr(24, lm.length);
  pWr(28, time);
  pWr(32, dt);
  pWr(36, flags); // VALID | HAS_VEL
  for (let i = 0; i < lm.length; i++) {
    const b = 64 + i * 24;
    const l = lm[i];
    pWr(b + 0, Math.round((l.x ?? 0) * FP)); // normalized x * 256
    pWr(b + 4, Math.round((l.y ?? 0) * FP));
    pWr(b + 8, l.vx ?? 0);
    pWr(b + 12, l.vy ?? 0);
    pWr(b + 16, l.speed ?? 0);
    pWr(b + 20, l.conf ?? 256);
  }
}

// one host frame: view + dt into RGSP1, tick
const tick = (dt = 16) => {
  sWr(12, dt); // OFF_DT_MS
  sWr(36, 480); // OFF_VIEW_W
  sWr(40, 270); // OFF_VIEW_H
  ex.sprite_tick();
};

// ---- RGU1 (HUD) reader: collect all text-property strings --------------------
function hudTexts() {
  const base = ex.rg_ui_ptr();
  const view = dv();
  const propCount = view.getInt32(base + 28, true); // OFF_PROP_COUNT
  const PROPS = base + 2112;
  const STRINGS = base + 4160;
  const out = [];
  for (let i = 0; i < propCount; i++) {
    const p = PROPS + i * 16;
    const key = view.getUint16(p + 0, true);
    if (key !== 1) continue; // P_TEXT
    const off = view.getInt32(p + 4, true);
    const len = view.getInt32(p + 8, true);
    let s = "";
    for (let c = 0; c < len; c++) s += String.fromCharCode(view.getUint8(STRINGS + off + c));
    out.push(s);
  }
  return out;
}
const hudHas = (needle) => hudTexts().some((s) => s.includes(needle));

// ---- exports / handshake ------------------------------------------------------
ex.sprite_init();
ok("abi version 1", ex.rg_abi_version() === 1);
ok("requires POSE cap (0x10)", ex.rg_required_caps() === 0x10);
ok("pose block size 856", ex.rg_pose_size() === 856);
ok("sprite magic RGSP", (sRd(0) >>> 0) === 0x50534752);
ok("ui revision export present", typeof ex.rg_ui_revision === "function");

// ---- no body yet: HUD says so, a character is parked centre ------------------
streamPose({ present: false, gesture: 0 });
tick();
ok("no-body HUD shows BODY: --", hudHas("BODY: --"));
ok("no-body still draws a character", sRd(24) === 1 && slot(0, 0) >= 1);

// ---- body present, ARMS UP: HUD names the gesture, sprite jumps --------------
// nose at (0.5, 0.25) of a 480x270 view -> x=240, feet below.
streamPose({ present: true, gesture: 1, lm: [{ x: 0.5, y: 0.25, speed: 0 }] });
tick();
ok("HUD shows GESTURE: ARMS UP", hudHas("GESTURE: ARMS UP"));
ok("HUD shows BODY: yes", hudHas("BODY: yes"));
ok("HUD shows nose coord 240", hudHas("240"));
ok("one sprite slot drawn", sRd(24) === 1);
ok("slot is a catalog character (knight after arms-up toggle)", slot(0, 0) === 2);
ok("arms-up shows JUMP anim", slot(0, 4) === 2);
ok("sprite x follows nose (~240px * 256)", slot(0, 16) === 240 * 256);

// ---- lean left: gesture text + facing ---------------------------------------
streamPose({ present: true, gesture: 2, lm: [{ x: 0.4, y: 0.3, vx: -20, speed: 30 }] });
tick();
ok("HUD shows GESTURE: LEAN LEFT", hudHas("GESTURE: LEAN LEFT"));
ok("faces left (dir1)", slot(0, 8) === 1);

// ---- gesture back to none: HUD updates --------------------------------------
streamPose({ present: true, gesture: 0, lm: [{ x: 0.6, y: 0.3, vx: 20, speed: 30 }] });
tick();
ok("HUD shows GESTURE: - when idle", hudHas("GESTURE: -"));
ok("faces right (dir3)", slot(0, 8) === 3);

console.log(fails === 0 ? "WASM_OK" : `WASM_FAILED failures=${fails}`);
process.exit(fails === 0 ? 0 : 1);
