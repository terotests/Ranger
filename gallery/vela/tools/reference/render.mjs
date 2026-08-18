// =============================================================================
// render.mjs — compare what Vela DRAWS against what the reference draws.
// =============================================================================
// `parity.mjs` compares scenegraphs, and a scenegraph is a description of a
// chart rather than the chart: it says `shape: "diamond"` and `baseline:
// "middle"` and leaves it to a renderer to decide what those mean. Everything
// below that line — the outline a shape becomes, where a label's glyphs sit
// relative to its anchor, what a wedge's edge really is — was checked only
// against this repository's own golden files, which pin what changed and can
// never say that what was drawn was wrong from the start.
//
// So: the reference renders to SVG, Vela renders to SVG, and both documents go
// through the parser below into the same form — absolute outlines and absolute
// text anchors. Then they are compared.
//
//   node gallery/vela/tools/reference/render.mjs [spec.vg.json …]
//
// HOW SHAPES ARE COMPARED. Not as path strings: the reference writes a circle
// as two elliptical arcs and Vela writes it as four cubics, and those are the
// same circle. Each outline is flattened to dense samples and the two are
// compared by symmetric Hausdorff distance — the furthest either outline
// strays from the other. That is independent of how the path was written,
// where it started and which way round it went, and it is in pixels, so the
// tolerance means something: 0.25px is a quarter of a pixel of ink.
//
// WHAT IS DELIBERATELY NOT COMPARED. The reference wraps every mark in <g>
// elements carrying aria roles and class names; those are accessibility and
// styling, not drawing. Anything that paints nothing — a group's empty
// background path, a foreground path with `display: none` — is dropped from
// both sides, because a shape with no fill and no stroke leaves no ink.
//
// `vega` is an OPTIONAL dev dependency. Without it this exits 0 saying clearly
// that nothing was compared, because a silent skip would read as a pass.
// =============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VELA = path.resolve(__dirname, '..', '..');
const ROOT = path.resolve(VELA, '..', '..');
const SVG_TOOL = path.join(VELA, 'bin', 'vela_svg.js');
const SPEC_DIR = path.join(VELA, 'tests', 'specs');

let vega;
try {
  vega = await import('vega');
} catch {
  console.log('vega is not installed — nothing was compared.');
  console.log('install the reference to run this:  npm install --no-save vega vega-lite');
  process.exit(0);
}

if (!fs.existsSync(SVG_TOOL)) {
  console.error(`missing ${path.relative(ROOT, SVG_TOOL)} — build it with gallery/vela/tests/run.sh`);
  process.exit(1);
}

import { parseSvg, comparePrimitives } from './svgcompare.mjs';

// -----------------------------------------------------------------------------
// the run
// -----------------------------------------------------------------------------

function specsUnder(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...specsUnder(full));
    else if (entry.name.endsWith('.vg.json')) out.push(full);
  }
  return out;
}

const specs = process.argv.length > 2 ? process.argv.slice(2) : specsUnder(SPEC_DIR);
const ZONE = process.env.VELA_ZONE || '';
const VERBOSE = process.env.VELA_RENDER_VERBOSE === '1';

let total = 0;
let matched = 0;
let failed = 0;
const report = [];

for (const specPath of specs) {
  const name = path.relative(SPEC_DIR, specPath).replace(/\.vg\.json$/, '').replace(/\\/g, '/');
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

  let refSvg;
  try {
    const view = new vega.View(vega.parse(spec), { renderer: 'none' });
    await view.runAsync();
    refSvg = await view.toSVG();
  } catch (err) {
    report.push({ name, status: 'REFERENCE FAILED', detail: err.message });
    failed++;
    continue;
  }

  const args = ZONE ? [SVG_TOOL, specPath, `--zone=${ZONE}`] : [SVG_TOOL, specPath];
  const velaOut = execFileSync(process.execPath, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (!velaOut.trimStart().startsWith('<svg')) {
    report.push({ name, status: 'VELA FAILED', detail: velaOut.trim().split('\n')[0] });
    failed++;
    continue;
  }

  const refs = parseSvg(refSvg);
  const gots = parseSvg(velaOut);
  const result = comparePrimitives(refs, gots);

  total += result.total;
  matched += result.matched;
  if (result.findings.length === 0) {
    report.push({ name, status: 'ok', detail: `${result.matched} primitives` });
  } else {
    failed++;
    const shown = VERBOSE ? result.findings : result.findings.slice(0, 4);
    const more = result.findings.length - shown.length;
    report.push({
      name,
      status: 'DIFF',
      detail: `${result.matched}/${result.total} — ${shown.join('; ')}${more > 0 ? ` … +${more} more` : ''}`
    });
  }
}

for (const row of report) {
  const tag = row.status === 'ok' ? '  ok  ' : ` ${row.status} `;
  console.log(`${tag.padEnd(18)} ${row.name}: ${row.detail}`);
}
console.log(`\n${matched}/${total} drawn primitives match the reference renderer (${failed} of ${specs.length} charts differ)`);
process.exit(matched === total && failed === 0 ? 0 : 1);
