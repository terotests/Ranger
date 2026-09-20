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
import { listAgents, runTask, root, findCursorAgent, cursorSpawnArgs, frameFixture, resetSession, readSessionDoc, prepareSession, sessionDir, makeCursorFeed, attachmentOf, clearAttachment, ATTACH_BASE } from "./agents.mjs";

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
  for (const need of ["This document is one screen", "presses Run", "set-id", "nav.", "set-css", "evg-surface-effect"]) {
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

const missing = agents.filter((a) => !a.available).map((a) => a.id);
if (missing.length) {
  console.log("  skipped     " + missing.join(", ") + " (not on this machine)");
}

console.log("ALL PASS — local orchestrator, recipe + mock + self + Cursor slot");
