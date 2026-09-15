#!/usr/bin/env node
/**
 * In-memory compiler filesystem for the CodeGraph page.
 * Same recipe as playground/scripts/build-compiler-env.mjs: Lang.rgr at /
 * and lib/*.rgr under /lib/, with RANGER_LIB=/;/lib/.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rangerRoot = path.resolve(__dirname, "../../../..");
const outFile = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, "dist/compileEnv.json");

function vfsFile(name, data) {
  return { name, data, is_folder: false, base64bin: false };
}

function readRgr(relPath) {
  const full = path.join(rangerRoot, relPath);
  if (!fs.existsSync(full)) {
    throw new Error("Missing library file: " + relPath);
  }
  return fs.readFileSync(full, "utf8");
}

const libFiles = [
  "stdlib.rgr",
  "stdops.rgr",
  "RangerProcess.rgr",
  "Timers.rgr",
  "JSON.rgr",
];

const env = {
  use_real: false,
  envVars: {
    RANGER_LIB: "/;/lib/",
  },
  commandLine: {
    flags: {},
    params: {},
    values: [],
  },
  filesystem: {
    name: "",
    data: "",
    is_folder: true,
    base64bin: false,
    folders: [
      {
        name: "lib",
        data: "",
        is_folder: true,
        base64bin: false,
        folders: [],
        files: libFiles.map((name) => vfsFile(name, readRgr(path.join("lib", name)))),
      },
    ],
    files: [vfsFile("Lang.rgr", readRgr("compiler/Lang.rgr"))],
  },
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(env));
const kb = (fs.statSync(outFile).size / 1024).toFixed(0);
console.log("  compileEnv.json " + kb + " KB");
