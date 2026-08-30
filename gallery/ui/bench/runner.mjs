/**
 * Drive the WebGL / DOM bench in Chromium and print a scorecard.
 *
 *   npm run ui:bench
 *
 * Both sides run in one page so they share a process, a GPU and a clock.
 * Headless SwiftShader is slower than a laptop GPU — read the ratios, not
 * the milliseconds, and re-run on the machine you care about.
 *
 * What the columns mean is in README.md.
 */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findChromium, requireDom, MissingDomDeps } from "../conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const PORT = Number(process.env.PORT || 8174);

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
  ".css": "text/css; charset=utf-8",
};

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://localhost");
      let rel = decodeURIComponent(url.pathname);
      if (rel === "/") rel = "/gallery/ui/bench/index.html";
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
  return v.toFixed(1);
}

function kb(bytes) {
  if (!bytes) return "—";
  return (bytes / 1024).toFixed(1) + "k";
}

function ratio(a, b) {
  if (!a || !b) return "—";
  const r = b / a;
  if (r >= 1) return r.toFixed(1) + "×";
  return (1 / r).toFixed(1) + "×d";
}

async function main() {
  if (!fs.existsSync(path.join(HERE, "bundle-evg.js")) || !fs.existsSync(path.join(HERE, "bundle-dom.js"))) {
    console.error("bundles missing — run `node gallery/ui/bench/build.mjs` first (npm run ui:bench does)");
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

  const exe = chromePath();
  const server = await serve();
  const browser = await chromium.launch({
    executablePath: exe,
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
  await page.goto(`http://127.0.0.1:${PORT}/gallery/ui/bench/index.html`);
  await page.waitForFunction("window.__EVG_READY__ === true && window.__DOM_READY__ === true");

  const glOk = await page.evaluate(() => {
    const c = document.getElementById("evg");
    const g = c.getContext("webgl2");
    return !!(g && g.getParameter(g.VERSION));
  });
  if (!glOk) {
    console.error("WebGL 2 is not available in this Chromium");
    await browser.close();
    server.close();
    process.exit(2);
  }

  const scenes = await page.evaluate(() => window.__SCENES__);
  const rows = [];
  for (const scene of scenes) {
    process.stderr.write("  " + scene.id + " …\n");
    const evg = await page.evaluate(async (s) => window.__benchEvg(s), scene);
    const dom = scene.evg === "showcase"
      ? { skipped: true }
      : await page.evaluate(async (s) => window.__benchDom(s), scene);
    rows.push({ scene, evg, dom });
  }

  await browser.close();
  server.close();

  console.log("");
  console.log("Ranger UI — WebGL vs Radix/DOM  (median ms, headless SwiftShader)");
  console.log("engine = layout + display list;  showcase = engine + JSON + WebGL");
  console.log("mount  = React render + two animation frames");
  console.log("");

  let group = "";
  for (const { scene, evg, dom } of rows) {
    if (scene.group !== group) {
      group = scene.group;
      console.log("─".repeat(108));
      console.log(group);
      if (group === "showcase") {
        console.log(
          pad("scene", 22, true) +
            pad("engine", 8) +
            pad("json+gl", 9) +
            pad("total", 8) +
            pad("cmds", 7) +
            pad("json", 8) +
            pad("drawn", 7),
        );
      } else {
        console.log(
          pad("scene", 22, true) +
            pad("evg-eng", 8) +
            pad("evg-all", 8) +
            pad("dom", 8) +
            pad("upd-e", 8) +
            pad("upd-d", 8) +
            pad("cmds", 7) +
            pad("nodes", 7) +
            pad("json", 8) +
            pad("n", 6),
        );
      }
    }
    if (scene.evg === "showcase") {
      console.log(
        pad(scene.id, 22, true) +
          pad(ms(evg.engine_ms), 8) +
          pad(ms(evg.parse_ms + evg.gl_ms), 9) +
          pad(ms(evg.showcase_ms), 8) +
          pad(evg.cmds, 7) +
          pad(kb(evg.json_bytes), 8) +
          pad(evg.drawn, 7),
      );
      continue;
    }
    console.log(
      pad(scene.id, 22, true) +
        pad(ms(evg.engine_ms), 8) +
        pad(ms(evg.showcase_ms), 8) +
        pad(ms(dom.mount_ms), 8) +
        pad(ms(evg.update_ms), 8) +
        pad(ms(dom.update_ms), 8) +
        pad(evg.cmds, 7) +
        pad(dom.nodes, 7) +
        pad(kb(evg.json_bytes), 8) +
        pad(scene.n, 6),
    );
  }
  console.log("─".repeat(108));
  console.log("");
  console.log("breakdown (kit scenes, median ms)");
  console.log(
    pad("scene", 22, true) +
      pad("layout", 8) +
      pad("dlist", 8) +
      pad("json", 8) +
      pad("parse", 8) +
      pad("webgl", 8) +
      pad("els", 7) +
      pad("dom÷evg", 9),
  );
  for (const { scene, evg, dom } of rows) {
    if (scene.evg === "showcase") continue;
    console.log(
      pad(scene.id, 22, true) +
        pad(ms(evg.layout_ms), 8) +
        pad(ms(evg.dl_ms), 8) +
        pad(ms(evg.json_ms), 8) +
        pad(ms(evg.parse_ms), 8) +
        pad(ms(evg.gl_ms), 8) +
        pad(evg.elements, 7) +
        pad(ratio(evg.showcase_ms, dom.mount_ms), 9),
    );
  }
  console.log("");
  console.log("dom÷evg > 1 means the DOM mount was slower than EVG's full paint.");
  console.log("A native host skips json+parse; compare evg-eng against dom for that.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
