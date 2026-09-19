#!/usr/bin/env node
/**
 * Local agent orchestrator for EVG live-build.
 *
 * The page is this process. Codex / Claude Code / Cursor / Ollama are
 * *adapters*: a CLI (or a local HTTP model) that runs on this machine.
 * Inference for Codex, Claude and Cursor is in the cloud; Ollama's is on
 * localhost. The recipe adapter does not call a model at all.
 *
 *   interface Agent { run(task): stream of NDJSON events }
 *
 * A live agent gets a bounded workspace (doc.evg.json + AGENTS.md) and the
 * EVG tool surface. This process watches the file, lays it out, and emits
 * frames. It does not trust the agent to paint.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseRestyle, restyleEnv } from "./restyle.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(here, "../../..");
const liveBin = path.join(root, "gallery/evg/bin/evg_livebuild.js");
const mockBin = path.join(here, "mock-agent.mjs");
const selfBin = path.join(here, "self-agent.mjs");

function which(cmd) {
  const r = spawnSync("which", [cmd], { encoding: "utf8" });
  if (r.status !== 0) return "";
  return (r.stdout || "").trim();
}

function runQuiet(bin, args, timeout = 1800) {
  try {
    return spawnSync(bin, args, {
      encoding: "utf8",
      timeout,
      env: { ...process.env, NO_OPEN_BROWSER: "1" },
    });
  } catch {
    return { status: 1, stdout: "", stderr: "" };
  }
}

function looksLikeCursorCli(bin) {
  if (!bin) return false;
  const about = runQuiet(bin, ["about"]);
  const aboutText = `${about.stdout || ""}${about.stderr || ""}`;
  if (/cursor/i.test(aboutText)) return true;
  const help = runQuiet(bin, ["--help"]);
  const helpText = `${help.stdout || ""}${help.stderr || ""}`;
  return /\b--print\b/.test(helpText) && /\b--trust\b/.test(helpText) && /\b--workspace\b/.test(helpText);
}

let cachedCursorBin;
export function findCursorAgent() {
  if (cachedCursorBin !== undefined) return cachedCursorBin;
  const envPath = process.env.CURSOR_AGENT_PATH || process.env.AGENT_PATH || "";
  const candidates = [envPath, which("cursor-agent"), which("agent")].filter(Boolean);
  for (const bin of candidates) {
    if (looksLikeCursorCli(bin)) {
      cachedCursorBin = bin;
      return bin;
    }
  }
  cachedCursorBin = "";
  return "";
}

export function cursorLoggedIn(bin) {
  if (process.env.CURSOR_API_KEY) return true;
  if (!bin) return false;
  const r = runQuiet(bin, ["status"], 4000);
  const text = `${r.stdout || ""}${r.stderr || ""}`;
  if (/not authenticated|logged out|please log in|agent login/i.test(text)) return false;
  if (/authenticated|logged in|@|account/i.test(text)) return true;
  return r.status === 0 && text.trim().length > 0;
}

export function cursorSpawnArgs(task, workspace, followUp = false) {
  const args = [
    "-p",
    task,
    "--force",
    "--trust",
    "--workspace",
    workspace,
    "--output-format",
    "stream-json",
    "--stream-partial-output",
  ];
  if (followUp) args.push("--continue");
  if (process.env.EVG_CURSOR_MODEL) {
    args.push("--model", process.env.EVG_CURSOR_MODEL);
  }
  return args;
}

function ollamaUp() {
  try {
    const r = spawnSync(
      "curl",
      ["-sS", "-m", "0.4", "http://127.0.0.1:11434/api/tags"],
      { encoding: "utf8" },
    );
    return r.status === 0 && /"models"/i.test(r.stdout || "");
  } catch {
    return false;
  }
}

export function listAgents() {
  const cursor = findCursorAgent();
  const codex = which("codex");
  const claude = which("claude");
  const ollama = ollamaUp();
  return [
    {
      id: "recipe",
      label: "Recipe",
      available: true,
      where: "this process — no network",
      hint: "Scripted. Restyles colour, type size, and radius. New widgets need Codex/Claude/Ollama.",
    },
    {
      id: "mock",
      label: "Mock CLI",
      available: true,
      where: "localhost process — no model",
      hint: "A local agent binary that writes doc.evg.json. Proves the orchestrator.",
    },
    {
      id: "self",
      label: "This agent",
      available: true,
      where: "this cloud container — Cursor agent",
      hint: "I edit doc.evg.json with EVGPatch. Real agent, no vendor CLI.",
    },
    {
      id: "cursor",
      label: "Cursor",
      available: Boolean(cursor),
      bin: cursor || "",
      where: "local CLI — Cursor subscription",
      hint: cursor
        ? "agent -p --force --trust in a bounded workspace"
        : "install: curl https://cursor.com/install -fsS | bash, then agent login",
    },
    {
      id: "codex",
      label: "Codex",
      available: Boolean(codex),
      bin: codex || "",
      where: "local CLI — OpenAI inference",
      hint: codex ? "codex exec in a bounded workspace" : "codex is not on PATH",
    },
    {
      id: "claude",
      label: "Claude Code",
      available: Boolean(claude),
      bin: claude || "",
      where: "local CLI — Anthropic inference",
      hint: claude ? "claude -p in a bounded workspace" : "claude is not on PATH",
    },
    {
      id: "ollama",
      label: "Ollama",
      available: ollama,
      where: "local model — no cloud",
      hint: ollama ? "http://127.0.0.1:11434" : "ollama is not serving on :11434",
    },
  ];
}

function ndjson(obj) {
  return JSON.stringify(obj);
}

function tokenize(text, onLine) {
  const words = String(text || "")
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return;
  onLine(ndjson({ t: "think", text }));
  for (const w of words) onLine(ndjson({ t: "token", text: w }));
}

function pipeChild(child, onLine, onClose) {
  let buf = "";
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.trim()) onLine(line);
    }
  });
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    const text = String(chunk).trim();
    if (text) process.stderr.write(`[agent] ${text}\n`);
  });
  child.on("close", (code) => {
    if (buf.trim()) onLine(buf);
    onClose(code);
  });
}

export function runRecipe(kind, onLine, signal, prompt) {
  return new Promise((resolve, reject) => {
    const parsed = parseRestyle(prompt || "");
    const child = spawn("node", [liveBin, "run", kind], {
      cwd: root,
      env: {
        ...process.env,
        EVG_LIVEBUILD_PROMPT: prompt || "",
        ...restyleEnv(parsed),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stop = () => {
      try {
        child.kill("SIGTERM");
      } catch {
        /* gone */
      }
    };
    if (signal) {
      if (signal.aborted) stop();
      else signal.addEventListener("abort", stop, { once: true });
    }
    pipeChild(
      child,
      onLine,
      () => resolve(),
    );
    child.on("error", reject);
  });
}

