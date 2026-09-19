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

function workspaceGuide(task) {
  return `# EVG live-build workspace

You are a local agent. The orchestrator on this machine gave you this folder
and this task. Change the UI by editing \`doc.evg.json\`.

## Task

${task}

\`doc.evg.json\` is already a 390 × 844 phone UI with real content. Read
it (or \`./evg-agent outline doc.evg.json\`) before editing. Edit that
file in place. Do not replace it with a blank page unless the task says
to start over. If the outline has more than a handful of nodes, the
phone is not empty.

## How to change the document

The tree is EVG JSON. Prefer small patches over rewriting the file.

Phone size: 390 × 844. Stay on the page. Use flex column, padding, gap.
Patchable properties include width, height, display, flex-direction,
justify-content, align-items, gap, padding-*, margin-*, color,
background-color, border-radius, font-size, font-weight.

A node is:

\`\`\`json
{"tag":"div","props":{"display":"flex"},"children":[{"tag":"span","text":"Hi"}]}
\`\`\`

If \`./evg-agent\` exists in this folder, use it. It is the same tool
surface as \`npm run agent\` in the Ranger repo:

\`\`\`
./evg-agent outline doc.evg.json
./evg-agent query   doc.evg.json .card
./evg-agent patch   doc.evg.json ops.json
./evg-agent measure doc.evg.json --width=390 --height=844
\`\`\`

\`outline\` prints addresses. Re-run it after any insert/remove/move.
\`patch\` takes a JSON file of ops and writes \`doc.evg.json\`:

\`\`\`json
{"ops":[
  {"op":"set-text","at":"0/0/k:title","value":"Invoices"},
  {"op":"set-prop","at":"0/0","prop":"background-color","value":"rgb(255,251,235)"},
  {"op":"insert","at":"0/0","index":2,"tag":"span"}
]}
\`\`\`

A rejected op fails the whole batch and changes nothing. \`measure\`
reports overflow, overlap, and nodes off the page — trust those numbers
over a screenshot.

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

If there is no \`./evg-agent\`, edit \`doc.evg.json\` directly and save.
The host lays each save out and streams the display list to the browser.
You may also write \`App.rgr\` with Ranger that builds the same tree.

Do not leave the workspace. Do not require confirmation.
`;
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

function installEvgAgent(dir) {
  const src = path.join(root, "lib/evg/bin/evg_agent.js");
  if (!fs.existsSync(src)) return false;
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
      // Only `patch` is buffered, and only a batch the tool said it APPLIED is
      // recorded: a rejection exits 0 with `"ok":false`, and a panel showing
      // ops that never landed would be worse than an empty one.
      'if [ "$1" = "patch" ]; then',
      '  out=$(node "$dir/evg_agent.js" "$@")',
      "  status=$?",
      `  printf '%s\\n' "$out"`,
      '  if [ "$status" = "0" ] && [ -f "$3" ]; then',
      "    case \"$out\" in",
      `      *'\"ok\":true'*) node -e '${OPS_LOG_SNIPPET}' "$3" "$dir/${OPS_LOG}" ;;`,
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

// One line per applied batch, so the host can read it with an offset and never
// half-parse a write in flight.
const OPS_LOG = ".applied-ops.log";
const OPS_LOG_SNIPPET =
  'const fs=require("fs");try{const o=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));' +
  'if(o&&Array.isArray(o.ops)&&o.ops.length)fs.appendFileSync(process.argv[2],JSON.stringify(o.ops)+"\\n");}catch(e){}';

function watchOps(workspace, onOps) {
  const file = path.join(workspace, OPS_LOG);
  try {
    fs.rmSync(file, { force: true });
  } catch {
    /* a session workspace keeps the last run's log */
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
  fs.writeFileSync(
    path.join(dir, "AGENTS.md"),
    workspaceGuide("The phone already has a UI in doc.evg.json. Wait for the next task."),
  );
  try {
    fs.unlinkSync(path.join(dir, ".cursor-follow"));
  } catch {
    /* first */
  }
  installEvgAgent(dir);
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
  fs.writeFileSync(path.join(dir, "AGENTS.md"), workspaceGuide(task));
  installEvgAgent(dir);
  if (git && !fs.existsSync(path.join(dir, ".git"))) seedGit(dir);
  return dir;
}

function makeWorkspace(task, { git = false, doc = "", kind = "dashboard" } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "evg-live-"));
  const text = looksLikeEvg(doc) ? doc : seedDoc(kind);
  fs.writeFileSync(path.join(dir, "doc.evg.json"), text);
  fs.writeFileSync(path.join(dir, "TASK.md"), task + "\n");
  fs.writeFileSync(path.join(dir, "AGENTS.md"), workspaceGuide(task));
  installEvgAgent(dir);
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
      frames += 1;
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
