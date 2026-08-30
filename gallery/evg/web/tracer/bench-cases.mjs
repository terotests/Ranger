/**
 * tracer/bench-cases.mjs — six pictures, graded, with their answers.
 *
 * Harder than a few flat shapes, easier than a photograph, and generated so
 * they can be committed and are the same every run. Five of the six share one
 * silhouette so that difficulty moves along a single axis — what the two sides
 * look like — and only the last changes the shape, to ask a different question.
 */
const W = 320, H = 400;

// Deterministic noise. Nothing here may depend on Math.random.
function lcg(seed) {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff) / 0x7fffffff;
}

// The shared silhouette: head, shoulders, body.
function figureBody(x, y) {
  const hx = x - 160, hy = y - 92;
  if (hx * hx / (44 * 44) + hy * hy / (52 * 52) <= 1) return true;
  if (y < 140 || y > 380) return false;
  const half = 84 - Math.max(0, (186 - y) * 0.42);
  return Math.abs(x - 160) <= half;
}

// The last case: thin arms and a hole, to ask about recall of narrow things.
function figureLimbs(x, y) {
  if (figureBody(x, y)) {
    const hx = x - 160, hy = y - 250;
    if (hx * hx + hy * hy <= 30 * 30) return false;      // a hole right through
    return true;
  }
  if (y > 196 && y < 214 && x > 236 && x < 306) return true;   // right arm, 18 px
  if (y > 210 && y < 226 && x > 20 && x < 84) return true;     // left arm, 16 px
  return false;
}

const FIG = [[46, 74, 132], [58, 104, 150], [92, 132, 176], [34, 52, 96], [150, 176, 202]];
const BG  = [[168, 152, 132], [140, 126, 110], [196, 182, 162], [112, 100, 88], [214, 204, 188]];

function put(px, x, y, c) {
  const o = (y * W + x) * 4;
  px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255;
}

function speckle(px, inFig, n, seed, fig, bg) {
  const rnd = lcg(seed);
  for (let k = 0; k < n; k++) {
    const cx = (rnd() * W) | 0, cy = (rnd() * H) | 0, rad = 1 + ((rnd() * 3) | 0);
    // A speck wears the other side's colour — that is what makes it a speck
    // and not a shade.
    const c = inFig(cx, cy) ? bg[(rnd() * bg.length) | 0] : fig[(rnd() * fig.length) | 0];
    for (let y = cy - rad; y <= cy + rad; y++) {
      for (let x = cx - rad; x <= cx + rad; x++) {
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) > rad * rad) continue;
        put(px, x, y, c);
      }
    }
  }
}

