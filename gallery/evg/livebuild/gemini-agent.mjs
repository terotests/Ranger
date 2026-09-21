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
 *   EVG_GEMINI_SANDBOX=docker|host — `run` is argv against four tools,
 *   never a shell. Docker is opt-in.
 *   Host tools (MCP-style, not a shell): list_dir, image_info, ocr.
 *   ocr is Tesseract on a workspace image (TESSERACT_PATH). It never
 *   goes through `run`.
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
/** Paid Gemini 3.8 Flash (Developer API), USD per 1M tokens through 2026-12-31. */
export const GEMINI_FLASH_INPUT_PER_M = 0.75;
export const GEMINI_FLASH_OUTPUT_PER_M = 3.75;
export const GEMINI_FLASH_CACHE_PER_M = 0.075;
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

export function geminiSandbox(env = process.env) {
  const v = String(env.EVG_GEMINI_SANDBOX || "host").trim().toLowerCase();
  if (v === "auto") return dockerRunning(env) ? "docker" : "host";
  if (v === "docker") return dockerRunning(env) ? "docker" : "docker-missing";
  return "host";
}

export function dockerRunArgs(workspace, command, env = process.env) {
  const parsed = typeof command === "string" ? parseRun(command) : command;
  if (parsed.error) throw new Error(parsed.error);
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
  args.push(image, parsed.bin, ...parsed.argv);
  return args;
}

function spawnRun(workspace, command, env = process.env) {
  const parsed = parseRun(command);
  if (parsed.error) return { error: parsed.error };
  const childEnv = { ...env };
  delete childEnv.GEMINI_API_KEY;
  delete childEnv.GOOGLE_API_KEY;
  const box = geminiSandbox(env);
  if (box === "docker-missing") {
    return {
      error: "EVG_GEMINI_SANDBOX=docker but docker is not running. Install Docker, or set EVG_GEMINI_SANDBOX=host.",
    };
  }
  let r;
  if (box === "docker") {
    const bin = env.DOCKER_BIN || "docker";
    r = spawnSync(bin, dockerRunArgs(workspace, parsed, env), {
      encoding: "utf8",
      timeout: RUN_TIMEOUT_MS,
      maxBuffer: 2 * 1024 * 1024,
      env: childEnv,
    });
    if (r.error && /ENOENT/.test(String(r.error))) {
      return { error: "docker is not on PATH" };
    }
  } else {
    r = spawnSync(parsed.bin, parsed.argv, {
      cwd: workspace,
      encoding: "utf8",
      timeout: RUN_TIMEOUT_MS,
      maxBuffer: 2 * 1024 * 1024,
      env: childEnv,
    });
  }
  const stdout = r.stdout || "";
  const stderr = r.stderr || "";
  if (parsed.stdoutTo) {
    try {
      const dest = resolveInWorkspace(workspace, parsed.stdoutTo);
      if (parsed.append && fs.existsSync(dest)) fs.appendFileSync(dest, stdout);
      else fs.writeFileSync(dest, stdout);
    } catch (e) {
      return { error: String(e.message || e), sandbox: box === "docker" ? "docker" : "host" };
    }
  }
  return {
    ok: r.status === 0,
    status: r.status,
    stdout: clip(stdout),
    stderr: clip(stderr),
    sandbox: box === "docker" ? "docker" : "host",
  };
}

