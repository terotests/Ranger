// SPDX-License-Identifier: AGPL-3.0-or-later
// Runs one script file through CEr compiled to JavaScript (bin/Cer.cjs), in
// a process of its own so the benchmarks can give it a time and memory limit.
const fs = require("fs");
const path = require("path");
const mod = require(path.join(__dirname, "../bin/Cer.cjs"));
const e = mod.Engine.new_();
const r = e.eval(fs.readFileSync(process.argv[2], "utf8"));
const n = e.output_count();
for (let i = 0; i < n; i++) process.stdout.write(e.output_at(i) + "\n");
if (e.error) process.stdout.write(r + "\n");
