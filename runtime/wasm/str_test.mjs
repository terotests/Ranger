// Build first:  node bin/output.js -l=llvm -wat -freestanding -wasmrc \
//   runtime/wasm/str_demo.rgr -nodecli -d=tmp/strfull -o=g.wat  &&  wat2wasm ...
import fs from "fs";
const x = new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(new URL("../../tmp/strfull/g.wasm", import.meta.url)))).exports;
const mem = new Uint8Array(x.memory.buffer);
const rd = (p) => { let e = p; while (mem[e]) e++; return Buffer.from(mem.slice(p, e)).toString("utf8"); };
let pass = 0, fail = 0;
const ok = (n, g, e) => { if (g === e) pass++; else { fail++; console.log("FAIL", n, JSON.stringify(g), "exp", JSON.stringify(e)); } };
x.Heap_init();
ok("hud(42)", rd(x.G_hud(42)), "HITS 42");             // literal + int concat
ok("hud(0)", rd(x.G_hud(0)), "HITS 0");
ok("combine(3,7)", rd(x.G_combine(3,7)), "(3,7");       // nested concat
ok("lenHud(1234)", x.G_lenHud(1234), 10);               // strlen of concat
ok("greetLen()", x.G_greetLen(), 11);                   // strlen of stored literal
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
