#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// InputCtl's pointer and word rules, against what a real <input> did.
//
//   node gallery/ui/conformance/oracle/pointer_check.mjs
//
// The keyboard half of the text field has nine conformance specs behind it.
// The pointer half had none — which is exactly why it was the half that got
// written and never wired: there was nothing to fail. This is that gate.
//
// WHAT IS COMPARED AND WHAT IS NOT. Every expectation here is an INDEX, read
// out of `pointer.json` at run time. Pixel positions are not compared and
// cannot be: the oracle measured a browser's monospace font and this side
// measures its own, so a shared x would be comparing two font stacks and
// calling it a caret bug. The one pixel-flavoured rule that IS testable — a
// click snaps to the NEARER character boundary — is checked against this
// side's own measurement, since "nearer" is a property of the rule and not of
// the font.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require1 = createRequire(import.meta.url);
const H = require1(path.join(HERE, "..", "..", "bin", "ui_host.cjs"));
const oracle = JSON.parse(fs.readFileSync(path.join(HERE, "pointer.json"), "utf8"));

const V = oracle.value;
const mk = () => {
  const c = new H.InputCtl();
  c.tid = "f";
  c.value = V;
  c.caret = 0;
  c.anchor = 0;
  c.build();
  return c;
};
// A measurer that owns no tree, the same one FormDemo uses to place a caret.
const eng = new H.EVGLayout().getTextEngine();

let pass = 0;
let fail = 0;
const check = (what, got, want) => {
  const ok = String(got) === String(want);
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"} ${what}: ${got}${ok ? "" : "   want " + want}`);
};

console.log(`value ${JSON.stringify(V)}`);

// --- 1. word motion, over punctuation ---------------------------------------
console.log("Ctrl+ArrowRight, eight times from 0");
{
  const c = mk();
  const seen = [];
  let at = 0;
  for (let i = 0; i < oracle.wordMotion.ctrlArrowRight.length; i++) {
    at = c.wordRight(at);
    seen.push(at);
  }
  check("where it stops", seen.join(","), oracle.wordMotion.ctrlArrowRight.join(","));
  // Said out loud because it is the whole point: it must stop BEFORE the
  // comma and then cross it on its own. A rule that only knows "space or not"
  // runs "beta,gamma" together and lands on 17 where the browser lands on 11.
  const comma = V.indexOf(",");
  check("it stops at the comma", seen.includes(comma), true);
  check("and crosses it alone", seen.includes(comma + 1), true);
}
console.log("and backwards");
{
  const c = mk();
  // Mirror the same trail: from the end, wordLeft must retrace the stops that
  // are run STARTS. Read off the value rather than the oracle, which only
  // captured the forward direction — stated as arithmetic, not as measurement.
  check("wordLeft from the end", c.wordLeft(V.length), V.lastIndexOf(" ") + 1);
  check("wordLeft from inside a word", c.wordLeft(V.indexOf("gamma") + 2), V.indexOf("gamma"));
  check("wordLeft off the comma", c.wordLeft(V.indexOf(",") + 1), V.indexOf(","));
}

// --- 2. double-click ---------------------------------------------------------
console.log("double-click takes the run under the pointer");
for (const d of oracle.doubleClick) {
  const c = mk();
  c.selectWordAt(d.overChar);
  check(
    `on ${d.overChar} (${d.char}) -> ${JSON.stringify(d.took)}`,
    `${c.selStart()},${c.selEnd()}`,
    `${d.selStart},${d.selEnd}`,
  );
}

// --- 3. the click rule -------------------------------------------------------
// Not a pixel comparison: the x values come from THIS side's measurer, and
// what is asserted is that a point a quarter of the way across a character
// resolves to that character's left boundary and three quarters to its right.
console.log("a click snaps to the nearer boundary");
{
  const c = mk();
  const xOf = (i) => c.caretXAt(eng, i);
  let bad = 0;
  for (let i = 0; i < V.length; i++) {
    const a = xOf(i);
    const b = xOf(i + 1);
    if (b - a < 1.5) continue; // too narrow for a quarter to be unambiguous
    const near = c.indexAtX(eng, a + (b - a) * 0.25);
    const far = c.indexAtX(eng, a + (b - a) * 0.75);
    if (near !== i || far !== i + 1) {
      bad++;
      if (bad < 4) console.log(`       char ${i}: 25%->${near} 75%->${far} want ${i}/${i + 1}`);
    }
  }
  check(`every character of ${V.length} snaps both ways`, bad, 0);
  // The oracle's own rows say the same thing in the browser's numbers.
  const rule = oracle.click.every((r) =>
    r.acrossGlyph === 0.25 ? r.selStart === r.overChar : r.selStart === r.overChar + 1);
  check("and that is the rule the browser showed", rule, true);
}

// --- 4. drag and Shift+click -------------------------------------------------
// `moveTo(i, extend)` is the whole of both: a press is extend=false, a drag
// and a Shift+click are extend=true. What is checked is that the ANCHOR
// survives, including when the drag runs backwards — an implementation that
// sorts its two indices loses the direction and reports it as forward.
console.log("drag keeps its anchor");
{
  const fwd = oracle.dragEnd;
  const c = mk();
  c.moveTo(fwd[0], false);
  c.moveTo(fwd[1], true);
  check("forwards", `${c.selStart()},${c.selEnd()}`, `${fwd[0]},${fwd[1]}`);
  check("  anchor stayed at the press", c.anchor, fwd[0]);

  const back = oracle.dragBackwards;
  const d = mk();
  // The browser reports [start,end] plus a direction; backwards means the
  // anchor is the END of the reported range.
  check("the browser called it", back[2], "backward");
  d.moveTo(back[1], false);
  d.moveTo(back[0], true);
  check("backwards", `${d.selStart()},${d.selEnd()}`, `${back[0]},${back[1]}`);
  check("  anchor stayed at the press", d.anchor, back[1]);
}
console.log("a drag out of the box clamps rather than collapsing");
{
  const r = oracle.dragOutsideRight;
  const c = mk();
  c.moveTo(r[0], false);
  // Far past the right edge: `indexAtX` must clamp to the end, which is what
  // makes a drag that leaves the field keep selecting to it.
  c.moveTo(c.indexAtX(eng, 99999), true);
  check("to the right", `${c.selStart()},${c.selEnd()}`, `${r[0]},${r[1]}`);
  const l = oracle.dragOutsideLeft;
  const d = mk();
  d.moveTo(l[1], false);
  d.moveTo(d.indexAtX(eng, -99999), true);
  check("to the left", `${d.selStart()},${d.selEnd()}`, `${l[0]},${l[1]}`);
}
console.log("Shift+click extends from where the caret already was");
{
  const s = oracle.shiftClick;
  const c = mk();
  c.moveTo(s[0], false);
  c.moveTo(s[1], true);
  check("range", `${c.selStart()},${c.selEnd()}`, `${s[0]},${s[1]}`);
}
console.log("triple-click takes everything");
{
  const c = mk();
  c.selectAll();
  check("range", `${c.selStart()},${c.selEnd()}`, `${oracle.tripleClick[0]},${oracle.tripleClick[1]}`);
}

const total = pass + fail;
console.log("");
console.log(`parity: ${pass}/${total} pointer and word behaviours match a real <input>`);
console.log(fail ? `\nRESULT FAIL — failed=${fail}` : "\nRESULT OK — failed=0");
process.exitCode = fail ? 1 : 0;
