/**
 * smoke.mjs — does the playground actually run in a browser?
 *
 *   npm run pptx:playground:test
 *
 * A page that builds is not a page that works: every interesting failure here
 * — a bundle that throws on load, a font that never registers, a deck the
 * writer produced that the reader cannot open — happens at runtime and leaves
 * the build perfectly green.
 *
 * So this opens the real page in headless Chromium and drives it, and the
 * assertions are about the ROUND TRIP rather than about pixels: every preset
 * has to produce bytes that are a ZIP, the editor has to open those bytes and
 * report the slide count the code asked for, and the picture has to change
 * between presets. A page that silently drew the same thing every time would
 * pass a screenshot check and fail all three.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");
const PORT = 8873;
const MIME = {
  ".html": "text/html; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8", ".png": "image/png",
};

function findChrome() {
  const fixed = [process.env.CHROME_PATH, "/usr/bin/chromium", "/usr/bin/google-chrome"].filter(Boolean);
  for (const c of fixed) if (fs.existsSync(c)) return c;
  const pw = "/opt/pw-browsers";
  if (fs.existsSync(pw)) {
    for (const dir of fs.readdirSync(pw)) {
      for (const rel of ["chrome-linux/chrome", "chrome"]) {
        const c = path.join(pw, dir, rel);
        if (fs.existsSync(c)) return c;
      }
    }
  }
  return null;
}

const missing = [];
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\//, "") || "index.html";
  const file = path.join(DIST, rel);
  fs.readFile(file, (err, body) => {
    if (err) { missing.push(rel); res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(body);
  });
});
await new Promise((r) => server.listen(PORT, r));

/**
 * Playwright, wherever this machine keeps it — it is installed globally here
 * rather than in the repository, so a bare import does not resolve.
 *
 * A missing Playwright FAILS rather than skipping. A smoke test that quietly
 * passes when it could not run is worse than no smoke test: the whole point of
 * this file is that a page which builds is not a page that works, and a green
 * line saying nothing was checked reads exactly like a green line saying
 * everything was.
 */
function loadPlaywright() {
  const anchors = ["/opt/node22/lib/node_modules/x", path.join(HERE, "../../../../package.json"),
                   path.join(process.cwd(), "package.json"), import.meta.url];
  for (const anchor of anchors) {
    for (const name of ["playwright", "playwright-core"]) {
      try { return createRequire(anchor)(name); } catch { /* next */ }
    }
  }
  return null;
}
const pw = loadPlaywright();
if (!pw) {
  console.error("Playwright is not available, so the page was not checked.");
  console.error("Install it (npm i -g playwright) or set PLAYGROUND_SMOKE_OPTIONAL=1 to allow a skip.");
  server.close();
  process.exit(process.env.PLAYGROUND_SMOKE_OPTIONAL ? 0 : 1);
}
const { chromium } = pw;
const browser = await chromium.launch({
  executablePath: findChrome() || undefined,
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

await page.goto(`http://127.0.0.1:${PORT}/index.html`);
await page.waitForFunction(() => window.__playgroundReady === true, null, { timeout: 60000 });

const checks = [];
const ok = (name, cond) => checks.push({ name, ok: !!cond });

const presets = await page.$$eval("#preset option", (os) => os.map((o) => o.value));
ok("the presets are listed", presets.length >= 4);

const shots = [];
for (const name of presets) {
  const result = await page.evaluate(async (which) => {
    const sel = document.getElementById("preset");
    sel.value = which;
    sel.dispatchEvent(new Event("change"));
    await new Promise((r) => setTimeout(r, 400));
    const status = document.getElementById("status");
    // Run the code again directly so the deck's own bytes can be measured.
    const fn = new Function("Pptx", "Renderer", '"use strict";\n' + document.getElementById("code").value);
    const deck = fn(window.__jsApi, null);
    const bytes = deck.save();
    return {
      statusText: status.textContent,
      bad: status.className === "bad",
      length: bytes.length,
      zip: bytes[0] === 0x50 && bytes[1] === 0x4b,
      slides: deck.slideCount,
      scene: document.getElementById("where").textContent,
    };
  }, name);
  ok(`${name}: the code runs without an error`, !result.bad);
  ok(`${name}: it produces a .pptx`, result.zip && result.length > 2000);
  ok(`${name}: the editor opened it`, /\d+ \/ \d+/.test(result.scene));
  ok(`${name}: with the slides the code asked for`,
    Number(result.scene.split("/")[1]) === result.slides);
  shots.push(await page.locator("#screen").screenshot());
}

// Different presets must DRAW differently, or the right-hand pane is a picture
// of the first deck that nothing after it changed.
const distinct = new Set(shots.map((b) => b.length)).size;
ok("the presets draw different pictures", distinct > 1);

// Paging through a multi-slide deck must change what is drawn.
await page.evaluate(() => {
  const sel = document.getElementById("preset");
  sel.value = "Several slides";
  sel.dispatchEvent(new Event("change"));
});
await page.waitForTimeout(500);
const first = await page.locator("#screen").screenshot();
await page.click("#next");
await page.waitForTimeout(300);
const second = await page.locator("#screen").screenshot();
ok("paging to the next slide draws something else", first.length !== second.length);

// A 404 for the page's own favicon is the browser asking, not the page
// failing; anything else the page requested and did not get is a real hole.
const realMissing = missing.filter((m) => m !== "favicon.ico");
ok("every file the page asked for was there", realMissing.length === 0);
if (realMissing.length) console.log("  missing: " + realMissing.join(", "));

const realErrors = errors.filter((e) => !/favicon|404 \(Not Found\)/.test(e));
ok("nothing threw", realErrors.length === 0);
if (realErrors.length) for (const e of realErrors.slice(0, 5)) console.log("  page error: " + e);

await browser.close();
server.close();

const passed = checks.filter((c) => c.ok).length;
for (const c of checks) console.log(`  ${c.ok ? "PASS" : "FAIL"}  ${c.name}`);
console.log(`\npassed = ${passed}/${checks.length}`);
if (passed !== checks.length) { console.log("SOME FAILED"); process.exit(1); }
console.log("ALL PASS");
console.log("\nthe playground wrote decks and the editor opened them, in a real browser");
