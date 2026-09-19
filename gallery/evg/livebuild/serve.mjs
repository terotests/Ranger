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
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  listAgents,
  runTask,
  frameFixture,
  seedDoc,
  resetSession,
  readSessionDoc,
  writeSessionDoc,
  sessionDir,
  traceAttachment,
  clearAttachment,
  attachmentOf,
  ATTACH_BASE,
  frameDocument,
  root as repoRoot,
} from "./agents.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const bin = path.join(root, "gallery/evg/bin/evg_livebuild.js");
const web = path.join(here, "web");
const PORT = Number(process.env.EVG_LIVEBUILD_PORT || 8765);
const DEFAULT_AGENT = process.env.EVG_LIVEBUILD_DEFAULT_AGENT || "recipe";

const KINDS = new Set(["dashboard", "settings", "invoices", "empty"]);
let lastDoc = seedDoc("dashboard");
let lastKind = "dashboard";
resetSession("dashboard");
lastDoc = readSessionDoc() || lastDoc;

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

function streamBuild(res, { kind, agent, prompt, paceMs, seed, session }) {
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
    } catch {
      t = "raw";
    }
    res.write(`event: ${t}\n`);
    res.write(`data: ${trimmed}\n\n`);
  };

  const noteDoc = (line) => {
    try {
      const obj = JSON.parse(String(line).trim());
      if (obj && obj.t === "doc" && typeof obj.text === "string" && writeSessionDoc(obj.text)) {
        lastDoc = obj.text;
      }
    } catch {
      /* not json */
    }
  };

  const pace = (line) => {
    noteDoc(line);
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
    session,
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
  // --- THE APP DOOR -------------------------------------------------------
  //
  // PLAN_LIVE_APP.md S2. Design mode streams a whole display list per frame,
  // which is right while a screen is being drawn. Run mode is the other thing:
  // a machine owns which page you are on, a press is a point that becomes an
  // event, and the page that comes back is the one for the state it landed in.
  //
  // The session is the list of events, held here. The machine is deterministic
  // and an app's history is a handful of strings, so the tool stays a program
  // that starts and ends, and a reload does not lose the app.
  const appBin = path.join(repoRoot, "gallery/evg/bin/evg_app.js");
  let appEvents = [];

  const appDir = () => {
    if (process.env.EVG_LIVEBUILD_APP) return process.env.EVG_LIVEBUILD_APP;
    const mine = path.join(sessionDir(), "app");
    if (fs.existsSync(path.join(mine, "machine.json"))) return mine;
    return path.join(repoRoot, "gallery/evg/livebuild/fixtures/app");
  };

  const appTool = (...args) => {
    if (!fs.existsSync(appBin)) {
      const built = spawnSync(
        "bash",
        ["scripts/rgr-suite.sh", "./gallery/evg/livebuild/EvgAppTool.rgr", "./gallery/evg/bin", "evg_app.js"],
        { cwd: repoRoot, encoding: "utf8", maxBuffer: 40 * 1024 * 1024 },
      );
      if (!fs.existsSync(appBin)) {
        throw new Error(`could not build the app tool:\n${`${built.stdout || ""}${built.stderr || ""}`.slice(-800)}`);
      }
    }
    const r = spawnSync(process.execPath, [appBin, ...args], {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 40 * 1024 * 1024,
    });
    const text = `${r.stdout || ""}`.trim();
    const open = text.indexOf("{");
    if (open < 0) throw new Error(`the app tool said: ${(text || r.stderr || "nothing").slice(0, 300)}`);
    return JSON.parse(text.slice(open));
  };

  // The page for wherever the events have taken the machine, as a frame the
  // painter in the browser already knows how to draw.
  const appFrame = () => {
    const dir = appDir();
    const out = path.join(os.tmpdir(), "evg-app-page.evg.json");
    const rendered = appTool("render", dir, ...appEvents, `--out=${out}`);
    if (rendered.error) throw new Error(rendered.error);
    const frame = frameDocument(out).find((e) => e && e.t === "frame") || {};
    return {
      app: path.basename(dir),
      state: rendered.state,
      events: appEvents,
      layout: rendered.layout,
      width: frame.width || 390,
      height: frame.height || 844,
      ncmds: frame.ncmds || 0,
      nodes: frame.nodes || 0,
      list: frame.list || { cmds: [] },
    };
  };

  // One body, with a ceiling. A data URL is the whole picture in base64, and
  // a request with no end to it is not a picture.
  const readBody = (req, limit) =>
    new Promise((resolve, reject) => {
      let text = "";
      req.setEncoding("utf8");
      req.on("data", (chunk) => {
        text += chunk;
        if (text.length > limit) {
          reject(new Error("that picture is too large — 12 MB is the limit"));
          req.destroy();
        }
      });
      req.on("end", () => resolve(text));
      req.on("error", reject);
    });

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
    // --- A PICTURE, ATTACHED TO THE ASK -----------------------------------
    //
    // The prompt box says what to build; a picture says what it should look
    // like, and a model cannot read one off a screen it has never seen. So the
    // host traces it with Ranger's own bitmap tracer the moment it arrives:
    // the agent gets flat colour layers it can insert as vector, and a palette
    // counted over the pixels. Neither costs it a single coordinate of
    // context.
    if (url.pathname === "/attach" && req.method === "POST") {
      readBody(req, 12 * 1024 * 1024)
        .then((body) => {
          const ask = JSON.parse(body || "{}");
          if (ask.clear) {
            clearAttachment(sessionDir());
            send(res, 200, "application/json; charset=utf-8", JSON.stringify({ cleared: true }));
            return;
          }
          const dataUrl = String(ask.dataUrl || "");
          const comma = dataUrl.indexOf(",");
          if (comma < 0 || !/^data:image\/(png|jpe?g)/i.test(dataUrl)) {
            send(res, 400, "application/json; charset=utf-8", JSON.stringify({ error: "a PNG or JPEG data URL is what this takes" }));
            return;
          }
          const ext = /png/i.test(dataUrl.slice(0, comma)) ? "png" : "jpg";
          const dir = sessionDir();
          fs.mkdirSync(dir, { recursive: true });
          clearAttachment(dir);
          const file = `${ATTACH_BASE}.${ext}`;
          fs.writeFileSync(path.join(dir, file), Buffer.from(dataUrl.slice(comma + 1), "base64"));
          const summary = traceAttachment(dir, file, {
            width: Number(ask.width) > 0 ? Number(ask.width) : 358,
            preset: typeof ask.preset === "string" && ask.preset ? ask.preset : "poster",
          });
          send(res, 200, "application/json; charset=utf-8", JSON.stringify(summary));
        })
        .catch((e) => {
          send(res, 500, "application/json; charset=utf-8", JSON.stringify({ error: String(e.message || e) }));
        });
      return;
    }
    if (url.pathname === "/app") {
      try {
        if (url.searchParams.get("reset") === "1") appEvents = [];
        send(res, 200, "application/json; charset=utf-8", JSON.stringify(appFrame()));
      } catch (e) {
        send(res, 500, "application/json; charset=utf-8", JSON.stringify({ error: String(e.message || e) }));
      }
      return;
    }
    if (url.pathname === "/app/press" && req.method === "POST") {
      readBody(req, 4096)
        .then((body) => {
          const ask = JSON.parse(body || "{}");
          const hit = appTool("hit", appDir(), String(Math.round(Number(ask.x) || 0)), String(Math.round(Number(ask.y) || 0)), ...appEvents);
          if (hit.error) throw new Error(hit.error);
          // A press on nothing, and a press on something this state does not
          // answer to, are different answers and both are "the screen did not
          // change" — so the page is told which.
          if (hit.id && hit.takes) appEvents = [...appEvents, hit.id];
          send(
            res,
            200,
            "application/json; charset=utf-8",
            JSON.stringify({ ...appFrame(), pressed: hit.id || "", took: Boolean(hit.id && hit.takes) }),
          );
        })
        .catch((e) => {
          send(res, 500, "application/json; charset=utf-8", JSON.stringify({ error: String(e.message || e) }));
        });
      return;
    }
    if (url.pathname === "/attached") {
      send(
        res,
        200,
        "application/json; charset=utf-8",
        JSON.stringify(attachmentOf(sessionDir()) || {}),
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
      resetSession(kind);
      lastDoc = readSessionDoc() || framed.doc;
      lastKind = kind;
      const frame = framed.events.find((e) => e && e.t === "frame") || {};
      // The seed is a laid-out screen like any other, so it answers the same
      // question: is anything overlapping, off the page, or crowded?
      const measured = framed.events.find((e) => e && e.t === "measure") || null;
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
          measure: measured,
        }),
      );
      return;
    }
    if (url.pathname === "/stream") {
      const prompt = url.searchParams.get("prompt") || "";
      // Follow-up never remaps the seed from the typed ask. Kind chips
      // (via /seed) are the only start-over; lastKind is that seed.
      const chip = url.searchParams.get("kind") || lastKind;
      const kind = KINDS.has(chip) ? chip : (lastKind || "dashboard");
      const agent = url.searchParams.get("agent") || DEFAULT_AGENT;
      const pace = Number(url.searchParams.get("pace") ?? 28);
      streamBuild(res, {
        kind,
        agent,
        prompt,
        seed: readSessionDoc() || lastDoc,
        session: true,
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
