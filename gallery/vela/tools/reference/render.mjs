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

// A quarter of a pixel. Tighter than a display can show and looser than
// floating point noise, which is the band a real difference has to clear.
const INK = 0.25;
// Text lands on whole pixels in both implementations once the baseline offset
// is rounded, so a label that is out is out by a pixel or more.
const TEXT_TOLERANCE = 0.5;

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

// -----------------------------------------------------------------------------
// SVG → primitives
// -----------------------------------------------------------------------------

/** A transform matrix [a, b, c, d, e, f], applied as x' = ax + cy + e. */
const IDENTITY = [1, 0, 0, 1, 0, 0];

function multiply(m, n) {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5]
  ];
}

function apply(m, x, y) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

function parseTransform(text) {
  let m = IDENTITY;
  if (!text) return m;
  const re = /(translate|rotate|scale|matrix)\s*\(([^)]*)\)/g;
  let match;
  while ((match = re.exec(text))) {
    const args = match[2].trim().split(/[\s,]+/).map(Number);
    if (match[1] === 'translate') {
      m = multiply(m, [1, 0, 0, 1, args[0] || 0, args[1] || 0]);
    } else if (match[1] === 'scale') {
      const sx = args[0] ?? 1;
      m = multiply(m, [sx, 0, 0, args.length > 1 ? args[1] : sx, 0, 0]);
    } else if (match[1] === 'rotate') {
      const a = (args[0] || 0) * Math.PI / 180;
      const cos = Math.cos(a), sin = Math.sin(a);
      let r = [cos, sin, -sin, cos, 0, 0];
      if (args.length > 2) {
        // rotate(a, cx, cy) is a translated rotation.
        r = multiply([1, 0, 0, 1, args[1], args[2]], multiply(r, [1, 0, 0, 1, -args[1], -args[2]]));
      }
      m = multiply(m, r);
    } else {
      m = multiply(m, args.slice(0, 6));
    }
  }
  return m;
}

function parseAttributes(tagBody) {
  const out = {};
  const re = /([-\w:]+)\s*=\s*"([^"]*)"/g;
  let match;
  while ((match = re.exec(tagBody))) out[match[1]] = match[2];
  return out;
}

/**
 * Every drawn element in the document, with its coordinates resolved through
 * the transforms above it. Both implementations nest differently — the
 * reference wraps each mark in groups it needs for accessibility — and after
 * this neither nesting exists any more.
 */
function parseSvg(text) {
  const out = [];
  const stack = [{ matrix: IDENTITY, attrs: {} }];
  const tag = /<(\/?)([\w:-]+)([^>]*?)(\/?)>/g;
  let match;

  while ((match = tag.exec(text))) {
    const closing = match[1] === '/';
    const name = match[2];
    const selfClosing = match[4] === '/';
    const attrs = closing ? {} : parseAttributes(match[3]);
    const top = stack[stack.length - 1];

    if (name === 'g') {
      if (closing) {
        if (stack.length > 1) stack.pop();
      } else {
        const matrix = multiply(top.matrix, parseTransform(attrs.transform));
        const frame = { matrix, attrs: { ...top.attrs, ...attrs } };
        if (selfClosing) { /* nothing inside */ } else stack.push(frame);
      }
      continue;
    }
    if (closing) continue;

    const matrix = multiply(top.matrix, parseTransform(attrs.transform));
    const inherited = { ...top.attrs, ...attrs };

    if (name === 'path') {
      const shape = pathPrimitive(attrs.d || '', matrix, inherited);
      if (shape) out.push(shape);
    } else if (name === 'line') {
      const x2 = Number(attrs.x2 || 0), y2 = Number(attrs.y2 || 0);
      const d = `M0,0L${x2},${y2}`;
      const shape = pathPrimitive(d, matrix, inherited);
      if (shape) out.push(shape);
    } else if (name === 'rect') {
      const x = Number(attrs.x || 0), y = Number(attrs.y || 0);
      const w = Number(attrs.width || 0), h = Number(attrs.height || 0);
      const d = `M${x},${y}h${w}v${h}h${-w}Z`;
      const shape = pathPrimitive(d, matrix, inherited);
      if (shape) out.push(shape);
    } else if (name === 'text') {
      // The content runs to the closing tag. Taking it here, rather than
      // letting the scanner meet it as a separate token, is what makes a label
      // comparable at all — the first cut of this harness never captured it and
      // silently compared nothing but shapes.
      const close = text.indexOf('</text>', tag.lastIndex);
      const content = close < 0 ? '' : text.slice(tag.lastIndex, close);
      if (close >= 0) tag.lastIndex = close + 7;
      const [x, y] = apply(matrix, 0, 0);
      out.push({
        kind: 'text',
        x, y,
        angle: Math.round(Math.atan2(matrix[1], matrix[0]) * 180 / Math.PI * 100) / 100,
        anchor: inherited['text-anchor'] || 'start',
        fontSize: parseFloat(inherited['font-size'] || '11'),
        fontWeight: String(inherited['font-weight'] || ''),
        fill: normalizeColour(inherited.fill),
        opacity: Number(inherited.opacity ?? 1),
        text: decodeEntities(content)
      });
    }
  }
  return out.filter(p => p.kind !== 'text' || (p.text !== '' && p.opacity > 0));
}

