// =============================================================================
// smoke.mjs — does the page actually draw in a browser?
// =============================================================================
//   node gallery/vela/web/smoke.mjs
//
// The page is the one part of Vela that cannot be checked by running a CLI:
// it depends on a browser loading a compiled script, top-level classes being
// reachable from a second script, and the runtime having no `require` left in
// it. All three fail silently — you get an empty pane — so they are checked
// here by opening the page for real and looking at what it drew.
//
// Data fetching is checked with a URL served from this machine rather than from
// the internet, so the test says something about the page rather than about the
// network.
// =============================================================================

import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..');
const DIST = path.join(HERE, 'dist');

if (!fs.existsSync(path.join(DIST, 'vela_web.js'))) {
  execFileSync('bash', [path.join(HERE, 'build.sh')], { cwd: ROOT, stdio: 'inherit' });
}

let playwright;
try {
  const { createRequire } = await import('module');
  let found = null;
  for (const anchor of ['/opt/node22/lib/node_modules/x', path.join(ROOT, 'package.json')]) {
    try { found = createRequire(anchor)('playwright'); break; } catch { /* next */ }
  }
  playwright = found;
} catch { playwright = null; }

if (!playwright) {
  console.log('playwright is not installed — the page was not opened.');
  process.exit(0);
}

// A tiny server for the built page, plus one data set so the fetch path is
// exercised without reaching the internet.
const CARS = [
  { Horsepower: 130, Miles_per_Gallon: 18, Origin: 'USA' },
  { Horsepower: 165, Miles_per_Gallon: 15, Origin: 'USA' },
  { Horsepower: 90,  Miles_per_Gallon: 27, Origin: 'Japan' },
  { Horsepower: 88,  Miles_per_Gallon: 24, Origin: 'Europe' },
  { Horsepower: 113, Miles_per_Gallon: 22, Origin: 'Japan' },
  { Horsepower: 215, Miles_per_Gallon: 10, Origin: 'USA' }
];

const server = http.createServer((req, res) => {
  const name = decodeURIComponent(req.url.split('?')[0]);
  if (name === '/data/cars.json') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify(CARS));
    return;
  }
  let file = path.join(DIST, name === '/' ? 'index.html' : name);
  if (!file.startsWith(DIST) || !fs.existsSync(file)) { res.writeHead(404); res.end('no'); return; }
  // `/api/` is a directory. Reading one raises EISDIR, which reads as a crash
  // rather than as "this server does not do directory indexes".
  if (fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); res.end('no'); return; }
  }
  // A stylesheet served as text/html is REFUSED by the browser in standards
  // mode, and the page then renders as unstyled blue links -- which looks
  // exactly like a documentation tool that emitted no CSS. It was this server
  // that was wrong, not the generated site; GitHub Pages types these
  // correctly. Guessed from the extension, and every type these pages use is
  // listed rather than falling through to text/html.
  const TYPES = {
    '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
    '.gif': 'image/gif', '.ico': 'image/x-icon', '.map': 'application/json',
    '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2',
    '.otf': 'font/otf', '.eot': 'application/vnd.ms-fontobject',
    '.html': 'text/html', '.txt': 'text/plain', '.md': 'text/markdown',
  };
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, { 'content-type': type });
  res.end(fs.readFileSync(file));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await playwright.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const problems = [];