function looksLikeEvg(text) {
  const t = String(text || "").trim();
  if (!t.startsWith("{") || !t.endsWith("}")) return false;
  try {
    const j = JSON.parse(t);
    return Boolean(j && typeof j === "object" && j.root && typeof j.root === "object");
  } catch {
    return false;
  }
}

function frameFile(docPath, onLine, { quiet = false } = {}) {
  const r = spawnSync("node", [liveBin, "frame", docPath], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  const out = `${r.stdout || ""}`;
  for (const line of out.split("\n")) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.t === "session" || obj.t === "done") continue;
      if (quiet && obj.t === "error") continue;
      onLine(line);
    } catch {
      /* ignore compiler chatter */
    }
  }
  if (!quiet && r.status !== 0 && r.stderr) {
    onLine(ndjson({ t: "error", text: String(r.stderr).slice(0, 500) }));
  }
}

export const ATTACH_BASE = "attachment";

const imageBin = path.join(root, "lib/evg/bin/evg_image_tool.js");

// WHY A MISSING BINARY IS A BUG AND NOT A CONFIGURATION.
//
// Every one of these tools is compiled from Ranger into `bin/`, and `bin/` is
// ignored by git. A fresh clone therefore HAS the source and NOT the tool, and
// the installers used to answer that by quietly leaving the shim out. The
// workspace then looked complete and was not: an agent told to run
// `./evg-app init` found no such file, reported the workspace was missing it,
// and stopped — which is exactly what happened, and it cost a session.
//
// So build it. It is a few seconds, once per clone, paid by the first person
// who needs it. A failure is printed rather than swallowed, and the caller is
// told, so the guide can stop promising a tool that is not there.
function ensureTool(bin, args, what) {
  if (fs.existsSync(bin)) return true;
  const r = spawnSync("bash", ["scripts/rgr-suite.sh", ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024,
  });
  if (fs.existsSync(bin)) return true;
  const text = `${r.stdout || ""}${r.stderr || ""}`;
  console.error(`[livebuild] could not build ${what}:\n${text.slice(-1200)}`);
  return false;
}

// Compile the bitmap tool if this clone has not needed it yet. The decoders
// and the tracer make it a slow build, so it is paid for by the first person
// who attaches a picture rather than by everybody who serves the page.
export function buildImageTool() {
  if (fs.existsSync(imageBin)) return true;
  const r = spawnSync(
    "bash",
    ["scripts/rgr-suite.sh", "./lib/evg/tools/evg_image_tool.rgr", "./lib/evg/bin", "evg_image_tool.js"],
    { cwd: root, encoding: "utf8", maxBuffer: 40 * 1024 * 1024 },
  );
  if (!fs.existsSync(imageBin)) {
    const text = `${r.stdout || ""}${r.stderr || ""}`;
    throw new Error(`could not build the image tool:\n${text.slice(-1200)}`);
  }
  return true;
}