function decodeEntities(s) {
  return String(s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function normalizeColour(c) {
  if (c === undefined || c === null || c === '' || c === 'none') return '';
  const text = String(c).trim().toLowerCase();
  const named = { white: '#ffffff', black: '#000000', transparent: '' };
  if (named[text] !== undefined) return named[text];
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(text);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  const rgb = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(text);
  if (rgb) return '#' + [1, 2, 3].map(i => Number(rgb[i]).toString(16).padStart(2, '0')).join('');
  return text;
}

/**
 * A path element as an outline, or null if it leaves no ink. "No ink" is not a
 * shortcut: a group's background path with no fill and no stroke, and a
 * foreground path with an empty `d`, are in the reference's output for reasons
 * that have nothing to do with what the chart looks like.
 */
function pathPrimitive(d, matrix, attrs) {
  if (attrs.display === 'none') return null;
  const fill = normalizeColour(attrs.fill);
  const stroke = normalizeColour(attrs.stroke);
  const opacity = Number(attrs.opacity ?? 1);
  const fillOpacity = Number(attrs['fill-opacity'] ?? 1);
  const strokeOpacity = Number(attrs['stroke-opacity'] ?? 1);
  const strokeWidth = attrs['stroke-width'] === undefined ? 1 : Number(attrs['stroke-width']);

  const paints = (fill && fillOpacity > 0) || (stroke && strokeWidth > 0 && strokeOpacity > 0);
  if (!paints || opacity === 0) return null;

  const subpaths = flattenPath(d).map(pts => pts.map(([x, y]) => apply(matrix, x, y)));
  const points = subpaths.flat();
  if (points.length === 0) return null;
  // A path that encloses nothing and spans nothing is not a shape.
  const box = bounds(points);
  if (box.width === 0 && box.height === 0) return null;

  return {
    kind: 'shape',
    subpaths,
    points,
    box,
    fill, stroke, strokeWidth,
    opacity, fillOpacity, strokeOpacity,
    dash: (attrs['stroke-dasharray'] || '').replace(/\s+/g, ''),
    gradient: fill.startsWith('url('),
  };
}

function bounds(points) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of points) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1, width: x1 - x0, height: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

// -----------------------------------------------------------------------------
// path data → points
// -----------------------------------------------------------------------------

// How finely a curve is chopped before it is compared. The step count follows
// the curve's SIZE rather than being a constant: a fixed count samples a
// 300px-wide arc so coarsely that the chords sag three quarters of a pixel
// inside it, and the comparison then reports the sag as a difference in the
// chart. The target is a twentieth of a pixel, well under the tolerance.
const FLATNESS = 0.05;

function stepsFor(span) {
  return Math.max(4, Math.min(400, Math.ceil(span / 3)));
}

function flattenPath(d) {
  const tokens = String(d).match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
  const subpaths = [];
  let current = null;
  let x = 0, y = 0, startX = 0, startY = 0;
  let lastControl = null;
  let command = '';
  let i = 0;

  const push = (px, py) => {
    if (!current) { current = []; subpaths.push(current); }
    current.push([px, py]);
  };
  const num = () => Number(tokens[i++]);

  while (i < tokens.length) {
    const token = tokens[i];
    if (/[A-Za-z]/.test(token)) { command = token; i++; }
    else if (command === 'M') command = 'L';
    else if (command === 'm') command = 'l';

    const relative = command === command.toLowerCase();
    const base = command.toUpperCase();

    if (base === 'Z') {
      if (current && current.length) { push(startX, startY); }
      current = null;
      x = startX; y = startY;
      continue;
    }
    if (base === 'M') {
      const nx = num(), ny = num();
      x = relative ? x + nx : nx;
      y = relative ? y + ny : ny;
      current = null;
      push(x, y);
      startX = x; startY = y;
      lastControl = null;
      continue;
    }
    if (base === 'L') {
      const nx = num(), ny = num();
      x = relative ? x + nx : nx;
      y = relative ? y + ny : ny;
      push(x, y);
      lastControl = null;
      continue;
    }
    if (base === 'H') {
      const nx = num();
      x = relative ? x + nx : nx;
      push(x, y);
      lastControl = null;
      continue;
    }
    if (base === 'V') {
      const ny = num();
      y = relative ? y + ny : ny;
      push(x, y);
      lastControl = null;
      continue;
    }
    if (base === 'C' || base === 'S') {
      let c1x, c1y;
      if (base === 'C') {
        c1x = num(); c1y = num();
        if (relative) { c1x += x; c1y += y; }
      } else {
        c1x = lastControl ? 2 * x - lastControl[0] : x;
        c1y = lastControl ? 2 * y - lastControl[1] : y;
      }
      let c2x = num(), c2y = num(), ex = num(), ey = num();
      if (relative) { c2x += x; c2y += y; ex += x; ey += y; }
      cubic(push, x, y, c1x, c1y, c2x, c2y, ex, ey);
      lastControl = [c2x, c2y];
      x = ex; y = ey;
      continue;
    }
    if (base === 'Q' || base === 'T') {
      let cx, cy;
      if (base === 'Q') {
        cx = num(); cy = num();
        if (relative) { cx += x; cy += y; }
      } else {
        cx = lastControl ? 2 * x - lastControl[0] : x;
        cy = lastControl ? 2 * y - lastControl[1] : y;
      }
      let ex = num(), ey = num();
      if (relative) { ex += x; ey += y; }
      // A quadratic is a cubic whose controls are two thirds of the way over.
      cubic(push, x, y, x + 2 / 3 * (cx - x), y + 2 / 3 * (cy - y),
            ex + 2 / 3 * (cx - ex), ey + 2 / 3 * (cy - ey), ex, ey);
      lastControl = [cx, cy];
      x = ex; y = ey;
      continue;
    }
    if (base === 'A') {
      const rx = num(), ry = num(), rotation = num(), largeArc = num(), sweep = num();
      let ex = num(), ey = num();
      if (relative) { ex += x; ey += y; }
      arc(push, x, y, rx, ry, rotation, largeArc, sweep, ex, ey);
      lastControl = null;
      x = ex; y = ey;
      continue;
    }
    i++;  // an unknown command: skip its letter rather than spin
  }
  return subpaths.filter(p => p.length > 0);
}

function cubic(push, x0, y0, x1, y1, x2, y2, x3, y3) {
  const span = Math.hypot(x1 - x0, y1 - y0) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x3 - x2, y3 - y2);
  const steps = stepsFor(span);
  for (let k = 1; k <= steps; k++) {
    const t = k / steps, u = 1 - t;
    push(
      u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
      u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3
    );
  }
}

