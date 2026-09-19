/**
 * Element-scoped surface effects, in a real GL context.
 *
 *   node lib/evg/gl/fx-check.mjs [--write-png out.png]
 *
 * `evg-surface-effect` used to mean one post-process over the whole page, fed
 * by hand from the application's `pointerdown`. It now means an effect on an
 * ELEMENT: the stylesheet says which box has it and what starts it, the
 * display list carries the box the layout worked out, and a registered plugin
 * turns that into pixels. This checks the half of that claim which only pixels
 * can settle.
 *
 * Four things, and each one fails differently:
 *
 *   IT IS INSIDE THE BOX. A starfield on a card must put stars on the card and
 *   nothing whatsoever outside it. The mask is in the shared `main`, not in
 *   the plugin, so this is really asking whether a plugin CAN leak — and the
 *   page around the box is left untouched at exactly its own colour, which is
 *   a pixel comparison and not an impression.
 *
 *   IT IS UNDER THE CONTENT. A source effect is drawn where the element's own
 *   background is drawn, so anything the element contains is painted over it.
 *   Get the paint order wrong and a starfield is a sticker over the text — and
 *   it still looks like a starfield in a screenshot, which is why this is
 *   checked with a rectangle whose colour is known exactly.
 *
 *   IT MOVES. The same scene at two clocks must differ. A shader whose time
 *   uniform never arrives draws a perfectly good still picture, and every
 *   other check here passes on it.
 *
 *   A FILTER BENDS WHAT IS ALREADY THERE, inside its box and nowhere else.
 *   The ripple is the filter, and the case that matters is the surface OUTSIDE
 *   the box: it has to come back identical to the same page drawn with no
 *   effect at all, or "scoped to an element" is decoration on a full-screen
 *   pass.
 *
 * And two that are about not breaking: an effect nobody registered draws the
 * page without it rather than nothing, and the whole-surface effect that
 * predates all of this still runs.
 *
 * Exit code 0 when every probe holds.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MissingDomDeps, requireHostTool, findChromium } from "../../../gallery/ui/conformance/dom-adapter.mjs";
import { createEffectDriver } from "./evg-fx.js";
import { listOf } from "./evg-list.js";
import { readPresets } from "./effect-shots.mjs";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const W = 320;
const H = 220;
// The card, in page pixels. Everything below reads pixels relative to it.
const BOX = [60, 40, 200, 140];

const rect = (x, y, w, h, c, extra = {}) => ({ k: 0, x, y, w, h, c, ...extra });

/** The page under the card: white, so anything the effect leaks is visible. */
const PAGE_WHITE = rect(0, 0, W, H, [255, 255, 255, 1]);
/** The card itself: nearly black, because a starfield over white is a smudge. */
const SKY = [8, 10, 26, 1];

const starfield = (p, over) => ({
  width: W, height: H,
  cmds: [PAGE_WHITE, rect(BOX[0], BOX[1], BOX[2], BOX[3], SKY, { efx: "sky" })].concat(over || []),
  effects: [{ id: "sky", kind: "starfield", on: "always", box: BOX, p: { density: 2.2, nebula: 0.7, seed: 3, ...p }, time: p && p.__t || 0 }],
});

const SCENES = {
  // A sky on a card, at rest.
  sky: starfield({ speed: 0 }),
  // The same page with the effect taken out — the reference for "did anything
  // outside the box move". Comparing two renders rather than checking the
  // page against white on purpose: the painter antialiases the page rectangle
  // against the canvas edge, so the outermost column is not 255 in either
  // frame and never was the effect's doing.
  skyPlain: { width: W, height: H, cmds: [PAGE_WHITE, rect(BOX[0], BOX[1], BOX[2], BOX[3], SKY)] },
  // The same page with the effect DECLARED and switched off by the host. It
  // has to come back as the page without it, pixel for pixel — an effect that
  // is off is not an effect that is faint.
  skyOff: (() => {
    const scene = starfield({ speed: 0 });
    scene.effects[0].off = true;
    return scene;
  })(),
  // The same sky five seconds later, drifting.
  skyLater: starfield({ speed: 40, __t: 5 }),
  // The same sky with an opaque plate drawn AFTER the card — the element's
  // content, in effect.
  skyUnderPlate: starfield({ speed: 0 }, [rect(100, 70, 80, 60, [220, 30, 40, 1])]),
  // An effect name nothing has registered.
  unknown: {
    width: W, height: H,
    cmds: [PAGE_WHITE, rect(BOX[0], BOX[1], BOX[2], BOX[3], [30, 140, 70, 1], { efx: "nope" })],
    effects: [{ id: "nope", kind: "aurora-borealis", on: "always", box: BOX, p: {} }],
  },
};

/** Smoke on the same card, at a clock. A SOURCE effect like the starfield, so
 *  the arrangement is the same: a dark card, and the smoke is everything on it
 *  that is not the card. */
const smoke = (p) => ({
  width: W, height: H,
  cmds: [PAGE_WHITE, rect(BOX[0], BOX[1], BOX[2], BOX[3], SKY, { efx: "fog" })],
  effects: [{
    id: "fog", kind: "smoke", on: "always", box: BOX,
    p: { scale: 90, seed: 2, ...p }, time: (p && p.__t) || 0,
  }],
});
SCENES.smoke = smoke({});
SCENES.smokeLater = smoke({ rise: 0.35, __t: 4 });
SCENES.smokeTall = smoke({ height: 8 });

/** A hard black/white edge down the page, with and without a ripple in a box
 *  around the middle of it. The edge is what a displacement is visible on. */
const edgeCmds = (efx) => [
  rect(0, 0, W / 2, H, [0, 0, 0, 1]),
  rect(W / 2, 0, W / 2, H, [255, 255, 255, 1]),
  rect(BOX[0], BOX[1], BOX[2], BOX[3], [0, 0, 0, 0], efx ? { efx: "wet" } : {}),
];
SCENES.edgePlain = { width: W, height: H, cmds: edgeCmds(false) };
SCENES.edgeRippled = {
  width: W, height: H,
  cmds: edgeCmds(true),
  effects: [{
    id: "wet", kind: "ripple", on: "press", box: BOX,
    // Slow and strong, so one ring is well inside the box at this age and the
    // displacement is far larger than any rounding.
    p: { speed: 120, width: 34, strength: 26, decay: 0.6, rings: 1, shine: 0, highlight: 0 },
    // OFF THE EDGE, not on it. A ring centred on the edge pushes the surface
    // along the edge, which moves a vertical boundary by nothing at all — the
    // displacement is radial, so it has to arrive at an angle to be visible.
    events: [[BOX[0] + 60, BOX[1] + BOX[3] / 2, 0.42]],
    time: 0.42,
  }],
};

