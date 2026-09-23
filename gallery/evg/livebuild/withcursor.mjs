#!/usr/bin/env node
/**
 * Drive EVG live-build with the Cursor Agent CLI on this machine.
 *
 *   npm run livebuild:withcursor
 *
 * Needs `agent` or `cursor-agent` on PATH:
 *
 *   curl https://cursor.com/install -fsS | bash
 *   agent login
 *
 * or `CURSOR_API_KEY` from https://cursor.com/dashboard/api
 *
 * Recipe still works without a subscription (`npm run livebuild:serve`).
 * This script is the local-Cursor door: it checks the CLI, compiles the
 * Ranger program, and starts the page with Cursor selected.
 */
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  cursorLoggedIn,
  cursorSpawnArgs,
  findCursorAgent,
  root,
} from "./agents.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.EVG_LIVEBUILD_PORT || 8765);

function helpMissing() {
  return `Cursor Agent CLI is not on PATH.

Install (macOS, Linux, WSL):
  curl https://cursor.com/install -fsS | bash

Windows PowerShell:
  irm 'https://cursor.com/install?win32=true' | iex

Then log in with the same Cursor subscription you use in the editor:
  agent login

Or set CURSOR_API_KEY from https://cursor.com/dashboard/api

Override the binary with CURSOR_AGENT_PATH if it is not on PATH.

Recipe (no keys) still works:
  npm run livebuild:serve
`;
}

function helpLogin(bin) {
  return `Found Cursor CLI at ${bin}, but it is not logged in.

  agent login

or:

  export CURSOR_API_KEY=…     # https://cursor.com/dashboard/api

Then:
  npm run livebuild:withcursor
`;
}

function compile(src, out, outRel = "gallery/evg/bin") {
  const env = { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" };
  const outdir = path.join(root, outRel);
  const dest = path.join(outdir, out);
  fs.mkdirSync(outdir, { recursive: true });
  try {
    fs.unlinkSync(dest);
  } catch {
    /* first run */
  }
  const log = spawnSync(
    "node",
    ["dist/rgrc.js", "-es6", src, `-d=${outdir}`, `-o=${out}`, "-nodecli"],
    { cwd: root, encoding: "utf8", env, maxBuffer: 20 * 1024 * 1024 },
  );
  const text = `${log.stdout || ""}${log.stderr || ""}`;
  if (log.status !== 0 || /Compilation FAILED/.test(text) || !fs.existsSync(dest)) {
    const fail = text.split("\n").filter((l) => /\[FAIL\]|FAILED|error/i.test(l)).slice(0, 40);
    throw new Error(`compile ${src} failed:\n${fail.join("\n") || text.slice(-1500)}`);
  }
}

function report(bin, { check = false } = {}) {
  const sample = cursorSpawnArgs("<task>", "/tmp/evg-live-workspace");
  const logged = cursorLoggedIn(bin);
  process.stderr.write(`Cursor CLI: ${bin}\n`);
  process.stderr.write(`Logged in:  ${logged ? "yes" : "no (agent login or CURSOR_API_KEY)"}\n`);
  process.stderr.write(`Spawn:      ${bin} ${sample.join(" ")}\n`);
  if (check) return logged;
  return logged;
}

function main() {
  const check = process.argv.includes("--check");
  const bin = findCursorAgent();
  if (!bin) {
    if (check) {
      process.stdout.write("cursor CLI off\n");
      process.exit(0);
    }
    process.stderr.write(helpMissing());
    process.exit(1);
  }
  if (!cursorLoggedIn(bin)) {
    if (check) {
      process.stdout.write(`cursor CLI ${bin} (not logged in)\n`);
      process.exit(0);
    }
    process.stderr.write(helpLogin(bin));
    process.exit(1);
  }
  if (check) {
    report(bin, { check: true });
    process.stdout.write("cursor CLI ready\n");
    process.exit(0);
  }

  compile("./gallery/evg/livebuild/EvgLiveBuildMain.rgr", "evg_livebuild.js");
  try {
    compile("./lib/evg/agent/evg_agent.rgr", "evg_agent.js", "lib/evg/bin");
  } catch (e) {
    process.stderr.write(`evg_agent compile skipped: ${e.message}\n`);
  }

  process.env.EVG_LIVEBUILD_DEFAULT_AGENT = process.env.EVG_LIVEBUILD_DEFAULT_AGENT || "cursor";
  report(bin);
  process.stderr.write(`\nOpen http://127.0.0.1:${PORT}/?agent=cursor\n`);
  process.stderr.write("The page spawns local Cursor against a temp workspace (doc.evg.json + AGENTS.md).\n");
  process.stderr.write("This uses your Cursor subscription. Ctrl+C stops the server.\n\n");

  const child = spawn(process.execPath, [path.join(here, "serve.mjs")], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });
  child.on("exit", (code, signal) => {
    if (signal) process.exit(1);
    process.exit(code ?? 1);
  });
}

main();