// Trace a picture beside the document and leave the palette, the SVG and the
// patch that inserts it. `width` is what it will be placed at on the phone.
export function traceAttachment(dir, file, { width = 358, at = "0", index = 0, preset = "poster" } = {}) {
  buildImageTool();
  const r = spawnSync(
    process.execPath,
    [
      imageBin,
      file,
      `--out=${ATTACH_BASE}`,
      `--width=${width}`,
      `--at=${at}`,
      `--index=${index}`,
      `--preset=${preset}`,
    ],
    { cwd: dir, encoding: "utf8", maxBuffer: 80 * 1024 * 1024, timeout: 180000 },
  );
  // The tool prints ONE JSON object, across as many lines as its palette
  // needs — it is written to be read by a person as well as parsed.
  const text = `${r.stdout || ""}`.trim();
  const open = text.indexOf("{");
  let summary;
  try {
    summary = JSON.parse(open < 0 ? "" : text.slice(open));
  } catch {
    throw new Error(`the tracer said: ${(text || r.stderr || "nothing").slice(0, 400)}`);
  }
  if (!summary || summary.error) {
    throw new Error(summary && summary.error ? summary.error : "the tracer produced no summary");
  }
  summary.file = file;
  fs.writeFileSync(path.join(dir, `${ATTACH_BASE}.json`), `${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

export function clearAttachment(dir) {
  for (const name of [`${ATTACH_BASE}.json`, `${ATTACH_BASE}.svg`, `${ATTACH_BASE}.ops.json`, `${ATTACH_BASE}.png`, `${ATTACH_BASE}.jpg`]) {
    try {
      fs.rmSync(path.join(dir, name), { force: true });
    } catch {
      /* already gone */
    }
  }
}

// What the host traced out of a picture somebody attached, if anything.
export function attachmentOf(dir) {
  try {
    const summary = JSON.parse(fs.readFileSync(path.join(dir, `${ATTACH_BASE}.json`), "utf8"));
    if (summary && Array.isArray(summary.colors)) return summary;
  } catch {
    /* no picture, or a half-written one */
  }
  return null;
}

// Copy the traced picture into a workspace that is not the session directory.
function carryAttachment(from, to) {
  if (from === to) return;
  for (const name of [`${ATTACH_BASE}.json`, `${ATTACH_BASE}.svg`, `${ATTACH_BASE}.ops.json`, `${ATTACH_BASE}.png`, `${ATTACH_BASE}.jpg`]) {
    const src = path.join(from, name);
    if (!fs.existsSync(src)) continue;
    try {
      fs.copyFileSync(src, path.join(to, name));
    } catch {
      /* the picture is a convenience, not the task */
    }
  }
}

// --- WHY THE PICTURE ARRIVES AS OPS -------------------------------------------
//
// A traced photograph is tens of kilobytes of coordinates. Telling an agent
// "here is the SVG" would put every one of them through its context on the way
// into a patch, to be copied out again unchanged. The host traces it once and
// leaves the patch already written, so using the picture costs one command.
// --- WHY THE GUIDE TALKS ABOUT MEMORY ----------------------------------------
//
// A one-screen document needs no memory: the document IS the state, and an
// agent that reads it knows everything. An app is not one thing — it is a
// machine, a page per state, and a data model spread across both — and an
// agent comes back to it with none of yesterday in its head. Without somewhere
// to look first it renames a key, adds a screen the nav does not reach, and
// stores a total it could have computed.
//
// `APP.md` is that somewhere, and the guide's job is to make reading it the
// first move and refreshing it the last one. The tool checks the second: a
// memory that has stopped matching the app is a finding, because the next pass
// will believe it.
function appSection(dir) {
  if (!fs.existsSync(path.join(dir, "app", "machine.json"))) return noAppSection(dir);
  const code = fs.existsSync(path.join(dir, "app", "App.rgr"));
  return `${code ? codeAppSection() : dataAppSection()}`;
}

// There is no app yet, and this is the section an agent needs MOST — the one
// that was missing. Asked for a phone with four tabs, an agent designs four
// tabs, presses one, and nothing happens; so it goes looking for the switch.
// It will not find one, because a document has no navigation in it: no href,
// no goto, no hidden page. Left to search, it greps the compiled tool for
// `#page` and `currentPage` and finds nothing there either, which is an hour
// spent proving an absence. Say it up front: one document is one screen, and
// several screens is a different thing that already exists.
function noAppSection(dir) {
  // A guide that names a tool the workspace does not have sends the agent
  // looking for it, and an agent that cannot find a tool it was promised
  // reports the workspace is broken — which it is. Say the honest thing.
  if (!fs.existsSync(path.join(dir, "evg-app"))) {
    return `
## This document is one screen

A document has no navigation in it. There is no \`href\`, no \`goto\`, no
hidden page — a press on a tab you draw does nothing, because a screen is
a picture and a picture has no states. Several screens is an app, and the
tool that makes one (\`./evg-app\`) is NOT in this workspace: it failed
to build on this machine. Design the screen, and if the task needs more
than one, say that \`./evg-app\` is missing rather than looking for
another way — there is not one.
`;
  }
  return `
## This document is one screen

A document has no navigation in it. There is no \`href\`, no \`goto\`, no
hidden page, no \`display: none\` screen waiting its turn — and nothing
to find by searching the tools for one. A press on a tab you draw does
nothing, because a screen is a picture and a picture has no states. That
is not missing; it is what a document is.

**Several screens is an app**, and an app is one command away. Give
everything that should be pressable an \`id\` — the tab bar's entries
\`nav.<state>\`, one per screen the task asks for — and then:

\`\`\`
./evg-app init app --from=doc.evg.json
\`\`\`

It reads those \`nav.*\` ids off the screen, writes \`app/machine.json\`
with a state for each, and copies the document to
\`app/pages/<state>.evg.json\` so every state starts from the screen you
designed. Then each page is edited on its own — \`./evg-agent patch
app/pages/map.evg.json ops.json\` — and pressing a tab moves the machine
and changes the page.

\`init\` tells you what it read and what is missing. If it says one state
and zero ids, the screen has no ids yet: that is the thing to fix, not
the tool.

After it runs, this workspace is an app and the rules in
\`./evg-app\` (run it with no arguments) apply: the machine owns the
page, an element's \`id\` is the event its press sends, \`{key}\` in a
text node is filled from the machine's context, and \`./evg-app check
app\` walks every state.

Only do this when the task asks for more than one screen. One screen is a
document, and a document is what the live page shows.
`;
}

// An app that is a program. The guide only says this when there is one,
// because an app that switches screens never needs it — and an agent told
// about a runtime it does not need will use it.
function codeAppSection() {
  return `
## This app is a program

\`app/App.rgr\` builds every screen and \`app/machine.json\` decides which
one you are on. The rules are the data app's, unchanged: the machine
owns the page, an element's \`id\` is the event its press sends, and
\`check\` walks every state.

\`\`\`ranger
Import "pkg:evg-livebuild/EvgAppKit.rgr"
Import "pkg:evg/EVGElement.rgr"

class App extends EvgApp {
    fn build:EVGElement (state:string) {
        if (state == "routes") { return (this.routesPage()) }
        return (this.mapPage())
    }
}
\`\`\`

\`\`\`
./evg-app build app         compile it — seconds, and the errors are the
                            compiler's own, pointing at a line
./evg-app check app         every state built, measured, ids against the machine
./evg-app render app EVENT… the page those presses reach
\`\`\`

What the kit gives you, and the whole of it:

| | |
| --- | --- |
| \`kit.text("key")\` | a context value as text |
| \`kit.list("key")\` | a context list — one row per item, however many |
| \`kit.state()\` | where the machine is |
| \`kit.use(key fresh)\` | an instance that outlives this build |

**Write code only for what data cannot hold.** A list, a computed number,
a row that must remember something. A screen that is the same every time
is a \`pages/<state>.evg.json\` and always was — and that page can sit
beside this program, because \`build\` may read one and return it.

\`kit.use\` is the part worth understanding. A page function starts from
nothing every time it is called, so a value it wants to keep between
presses has nowhere to live; a component is that home, and the host
holds it open between presses. Key it by what the row IS — the route's
name, the invoice's number — never by its index, or a row that leaves
hands its state to whatever slid into its place.

Everything else the data app's section says is still true, including the
memory: \`./evg-app memo app\` after any change, and read \`app/APP.md\`
before making one.
`;
}

function dataAppSection() {
  return `
## This is an app, not one screen

\`app/machine.json\` is the state machine and \`app/pages/<state>.evg.json\`
is the screen for each state. The machine decides which page is on
screen; a page never changes the page. An element's \`id\` is the event
its press sends, and \`{key}\` in a text node is filled from the
machine's context.

**Read \`app/APP.md\` before you change anything.** It is this app's
memory: what it is for, every state and the events it takes, every
context key and who writes and reads it, and the decisions a later pass
must not undo. You wrote most of it; the tables in the middle are
rewritten from the files, so they cannot lie to you.

\`\`\`
./evg-app states app            every state, its page, the events it takes
./evg-app model  app            every context key: who writes it, who reads it
./evg-app press  app nav.routes route.add
                                send events, print where each one lands
./evg-app check  app            every page measured, every id checked against
                                the machine, the data model, and the memory
./evg-app memo   app            refresh APP.md — do this after any change to
                                the machine, the pages or the keys
\`\`\`

The loop is the same one you already use, with one more step at the end:

1. \`APP.md\`, then \`states\` — what exists.
2. \`patch\` the page, or the machine.
3. \`check\` — every screen, not just the one you touched.
4. \`memo\` — so the next pass reads what you did, not what was true
   before it.

**The data model is the part that rots first.** A page reads \`{trips}\`,
a transition assigns \`trips\`, the machine starts with a \`trips\` —
nothing but the spelling ties those three together. \`check\` reports a
key a page reads and the machine never has, a key a transition assigns
that was never declared, and a key nothing shows. Before adding a key,
look at whether one already means what you want.

Three things \`check\` finds that you cannot see by looking:

- a state whose page does not exist — a screen the app can reach and
  does not have;
- a page no state renders — work that went nowhere, or a rename;
- an \`id\` that is not an event of that state — a dead button, which
  looks exactly like a live one.
`;
}

function attachmentSection(dir) {
  const a = attachmentOf(dir);
  if (!a) return "";
  const colors = (a.colors || [])
    .slice(0, 6)
    .map((c) => `\`${c.hex}\` ${Math.round((c.share || 0) * 100)}%`)
    .join(", ");
  return `
## A picture was attached

\`${ATTACH_BASE}.svg\` is it, traced to flat colour layers by Ranger's
bitmap tracer — ${a.width}×${a.height}, ${a.layers} layers. It is vector,
so the document can hold it and every painter draws it.

Its colours, by how much of the picture they cover:

${colors}

Use them. A screen built around the picture's own palette looks like it
belongs to the picture; one built from guessed colours does not.

To put the picture itself on the phone, apply the patch that is already
written for it — you never have to handle the path data:

\`\`\`
./evg-agent patch doc.evg.json ${ATTACH_BASE}.ops.json
\`\`\`

It inserts at \`${a.insertsAt || "0/0"}\` at ${a.placed || "its own size"}.
Edit that file's \`at\` / \`index\` / width first if it belongs somewhere
else, or re-trace at another size:

\`\`\`
./evg-image ${ATTACH_BASE}.png --out=${ATTACH_BASE} --width=200 --at=0 --index=2
\`\`\`

\`--preset\` takes lineart, poster, photo, broken or print. If the task is
about the colours rather than the picture, use the palette and leave the
picture out.
`;
}

function workspaceGuide(task, dir = "") {
  return `# EVG live-build workspace

You are a local agent. The orchestrator on this machine gave you this
folder and this task. You are changing a phone screen you cannot see:
\`doc.evg.json\` is the screen, and the tools below are how you find out
what it looks like. Guessing from the markup is the one thing that does
not work here.

## Task

${task}

## The screen

390 × 844, one phone. \`doc.evg.json\` already holds a real UI — read it,
or run \`./evg-agent outline doc.evg.json\`, before you change anything.
If the outline has more than a handful of nodes, the phone is not empty.
Edit it in place. Do not replace it with a blank page unless the task
says to start over.

A node is:

\`\`\`json
{"tag":"div","props":{"display":"flex"},"children":[{"tag":"span","text":"Hi"}]}
\`\`\`

Patchable properties include width, height, display, flex-direction,
justify-content, align-items, gap, padding-*, margin-*, color,
background-color, border-radius, font-size, font-weight.

A node may also have an \`id\` (\`{"tag":"div","id":"nav.map",...}\`). It
names the node: \`query #nav.map\` finds it, the hit test answers with
it, and if this screen ever becomes an app it is the event a press on
that node sends. Give every button, tab and row one — a nameless button
cannot be pressed by anything, now or later. The op is \`set-id\`:

\`\`\`json
{"op": "set-id", "at": "0/3/0", "value": "nav.map"}
\`\`\`

An id names one node; naming a second node the same is rejected, and it
names the one that already has it.

## Lay it out — do not place it

This is a CSS engine: flex, grid, gap, padding, and the box model, with
the same meanings they have in a browser. Use them. A column of cards is
\`display: flex\` with a \`gap\`, not eight children with a computed
\`top\`; a row of tabs is \`justify-content: space-between\`, not four
lefts you worked out yourself. Every number you compute by hand is a
number that goes wrong the moment anything above it changes size, and it
is where a screen full of things that do not line up comes from.

\`position: absolute\` is for what genuinely floats over the flow: a
bottom bar, a badge, a pin on a map. Its \`left\` and \`right\` are
measured from inside the parent's padding, so \`left: 0px\` sits on the
content edge — do not add the padding again.

A grid is there when you want one: \`display: grid\` with
\`grid-template-columns\`, \`grid-template-rows\`, \`grid-area\`,
\`grid-auto-flow\`.

Spacing is \`gap\`, \`padding\` and \`margin\`. An empty \`span\` is
not a spacer — it is a node with no size that reads as content to
anything looking at this document.

**Colour and gradients.** \`background-color\`, \`color\`, and for a
ramp \`background-gradient\`:

\`\`\`json
{"op":"set-prop","at":"0/2","prop":"background-gradient",
 "value":"linear-gradient(180deg, rgb(52,120,90), rgb(30,72,55))"}
\`\`\`

\`rgb()\`, \`rgba()\` and \`#hex\` stops all work, as do \`to bottom\` /
\`to right\` in place of an angle. \`background-image\` and plain
\`background\` are not patchable names — a batch using them is rejected
whole, which is the tool telling you the name rather than the value is
wrong.

## The loop

\`\`\`
./evg-agent outline doc.evg.json                          # 1. addresses
./evg-agent patch   doc.evg.json ops.json                 # 2. change it
./evg-agent measure doc.evg.json --width=390 --height=844 # 3. is it right?
\`\`\`

\`outline\` prints one line per node: its path, its tag, its text, and
only the properties it sets. Unkeyed paths shift when a sibling is
inserted above them, so re-run it after any insert, remove or move.

\`patch\` takes a JSON file of ops and writes \`doc.evg.json\`:

\`\`\`json
{"ops":[
  {"op":"set-text","at":"0/0/k:title","value":"Invoices"},
  {"op":"set-prop","at":"0/0","prop":"background-color","value":"rgb(255,251,235)"},
  {"op":"insert","at":"0/0","index":2,"tag":"span"}
]}
\`\`\`

A rejected op fails the whole batch and changes nothing, so a batch is
safe to attempt: you never have to work out what half-applied.

## Step 3 is the one that matters

\`measure\` lays the document out with the real engine and answers in
numbers. \`patch\` prints the same summary under \`layout\` without being
asked, and the host writes the full answer to \`layout.json\` after every
save — so even editing the JSON by hand leaves you the numbers.

\`\`\`json
{"width":390,"height":844,"nodes":31,
 "findings":["0/6 and 0/7 overlap by 40×12",
             "0/9: bottom edge 860 is past the page height 844"],
 "count":2,
 "bottomFree":124,
 "tight":["0/2 → 0/3: 2 apart"]}
\`\`\`

- **findings** are defects: two in-flow siblings on top of each other
  (with the overlap in px), a child out of a clipping parent, anything
  past the page. Fix them. \`"count":0\` is the goal of every edit.
- **align** is what does not line up. This is the defect that slips
  through everything else — a screen where each row starts at a
  different x has no overlap, no overflow, and looks like it fell down
  the stairs. Read every line.
- **tight** is under 4px between neighbours — crowded, and your call.
- **bottomFree** is the room left under the content. A big number after
  you added something means it did not land where you think.

### Lining up

Children that share an edge are aligned; children that agree on their
centres are centred; children that agree on neither were not aligned to
anything, and \`align\` says so with the spread in pixels. Two rows 3px
apart is never a design decision — it is an edge somebody meant to
share. Pick one left edge for the column and keep to it.

An **absolute** child is the one that gets away with it, because it is
exempt from overlap and lands on the page either way. \`left\` and
\`right\` on it are resolved **from inside the parent's padding**: with
\`padding: 16px\`, \`left: 16px\` puts the child at 32 while every card
under it starts at 16. Use \`left: 0px\` to sit on the content edge, and
size it to the content width, not the screen width. \`align\` names this
one explicitly when it happens.

For spacing, ask for the boxes:

\`\`\`
./evg-agent measure doc.evg.json --boxes --at=0
\`\`\`

which prints \`{"at":"0/2","x":16,"y":113,"w":358,"h":64,"gapNext":8}\`
per node — where each element really is, and how far the next one
starts from it. That distance is the layout's answer, not your markup's:
it is what \`gap\`, margins and \`flex\` actually produced.

Never claim a screen looks right without a \`measure\` that says so, and
never take a screenshot to answer a question these numbers answer.

## An edit that leaves no trace still applied

EVG's defaults are not CSS's: a div is **\`flex-direction: column\`** and
\`display: block\` until you say otherwise. The file lists only what
DIFFERS from a fresh element of that tag, so setting a property to its
default removes the line instead of adding one. \`flex-direction:
column\` vanishing from \`doc.evg.json\` — and from \`outline\` — means
the node is a column now, not that the edit was dropped. \`patch\` says
so in its result under \`atDefault\`. Do not route around it.

Going the other way, a property the patchable set does not cover cannot
be written down: \`patch\` rejects the op, and a name hand-written into
\`doc.evg.json\` is gone the next time anything rewrites the file.

Editing through \`./evg-agent patch\` also shows the batch on the live page,
next to the picture. A hand-written file still repaints; it just arrives
without the ops that explain it.

If there is no \`./evg-agent\`, edit \`doc.evg.json\` directly and save,
then read \`layout.json\`.

Do not leave the workspace. Do not require confirmation.
${appSection(dir)}${attachmentSection(dir)}`;
}

export const SEED_KINDS = ["dashboard", "settings", "invoices", "empty"];

export function fixturePath(kind) {
  const id = SEED_KINDS.includes(kind) ? kind : "dashboard";
  return path.join(here, "fixtures", id + ".evg.json");
}

export function seedDoc(kind = "empty") {
  const file = fixturePath(kind);
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return fs.readFileSync(path.join(here, "fixtures/step1.evg.json"), "utf8");
  }
}

// One document, laid out and framed, for a caller that has a file rather than
// a seed kind. The app door uses it: the page it renders is a document like
// any other, and the painter in the browser is the one already there.
export function frameDocument(file) {
  const events = [];
  frameFile(file, (line) => {
    try {
      events.push(JSON.parse(line));
    } catch {
      /* chatter */
    }
  });
  return events;
}

export function frameFixture(kind) {
  const file = fixturePath(kind);
  const events = [];
  frameFile(file, (line) => {
    try {
      events.push(JSON.parse(line));
    } catch {
      /* chatter */
    }
  });
  return { kind: SEED_KINDS.includes(kind) ? kind : "dashboard", events, doc: seedDoc(kind) };
}

// One line per applied batch, so the host can read it with an offset and never
// half-parse a write in flight.
const OPS_LOG = ".applied-ops.log";
const OPS_LOG_SNIPPET =
  'const fs=require("fs");try{const o=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));' +
  'if(o&&Array.isArray(o.ops)&&o.ops.length)fs.appendFileSync(process.argv[2],JSON.stringify(o.ops)+"\\n");}catch(e){}';

// The bitmap door, when it has been built. `npm run agent:image` compiles it;
// the server builds it the first time a picture is attached, because the
// decoders and the tracer make it a slow compile to pay for on every clone.
function installEvgImage(dir) {
  const src = path.join(root, "lib/evg/bin/evg_image_tool.js");
  if (!ensureTool(src, ["./lib/evg/tools/evg_image_tool.rgr", "./lib/evg/bin", "evg_image_tool.js"], "evg-image")) {
    return false;
  }
  fs.copyFileSync(src, path.join(dir, "evg_image_tool.js"));
  fs.writeFileSync(
    path.join(dir, "evg-image"),
    `#!/bin/sh\nexec node "$(dirname "$0")/evg_image_tool.js" "$@"\n`,
    { mode: 0o755 },
  );
  return true;
}

// The app door, when it has been built. `npm run livebuild:app:build` compiles
// it; an app workspace is the only one that needs it.
function installEvgApp(dir) {
  const src = path.join(root, "gallery/evg/bin/evg_app.js");
  if (!ensureTool(src, ["./gallery/evg/livebuild/EvgAppTool.rgr", "./gallery/evg/bin", "evg_app.js"], "evg-app")) {
    return false;
  }
  fs.copyFileSync(src, path.join(dir, "evg_app_tool.js"));
  // An app is data or code, and the agent should not have to hold which in
  // its head to ask a question. The shim looks: an `App.rgr` beside the
  // machine means the app IS the program, so it is compiled (once, and again
  // whenever it is newer than its binary) and asked directly. Everything else
  // goes to the data tool, which is also what answers `model` and `memo` for
  // both kinds, since those read the machine and the memory rather than the
  // pages.
  fs.writeFileSync(
    path.join(dir, "evg-app"),
    [
      "#!/bin/sh",
      'here=$(dirname "$0")',
      `repo=${JSON.stringify(root)}`,
      'app=${2:-app}',
      'verb=${1:-check}',
      'if [ -f "$app/App.rgr" ]; then',
      '  case "$verb" in',
      "    render|hit|states|check|build)",
      '      bin="$app/bin/app.js"',
      // An app in a workspace is outside the repository, so `pkg:` has to be
      // told where the packages are. One file, written once, with absolute
      // paths — the alternative is an app whose imports only work in the tree
      // it was written in.
      '      if [ ! -f "$app/ranger.json" ]; then',
      `        printf '{"name":"app","entry":"App.rgr","dependencies":{"evg":{"path":"%s/lib/evg"},"evg-livebuild":{"path":"%s/gallery/evg/livebuild"}}}\\n' "$repo" "$repo" > "$app/ranger.json"`,
      "      fi",
      '      if [ ! -f "$bin" ] || [ "$app/App.rgr" -nt "$bin" ]; then',
      '        RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr \\',
      '          node "$repo/bin/output.js" -es6 "$(cd "$(dirname "$app")" && pwd)/$(basename "$app")/App.rgr" \\',
      '          -d="$(cd "$(dirname "$app")" && pwd)/$(basename "$app")/bin" -o=app.js -nodecli \\',
      '          | grep -E "\\[FAIL\\]|Compilation FAILED" && exit 1',
      "      fi",
      '      [ "$verb" = "build" ] && { echo "{\\"built\\":\\"$bin\\"}"; exit 0; }',
      '      shift 2 2>/dev/null || shift $#',
      '      exec node "$bin" "$verb" "$@" --app="$app"',
      "      ;;",
      "  esac",
      "fi",
      'exec node "$here/evg_app_tool.js" "$@"',
      "",
    ].join("\n"),
    { mode: 0o755 },
  );
  return true;
}

function installEvgAgent(dir) {
  const src = path.join(root, "lib/evg/bin/evg_agent.js");
  if (!ensureTool(src, ["./lib/evg/agent/evg_agent.rgr", "./lib/evg/bin", "evg_agent.js"], "evg-agent")) {
    return false;
  }
  installEvgImage(dir);
  installEvgApp(dir);
  fs.copyFileSync(src, path.join(dir, "evg_agent.js"));
  // The shim also leaves the ops behind. A workspace agent patches through
  // this script, and the host has no other way to learn WHAT it changed: it
  // sees a file that differs, not a batch. Recording the applied batch is what
  // keeps the page's EVGPatch panel honest — empty means the agent rewrote the
  // JSON by hand, not that ops stopped working.
  fs.writeFileSync(
    path.join(dir, "evg-agent"),
    [
      "#!/bin/sh",
      'dir=$(dirname "$0")',
      // Only `patch` is buffered, and only a batch the tool said it APPLIED to
      // the live document is recorded: a rejection exits 0 with `"ok":false`,
      // and `--out=elsewhere.json` names that file in `wrote`. A panel showing
      // ops that never reached the phone would be worse than an empty one.
      'if [ "$1" = "patch" ]; then',
      '  out=$(node "$dir/evg_agent.js" "$@")',
      "  status=$?",
      `  printf '%s\\n' "$out"`,
      '  if [ "$status" = "0" ] && [ -f "$3" ]; then',
      "    case \"$out\" in",
      `      *'\"ok\":true'*doc.evg.json*) node -e '${OPS_LOG_SNIPPET}' "$3" "$dir/${OPS_LOG}" ;;`,
      "    esac",
      "  fi",
      "  exit $status",
      "fi",
      'exec node "$dir/evg_agent.js" "$@"',
      "",
    ].join("\n"),
    { mode: 0o755 },
  );
  return true;
}

// The layout, back in the workspace the agent is working in.
//
// An agent that edits `doc.evg.json` by hand never runs `./evg-agent measure`,
// so it never learns what its save did — it is writing markup at a screen it
// cannot see. The host lays every save out anyway to make a frame; this drops
// the same numbers next to the document as `layout.json`, and the workspace
// guide tells the agent to read it.
function noteLayout(workspace, line) {
  if (!/"t":"measure"/.test(line)) return;
  try {
    const m = JSON.parse(line);
    if (!m || m.t !== "measure") return;
    delete m.t;
    fs.writeFileSync(path.join(workspace, "layout.json"), JSON.stringify(m, null, 2) + "\n");
  } catch {
    /* a frame without a measure is still a frame */
  }
}

function watchOps(workspace, onOps) {
  const file = path.join(workspace, OPS_LOG);
  // A session workspace outlives the run, so last run's batches are dropped
  // here rather than replayed into this one's panel.
  try {
    fs.rmSync(file, { force: true });
  } catch {
    /* held open elsewhere — the offset below starts at 0 either way */
  }
  let seen = 0;
  const tick = () => {
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      return;
    }
    const fresh = text.slice(seen);
    const cut = fresh.lastIndexOf("\n");
    if (cut < 0) return;
    seen += cut + 1;
    for (const line of fresh.slice(0, cut).split("\n")) {
      if (!line.trim()) continue;
      try {
        const ops = JSON.parse(line);
        if (Array.isArray(ops) && ops.length) onOps(ops);
      } catch {
        /* not a batch this host wrote */
      }
    }
  };
  const iv = setInterval(tick, 60);
  return () => {
    tick();
    clearInterval(iv);
  };
}