/** A page of stripes, a glass pane over part of it, and a plate drawn AFTER
 *  the pane. Stripes because a refraction is a DISPLACEMENT: on a flat colour
 *  the most badly broken lens in the world looks perfect, and every check
 *  below would pass on a shader that returned its input. */
const stripes = () => {
  const out = [rect(0, 0, W, H, [10, 12, 30, 1])];
  for (let i = 0; i < W / 20; i += 1) {
    out.push(rect(i * 20, 0, 10, H, i % 2 ? [90, 140, 255, 1] : [240, 120, 190, 1]));
  }
  return out;
};
const GLASS = [50, 40, 220, 140];
// tint and shine off: what is left is the refraction alone, which is the thing
// these checks are about. A lift across the pane would pass "the middle is
// untouched" only by luck, and fail it honestly.
const GLASS_P = { thickness: 26, strength: 34, power: 2.2, disperse: 0.08, shine: 0, tint: 0 };
SCENES.stripesPlain = { width: W, height: H, cmds: stripes() };
// The same pane with a SWEEP on it, at two different clocks. A bar of light
// that never moves is a gradient somebody drew.
const swept = (t, extra) => ({
  width: W, height: H,
  cmds: stripes().concat([rect(GLASS[0], GLASS[1], GLASS[2], GLASS[3], [0, 0, 0, 0], { efx: "pane" })]),
  effects: [{
    id: "pane", kind: "liquid-glass", box: GLASS, r: 28, time: t,
    // `sweep-rim: 0` and a full duty: the bar itself, crossing evenly, which
    // is what the two checks below are about. The shaping is checked
    // separately, because a bar kept to the rim and a bar that is not there
    // look the same in the middle of a pane.
    p: { ...GLASS_P, sweep: 0.9, "sweep-width": 0.05, "sweep-speed": 0.5,
         "sweep-edge": 2.5, "sweep-rim": 0, "sweep-duty": 1, ...extra },
  }],
});
SCENES.sweptEarly = swept(0.2);
SCENES.sweptLater = swept(1.2);
// KEPT TO THE RIM. The same bar, weighted entirely to the bevel: the middle of
// the pane has to come back as if there were no bar at all, which is the
// difference between a light catching an edge and a line drawn across a window.
SCENES.sweptRim = swept(0.9, { "sweep-rim": 1 });
// AND PARKED. A third of the cycle crossing, the rest off the pane — at a
// clock past the pass there is no bar anywhere.
SCENES.sweptParked = swept(1.4, { "sweep-duty": 0.3 });
SCENES.stripesGlass = {
  width: W, height: H,
  cmds: stripes().concat([
    rect(GLASS[0], GLASS[1], GLASS[2], GLASS[3], [0, 0, 0, 0], { efx: "pane" }),
    // The element's own content, drawn after it: this must come back exactly
    // its own colour, or the pane is refracting what is in front of it. Up in
    // the pane's top-left corner, where it straddles the rim band — the part
    // most bent, and so the part where a wrong order would show first.
    rect(GLASS[0] + 12, GLASS[1] + 12, 70, 34, [20, 230, 120, 1]),
  ]),
  effects: [{ id: "pane", kind: "liquid-glass", box: GLASS, r: 28, p: GLASS_P }],
};

/** And the ORIGINAL whole-surface effect, which must still work unchanged. */
SCENES.legacy = {
  width: W, height: H,
  cmds: edgeCmds(false),
  effect: {
    kind: "ripple", drops: [[BOX[0] + 60, BOX[1] + BOX[3] / 2, 0.42]],
    speed: 120, width: 34, strength: 26, decay: 0.6, highlight: 0,
    rings: 1, stagger: 0.09, falloff: 0.62, shine: 0, gloss: 120, bump: 70,
    light: [-0.45, -0.65, 0.62],
  },
};

const painter = fs.readFileSync(path.join(HERE, "evg-webgl.js"), "utf8").replace(/^export /gm, "");

// THE CONTEXT A REAL PAGE ASKS FOR, and not the one that makes checking easy.
//
// These checks used to run with `preserveDrawingBuffer: true`, which on this
// driver hands out a SINGLE-SAMPLED default framebuffer. Every page in this
// repository asks for `antialias: true` without it and gets a MULTISAMPLED one
// — and a multisampled default framebuffer cannot be copied out of, which is
// exactly what a backdrop effect does mid-frame. So the checks passed on a
// painter that wiped the top half of the real demo page: the copy failed
// silently, and the pass wrote the black it got back over everything painted
// before the pane.
//
// So: the same attributes a page uses, and the pixels read the way a person
// sees them — `drawImage` onto a 2-D canvas in the SAME task as the render,
// while the drawing buffer is still valid, which is what a screenshot does and
// what `preserveDrawingBuffer` was standing in for.
const pageFor = (scene) => `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#fff">
<canvas id="c" width="${W}" height="${H}" style="width:${W}px;height:${H}px"></canvas>
<canvas id="read" width="${W}" height="${H}" style="display:none"></canvas>
<script>
${painter}
(async () => {
  try {
    const c = document.getElementById("c");
    const gl = c.getContext("webgl2", { antialias: true, alpha: false });
    const doc = ${JSON.stringify(scene)};
    const list = { cmds: doc.cmds };
    if (doc.effect) list.effect = doc.effect;
    if (doc.effects) list.effects = doc.effects;
    window.__stats = renderDisplayList(gl, { list, width: doc.width, height: doc.height }, { dpr: 1 });
    const ctx = document.getElementById("read").getContext("2d", { willReadFrequently: true });
    ctx.drawImage(c, 0, 0);
    window.__PX = Array.from(ctx.getImageData(0, 0, ${W}, ${H}).data);
  } catch (e) { window.__ERR__ = String(e && e.stack || e); }
  window.__DONE__ = true;
})();
</script></body>`;

// ---------------------------------------------------------------------------
// The driver, which needs no browser at all
// ---------------------------------------------------------------------------
//
// Everything above is about pixels. This is about WHO GETS THE EVENT, which is
// the other half of "the document decides": a press inside a box whose sheet
// asked for one, and nothing at all otherwise. It runs first because it needs
// no GPU, so a failure here is not hidden behind a browser launch.
let bad = 0, checked = 0;
const say = (ok, name, detail) => {
  checked += 1;
  if (ok) { console.log("  PASS " + name); return; }
  bad += 1;
  console.log("  FAIL " + name + (detail ? "\n        " + detail : ""));
};

