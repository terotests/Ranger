#!/usr/bin/env node
/**
 * Build the live responsive-layout page.
 *
 *   node gallery/evg/web/responsive/build.mjs
 *   node gallery/evg/web/responsive/build.mjs --out path/to/evg/responsive
 *
 * Compiles `EvgResponsiveDemo.rgr` — which is EVGElement, EVGStyleSheet,
 * EVGLayout, EVGTextEngine and EVGDisplayList, the whole engine — to a browser
 * IIFE, and copies the page and the SVG painter beside it. Nothing about the
 * layout is precomputed here: the compiled engine runs in the browser, at the
 * width the window happens to be.
 *
 * The showcase build calls the same steps for /evg/responsive/ on Pages.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../../..");
const argv = process.argv.slice(2);
const outFlag = argv.indexOf("--out");
const OUT = outFlag >= 0 ? path.resolve(argv[outFlag + 1]) : path.join(HERE, "dist");
const STAGE = path.join(HERE, ".stage");

fs.mkdirSync(STAGE, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const env = { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" };

const log = execFileSync(
  process.execPath,
  [
    "bin/output.js",
    "-es6",
    "gallery/evg/web/responsive/EvgResponsiveDemo.rgr",
    `-d=${path.relative(ROOT, STAGE)}`,
    "-o=evg_responsive_demo.js",
    "-nodecli",
  ],
  { cwd: ROOT, env, encoding: "utf8" }
);

if (log.includes("Compilation FAILED")) {
  process.stderr.write(log + "\n");
  process.exit(1);
}

const rawPath = path.join(STAGE, "evg_responsive_demo.js");
if (!fs.existsSync(rawPath)) {
  process.stderr.write("compiler wrote no " + rawPath + "\n");
  process.exit(1);
}

const bundle = fs.readFileSync(rawPath, "utf8").replace(/^#![^\n]*\n/, "");

// Load it here, with `require` hidden, exactly as the browser will: the
// generated file asks for Node's modules when it can see them, and a bundle
// that only fails once it is in a browser fails somewhere nobody is watching.
{
  const previous = globalThis.require;
  globalThis.require = undefined;
  const found = (0, eval)(bundle + "; typeof EvgResponsiveDemo + '|' + typeof EVGLayout + '|' + typeof EVGHostTextMeasurer");
  globalThis.require = previous;
  if (found !== "function|function|function") {
    throw new Error("evg_responsive_demo.js missing browser exports (got " + found + ")");
  }
}

const scoped =
  "// GENERATED from gallery/evg/web/responsive/EvgResponsiveDemo.rgr — do not edit.\n" +
  "(function () {\n" +
  bundle +
  "\n;globalThis.EvgResponsiveDemo = EvgResponsiveDemo;" +
  // What the browser's text measurer needs off the module (evg-measure.js).
  "\n;globalThis.EvgResponsiveModule = { EVGHostTextMeasurer: EVGHostTextMeasurer, EVGDefaultMeasurer: EVGDefaultMeasurer };" +
  "\n})();\n";

fs.writeFileSync(path.join(OUT, "evg_responsive_demo.js"), scoped);
fs.copyFileSync(path.join(HERE, "index.html"), path.join(OUT, "index.html"));
// The painter, copied rather than imported across directories, so the built
// page is a directory of four files that can be served from anywhere.
fs.copyFileSync(path.join(ROOT, "gallery/evg/html/evg-html.js"), path.join(OUT, "evg-html.js"));
fs.copyFileSync(path.join(ROOT, "gallery/evg/gl/evg-measure.js"), path.join(OUT, "evg-measure.js"));
fs.copyFileSync(path.join(ROOT, "gallery/evg/html/evg-dom.js"), path.join(OUT, "evg-dom.js"));

fs.rmSync(STAGE, { recursive: true, force: true });
process.stdout.write("Wrote responsive page to " + path.relative(ROOT, OUT) + "\n");
