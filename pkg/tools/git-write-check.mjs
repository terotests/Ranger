#!/usr/bin/env node
// SPDX-License-Identifier: MIT
//
// Checks the Git writer (pkg/src/GitObject, GitPackFile, GitPush) against
// real git, on every target given (default es6 and go):
//
//   1. git makes fixture.git (packed by gc, so with deltas) and an empty
//      bare repository, and dumps every fixture object with cat-file
//   2. GitWriteTest write: Ranger writes written.git (loose objects),
//      packed.git (its own pack + idx) and two receive-pack requests
//   3. git fsck --strict, cat-file and verify-pack read what Ranger wrote
//   4. git receive-pack --stateless-rpc takes the requests; a stale one
//      is refused
//   5. GitWriteTest report parses git's answers, GitWriteTest read reads
//      fixture.git through the idx
//
// Both targets must write byte-identical objects (same commit ids).
//
//   node pkg/tools/git-write-check.mjs [es6] [go] [python]

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(join(dirname(fileURLToPath(import.meta.url)), "..", ".."));
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["es6", "go"];
const outRoot = join(root, "tmp", "git-write");
let failures = 0;

function git(args, opts = {}) {
  return execFileSync("git", args, { stdio: ["pipe", "pipe", "pipe"], ...opts });
}

function fail(msg) {
  console.log(`  FAIL  ${msg}`);
  failures++;
}

function pass(msg) {
  console.log(`  PASS  ${msg}`);
}

function compile(lang) {
  const dir = join(outRoot, "bin", lang);
  mkdirSync(dir, { recursive: true });
  const ext = { es6: "js", go: "go", python: "py" }[lang];
  const name = `GitWriteTest.${ext}`;
  const log = execFileSync(
    "node",
    ["dist/rgrc.js", `-l=${lang}`, "pkg/tests/GitWriteTest.rgr", `-d=${dir}`, `-o=${name}`, "-nodecli"],
    { cwd: root, encoding: "utf8" },
  );
  if (log.includes("Compilation FAILED")) {
    console.log(log);
    throw new Error(`compile ${lang} failed`);
  }
  const file = join(dir, name);
  if (lang === "es6") return (args) => ["node", [file, ...args]];
  if (lang === "go") {
    const exe = join(dir, "GitWriteTest");
    execFileSync("go", ["build", "-o", exe, file], { cwd: dir, stdio: "inherit" });
    return (args) => [exe, args];
  }
  return (args) => ["python3", [file, ...args]];
}

function runTest(cmd, args) {
  const [prog, argv] = cmd(args);
  let out = "";
  try {
    out = execFileSync(prog, argv, { cwd: root, encoding: "utf8" });
  } catch (e) {
    out = (e.stdout || "") + (e.stderr || "");
  }
  console.log(out.trimEnd().replace(/^/gm, "    "));
  if (!/ALL PASS/.test(out)) fail(`GitWriteTest ${args[1]}`);
}

function makeFixture(work) {
  const src = join(work, "fixture-src");
  mkdirSync(src, { recursive: true });
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: "Äijä Örkki",
    GIT_AUTHOR_EMAIL: "aija@example.com",
    GIT_COMMITTER_NAME: "Äijä Örkki",
    GIT_COMMITTER_EMAIL: "aija@example.com",
  };
  git(["init", "-q", "-b", "main"], { cwd: src });
  const lines = [];
  for (let i = 0; i < 400; i++) lines.push(`Rivi ${i}: hyvää päivää, tämä on teksti, joka toistuu.`);
  mkdirSync(join(src, "decks", "äö"), { recursive: true });
  writeFileSync(join(src, "decks", "äö", "deck.md"), lines.join("\n") + "\n");
  writeFileSync(join(src, "README.md"), "# fixture\n");
  git(["add", "-A"], { cwd: src, env });
  git(["commit", "-q", "-m", "Ensimmäinen"], { cwd: src, env });
  lines.splice(200, 1, "Muutettu rivi keskellä.");
  writeFileSync(join(src, "decks", "äö", "deck.md"), lines.join("\n") + "\n");
  git(["commit", "-q", "-am", "Toinen"], { cwd: src, env });
  const bare = join(work, "fixture.git");
  git(["clone", "-q", "--bare", src, bare]);
  git(["gc", "-q", "--aggressive"], { cwd: bare });
  const packDir = join(bare, "objects", "pack");
  const pack = readdirSync(packDir).find((f) => f.endsWith(".pack")).replace(/\.pack$/, "");
  const head = git(["rev-parse", "main"], { cwd: bare, encoding: "utf8" }).trim();
  const all = git(["cat-file", "--batch-all-objects", "--batch-check=%(objectname) %(objecttype) %(deltabase)"], { cwd: bare, encoding: "utf8" })
    .trim()
    .split("\n");
  const deltas = all.filter((l) => !/ 0{40}$/.test(l)).length;
  if (deltas === 0) fail("fixture pack has no deltas (git gc did not delta)");
  mkdirSync(join(work, "expect"), { recursive: true });
  const meta = [`pack ${pack}`, `head ${head}`];
  for (const line of all) {
    const [sha, type] = line.split(" ");
    writeFileSync(join(work, "expect", sha), git(["cat-file", type, sha], { cwd: bare }));
    meta.push(`obj ${sha}`);
  }
  writeFileSync(join(work, "fixture.meta"), meta.join("\n") + "\n");
  console.log(`  fixture: ${all.length} objects, ${deltas} deltas`);
}

