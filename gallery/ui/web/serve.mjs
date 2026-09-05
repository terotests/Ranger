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
// The page "/" lands on. The demo server reuses this file with a different
// one, because both pages need the repository root for gallery/evg's painter.
const PAGE = process.env.PAGE || "/gallery/ui/web/index.html";

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

// --- live CSS -----------------------------------------------------------------
//
// The stylesheet is an INPUT to an EVG app — `init(css)` is how every demo
// here starts — so it is the one thing an inspector can hand back changed
// without intercepting anything. The app re-parses and re-cascades exactly as
// it did at startup, and the layout, the display list and the hit test follow
// because they always did.
//
// This end of it is small on purpose: watch the demo's .css files, and say
// which one changed. The page decides what to do about it, which is to fetch
// the file and give it to the app. Nothing here knows what a rule is.
const CSS_DIR = path.join(ROOT, "gallery/ui/demo");
const cssClients = new Set();
let cssPending = null;

function cssChanged(file) {
  // `fs.watch` fires two or three times for one save on most platforms — the
  // truncate and the write are separate events — so a save that reloaded the
  // sheet three times would relayout three times and log three times.
  clearTimeout(cssPending);
  cssPending = setTimeout(() => {
    const line = JSON.stringify({ file, href: "/gallery/ui/demo/" + file });
    for (const res of cssClients) {
      try { res.write(`data: ${line}\n\n`); } catch { cssClients.delete(res); }
    }
    console.log(`  css → ${file}  (${cssClients.size} listening)`);
  }, 40);
}

try {
  fs.watch(CSS_DIR, (_kind, name) => {
    if (name && name.endsWith(".css")) cssChanged(name);
  });
} catch (e) {
  console.log("  (no css watch: " + e.message + ")");
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  // Writing a sheet back. The panel edits the app's INPUT, so "save" means
  // putting the text where the input came from — after which the watch above
  // picks it up and every other page open on it re-cascades too.
  //
  // Narrow on purpose: a .css file directly inside gallery/ui/demo, and
  // nothing else. This server exists to serve a demo on a developer's own
  // machine and a PUT that could reach further would be a worse thing than the
  // convenience is worth.
  if (req.method === "PUT") {
    const rel = decodeURIComponent(url.pathname);
    const okPath = /^\/gallery\/ui\/demo\/[A-Za-z0-9_.-]+\.css$/.test(rel);
    if (!okPath) {
      res.writeHead(403, { "content-type": "text/plain" }).end("only gallery/ui/demo/*.css");
      return;
    }
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        fs.writeFileSync(path.join(ROOT, rel), Buffer.concat(chunks));
        console.log(`  css ← ${rel.split("/").pop()}  (saved from the inspector)`);
        res.writeHead(204).end();
      } catch (e) {
        res.writeHead(500, { "content-type": "text/plain" }).end(e.message);
      }
    });
    return;
  }

  // The live-CSS stream. One long response per page; a page that goes away
  // takes its entry with it on "close".
  if (url.pathname === "/evg/css/events") {
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-store",
      connection: "keep-alive",
    });
    res.write("retry: 1000\n\n");
    cssClients.add(res);
    req.on("close", () => cssClients.delete(res));
    return;
  }

  // Redirect "/" rather than serving the page there. Serving it inline leaves
  // the browser on "/", where the page's own `./bundle.js` resolves to the
  // repository root and 404s — the page then loads, looks nearly right, and
  // does nothing at all, which is how this was found.
  if (url.pathname === "/") {
    res.writeHead(302, { location: PAGE }).end();
    return;
  }
  const rel = decodeURIComponent(url.pathname);
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
  console.log(`\n  conformance playground → http://127.0.0.1:${PORT}/gallery/ui/web/index.html`);
  console.log(`  tree-literal demos     → http://127.0.0.1:${PORT}/gallery/ui/demo/index.html`);
  console.log(`  the same, inspected    → http://127.0.0.1:${PORT}/gallery/ui/demo/index.html?inspect=1&demo=dashboard\n`);
  console.log("  The playground puts Radix beside Ranger's EVG controllers and diffs");
  console.log("  them live. The demos are the menubar and toolbar built with `tree`.");
  console.log("  Edit gallery/ui/demo/*.css with the inspector open and the page");
  console.log("  re-cascades on save — the sheet is an input, so nothing is patched.\n");
  console.log("  Ctrl+C to stop.\n");
});