console.log("=== element-scoped surface effects ===");
console.log("");
console.log("-- the driver: which box gets the press");
{
  const list = {
    effects: [
      { id: "sky", kind: "starfield", on: "always", box: [0, 0, 300, 100], p: {} },
      { id: "pool", kind: "ripple", on: "press drag", box: [40, 120, 120, 80], p: {} },
      { id: "quiet", kind: "ripple", box: [200, 120, 80, 80], p: {} },
    ],
  };
  const fx = createEffectDriver();
  fx.tick(0, list);

  say(fx.press(100, 160) !== null, "a press inside the box that asked for one lands");
  say(list.effects[1].events.length === 1 || fx.tick(0, list) === true && list.effects[1].events.length === 1,
    "and the instance carries it");
  say(fx.press(240, 160) === null, "a press on a box that declared no trigger does nothing",
    "`evg-surface-effect` without `evg-effect-on` is an effect the application drives — " +
    "the driver must not adopt it");
  say(fx.press(150, 250) === null, "and a press on nothing at all does nothing");
  say(fx.hover(100, 160) === null, "a hover where only a press was asked for does nothing");

  // AGEING. The event is the same object the painter reads, so what the
  // driver does to it is what the shader sees.
  fx.tick(1000, list);
  const e = list.effects[1].events[0];
  say(Math.abs(e[2] - 1) < 0.01, `a second later it is a second old (${e[2].toFixed(2)})`);
  fx.tick(2500, list);
  say(list.effects[1].events.length === 0, "and past its life it is gone",
    "an event that never retires is a page that never stops drawing");

  // BUSY. A page with an `always` effect never stops; one with only idle
  // filters does.
  say(fx.busy() === true, "a page with an `always` effect is always busy");
  const idle = { effects: [{ id: "pool", kind: "ripple", on: "press", box: [0, 0, 10, 10], p: {} }] };
  const fx2 = createEffectDriver();
  fx2.tick(0, idle);
  say(fx2.busy() === false, "a page whose only effect is idle is not",
    "the host would keep asking for frames for an effect with nothing in flight");

  // SWITCHED OFF, in the driver as well as in the painter: an effect that is
  // not running must not swallow the press either.
  const withOff = {
    effects: [
      { id: "sleeping", kind: "ripple", on: "press", box: [0, 0, 200, 200], p: {}, off: true },
      { id: "awake", kind: "starfield", on: "always", box: [0, 0, 200, 200], p: {}, off: true },
    ],
  };
  const fxOff = createEffectDriver();
  fxOff.tick(0, withOff);
  say(fxOff.press(100, 100) === null, "a press on an effect that is switched off does nothing");
  say(fxOff.busy() === false, "and an `always` effect that is off does not keep the page drawing",
    "a switched-off starfield would burn a frame a second doing nothing");

  // THE TOPMOST ONE WINS, because two effects that overlap are a stack.
  const stacked = {
    effects: [
      { id: "under", kind: "ripple", on: "press", box: [0, 0, 200, 200], p: {} },
      { id: "over", kind: "ripple", on: "press", box: [50, 50, 100, 100], p: {} },
    ],
  };
  const fx3 = createEffectDriver();
  fx3.tick(0, stacked);
  const hit = fx3.press(100, 100);
  say(hit && hit.id === "over", "where two overlap, the one painted last takes the press",
    "paint order decides what is on top, and a press goes to what is on top");
}

console.log("");
console.log("-- the demo document, straight out of the engine");
{
  // The page the demo draws is generated by `npm run evg:fx:doc` from a Ranger
  // document whose effects are declared in a stylesheet. If that file is here,
  // hold it to what the sheet says — this is the seam between "CSS said so"
  // and "the painter drew it", and the only place both ends are visible.
  const demo = path.join(HERE, "fx-demo.js");
  if (!fs.existsSync(demo)) {
    console.log("  SKIP fx-demo.js is not built — run `npm run evg:fx:doc`");
  } else {
    const sandbox = { window: {} };
    new Function("window", fs.readFileSync(demo, "utf8"))(sandbox.window);
    const effects = sandbox.window.EVG_FX_DEMO.list.effects || [];
    const byId = Object.fromEntries(effects.map((e) => [e.id, e]));
    say(effects.length === 4, `four effects, one per element that declared one (${effects.length})`);
    say(byId.sky && byId.sky.kind === "starfield" && /always/.test(byId.sky.on || ""),
      "the sky is a starfield that runs on its own clock");
    say(byId.sky && byId.sky.p.density === 1.6 && byId.sky.p.hue2 === 305,
      "carrying the `evg-fx-*` numbers the sheet wrote",
      "a parameter the engine has never heard of did not survive the trip");
    say(byId.pool && byId.pool.box[2] === 250 && byId.pool.box[3] === 150,
      "and a pool's box is the one the layout gave it",
      "the box is not a rectangle anybody typed — it is where the element ended up");
    const carriers = (sandbox.window.EVG_FX_DEMO.list.cmds || []).filter((c) => c.efx).map((c) => c.efx);
    say(carriers.length === 4, `each one anchored in the command stream (${carriers.join(", ")})`);
    say(byId.glass && byId.glass.kind === "liquid-glass" && /always/.test(byId.glass.on || ""),
      "the pane is a backdrop effect that runs on its own clock",
      "the demo's pane has a moving sweep on it, and a sweep needs frames: " +
      "`always` is what asks the host for them");
    say(byId.glass && byId.glass.p.sweep > 0 && byId.glass.p["sweep-speed"] > 0,
      "with the sweep and its speed as parameters under dashed names",
      "`evg-fx-sweep-speed` did not survive the trip as `sweep-speed`");
  }
}

