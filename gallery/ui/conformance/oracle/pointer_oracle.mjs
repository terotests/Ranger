/**
 * What a pointer does to a real <input type="text">.
 *
 *   node gallery/ui/conformance/oracle/pointer_oracle.mjs
 *
 * Writes `pointer.json` beside this file.
 *
 * The keyboard half of the text field has nine conformance specs behind it.
 * The POINTER half has none, and that is why it is the half that was written
 * and never wired: there was nothing to fail. A click, a drag and a
 * double-click are three rules, and only one of them is obvious.
 *
 * The measurement is done in CHARACTER terms, not pixels: the probe asks the
 * browser for the x of a character boundary (by measuring the substring in a
 * canvas with the field's own resolved font), clicks there, and reads back
 * `selectionStart`/`selectionEnd`. So the answers are about the RULE — which
 * character a click lands on, what a double-click takes — and do not depend on
 * this machine's font rendering.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertDomInstalled, findChromium, requireDom } from "../dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

// Two spaces between alpha and beta, a comma inside a word, and a trailing
// run of spaces: the three shapes that separate "a word" from "a run of
// non-space characters" and from "whatever is between two spaces".
const VALUE = "alpha  beta,gamma delta";

const PAGE = `<!doctype html><meta charset="utf-8">
<style>
  body { margin: 0; font: 16px system-ui; }
  #f { position: absolute; left: 40px; top: 40px; width: 500px; font: 16px monospace;
       padding: 0; border: 1px solid #888; }
</style>
<input id="f" value="${VALUE}">
<script>
window.__x = (i) => {
  const f = document.getElementById("f");
  const cs = getComputedStyle(f);
  const c = document.createElement("canvas").getContext("2d");
  c.font = cs.font;
  const r = f.getBoundingClientRect();
  const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth);
  return r.left + pad + c.measureText(f.value.slice(0, i)).width;
};
window.__y = () => {
  const r = document.getElementById("f").getBoundingClientRect();
  return r.top + r.height / 2;
};
window.__sel = () => {
  const f = document.getElementById("f");
  return [f.selectionStart, f.selectionEnd, f.selectionDirection];
};
window.__READY__ = true;
</script>`;

assertDomInstalled();
const { chromium } = requireDom("playwright-core");

const file = path.join(HERE, ".pointer-probe.html");
fs.writeFileSync(file, PAGE);
const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();
await page.goto(pathToFileURL(file).href);
await page.waitForFunction("window.__READY__ === true");

const xOf = (i) => page.evaluate((n) => window.__x(n), i);
const y = await page.evaluate(() => window.__y());
const sel = () => page.evaluate(() => window.__sel());
/**
 * A point INSIDE character i, at the given fraction across it.
 *
 * Never 0.5. The first version of this probe clicked the exact midpoint and
 * got 3->4, 5->6, 6->6, 12->12 back — which reads as a rule and is not one:
 * the midpoint is the tie in "snap to the nearer boundary", and which way a
 * tie falls depends on sub-pixel differences between the canvas measurement
 * used to find the point and the input's own layout. Those numbers were
 * measurement noise wearing the costume of an answer. A quarter and a
 * three-quarter are unambiguous, and the pair of them states the rule.
 */
const atFrac = async (i, f) => {
  const a = await xOf(i);
  const b = await xOf(i + 1);
  return a + (b - a) * f;
};

const out = { value: VALUE, chars: VALUE.length };

// --- 1. a click lands on the nearer boundary
out.click = [];
for (const i of [0, 3, 5, 6, 11, 12, 17, VALUE.length - 1]) {
  for (const f of [0.25, 0.75]) {
    await page.mouse.click(await atFrac(i, f), y);
    await page.waitForTimeout(30);
    const s = await sel();
    out.click.push({
      overChar: i, char: VALUE[i] === " " ? "<space>" : VALUE[i],
      acrossGlyph: f, selStart: s[0], selEnd: s[1],
    });
  }
}
// Past the right end, and before the left.
await page.mouse.click((await xOf(VALUE.length)) + 60, y);
out.clickPastEnd = await sel();
await page.mouse.click((await xOf(0)) - 20, y);
out.clickBeforeStart = await sel();