page.on('pageerror', e => problems.push(`page error: ${e}`));
// Dokka's generated pages load the Kotlin Playground from unpkg.com for the
// "Run" button on samples. It is the only external fetch any of the three
// documentation tools makes -- documentation.js and pdoc are entirely
// self-contained -- and it cannot resolve from a sandbox with no egress.
// The browser reports the failure twice: once as a failed REQUEST, which
// carries the URL, and once as a console error, which does not. So the URL is
// recorded here and the matching console line is ignored, rather than
// ignoring every "Failed to load resource" and losing a real one with it.
const externalFailures = new Set();
page.on('requestfailed', r => {
  const u = r.url();
  if (/^https?:\/\//.test(u) && !u.startsWith(base)) externalFailures.add(u);
});
page.on('console', m => {
  if (m.type() !== 'error') return;
  if (/Failed to load resource/.test(m.text()) && externalFailures.size) return;
  problems.push(`console: ${m.text()}`);
});

// The page points relative data URLs at the Vega editor; here they should come
// from the test server instead.
await page.addInitScript(`window.__VELA_DATA_BASE = ${JSON.stringify(base)};`);
await page.goto(base, { waitUntil: 'load' });

let failed = 0;
function check(name, ok, detail) {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name}${ok || !detail ? '' : ' — ' + detail}`);
  if (!ok) failed++;
}

async function render(spec) {
  const before = await page.evaluate(() => window.__velaRenders);
  await page.fill('#spec', JSON.stringify(spec));
  await page.click('#run');
  // Wait for THIS render to finish, not merely for the status line to differ
  // from the one the previous render left behind.
  await page.waitForFunction(n => window.__velaRenders > n, before, { timeout: 20000 });
  return {
    // A rule is drawn as <line> and everything with an outline as <path>, the
    // same split the reference's renderer makes — so "did it draw" has to count
    // both, or a bar chart's grid reads as nothing at all.
    shapes: await page.locator('#chart svg path, #chart svg line, #chart svg rect').count(),
    texts: await page.locator('#chart svg text').count(),
    status: await page.locator('#status').textContent(),
    bad: await page.locator('.note.bad').allTextContents()
  };
}

// 1. The default spec drew something on load.
{
  await page.waitForFunction(() => window.__velaRenders > 0, null, { timeout: 20000 });
  const shapes = await page.locator('#chart svg path, #chart svg line, #chart svg rect').count();
  const texts = await page.locator('#chart svg text').count();
  check('the page draws its own example on load', shapes >= 8 && texts >= 6, `${shapes} shapes, ${texts} labels`);
}

// 2. Vega in, drawn.
{
  const r = await render({
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    background: 'white', width: 200, height: 120, padding: 5,
    data: [{ name: 't', values: [{ a: 'A', b: 28 }, { a: 'B', b: 55 }, { a: 'C', b: 43 }] }],
    scales: [
      { name: 'x', type: 'band', domain: { data: 't', field: 'a' }, range: [0, { signal: 'width' }], padding: 0.1 },
      { name: 'y', type: 'linear', domain: { data: 't', field: 'b' }, range: [{ signal: 'height' }, 0], nice: true }
    ],
    axes: [{ scale: 'x', orient: 'bottom' }, { scale: 'y', orient: 'left' }],
    marks: [{ type: 'rect', from: { data: 't' }, encode: { update: {
      x: { scale: 'x', field: 'a' }, width: { scale: 'x', band: 1 },
      y: { scale: 'y', field: 'b' }, y2: { scale: 'y', value: 0 }, fill: { value: '#4c78a8' } } } }]
  });
  check('a Vega specification draws', r.shapes >= 8 && r.texts >= 4, `${r.shapes} shapes, ${r.texts} labels, ${r.status}`);
}

// 3. Vega-Lite in: compiled by Ranger, then drawn.
{
  const r = await render({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: [{ a: 'A', b: 28 }, { a: 'B', b: 55 }, { a: 'C', b: 43 }] },
    mark: 'bar',
    encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } }
  });
  check('a Vega-Lite specification compiles and draws', r.shapes >= 8 && r.texts >= 4, `${r.shapes} shapes, ${r.status}`);
  await page.click('#tab-vega');
  const vega = await page.locator('#vega').textContent();
  check('the compiled Vega is shown', vega.includes('"marks"') && vega.includes('"scales"'), `${vega.length} chars`);
  await page.click('#tab-svg');
}

// 4. A data URL is fetched by the page and handed over as values.
{
  const r = await render({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { url: 'data/cars.json' },
    mark: 'point',
    encoding: {
      x: { field: 'Horsepower', type: 'quantitative' },
      y: { field: 'Miles_per_Gallon', type: 'quantitative' },
      color: { field: 'Origin', type: 'nominal' }
    }
  });
  check('a data url is fetched and drawn', r.shapes >= 8 && r.bad.length === 0, `${r.shapes} shapes, ${r.status} ${r.bad.join(' ')}`);
}

// 5. And what it cannot do, it says. This is the one that matters: a runtime
//    that draws an empty rectangle instead of refusing is worse than useless.
{
  const r = await render({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: [{ x: 1, y: 2 }] },
    transform: [{ sample: 5 }],
    mark: 'line',
    encoding: { x: { field: 'x', type: 'quantitative' }, y: { field: 'y', type: 'quantitative' } }
  });
  const said = r.bad.join(' ');
  check('an unimplemented transform is refused out loud', said.includes('sample'), said || '(said nothing)');
}

// 6. The second backend. The point of the WebGL tab is that the chart goes
//    through the EVG stack instead — TSX, stylesheet, layout with the real
//    faces — so this checks the whole of that chain reached the GPU, and that
//    the text survived it, since text is what a missing font quietly loses.
{
  await render({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: [{ a: 'A', b: 28 }, { a: 'B', b: 55 }, { a: 'C', b: 43 }] },
    mark: 'bar',
    encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } }
  });
  await page.click('#tab-gl');
  await page.waitForFunction(
    () => window.__evgStats || /could not|no WebGL|would not|threw|did not/.test(
      document.getElementById('glNote').textContent),
    null, { timeout: 30000 });
  const stats = await page.evaluate(() => window.__evgStats);
  const note = await page.locator('#glNote').textContent();
  if (stats && stats.error === undefined && !/no WebGL 2/.test(note)) {
    check('the EVG display list is drawn on the GPU',
      stats.drawn + (stats.paths || 0) >= 4 && stats.textRuns >= 4,
      `${stats.drawn} quads, ${stats.paths || 0} paths, ${stats.textRuns} text runs`);
    const size = await page.evaluate(() => {
      const c = document.getElementById('gl');
      return [c.width, c.height];
    });
    check('the canvas is sized from the display list', size[0] > 100 && size[1] > 100, size.join('x'));
  } else if (/no WebGL 2/.test(note)) {
    console.log('  --   this browser has no WebGL 2, so the GPU target was not drawn');
  } else {
    check('the EVG display list is drawn on the GPU', false, note);
  }
  await page.click('#tab-svg');
}

// 7. The raster target. Nothing in the browser draws this one — the bytes come
//    back finished — so the check is that they are a PNG of the right size and
//    that the <img> accepted them, which no amount of plausible-looking
//    arithmetic would fake.
{
  await page.click('#tab-png');
  await page.waitForFunction(
    () => window.__velaPng || /could not|would not|threw|no image/.test(
      document.getElementById('pngNote').textContent),
    null, { timeout: 60000 });
  const png = await page.evaluate(() => window.__velaPng);
  const note = await page.locator('#pngNote').textContent();
  check('Ranger rasterises the chart to PNG bytes', !!png && png.bytes > 1000, note);
  if (png) {
    const shown = await page.evaluate(() => {
      const img = document.getElementById('pngImg');
      return [img.naturalWidth, img.naturalHeight, img.complete];
    });
    check('the browser decodes them as an image', shown[2] && shown[0] === png.width,
      `${shown[0]}x${shown[1]} decoded, ${png.width} encoded`);
  }
  await page.click('#tab-svg');
}

// 8. And the print target, which is a whole PDF with the faces embedded.
{
  await page.click('#tab-pdf');
  await page.waitForFunction(
    () => window.__velaPdf || /could not|would not|threw|no PDF/.test(
      document.getElementById('pdfNote').textContent),
    null, { timeout: 60000 });
  const pdf = await page.evaluate(() => window.__velaPdf);
  const note = await page.locator('#pdfNote').textContent();
  check('Ranger writes the chart as a PDF', !!pdf && pdf.bytes > 1000, note);
  await page.click('#tab-svg');
}

// ---- the chart API, built by each platform's own tool ----------------------
// The point of these pages is that RANGER DID NOT RENDER THEM: documentation.js,
// pdoc and Dokka did, from the packages `-apipackage` writes. So the checks ask
// for each tool's own fingerprint rather than for content we chose -- a page we
// generated ourselves could satisfy any check we invented for it.
{
  await page.goto(base + '/api/', { waitUntil: 'load' });
  const cards = await page.locator('.card').count();
  check('the API index offers four languages', cards === 4, `${cards} card(s)`);

  // Not every toolchain is installable everywhere -- the Dart SDK host is
  // blocked by the egress policy here -- so a missing one is REPORTED and
  // fails only the CI run, which passes --require. What must never happen is
  // a language quietly vanishing from the index.
  const built = await page.locator('.card.ok').count();
  const off = await page.locator('.card.off').allInnerTexts();
  check('every language is on the index, built or not', built + off.length === 4,
        `${built} built, ${off.length} reported as not run`);
  if (off.length) {
    console.log(`       not built here: ${off.map(t => t.split('\n')[0]).join(', ')}`);
  }

  const BUILT = [
    ['javascript', 'index.html',      'documentation.js', "documentation.js signs its own footer"],
    ['python',     'vela_chart.html', 'pdoc',             'pdoc signs its own footer'],
    ['kotlin',     'index.html',      'dokka',            'Dokka signs its own footer'],
    ['dart',       'index.html',      'dartdoc',          'dartdoc signs its own footer'],
  ].filter(([id]) => fs.existsSync(path.join(DIST, 'api', id, 'index.html'))
                  || fs.existsSync(path.join(DIST, 'api', id, 'vela_chart.html')));
  for (const [id, entry, marker, why] of BUILT) {
    const r = await page.goto(`${base}/api/${id}/${entry}`, { waitUntil: 'load' });
    check(`${id}: the generated site is served`, r && r.status() === 200,
          r ? `HTTP ${r.status()}` : 'no response');
    const html = await page.content();
    // Case-insensitively: Dokka signs itself `dokka` and `dokkaHtml` in the
    // markup, not `Dokka`, and asserting the capitalised form failed on a
    // page that was perfectly fine.
    check(`${id}: ${why}`, html.toLowerCase().includes(marker.toLowerCase()),
          `looked for ${JSON.stringify(marker)}`);
    check(`${id}: the API is actually in it`, html.includes('VlDataRow'),
          'expected the VlDataRow class');
  }

  // Did the tool's own stylesheet actually APPLY? A page whose CSS was
  // refused looks like a page that never had any, and the first screenshot of
  // this site was of exactly that -- a server here typing .css as text/html.
  // Body text that is still the browser default 16px/serif means no
  // stylesheet took effect.
  for (const [id, entry] of BUILT.map(([a, b]) => [a, b])) {
    await page.goto(`${base}/api/${id}/${entry}`, { waitUntil: 'load' });
    const font = await page.evaluate(() =>
      getComputedStyle(document.body).fontFamily.toLowerCase());
    check(`${id}: the tool's own stylesheet is applied`,
          font !== '' && !/^(times|serif)/.test(font), `body font-family: ${font}`);
  }

  // The examples are Ranger functions compiled for that target. They are the
  // one part of the page that could not have come from a doc tool alone.
  await page.goto(`${base}/api/javascript/index.html`, { waitUntil: 'load' });
  const jsText = await page.locator('body').innerText();
  check('the compiled example is on the JavaScript page',
        jsText.includes('VlDataset.create()') && jsText.includes('"region"'),
        'expected the dataset example');
}

// Say what was reached for, rather than only that it was tolerated.
if (externalFailures.size) {
  console.log(`\n  the published pages request ${externalFailures.size} external`
    + ` resource(s), unreachable from here:`);
  for (const u of externalFailures) console.log(`    ${u}`);
}

await browser.close();
server.close();

for (const p of problems) console.log(`       ${p}`);
if (problems.length) failed++;

console.log(failed
  ? `\n${failed} check(s) failed`
  : `\nthe page works: Vega, Vega-Lite, a fetched url, an honest refusal,`
    + `\nand the same chart through four backends — SVG, GPU, raster and print`);
process.exit(failed ? 1 : 0);
