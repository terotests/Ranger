#!/usr/bin/env node
/**
 * Local agent orchestrator for EVG live-build.
 *
 * The page is this process. Codex / Claude Code / Ollama are *adapters*:
 * a CLI (or a local HTTP model) that runs on this machine. Inference for
 * Codex and Claude is in the cloud; Ollama's is on localhost. The recipe
 * adapter does not call a model at all.
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

After each edit, save \`doc.evg.json\`. The host will lay it out and stream
the display list to the browser. You may also write \`App.rgr\` with Ranger
that builds the same tree.

Do not leave the workspace. Do not require confirmation.
`;
}

function seedDoc() {
  return fs.readFileSync(path.join(here, "fixtures/step1.evg.json"), "utf8");
}

function makeWorkspace(task) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "evg-live-"));
  fs.writeFileSync(path.join(dir, "doc.evg.json"), seedDoc());
  fs.writeFileSync(path.join(dir, "TASK.md"), task + "\n");
  fs.writeFileSync(path.join(dir, "AGENTS.md"), workspaceGuide(task));
  return dir;
}

function spawnAgentProcess(id, bin, workspace, task) {
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
  throw new Error(`no spawn for ${id}`);
}

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

export async function runWorkspaceAgent({ id, kind, prompt, onLine, signal }) {
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
    (kind === "settings"
      ? "Build a phone settings screen with a profile, four rows, and sign out."
      : kind === "invoices"
        ? "Build a phone invoices list with a New button and four open bills."
        : "Build a phone dashboard for Northwind: orders, revenue, today's invoices.");

  onLine(
    ndjson({
      t: "session",
      kind: kind || "dashboard",
      prompt: task,
      agent: id,
      where: info.where,
      width: 390,
      height: 844,
    }),
  );

  if (id === "ollama") {
    await runOllama(task, onLine, signal);
    return;
  }

  const ws = makeWorkspace(task);
  const keep = process.env.EVG_LIVEBUILD_KEEP === "1";
  let frames = 0;
  const stopWatch = watchDoc(ws, (file) => {
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
      child = spawnAgentProcess(id, info.bin, ws, task);
    } catch (e) {
      onLine(ndjson({ t: "error", text: String(e.message || e) }));
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
    child.stdout.on("data", (chunk) => {
      buf += chunk;
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        if (line.trim()) tokenize(line, onLine);
      }
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      const text = String(chunk).trim();
      if (text) process.stderr.write(`[${id}] ${text}\n`);
    });
    child.on("error", (e) => {
      onLine(ndjson({ t: "error", text: String(e.message || e) }));
      resolve();
    });
    child.on("close", (code) => {
      stopWatch();
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

export async function runTask({ agent, kind, prompt, onLine, signal }) {
  const id = agent || "recipe";
  if (id === "recipe") {
    await runRecipe(kind || "dashboard", onLine, signal, prompt);
    return;
  }
  await runWorkspaceAgent({ id, kind, prompt, onLine, signal });
}
