/**
 * Records what a real browser measures, so the parity gate can run without one.
 *
 * PLAN_CSS_LAYOUT_AND_FONTS.md §4.1 rule 7 wants EVG's text boxes checked
 * against a browser laying out the same string in the same font file. Doing
 * that live means every run needs Chromium, which makes the gate skippable —
 * and a skippable correctness gate stops being a gate.
 *
 * So the browser is used to ESTABLISH the numbers, once, into a committed
 * snapshot. `browser_parity_test.rgr` then checks EVG against that snapshot
 * offline, on any machine, with no browser and no network.
 *
 *   node gallery/pdf_writer/test/browser_parity_snapshot.js        # verify only
 *   node gallery/pdf_writer/test/browser_parity_snapshot.js --write # re-record
 *
 * Re-record only when the font files themselves change. A diff in this snapshot
 * with unchanged fonts means the browser disagreed with itself, which is worth
 * reading carefully before committing.
 */
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const EXECUTABLE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const ROOT = path.resolve(__dirname, "../../..");
const FONT_DIR = path.join(ROOT, "gallery/pdf_writer/assets/fonts");
const SNAPSHOT = path.join(__dirname, "fixtures/browser_parity.snapshot");

/**
 * EVG face name -> the exact TTF that EVGFontSetup loads for it.
 *
 * Each becomes its own @font-face family under the EVG name, so the browser
 * resolves the same file EVG measures. No weight synthesis, no fallback: if a
 * name is wrong the text renders in a default face and the delta is obvious.
 */
const FACES = {
  "Noto Sans": "Noto_Sans/NotoSans-Regular.ttf",
  "Noto Sans-Bold": "Noto_Sans/NotoSans-Bold.ttf",
  "Open Sans": "Open_Sans/OpenSans-Regular.ttf",
  "Open Sans-Bold": "Open_Sans/OpenSans-Bold.ttf",
  Cinzel: "Cinzel/Cinzel-Regular.ttf",
  "Cinzel-Bold": "Cinzel/Cinzel-Bold.ttf",
  "Josefin Sans": "Josefin_Sans/JosefinSans-Regular.ttf",
  "Great Vibes": "Great_Vibes/GreatVibes-Regular.ttf",
};

/** [face, sizePx, text] — the strings whose advance widths are pinned. */
const FIXTURES = [
  // The pangram-ish string that exercises most of the lowercase advances.
  ["Noto Sans", 16, "Hamburgefonstiv"],
  ["Open Sans", 16, "Hamburgefonstiv"],
  ["Cinzel", 16, "Hamburgefonstiv"],
  ["Josefin Sans", 16, "Hamburgefonstiv"],
  // Bold must be a real face, not a widened regular.
  ["Noto Sans-Bold", 16, "Hamburgefonstiv"],
  ["Open Sans-Bold", 16, "Hamburgefonstiv"],
  ["Cinzel-Bold", 16, "Hamburgefonstiv"],
  // Linearity: the same string at several sizes.
  ["Open Sans", 8, "Hamburgefonstiv"],
  ["Open Sans", 32, "Hamburgefonstiv"],
  ["Open Sans", 48, "Hamburgefonstiv"],
  // Real caption and title strings from the bundled examples.
  ["Noto Sans", 30, "Helsinki, 2024"],
  ["Noto Sans", 13, "Kaivopuisto, late May."],
  ["Noto Sans", 13, "Twelve days along the shoreline, from the first thaw to midsummer light."],
  ["Cinzel", 30, "Helsinki, 2024"],
  // Non-ASCII: these are the ones that were mojibake until the UTF-8 fix, and
  // they are exactly where a byte-vs-codepoint regression would show up first.
  ["Noto Sans", 24, "Äiti ja Isä"],
  ["Noto Sans", 24, "Löytöretki"],
  ["Noto Sans", 24, "Ylläs"],
  ["Noto Sans", 24, "Åland"],
  ["Noto Sans", 32, "Kivoja hetkiä"],
  ["Noto Sans", 18, "Hyvää yötä — Kaivopuisto"],
  // Punctuation, digits and spacing.
  ["Open Sans", 14, "1234567890"],
  ["Open Sans", 14, "(){}[]<>.,;:!?-–—"],
  ["Open Sans", 14, "a b c   d"],
  ["Great Vibes", 28, "Kesämuistot"],
];

const HEADER = [
  "# EVG browser parity snapshot v1",
  "#",
  "# Widths measured by Chromium laying out each string in the SAME TTF that",
  "# EVG measures, recorded so the parity gate can run without a browser.",
  "# Regenerate with: node gallery/pdf_writer/test/browser_parity_snapshot.js --write",
  "#",
  "# EVG sums raw hmtx advances and applies no kerning, so `unkerned` is the",
  "# parity target. `kerned` is what a browser shows by default; the gap between",
  "# the two IS the kerning EVG does not do, recorded so it stays visible.",
  "#",
  "# face<TAB>sizePx<TAB>unkernedWidth<TAB>kernedWidth<TAB>text",
];

