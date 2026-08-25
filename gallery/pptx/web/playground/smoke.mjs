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

ok("the full playground does not run on load",
  await page.evaluate(() =>
    !window.__embedMode && /^ready/.test(document.getElementById("status").textContent || "")));

const presets = await page.$$eval("#preset option", (os) => os.map((o) => o.value));
ok("the presets are listed", presets.length >= 4);

const shots = [];
for (const name of presets) {
  const result = await page.evaluate(async (which) => {
    const sel = document.getElementById("preset");
    sel.value = which;
    sel.dispatchEvent(new Event("change"));
    // Nothing runs on its own any more — choosing an example only loads it.
    // The page is driven the way a reader drives it: press Run.
    document.getElementById("run").click();
    await new Promise((r) => setTimeout(r, 400));
    const status = document.getElementById("status");
    // Run the code again directly so the deck's own bytes can be measured.
    const fn = new Function("Pptx", "Renderer", "Chart", '"use strict";\n' + document.getElementById("code").value);
    const deck = fn(window.__jsApi, null, window.__chart);
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
  document.getElementById("run").click();
});
await page.waitForTimeout(500);
const first = await page.locator("#screen").screenshot();
await page.click("#next");
await page.waitForTimeout(300);
const second = await page.locator("#screen").screenshot();
ok("paging to the next slide draws something else", first.length !== second.length);

// --- the editor on the right is an EDITOR ---------------------------------
//
// The page drew the editor and its toolbar from the first day and listened to
// nothing, so the pane was a picture of one: clicking a shape did nothing at
// all. What is checked here is that a real gesture reaches the app — not that
// pixels changed, which a redraw would also do.
await page.evaluate(() => {
  const sel = document.getElementById("preset");
  sel.value = "A title slide";
  sel.dispatchEvent(new Event("change"));
  document.getElementById("run").click();
});
await page.waitForTimeout(600);

/** A click in the middle of the slide, in the canvas's own pixels. */
async function clickSlide(dx = 0.5, dy = 0.5) {
  const box = await page.locator("#screen").boundingBox();
  await page.mouse.click(box.x + box.width * dx, box.y + box.height * dy);
  await page.waitForTimeout(200);
}

const before = await page.evaluate(() => window.__pptxWeb && window.__pptxWeb.selectionCount());
await clickSlide(0.25, 0.35);
const after = await page.evaluate(() => window.__pptxWeb && window.__pptxWeb.selectionCount());
ok("the app is reachable from the page", before !== undefined && before !== null);
ok("clicking the slide selects a shape", (after | 0) > 0);

// Typing has to reach the DECK, and the only way to know is to ask the deck.
await clickSlide(0.25, 0.35);
const editing = await page.evaluate(() => window.__pptxWeb.editing());
ok("clicking the shape again puts a caret in it", editing === true);
// The scene carries the drawn text runs, so it is the deck's own answer to
// "what does this slide say" rather than a reading of the pixels.
const typed = await page.evaluate(async () => {
  const web = window.__pptxWeb;
  const was = web.scene();
  document.getElementById("screen").focus();
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Z", bubbles: true }));
  await new Promise((r) => setTimeout(r, 250));
  return { changed: web.scene() !== was };
});
ok("what is typed reaches the slide", typed.changed);

// …and NOT while the code editor has focus, or writing code would be
// impossible: every `const` would select all, delete it and type the letters
// into a shape.
const guarded = await page.evaluate(async () => {
  const web = window.__pptxWeb;
  document.getElementById("code").focus();
  const before = web.scene();
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Q", bubbles: true }));
  await new Promise((r) => setTimeout(r, 200));
  return { same: web.scene() === before };
});
ok("typing in the code pane does not reach the deck", guarded.same);

// --- opening a .pptx the reader already has --------------------------------
//
// The half of the API this page could not previously show. Everything above
// builds a deck from nothing; a reader has no way to tell from that whether
// `Pptx.open` works at all, or whether "editing" is really re-creation of the
// parts this model happens to understand. So: hand the page a real file, run
// an example that changes it, and ask the DECK what happened — not the pixels.
//
// The file is a deck this very page wrote a moment ago, which makes the test
// independent of any fixture and proves the round trip in both directions.
const madeBytes = await page.evaluate(() => {
  const deck = window.__jsApi.create();
  const s1 = deck.addSlide().background("FFFFFF");
  s1.addTextBox(60, 60, 600, 80, "Original title").setName("Title");
  s1.addTextBox(60, 200, 600, 40, "A line that was already here");
  const s2 = deck.addSlide().background("FFFFFF");
  s2.addTextBox(60, 60, 600, 80, "Second slide");
  return Array.from(deck.save());
});
ok("the page can write a deck to open later", madeBytes.length > 2000);

const opened = await page.evaluate(async (bytes) => {
  await window.__openSource(new Uint8Array(bytes), "reader.pptx");
  await new Promise((r) => setTimeout(r, 600));
  const options = [...document.querySelectorAll("#preset option")].map((o) => o.value);
  return {
    source: window.__source(),
    options,
    log: window.__log(),
    where: document.getElementById("where").textContent,
    code: document.getElementById("code").value,
  };
}, madeBytes);
ok("opening a file is remembered", opened.source && opened.source.name === "reader.pptx");
ok("and the examples become the ones that edit it",
  opened.options.includes("What is in this deck?") && !opened.options.includes("A title slide"));
ok("the loaded example opens the file rather than creating one",
  /Pptx\.open\(Source\)/.test(opened.code));
ok("the editor shows the file as it arrived", /\d+ \/ 2/.test(opened.where));
ok("and the page says what it found", /2 slide\(s\)/.test(opened.log));

// Reading it: the count the example prints has to be the deck's real count.
const counted = await page.evaluate(async () => {
  const sel = document.getElementById("preset");
  sel.value = "What is in this deck?";
  sel.dispatchEvent(new Event("change"));
  document.getElementById("run").click();
  await new Promise((r) => setTimeout(r, 700));
  return { log: window.__log(), status: document.getElementById("status").textContent,
           bad: document.getElementById("status").className === "bad" };
});
ok("an example can read the opened deck", !counted.bad);
ok("and prints what it read into the page", /2 slide\(s\)/.test(counted.log));
ok("the status names the file it came from", /reader\.pptx/.test(counted.status));

// Changing it: ask the EDITOR what the first slide says now. The editor opened
// the bytes the example saved, so an answer here means the edit survived being
// written into a .pptx and read back out of one.
const retitled = await page.evaluate(async () => {
  const sel = document.getElementById("preset");
  sel.value = "Retitle the first slide";
  sel.dispatchEvent(new Event("change"));
  document.getElementById("run").click();
  await new Promise((r) => setTimeout(r, 900));
  const web = window.__pptxWeb;
  web.gotoSlide(0);
  const d = window.__jsApi.open(new Uint8Array(await (async () => web.saveBytes())()));
  return { log: window.__log(), text: d.slide(0).text, slides: d.slideCount };
});
ok("an example can change the opened deck", /Original title/.test(retitled.log));
ok("and the change is in the saved .pptx", /Edited in the browser/.test(retitled.text));
ok("what was already there is still there",
  /A line that was already here/.test(retitled.text));
ok("and the deck did not lose a slide", retitled.slides === 2);

// Adding to it, which is the other direction.
const stamped = await page.evaluate(async () => {
  const sel = document.getElementById("preset");
  sel.value = "Stamp every slide";
  sel.dispatchEvent(new Event("change"));
  document.getElementById("run").click();
  await new Promise((r) => setTimeout(r, 900));
  const d = window.__jsApi.open(window.__pptxWeb.saveBytes());
  let stamps = 0;
  for (let i = 0; i < d.slideCount; i++) {
    const slide = d.slide(i);
    for (let k = 0; k < slide.shapeCount; k++) if (slide.shape(k).name === "stamp") stamps++;
  }
  return { stamps, slides: d.slideCount, log: window.__log() };
});
ok("every slide of the opened deck was stamped",
  stamped.stamps === 2 && stamped.slides === 2);

// Each Run starts from the ORIGINAL file, not from the last run's output —
// otherwise stamping twice would put two stamps on every slide and the reader
// would be editing something they were never shown.
const again = await page.evaluate(async () => {
  document.getElementById("run").click();
  await new Promise((r) => setTimeout(r, 900));
  const d = window.__jsApi.open(window.__pptxWeb.saveBytes());
  let stamps = 0;
  for (let i = 0; i < d.slideCount; i++) {
    const slide = d.slide(i);
    for (let k = 0; k < slide.shapeCount; k++) if (slide.shape(k).name === "stamp") stamps++;
  }
  return stamps;
});
ok("running twice does not stamp twice", again === 2);

// The claim that matters, and the one a deck this page wrote cannot test:
// editing somebody's real file must not QUIETLY DROP the parts this model has
// never heard of. `32-unmodelled-content.pptx` carries SmartArt (ppt/diagrams)
// and digital ink (ppt/ink) — neither is in the object model — so if the
// writer rebuilt the package from what it understands, they would vanish.
//
// `PptxApi.save` writes back over the original package for exactly this
// reason. That is checked here by listing the ZIP's parts before and after.
const unmodelled = fs.readFileSync(
  path.join(HERE, "../../fixtures/32-unmodelled-content.pptx"));

/** The names in a ZIP's central directory. Enough of a reader for this. */
function zipParts(bytes) {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const dv = new DataView(u.buffer, u.byteOffset, u.byteLength);
  let end = -1;
  for (let i = u.length - 22; i >= 0 && i > u.length - 65558; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { end = i; break; }
  }
  if (end < 0) return [];
  const count = dv.getUint16(end + 10, true);
  let at = dv.getUint32(end + 16, true);
  const names = [];
  const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(at, true) !== 0x02014b50) break;
    const nameLen = dv.getUint16(at + 28, true);
    const extraLen = dv.getUint16(at + 30, true);
    const commentLen = dv.getUint16(at + 32, true);
    names.push(dec.decode(u.subarray(at + 46, at + 46 + nameLen)));
    at += 46 + nameLen + extraLen + commentLen;
  }
  return names;
}

