#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// rave — the Rave document on the command line, and the editor bound to a
// file on disk.
//
//   node gallery/rave/cli.mjs new app.rave --start crud
//   node gallery/rave/cli.mjs check app.rave
//   node gallery/rave/cli.mjs serve app.rave          # editor at :8012, live
//
// The document commands are the Ranger CLI (gallery/rave/src/rave_cli.rgr),
// compiled on demand; this file is the front door, because the two things a
// terminal wants and a canvas cannot give — an exit code and a file watcher —
// belong in node.

import { spawnSync, spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const CLI_JS = path.join(HERE, "bin", "rave_cli.js");
const CLI_SRC = path.join(HERE, "src");
const WEB = path.join(HERE, "web");

const DOC_COMMANDS = new Set(["new", "check", "fmt", "json", "markup", "import", "text", "spec", "figcheck"]);

function newestMtime(dir) {
  let newest = 0;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) newest = Math.max(newest, newestMtime(full));
    else newest = Math.max(newest, st.mtimeMs);
  }
  return newest;
}

// The compiler exits 0 when it rejects a file and writes nothing, so the
// output is deleted first and its absence afterwards is the failure.
function buildCli({ quiet } = {}) {
  const fresh = fs.existsSync(CLI_JS) && fs.statSync(CLI_JS).mtimeMs > newestMtime(CLI_SRC);
  if (fresh) return true;
  if (!quiet) process.stderr.write("rave: compiling the document CLI…\n");
  const out = spawnSync("npm", ["run", "rave:cli:build", "--silent"], { cwd: ROOT, encoding: "utf8" });
  if (!fs.existsSync(CLI_JS)) {
    process.stderr.write((out.stdout || "") + (out.stderr || ""));
    process.stderr.write("rave: the document CLI did not compile\n");
    return false;
  }
  return true;
}

function runDocCommand(args) {
  if (!buildCli()) return 2;
  // Run where the person is: the file arguments are theirs, not the repo's.
  const out = spawnSync(process.execPath, [CLI_JS, ...args], { cwd: process.cwd(), encoding: "utf8" });
  const text = (out.stdout || "") + (out.stderr || "");
  process.stdout.write(text);
  // `check` and the writers end with a verdict; everything else is output.
  if (/^RAVE FAIL/m.test(text)) return 1;
  if (/^error: /m.test(text)) return 1;
  return 0;
}

// --- shot -------------------------------------------------------------------
// A route at a width, as a PNG, with no browser in it: the document CLI builds
// and styles the route at that viewport and writes the EVG tree, and the
// gallery's own software rasterizer paints it. The styling has to happen on
// the Rave side, because a `@media` rule does not apply at all unless a
// viewport was stated.

const PNG_TOOL = path.join(ROOT, "gallery", "pdf_writer", "bin", "evg_png_tool.js");
const PNG_SRC = path.join(ROOT, "gallery", "pdf_writer", "src", "tools", "evg_png_tool.rgr");

