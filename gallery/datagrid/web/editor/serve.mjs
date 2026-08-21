/**
 * serve.mjs — the code editor, in your own browser, on a file of your choosing.
 *
 *   npm run datagrid:editor:open                      # build, serve, open a tab
 *   npm run datagrid:editor:open -- --file x.tsx      # …with that file in it
 *   npm run datagrid:editor:open -- --port 9001 --no-open
 *
 * The page itself is static — `build.sh` writes a directory any file server can
 * serve. This adds the two things a file server cannot: it opens the browser,
 * and it hands one local file to the page (over `/__file`, read on each
 * request, so saving the file on disk and reloading the tab shows the change).
 *
 * The editor does not write back. It is a viewer you can type in; the native
 * SDL build is the one with Ctrl+S.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../../..");
const DIST = path.join(HERE, "dist");

const PORT = parseInt(argVal("--port", "8001"), 10);
const FILE = argVal("--file", "");
const OPEN = !process.argv.includes("--no-open");
const BUILD = !process.argv.includes("--no-build");

function argVal(flag, dflt) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}

if (BUILD) {
  const r = spawnSync("bash", [path.join(HERE, "build.sh")], { stdio: "inherit", cwd: ROOT });
  if (r.status !== 0) process.exit(r.status || 1);
}
if (!fs.existsSync(path.join(DIST, "code_editor_web.js"))) {
  console.error("no build in " + DIST + " — run: npm run datagrid:editor:web");
  process.exit(1);
}

const filePath = FILE ? path.resolve(process.cwd(), FILE) : "";
if (filePath && !fs.existsSync(filePath)) {
  console.error("no such file: " + filePath);
  process.exit(1);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".ttf": "font/ttf",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  // The one file this server has that the dist does not. Read per request, so
  // editing it on disk and reloading the tab is the whole workflow.
  if (url.pathname === "/__file") {
    if (!filePath) {
      res.writeHead(404);
      res.end("no --file was given");
      return;
    }
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
    res.end(fs.readFileSync(filePath));
    return;
  }
  const rel = decodeURIComponent(url.pathname);
  const file = path.join(DIST, rel === "/" ? "index.html" : rel);
  if (!file.startsWith(DIST) || !fs.existsSync(file)) {
    res.writeHead(404);
    res.end("not found: " + rel);
    return;
  }
  res.writeHead(200, {
    "content-type": MIME[path.extname(file)] || "application/octet-stream",
    "cache-control": "no-store",
  });
  res.end(fs.readFileSync(file));
});

server.listen(PORT, "127.0.0.1", () => {
  const query = filePath
    ? "?file=/__file&name=" + encodeURIComponent(path.basename(filePath))
    : "";
  const url = `http://127.0.0.1:${PORT}/index.html${query}`;
  console.log("  code editor  " + url);
  if (filePath) console.log("  showing      " + filePath);
  else console.log("  showing      the built-in samples (Ctrl+K switches)");
  console.log("  stop it with Ctrl+C");
  if (OPEN) openBrowser(url);
});

/** Whatever this platform calls "open a URL". A failure here is not fatal —
 *  the address is printed above either way. */
function openBrowser(url) {
  const cmd =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  try {
    const child = spawn(cmd, [url], { stdio: "ignore", detached: true, shell: process.platform === "win32" });
    child.on("error", () => console.log("  (could not open a browser — paste the address above)"));
    child.unref();
  } catch (_) {
    console.log("  (could not open a browser — paste the address above)");
  }
}
