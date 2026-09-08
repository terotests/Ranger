#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// What the two builds cost, per target.
//
//   npm run firesim:size
//
// The second-priority ask on this module was whether it is light enough for a
// watch — Wear OS or watchOS. The honest answer is a number, not an opinion,
// so this prints one: the generated source for the CLIENT build (what an app
// carries) beside the WHOLE SIMULATOR (what a development build carries when
// the backend runs in-process).

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..", "..", "..");
const TARGETS = process.argv.slice(2).length ? process.argv.slice(2) : ["kotlin", "swift6", "es6"];
const ENTRIES = [
  ["FsClient.rgr", "client"],
  ["FsSimBridge.rgr", "whole simulator"],
];

// The compiler resolves `-d` against its working directory, so the scratch
// directory is one inside the repository rather than /tmp.
const REL = ".firesim-build";
const tmp = path.join(REPO, REL);
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
const rows = [];
for (const [entry, label] of ENTRIES) {
  for (const target of TARGETS) {
    execFileSync(
      process.execPath,
      [path.join(REPO, "bin", "output.js"), `-l=${target}`, path.join(REPO, "gallery", "firesim", "src", entry), `-d=${REL}`, `-o=out.${target}`],
      { cwd: REPO, env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" }, stdio: "ignore" },
    );
    // The compiler names the file by target; find whatever it wrote.
    const written = fs
      .readdirSync(tmp)
      .filter((f) => f.startsWith(`out.${target}`))
      .map((f) => path.join(tmp, f));
    const bytes = written.reduce((sum, f) => sum + fs.statSync(f).size, 0);
    const lines = written.reduce((sum, f) => sum + fs.readFileSync(f, "utf8").split("\n").length, 0);
    rows.push({ build: label, target, bytes, lines });
    for (const f of written) fs.rmSync(f);
  }
}
fs.rmSync(tmp, { recursive: true, force: true });

const kb = (n) => `${(n / 1024).toFixed(0)} kB`;
process.stdout.write("\n  build             target     generated source\n");
process.stdout.write("  ─────────────────────────────────────────────────\n");
for (const r of rows) {
  process.stdout.write(`  ${r.build.padEnd(17)} ${r.target.padEnd(10)} ${kb(r.bytes).padStart(7)}  ${String(r.lines).padStart(6)} lines\n`);
}
process.stdout.write("\n  The client build is what an app carries. It has no rules parser, no\n");
process.stdout.write("  routing table and no model in it — those live behind the transport.\n\n");
