#!/usr/bin/env node
// SPDX-License-Identifier: MIT
//
// npm run deps -- put the packages the root ranger.json names at lib/<name>.
//
// EVG (lib/evg) and the image codecs (lib/image) live in terotests/evg. The
// root ranger.json pins that repository at one commit; this runs
// `rgrc install` against it (the cache and ranger.lock, as for any project)
// and copies every git package of the lock to lib/<name>, where the gallery,
// the web builds and the Android hosts have always found them. Those two
// directories are not in git: they are what node_modules is to npm.
//
//   npm run deps                        # the pinned commit (npm ci runs this too)
//   npm run deps -- --from=../evg       # an evg checkout's working tree instead
//   npm run deps -- --check             # exit 1 unless lib/ matches ranger.lock
//
// Changing EVG: commit to terotests/evg, put the new commit in ranger.json
// ("rev"), npm run deps, commit ranger.json and ranger.lock.

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
// What --from copies from an evg checkout: package name -> directory there.
const FROM_LAYOUT = { evg: "storm", image: "image" };

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
  const dst = path.join(ROOT, "lib", name);
  const had = readStamp(dst);
  if (had && had.sha256 && had.sha256 === stamp.sha256 && had.from === stamp.from) {
    log(`${name}  lib/${name} is ${stamp.rev.slice(0, 12)} already`);
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
      log(`${name}  lib/${name} was not written by npm run deps; moved it to lib/${name}.previous`);
    }
  }
  copyTree(src, dst);
  fs.writeFileSync(path.join(dst, STAMP), JSON.stringify(stamp, null, 2) + "\n");
  log(`${name}  ${stamp.from === "git" ? stamp.rev.slice(0, 12) : stamp.from} -> lib/${name}`);
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
      const had = readStamp(path.join(ROOT, "lib", p.name));
      if (!had || had.sha256 !== p.sha256) {
        log(`lib/${p.name} is not ${p.git} ${p.rev} (${p.subdir}); run npm run deps`);
        bad++;
      }
    }
    process.exit(bad ? 1 : 0);
  }

  if (fromArg) {
    const from = path.resolve(fromArg.slice("--from=".length));
    for (const [name, sub] of Object.entries(FROM_LAYOUT)) {
      const src = path.join(from, sub);
      if (!fs.existsSync(path.join(src, "ranger.json"))) throw new Error(`${src} has no ranger.json`);
      place(name, src, { name, from, subdir: sub, rev: "working tree", sha256: "" });
    }
    log("lib/ now holds a working tree; npm run deps puts the pinned commit back");
    return;
  }

  // Offline and already right: nothing to fetch.
  const want = Object.keys(man.dependencies || {}).filter((n) => man.dependencies[n].git);
  if (fs.existsSync(path.join(ROOT, "ranger.lock"))) {
    const pk = gitPackages();
    const pinned = pk.filter((p) => want.includes(p.name));
    const current = pk.every((p) => (readStamp(path.join(ROOT, "lib", p.name)) || {}).sha256 === p.sha256);
    const lockMatches = pinned.every((p) => man.dependencies[p.name].rev === p.rev);
    if (current && lockMatches && pinned.length === want.length) {
      log("lib/ matches ranger.lock");
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
