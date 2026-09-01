/**
 * Paint MenubarDemo with the real EVG WebGL painter and save a PNG.
 *
 *   node gallery/ui/demo/render.mjs [out.png]
 *
 * The display list comes from Ranger; this only opens a browser to draw it,
 * the same painter gallery/ui/web uses.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { requireDom, findChromium } from "../conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const require = createRequire(import.meta.url);

// Which demo to paint. Both are built the same way and differ only in what
// they hand back, so the page below does not know which one it is drawing.
const WHICH = process.env.DEMO || "menubar";
const DEMOS = {
  menubar: {
    module: "gallery/ui/bin/MenubarDemo.cjs",
    css: "menubar.css",
    height: 560,
    list: (M, css) =>
      M.MenubarDemo.displayListJson(css, ["Always Show Full URLs"], "Luis", "File", true, false),
    errors: (M, css) => M.MenubarDemo.styleErrors(css),
  },
  sortable: {
    module: "gallery/ui/bin/SortableDemo.cjs",
    css: "sortable.css",
    height: 560,
    list: (M, css) =>
      M.SortableDemo.displayListJson(css, ["demo", "spec", "video", "audio", "extra"], ""),
    errors: (M, css) => M.SortableDemo.styleErrors(css),
  },
  toolbar: {
    module: "gallery/ui/bin/ToolbarDemo.cjs",
    css: "toolbar.css",
    height: 320,
    list: (M, css) =>
      M.ToolbarDemo.displayListJson(css, true, false, false, "center", "Edited 2 hours ago"),
    errors: (M, css) => M.ToolbarDemo.styleErrors(css),
  },
  dashboard: {
    module: "gallery/ui/bin/DashboardDemo.cjs",
    css: "dashboard.css",
    width: 1336,
    height: 900,
    list: (M, css) => {
      const d = new M.DashboardDemo();
      d.init(css);
      const r = process.env.DASH_RANGE;
      if (r) d.selectRange(r);
      const sc = process.env.DASH_SCROLL;
      if (sc) { d.virt.scrollTo(Number(sc)); d.rebuild(); }
      const nav = process.env.DASH_NAV;
      if (nav) d.press("db-nav-" + nav);
      const py = process.env.DASH_PAGE_SCROLL;
      if (py) d.scrollTo(Number(py));
      // "x,y,seconds" — a ripple frozen at an age, so the effect can be looked
      // at rather than caught mid-flight.
      // "x,y,t;x,y,t;..." — several drops, each frozen at its own age, so the
      // interference can be looked at rather than caught mid-flight.
      const rp = process.env.DASH_RIPPLE;
      if (rp) {
        const drops = rp.split(";").map((g) => g.split(",").map(Number));
        // Oldest first: place it, age everything, place the next.
        const byAge = drops.slice().sort((a, b) => b[2] - a[2]);
        let now = byAge[0][2];
        for (const [x, y, t] of byAge) {
          d.tick((now - t) * 1000);
          now = t;
          d.ripple(x, y);
        }
        d.tick(now * 1000);
      }
      return d.displayListJson();
    },
    errors: (M, css) => {
      const d = new M.DashboardDemo();
      d.init(css);
      return d.styleErrorCount();
    },
  },

  profile: {
    module: "gallery/ui/bin/ProfileDemo.cjs",
    css: "profile.css",
    height: 800,
    list: (M, css) => {
      const d = new M.ProfileDemo();
      d.init(css);
      return d.displayListJson();
    },
    errors: (M, css) => {
      const d = new M.ProfileDemo();
      d.init(css);
      return d.styleErrorCount();
    },
  },

  calendar: {
    module: "gallery/ui/bin/CalendarDemo.cjs",
    css: "calendar.css",
    height: 520,
    list: (M, css) => {
      const d = new M.CalendarDemo();
      d.init(css);
      // A day is chosen, because the picture is meant to show what a chosen
      // day looks like — and a black-on-black number is exactly the failure a
      // snapshot of the empty state would not catch.
      d.press("cal-2026-05-20");
      return d.displayListJson();
    },
    errors: (M, css) => {
      const d = new M.CalendarDemo();
      d.init(css);
      return d.styleErrorCount();
    },
  },

  form: {
    module: "gallery/ui/bin/FormDemo.cjs",
    css: "form.css",
    height: 640,
    list: (M, css) => {
      const d = new M.FormDemo();
      d.init(css);
      return d.displayListJson();
    },
    errors: (M, css) => {
      const d = new M.FormDemo();
      d.init(css);
      return d.styleErrorCount();
    },
  },

  resize: {
    module: "gallery/ui/bin/ResizeDemo.cjs",
    css: "resize.css",
    height: 520,
    // This one is a live controller rather than a pure function: the trail's
    // width decides how many crumbs there are, so the demo has to settle
    // before it has a display list worth painting.
    list: (M, css) => {
      const d = new M.ResizeDemo();
      d.init(css);
      const pct = Number(process.env.RESIZE_PCT || "60");
      const p = d.outer.panels[0];
      const q = d.outer.panels[1];
      q.size += p.size - pct;
      p.size = pct;
      d.rebuild();
      d.displayListJson();
      d.settle();
      return d.displayListJson();
    },
    errors: (M, css) => {
      const d = new M.ResizeDemo();
      d.init(css);
      return d.styleErrorCount();
    },
  },
};
const demo = DEMOS[WHICH];
if (!demo) throw new Error(`unknown demo ${WHICH} — one of ${Object.keys(DEMOS).join(", ")}`);

const M = require(path.join(ROOT, demo.module));
const css = fs.readFileSync(path.join(HERE, demo.css), "utf8");

const errors = demo.errors(M, css);
if (errors > 0) throw new Error(`the stylesheet has ${errors} error(s)`);

const list = JSON.parse(demo.list(M, css));
// The canvas is as wide as the demo says it is. The dashboard grew past
// 1240 when the sidebar arrived, and a canvas that stays 1240 does not
// report the overflow, it crops it.
const doc = { width: demo.width || 1240, height: demo.height, list };

const html = `<!doctype html><meta charset="utf-8">
<link rel="icon" href="data:,">
<style>html,body{margin:0;background:#fff}canvas{display:block}</style>
<canvas id="c"></canvas>
<script type="module">
import { renderDisplayList } from "/gallery/evg/gl/evg-webgl.js";
const doc = ${JSON.stringify(doc)};
const c = document.getElementById("c");
const dpr = 2;
c.style.width = doc.width + "px";
c.style.height = doc.height + "px";
c.width = doc.width * dpr;
c.height = doc.height * dpr;
const gl = c.getContext("webgl2", { antialias: true, premultipliedAlpha: false, stencil: true, preserveDrawingBuffer: true });
await document.fonts.ready;
await Promise.all(doc.list.cmds.filter((x) => x.text).map((x) => document.fonts.load(\`\${x.size}px "\${x.font}"\`)));
window.__stats = renderDisplayList(gl, doc, { dpr });
// COVERAGE, counted off the finished frame. This is one frame and it is the
// FIRST one, which is the only frame a surface effect can ruin: the effect's
// target is made once and reused, so a mistake made while making it shows here
// and is invisible for the rest of the session.
//
// What it counts is OPAQUE pixels, and the reason it is opacity rather than
// something that sounds more like a picture is that the failure being watched
// for leaves the canvas TRANSPARENT, not blank. A page whose draws were
// dropped shows the white of the HTML behind it, which photographs as a
// perfectly reasonable white page — counting dark pixels on it happily found
// half a million of them and called the frame healthy. Alpha does not lie: a
// page that paints its own background covers every pixel, and the broken frame
// covered one in eight.
{
  const px = new Uint8Array(c.width * c.height * 4);
  gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
  let covered = 0;
  for (let i = 3; i < px.length; i += 4) if (px[i] > 128) covered += 1;
  window.__stats.covered = covered;
  window.__stats.pixels = px.length / 4;
}
window.__done = true;
</script>`;
// Served over HTTP, not opened from disk: Chromium refuses to load an ES
// module from a file:// page, so the painter would never import.
const page = path.join(ROOT, "tmp", `${WHICH}_demo.html`);
fs.mkdirSync(path.dirname(page), { recursive: true });
fs.writeFileSync(page, html);
const { createServer } = await import("node:http");
const server = createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = rel === "/" ? page : path.join(ROOT, rel.slice(1));
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end("not found");
    return;
  }
  const type = file.endsWith(".js") || file.endsWith(".mjs") ? "text/javascript" : "text/html";
  res.writeHead(200, { "content-type": type }).end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const { chromium } = requireDom("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
const p = await browser.newPage({ viewport: { width: doc.width + 60, height: demo.height + 60 }, deviceScaleFactor: 2 });
p.on("pageerror", (e) => console.error("PAGEERROR:", e.message));
p.on("console", (m) => { if (m.type() === "error") console.error("CONSOLE:", m.text()); });
await p.goto(`http://127.0.0.1:${port}/`);
await p.waitForFunction("window.__done === true", null, { timeout: 20000 });
console.log("painted:", JSON.stringify(await p.evaluate(() => window.__stats)));
await p.locator("canvas").screenshot({ path: process.argv[2] || path.join(ROOT, "tmp", `${WHICH}.png`) });
await browser.close();
server.close();
