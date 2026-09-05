// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The browser host. It owns three things and no more:
//
//   the clock      — the REAL milliseconds between two frames, handed to the
//                    app, which is what makes a dropped frame shorten the
//                    animation instead of stretching it
//   the pointer    — a position, resolved to an id by EVG's own hit test
//   the pixels     — one WebGL 2 context, fed the display list the app emits
//
// Everything else — what the page looks like, how fast the ring turns, when
// the loader hands over — is `RealTrainerDemo.rgr`'s, which is why the
// headless check can drive the same app with a made-up clock and assert on the
// same picture.

import { prepareDisplayList } from "../../evg/gl/evg-webgl.js";
import { listOf, shiftsOf } from "../../evg/gl/evg-list.js";
import { createA11yMirror, pressAtCentre } from "../../evg/gl/evg-a11y.js";
import { createTextInputBridge } from "../../evg/gl/evg-textinput.js";
import { RealTrainerDemo, RealTrainerModule } from "./generated-host.js";
// The browser measures the text: every layout the app builds asks canvas
// `measureText` in the face the painter draws with, instead of the advance
// table. Installed before the app is constructed — the app keeps a layout.
import { installCanvasMeasurer } from "../../evg/gl/evg-measure.js";
import { REALTRAINER_CSS, REALTRAINER_COMPACT, REALTRAINER_PLAN_MACHINE, REALTRAINER_CHAT_MACHINE, REALTRAINER_SEED } from "./generated.js";

const stage = document.getElementById("stage");
const canvas = document.getElementById("c");
const errEl = document.getElementById("err");
const fpsEl = document.getElementById("fps");
const sceneEl = document.getElementById("scene");

const fontMeasure = installCanvasMeasurer(RealTrainerModule);
window.__fontMeasure = fontMeasure;

const app = new RealTrainerDemo();
app.init(REALTRAINER_CSS, REALTRAINER_COMPACT);
app.loadPlanMachine(REALTRAINER_PLAN_MACHINE);
app.loadChatMachine(REALTRAINER_CHAT_MACHINE);
app.loadReference(REALTRAINER_SEED);
// `?page=390x844&route=/calendar/cal-plan?week=2026-02-09` opens the app the
// way the reference recorder opens the original: a phone, on a route.
// `page=fit` is the phone itself: the page is the viewport, and so is any
// viewport too narrow for the desktop demo when nothing was asked — a phone
// opening the bare URL gets the shell, on its route or on Home.
// `page=fit` — or no `page` at all — makes the page the window: it is laid
// out at the window's size and again on every resize, and the stylesheet's
// `@media` blocks answer for the width. `page=390x844` pins a size, which is
// what the checks want.
const params = new URLSearchParams(location.search);
const pageParam = params.get("page");
const fit = !pageParam || pageParam === "fit";
// A finger rather than a mouse, as the browser reports it: the sheet's
// `@media (pointer: coarse)` block makes the targets bigger for it.
const coarseQuery = window.matchMedia ? window.matchMedia("(pointer: coarse)") : null;
app.setPointerCoarse(!!(coarseQuery && coarseQuery.matches));
{
  if (fit) {
    document.body.classList.add("fit");
    app.setPageSize(stage.clientWidth, stage.clientHeight);
  } else {
    const [w, h] = pageParam.split("x").map(Number);
    if (w > 0 && h > 0) app.setPageSize(w, h);
  }
  const route = params.get("route");
  if (route) app.openRoute(route);
  else if (fit) app.openRoute("/");
}

// For anything driving this page from outside — the browser check reads the
// last frame's list rather than guessing at pixels. The list is written as
// JSON when it is asked for and not before: the frame itself never
// serialises anything.
window.__app = app;
Object.defineProperty(window, "__lastList", { get: () => app.displayListJson() });

