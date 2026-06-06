#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const galleryDir = path.resolve(__dirname, "..");
const rangerRoot = path.resolve(galleryDir, "../..");
const outDir = path.join(galleryDir, "generated");
const binDir = path.join(galleryDir, "bin");
const compiler = path.join(rangerRoot, "bin", "output.js");

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(binDir, { recursive: true });

if (!fs.existsSync(compiler)) {
  console.error("Missing Ranger compiler:", compiler);
  process.exit(1);
}

const env = {
  ...process.env,
  RANGER_LIB:
    path.join(rangerRoot, "compiler", "Lang.rgr") +
    ";" +
    path.join(rangerRoot, "lib", "stdops.rgr"),
};

function compile(sourceRel, outName, opts = {}) {
  const outDirRel = path.relative(rangerRoot, outDir).split(path.sep).join("/");
  const baseFlags = opts.noEsm
    ? ["-es6", "-nodecli"]
    : ["-es6", "-esm", "-nodemodule"];
  const cmd = [
    "node",
    JSON.stringify(compiler),
    ...baseFlags,
    sourceRel,
    `-d=./${outDirRel}`,
    `-o=${outName}`,
  ].join(" ");
  console.log("Ranger compile:", cmd);
  execSync(cmd, { cwd: rangerRoot, env, stdio: "inherit" });
}

const libRel = path
  .relative(rangerRoot, path.join(galleryDir, "ranger/WatchEvgLib.rgr"))
  .split(path.sep)
  .join("/");
const testRel = path.relative(rangerRoot, path.join(galleryDir, "watch_evg_test.rgr")).split(path.sep).join("/");

compile(libRel, "watch_evg.js");
compile(testRel, "watch_evg_test.js", { noEsm: true });

fs.copyFileSync(path.join(outDir, "watch_evg_test.js"), path.join(binDir, "watch_evg_test.js"));

console.log("Wrote", path.join(outDir, "watch_evg.js"));