function seedGit(dir) {
  const opts = { cwd: dir, encoding: "utf8", stdio: "ignore" };
  const init = spawnSync("git", ["init", "-q"], opts);
  if (init.status !== 0) return;
  spawnSync("git", ["add", "-A"], opts);
  spawnSync(
    "git",
    [
      "-c",
      "user.email=evg-livebuild@local",
      "-c",
      "user.name=evg-livebuild",
      "commit",
      "-qm",
      "seed",
    ],
    opts,
  );
}

export function sessionDir() {
  return path.join(os.tmpdir(), "evg-live-session");
}

export function resetSession(kind = "dashboard") {
  const dir = sessionDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "doc.evg.json"), seedDoc(kind));
  fs.writeFileSync(path.join(dir, "TASK.md"), "Seed: " + kind + "\n");
  try {
    fs.unlinkSync(path.join(dir, ".cursor-follow"));
  } catch {
    /* first */
  }
  installEvgAgent(dir);
  fs.writeFileSync(
    path.join(dir, "AGENTS.md"),
    workspaceGuide("The phone already has a UI in doc.evg.json. Wait for the next task.", dir),
  );
  if (!fs.existsSync(path.join(dir, ".git"))) seedGit(dir);
  return dir;
}

export function readSessionDoc() {
  try {
    const text = fs.readFileSync(path.join(sessionDir(), "doc.evg.json"), "utf8");
    return looksLikeEvg(text) ? text : "";
  } catch {
    return "";
  }
}