console.log("");
console.log("-- and the two writers agree about it");
{
  // The display list is read two ways: `toJson` for a host on the other side of
  // a string, and `evg-list.js` straight off the Ranger object for a host in
  // the same process. They have to produce the same thing key for key, and
  // `rt:scroll` already holds them together on every frame it draws — on a page
  // with no effects on it. This is the same claim for a page that has three.
  const built = path.join(HERE, "..", "bin", "FxDemoDoc.cjs");
  if (!fs.existsSync(built)) {
    console.log("  SKIP FxDemoDoc.cjs is not built — run `npm run evg:fx:doc`");
  } else {
    const rgr = createRequire(import.meta.url)(built);
    const root = rgr.FxDemoDoc.document();
    const lay = new rgr.EVGLayout();
    lay.setPageSize(900, 560);
    lay.layout(root);
    const dl = new rgr.EVGDisplayList();
    dl.setTextEngine(lay.getTextEngine());
    dl.build(root);
    const fromObject = listOf(dl).effects;
    const fromJson = JSON.parse(dl.toJson()).effects;
    // Keys sorted and coordinates rounded: `toJson` writes two decimals and the
    // object reader hands back what the layout computed, which is the one
    // difference between them that is meant to be there.
    const shape = (e) => JSON.stringify(e, (k, v) =>
      (v && typeof v === "object" && !Array.isArray(v))
        ? Object.fromEntries(Object.keys(v).sort().map((n) => [n, v[n]]))
        : (typeof v === "number" ? Math.round(v * 100) / 100 : v));
    const same = fromObject.length === fromJson.length &&
      fromObject.every((e, i) => shape(e) === shape(fromJson[i]));
    say(same, `both readers see the same ${fromObject.length} effects`,
      "the object reader and the JSON writer disagree:\n        " +
      JSON.stringify(fromObject) + "\n        " + JSON.stringify(fromJson));
    const carriers = listOf(dl).cmds.filter((c) => c.efx).length;
    say(carriers === JSON.parse(dl.toJson()).cmds.filter((c) => c.efx).length,
      `and the same ${carriers} rectangles carrying one`);
  }
}

console.log("");
console.log("-- the parameter reference says what the registry says");
{
  // PLAN_EFFECTS.md lists every effect's parameters and defaults, and a list
  // of numbers in prose is the kind of documentation that is wrong six months
  // later. Both sides are read here: the `params` object out of the painter,
  // and the table under the effect's own heading. A parameter added to a
  // plugin and not written down fails this; so does a default changed in one
  // place. It is about the DOC, so it runs before the browser starts.
  const painter = fs.readFileSync(path.join(HERE, "evg-webgl.js"), "utf8");
  const plan = fs.readFileSync(path.join(HERE, "..", "PLAN_EFFECTS.md"), "utf8");
  const ref = plan.slice(plan.indexOf("### Every parameter"), plan.indexOf("### Presets"));
  const missing = [];
  let seen = 0;
  for (const m of painter.matchAll(/name: "([a-z-]+)",\s*\n\s*layer: "([a-z]+)",([\s\S]*?)params: \{([\s\S]*?)\},/g)) {
    const [, name, layer, , body] = m;
    seen += 1;
    const head = "**`" + name + "`** (" + layer + ")";
    if (!ref.includes(head)) { missing.push(name + ": no section"); continue; }
    const table = ref.split(head)[1].split("\n\n**")[0];
    const numbers = table.match(/-?[\d.]+/g) || [];
    for (const d of body.matchAll(/"?([a-zA-Z-]+)"?\s*:\s*(-?[\d.]+)/g)) {
      if (!table.includes("`" + d[1] + "`")) missing.push(name + "." + d[1]);
      else if (!numbers.includes(d[2])) missing.push(name + "." + d[1] + " = " + d[2]);
    }
  }
  say(seen > 0 && missing.length === 0,
    `every parameter of all ${seen} effects is documented, with its default`,
    "not in PLAN_EFFECTS.md, or written with another default: " + missing.join(", "));
}

console.log("");
console.log("-- the starfield presets, through the engine's own parser");
{
  // `starfield-presets.css` is five paste-able skies, and `starfield-shots.mjs`
  // reads them with a regex to paint them. This reads the SAME file with the
  // cascade — EVGStyleSheet, applied to a tree, laid out, built — and holds the
  // two readings against each other. A preset with a property the engine does
  // not take would still paint from the regex and would vanish here.
  const built = path.join(HERE, "..", "bin", "FxDemoDoc.cjs");
  const presets = readPresets();
  say(presets.length >= 4, `the file holds ${presets.length} skies`);
  if (!fs.existsSync(built)) {
    console.log("  SKIP FxDemoDoc.cjs is not built — run `npm run evg:fx:doc`");
  } else {
    const rgr = createRequire(import.meta.url)(built);
    const root = new rgr.EVGElement();
    root.setAttribute("width", "600px");
    root.setAttribute("height", `${presets.length * 120}px`);
    for (const p of presets) {
      const box = rgr.EVGElement.createDiv();
      box.id = p.name;
      box.className = p.name;
      box.setAttribute("width", "600px");
      box.setAttribute("height", "100px");
      root.addChild(box);
    }
    const sheet = new rgr.EVGStyleSheet();
    sheet.parse(fs.readFileSync(path.join(HERE, "effect-presets.css"), "utf8"));
    sheet.setViewport(600, presets.length * 120, false);
    sheet.applyTree(root, "");
    say(sheet.getErrorCount() === 0,
      `the cascade takes every declaration in it (${sheet.getErrorCount()} refused)`,
      sheet.getErrorCount() > 0 ? sheet.getError(0) : "");

    const lay = new rgr.EVGLayout();
    lay.setPageSize(600, presets.length * 120);
    lay.layout(root);
    const dl = new rgr.EVGDisplayList();
    dl.setTextEngine(lay.getTextEngine());
    dl.build(root);
    const fromEngine = listOf(dl).effects || [];
    say(fromEngine.length === presets.length,
      `each one becomes an instance (${fromEngine.length})`,
      fromEngine.map((e) => e.id).join(","));
    const wrongKind = presets.filter((p) => {
      const e = fromEngine.find((x) => x.id === p.name);
      return !e || e.kind !== p.kind;
    }).map((p) => p.name);
    say(wrongKind.length === 0,
      `each one naming the effect its block declares (${[...new Set(presets.map((p) => p.kind))].join(", ")})`,
      "these came out as something else: " + wrongKind.join(", "));

    // AND THE SAME NUMBERS, both ways. This is the check that keeps the
    // pictures honest: the shots script and the engine read one file, and if
    // they disagree the pictures are of something nobody can paste.
    let worst = null;
    for (const p of presets) {
      const e = fromEngine.find((x) => x.id === p.name);
      if (!e) { worst = `${p.name} is missing`; break; }
      for (const [k, v] of Object.entries(p.params)) {
        if (Math.abs((e.p[k] === undefined ? NaN : e.p[k]) - v) > 0.001) {
          worst = `${p.name}: ${k} is ${e.p[k]} through the cascade and ${v} in the file`;
          break;
        }
      }
      if (worst) break;
    }
    say(worst === null, "with the same parameters the file declares", worst || "");
  }
}

