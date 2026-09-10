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
import { createDomPainter } from "../../evg/html/evg-dom.js";
import { listOf, shiftsOf } from "../../evg/gl/evg-list.js";
import { createA11yMirror, pressAtCentre } from "../../evg/gl/evg-a11y.js";
import { createTextInputBridge } from "../../evg/gl/evg-textinput.js";
import { RtHost, EVGHostTextMeasurer, EVGDefaultMeasurer } from "./generated-host.js";
// The browser measures the text: every layout the app builds asks canvas
// `measureText` in the face the painter draws with, instead of the advance
// table. Installed before the app is constructed — the app keeps a layout.
import { installCanvasMeasurer } from "../../evg/gl/evg-measure.js";
import { REALTRAINER_CSS, REALTRAINER_COMPACT, REALTRAINER_PLAN_MACHINE, REALTRAINER_CHAT_MACHINE } from "./generated.js";

const stage = document.getElementById("stage");
const canvas = document.getElementById("c");
const errEl = document.getElementById("err");
const fpsEl = document.getElementById("fps");
const sceneEl = document.getElementById("scene");

// The two classes it needs, not the module: a namespace import would ask the
// bundler for all 359 of them and nothing could be dropped. See build.mjs.
const fontMeasure = installCanvasMeasurer({ EVGHostTextMeasurer, EVGDefaultMeasurer });
window.__fontMeasure = fontMeasure;

