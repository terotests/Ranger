#!/usr/bin/env node
// SPDX-License-Identifier: MIT
//
// npm run deps -- put the packages the root ranger.json names where this
// tree expects them.
//
// EVG (lib/evg) and the image codecs (lib/image) live in terotests/evg;
// ComponentEngine (gallery/componentengine) and CEr (gallery/cer) in
// terotests/componentengine. The root ranger.json pins each repository at
// one commit; this runs `rgrc install` against it (the cache and
// ranger.lock, as for any project) and copies every git package of the lock
// to its place in PLACES. Those directories are not in git: they are what
// node_modules is to npm.
//
//   npm run deps                        # the pinned commit (npm ci runs this too)
//   npm run deps -- --from=../evg       # a checkout's working tree instead of its pinned commit
//   npm run deps -- --check             # exit 1 unless every place matches ranger.lock
//
// Changing EVG (or ComponentEngine): commit to its repository, put the new
// commit in ranger.json ("rev"), npm run deps, commit ranger.json and
// ranger.lock.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STAMP = ".ranger-pkg.json";
// The directories of a fetched package that a local build writes into; a
// copy of the same commit keeps them.
const KEEP_ON_REFRESH = new Set(["bin"]);
// Where each git package of ranger.lock goes. The MIT platform pieces are
// under lib/, the AGPL ones under gallery/ (LICENSING.md).
const PLACES = {
  evg: "lib/evg",
  image: "lib/image",
  componentengine: "gallery/componentengine",
  cer: "gallery/cer",
};
// What --from=<checkout> copies: the packages whose repository that
// checkout is, found by the subdirectories the lock names.

const args = process.argv.slice(2);
const fromArg = args.find((a) => a.startsWith("--from="));
const checkOnly = args.includes("--check");

function log(line) {
  process.stdout.write(line + "\n");
}

function cacheRoot() {
  if (process.env.RANGER_PKG_CACHE) return process.env.RANGER_PKG_CACHE;
  const home = process.env.HOME || os.homedir();
  return home ? path.join(home, ".cache/ranger/packages") : path.join(ROOT, ".ranger-cache/packages");
}

function git(args, cwd) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} in ${cwd}: ${(r.stderr || "").trim()}`);
  return r.stdout.trim();
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readStamp(dir) {
  try {
    return readJson(path.join(dir, STAMP));
  } catch {
    return null;
  }
}

function copyTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    if (ent.name === ".git" || ent.name === "node_modules") continue;
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) copyTree(s, d);
    else if (ent.isFile()) fs.copyFileSync(s, d);
  }
}

// Replaces lib/<name> with `src`. A directory this script wrote is emptied
// (but for build output of the same content); anything else is moved aside
// to lib/<name>.previous rather than deleted, since it was not ours.
function place(name, src, stamp) {
  const rel = PLACES[name];
  if (!rel) throw new Error(`ranger.lock has a git package ${name}, and scripts/deps.mjs has no place for it (PLACES)`);
  const dst = path.join(ROOT, rel);
  const had = readStamp(dst);
  if (had && had.sha256 && had.sha256 === stamp.sha256 && had.from === stamp.from) {
    log(`${name}  ${rel} is ${stamp.rev.slice(0, 12)} already`);
    return;
  }
  if (fs.existsSync(dst)) {
    if (had) {
      const same = had.sha256 && had.sha256 === stamp.sha256;
      for (const ent of fs.readdirSync(dst)) {
        if (same && KEEP_ON_REFRESH.has(ent)) continue;
        fs.rmSync(path.join(dst, ent), { recursive: true, force: true });
      }
    } else {
      const aside = dst + ".previous";
      fs.rmSync(aside, { recursive: true, force: true });
      fs.renameSync(dst, aside);
      log(`${name}  ${rel} was not written by npm run deps; moved it to ${rel}.previous`);
    }
  }
  copyTree(src, dst);
  fs.writeFileSync(path.join(dst, STAMP), JSON.stringify(stamp, null, 2) + "\n");
  log(`${name}  ${stamp.from === "git" ? stamp.rev.slice(0, 12) : stamp.from} -> ${rel}`);
}

function install() {
  const rgrc = path.join(ROOT, "dist/rgrc.js");
  const r = spawnSync(process.execPath, [rgrc, "install"], { cwd: ROOT, encoding: "utf8" });
  const out = (r.stdout || "") + (r.stderr || "");
  if (r.status !== 0 || /error|could not/i.test(out)) {
    process.stderr.write(out);
    throw new Error("rgrc install failed");
  }
}

function gitPackages() {
  const lock = readJson(path.join(ROOT, "ranger.lock"));
  return Object.entries(lock.packages || {})
    .filter(([, e]) => e.git && e.sha256)
    .map(([name, e]) => ({ name, ...e }));
}

function main() {
  const man = readJson(path.join(ROOT, "ranger.json"));
  if (checkOnly) {
    let bad = 0;
    for (const p of gitPackages()) {
      const had = readStamp(path.join(ROOT, PLACES[p.name] || "lib/" + p.name));
      if (!had || had.sha256 !== p.sha256) {
        log(`${PLACES[p.name]} is not ${p.git} ${p.rev} (${p.subdir}); run npm run deps`);
        bad++;
      }
    }
    process.exit(bad ? 1 : 0);
  }

  if (fromArg) {
    const from = path.resolve(fromArg.slice("--from=".length));
    const origin = git(["remote", "get-url", "origin"], from).replace(/\.git$/, "").toLowerCase();
    let n = 0;
    for (const p of gitPackages()) {
      if (p.git.replace(/\.git$/, "").toLowerCase() !== origin) continue;
      const src = path.join(from, p.subdir);
      if (!fs.existsSync(path.join(src, "ranger.json"))) throw new Error(`${src} has no ranger.json`);
      place(p.name, src, { name: p.name, from, subdir: p.subdir, rev: "working tree", sha256: "" });
      n++;
    }
    if (!n) throw new Error(`no package in ranger.lock comes from ${origin}`);
    log("those now hold a working tree; npm run deps puts the pinned commit back");
    return;
  }

  // Offline and already right: nothing to fetch.
  const want = Object.keys(man.dependencies || {}).filter((n) => man.dependencies[n].git);
  if (fs.existsSync(path.join(ROOT, "ranger.lock"))) {
    const pk = gitPackages();
    const pinned = pk.filter((p) => want.includes(p.name));
    const current = pk.every((p) => (readStamp(path.join(ROOT, PLACES[p.name] || "lib/" + p.name)) || {}).sha256 === p.sha256);
    const lockMatches = pinned.every((p) => man.dependencies[p.name].rev === p.rev);
    if (current && lockMatches && pinned.length === want.length) {
      log("every package matches ranger.lock");
      return;
    }
  }

  install();
  for (const p of gitPackages()) {
    const src = path.join(cacheRoot(), p.sha256);
    place(p.name, src, { name: p.name, from: "git", git: p.git, rev: p.rev, subdir: p.subdir, sha256: p.sha256 });
  }
}

try {
  main();
} catch (e) {
  process.stderr.write(`npm run deps: ${e.message}\n`);
  process.exit(1);
}
