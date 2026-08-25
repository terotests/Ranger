/**
 * chart_api_smoke.mjs — does the chart API actually RUN in a browser?
 *
 *   npm run showcase && npm run showcase:api
 *
 * The rest of this gallery is rendered ahead of time: a PDF and a PNG prove
 * that the API built a chart once, on a build machine, in Node. They do not
 * prove that the compiled API runs where a reader is. This does — it opens
 * `dist/chart-api/` in a real browser and checks, through the page rather than
 * around it:
 *
 *   1. the default script — JavaScript — draws an SVG with real geometry,
 *   2. every preset draws a DIFFERENT chart, and the status line reports the
 *      calls that were dispatched and the commands the runtime produced,
 *   3. the SAME chart written in Ranger draws the SAME SVG, byte for byte,
 *      which is the claim the two-language page makes,
 *   4. a method the API does not have is refused BY NAME in both languages,
 *   5. editing the DATA redraws the chart — which is what tells a live page
 *      from a picture of one,
 *   6. the Vega-Lite the calls built is on the page beside the drawing,
 *   7. and nothing threw: a page error or a console error fails the run.
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../../..");
const DIST = path.resolve(process.argv[2] || path.join(HERE, "..", "dist"));
const LIVE = path.join(DIST, "chart-api");

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
      } catch { /* try the next anchor */ }
    }
  }
  return null;
}