const partsIn = zipParts(unmodelled);
ok("the fixture carries parts the model does not understand",
  partsIn.some((n) => n.startsWith("ppt/diagrams/")) && partsIn.some((n) => n.startsWith("ppt/ink/")));

const survived = await page.evaluate(async (bytes) => {
  await window.__openSource(new Uint8Array(bytes), "unmodelled.pptx");
  await new Promise((r) => setTimeout(r, 700));
  const sel = document.getElementById("preset");
  sel.value = "Stamp every slide";
  sel.dispatchEvent(new Event("change"));
  document.getElementById("run").click();
  await new Promise((r) => setTimeout(r, 900));
  // The bytes the EXAMPLE saved, not the editor's re-save of them: this is a
  // question about `PptxApi.save`, and the editor has a writer of its own.
  return window.__deckBytes();
}, Array.from(unmodelled));

const partsOut = zipParts(Uint8Array.from(survived));
const lost = partsIn.filter((n) => !partsOut.includes(n));
ok("editing a real deck keeps the SmartArt and the ink", lost.length === 0);
if (lost.length) console.log("  lost: " + lost.join(", "));
ok("and the edit is in it",
  await page.evaluate(() => {
    const d = window.__jsApi.open(window.__pptxWeb.saveBytes());
    return /Reviewed/.test(d.slide(0).text);
  }));