/** The SVG arc, turned into its centre form — the same conversion every
 *  renderer does, written out here so both sides get it identically. */
function arc(push, x0, y0, rx, ry, rotation, largeArc, sweep, x1, y1) {
  if (rx === 0 || ry === 0) { push(x1, y1); return; }
  rx = Math.abs(rx); ry = Math.abs(ry);
  const phi = rotation * Math.PI / 180;
  const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);
  const dx = (x0 - x1) / 2, dy = (y0 - y1) / 2;
  const x1p = cosPhi * dx + sinPhi * dy;
  const y1p = -sinPhi * dx + cosPhi * dy;

  let lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) { const s = Math.sqrt(lambda); rx *= s; ry *= s; }

  const sign = largeArc === sweep ? -1 : 1;
  const numerator = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const denominator = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const co = sign * Math.sqrt(Math.max(0, numerator / denominator));
  const cxp = co * rx * y1p / ry;
  const cyp = -co * ry * x1p / rx;
  const cx = cosPhi * cxp - sinPhi * cyp + (x0 + x1) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y0 + y1) / 2;

  const angleOf = (ux, uy) => Math.atan2(uy, ux);
  const theta = angleOf((x1p - cxp) / rx, (y1p - cyp) / ry);
  let delta = angleOf((-x1p - cxp) / rx, (-y1p - cyp) / ry) - theta;
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;

  // A step small enough that the chord sags less than FLATNESS inside the arc.
  const radius = Math.max(rx, ry);
  const stepAngle = radius > FLATNESS ? 2 * Math.acos(Math.max(-1, 1 - FLATNESS / radius)) : Math.PI / 4;
  const steps = Math.max(6, Math.min(2000, Math.ceil(Math.abs(delta) / stepAngle)));
  for (let k = 1; k <= steps; k++) {
    const a = theta + delta * (k / steps);
    const px = cx + rx * Math.cos(a) * cosPhi - ry * Math.sin(a) * sinPhi;
    const py = cy + rx * Math.cos(a) * sinPhi + ry * Math.sin(a) * cosPhi;
    push(px, py);
  }
}

