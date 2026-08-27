#!/usr/bin/env node
/**
 * Build the live bitmap-tracer page.
 *
 *   node gallery/evg/web/tracer/build.mjs
 *   node gallery/evg/web/tracer/build.mjs --out path/to/evg/tracer
 *
 * Compiles EvgBitmapTracer to a browser IIFE (no require) and copies the HTML
 * + sample image beside it. The EVG showcase build calls the same steps for
 * /evg/tracer/ on GitHub Pages.
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

const env = {
  ...process.env,
  RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr",
};

const log = execFileSync(
  process.execPath,
  [
    "bin/output.js",
    "-es6",
    "gallery/evg/EvgBitmapTracer.rgr",
    `-d=${path.relative(ROOT, STAGE)}`,
    "-o=evg_bitmap_tracer.js",
    "-nodecli",
  ],
  { cwd: ROOT, env, encoding: "utf8" }
);

if (log.includes("Compilation FAILED")) {
  process.stderr.write(log + "\n");
  process.exit(1);
}

const rawPath = path.join(STAGE, "evg_bitmap_tracer.js");
if (!fs.existsSync(rawPath)) {
  process.stderr.write("compiler wrote no " + rawPath + "\n");
  process.exit(1);
}

let bundle = fs.readFileSync(rawPath, "utf8").replace(/^#![^\n]*\n/, "");

{
  const previous = globalThis.require;
  globalThis.require = undefined;
  const found = (0, eval)(
    bundle + "; typeof EvgBitmapTracer + '|' + typeof ImageBuffer + '|' + typeof EvgTraceOptions"
  );
  globalThis.require = previous;
  if (found !== "function|function|function") {
    throw new Error(
      "evg_bitmap_tracer.js missing browser exports (got " + found + ")"
    );
  }
}

const scoped =
  "// GENERATED from gallery/evg/EvgBitmapTracer.rgr — do not edit.\n" +
  "(function () {\n" +
  bundle +
  "\n;globalThis.EvgBitmapTracer = EvgBitmapTracer;" +
  "\n;globalThis.EvgTraceOptions = EvgTraceOptions;" +
  "\n;globalThis.EvgTraceLayer = EvgTraceLayer;" +
  "\n;globalThis.ImageBuffer = ImageBuffer;" +
  "\n})();\n";

fs.writeFileSync(path.join(OUT, "evg_bitmap_tracer.js"), scoped);
fs.copyFileSync(path.join(HERE, "index.html"), path.join(OUT, "index.html"));
fs.copyFileSync(path.join(HERE, "sample.png"), path.join(OUT, "sample.png"));

fs.rmSync(STAGE, { recursive: true, force: true });
process.stdout.write("Wrote tracer page to " + path.relative(ROOT, OUT) + "\n");