let chromium;
try {
  ({ chromium } = requireHostTool("playwright-core"));
} catch (e) {
  console.error(e instanceof MissingDomDeps ? e.message : String(e));
  process.exit(3);
}
// SwiftShader, for the same reason every other painter check uses it: a check
// that only runs on a machine with a GPU is not a check.
const browser = await chromium.launch({
  executablePath: findChromium(),
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: W + 40, height: H + 40 } });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e.message)));
const tmp = path.join(HERE, ".fx-check.html");

/** The same page at a size of its own, for a scene that does not fit the one
 *  above. The preset sheet is the only caller: a dozen tiles big enough to
 *  hold a field of raindrops is 440 pixels across, and every other scene here
 *  is about one box and fits in 320. */
async function frameOfSize(scene, w, h) {
  const big = pageFor(scene).replace(
    `<canvas id="c" width="${W}" height="${H}" style="width:${W}px;height:${H}px"></canvas>`,
    `<canvas id="c" width="${w}" height="${h}" style="width:${w}px;height:${h}px"></canvas>`,
  ).replace(
    `<canvas id="read" width="${W}" height="${H}" style="display:none"></canvas>`,
    `<canvas id="read" width="${w}" height="${h}" style="display:none"></canvas>`,
  ).replace(`ctx.getImageData(0, 0, ${W}, ${H})`, `ctx.getImageData(0, 0, ${w}, ${h})`);
  fs.writeFileSync(tmp, big);
  await page.goto(pathToFileURL(tmp).href);
  await page.waitForFunction("window.__DONE__ === true", { timeout: 30000 });
  const err = await page.evaluate(() => window.__ERR__ || null);
  if (err) throw new Error("painter threw: " + err);
  const out = await page.evaluate(() => ({ px: window.__PX, stats: window.__stats }));
  if (!out.px) throw new Error("the page read no pixels back");
  const px = Uint8Array.from(out.px);
  return { px, w, h, at: (x, y) => { const i = (y * w + x) * 4; return [px[i], px[i + 1], px[i + 2], px[i + 3]]; } };
}

/** Render a scene once and hand back the whole canvas as RGBA bytes, plus what
 *  the painter reported about it. Whole frames rather than probes: most of
 *  what is claimed here is about a REGION, and a region is not three pixels. */
async function frameOf(scene, png) {
  fs.writeFileSync(tmp, pageFor(scene));
  await page.goto(pathToFileURL(tmp).href);
  await page.waitForFunction("window.__DONE__ === true", { timeout: 30000 });
  const err = await page.evaluate(() => window.__ERR__ || null);
  if (err) throw new Error("painter threw: " + err);
  if (png) await page.locator("#c").screenshot({ path: png });
  const out = await page.evaluate(() => ({ px: window.__PX, stats: window.__stats }));
  if (!out.px) throw new Error("the page read no pixels back");
  // Already top-down: this came off a 2-D canvas, which counts from the top the
  // way the display list does.
  return { px: Uint8Array.from(out.px), stats: out.stats };
}

const at = (px, x, y) => {
  const i = (y * W + x) * 4;
  return [px[i], px[i + 1], px[i + 2], px[i + 3]];
};
const lum = (p) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
const inside = (x, y) => x >= BOX[0] + 2 && y >= BOX[1] + 2 && x < BOX[0] + BOX[2] - 2 && y < BOX[1] + BOX[3] - 2;

const writeAt = process.argv.indexOf("--write-png");
const pngPath = writeAt > -1 ? process.argv[writeAt + 1] : null;

console.log("");
console.log("-- a starfield on a card");
const sky = await frameOf(SCENES.sky, pngPath);

{
  // INSIDE: the card is nearly black, and stars are the only thing on it that
  // is not. A field with nothing in it reads as the background everywhere.
  let lit = 0, brightest = 0;
  for (let y = BOX[1] + 2; y < BOX[1] + BOX[3] - 2; y += 1) {
    for (let x = BOX[0] + 2; x < BOX[0] + BOX[2] - 2; x += 1) {
      const l = lum(at(sky.px, x, y));
      if (l > lum(SKY) + 12) lit += 1;
      brightest = Math.max(brightest, l);
    }
  }
  const area = (BOX[2] - 4) * (BOX[3] - 4);
  say(lit > area * 0.005, `something is shining on it (${lit} of ${area} pixels lit)`,
    "a starfield that lights nothing is a starfield whose parameters never arrived");
  say(brightest > 150, `and some of it is bright (peak ${Math.round(brightest)})`,
    "stars with no core: the brightest pixel on the card is barely off the background");
}

{
  // OUTSIDE: byte for byte the page drawn without the effect at all. Not "close
  // to white" — the same scene twice, so the only thing a difference can be is
  // the effect reaching past its own box.
  const plainSky = await frameOf(SCENES.skyPlain);
  let worst = 0, where = null;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (inside(x, y)) continue;
      // The box's own edge is antialiased; step clear of it on both sides.
      if (x >= BOX[0] - 2 && x < BOX[0] + BOX[2] + 2 && y >= BOX[1] - 2 && y < BOX[1] + BOX[3] + 2) continue;
      const d = Math.abs(lum(at(sky.px, x, y)) - lum(at(plainSky.px, x, y)));
      if (d > worst) { worst = d; where = [x, y]; }
    }
  }
  say(worst <= 1, `and nothing at all outside the card (worst ${worst.toFixed(1)})`,
    `the page around the box changed at ${where} — the effect is painting past the element that declared it`);
}

console.log("");
console.log("-- and the host can switch one off");
{
  const offFrame = await frameOf(SCENES.skyOff);
  const plainSky = await frameOf(SCENES.skyPlain);
  let worst = 0, where = null;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const d = Math.abs(lum(at(offFrame.px, x, y)) - lum(at(plainSky.px, x, y)));
      if (d > worst) { worst = d; where = [x, y]; }
    }
  }
  say(worst <= 1, `an instance marked off draws nothing at all (worst ${worst.toFixed(1)})`,
    `${where} still shows the effect — \`off\` is being read as "dim" somewhere`);
  say(offFrame.stats && offFrame.stats.fxDrawn === 0,
    "and costs no pass at all",
    `the painter reported ${offFrame.stats && offFrame.stats.fxDrawn} effect passes for a page whose only effect is off`);
}

