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
import { listAgents, runTask, root, findCursorAgent, cursorSpawnArgs, frameFixture, resetSession, readSessionDoc, prepareSession, sessionDir, makeCursorFeed } from "./agents.mjs";

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
const followArgs = cursorSpawnArgs("Make the title gold", "/tmp/evg-live-ws", true);
if (!followArgs.includes("--continue")) throw new Error("follow-up spawn missing --continue");
if (spawnArgs.includes("--continue")) throw new Error("first spawn should not --continue");
console.log(
  "  agents      " +
    agents.map((a) => `${a.id}${a.available ? "" : " (off)"}`).join(", "),
);

const framed = spawnSync("node", [bin, "frame", "lib/evg/agent/fixtures/card.evg.json"], {
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

const dash = frameFixture("dashboard");
const dashFrame = dash.events.find((e) => e.t === "frame");
if (!dashFrame || !(dashFrame.list?.cmds?.length > 8)) {
  throw new Error("dashboard seed produced no cmds");
}
const empty = frameFixture("empty");
const emptyFrame = empty.events.find((e) => e.t === "frame");
if (!emptyFrame) throw new Error("empty seed produced no frame");
if ((emptyFrame.ncmds || 0) >= (dashFrame.ncmds || 0)) {
  throw new Error("empty seed should be smaller than the dashboard");
}
console.log("  seed        dashboard " + dashFrame.ncmds + " cmds, empty " + emptyFrame.ncmds + " cmds");

resetSession("dashboard");
const kept = readSessionDoc();
if (!kept) throw new Error("resetSession wrote no dashboard");
prepareSession("follow-up: make the title gold", { kind: "dashboard" });
if (readSessionDoc() !== kept) throw new Error("follow-up prepareSession wiped the phone");
const taskMd = fs.readFileSync(path.join(sessionDir(), "TASK.md"), "utf8");
if (!/Follow-up/.test(taskMd) || !/nodes/.test(taskMd)) {
  throw new Error("follow-up TASK.md did not describe the live phone");
}
const recipeFollow = [];
await runTask({
  agent: "recipe",
  kind: "dashboard",
  prompt: "Make the title gold",
  session: true,
  onLine: (line) => recipeFollow.push(JSON.parse(line)),
});
const afterRecipe = readSessionDoc();
if (!afterRecipe || afterRecipe.length < kept.length * 0.5) {
  throw new Error("recipe follow-up wiped the phone");
}
if (!recipeFollow.some((e) => e.t === "session" && e.followUp)) {
  throw new Error("recipe follow-up session missing followUp");
}
resetSession("empty");
if (readSessionDoc() === kept) throw new Error("Empty seed did not replace the phone");
console.log("  follow-up   same doc until a seed chip resets it");

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

// A workspace agent that edits through `./evg-agent` should fill the page's
// EVGPatch panel. An empty panel has to mean "this agent rewrote the file by
// hand", never "the ops never reached the host".
if (fs.existsSync(path.join(root, "lib/evg/bin/evg_agent.js"))) {
  const applied = mockEvents.filter((e) => e.t === "ops").flatMap((e) => e.ops || []);
  const prop = applied.find((o) => o.op === "set-prop" && o.prop === "background-color");
  if (!prop) {
    throw new Error("a patch through the workspace shim produced no ops event");
  }
  console.log("  ops         " + applied.length + " from ./evg-agent patch, panel fed");
} else {
  console.log("  ops         skipped — lib/evg/bin/evg_agent.js is not built (npm run agent)");
}

// The layout, left in the workspace where an agent that edits the file by hand
// will find it, and the same numbers on the wire for the page.
{
  resetSession("dashboard");
  const seen = [];
  await runTask({
    agent: "mock",
    kind: "dashboard",
    prompt: "measure me",
    session: true,
    onLine: (line) => seen.push(JSON.parse(line)),
  });
  const file = path.join(sessionDir(), "layout.json");
  if (!fs.existsSync(file)) throw new Error("no layout.json in the workspace after a save");
  const saved = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Number.isFinite(saved.count) || !Number.isFinite(saved.nodes)) {
    throw new Error("layout.json carries no numbers: " + JSON.stringify(saved));
  }
  const streamed = seen.filter((e) => e.t === "measure").at(-1);
  if (!streamed) throw new Error("no measure event reached the page");
  if (streamed.count !== saved.count || streamed.nodes !== saved.nodes) {
    throw new Error("the page and the workspace disagree about the layout");
  }
  console.log(
    `  layout      layout.json + measure agree — ${saved.nodes} nodes, ` +
      `${saved.count} findings, ${saved.bottomFree}px free`,
  );
}

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

// Cursor with --stream-partial-output: half-words, then the whole message once
// more. One thought, whole words, and no second copy of the sentence.
{
  const out = [];
  const feed = makeCursorFeed((line) => out.push(JSON.parse(line)));
  const say = (text) =>
    feed.feed(JSON.stringify({ type: "assistant", message: { content: [{ text }] } }));
  const whole = "Oletus on jo column, joten tekstipino on pystyssa.";
  for (const piece of ["Oletus on jo column, joten tekst", "ip", "ino on ", "pystyssa."]) say(piece);
  say(whole); // the CLI repeats the finished message
  feed.flush();
  const words = out.filter((e) => e.t === "token").map((e) => e.text);
  const thoughts = out.filter((e) => e.t === "think");
  if (words.join(" ") !== whole) {
    throw new Error("cursor deltas did not rejoin into words: " + JSON.stringify(words));
  }
  if (thoughts.length !== 1) {
    throw new Error("a streamed message should be one thought, got " + thoughts.length);
  }
  if (thoughts[0].text !== whole) {
    throw new Error("the thought is not the message: " + thoughts[0].text);
  }
  const tool = [];
  const feed2 = makeCursorFeed((line) => tool.push(JSON.parse(line)));
  feed2.feed(JSON.stringify({ type: "assistant", message: { content: [{ text: "Katson tiedoston." }] } }));
  feed2.feed(JSON.stringify({
    type: "tool_call",
    subtype: "started",
    tool_call: { shellToolCall: { args: { command: "./evg-agent outline doc.evg.json" } } },
  }));
  const order = tool.map((e) => e.t);
  if (order.indexOf("think") < 0 || order.lastIndexOf("think") <= order.indexOf("think")) {
    throw new Error("a tool call should close the thought and open the next: " + order.join(","));
  }
  console.log("  cursor feed " + words.length + " words, 1 thought, no repeat");
}

const missing = agents.filter((a) => !a.available).map((a) => a.id);
if (missing.length) {
  console.log("  skipped     " + missing.join(", ") + " (not on this machine)");
}

console.log("ALL PASS — local orchestrator, recipe + mock + self + Cursor slot");
