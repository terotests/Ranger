// SPDX-License-Identifier: AGPL-3.0-or-later
// Runs one script file through ComponentEngine (the es6 build), in a
// process of its own so the benchmarks can give it a time limit.
const fs = require("fs");
const path = require("path");
const mod = require(path.join(__dirname, "../../interp/bin/engine_module.cjs"));
const src = fs.readFileSync(process.argv[2], "utf8");
const log = (...a) => process.stdout.write(a.map(String).join(" ").replace(/^\[tsx\]\s*/, "") + "\n");
console.log = log;
console.warn = log;
console.error = log;
const e = new mod.ComponentEngine();
e.quiet = true;
e.liveClock = true;
e.maxLoopIterations = 1000000000;
e.loadScript(src + "\nfunction __done__() { return 1; }\n");
e.callFunction("__done__", (mod.EvHandle || mod.EvalValue).null());
