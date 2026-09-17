// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Display lists to measure against, made rather than captured.
//
// A captured page — `../boxmodel.json` — says what a real document costs, and
// the bench draws that too. What it cannot do is separate the two things this
// spike is actually asking about, because a real page has one of each: how a
// painter scales with the NUMBER OF QUADS (memory, upload, fill), and how it
// scales with the NUMBER OF RUNS (driver calls, state changes). WebGL pays 18
// calls per run and WebGPU pays 1, so a list with 40 runs and one with 4000
// are different questions and a fixed page answers neither.
//
// Every scene is a plain EVG document: the same shape `evg_displaylist_tool`
// writes and every painter in this repository reads.

const KIND = { RECT: 0, BORDER: 1, IMAGE: 2, TEXT: 3, PUSH_CLIP: 4, POP_CLIP: 5 };

// A deterministic generator, so two painters draw the same picture and a
// re-run of the bench compares with the last one.
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

const PALETTE = [
  [251, 247, 240], [232, 220, 200], [176, 141, 87], [59, 47, 42],
  [138, 115, 96], [98, 125, 152], [180, 90, 70], [120, 150, 110],
];

/**
 * `quads` rounded rectangles over `runs` clipped regions.
 *
 * The clips are what make the runs: a PUSH_CLIP ends the batch being gathered
 * in both painters, so `runs` is the knob that isolates per-draw-call cost
 * from per-quad cost.
 */
// `quads` counts the boxes asked for; the scene emits a few more — a border
// command per seventh box, a shadow quad per shadowed one — so the painter's
// own instance count is the number to quote, and both painters report it.
export function grid({ quads = 4000, runs = 1, text = 0, width = 1280, height = 900, seed = 7, shadows = 0 } = {}) {
  const rnd = rng(seed);
  const cmds = [];
  cmds.push({ k: KIND.RECT, x: 0, y: 0, w: width, h: height, c: [251, 247, 240, 1] });

  const perRun = Math.max(1, Math.floor(quads / Math.max(1, runs)));
  const cols = Math.ceil(Math.sqrt(runs));
  const cw = width / cols;
  const ch = height / Math.ceil(runs / cols);

  for (let r = 0; r < runs; r += 1) {
    const cx = (r % cols) * cw;
    const cy = Math.floor(r / cols) * ch;
    if (runs > 1) cmds.push({ k: KIND.PUSH_CLIP, x: cx, y: cy, w: cw, h: ch, c: [0, 0, 0, 1] });
    for (let i = 0; i < perRun; i += 1) {
      const w = 8 + rnd() * Math.min(120, cw);
      const h = 8 + rnd() * Math.min(80, ch);
      const col = PALETTE[(i + r) % PALETTE.length];
      const c = {
        k: KIND.RECT,
        x: cx + rnd() * Math.max(1, cw - w),
        y: cy + rnd() * Math.max(1, ch - h),
        w, h,
        r: Math.round(rnd() * 12),
        c: [col[0], col[1], col[2], 0.35 + rnd() * 0.65],
      };
      // A gradient on one in five, a shadow on as many as asked for: a real
      // page is a mixture, and a scene of one kind of box measures a branch
      // that never runs alone.
      if (i % 5 === 0) { c.gd = 1; c.c2 = [255, 255, 255, 0.9]; }
      if (shadows && i % Math.max(1, Math.round(perRun / shadows)) === 0) {
        c.sh = { x: 0, y: 2, blur: 8, c: [0, 0, 0, 0.25] };
      }
      cmds.push(c);
      // A BORDER IS ITS OWN COMMAND, not a thickness on the fill. EVG emits it
      // that way — `EVGDisplayList` writes a RECT and then a BORDER over it —
      // and a painter that honours `t` on a RECT draws an outline where the
      // page has a filled box. Which is exactly what this spike's first parity
      // run showed: 30% of the pixels differed, and the scene was at fault
      // rather than either painter.
      if (i % 7 === 0) {
        cmds.push({
          k: KIND.BORDER, x: c.x, y: c.y, w: c.w, h: c.h, r: c.r,
          t: 1 + Math.round(rnd() * 2), c: [59, 47, 42, 0.8],
        });
      }
    }
    if (runs > 1) cmds.push({ k: KIND.POP_CLIP, x: cx, y: cy, w: cw, h: ch, c: [0, 0, 0, 1] });
  }

  for (let i = 0; i < text; i += 1) {
    cmds.push({
      k: KIND.TEXT,
      x: 12 + (i % 8) * 150,
      y: 12 + Math.floor(i / 8) * 22,
      w: 140, h: 18,
      c: [59, 47, 42, 1],
      // Distinct strings on purpose: one slot per RUN means a scene of one
      // repeated label has an atlas of one entry and measures nothing.
      text: `run ${i} — Ääkköset ${(i * 37) % 991}`,
      font: "sans-serif",
      size: 13,
    });
  }

  return { width, height, list: { shifts: [[0, 0]], cmds } };
}

/**
 * A scrolling document: one layer, many rows, each row its own clip.
 *
 * This is the shape a scroll actually has in EVG — a layer whose shift changes
 * while nothing else does — and therefore the case where a kept frame, a
 * uniform and a replayed bundle either pay off or do not.
 */
