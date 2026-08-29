/**
 * The browser, asked what CSS actually does with a box shorthand.
 *
 *   node gallery/evg/oracle/css_box_oracle.mjs
 *
 * Writes `css-box.json` beside this file. Nothing in EVG reads it at run time;
 * `EVGBoxShorthandTest.rgr` is checked against it by hand, the same way the
 * timing capture works.
 *
 * WHY THIS EXISTS. `padding: 0 16px` on the table demo's rows put nothing at
 * all on the sides. EVG parsed the whole declaration as ONE unit — the parser
 * read the leading `0` and applied it to four sides — so every two-, three-
 * and four-value box shorthand in the gallery was silently wrong, and had been
 * since the sheets were written. Nobody noticed because a padding that is too
 * small looks like a layout someone chose.
 *
 * So the questions are the ones the shorthand answers, and a few the value
 * grammar answers underneath it:
 *
 *   1. How do one, two, three and four values map onto the four sides?
 *   2. Is a bare `0` legal without a unit, and is `0px` the same thing?
 *   3. Does a negative value survive on `margin` (yes) and on `padding` (no —
 *      the whole declaration is dropped, not clamped)?
 *   4. What happens to a shorthand with a junk component, or five values?
 *   5. Do percentages resolve against the containing block's WIDTH on every
 *      side, top and bottom included?
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { requireDom, findChromium, assertDomInstalled } from "../../ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

// Each case is a declaration put on a 400x200 box inside a 400x200 parent, so
// a percentage has something definite to resolve against.
const CASES = [
  { prop: "padding", value: "10px" },
  { prop: "padding", value: "0 16px" },
  { prop: "padding", value: "1px 2px 3px" },
  { prop: "padding", value: "1px 2px 3px 4px" },
  { prop: "padding", value: "0" },
  { prop: "padding", value: "2px 10px" },
  { prop: "padding", value: "  4px   8px  " },
  { prop: "padding", value: "10%" },
  { prop: "padding", value: "-4px" },
  { prop: "padding", value: "1px 2px 3px 4px 5px" },
  { prop: "padding", value: "1px nonsense" },
  { prop: "padding", value: "1em 2em" },
  { prop: "margin", value: "10px" },
  { prop: "margin", value: "0 auto" },
  { prop: "margin", value: "-4px 8px" },
  { prop: "margin", value: "1px 2px 3px 4px" },
  { prop: "margin", value: "5%" },
];

assertDomInstalled();
const { chromium } = requireDom("playwright-core");

const html =
  `<!doctype html><meta charset="utf-8">` +
  `<style>html,body{margin:0;padding:0;font-size:16px}` +
  `#parent{width:400px;height:200px}#box{width:400px;height:200px}</style>` +
  `<div id="parent"><div id="box"></div></div>`;
const pageFile = path.join(HERE, ".box-probe.html");
fs.writeFileSync(pageFile, html);

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();
await page.goto(pathToFileURL(pageFile).href);

const results = [];
for (const c of CASES) {
  const r = await page.evaluate(({ prop, value }) => {
    const box = document.getElementById("box");
    // Clear first, so a rejected declaration reads as the initial value rather
    // than as whatever the previous case left behind. That is the whole point
    // of case 3: a dropped declaration and a zero one look identical unless
    // you start from a known state.
    box.style.cssText = "width:400px;height:200px";
    box.style.setProperty(prop, value);
    // What the style object kept is the parse result; what the computed style
    // says is the used value. Both matter — the first says whether the
    // declaration survived at all.
    const kept = box.style.getPropertyValue(prop);
    const cs = getComputedStyle(box);
    const side = (s) => cs.getPropertyValue(prop + "-" + s);
    return {
      kept,
      top: side("top"), right: side("right"), bottom: side("bottom"), left: side("left"),
    };
  }, c);
  results.push({ ...c, ...r });
}
await browser.close();
fs.rmSync(pageFile, { force: true });

const file = path.join(HERE, "css-box.json");
fs.writeFileSync(file, JSON.stringify({ cases: results }, null, 2) + "\n");
console.log("wrote " + path.relative(process.cwd(), file));
for (const r of results) {
  console.log(
    `  ${r.prop}: ${JSON.stringify(r.value).padEnd(26)} -> ` +
    `${r.top} ${r.right} ${r.bottom} ${r.left}` + (r.kept === "" ? "   (DROPPED)" : ""));
}
