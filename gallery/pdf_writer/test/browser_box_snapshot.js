/**
 * Records how a browser lays out the box-model fixtures, so the parity check
 * can run without one — the same arrangement as browser_parity_snapshot.js,
 * applied to geometry and background colour instead of text advances.
 *
 * Both sides read fixtures/box_model.fixtures, so the tree under test cannot
 * drift between the browser and EVG.
 *
 *   node gallery/pdf_writer/test/browser_box_snapshot.js         # verify only
 *   node gallery/pdf_writer/test/browser_box_snapshot.js --write # re-record
 *
 * Two deliberate choices keep this a test of EVG rather than of CSS trivia:
 *
 *   box-sizing: border-box  — EVG's width/height include padding, and
 *                             EVGBox.getInnerWidth subtracts it.
 *   display: flex           — EVG's flow IS flex. Under block flow the browser
 *                             would collapse adjacent vertical margins and the
 *                             two would disagree for a reason that has nothing
 *                             to do with EVG being wrong.
 */
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const EXECUTABLE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const ROOT = path.resolve(__dirname, "../../..");
const FIXTURES = path.join(__dirname, "fixtures/box_model.fixtures");
const SNAPSHOT = path.join(__dirname, "fixtures/box_model.snapshot");

const HEADER = [
  "# EVG box-model parity snapshot v1",
  "#",
  "# Geometry Chromium computes for fixtures/box_model.fixtures, recorded so",
  "# the parity gate can run without a browser. x/y are relative to the",
  "# fixture root's border box.",
  "# Regenerate with: node gallery/pdf_writer/test/browser_box_snapshot.js --write",
  "#",
  "# fixture<TAB>node<TAB>x<TAB>y<TAB>w<TAB>h<TAB>background",
];

/** Parse the shared fixture file into [{name, nodes:[{id,parent,props}]}]. */
function parseFixtures(text) {
  const out = [];
  let cur = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/\s+/);
    if (parts[0] === "F") {
      cur = { name: parts[1], nodes: [] };
      out.push(cur);
    } else if (parts[0] === "N") {
      if (!cur) throw new Error("node before any fixture: " + line);
      const props = {};
      for (const kv of parts.slice(3)) {
        const eq = kv.indexOf("=");
        if (eq < 0) throw new Error("bad property (expected k=v): " + kv);
        props[kv.slice(0, eq)] = kv.slice(eq + 1);
      }
      cur.nodes.push({ id: parts[1], parent: parts[2] === "-" ? null : parts[2], props });
    } else {
      throw new Error("unrecognised fixture line: " + line);
    }
  }
  return out;
}

// A bare number means px, as it does in EVGUnit.parse. Anything that already
// carries a unit is passed through — appending "px" to "2em" produced "2empx",
// which the browser silently dropped and measured as auto.
const LEN = (v) => (/^[-+]?[0-9]*\.?[0-9]+$/.test(v) ? v + "px" : v);

function styleFor(p) {
  const s = [
    "box-sizing:border-box",
    "display:flex",
    `flex-direction:${p.dir === "row" ? "row" : "column"}`,
    // Left at the CSS default of 1, which is also EVG's default. Pinning it to
    // 0 here would have made the browser disagree with EVG for a reason of the
    // harness's own making rather than anything about the engine.
    "align-items:flex-start",
    "justify-content:flex-start",
  ];
  if (p.w) s.push(`width:${LEN(p.w)}`);
  if (p.h) s.push(`height:${LEN(p.h)}`);
  if (p.pad) s.push(`padding:${LEN(p.pad)}`);
  for (const [k, css] of [["padT", "padding-top"], ["padR", "padding-right"], ["padB", "padding-bottom"], ["padL", "padding-left"]])
    if (p[k]) s.push(`${css}:${LEN(p[k])}`);
  if (p.mar) s.push(`margin:${LEN(p.mar)}`);
  for (const [k, css] of [["marT", "margin-top"], ["marR", "margin-right"], ["marB", "margin-bottom"], ["marL", "margin-left"]])
    if (p[k]) s.push(`${css}:${LEN(p[k])}`);
  if (p.bg) s.push(`background:${p.bg}`);
  if (p.gap) s.push(`gap:${LEN(p.gap)}`);
  // font-size matters even with no text: `em` lengths resolve against it.
  if (p.fs) s.push(`font-size:${LEN(p.fs)}`);
  return s.join(";");
}

function htmlFor(fixture) {
  const byParent = new Map();
  for (const n of fixture.nodes) {
    const key = n.parent === null ? "__root__" : n.parent;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(n);
  }
  const render = (n) => {
    const kids = (byParent.get(n.id) || []).map(render).join("");
    return `<div data-id="${n.id}" style="${styleFor(n.props)}">${kids}</div>`;
  };
  const roots = byParent.get("__root__") || [];
  return roots.map(render).join("");
}

async function measure(fixtures) {
  const browser = await chromium.launch({ executablePath: EXECUTABLE });
  const page = await browser.newPage();
  try {
    // Each fixture in its own absolutely-positioned island so nothing in one
    // can affect another's geometry.
    const body = fixtures
      .map(
        (f) =>
          `<div data-fixture="${f.name}" style="position:absolute;left:0;top:0">${htmlFor(f)}</div>`
      )
      .join("");
    await page.setContent(
      // No global font-size:0 — that would make every `em` length collapse.
      // html's size is what `rem` resolves against; it is pinned rather than
      // left to the browser default so the fixtures can state it.
      `<style>*{margin:0;padding:0;border:0;line-height:0}html,body{font-size:16px}</style><body>${body}</body>`
    );

    return await page.evaluate(() => {
      const rows = [];
      for (const holder of document.querySelectorAll("[data-fixture]")) {
        const fixture = holder.getAttribute("data-fixture");
        const rootEl = holder.firstElementChild;
        const origin = rootEl.getBoundingClientRect();
        for (const el of holder.querySelectorAll("[data-id]")) {
          const r = el.getBoundingClientRect();
          rows.push([
            fixture,
            el.getAttribute("data-id"),
            +(r.left - origin.left).toFixed(4),
            +(r.top - origin.top).toFixed(4),
            +r.width.toFixed(4),
            +r.height.toFixed(4),
            getComputedStyle(el).backgroundColor,
          ]);
        }
      }
      return rows;
    });
  } finally {
    await browser.close();
  }
}

function serialize(rows) {
  return HEADER.concat(rows.map((r) => r.join("\t"))).join("\n") + "\n";
}

(async () => {
  const fixtures = parseFixtures(fs.readFileSync(FIXTURES, "utf8"));
  const rows = await measure(fixtures);
  const next = serialize(rows);

  if (process.argv.includes("--write")) {
    fs.writeFileSync(SNAPSHOT, next, "utf8");
    console.log(
      `wrote ${rows.length} boxes across ${fixtures.length} fixtures to ${path.relative(ROOT, SNAPSHOT)}`
    );
    return;
  }
  if (!fs.existsSync(SNAPSHOT)) {
    console.error("no snapshot yet - run with --write");
    process.exit(1);
  }
  const current = fs.readFileSync(SNAPSHOT, "utf8");
  if (current === next) {
    console.log(`snapshot matches this browser (${rows.length} boxes)`);
    return;
  }
  console.error("snapshot DIFFERS from what this browser lays out.");
  const a = current.split("\n");
  const b = next.split("\n");
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) console.error(`  line ${i + 1}:\n    stored: ${a[i]}\n    now:    ${b[i]}`);
  }
  process.exit(1);
})();
