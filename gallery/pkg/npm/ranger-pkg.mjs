#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
//   ranger-pkg install [ranger.json] [--vendor] [--cache=<dir>]
//   ranger-pkg clone <git-url> [rev] [outdir] [subdir]
//   ranger-pkg <pkg_tool command> ...
//
// A thin front for the two orchestrators and the Ranger tool underneath them.

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const [cmd, ...rest] = process.argv.slice(2);

const targets = {
  install: join(here, "install.mjs"),
  clone: join(here, "clone.mjs"),
};

if (!cmd || cmd === "--help" || cmd === "-h") {
  console.log(`ranger-pkg install [ranger.json] [--vendor] [--cache=<dir>]
ranger-pkg clone <git-url> [rev] [outdir] [subdir]
ranger-pkg <pkg_tool command> ...   (sha1, refs, unpack, checkout, resolve, tree, lock, vendor, cache-put, cache-merge)`);
  process.exit(cmd ? 0 : 2);
}

const target = targets[cmd] || join(here, "pkg_tool.cjs");
const args = targets[cmd] ? rest : [cmd, ...rest];
const res = spawnSync(process.execPath, [target, ...args], { stdio: "inherit" });
process.exit(res.status === null ? 1 : res.status);