export const CASES = [
  {
    name: "1-flat",
    truth: "figureBody",
    what: "yksi väri kummallakin puolella, terävä reuna",
    inFigure: figureBody,
    draw(px) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        put(px, x, y, figureBody(x, y) ? FIG[0] : BG[0]);
      }
    },
  },
  {
    name: "2-bands",
    truth: "figureBody",
    what: "kumpikin puoli monisävyinen, sävyperheet erillään",
    inFigure: figureBody,
    draw(px) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const f = figureBody(x, y);
        const b = (((x * 0.6 + y * 1.4) / 46) | 0) % 4;
        put(px, x, y, f ? FIG[b] : BG[b]);
      }
    },
  },
  {
    name: "3-speckle",
    truth: "figureBody",
    what: "monisävyinen ja kohinainen: kumpikin puoli kantaa toisen värejä pilkkuina",
    inFigure: figureBody,
    draw(px) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const f = figureBody(x, y);
        const b = (((x * 0.6 + y * 1.4) / 46) | 0) % 4;
        put(px, x, y, f ? FIG[b] : BG[b]);
      }
      speckle(px, figureBody, 320, 7, FIG, BG);
    },
  },
  {
    name: "4-gradient",
    truth: "figureBody",
    what: "tausta liukuu hahmon sävyn läpi jossain kohtaa",
    inFigure: figureBody,
    draw(px) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const f = figureBody(x, y);
        if (f) {
          const b = (((x * 0.6 + y * 1.4) / 46) | 0) % 4;
          put(px, x, y, FIG[b]);
          continue;
        }
        // Warm at the top, and by the bottom it has walked into the figure's
        // own blue — so a colour that is background here is foreground there.
        const t = y / H;
        put(px, x, y, [
          Math.round(BG[0][0] + (FIG[1][0] - BG[0][0]) * t),
          Math.round(BG[0][1] + (FIG[1][1] - BG[0][1]) * t),
          Math.round(BG[0][2] + (FIG[1][2] - BG[0][2]) * t),
        ]);
      }
      speckle(px, figureBody, 120, 11, FIG, BG);
    },
  },
  {
    name: "5-shared",
    truth: "figureBody",
    what: "sama paletti molemmilla, eri järjestys: väri ei erota, sijoittelu erottaa",
    inFigure: figureBody,
    draw(px) {
      const pal = [FIG[0], FIG[2], BG[0], BG[2], FIG[4]];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        // The figure wears the palette as fine vertical stripes, the
        // background as broad blocks. Every colour appears on both sides.
        const i = figureBody(x, y)
          ? ((x / 7) | 0) % pal.length
          : ((((x / 90) | 0) + ((y / 110) | 0) * 2) % pal.length);
        put(px, x, y, pal[i]);
      }
    },
  },
  {
    name: "6-limbs",
    truth: "figureLimbs",
    what: "ohuet raajat ja reikä läpi, kohtalainen kohina",
    inFigure: figureLimbs,
    draw(px) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const f = figureLimbs(x, y);
        const b = (((x * 0.6 + y * 1.4) / 46) | 0) % 4;
        put(px, x, y, f ? FIG[b] : BG[b]);
      }
      speckle(px, figureLimbs, 180, 13, FIG, BG);
    },
  },
];

// The picture the corrective stroke exists for: a decoy beside the figure,
// wearing the figure's own colours, close enough that one stroke down the
// middle takes it too. A ⌥ stroke over the decoy has to remove it — and that
// is a different question from "does a harmless ⌥ stroke leave things alone".
function decoy(x, y) {
  const dx = x - 236, dy = y - 300;
  return dx * dx / (46 * 46) + dy * dy / (72 * 72) <= 1;
}

CASES.push({
  name: "7-decoy",
  truth: "figureBody",
  what: "houkutin kiinni hahmossa, sen omilla väreillä — katto 0,89, koska jäljitys sulattaa ne osin yhteen",
  inFigure: figureBody,
  draw(px) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const b = (((x * 0.6 + y * 1.4) / 46) | 0) % 4;
      put(px, x, y, (figureBody(x, y) || decoy(x, y)) ? FIG[b] : BG[b]);
    }
    // A seam around the decoy, so the tracer keeps it as its own region rather
    // than merging it into the figure it touches. Without one the two are a
    // single traced shape and no region-based selector can tell them apart —
    // the ceiling itself falls to 0.89, which is the finding, not the test.
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!decoy(x, y)) continue;
      if (decoy(x - 3, y) && decoy(x + 3, y) && decoy(x, y - 3) && decoy(x, y + 3)) continue;
      put(px, x, y, FIG[3]);
    }
    speckle(px, function (x, y) { return figureBody(x, y) || decoy(x, y); }, 120, 17, FIG, BG);
  },
  // The corrective stroke goes over the decoy, in the picture's own terms.
  negOverride: [[252 / W, 262 / H], [258 / W, 340 / H]],
});

export const SIZE = { W, H };

// The truth has to travel into the browser to be scored there, and one of the
// two calls the other, so they go together.
export const TRUTH_SRC = figureBody.toString() + "\n" + figureLimbs.toString();
