#!/usr/bin/env node
/**
 * Build the live Erazer page.
 *
 *   node gallery/erazer/web/build.mjs
 *   node gallery/erazer/web/build.mjs --out path/to/evg/erazer
 *
 * Compiles ErazerPaint (the engine plus the synthetic UI fixtures) to a
 * browser IIFE and copies the HTML beside it.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
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
    "gallery/erazer/ErazerPaint.rgr",
    `-d=${path.relative(ROOT, STAGE)}`,
    "-o=erazer.js",
    "-nodecli",
  ],
  { cwd: ROOT, env, encoding: "utf8" }
);

if (log.includes("Compilation FAILED")) {
  process.stderr.write(log + "\n");
  process.exit(1);
}

const rawPath = path.join(STAGE, "erazer.js");
if (!fs.existsSync(rawPath)) {
  process.stderr.write("compiler wrote no " + rawPath + "\n");
  process.exit(1);
}

let bundle = fs.readFileSync(rawPath, "utf8").replace(/^#![^\n]*\n/, "");

{
  const previous = globalThis.require;
  globalThis.require = undefined;
  const found = (0, eval)(
    bundle + "; typeof Erazer + '|' + typeof ErazerPaint + '|' + typeof ImageBuffer + '|' + typeof ErazerLayoutNet + '|' + typeof ErazerLayoutBox"
  );
  globalThis.require = previous;
  if (found !== "function|function|function|function|function") {
    throw new Error("erazer.js missing browser exports (got " + found + ")");
  }
}

const scoped =
  "// GENERATED from gallery/erazer/Erazer.rgr — do not edit.\n" +
  "(function () {\n" +
  bundle +
  "\n;globalThis.Erazer = Erazer;" +
  "\n;globalThis.ErazerPaint = ErazerPaint;" +
  "\n;globalThis.ErazerFont = ErazerFont;" +
  "\n;globalThis.ErazerOptions = ErazerOptions;" +
  "\n;globalThis.ErazerLayoutNet = ErazerLayoutNet;" +
  "\n;globalThis.ErazerLayoutBox = ErazerLayoutBox;" +
  "\n;globalThis.ErazerLayoutFeat = ErazerLayoutFeat;" +
  "\n;globalThis.ImageBuffer = ImageBuffer;" +
  "\n})();\n";

fs.writeFileSync(path.join(OUT, "erazer.js"), scoped);
fs.copyFileSync(path.join(HERE, "index.html"), path.join(OUT, "index.html"));
fs.copyFileSync(path.join(HERE, "components.html"), path.join(OUT, "components.html"));
fs.copyFileSync(path.join(HERE, "shadcn.html"), path.join(OUT, "shadcn.html"));
const shots = path.join(HERE, "../shots");
if (fs.existsSync(shots)) {
  for (const f of fs.readdirSync(shots)) {
    if (f.endsWith(".png")) fs.copyFileSync(path.join(shots, f), path.join(OUT, f));
  }
}
fs.rmSync(STAGE, { recursive: true, force: true });
process.stdout.write("Wrote Erazer page to " + path.relative(ROOT, OUT) + "\n");
