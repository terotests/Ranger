#!/usr/bin/env node
/**
 * The orchestrator, without Codex or Claude on PATH: recipe still streams,
 * mock CLI writes a workspace, frames come off the watched file.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listAgents, runTask, root } from "./agents.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
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

function collect(agent, kind) {
  const events = [];
  return runTask({
    agent,
    kind,
    prompt: "",
    onLine: (line) => {
      const obj = JSON.parse(line);
      events.push(obj);
    },
  }).then(() => events);
}

compile();

const agents = listAgents();
const recipe = agents.find((a) => a.id === "recipe");
const mock = agents.find((a) => a.id === "mock");
if (!recipe?.available) throw new Error("recipe must always be available");
if (!mock?.available) throw new Error("mock must always be available");
console.log(
  "  agents      " +
    agents.map((a) => `${a.id}${a.available ? "" : " (off)"}`).join(", "),
);

const framed = spawnSync("node", [bin, "frame", "gallery/evg/agent/fixtures/card.evg.json"], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 8 * 1024 * 1024,
});
const frameEvents = (framed.stdout || "")
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l));
if (!frameEvents.some((e) => e.t === "frame" && e.list?.cmds?.length > 0)) {
  throw new Error("frame verb produced no cmds");
}
if (frameEvents.find((e) => e.t === "done")?.ok !== true) {
  throw new Error("frame verb did not finish ok");
}
console.log("  frame       card.evg.json → " + frameEvents.find((e) => e.t === "frame").ncmds + " cmds");

const mockEvents = await collect("mock", "dashboard");
const types = new Set(mockEvents.map((e) => e.t));
for (const need of ["session", "token", "frame", "done"]) {
  if (!types.has(need)) throw new Error(`mock missing ${need}`);
}
const frames = mockEvents.filter((e) => e.t === "frame");
if (frames.length < 2) throw new Error(`mock only ${frames.length} frames`);
const tokens = mockEvents.filter((e) => e.t === "token");
if (tokens.length < 8) throw new Error(`mock only ${tokens.length} tokens`);
const done = mockEvents.filter((e) => e.t === "done").at(-1);
if (!done?.ok) throw new Error("mock done.ok is false");
if (mockEvents[0].agent !== "mock") throw new Error("session did not name the agent");
console.log(`  mock        ${frames.length} frames, ${tokens.length} tokens, agent=${mockEvents[0].agent}`);

const missing = agents.filter((a) => !a.available).map((a) => a.id);
if (missing.length) {
  console.log("  skipped     " + missing.join(", ") + " (not on this machine)");
}

console.log("ALL PASS — local orchestrator, recipe + mock workspace agent");