function buildPngTool() {
  if (fs.existsSync(PNG_TOOL) && fs.statSync(PNG_TOOL).mtimeMs > fs.statSync(PNG_SRC).mtimeMs) return true;
  process.stderr.write("rave: compiling the rasterizer…\n");
  spawnSync(
    process.execPath,
    ["bin/output.js", "-es6", "./gallery/pdf_writer/src/tools/evg_png_tool.rgr", "-d=./gallery/pdf_writer/bin", "-o=evg_png_tool.js", "-nodecli"],
    { cwd: ROOT, encoding: "utf8", env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr" } },
  );
  return fs.existsSync(PNG_TOOL);
}

function onePng(file, route, width, out, loggedOut) {
  const tree = out.replace(/\.png$/i, "") + ".evg.json";
  const args = ["shotdata", path.resolve(file), path.resolve(tree), "--route", route, "--width", String(width)];
  if (loggedOut) args.push("--logged-out");
  const made = spawnSync(process.execPath, [CLI_JS, ...args], { cwd: process.cwd(), encoding: "utf8" });
  const text = (made.stdout || "") + (made.stderr || "");
  const said = /^SHOT (\d+) (\d+) (.+)$/m.exec(text);
  if (!said) return { ok: false, text };
  const painted = spawnSync(
    process.execPath,
    [PNG_TOOL, path.resolve(tree), path.resolve(out), "-w", said[1], "-h", said[2]],
    { cwd: ROOT, encoding: "utf8" },
  );
  fs.rmSync(tree, { force: true });
  const ok = fs.existsSync(path.resolve(out));
  return { ok, text: ok ? `${out}  ${said[3]} at ${said[1]}×${said[2]}` : (painted.stdout || "") + (painted.stderr || "") };
}

function routesAndWidths(file) {
  const out = spawnSync(process.execPath, [CLI_JS, "check", path.resolve(file)], { cwd: process.cwd(), encoding: "utf8" });
  const text = (out.stdout || "") + (out.stderr || "");
  const markup = spawnSync(process.execPath, [CLI_JS, "markup", path.resolve(file)], { cwd: process.cwd(), encoding: "utf8" });
  const doc = (markup.stdout || "");
  const routes = [...doc.matchAll(/<route path="([^"]+)"/g)].map((m) => m[1]).filter((p) => !p.includes(":"));
  const targets = (/<app[^>]*targets="([^"]*)"/.exec(doc) || [, "web"])[1].split(/\s+/).filter(Boolean);
  const byTarget = { desktop: 1920, web: 1440, tablet: 768, mobile: 390 };
  const widths = targets.map((t) => byTarget[t]).filter(Boolean);
  return { routes, widths: widths.length ? widths : [1440], text };
}

function shot(file, rest) {
  if (!buildPngTool()) {
    process.stderr.write("rave: the rasterizer did not compile\n");
    return 2;
  }
  const flag = (name, fallback) => {
    const at = rest.indexOf(name);
    return at >= 0 && rest[at + 1] ? rest[at + 1] : fallback;
  };
  const loggedOut = rest.includes("--logged-out");
  if (rest.includes("--all")) {
    const dir = flag("--out", "shots");
    fs.mkdirSync(dir, { recursive: true });
    const { routes, widths } = routesAndWidths(file);
    let bad = 0;
    for (const route of routes) {
      for (const width of widths) {
        const slug = (route === "/" ? "home" : route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")) + "-" + width;
        const r = onePng(file, route, width, path.join(dir, slug + ".png"), loggedOut);
        process.stdout.write((r.ok ? "" : "FAILED ") + r.text + "\n");
        if (!r.ok) bad += 1;
      }
    }
    return bad === 0 ? 0 : 1;
  }
  const { routes, widths } = routesAndWidths(file);
  const route = flag("--route", routes[0] || "/");
  const width = Number(flag("--width", widths[0] || 1440));
  const out = flag("--out", "shot.png");
  const r = onePng(file, route, width, out, loggedOut);
  process.stdout.write(r.text + "\n");
  return r.ok ? 0 : 1;
}

// --- serve ------------------------------------------------------------------
// The editor page, plus the one file it is about: GET /doc is the markup, PUT
// /doc writes it back, and /events says when the file changed underneath.

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".cjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function serve(file, port) {
  const target = path.resolve(file);
  if (!fs.existsSync(target)) {
    process.stderr.write(`rave: ${file} does not exist — make one with \`rave new ${file}\`\n`);
    return 2;
  }
  process.stderr.write("rave: building the page…\n");
  const built = spawnSync("npm", ["run", "rave:page", "--silent"], { cwd: ROOT, encoding: "utf8" });
  if (built.status !== 0) {
    process.stderr.write((built.stdout || "") + (built.stderr || ""));
    return 2;
  }

  const listeners = new Set();
  let lastSeen = fs.statSync(target).mtimeMs;
  // Written by the page itself a moment ago is not a change to tell it about.
  let ourOwnWrite = 0;
  fs.watch(path.dirname(target), (_kind, name) => {
    if (name !== path.basename(target)) return;
    if (!fs.existsSync(target)) return;
    const at = fs.statSync(target).mtimeMs;
    if (at === lastSeen || at <= ourOwnWrite) return;
    lastSeen = at;
    for (const res of listeners) res.write("data: changed\n\n");
  });

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/doc" && req.method === "GET") {
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
      res.end(fs.readFileSync(target, "utf8"));
      return;
    }
    if (url.pathname === "/doc" && req.method === "PUT") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        fs.writeFileSync(target, body);
        ourOwnWrite = fs.statSync(target).mtimeMs;
        lastSeen = ourOwnWrite;
        process.stderr.write(`rave: wrote ${path.relative(process.cwd(), target)} (${body.length} bytes)\n`);
        res.writeHead(204).end();
      });
      return;
    }
    if (url.pathname === "/events") {
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-store",
        connection: "keep-alive",
      });
      res.write("retry: 1000\n\n");
      listeners.add(res);
      req.on("close", () => listeners.delete(res));
      return;
    }
    const rel = url.pathname === "/" ? "index.html" : url.pathname.replace(/^\/+/, "");
    const full = path.join(WEB, rel);
    if (!full.startsWith(WEB) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(full)] || "application/octet-stream" });
    fs.createReadStream(full).pipe(res);
  });

  server.listen(port, () => {
    process.stderr.write(`\nrave: ${path.relative(process.cwd(), target)} at http://127.0.0.1:${port}/\n`);
    process.stderr.write("rave: edit the file and the page follows; Save in the page writes the file\n\n");
  });
  return null; // keeps running
}

