// serve.mjs — static server for the pose game / PoC.
//
// Serves this directory with cross-origin-isolation headers (COOP/COEP) so the
// camera, SharedArrayBuffer and wasm threads are all available. Then open the
// printed URL + /game.html in a browser (on localhost the camera is allowed
// without https; from another host use https or a tunnel).
//
//   node serve.mjs            # default port 8080 (or $PORT)

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;
const MIME = {
  ".html": "text/html", ".mjs": "text/javascript", ".js": "text/javascript",
  ".wasm": "application/wasm", ".task": "application/octet-stream",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".map": "application/json", ".json": "application/json",
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  const filePath = path.join(ROOT, urlPath === "/" ? "game.html" : urlPath);
  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404); res.end("not found"); return;
  }
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Content-Type", MIME[path.extname(filePath)] || "application/octet-stream");
  fs.createReadStream(filePath).pipe(res);
}).listen(PORT, () => {
  console.log(`Pose game:  http://localhost:${PORT}/game.html   (add ?nocam=1 for no webcam)`);
  console.log(`PoC page :  http://localhost:${PORT}/index.html`);
});