/** `YYYY-MM-DD` in the viewer's own timezone. */
function localIsoDay(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// THE SAME HOST THE PHONES USE. `RtHost` (gallery/realtrainer/src/RtHost.rgr,
// on `gallery/evg/EvgHost.rgr`) is the viewport the UIKit view and the Android
// View put around this app: the window and the safe area, a window point to a
// page point, the press a drag cancels, the fling timed against the host's own
// clock, the keyboard's text. This page used to have its own copy of all of
// that in JavaScript — see gallery/evg/HOSTS.md — and a rule fixed on a phone
// was a rule this page still had wrong.
//
// `app` is the same object it always was: the host holds it, and everything
// here that is about the APPLICATION rather than about the window goes on
// talking to it directly.
const host = new RtHost();
const app = host.demo;
app.init(REALTRAINER_CSS, REALTRAINER_COMPACT);
app.loadPlanMachine(REALTRAINER_PLAN_MACHINE);
app.loadChatMachine(REALTRAINER_CHAT_MACHINE);
// THE CLOCK. Ranger has no date type and no `now()` — deliberately: a clock
// inside a reducer is what makes a state machine untestable, so the app takes
// today as a value and every headless check hands it a fixed one. Which means
// the browser has to hand it the real one, and until it did, the deployed page
// opened five days in the past: right week arithmetic, wrong week.
//
// The LOCAL day, not the UTC one. `toISOString()` is UTC, so east of Greenwich
// it is yesterday for the first hours of the morning and the calendar opens on
// the wrong day for anyone awake early.
app.setToday(localIsoDay(new Date()));

// THE DATA, WHICH IS NOT PART OF THE PROGRAM. A year of reference data — 407 KB
// of it — used to be a string literal inside this bundle: downloaded before
// the first byte of the app could run, and parsed before the first pixel. The
// document's head starts fetching it as a file instead (index.html), so the
// two downloads overlap; it is applied the moment it lands.
//
// It is nearly always here before the first frame, because it is a sixth of
// the bundle's size and started earlier. When it is not, the app paints what
// it has — a real screen with an empty diary — and takes the data after.
let seedPending = null;
let seedDone = false;
let booted = false;
function applySeed(text) {
  if (seedDone || !text) return;
  seedDone = true;
  if (!booted) { seedPending = text; return; }
  app.loadReference(text);
  app.rebuild();
  paintAll();
}
const seedText = (window.__rtSeed || Promise.resolve("")).catch(() => "");
seedText.then(applySeed);
// What the first frame is allowed to wait for. Not the seed itself: a request
// that never answers must not be able to hold the page, so this resolves on
// the seed OR on a deadline, whichever is first.
const SEED_WAIT_MS = 1500;
const seedOrDeadline = Promise.race([
  seedText,
  new Promise((r) => setTimeout(r, SEED_WAIT_MS)),
]);
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
// The page mode was settled in the document's head, before anything painted
// (see index.html). Reading it back is what keeps the chrome the document
// shows and the size the app lays out for from ever disagreeing — they used
// to be decided in two places, a second apart.
const { fit, w: pinnedW, h: pinnedH } = window.__rtPage;
// A finger rather than a mouse, as the browser reports it: the sheet's
// `@media (pointer: coarse)` block makes the targets bigger for it.
const coarseQuery = window.matchMedia ? window.matchMedia("(pointer: coarse)") : null;
{
  // `began` rather than `setPageSize`: it is what tells the host the window,
  // says whether the pointer is a finger, and opens it for business — the
  // same call `RtHost.start` makes on a phone.
  if (fit) host.began(stage.clientWidth, stage.clientHeight, !!(coarseQuery && coarseQuery.matches));
  else if (pinnedW > 0 && pinnedH > 0) host.began(pinnedW, pinnedH, !!(coarseQuery && coarseQuery.matches));
  else host.began(app.widthPx(), app.heightPx(), !!(coarseQuery && coarseQuery.matches));
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
    // A PINCH IS NOT A SCROLL. A trackpad pinch and an iPad's arrive as a
    // wheel event with `ctrlKey` set, and taking it here — scrolling the
    // document and calling `preventDefault` — is what stops a page from being
    // zoomed back out. It belongs to the browser.
    if (e.ctrlKey) return;
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
// `?painter=dom` paints the page as DOM nodes that survive a frame —
// `gallery/evg/html/evg-dom.js` on the host tree (`app.hostJson()`) — under a
// transparent canvas that still takes the pointer, so every handler below
// is the same one the WebGL page uses. The default is the WebGL painter.
const painterMode = params.get("painter") || "gl";
let domPainter = null;
if (painterMode === "dom") {
  const domRoot = document.createElement("div");
  domRoot.id = "dom";
  domRoot.style.position = "absolute";
  domRoot.style.left = "0";
  domRoot.style.top = "0";
  domRoot.style.width = "100%";
  domRoot.style.background = "#ffffff";
  // The nodes are a picture: the canvas above them takes the pointer, as it
  // always did, and an overlay's z-index stays inside this root's own
  // stacking context rather than climbing over the canvas.
  domRoot.style.zIndex = "0";
  domRoot.style.pointerEvents = "none";
  stage.insertBefore(domRoot, canvas);
  canvas.style.position = "relative";
  canvas.style.zIndex = "1";
  canvas.style.background = "transparent";
  domPainter = createDomPainter(domRoot);
  window.__evgDom = domPainter;
}
const glMode = params.get("gl") || "";
const gl = painterMode === "dom" ? null : canvas.getContext("webgl2", {
  antialias: glMode !== "noaa",
  premultipliedAlpha: false,
  stencil: true,
  preserveDrawingBuffer: glMode === "preserve",
});
if (!gl && !domPainter) {
  errEl.textContent = "WebGL 2 is not available in this browser.";
}

let generation = 0;
// WHO HAS THE FOCUS. The field with the text session, if there is one — its
// <input> is a real element and the reader's cursor belongs in it — and
// otherwise nobody here: the app answers with its own ring, which is the one
// focus the pointer and the keyboard now share. See `RealTrainerDemo.a11yJson`.
const a11yFocus = () => app.focusedField();

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
    if (app.hasField(node.id)) {
      if (app.focusedField() !== node.id) {
        app.setFocus(node.id);
        app.rebuild();
      }
    } else if (app.focusedField()) {
      app.setFocus("");
      app.rebuild();
    }
    // …and the ring goes with it, so a reader that moved its own cursor and
    // the drawn ring are in the same place. Two focuses on one page is the
    // bug this is here to stop.
    app.focusOn(node.id);
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

// Input-to-paint latency: the time from the last pointer down to the frame
// that showed it, published for the check that compares this host to the
// one whose engine is in a Worker.
let inputAt = 0;
window.__latency = 0;

function paint() {
  if (domPainter) {
    try {
      errEl.textContent = "";
      const hostTree = JSON.parse(app.hostJson());
      window.__lastHost = domPainter.apply({ width: app.widthPx(), height: app.heightPx(), host: hostTree });
      if (inputAt) {
        window.__latency = performance.now() - inputAt;
        inputAt = 0;
      }
      sceneEl.textContent = app.sceneName();
      retireFirstPicture();
    } catch (e) {
      errEl.textContent = String((e && e.stack) || e);
    }
    return;
  }
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
    if (inputAt) {
      window.__latency = performance.now() - inputAt;
      inputAt = 0;
    }
    sceneEl.textContent = app.sceneName();
    retireFirstPicture();
  } catch (e) {
    errEl.textContent = String((e && e.stack) || e);
  }
}

// --- the first picture, and when it is allowed to go ---------------------------
//
// `index.html` carries a picture of this app's chrome, computed in the build
// from the app's own display list (web/snapshot.mjs). It paints while this
// bundle is still downloading, and it is removed HERE — not when the script
// arrived, not when the app was constructed, but when a live frame has been
// PAINTED over it (PLAN_WEB_LOADING.md S3.2). Removing it a frame early is the
// one blank frame the whole exercise exists to avoid.
let firstPicture = document.getElementById("rt-t0");
function retireFirstPicture() {
  if (!firstPicture) return;
  const layer = firstPicture;
  firstPicture = null;
  // A draw call is issued, not shown. Two frames on: by then the compositor
  // has the pixels that replace what is being taken away.
  requestAnimationFrame(() => requestAnimationFrame(() => layer.remove()));
}

// The accessibility tree. `now` is the frame's clock; pass nothing to mean
// "this one matters, do it" — a press, a focus, an edit.
function syncMirror(now) {
  if (!gl && !domPainter) return;
  if (now !== undefined && now < mirrorDue) return;
  mirrorDue = (now === undefined ? performance.now() : now) + MIRROR_MIN_GAP_MS;
  try {
    generation += 1;
    mirror.update(JSON.parse(app.a11yJson(generation, a11yFocus())));
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

// What an export put on the clipboard, once. The app writes the text into
// `clipboard` — see `RealTrainerDemo.pressEntryCard`, which has no clipboard
// of its own to write to — and this is the browser's half of it. A refusal
// (no permission, no secure context) is not an error worth showing: the toast
// the app drew already said what happened, and the text is still readable in
// the app.
let lastClip = "";
function syncClipboard() {
  const text = app.clipboard;
  if (!text || text === lastClip) return;
  lastClip = text;
  navigator.clipboard?.writeText(text).catch(() => {});
}

// A press from the accessibility tree — a screen reader activating a node —
// is a press: down and then up, through the host, so it takes exactly the
// path a finger takes and cannot drift from it.
function press(x, y) {
  host.pressAt(x, y);
  if (host.releasePress()) paintAll();
  syncClipboard();
  syncTextSession();
}

// The keys of an open menu: the arrows, Home, End, Tab and Escape go to the
// app, which walks the menu with them and keeps the focus inside it — a
// focus trap, held by the app rather than by the DOM. Enter and Space go
// too: a menu item is a div with a role, not a button, and no key clicks
// it on its own. The listener is on the document because the key lands on
// whichever mirror element has the focus.
const MENU_KEYS = new Set(["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End", "Tab", "Escape", "Enter", " "]);
// …and the same keys drive the ring when no menu is open. A drawn UI has no
// tab stops of its own — the canvas is one element and everything in it is a
// rectangle — so `EVGFocus` keeps the order and the app draws the ring; this
// only has to hand the key over and stop the page acting on it as well.
// Nothing is taken while a text field has the keyboard: there the arrows move
// a caret, which is the platform's job and not ours.
document.addEventListener("keydown", (ev) => {
  if (!MENU_KEYS.has(ev.key)) return;
  if (!app.menuOpen() && app.focusedField()) return;
  if (host.key(ev.key, ev.shiftKey, ev.ctrlKey || ev.metaKey)) {
    ev.preventDefault();
    paintAll();
    syncMirror();
    // A Tab that landed on a text field HANDS IT THE KEYBOARD — see
    // `RealTrainerDemo.keyboardTo` — so the session follows it there, or the
    // ring sits on a field the next letter does not reach. After the mirror,
    // because the field's <input> IS a mirror element.
    syncTextSession();
  }
});

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
    // Tab leaves the field, and the APP is what moves it. Letting the browser
    // do it worked only as far as the mirror's tab order reached — a disabled
    // send button is no tab stop, and the next one is somewhere else on the
    // page — so the ring and the reader's cursor ended up in different
    // places. Now `EVGFocus` picks the next control and the mirror follows.
    if (k.key === "Tab") {
      const took = host.key("Tab", k.shiftKey, false);
      textInput.release();
      syncTextSession();
      paintAll();
      syncMirror();
      return took;
    }
    if (k.key !== "Escape" && k.key !== "Enter") return false;
    const took = host.key(k.key, k.shiftKey, k.ctrlKey || k.metaKey);
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
  if (textInput.activeTid() === tid) {
    textInput.sync(st);
    return;
  }
  // The mirror's input for the field, once the mirror has drawn it — and if
  // it has not (a Tab that only just moved the focus on to it), the mirror is
  // brought up to date first, because that element IS the text session.
  if (!mirror.elementOf(tid)) syncMirror();
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
// How many fingers are on the glass. A pinch is two, and the moment the
// second arrives the drag is over: the app must not scroll the page out from
// under a gesture the browser is using to zoom it.
const down = new Set();
canvas.addEventListener("pointerdown", (ev) => {
  down.add(ev.pointerId);
  if (down.size > 1) {
    // A second finger: the drag is over, and the app must not scroll the page
    // out from under a gesture the browser is using to zoom it.
    drag = null;
    host.cancelPress();
    paint();
    return;
  }
  const [x, y] = at(ev);
  inputAt = performance.now();
  // Everything a finger down means is `pressAt`: catch the glide where it is,
  // take the scrollbar's thumb if that is what is under it, otherwise mark
  // what is. The same call the UIKit view and the Android View make.
  host.pressAt(x, y);
  drag = { y };
  canvas.setPointerCapture(ev.pointerId);
  paint();
});
canvas.addEventListener("pointerup", (ev) => {
  down.delete(ev.pointerId);
  drag = null;
  // And everything a finger UP means is `releasePress`: let the thumb go, or
  // let a moving page carry on, or activate what was marked — the host knows
  // which, because it is the one that marked it.
  if (host.releasePress()) paintAll();
  else dirty = true;
  syncClipboard();
  syncTextSession();
});
canvas.addEventListener("pointercancel", (ev) => {
  down.delete(ev && ev.pointerId);
  drag = null;
  host.cancelPress();
  paint();
});
canvas.addEventListener("pointermove", (ev) => {
  if (down.size > 1) return;
  const [x, y] = at(ev);
  if (drag) {
    const dy = y - drag.y;
    drag.y = y;
    // NOT painted from here. The frame loop draws once per frame however many
    // moves the browser delivers — a finger reports faster than the screen
    // refreshes, and painting per event is painting frames nobody ever sees.
    //
    // `panBy` is the whole gesture: past six points of travel the mark comes
    // off what was pressed, the thumb is dragged instead if the thumb is what
    // was taken, and the app is told how long the move took as well as how
    // far, because that is what decides where a lift throws it.
    if (host.panBy(0, dy)) {
      dirty = true;
      scrolledAt = ev.timeStamp || performance.now();
    }
    return;
  }
  // The scrollbar first: the pointer on its thumb lights it, and hovers
  // nothing under it. `hoverAt` does both.
  if (host.hoverAt(x, y)) dirty = true;
  canvas.style.cursor = app.overScrollbar() ? "default" : "";
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
    // Through the host: it holds the window and the safe area, and the app is
    // laid out for what is left. The phones call exactly this on a rotation.
    host.resize(w, h);
    sizeCanvas();
    paintAll();
  };
  new ResizeObserver(refit).observe(stage);
  window.addEventListener("resize", refit);
  if (coarseQuery && coarseQuery.addEventListener) coarseQuery.addEventListener("change", refit);
}

canvas.addEventListener("pointerleave", () => {
  // Nothing is under a pointer that has left. `clearHover` is the host's
  // answer and it is the same one on a phone, where a finger lifting leaves.
  if (host.clearHover()) dirty = true;
  app.scrollbarHover(-1, -1);
  dirty = true;
});

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
  const ticked = host.tick(dt);
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
  // …nor while a long feed is still arriving in chunks: each chunk is a new
  // tree, and the mirror of a hundred cards is built once, from the last.
  if (moving === false && !app.building()) syncMirror(now);
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
Promise.all([document.fonts.ready, seedOrDeadline]).then(() => {
  // The faces are in: forget what was measured with the fallback and lay
  // the page out again with the real ones.
  fontMeasure.refresh();
  if (seedPending) {
    app.loadReference(seedPending);
    seedPending = null;
  }
  app.rebuild();
  booted = true;
  paintAll();
  requestAnimationFrame(step);
  // AND NOW THE CHARTS. Vela's compiler is 440 KB of the app and only the
  // statistics tab wants it, so nothing on the path to this frame names it
  // and the bundler gave it a chunk of its own (RtCharts.rgr,
  // charts-chunk.js). Asked for here, after a frame is up: the cards draw
  // their numbers without curves until it lands, and with them after.
  import("./charts-chunk.js")
    .then(() => {
      window.__rtChartsReady = true;
      app.rebuild();
      paintAll();
    })
    .catch((e) => console.warn("charts unavailable:", e));
});