// --- 2. a drag selects, and the anchor stays where the press was
{
  const from = await atFrac(2, 0.25);
  const to = await atFrac(9, 0.25);
  await page.mouse.move(from, y);
  await page.mouse.down();
  await page.mouse.move(to, y, { steps: 5 });
  await page.waitForTimeout(30);
  out.dragMidway = await sel();
  await page.mouse.up();
  out.dragEnd = await sel();
}
// Dragging BACKWARDS, which is where an implementation that sorts its two
// indices loses the direction.
{
  const from = await atFrac(12, 0.25);
  const to = await atFrac(4, 0.25);
  await page.mouse.move(from, y);
  await page.mouse.down();
  await page.mouse.move(to, y, { steps: 5 });
  await page.mouse.up();
  out.dragBackwards = await sel();
}
// And a drag that leaves the field entirely: does the selection keep up?
{
  // Horizontally out of the field only. An earlier version also moved 200px
  // DOWN and read back a collapsed [23,23], which is not "a drag that leaves
  // the box" — it is a second question (what a single-line field does when
  // the pointer leaves it vertically) answered by accident and recorded as if
  // it were the first.
  const from = await atFrac(3, 0.25);
  await page.mouse.move(from, y);
  await page.mouse.down();
  await page.mouse.move((await xOf(VALUE.length)) + 300, y, { steps: 5 });
  await page.waitForTimeout(30);
  out.dragOutsideRight = await sel();
  await page.mouse.move((await xOf(0)) - 300, y, { steps: 5 });
  await page.waitForTimeout(30);
  out.dragOutsideLeft = await sel();
  await page.mouse.up();
}

// --- 3. Shift+click extends from the existing caret
{
  await page.mouse.click(await atFrac(2, 0.25), y);
  await page.keyboard.down("Shift");
  await page.mouse.click(await atFrac(10, 0.25), y);
  await page.keyboard.up("Shift");
  out.shiftClick = await sel();
}

// --- 4. double-click, which is the one with a surprise in it
out.doubleClick = [];
for (const i of [2, 5, 6, 10, 11, 12, 16, 17, 22]) {
  await page.mouse.click(await atFrac(i, 0.25), y, { clickCount: 2 });
  await page.waitForTimeout(40);
  const s = await sel();
  out.doubleClick.push({
    overChar: i,
    char: VALUE[i] === " " ? "<space>" : VALUE[i],
    selStart: s[0],
    selEnd: s[1],
    took: VALUE.slice(s[0], s[1]),
  });
}
// --- 5. and the KEYBOARD's word motion, over the same punctuation.
//
// Not the same question as double-click, and worth asking separately: the
// existing Ctrl+Arrow specs use "alpha  beta gamma", which has no punctuation
// in it, so whichever rule Ctrl+Arrow follows they cannot tell the two apart.
{
  const walk = async (key, ctrl) => {
    await page.evaluate(() => {
      const f = document.getElementById("f");
      f.focus();
      f.setSelectionRange(0, 0);
    });
    const seen = [];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press(ctrl + "+" + key);
      await page.waitForTimeout(20);
      seen.push((await sel())[0]);
    }
    return seen;
  };
  out.wordMotion = {
    ctrlArrowRight: await walk("ArrowRight", "Control"),
    $comment:
      "Where Ctrl+ArrowRight stops, from 0, eight times. If it stops at the " +
      "comma the keyboard shares double-click's three-class rule; if it " +
      "steps over it, word motion and word selection are different rules and " +
      "wordLeft/wordRight are right as they stand.",
  };
}

// Triple, for completeness.
await page.mouse.click(await atFrac(6, 0.25), y, { clickCount: 3 });
out.tripleClick = await sel();

await browser.close();
fs.rmSync(file, { force: true });

fs.writeFileSync(
  path.join(HERE, "pointer.json"),
  JSON.stringify(out, null, 2) + "\n",
);
console.log("wrote gallery/ui/conformance/oracle/pointer.json");
console.log("value: " + JSON.stringify(VALUE));
console.log("click  :", out.click.map((c) => `${c.overChar}@${c.acrossGlyph}->${c.selStart}`).join(" "));
console.log("dbl    :", out.doubleClick.map((d) => `${d.overChar}(${d.char})->[${d.selStart},${d.selEnd}] ${JSON.stringify(d.took)}`).join("  "));
console.log("drag   :", JSON.stringify(out.dragEnd), "backwards", JSON.stringify(out.dragBackwards));
console.log("outside:", JSON.stringify(out.dragOutsideRight), "left", JSON.stringify(out.dragOutsideLeft));
console.log("shift  :", JSON.stringify(out.shiftClick), " triple", JSON.stringify(out.tripleClick));
console.log("ctrl-> :", out.wordMotion.ctrlArrowRight.join(" "), " over", JSON.stringify(VALUE));
