#!/usr/bin/env node
// SPDX-License-Identifier: MIT
//
// Build the pack / SHA-1 corpus from git and Node crypto. The Ranger
// decoder is checked against these, not against itself.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = join(root, "fixtures");
mkdirSync(fixtures, { recursive: true });

function sha1(buf) {
  return createHash("sha1").update(buf).digest("hex");
}

const sha1Txt = [
  `empty ${sha1(Buffer.alloc(0))}`,
  `abc ${sha1(Buffer.from("abc"))}`,
  `hello ${sha1(Buffer.from("hello ranger\n"))}`,
].join("\n") + "\n";
writeFileSync(join(fixtures, "sha1.txt"), sha1Txt);

const tmp = mkdtempSync(join(tmpdir(), "ranger-pkg-git-"));
execFileSync("git", ["init", "-b", "master"], { cwd: tmp, stdio: "pipe" });
execFileSync("git", ["config", "user.email", "pkg@ranger.local"], { cwd: tmp });
execFileSync("git", ["config", "user.name", "Ranger Pkg"], { cwd: tmp });

mkdirSync(join(tmp, "src"));
writeFileSync(join(tmp, "hello.txt"), "hello ranger\n");
writeFileSync(join(tmp, "src/Main.rgr"), "class Main {\n}\n");
writeFileSync(
  join(tmp, "ranger.json"),
  JSON.stringify(
    {
      name: "tiny",
      version: "0.1.0",
      entry: "src/Main.rgr",
      license: "MIT",
    },
    null,
    2
  ) + "\n"
);

execFileSync("git", ["add", "-A"], { cwd: tmp });
execFileSync("git", ["commit", "-m", "init"], { cwd: tmp, env: { ...process.env, GIT_AUTHOR_DATE: "2020-01-01T00:00:00", GIT_COMMITTER_DATE: "2020-01-01T00:00:00" } });

writeFileSync(join(tmp, "hello.txt"), "hello ranger\nsecond line\n");
writeFileSync(join(tmp, "src/Util.rgr"), "class Util {\n}\n");
execFileSync("git", ["add", "-A"], { cwd: tmp });
execFileSync("git", ["commit", "-m", "more"], { cwd: tmp, env: { ...process.env, GIT_AUTHOR_DATE: "2020-01-02T00:00:00", GIT_COMMITTER_DATE: "2020-01-02T00:00:00" } });

const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: tmp }).toString().trim();
const tree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: tmp }).toString().trim();
const helloSha = execFileSync("git", ["hash-object", "hello.txt"], { cwd: tmp }).toString().trim();
const helloText = readFileSync(join(tmp, "hello.txt"));
writeFileSync(join(fixtures, "hello.txt"), helloText);

function packAll(args) {
  const list = execFileSync("git", ["rev-list", "--objects", "--all"], { cwd: tmp });
  return execFileSync("git", ["pack-objects", "--stdout", ...args], {
    cwd: tmp,
    input: list,
    maxBuffer: 20 * 1024 * 1024,
  });
}

writeFileSync(join(fixtures, "tiny.pack"), packAll(["--window=0", "--depth=0"]));
writeFileSync(join(fixtures, "tiny-delta.pack"), packAll([]));

writeFileSync(
  join(fixtures, "tiny.meta.txt"),
  `head ${head}\ntree ${tree}\nhello.sha ${helloSha}\n`
);

console.log("wrote", fixtures);
console.log("head", head);
console.log("hello.sha", helloSha);
console.log("tiny.pack", readFileSync(join(fixtures, "tiny.pack")).length, "bytes");
console.log("tiny-delta.pack", readFileSync(join(fixtures, "tiny-delta.pack")).length, "bytes");
