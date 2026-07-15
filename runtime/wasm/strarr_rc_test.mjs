// [string] array element RC test (PLAN_WASM_MEMORY Phase 4b tail).
// Build:
//   node bin/output.js -l=llvm -wat -freestanding -wasmrc \
//     runtime/wasm/strarr_rc_demo.rgr -nodecli -d=tmp/strarr -o=g.wat
//   cp tmp/strarr/g.wat.ll tmp/strarr/g.wat && wat2wasm tmp/strarr/g.wat -o tmp/strarr/g.wasm
import fs from "fs";
const x = new WebAssembly.Instance(new WebAssembly.Module(
  fs.readFileSync(new URL("../../tmp/strarr/g.wasm", import.meta.url)))).exports;
let pass = 0, fail = 0;
const ok = (n, g, e) => { if (g === e) pass++; else { fail++; console.log("FAIL", n, JSON.stringify(g), "exp", JSON.stringify(e)); } };

x.Heap_init();
// content correctness: "item0".."item4" -> lengths 5..5 (all "itemN", N single digit)
ok("lenSum(5)", x.SG_lenSum(5), 5 * 5);          // "item0".."item4" = 5 chars each = 25
ok("lenSum(10)", x.SG_lenSum(10), 10 * 5);       // "item0".."item9" all single-digit = 50
ok("lenSum(12)", x.SG_lenSum(12), 10 * 5 + 2 * 6); // + "item10","item11" (6 chars) = 62
ok("firstByte(3,0)='K'", x.SG_firstByte(3, 0), 75);
ok("firstByte(3,2)='K'", x.SG_firstByte(3, 2), 75);

// leak-freedom: build+drop many times, heap frontier identical
x.Heap_init();
const c1  = x.SG_churn(1, 100);
const c1k = x.SG_churn(1000, 100);
ok("churn flat", c1k, c1);

// zero live blocks after churn: every dup'd element + backing + descriptor freed
x.Heap_init();
x.SG_churn(500, 80);
ok("no live blocks after churn", x.SG_liveBlocks(), 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