// Set by anything that changed what is on the screen without drawing it —
// a scroll, mostly. The loop below draws once for it, however many events
// produced it.
let dirty = true;
// When the page last moved under a wheel, a finger or a glide. A wheel has
// no gesture to be in the middle of, so this is what tells the loop the page
// is still going and the accessibility tree can wait.
let scrolledAt = 0;
const STILL_SCROLLING_MS = 200;
// The momentum lives in the app — `EVGFling`, reached through scrollDrag /
// scrollRelease / scrollHalt — so this page and the iOS one throw a document
// exactly the same distance, and neither has its own copy of the physics.
// `app.tick` advances the glide, so there is nothing to do here per frame.

// The wheel, and nothing else about scrolling: how far the document may move
// is the layout's answer, because it is the half that measured the content.
stage.addEventListener(
  "wheel",
  (e) => {
    app.scrollHalt();
    if (app.scrollDocument(e.deltaY)) {
      dirty = true;
      scrolledAt = performance.now();
      e.preventDefault();
    }
  },
  { passive: false },
);

let W = app.widthPx();
let H = app.heightPx();
const dpr = Math.min(2, window.devicePixelRatio || 1);
function sizeCanvas() {
  W = app.widthPx();
  H = app.heightPx();
  // A frame is built for a page size; the next paint builds one for this.
  dropFrame();
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  // The stage is sized by the page when a size was pinned; when the page is
  // the window the stage is the window (index.html) and the page follows it.
  if (!fit) {
    stage.style.width = W + "px";
    stage.style.height = H + "px";
  }
}
sizeCanvas();

// `?gl=preserve` keeps the drawn frame readable after the frame ends, which
// the pixel checks need and a page does not: with it on, the browser cannot
// hand the frame to the compositor and has to copy it instead, every frame.
// `?gl=noaa` turns multisampling off, for measuring what it costs on a GPU
// that minds it; the paths' edges are what it smooths.
const glMode = params.get("gl") || "";
const gl = canvas.getContext("webgl2", {
  antialias: glMode !== "noaa",
  premultipliedAlpha: false,
  stencil: true,
  preserveDrawingBuffer: glMode === "preserve",
});
if (!gl) {
  errEl.textContent = "WebGL 2 is not available in this browser.";
}

let generation = 0;
let focus = "";

const mirror = createA11yMirror(stage, {
  canvas,
  label: "RealTrainer demo",
  // A page, not a grid: every button and field is a tab stop in tree order,
  // so Tab walks from a field to the send button beside it.
  tabbable: "all",
  // A reader activating a node is answered by pressing the app in the middle
  // of the rectangle the reader was given — the same path the mouse takes.
  onActivate: (node) => pressAtCentre(node, (x, y) => press(x, y)),
  // Focus that moved by Tab or by a reader's cursor: a field takes the text
  // session, anything else ends it; the app draws the focused field and the
  // mirror's own outline marks the rest.
  onFocus: (node) => {
    focus = node.id;
    if (app.hasField(node.id)) {
      if (app.focusedField() !== node.id) {
        app.setFocus(node.id);
        app.rebuild();
      }
    } else if (app.focusedField()) {
      app.setFocus("");
      app.rebuild();
    }
    syncTextSession();
    paintAll();
  },
});

// --- what a frame costs, and what it therefore does ---------------------------
//
// Measured on a diary of forty workouts, per frame, at 390x844:
//
//   app.scrollDocument            0.33 ms
//   app.display                  +1.78 ms   build the display list
//   displayListJson + JSON.parse +4.0  ms   serialise it and read it back
//   a11yJson + parse            +15.6  ms   THE ACCESSIBILITY MIRROR
//
// The mirror was rebuilt on EVERY frame, scrolling or not, and it is five
// times the cost of everything else together. It does not need to be: its
// tree changes when the app's tree changes — a press, an edit, a route — and
// during a fling nothing in it does but the rectangles, which a reader is not
// consulting mid-swipe anyway. So it is rebuilt when the app has settled and
// at most a few times a second, and immediately whenever something asks for
// it by name.
//
// `paint` is therefore the DRAWING, and nothing else.
const MIRROR_MIN_GAP_MS = 250;
let mirrorDue = 0;