// And once more through the EDITOR's writer, which is a different one: the
// pane on the right opened those bytes, so what it saves is the deck after a
// second full round trip. Note the conversion — `saveBytes` answers an
// ArrayBuffer, and `Array.from` of one is an EMPTY array, which reads as
// "every part was dropped" when nothing was.
const viaEditor = zipParts(Uint8Array.from(await page.evaluate(() =>
  Array.from(new Uint8Array(window.__pptxWeb.saveBytes())))));
const lostByEditor = partsIn.filter((n) => !viaEditor.includes(n));
ok("and the editor keeps them too", lostByEditor.length === 0);
if (lostByEditor.length) console.log("  editor lost: " + lostByEditor.join(", "));

// --- docs embed: autorun a preset and page the slide stack ----------------
//
// The documentation iframes this page with `?embed=1&preset=…` so a guide can
// show a live deck next to the prose. The full playground must still wait for
// Run (checked above). What is checked here is the other contract: the embed
// hides the chrome, runs the named example, and the arrows still turn pages.
const embedPage = await browser.newPage({ viewport: { width: 1100, height: 700 } });
embedPage.on("pageerror", (e) => errors.push("embed: " + String(e)));
embedPage.on("console", (m) => { if (m.type() === "error") errors.push("embed: " + m.text()); });
const embedUrl = `http://127.0.0.1:${PORT}/index.html?embed=1&preset=${encodeURIComponent("Several slides")}`;
await embedPage.goto(embedUrl);
await embedPage.waitForFunction(() => window.__playgroundReady === true, null, { timeout: 60000 });
const embedState = await embedPage.evaluate(() => ({
  mode: !!window.__embedMode,
  htmlEmbed: document.documentElement.classList.contains("embed"),
  header: getComputedStyle(document.querySelector("header")).display,
  file: getComputedStyle(document.querySelector(".source")).display,
  download: getComputedStyle(document.getElementById("download")).display,
  scene: document.getElementById("where").textContent,
  status: document.getElementById("status").className,
}));
ok("embed mode is on", embedState.mode && embedState.htmlEmbed);
ok("embed hides the playground chrome",
  embedState.header === "none" && embedState.file === "none" && embedState.download === "none");
