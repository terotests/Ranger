#!/usr/bin/env node
/**
 * Serve the EVG live-build demo: a page that paints display lists as an agent
 * on this machine emits thinking tokens, EVGPatch ops, and frames.
 *
 *   npm run livebuild:serve
 *   open http://127.0.0.1:8765
 *
 * The Ranger program prints NDJSON. This file is only the HTTP door: static
 * files, one SSE stream per build, and a small delay so a person can watch
 * the tokens and the phone fill in. Nothing here edits a tree or lays one out.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { listAgents, runTask, frameFixture, seedDoc } from "./agents.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const bin = path.join(root, "gallery/evg/bin/evg_livebuild.js");
const web = path.join(here, "web");
const PORT = Number(process.env.EVG_LIVEBUILD_PORT || 8765);
const DEFAULT_AGENT = process.env.EVG_LIVEBUILD_DEFAULT_AGENT || "recipe";

const KINDS = new Set(["dashboard", "settings", "invoices", "empty"]);
let lastDoc = seedDoc("dashboard");
let lastKind = "dashboard";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function compile() {
  const env = { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" };
  const outdir = path.join(root, "gallery/evg/bin");
  fs.mkdirSync(outdir, { recursive: true });
  try {
    fs.unlinkSync(bin);
  } catch {
    /* first run */
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
  if (log.status !== 0 || /Compilation FAILED/.test(text)) {
    const fail = text.split("\n").filter((l) => /\[FAIL\]|FAILED|error/i.test(l)).slice(0, 40);
    throw new Error(`livebuild compile failed:\n${fail.join("\n") || text.slice(-1500)}`);
  }
  if (!fs.existsSync(bin)) {
    throw new Error("livebuild compile wrote no gallery/evg/bin/evg_livebuild.js");
  }
}

function pickKind(chip, prompt) {
  const p = String(prompt || "").toLowerCase();
  if (p.trim() === "empty" || /empty canvas|blank phone/.test(p)) return "empty";
  if (/setting|profile|account|pref|sign.?out/.test(p)) return "settings";
  if (/invoice|bill|crud|ledger|receivable/.test(p)) return "invoices";
  if (/dashboard|northwind|metric|orders|revenue/.test(p)) return "dashboard";
  const c = String(chip || "").toLowerCase().trim();
  if (KINDS.has(c)) return c;
  return lastKind || "dashboard";
}

function send(res, status, type, body) {
  res.writeHead(status, {
    "content-type": type,
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
  });
  res.end(body);
}

function streamBuild(res, { kind, agent, prompt, paceMs, seed }) {
  res.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-store",
    connection: "keep-alive",
    "access-control-allow-origin": "*",
    "x-accel-buffering": "no",
  });
  res.write(`event: hello\ndata: {"t":"hello","kind":${JSON.stringify(kind)},"agent":${JSON.stringify(agent)}}\n\n`);

  const ac = new AbortController();
  let closed = false;
  let chain = Promise.resolve();

  const end = () => {
    if (closed) return;
    closed = true;
    ac.abort();
  };
  res.on("close", end);

  const emit = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let t = "message";
    try {
      const obj = JSON.parse(trimmed);
      if (obj && typeof obj.t === "string") t = obj.t;
      if (t === "doc" && typeof obj.text === "string" && obj.text.trim().startsWith("{")) {
        lastDoc = obj.text;
      }
    } catch {
      t = "raw";
    }
    res.write(`event: ${t}\n`);
    res.write(`data: ${trimmed}\n\n`);
  };

  const pace = (line) => {
    chain = chain.then(async () => {
      if (closed) return;
      emit(line);
      if (paceMs <= 0 || agent !== "recipe") return;
      let wait = paceMs;
      if (/"t":"token"/.test(line)) wait = Math.max(12, Math.floor(paceMs * 0.6));
      else if (/"t":"frame"/.test(line)) wait = Math.max(paceMs, 90);
      else if (/"t":"think"/.test(line)) wait = Math.max(paceMs, 40);
      else wait = Math.min(paceMs, 20);
      await new Promise((r) => setTimeout(r, wait));
    });
  };

  runTask({
    agent,
    kind,
    prompt,
    seed,
    onLine: pace,
    signal: ac.signal,
  })
    .catch((e) => {
      emit(JSON.stringify({ t: "error", text: String(e.message || e) }));
    })
    .finally(() => {
      chain = chain.then(() => {
        if (!closed) {
          res.write(`event: close\ndata: {"t":"close"}\n\n`);
          res.end();
        }
        closed = true;
      });
    });
}

