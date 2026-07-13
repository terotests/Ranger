// Fixture 2: the second interpreted-.as coverage wave — destructuring, default/
// rest params, spread, array mutators, Object/JSON, instanceof/in/delete,
// try/catch/finally, and String/Math/global stdlib extras. Results go to the
// shared ABI for as_lang2_demo.rgr to assert. Everything here also compiles with
// asc against the same standard-library surface.
import { abiWrite } from "@ranger/game";

class Vec { x: i32 = 0; y: i32 = 0; }
function withDefault(a: i32, b: i32 = 100): i32 { return a + b; }
function variadic(...xs: i32[]): i32 { let s: i32 = 0; for (let v of xs) { s += v; } return s; }

export function init(): void {
  // --- destructuring ---
  let [d0, d1, d2] = [3, 6, 9];
  abiWrite(480, d0 + d1 + d2);              // 18
  let [head, ...tail] = [1, 2, 3, 4];
  abiWrite(484, tail.length);               // 3
  let [p = 5, q = 7] = [11];
  abiWrite(488, p + q);                     // 11 + 7 = 18
  let { x, y } = { x: 40, y: 2 };
  abiWrite(492, x + y);                      // 42
  let { a: alias } = { a: 55 };
  abiWrite(496, alias);                      // 55
  let { m, ...restObj } = { m: 1, n: 2, o: 3 };
  abiWrite(500, restObj.n + restObj.o);      // 5

  // --- default / rest params, spread ---
  abiWrite(504, withDefault(1));             // 101
  abiWrite(508, withDefault(1, 2));          // 3
  abiWrite(512, variadic(1, 2, 3, 4, 5));    // 15
  let callArgs = [10, 20, 30];
  abiWrite(516, variadic(...callArgs));      // 60
  let spreadArr = [0, ...[1, 2], 3];
  abiWrite(520, spreadArr.length);           // 4
  let spreadObj = { ...{ a: 1 }, b: 2 };
  abiWrite(524, spreadObj.a + spreadObj.b);  // 3

  // --- array mutators ---
  let arr = [1, 2, 3];
  abiWrite(528, arr.push(4));                // returns new length 4
  abiWrite(532, arr.pop());                  // 4
  abiWrite(536, arr.shift());                // 1
  arr.unshift(0);
  abiWrite(540, arr[0]);                     // 0
  let rev = [1, 2, 3];
  rev.reverse();
  abiWrite(544, rev[0]);                     // 3
  let srt = [3, 1, 2];
  srt.sort((s0: i32, s1: i32) => s0 - s1);
  abiWrite(548, srt[0]);                     // 1
  abiWrite(552, [1, 2].concat([3, 4]).length); // 4
  abiWrite(556, [[1], [2, 3]].flat().length);   // 3
  abiWrite(560, [5, 6, 7].at(-1));           // 7
  abiWrite(564, Array.isArray(arr) ? 1 : 0); // 1

  // --- Object / JSON ---
  let obj = { a: 1, b: 2, c: 3 };
  abiWrite(568, Object.keys(obj).length);    // 3
  let vals = Object.values(obj);
  abiWrite(572, vals[0] + vals[1] + vals[2]); // 6
  let merged = { p: 1 };
  Object.assign(merged, { r: 2 });
  abiWrite(576, merged.p + merged.r);        // 3
  let parsed = JSON.parse("{\"k\": 8, \"list\": [1, 2, 3]}");
  abiWrite(580, parsed.k);                   // 8
  abiWrite(584, parsed.list.length);         // 3
  let round = JSON.parse(JSON.stringify({ z: 21 }));
  abiWrite(588, round.z);                    // 21

  // --- instanceof / in / delete ---
  let v = new Vec();
  abiWrite(592, (v instanceof Vec) ? 1 : 0); // 1
  let has = { key: 1 };
  abiWrite(596, ("key" in has) ? 1 : 0);     // 1
  delete has.key;
  abiWrite(600, ("key" in has) ? 1 : 0);     // 0

  // --- try / catch / finally / throw ---
  let caught: i32 = 0;
  let fin: i32 = 0;
  try { throw 77; } catch (e) { caught = e; } finally { fin = 1; }
  abiWrite(604, caught);                      // 77
  abiWrite(608, fin);                         // 1

  // --- String / Math / global extras ---
  abiWrite(612, "a-b-a".replace("a", "X").length);        // "X-b-a" 5
  abiWrite(616, "a.b.c".replaceAll(".", "").length);      // "abc" 3
  abiWrite(620, "abcabc".lastIndexOf("a"));               // 3
  abiWrite(624, Math.hypot(3, 4));                        // 5
  abiWrite(628, Number("64") + 1);                        // 65
  abiWrite(632, Number.isInteger(5) ? 1 : 0);             // 1
  abiWrite(636, isNaN(Math.sqrt(-1.0)) ? 1 : 0);          // 1
  abiWrite(640, "hi   ".trimEnd().length);                // 2
}

export function update(): void {}