// The frame the painter built from the list it was last given, kept on the
// card. The app keeps its list across a scroll and moves the layer inside
// it — `EVGDisplayList.refreshLayers` — so while the list it hands back is
// the same build, the frame is drawn again with the layers' shifts and
// nothing is rebuilt: no arrays, no upload, no JSON. A new build makes a new
// frame. Measured against the page that serialised and re-read the list and
// rebuilt every buffer per frame, this is what a scroll frame's JavaScript
// went to: the shifts, the scissors and the draw calls.
let frame = null;
let frameList = null;
let frameSeq = -1;
function dropFrame() {
  if (frame) frame.dispose();
  frame = null;
  frameList = null;
}

function paint() {
  if (!gl) return;
  try {
    errEl.textContent = "";
    const dl = app.display();
    // A new build, or a kept list whose text changed under the frame — the
    // scrollbar's label — is a new frame; a kept list that only moved is not.
    const seq = dl.buildSeq * 100000 + dl.frameSeq;
    if (!frame || dl !== frameList || seq !== frameSeq) {
      dropFrame();
      frame = prepareDisplayList(gl, { width: W, height: H, list: listOf(dl) }, { dpr });
      frameList = dl;
      frameSeq = seq;
    }
    window.__lastStats = frame.draw(shiftsOf(dl));
    sceneEl.textContent = app.sceneName();
  } catch (e) {
    errEl.textContent = String((e && e.stack) || e);
  }
}

// The accessibility tree. `now` is the frame's clock; pass nothing to mean
// "this one matters, do it" — a press, a focus, an edit.
function syncMirror(now) {
  if (!gl) return;
  if (now !== undefined && now < mirrorDue) return;
  mirrorDue = (now === undefined ? performance.now() : now) + MIRROR_MIN_GAP_MS;
  try {
    generation += 1;
    mirror.update(JSON.parse(app.a11yJson(generation, focus)));
  } catch (e) {
    errEl.textContent = String((e && e.stack) || e);
  }
}

// Draw now AND rebuild the mirror: what every path that changes the app's
// state wants, as `paint` used to mean.
function paintAll() {
  paint();
  // The mirror after the frame is on the screen, not before: rebuilding it
  // is a walk of the whole tree and a DOM update to match, and a press that
  // opens a menu should show the menu first. The loop rebuilds it on its
  // next frame — `mirrorDue` is cleared so that frame does not wait — unless
  // a field has the keyboard, whose <input> IS a mirror element and has to
  // exist for the text session that is about to be started.
  if (app.focusedField()) {
    syncMirror();
    return;
  }
  mirrorDue = 0;
}

function at(ev) {
  const r = canvas.getBoundingClientRect();
  return [ev.clientX - r.left, ev.clientY - r.top];
}

function press(x, y) {
  const id = app.hitId(x, y);
  app.setPressed("");
  if (app.press(id)) paintAll();
  syncTextSession();
}

// --- the text fields ---------------------------------------------------------
//
// The platform owns the editing session: a real <input> sits over the drawn
// field and Ranger mirrors its value and selection. See evg-textinput.js for
// what was measured first and why a keydown-driven editor was a dead end.
const textInput = createTextInputBridge({
  host: stage,
  canvas,
  onEdit: ({ value, selStart, selEnd }) => {
    const tid = textInput.activeTid();
    if (!tid) return;
    if (!app.applyEdit(tid, value, selStart, selEnd)) return;
    paintAll();
    const after = JSON.parse(app.fieldStateJson(tid));
    if (after && after.value !== value) textInput.sync(after);
  },
  onKey: (k) => {
    // Tab leaves the field: the session ends, the app forgets the focus, and
    // the browser moves it to the next control — which is the mirror's next
    // tab stop, because the field IS a mirror element.
    if (k.key === "Tab") {
      textInput.release();
      app.setFocus("");
      app.rebuild();
      paintAll();
      return false;
    }
    if (k.key !== "Escape" && k.key !== "Enter") return false;
    const took = app.keyWith(k.key, k.shiftKey, k.ctrlKey || k.metaKey);
    syncTextSession();
    if (took) paintAll();
    return took;
  },
});

