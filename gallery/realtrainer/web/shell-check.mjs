#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// THE FIRST PAINT, and what is in it.
//
//   npm run rt:shell        (after: npm run rt:page)
//
// Not what the app draws — `frame-check.mjs` has that — but what the DOCUMENT
// says before the app exists at all, which is a different question and was for
// a long time the wrong answer. The page shipped a header and an aside full of
// prose, styled visible, and `main.js` hid them by adding a class once the
// whole bundle had arrived and run. So the first thing a visitor saw was a
// paragraph of English about a ring, for as long as the download took, and
// then it vanished. No amount of code splitting fixes that: the document
// simply said the wrong thing first.
//
// The mode is settled now in a few synchronous lines in the head, before the
// body exists. This check proves it, and the only way to prove it is to look
// at the page WHILE THE BUNDLE IS STILL COMING — so the bundle is held at the
// server and the assertions are made in the gap.
//
// It also holds the baked picture against the app.
// `index.html` carries a picture of the chrome computed in the build
// (`snapshot.mjs`); a picture that no longer matches the app is worse than no
// picture, because it replaces one flash with a subtler one. So the boxes are
// measured on the page while the bundle is still held, the live frame is read
// once the app has painted, and the two are held against each other rectangle
// for rectangle — PLAN_WEB_LOADING.md S3.1.
//
// Two shapes, and neither may flash into the other:
//
//   no query        the app fills the window; no chrome, ever
//   ?page=WxH       the documented demo; the chrome is there from the start

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { requireDom, findChromium } from "../../ui/conformance/dom-adapter.mjs";
import { anchoredBox, keyOf } from "./shell-rule.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
if (!fs.existsSync(path.join(HERE, "bundle.js"))) {
  console.error("bundle.js missing — run `npm run rt:page` first");
  process.exit(3);
}