function checkWritten(work, lang) {
  const repo = join(work, "written.git");
  const meta = Object.fromEntries(
    readFileSync(join(work, "written.meta"), "utf8").trim().split("\n").map((l) => l.split(" ")),
  );
  try {
    git(["fsck", "--strict", "--no-dangling"], { cwd: repo });
    pass(`${lang}: git fsck --strict written.git`);
  } catch (e) {
    fail(`${lang}: git fsck written.git\n${e.stderr}`);
  }
  const main = git(["rev-parse", "main"], { cwd: repo, encoding: "utf8" }).trim();
  main === meta.c2 ? pass(`${lang}: main = commit 2`) : fail(`${lang}: main ${main} != ${meta.c2}`);
  const deck = git(["cat-file", "blob", "main:decks/abc/deck.md"], { cwd: repo, encoding: "utf8" });
  deck.startsWith("# Hyvää päivää ✓\n") && deck.includes("## Toinen dia")
    ? pass(`${lang}: deck.md reads back as UTF-8`)
    : fail(`${lang}: deck.md = ${JSON.stringify(deck)}`);
  const csv = git(["ls-tree", "-r", "--name-only", "main"], { cwd: repo, encoding: "utf8" });
  csv.includes("decks/abc/data/tyhjä.csv") || csv.includes('"decks/abc/data/tyhj\\303\\244.csv"')
    ? pass(`${lang}: UTF-8 file name`)
    : fail(`${lang}: ls-tree ${csv}`);
  const log = git(["log", "--format=%an|%cn|%s", "main"], { cwd: repo, encoding: "utf8" }).trim().split("\n");
  log.length === 2 && log[0] === 'Tero Äijälä|Sliqtly server|Pakka "Hyvää päivää": 1 dia lisätty'
    ? pass(`${lang}: git log`)
    : fail(`${lang}: git log ${JSON.stringify(log)}`);
  const trailer = git(["log", "-1", "--format=%(trailers:key=Co-authored-by,valueonly)", meta.c1], { cwd: repo, encoding: "utf8" }).trim();
  trailer === "Äijä <aija@example.com>" ? pass(`${lang}: Co-authored-by trailer`) : fail(`${lang}: trailer ${trailer}`);

  const packed = join(work, "packed.git");
  try {
    const idx = readdirSync(join(packed, "objects", "pack")).find((f) => f.endsWith(".idx"));
    git(["verify-pack", join(packed, "objects", "pack", idx)]);
    git(["fsck", "--strict", "--no-dangling"], { cwd: packed });
    pass(`${lang}: git verify-pack + fsck packed.git`);
  } catch (e) {
    fail(`${lang}: packed.git ${e.stderr}`);
  }
  const cloned = join(work, "clone");
  try {
    git(["clone", "-q", packed, cloned]);
    readFileSync(join(cloned, "decks", "abc", "deck.md"), "utf8").includes("Toinen dia")
      ? pass(`${lang}: git clone of packed.git`)
      : fail(`${lang}: clone content`);
  } catch (e) {
    fail(`${lang}: git clone ${e.stderr}`);
  }
  return meta;
}

function receive(repo, req, res) {
  const out = execFileSync("git", ["receive-pack", "--stateless-rpc", repo], {
    input: readFileSync(req),
    stdio: ["pipe", "pipe", "pipe"],
  });
  writeFileSync(res, out);
}

const commits = {};
for (const lang of targets) {
  console.log(`=== ${lang}`);
  const work = join(outRoot, lang);
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });
  makeFixture(work);
  const empty = join(work, "empty.git");
  git(["init", "-q", "--bare", "-b", "main", empty]);
  writeFileSync(join(work, "adv-empty.bin"), git(["receive-pack", "--advertise-refs", "--stateless-rpc", empty]));

  const cmd = compile(lang);
  runTest(cmd, [work, "write"]);
  const meta = checkWritten(work, lang);
  commits[lang] = meta.c2;

  receive(empty, join(work, "push1.req"), join(work, "push1.res"));
  const after1 = git(["rev-parse", "main"], { cwd: empty, encoding: "utf8" }).trim();
  after1 === meta.c1 ? pass(`${lang}: push 1 moved main`) : fail(`${lang}: push 1 main ${after1}`);
  receive(empty, join(work, "push2.req"), join(work, "push2.res"));
  const after2 = git(["rev-parse", "main"], { cwd: empty, encoding: "utf8" }).trim();
  after2 === meta.c2 ? pass(`${lang}: push 2 moved main`) : fail(`${lang}: push 2 main ${after2}`);
  try {
    git(["fsck", "--strict", "--no-dangling"], { cwd: empty });
    pass(`${lang}: git fsck after pushes`);
  } catch (e) {
    fail(`${lang}: fsck after pushes ${e.stderr}`);
  }
  // the first request again: main is no longer at 0000…, so it is stale
  receive(empty, join(work, "push1.req"), join(work, "push-stale.res"));
  runTest(cmd, [work, "report"]);
  runTest(cmd, [work, "read"]);
}

const ids = new Set(Object.values(commits));
if (targets.length > 1) {
  ids.size === 1 ? pass(`same commit ids on ${targets.join(", ")}`) : fail(`commit ids differ: ${JSON.stringify(commits)}`);
}
console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
