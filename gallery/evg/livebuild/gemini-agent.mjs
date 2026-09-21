#!/usr/bin/env node
/**
 * Drive EVG live-build with Google Gemini Flash over the network.
 *
 * Not the Cursor `agent` CLI: this process talks to the Gemini API itself,
 * runs the workspace tools (`./evg-agent`, `./evg-ui`, …), and keeps the
 * conversation in `.gemini-history.json` so a Follow-up is the next turn
 * rather than a blank mind.
 *
 *   GEMINI_API_KEY from Google AI Studio is enough.
 *   GOOGLE_API_KEY is accepted if GEMINI_API_KEY is empty.
 *   EVG_GEMINI_MODEL selects the Flash id (default gemini-3.8-flash).
 *   EVG_GEMINI_MAX_TURNS is generateContent rounds per Follow-up (default 64).
 *   EVG_GEMINI_SANDBOX=auto|docker|host — `run` goes in a node-slim
 *   container (no python, no tesseract) when Docker is up; allowlist
 *   always applies.
 *
 * Stdout is the same `stream-json` shape Cursor already emits, so the
 * page's thinking panel and spend line work without a second parser.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const GEMINI_HISTORY = ".gemini-history.json";
export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
export const DEFAULT_GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export const DEFAULT_DOCKER_IMAGE = "node:22-bookworm-slim";
const here = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(here, "../../..");
export const DEFAULT_MAX_TURNS = 64;
const TOOL_OUT_CAP = 24_000;
const DEFAULT_HISTORY_CHARS = 350_000;
const RUN_TIMEOUT_MS = 90_000;

export function geminiKey(env = process.env) {
  return String(env.GEMINI_API_KEY || env.GOOGLE_API_KEY || "").trim();
}

export function geminiModel(env = process.env) {
  return String(env.EVG_GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim() || DEFAULT_GEMINI_MODEL;
}

export function geminiMaxTurns(env = process.env) {
  const n = Number(env.EVG_GEMINI_MAX_TURNS || DEFAULT_MAX_TURNS);
  return Math.max(1, Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_MAX_TURNS);
}

export function geminiBase(env = process.env) {
  const raw = String(env.GEMINI_API_BASE || env.GOOGLE_API_BASE || DEFAULT_GEMINI_BASE).trim();
  return raw.replace(/\/$/, "") || DEFAULT_GEMINI_BASE;
}

export function geminiDockerImage(env = process.env) {
  return String(env.EVG_GEMINI_DOCKER_IMAGE || DEFAULT_DOCKER_IMAGE).trim() || DEFAULT_DOCKER_IMAGE;
}

let dockerMemo;
export function dockerRunning(env = process.env) {
  if (env.EVG_GEMINI_DOCKER === "0") return false;
  if (dockerMemo !== undefined) return dockerMemo;
  const bin = env.DOCKER_BIN || "docker";
  try {
    const r = spawnSync(bin, ["info"], {
      encoding: "utf8",
      timeout: 2500,
      stdio: ["ignore", "pipe", "pipe"],
    });
    dockerMemo = r.status === 0;
  } catch {
    dockerMemo = false;
  }
  return dockerMemo;
}

export function resetDockerMemo() {
  dockerMemo = undefined;
}

/** host | docker | docker-missing */
export function geminiSandbox(env = process.env) {
  const v = String(env.EVG_GEMINI_SANDBOX || "auto").trim().toLowerCase();
  if (v === "host" || v === "off" || v === "0") return "host";
  if (v === "docker") return dockerRunning(env) ? "docker" : "docker-missing";
  return dockerRunning(env) ? "docker" : "host";
}

