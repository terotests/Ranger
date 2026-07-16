// Singleton test (@singleton(true) on the WASM backend).
// Build:
//   node bin/output.js -l=llvm -wat -freestanding -wasmrc \
//     runtime/wasm/singleton_demo.rgr -nodecli -d=tmp/sgl -o=g.wat
//   cp tmp/sgl/g.wat.ll tmp/sgl/g.wat && wat2wasm tmp/sgl/g.wat -o tmp/sgl/g.wasm
import fs from "fs";
const x = new WebAssembly.Instance(new WebAssembly.Module(
  fs.readFileSync(new URL("../../tmp/sgl/g.wasm", import.meta.url)))).exports;
let pass = 0, fail = 0;
const ok = (n, g, e) => { if (g === e) pass++; else { fail++; console.log("FAIL", n, JSON.stringify(g), "exp", JSON.stringify(e)); } };

x.Heap_init();
// state persists across separate exported calls (frames) via the wasm global
ok("same instance on repeat lookup", x.G_sameInstance(), 1);
ok("frame starts 0", x.G_frame(), 0);
for (let i = 0; i < 5; i++) x.G_update();
ok("frame after 5 updates", x.G_frame(), 5);
ok("score 10+20+30+40+50", x.G_score(), 150);      // sum frame*10
ok("enemies list grew to 5", x.G_enemies(), 5);
x.G_update();
ok("frame after 6th update", x.G_frame(), 6);
ok("score after 6th", x.G_score(), 210);           // 150 + 60

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
