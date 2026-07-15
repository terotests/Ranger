import fs from "fs";
const x = new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(new URL("../../tmp/objmem/obj.wasm", import.meta.url)))).exports;
const mem = new DataView(x.memory.buffer);
const R = (o) => mem.getInt32(o, true), W = (o, v) => mem.setInt32(o, v, true);
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.log("FAIL:", n); } };

x.Heap_init();
// Build a permanent typedesc for a node { value@0, next@4 } — next is an owned object field.
const fields = x.Heap_alloc(12); W(fields, 4); W(fields + 4, 1); W(fields + 8, 1);   // offset=4 kind=object owned=1
const td = x.Heap_alloc(12); W(td, 8); W(td + 4, 1); W(td + 8, fields);               // structSize=8 fieldCount=1 fieldsPtr
const baseline = x.RangerObj_liveBlocks(); // 2 permanent typedesc blocks
ok("baseline = 2 typedesc blocks", baseline === 2);

// --- recursive teardown: a chain of 5 nodes, release the head ---
let head = x.RangerObj_new(8, td), prev = head;
for (let i = 1; i < 5; i++) { const n = x.RangerObj_new(8, td); W(prev + 4, n); prev = n; }
ok("5 nodes allocated", x.RangerObj_liveBlocks() === baseline + 5);
x.RangerObj_release(head);
ok("releasing head recursively frees the whole chain", x.RangerObj_liveBlocks() === baseline);

// --- refcount: retain keeps it alive until the matching release ---
const a = x.RangerObj_new(8, td);
x.RangerObj_retain(a);
ok("rc after new+retain = 2", x.RangerObj_refCount(a) === 2);
x.RangerObj_release(a);
ok("one release -> still live (rc 1)", x.RangerObj_liveBlocks() === baseline + 1 && x.RangerObj_refCount(a) === 1);
x.RangerObj_release(a);
ok("second release -> freed", x.RangerObj_liveBlocks() === baseline);

// --- shared ownership: two parents own one child (retained) ---
const pA = x.RangerObj_new(8, td), pB = x.RangerObj_new(8, td), child = x.RangerObj_new(8, td);
W(pA + 4, child); W(pB + 4, child); x.RangerObj_retain(child); // child now owned by both, rc=2
ok("3 objects live", x.RangerObj_liveBlocks() === baseline + 3);
x.RangerObj_release(pA);
ok("release pA -> pA gone, child survives (rc 1)", x.RangerObj_liveBlocks() === baseline + 2 && x.RangerObj_refCount(child) === 1);
x.RangerObj_release(pB);
ok("release pB -> pB and child both gone", x.RangerObj_liveBlocks() === baseline);

// --- no-leak: 2000 build-and-release cycles keep the heap flat ---
for (let i = 0; i < 2000; i++) { let h = x.RangerObj_new(8, td), p = h; for (let k = 0; k < 4; k++){ const n = x.RangerObj_new(8, td); W(p+4,n); p=n; } x.RangerObj_release(h); }
ok("2000 chain build/release cycles -> no leak", x.RangerObj_liveBlocks() === baseline);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
