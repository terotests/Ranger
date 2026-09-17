#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Clone a public Git repo using Ranger for pack/pkt-line and Node only
// as an HTTPS pipe:
//
//   node gallery/pkg/tools/clone.mjs <git-url> [rev] [outdir] [subdir]
//
// Deno does not git-clone HTTP imports — it GETs the files the graph
// actually names. This is the same idea on Git objects: with a subdir,
// (1) deepen 1 + filter blob:none (commit + trees), (2) want that
// directory's tree SHA (its blobs). Without a subdir, one shallow
// snapshot of the whole tree (deepen 1, still every file at that commit).

import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, statSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const packaged = join(here, "pkg_tool.cjs");
const inTree = join(root, "gallery/pkg/bin/pkg_tool.js");
const tool = existsSync(packaged) ? packaged : inTree;
const http = join(here, "git-http.mjs");

const gitUrl = process.argv[2];
const rev = process.argv[3] || "HEAD";
const outDir = resolve(process.argv[4] || "pkg-checkout");
const subdir = process.argv[5] || "";

if (!gitUrl) {
  console.error("usage: clone.mjs <git-url> [rev] [outdir] [subdir]");
  process.exit(2);
}

function ensureTool() {
  if (existsSync(tool)) {
    return;
  }
  console.error("building gallery/pkg/bin/pkg_tool.js");
  mkdirSync(dirname(tool), { recursive: true });
  const env = {
    ...process.env,
    RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr",
  };
  let log = "";
  try {
    log = execFileSync(
      "node",
      [
        "bin/output.js",
        "-es6",
        "./gallery/pkg/src/pkg_tool.rgr",
        "-d=./gallery/pkg/bin",
        "-o=pkg_tool.js",
        "-nodecli",
      ],
      { cwd: root, encoding: "utf8", env }
    );
  } catch (err) {
    log =
      String(err.stdout || "") +
      String(err.stderr || "") +
      String(err.message || err);
  }
  if (log.includes("Compilation FAILED") || existsSync(tool) === false) {
    if (log) {
      console.error(log);
    }
    console.error("failed to build gallery/pkg/bin/pkg_tool.js");
    process.exit(1);
  }
}

ensureTool();

function runTool(args) {
  return execFileSync("node", [tool, ...args], { cwd: root, encoding: "utf8" });
}

function runHttp(args, extraEnv = {}) {
  execFileSync("node", [http, ...args], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
}

function sizeOf(p) {
  try {
    return statSync(p).size;
  } catch {
    return 0;
  }
}

mkdirSync(outDir, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), "ranger-pkg-clone-"));
const adv = join(tmp, "advertise.bin");
const want = join(tmp, "want.bin");
const resp = join(tmp, "response.bin");

runHttp(["advertise", gitUrl, adv]);

if (subdir) {
  const sha = runTool(["want-trees", adv, rev, want]).trim().split("\n")[0];
  if (!sha || sha.startsWith("FAIL")) {
    console.error("could not resolve rev", rev, sha);
    process.exit(1);
  }
  const trees = join(tmp, "trees.bin");
  runHttp(["post", gitUrl, want, trees]);
  console.log("trees", sizeOf(trees), "bytes");
  const treeOut = runTool(["sparse-tree", trees, sha, subdir]).trim();
  if (treeOut.startsWith("FAIL") || !treeOut.startsWith("tree ")) {
    console.error("could not find subdir", subdir, treeOut);
    process.exit(1);
  }
  const treeSha = treeOut.slice(5).trim();
  const want2 = join(tmp, "want2.bin");
  const blobs = join(tmp, "blobs.bin");
  const w2 = runTool(["want-sha", treeSha, want2]).trim();
  if (!w2 || w2.startsWith("FAIL")) {
    console.error(w2);
    process.exit(1);
  }
  runHttp(["post", gitUrl, want2, blobs]);
  console.log("blobs", sizeOf(blobs), "bytes");
  process.stdout.write(runTool(["fetch-merge", trees, blobs, sha, subdir, outDir]));
  console.log("cloned", sha, subdir, "->", outDir);
  process.exit(0);
}

const sha = runTool(["want-shallow", adv, rev, want]).trim().split("\n")[0];
if (!sha || sha.startsWith("FAIL")) {
  console.error("could not resolve rev", rev, sha);
  process.exit(1);
}
runHttp(["post", gitUrl, want, resp]);
console.log("pack", sizeOf(resp), "bytes");
execFileSync("node", [tool, "fetch-checkout", resp, sha, outDir], {
  cwd: root,
  stdio: "inherit",
});
console.log("cloned", sha, "->", outDir);