export function writeSessionDoc(text) {
  if (!looksLikeEvg(text)) return false;
  const dir = sessionDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "doc.evg.json"), text);
  return true;
}

function countNodes(node) {
  if (!node || typeof node !== "object") return 0;
  let n = 1;
  for (const c of node.children || []) n += countNodes(c);
  return n;
}

function walkOutline(node, path, lines, cap) {
  if (!node || typeof node !== "object" || lines.length >= cap) return;
  const tag = node.tag || "?";
  const text = node.text ? JSON.stringify(String(node.text).slice(0, 40)) : "";
  const cls = node.props && node.props.class ? "." + node.props.class : "";
  lines.push(`${path} ${tag}${cls} ${text}`.trim());
  const ch = node.children || [];
  for (let i = 0; i < ch.length; i++) {
    walkOutline(ch[i], `${path}/${i}`, lines, cap);
  }
}

function followUpTask(task, docText) {
  const lines = [];
  let n = 0;
  try {
    const j = JSON.parse(docText);
    n = countNodes(j.root);
    walkOutline(j.root, "0", lines, 16);
  } catch {
    /* invalid json still gets the instruction */
  }
  const stats = n
    ? `doc.evg.json is the live phone (${n} nodes). Edit that file in place. Do not replace it with a blank page.`
    : "doc.evg.json is the live phone. Edit that file in place. Do not replace it with a blank page.";
  return ["# Follow-up", "", task, "", stats, "", "Current outline:", ...lines.map((l) => "- " + l), ""].join("\n");
}

