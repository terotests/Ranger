#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const galleryDir = path.resolve(__dirname, "..");
const rangerRoot = path.resolve(galleryDir, "../..");
const outDir = path.join(galleryDir, "generated");
const sourceRel = path.relative(
  rangerRoot,
  path.join(galleryDir, "ranger", "counter_board.rgr")
);
const outDirRel = path.relative(rangerRoot, outDir).split(path.sep).join("/");
const compiler = path.join(rangerRoot, "bin", "output.js");

fs.mkdirSync(outDir, { recursive: true });

const env = {
  ...process.env,
  RANGER_LIB:
    path.join(rangerRoot, "compiler", "Lang.rgr") +
    ";" +
    path.join(rangerRoot, "lib", "stdops.rgr"),
};

const cmd = [
  "node",
  JSON.stringify(compiler),
  "-l=swift6",
  sourceRel,
  `-d=./${outDirRel}`,
  "-o=counter_board.swift",
].join(" ");

console.log("Ranger compile (Swift6):", cmd);
execSync(cmd, { cwd: rangerRoot, env, stdio: "inherit" });
console.log("Wrote", path.join(outDir, "counter_board.swift"));
