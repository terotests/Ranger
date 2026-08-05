#!/usr/bin/env node
// The es6 engine build behind the SAME command line the native runners take
// (`runner <dir> <file.js>`), so one harness can measure both targets and any
// difference between them is the target, not the harness.
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..", "..", "..");
const MODULE = path.join(ROOT, "gallery", "game_engine", "v2", "interp", "bin", "engine_module.cjs");

const dir = process.argv[2];
const file = process.argv[3];
if (!dir || !file) {
  console.log("usage: es6_runner <dir> <file.js>");
  process.exit(0);
}

const { ComponentEngine, EvalValue } = require(MODULE);
const src = fs.readFileSync(path.join(dir, file), "utf8");

// The native runner prefixes engine-side logging with [tsx]; match it so the
// harness sees identical output from both targets.
const e = new ComponentEngine();
e.quiet = true;
e.liveClock = true;
e.maxLoopIterations = 1000000000;
try {
  e.loadScript(src + "\nfunction __zoo_done__() { return 'done'; }\n");
  e.callFunction("__zoo_done__", EvalValue.null());
} catch (ex) {
  console.log("Uncaught exception: " + (ex && ex.message ? ex.message : String(ex)));
}
