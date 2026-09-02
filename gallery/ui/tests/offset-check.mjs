#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// What a string index MEANS, on each backend that Ranger compiles to.
//
//   node gallery/ui/tests/offset-check.mjs
//
// `InputCtl` carried a comment saying that on a C++ backend `charAt` and
// `substring` count BYTES, so a caret in non-ASCII text breaks there. It had
// never been checked. It is true, and this is the measurement:
//
//   "héllo"   strlen 5 on JS, 6 on C++
//   "aä"      strlen 2 on JS, 3 on C++
//   "a🙂b"    strlen 4 on JS, 6 on C++
//   charAt    UTF-16 code units on JS (97, 55357, 56898, 98)
//             raw UTF-8 bytes on C++ (97, 240, 159, 153, 130, 98)
//
// WHAT IS ASSERTED IS THE RULE, NOT THE NUMBERS. The expectations below are
// computed from the definitions — `s.length` is UTF-16 units and
// `Buffer.byteLength(s, "utf8")` is UTF-8 bytes — so this file contains no
// transcribed table to fall out of step, and adding a string to the probe
// extends the check for free.
//
// WHY IT MATTERS, precisely. Within ONE backend the indices are
// self-consistent, so most of `InputCtl` is fine either way. The breakage is
// at two seams:
//
//   1. `selectionStart` and `selectionEnd` are pinned to UTF-16 because the
//      DOM defines them that way and the conformance harness compares against
//      a real <input>. On a C++ host those numbers would mean bytes.
//   2. `caretXAt(i)` measures `substring(0, i)`. On C++, `caret - 1` after a
//      Backspace can land INSIDE a multi-byte character — measured:
//      `substring(0, 2)` of "aä" is "a" plus one orphaned continuation byte —
//      and the width of a broken string is not the width of anything.
//
// The web host does not have this problem: its backend is JavaScript, which
// is already UTF-16, and since the text bridge landed the browser owns
// grapheme deletion anyway. This gate exists so that the day a native host
// appears, the divergence is a known quantity with a test around it rather
// than a comment somebody wrote once.

import { execSync } from "node:child_process";

const STRINGS = {
  ascii: "abc",
  latin1: "héllo",
  umlaut: "aä",
  emoji: "a🙂b",
};

const run = (script) => {
  try {
    return execSync(`npm run --silent ${script}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (e) {
    console.log(`  FAIL could not run ${script}: ${String(e.message).split("\n")[0]}`);
    return "";
  }
};

/** `name strlen=N` lines out of the probe's output. */
const lensOf = (text) => {
  const out = {};
  for (const line of text.split("\n")) {
    const m = /^(\w+) strlen=(\d+)$/.exec(line.trim());
    if (m) out[m[1]] = Number(m[2]);
  }
  return out;
};
const charsOf = (text) => {
  const out = {};
  for (const line of text.split("\n")) {
    const m = /^(\w+) charAt=\[([\d,]*)\]$/.exec(line.trim());
    if (m) out[m[1]] = m[2] === "" ? [] : m[2].split(",").map(Number);
  }
  return out;
};

let pass = 0;
let fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log("  PASS " + name); }
  else { fail++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
};

console.log("=== string offsets, per backend ===");
console.log("compiling and running the probe on both backends…");
const js = run("ui:offset:js");
const cpp = run("ui:offset:cpp");
const jsLen = lensOf(js);
const cppLen = lensOf(cpp);
const jsChars = charsOf(js);
const cppChars = charsOf(cpp);

ok("the probe ran on JavaScript", Object.keys(jsLen).length === 4, JSON.stringify(jsLen));
ok("the probe ran on C++", Object.keys(cppLen).length === 4, JSON.stringify(cppLen));
if (!fail) {
  console.log("--- JavaScript counts UTF-16 code units ---");
  for (const [name, s] of Object.entries(STRINGS)) {
    ok(`${name} = ${s.length}`, jsLen[name] === s.length, `got ${jsLen[name]}`);
  }
  // And `charAt` hands back those units, surrogates and all.
  const jsUnits = (s) => [...Array(s.length).keys()].map((i) => s.charCodeAt(i));
  ok("charAt returns code units, surrogate halves included",
    JSON.stringify(jsChars.emoji) === JSON.stringify(jsUnits(STRINGS.emoji)),
    JSON.stringify(jsChars.emoji));

  console.log("--- C++ counts UTF-8 bytes ---");
  for (const [name, s] of Object.entries(STRINGS)) {
    const bytes = Buffer.byteLength(s, "utf8");
    ok(`${name} = ${bytes}`, cppLen[name] === bytes, `got ${cppLen[name]}`);
  }
  ok("charAt returns raw bytes",
    JSON.stringify(cppChars.emoji) === JSON.stringify([...Buffer.from(STRINGS.emoji, "utf8")]),
    JSON.stringify(cppChars.emoji));

  console.log("--- and they agree only on ASCII ---");
  ok("ascii is the same on both", jsLen.ascii === cppLen.ascii, `${jsLen.ascii} vs ${cppLen.ascii}`);
  const differ = Object.keys(STRINGS).filter((n) => n !== "ascii" && jsLen[n] !== cppLen[n]);
  ok("every non-ASCII string differs", differ.length === 3, differ.join(","));
}

console.log("");
console.log(fail ? `RESULT FAIL — passed=${pass} failed=${fail}` : `RESULT OK — passed=${pass} failed=0`);
process.exitCode = fail ? 1 : 0;
