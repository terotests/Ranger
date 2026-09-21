#!/usr/bin/env node
/**
 * The orchestrator, without Codex or Claude on PATH: recipe still streams,
 * mock CLI writes a workspace, frames come off the watched file. Gemini is
 * a REST slot — the suite fakes Google rather than spending credits.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listAgents, runTask, root, findCursorAgent, cursorSpawnArgs, frameFixture, resetSession, readSessionDoc, prepareSession, sessionDir, makeCursorFeed, deviceLine, attachmentOf, clearAttachment, ATTACH_BASE } from "./agents.mjs";
import {
  geminiLoop,
  executeTool,
  loadHistory,
  GEMINI_HISTORY,
  denyRun,
  dockerRunArgs,
  parseRun,
  geminiCostUsd,
  formatGeminiSpend,
  summarizeTool,
  splitParts,
  GEMINI_TRACE,
  geminiSystemPrompt,
  looksLikeUnfinishedPlan,
  needsToolNudge,
  dropTrailingPlan,
  slimModelThoughts,
  compactHistory,
  compactToolResult,
  prepareContents,
  payloadStats,
  formatPayloadStats,
  PLAN_NUDGE,
  STALL_NUDGE,
  ADD_CARD,
  OPS_WRITE_CAP,
  recentSightseeing,
  isSightseeingCall,
} from "./gemini-agent.mjs";
import http from "node:http";

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
const gemini = agents.find((a) => a.id === "gemini");
if (!recipe?.available) throw new Error("recipe must always be available");
if (!mock?.available) throw new Error("mock must always be available");
if (!self?.available) throw new Error("self must always be available");
if (!cursor) throw new Error("cursor slot missing from listAgents");
if (!gemini) throw new Error("gemini slot missing from listAgents");
if (!/GEMINI_API_KEY/.test(gemini.hint || "")) {
  throw new Error("gemini hint must mention GEMINI_API_KEY");
}
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
if (!/plan without a tool/.test(taskMd)) {
  throw new Error("follow-up TASK.md must say a plan is not a finish: " + taskMd.slice(0, 400));
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

// A picture attached to the ask reaches the agent as a palette and a patch,
// never as coordinates. The tracer itself is covered by agent:smoke; what this
// checks is the wiring — that the workspace guide says the picture is there
// and how to use it, and that a temp workspace gets the files too.
{
  resetSession("dashboard");
  const dir = sessionDir();
  clearAttachment(dir);
  const guideWithout = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
  if (/A picture was attached/.test(guideWithout)) {
    throw new Error("the guide claims a picture that is not there");
  }
  fs.writeFileSync(
    path.join(dir, `${ATTACH_BASE}.json`),
    JSON.stringify({
      width: 320,
      height: 221,
      layers: 8,
      insertsAt: "0/0",
      placed: "358x247",
      colors: [{ hex: "#E3C8A6", share: 0.223 }, { hex: "#0E184D", share: 0.108 }],
    }),
  );
  fs.writeFileSync(path.join(dir, `${ATTACH_BASE}.svg`), "<svg></svg>\n");
  fs.writeFileSync(path.join(dir, `${ATTACH_BASE}.ops.json`), '{"ops":[]}\n');
  if (!attachmentOf(dir)) throw new Error("the host cannot read back the attachment it wrote");
  prepareSession("use the picture", { kind: "dashboard" });
  const guide = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
  for (const need of ["A picture was attached", "#E3C8A6", `${ATTACH_BASE}.ops.json`, "./evg-image"]) {
    if (!guide.includes(need)) throw new Error(`the guide never mentions ${need}`);
  }
  if (guide.includes("<svg")) throw new Error("the guide is carrying path data — that is what the ops file is for");
  if (!/photograph of a UI, not the UI/.test(guide) || !/rebuild a UI like the picture/.test(guide)) {
    throw new Error("the guide must split paste-the-photo from rebuild-the-UI: " + guide.slice(guide.indexOf("A picture"), guide.indexOf("A picture") + 400));
  }
  console.log("  picture     palette + ops in the guide, no coordinates");
  clearAttachment(dir);
}

// The control kit. A workspace that does not carry `./evg-ui` leaves an agent
// with nothing to do but draw a switch, which is exactly what it did before
// the kit existed — so the door being there is the check, and the ops it
// emits applying to a real document is the proof it is a door and not a
// description of one.
{
  resetSession("dashboard");
  const dir = sessionDir();
  prepareSession("add a switch", { kind: "dashboard" });
  const guide = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
  for (const need of ["./evg-ui list", "./evg-ui add switch", "ui-switch-track"]) {
    if (!guide.includes(need)) throw new Error(`the kit is not in the guide: ${need}`);
  }
  const shim = path.join(dir, "evg-ui");
  if (!fs.existsSync(shim)) throw new Error("no ./evg-ui in the workspace");

  const listed = spawnSync(shim, ["list"], { encoding: "utf8", timeout: 120000 });
  if (!/\bswitch\b/.test(listed.stdout || "")) {
    throw new Error("the kit door answers nothing: " + (listed.stderr || listed.stdout || ""));
  }
  // The PIECES come first in the list, because a row is what an agent is
  // actually building when it reaches for a switch.
  const pieces = (listed.stdout || "").indexOf("PIECES");
  const controls = (listed.stdout || "").indexOf("CONTROLS");
  if (pieces < 0 || controls < 0 || pieces > controls) {
    throw new Error("the pieces are not offered before the controls");
  }
  const doc = path.join(dir, "doc.evg.json");
  const added = spawnSync(shim, ["add", "switch", "--name", "Wi-Fi", "--into", doc], {
    encoding: "utf8",
    timeout: 120000,
  });
  const batch = JSON.parse(added.stdout || "{}");
  if (!batch.ops || !batch.ops.some((o) => o.op === "insert" && o.node)) {
    throw new Error("the kit emitted no insert carrying a control");
  }
  const opsFile = path.join(dir, "kit-ops.json");
  fs.writeFileSync(opsFile, JSON.stringify({ ops: batch.ops }));
  const patched = spawnSync(path.join(dir, "evg-agent"), ["patch", doc, opsFile], {
    encoding: "utf8",
    timeout: 120000,
  });
  // `patch` answers one JSON object, printed over several lines.
  const result = JSON.parse(patched.stdout || "{}");
  if (!result.ok) throw new Error("the kit's own batch was rejected: " + (patched.stdout || patched.stderr));
  const after = fs.readFileSync(doc, "utf8");
  if (!after.includes("ui-switch-thumb")) throw new Error("the control did not land in the document");
  if (!after.includes(".ui-switch-track")) throw new Error("the control's rules did not land in the sheet");
  fs.rmSync(opsFile, { force: true });

  // A WHOLE PIECE. The row is the unit an agent works in, and a card of rows
  // has to arrive with its rules, lay out, and contain a real control rather
  // than a drawn one — which is the whole point of offering it.
  const carded = spawnSync(
    shim,
    ["add", "card", "--row", "Share network|Others can connect|switch:on", "--row", "Privacy||chevron", "--into", doc],
    { encoding: "utf8", timeout: 120000 },
  );
  const cardBatch = JSON.parse(carded.stdout || "{}");
  if (!cardBatch.classes || !cardBatch.classes.includes("ui-row-title")) {
    throw new Error("the card came back without its parts: " + (carded.stderr || carded.stdout));
  }
  const cardOps = path.join(dir, "kit-card.json");
  fs.writeFileSync(cardOps, JSON.stringify({ ops: cardBatch.ops }));
  const cardPatched = spawnSync(path.join(dir, "evg-agent"), ["patch", doc, cardOps], {
    encoding: "utf8",
    timeout: 120000,
  });
  const cardResult = JSON.parse(cardPatched.stdout || "{}");
  if (!cardResult.ok) throw new Error("the card's batch was rejected: " + (cardPatched.stdout || cardPatched.stderr));
  if ((cardResult.layout || {}).drawn) throw new Error("the kit's own card contains a drawn control");
  const withCard = fs.readFileSync(doc, "utf8");
  if (!withCard.includes("ui-row-title") || !withCard.includes(".ui-card")) {
    throw new Error("the card did not land with its rules");
  }
  fs.rmSync(cardOps, { force: true });
  console.log("  kit         ./evg-ui in the workspace: a control and a whole card both apply");
}

// An app workspace gets a different guide, and the tool to work it with. What
// is checked here is the habit the guide has to teach: read the memory first,
// refresh it last — because an agent comes back to a multi-screen app with
// none of the last pass in its head.
{
  resetSession("dashboard");
  const dir = sessionDir();
  fs.rmSync(path.join(dir, "app"), { recursive: true, force: true });
  const plain = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
  if (/This is an app/.test(plain)) throw new Error("a one-screen workspace was told it is an app");
  // The section that was missing, and the reason an agent asked for four tabs
  // went looking inside the compiled tool for a `goto`. A document has no
  // navigation; the guide has to say so, and say what does.
  for (const need of [
    "This document is one screen",
    "presses Run",
    "set-id",
    "nav.",
    "set-css",
    "evg-surface-effect",
    "half a dashboard",
    "Revenuee",
  ]) {
    if (!plain.includes(need)) throw new Error(`a document workspace is never told about ${need}`);
  }
  console.log("  no app yet  a document says it is one screen, and names the way to more");
  fs.cpSync(path.join(here, "fixtures/app"), path.join(dir, "app"), { recursive: true });
  prepareSession("add a fourth screen", { kind: "dashboard" });
  const guide = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
  for (const need of ["This is an app", "app/APP.md", "./evg-app check", "./evg-app memo", "data model"]) {
    if (!guide.includes(need)) throw new Error(`the app guide never mentions ${need}`);
  }
  // Unconditional, and it was not: skipping this when the binary happened to
  // be missing is what let a workspace ship without `./evg-app` for a whole
  // session. `bin/` is ignored by git, so "not built" is the state of every
  // fresh clone — the installer builds it, and this is what says it did.
  if (!fs.existsSync(path.join(dir, "evg-app"))) throw new Error("no ./evg-app in the workspace");
  console.log("  app         guide + ./evg-app, memory first and last");
  // A code app gets the other guide, and the shim has to know the difference
  // without being told — an agent should not carry which kind it is holding.
  fs.cpSync(path.join(here, "fixtures/codeapp"), path.join(dir, "app"), { recursive: true });
  fs.rmSync(path.join(dir, "app", "bin"), { recursive: true, force: true });
  prepareSession("make it a program", { kind: "dashboard" });
  const codeGuide = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
  for (const need of ["This app is a program", "kit.use", "./evg-app build app", "pkg:evg-livebuild"]) {
    if (!codeGuide.includes(need)) throw new Error(`the code-app guide never mentions ${need}`);
  }
  if (codeGuide.includes("pages/<state>.evg.json is the screen")) {
    throw new Error("a code app was told to write page documents");
  }
  const shim = fs.readFileSync(path.join(dir, "evg-app"), "utf8");
  for (const need of ["App.rgr", "ranger.json", "app_module.mjs".slice(0, 3)]) {
    if (!shim.includes(need)) throw new Error(`the shim cannot handle a code app: ${need} missing`);
  }
  console.log("  code app    its own guide, and a shim that compiles before it asks");
  fs.rmSync(path.join(dir, "app"), { recursive: true, force: true });
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

// WHAT THE RUN COST. Both CLIs end a `stream-json` run with a `result` event
// carrying the usage for the whole run, and it used to be dropped on the
// floor — so after watching an agent build a screen the tool could not say
// what building it took. The event below is the real shape `claude -p
// --output-format stream-json --verbose` emits, trimmed to the fields read.
{
  const out = [];
  const feed = makeCursorFeed((line) => out.push(JSON.parse(line)));
  feed.feed(JSON.stringify({ type: "assistant", message: { content: [{ text: "ok" }] } }));
  feed.feed(
    JSON.stringify({
      type: "result",
      subtype: "success",
      total_cost_usd: 0.008233,
      num_turns: 1,
      duration_ms: 2508,
      usage: {
        input_tokens: 2,
        output_tokens: 4,
        cache_read_input_tokens: 40945,
        cache_creation_input_tokens: 0,
      },
      modelUsage: { "claude-sonnet-5": { costUSD: 0.008233 } },
    }),
  );
  const spend = out.find((e) => e.t === "usage");
  if (!spend) throw new Error("a finished run reported no usage: " + JSON.stringify(out));
  if (spend.output !== 4 || spend.cacheRead !== 40945) {
    throw new Error("usage did not carry the run's numbers: " + JSON.stringify(spend));
  }
  // The whole input side, because cache reads are nearly all of it in any
  // agent loop and an "input" that left them out would read as almost free.
  if (spend.readTotal !== 40947) {
    throw new Error("readTotal must be input + cache read + cache write: " + JSON.stringify(spend));
  }
  if (spend.costUsd !== 0.008233 || spend.turns !== 1) {
    throw new Error("usage lost the cost or the turn count: " + JSON.stringify(spend));
  }
  if (!Array.isArray(spend.models) || spend.models[0] !== "claude-sonnet-5") {
    throw new Error("usage did not name the model: " + JSON.stringify(spend));
  }
  // A result with no usage at all must not invent one.
  const bare = [];
  const feed2 = makeCursorFeed((line) => bare.push(JSON.parse(line)));
  feed2.feed(JSON.stringify({ type: "result", subtype: "success" }));
  if (bare.some((e) => e.t === "usage")) {
    throw new Error("a result with no usage reported one anyway: " + JSON.stringify(bare));
  }
  console.log("  spend       a finished run says what it cost: tokens, turns, model, dollars");
}

// WHAT IS LIVE RIGHT NOW. The page has three states and they used to be eight
// scattered `disabled =` lines, which is how the gaps got there: Run left the
// prompt live, an agent mid-build left Run pressable, and a start-over chip
// during Run deleted the app out from under the app that was running.
//
// Asserted against the source rather than a browser, because the point is that
// ONE function owns it — a second owner is exactly the regression.
{
  const page = fs.readFileSync(path.join(here, "web/index.html"), "utf8");
  const start = page.indexOf("function setPhase(phase)");
  if (start < 0) throw new Error("the page has no setPhase — the phase table is gone");
  const fn = page.slice(start, page.indexOf("// One line under the phone", start));
  const must = [
    ["edits are blocked unless idle", /const canEdit = idle;/],
    ["the prompt field is disabled, not just its button", /\$\("prompt"\)\.disabled = !canEdit;/],
    ["start-over chips follow canEdit", /for \(const b of \$\("chips"\)/],
    ["reset follows canEdit", /\$\("reset"\)\.disabled = !canEdit;/],
    // Not `!idle`: leaving Run has to stay possible while in Run.
    ["Run is blocked while working and not while running", /\$\("run"\)\.disabled = working;/],
    ["the spinner is the working phase", /spin\(working\);/],
  ];
  for (const [what, re] of must) {
    if (!re.test(fn)) throw new Error("the phase table no longer says: " + what);
  }
  // A disabled submit button does not stop Enter in the field, so the handler
  // has to check the phase itself.
  if (!/if \(uiPhase !== "idle"\) return;\s*\n\s*start\(true\);/.test(page)) {
    throw new Error("the submit handler does not guard on the phase");
  }
  // Reset leaves Run first: `resetSession` deletes app/, and an app running
  // against a machine that is gone is the worst state this page can reach.
  if (!/if \(runMode\) await leaveRun\(\);/.test(page)) {
    throw new Error("reset does not leave Run mode before emptying the project");
  }
  console.log("  phases      idle / working / running, owned in one place");
}

// THE DEVICE GOES WITH THE ASK.
//
// Picking Tablet and then typing a prompt used to snap the stage back to a
// phone: the frames streamed during a build were laid out at the document's
// own size, because nothing carried the choice into the build. And the agent
// was never told either, so "add a sidebar" on a desktop got a 390-wide phone
// with a sidebar squeezed into it.
{
  if (typeof deviceLine !== "function") throw new Error("deviceLine is gone");
  if (deviceLine(null) !== "") throw new Error("no viewport must add nothing to the ask");
  if (deviceLine({ width: 0, height: 0 }) !== "") throw new Error("an empty viewport must add nothing");

  const tablet = deviceLine({ width: 820, height: 1180 });
  if (!/tablet/.test(tablet) || !/820/.test(tablet) || !/1180/.test(tablet)) {
    throw new Error("the tablet was not named with its size: " + tablet);
  }
  if (!/portrait/.test(tablet)) throw new Error("orientation missing: " + tablet);
  const desk = deviceLine({ width: 1440, height: 900 });
  if (!/desktop/.test(desk) || !/landscape/.test(desk)) {
    throw new Error("a desktop on its side was not described: " + desk);
  }
  // A turned tablet is still a tablet — the name comes from either side.
  if (!/tablet/.test(deviceLine({ width: 1180, height: 820 }))) {
    throw new Error("a landscape tablet lost its name");
  }
  // The point of saying it at all: the root has to BE that size.
  if (!/root must be 820px wide/.test(tablet)) {
    throw new Error("the ask does not tell the agent to build at that size: " + tablet);
  }
  console.log("  device      the ask says which screen it is for, and how big");
}

// Reset empties the PROJECT, not just the picture: the app built from the old
// screen goes too, or Run would drive states named after tabs that are gone.
{
  const dir = resetSession("settings");
  fs.mkdirSync(path.join(dir, "app/pages"), { recursive: true });
  fs.writeFileSync(path.join(dir, "app/machine.json"), '{"id":"app"}\n');
  resetSession("empty");
  if (fs.existsSync(path.join(dir, "app"))) {
    throw new Error("reset left the old app behind");
  }
  const doc = JSON.parse(fs.readFileSync(path.join(dir, "doc.evg.json"), "utf8"));
  if ((doc.root.children || []).length !== 0) {
    throw new Error("an emptied project is not empty: " + JSON.stringify(doc.root).slice(0, 120));
  }
  console.log("  reset       an empty project: blank canvas, and the old app thrown away");
}

// GEMINI FLASH OVER THE NETWORK.
//
// Not the Cursor `agent` CLI: this adapter POSTs to Google's generateContent
// and runs the workspace tools itself. The checks never hit Google — a fake
// fetch / a loopback HTTP server stand in — so a clone without credits still
// proves the loop, the history, and the UI slot.
{
  const savedG = process.env.GEMINI_API_KEY;
  const savedO = process.env.GOOGLE_API_KEY;
  const savedBox = process.env.EVG_GEMINI_SANDBOX;
  process.env.EVG_GEMINI_SANDBOX = "host";
  const restoreKeys = () => {
    if (savedG === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = savedG;
    if (savedO === undefined) delete process.env.GOOGLE_API_KEY;
    else process.env.GOOGLE_API_KEY = savedO;
  };
  const restoreBox = () => {
    if (savedBox === undefined) delete process.env.EVG_GEMINI_SANDBOX;
    else process.env.EVG_GEMINI_SANDBOX = savedBox;
  };

  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;
  try {
    const off = listAgents().find((a) => a.id === "gemini");
    if (!off) throw new Error("gemini slot missing");
    if (off.available) throw new Error("gemini must be off without GEMINI_API_KEY");
    if (!/aistudio|GEMINI_API_KEY/i.test(off.hint || "")) {
      throw new Error("gemini-off hint must name the key: " + off.hint);
    }
    const blocked = [];
    await runTask({
      agent: "gemini",
      kind: "dashboard",
      prompt: "should not call Google",
      onLine: (line) => blocked.push(JSON.parse(line)),
    });
    const err = blocked.find((e) => e.t === "error");
    if (!err || !/GEMINI_API_KEY|not available/i.test(err.text || "")) {
      throw new Error("unavailable gemini should name the key, got " + JSON.stringify(blocked));
    }
  } finally {
    restoreKeys();
  }

  process.env.GEMINI_API_KEY = "test-livebuild-key";
  delete process.env.GOOGLE_API_KEY;
  try {
    const on = listAgents().find((a) => a.id === "gemini");
    if (!on.available) throw new Error("gemini must be available when GEMINI_API_KEY is set");
    if (!/via GEMINI_API_KEY/.test(on.hint || "")) {
      throw new Error("available gemini should name the key: " + on.hint);
    }
  } finally {
    restoreKeys();
  }

  const checkOff = spawnSync(process.execPath, [path.join(here, "withgemini.mjs"), "--check"], {
    encoding: "utf8",
    env: { ...process.env, GEMINI_API_KEY: "", GOOGLE_API_KEY: "" },
    timeout: 8000,
  });
  if (checkOff.status !== 0) throw new Error("withgemini --check off exited " + checkOff.status);
  if (!/gemini API off/.test(checkOff.stdout || "")) {
    throw new Error("withgemini --check should say gemini API off when the key is missing");
  }
  const checkOn = spawnSync(process.execPath, [path.join(here, "withgemini.mjs"), "--check"], {
    encoding: "utf8",
    env: { ...process.env, GEMINI_API_KEY: "test-livebuild-key", GOOGLE_API_KEY: "" },
    timeout: 8000,
  });
  if (checkOn.status !== 0) throw new Error("withgemini --check on exited " + checkOn.status);
  if (!/gemini API ready/.test(checkOn.stdout || "")) {
    throw new Error("withgemini --check did not say ready: " + (checkOn.stdout || checkOn.stderr));
  }
  if (!/\$0\.75 fresh \/ \$0\.075 cache \/ \$3\.75 out per 1M/.test(checkOn.stderr || "")) {
    throw new Error("withgemini --check should print Flash rates including cache: " + (checkOn.stderr || ""));
  }
  const million = geminiCostUsd({ input: 1_000_000, output: 1_000_000 });
  if (Math.abs(million - 4.5) > 1e-9) {
    throw new Error("1M fresh + 1M out should be $4.50 at Flash paid rates, got " + million);
  }
  const cachedOnly = geminiCostUsd({ input: 1_000_000, cacheRead: 1_000_000, output: 0 });
  if (Math.abs(cachedOnly - 0.075) > 1e-9) {
    throw new Error("1M cache-hit input should be $0.075, not full $0.75, got " + cachedOnly);
  }
  const mixed = geminiCostUsd({ input: 1_851_438, fresh: 202_521, cacheRead: 1_648_917, output: 17_223 });
  if (mixed > 0.4 || mixed < 0.3) {
    throw new Error("a 12-turn cache-heavy run should be about $0.34, got " + mixed);
  }
  const about = formatGeminiSpend({ input: 12400, output: 860 });
  if (!/12,400 fresh/.test(about) || !/860 out/.test(about) || !/~\$/.test(about)) {
    throw new Error("spend line should name tokens and dollars: " + about);
  }
  console.log("  withgemini  " + String(checkOn.stdout || "").trim());

  const ws = fs.mkdtempSync(path.join(os.tmpdir(), "evg-gemini-"));
  fs.writeFileSync(path.join(ws, "TASK.md"), "Stamp the workspace.\n");
  fs.writeFileSync(path.join(ws, "doc.evg.json"), '{"root":{"tag":"div","children":[]}}\n');
  const escaped = executeTool(ws, "read_file", { path: "../etc/passwd" });
  if (!escaped.error || !/leaves the workspace/.test(escaped.error)) {
    throw new Error("read_file must refuse a path that leaves the workspace: " + JSON.stringify(escaped));
  }
  for (const [cmd, why] of [
    ["python3 -c 'open(\"/tmp/x\",\"w\")'", "python"],
    ["tesseract ./r0.png stdout --psm 6", "tesseract"],
    ["sips -s format png /tmp/right_0.bmp --out ./r0.png", "sips"],
    ["echo hi > /tmp/x", "echo"],
    ["./evg-agent outline doc.evg.json && python3 -c pass", "python after &&"],
  ]) {
    const blocked = denyRun(cmd);
    if (!blocked) throw new Error("denyRun let through: " + cmd);
    const ran = executeTool(ws, "run", { command: cmd });
    if (!ran.error) throw new Error("run executed a host command: " + cmd);
  }
  if (denyRun("./evg-agent outline doc.evg.json")) {
    throw new Error("denyRun blocked the tool it is for: " + denyRun("./evg-agent outline doc.evg.json"));
  }
  if (denyRun("./evg-ui add switch --into doc.evg.json > add.json")) {
    throw new Error("denyRun blocked a relative redirect");
  }
  const parsed = parseRun("./evg-ui add switch --into doc.evg.json > add.json");
  if (parsed.error || parsed.bin !== "./evg-ui" || parsed.stdoutTo !== "add.json") {
    throw new Error("redirect should be argv + a file, not a shell: " + JSON.stringify(parsed));
  }
  fs.writeFileSync(path.join(ws, "evg-agent"), "#!/bin/sh\nprintf 'outlined\\n'\n", { mode: 0o755 });
  const redirected = executeTool(ws, "run", { command: "./evg-agent outline doc.evg.json > out.txt" }, {
    ...process.env,
    EVG_GEMINI_SANDBOX: "host",
  });
  if (redirected.error) throw new Error("filtered ./evg-agent should run: " + redirected.error);
  if (fs.readFileSync(path.join(ws, "out.txt"), "utf8") !== "outlined\n") {
    throw new Error("redirect was not applied by the host: " + (redirected.stdout || ""));
  }
  const dargs = dockerRunArgs("/tmp/evg-ws", "./evg-agent outline doc.evg.json", {
    EVG_GEMINI_DOCKER_IMAGE: "node:22-bookworm-slim",
    EVG_GEMINI_REPO: "/opt/ranger",
  });
  const djoin = dargs.join(" ");
  if (!dargs.includes("--network") || !djoin.includes("none")) {
    throw new Error("the container must have no network: " + djoin);
  }
  if (!dargs.includes("--read-only")) throw new Error("the container rootfs must be read-only");
  if (!djoin.includes("/opt/ranger:/opt/ranger:ro")) {
    throw new Error("the repo must be read-only in the container: " + djoin);
  }
  if (dargs.includes("sh") && dargs.includes("-c")) {
    throw new Error("docker must exec argv, not sh -c: " + djoin);
  }
  if (dargs.at(-3) !== "./evg-agent" || dargs.at(-1) !== "doc.evg.json") {
    throw new Error("docker argv lost the command: " + djoin);
  }
  console.log("  gemini run  filtered argv, no shell; docker has no net, repo ro");

  fs.mkdirSync(path.join(ws, "shots"));
  fs.writeFileSync(path.join(ws, ".hidden"), "nope\n");
  fs.writeFileSync(path.join(ws, GEMINI_HISTORY), JSON.stringify({ contents: [] }));
  fs.writeFileSync(path.join(ws, "evg_agent.js"), "/* compiled */\n");
  const listed = executeTool(ws, "list_dir", {});
  const names = (listed.entries || []).map((e) => e.name);
  if (names.includes(".hidden") || names.includes(GEMINI_HISTORY)) {
    throw new Error("list_dir must omit hidden files: " + names.join(","));
  }
  if (!names.includes("doc.evg.json") || !names.includes("shots")) {
    throw new Error("list_dir missed workspace files: " + names.join(","));
  }
  if ((listed.entries || []).find((e) => e.name === "shots")?.kind !== "dir") {
    throw new Error("list_dir should mark shots as a dir");
  }
  const histRead = executeTool(ws, "read_file", { path: GEMINI_HISTORY });
  if (!histRead.error || !/conversation log/.test(histRead.error)) {
    throw new Error("read_file must refuse the conversation log: " + JSON.stringify(histRead));
  }
  const js = executeTool(ws, "read_file", { path: "evg_agent.js" });
  if (!js.error || !/compiled tool/.test(js.error)) {
    throw new Error("read_file must refuse compiled JS: " + JSON.stringify(js));
  }
  const histWrite = executeTool(ws, "write_file", { path: GEMINI_HISTORY, contents: "nope" });
  if (!histWrite.error || !/conversation log/.test(histWrite.error)) {
    throw new Error("write_file must refuse the conversation log: " + JSON.stringify(histWrite));
  }
  const replaceDoc = executeTool(ws, "write_file", { path: "doc.evg.json", contents: "{}" });
  if (!replaceDoc.error || !/patch/.test(replaceDoc.error)) {
    throw new Error("write_file must refuse a whole-document replace: " + JSON.stringify(replaceDoc));
  }
  const fakeLayout = executeTool(ws, "write_file", { path: "layout.json", contents: "{}" });
  if (!fakeLayout.error || !/measure/.test(fakeLayout.error)) {
    throw new Error("write_file must refuse layout.json: " + JSON.stringify(fakeLayout));
  }
  const opsRead = executeTool(ws, "read_file", { path: "attachment.ops.json" });
  if (!opsRead.error || !/path data/.test(opsRead.error)) {
    throw new Error("read_file must refuse attachment.ops.json: " + JSON.stringify(opsRead));
  }
  const guideRead = executeTool(ws, "read_file", { path: "AGENTS.md" });
  if (!guideRead.error || !/system prompt/.test(guideRead.error)) {
    throw new Error("read_file must refuse AGENTS.md: " + JSON.stringify(guideRead));
  }
  fs.writeFileSync(path.join(ws, "fat.evg.json"), `${"{\"tag\":\"div\"},".repeat(400)}\n`);
  const fat = executeTool(ws, "read_file", { path: "fat.evg.json" });
  if (fat.contents || !fat.hint || !/outline/.test(fat.hint) || !(fat.bytes > 1500)) {
    throw new Error("read_file must not dump a fat .evg.json into the prompt: " + JSON.stringify(fat));
  }
  const boom = summarizeTool("run", { command: "./evg-ui add button --name test" }, {
    ok: false,
    status: 1,
    stdout: "",
    stderr: "TypeError: host.plainTreeJson is not a function\n",
  });
  if (!/plainTreeJson/.test(boom.reply)) {
    throw new Error("a failed ./evg-ui must show stderr, not just exit 1: " + JSON.stringify(boom));
  }
  const checked = summarizeTool("run", { command: "./evg-app check app" }, {
    ok: true,
    status: 0,
    stdout: JSON.stringify({
      count: 7,
      missing: ["nav.home", "nav.orders"],
      findings: ["home and orders share a document"],
      next: "give what should switch tabs those ids",
    }),
    stderr: "",
  });
  if (!/missing nav.home/.test(checked.reply) || !/share a document/.test(checked.reply)) {
    throw new Error("evg-app check must show missing ids, not only count: " + JSON.stringify(checked));
  }
  const badId = summarizeTool("run", { command: "./evg-agent patch doc.evg.json ops.json" }, {
    ok: false,
    status: 1,
    stdout: JSON.stringify({
      ok: false,
      applied: 0,
      rejected: ['op 0 (set-prop 0/6/0 id=nav.home): property "id" is not patchable — nothing here can read it back, so the edit could not be undone'],
    }),
    stderr: "",
  });
  if (!/set-id/.test(badId.reply)) {
    throw new Error("a rejected set-prop id must name set-id: " + JSON.stringify(badId));
  }
  const queried = summarizeTool("run", { command: "./evg-agent query doc.evg.json 0/5" }, {
    ok: true,
    status: 0,
    stdout: JSON.stringify({
      matches: [{
        at: "0/5",
        tag: "div",
        props: { height: "50px", "padding-top": "8px", gap: "8px", "background-color": "rgb(22,27,34)" },
        children: 4,
      }],
      count: 1,
    }),
    stderr: "",
  });
  if (!/0\/5/.test(queried.reply) || !/height=50px/.test(queried.reply) || !/children:4/.test(queried.reply)) {
    throw new Error("query must show the match, not only count: " + JSON.stringify(queried));
  }
  const boxed = summarizeTool("run", { command: "./evg-agent measure doc.evg.json --boxes" }, {
    ok: true,
    status: 0,
    stdout: JSON.stringify({
      width: 390,
      height: 844,
      nodes: 20,
      count: 1,
      bottomFree: -1,
      findings: ["0/5: bottom edge 844 is past the page height 844"],
      boxes: [
        { at: "0/0", x: 16, y: 16, w: 358, h: 80, gapNext: 8 },
        { at: "0/5", x: 0, y: 795, w: 390, h: 50, gapNext: 0 },
      ],
    }),
    stderr: "",
  });
  if (!/bottomFree:-1/.test(boxed.reply) || !/0\/5 \[0,795,390,50\]/.test(boxed.reply)) {
    throw new Error("measure --boxes must name the box and bottomFree: " + JSON.stringify(boxed));
  }
  const badStyle = summarizeTool("run", { command: "./evg-agent patch doc.evg.json ops.json" }, {
    ok: false,
    status: 1,
    stdout: JSON.stringify({
      ok: false,
      applied: 0,
      rejected: ['op 0 (set-prop 0 style=display:flex): property "style" is not patchable — nothing here can read it back, so the edit could not be undone'],
    }),
    stderr: "",
  });
  if (!/padding-top/.test(badStyle.reply) || !/one CSS name/.test(badStyle.reply)) {
    throw new Error("rejected style= must name a single CSS prop: " + JSON.stringify(badStyle));
  }
  const emptyOps = summarizeTool("run", { command: "./evg-agent patch doc.evg.json ops.json" }, {
    ok: false,
    status: 1,
    stdout: JSON.stringify({ error: "no ops in that file" }),
    stderr: "",
  });
  if (!/"ops"/.test(emptyOps.reply) || !/set-prop/.test(emptyOps.reply)) {
    throw new Error("empty ops.json must say how to write one: " + JSON.stringify(emptyOps));
  }
  if (!denyRun("./evg-agent") || !/verb/.test(denyRun("./evg-agent"))) {
    throw new Error("bare ./evg-agent must be denied: " + denyRun("./evg-agent"));
  }
  if (!denyRun("./evg-ui") || !/add/.test(denyRun("./evg-ui"))) {
    throw new Error("bare ./evg-ui must be denied: " + denyRun("./evg-ui"));
  }
  if (!denyRun("./evg-ui list") || !/add/.test(denyRun("./evg-ui list"))) {
    throw new Error("./evg-ui list must be denied: " + denyRun("./evg-ui list"));
  }
  if (denyRun("./evg-ui add card --title T --into doc.evg.json > add.json")) {
    throw new Error("add card must stay allowed: " + denyRun("./evg-ui add card --title T --into doc.evg.json > add.json"));
  }
  const emptyProp = summarizeTool("run", { command: "./evg-agent patch doc.evg.json ops.json" }, {
    ok: false,
    status: 1,
    stdout: JSON.stringify({
      ok: false,
      applied: 0,
      rejected: ['op 0 (set-prop 0=column): property "" is not patchable — nothing here can read it back, so the edit could not be undone'],
    }),
    stderr: "",
  });
  if (!/flex-direction/.test(emptyProp.reply) || !/prop/.test(emptyProp.reply)) {
    throw new Error("empty set-prop must name prop+value: " + JSON.stringify(emptyProp));
  }
  const missingProp = executeTool(ws, "write_file", {
    path: "ops-noprop.json",
    contents: '{"ops":[{"op":"set-prop","at":"0","value":"column"}]}',
  });
  if (!missingProp.error || !/prop/.test(missingProp.error)) {
    throw new Error("write_file must refuse set-prop without prop: " + JSON.stringify(missingProp));
  }
  const emptySeed = summarizeTool("run", { command: "./evg-agent outline doc.evg.json" }, {
    ok: true,
    status: 0,
    stdout: "0                     div  display=flex  width=390px  height=844px\n",
    stderr: "",
  });
  if (!/empty seed/.test(emptySeed.reply) || !/add card/.test(emptySeed.reply)) {
    throw new Error("an empty outline must say add card: " + JSON.stringify(emptySeed));
  }
  const taskRead = executeTool(ws, "read_file", { path: "TASK.md" });
  if (!taskRead.error || !/already the ask/.test(taskRead.error)) {
    throw new Error("read_file TASK.md must be refused: " + JSON.stringify(taskRead));
  }
  const addRead = executeTool(ws, "read_file", { path: "add.json" });
  if (!addRead.error || !/patch/.test(addRead.error)) {
    throw new Error("read_file add.json must be refused: " + JSON.stringify(addRead));
  }
  if (!isSightseeingCall("ocr", {}) || !isSightseeingCall("run", { command: "./evg-agent outline doc.evg.json" })) {
    throw new Error("ocr and outline must count as sightseeing");
  }
  if (isSightseeingCall("run", { command: "./evg-ui add card --title T --into doc.evg.json" })) {
    throw new Error("add card must not count as sightseeing");
  }
  const stallHist = [
    { role: "model", parts: [{ functionCall: { name: "run", args: { command: "./evg-agent outline doc.evg.json" } } }] },
    { role: "model", parts: [{ functionCall: { name: "image_info", args: {} } }] },
    { role: "model", parts: [{ functionCall: { name: "ocr", args: {} } }] },
    { role: "model", parts: [{ functionCall: { name: "ocr", args: {} } }] },
  ];
  if (!recentSightseeing(stallHist, 4)) {
    throw new Error("four explore tools must look like a stall");
  }
  if (!STALL_NUDGE.includes("add card") || !ADD_CARD.includes("add card")) {
    throw new Error("stall nudge must name add card");
  }
  const wrapHint = executeTool(ws, "write_file", {
    path: "ops.json",
    contents: '{"op":"set-prop","at":"0/5","prop":"height","value":"48px"}',
  });
  if (!wrapHint.error || !/ops array/.test(wrapHint.error)) {
    throw new Error("write_file must refuse a bare op object: " + JSON.stringify(wrapHint));
  }
  const emptyArr = executeTool(ws, "write_file", { path: "ops.json", contents: '{"ops":[]}' });
  if (!emptyArr.error || !/empty/.test(emptyArr.error)) {
    throw new Error("write_file must refuse an empty ops array: " + JSON.stringify(emptyArr));
  }
  const compactBoxes = compactToolResult("run", { command: "./evg-agent measure --boxes" }, {
    ok: true,
    status: 0,
    stdout: JSON.stringify({
      count: 1,
      bottomFree: -1,
      findings: ["0/5: bottom edge 844 is past the page height 844"],
      boxes: [
        ...Array.from({ length: 40 }, (_, i) => ({
          at: `0/${i === 5 ? 99 : i}`,
          x: 0,
          y: i * 20,
          w: 390,
          h: 18,
          gapNext: 2,
        })),
        { at: "0/5", x: 0, y: 795, w: 390, h: 50, gapNext: 0 },
      ],
    }),
    stderr: "",
  });
  const boxedJson = JSON.stringify(compactBoxes);
  if (boxedJson.length > 2_500) {
    throw new Error("compactToolResult must keep measure boxes small: " + boxedJson.length);
  }
  if (!boxedJson.includes('"at":"0/5"') || !/795/.test(boxedJson)) {
    throw new Error("compactToolResult must keep the finding box, not clip it off the end: " + boxedJson);
  }
  if (!compactBoxes.boxes || compactBoxes.boxes[0].at !== "0/5") {
    throw new Error("finding box should be first: " + boxedJson);
  }
  if (compactBoxes.boxes.length > 12) {
    throw new Error("compactToolResult should cap boxes: " + compactBoxes.boxes.length);
  }
  const prompt = geminiSystemPrompt();
  for (const need of [
    "ocr attachment.png at most ONCE",
    '"node"',
    "820×1180",
    "./evg-ui",
    "Do not read AGENTS.md",
    "A thought is not a patch",
    "Acme 360",
    "Revenuee",
    "jatka",
    "One card per write_file",
    "2000 bytes",
    "set-id",
    "nav.home",
    "Never read_file a .evg.json",
    "one CSS name",
    "do not query every sibling",
    '{"ops":[...]}',
    "NEXT tool is ./evg-ui add card",
    "TASK.md is already this message",
  ]) {
    if (!prompt.includes(need)) throw new Error("gemini system prompt missing " + need);
  }
  if (!looksLikeUnfinishedPlan("", "Now, let's get Section 3 built. This is the main 2-column layout.")) {
    throw new Error("a Section-3 thought with no tool must look unfinished");
  }
  if (!looksLikeUnfinishedPlan("I will add the products card next and write ops.json.")) {
    throw new Error("an I'll-add spoken plan must look unfinished");
  }
  if (!looksLikeUnfinishedPlan("", "write_file NOW with the complete ops.json")) {
    throw new Error("write_file NOW must look unfinished");
  }
  if (looksLikeUnfinishedPlan("Gold.")) {
    throw new Error("a short finish must not look like a plan");
  }
  if (looksLikeUnfinishedPlan("The stamp is there.")) {
    throw new Error("a short completion must not look like a plan");
  }
  if (looksLikeUnfinishedPlan("The outline matches the ask. Done.")) {
    throw new Error("an explicit finish must not look like a plan");
  }
  if (!needsToolNudge({ finishReason: "MAX_TOKENS" })) {
    throw new Error("MAX_TOKENS with no functionCall must nudge");
  }
  if (!needsToolNudge({ outputTokens: 8200, text: "…" })) {
    throw new Error("an 8k candidate with no tool must nudge");
  }
  if (!PLAN_NUDGE.includes("plan is not a patch") || !/ONE card/.test(PLAN_NUDGE)) {
    throw new Error("PLAN_NUDGE must name the failure: " + PLAN_NUDGE);
  }
  const essay = dropTrailingPlan([
    { role: "user", parts: [{ text: "build it" }] },
    { role: "model", parts: [{ text: "Now, let's get Section 3 built. Left column products.", thought: true }] },
    { role: "user", parts: [{ text: PLAN_NUDGE }] },
  ]);
  if (essay.length !== 1 || essay[0].parts[0].text !== "build it") {
    throw new Error("dropTrailingPlan should strip the essay and the nudge: " + JSON.stringify(essay));
  }
  const slimed = slimModelThoughts([
    { role: "model", parts: [{ text: "x".repeat(2000), thought: true, thoughtSignature: "keep" }] },
  ]);
  if (slimed[0].parts[0].text.length > 700 || slimed[0].parts[0].thoughtSignature !== "keep") {
    throw new Error("slimModelThoughts should clip thoughts and keep the signature: " + JSON.stringify(slimed));
  }
  const longHist = [
    { role: "user", parts: [{ text: "build it" }] },
    ...Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 ? "user" : "model",
      parts: [
        i % 2
          ? { functionResponse: { name: "read_file", response: { contents: "x".repeat(8000) } } }
          : { functionCall: { name: "read_file", args: { path: "doc.evg.json" } } },
      ],
    })),
  ];
  const folded = compactHistory(longHist, { keep: 6, cap: 24_000 });
  if (folded.length > 10) throw new Error("compactHistory should fold old turns: " + folded.length);
  if (!JSON.stringify(folded).includes("compacted")) {
    throw new Error("compactHistory should leave a snapshot: " + JSON.stringify(folded[1]));
  }
  if (JSON.stringify(folded).length > 20_000) {
    throw new Error("compacted history still huge: " + JSON.stringify(folded).length);
  }
  const packed = compactToolResult("read_file", { path: "doc.evg.json" }, { path: "doc.evg.json", contents: "y".repeat(8000) });
  if (packed.contents || !packed.hint) {
    throw new Error("compactToolResult must drop a fat read: " + JSON.stringify(packed));
  }
  const sent = payloadStats({
    systemInstruction: { parts: [{ text: "sys" }] },
    tools: [{ functionDeclarations: [{ name: "run" }] }],
    contents: folded,
  });
  if (!/msgs/.test(formatPayloadStats(sent)) || sent.msgs !== folded.length) {
    throw new Error("payloadStats should describe the request: " + JSON.stringify(sent));
  }
  const prepared = prepareContents(longHist, { EVG_GEMINI_HISTORY_KEEP: "6" });
  if (prepared.length > 10) throw new Error("prepareContents should compact: " + prepared.length);
  const hugeOps = executeTool(ws, "write_file", {
    path: "ops.json",
    contents: `{"ops":[${"{\"op\":\"set-text\",\"at\":\"0\",\"value\":\"n\"},".repeat(200)}]}`,
  });
  if (!hugeOps.error || !/one card/.test(hugeOps.error) || hugeOps.error.indexOf(String(OPS_WRITE_CAP)) < 0) {
    throw new Error("write_file must refuse a whole-page ops.json: " + JSON.stringify(hugeOps));
  }
  fs.writeFileSync(
    path.join(ws, "attachment.json"),
    JSON.stringify({
      width: 320,
      height: 221,
      layers: 8,
      colors: [{ hex: "#E3C8A6", share: 0.223 }],
    }),
  );
  const palette = executeTool(ws, "image_info", {});
  if (palette.kind !== "palette" || palette.colors?.[0]?.hex !== "#E3C8A6") {
    throw new Error("image_info should return the traced palette: " + JSON.stringify(palette));
  }
  const png = Buffer.alloc(24);
  png[0] = 0x89;
  png[1] = 0x50;
  png[2] = 0x4e;
  png[3] = 0x47;
  png[4] = 0x0d;
  png[5] = 0x0a;
  png[6] = 0x1a;
  png[7] = 0x0a;
  png.writeUInt32BE(13, 8);
  png.write("IHDR", 12);
  png.writeUInt32BE(390, 16);
  png.writeUInt32BE(844, 20);
  fs.writeFileSync(path.join(ws, "attachment.png"), png);
  const size = executeTool(ws, "image_info", { path: "attachment.png" });
  if (size.kind !== "png" || size.width !== 390 || size.height !== 844) {
    throw new Error("image_info should read the PNG header: " + JSON.stringify(size));
  }
  const ocrLeave = executeTool(ws, "ocr", { path: "../etc/passwd" });
  if (!ocrLeave.error || !/leaves the workspace/.test(ocrLeave.error)) {
    throw new Error("ocr must stay in the workspace: " + JSON.stringify(ocrLeave));
  }
  const ocrJson = executeTool(ws, "ocr", { path: "attachment.json" });
  if (!ocrJson.error || !/only reads images/.test(ocrJson.error)) {
    throw new Error("ocr must refuse a JSON file: " + JSON.stringify(ocrJson));
  }
  const missingBin = executeTool(ws, "ocr", { path: "attachment.png" }, {
    ...process.env,
    TESSERACT_PATH: path.join(ws, "no-such-tesseract"),
  });
  if (!missingBin.error || !/not installed/.test(missingBin.error)) {
    throw new Error("ocr should name a missing tesseract: " + JSON.stringify(missingBin));
  }
  const tess = path.join(ws, "fake-tesseract");
  fs.writeFileSync(
    tess,
    "#!/usr/bin/env node\nprocess.stdout.write('Follow up\\nSettings\\n');\n",
    { mode: 0o755 },
  );
  const ocred = executeTool(ws, "ocr", { path: "attachment.png", psm: 6 }, {
    ...process.env,
    TESSERACT_PATH: tess,
  });
  if (ocred.error || !/Follow up/.test(ocred.text || "")) {
    throw new Error("ocr stub should return text: " + JSON.stringify(ocred));
  }
  if (ocred.path !== "attachment.png" || ocred.lang !== "eng") {
    throw new Error("ocr should echo path and lang: " + JSON.stringify(ocred));
  }
  const ocrDefault = executeTool(ws, "ocr", {}, { ...process.env, TESSERACT_PATH: tess });
  if (!ocrDefault.error || !/already ran/.test(ocrDefault.error)) {
    throw new Error("second ocr must be refused: " + JSON.stringify(ocrDefault));
  }
  const imageAgain = executeTool(ws, "image_info", {});
  if (!imageAgain.error || !/already ran/.test(imageAgain.error)) {
    throw new Error("second image_info on the same path must be refused: " + JSON.stringify(imageAgain));
  }
  console.log("  gemini host list_dir / image_info / ocr; archaeology reads refused");

  const requests = [];
  let calls = 0;
  const fetchImpl = async (url, opts) => {
    const body = JSON.parse(opts.body);
    requests.push({ url, key: opts.headers["x-goog-api-key"], body });
    calls += 1;
    if (calls === 1) {
      if (!/generateContent/.test(url)) throw new Error("expected generateContent, got " + url);
      if (opts.headers["x-goog-api-key"] !== "test-livebuild-key") {
        throw new Error("API key was not sent as x-goog-api-key");
      }
      const decls = (((body.tools || [])[0] || {}).functionDeclarations || []).map((t) => t.name);
      for (const need of ["run", "read_file", "write_file", "list_dir", "image_info", "ocr"]) {
        if (!decls.includes(need)) throw new Error("Gemini tools missing " + need);
      }
      if (body.generationConfig?.thinkingConfig?.includeThoughts !== true) {
        throw new Error("includeThoughts must be on so the console can show the thought");
      }
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            candidates: [
              {
                content: {
                  role: "model",
                  parts: [
                    { text: "Stamp a small file, do not rewrite the phone.", thought: true },
                    { text: "I will stamp the folder." },
                    {
                      functionCall: { name: "write_file", args: { path: "stamp.txt", contents: "gemini-ok\n" } },
                      thoughtSignature: "sig-keep",
                    },
                  ],
                },
                finishReason: "STOP",
              },
            ],
            usageMetadata: { promptTokenCount: 80, candidatesTokenCount: 12, cachedContentTokenCount: 5 },
          }),
      };
    }
    const hist = body.contents || [];
    const modelTurn = hist.find((c) => c.role === "model");
    const sig = ((modelTurn && modelTurn.parts) || []).find((p) => p.thoughtSignature);
    if (!sig || sig.thoughtSignature !== "sig-keep") {
      throw new Error("thought signature was not returned to Gemini: " + JSON.stringify(modelTurn));
    }
    const tool = hist.find((c) => (c.parts || []).some((p) => p.functionResponse));
    if (!tool) throw new Error("functionResponse was not sent back");
    return {
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          candidates: [
            {
              content: { role: "model", parts: [{ text: "The stamp is there." }] },
              finishReason: "STOP",
            },
          ],
          usageMetadata: { promptTokenCount: 90, candidatesTokenCount: 6 },
        }),
    };
  };

  const events = [];
  const looped = await geminiLoop({
    workspace: ws,
    onEvent: (e) => events.push(e),
    fetchImpl,
    env: { ...process.env, GEMINI_API_KEY: "test-livebuild-key", GOOGLE_API_KEY: "", EVG_GEMINI_MODEL: "gemini-3.8-flash" },
  });
  if (!looped.ok) throw new Error("geminiLoop did not finish ok");
  if (!fs.existsSync(path.join(ws, "stamp.txt"))) throw new Error("Gemini run tool did not execute");
  const stamp = fs.readFileSync(path.join(ws, "stamp.txt"), "utf8");
  if (!/gemini-ok/.test(stamp)) throw new Error("stamp.txt was wrong: " + stamp);
  if (!events.some((e) => e.type === "assistant" && /Stamp a small file/.test(JSON.stringify(e)))) {
    throw new Error("thought parts must reach the page: " + JSON.stringify(events.filter((e) => e.type === "assistant")));
  }
  if (!events.some((e) => e.type === "assistant")) throw new Error("no assistant events");
  if (!events.some((e) => e.type === "tool_call")) throw new Error("no tool_call events");
  const shown = events.find((e) => e.type === "tool_call");
  const cmd = shown?.tool_call?.shellToolCall?.args?.command || "";
  if (!/stamp\.txt/.test(cmd) || !/bytes/.test(cmd) || !/wrote/.test(cmd)) {
    throw new Error("tool_call should say what was written: " + cmd);
  }
  if (!fs.existsSync(path.join(ws, GEMINI_TRACE))) throw new Error("the run left no .gemini-trace.log");
  const parts = splitParts([{ text: "hidden plan", thought: true }, { text: "visible" }]);
  if (parts.thought !== "hidden plan" || parts.text !== "visible") {
    throw new Error("splitParts must keep thoughts out of the spoken text: " + JSON.stringify(parts));
  }
  const denied = summarizeTool("write_file", { path: "doc.evg.json", contents: '{"root":{"tag":"div","children":[]}}' }, {
    error: "write_file will not replace doc.evg.json — write ops.json, then ./evg-agent patch",
  });
  if (!/whole EVG tree/.test(denied.call) || !/will not replace/.test(denied.reply)) {
    throw new Error("a document replace should be named as one: " + JSON.stringify(denied));
  }
  const spend = events.find((e) => e.type === "result");
  if (!spend || spend.usage.output_tokens !== 18) {
    throw new Error("usage did not add both turns: " + JSON.stringify(spend));
  }
  if (!spend.modelUsage["gemini-3.8-flash"]) throw new Error("result did not name the model");
  if (spend.usage.input_tokens !== 165 || spend.usage.cache_read_input_tokens !== 5) {
    throw new Error("usage should split cache out of the prompt: " + JSON.stringify(spend.usage));
  }
  const expectCost = geminiCostUsd({ input: 170, fresh: 165, cacheRead: 5, output: 18 });
  if (typeof spend.total_cost_usd !== "number" || Math.abs(spend.total_cost_usd - expectCost) > 1e-12) {
    throw new Error("result should carry the Flash about-cost: " + JSON.stringify(spend));
  }
  if (Math.abs((spend.modelUsage["gemini-3.8-flash"].costUSD || 0) - expectCost) > 1e-12) {
    throw new Error("modelUsage should carry costUSD: " + JSON.stringify(spend.modelUsage));
  }
  const hist = loadHistory(ws);
  if (hist.length < 4) throw new Error("history too short to continue a Follow-up: " + hist.length);
  fs.writeFileSync(path.join(ws, "TASK.md"), "Now make the title gold.\n");
  let followCalls = 0;
  const followFetch = async (url, opts) => {
    const body = JSON.parse(opts.body);
    followCalls += 1;
    if (followCalls === 1) {
      if ((body.contents || []).length < 5) {
        throw new Error("Follow-up did not replay history: " + (body.contents || []).length);
      }
      const last = body.contents[body.contents.length - 1];
      const text = (((last.parts || [])[0] || {}).text) || "";
      if (!/title gold/.test(text)) throw new Error("Follow-up task missing: " + text);
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            candidates: [{ content: { role: "model", parts: [{ text: "Gold." }] }, finishReason: "STOP" }],
            usageMetadata: { promptTokenCount: 40, candidatesTokenCount: 2 },
          }),
      };
    }
    throw new Error("Follow-up made a second API call");
  };
  await geminiLoop({
    workspace: ws,
    onEvent: () => {},
    fetchImpl: followFetch,
    env: { ...process.env, GEMINI_API_KEY: "test-livebuild-key" },
  });
  console.log("  gemini loop tool + history, thought signature kept, Follow-up continues");

  {
    const capWs = fs.mkdtempSync(path.join(os.tmpdir(), "evg-gemini-cap-"));
    fs.writeFileSync(path.join(capWs, "TASK.md"), "never finish\n");
    let n = 0;
    const alwaysTool = async () => {
      n += 1;
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            candidates: [
              {
                content: {
                  role: "model",
                  parts: [{ functionCall: { name: "run", args: { command: "true" } } }],
                },
                finishReason: "STOP",
              },
            ],
            usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
          }),
      };
    };
    let hit = "";
    try {
      await geminiLoop({
        workspace: capWs,
        onEvent: () => {},
        fetchImpl: alwaysTool,
        env: { ...process.env, GEMINI_API_KEY: "test-livebuild-key", EVG_GEMINI_MAX_TURNS: "3" },
      });
    } catch (e) {
      hit = String(e.message || e);
    }
    if (!/EVG_GEMINI_MAX_TURNS \(3\)/.test(hit)) {
      throw new Error("the turn cap was not honoured: " + hit);
    }
    if (n !== 3) throw new Error("expected 3 API calls under a cap of 3, got " + n);
    console.log("  gemini cap  EVG_GEMINI_MAX_TURNS=3 stops the loop");
  }

  {
    const planWs = fs.mkdtempSync(path.join(os.tmpdir(), "evg-gemini-plan-"));
    fs.writeFileSync(path.join(planWs, "TASK.md"), "Finish the tablet dashboard.\n");
    let n = 0;
    const planFetch = async (_url, opts) => {
      const body = JSON.parse(opts.body);
      n += 1;
      if (n === 1) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              candidates: [
                {
                  content: {
                    role: "model",
                    parts: [
                      {
                        text: "Now, let's get Section 3 built. Left column products, right column feed.",
                        thought: true,
                      },
                    ],
                  },
                  finishReason: "STOP",
                },
              ],
              usageMetadata: { promptTokenCount: 20, candidatesTokenCount: 8, thoughtsTokenCount: 8 },
            }),
        };
      }
      if (n === 2) {
        const last = body.contents[body.contents.length - 1];
        const asked = (((last && last.parts) || [])[0] || {}).text || "";
        if (!/plan is not a patch/.test(asked)) {
          throw new Error("the host did not nudge a plan-only turn: " + asked);
        }
        if (body.toolConfig?.functionCallingConfig?.mode !== "ANY") {
          throw new Error("the retry must force a tool call: " + JSON.stringify(body.toolConfig));
        }
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              candidates: [
                {
                  content: {
                    role: "model",
                    parts: [
                      {
                        functionCall: { name: "write_file", args: { path: "body.txt", contents: "products\n" } },
                      },
                    ],
                  },
                  finishReason: "STOP",
                },
              ],
              usageMetadata: { promptTokenCount: 24, candidatesTokenCount: 6 },
            }),
        };
      }
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            candidates: [{ content: { role: "model", parts: [{ text: "The outline names the products card." }] }, finishReason: "STOP" }],
            usageMetadata: { promptTokenCount: 28, candidatesTokenCount: 4 },
          }),
      };
    };
    const planEvents = [];
    const planned = await geminiLoop({
      workspace: planWs,
      onEvent: (e) => planEvents.push(e),
      fetchImpl: planFetch,
      env: { ...process.env, GEMINI_API_KEY: "test-livebuild-key" },
    });
    if (!planned.ok) throw new Error("plan-nudge loop did not finish ok");
    if (n !== 3) throw new Error("expected outline-plan → nudge → tool → done (3 API calls), got " + n);
    if (!fs.existsSync(path.join(planWs, "body.txt"))) {
      throw new Error("the nudge did not produce the follow-up tool call");
    }
    if (!planEvents.some((e) => e.type === "assistant" && /plan is not a patch/.test(JSON.stringify(e)))) {
      throw new Error("the page should see the host nudge");
    }
    fs.rmSync(planWs, { recursive: true, force: true });
    console.log("  gemini plan  a Section-3 thought without a tool is nudged, not finished");
  }

  {
    const stuckWs = fs.mkdtempSync(path.join(os.tmpdir(), "evg-gemini-stuck-"));
    fs.writeFileSync(path.join(stuckWs, "TASK.md"), "Finish the tablet dashboard.\n");
    let n = 0;
    const alwaysPlan = async () => {
      n += 1;
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            candidates: [
              {
                content: {
                  role: "model",
                  parts: [{ text: "I will write_file the complete ops.json now.", thought: true }],
                },
                finishReason: "MAX_TOKENS",
              },
            ],
            usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 8000, thoughtsTokenCount: 20 },
          }),
      };
    };
    let hit = "";
    try {
      await geminiLoop({
        workspace: stuckWs,
        onEvent: () => {},
        fetchImpl: alwaysPlan,
        env: { ...process.env, GEMINI_API_KEY: "test-livebuild-key", EVG_GEMINI_MAX_TURNS: "8" },
      });
    } catch (e) {
      hit = String(e.message || e);
    }
    if (!/never called a tool/.test(hit)) {
      throw new Error("a MAX_TOKENS essay must not report success: " + hit);
    }
    if (n !== 4) throw new Error("expected 3 nudges then an error on the 4th turn, got " + n + " — " + hit);
    fs.rmSync(stuckWs, { recursive: true, force: true });
    console.log("  gemini stuck  MAX_TOKENS with no tool errors instead of finishing");
  }

  const session = resetSession("dashboard");
  fs.writeFileSync(path.join(session, GEMINI_HISTORY), JSON.stringify({ contents: [{ role: "user", parts: [{ text: "old" }] }] }));
  resetSession("dashboard");
  if (fs.existsSync(path.join(session, GEMINI_HISTORY))) {
    throw new Error("start-over left Gemini history behind");
  }
  console.log("  gemini hist start-over wipes the conversation");

  const geminiHttp = await new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      const n = (body.contents || []).filter((c) => c.role === "model").length;
      const payload =
        n === 0
          ? {
              candidates: [
                {
                  content: {
                    role: "model",
                    parts: [{ text: "Looking at the phone." }, { functionCall: { name: "write_file", args: { path: "gemini-wired.txt", contents: "wired\n" } } }],
                  },
                  finishReason: "STOP",
                },
              ],
              usageMetadata: { promptTokenCount: 11, candidatesTokenCount: 3 },
            }
          : {
              candidates: [{ content: { role: "model", parts: [{ text: "Wired through the orchestrator." }] }, finishReason: "STOP" }],
              usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 4 },
            };
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(payload));
    });
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, base: `http://127.0.0.1:${port}/v1beta` });
    });
  });
  const prevBase = process.env.GEMINI_API_BASE;
  const prevModel = process.env.EVG_GEMINI_MODEL;
  process.env.GEMINI_API_KEY = "test-livebuild-key";
  process.env.GOOGLE_API_KEY = "";
  process.env.GEMINI_API_BASE = geminiHttp.base;
  process.env.EVG_GEMINI_MODEL = "gemini-3.8-flash";
  try {
    resetSession("dashboard");
    const seen = [];
    await runTask({
      agent: "gemini",
      kind: "dashboard",
      prompt: "prove the orchestrator spawns Gemini",
      session: true,
      onLine: (line) => seen.push(JSON.parse(line)),
    });
    const wired = path.join(sessionDir(), "gemini-wired.txt");
    if (!fs.existsSync(wired)) throw new Error("spawned Gemini never ran the tool");
    if (!seen.some((e) => e.t === "session" && e.agent === "gemini")) {
      throw new Error("session did not name gemini");
    }
    const usage = seen.find((e) => e.t === "usage");
    if (!usage) throw new Error("spawned Gemini reported no usage");
    if (typeof usage.costUsd !== "number" || usage.input !== 23 || usage.output !== 7) {
      throw new Error("spawned usage should carry tokens and dollars: " + JSON.stringify(usage));
    }
    const done = seen.filter((e) => e.t === "done").at(-1);
    if (!done?.ok) throw new Error("spawned Gemini done.ok is false: " + JSON.stringify(done));
    console.log("  gemini run  orchestrator spawn, usage on the page, tool hit the workspace");
  } finally {
    geminiHttp.server.close();
    restoreKeys();
    restoreBox();
    if (prevBase === undefined) delete process.env.GEMINI_API_BASE;
    else process.env.GEMINI_API_BASE = prevBase;
    if (prevModel === undefined) delete process.env.EVG_GEMINI_MODEL;
    else process.env.EVG_GEMINI_MODEL = prevModel;
  }
}

const missing = agents.filter((a) => !a.available).map((a) => a.id);
if (missing.length) {
  console.log("  skipped     " + missing.join(", ") + " (not on this machine)");
}

console.log("ALL PASS — local orchestrator, recipe + mock + self + Cursor slot + Gemini slot");
