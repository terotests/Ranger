#!/usr/bin/env node
/**
 * Parse the live-build NDJSON stream. Guards the wire: every line is JSON,
 * the event kinds we document are present, and the display list grows.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { frameDocument } from "./agents.mjs";

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
      "dist/rgrc.js",
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
  // The recipe's own screens have to pass the same measure the agent reads:
  // a demo that streams "count":0 while the cards sit on each other teaches
  // the wrong thing to everything downstream of it.
  const measured = events.filter((e) => e.t === "measure").at(-1);
  if (!measured || measured.count !== 0) {
    throw new Error(`${kind}: the finished screen has findings ${JSON.stringify(measured)}`);
  }
  if (!Number.isFinite(measured.bottomFree)) {
    throw new Error(`${kind}: measure did not report the free space`);
  }
  if (measured.width !== 390 || measured.height !== 844) {
    throw new Error(`${kind}: measured at ${measured.width}×${measured.height}`);
  }
  // Nothing is off its edge either. The demo screens are what every session
  // starts from and what the guide points at, so a bottom bar one padding to
  // the right of the cards it floats over teaches that as the house style.
  if ((measured.align || []).length) {
    throw new Error(`${kind}: ${measured.align.join("; ")}`);
  }
  const done = events.filter((e) => e.t === "done").at(-1);
  if (!done.ok) throw new Error(`${kind}: done.ok is false ${JSON.stringify(done)}`);
  if (done.findings !== 0) throw new Error(`${kind}: measure findings ${done.findings}`);
  const tokens = events.filter((e) => e.t === "token");
  if (tokens.length < 20) throw new Error(`${kind}: only ${tokens.length} tokens`);
  console.log(
    `  ${kind.padEnd(10)} ${frames.length} frames, ${done.ncmds} cmds, ` +
      `${tokens.length} tokens, ${measured.bottomFree}px free`,
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

// THE VIEWPORT IS A VIEW. A design has to be looked at as a phone, a tablet
// on its side and a desktop, and none of those is an edit — the file keeps
// the width it was drawn at. This pins both halves, because the cheap way to
// implement a device picker is to rewrite the document and it would pass a
// screenshot test while quietly destroying the design.
{
  const fixture = path.join(here, "fixtures/step1.evg.json");
  const before = fs.readFileSync(fixture, "utf8");
  const at = (view) => {
    const events = frameDocument(fixture, view);
    const frame = events.find((e) => e && e.t === "frame");
    if (!frame) throw new Error("no frame at " + JSON.stringify(view));
    return frame;
  };
  const own = at(null);
  const tall = at({ width: 820, height: 1180 });
  const wide = at({ width: 1440, height: 900 });
  const sideways = at({ width: own.height, height: own.width });

  if (tall.width !== 820 || tall.height !== 1180) {
    throw new Error("a tablet viewport was not honoured: " + tall.width + "x" + tall.height);
  }
  if (wide.width !== 1440 || wide.height !== 900) {
    throw new Error("a desktop viewport was not honoured: " + wide.width + "x" + wide.height);
  }
  if (sideways.width !== own.height || sideways.height !== own.width) {
    throw new Error("landscape did not swap the sides: " + sideways.width + "x" + sideways.height);
  }
  // Half of one: asking for a width only leaves the height as drawn.
  const halfway = at({ width: 1024, height: 0 });
  if (halfway.width !== 1024 || halfway.height !== own.height) {
    throw new Error("a width-only viewport changed the height: " + halfway.width + "x" + halfway.height);
  }
  // And the other half, which is the one that matters.
  if (fs.readFileSync(fixture, "utf8") !== before) {
    throw new Error("looking at a document at another size rewrote it");
  }
  const measured = frameDocument(fixture, { width: 1440, height: 900 }).find((e) => e && e.t === "measure");
  if (!measured || measured.width !== 1440) {
    throw new Error("measure described a different page than the frame: " + JSON.stringify(measured));
  }
  console.log("  viewport   phone, tablet, desktop and sideways — and the file unchanged");
}

console.log("ALL PASS — NDJSON stream, growing display lists, thinking tokens");
