// SPDX-License-Identifier: AGPL-3.0-or-later
//
// `evg-gestures.js` against a canvas that is not one: the module wants an
// element it can listen on and measure, and nothing else, so the gestures can
// be checked without a browser — including the two-finger pinch, which is the
// one no headless driver will send for you.
//
//   node gallery/evg/gl/gestures-check.mjs

import { attachViewGestures } from "./evg-gestures.js";

let passed = 0;
let failed = 0;
const ok = (name, cond, detail) => {
  if (cond) {
    passed += 1;
    console.log("  PASS  " + name + (detail ? " (" + detail + ")" : ""));
  } else {
    failed += 1;
    console.log("  FAIL  " + name + (detail ? " (" + detail + ")" : ""));
  }
};
const near = (a, b, eps = 0.001) => Math.abs(a - b) <= eps;

/** A canvas at the page origin, 1000 x 800, that records its listeners. */
function fakeCanvas() {
  const handlers = new Map();
  return {
    style: {},
    addEventListener: (t, f) => handlers.set(t, [...(handlers.get(t) || []), f]),
    removeEventListener: (t, f) => handlers.set(t, (handlers.get(t) || []).filter((g) => g !== f)),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 }),
    setPointerCapture: () => {},
    hasPointerCapture: () => true,
    releasePointerCapture: () => {},
    fire(type, ev) {
      for (const f of handlers.get(type) || []) f({ preventDefault() {}, ...ev });
    },
  };
}

function rig(start = { x: 0, y: 0, sc: 1 }) {
  const el = fakeCanvas();
  const state = { ...start };
  const taps = [];
  const cursors = [];
  attachViewGestures(el, {
    view: () => ({ ...state }),
    setView: (x, y, sc) => { state.x = x; state.y = y; state.sc = sc; },
    minZoom: 0.05,
    maxZoom: 16,
    onTap: (x, y) => taps.push([x, y]),
    onCursor: (c) => cursors.push(c),
  });
  return { el, state, taps, cursors };
}

const down = (el, id, x, y) => el.fire("pointerdown", { pointerId: id, clientX: x, clientY: y, button: 0 });
const move = (el, id, x, y) => el.fire("pointermove", { pointerId: id, clientX: x, clientY: y });
const up = (el, id, x, y) => el.fire("pointerup", { pointerId: id, clientX: x, clientY: y, button: 0 });
/** Where a point on the canvas is in the scene, which is what a zoom holds. */
const world = (v, px, py) => ({ x: (px - v.x) / v.sc, y: (py - v.y) / v.sc });

console.log("=== evg-gestures ===");

// --- drag pans by exactly what the pointer travelled ------------------------
{
  const { el, state, taps } = rig({ x: 10, y: 20, sc: 0.5 });
  down(el, 1, 100, 100);
  move(el, 1, 160, 130);
  up(el, 1, 160, 130);
  ok("a drag pans by the travel", near(state.x, 70) && near(state.y, 50), `${state.x},${state.y}`);
  ok("and the scale is untouched", near(state.sc, 0.5));
  ok("a drag is not a tap", taps.length === 0);
}

// --- a press that does not travel is a tap ---------------------------------
{
  const { el, state, taps } = rig();
  down(el, 1, 300, 400);
  move(el, 1, 301, 401);
  up(el, 1, 301, 401);
  ok("a press that does not travel is a tap", taps.length === 1, JSON.stringify(taps[0]));
  ok("and it did not move the view", near(state.x, 0) && near(state.y, 0));
}

// --- the wheel zooms about the pointer -------------------------------------
{
  const { el, state } = rig({ x: -200, y: -100, sc: 1 });
  const before = { ...state };
  const w0 = world(before, 400, 300);
  el.fire("wheel", { deltaY: -300, deltaMode: 0, ctrlKey: false, clientX: 400, clientY: 300 });
  ok("a wheel up zooms in", state.sc > before.sc, `${before.sc} → ${state.sc.toFixed(3)}`);
  const w1 = world(state, 400, 300);
  ok("and holds the point under the pointer", near(w0.x, w1.x, 0.02) && near(w0.y, w1.y, 0.02),
    `${w0.x.toFixed(2)},${w0.y.toFixed(2)} vs ${w1.x.toFixed(2)},${w1.y.toFixed(2)}`);
  el.fire("wheel", { deltaY: 300, deltaMode: 0, ctrlKey: false, clientX: 400, clientY: 300 });
  ok("and a wheel down puts it back", near(state.sc, before.sc, 0.0001), state.sc.toFixed(4));
}

