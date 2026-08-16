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
  const file = path.join(DIST, name === '/' ? 'index.html' : name);
  if (!file.startsWith(DIST) || !fs.existsSync(file)) { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'content-type': file.endsWith('.js') ? 'text/javascript' : 'text/html' });
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
    transform: [{ loess: 'y', on: 'x' }],
    mark: 'line',
    encoding: { x: { field: 'x', type: 'quantitative' }, y: { field: 'y', type: 'quantitative' } }
  });
  const said = r.bad.join(' ');
  check('an unimplemented transform is refused out loud', said.includes('loess'), said || '(said nothing)');
}

await browser.close();
server.close();

for (const p of problems) console.log(`       ${p}`);
if (problems.length) failed++;

console.log(failed ? `\n${failed} check(s) failed` : `\nthe page works: Vega, Vega-Lite, a fetched url, and an honest refusal`);
process.exit(failed ? 1 : 0);
