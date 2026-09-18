#!/usr/bin/env node
/**
 * The orchestrator, without Codex or Claude on PATH: recipe still streams,
 * mock CLI writes a workspace, frames come off the watched file.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listAgents, runTask, root, findCursorAgent, cursorSpawnArgs } from "./agents.mjs";

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
const self = agents.find((a) => a.id === "self");
const cursor = agents.find((a) => a.id === "cursor");
if (!recipe?.available) throw new Error("recipe must always be available");
if (!mock?.available) throw new Error("mock must always be available");
if (!self?.available) throw new Error("self must always be available");
if (!cursor) throw new Error("cursor slot missing from listAgents");
const cursorBin = findCursorAgent();
if (Boolean(cursorBin) !== Boolean(cursor.available)) {
  throw new Error("cursor available flag does not match findCursorAgent()");
}
if (!cursor.available && !/cursor.com\/install/i.test(cursor.hint || "")) {
  throw new Error("cursor-off hint must mention curl https://cursor.com/install");
}
const spawnArgs = cursorSpawnArgs("Build a phone dashboard", "/tmp/evg-live-ws");
for (const need of ["-p", "--force", "--trust", "--workspace", "/tmp/evg-live-ws"]) {
  if (!spawnArgs.includes(need)) throw new Error(`cursor spawn missing ${need}`);
}
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
const errors = mockEvents.filter((e) => e.t === "error");
if (errors.length) throw new Error("mock emitted error: " + (errors[0].text || ""));
if (mockEvents[0].agent !== "mock") throw new Error("session did not name the agent");
console.log(`  mock        ${frames.length} frames, ${tokens.length} tokens, agent=${mockEvents[0].agent}`);

const selfWs = fs.mkdtempSync(path.join(os.tmpdir(), "evg-self-"));
fs.writeFileSync(
  path.join(selfWs, "doc.evg.json"),
  fs.readFileSync(path.join(here, "fixtures/step1.evg.json")),
);
fs.writeFileSync(path.join(selfWs, "think.log"), "hello from the cloud agent\n");
fs.writeFileSync(path.join(selfWs, "STOP"), "1");
const selfRun = spawnSync(process.execPath, [path.join(here, "self-agent.mjs"), selfWs], {
  encoding: "utf8",
  timeout: 5000,
});
if (selfRun.status !== 0) {
  throw new Error("self-agent exit " + selfRun.status + " " + (selfRun.stderr || ""));
}
if (!/Cursor cloud agent/.test(selfRun.stdout || "")) {
  throw new Error("self-agent did not introduce itself");
}
if (!/hello from the cloud agent/.test(selfRun.stdout || "")) {
  throw new Error("self-agent did not flush think.log");
}
console.log("  self        slot stays open until STOP, thinking from think.log");

if (!cursor.available) {
  const blocked = [];
  await runTask({
    agent: "cursor",
    kind: "dashboard",
    prompt: "should not spawn",
    onLine: (line) => blocked.push(JSON.parse(line)),
  });
  const err = blocked.find((e) => e.t === "error");
  if (!err || !/cursor.com\/install|not available/i.test(err.text || "")) {
    throw new Error("unavailable cursor should emit the install hint, got " + JSON.stringify(blocked));
  }
  console.log("  cursor      off — install hint streamed, no spawn");
}

const withcursor = spawnSync(process.execPath, [path.join(here, "withcursor.mjs"), "--check"], {
  encoding: "utf8",
  timeout: 8000,
});
if (withcursor.status !== 0) {
  throw new Error("withcursor --check exit " + withcursor.status + " " + (withcursor.stderr || withcursor.stdout || ""));
}
if (cursorBin) {
  if (!/cursor CLI/.test(`${withcursor.stdout || ""}${withcursor.stderr || ""}`)) {
    throw new Error("withcursor --check did not mention the CLI");
  }
} else if (!/cursor CLI off/.test(withcursor.stdout || "")) {
  throw new Error("withcursor --check should say cursor CLI off when missing");
}
console.log("  withcursor  " + String(withcursor.stdout || "").trim());

const missing = agents.filter((a) => !a.available).map((a) => a.id);
if (missing.length) {
  console.log("  skipped     " + missing.join(", ") + " (not on this machine)");
}

console.log("ALL PASS — local orchestrator, recipe + mock + self + Cursor slot");