console.log("");
console.log("-- and the card's content is drawn over it");
{
  const plated = await frameOf(SCENES.skyUnderPlate);
  let worst = 0;
  for (let y = 75; y < 125; y += 1) {
    for (let x = 105; x < 175; x += 1) {
      const p = at(plated.px, x, y);
      worst = Math.max(worst, Math.abs(p[0] - 220), Math.abs(p[1] - 30), Math.abs(p[2] - 40));
    }
  }
  say(worst <= 2, `the plate over it is its own colour (worst ${worst})`,
    "a star came through an opaque rectangle: the source effect is being drawn " +
    "after the element's content instead of at its background");
}

console.log("");
console.log("-- it moves");
{
  const later = await frameOf(SCENES.skyLater);
  let diff = 0, n = 0;
  for (let y = BOX[1] + 2; y < BOX[1] + BOX[3] - 2; y += 2) {
    for (let x = BOX[0] + 2; x < BOX[0] + BOX[2] - 2; x += 2) {
      diff += Math.abs(lum(at(sky.px, x, y)) - lum(at(later.px, x, y)));
      n += 1;
    }
  }
  const mean = diff / n;
  say(mean > 1.5, `five seconds later it is a different sky (mean |Δ| ${mean.toFixed(2)})`,
    "the two frames are the same picture: the clock is not reaching the shader, " +
    "so the field is a still image that happens to look like stars");
}

console.log("");
console.log("-- a filter bends its own box and nothing else");
{
  const plain = await frameOf(SCENES.edgePlain);
  const wet = await frameOf(SCENES.edgeRippled);
  // INSIDE: the edge moved. Sampled along the row through the ring's crest.
  let moved = 0;
  for (let y = BOX[1] + 10; y < BOX[1] + BOX[3] - 10; y += 3) {
    for (let x = BOX[0] + 4; x < BOX[0] + BOX[2] - 4; x += 1) {
      if (Math.abs(lum(at(plain.px, x, y)) - lum(at(wet.px, x, y))) > 20) { moved += 1; }
    }
  }
  say(moved > 60, `the edge inside the box is displaced (${moved} pixels differ)`,
    "the ripple ran and changed nothing: either the instance was not live or " +
    "the events never reached the shader");

  // OUTSIDE: identical. This is the claim that the pass is scoped at all.
  let worst = 0, where = null;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (x >= BOX[0] - 2 && x < BOX[0] + BOX[2] + 2 && y >= BOX[1] - 2 && y < BOX[1] + BOX[3] + 2) continue;
      const d = Math.abs(lum(at(plain.px, x, y)) - lum(at(wet.px, x, y)));
      if (d > worst) { worst = d; where = [x, y]; }
    }
  }
  say(worst <= 2, `and the surface outside it is untouched (worst ${worst.toFixed(1)})`,
    `${where} changed: the filter is a full-screen pass wearing a box`);
}

console.log("");
console.log("-- liquid glass bends what is behind it, at the rim");
{
  const plain = await frameOf(SCENES.stripesPlain);
  const glass = await frameOf(SCENES.stripesGlass);
  const differs = (x, y) => Math.abs(lum(at(plain.px, x, y)) - lum(at(glass.px, x, y))) > 24;

  // THE RIM. Sampled a few pixels inside the left and right edges, down the
  // middle of the pane's height so the corners are not doing the work.
  let rim = 0, rimSeen = 0;
  for (let y = GLASS[1] + 40; y < GLASS[1] + GLASS[3] - 40; y += 2) {
    for (const x of [GLASS[0] + 3, GLASS[0] + 8, GLASS[0] + GLASS[2] - 9, GLASS[0] + GLASS[2] - 4]) {
      rimSeen += 1;
      if (differs(x, y)) rim += 1;
    }
  }
  say(rim > rimSeen * 0.5, `the stripes move through the rim (${rim} of ${rimSeen} samples)`,
    "a lens that bends nothing at its edge is a pane of glass nobody can see — " +
    "either the distance field or the displacement never reached the shader");

  // THE MIDDLE. A pane is flat across the middle: what is behind it is where
  // it was. This is what separates a lens from a filter over the whole box.
  //
  // Well clear of both: 45px in from every edge, which is comfortably past the
  // 26px the pane's bevel reaches, and below the plate in the corner.
  let mid = 0, midSeen = 0;
  for (let y = GLASS[1] + 50; y < GLASS[1] + GLASS[3] - 45; y += 2) {
    for (let x = GLASS[0] + 45; x < GLASS[0] + GLASS[2] - 45; x += 2) {
      // Skip the plate the scene draws over the pane.
      if (x >= GLASS[0] + 8 && x <= GLASS[0] + 86 && y >= GLASS[1] + 8 && y <= GLASS[1] + 50) continue;
      midSeen += 1;
      if (differs(x, y)) mid += 1;
    }
  }
  say(midSeen > 100 && mid < midSeen * 0.02,
    `and stand still across the middle (${mid} of ${midSeen} moved)`,
    "the flat part of the pane is displacing too: the bevel profile is not " +
    "falling to zero away from the edge");

  // OUTSIDE. Byte for byte the page without the pane.
  let worst = 0, where = null;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (x >= GLASS[0] - 2 && x < GLASS[0] + GLASS[2] + 2 && y >= GLASS[1] - 2 && y < GLASS[1] + GLASS[3] + 2) continue;
      const d = Math.abs(lum(at(plain.px, x, y)) - lum(at(glass.px, x, y)));
      if (d > worst) { worst = d; where = [x, y]; }
    }
  }
  say(worst <= 2, `with the page around it untouched (worst ${worst.toFixed(1)})`,
    `${where} changed — the pane is refracting outside its own box`);

  // AND WHAT IS IN FRONT STAYS SHARP. The whole reason a backdrop effect runs
  // in paint order rather than over the finished frame: a pane that smears its
  // own label ran too late.
  let plateWorst = 0;
  for (let y = GLASS[1] + 18; y < GLASS[1] + 40; y += 1) {
    for (let x = GLASS[0] + 18; x < GLASS[0] + 76; x += 1) {
      const p = at(glass.px, x, y);
      plateWorst = Math.max(plateWorst, Math.abs(p[0] - 20), Math.abs(p[1] - 230), Math.abs(p[2] - 120));
    }
  }
  say(plateWorst <= 2, `and the element's own content sharp on top (worst ${plateWorst})`,
    "the plate over the pane came back bent: the backdrop pass is running after " +
    "the element's content instead of before it");
}