// Nothing here is timed. The bundle's request is held OPEN while the document
// is examined and released afterwards, so a slow machine makes this check
// slower and never makes it flaky.
const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".cjs": "text/javascript", ".css": "text/css", ".json": "application/json",
};
// A gate the check re-arms before each page load: the bundle request waits on
// whatever promise is current, and `openGate()` lets it through.
let gate = null;
const armGate = () => { let open; gate = { wait: new Promise((r) => { open = r; }), open }; };
const openGate = () => gate.open();
armGate();
const server = createServer(async (req, res) => {
  const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = path.join(ROOT, rel.slice(1));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end("not found");
    return;
  }
  // The one file the page cannot paint without — held until the check says so.
  if (/bundle(-worker)?\.js$/.test(rel)) await gate.wait;
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" }).end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const url = (q) => `http://127.0.0.1:${port}/gallery/realtrainer/web/index.html${q}`;

const { chromium } = requireDom("playwright-core");
const browser = await chromium.launch({ executablePath: findChromium() });
// One viewport in each of the stylesheet's buckets, because the build bakes a
// picture for each and a check that only ever opened one would prove half of
// it. 767/768 is where `realtrainer.css` folds the rail into a bottom bar.
const FIT_VIEWS = [
  { width: 1200, height: 900 },
  { width: 390, height: 844 },
];
const PINNED_VIEW = { width: 1200, height: 900 };

let passed = 0, failed = 0;
const ok = (what, cond, detail = "") => {
  if (cond) passed += 1; else failed += 1;
  console.log(`  ${cond ? "PASS" : "FAIL"} ${what}${cond || !detail ? "" : "  (" + detail + ")"}`);
};

/** What the document shows, asked of the live page. */
const shellOf = () => ({
  // Everything written on the page EXCEPT the accessibility mirror, which is
  // transparent DOM over the canvas publishing what the frame means — text
  // that is supposed to be there and that a screen reader is supposed to find.
  // What must not be there is page furniture: a header, an aside, prose.
  text: [...document.body.querySelectorAll("*")]
    .filter((el) => el.getClientRects().length > 0)   // VISIBLE, not merely present
    .filter((el) => !el.closest(".evg-a11y") && el.children.length === 0)
    .map((el) => (el.textContent || "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim(),
  header: !!document.querySelector("header")?.getClientRects().length,
  aside: !!document.querySelector("aside")?.getClientRects().length,
  stage: (() => {
    const r = document.getElementById("stage").getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  })(),
  scrollbar: document.documentElement.scrollHeight > window.innerHeight + 1,
});

// --- the app filling the window: the URL a visitor opens --------------------
for (const VIEW of FIT_VIEWS) {
  console.log(`\n=== the app filling a ${VIEW.width}x${VIEW.height} window ===`);
  armGate();
    const page = await browser.newPage({ viewport: VIEW });
    const errors = [];
    const fetched = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("request", (r) => fetched.push(new URL(r.url()).pathname));
    // `domcontentloaded`, not `load`: the bundle is being held, so `load` would
    // wait for the very thing this check exists to look behind.
    await page.goto(url(""), { waitUntil: "domcontentloaded" });

    console.log("--- before the bundle arrives ---");
    const before = await page.evaluate(shellOf);
    ok("nothing is written on the page", before.text === "", JSON.stringify(before.text.slice(0, 60)));
    ok("no header", !before.header);
    ok("no aside", !before.aside);
    ok(
      "the stage is already the window",
      before.stage.w === VIEW.width && before.stage.h === VIEW.height,
      `${before.stage.w}x${before.stage.h} vs ${VIEW.width}x${VIEW.height}`,
    );
    ok("the document does not scroll", !before.scrollbar);

    // The baked picture, as the browser actually laid it out.
    const baked = await page.evaluate(() => {
      const toHex = (css) => {
        const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(css || "");
        return m ? "#" + [1, 2, 3].map((i) => Number(m[i]).toString(16).padStart(2, "0")).join("") : "";
      };
      const layer = document.getElementById("rt-t0");
      if (!layer) return null;
      return [...layer.querySelectorAll("i")]
        .filter((el) => el.getClientRects().length)
        .map((el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          const bordered = parseFloat(cs.borderTopWidth) > 0;
          return {
            x: Math.round(r.x), y: Math.round(r.y),
            w: Math.round(r.width), h: Math.round(r.height),
            colour: toHex(bordered ? cs.borderTopColor : cs.backgroundColor),
            bordered,
          };
        });
    });
    ok("a picture of the chrome is already on the page", !!baked && baked.length > 0, `${baked ? baked.length : 0} boxes`);
    if (baked && baked.length) {
      const bg = baked[0];
      ok(
        "and it covers the window",
        bg.x === 0 && bg.y === 0 && bg.w === VIEW.width && bg.h === VIEW.height,
        `${bg.w}x${bg.h} at ${bg.x},${bg.y}`,
      );
    }

    openGate();
    // `__lastList` is a getter and answers before anything is drawn; `__lastStats`
    // is written BY a draw, which is the thing being waited for.
    await page.waitForFunction("window.__lastStats !== undefined", null, { timeout: 30000 });

    console.log("--- after it runs ---");
    const after = await page.evaluate(shellOf);
    ok("still no page furniture written on it", after.text === "", JSON.stringify(after.text.slice(0, 60)));
    ok("still no header", !after.header);
    ok("still no aside", !after.aside);
    ok(
      "the stage did not move",
      after.stage.w === before.stage.w && after.stage.h === before.stage.h,
      `${before.stage.w}x${before.stage.h} -> ${after.stage.w}x${after.stage.h}`,
    );
    const canvas = await page.evaluate(() => {
      const r = document.querySelector("#stage canvas").getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    ok(
      "the canvas fills the stage",
      canvas.w === after.stage.w && canvas.h === after.stage.h,
      `${canvas.w}x${canvas.h}`,
    );
    const live = await page.evaluate(() => ({
      list: window.__lastList,
      w: window.innerWidth,
      h: window.innerHeight,
    }));
    const cmds = JSON.parse(live.list).cmds;
    ok("and the app drew something on it", cmds.length > 0, `${cmds.length} commands`);

    // THE DATA ARRIVED, and by the route it is supposed to arrive by. The seed
  // is a file now, fetched in parallel with the bundle; a page that silently
  // failed to get it would still draw a real screen — with an empty diary —
  // and every check above would pass. So: the request was made, and the frame
  // carries something only the seed puts there.
  ok("the seed was fetched as a file", fetched.some((u) => u.endsWith("/seed.json")), fetched.join(" "));
  const texts = cmds.filter((c) => c.k === 3).map((c) => c.text || "");
  ok(
    "and the frame shows what only the seed knows",
    texts.includes("Harjoitussuunnitelma"),
    texts.slice(0, 6).join(" | "),
  );

  // --- the drift gate ------------------------------------------------------
    // The same rule the build used, applied to the frame the app actually
    // painted at this window size. Every box that was baked must be where the
    // live frame put it, and there must be no live chrome the picture missed.
    console.log("--- the baked picture against the live frame ---");
    const liveBoxes = cmds
      .map((c) => ({ box: anchoredBox(c, live.w, live.h), c }))
      .filter((e) => e.box);
    ok(
      "the picture has as many boxes as the frame has chrome",
      baked.length === liveBoxes.length,
      `baked ${baked.length}, live ${liveBoxes.length}`,
    );
    const n = Math.min(baked.length, liveBoxes.length);
    let drift = 0;
    for (let i = 0; i < n; i += 1) {
      const b = baked[i], { box, c } = liveBoxes[i];
      const same =
        b.x === Math.round(c.x) && b.y === Math.round(c.y) &&
        b.w === Math.round(c.w) && b.h === Math.round(c.h) &&
        b.colour === box.colour && b.bordered === (box.kind === 1);
      if (!same) {
        drift += 1;
        console.log(
          `       #${i} baked ${b.w}x${b.h} at ${b.x},${b.y} ${b.colour}${b.bordered ? " border" : ""}` +
          `  live ${Math.round(c.w)}x${Math.round(c.h)} at ${Math.round(c.x)},${Math.round(c.y)} ${box.colour}${box.kind === 1 ? " border" : ""}`,
        );
      }
    }
    ok("every baked box is where the live frame put it", drift === 0, `${drift} of ${n} differ`);
    ok(
      "the picture is taken off once the app has painted",
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(
        () => requestAnimationFrame(() => r(!document.getElementById("rt-t0"))))))),
    );
    void keyOf;
    ok("no page errors", errors.length === 0, errors[0] || "");
    await page.close();
}

// --- the documented demo: `?page=WxH` --------------------------------------
// The other direction of the same bug: a page that decided its mode late would
// flash the app's shape before laying out the prose. Held the same way.
{
  armGate();
  const page = await browser.newPage({ viewport: PINNED_VIEW });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(url("?page=980x760"), { waitUntil: "domcontentloaded" });

  console.log("--- the pinned page, before the bundle arrives ---");
  const before = await page.evaluate(shellOf);
  ok("the header is there from the start", before.header);
  ok("so is the aside", before.aside);
  ok("and the prose with it", before.text.includes("RealTrainer"), before.text.slice(0, 40));

  openGate();
  // `__lastList` is a getter and answers before anything is drawn; `__lastStats`
  // is written BY a draw, which is the thing being waited for.
  await page.waitForFunction("window.__lastStats !== undefined", null, { timeout: 30000 });
  const after = await page.evaluate(shellOf);
  console.log("--- and after ---");
  ok("the header stayed", after.header);
  ok("the aside stayed", after.aside);
  const canvas = await page.evaluate(() => {
    const r = document.querySelector("#stage canvas").getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  ok("the stage took the size it was given", canvas.w === 980 && canvas.h === 760, `${canvas.w}x${canvas.h}`);
  ok("no page errors", errors.length === 0, errors[0] || "");
  await page.close();
}

await browser.close();
server.close();
console.log(`\npassed = ${passed}  failed = ${failed}`);
console.log(failed === 0 ? "ALL PASS" : `${failed} check(s) failed`);
process.exit(failed === 0 ? 0 : 1);
