#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Serve the console page.
//
//   npm run firesim:demo:web        # build, serve, print the URL
//
// A static server rooted at this directory and nothing else. The page needs
// no backend of its own: the backend is IN it.

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const portFlag = argv.indexOf("--port");
const PORT = portFlag >= 0 ? Number(argv[portFlag + 1]) : 8123;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

const server = http.createServer((req, res) => {
  const name = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const file = path.join(HERE, path.normalize(name).replace(/^(\.\.[/\\])+/, ""));
  if (!file.startsWith(HERE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found");
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream" });
  res.end(fs.readFileSync(file));
});

server.listen(PORT, () => {
  process.stdout.write(`\n  the firesim console on http://127.0.0.1:${PORT}/\n`);
  process.stdout.write("  the whole backend is in the page: no server, no emulator, no network\n\n");
});
