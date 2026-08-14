/**
 * Font parity check — PLAN_CSS_LAYOUT_AND_FONTS.md §4.1 rule 7.
 *
 * EVG computes a width for every text node during layout. The HTML preview
 * declares that width on the element and loads the *same* TTF through
 * @font-face. If EVG's measurement is honest, the browser laying out the same
 * string in the same face at the same size must arrive at the same width.
 *
 * This renders the page in Chromium, re-measures each label's text against the
 * loaded webfont, and reports the delta. It is the only check that can catch
 * EVG agreeing with itself while both sides are wrong.
 *
 *   node gallery/pdf_writer/test/font_parity.js <page.html> [maxDeltaPx]
 *
 * Exits non-zero if any label exceeds the tolerance.
 */
const { chromium } = require("playwright-core");
const path = require("path");
const fs = require("fs");

const EXECUTABLE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const file = process.argv[2];
const tolerance = parseFloat(process.argv[3] || "1.0");

if (!file || !fs.existsSync(file)) {
  console.error("usage: font_parity.js <page.html> [maxDeltaPx]");
  process.exit(2);
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXECUTABLE });
  const page = await browser.newPage();
  await page.goto("file://" + path.resolve(file));
  // Webfonts must be in before anything is measured, or the browser measures
  // a fallback face and every comparison is meaningless.
  await page.evaluate(() => document.fonts.ready);

  const rows = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.whiteSpace = "pre";
    probe.style.left = "-9999px";
    document.body.appendChild(probe);

    const out = [];
    for (const el of document.querySelectorAll(".evg-label")) {
      const text = el.textContent;
      if (!text || !text.trim()) continue;
      const declared = parseFloat(el.style.width);
      if (!isFinite(declared)) continue;

      const cs = getComputedStyle(el);
      probe.style.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} / ${cs.lineHeight} ${cs.fontFamily}`;
      probe.style.letterSpacing = cs.letterSpacing;
      probe.textContent = text;
      const measured = probe.getBoundingClientRect().width;

      out.push({
        text: text.length > 42 ? text.slice(0, 42) + "…" : text,
        family: cs.fontFamily.replace(/["']/g, "").split(",")[0],
        size: cs.fontSize,
        declared,
        measured,
        delta: declared - measured,
      });
    }
    return out;
  });

  await browser.close();

  if (!rows.length) {
    console.log("no measurable labels found in " + file);
    process.exit(0);
  }

  let worst = 0;
  console.log(
    `${"delta".padStart(9)}  ${"evg".padStart(9)}  ${"dom".padStart(9)}  font           text`
  );
  for (const r of rows) {
    worst = Math.max(worst, Math.abs(r.delta));
    console.log(
      `${r.delta.toFixed(2).padStart(9)}  ${r.declared.toFixed(2).padStart(9)}  ${r.measured
        .toFixed(2)
        .padStart(9)}  ${(r.family + " " + r.size).padEnd(14)} ${r.text}`
    );
  }
  console.log(`\n${rows.length} labels, worst |delta| = ${worst.toFixed(3)}px, tolerance ${tolerance}px`);

  if (worst > tolerance) {
    console.error("FAIL: EVG text measurement disagrees with the browser using the same font file.");
    process.exit(1);
  }
  console.log("PASS: EVG and the browser measure the same boxes.");
})();