function staticFile(urlPath) {
  if (urlPath === "/" || urlPath === "/index.html") {
    return path.join(web, "index.html");
  }
  if (urlPath === "/evg-html.js") {
    return path.join(root, "lib/evg/html/evg-html.js");
  }
  if (urlPath.startsWith("/fonts/")) {
    const name = path.basename(urlPath);
    const fonts = path.join(root, "gallery/pdf_writer/assets/fonts/Noto_Sans");
    return path.join(fonts, name);
  }
  const rel = urlPath.replace(/^\/+/, "");
  const candidate = path.join(web, rel);
  if (candidate.startsWith(web)) return candidate;
  return null;
}

function main() {
  compile();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "content-type",
      });
      res.end();
      return;
    }
    if (url.pathname === "/favicon.ico") {
      send(res, 204, "image/x-icon", "");
      return;
    }
    if (url.pathname === "/kinds") {
      send(
        res,
        200,
        "application/json; charset=utf-8",
        JSON.stringify({
          kinds: [
            {
              id: "dashboard",
              label: "Dashboard",
              prompt: "Add a four-tab bottom nav: Home, Search, Alerts, You.",
            },
            {
              id: "settings",
              label: "Settings",
              prompt: "Add a dark mode row and make Sign out red.",
            },
            {
              id: "invoices",
              label: "Invoices",
              prompt: "Add a search field and mark the overdue bills.",
            },
            {
              id: "empty",
              label: "Empty",
              prompt: "Build a phone dashboard for Northwind on this empty canvas.",
            },
          ],
        }),
      );
      return;
    }
    if (url.pathname === "/agents") {
      send(
        res,
        200,
        "application/json; charset=utf-8",
        JSON.stringify({ agents: listAgents(), preferred: DEFAULT_AGENT }),
      );
      return;
    }
    if (url.pathname === "/seed") {
      const kind = KINDS.has(url.searchParams.get("kind"))
        ? url.searchParams.get("kind")
        : "dashboard";
      const framed = frameFixture(kind);
      lastDoc = framed.doc;
      lastKind = kind;
      const frame = framed.events.find((e) => e && e.t === "frame") || {};
      send(
        res,
        200,
        "application/json; charset=utf-8",
        JSON.stringify({
          kind,
          seed: true,
          width: frame.width || 390,
          height: frame.height || 844,
          ncmds: frame.ncmds || 0,
          added: 0,
          nodes: frame.nodes || 0,
          list: frame.list || { cmds: [] },
        }),
      );
      return;
    }
    if (url.pathname === "/stream") {
      const prompt = url.searchParams.get("prompt") || "";
      const kind = pickKind(url.searchParams.get("kind") || lastKind, prompt);
      const agent = url.searchParams.get("agent") || DEFAULT_AGENT;
      const pace = Number(url.searchParams.get("pace") ?? 28);
      streamBuild(res, {
        kind,
        agent,
        prompt,
        seed: lastDoc,
        paceMs: Number.isFinite(pace) ? pace : 28,
      });
      return;
    }
    if (req.method === "POST" && url.pathname === "/build") {
      let body = "";
      req.on("data", (c) => {
        body += c;
        if (body.length > 8000) req.destroy();
      });
      req.on("end", () => {
        let prompt = "";
        try {
          prompt = JSON.parse(body || "{}").prompt || "";
        } catch {
          prompt = "";
        }
        const kind = pickKind(url.searchParams.get("kind") || lastKind, prompt);
        send(
          res,
          200,
          "application/json; charset=utf-8",
          JSON.stringify({ ok: true, kind, stream: `/stream?kind=${encodeURIComponent(kind)}` }),
        );
      });
      return;
    }
    const file = staticFile(url.pathname);
    if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      send(res, 404, "text/plain; charset=utf-8", "not found\n");
      return;
    }
    const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
    send(res, 200, type, fs.readFileSync(file));
  });
  server.listen(PORT, "127.0.0.1", () => {
    process.stderr.write(`EVG live-build http://127.0.0.1:${PORT} (agent=${DEFAULT_AGENT})\n`);
  });
}

main();
