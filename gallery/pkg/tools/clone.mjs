#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Clone a public Git repo using Ranger for pack/pkt-line and Node only
// as an HTTPS pipe:
//
//   node gallery/pkg/tools/clone.mjs <git-url> [rev] [outdir] [subdir]

import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const tool = join(root, "gallery/pkg/bin/pkg_tool.js");
const http = join(here, "git-http.mjs");

const gitUrl = process.argv[2];
const rev = process.argv[3] || "HEAD";
const outDir = resolve(process.argv[4] || "pkg-checkout");
const subdir = process.argv[5] || "";

if (!gitUrl) {
  console.error("usage: clone.mjs <git-url> [rev] [outdir] [subdir]");
  process.exit(2);
}

mkdirSync(outDir, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), "ranger-pkg-clone-"));
const adv = join(tmp, "advertise.bin");
const want = join(tmp, "want.bin");
const resp = join(tmp, "response.bin");

execFileSync("node", [http, "advertise", gitUrl, adv], { cwd: root, stdio: "inherit" });
const sha = execFileSync("node", [tool, "want", adv, rev, want], { cwd: root })
  .toString()
  .trim()
  .split("\n")[0];
if (!sha || sha.startsWith("FAIL")) {
  console.error("could not resolve rev", rev, sha);
  process.exit(1);
}
execFileSync("node", [http, "post", gitUrl, want, resp], { cwd: root, stdio: "inherit" });
const checkoutArgs = ["fetch-checkout", resp, sha];
if (subdir) {
  checkoutArgs.push(subdir);
}
checkoutArgs.push(outDir);
execFileSync("node", [tool, ...checkoutArgs], { cwd: root, stdio: "inherit" });
console.log("cloned", sha, "->", outDir);
