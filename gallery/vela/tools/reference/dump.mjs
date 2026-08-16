/**
 * dump.mjs — what does the reference implementation actually draw?
 *
 *   node gallery/vela/tools/reference/dump.mjs <spec.vg.json>
 *
 * The parity harness answers "do these agree"; this answers "what does the
 * other one say", which is the question you have as soon as they don't. It
 * runs a Vega specification through official Vega and prints the scenegraph as
 * a tree: every mark, every item, the properties that place it, and — the part
 * you cannot get from the scene JSON — the BOUNDS Vega computed for each one.
 *
 * The bounds are why this exists. Guides are positioned against the ink of
 * what they label: a row title sits outside the axis LABELS of the row header,
 * a legend outside the axis on that side of the plot, a wrapped grid's rows
 * outside the frame stroke of the cell above. None of those numbers appear in
 * the scene; they are the bounds, and reading them off the reference is how
 * each of those rules was worked out rather than guessed.
 *
 * Needs the reference (`npm install --no-save vega vega-lite`).
 */
import fs from 'fs';
import * as vega from 'vega';

const file = process.argv[2];
if (!file) {
  console.error('usage: node gallery/vela/tools/reference/dump.mjs <spec.vg.json>');
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
const view = new vega.View(vega.parse(spec), { renderer: 'none' });
await view.runAsync();

// The properties worth seeing: where a thing is, how big, which way up, and
// what it says. Everything else is paint.
const PLACES = [
  'x', 'y', 'x2', 'y2', 'width', 'height', 'angle', 'align', 'baseline', 'text',
  'orient', 'anchor', 'offset', 'padding', 'frame', 'direction', 'limit',
  'dx', 'dy', 'fontSize', 'row', 'column',
];

const box = (o) => (o && o.bounds ? `[${o.bounds.x1},${o.bounds.y1} .. ${o.bounds.x2},${o.bounds.y2}]` : '');

function walk(mark, depth) {
  console.log(' '.repeat(depth) + `<${mark.marktype || '?'}> ${mark.name || ''} role=${mark.role || ''} ${box(mark)}`);
  for (const item of mark.items || []) {
    const shown = {};
    for (const key of PLACES) if (item[key] !== undefined) shown[key] = item[key];
    console.log(' '.repeat(depth + 2) + JSON.stringify(shown) + '  ' + box(item));
    for (const child of item.items || []) if (child && child.marktype) walk(child, depth + 4);
  }
}

walk(view.scenegraph().root, 0);