// -----------------------------------------------------------------------------
// comparison
// -----------------------------------------------------------------------------

/**
 * The furthest either outline strays from the other, in pixels. Symmetric, and
 * blind to where a path started and which way round it went — which is what
 * lets two circles written as arcs and as cubics compare equal.
 *
 * Distance is measured from each sampled point to the nearest SEGMENT of the
 * other outline, not to its nearest sampled point. Point-to-point would be
 * measuring how finely each side happened to be flattened: two identical
 * circles chopped into different numbers of chords would read as half a chord
 * apart, and a pie's wedge — flattened coarsely because a wedge is smooth —
 * would look 1.6px wrong while being exactly right.
 */
function hausdorff(a, b, cutoff) {
  return Math.max(directed(a.points, b.subpaths, cutoff),
                  directed(b.points, a.subpaths, cutoff));
}

function directed(points, subpaths, cutoff) {
  let worst = 0;
  for (const p of points) {
    let best = Infinity;
    for (const line of subpaths) {
      for (let i = 1; i < line.length; i++) {
        const d = pointToSegment(p, line[i - 1], line[i]);
        if (d < best) best = d;
      }
      if (line.length === 1) {
        const dx = p[0] - line[0][0], dy = p[1] - line[0][1];
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < best) best = d;
      }
      if (best === 0) break;
    }
    if (best > worst) {
      worst = best;
      if (worst > cutoff) return worst;   // already failing; no need to be exact
    }
  }
  return worst;
}

function pointToSegment(p, a, b) {
  const vx = b[0] - a[0], vy = b[1] - a[1];
  const wx = p[0] - a[0], wy = p[1] - a[1];
  const len = vx * vx + vy * vy;
  let t = len === 0 ? 0 : (wx * vx + wy * vy) / len;
  if (t < 0) t = 0; else if (t > 1) t = 1;
  const dx = wx - t * vx, dy = wy - t * vy;
  return Math.sqrt(dx * dx + dy * dy);
}

function paintOf(s) {
  return [
    s.fill || '-',
    s.stroke || '-',
    s.stroke ? round(s.strokeWidth, 2) : '-',
    round(s.opacity, 3),
    round(s.fillOpacity, 3),
    round(s.strokeOpacity, 3),
    s.dash || '-'
  ].join('/');
}

function round(v, places) {
  const f = Math.pow(10, places);
  return Math.round(v * f) / f;
}

/**
 * Pair each reference primitive with the closest Vela one that has not been
 * claimed. Greedy, and pairing is by position rather than by document order:
 * both walk the scene the same way, but a missing shape would otherwise put
 * everything after it out of step and report one difference as fifty.
 */
function comparePrimitives(refs, gots) {
  const findings = [];
  const taken = new Set();
  let matched = 0;

  for (const ref of refs) {
    // A gradient is the one thing Vela draws differently ON PURPOSE. No target
    // it compiles to paints one, so a ramp is drawn as its own stops — one flat
    // band per pair, in the reference's own stop colours. What has to be true
    // is that the bands tile exactly the rectangle the reference filled; that
    // is checked here rather than reported as forty separate differences.
    if (ref.gradient) {
      const bands = [];
      for (let i = 0; i < gots.length; i++) {
        if (taken.has(i) || gots[i].kind !== 'shape') continue;
        if (within(gots[i].box, ref.box)) bands.push(i);
      }
      const covered = bands.reduce((sum, i) => sum + gots[i].box.width * gots[i].box.height, 0);
      const wanted = ref.box.width * ref.box.height;
      bands.forEach(i => taken.add(i));
      if (bands.length === 0) {
        findings.push(`gradient at ${round(ref.box.cx, 1)},${round(ref.box.cy, 1)} was not drawn`);
      } else if (Math.abs(covered - wanted) > 0.5 || !sameBox(union(bands.map(i => gots[i].box)), ref.box)) {
        findings.push(`gradient at ${round(ref.box.cx, 1)},${round(ref.box.cy, 1)}: `
          + `${bands.length} bands covering ${round(covered, 1)} of ${round(wanted, 1)} square pixels`);
      } else {
        matched++;
      }
      continue;
    }

    let bestIndex = -1;
    let bestScore = Infinity;
    for (let i = 0; i < gots.length; i++) {
      if (taken.has(i)) continue;
      const got = gots[i];
      if (got.kind !== ref.kind) continue;
      const score = ref.kind === 'text'
        ? Math.abs(ref.x - got.x) + Math.abs(ref.y - got.y) + (ref.text === got.text ? 0 : 1000)
        : Math.abs(ref.box.cx - got.box.cx) + Math.abs(ref.box.cy - got.box.cy)
          + Math.abs(ref.box.width - got.box.width) + Math.abs(ref.box.height - got.box.height);
      if (score < bestScore) { bestScore = score; bestIndex = i; }
    }
    if (bestIndex < 0) {
      findings.push(describeMissing(ref));
      continue;
    }
    taken.add(bestIndex);
    const got = gots[bestIndex];
    const diff = ref.kind === 'text' ? diffText(ref, got) : diffShape(ref, got);
    if (diff) findings.push(diff); else matched++;
  }
  for (let i = 0; i < gots.length; i++) {
    if (!taken.has(i)) findings.push(`drawn but not in the reference: ${describeMissing(gots[i])}`);
  }
  return { matched, total: refs.length, findings };
}