export function dockerRunArgs(workspace, command, env = process.env) {
  const image = geminiDockerImage(env);
  const root = env.EVG_GEMINI_REPO || repoRoot;
  const args = [
    "run",
    "--rm",
    "--network",
    "none",
    "--read-only",
    "--tmpfs",
    "/tmp:rw,noexec,nosuid,size=64m",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "-v",
    `${workspace}:${workspace}`,
    "-v",
    `${root}:${root}:ro`,
    "-w",
    workspace,
  ];
  try {
    const { uid, gid } = os.userInfo();
    if (Number.isInteger(uid) && uid >= 0 && Number.isInteger(gid) && gid >= 0) {
      args.push("--user", `${uid}:${gid}`);
    }
  } catch {
    /* Windows */
  }
  args.push(image, "sh", "-c", command);
  return args;
}

function spawnRun(workspace, command, env = process.env) {
  const childEnv = { ...env };
  delete childEnv.GEMINI_API_KEY;
  delete childEnv.GOOGLE_API_KEY;
  const box = geminiSandbox(env);
  if (box === "docker-missing") {
    return {
      error: "EVG_GEMINI_SANDBOX=docker but docker is not running. Install Docker, or set EVG_GEMINI_SANDBOX=host.",
    };
  }
  if (box === "docker") {
    const bin = env.DOCKER_BIN || "docker";
    const r = spawnSync(bin, dockerRunArgs(workspace, command, env), {
      encoding: "utf8",
      timeout: RUN_TIMEOUT_MS,
      maxBuffer: 2 * 1024 * 1024,
      env: childEnv,
    });
    if (r.error && /ENOENT/.test(String(r.error))) {
      return { error: "docker is not on PATH" };
    }
    return {
      ok: r.status === 0,
      status: r.status,
      stdout: clip(r.stdout || ""),
      stderr: clip(r.stderr || ""),
      sandbox: "docker",
    };
  }
  const r = spawnSync("sh", ["-c", command], {
    cwd: workspace,
    encoding: "utf8",
    timeout: RUN_TIMEOUT_MS,
    maxBuffer: 2 * 1024 * 1024,
    env: childEnv,
  });
  return {
    ok: r.status === 0,
    status: r.status,
    stdout: clip(r.stdout || ""),
    stderr: clip(r.stderr || ""),
    sandbox: "host",
  };
}

export const GEMINI_TOOLS = [
  {
    name: "run",
    description:
      "Run ONE workspace tool. Only ./evg-agent, ./evg-ui, ./evg-app, ./evg-image are allowed — no python, no tesseract, no git, no /tmp. Example: ./evg-agent outline doc.evg.json",
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "A shell command to run in the workspace.",
        },
      },
      required: ["command"],
    },
  },
  {
    name: "read_file",
    description: "Read a UTF-8 file in the workspace. Path is relative to this folder.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative path, for example doc.evg.json or layout.json." },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description:
      "Write a UTF-8 file in the workspace. Use this for ops.json, then run ./evg-agent patch doc.evg.json ops.json.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative path to write." },
        contents: { type: "string", description: "The full file contents." },
      },
      required: ["path", "contents"],
    },
  },
];

export function geminiSystemPrompt() {
  return `You are a local agent editing a phone UI in this folder.

doc.evg.json is the screen. TASK.md is the ask (also in the user message). AGENTS.md is the full guide.

The loop:
1. ./evg-agent outline doc.evg.json
2. write_file an ops JSON, then ./evg-agent patch doc.evg.json ops.json
3. ./evg-agent measure doc.evg.json --width=390 --height=844
Fix findings. count:0 is the goal. After a save, layout.json has the same numbers.

run may only invoke ./evg-agent, ./evg-ui, ./evg-app, ./evg-image. Use read_file and write_file for everything else. Do not python, tesseract, sips, git, or write /tmp. Do not OCR a screenshot — the document and measure are the picture.

Stay in this folder. Edit the live document in place. Do not replace it with a blank page unless the task says to start over. When the screen is right, stop — do not keep calling tools.`;
}

function clip(text, cap = TOOL_OUT_CAP) {
  const s = String(text ?? "");
  if (s.length <= cap) return s;
  return s.slice(0, cap) + `\n… truncated ${s.length - cap} chars`;
}

