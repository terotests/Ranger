#!/usr/bin/env node
/**
 * Build in-memory compiler filesystem for the browser playground.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rangerRoot = path.resolve(__dirname, "../..");
const outFile = path.join(rangerRoot, "playground/public/compileEnv.json");

/** @param {string} name @param {string} data */
function vfsFile(name, data) {
  return { name, data, is_folder: false, base64bin: false };
}

/** @param {string} relPath */
function readRgr(relPath) {
  const full = path.join(rangerRoot, relPath);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing library file: ${relPath}`);
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
console.log("Wrote", outFile, `(${(fs.statSync(outFile).size / 1024).toFixed(0)} KB)`);
