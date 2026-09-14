#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// figma — a .fig file from a terminal, and Rafi bound to one on disk.
//
//   node gallery/figma/cli.mjs check app.fig     parsed, converted, imported, drawn
//   node gallery/figma/cli.mjs tree app.fig      the node tree
//   node gallery/figma/cli.mjs markup app.fig    the file as Rave markup
//   node gallery/figma/cli.mjs serve app.fig     Rafi at :8011, following the file
//
// The reading is the same code the page uses; this is the door for something
// that cannot click.

import { spawnSync, spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const RAVE_CLI = path.join(ROOT, "gallery", "rave", "cli.mjs");
const FIG_CLI = path.join(HERE, "bin", "fig_cli.js");
const WEB = path.join(HERE, "web", "rafi");

function ensureFigCli() {
  if (fs.existsSync(FIG_CLI)) return true;
  process.stderr.write("figma: compiling the reader…\n");
  spawnSync("npm", ["run", "figma:cli", "--silent"], { cwd: ROOT, encoding: "utf8" });
  return fs.existsSync(FIG_CLI);
}

function viaRave(args) {
  const out = spawnSync(process.execPath, [RAVE_CLI, ...args], { cwd: process.cwd(), encoding: "utf8" });
  process.stdout.write((out.stdout || "") + (out.stderr || ""));
  return out.status ?? 0;
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".cjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".fig": "application/octet-stream",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

// Rafi already opens `?file=…`, so serving is the file beside the page plus a
// line down the wire when it changes.
function serve(file, port) {
  const target = path.resolve(file);
  if (!fs.existsSync(target)) {
    process.stderr.write(`figma: ${file} does not exist\n`);
    return 2;
  }
  process.stderr.write("figma: building the page…\n");
  const built = spawnSync("npm", ["run", "rafi:page", "--silent"], { cwd: ROOT, encoding: "utf8" });
  if (built.status !== 0) {
    process.stderr.write((built.stdout || "") + (built.stderr || ""));
    return 2;
  }
  const listeners = new Set();
  let lastSeen = fs.statSync(target).mtimeMs;
  fs.watch(path.dirname(target), (_k, name) => {
    if (name !== path.basename(target) || !fs.existsSync(target)) return;
    const at = fs.statSync(target).mtimeMs;
    if (at === lastSeen) return;
    lastSeen = at;
    for (const res of listeners) res.write("data: changed\n\n");
  });

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/doc.fig") {
      res.writeHead(200, { "content-type": "application/octet-stream", "cache-control": "no-store" });
      res.end(fs.readFileSync(target));
      return;
    }
    if (url.pathname === "/events") {
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" });
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
    process.stderr.write(`\nfigma: ${path.relative(process.cwd(), target)} at http://127.0.0.1:${port}/?file=doc.fig\n`);
    process.stderr.write("figma: replace the file and the page follows it\n\n");
  });
  return null;
}

const [cmd, ...rest] = process.argv.slice(2);
const file = rest.find((a) => !a.startsWith("--"));

if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
  process.stdout.write(
    [
      "figma — a .fig file, from a terminal",
      "",
      "  figma check <file.fig>   parsed, converted, imported and drawn, with everything",
      "                           each stage could not carry. RAVE OK or RAVE FAIL n",
      "  figma tree <file.fig>    the node tree, as the reader sees it",
      "  figma markup <file.fig>  the file read as a Rave application, in Rave markup",
      "  figma serve <file.fig> [--port 8011]",
      "                           Rafi, bound to that file: replace it and the page follows",
      "",
    ].join("\n"),
  );
  process.exit(0);
}
if (!file && cmd !== "help") {
  process.stderr.write(`usage: figma ${cmd} <file.fig>\n`);
  process.exit(2);
}

if (cmd === "check") process.exit(viaRave(["figcheck", file]));
else if (cmd === "markup") process.exit(viaRave(["text", file]));
else if (cmd === "tree") {
  if (!ensureFigCli()) {
    process.stderr.write("figma: the reader did not compile\n");
    process.exit(2);
  }
  const out = spawnSync(process.execPath, [FIG_CLI, "inspect", path.resolve(file)], { cwd: ROOT, encoding: "utf8" });
  process.stdout.write((out.stdout || "") + (out.stderr || ""));
  process.exit(/^error: /m.test(out.stdout || "") ? 1 : 0);
} else if (cmd === "serve") {
  const portAt = rest.indexOf("--port");
  const bad = serve(file, portAt >= 0 ? Number(rest[portAt + 1]) : 8011);
  if (bad !== null) process.exit(bad);
} else {
  process.stderr.write(`figma: no command called \`${cmd}\` — try \`figma help\`\n`);
  process.exit(2);
}