export function resolveInWorkspace(workspace, rel) {
  const root = path.resolve(workspace);
  const full = path.resolve(root, String(rel || ""));
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error("path leaves the workspace");
  }
  return full;
}

export function argsOf(fc) {
  let a = (fc && (fc.args ?? fc.arguments)) || {};
  if (typeof a === "string") {
    try {
      a = JSON.parse(a);
    } catch {
      a = { command: a };
    }
  }
  return a && typeof a === "object" && !Array.isArray(a) ? a : {};
}

export const RUN_BINS = ["./evg-agent", "./evg-ui", "./evg-app", "./evg-image"];

/**
 * `run` is not a shell. Flash will OCR /tmp, rewrite BMP headers and call
 * tesseract if you let it — those are host processes, and they are how a
 * "bounded workspace" stops being bounded. Only the four workspace tools
 * are allowed; read_file / write_file cover the rest.
 */
export function denyRun(command) {
  const raw = String(command || "").trim();
  if (!raw) return "run needs a command";
  const chunks = raw.split(/\s*(?:&&|\|\||;|\n)\s*/);
  for (const chunk of chunks) {
    const piece0 = chunk.trim();
    if (!piece0) continue;
    if (piece0.includes("|")) {
      return "run cannot pipe — call one ./evg-* command at a time";
    }
    let abs = false;
    let dots = false;
    let piece = piece0
      .replace(/(?:^|\s)\d*(?:>>?|<<?)\s*\/dev\/null/g, " ")
      .replace(/(?:^|\s)\d*>&?\d*/g, " ")
      .replace(/(?:^|\s)(?:>>?|<<?)\s*(\S+)/g, (_, file) => {
        if (file === "/dev/null") return " ";
        if (file.startsWith("/")) {
          abs = true;
          return " ";
        }
        if (file.includes("..")) {
          dots = true;
          return " ";
        }
        return " ";
      });
    if (abs) return "run cannot redirect outside the workspace";
    if (dots) return "run cannot use .. in a path";
    piece = piece.trim();
    const tok = piece.split(/\s+/)[0] || "";
    if (!RUN_BINS.includes(tok)) {
      return `run only accepts ${RUN_BINS.join(", ")}. Not: ${tok || raw.slice(0, 80)}`;
    }
    const rest = piece.slice(tok.length);
    if (/\.\.(\/|$)/.test(rest)) return "run cannot use .. in a path";
    if (/(?:^|[\s='"])\/(?!dev\/null)/.test(rest)) {
      return "run cannot take absolute paths — stay in this folder";
    }
  }
  return "";
}

export function executeTool(workspace, name, rawArgs, env = process.env) {
  const args = argsOf({ args: rawArgs });
  try {
    if (name === "run") {
      const command = String(args.command || "").trim();
      if (!command) return { error: "run needs a command" };
      const blocked = denyRun(command);
      if (blocked) return { error: blocked };
      return spawnRun(workspace, command, env);
    }
    if (name === "read_file") {
      const file = resolveInWorkspace(workspace, args.path);
      if (!fs.existsSync(file)) return { error: `not found: ${args.path}` };
      const st = fs.statSync(file);
      if (!st.isFile()) return { error: `not a file: ${args.path}` };
      return { path: String(args.path), contents: clip(fs.readFileSync(file, "utf8"), 80_000) };
    }
    if (name === "write_file") {
      const file = resolveInWorkspace(workspace, args.path);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, String(args.contents ?? ""), "utf8");
      return { ok: true, path: String(args.path), bytes: String(args.contents ?? "").length };
    }
    return { error: `unknown tool ${name}` };
  } catch (e) {
    return { error: String(e.message || e) };
  }
}

export function loadHistory(workspace) {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(workspace, GEMINI_HISTORY), "utf8"));
    if (j && Array.isArray(j.contents)) return j.contents;
  } catch {
    /* first turn */
  }
  return [];
}