ok("embed autoruns the requested preset",
  embedState.status === "good" && /3\s*\/\s*3/.test(embedState.scene));
const embedFirst = await embedPage.locator("#screen").screenshot();
await embedPage.click("#next");
await embedPage.waitForTimeout(300);
const embedSecond = await embedPage.locator("#screen").screenshot();
const embedWhere = await embedPage.evaluate(() => document.getElementById("where").textContent);
ok("embed paging reaches slide 2 of 3", /^2\s*\/\s*3/.test(embedWhere));
ok("embed paging draws a different slide", embedFirst.length !== embedSecond.length);
await embedPage.close();

// A docs page can also post a snippet that is not one of the named presets.
// Served from the same origin as the playground so the test can read the
// iframe's document; a docs page uses postMessage for the same reason.
const postedCode = `const deck = Pptx.create();
const slide = deck.addSlide().background("FFFFFF");
slide.addTextBox(70, 150, 820, 110, "Posted from parent")
     .setName("Title")
     .run(0, 0).font("Calibri", 44).bold().color("#1F3864");
return deck;`;
fs.writeFileSync(path.join(DIST, "embed-host.html"), `<!doctype html>
<html><body style="margin:0">
<iframe id="f" src="./index.html?embed=1&run=0"
        style="width:100%;height:640px;border:0"></iframe>
<script>
  const f = document.getElementById("f");
  const code = ${JSON.stringify(postedCode)};
  const send = () => {
    try {
      if (f.contentWindow && f.contentWindow.__playgroundReady) {
        f.contentWindow.postMessage({ type: "pptx-embed", code: code }, "*");
        return true;
      }
    } catch (e) {}
    return false;
  };
  const t = setInterval(() => { if (send()) clearInterval(t); }, 50);
  f.addEventListener("load", () => { if (send()) clearInterval(t); });
</script>
</body></html>`);
const host = await browser.newPage({ viewport: { width: 1100, height: 700 } });
host.on("pageerror", (e) => errors.push("host: " + String(e)));
await host.goto(`http://127.0.0.1:${PORT}/embed-host.html`);
await host.waitForFunction(() => {
  const f = document.getElementById("f");
  const doc = f && f.contentDocument;
  const status = doc && doc.getElementById("status");
  return status && status.className === "good";
}, null, { timeout: 60000 });
const posted = await host.evaluate(() => {
  const doc = document.getElementById("f").contentDocument;
  return {
    scene: doc.getElementById("where").textContent,
    status: doc.getElementById("status").className,
  };
});
ok("a parent can post a snippet into the embed", posted.status === "good");
ok("and the posted snippet produced a one-slide deck", /^1\s*\/\s*1/.test(posted.scene));
await host.close();

