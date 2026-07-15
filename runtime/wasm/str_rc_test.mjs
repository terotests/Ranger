// String RC / leak-freedom test (PLAN_WASM_MEMORY Phase 3.4).
// Build:
//   node bin/output.js -l=llvm -wat -freestanding -wasmrc \
//     runtime/wasm/str_rc_demo.rgr -nodecli -d=tmp/strrc -o=g.wat
//   cp tmp/strrc/g.wat.ll tmp/strrc/g.wat && wat2wasm tmp/strrc/g.wat -o tmp/strrc/g.wasm
import fs from "fs";
const x = new WebAssembly.Instance(new WebAssembly.Module(
  fs.readFileSync(new URL("../../tmp/strrc/g.wasm", import.meta.url)))).exports;
const mem = new Uint8Array(x.memory.buffer);
const rd = (p) => { let e = p; while (mem[e]) e++; return Buffer.from(mem.slice(p, e)).toString("utf8"); };
let pass = 0, fail = 0;
const ok = (n, g, e) => { if (g === e) pass++; else { fail++; console.log("FAIL", n, JSON.stringify(g), "exp", JSON.stringify(e)); } };

x.Heap_init();

// correctness: the HUD string is right even though it's freed every call
ok("hud(42)", rd(x.SG_hud(42)), "HITS 42");
ok("hud(7)", rd(x.SG_hud(7)), "HITS 7");

// leak-freedom: the heap frontier must be identical no matter how many
// throwaway strings we build. If any per-iteration temp leaked, the frontier
// would climb with the iteration count.
x.Heap_init();
const f1   = x.SG_churnHud(1);
const f1k  = x.SG_churnHud(1000);
const f100k= x.SG_churnHud(100000);
ok("churnHud flat 1 vs 1000", f1k, f1);
ok("churnHud flat 1 vs 100000", f100k, f1);

x.Heap_init();
const n1  = x.SG_churnNested(1);
const n10k= x.SG_churnNested(10000);
ok("churnNested flat", n10k, n1);

// churnReassign keeps `s` live until function scope-end, so measure AFTER the
// call returns (the scope-end release frees s; a leak-free heap is then empty).
x.Heap_init();
const base = x.SG_frontier();
x.SG_churnReassign(1);
const rf1 = x.SG_frontier();
x.SG_churnReassign(10000);
const rf10k = x.SG_frontier();
ok("churnReassign frontier back to base (1)", rf1, base);
ok("churnReassign frontier back to base (10000)", rf10k, base);
ok("churnReassign no live blocks", x.SG_liveBlocks(), 0);

// after all that churn, zero live heap blocks remain (everything freed)
x.Heap_init();
x.SG_churnHud(5000);
ok("no live blocks after churn", x.SG_liveBlocks(), 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