export function saveHistory(workspace, contents, extra = {}) {
  const file = path.join(workspace, GEMINI_HISTORY);
  fs.writeFileSync(
    file,
    `${JSON.stringify({ contents, saved: new Date().toISOString(), ...extra }, null, 0)}\n`,
  );
}

export function trimHistory(contents, cap = DEFAULT_HISTORY_CHARS) {
  const out = Array.isArray(contents) ? contents.slice() : [];
  let size = JSON.stringify(out).length;
  while (out.length > 4 && size > cap) {
    out.splice(1, 1);
    size = JSON.stringify(out).length;
  }
  return out;
}

export function splitParts(parts) {
  const texts = [];
  const calls = [];
  for (const p of parts || []) {
    if (!p || typeof p !== "object") continue;
    if (p.functionCall && p.functionCall.name) {
      calls.push(p);
      continue;
    }
    if (typeof p.text === "string" && p.text) texts.push(p.text);
  }
  return { text: texts.join("\n").trim(), calls };
}

function usageOf(data) {
  const u = (data && data.usageMetadata) || {};
  const num = (v) => (typeof v === "number" && isFinite(v) ? v : 0);
  return {
    input: num(u.promptTokenCount),
    output: num(u.candidatesTokenCount) + num(u.thoughtsTokenCount),
    cacheRead: num(u.cachedContentTokenCount),
    cacheWrite: 0,
  };
}

function addUsage(into, piece) {
  into.input += piece.input;
  into.output += piece.output;
  into.cacheRead += piece.cacheRead;
  into.cacheWrite += piece.cacheWrite;
}

function errorFromBody(status, text) {
  try {
    const j = JSON.parse(text);
    const msg = j && j.error && (j.error.message || j.error.status);
    if (msg) return `Gemini HTTP ${status}: ${msg}`;
  } catch {
    /* not json */
  }
  return `Gemini HTTP ${status}: ${String(text || "").slice(0, 400)}`;
}

export async function geminiGenerate({
  base,
  model,
  key,
  body,
  fetchImpl = fetch,
  signal,
}) {
  const url = `${base}/models/${encodeURIComponent(model)}:generateContent`;
  const res = await fetchImpl(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": key,
    },
    body: JSON.stringify(body),
    signal,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(errorFromBody(res.status, text));
  }
  if (!res.ok || (data && data.error)) {
    throw new Error(errorFromBody(res.status, text));
  }
  return data;
}

function requestBody(contents, env = process.env) {
  const gen = {
    temperature: 0.4,
    maxOutputTokens: 8192,
  };
  const think = String(env.EVG_GEMINI_THINKING || "").trim();
  if (think === "0") gen.thinkingConfig = { thinkingBudget: 0 };
  else if (think && think !== "1" && Number.isFinite(Number(think))) {
    gen.thinkingConfig = { thinkingBudget: Number(think) };
  }
  return {
    systemInstruction: { parts: [{ text: geminiSystemPrompt() }] },
    contents,
    tools: [{ functionDeclarations: GEMINI_TOOLS }],
    generationConfig: gen,
  };
}

/**
 * One agent run. `onEvent` receives Cursor-shaped stream-json objects.
 * History is read and written in the workspace so the next Follow-up continues.
 */