// --- the door ---------------------------------------------------------------

const [cmd, ...rest] = process.argv.slice(2);

if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
  process.stdout.write(
    [
      "rave — a Rave application, from a terminal",
      "",
      "  rave new <out.rave> [--name X] [--start dashboard|crud|marketing|masterdetail|settings|empty]",
      "                      [--nav sidebar|topbar|tabs|none] [--no-auth] [--targets \"web tablet mobile\"]",
      "  rave check <file>          parse, build every route at every width, report everything",
      "  rave fmt <file.rave>       read it and write it back the way the writer spells it",
      "  rave json <in.rave> <out.rave.json>",
      "  rave markup <in.rave.json> [out.rave]",
      "  rave import <file.fig> [out]    a Figma file, read as an application",
      "  rave text <file.fig>            …and printed as markup",
      "  rave spec                  the format, exactly as the AI prompt states it",
      "  rave shot <file> [--route /x] [--width 1440] [--out shot.png]",
      "  rave shot <file> --all [--out shots/]",
      "                             a PNG of a route at a width, painted by the",
      "                             gallery's own rasterizer — no browser",
      "  rave serve <file.rave> [--port 8012]",
      "                             the editor, bound to that file: it loads it,",
      "                             follows it when it changes, and writes it on Save",
      "",
    ].join("\n"),
  );
  process.exit(0);
}

if (cmd === "shot") {
  const file = rest.find((a) => !a.startsWith("--") && !rest[rest.indexOf(a) - 1]?.startsWith("--"));
  if (!file) {
    process.stderr.write("usage: rave shot <file> [--route /x] [--width 1440] [--out shot.png] [--all]\n");
    process.exit(2);
  }
  process.exit(shot(file, rest));
} else if (cmd === "serve") {
  const file = rest.find((a) => !a.startsWith("--"));
  const portAt = rest.indexOf("--port");
  const port = portAt >= 0 ? Number(rest[portAt + 1]) : 8012;
  if (!file) {
    process.stderr.write("usage: rave serve <file.rave> [--port 8012]\n");
    process.exit(2);
  }
  const bad = serve(file, port);
  if (bad !== null) process.exit(bad);
} else if (DOC_COMMANDS.has(cmd)) {
  process.exit(runDocCommand([cmd, ...rest]));
} else {
  process.stderr.write(`rave: no command called \`${cmd}\` — try \`rave help\`\n`);
  process.exit(2);
}
