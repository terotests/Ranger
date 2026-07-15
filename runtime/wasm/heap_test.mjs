import fs from "fs";
const x = new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(new URL("../../tmp/heap.wasm", import.meta.url)))).exports;
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; } else { fail++; console.log("FAIL:", n); } };

x.Heap_init();
ok("empty heap: 0 blocks", x.Heap_usedBlocks() === 0);
const base = 16;

// distinct, aligned pointers
const a = x.Heap_alloc(12), b = x.Heap_alloc(20), c = x.Heap_alloc(8);
ok("a aligned", a % 8 === 0 && a === base + 8);
ok("distinct ptrs", a !== b && b !== c);
ok("3 blocks", x.Heap_usedBlocks() === 3);
ok("usedBytes = 16+24+8", x.Heap_usedBytes() === 16 + 24 + 8); // 12->16, 20->24, 8->8

// reuse: free middle, re-alloc same size -> reuses the hole, frontier unchanged
const fr = x.Heap_frontier();
x.Heap_free(b);
ok("free drops a block", x.Heap_usedBlocks() === 2);
const b2 = x.Heap_alloc(20);
ok("reused the hole (same addr)", b2 === b);
ok("frontier did not grow on reuse", x.Heap_frontier() === fr);

// split: free b2 (24), alloc small (8) -> splits, leaves a free remainder
x.Heap_free(b2);
const s = x.Heap_alloc(8);
ok("split reused start of hole", s === b2);
const s2 = x.Heap_alloc(8);
ok("split remainder is usable", s2 !== 0 && s2 !== s);

// tail reclaim + coalesce: free everything -> frontier back to base
x.Heap_free(a); x.Heap_free(c); x.Heap_free(s); x.Heap_free(s2);
ok("all freed -> 0 blocks", x.Heap_usedBlocks() === 0);
ok("tail reclaim -> frontier back to base", x.Heap_frontier() === base);

// stress: many alloc/free cycles must not grow the frontier unboundedly
x.Heap_init();
let maxFront = 0;
for (let i = 0; i < 5000; i++) { const p = x.Heap_alloc(16 + (i % 5) * 8); maxFront = Math.max(maxFront, x.Heap_frontier()); x.Heap_free(p); }
ok("alloc/free loop does not leak (frontier bounded, back to base)", x.Heap_frontier() === base);
ok("5000-cycle frontier stayed tiny", maxFront < 200);

// coalescing: free two adjacent, ensure a big alloc fits in the merged hole
x.Heap_init();
const p1 = x.Heap_alloc(16), p2 = x.Heap_alloc(16), p3 = x.Heap_alloc(16);
x.Heap_free(p1); x.Heap_free(p2); // adjacent -> coalesce to 40 (16+8+16)
const big = x.Heap_alloc(40);
ok("coalesced hole serves a bigger request", big === p1);
x.Heap_free(p3); x.Heap_free(big);

// exhaustion returns 0
x.Heap_init();
let oom = false;
for (let i = 0; i < 100000; i++) { if (x.Heap_alloc(64) === 0) { oom = true; break; } }
ok("exhaustion returns 0 (no trap)", oom);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