export async function geminiLoop({
  workspace,
  onEvent,
  fetchImpl = fetch,
  env = process.env,
  signal,
}) {
  const key = geminiKey(env);
  if (!key) throw new Error("GEMINI_API_KEY is not set (Google AI Studio). GOOGLE_API_KEY is also accepted.");
  const model = geminiModel(env);
  const base = geminiBase(env);
  const taskPath = path.join(workspace, "TASK.md");
  let task = "";
  try {
    task = fs.readFileSync(taskPath, "utf8").trim();
  } catch {
    task = "";
  }
  if (!task) task = "Edit doc.evg.json.";

  const prior = loadHistory(workspace);
  const followUp = prior.length > 0;
  let contents = trimHistory(
    [...prior, { role: "user", parts: [{ text: task }] }],
    Number(env.EVG_GEMINI_HISTORY_CHARS || DEFAULT_HISTORY_CHARS),
  );

  const spend = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  const maxTurns = geminiMaxTurns(env);
  const started = Date.now();
  let turns = 0;

  for (let i = 0; i < maxTurns; i += 1) {
    if (signal && signal.aborted) throw new Error("aborted");
    const data = await geminiGenerate({
      base,
      model,
      key,
      body: requestBody(contents, env),
      fetchImpl,
      signal,
    });
    addUsage(spend, usageOf(data));
    const candidate = data.candidates && data.candidates[0];
    const parts = (candidate && candidate.content && candidate.content.parts) || [];
    if (!parts.length) {
      const block = data.promptFeedback && data.promptFeedback.blockReason;
      throw new Error(block ? `Gemini blocked the prompt (${block})` : "Gemini returned no content");
    }
    // Keep the parts as they arrived — thought signatures have to go back
    // on the next call or Gemini 2.5/3 rejects the function response.
    contents.push({
      role: (candidate.content && candidate.content.role) || "model",
      parts,
    });
    turns += 1;
    saveHistory(workspace, contents, { model, followUp });

    const { text, calls } = splitParts(parts);
    if (text) {
      onEvent({ type: "assistant", message: { content: [{ text }] } });
    }
    if (!calls.length) {
      onEvent({
        type: "result",
        subtype: "success",
        num_turns: turns,
        duration_ms: Date.now() - started,
        usage: {
          input_tokens: spend.input,
          output_tokens: spend.output,
          cache_read_input_tokens: spend.cacheRead,
          cache_creation_input_tokens: spend.cacheWrite,
        },
        modelUsage: { [model]: {} },
      });
      return { ok: true, turns, followUp, model, usage: spend };
    }

    const responses = [];
    for (const part of calls) {
      const fc = part.functionCall;
      const name = fc.name;
      const args = argsOf(fc);
      const shown =
        name === "run"
          ? String(args.command || name)
          : name === "read_file" || name === "write_file"
            ? `${name} ${args.path || ""}`.trim()
            : name;
      onEvent({
        type: "tool_call",
        subtype: "started",
        tool_call: { shellToolCall: { args: { command: shown } } },
      });
      const result = executeTool(workspace, name, args, env);
      const fr = { name, response: result };
      if (fc.id) fr.id = fc.id;
      responses.push({ functionResponse: fr });
    }
    contents.push({ role: "user", parts: responses });
    saveHistory(workspace, contents, { model, followUp });
  }

  throw new Error(`Gemini hit EVG_GEMINI_MAX_TURNS (${maxTurns}) without finishing`);
}

function emit(obj) {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

async function main() {
  const check = process.argv.includes("--check");
  if (check) {
    const key = geminiKey();
    if (!key) {
      process.stdout.write("gemini API off\n");
      process.exit(0);
    }
    process.stdout.write(`gemini API ready (${geminiModel()})\n`);
    process.exit(0);
  }

  const ws = process.argv[2];
  if (!ws) {
    process.stderr.write("usage: gemini-agent.mjs <workspace>\n");
    process.exit(2);
  }
  if (!geminiKey()) {
    process.stderr.write("GEMINI_API_KEY is not set. Get one at https://aistudio.google.com/apikey\n");
    process.exit(1);
  }
  process.stderr.write(`Gemini: ${geminiModel()} → ${geminiBase()}\n`);
  try {
    const result = await geminiLoop({
      workspace: ws,
      onEvent: emit,
    });
    process.stderr.write(`Gemini finished in ${result.turns} turn(s)\n`);
    process.exit(result.ok ? 0 : 1);
  } catch (e) {
    const text = String(e.message || e);
    process.stderr.write(`${text}\n`);
    emit({ type: "assistant", message: { content: [{ text }] } });
    process.exit(1);
  }
}

const thisFile = fileURLToPath(import.meta.url);
const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invoked && path.resolve(invoked) === thisFile) {
  main();
}
