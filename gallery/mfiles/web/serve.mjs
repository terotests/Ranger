#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Serve the emulator page: a static server rooted here and nothing else. The
// vault, its API and the extension engines are all inside the page.
//
//   npm run mfiles:web            # build, serve, print the URL
//   node gallery/mfiles/web/serve.mjs --port 8124

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const portFlag = argv.indexOf("--port");
const PORT = portFlag >= 0 ? Number(argv[portFlag + 1]) : 8124;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
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
  process.stdout.write(`\n  the M-Files emulator on http://127.0.0.1:${PORT}/  (UIX v1: /?mode=1)\n\n`);
});
