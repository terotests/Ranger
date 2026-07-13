// Usage: node tools/capq_demo.cjs [logic.wasm]
// Demonstrates + smoke-tests the RGCQ capability query from the host side:
// the guest declares the keys it cares about, a simulated host answers them
// with typed values, and the guest's rg_check_env() gate reacts. Mirrors the
// layout in assembly/abi.ts / wasm/wasm_game_abi.h.
const fs = require("fs");
const path = process.argv[2] || require("path").join(__dirname, "..", "..", "..", "games", "autopeli_as", "logic.wasm");
const ex = new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(path)), {
  env: { abort: () => { throw new Error("abort"); }, rg_host_register_sheet: () => 0, rg_host_register_rect: () => 0 },
}).exports;

const mem = new DataView(ex.memory.buffer);
const u8 = new Uint8Array(ex.memory.buffer);
const abi = ex.abi_base();

const CAPQ = 2304, OFF_COUNT = 4, OFF_READY = 8, ENTRIES = 2320, ESZ = 20, POOL = 2440;
const T_BOOL = 1, T_INT = 2, T_FLOAT = 3, T_STRING = 4;

// 1. Guest declares which capabilities it wants answered.
ex.rg_declare_queries();
const magicOk = (mem.getUint32(abi + CAPQ, true) >>> 0) === 0x51434752; // 'RGCQ'
const count = mem.getInt32(abi + CAPQ + OFF_COUNT, true);

// 2. Host reads the requested key strings out of the request area.
const keys = [];
for (let i = 0; i < count; i++) {
  const b = abi + ENTRIES + i * ESZ;
  const ko = mem.getUint16(b, true), kl = mem.getUint16(b + 2, true);
  keys.push(Buffer.from(u8.slice(abi + POOL + ko, abi + POOL + ko + kl)).toString());
}

// 3. Host writes a typed answer + present flag for each entry.
function answer(i, type, ival, fval) {
  const b = ENTRIES + i * ESZ;
  u8[abi + b + 4] = 1;          // present
  u8[abi + b + 5] = type;       // type tag
  mem.setInt32(abi + b + 8, ival | 0, true);
  if (fval !== undefined) mem.setFloat32(abi + b + 12, fval, true);
}
answer(0, T_BOOL, 1);          // physics = true
answer(1, T_BOOL, 0);          // debugmode = false
answer(2, T_INT, 480);         // screen.width = 480
answer(3, T_INT, 1);           // gpu = 1 (GLES2)
mem.setInt32(abi + CAPQ + OFF_READY, 1, true);

// 4. Guest reads the answers back through its typed accessors + the gate.
const runWithPhysics = ex.rg_check_env();
answer(0, T_BOOL, 0);          // now: no host physics
const runWithout = ex.rg_check_env();

const ok = magicOk && count === 4 &&
  keys.join(",") === "physics,debugmode,screen.width,gpu" &&
  runWithPhysics === 0 && runWithout === 1;

console.log("RGCQ magic present  :", magicOk);
console.log("declared keys       :", keys.join(", "));
console.log("rg_check_env physics=true  ->", runWithPhysics, "(0 = run)");
console.log("rg_check_env physics=false ->", runWithout, "(1 = NEED_PHYSICS)");
console.log(ok ? "\nOK — capability query round-trips" : "\nFAIL");
process.exit(ok ? 0 : 1);
