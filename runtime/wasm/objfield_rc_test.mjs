// Owned object-field RC test (WASM). Build:
//   node bin/output.js -l=llvm -wat -freestanding -wasmrc \
//     runtime/wasm/objfield_rc_demo.rgr -nodecli -d=tmp/objf -o=g.wat
//   cp tmp/objf/g.wat.ll tmp/objf/g.wat && wat2wasm tmp/objf/g.wat -o tmp/objf/g.wasm
import fs from "fs";
const x = new WebAssembly.Instance(new WebAssembly.Module(
  fs.readFileSync(new URL("../../tmp/objf/g.wasm", import.meta.url)))).exports;
let pass = 0, fail = 0;
const ok = (n, g, e) => { if (g === e) pass++; else { fail++; console.log("FAIL", n, JSON.stringify(g), "exp", JSON.stringify(e)); } };

x.Heap_init();
ok("shared field content", x.SG_sharedVal(), 77);

// fresh default field (Holder owns its Vec): create/destroy loop stays flat
x.Heap_init();
ok("churnDefault flat", x.SG_churnDefault(1000), x.SG_churnDefault(1));
// a Vec shared by two Holder fields + a local: RC frees it exactly once
x.Heap_init();
ok("churnShared flat", x.SG_churnShared(1000), x.SG_churnShared(1));
// field overwrite releases the old child each iteration
x.Heap_init();
const base = x.SG_frontier();
x.SG_churnOverwrite(1);
const o1 = x.SG_frontier();
x.SG_churnOverwrite(10000);
ok("churnOverwrite flat", x.SG_frontier(), o1);

// zero live blocks after churn: parents AND their object children all freed
x.Heap_init(); x.SG_churnDefault(500);
ok("no live blocks after churnDefault", x.SG_liveBlocks(), 0);
x.Heap_init(); x.SG_churnShared(500);
ok("no live blocks after churnShared (shared freed once)", x.SG_liveBlocks(), 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