// --- a trackpad pinch is a wheel with ctrl, and moves faster per unit -------
{
  const plain = rig();
  plain.el.fire("wheel", { deltaY: -40, deltaMode: 0, ctrlKey: false, clientX: 500, clientY: 400 });
  const pinch = rig();
  pinch.el.fire("wheel", { deltaY: -40, deltaMode: 0, ctrlKey: true, clientX: 500, clientY: 400 });
  ok("ctrl+wheel zooms further than the same wheel", pinch.state.sc > plain.state.sc * 1.2,
    `${plain.state.sc.toFixed(3)} vs ${pinch.state.sc.toFixed(3)}`);
}

// --- a line-mode wheel is a notch, not half a one --------------------------
{
  const px = rig();
  px.el.fire("wheel", { deltaY: -100, deltaMode: 0, clientX: 500, clientY: 400 });
  const lines = rig();
  lines.el.fire("wheel", { deltaY: -3, deltaMode: 1, clientX: 500, clientY: 400 });
  ok("a notch is a notch in lines and in pixels", near(px.state.sc, lines.state.sc, 0.02),
    `${px.state.sc.toFixed(3)} vs ${lines.state.sc.toFixed(3)}`);
}

// --- two fingers pinch about their midpoint --------------------------------
{
  const { el, state } = rig({ x: 40, y: 60, sc: 0.5 });
  const before = { ...state };
  const w0 = world(before, 450, 300);
  down(el, 1, 400, 300);
  down(el, 2, 500, 300);     // 100 apart, midpoint 450,300
  move(el, 1, 350, 300);
  move(el, 2, 550, 300);     // 200 apart, same midpoint
  ok("spreading to twice the gap doubles the scale", near(state.sc, before.sc * 2, 0.0001),
    `${before.sc} → ${state.sc}`);
  const w1 = world(state, 450, 300);
  ok("and the midpoint holds its place in the scene", near(w0.x, w1.x, 0.01) && near(w0.y, w1.y, 0.01),
    `${w0.x.toFixed(2)},${w0.y.toFixed(2)} vs ${w1.x.toFixed(2)},${w1.y.toFixed(2)}`);
  up(el, 1, 350, 300);
  up(el, 2, 550, 300);
}

// --- fingers that move together pan ----------------------------------------
{
  const { el, state } = rig({ x: 0, y: 0, sc: 1 });
  down(el, 1, 400, 300);
  down(el, 2, 500, 300);
  move(el, 1, 430, 340);
  move(el, 2, 530, 340);     // same gap, midpoint moved +30,+40
  ok("two fingers moving together pan", near(state.x, 30) && near(state.y, 40), `${state.x},${state.y}`);
  ok("and do not change the scale", near(state.sc, 1));
  up(el, 1, 430, 340);
  up(el, 2, 530, 340);
}

// --- lifting one finger keeps the other panning ----------------------------
{
  const { el, state, taps } = rig({ x: 0, y: 0, sc: 1 });
  down(el, 1, 400, 300);
  down(el, 2, 500, 300);
  move(el, 1, 400, 300);
  up(el, 2, 500, 300);
  move(el, 1, 440, 320);
  ok("the finger left on the glass goes on panning", near(state.x, 40) && near(state.y, 20), `${state.x},${state.y}`);
  up(el, 1, 440, 320);
  ok("and the end of a pinch is not a tap", taps.length === 0);
}

// --- the clamps hold -------------------------------------------------------
{
  const { el, state } = rig({ x: 0, y: 0, sc: 1 });
  for (let i = 0; i < 40; i += 1) el.fire("wheel", { deltaY: -240, deltaMode: 0, clientX: 500, clientY: 400 });
  ok("zoom stops at the ceiling", near(state.sc, 16), state.sc.toFixed(3));
  for (let i = 0; i < 80; i += 1) el.fire("wheel", { deltaY: 240, deltaMode: 0, clientX: 500, clientY: 400 });
  ok("and at the floor", near(state.sc, 0.05), state.sc.toFixed(3));
}

// --- Safari's own pinch ----------------------------------------------------
{
  const { el, state } = rig();
  el.fire("gesturestart", { scale: 1, clientX: 500, clientY: 400 });
  el.fire("gesturechange", { scale: 1.5, clientX: 500, clientY: 400 });
  ok("a gesture event zooms by its scale", near(state.sc, 1.5, 0.001), state.sc.toFixed(3));
  el.fire("gestureend", { scale: 1.5, clientX: 500, clientY: 400 });
}

console.log("");
console.log(`passed=${passed} failed=${failed}`);
if (failed > 0) {
  console.log("SOME FAILED");
  process.exit(1);
}
console.log("ALL PASS");