function within(inner, outer) {
  return inner.x0 >= outer.x0 - 0.01 && inner.x1 <= outer.x1 + 0.01
      && inner.y0 >= outer.y0 - 0.01 && inner.y1 <= outer.y1 + 0.01;
}

function union(boxes) {
  return {
    x0: Math.min(...boxes.map(b => b.x0)), y0: Math.min(...boxes.map(b => b.y0)),
    x1: Math.max(...boxes.map(b => b.x1)), y1: Math.max(...boxes.map(b => b.y1))
  };
}

function sameBox(a, b) {
  return Math.abs(a.x0 - b.x0) < 0.02 && Math.abs(a.x1 - b.x1) < 0.02
      && Math.abs(a.y0 - b.y0) < 0.02 && Math.abs(a.y1 - b.y1) < 0.02;
}

function describeMissing(p) {
  if (p.kind === 'text') return `text "${p.text}" at ${round(p.x, 1)},${round(p.y, 1)}`;
  return `shape ${round(p.box.width, 1)}x${round(p.box.height, 1)} at ${round(p.box.cx, 1)},${round(p.box.cy, 1)} (${paintOf(p)})`;
}

function diffShape(ref, got) {
  const distance = hausdorff(ref, got, INK * 40);
  const where = `at ${round(ref.box.cx, 1)},${round(ref.box.cy, 1)} (${ref.fill || ref.stroke})`;
  if (distance > INK) {
    return `outline ${where} is out by ${round(distance, 2)}px `
         + `(${round(got.box.width, 1)}x${round(got.box.height, 1)} vs ${round(ref.box.width, 1)}x${round(ref.box.height, 1)})`;
  }
  if (paintOf(ref) !== paintOf(got)) {
    return `paint ${where}: ${paintOf(got)} != ${paintOf(ref)}`;
  }
  return null;
}

function diffText(ref, got) {
  const where = `"${ref.text}"`;
  if (ref.text !== got.text) return `text ${where} != "${got.text}"`;
  if (Math.abs(ref.x - got.x) > TEXT_TOLERANCE || Math.abs(ref.y - got.y) > TEXT_TOLERANCE) {
    return `text ${where} anchored at ${round(got.x, 2)},${round(got.y, 2)} != ${round(ref.x, 2)},${round(ref.y, 2)}`;
  }
  if (ref.anchor !== got.anchor) return `text ${where} anchor ${got.anchor} != ${ref.anchor}`;
  if (Math.abs(ref.fontSize - got.fontSize) > 0.01) return `text ${where} size ${got.fontSize} != ${ref.fontSize}`;
  if (weightOf(ref) !== weightOf(got)) return `text ${where} weight ${weightOf(got)} != ${weightOf(ref)}`;
  if (Math.abs(ref.angle - got.angle) > 0.01) return `text ${where} angle ${got.angle} != ${ref.angle}`;
  if (ref.fill !== got.fill) return `text ${where} fill ${got.fill} != ${ref.fill}`;
  return null;
}

function weightOf(t) {
  const w = String(t.fontWeight || '').toLowerCase();
  if (w === '' || w === 'normal' || w === '400') return 'normal';
  if (w === 'bold' || w === '700') return 'bold';
  return w;
}

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
