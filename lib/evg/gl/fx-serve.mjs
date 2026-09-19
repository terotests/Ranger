/**
 * The effects demo, served.
 *
 *   npm run evg:fx:demo            then open http://localhost:8099/fx-demo.html
 *
 * A static server over this one directory, because `fx-demo.html` imports
 * `evg-webgl.js` and `evg-fx.js` as ES modules and a browser refuses a module
 * over `file://`. Nothing else about the page needs a server: the document it
 * draws is a script tag, not a fetch.
 */

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8099);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
};

if (!fs.existsSync(path.join(HERE, "fx-demo.js"))) {
  console.error("fx-demo.js is missing — run `npm run evg:fx:doc` first");
  process.exit(3);
}

http.createServer((req, res) => {
  const name = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\/+/, "") || "fx-demo.html";
  // One directory, and only this one: a demo server that can be asked for
  // `../../../etc/passwd` is a demo server nobody should run.
  const file = path.join(HERE, path.basename(name));
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not here: " + name);
    return;
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  res.end(fs.readFileSync(file));
}).listen(PORT, () => {
  console.log(`EVG effects demo: http://localhost:${PORT}/fx-demo.html`);
});
