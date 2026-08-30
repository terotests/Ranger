/**
 * Drive the Ranger-only render stress test in Chromium.
 *
 *   npm run ui:bench:stress
 *
 * Pushes EVG until a frame drops under 60 / 30 fps, and times three paths:
 * paint-only, retained tree, and a full rebuild. Synthetic rect and text
 * lists sit beside real TableCtl / checkbox trees so the painter can be
 * asked about command count without the controller answering for it.
 *
 * `gl.finish()` is on every paint, so the milliseconds include the GPU.
 * Headless SwiftShader is slower than a laptop GPU — the ceiling moves.
 */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findChromium, requireDom, MissingDomDeps } from "../conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const PORT = Number(process.env.PORT || 8175);

function chromePath() {
  if (process.env.RANGER_CHROMIUM) return process.env.RANGER_CHROMIUM;
  const found = findChromium();
  if (found) return found;
  for (const c of ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/usr/bin/chromium"]) {
    if (fs.existsSync(c)) return c;
  }
  return undefined;
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".cjs": "text/javascript; charset=utf-8",
};

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://localhost");
      let rel = decodeURIComponent(url.pathname);
      if (rel === "/") rel = "/gallery/ui/bench/stress.html";
      const file = path.join(ROOT, rel);
      if (!file.startsWith(ROOT + path.sep)) {
        res.writeHead(403).end("forbidden");
        return;
      }
      fs.readFile(file, (err, body) => {
        if (err) {
          res.writeHead(404).end("not found: " + rel);
          return;
        }
        res.writeHead(200, {
          "content-type": TYPES[path.extname(file)] || "application/octet-stream",
          "cache-control": "no-store",
        });
        res.end(body);
      });
    });
    server.listen(PORT, () => resolve(server));
  });
}

function pad(s, n, right) {
  const t = String(s);
  if (t.length >= n) return t;
  return right ? t + " ".repeat(n - t.length) : " ".repeat(n - t.length) + t;
}

function ms(v) {
  if (v == null || Number.isNaN(v)) return "—";
  return Number(v).toFixed(1);
}

function fps(v) {
  if (v == null || Number.isNaN(v) || !v) return "—";
  return Number(v).toFixed(0);
}

function mark(msVal) {
  if (msVal == null) return "";
  if (msVal <= 16.7) return "  60";
  if (msVal <= 33.3) return "  30";
  return "   ·";
}

async function main() {
  if (!fs.existsSync(path.join(HERE, "bundle-stress.js"))) {
    console.error("bundle-stress.js missing — run `node gallery/ui/bench/build.mjs` first");
    process.exit(3);
  }

  let chromium;
  try {
    ({ chromium } = requireDom("playwright-core"));
  } catch (e) {
    if (e instanceof MissingDomDeps) {
      console.error(e.message);
      process.exit(3);
    }
    throw e;
  }

  const server = await serve();
  const browser = await chromium.launch({
    executablePath: chromePath(),
    args: [
      "--no-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
    ],
  });

  const page = await browser.newPage();
  page.on("pageerror", (err) => console.error("page:", err.message));
  await page.goto(`http://127.0.0.1:${PORT}/gallery/ui/bench/stress.html`);
  await page.waitForFunction("window.__STRESS_READY__ === true");

  process.stderr.write("  running stress (this pushes N until a frame is slow)…\n");
  const result = await page.evaluate(() => window.__runStress());

  await browser.close();
  server.close();

  console.log("");
  console.log("Ranger render stress  (median ms, gl.finish, headless SwiftShader)");
  console.log("  paint    = list already built, WebGL only");
  console.log("  retained = kept tree, layout + display list + paint");
  console.log("  rebuild  = buildHost + the lot (dirty frame / tree literal)");
  console.log("  GL: " + result.renderer);
  console.log("");

  let group = "";
  for (const row of result.rows) {
    if (row.group !== group) {
      group = row.group;
      console.log("─".repeat(88));
      console.log(group);
      console.log(
        pad("scene", 24, true) +
          pad("path", 10) +
          pad("n", 7) +
          pad("cmds", 8) +
          pad("med", 8) +
          pad("p95", 8) +
          pad("fps", 7) +
          "  hz",
      );
    }
    if (row.error) {
      console.log(pad(row.id, 24, true) + "  ERROR  " + row.error);
      continue;
    }
    console.log(
      pad(row.id, 24, true) +
        pad(row.path, 10) +
        pad(row.n, 7) +
        pad(row.cmds || "—", 8) +
        pad(ms(row.median_ms), 8) +
        pad(ms(row.p95_ms), 8) +
        pad(fps(row.fps), 7) +
        mark(row.median_ms),
    );
  }
  console.log("─".repeat(88));
  console.log("");
  console.log("ceiling — largest N that still held the budget");
  for (const [label, found] of Object.entries(result.ceilings)) {
    console.log("  " + label);
    const keys = Object.keys(found).sort();
    if (!keys.length) {
      console.log("    (nothing stayed under budget)");
      continue;
    }
    for (const key of keys) {
      const v = found[key];
      console.log(
        "    " +
          pad(key, 22, true) +
          "  n=" +
          pad(v.n, 6) +
          "  " +
          ms(v.ms) +
          " ms  " +
          v.cmds +
          " cmds",
      );
    }
  }
  console.log("");
  console.log("hz  60 = median ≤ 16.7 ms    30 = ≤ 33.3 ms    · = over");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
