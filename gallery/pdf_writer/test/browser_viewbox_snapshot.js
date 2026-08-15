/**
 * Records what a real SVG implementation computes for viewBox, so the vector
 * gate can check EVG against it without a browser.
 *
 * PLAN_VECTOR_IR.md §7.2. `vector_viewbox_test.rgr` already pins the transform
 * against the spec rule worked out by hand, which is the primary backbone. This
 * adds a second, independent opinion: Chromium's own implementation of the same
 * spec text. Hand-derived numbers and a shipping renderer agreeing is a much
 * stronger claim than either alone — and it is the same oracle the HTML
 * renderer delegates to in production, so a disagreement here is a real
 * PDF-vs-HTML divergence waiting to happen.
 *
 * The measurement is `getCTM()` on a <g> directly inside the <svg>: the
 * transform from the group's user space to the viewport, which IS the viewBox
 * transform, returned as the same six numbers as an SVG matrix(...). No
 * rendering, no pixels, no image comparison — just arithmetic to compare.
 *
 * Following browser_parity_snapshot.js: the browser establishes the numbers
 * ONCE into a committed snapshot, and the offline gate reads that. A
 * correctness gate that needs Chromium on every run is a gate people skip.
 *
 *   node gallery/pdf_writer/test/browser_viewbox_snapshot.js         # verify only
 *   node gallery/pdf_writer/test/browser_viewbox_snapshot.js --write # re-record
 *
 * Re-record only when the fixture list below changes. A diff with an unchanged
 * fixture list means the browser changed its mind about the spec, which is
 * worth reading carefully before committing.
 */
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const EXECUTABLE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const ROOT = path.resolve(__dirname, "../../..");
const SNAPSHOT = path.join(__dirname, "fixtures/viewbox.snapshot");

/**
 * [viewBox, viewportW, viewportH, preserveAspectRatio]
 *
 * "-" means the attribute is left off entirely, which is how the spec default
 * (xMidYMid meet) gets exercised as a real default rather than as a string we
 * happen to pass.
 */
const FIXTURES = [
  // Wider than tall: the vertical axis carries the slack, so the Y keyword is
  // the one under test and every expectation is unambiguous.
  ["0 0 100 50", 200, 200, "xMinYMin meet"],
  ["0 0 100 50", 200, 200, "xMidYMin meet"],
  ["0 0 100 50", 200, 200, "xMaxYMin meet"],
  ["0 0 100 50", 200, 200, "xMinYMid meet"],
  ["0 0 100 50", 200, 200, "xMidYMid meet"],
  ["0 0 100 50", 200, 200, "xMaxYMid meet"],
  ["0 0 100 50", 200, 200, "xMinYMax meet"],
  ["0 0 100 50", 200, 200, "xMidYMax meet"],
  ["0 0 100 50", 200, 200, "xMaxYMax meet"],

  // Taller than wide: now the X keyword is the one with slack to distribute.
  ["0 0 50 100", 200, 200, "xMinYMid meet"],
  ["0 0 50 100", 200, 200, "xMidYMid meet"],
  ["0 0 50 100", 200, 200, "xMaxYMid meet"],

  // slice — the viewport is covered and the surplus overflows, so the
  // translations go negative.
  ["0 0 100 50", 200, 200, "xMidYMid slice"],
  ["0 0 100 50", 200, 200, "xMinYMin slice"],
  ["0 0 50 100", 200, 200, "xMaxYMax slice"],

  // none — the only case with independent per-axis scales.
  ["0 0 100 50", 200, 200, "none"],
  ["0 0 33 17", 120, 90, "none"],

  // A viewBox that does not start at the origin: the case bounding-box fitting
  // could never express.
  ["10 20 100 50", 200, 200, "xMidYMid meet"],
  ["-5 -5 10 10", 100, 60, "xMidYMid meet"],
  ["-5 -5 10 10", 100, 60, "xMinYMax meet"],

  // Fractional scales, where a wrong rounding step would show up.
  ["0 0 33 17", 120, 90, "xMidYMid meet"],
  ["0 0 33 17", 120, 90, "xMidYMid slice"],
  ["0 0 7 3", 100, 100, "xMaxYMin meet"],

  // The icon case this feature mostly exists for, with the attribute omitted so
  // the browser supplies the default.
  ["0 0 24 24", 64, 64, "-"],
  ["0 0 24 24", 24, 24, "-"],
  ["0 0 16 16", 48, 24, "-"],
];

async function measure() {
  const browser = await chromium.launch({ executablePath: EXECUTABLE });
  const page = await browser.newPage();
  await page.setContent("<!doctype html><body></body>");

  const rows = await page.evaluate((fixtures) => {
    const NS = "http://www.w3.org/2000/svg";
    const out = [];
    for (const [viewBox, w, h, par] of fixtures) {
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", viewBox);
      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
      if (par !== "-") svg.setAttribute("preserveAspectRatio", par);

      // A group with no transform of its own: its CTM relative to the nearest
      // viewport is exactly the viewBox transform and nothing else.
      const g = document.createElementNS(NS, "g");
      svg.appendChild(g);
      document.body.appendChild(svg);

      const m = g.getCTM();
      out.push([viewBox, w, h, par, m.a, m.b, m.c, m.d, m.e, m.f]);
      svg.remove();
    }
    return out;
  }, FIXTURES);

  await browser.close();
  return rows;
}

const HEADER = [
  "# EVG viewBox transform snapshot v1",
  "#",
  "# What Chromium computes for viewBox / preserveAspectRatio, recorded so the",
  "# vector gate can check VectorViewBox against a real SVG implementation with",
  "# no browser and no network.",
  "# Regenerate with: node gallery/pdf_writer/test/browser_viewbox_snapshot.js --write",
  "#",
  "# Measured as getCTM() on a <g> directly inside the <svg>, i.e. the transform",
  "# from user space to viewport space, in SVG matrix(a b c d e f) order.",
  "# A preserveAspectRatio of `-` means the attribute was left off, so the",
  "# browser applied its own default.",
  "#",
  "# viewBox<TAB>width<TAB>height<TAB>preserveAspectRatio<TAB>a<TAB>b<TAB>c<TAB>d<TAB>e<TAB>f",
];

function serialize(rows) {
  return HEADER.concat(rows.map((r) => r.join("\t"))).join("\n") + "\n";
}

(async () => {
  const write = process.argv.includes("--write");
  const rows = await measure();
  const next = serialize(rows);

  if (write) {
    fs.mkdirSync(path.dirname(SNAPSHOT), { recursive: true });
    fs.writeFileSync(SNAPSHOT, next, "utf8");
    console.log(`wrote ${rows.length} transforms to ${path.relative(ROOT, SNAPSHOT)}`);
    return;
  }

  if (!fs.existsSync(SNAPSHOT)) {
    console.error("no snapshot yet - run with --write");
    process.exit(1);
  }
  const current = fs.readFileSync(SNAPSHOT, "utf8");
  if (current === next) {
    console.log(`snapshot matches this browser (${rows.length} transforms)`);
    return;
  }
  console.error("snapshot DIFFERS from what this browser computes.");
  const a = current.split("\n");
  const b = next.split("\n");
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) console.error(`  line ${i + 1}:\n    stored: ${a[i]}\n    now:    ${b[i]}`);
  }
  process.exit(1);
})();