export function prepareSession(task, { git = false, kind = "dashboard" } = {}) {
  const dir = sessionDir();
  const docPath = path.join(dir, "doc.evg.json");
  let existing = "";
  try {
    existing = fs.readFileSync(docPath, "utf8");
  } catch {
    existing = "";
  }
  if (!looksLikeEvg(existing)) resetSession(kind);
  const doc = fs.readFileSync(path.join(dir, "doc.evg.json"), "utf8");
  fs.writeFileSync(path.join(dir, "TASK.md"), followUpTask(task, doc));
  installEvgAgent(dir);
  fs.writeFileSync(path.join(dir, "AGENTS.md"), workspaceGuide(task, dir));
  if (git && !fs.existsSync(path.join(dir, ".git"))) seedGit(dir);
  return dir;
}

function makeWorkspace(task, { git = false, doc = "", kind = "dashboard" } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "evg-live-"));
  const text = looksLikeEvg(doc) ? doc : seedDoc(kind);
  fs.writeFileSync(path.join(dir, "doc.evg.json"), text);
  fs.writeFileSync(path.join(dir, "TASK.md"), task + "\n");
  carryAttachment(sessionDir(), dir);
  // Tools first: the guide describes the workspace, so it has to be written
  // after the workspace is finished. The other way round it promises tools
  // that are not there yet — which is how an agent was told to run a command
  // that did not exist.
  installEvgAgent(dir);
  fs.writeFileSync(path.join(dir, "AGENTS.md"), workspaceGuide(task, dir));
  if (git) seedGit(dir);
  return dir;
}