export function scroller({ rows = 400, perRow = 12, width = 1280, height = 900, seed = 11 } = {}) {
  const rnd = rng(seed);
  const cmds = [];
  cmds.push({ k: KIND.RECT, x: 0, y: 0, w: width, h: height, c: [251, 247, 240, 1] });
  cmds.push({ k: KIND.PUSH_CLIP, x: 0, y: 60, w: width, h: height - 60, layer: 1, c: [0, 0, 0, 1] });
  const rowH = 34;
  for (let r = 0; r < rows; r += 1) {
    const y = 60 + r * rowH;
    cmds.push({ k: KIND.RECT, x: 8, y: y + 2, w: width - 16, h: rowH - 4, r: 4, c: r % 2 ? [255, 255, 255, 1] : [244, 240, 232, 1] });
    for (let i = 0; i < perRow; i += 1) {
      const col = PALETTE[(r + i) % PALETTE.length];
      cmds.push({
        k: KIND.RECT,
        x: 16 + i * ((width - 40) / perRow),
        y: y + 8,
        w: ((width - 40) / perRow) - 8,
        h: rowH - 16,
        r: 3,
        c: [col[0], col[1], col[2], 0.5 + rnd() * 0.5],
      });
    }
  }
  cmds.push({ k: KIND.POP_CLIP, x: 0, y: 60, w: width, h: height - 60, c: [0, 0, 0, 1] });
  return { width, height, list: { shifts: [[0, 0], [0, 0]], cmds } };
}


/**
 * ONE FEATURE AT A TIME, big enough to see.
 *
 * A mixed scene tells you the two painters disagree; it does not tell you
 * about what. These do: eight boxes of one kind on a plain background, so a
 * parity failure names the command that caused it instead of a percentage.
 */
export function feature(which, { width = 640, height = 450 } = {}) {
  const cmds = [{ k: KIND.RECT, x: 0, y: 0, w: width, h: height, c: [251, 247, 240, 1] }];
  const box = (i) => ({ x: 30 + (i % 4) * 150, y: 40 + Math.floor(i / 4) * 190, w: 120, h: 150 });
  for (let i = 0; i < 8; i += 1) {
    const b = box(i);
    const col = PALETTE[(i + 2) % PALETTE.length];
    if (which === "flat") {
      cmds.push({ k: KIND.RECT, ...b, c: [col[0], col[1], col[2], 1] });
    } else if (which === "alpha") {
      cmds.push({ k: KIND.RECT, ...b, c: [col[0], col[1], col[2], 0.15 + i * 0.1] });
    } else if (which === "radius") {
      cmds.push({ k: KIND.RECT, ...b, r: i * 7, c: [col[0], col[1], col[2], 1] });
    } else if (which === "percorner") {
      cmds.push({ k: KIND.RECT, ...b, rc: [0, i * 5, 30, i * 3], c: [col[0], col[1], col[2], 1] });
    } else if (which === "gradient") {
      cmds.push({ k: KIND.RECT, ...b, gd: i % 2 ? 2 : 1, c: [col[0], col[1], col[2], 1], c2: [255, 255, 255, 1] });
    } else if (which === "border") {
      cmds.push({ k: KIND.RECT, ...b, r: 8, c: [255, 255, 255, 1] });
      cmds.push({ k: KIND.BORDER, ...b, r: 8, t: 1 + i, c: [59, 47, 42, 1] });
    } else if (which === "shadow") {
      cmds.push({ k: KIND.RECT, ...b, r: 8, c: [255, 255, 255, 1], sh: { x: 0, y: 3, blur: 2 + i * 3, c: [0, 0, 0, 0.4] } });
    } else if (which === "rotate") {
      cmds.push({ k: KIND.RECT, ...b, r: 6, rot: i * 11, c: [col[0], col[1], col[2], 1] });
    } else if (which === "text") {
      cmds.push({ k: KIND.RECT, ...b, c: [255, 255, 255, 1] });
      cmds.push({ k: KIND.TEXT, x: b.x + 8, y: b.y + 20, w: 100, h: 20, c: [40, 30, 25, 1],
                  text: "Ag " + i + " Ää", font: "sans-serif", size: 12 + i * 2 });
    }
  }
  return { width, height, list: { shifts: [[0, 0]], cmds } };
}

export const FEATURES = ["flat", "alpha", "radius", "percorner", "gradient", "border", "shadow", "rotate", "text"];

/** The scenes the bench knows by name, and the sizes it runs them at. */
export const SCENES = {
  "grid-1k-1run": () => grid({ quads: 1000, runs: 1 }),
  "grid-10k-1run": () => grid({ quads: 10000, runs: 1 }),
  "grid-50k-1run": () => grid({ quads: 50000, runs: 1 }),
  "grid-10k-100runs": () => grid({ quads: 10000, runs: 100 }),
  "grid-10k-1000runs": () => grid({ quads: 10000, runs: 1000 }),
  "grid-10k-text200": () => grid({ quads: 10000, runs: 1, text: 200 }),
  "grid-10k-shadows": () => grid({ quads: 10000, runs: 1, shadows: 400 }),
  "scroller-400": () => scroller({ rows: 400 }),
  ...Object.fromEntries(FEATURES.map((f) => [`feature-${f}`, () => feature(f)])),
};

/**
 * What the bench runs when it is not told otherwise.
 *
 * Everything in SCENES is runnable by name; this list is the subset that
 * finishes. `grid-50k-1run` and the nine `feature-*` scenes are left out — the
 * first because a software rasteriser takes minutes over it and it only
 * repeats what the 10k scene already shows about build scaling, the rest
 * because they exist to localise a PARITY failure and measure nothing.
 */
export const DEFAULT_SCENES = [
  "grid-1k-1run",
  "grid-10k-1run",
  "grid-10k-100runs",
  "grid-10k-1000runs",
  "grid-10k-text200",
  "grid-10k-shadows",
  "scroller-400",
];
