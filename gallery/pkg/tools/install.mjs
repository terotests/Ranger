#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Resolve every dependency in a ranger.json onto disk and write ranger.lock.
//
//   node gallery/pkg/tools/install.mjs [ranger.json]
//        [--vendor] [--cache=<dir>] [--frozen] [--force]
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
// --frozen: the lock is the answer, not a record of what this run did. A
// dependency the lock does not cover, or one whose cache entry is gone, is an
// error instead of a fetch. What CI wants.
const frozen = flags.includes("--frozen") || flags.includes("--frozen-lockfile");
const force = flags.includes("--force");
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

// What the last install decided. A pinned revision whose checkout is still in
// the cache needs no network: the sha256 names content, and content at a
// commit does not change.
const lockPath = join(projectDir, "ranger.lock");
const previous = existsSync(lockPath)
  ? readManifest(lockPath).packages || {}
  : {};

function cached(name, dep) {
  const was = previous[name];
  if (!was?.sha256 || force) {
    return null;
  }
  // A dependency repointed in ranger.json outranks the lock.
  if (dep.git && was.git !== dep.git) {
    return null;
  }
  if (dep.rev && was.rev !== dep.rev) {
    return null;
  }
  if ((was.subdir || "") !== (dep.subdir || "")) {
    return null;
  }
  if (!existsSync(join(cacheRoot, was.sha256, "ranger.json"))) {
    return null;
  }
  return { sha256: was.sha256, rev: was.rev };
}

// A path dependency inside a FETCHED package points at a sibling in the
// repository it came from, which is not beside its cache entry. Same origin,
// same revision, subdir moved: `gallery/statechart` + `../vela` is
// `gallery/vela` in that repo. Resolving it any other way would mean asking
// every application to list the transitive graph by hand.
function originRelative(origin, relPath) {
  if (!origin) {
    return null;
  }
  const parts = (origin.subdir || "").split("/").filter((p) => p.length > 0);
  for (const piece of relPath.split("/")) {
    if (piece === "" || piece === ".") {
      continue;
    }
    if (piece === "..") {
      if (parts.length === 0) {
        return null;
      }
      parts.pop();
    } else {
      parts.push(piece);
    }
  }
  return { git: origin.git, rev: origin.rev, subdir: parts.join("/") };
}

const rootManifest = readManifest(manifestPath);
const locked = {};
// A fetched package is walked from its own ranger.json, carrying the origin
// it came from so its path dependencies stay resolvable.
const pending = [{ dir: projectDir, manifest: rootManifest, origin: null }];
const seen = new Set();

while (pending.length > 0) {
  const { dir, manifest, origin } = pending.shift();
  const deps = manifest.dependencies || {};
  for (const [name, declared] of Object.entries(deps)) {
    if (seen.has(name)) {
      continue;
    }
    seen.add(name);

    let dep = declared;
    if (dep.path && origin) {
      const asGit = originRelative(origin, dep.path);
      if (!asGit) {
        console.error(`${name}: ${dep.path} climbs out of ${origin.git}`);
        process.exit(1);
      }
      dep = asGit;
    }

    let pkgDir = "";
    let childOrigin = null;
    if (dep.path) {
      pkgDir = isAbsolute(dep.path) ? dep.path : resolve(dir, dep.path);
      if (!existsSync(join(pkgDir, "ranger.json"))) {
        console.error(`${name}: no ranger.json under ${dep.path}`);
        process.exit(1);
      }
      locked[name] = { path: dep.path };
      console.log(`${name}  path ${dep.path}`);
    } else if (dep.git) {
      const reuse = cached(name, dep);
      if (!reuse && frozen) {
        console.error(
          `${name}: --frozen, but ranger.lock does not cover it at this ` +
            `revision, or its cache entry is gone.`
        );
        process.exit(1);
      }
      const { sha256, rev } = reuse || fetchIntoCache(name, dep);
      pkgDir = join(cacheRoot, sha256);
      childOrigin = { git: dep.git, rev, subdir: dep.subdir || "" };
      locked[name] = {
        git: dep.git,
        rev,
        ...(dep.subdir ? { subdir: dep.subdir } : {}),
        sha256,
      };
      console.log(
        `${name}  ${rev.slice(0, 12)} -> ${pkgDir}${reuse ? "  (cached)" : ""}`
      );
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
      pending.push({
        dir: pkgDir,
        manifest: readManifest(childManifest),
        origin: childOrigin,
      });
    }
  }
}

writeFileSync(
  lockPath,
  JSON.stringify({ lockVersion: 1, packages: locked }, null, 2) + "\n"
);
console.log(`wrote ${lockPath}`);
