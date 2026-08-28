/**
 * A static server for the playground, rooted at the repository so the page can
 * reach gallery/evg's painter by its real path. No dependencies.
 *
 *   npm run ui:web            # build, serve, print the URL
 *   PORT=9000 npm run ui:web
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const PORT = Number(process.env.PORT || 8173);
const PAGE = "/gallery/ui/web/index.html";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".cjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".png": "image/png",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const rel = decodeURIComponent(url.pathname === "/" ? PAGE : url.pathname);
  const file = path.join(ROOT, rel);

  // Never serve outside the repository, whatever the path says.
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
  console.log(`\n  gallery/ui playground → http://127.0.0.1:${PORT}${PAGE}\n`);
  console.log("  Radix on the left, Ranger's EVG controllers on the right.");
  console.log("  Click or type on either side; the trace below diffs them live.");
  console.log("  Ctrl+C to stop.\n");
});
