/**
 * responsive/smoke.mjs — does the page relayout in a real browser?
 *
 *   npm run evg:responsive:web && npm run evg:responsive:web:smoke
 *
 * `EvgResponsiveCheck` already proves the layout in Node. What only a browser
 * can answer is the part in between: that the compiled engine loads, that a
 * window resize actually re-runs it, and that what came out is an <svg> with
 * the boxes in it — not a blank stage and a caught exception.
 *
 * The column count is read off the PAINTED rectangles, at their fill colour,
 * so the assertion is about the picture and not about the display list that
 * produced it.
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../../..");
const DIST = path.resolve(process.argv[2] || path.join(HERE, "dist"));

function loadPlaywright() {
  const anchors = [
    "/opt/node22/lib/node_modules/x",
    path.join(ROOT, "package.json"),
    path.join(process.cwd(), "package.json"),
    import.meta.url,
  ];
  for (const anchor of anchors) {
    for (const name of ["playwright", "playwright-core"]) {
      try {
        return createRequire(anchor)(name);
      } catch { /* next */ }
    }
  }
  return null;
}

function findChrome() {
  const fixed = [
    process.env.CHROME_PATH,
    "/opt/pw-browsers/chromium/chrome-linux/chrome",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
    "/usr/local/bin/google-chrome",
  ].filter(Boolean);
  for (const c of fixed) if (fs.existsSync(c)) return c;
  return null;
}

const pw = loadPlaywright();
if (!pw) {
  console.log("Playwright is not available — the responsive page was not checked.");
  process.exit(0);
}
for (const f of ["index.html", "evg_responsive_demo.js", "evg-html.js"]) {
  if (!fs.existsSync(path.join(DIST, f))) {
    console.error(`no ${f} in ${path.relative(ROOT, DIST)} — run: npm run evg:responsive:web`);
    process.exit(1);
  }
}

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "") || "index.html";
  const file = path.join(DIST, rel);
  if (!file.startsWith(DIST) || !fs.existsSync(file)) {
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  res.end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;

const failures = [];
const check = (name, cond, detail) => {
  if (cond) console.log("  PASS " + name);
  else {
    console.log("  FAIL " + name + (detail ? " — " + detail : ""));
    failures.push(name);
  }
};

const launchOpts = {};
const chrome = findChrome();
if (chrome) launchOpts.executablePath = chrome;

const browser = await pw.chromium.launch(launchOpts);
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") pageErrors.push(m.text()); });

await page.goto(base, { waitUntil: "load" });
await page.waitForFunction(() => window.__evgResponsive, null, { timeout: 20000 });

/** The cards are the only white boxes with a 12px radius; count the ones that
 *  share the topmost row. Same definition the Node check uses, read out of the
 *  DOM the painter actually built. */
const cardColumns = () => page.evaluate(() => {
  const rects = [...document.querySelectorAll("#stage svg rect")]
    .filter((r) => (r.getAttribute("fill") || "").replace(/\s+/g, "") === "rgb(255,255,255)"
                && Math.abs(Number(r.getAttribute("rx") || 0) - 12) < 0.5)
    .map((r) => ({ x: +r.getAttribute("x"), y: +r.getAttribute("y"), w: +r.getAttribute("width") }));
  // The sidebar is a white 12px box too, and at wide widths it is the leftmost
  // one on its own row. Cards are the boxes whose width repeats.
  const byWidth = new Map();
  for (const r of rects) {
    const k = Math.round(r.w);
    byWidth.set(k, (byWidth.get(k) || []).concat([r]));
  }
  let best = [];
  for (const group of byWidth.values()) if (group.length > best.length) best = group;
  const top = Math.min(...best.map((r) => r.y));
  return best.filter((r) => Math.abs(r.y - top) < 1).length;
});

const state = () => page.evaluate(() => window.__evgResponsive);

async function atWidth(w) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForFunction(
    (want) => window.__evgResponsive && Math.abs(window.__evgResponsive.width - want) < 30,
    w,
    { timeout: 20000 }
  );
  return state();
}

console.log("responsive page smoke");

