/**
 * serve.mjs — hand the built page to a browser.
 *
 * The build output is static, so any file server will do and `python3 -m
 * http.server` is one of them. This exists for one reason: to print the URLs
 * of the demos, because `?scenario=` is not discoverable and a page that shows
 * one of four things looks like a page that only does one thing.
 *
 *   node gallery/rangerflow/web/standalone/serve.mjs [--port 8080] [--open]
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");

function argVal(flag, dflt) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}
const PORT = parseInt(argVal("--port", "8080"), 10);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".ttf": "font/ttf",
  ".sql": "text/plain; charset=utf-8",
};

const SCENARIOS = [
  ["erd", "database schema — 9 tables from a .sql file, crow's foot notation"],
  ["uml", "UML class diagram — the same compartment node, different words"],
  ["force", "force layout — d3-force live, drag a node and it pins"],
  ["flow", "flowchart — the core with no domain on top of it"],
];

if (!fs.existsSync(path.join(DIST, "rangerflow_web.js"))) {
  console.error("no build in " + DIST + " — run: npm run rangerflow:web");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent((req.url || "/").split("?")[0]);
  const file = path.join(DIST, rel === "/" ? "index.html" : rel);
  if (!file.startsWith(DIST) || !fs.existsSync(file)) {
    res.writeHead(404);
    res.end("no");
    return;
  }
  res.writeHead(200, {
    "content-type": MIME[path.extname(file)] || "application/octet-stream",
    "cache-control": "no-store",
  });
  res.end(fs.readFileSync(file));
});

server.listen(PORT, () => {
  const base = `http://localhost:${PORT}/`;
  console.log("");
  console.log("  RangerFlow — WebGL 2, no host process. Ctrl+C to stop.");
  console.log("");
  for (const [name, what] of SCENARIOS) {
    console.log(`    ${(base + "?scenario=" + name).padEnd(46)} ${what}`);
  }
  console.log("");
  console.log("  Or pick one from the `demo` dropdown in the page.");
  console.log("  Drag to pan · wheel to zoom · shift-drag to box select ·");
  console.log("  drag a handle to connect · Delete · Ctrl+Z · f to fit.");
  console.log("");
  if (process.argv.includes("--open")) {
    const opener = process.platform === "darwin" ? "open"
      : process.platform === "win32" ? "start" : "xdg-open";
    spawn(opener, [base], { stdio: "ignore", detached: true }).unref();
  }
});