// Back to the deck this page made, so the checks after this one start clean.
await page.evaluate(async (bytes) => {
  await window.__openSource(new Uint8Array(bytes), "reader.pptx");
  await new Promise((r) => setTimeout(r, 600));
}, madeBytes);

// And Clear puts the page back.
const cleared = await page.evaluate(async () => {
  document.getElementById("clear").click();
  await new Promise((r) => setTimeout(r, 700));
  const options = [...document.querySelectorAll("#preset option")].map((o) => o.value);
  return { source: window.__source(), options, log: window.__log(),
           where: document.getElementById("where").textContent };
});
ok("Clear forgets the file", cleared.source === null);
ok("and the blank-deck examples come back",
  cleared.options.includes("A title slide") && !cleared.options.includes("What is in this deck?"));
ok("and nothing of the file is left on screen", /\d+ \/ 1/.test(cleared.where));

// --- what the buttons export is what is ON SCREEN --------------------------
//
// The editor on the right is live: a reader can drag a shape, type into one,
// insert one. Those edits live in the EDITOR, and the page used to export the
// bytes the last Run produced — so anything done by hand was silently dropped
// on Download, PNG and PDF. What is checked here is the whole click path: the
// download is intercepted at `URL.createObjectURL` and the blob is opened with
// the API, so the assertion is about the file a reader would actually get.
const exported = await page.evaluate(async () => {
  // Start from a known deck, then edit it by hand the way a reader would.
  const sel = document.getElementById("preset");
  sel.value = "A title slide";
  sel.dispatchEvent(new Event("change"));
  document.getElementById("run").click();
  await new Promise((r) => setTimeout(r, 800));
  const web = window.__pptxWeb;
  const wasCount = window.__jsApi.open(web.saveBytes()).slide(0).shapeCount;

  web.run("edit.toggle", "");
  web.run("shape.rect", "");            // a shape only the EDITOR knows about
  await new Promise((r) => setTimeout(r, 300));

  // Observe the download without breaking it. Returning a made-up URL here
  // makes the browser log "Not allowed to load local resource", which then
  // shows up as the page throwing — so the real URL is still handed back and
  // only the blob is kept.
  const realUrl = URL.createObjectURL.bind(URL);
  let caught = null;
  URL.createObjectURL = (blob) => { caught = blob; return realUrl(blob); };
  document.getElementById("download").click();
  URL.createObjectURL = realUrl;
  if (!caught) return { error: "nothing was offered for download" };

  const bytes = new Uint8Array(await caught.arrayBuffer());
  const d = window.__jsApi.open(bytes);
  return { wasCount, nowCount: d.slide(0).shapeCount, length: bytes.length,
           zip: bytes[0] === 0x50 && bytes[1] === 0x4b };
});
ok("Download offers a .pptx", exported.zip && exported.length > 2000);
ok("and it carries the edit made by hand in the editor",
  exported.nowCount === exported.wasCount + 1);
if (exported.error) console.log("  " + exported.error);

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
