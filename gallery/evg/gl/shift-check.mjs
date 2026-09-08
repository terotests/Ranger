#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Every draw in the WebGL painter has to honour the layer shift.
//
//   node gallery/evg/gl/shift-check.mjs
//
// A SCROLL DOES NOT REBUILD THE FRAME. The painter keeps what it uploaded and
// moves it with a uniform — `uShift`, one per shader, set from `curShift`
// before each run. That is the whole reason a scroll frame costs a fraction of
// a millisecond, and it has one failure mode: a draw that forgets the uniform
// goes on painting where the frame was BUILT while everything around it moves.
//
// It is invisible until you scroll, it needs a GPU to see, and there is no
// headless oracle for it. It happened: `drawFill` never set the path shader's
// shift, so on the diary's charts the area under the curve stayed behind while
// the curve, the card and the page moved — for a whole scroll, until something
// forced the list to be built again.
//
// So the rule is checked as text, which needs no GPU: every `drawX` in the
// paint loop, and the batch draw itself, must mention `curShift`. That is
// coarse on purpose — it cannot tell a correct shift from a wrong one — but
// the mistake it catches is the one that actually happens: forgetting it
// entirely in a function written beside three that do it.
//
// Exit code 0 when every draw accounts for the shift.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(HERE, "evg-webgl.js");
const src = fs.readFileSync(FILE, "utf8");
const lines = src.split("\n");

let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) console.log("  PASS " + name);
  else {
    failed += 1;
    console.log("  FAIL " + name + (detail === undefined ? "" : " — " + detail));
  }
};

// The painter's own draw helpers: `const drawSomething = (…) => {`.
const draws = [];
for (let i = 0; i < lines.length; i += 1) {
  const m = /^\s*const (draw[A-Za-z0-9_]*)\s*=\s*\(/.exec(lines[i]);
  if (!m) continue;
  // The body, by brace depth from this line.
  let depth = 0;
  let started = false;
  const body = [];
  for (let j = i; j < lines.length; j += 1) {
    for (const ch of lines[j]) {
      if (ch === "{") { depth += 1; started = true; }
      else if (ch === "}") depth -= 1;
    }
    body.push(lines[j]);
    if (started && depth <= 0) break;
  }
  draws.push({ name: m[1], line: i + 1, body: body.join("\n") });
}

console.log("--- the painter's draws ---");
ok("there are draws to check", draws.length >= 3, draws.length + " found");
for (const d of draws) {
  ok(`${d.name} accounts for the layer shift`,
     d.body.includes("curShift"),
     `evg-webgl.js:${d.line} draws without mentioning curShift`);
}

console.log("");
console.log("--- and the shaders that carry it ---");
// Both programs declare the uniform; both must have a location read for it,
// or a draw that "sets the shift" would be writing to nothing.
const shifts = (src.match(/uniform vec2 uShift;/g) || []).length;
ok("both shaders declare uShift", shifts === 2, shifts + " declarations");
ok("the batch shader's location is read", /uShift:\s*gl\.getUniformLocation/.test(src));
ok("the path shader's location is read", /pathShiftLoc:\s*gl\.getUniformLocation/.test(src));
// …and every location that is read is written somewhere, or it is decoration.
for (const loc of ["built.uShift", "built.pathShiftLoc"]) {
  const uses = src.split(`gl.uniform2f(${loc},`).length - 1;
  ok(`${loc} is set by a draw`, uses >= 1, "never passed to uniform2f");
}

console.log("");
if (failed > 0) {
  console.log(`  ${failed} check(s) failed`);
  process.exit(1);
}
console.log("  every draw in the painter moves with its layer");
// The marker `scripts/run-gallery-editor-tests.sh` greps for. The compiler
// prints `[FAIL]` and still exits 0, so that runner refuses to take a zero
// exit as a pass — a suite has to SAY it passed.
console.log("ALL PASS");
