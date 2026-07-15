// Collection RC test (PLAN_WASM_MEMORY Phase 4b).
// Build:
//   node bin/output.js -l=llvm -wat -freestanding -wasmrc \
//     runtime/wasm/coll_rc_demo.rgr -nodecli -d=tmp/collrc -o=g.wat
//   cp tmp/collrc/g.wat.ll tmp/collrc/g.wat && wat2wasm tmp/collrc/g.wat -o tmp/collrc/g.wasm
import fs from "fs";
const x = new WebAssembly.Instance(new WebAssembly.Module(
  fs.readFileSync(new URL("../../tmp/collrc/g.wasm", import.meta.url)))).exports;
let pass = 0, fail = 0;
const ok = (n, g, e) => { if (g === e) pass++; else { fail++; console.log("FAIL", n, JSON.stringify(g), "exp", JSON.stringify(e)); } };

x.Heap_init();
// correctness (values), including multiple grows of the backing store
ok("sumList(5)", x.SG_sumList(5), 10);
ok("sumList(100)", x.SG_sumList(100), 4950);
ok("sumList(1000)", x.SG_sumList(1000), 499500);
ok("sumEnts(5)", x.SG_sumEnts(5), 10);
ok("sumEnts(300)", x.SG_sumEnts(300), 44850);

// leak-freedom: build+drop N times, heap frontier must be identical
x.Heap_init();
const l1  = x.SG_churnList(1, 500);
const l1k = x.SG_churnList(1000, 500);
ok("churnList flat", l1k, l1);

x.Heap_init();
const e1  = x.SG_churnEnts(1, 200);
const e1k = x.SG_churnEnts(1000, 200);
ok("churnEnts flat", e1k, e1);

// zero live blocks after churn — arrays, backing stores, and elements all freed
x.Heap_init();
x.SG_churnList(500, 400);
ok("no live blocks after churnList", x.SG_liveBlocks(), 0);
x.Heap_init();
x.SG_churnEnts(500, 150);
ok("no live blocks after churnEnts", x.SG_liveBlocks(), 0);

// array created inside a loop body: freed per iteration, not accumulated
x.Heap_init();
const b1  = x.SG_churnBodyList(1, 300);
const b1k = x.SG_churnBodyList(2000, 300);
ok("churnBodyList flat", b1k, b1);
x.Heap_init();
x.SG_churnBodyList(1000, 200);
ok("no live blocks after churnBodyList", x.SG_liveBlocks(), 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
