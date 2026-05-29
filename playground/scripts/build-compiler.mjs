#!/usr/bin/env node
/**
 * Build browser VirtualCompiler bundle + in-memory library env.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rangerRoot = path.resolve(__dirname, "../..");
const compiler = path.join(rangerRoot, "bin/output.js");
const outDir = path.join(rangerRoot, "playground/public");

if (!fs.existsSync(compiler)) {
  console.error("bin/output.js not found — run `npm run compile` in the repo root first.");
  process.exit(1);
}

const env = {
  ...process.env,
  RANGER_LIB: `${path.join(rangerRoot, "compiler/Lang.rgr")};${path.join(rangerRoot, "lib/stdops.rgr")}`,
};

const outDirArg = `./${path.relative(rangerRoot, outDir).split(path.sep).join("/")}`;
// Do not pass -client: it injects RangerAppService and currently corrupts the
// next operator class line in ES6 output (classRangerAppServiceclass operatorsOf).
const cmd = [
  "node",
  JSON.stringify(compiler),
  "-es6",
  "./compiler/VirtualCompiler.rgr",
  `-d=${outDirArg}`,
  "-o=ranger-compiler.js",
].join(" ");

console.log("Compiling browser VirtualCompiler…");
execSync(cmd, { cwd: rangerRoot, env, stdio: "inherit" });
const outJs = path.join(outDir, "ranger-compiler.js");
const bundle = fs.readFileSync(outJs, "utf8");
if (/classRangerAppServiceclass/.test(bundle)) {
  console.error("Invalid browser bundle (client-service class merge bug).");
  process.exit(1);
}
console.log("Wrote", outJs);
