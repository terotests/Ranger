#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Does the simulator compile everywhere the app it simulates for runs?
//
//   npm run firesim:targets
//
// The claim this module makes is that an app can run against it on a phone,
// in a browser, on a desktop and — the second-priority ask — on a watch. That
// claim is only worth anything if the sources compile for those targets, so
// this compiles all of them and says which failed.
//
// Two entry points, because they are two different builds:
//
//   FsClient.rgr      what an APP needs: values, paths, queries, the wire
//                     shapes, the transport. No rules parser, no routing, no
//                     model. This is the build a watch would carry.
//   FsSimBridge.rgr   the whole simulator, for when it runs in-process.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..", "..", "..");

const TARGETS = [
  ["es6", "JavaScript"],
  ["kotlin", "Kotlin — Android, Wear OS"],
  ["swift6", "Swift — iOS, watchOS"],
  ["python", "Python"],
  ["go", "Go"],
  ["csharp", "C#"],
  ["java7", "Java"],
  ["cpp", "C++ — Linux/SDL"],
  ["dart", "Dart"],
  ["rust", "Rust"],
  ["php", "PHP"],
  ["scala", "Scala"],
];

const ENTRIES = [
  ["FsClient.rgr", "the client build"],
  ["FsSimBridge.rgr", "the whole simulator"],
];

// The compiler resolves `-d` against its working directory, so the scratch
// directory is one inside the repository rather than /tmp.
const REL = ".firesim-build";
const tmp = path.join(REPO, REL);
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
let failed = 0;
let ran = 0;

for (const [entry, what] of ENTRIES) {
  process.stdout.write(`\n  ${entry} — ${what}\n`);
  for (const [target, label] of TARGETS) {
    const out = path.join(tmp, `${entry}.${target}`);
    let error = "";
    try {
      execFileSync(
        process.execPath,
        [
          path.join(REPO, "bin", "output.js"),
          `-l=${target}`,
          path.join(REPO, "gallery", "firesim", "src", entry),
          `-d=${REL}`,
          `-o=out.${target}`,
        ],
        {
          cwd: REPO,
          env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
    } catch (e) {
      error = String(e.stdout ?? "") + String(e.stderr ?? "");
    }
    ran += 1;
    if (error) {
      failed += 1;
      const first = error.split("\n").find((l) => l.includes("[FAIL]")) ?? error.slice(0, 200);
      process.stdout.write(`    ✗ ${target.padEnd(8)} ${label}\n      ${first.trim()}\n`);
    } else {
      process.stdout.write(`    ✓ ${target.padEnd(8)} ${label}\n`);
    }
    void out;
  }
}

fs.rmSync(tmp, { recursive: true, force: true });
process.stdout.write(`\n  ${ran - failed}/${ran} target builds\n`);
if (!failed) process.stdout.write("\n  ALL PASS\n\n");
process.exit(failed ? 1 : 0);