/** Hand the keyboard to the field the app says is focused, or take it back. */
function syncTextSession() {
  const tid = app.focusedField();
  if (!tid) {
    textInput.blurField();
    return;
  }
  const st = JSON.parse(app.fieldStateJson(tid));
  if (!st) {
    textInput.blurField();
    return;
  }
  focus = tid;
  if (textInput.activeTid() === tid) {
    textInput.sync(st);
    return;
  }
  // The mirror's input for the field, once the mirror has drawn it.
  textInput.focusField(tid, st, mirror.elementOf(tid));
}

// A finger has no wheel: a drag on the canvas scrolls what the wheel would,
// and a drag that scrolled is not a press when it lifts. Six pixels is the
// slack a tap gets before it becomes a drag.
//
// …and it hands the app the TIME as well as the distance, because a finger
// that leaves the glass moving is still scrolling and the speed is what says
// how far. The physics is `EVGFling`, in the app, so this page and the iOS
// one throw a document the same distance.
let drag = null;
canvas.addEventListener("pointerdown", (ev) => {
  const [x, y] = at(ev);
  // The scrollbar's thumb takes the press: the moves that follow drag the
  // page by the thumb, not by the finger, and nothing under it is pressed.
  if (app.scrollbarGrab(x, y)) {
    drag = { bar: true };
    canvas.setPointerCapture(ev.pointerId);
    dirty = true;
    return;
  }
  // Putting a finger down stops the page where it is, the way it does on a
  // phone: a glide is caught, not ridden out.
  app.scrollHalt();
  drag = { y, moved: false, at: ev.timeStamp || performance.now() };
  canvas.setPointerCapture(ev.pointerId);
  app.setPressed(app.hitId(x, y));
  paint();
});
canvas.addEventListener("pointerup", (ev) => {
  const [x, y] = at(ev);
  if (drag?.bar) {
    drag = null;
    app.scrollbarRelease();
    dirty = true;
    return;
  }
  const scrolled = drag?.moved;
  drag = null;
  if (scrolled) {
    // Let go while still moving and the page carries on. The app decides
    // whether that was a throw or a stop, from the speed it tracked.
    app.scrollRelease();
    app.setPressed("");
    dirty = true;
    return;
  }
  press(x, y);
});
canvas.addEventListener("pointercancel", () => {
  if (drag?.bar) app.scrollbarRelease();
  drag = null;
  app.scrollHalt();
  app.setPressed("");
  paint();
});
canvas.addEventListener("pointermove", (ev) => {
  const [x, y] = at(ev);
  if (drag && drag.bar) {
    if (app.scrollbarDrag(y)) {
      dirty = true;
      scrolledAt = ev.timeStamp || performance.now();
    }
    return;
  }
  if (drag) {
    const dy = drag.y - y;
    if (drag.moved || Math.abs(dy) > 6) {
      // The moment a touch becomes a drag the row under it is no longer
      // pressed — as on a phone — and, as on the iOS host, that is the
      // one layout the drag costs: the lift finds nothing pressed and the
      // glide starts without one.
      if (!drag.moved) app.setPressed("");
      const now = ev.timeStamp || performance.now();
      const dt = now - drag.at;
      drag.at = now;
      drag.moved = true;
      drag.y = y;
      // NOT painted from here. The frame loop draws once per frame however
      // many moves the browser delivers — a finger reports faster than the
      // screen refreshes, and painting per event is painting frames nobody
      // ever sees. The app is told how long the move took as well as how far,
      // because that is what decides where a lift throws it.
      if (app.scrollDrag(dy, dt)) {
        dirty = true;
        scrolledAt = now;
      }
    }
    return;
  }
  // The scrollbar first: the pointer on its thumb lights it, and hovers
  // nothing under it.
  if (app.scrollbarHover(x, y)) dirty = true;
  const id = app.overScrollbar() ? "" : app.hitId(x, y);
  canvas.style.cursor = app.overScrollbar() ? "default" : "";
  if (id === hovered) return;
  hovered = id;
  app.setHover(id);
  // One frame, to lay the page out with the new hover state: that is where
  // the stylesheet's :hover rule is applied and the transition it declares
  // is started. `hitId` above does not lay anything out any more — the app
  // keeps the last layout until something changes it, and a hover is the
  // change — so without this the fade would wait for the next thing that
  // asked for a frame.
  dirty = true;
});
// The resize path, as gallery/evg/web/responsive has it: a ResizeObserver on
// the stage rather than only a window listener, because the two differ where
// it matters — a scrollbar takes ~15px off the width and only the element
// knows — and a key of what the page was last laid out for, so nothing is
// laid out twice for the same surface. The page is laid out again at the
// new size (the sheet is told the viewport inside `setPageSize`'s rebuild)
// and drawn.
if (fit) {
  let lastKey = "";
  const refit = () => {
    const w = Math.max(240, Math.round(stage.clientWidth));
    const h = Math.max(240, Math.round(stage.clientHeight));
    const coarse = !!(coarseQuery && coarseQuery.matches);
    const key = `${w}x${h}:${coarse}`;
    if (key === lastKey) return;
    lastKey = key;
    app.setPointerCoarse(coarse);
    app.setPageSize(w, h);
    sizeCanvas();
    paintAll();
  };
  new ResizeObserver(refit).observe(stage);
  window.addEventListener("resize", refit);
  if (coarseQuery && coarseQuery.addEventListener) coarseQuery.addEventListener("change", refit);
}

