import fs from "fs";
const x = new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(new URL("../../tmp/rcdemo/rc.wasm", import.meta.url)))).exports;
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.log("FAIL:", n); } };
const reset = () => x.Heap_init(); // fresh heap per case (linear memory persists across calls)

reset(); ok("single-scope new: correct value", x.Demo_oneAlloc() === 42);
ok("single-scope new: object auto-freed at return", x.Demo_liveNow() === 0);

reset(); ok("loop 1000 def-in-body: correct sum", x.Demo_loopAlloc(1000) === (() => { let s = 0; for (let i = 0; i < 1000; i++) s += i + i * 2; return s; })());
ok("loop 1000: no leak (heap empty)", x.Demo_liveNow() === 0);

reset(); x.Demo_loopAlloc(50000); ok("loop 50000: no leak, no OOM (free-list reuse)", x.Demo_liveNow() === 0);

reset(); ok("nested loops 100x100: count", x.Demo_nestedAlloc(100, 100) === 10000);
ok("nested loops: no leak (inner+outer freed per iteration)", x.Demo_liveNow() === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