console.log("");
console.log("-- and a sweep crosses it");
{
  const early = await frameOf(SCENES.sweptEarly);
  const later = await frameOf(SCENES.sweptLater);
  const plainGlass = await frameOf(SCENES.stripesGlass);

  // IT IS THERE: the pane with a bar on it is brighter somewhere than the
  // same pane without one. BOTH clocks are looked at, because the bar travels
  // from before one edge to past the other — at some clocks it is off the
  // pane entirely, which is what makes it a sweep rather than a stripe.
  let lit = 0, seen = 0;
  for (let y = GLASS[1] + 20; y < GLASS[1] + GLASS[3] - 20; y += 2) {
    for (let x = GLASS[0] + 20; x < GLASS[0] + GLASS[2] - 20; x += 2) {
      seen += 1;
      const base = lum(at(plainGlass.px, x, y));
      if (lum(at(early.px, x, y)) > base + 20 || lum(at(later.px, x, y)) > base + 20) lit += 1;
    }
  }
  say(lit > 20, `the bar lights part of the pane (${lit} of ${seen} samples)`,
    "a sweep that lights nothing: the parameter never reached the shader");

  // AND IT MOVES: the same pane at a later clock is lit somewhere else. The
  // check that a still picture passes and a stopped clock does not.
  let moved = 0;
  for (let y = GLASS[1] + 20; y < GLASS[1] + GLASS[3] - 20; y += 2) {
    for (let x = GLASS[0] + 20; x < GLASS[0] + GLASS[2] - 20; x += 2) {
      if (Math.abs(lum(at(early.px, x, y)) - lum(at(later.px, x, y))) > 20) moved += 1;
    }
  }
  say(moved > 20, `and it has moved a second later (${moved} samples differ)`,
    "the bar is in the same place at two clocks — `sweep-speed` is not being read, " +
    "or the clock is not reaching a backdrop effect");

  // KEPT TO THE RIM. With `sweep-rim: 1` the flat middle of the pane must be
  // what it was without any bar: a glint on a bevel, not a stripe over glass.
  const rimmed = await frameOf(SCENES.sweptRim);
  let midMoved = 0, midSeen = 0;
  for (let y = GLASS[1] + 50; y < GLASS[1] + GLASS[3] - 45; y += 2) {
    for (let x = GLASS[0] + 45; x < GLASS[0] + GLASS[2] - 45; x += 2) {
      midSeen += 1;
      if (Math.abs(lum(at(rimmed.px, x, y)) - lum(at(plainGlass.px, x, y))) > 12) midMoved += 1;
    }
  }
  say(midSeen > 100 && midMoved < midSeen * 0.02,
    `a rim-weighted bar leaves the middle alone (${midMoved} of ${midSeen} lit)`,
    "the bar is crossing the flat part of the pane at full strength — " +
    "`sweep-rim` is not weighting it toward the bevel");

  // AND PARKED between passes: at a clock past the crossing there is no bar
  // anywhere on the pane, which is what makes it a glint and not a stripe with
  // an animation on it.
  const parked = await frameOf(SCENES.sweptParked);
  let anywhere = 0;
  for (let y = GLASS[1] + 6; y < GLASS[1] + GLASS[3] - 6; y += 2) {
    for (let x = GLASS[0] + 6; x < GLASS[0] + GLASS[2] - 6; x += 2) {
      if (lum(at(parked.px, x, y)) > lum(at(plainGlass.px, x, y)) + 12) anywhere += 1;
    }
  }
  say(anywhere < 30, `and between passes the pane is clean (${anywhere} pixels still lit)`,
    "the bar never leaves: `sweep-duty` is not parking it off the pane");

  // AND IT IS OFF UNLESS ASKED FOR: the default pane has no bar on it, which
  // is why `sweep` defaults to 0.
  say(plainGlass.stats !== undefined, "a pane with no sweep declared still draws");
}

console.log("");
console.log("-- smoke banks up along the floor of its box");
{
  const fog = await frameOf(SCENES.smoke);
  const band = (from, to) => {
    let lit = 0, seen = 0;
    for (let y = BOX[1] + Math.round(BOX[3] * from); y < BOX[1] + Math.round(BOX[3] * to); y += 1) {
      for (let x = BOX[0] + 3; x < BOX[0] + BOX[2] - 3; x += 1) {
        seen += 1;
        if (lum(at(fog.px, x, y)) > lum(SKY) + 12) lit += 1;
      }
    }
    return lit / Math.max(seen, 1);
  };
  const low = band(0.72, 0.98);
  const high = band(0.02, 0.28);
  say(low > 0.5, `the floor of the box is full of it (${Math.round(low * 100)}% of it lit)`,
    "a smoke effect that leaves its own floor empty");
  // THE WHOLE SHAPE OF IT, in one number: what makes this smoke rather than
  // fog is that it is heavy at the bottom and thins as it climbs. A field with
  // the height term dropped would light both bands alike and pass every other
  // check here.
  say(high < low * 0.6, `and thins toward the top (${Math.round(high * 100)}% up there)`,
    `top ${Math.round(high * 100)}% vs floor ${Math.round(low * 100)}% — the height term is not being read`);

  // AND `height` IS WHAT DECIDES THAT. The same smoke told to fill the box
  // reaches the top of it, which is the parameter arriving rather than a
  // gradient somebody baked in.
  const tall = await frameOf(SCENES.smokeTall);
  let up = 0, seen = 0;
  for (let y = BOX[1] + 4; y < BOX[1] + Math.round(BOX[3] * 0.28); y += 1) {
    for (let x = BOX[0] + 3; x < BOX[0] + BOX[2] - 3; x += 1) {
      seen += 1;
      if (lum(at(tall.px, x, y)) > lum(SKY) + 12) up += 1;
    }
  }
  say(up / seen > high * 2, `and a taller one fills the box (${Math.round(up / seen * 100)}% at the top)`,
    "`height` changed nothing: the same smoke at 0.9 and at 8");

  // IT RISES. Two clocks, and the same pixels are not the same smoke.
  const later = await frameOf(SCENES.smokeLater);
  let moved = 0, looked = 0;
  for (let y = BOX[1] + 20; y < BOX[1] + BOX[3] - 10; y += 2) {
    for (let x = BOX[0] + 6; x < BOX[0] + BOX[2] - 6; x += 2) {
      looked += 1;
      if (Math.abs(lum(at(fog.px, x, y)) - lum(at(later.px, x, y))) > 14) moved += 1;
    }
  }
  say(moved > looked * 0.1, `and it moves (${moved} of ${looked} samples differ four seconds on)`,
    "the same smoke at two clocks: `rise` is not reaching the shader");
}