export const GEMINI_TOOLS = [
  {
    name: "run",
    description:
      "Run ONE workspace tool as argv, not a shell. Only ./evg-agent, ./evg-ui, ./evg-app, ./evg-image. Example: ./evg-agent outline doc.evg.json",
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The tool and its arguments. Not a shell line.",
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
  {
    name: "list_dir",
    description: "List files in a workspace folder. Default is the workspace root. Hidden files are omitted.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative directory, default ." },
      },
    },
  },
  {
    name: "image_info",
    description:
      "What the host already knows about a picture: attachment.json palette after a trace, or the size of an image file. Use this instead of sampling pixels in Python.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative image or attachment.json. Default attachment.json." },
      },
    },
  },
  {
    name: "ocr",
    description:
      "Read printed text out of a workspace image with Tesseract. Default path is attachment.png (or .jpg). Use this for a screenshot's labels — do not crop BMPs or call tesseract via run.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative png/jpg/webp/tif/bmp. Default attachment.png." },
        psm: { type: "integer", description: "Tesseract page segmentation 0–13. Default 6 (block of text)." },
        lang: { type: "string", description: "Tesseract language, default eng." },
      },
    },
  },
];

export function geminiSystemPrompt() {
  return `You edit the live document in this folder. TASK.md is the ask (it names the size). AGENTS.md is the guide.

Start with ./evg-agent outline doc.evg.json. The outline is the screen. Do not OCR or write ops before you have it.

A picture is a PHOTO of a UI, not the UI:
- image_info → palette. Use those colours.
- ocr attachment.png at most ONCE. Tesseract on a busy dashboard is noisy. If the text is broken, keep the words you got — do not re-OCR or change psm.
- Do not read attachment.ops.json or attachment.svg (path data).
- ./evg-agent patch doc.evg.json attachment.ops.json PASTES the photo. "Make a dashboard like this" means rebuild with ./evg-ui, not paste the photo.

The loop:
1. outline
2. ./evg-ui add card --title "…" --row "Title|Sub|value:42" --into doc.evg.json > add.json
   then ./evg-agent patch doc.evg.json add.json
   spec is optional. Do not smoke-test with add button. Do not read AGENTS.md.
3. ./evg-agent measure doc.evg.json --width=W --height=H
   W×H is what TASK.md said: phone 390×844, tablet 820×1180, desktop 1440×900. Not always 390.
   count:0 on the seed (one empty column) is not done — outline must name the cards.

insert with only "tag" is an empty box. A subtree is "node" (document shape), not "children" on the op — children there is ignored and outline will show empty divs. Prefer ./evg-ui: one add card is a whole measured piece.

Never write_file doc.evg.json or layout.json. measure count:0 with three empty nodes is not success — outline must name the cards you added.

Do not git, evg_agent.js, --help, /tmp, python, sips. When the outline matches the ask, stop.`;
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
export const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff", ".bmp", ".gif"]);
const OCR_DEFAULTS = ["attachment.png", "attachment.jpg", "attachment.jpeg", "attachment.webp"];

export function tesseractBin(env = process.env) {
  return String(env.TESSERACT_PATH || env.EVG_TESSERACT || "tesseract").trim() || "tesseract";
}

/** Compiled tool sources and the conversation log are not part of the phone. */
export const GEMINI_TRACE = ".gemini-trace.log";

export function denyRead(rel) {
  const name = path.basename(String(rel || ""));
  if (name === GEMINI_HISTORY) return "read_file will not open the conversation log";
  if (name === GEMINI_TRACE) return "read_file will not open the tool trace";
  if (/^evg[_-].+\.js$/i.test(name)) {
    return "read_file will not open compiled tool sources — call ./evg-agent, do not read the JS";
  }
  if (name === "attachment.ops.json" || name === "attachment.svg") {
    return "that file is path data for the photo — image_info has the palette; paste with ./evg-agent patch doc.evg.json attachment.ops.json; to rebuild a UI like it, ocr once and ./evg-ui";
  }
  if (name === "AGENTS.md") {
    return "the loop is already in the system prompt — ./evg-ui list for pieces, outline for the screen. Do not load the whole guide.";
  }
  return "";
}

export function denyWrite(rel) {
  const name = path.basename(String(rel || ""));
  if (name === GEMINI_HISTORY) return "write_file will not overwrite the conversation log";
  if (name === "doc.evg.json") {
    return "write_file will not replace doc.evg.json — write ops.json, then ./evg-agent patch doc.evg.json ops.json";
  }
  if (name === "layout.json") {
    return "write_file will not invent layout.json — ./evg-agent measure writes it";
  }
  return "";
}

function defaultOcrPath(workspace) {
  for (const name of OCR_DEFAULTS) {
    if (fs.existsSync(path.join(workspace, name))) return name;
  }
  return OCR_DEFAULTS[0];
}

/**
 * Width/height from a header. No decoder, no pixels — the thing Gemini
 * tried to invent with Python + BMP crops.
 */
export function imageHeader(buf) {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf || []);
  if (b.length >= 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return { kind: "png", width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = b[i + 1];
      if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2;
        continue;
      }
      if (i + 4 > b.length) break;
      const len = b.readUInt16BE(i + 2);
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        return { kind: "jpeg", height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
      }
      if (len < 2) break;
      i += 2 + len;
    }
    return { error: "jpeg has no size marker" };
  }
  if (b.length >= 10 && b.toString("ascii", 0, 3) === "GIF") {
    return { kind: "gif", width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
  }
  if (b.length >= 26 && b[0] === 0x42 && b[1] === 0x4d) {
    const h = b.readInt32LE(22);
    return { kind: "bmp", width: b.readInt32LE(18), height: h < 0 ? -h : h };
  }
  if (b.length >= 30 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const fourcc = b.toString("ascii", 12, 16);
    if (fourcc === "VP8 ") {
      return { kind: "webp", width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    }
    if (fourcc === "VP8L" && b.length >= 25) {
      const bits = b.readUInt32LE(21);
      return { kind: "webp", width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (fourcc === "VP8X") {
      return {
        kind: "webp",
        width: 1 + b[24] + (b[25] << 8) + (b[26] << 16),
        height: 1 + b[27] + (b[28] << 8) + (b[29] << 16),
      };
    }
  }
  return { error: "unrecognised image header" };
}

function listDir(workspace, rel) {
  const requested = String(rel || "").trim() || ".";
  const dir = resolveInWorkspace(workspace, requested);
  if (!fs.existsSync(dir)) return { error: `not found: ${requested}` };
  const st = fs.statSync(dir);
  if (!st.isDirectory()) return { error: `not a directory: ${requested}` };
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => !e.name.startsWith("."))
    .map((e) => {
      const item = { name: e.name, kind: e.isDirectory() ? "dir" : "file" };
      if (e.isFile()) item.bytes = fs.statSync(path.join(dir, e.name)).size;
      return item;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  return { path: requested, entries };
}

function imageInfo(workspace, rel) {
  const requested = String(rel || "").trim() || "attachment.json";
  const file = resolveInWorkspace(workspace, requested);
  if (!fs.existsSync(file)) return { error: `not found: ${requested}` };
  const st = fs.statSync(file);
  if (!st.isFile()) return { error: `not a file: ${requested}` };
  const ext = path.extname(file).toLowerCase();
  if (ext === ".json") {
    let j;
    try {
      j = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (e) {
      return { error: `not JSON: ${e.message}` };
    }
    if (j && Array.isArray(j.colors)) {
      return {
        path: requested,
        kind: "palette",
        width: j.width,
        height: j.height,
        layers: j.layers,
        placed: j.placed,
        insertsAt: j.insertsAt,
        colors: j.colors.slice(0, 12),
      };
    }
    return { path: requested, kind: "json", keys: Object.keys(j && typeof j === "object" ? j : {}).slice(0, 24) };
  }
  const header = imageHeader(fs.readFileSync(file));
  if (header.error && header.width == null) return { error: header.error, path: requested };
  return { path: requested, bytes: st.size, ...header };
}

function runOcr(workspace, args, env) {
  const rel = String(args.path || "").trim() || defaultOcrPath(workspace);
  const file = resolveInWorkspace(workspace, rel);
  if (!fs.existsSync(file)) return { error: `not found: ${rel}` };
  const st = fs.statSync(file);
  if (!st.isFile()) return { error: `not a file: ${rel}` };
  const ext = path.extname(file).toLowerCase();
  if (!IMAGE_EXTS.has(ext)) {
    return { error: `ocr only reads images (${[...IMAGE_EXTS].join(", ")}), not ${ext || "this file"}` };
  }
  let psm = Number(args.psm);
  if (!Number.isFinite(psm)) psm = 6;
  psm = Math.floor(psm);
  if (psm < 0 || psm > 13) return { error: "psm must be 0–13" };
  const lang = String(args.lang || "eng").trim() || "eng";
  if (!/^[A-Za-z0-9_+-]+$/.test(lang)) return { error: "lang must be a tesseract language id" };
  const bin = tesseractBin(env);
  const r = spawnSync(bin, [file, "stdout", "--psm", String(psm), "-l", lang], {
    encoding: "utf8",
    timeout: 60_000,
    maxBuffer: 2 * 1024 * 1024,
    env: { ...env },
  });
  if (r.error && /ENOENT/.test(String(r.error))) {
    return {
      error: "tesseract is not installed. Set TESSERACT_PATH, or brew install tesseract (macOS) / apt install tesseract-ocr.",
    };
  }
  if (r.status !== 0) {
    return { error: clip(r.stderr || `tesseract exited ${r.status}`), path: rel, status: r.status };
  }
  return { path: rel, psm, lang, text: clip((r.stdout || "").trim(), 16_000) };
}

function tokenizeRun(raw) {
  const out = [];
  let cur = "";
  let q = "";
  for (let i = 0; i < raw.length; i += 1) {
    const c = raw[i];
    if (q) {
      if (c === q) q = "";
      else cur += c;
      continue;
    }
    if (c === "'" || c === '"') {
      q = c;
      continue;
    }
    if (/[;`$()|&\n]/.test(c)) {
      return { error: "run is not a shell — one ./evg-* command, no pipes, no substitution" };
    }
    if (/\s/.test(c)) {
      if (cur) out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  if (q) return { error: "unclosed quote" };
  if (cur) out.push(cur);
  return { tokens: out };
}

/**
 * Gemini proposes a command; this process decides. Nothing is handed to a
 * shell: the line is split into argv, the binary must be one of RUN_BINS,
 * and that file is exec'd. A trailing `> file` is applied here after the
 * tool exits.
 */
export function parseRun(command) {
  const raw = String(command || "").trim();
  if (!raw) return { error: "run needs a command" };
  const tok = tokenizeRun(raw);
  if (tok.error) return tok;
  const tokens = tok.tokens.slice();
  if (!tokens.length) return { error: "run needs a command" };
  let stdoutTo = "";
  let append = false;
  if (tokens.length >= 2 && (tokens[tokens.length - 2] === ">" || tokens[tokens.length - 2] === ">>")) {
    stdoutTo = tokens.pop();
    append = tokens.pop() === ">>";
  }
  if (tokens.some((t) => t === ">" || t === ">>" || t === "<")) {
    return { error: "run only allows a trailing > file redirect" };
  }
  const bin = tokens[0];
  const argv = tokens.slice(1);
  if (!RUN_BINS.includes(bin)) {
    return { error: `run only accepts ${RUN_BINS.join(", ")}. Not: ${bin}` };
  }
  if (stdoutTo) {
    if (stdoutTo.startsWith("/") || stdoutTo.includes("..")) {
      return { error: "redirect must be a relative file in the workspace" };
    }
  }
  for (const a of argv) {
    if (a.startsWith("/") || a.includes("..")) {
      return { error: "run cannot take absolute paths or .. — stay in this folder" };
    }
  }
  return { bin, argv, stdoutTo, append };
}

export function denyRun(command) {
  return parseRun(command).error || "";
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
      const blocked = denyRead(args.path);
      if (blocked) return { error: blocked };
      const file = resolveInWorkspace(workspace, args.path);
      if (!fs.existsSync(file)) return { error: `not found: ${args.path}` };
      const st = fs.statSync(file);
      if (!st.isFile()) return { error: `not a file: ${args.path}` };
      return { path: String(args.path), contents: clip(fs.readFileSync(file, "utf8"), 80_000) };
    }
    if (name === "write_file") {
      const blocked = denyWrite(args.path);
      if (blocked) return { error: blocked };
      const file = resolveInWorkspace(workspace, args.path);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, String(args.contents ?? ""), "utf8");
      return { ok: true, path: String(args.path), bytes: String(args.contents ?? "").length };
    }
    if (name === "list_dir") return listDir(workspace, args.path);
    if (name === "image_info") return imageInfo(workspace, args.path);
    if (name === "ocr") return runOcr(workspace, args, env);
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
  const thoughts = [];
  const calls = [];
  for (const p of parts || []) {
    if (!p || typeof p !== "object") continue;
    if (p.functionCall && p.functionCall.name) {
      calls.push(p);
      continue;
    }
    if (typeof p.text === "string" && p.text) {
      if (p.thought) thoughts.push(p.text);
      else texts.push(p.text);
    }
  }
  return { text: texts.join("\n").trim(), thought: thoughts.join("\n").trim(), calls };
}

function clipOneLine(text, cap = 280) {
  const s = String(text ?? "").replace(/\s+/g, " ").trim();
  if (s.length <= cap) return s;
  return `${s.slice(0, cap)}…`;
}

function writeKind(contents) {
  const s = String(contents ?? "");
  if (/"op"\s*:/.test(s) && /\[/.test(s)) return "ops";
  if (/"tag"\s*:/.test(s) && /"children"\s*:/.test(s)) return "whole EVG tree";
  return "text";
}

/** One line for the page and the withgemini console: what was asked, what came back. */
export function summarizeTool(name, rawArgs, result) {
  const args = argsOf({ args: rawArgs });
  let call = name;
  if (name === "run") call = String(args.command || "run").trim() || "run";
  else if (name === "write_file") {
    const n = String(args.contents ?? "").length;
    call = `write_file ${args.path || ""} (${n.toLocaleString("en-US")} bytes, ${writeKind(args.contents)})`;
  } else if (name === "read_file" || name === "list_dir" || name === "image_info" || name === "ocr") {
    call = `${name} ${args.path || (name === "list_dir" ? "." : "")}`.trim();
  }
  let reply = "ok";
  if (result && result.error) reply = `error: ${result.error}`;
  else if (name === "ocr" && result && result.text) reply = clipOneLine(result.text);
  else if (name === "run") {
    const out = `${result && result.stdout ? result.stdout : ""}\n${result && result.stderr ? result.stderr : ""}`;
    const count = /"count"\s*:\s*(-?\d+)/.exec(out);
    if (count) reply = `count:${count[1]}`;
    else if (result && !result.ok) {
      reply = clipOneLine(result.stderr || result.stdout || `exit ${result.status}`);
    } else if (result && result.stdout) reply = clipOneLine(result.stdout);
    else reply = "ok";
  } else if (name === "read_file" && result && result.contents != null) {
    reply = `read ${String(result.contents).length.toLocaleString("en-US")} chars`;
  } else if (name === "image_info" && result) {
    reply =
      result.kind === "palette"
        ? `palette ${result.width}×${result.height}, ${(result.colors || []).length} colours`
        : `${result.kind || "image"} ${result.width || "?"}×${result.height || "?"}`;
  } else if (name === "write_file" && result && result.ok) {
    reply = `wrote ${result.bytes} bytes`;
  } else if (name === "list_dir" && result && result.entries) {
    reply = `${result.entries.length} names`;
  }
  return { call, reply, shown: `${call} · ${reply}` };
}

function appendTrace(workspace, line) {
  try {
    fs.appendFileSync(path.join(workspace, GEMINI_TRACE), `${line}\n`);
  } catch {
    /* workspace may be gone */
  }
}

function usageOf(data) {
  const u = (data && data.usageMetadata) || {};
  const num = (v) => (typeof v === "number" && isFinite(v) ? v : 0);
  const prompt = num(u.promptTokenCount);
  const cache = Math.min(num(u.cachedContentTokenCount), prompt);
  return {
    input: prompt,
    fresh: prompt - cache,
    output: num(u.candidatesTokenCount) + num(u.thoughtsTokenCount),
    thoughts: num(u.thoughtsTokenCount),
    cacheRead: cache,
    cacheWrite: 0,
  };
}

export function geminiRates(env = process.env) {
  const inputPerM = Number(env.EVG_GEMINI_INPUT_PER_M || GEMINI_FLASH_INPUT_PER_M);
  const outputPerM = Number(env.EVG_GEMINI_OUTPUT_PER_M || GEMINI_FLASH_OUTPUT_PER_M);
  const inRate = Number.isFinite(inputPerM) && inputPerM >= 0 ? inputPerM : GEMINI_FLASH_INPUT_PER_M;
  const outRate = Number.isFinite(outputPerM) && outputPerM >= 0 ? outputPerM : GEMINI_FLASH_OUTPUT_PER_M;
  const cacheRaw = env.EVG_GEMINI_CACHE_PER_M;
  const cacheNum = cacheRaw == null || cacheRaw === "" ? inRate * (GEMINI_FLASH_CACHE_PER_M / GEMINI_FLASH_INPUT_PER_M) : Number(cacheRaw);
  return {
    inputPerM: inRate,
    outputPerM: outRate,
    cachePerM: Number.isFinite(cacheNum) && cacheNum >= 0 ? cacheNum : GEMINI_FLASH_CACHE_PER_M,
  };
}

/**
 * About-cost from Gemini usageMetadata.
 * promptTokenCount already includes cachedContentTokenCount; those hits
 * are $0.075/1M, not $0.75/1M. Thoughts count as output.
 */
export function geminiCostUsd(usage, env = process.env) {
  const { inputPerM, outputPerM, cachePerM } = geminiRates(env);
  const prompt = Number(usage && usage.input) || 0;
  const cache = Math.min(Number(usage && usage.cacheRead) || 0, prompt);
  const fresh = usage && usage.fresh != null ? Number(usage.fresh) || 0 : Math.max(0, prompt - cache);
  const output = Number(usage && usage.output) || 0;
  return (fresh / 1_000_000) * inputPerM + (cache / 1_000_000) * cachePerM + (output / 1_000_000) * outputPerM;
}

function tokCount(n) {
  return Math.round(Number(n) || 0).toLocaleString("en-US");
}

function moneyUsd(n) {
  const v = Number(n) || 0;
  if (v === 0) return "$0";
  if (v < 0.0001) return `$${v.toFixed(6)}`;
  return `$${v.toFixed(4)}`;
}

export function formatGeminiSpend(usage, extra = {}) {
  const env = extra.env || process.env;
  const cost = extra.cost != null ? extra.cost : geminiCostUsd(usage, env);
  const cache = Math.min(Number(usage && usage.cacheRead) || 0, Number(usage && usage.input) || 0);
  const fresh = usage && usage.fresh != null ? Number(usage.fresh) || 0 : Math.max(0, (Number(usage && usage.input) || 0) - cache);
  const parts = [`${tokCount(fresh)} fresh`, `${tokCount(usage && usage.output)} out`];
  if (usage && usage.thoughts) parts.push(`${tokCount(usage.thoughts)} thought`);
  if (cache) parts.push(`${tokCount(cache)} cache`);
  if ((Number(usage && usage.input) || 0) > fresh) parts.push(`${tokCount(usage.input)} prompt`);
  parts.push(`~${moneyUsd(cost)}`);
  if (extra.turns) parts.push(`${extra.turns} turn${extra.turns === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

function resultEvent(spend, { turns, started, model, env, subtype = "success" }) {
  const cost = geminiCostUsd(spend, env);
  return {
    type: "result",
    subtype,
    num_turns: turns,
    duration_ms: Date.now() - started,
    total_cost_usd: cost,
    usage: {
      input_tokens: spend.fresh,
      output_tokens: spend.output,
      cache_read_input_tokens: spend.cacheRead,
      cache_creation_input_tokens: spend.cacheWrite,
    },
    modelUsage: { [model]: { costUSD: cost } },
  };
}

function addUsage(into, piece) {
  into.input += piece.input;
  into.fresh += piece.fresh || 0;
  into.output += piece.output;
  into.thoughts += piece.thoughts || 0;
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
  else {
    gen.thinkingConfig = { includeThoughts: true };
    if (think && think !== "1" && Number.isFinite(Number(think))) {
      gen.thinkingConfig.thinkingBudget = Number(think);
    }
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
  log = () => {},
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

  const spend = { input: 0, fresh: 0, output: 0, thoughts: 0, cacheRead: 0, cacheWrite: 0 };
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
    const piece = usageOf(data);
    addUsage(spend, piece);
    turns += 1;
    log(`turn ${turns}  ${formatGeminiSpend(piece, { env })}  (run ${formatGeminiSpend(spend, { turns, env })})`);
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
    saveHistory(workspace, contents, { model, followUp });

    const { text, thought, calls } = splitParts(parts);
    if (thought) {
      log(`think: ${clipOneLine(thought, 1500)}`);
      appendTrace(workspace, `think: ${thought}`);
      onEvent({ type: "assistant", message: { content: [{ text: thought }] } });
    }
    if (text) {
      if (thought) log(`say: ${clipOneLine(text, 400)}`);
      onEvent({ type: "assistant", message: { content: [{ text }] } });
    }
    if (!calls.length) {
      const result = resultEvent(spend, { turns, started, model, env });
      onEvent(result);
      return { ok: true, turns, followUp, model, usage: spend, costUsd: result.total_cost_usd };
    }

    const responses = [];
    for (const part of calls) {
      const fc = part.functionCall;
      const name = fc.name;
      const args = argsOf(fc);
      const result = executeTool(workspace, name, args, env);
      const sum = summarizeTool(name, args, result);
      log(`→ ${sum.call}`);
      log(`← ${sum.reply}`);
      appendTrace(workspace, `→ ${sum.call}`);
      appendTrace(workspace, `← ${sum.reply}`);
      onEvent({
        type: "tool_call",
        subtype: "started",
        tool_call: { shellToolCall: { args: { command: sum.shown } } },
      });
      const fr = { name, response: result };
      if (fc.id) fr.id = fc.id;
      responses.push({ functionResponse: fr });
    }
    contents.push({ role: "user", parts: responses });
    saveHistory(workspace, contents, { model, followUp });
  }

  const capped = resultEvent(spend, { turns, started, model, env, subtype: "error" });
  onEvent(capped);
  throw new Error(
    `Gemini hit EVG_GEMINI_MAX_TURNS (${maxTurns}) without finishing — ${formatGeminiSpend(spend, { turns, env })}`,
  );
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
  const rates = geminiRates();
  process.stderr.write(`Gemini: ${geminiModel()} → ${geminiBase()}\n`);
  process.stderr.write(
    `rates $${rates.inputPerM} fresh / $${rates.cachePerM} cache / $${rates.outputPerM} out per 1M (Flash paid tier)\n`,
  );
  try {
    const result = await geminiLoop({
      workspace: ws,
      onEvent: emit,
      log: (line) => process.stderr.write(`${line}\n`),
    });
    process.stderr.write(
      `Gemini finished in ${result.turns} turn(s) — ${formatGeminiSpend(result.usage, { turns: result.turns })}\n`,
    );
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
