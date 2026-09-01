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
  const type = file.endsWith('.js') ? 'text/javascript'
    : file.endsWith('.ttf') ? 'font/ttf'
    : file.endsWith('.json') ? 'application/json'
    : 'text/html';
  res.writeHead(200, { 'content-type': type });
  res.end(fs.readFileSync(file));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await playwright.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const problems = [];
page.on('pageerror', e => problems.push(`page error: ${e}`));
page.on('console', m => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });

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

// ---- the chart API pages ---------------------------------------------------
// Three tabs, one API, and each panel has to carry the documentation comment
// its own ecosystem reads. A panel that came out empty -- an extractor that
// stopped matching after a writer changed its output shape -- looks exactly
// like a working page until somebody clicks that tab.
{
  await page.goto(base + '/api/', { waitUntil: 'load' });
  const tabs = await page.locator('.tab').count();
  check('the API page offers three languages', tabs === 3, `${tabs} tab(s)`);

  for (const [lang, marker] of [['javascript', '@returns {'],
                                ['python', 'Args:'],
                                ['kotlin', '@return ']]) {
    await page.click(`.tab[data-lang="${lang}"]`);
    const cards = await page.locator(`.panel[data-lang="${lang}"] article.m`).count();
    const text = await page.locator(`.panel[data-lang="${lang}"]`).innerText();
    check(`${lang}: every documented member is on the page`,
          cards === 129, `${cards} member cards`);
    check(`${lang}: the comment is the one this ecosystem reads`,
          text.includes(marker), `looking for ${JSON.stringify(marker)}`);
  }

  // The example bodies are Ranger functions compiled for each target, so the
  // JavaScript panel must show JavaScript rather than Ranger or Kotlin.
  await page.click('.tab[data-lang="javascript"]');
  const js = await page.locator('.panel[data-lang="javascript"]').innerText();
  check('the compiled example reads as the target language',
        js.includes('const data = VlDataset.create();'),
        'expected the JavaScript form of the dataset example');
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
