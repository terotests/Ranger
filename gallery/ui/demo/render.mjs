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
    height: 760,
    list: (M, css) => {
      const d = new M.DashboardDemo();
      d.init(css);
      const r = process.env.DASH_RANGE;
      if (r) d.selectRange(r);
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
const doc = { width: 1240, height: demo.height, list };

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
const p = await browser.newPage({ viewport: { width: 1400, height: demo.height + 60 }, deviceScaleFactor: 2 });
p.on("pageerror", (e) => console.error("PAGEERROR:", e.message));
p.on("console", (m) => { if (m.type() === "error") console.error("CONSOLE:", m.text()); });
await p.goto(`http://127.0.0.1:${port}/`);
await p.waitForFunction("window.__done === true", null, { timeout: 20000 });
console.log("painted:", JSON.stringify(await p.evaluate(() => window.__stats)));
await p.locator("canvas").screenshot({ path: process.argv[2] || path.join(ROOT, "tmp", `${WHICH}.png`) });
await browser.close();
server.close();
