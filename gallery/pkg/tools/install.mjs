#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Resolve every dependency in a ranger.json onto disk and write ranger.lock.
//
//   node gallery/pkg/tools/install.mjs [ranger.json] [--vendor] [--cache=<dir>]
//
// `pkg_tool install` only dumps a lock of what is already mounted: a git
// dependency stays a URL and the compiler then reports "not on disk". This
// walks the graph instead — sparse-fetches each git dependency at its pinned
// revision, writes it into the content cache that `compiler/PkgImport.rgr`
// reads (RANGER_PKG_CACHE, else ~/.cache/ranger/packages), and records the
// sha256 so a clean checkout resolves `pkg:` without a Ranger tree.
//
// Node only moves bytes and orchestrates. Pack parsing, the tree walk and the
// content hash are pkg_tool (Ranger).

import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  rmSync,
  cpSync,
} from "node:fs";
import { tmpdir, homedir } from "node:os";
import { join, dirname, resolve, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const http = join(here, "git-http.mjs");
// Published as `ranger-pkg`, pkg_tool.js is built and sits next to this file.
// Inside the Ranger tree it is a gitignored build product under gallery/pkg/bin.
const packaged = join(here, "pkg_tool.cjs");
const inTree = join(root, "gallery/pkg/bin/pkg_tool.js");
const tool = existsSync(packaged) ? packaged : inTree;

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith("--"));
const positional = args.filter((a) => !a.startsWith("--"));

const manifestPath = resolve(positional[0] || "ranger.json");
const projectDir = dirname(manifestPath);
const wantVendor = flags.includes("--vendor");
const cacheFlag = flags.find((a) => a.startsWith("--cache="));

const cacheRoot = resolve(
  cacheFlag
    ? cacheFlag.slice("--cache=".length)
    : process.env.RANGER_PKG_CACHE ||
        join(homedir(), ".cache/ranger/packages")
);

if (!existsSync(manifestPath)) {
  console.error(`no manifest at ${manifestPath}`);
  process.exit(2);
}

function ensureTool() {
  if (existsSync(tool)) {
    return;
  }
  if (!existsSync(join(root, "bin/output.js"))) {
    console.error(`no pkg_tool.js at ${tool} and no Ranger tree to build it from`);
    process.exit(1);
  }
  console.error("building gallery/pkg/bin/pkg_tool.js");
  mkdirSync(dirname(tool), { recursive: true });
  execFileSync(
    "node",
    [
      "bin/output.js",
      "-es6",
      "./gallery/pkg/src/pkg_tool.rgr",
      "-d=./gallery/pkg/bin",
      "-o=pkg_tool.js",
      "-nodecli",
    ],
    {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
    }
  );
  if (!existsSync(tool)) {
    console.error("failed to build gallery/pkg/bin/pkg_tool.js");
    process.exit(1);
  }
}

function runTool(toolArgs) {
  return execFileSync("node", [tool, ...toolArgs], {
    cwd: root,
    encoding: "utf8",
  });
}

function runHttp(httpArgs) {
  execFileSync("node", [http, ...httpArgs], { cwd: root, stdio: "inherit" });
}

function readManifest(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    console.error(`cannot read ${path}: ${err.message}`);
    process.exit(1);
  }
}

