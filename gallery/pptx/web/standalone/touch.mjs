/**
 * touch.mjs — the editor under a FINGER, not under a mouse.
 *
 *   npm run pptx:web:touch:test
 *
 * WHY THIS EXISTS SEPARATELY. `smoke.mjs` drives Chrome with `--dump-dom` and
 * cannot produce a touch: it clicks with a mouse, and a mouse does not tell
 * the truth about a phone. The bug that prompted this file was invisible to
 * every mouse test and to the page's own selftest, because it is caused by an
 * event a mouse never sends.
 *
 * WHAT THE BUG WAS. One tap on a shape produces, in this order:
 *
 *     pointerdown:touch  touchstart  pointerup:touch
 *       focusout=screen  focusin=softkeys     ← the page raises the keyboard
 *     touchend
 *     mousedown                               ← the browser's COMPATIBILITY event
 *       focusout=softkeys  focusin=screen     ← the browser focuses the canvas
 *     mouseup  click
 *
 * Every touch browser synthesises that `mousedown` after `touchend` so that
 * mouse-only pages work with a finger. The canvas is `tabindex="0"`, and the
 * DEFAULT ACTION of a mousedown on a focusable element is to focus it — so the
 * browser took focus off the keyboard field a moment after the page had put it
 * there. The keyboard rose and vanished, and the app stayed in text edit with
 * nothing able to type into it.
 *
 * So the assertion below is not "the field has focus" — the old selftest
 * asserted that and passed. It is "the field STILL has focus once the
 * compatibility events have been and gone".
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(process.argv.includes("--dist")
  ? process.argv[process.argv.indexOf("--dist") + 1]
  : path.join(HERE, "dist"));
const PORT = 8898;

if (!fs.existsSync(path.join(DIST, "index.html"))) {
  console.error("no build in " + DIST + " — run: npm run pptx:web");
  process.exit(1);
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".ttf": "font/ttf", ".txt": "text/plain",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".png": "image/png", ".wasm": "application/wasm",
};
/** Playwright, wherever this machine keeps it — the same search the
 *  playground's suite makes, for the same reason. */
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

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(DIST, rel === "/" ? "index.html" : rel);
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); return res.end();
  }
  res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
  res.end(fs.readFileSync(file));
}).listen(PORT);

const checks = [];
const ok = (name, cond) => checks.push({ name, ok: !!cond });

const pw = loadPlaywright();
if (!pw) {
  console.error("Playwright is not available, so the page was not checked under a finger.");
  console.error("Install it (npm i -g playwright) or set PPTX_TOUCH_OPTIONAL=1 to allow a skip.");
  server.close();
  process.exit(process.env.PPTX_TOUCH_OPTIONAL ? 0 : 1);
}
const { chromium } = pw;
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader"],
});
// A phone: narrow, tall, and a touchscreen. `isMobile` is what makes Chrome
// synthesise the compatibility mouse events this file is about.
const context = await browser.newContext({
  viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2,
});
const page = await context.newPage();
await page.goto(`http://127.0.0.1:${PORT}/index.html?coarse=1`);
await page.waitForFunction(() => window.__pptxWeb !== undefined, null, { timeout: 60000 });
await page.waitForTimeout(1200);

await page.evaluate(() => {
  window.__ev = [];
  const push = (s) => window.__ev.push(s);
  for (const t of ["pointerdown", "pointerup", "mousedown", "mouseup", "touchstart", "touchend"]) {
    document.getElementById("screen").addEventListener(t, (e) =>
      push(t + (e.pointerType ? ":" + e.pointerType : "")), true);
  }
  for (const t of ["focusin", "focusout"]) {
    document.addEventListener(t, (e) => push(t + "=" + (e.target.id || e.target.tagName)), true);
  }
  const web = window.__pptxWeb;
  if (!web.editing()) web.run("edit.toggle", "");
});
await page.waitForTimeout(300);

// A shape the deck already carries — found by tapping until something with a
// real box is selected, so this does not depend on the deck's exact layout.
const box = await page.locator("#screen").boundingBox();
const doc = await page.evaluate(() => ({ w: window.__pptxDoc.width, h: window.__pptxDoc.height }));
let shape = null;
for (let sy = 0.2; sy < 0.85 && !shape; sy += 0.06) {
  for (let sx = 0.3; sx < 0.95; sx += 0.06) {
    await page.touchscreen.tap(box.x + box.width * sx, box.y + box.height * sy);
    await page.waitForTimeout(80);
    const st = await page.evaluate(() => ({
      n: window.__pptxWeb.selectionCount(), b: JSON.parse(window.__pptxWeb.selectionBox()),
    }));
    if (st.n > 0 && st.b.w > 40 && st.b.h > 20) { shape = st.b; break; }
  }
}
ok("a finger can select a shape", !!shape);
if (!shape) { await finish(); }

const tapShape = () => page.touchscreen.tap(
  box.x + (shape.x + shape.w / 2) * (box.width / doc.w),
  box.y + (shape.y + shape.h / 2) * (box.height / doc.h));
const state = () => page.evaluate(() => ({
  edit: window.__pptxWeb.editingText(),
  active: document.activeElement.id || document.activeElement.tagName,
}));
const drain = () => page.evaluate(() => { const e = window.__ev.join(" "); window.__ev = []; return e; });

await page.evaluate(() => { window.__ev = []; });
await tapShape();
await page.waitForTimeout(80);
const early = await state();
ok("a tap puts a caret in the shape", early.edit === true);
ok("and the keyboard field takes focus", early.active === "softkeys");

// The compatibility mouse events arrive after `touchend`. THIS is the check.
await page.waitForTimeout(700);
const late = await state();
const trace = await drain();
ok("the app is still in text edit a moment later", late.edit === true);
ok("and the keyboard field STILL has focus", late.active === "softkeys");

// And the compatibility events are not merely defused but never synthesised:
// `preventDefault` on `touchend` stops them at the source, which is what
// Safari needs — it decides about focus at the END of the gesture rather than
// at the mousedown, so a defused mousedown was not enough on an iPhone.
ok("no compatibility mouse event is synthesised at all", !/mouse(down|up)/.test(trace));
if (/mouse(down|up)/.test(trace) || late.active !== "softkeys") console.log("  events: " + trace);

// Typing has to arrive. Not through a synthetic `input` on the field — that
// would test the page's own listener against itself — but through the
// browser's keyboard, into whatever is focused.
const before = await page.evaluate(() => window.__pptxWeb.scene().length);
await page.keyboard.type("Hei");
await page.waitForTimeout(400);
const after = await page.evaluate(() => window.__pptxWeb.scene().length);
ok("and what is typed reaches the slide", after !== before);

// Tapping the same shape again keeps the caret rather than throwing it away.
await tapShape();
await page.waitForTimeout(700);
const again = await state();
ok("tapping it again keeps the caret", again.edit === true);
ok("and keeps the keyboard", again.active === "softkeys");

await finish();

async function finish() {
  await browser.close();
  server.close();
  const passed = checks.filter((c) => c.ok).length;
  for (const c of checks) console.log(`  ${c.ok ? "PASS" : "FAIL"}  ${c.name}`);
  console.log(`\npassed = ${passed}/${checks.length}`);
  if (passed !== checks.length) { console.log("SOME FAILED"); process.exit(1); }
  console.log("ALL PASS\n\nthe editor kept its keyboard under a finger");
  process.exit(0);
}