console.log("");
console.log("-- and every preset paints something of its own");
{
  // One scene with all of them in it, because the claim is comparative: each
  // has to light up, and no two may come out the same colour. Five separate
  // renders would answer the first question and not the second.
  const presets = readPresets();
  // A grid of its own page, because this page is 320x220 and there are a dozen
  // presets. 150 pixels is enough to answer both questions asked below and
  // nowhere near enough to judge one by, which is what `effect-shots.mjs` is
  // for. NOT SMALLER: a raindrop field at `density: 0.6` puts its cells 77
  // pixels apart and drops in fewer than half of them, so a 100-pixel tile
  // came up empty often enough to fail a check about the preset.
  const TILE = 150, STEP = 156, COLS = 4;
  const tiles = presets.map((p, i) => ({
    p, x: 4 + (i % COLS) * STEP, y: 4 + Math.floor(i / COLS) * STEP,
  }));
  // The ground under the effect and the effect on a transparent box of its
  // own — the arrangement a page uses, and the only one a BACKDROP effect
  // survives: it runs before the element's own background, so an opaque box
  // carrying one would paint over what it just drew.
  const PW = 4 + COLS * STEP;
  const PH = 4 + Math.ceil(presets.length / COLS) * STEP;
  const sceneWith = (off) => ({
    width: PW, height: PH,
    cmds: [rect(0, 0, PW, PH, [10, 11, 18, 1])].concat(
      tiles.flatMap((t) => [
        rect(t.x, t.y, TILE, TILE, t.p.background),
        // A LIT EDGE ACROSS THE GROUND, because a lens over a flat colour is
        // invisible by construction: refraction of one colour is that colour.
        // The two backdrop kinds here bend what is behind them, so what is
        // behind them has to have something in it to bend.
        rect(t.x + 18, t.y + 46, TILE - 36, 16, [86, 104, 168, 1]),
        rect(t.x + 18, t.y + 96, TILE - 36, 8, [150, 160, 210, 1]),
        rect(t.x, t.y, TILE, TILE, [0, 0, 0, 0], { efx: t.p.name }),
      ])),
    effects: tiles.map((t) => ({
      id: t.p.name, kind: t.p.kind, on: t.p.trigger || "always", off,
      box: [t.x, t.y, TILE, TILE], p: t.p.params, time: 3.2,
    })),
  });
  const sheet = await frameOfSize(sceneWith(false), PW, PH);
  // AGAINST THE SAME TILES WITH THE EFFECT OFF, and not against "is it
  // bright": two of these skies are sparse on purpose and one effect is
  // drops on a dark pane, so "did it light up" is the wrong question. What is
  // asked is whether each preset DID something, and the only honest reference
  // for that is the same box without it.
  const bare = await frameOfSize(sceneWith(true), PW, PH);
  const look = (t) => {
    let r = 0, g = 0, b = 0, n = 0, moved = 0;
    for (let y = t.y + 4; y < t.y + TILE - 4; y += 2) {
      for (let x = t.x + 4; x < t.x + TILE - 4; x += 2) {
        const px = sheet.at(x, y);
        r += px[0]; g += px[1]; b += px[2]; n += 1;
        if (Math.abs(lum(px) - lum(bare.at(x, y))) > 6) moved += 1;
      }
    }
    return { r: r / n, g: g / n, b: b / n, moved };
  };
  const shot = tiles.map(look);
  const dead = tiles.filter((t, i) => shot[i].moved < 5).map((t) => t.p.name);
  say(dead.length === 0, `all ${tiles.length} presets paint something`,
    "these changed nothing at all: " + dead.join(", "));
  console.log("       changed: " + tiles.map((t, i) => t.p.name + "=" + shot[i].moved).join(" "));

  // AND THE SKIES ARE DIFFERENT COLOURS, which is what those five are for.
  // Not asked of the others: two fields of raindrops on two dark panes are
  // meant to look alike, and a check that demanded otherwise would be asking
  // for a difference nobody wants.
  let same = null;
  const skies = tiles.map((t, i) => ({ t, s: shot[i] })).filter((x) => x.t.p.kind === "starfield");
  for (let i = 0; i < skies.length && !same; i += 1) {
    for (let j = i + 1; j < skies.length; j += 1) {
      const a = skies[i].s, b = skies[j].s;
      const d = Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
      if (d < 6) { same = `${skies[i].t.p.name} and ${skies[j].t.p.name} are the same colour (Δ ${d.toFixed(1)})`; break; }
    }
  }
  say(same === null, `and no two of the ${skies.length} skies are the same colour`, same || "");
}

console.log("");
console.log("-- what must not break");
{
  const unknown = await frameOf(SCENES.unknown);
  const p = at(unknown.px, BOX[0] + 20, BOX[1] + 20);
  say(Math.abs(p[0] - 30) <= 2 && Math.abs(p[1] - 140) <= 2,
    "an effect nobody registered draws the page without it",
    `the card came back ${p} instead of its own green — an unknown plugin took the frame with it`);

  const legacy = await frameOf(SCENES.legacy);
  const plain = await frameOf(SCENES.edgePlain);
  let moved = 0;
  for (let y = 40; y < H - 40; y += 3) {
    for (let x = 40; x < W - 40; x += 1) {
      if (Math.abs(lum(at(plain.px, x, y)) - lum(at(legacy.px, x, y))) > 20) moved += 1;
    }
  }
  say(moved > 60, `the whole-surface effect still runs (${moved} pixels differ)`,
    "`list.effect` — the original, application-driven ripple — stopped working");
  say(legacy.stats && legacy.stats.rippled === 1, "and still reports that it took the post-pass");
}

await browser.close();
fs.rmSync(tmp, { force: true });
if (pageErrors.length) {
  console.log("");
  console.log("page errors:");
  for (const e of pageErrors) console.log("  " + e);
  bad += pageErrors.length;
}
console.log("");
console.log(`passed=${checked - bad} failed=${bad}`);
if (bad > 0) { console.log("FAILURES"); process.exit(1); }
console.log("ALL PASS");