// One sparse fetch of `subdir` at `rev`, straight into the content cache.
// Returns { sha256, rev } — rev is the commit the advertisement resolved to,
// so a branch or a tag in ranger.json is pinned in ranger.lock.
function fetchIntoCache(name, dep) {
  const tmp = mkdtempSync(join(tmpdir(), `ranger-pkg-${name}-`));
  try {
    const adv = join(tmp, "advertise.bin");
    runHttp(["advertise", dep.git, adv]);

    const rev = dep.rev || "HEAD";
    const subdir = dep.subdir || "";
    mkdirSync(cacheRoot, { recursive: true });

    if (!subdir) {
      const want = join(tmp, "want.bin");
      const commit = firstLine(runTool(["want-shallow", adv, rev, want]));
      failIf(commit, `cannot resolve ${rev} in ${dep.git}`);
      const pack = join(tmp, "pack.bin");
      runHttp(["post", dep.git, want, pack]);
      const out = runTool(["cache-put", pack, commit, cacheRoot]);
      return { sha256: sha256Of(out), rev: commit };
    }

    // (1) deepen 1 + filter blob:none — the commit and its trees.
    const want = join(tmp, "want.bin");
    const commit = firstLine(runTool(["want-trees", adv, rev, want]));
    failIf(commit, `cannot resolve ${rev} in ${dep.git}`);
    const trees = join(tmp, "trees.bin");
    runHttp(["post", dep.git, want, trees]);

    // (2) want the subtree SHA — only the blobs under subdir.
    const treeOut = runTool(["sparse-tree", trees, commit, subdir]).trim();
    if (!treeOut.startsWith("tree ")) {
      console.error(`${name}: no ${subdir} at ${commit} — ${treeOut}`);
      process.exit(1);
    }
    const treeSha = treeOut.slice(5).trim();
    const want2 = join(tmp, "want2.bin");
    const blobs = join(tmp, "blobs.bin");
    failIf(firstLine(runTool(["want-sha", treeSha, want2])), "want-sha failed");
    runHttp(["post", dep.git, want2, blobs]);

    const out = runTool(["cache-merge", trees, blobs, commit, subdir, cacheRoot]);
    return { sha256: sha256Of(out), rev: commit };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function firstLine(s) {
  return String(s).trim().split("\n")[0].trim();
}

function failIf(line, msg) {
  if (!line || line.startsWith("FAIL")) {
    console.error(`${msg}${line ? ` — ${line}` : ""}`);
    process.exit(1);
  }
}

function sha256Of(toolOutput) {
  for (const line of String(toolOutput).split("\n")) {
    if (line.startsWith("sha256 ")) {
      return line.slice(7).trim();
    }
    if (line.startsWith("FAIL")) {
      console.error(line);
      process.exit(1);
    }
  }
  console.error(`pkg_tool printed no sha256:\n${toolOutput}`);
  process.exit(1);
}

ensureTool();

const rootManifest = readManifest(manifestPath);
const locked = {};
// name -> directory the package was resolved to, so transitive deps of a
// fetched package are walked from its own ranger.json.
const pending = [{ dir: projectDir, manifest: rootManifest }];
const seen = new Set();

while (pending.length > 0) {
  const { dir, manifest } = pending.shift();
  const deps = manifest.dependencies || {};
  for (const [name, dep] of Object.entries(deps)) {
    if (seen.has(name)) {
      continue;
    }
    seen.add(name);

    let pkgDir = "";
    if (dep.path) {
      pkgDir = isAbsolute(dep.path) ? dep.path : resolve(dir, dep.path);
      if (!existsSync(join(pkgDir, "ranger.json"))) {
        console.error(`${name}: no ranger.json under ${dep.path}`);
        process.exit(1);
      }
      locked[name] = { path: dep.path };
      console.log(`${name}  path ${dep.path}`);
    } else if (dep.git) {
      const { sha256, rev } = fetchIntoCache(name, dep);
      pkgDir = join(cacheRoot, sha256);
      locked[name] = {
        git: dep.git,
        rev,
        ...(dep.subdir ? { subdir: dep.subdir } : {}),
        sha256,
      };
      console.log(`${name}  ${rev.slice(0, 12)} -> ${pkgDir}`);
      if (wantVendor) {
        const vendorDir = join(projectDir, "vendor/ranger", name);
        rmSync(vendorDir, { recursive: true, force: true });
        mkdirSync(dirname(vendorDir), { recursive: true });
        cpSync(pkgDir, vendorDir, { recursive: true });
        console.log(`${name}  vendored -> vendor/ranger/${name}`);
      }
    } else {
      console.error(`${name}: dependency has neither "path" nor "git"`);
      process.exit(1);
    }

    const childManifest = join(pkgDir, "ranger.json");
    if (existsSync(childManifest)) {
      pending.push({ dir: pkgDir, manifest: readManifest(childManifest) });
    }
  }
}

const lockPath = join(projectDir, "ranger.lock");
writeFileSync(
  lockPath,
  JSON.stringify({ lockVersion: 1, packages: locked }, null, 2) + "\n"
);
console.log(`wrote ${lockPath}`);
