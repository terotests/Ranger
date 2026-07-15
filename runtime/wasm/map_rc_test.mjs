// Map RC / growth test (PLAN_WASM_MEMORY Phase 4b).
// Build:
//   node bin/output.js -l=llvm -wat -freestanding -wasmrc \
//     runtime/wasm/map_rc_demo.rgr -nodecli -d=tmp/maprc -o=g.wat
//   cp tmp/maprc/g.wat.ll tmp/maprc/g.wat && wat2wasm tmp/maprc/g.wat -o tmp/maprc/g.wasm
import fs from "fs";
const x = new WebAssembly.Instance(new WebAssembly.Module(
  fs.readFileSync(new URL("../../tmp/maprc/g.wasm", import.meta.url)))).exports;
let pass = 0, fail = 0;
const ok = (n, g, e) => { if (g === e) pass++; else { fail++; console.log("FAIL", n, JSON.stringify(g), "exp", JSON.stringify(e)); } };
const sum10 = (n) => 10 * (n * (n - 1) / 2);

// correctness across many table doublings + rehashes (no infinite probe)
x.Heap_init();
ok("mapSum(5)", x.SG_mapSum(5), sum10(5));
ok("mapSum(50)", x.SG_mapSum(50), sum10(50));
ok("mapSum(500)", x.SG_mapSum(500), sum10(500));
// large map forces linear memory to grow past the initial 64 KiB page
x.Heap_init();
ok("mapSum(5000) (memory grows)", x.SG_mapSum(5000), sum10(5000));
ok("mapSum(20000) (memory grows)", x.SG_mapSum(20000), sum10(20000));

// overwrite: repeated puts of the same keys update in place, size bounded
x.Heap_init();
ok("mapOverwrite(30,10)", x.SG_mapOverwrite(30, 10), 9 + 29); // r=9, i=29

// leak-freedom: build+drop a map many times, heap frontier identical
x.Heap_init();
const m1  = x.SG_churnMap(1, 200);
const m1k = x.SG_churnMap(1000, 200);
ok("churnMap flat", m1k, m1);
x.Heap_init();
x.SG_churnMap(500, 300);
ok("no live blocks after churnMap", x.SG_liveBlocks(), 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
