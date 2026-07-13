// Fixture: exercises interpreted-.as language coverage added to ComponentEngine
// — bit operators, exponent, radix literals, switch/do-while/for-in, the full
// set of compound assignments, prefix/postfix update values on identifier and
// member targets, plus String/Array/Math/global stdlib methods. Results are
// written to the shared ABI for the host runner (as_lang_demo.rgr) to assert.
// Every construct here also compiles unchanged with `asc`.
import { abiWrite } from "@ranger/game";

function sq(x: i32): i32 { return x * x; }

export function init(): void {
  // --- bitwise + shift operators ---
  abiWrite(480, 1 << 4);           // 16
  abiWrite(484, 256 >> 2);         // 64
  abiWrite(488, 1024 >>> 3);       // 128
  abiWrite(492, ~0);               // -1
  abiWrite(496, 6 & 3);            // 2
  abiWrite(500, 5 | 2);            // 7
  abiWrite(504, 5 ^ 1);            // 4

  // --- exponent + radix literals ---
  abiWrite(508, 3 ** 4);           // 81
  abiWrite(512, 0xFF);             // 255
  abiWrite(516, 0b1010);           // 10
  abiWrite(520, 0o17);             // 15
  abiWrite(524, 1_000);            // 1000

  // --- compound assignment (identifier targets) ---
  let a: i32 = 10;
  a += 5;  abiWrite(528, a);       // 15
  a %= 4;  abiWrite(532, a);       // 3
  a <<= 3; abiWrite(536, a);       // 24
  a |= 1;  abiWrite(540, a);       // 25
  a &= 12; abiWrite(544, a);       // 8
  a ^= 15; abiWrite(548, a);       // 7

  // --- prefix / postfix update values ---
  let c: i32 = 5;
  abiWrite(552, c++);              // 5 (post: pre-value)
  abiWrite(556, c);                // 6
  abiWrite(560, ++c);              // 7 (pre: post-value)

  // --- compound + update on member / index targets ---
  let arr = [1, 2, 3];
  arr[0] += 10;  abiWrite(564, arr[0]);   // 11
  arr[1]++;      abiWrite(568, arr[1]);   // 3
  let obj = { n: 4 };
  obj.n *= 5;    abiWrite(572, obj.n);    // 20

  // --- switch (fall-through + default) ---
  let sw: i32 = 0;
  let k: i32 = 2;
  switch (k) {
    case 1: sw = 100; break;
    case 2: sw = 200; break;
    default: sw = 999;
  }
  abiWrite(576, sw);               // 200

  // --- do-while ---
  let i: i32 = 0;
  let sum: i32 = 0;
  do { sum += i; i++; } while (i < 5);
  abiWrite(580, sum);              // 10

  // --- for-in over object keys ---
  let cnt: i32 = 0;
  let o2 = { x: 1, y: 2, z: 3 };
  for (let key in o2) { cnt++; }
  abiWrite(584, cnt);              // 3

  // --- String methods ---
  abiWrite(588, "hello".indexOf("l"));           // 2
  abiWrite(592, "foobar".startsWith("foo") ? 1 : 0); // 1
  abiWrite(596, "ABC".charCodeAt(0));            // 65
  abiWrite(600, "a-b-c-d".split("-").length);    // 4
  abiWrite(604, "hi".repeat(3).length);          // 6

  // --- Array methods (incl. higher-order callbacks) ---
  let nums = [1, 2, 3, 4, 5, 6];
  abiWrite(608, nums.map((x: i32) => x * 2)[5]);            // 12
  abiWrite(612, nums.filter((x: i32) => x % 2 == 0).length); // 3
  abiWrite(616, nums.reduce((acc: i32, x: i32) => acc + x, 0)); // 21
  abiWrite(620, nums.find((x: i32) => x > 4));             // 5
  abiWrite(624, nums.indexOf(4));                          // 3
  abiWrite(628, nums.includes(6) ? 1 : 0);                // 1

  // --- Math + global ---
  abiWrite(632, Math.min(9, 4));   // 4
  abiWrite(636, Math.max(9, 4));   // 9
  abiWrite(640, Math.pow(2, 10));  // 1024
  abiWrite(644, Math.sign(-3));    // -1
  abiWrite(648, parseInt("42"));   // 42

  // --- a string that looks like an operator must stay a plain literal ---
  abiWrite(652, "-".length);       // 1

  // --- helper call still works alongside everything ---
  abiWrite(656, sq(7));            // 49
}

export function update(): void {}