let s = await state();
check("the engine ran in the browser", s && !s.error, s && s.error);
check("the stylesheet parsed clean", s.cssErrors === 0, `cssErrors=${s.cssErrors}`);
check("the page was painted", (await page.locator("#stage svg rect").count()) > 20);
check("EVG was given the document width", Math.abs(s.width - 1400) < 30, `width=${s.width}`);
check("1400px: four cards across", (await cardColumns()) === 4);

s = await atWidth(1000);
check("1000px: three cards across", (await cardColumns()) === 3, `width=${s.width}`);

s = await atWidth(760);
check("760px: two cards across", (await cardColumns()) === 2, `width=${s.width}`);

s = await atWidth(420);
check("420px: one card per row", (await cardColumns()) === 1, `width=${s.width}`);
check("420px: the page grew taller than the window", s.height > 900, `height=${s.height}`);

// The flicker. `.side` and `.main` are a flex row and `.main` is `flex: 1`, so
// its width is computed out of the line it is then measured against — and the
// sum coming back one ulp over made the row wrap, at 127 of the 680 integer
// widths between 821 and 1500, scattered. On a dragged window edge that is a
// page that jumps rather than a layout that responds (ISSUES #8).
//
// Read off the painted boxes, and by VERTICAL OVERLAP rather than by a shared
// top edge: `.main` opens with a heading, so the first card starts lower than
// the sidebar even when the two are side by side. Overlapping means one row;
// a card that starts below the sidebar's bottom edge means the row wrapped.
const sidebarBesideContent = () => page.evaluate(() => {
  const boxes = [...document.querySelectorAll("#stage svg rect")]
    .filter((r) => (r.getAttribute("fill") || "").replace(/\s+/g, "") === "rgb(255,255,255)"
                && Math.abs(Number(r.getAttribute("rx") || 0) - 12) < 0.5)
    .map((r) => ({ x: +r.getAttribute("x"), y: +r.getAttribute("y"),
                   w: +r.getAttribute("width"), h: +r.getAttribute("height") }));
  if (boxes.length < 2) return false;
  // The sidebar is the leftmost card-shaped box; the deck is everything that
  // starts to the right of it.
  const side = boxes.reduce((a, b) => (b.x < a.x ? b : a));
  const deck = boxes.filter((b) => b.x > side.x + side.w - 1);
  if (!deck.length) return false;
  const top = Math.min(...deck.map((b) => b.y));
  return top < side.y + side.h - 1;
});

// A sweep rather than a list of widths: the scrollbar takes an unknown few
// pixels off, so naming the widths that used to fail would be naming the wrong
// ones. Every step in this range is above the 820px breakpoint even after the
// scrollbar, so the sidebar must be beside the content at all of them.
{
  let jumped = 0;
  let firstBad = 0;
  for (let w = 870; w <= 1110; w += 6) {
    const st = await atWidth(w);
    if (!(await sidebarBesideContent())) {
      jumped += 1;
      if (!firstBad) firstBad = st.width;
    }
  }
  check("the sidebar stays beside the content at every width from 870 to 1110",
    jumped === 0, `${jumped} widths wrapped, first at ${firstBad}`);
}

// Back up again: a layout that only narrows is half a layout.
s = await atWidth(1400);
check("back at 1400px: four cards across again", (await cardColumns()) === 4);

// The SVG is sized to the layout, which is what makes the document scroll
// rather than the picture shrink.
const svgBox = await page.evaluate(() => {
  const svg = document.querySelector("#stage svg");
  return { w: +svg.getAttribute("width"), h: +svg.getAttribute("height") };
});
check("the surface is the size EVG laid out", Math.abs(svgBox.w - s.width) < 1 && Math.abs(svgBox.h - s.height) < 1,
  `svg=${svgBox.w}x${svgBox.h} state=${s.width}x${s.height}`);

check("no page errors", pageErrors.length === 0, pageErrors.slice(0, 3).join(" | "));

await browser.close();
server.close();

console.log("");
if (failures.length) {
  console.log(`FAILED: ${failures.length} of the checks — ${failures.join(", ")}`);
  process.exit(1);
}
console.log("OK");
