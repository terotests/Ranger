#!/usr/bin/env node
// Real end-to-end check of the RGSP1 guest: load sprite_char.wasm in Node's
// native WebAssembly, drive it (menu -> pick knight -> play -> walk -> jump) and
// assert the block the host would render. No SDL / wasm3 needed.
//
//   node gallery/game_engine/wasm/rust_sprite_char/verify.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const wasm = readFileSync(join(here, "..", "..", "games", "sprite_char", "sprite_char.wasm"));
const { instance } = await WebAssembly.instantiate(wasm, {});
const ex = instance.exports;
const mem = () => new DataView(ex.memory.buffer);
const base = () => ex.sprite_ptr();

const rd = (off) => mem().getInt32(base() + off, true);
const wr = (off, v) => mem().setInt32(base() + off, v, true);
const slot = (i, f) => rd(64 + i * 32 + f); // CHARID0 ANIM4 DIR8 FLAGS12 X16 Y20 CLOCK24

let fails = 0;
const ok = (label, cond) => {
  console.log(`  ${cond ? "ok  " : "FAIL"} ${label}`);
  if (!cond) fails++;
};
// one host frame: write dt/input/view, tick
const tick = (input, dt = 16) => {
  wr(12, dt); // OFF_DT_MS
  wr(28, input); // OFF_INPUT
  wr(36, 480); // OFF_VIEW_W
  wr(40, 270); // OFF_VIEW_H
  ex.sprite_tick();
};
const IN = { UP: 1, DOWN: 2, LEFT: 4, RIGHT: 8, ACTION: 16 };

ex.sprite_init();
ok("abi version 1", ex.rg_abi_version() === 1);
ok("magic RGSP", (rd(0) >>> 0) === 0x50534752);

tick(0);
ok("menu shows 4 slots", rd(24) === 4);
ok("menu slot0 is hero (id1)", slot(0, 0) === 1);
ok("menu slot3 is rogue (id4)", slot(3, 0) === 4);
// cursor starts at 0 -> slot0 raised (smaller y) vs slot1
ok("cursor 0 raised above slot1", slot(0, 20) < slot(1, 20));

// move right to knight (edge: press then release)
tick(IN.RIGHT);
tick(0);
ok("cursor moved to knight (slot1 raised)", slot(1, 20) < slot(0, 20));

// confirm -> play
tick(IN.ACTION);
tick(0);
ok("play shows 1 slot", rd(24) === 1);
ok("selected knight (id2)", slot(0, 0) === 2);

// walk right
tick(IN.RIGHT);
tick(IN.RIGHT);
tick(IN.RIGHT);
ok("facing right (dir3)", slot(0, 8) === 3);
ok("walk clock advancing", slot(0, 24) > 0);

// jump
tick(IN.ACTION);
ok("anim = jump (2)", slot(0, 4) === 2);
// hold through the hop; after ~500ms it reverts to walk
for (let i = 0; i < 40; i++) tick(0);
ok("jump reverted to walk", slot(0, 4) === 0);

console.log(fails === 0 ? "WASM_OK" : `WASM_FAILED failures=${fails}`);
process.exit(fails === 0 ? 0 : 1);
