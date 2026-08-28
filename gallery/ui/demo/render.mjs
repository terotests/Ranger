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

const M = require(path.join(ROOT, "gallery/ui/bin/MenubarDemo.cjs"));
const css = fs.readFileSync(path.join(HERE, "menubar.css"), "utf8");

const errors = M.MenubarDemo.styleErrors(css);
if (errors > 0) throw new Error(`the stylesheet has ${errors} error(s)`);

const list = JSON.parse(M.MenubarDemo.displayListJson(css, ["Always Show Full URLs"], "Luis"));
const doc = { width: 1240, height: 560, list };

const html = `<!doctype html><meta charset="utf-8">
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
const page = path.join(ROOT, "tmp", "menubar_demo.html");
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
const p = await browser.newPage({ viewport: { width: 1320, height: 620 }, deviceScaleFactor: 2 });
p.on("pageerror", (e) => console.error("PAGEERROR:", e.message));
p.on("console", (m) => { if (m.type() === "error") console.error("CONSOLE:", m.text()); });
await p.goto(`http://127.0.0.1:${port}/`);
await p.waitForFunction("window.__done === true", null, { timeout: 20000 });
console.log("painted:", JSON.stringify(await p.evaluate(() => window.__stats)));
await p.locator("canvas").screenshot({ path: process.argv[2] || path.join(ROOT, "tmp", "menubar.png") });
await browser.close();
server.close();
