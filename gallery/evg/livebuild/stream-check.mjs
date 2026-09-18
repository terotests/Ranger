#!/usr/bin/env node
/**
 * Parse the live-build NDJSON stream. Guards the wire: every line is JSON,
 * the event kinds we document are present, and the display list grows.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const bin = path.join(root, "gallery/evg/bin/evg_livebuild.js");

function compile() {
  const env = { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" };
  fs.mkdirSync(path.dirname(bin), { recursive: true });
  try {
    fs.unlinkSync(bin);
  } catch {
    /* ok */
  }
  const log = spawnSync(
    "node",
    [
      "bin/output.js",
      "-es6",
      "./gallery/evg/livebuild/EvgLiveBuildMain.rgr",
      "-d=./gallery/evg/bin",
      "-o=evg_livebuild.js",
      "-nodecli",
    ],
    { cwd: root, encoding: "utf8", env, maxBuffer: 20 * 1024 * 1024 },
  );
  const text = `${log.stdout || ""}${log.stderr || ""}`;
  if (log.status !== 0 || /Compilation FAILED/.test(text) || !fs.existsSync(bin)) {
    console.error(text.slice(-4000));
    throw new Error("compile failed");
  }
}

function run(kind, prompt) {
  const r = spawnSync("node", [bin, "run", kind], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, EVG_LIVEBUILD_PROMPT: prompt || "" },
    maxBuffer: 20 * 1024 * 1024,
  });
  if (r.status !== 0) {
    throw new Error(`${kind} exited ${r.status}: ${r.stderr}`);
  }
  const events = [];
  for (const line of (r.stdout || "").split("\n")) {
    if (!line.trim()) continue;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch (e) {
      throw new Error(`${kind}: not JSON: ${line.slice(0, 180)}`);
    }
    if (!obj || typeof obj.t !== "string") {
      throw new Error(`${kind}: missing t: ${line.slice(0, 180)}`);
    }
    events.push(obj);
  }
  return events;
}

function check(kind) {
  const events = run(kind);
  const types = new Set(events.map((e) => e.t));
  for (const need of ["session", "think", "token", "ops", "code", "frame", "measure", "done"]) {
    if (!types.has(need)) throw new Error(`${kind}: missing event ${need}`);
  }
  const frames = events.filter((e) => e.t === "frame");
  if (frames.length < 6) throw new Error(`${kind}: only ${frames.length} frames`);
  let prev = -1;
  for (const f of frames) {
    if (!f.list || !Array.isArray(f.list.cmds)) {
      throw new Error(`${kind}: frame without list.cmds`);
    }
    if (f.ncmds !== f.list.cmds.length) {
      throw new Error(`${kind}: ncmds ${f.ncmds} != cmds ${f.list.cmds.length}`);
    }
    if (f.ncmds < prev) throw new Error(`${kind}: display list shrank`);
    prev = f.ncmds;
  }
  const done = events.filter((e) => e.t === "done").at(-1);
  if (!done.ok) throw new Error(`${kind}: done.ok is false ${JSON.stringify(done)}`);
  if (done.findings !== 0) throw new Error(`${kind}: measure findings ${done.findings}`);
  const tokens = events.filter((e) => e.t === "token");
  if (tokens.length < 20) throw new Error(`${kind}: only ${tokens.length} tokens`);
  console.log(
    `  ${kind.padEnd(10)} ${frames.length} frames, ${done.ncmds} cmds, ${tokens.length} tokens`,
  );
}

compile();
check("dashboard");
check("settings");
check("invoices");
const restyle = run(
  "dashboard",
  "Make the title larger, use a gold accent, and round the metric cards more.",
);
if (!restyle.some((e) => e.t === "ops" && JSON.stringify(e).includes("251,191,36"))) {
  throw new Error("restyle: gold accent missing from ops");
}
if (!restyle.some((e) => e.t === "ops" && JSON.stringify(e).includes("28px"))) {
  throw new Error("restyle: larger title missing from ops");
}
if (restyle.filter((e) => e.t === "frame").length < 3) {
  throw new Error("restyle: expected a frame per restyle step");
}
console.log("  restyle    gold + title + radius follow-up");
console.log("ALL PASS — NDJSON stream, growing display lists, thinking tokens");
