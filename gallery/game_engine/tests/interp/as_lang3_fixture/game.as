// Fixture 3: the third interpreted-.as coverage wave — Map/Set collections,
// Array#splice, lexical closures, and AssemblyScript sized-integer casts.
// Results go to the shared ABI for as_lang3_demo.rgr to assert. Everything here
// also compiles with asc against the same standard-library / type surface.
import { abiWrite } from "@ranger/game";

// Returned closures capturing an enclosing local (lexical scope).
function makeAdder(n: i32): (x: i32) => i32 { return (x: i32) => x + n; }
function makeCounter(): () => i32 { let c: i32 = 0; return () => { c = c + 1; return c; }; }
function makeMult(k: i32): (x: i32) => i32 { return (x: i32) => x * k; }

export function init(): void {
  // --- Array#splice ---
  let sp = [1, 2, 3, 4, 5];
  let removed = sp.splice(1, 2);
  abiWrite(480, sp.length);          // [1,4,5] -> 3
  abiWrite(484, sp[1]);              // 4
  abiWrite(488, removed.length);     // [2,3] -> 2
  let ins = [1, 4];
  ins.splice(1, 0, 2, 3);
  abiWrite(492, ins[2]);             // [1,2,3,4] -> 3
  let tail = [1, 2, 3, 4, 5];
  let rest = tail.splice(2);
  abiWrite(496, tail.length);        // [1,2] -> 2
  abiWrite(500, rest.length);        // [3,4,5] -> 3

  // --- Map ---
  let m = new Map();
  m.set("a", 1);
  m.set("b", 2);
  m.set("a", 9);                     // update, not duplicate
  abiWrite(504, m.get("a"));         // 9
  abiWrite(508, m.size);             // 2
  abiWrite(512, m.has("b") ? 1 : 0); // 1
  m.delete("b");
  abiWrite(516, m.has("b") ? 1 : 0); // 0
  let mi = new Map([[1, 100], [2, 200]]);
  abiWrite(520, mi.get(2));          // 200 (integer keys)
  let msum: i32 = 0;
  let mkeys: i32 = 0;
  let mfe = new Map([["x", 3], ["y", 4]]);
  mfe.forEach((v: i32, k: string) => { msum += v; mkeys += k.length; });
  abiWrite(524, msum);               // 7
  abiWrite(528, mkeys);              // 2

  // --- Map for-of with destructuring ---
  let mof = new Map([["a", 10], ["b", 20], ["c", 30]]);
  let mofsum: i32 = 0;
  for (let [k, v] of mof) { mofsum += v; }
  abiWrite(532, mofsum);             // 60

  // --- Set ---
  let s = new Set();
  s.add(5);
  s.add(5);                          // dedup
  s.add(9);
  abiWrite(536, s.size);             // 2
  abiWrite(540, s.has(9) ? 1 : 0);   // 1
  s.delete(5);
  abiWrite(544, s.size);             // 1
  let si = new Set([1, 2, 2, 3, 3, 3]);
  abiWrite(548, si.size);            // 3
  let ssum: i32 = 0;
  for (let x of si) { ssum += x; }
  abiWrite(552, ssum);               // 6

  // --- Lexical closures ---
  let add5 = makeAdder(5);
  abiWrite(556, add5(10));           // 15
  abiWrite(560, add5(100));          // 105
  let next = makeCounter();
  let n1 = next();
  let n2 = next();
  let n3 = next();
  abiWrite(564, n1 + n2 + n3);       // 1+2+3 = 6 (stateful capture)
  let a = makeAdder(3);
  let b = makeAdder(10);
  abiWrite(568, a(1) + b(1));        // 4 + 11 = 15 (independent instances)
  let mapped = [1, 2, 3].map(makeMult(10));  // returned closure as callback
  abiWrite(572, mapped[2]);          // 30

  // --- AssemblyScript sized-integer casts (bit-exact wraparound) ---
  abiWrite(576, u8(300));            // 300 & 255 = 44
  abiWrite(580, u8(-1));             // 255
  abiWrite(584, i32(4294967296 + 7)); // wraps to 7
  abiWrite(588, i32(-1));            // -1
  abiWrite(592, u32(-1) > 0 ? 1 : 0); // 4294967295 > 0 -> 1
  abiWrite(596, i16(40000));         // 40000 - 65536 = -25536
  let big: i32 = 0x1FF;
  abiWrite(600, u8(big));            // 511 & 255 = 255
  let over: i32 = 300;
  abiWrite(604, (over as u8));       // 44 (as-cast truncates)
  abiWrite(608, i32(3.9));           // truncates toward zero -> 3
}

export function update(): void {}
