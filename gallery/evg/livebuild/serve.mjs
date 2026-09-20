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
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  listAgents,
  runTask,
  frameFixture,
  seedDoc,
  resetSession,
  prepareSession,
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

// The viewport a request asks for, if any. Bounded so a stray query cannot
// ask the layout engine for a page the size of a building.
function viewportOf(url) {
  const n = (v) => {
    const x = Math.round(Number(v));
    return Number.isFinite(x) && x >= 200 && x <= 4096 ? x : 0;
  };
  const width = n(url.searchParams.get("w"));
  const height = n(url.searchParams.get("h"));
  return width || height ? { width, height } : null;
}
const bin = path.join(root, "gallery/evg/bin/evg_livebuild.js");
const web = path.join(here, "web");
const PORT = Number(process.env.EVG_LIVEBUILD_PORT || 8765);
const DEFAULT_AGENT = process.env.EVG_LIVEBUILD_DEFAULT_AGENT || "recipe";

const KINDS = new Set(["dashboard", "settings", "invoices", "empty"]);
let lastDoc = seedDoc("dashboard");
let lastKind = "dashboard";
let lastPrompt = "";
// A restart is not a start-over. `resetSession` writes a fixture over the
// session's phone, so restarting the server used to throw away whatever was
// on screen; `prepareSession` keeps a document that is already there and
// seeds only when there is none. Both install the workspace tools and write
// the guide, which is the part a session cannot be without.
prepareSession("The phone already has a UI in doc.evg.json. Wait for the next task.", {
  kind: "dashboard",
});
lastDoc = readSessionDoc() || lastDoc;

// WHERE A DESIGN GOES WHEN IT IS WORTH KEEPING.
//
// The session is a temp directory: the next seed chip, or the next reboot,
// takes the screen with it. Good ones arrive in a couple of minutes, so most
// of what this page makes was being thrown away.
//
// A save is the session's own files, copied: the document, the app if the
// screen became one, and what was asked for. Nothing is derived, so nothing
// can drift, and opening one puts those files back where the session keeps
// them — the page then carries on exactly as if the design had been made just
// now. That round trip is the whole feature; a folder you can only write to
// is a folder you cannot trust.
//
// OUTSIDE THE REPOSITORY, on purpose. These are one person's designs on one
// machine, not source: in the tree they would be an endless untracked pile,
// or worse, committed. `~/.evg-livebuild/saved` is the default and
// EVG_LIVEBUILD_SAVED moves it. When this page eventually runs on a server
// the same two calls become rows in a database — which is why saving and
// opening go through `saveSession` and `openSaved` rather than the page
// touching files.
const SAVED =
  process.env.EVG_LIVEBUILD_SAVED || path.join(os.homedir(), ".evg-livebuild", "saved");

const slugOf = (name) => {
  const base = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "screen";
};

const savedList = () => {
  if (!fs.existsSync(SAVED)) return [];
  return fs
    .readdirSync(SAVED)
    .filter((d) => fs.existsSync(path.join(SAVED, d, "doc.evg.json")))
    .map((slug) => {
      let about = {};
      try {
        about = JSON.parse(fs.readFileSync(path.join(SAVED, slug, "about.json"), "utf8"));
      } catch {
        about = {};
      }
      const pages = path.join(SAVED, slug, "app/pages");
      return {
        slug,
        name: about.name || slug,
        prompt: about.prompt || "",
        saved: about.saved || "",
        kind: about.kind || "",
        pages: fs.existsSync(pages) ? fs.readdirSync(pages).filter((f) => f.endsWith(".evg.json")).length : 0,
      };
    })
    .sort((a, b) => String(b.saved).localeCompare(String(a.saved)));
};

