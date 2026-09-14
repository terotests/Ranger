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

const DOC_COMMANDS = new Set(["new", "check", "fmt", "json", "markup", "import", "text", "spec"]);

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
      "  rave serve <file.rave> [--port 8012]",
      "                             the editor, bound to that file: it loads it,",
      "                             follows it when it changes, and writes it on Save",
      "",
    ].join("\n"),
  );
  process.exit(0);
}

if (cmd === "serve") {
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