canvas.addEventListener("pointerleave", () => {
  hovered = "";
  app.setHover("");
  app.scrollbarHover(-1, -1);
  dirty = true;
});
let hovered = "";

// --- the frame loop ----------------------------------------------------------
//
// It never stops, because the ring never stops: this is a loading screen, and
// a loading screen that idles is a frozen one. The sign-in page is still
// ticked, so a hover's 160ms fade has frames to run in.
let last = performance.now();
let frames = 0;
let fpsAt = last;
function step(now) {
  const dt = now - last;
  last = now;
  // `tick` carries the glide forward as well as the clock, and says whether
  // anything moved.
  const gliding = app.scrollVelocity() !== 0;
  const ticked = app.tick(dt);
  if (gliding) scrolledAt = now;
  const moving =
    drag !== null ||
    app.scrollVelocity() !== 0 ||
    now - scrolledAt < STILL_SCROLLING_MS;
  if (ticked || dirty) {
    dirty = false;
    paint();
  }
  // The accessibility tree, when the page is not being thrown around. Its
  // rectangles follow the scroll, so there is no point rebuilding them
  // mid-fling — and at 15ms a rebuild it is the difference between a frame
  // that fits in the budget and one that does not.
  if (moving === false) syncMirror(now);
  frames += 1;
  if (now - fpsAt >= 500) {
    fpsEl.textContent = Math.round((frames * 1000) / (now - fpsAt)) + " fps";
    frames = 0;
    fpsAt = now;
  }
  requestAnimationFrame(step);
}

// The first frame waits for the faces the list names, so the wordmark is not
// measured in one font and drawn in another.
document.fonts.ready.then(() => {
  // The faces are in: forget what was measured with the fallback and lay
  // the page out again with the real ones.
  fontMeasure.refresh();
  app.rebuild();
  paintAll();
  requestAnimationFrame(step);
});