const pw = loadPlaywright();
if (!pw) {
  console.log("Playwright is not available — the live page was not checked.");
  process.exit(0);
}
if (!fs.existsSync(path.join(LIVE, "index.html"))) {
  console.error(`no live page in ${path.relative(ROOT, LIVE)} — run: npm run showcase`);
  process.exit(1);
}

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json" };
const server = http.createServer((req, res) => {
  let file = path.join(DIST, decodeURIComponent(req.url.split("?")[0]));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!file.startsWith(DIST) || !fs.existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const problems = [];
page.on("pageerror", (e) => problems.push(`page error: ${e}`));
page.on("console", (m) => { if (m.type() === "error") problems.push(`console: ${m.text()}`); });

const checks = [];
function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "  ok  " : " FAIL "} ${name}${detail ? "  " + detail : ""}`);
}

await page.goto(`http://127.0.0.1:${port}/chart-api/`, { waitUntil: "load" });
await page.waitForFunction(() => document.querySelector("#chart svg") !== null, null, { timeout: 15000 });

const startsIn = await page.evaluate(() =>
  document.querySelector('[data-lang="js"]').getAttribute("aria-pressed"));
check("the page opens in JavaScript", startsIn === "true", `aria-pressed=${startsIn}`);

const first = await page.evaluate(() => ({
  paths: document.querySelectorAll("#chart svg path").length,
  texts: document.querySelectorAll("#chart svg text").length,
  status: document.getElementById("status").textContent,
  svg: document.getElementById("chart").innerHTML.length,
}));
check("the default script draws", first.paths >= 2 && first.texts >= 3,
  `${first.paths} paths, ${first.texts} labels`);
check("and says what it did", /\d+ kutsua/.test(first.status) && /piirtokomentoa/.test(first.status),
  first.status.trim());

// A drawn chart is also a document of sentences. `tools/reference/aria.mjs`
// holds those against official Vega; this holds them against the BUNDLE, which
// is the half that can silently go missing — a stale build ships a picture
// that says nothing and every check above still passes.
const spoken = await page.evaluate(() => {
  const labelled = [...document.querySelectorAll("#chart svg [aria-label]")];
  return {
    guides: labelled.filter((e) => /axis|legend|title/.test(e.getAttribute("aria-roledescription") || ""))
      .map((e) => e.getAttribute("aria-label")),
    marks: labelled.length,
    hidden: document.querySelectorAll("#chart svg [aria-hidden=\"true\"]").length,
    roles: new Set(labelled.map((e) => e.getAttribute("role"))).size,
  };
});
check("the drawing says something to a screen reader",
  spoken.guides.some((t) => /-axis titled/.test(t)) && spoken.marks > spoken.guides.length,
  `${spoken.guides.length} guides, ${spoken.marks} labelled elements, ${spoken.hidden} hidden`);
check("and every labelled element claims a role", spoken.roles === 1,
  spoken.guides[0] || "no guide sentence");

// Every preset is a different chart, drawn by the same compiled API.
const presets = await page.$$eval("[data-preset]", (els) => els.map((e) => e.dataset.preset));
const shapes = new Map();
for (const preset of presets) {
  await page.click(`[data-preset="${preset}"]`);
  await page.waitForTimeout(120);
  const drawn = await page.evaluate(() => ({
    svg: document.querySelector("#chart svg")?.outerHTML || "",
    status: document.getElementById("status").textContent,
    bad: document.getElementById("status").className === "bad",
  }));
  check(`preset ${preset} draws`, drawn.svg.length > 500 && !drawn.bad, drawn.status.trim());
  shapes.set(preset, drawn.svg);
}
check("the presets are not the same picture", new Set(shapes.values()).size === presets.length,
  `${new Set(shapes.values()).size} of ${presets.length} distinct`);

// The same charts in Ranger: the other language, the same engine, and the
// claim the page makes is that they draw the same picture.
await page.click('[data-lang="rgr"]');
await page.waitForTimeout(200);
let identical = 0;
for (const name of presets) {
  await page.click(`[data-preset="${name}"]`);
  await page.waitForTimeout(150);
  const drawn = await page.evaluate(() => ({
    svg: document.querySelector("#chart svg")?.outerHTML || "",
    bad: document.getElementById("status").className === "bad",
    code: document.getElementById("code").value,
  }));
  const same = drawn.svg === shapes.get(name);
  if (same) identical += 1;
  if (!same || drawn.bad) {
    check(`preset ${name} in Ranger draws what JavaScript drew`, false,
      drawn.bad ? drawn.code.split("\n")[0] : "different picture");
  }
}
check("every preset draws the same picture in both languages", identical === presets.length,
  `${identical} of ${presets.length}`);
check("and the Ranger source is not the JavaScript",
  !(await page.evaluate(() => document.getElementById("code").value)).includes(";"),
  "no semicolons in the Ranger form");

// A method the API does not have is refused by name — in Ranger by the
// interpreter, in JavaScript by JavaScript itself.
await page.fill("#code", 'chart.size(200 150)\nchart.colour("region")');
await page.waitForTimeout(300);
const refused = await page.evaluate(() => ({
  bad: document.getElementById("status").className === "bad",
  text: document.getElementById("status").textContent,
}));
check("an unknown method is refused by name (Ranger)", refused.bad && /no method 'colour'/.test(refused.text),
  refused.text.trim());

await page.click('[data-lang="js"]');
await page.waitForTimeout(150);
await page.fill("#code", 'chart.size(200, 150);\nchart.colour("region");');
await page.waitForTimeout(300);
const refusedJs = await page.evaluate(() => ({
  bad: document.getElementById("status").className === "bad",
  text: document.getElementById("status").textContent,
}));
check("and in JavaScript", refusedJs.bad && /colour is not a function/.test(refusedJs.text),
  refusedJs.text.trim());

// A column the data does not have is refused too — the API's own check,
// running in the browser.
await page.fill("#code", 'chart.size(200, 150);\nchart.bar().x("region").y("profit");');
await page.waitForTimeout(300);
const unknownColumn = await page.evaluate(() => document.getElementById("status").textContent);
check("an unknown column is refused", /no column called 'profit'/.test(unknownColumn), unknownColumn.trim());

// Editing the DATA redraws: this is the difference between a live page and a
// picture of one.
await page.fill("#code", 'chart.size(300, 180);\nchart.bar().x("region").keepOrder().y("sales").aggregate("sum");');
await page.waitForTimeout(300);
const before = await page.evaluate(() => document.querySelector("#chart svg").outerHTML);
await page.fill("#data", JSON.stringify([
  { region: "Yksi", sales: 10 },
  { region: "Kaksi", sales: 90 },
  { region: "Kolme", sales: 50 },
]));
await page.waitForTimeout(300);
const after = await page.evaluate(() => ({
  svg: document.querySelector("#chart svg").outerHTML,
  cols: document.getElementById("cols").textContent,
  status: document.getElementById("status").textContent,
}));
check("editing the data redraws the chart", after.svg !== before && after.svg.includes("Kaksi"),
  after.status.trim());
check("and the inferred column types are shown", /region → nominal/.test(after.cols) && /sales → quantitative/.test(after.cols),
  after.cols.trim());

// The specification the calls built is on the page.
await page.click('[data-view="spec"]');
await page.waitForTimeout(120);
const spec = await page.evaluate(() => document.getElementById("spec").textContent);
check("the Vega-Lite the calls built is shown", spec.includes("\"mark\"") && spec.includes("\"encoding\""),
  `${spec.split("\n").length} lines`);
await page.click('[data-view="vega"]');
await page.waitForTimeout(120);
const vega = await page.evaluate(() => document.getElementById("vega").textContent);
check("and the Vega it compiles to", vega.includes("\"scales\"") && vega.includes("\"marks\""),
  `${vega.split("\n").length} lines`);

// Docs pages iframe this page with ?embed=1&view=chart. The full playground
// still draws on load (checked above). The embed hides the chrome, autoruns
// a preset, and a parent can post a snippet that is not one of the presets.
const embedPage = await browser.newPage({ viewport: { width: 800, height: 520 } });
embedPage.on("pageerror", (e) => problems.push(`embed: ${e}`));
await embedPage.goto(`http://127.0.0.1:${port}/chart-api/?embed=1&view=chart&preset=bar`,
  { waitUntil: "load" });
await embedPage.waitForFunction(() => window.__chartApiReady === true, null, { timeout: 15000 });
await embedPage.waitForFunction(() => document.querySelector("#chart svg") !== null, null, { timeout: 15000 });
const embed = await embedPage.evaluate(() => ({
  mode: !!window.__embedMode,
  header: getComputedStyle(document.querySelector("header")).display,
  editor: getComputedStyle(document.querySelector("main > div:first-child")).display,
  paths: document.querySelectorAll("#chart svg path").length,
}));
check("embed mode is on", embed.mode);
check("embed hides the playground chrome", embed.header === "none" && embed.editor === "none");
check("embed autoruns the requested preset", embed.paths >= 2, `${embed.paths} paths`);
check("embed hides the chart chrome",
  await embedPage.evaluate(() => getComputedStyle(document.querySelector(".head")).display) === "none");
await embedPage.close();

const waitPage = await browser.newPage({ viewport: { width: 800, height: 520 } });
waitPage.on("pageerror", (e) => problems.push(`wait: ${e}`));
await waitPage.goto(`http://127.0.0.1:${port}/chart-api/?embed=1&view=chart&run=0`,
  { waitUntil: "load" });
await waitPage.waitForFunction(() => window.__chartApiReady === true, null, { timeout: 15000 });
const waiting = await waitPage.evaluate(() => ({
  svg: document.querySelector("#chart svg") !== null,
  status: document.getElementById("status").textContent,
}));
check("embed with run=0 waits for a parent", !waiting.svg && /waiting/.test(waiting.status),
  waiting.status.trim());
await waitPage.close();

const postedCode = `chart.size(280, 160);
chart.heading("Posted from parent");
const bars = chart.bar();
bars.x("region").keepOrder();
bars.y("sales").aggregate("sum");`;
fs.writeFileSync(path.join(LIVE, "embed-host.html"), `<!doctype html>
<html><body style="margin:0">
<iframe id="f" src="./index.html?embed=1&view=chart&run=0"
        style="width:100%;height:480px;border:0"></iframe>
<script>
  const f = document.getElementById("f");
  const code = ${JSON.stringify(postedCode)};
  const send = () => {
    try {
      if (f.contentWindow && f.contentWindow.__chartApiReady) {
        f.contentWindow.postMessage({ type: "vela-embed", view: "chart", lang: "js", code: code }, "*");
        return true;
      }
    } catch (e) {}
    return false;
  };
  const t = setInterval(() => { if (send()) clearInterval(t); }, 50);
  f.addEventListener("load", () => { if (send()) clearInterval(t); });
</script>
</body></html>`);
const host = await browser.newPage({ viewport: { width: 800, height: 520 } });
host.on("pageerror", (e) => problems.push(`host: ${e}`));
await host.goto(`http://127.0.0.1:${port}/chart-api/embed-host.html`, { waitUntil: "load" });
await host.waitForFunction(() => {
  const f = document.getElementById("f");
  const doc = f && f.contentDocument;
  return doc && doc.querySelector("#chart svg");
}, null, { timeout: 20000 });
const posted = await host.evaluate(() => {
  const doc = document.getElementById("f").contentDocument;
  const status = doc.getElementById("status").textContent;
  const svg = doc.getElementById("chart").innerHTML;
  return { status, drew: /<svg/.test(svg), heading: /Posted from parent/.test(svg) };
});
check("a parent can post a snippet into the embed", posted.drew && /kutsua/.test(posted.status));
check("and the posted heading is in the drawing", posted.heading);
await host.close();

check("nothing threw", problems.length === 0, problems.slice(0, 3).join(" | "));

await browser.close();
server.close();

const failed = checks.filter((c) => !c.ok).length;
console.log(`\n${checks.length - failed}/${checks.length} checks passed in a real browser`);
process.exit(failed === 0 ? 0 : 1);