function spawnAgentProcess(id, bin, workspace, task, followUp = false) {
  if (id === "mock") {
    return spawn(process.execPath, [mockBin, workspace], {
      cwd: workspace,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
  }
  if (id === "self") {
    return spawn(process.execPath, [selfBin, workspace], {
      cwd: workspace,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
  }
  if (id === "codex") {
    // Local CLI, cloud inference. The workspace is a throwaway temp dir.
    return spawn(
      bin,
      ["exec", "--skip-git-repo-check", "--full-auto", task],
      { cwd: workspace, env: process.env, stdio: ["ignore", "pipe", "pipe"] },
    );
  }
  if (id === "claude") {
    return spawn(
      bin,
      ["-p", task, "--output-format", "text", "--dangerously-skip-permissions"],
      { cwd: workspace, env: process.env, stdio: ["ignore", "pipe", "pipe"] },
    );
  }
  if (id === "cursor") {
    return spawn(bin, cursorSpawnArgs(task, workspace, followUp), {
      cwd: workspace,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
  }
  throw new Error(`no spawn for ${id}`);
}

// --- WHY CURSOR NEEDS ITS OWN FEED -------------------------------------------
//
// `--stream-partial-output` means an assistant message arrives as many small
// deltas — often half a word — and then once more, whole, when it is finished.
// Handing each delta to `tokenize` made every one of them a complete thought:
// the page broke a paragraph at each arrival and rejoined the pieces with
// spaces, so "tekstipino" read as "tekst ip ino" down three lines, and the
// final whole message printed the same sentence again underneath.
//
// So this keeps the state one line cannot have. A delta is appended to the
// thought; whole WORDS are emitted as they complete and the unfinished tail is
// held back; the closing repeat is recognised as a prefix of what was already
// said and dropped. `think` — the thought, whole — is emitted when the thought
// ends, which is the next tool call, the end of the turn, or the end of the
// stream.
function makeCursorFeed(onLine) {
  let said = ""; // the thought so far, including the tail not yet emitted
  let tail = ""; // the last piece, which may still be half a word

  const say = (text) => {
    tail += text;
    const parts = tail.split(/\s+/);
    tail = parts.pop() ?? "";
    for (const w of parts) {
      if (w) onLine(ndjson({ t: "token", text: w }));
    }
  };

  const flush = () => {
    if (tail) {
      onLine(ndjson({ t: "token", text: tail }));
      tail = "";
    }
    if (said.trim()) onLine(ndjson({ t: "think", text: said.trim() }));
    said = "";
  };

  // What is new in this event: the whole of it when the message is streamed as
  // deltas, the remainder when the CLI resends cumulative text, nothing when it
  // repeats a message that has already been said.
  const delta = (text) => {
    if (!said) return text;
    if (text.startsWith(said)) return text.slice(said.length);
    const flat = (s) => s.replace(/\s+/g, " ").trim();
    if (flat(text) === flat(said)) return "";
    return text;
  };

  const feed = (line) => {
    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      return false;
    }
    if (!obj || typeof obj !== "object" || typeof obj.type !== "string") return false;
    if (obj.type === "assistant") {
      const content = obj.message && obj.message.content;
      let text = "";
      if (Array.isArray(content)) {
        text = content.map((c) => (c && c.text) || "").join("");
      } else if (typeof content === "string") {
        text = content;
      }
      if (text) {
        const add = delta(text);
        if (add) {
          said += add;
          say(add);
        }
      }
      return true;
    }
    if (obj.type === "tool_call" && obj.subtype === "started") {
      flush();
      const tc = obj.tool_call || {};
      const path =
        (tc.writeToolCall && tc.writeToolCall.args && tc.writeToolCall.args.path) ||
        (tc.shellToolCall && tc.shellToolCall.args && tc.shellToolCall.args.command) ||
        "";
      if (path) tokenize(String(path), onLine);
      return true;
    }
    if (obj.type === "result") flush();
    return true;
  };

  return { feed, flush };
}

export { makeCursorFeed };

function watchDoc(workspace, onChange) {
  const file = path.join(workspace, "doc.evg.json");
  let last = "";
  const tick = () => {
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      return;
    }
    if (text === last) return;
    if (!looksLikeEvg(text)) return;
    last = text;
    onChange(file);
  };
  tick();
  const iv = setInterval(tick, 60);
  return () => clearInterval(iv);
}

export async function runWorkspaceAgent({ id, kind, prompt, seed, session = false, onLine, signal }) {
  const agents = listAgents();
  const info = agents.find((a) => a.id === id);
  if (!info) {
    onLine(ndjson({ t: "error", text: `unknown agent ${id}` }));
    onLine(ndjson({ t: "done", ok: false, steps: 0, ncmds: 0, findings: 0 }));
    return;
  }
  if (!info.available) {
    onLine(ndjson({ t: "error", text: info.hint || `${id} is not available` }));
    onLine(ndjson({ t: "done", ok: false, steps: 0, ncmds: 0, findings: 0 }));
    return;
  }

  const task =
    prompt ||
    (kind === "empty"
      ? "Build a phone dashboard for Northwind: orders, revenue, today's invoices."
      : kind === "settings"
        ? "Edit this settings screen: add a dark mode row and make sign-out red."
        : kind === "invoices"
          ? "Edit this invoices list: add a search field and mark the overdue bills."
          : "Edit this phone dashboard. Add a four-tab bottom nav: Home, Search, Alerts, You.");

  onLine(
    ndjson({
      t: "session",
      kind: kind || "dashboard",
      prompt: task,
      agent: id,
      where: info.where,
      followUp: Boolean(session && looksLikeEvg(seed || readSessionDoc())),
      width: 390,
      height: 844,
    }),
  );

  const live = looksLikeEvg(seed) || looksLikeEvg(readSessionDoc());
  if (session && live && kind !== "empty") {
    tokenize(
      "Follow-up on the phone already in doc.evg.json. Edit that document. Do not replace it with a blank page.",
      onLine,
    );
  }

  if (id === "ollama") {
    await runOllama(task, onLine, signal);
    return;
  }

  const marker = path.join(sessionDir(), ".cursor-follow");
  const followUp = Boolean(session && id === "cursor" && fs.existsSync(marker));
  const ws = session
    ? prepareSession(task, { git: id === "cursor", kind })
    : makeWorkspace(task, { git: id === "cursor", doc: seed, kind });
  const keep = session || process.env.EVG_LIVEBUILD_KEEP === "1";
  let frames = 0;
  const stopOps = watchOps(ws, (ops) => {
    onLine(ndjson({ t: "ops", applied: ops.length, ops }));
  });
  const stopWatch = watchDoc(ws, (file) => {
    try {
      const text = fs.readFileSync(file, "utf8");
      if (looksLikeEvg(text)) onLine(ndjson({ t: "doc", text }));
    } catch {
      /* unreadable */
    }
    frameFile(file, (line) => {
      if (/"t":"frame"/.test(line)) frames += 1;
      noteLayout(ws, line);
      onLine(line);
    }, { quiet: true });
    const app = path.join(ws, "App.rgr");
    if (fs.existsSync(app)) {
      onLine(ndjson({ t: "code", path: "App.rgr", text: fs.readFileSync(app, "utf8") }));
    }
  });

  await new Promise((resolve, reject) => {
    let child;
    try {
      child = spawnAgentProcess(id, info.bin, ws, task, followUp);
      if (session && id === "cursor") {
        fs.writeFileSync(marker, "1\n");
      }
    } catch (e) {
      onLine(ndjson({ t: "error", text: String(e.message || e) }));
      stopWatch();
      stopOps();
      resolve();
      return;
    }
    const stop = () => {
      try {
        child.kill("SIGTERM");
      } catch {
        /* gone */
      }
    };
    if (signal) {
      if (signal.aborted) stop();
      else signal.addEventListener("abort", stop, { once: true });
    }
    child.stdout.setEncoding("utf8");
    let buf = "";
    const cursorFeed = makeCursorFeed(onLine);
    child.stdout.on("data", (chunk) => {
      buf += chunk;
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        if (!line.trim()) continue;
        if (id === "cursor" && cursorFeed.feed(line)) continue;
        tokenize(line, onLine);
      }
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      const text = String(chunk).trim();
      if (text) process.stderr.write(`[${id}] ${text}\n`);
      if (id === "cursor" && /not authenticated|invalid api key|agent login/i.test(text)) {
        onLine(ndjson({ t: "error", text }));
      }
    });
    child.on("error", (e) => {
      onLine(ndjson({ t: "error", text: String(e.message || e) }));
      stopWatch();
      stopOps();
      resolve();
    });
    child.on("close", (code) => {
      if (buf.trim()) {
        if (!(id === "cursor" && cursorFeed.feed(buf))) tokenize(buf, onLine);
      }
      cursorFeed.flush();
      stopWatch();
      stopOps();
      try {
        const text = fs.readFileSync(path.join(ws, "doc.evg.json"), "utf8");
        if (looksLikeEvg(text)) onLine(ndjson({ t: "doc", text }));
      } catch {
        /* gone */
      }
      // Final frame, in case the last write landed with the process.
      frameFile(path.join(ws, "doc.evg.json"), onLine);
      onLine(
        ndjson({
          t: "done",
          ok: code === 0,
          steps: frames,
          ncmds: 0,
          findings: 0,
          agent: id,
          workspace: keep ? ws : undefined,
        }),
      );
      if (!keep) {
        try {
          fs.rmSync(ws, { recursive: true, force: true });
        } catch {
          /* leftover */
        }
      }
      resolve();
    });
  });
}

async function runOllama(task, onLine, signal) {
  const model = process.env.EVG_OLLAMA_MODEL || "llama3.2";
  tokenize(`Asking local Ollama (${model}) to design the screen.`, onLine);
  const body = {
    model,
    stream: true,
    prompt:
      "You emit ONLY a JSON object {\"ops\":[...]} of EVGPatch operations " +
      "for a 390x844 phone UI. Ops: insert (tag div|span), set-prop, set-text. " +
      "Start from an empty div at path 0. Task: " +
      task,
  };
  let acc = "";
  try {
    const res = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok || !res.body) {
      onLine(ndjson({ t: "error", text: `ollama HTTP ${res.status}` }));
      onLine(ndjson({ t: "done", ok: false, steps: 0, ncmds: 0, findings: 0 }));
      return;
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line);
          if (obj.response) {
            acc += obj.response;
            const bits = String(obj.response).split(/\s+/).filter(Boolean);
            for (const w of bits) onLine(ndjson({ t: "token", text: w }));
          }
        } catch {
          /* partial */
        }
      }
    }
  } catch (e) {
    onLine(ndjson({ t: "error", text: String(e.message || e) }));
    onLine(ndjson({ t: "done", ok: false, steps: 0, ncmds: 0, findings: 0 }));
    return;
  }
  const ops = extractOps(acc);
  if (!ops) {
    onLine(ndjson({ t: "error", text: "Ollama did not emit an EVGPatch ops list" }));
    onLine(ndjson({ t: "done", ok: false, steps: 0, ncmds: 0, findings: 0 }));
    return;
  }
  onLine(ndjson({ t: "ops", applied: ops.length, ops }));
  onLine(ndjson({ t: "done", ok: true, steps: 1, ncmds: 0, findings: 0, agent: "ollama" }));
}

