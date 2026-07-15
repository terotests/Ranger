// Usage: node tools/selfcheck.cjs <a.wasm> <b.wasm>
// Behavioural self-comparison between two AssemblyScript builds of the guest
// (e.g. baseline vs refactor). Same drive() as parity.cjs, but compares two AS
// wasms against each other so a pure code-organisation refactor can be proven
// byte-identical without rebuilding the Rust guest.
const fs = require("fs");
function boot(path) {
  const b = fs.readFileSync(path);
  const inst = new WebAssembly.Instance(new WebAssembly.Module(b), {
    env: { abort: () => { throw new Error("abort"); }, rg_host_register_sheet: () => 0, rg_host_register_rect: () => 0 },
  });
  return inst.exports;
}
const FP = 256;
const a = boot(process.argv[2]);
const b = boot(process.argv[3]);

function drive(ex) {
  const mem = new DataView(ex.memory.buffer);
  ex.init();
  const abi = ex.abi_base();
  const w = (o, v) => mem.setInt32(abi + o, v, true);
  w(64 + 0 * 24 + 8, 30000); w(64 + 0 * 24 + 12, 50 * FP); w(64 + 0 * 24 + 16, 6 * FP); // P1
  w(64 + 1 * 24 + 8, -20000); w(64 + 1 * 24 + 12, 40 * FP); w(64 + 1 * 24 + 16, -4 * FP); // P2
  w(12, 16); w(16, 1234);           // dt, time
  w(20, 1 | 8); w(24, 2 | 4);       // inputs P1=UP|RIGHT, P2=DOWN|LEFT
  function contact(i, aa, bb, imp, x, y, nx, ny) {
    const o = abi + 1600 + i * 32;
    mem.setInt32(o, aa, true); mem.setInt32(o + 4, bb, true); mem.setInt32(o + 8, 1, true);
    mem.setInt32(o + 12, imp, true); mem.setInt32(o + 16, x, true); mem.setInt32(o + 20, y, true);
    mem.setInt32(o + 24, nx, true); mem.setInt32(o + 28, ny, true);
  }
  contact(0, 0, 100, 30 * FP, 200 * FP, 5000 * FP, 600, -800);
  contact(1, 1, 1001, 90 * FP, 210 * FP, 4900 * FP, 0, 0);
  contact(2, 0, 5, 60 * FP, 205 * FP, 4950 * FP, 0, 0);
  w(36, 3); // contact count
  ex.update();
  return { ex, mem, abi };
}
function region(s, off, len) {
  return Buffer.from(s.mem.buffer, s.abi + off, len).toString("hex");
}
function uiHex(s) {
  const base = s.ex.rg_ui_ptr();
  const u32 = (o) => new DataView(s.mem.buffer).getUint32(base + o, true);
  const used = u32(32) + u32(36);
  return Buffer.from(s.mem.buffer, base, used).toString("hex");
}
const ra = drive(a), rb = drive(b);
const checks = [
  ["controls (17 bodies)", region(ra, 832, 17 * 16), region(rb, 832, 17 * 16)],
  ["impulse count", region(ra, 32, 4), region(rb, 32, 4)],
  ["impulses", region(ra, 1344, 16 * 16), region(rb, 1344, 16 * 16)],
  ["event count", region(ra, 52, 4), region(rb, 52, 4)],
  ["events", region(ra, 2048, 12 * 20), region(rb, 2048, 12 * 20)],
  ["score", region(ra, 40, 4), region(rb, 40, 4)],
  ["hits", region(ra, 44, 4), region(rb, 44, 4)],
  ["camera_y", region(ra, 48, 4), region(rb, 48, 4)],
  ["air p1/p2", region(ra, 56, 8), region(rb, 56, 8)],
  ["RGU1 HUD block", uiHex(ra), uiHex(rb)],
];
let ok = 0, fail = 0;
for (const [name, aa, bb] of checks) {
  const same = aa === bb;
  console.log((same ? "  OK  " : " DIFF ") + name);
  if (!same) { console.log("    a:", aa.slice(0, 96)); console.log("    b:", bb.slice(0, 96)); fail++; } else ok++;
}
console.log(`\n${ok}/${checks.length} regions identical` + (fail ? `  (${fail} differ)` : "  — IDENTICAL BEHAVIOUR"));
process.exit(fail ? 1 : 0);
