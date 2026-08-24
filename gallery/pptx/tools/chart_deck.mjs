/**
 * Build the "Six chart slides" deck the playground ships, as a file.
 *
 *   node gallery/pptx/tools/chart_deck.mjs [out.pptx]
 *
 * WHY IT IS BUILT AND NOT CHECKED IN. It is not a file — it is a preset, a
 * page of JavaScript in `playground.mjs` that calls the published API. A
 * .pptx committed beside it would be a copy that drifts the first time the
 * preset changes, and then the benchmarks and the equivalence test would be
 * measuring a deck the playground no longer produces. Reading the preset out
 * of the page keeps them the same deck by construction, and proves the preset
 * still runs outside a browser.
 *
 * This is the deck the scene-bridge work is about: one of its slides is 10 084
 * display-list commands, where the fixtures are a few hundred.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as JsApi from "../api/js/index.mjs";
import * as ChartApi from "../api/js/chart.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(HERE, "../web/playground/playground.mjs");

/** The preset's source, lifted out of the page's `PRESETS` table. */
export function presetSource(name = "Six chart slides") {
  const page = fs.readFileSync(PAGE, "utf8");
  const at = page.indexOf(`"${name}": \``);
  if (at < 0) throw new Error(`the playground has no "${name}" preset any more`);
  const from = page.indexOf("`", at) + 1;
  let to = from;
  while (to < page.length) {           // the first unescaped backtick ends it
    if (page[to] === "\\") { to += 2; continue; }
    if (page[to] === "`") break;
    to++;
  }
  return page.slice(from, to).replace(/\\([`$\\])/g, "$1");
}

/** The deck, as bytes. */
export function chartDeck(name = "Six chart slides") {
  const fn = new Function("Pptx", "Renderer", "Chart", '"use strict";\n' + presetSource(name));
  // The page binds `Chart` to a factory over its own wrapper; the published
  // package exports the class. Same object either way, one `new` apart.
  return fn(JsApi.Pptx, null, () => new ChartApi.Chart()).save();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = process.argv[2] || path.join(HERE, "../bin/chart_deck.pptx");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const bytes = chartDeck();
  fs.writeFileSync(out, bytes);
  console.log(`${out}  ${bytes.length.toLocaleString()} bytes`);
}
