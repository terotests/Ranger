/**
 * repl.mjs — a scratch console for the parser.
 *
 *   node gallery/markdown/tools/repl.mjs '**bold**'
 *   node gallery/markdown/tools/repl.mjs --xml '# hi'
 *   node gallery/markdown/tools/repl.mjs --file README.md
 *
 * The compiled bundle is a classic script that declares its classes at top
 * level rather than exporting them, so it is evaluated and then asked for the
 * names — which is also what the standalone page does with it.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUNDLE = path.join(HERE, "..", "bin", "MdSpecDump.js");
const src = fs.readFileSync(BUNDLE, "utf8").replace(/__js_main\(\);?\s*$/, "");
const api = (0, eval)(src + "; ({ MdBlock, MdToHtml, MdInline, MdNode })");

const argv = process.argv.slice(2);
const xml = argv.includes("--xml");
const fileArg = argv.indexOf("--file");
let text;
if (fileArg >= 0) text = fs.readFileSync(argv[fileArg + 1], "utf8");
else text = argv.filter((a) => !a.startsWith("--"))[0] ?? "";

const doc = api.MdBlock.parseText(text);
process.stdout.write(xml ? doc.toXml() : api.MdToHtml.render(doc));
