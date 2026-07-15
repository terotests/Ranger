// Owned string-FIELD release test (PLAN_WASM_MEMORY Phase 4a).
// Build:
//   node bin/output.js -l=llvm -wat -freestanding -wasmrc \
//     runtime/wasm/field_rc_demo.rgr -nodecli -d=tmp/fieldrc -o=g.wat
//   cp tmp/fieldrc/g.wat.ll tmp/fieldrc/g.wat && wat2wasm tmp/fieldrc/g.wat -o tmp/fieldrc/g.wasm
import fs from "fs";
const x = new WebAssembly.Instance(new WebAssembly.Module(
  fs.readFileSync(new URL("../../tmp/fieldrc/g.wasm", import.meta.url)))).exports;
let pass = 0, fail = 0;
const ok = (n, g, e) => { if (g === e) pass++; else { fail++; console.log("FAIL", n, JSON.stringify(g), "exp", JSON.stringify(e)); } };

x.Heap_init();
// content: the field holds a correct private copy while the Entity is alive
ok("nameLen(7) = 'player7'", x.SG_nameLen(7), 7);
ok("nameLen(42) = 'player42'", x.SG_nameLen(42), 8);
ok("nameFirst(3) = 'p'", x.SG_nameFirst(3), 112);

// create + set string field + destroy loop stays heap-flat (Entity, its name
// buffer, and the concat/int temporaries all freed each iteration)
x.Heap_init();
const e1   = x.SG_churnEntity(1);
const e1k  = x.SG_churnEntity(1000);
const e50k = x.SG_churnEntity(50000);
ok("churnEntity flat 1 vs 1000", e1k, e1);
ok("churnEntity flat 1 vs 50000", e50k, e1);

// zero live objects after the churn — Entity + its string field both freed
x.Heap_init();
x.SG_churnEntity(3000);
ok("no live blocks after churnEntity", x.SG_liveBlocks(), 0);

// field reassignment: old buffer freed before each overwrite, Entity frees last
x.Heap_init();
const base = x.SG_frontier();
x.SG_reassignField(1);
const rf1 = x.SG_frontier();
x.SG_reassignField(10000);
const rf10k = x.SG_frontier();
ok("reassignField back to base (1)", rf1, base);
ok("reassignField back to base (10000)", rf10k, base);
ok("no live blocks after reassignField", x.SG_liveBlocks(), 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