const saveSession = (name) => {
  const doc = path.join(sessionDir(), "doc.evg.json");
  if (!fs.existsSync(doc)) throw new Error("there is no document in this session to save");
  fs.mkdirSync(SAVED, { recursive: true });
  // A name that is already taken gets a number rather than overwriting a
  // design somebody kept on purpose.
  const base = slugOf(name);
  let slug = base;
  for (let n = 2; fs.existsSync(path.join(SAVED, slug)); n += 1) slug = `${base}-${n}`;
  const dir = path.join(SAVED, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(doc, path.join(dir, "doc.evg.json"));
  const app = path.join(sessionDir(), "app");
  let pages = 0;
  if (fs.existsSync(path.join(app, "machine.json"))) {
    fs.cpSync(app, path.join(dir, "app"), { recursive: true });
    const pageDir = path.join(dir, "app/pages");
    pages = fs.existsSync(pageDir) ? fs.readdirSync(pageDir).filter((f) => f.endsWith(".evg.json")).length : 0;
  }
  const about = {
    name: String(name || slug).slice(0, 120),
    prompt: lastPrompt,
    kind: lastKind,
    saved: new Date().toISOString(),
    pages,
  };
  fs.writeFileSync(path.join(dir, "about.json"), `${JSON.stringify(about, null, 1)}\n`);
  return { slug, ...about };
};

const openSaved = (slug) => {
  const dir = path.join(SAVED, path.basename(String(slug || "")));
  const doc = path.join(dir, "doc.evg.json");
  if (!fs.existsSync(doc)) throw new Error(`no saved design called ${slug}`);
  // Into the session, over whatever is there. An open is a start-over with a
  // document of your own, so the app that belonged to the old screen goes
  // too — otherwise Run would drive states named after tabs that are gone.
  const to = sessionDir();
  fs.mkdirSync(to, { recursive: true });
  fs.rmSync(path.join(to, "app"), { recursive: true, force: true });
  fs.copyFileSync(doc, path.join(to, "doc.evg.json"));
  if (fs.existsSync(path.join(dir, "app/machine.json"))) {
    fs.cpSync(path.join(dir, "app"), path.join(to, "app"), { recursive: true });
  }
  let about = {};
  try {
    about = JSON.parse(fs.readFileSync(path.join(dir, "about.json"), "utf8"));
  } catch {
    about = {};
  }
  lastDoc = readSessionDoc() || lastDoc;
  if (about.kind && KINDS.has(about.kind)) lastKind = about.kind;
  lastPrompt = about.prompt || "";
  return { slug: path.basename(dir), ...about };
};

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

function streamBuild(res, { kind, agent, prompt, paceMs, seed, session, view }) {
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
    view,
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
  // The GPU painter and the effect driver. A surface effect is a shader, and
  // the SVG painter says so by listing it as unsupported — so a document that
  // declares one is painted by these instead, and by nothing else.
  if (urlPath === "/evg-webgl.js") {
    return path.join(root, "lib/evg/gl/evg-webgl.js");
  }
  if (urlPath === "/evg-fx.js") {
    return path.join(root, "lib/evg/gl/evg-fx.js");
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

  // Whose app is being run. A session with an `app/` is running its own; one
  // without is shown the example — and TOLD so, because a Run that quietly
  // replaces the phone somebody just designed with a different app is the
  // most confusing thing this page could do.
  const ownApp = () => {
    const mine = path.join(sessionDir(), "app");
    return fs.existsSync(path.join(mine, "machine.json")) ? mine : "";
  };

  const appDir = () => {
    if (process.env.EVG_LIVEBUILD_APP) return process.env.EVG_LIVEBUILD_APP;
    return ownApp() || path.join(repoRoot, "gallery/evg/livebuild/fixtures/app");
  };

  const isExample = () => !process.env.EVG_LIVEBUILD_APP && !ownApp();

  // Run means run THIS phone. A document whose tabs already carry `nav.*` ids
  // is one command away from being an app, and asking the agent to run that
  // command was the wrong place to put it: the agent may be remote, may have
  // no shell here, and on a fresh clone had no tool to run. The host has the
  // repo and the document, so the host does it.
  const autoInit = () => {
    if (process.env.EVG_LIVEBUILD_APP || ownApp()) return "";
    const doc = path.join(sessionDir(), "doc.evg.json");
    if (!fs.existsSync(doc)) return "";
    if (!/"id"\s*:\s*"nav\./.test(fs.readFileSync(doc, "utf8"))) return "";
    const made = appTool("init", path.join(sessionDir(), "app"), `--from=${doc}`);
    return made && made.error ? "" : ownApp();
  };

  // The app as DATA, for the runtime in the tab: the machine and one document
  // per state, sent once. Everything after that — hit test, transition, the
  // next page — happens in the browser, so a press costs no process and needs
  // no tool on anybody's machine. A code app cannot go this way (its pages are
  // a compiled program the server holds open), and says so.
  const appData = () => {
    const dir = appDir();
    if (fs.existsSync(path.join(dir, "App.rgr"))) return { code: true, app: path.basename(dir) };
    const machine = path.join(dir, "machine.json");
    if (!fs.existsSync(machine)) return { error: `no machine.json in ${dir}` };
    const pages = {};
    const pageDir = path.join(dir, "pages");
    if (fs.existsSync(pageDir)) {
      for (const f of fs.readdirSync(pageDir)) {
        if (f.endsWith(".evg.json")) pages[f.slice(0, -".evg.json".length)] = fs.readFileSync(path.join(pageDir, f), "utf8");
      }
    }
    // Pages that are byte-identical. A press then moves the machine over a
    // screen that does not change, which from the outside is a dead button —
    // and `init` makes copies on purpose, so this is the normal state of a
    // freshly made app, not a rare one.
    const seen = new Map();
    const copies = [];
    for (const [state, text] of Object.entries(pages)) {
      const first = seen.get(text);
      if (first) copies.push([first, state]);
      else seen.set(text, state);
    }
    return {
      app: path.basename(dir),
      example: isExample(),
      machine: fs.readFileSync(machine, "utf8"),
      pages,
      copies,
    };
  };

  // The runtime itself, compiled from EvgAppWeb.rgr. Built on demand and kept,
  // like every other tool here — `bin/` is not in git, so "not built yet" is
  // the state of a fresh clone rather than an error.
  const webBin = path.join(repoRoot, "gallery/evg/bin/evg_app_web.js");
  const buildWebRuntime = () => {
    const src = path.join(repoRoot, "gallery/evg/livebuild/EvgAppWeb.rgr");
    if (fs.existsSync(webBin) && fs.statSync(webBin).mtimeMs >= fs.statSync(src).mtimeMs) return webBin;
    const r = spawnSync(
      "node",
      ["bin/output.js", "-es6", "gallery/evg/livebuild/EvgAppWeb.rgr", "-d=gallery/evg/bin", "-o=evg_app_web.js"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        maxBuffer: 60 * 1024 * 1024,
        env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
      },
    );
    if (!fs.existsSync(webBin)) {
      throw new Error(`could not build the browser runtime:\n${`${r.stdout || ""}${r.stderr || ""}`.slice(-1200)}`);
    }
    return webBin;
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

  // --- A CODE APP ---------------------------------------------------------
  //
  // PLAN_LIVE_APP.md S4. An app with an `App.rgr` beside its machine is a
  // program, not a folder of documents: it is compiled to an ES module, this
  // process imports it ONCE and holds one kit open, and a press is a method
  // call rather than three spawns. That is what makes a component mean
  // anything — an instance that outlives a build cannot outlive a process.
  //
  // The compile is on the host and it is one file: the engine the app links
  // does not change, so a rebuild is seconds. It happens when the source is
  // newer than the module, which is the whole of "incremental" that this
  // needs.
  let live = null;

  const codeSource = (dir) => {
    const src = path.join(dir, "App.rgr");
    return fs.existsSync(src) ? src : "";
  };

  const buildCodeApp = (dir) => {
    const src = codeSource(dir);
    if (!src) return "";
    const mod = path.join(dir, "bin", "app_module.mjs");
    const fresh = fs.existsSync(mod) && fs.statSync(mod).mtimeMs >= fs.statSync(src).mtimeMs;
    if (fresh) return mod;
    const r = spawnSync(
      "node",
      ["bin/output.js", "-es6", "-esm", "-nodemodule", src, `-d=${path.join(dir, "bin")}`, "-o=app_module.mjs"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        maxBuffer: 40 * 1024 * 1024,
        env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
      },
    );
    const text = `${r.stdout || ""}${r.stderr || ""}`;
    if (!fs.existsSync(mod) || /Compilation FAILED/.test(text)) {
      // The compiler's own words, which the ranger-lang skill explains and an
      // agent can act on. Anything else here would be a worse error message
      // about a better one.
      const said = text.split("\n").filter((l) => /\[FAIL\]|error/i.test(l)).slice(0, 12);
      throw new Error(`App.rgr did not compile:\n${said.join("\n") || text.slice(-800)}`);
    }
    return mod;
  };

  // One module, one kit, held open. A reset starts the machine again without
  // reloading anything: the app is the same program, at its first state.
  const appLive = async (dir, { reset = false } = {}) => {
    const mod = buildCodeApp(dir);
    if (!mod) return null;
    const stamp = fs.statSync(mod).mtimeMs;
    if (!live || live.dir !== dir || live.stamp !== stamp) {
      const loaded = await import(`${pathToFileURL(mod).href}?v=${stamp}`);
      live = { dir, stamp, mod: loaded, app: null, kit: null };
      reset = true;
    }
    if (reset || !live.kit) {
      const app = new live.mod.App();
      const kit = new live.mod.EvgAppKit();
      app.kit = kit;
      kit.bootText(fs.readFileSync(path.join(dir, "machine.json"), "utf8"));
      live.app = app;
      live.kit = kit;
      appEvents = [];
    }
    return live;
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
      example: isExample(),
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

  // The same answer as a data app's, off the live module. The page cannot
  // tell which kind of app it is looking at, which is the point.
  const codeFrame = (held) => {
    const f = JSON.parse(held.kit.frameJson(held.app));
    return {
      app: path.basename(held.dir),
      example: isExample(),
      code: true,
      state: f.state,
      events: appEvents,
      layout: f.layout,
      live: f.live,
      width: f.width,
      height: f.height,
      ncmds: f.ncmds,
      nodes: f.nodes,
      list: f.list,
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
    if (url.pathname === "/app/web.js") {
      try {
        send(res, 200, "text/javascript; charset=utf-8", fs.readFileSync(buildWebRuntime()));
      } catch (e) {
        send(res, 500, "text/plain; charset=utf-8", String(e.message || e));
      }
      return;
    }
    if (url.pathname === "/app/data") {
      autoInit();
      try {
        send(res, 200, "application/json; charset=utf-8", JSON.stringify(appData()));
      } catch (e) {
        send(res, 500, "application/json; charset=utf-8", JSON.stringify({ error: String(e.message || e) }));
      }
      return;
    }
    if (url.pathname === "/app") {
      const reset = url.searchParams.get("reset") === "1";
      autoInit();
      appLive(appDir(), { reset })
        .then((held) => {
          if (!held) {
            if (reset) appEvents = [];
            send(res, 200, "application/json; charset=utf-8", JSON.stringify(appFrame()));
            return;
          }
          send(res, 200, "application/json; charset=utf-8", JSON.stringify(codeFrame(held)));
        })
        .catch((e) => {
          send(res, 500, "application/json; charset=utf-8", JSON.stringify({ error: String(e.message || e) }));
        });
      return;
    }
    if (url.pathname === "/app/press" && req.method === "POST") {
      readBody(req, 4096)
        .then(async (body) => {
          const ask = JSON.parse(body || "{}");
          const held = await appLive(appDir());
          if (held) {
            // One call. The kit hit tests the page it is holding, sends the
            // event if the state answers to it, and the next frame comes off
            // the same instances.
            const hit = JSON.parse(held.kit.pressPoint(held.app, Math.round(Number(ask.x) || 0), Math.round(Number(ask.y) || 0)));
            if (hit.id && hit.takes) appEvents = [...appEvents, hit.id];
            send(
              res,
              200,
              "application/json; charset=utf-8",
              JSON.stringify({ ...codeFrame(held), pressed: hit.id || "", took: Boolean(hit.id && hit.takes) }),
            );
            return;
          }
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
    // The bridge from a designed screen to a running app. The phone on this
    // page is a document: it has a tab bar because a phone has one, and
    // pressing it does nothing because there is nothing behind it. This writes
    // the machine and a page per state — and refuses to invent which parts of
    // each screen differ, which is a design decision and the agent's.
    if (url.pathname === "/app/init" && req.method === "POST") {
      readBody(req, 4096)
        .then((body) => {
          const ask = JSON.parse(body || "{}");
          const dir = path.join(sessionDir(), "app");
          fs.mkdirSync(dir, { recursive: true });
          const doc = path.join(sessionDir(), "doc.evg.json");
          if (!fs.existsSync(doc)) throw new Error("there is no phone to make an app out of yet");
          const args = ["init", dir, `--from=${doc}`];
          if (typeof ask.states === "string" && ask.states.trim()) args.push(`--states=${ask.states.trim()}`);
          const made = appTool(...args);
          if (made.error) throw new Error(made.error);
          live = null;
          appEvents = [];
          send(res, 200, "application/json; charset=utf-8", JSON.stringify(made));
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
    // THE ELEMENT PICKER. In design mode a click used to be answered with
    // "this phone is a document" and nothing else, which is true and useless:
    // the picture is the only view of the document anybody has, and there was
    // no way to ask it what a thing on it was. `evg_agent pick` answers with
    // the chain from the page down to what is under the point, so the page can
    // show the levels and let a person choose one — the node under a pointer
    // is almost never the one they mean.
    if (url.pathname === "/pick" && req.method === "POST") {
      readBody(req, 4096)
        .then((body) => {
          const ask = JSON.parse(body || "{}");
          const file = path.join(sessionDir(), "doc.evg.json");
          if (!fs.existsSync(file)) {
            send(res, 404, "application/json; charset=utf-8", JSON.stringify({ error: "no document in this session" }));
            return;
          }
          const agent = path.join(root, "lib/evg/bin/evg_agent.js");
          if (!fs.existsSync(agent)) {
            send(res, 200, "application/json; charset=utf-8", JSON.stringify({ error: "the picker needs lib/evg/bin/evg_agent.js — run `npm run agent`" }));
            return;
          }
          const r = spawnSync(
            "node",
            [agent, "pick", file, String(Math.round(Number(ask.x) || 0)), String(Math.round(Number(ask.y) || 0)),
             `--width=${Math.round(Number(ask.width) || 390)}`, `--height=${Math.round(Number(ask.height) || 844)}`],
            { cwd: root, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
          );
          let picked = { chain: [], count: 0 };
          try {
            picked = JSON.parse(`${r.stdout || ""}`.trim());
          } catch {
            picked = { error: `the picker said: ${String(r.stderr || r.stdout || "nothing").slice(0, 200)}` };
          }
          send(res, 200, "application/json; charset=utf-8", JSON.stringify(picked));
        })
        .catch((e) => send(res, 400, "application/json; charset=utf-8", JSON.stringify({ error: String(e.message || e) })));
      return;
    }
    // The document as it stands, framed — WITHOUT touching it. `/seed` is
    // "start over" and rewrites the session's phone from a fixture; leaving Run
    // mode used to go through it, which threw away every edit the agent had
    // made. Coming back from Run is not starting over.
    if (url.pathname === "/doc") {
      const file = path.join(sessionDir(), "doc.evg.json");
      if (!fs.existsSync(file)) {
        send(res, 404, "application/json; charset=utf-8", JSON.stringify({ error: "no document in this session" }));
        return;
      }
      // `?w=&h=` is the viewport to lay the document out at, so the same
      // screen can be looked at as a phone, a tablet on its side or a
      // desktop. It never reaches the file.
      const events = frameDocument(file, viewportOf(url));
      const frame = events.find((e) => e && e.t === "frame") || {};
      send(
        res,
        200,
        "application/json; charset=utf-8",
        JSON.stringify({
          kind: lastKind,
          width: frame.width || 390,
          height: frame.height || 844,
          ncmds: frame.ncmds || 0,
          added: 0,
          nodes: frame.nodes || 0,
          list: frame.list || { cmds: [] },
          measure: events.find((e) => e && e.t === "measure") || null,
        }),
      );
      return;
    }
    if (url.pathname === "/saved") {
      send(res, 200, "application/json; charset=utf-8", JSON.stringify({ saved: savedList() }));
      return;
    }
    if (url.pathname === "/save" && req.method === "POST") {
      readBody(req, 4096)
        .then((body) => {
          const ask = JSON.parse(body || "{}");
          const made = saveSession(ask.name);
          send(res, 200, "application/json; charset=utf-8", JSON.stringify({ ...made, saved: savedList() }));
        })
        .catch((e) => {
          send(res, 500, "application/json; charset=utf-8", JSON.stringify({ error: String(e.message || e) }));
        });
      return;
    }
    if (url.pathname === "/open" && req.method === "POST") {
      readBody(req, 4096)
        .then((body) => {
          const ask = JSON.parse(body || "{}");
          const opened = openSaved(ask.slug);
          const events = frameDocument(path.join(sessionDir(), "doc.evg.json"));
          const frame = events.find((e) => e && e.t === "frame") || {};
          send(
            res,
            200,
            "application/json; charset=utf-8",
            JSON.stringify({
              ...opened,
              kind: lastKind,
              width: frame.width || 390,
              height: frame.height || 844,
              ncmds: frame.ncmds || 0,
              added: 0,
              nodes: frame.nodes || 0,
              list: frame.list || { cmds: [] },
              measure: events.find((e) => e && e.t === "measure") || null,
            }),
          );
        })
        .catch((e) => {
          send(res, 500, "application/json; charset=utf-8", JSON.stringify({ error: String(e.message || e) }));
        });
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
      if (prompt) lastPrompt = prompt;
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
        // The device the person is looking at: the frames come back laid out
        // at it, and the agent is told what it is designing for.
        view: viewportOf(url),
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
