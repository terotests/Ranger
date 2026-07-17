// Lambda / closure test (L0/L1: non-capturing) on the WASM backend.
// Build:
//   node bin/output.js -l=llvm -wat -freestanding -wasmrc \
//     runtime/wasm/lambda_demo.rgr -nodecli -d=tmp/lam -o=g.wat
//   cp tmp/lam/g.wat.ll tmp/lam/g.wat && wat2wasm tmp/lam/g.wat -o tmp/lam/g.wasm
import fs from "fs";
const x = new WebAssembly.Instance(new WebAssembly.Module(
  fs.readFileSync(new URL("../../tmp/lam/g.wasm", import.meta.url)))).exports;
let pass = 0, fail = 0;
const ok = (n, g, e) => { if (g === e) pass++; else { fail++; console.log("FAIL", n, JSON.stringify(g), "exp", JSON.stringify(e)); } };

x.Heap_init();

// direct call of a lambda bound to a local, then invoked
ok("directCall 21*2", x.SG_directCall(21), 42);

// callback: a lambda passed to a higher-order fn, invoked via call_indirect
ok("applyCallback 14*3", x.SG_applyCallback(14), 42);

// inline lambda argument
ok("applyInline 5+100", x.SG_applyInline(5), 105);

// two lambdas of the same signature share one call_indirect type
ok("pickOp inc(9)", x.SG_pickOp(0, 9), 10);
ok("pickOp sq(9)", x.SG_pickOp(1, 9), 81);

// leak check: build+call a lambda N times; frontier must not depend on N
// (each closure record is freed when the loop-local goes out of scope)
const f5 = x.SG_churn(5);
const f500 = x.SG_churn(500);
ok("churn leak-free (frontier stable)", f500, f5);

// --- L2: capture by value (read-only) ---
ok("capVal base=100 + x=5", x.SG_capVal(100, 5), 105);
ok("capTwo a=10 b=20 + x=5", x.SG_capTwo(10, 20, 5), 35);
ok("capCb k=3 * v=5 (capturing callback)", x.SG_capCb(3, 5), 15);
ok("capObj reads captured object field", x.SG_capObj(42), 42);
ok("capChurn sum 0..99", x.SG_capChurn(100), 4950);

// object-capturing closures built in a loop must not leak (env retains + frees)
const oc5 = x.SG_capChurn(5);
const oc500 = x.SG_capChurn(500);
ok("capChurn object-capture leak-free", x.SG_liveBlocks(), 0);

// --- L3: capture + mutate ---
ok("mutObj: write captured object field, visible outside", x.SG_mutObj(77), 77);
ok("deferredHandler: two deferred mutations land", x.SG_deferredHandler(10), 20);
ok("mutCounter: closure increments boxed value 5x", x.SG_mutCounter(5), 5);
ok("mutShared: closure read+writes shared box (5+10+20)", x.SG_mutShared(5), 35);
ok("boxChurn: sum of per-iter c bumped 2x5", x.SG_boxChurn(10), 100);
// boxed-value closures in a loop must not leak the heap cell
const bc5 = x.SG_boxChurn(5);
const bc500 = x.SG_boxChurn(500);
ok("boxChurn boxed-value leak-free", x.SG_liveBlocks(), 0);

// no live objects remain after all calls returned
ok("no leaked objects", x.SG_liveBlocks(), 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