function extractOps(text) {
  const start = text.indexOf("{\"ops\"");
  if (start < 0) return null;
  const slice = text.slice(start);
  const end = slice.indexOf("]}") + 2;
  if (end < 2) return null;
  try {
    const obj = JSON.parse(slice.slice(0, end));
    return Array.isArray(obj.ops) ? obj.ops : null;
  } catch {
    return null;
  }
}

export function runRecipeEdit(docPath, onLine, signal, prompt, kind) {
  return new Promise((resolve, reject) => {
    const parsed = parseRestyle(prompt || "");
    const tagged = (line) => {
      try {
        const obj = JSON.parse(String(line).trim());
        if (obj && obj.t === "session") {
          obj.followUp = true;
          onLine(JSON.stringify(obj));
          return;
        }
      } catch {
        /* not json */
      }
      onLine(line);
    };
    const child = spawn("node", [liveBin, "edit", docPath], {
      cwd: root,
      env: {
        ...process.env,
        EVG_LIVEBUILD_PROMPT: prompt || "",
        EVG_LIVEBUILD_KIND: kind || "dashboard",
        ...restyleEnv(parsed),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stop = () => {
      try {
        child.kill("SIGTERM");
      } catch {
        /* gone */
      }
    };
    if (signal) {
      if (signal.aborted) stop();
      else signal.addEventListener("abort", stop, { once: true });
    }
    pipeChild(child, tagged, () => resolve());
    child.on("error", reject);
  });
}

export async function runTask({ agent, kind, prompt, seed, session = false, onLine, signal }) {
  const id = agent || "recipe";
  if (id === "recipe") {
    if (session) {
      const dir = prepareSession(prompt || "", { kind: kind || "dashboard" });
      await runRecipeEdit(path.join(dir, "doc.evg.json"), onLine, signal, prompt, kind);
      return;
    }
    await runRecipe(kind || "dashboard", onLine, signal, prompt);
    return;
  }
  await runWorkspaceAgent({ id, kind, prompt, seed, session, onLine, signal });
}