function facesCss() {
  return Object.entries(FACES)
    .map(([name, rel]) => {
      const file = path.join(FONT_DIR, rel);
      if (!fs.existsSync(file)) throw new Error("missing font file: " + file);
      // Relative to the page, which is written into this directory below. A
      // file:// URL from an about:blank origin is blocked, and the browser then
      // silently substitutes a default face — which is how the first version of
      // this snapshot recorded one identical width for every family.
      const rel2 = path.relative(__dirname, file);
      return `@font-face{font-family:'${name}';src:url('${rel2}');}`;
    })
    .join("\n");
}

async function measure() {
  const browser = await chromium.launch({ executablePath: EXECUTABLE });
  const page = await browser.newPage();

  // The page has to live next to the fonts so their relative URLs resolve and
  // the origin is file://.
  const tmp = path.join(__dirname, ".parity_probe.html");
  fs.writeFileSync(tmp, `<style>${facesCss()}</style><body></body>`, "utf8");
  try {
    await page.goto("file://" + tmp);

    // @font-face loads lazily — declaring a face does not fetch it. Ask for
    // each one explicitly, then confirm it arrived. Without this the snapshot
    // silently records fallback metrics, which look plausible and mean nothing.
    const missing = await page.evaluate(async (names) => {
      await Promise.all(names.map((n) => document.fonts.load(`16px '${n}'`)));
      await document.fonts.ready;
      return names.filter((n) => !document.fonts.check(`16px '${n}'`));
    }, Object.keys(FACES));
    if (missing.length) {
      throw new Error("these faces did not load in the browser: " + missing.join(", "));
    }

  const rows = await page.evaluate((fixtures) => {
    const probe = document.createElement("span");
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.whiteSpace = "pre";
    probe.style.left = "-9999px";
    document.body.appendChild(probe);

    return fixtures.map(([face, size, text]) => {
      probe.style.font = `${size}px '${face}'`;
      probe.textContent = text;

      // Unkerned: the sum of the font's own advance widths, which is what EVG
      // computes. This is the number the offline parity gate checks against.
      probe.style.fontKerning = "none";
      probe.style.fontFeatureSettings = '"kern" 0';
      const unkerned = probe.getBoundingClientRect().width;

      // Kerned: what a browser actually shows. The difference is the shaping
      // EVG has not implemented.
      probe.style.fontKerning = "normal";
      probe.style.fontFeatureSettings = "normal";
      const kerned = probe.getBoundingClientRect().width;

      return [face, size, unkerned, kerned, text];
    });
  }, FIXTURES);

    return rows;
  } finally {
    await browser.close();
    fs.rmSync(tmp, { force: true });
  }
}

function serialize(rows) {
  const body = rows.map((r) => `${r[0]}\t${r[1]}\t${r[2]}\t${r[3]}\t${r[4]}`);
  return HEADER.concat(body).join("\n") + "\n";
}

(async () => {
  const write = process.argv.includes("--write");
  const rows = await measure();
  const next = serialize(rows);

  if (write) {
    fs.mkdirSync(path.dirname(SNAPSHOT), { recursive: true });
    fs.writeFileSync(SNAPSHOT, next, "utf8");
    console.log(`wrote ${rows.length} measurements to ${path.relative(ROOT, SNAPSHOT)}`);
    const kerning = rows
      .map((r) => ({ label: `${r[0]} @${r[1]} "${r[4]}"`, d: r[2] - r[3] }))
      .filter((x) => Math.abs(x.d) > 0.01)
      .sort((a, b) => b.d - a.d);
    if (kerning.length) {
      console.log(`\n${kerning.length} of ${rows.length} fixtures kern in the browser:`);
      for (const k of kerning.slice(0, 8)) console.log(`  ${k.d.toFixed(3)}px  ${k.label}`);
    }
    return;
  }

  if (!fs.existsSync(SNAPSHOT)) {
    console.error("no snapshot yet - run with --write");
    process.exit(1);
  }
  const current = fs.readFileSync(SNAPSHOT, "utf8");
  if (current === next) {
    console.log(`snapshot matches this browser (${rows.length} measurements)`);
    return;
  }
  console.error("snapshot DIFFERS from what this browser measures.");
  const a = current.split("\n");
  const b = next.split("\n");
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) console.error(`  line ${i + 1}:\n    stored: ${a[i]}\n    now:    ${b[i]}`);
  }
  process.exit(1);
})();
