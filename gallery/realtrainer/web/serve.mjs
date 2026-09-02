// SPDX-License-Identifier: AGPL-3.0-or-later
//
// A static server rooted at the repository, so the page can reach
// gallery/evg's painter by its real path. No dependencies.
//
//   npm run rt:web
//   PORT=9000 npm run rt:web

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const PORT = Number(process.env.PORT || 8174);
const PAGE = "/gallery/realtrainer/web/index.html";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".cjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  // Redirected rather than served here: a page served at "/" resolves its own
  // `./bundle.js` against the repository root, 404s, and then loads looking
  // nearly right and doing nothing at all.
  if (url.pathname === "/") {
    res.writeHead(302, { location: PAGE }).end();
    return;
  }
  const rel = decodeURIComponent(url.pathname);
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end("forbidden");
    return;
  }
  fs.readFile(file, (err, body) => {
    if (err) {
      res.writeHead(404, { "content-type": "text/plain" }).end("not found: " + rel);
      return;
    }
    res.writeHead(200, {
      "content-type": TYPES[path.extname(file)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(body);
  });
});

server.listen(PORT, () => {
  console.log(`\n  RealTrainer → http://127.0.0.1:${PORT}${PAGE}\n`);
  console.log("  The loader runs, hands over to the sign-in page, and the");
  console.log("  button starts it again. Ctrl+C to stop.\n");
});
