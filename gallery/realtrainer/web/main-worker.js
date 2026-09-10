// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The browser host, with the engine in a Worker.
//
// `main.js` owns the clock, the pointer and the pixels, and calls the app
// for everything else — synchronously, on the main thread, which is where a
// twelve-millisecond layout blocks the pointer and the compositor. This is
// the same host written the other way round (PLAN_NATIVE_HOSTS.md S1): the
// app lives in `engine-worker.js`, this file POSTS what it used to call and
// PAINTS what comes back, and nothing here can read the app synchronously.
//
// What that changes, and what it does not:
//
//   * A pointer event is a post, queued; the frame loop sends the queue and
//     asks for the frame in ONE message, and gets ONE reply — new buffers, a
//     kept list that moved, or nothing — which is exactly the three cases
//     `main.js` distinguishes with `buildSeq` and `frameSeq`.
//   * The hit test happens in the worker, beside the tree: `@hover`, `@down`
//     and `@up` in engine-worker.js are the three-call sequences main.js ran
//     here. The cursor is set from the state every reply carries.
//   * The accessibility mirror and the text bridge are unchanged; what they
//     read is fetched with `call` and arrives a message later.
//   * `window.__app` is a shim for the checks: the same names, answered from
//     the last reply's state, or as promises.
//
// The latency this costs is one message each way, measured by the check as
// pointer-down to the frame that showed it and published as `__latency` in
// both hosts.

import { prepareDisplayList } from "../../evg/gl/evg-webgl.js";
import { createA11yMirror, pressAtCentre } from "../../evg/gl/evg-a11y.js";
import { createTextInputBridge } from "../../evg/gl/evg-textinput.js";
import { connectEngine } from "../../evg/gl/evg-engine.js";

const stage = document.getElementById("stage");
const canvas = document.getElementById("c");
const errEl = document.getElementById("err");
const fpsEl = document.getElementById("fps");
const sceneEl = document.getElementById("scene");

const params = new URLSearchParams(location.search);
// The page mode was settled in the document's head, before anything painted
// (see index.html). Reading it back is what keeps the chrome the document
// shows and the size the app lays out for from ever disagreeing — they used
// to be decided in two places, a second apart.
const { fit, w: pinnedW, h: pinnedH } = window.__rtPage;
const coarseQuery = window.matchMedia ? window.matchMedia("(pointer: coarse)") : null;
const coarse = !!(coarseQuery && coarseQuery.matches);

let W = 0, H = 0;
if (fit) {
  W = stage.clientWidth;
  H = stage.clientHeight;
} else if (pinnedW > 0 && pinnedH > 0) {
  W = pinnedW;
  H = pinnedH;
}
const route = params.get("route") || (fit ? "/" : "");

// The worker, and the app inside it.
const worker = new Worker(new URL("./worker-bundle.js", import.meta.url), { type: "module" });
/** `YYYY-MM-DD` in the viewer's own timezone — `toISOString()` is UTC, which
 *  is yesterday here for the first hours of the morning. */
function localIsoDay(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const engine = connectEngine(worker, { w: W, h: H, coarse, route, today: localIsoDay(new Date()) });
engine.onError((e) => { errEl.textContent = e.during + "\n" + e.message; });

const dpr = Math.min(2, window.devicePixelRatio || 1);
function sizeCanvas(w, h) {
  W = w;
  H = h;
  dropFrame();
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  if (!fit) {
    stage.style.width = W + "px";
    stage.style.height = H + "px";
  }
}
sizeCanvas(W, H);

const glMode = params.get("gl") || "";
const gl = canvas.getContext("webgl2", {
  antialias: glMode !== "noaa",
  premultipliedAlpha: false,
  stencil: true,
  preserveDrawingBuffer: glMode === "preserve",
});
if (!gl) errEl.textContent = "WebGL 2 is not available in this browser.";

// --- the frame ----------------------------------------------------------------

let frame = null;
let frameDoc = null;
function dropFrame() {
  if (frame) frame.dispose();
  frame = null;
  frameDoc = null;
}

let dirty = true;
let scrolledAt = 0;
const STILL_SCROLLING_MS = 200;
let inputAt = 0;
window.__latency = 0;

// The last state the worker reported, and the last tree it was asked for.
let state = {};
let lastA11y = '{"nodes":[]}';
let lastShifts = [];

const isMoving = (now) => drag !== null || (state.velocity || 0) !== 0 || now - scrolledAt < STILL_SCROLLING_MS;

function applyReply(r) {
  state = r.state || state;
  // The clipboard rides on the state, so it is read here and not at the press
  // — the press is a post and its answer comes back on a later turn.
  syncClipboard();
  if (r.t === "frame") {
    dropFrame();
    if (gl) frame = prepareDisplayList(gl, { width: W, height: H, list: r.doc.list }, { dpr });
    frameDoc = r.doc;
    lastShifts = r.shifts;
    // The tree that came with the build. The mirror takes it now unless the
    // page is being thrown around, in which case the settled sync below
    // will — but what the checks read is current either way.
    if (r.built && r.built.a11y) {
      lastA11y = r.built.a11y;
      if (!isMoving(performance.now())) {
        try { mirror.update(JSON.parse(lastA11y)); } catch (e) { errEl.textContent = String(e); }
        mirrorDue = performance.now() + MIRROR_MIN_GAP_MS;
      }
    }
  } else if (r.t === "shift") {
    lastShifts = r.shifts;
  } else {
    return false;
  }
  if (frame) window.__lastStats = frame.draw(lastShifts);
  if (inputAt) {
    window.__latency = performance.now() - inputAt;
    inputAt = 0;
  }
  sceneEl.textContent = state.scene || "";
  canvas.style.cursor = state.overBar ? "default" : "";
  return true;
}

// --- the accessibility mirror -------------------------------------------------

let generation = 0;
// WHO HAS THE FOCUS. The field with the text session, if there is one — its
// <input> is a real element and the reader's cursor belongs in it — and
// otherwise nobody here: the app answers with its own ring, which is the one
// focus the pointer and the keyboard now share. See `RealTrainerDemo.a11yJson`.
let focus = "";
const MIRROR_MIN_GAP_MS = 250;
let mirrorDue = 0;
let mirrorInFlight = false;

const mirror = createA11yMirror(stage, {
  canvas,
  label: "RealTrainer demo",
  tabbable: "all",
  onActivate: (node) => pressAtCentre(node, (x, y) => press(x, y)),
  onFocus: (node) => {
    engine.call("hasField", node.id).then((has) => {
      if (has) {
        focus = node.id;
        engine.post("@a11yFocus", focus);
        if (state.field !== node.id) {
          engine.post("setFocus", node.id);
          engine.post("rebuild");
        }
      } else {
        // Not a field: the ring is where the focus lives, so the app is told
        // to move it and the mirror follows the ring on the next tree. A
        // reader's cursor and the drawn ring in different places is two
        // focuses on one page.
        focus = "";
        engine.post("@a11yFocus", "");
        engine.post("focusOn", node.id);
        if (state.field) {
          engine.post("setFocus", "");
          engine.post("rebuild");
        }
      }
      dirty = true;
      syncTextSession();
    });
  },
});

async function syncMirror(now) {
  if (!gl || mirrorInFlight) return;
  if (now !== undefined && now < mirrorDue) return;
  mirrorDue = (now === undefined ? performance.now() : now) + MIRROR_MIN_GAP_MS;
  mirrorInFlight = true;
  try {
    generation += 1;
    const json = await engine.call("a11yJson", generation, focus);
    lastA11y = json;
    mirror.update(JSON.parse(json));
  } catch (e) {
    errEl.textContent = String((e && e.stack) || e);
  } finally {
    mirrorInFlight = false;
  }
}

// Something changed the app: draw on the next frame and rebuild the mirror
// after it — at once when a field has the keyboard, because the field IS a
// mirror element and the text session is about to want it.
function changed() {
  dirty = true;
  mirrorDue = 0;
}

function at(ev) {
  const r = canvas.getBoundingClientRect();
  return [ev.clientX - r.left, ev.clientY - r.top];
}

// What an export put on the clipboard, once — see main.js.
let lastClip = "";
function syncClipboard() {
  const text = state.clip;
  if (!text || text === lastClip) return;
  lastClip = text;
  navigator.clipboard?.writeText(text).catch(() => {});
}

function press(x, y) {
  engine.post("@up", x, y);
  changed();
  syncTextSession();
}

// --- the text fields -----------------------------------------------------------

const textInput = createTextInputBridge({
  host: stage,
  canvas,
  onEdit: async ({ value, selStart, selEnd }) => {
    const tid = textInput.activeTid();
    if (!tid) return;
    const took = await engine.call("applyEdit", tid, value, selStart, selEnd);
    if (!took) return;
    changed();
    const after = JSON.parse(await engine.call("fieldStateJson", tid));
    if (after && after.value !== value) textInput.sync(after);
  },
  onKey: (k) => {
    // Tab leaves the field, and the APP is what moves it — see main.js. The
    // browser's own tab order is the mirror's, which stops at whatever
    // happens to be a tab stop; `EVGFocus` picks the next control instead.
    if (k.key === "Tab") {
      textInput.release();
      focus = "";
      engine.post("@a11yFocus", "");
      engine.call("keyWith", "Tab", k.shiftKey, false).then(() => {
        changed();
        syncTextSession();
      });
      return true;
    }
    if (k.key !== "Escape" && k.key !== "Enter") return false;
    engine.call("keyWith", k.key, k.shiftKey, k.ctrlKey || k.metaKey).then((took) => {
      if (took) changed();
      syncTextSession();
    });
    // The app is asked; the browser is told it was taken so the key does
    // not also reach the page. Escape and Enter have no default in a field.
    return true;
  },
});

// THE RING'S KEYS. A drawn UI has no tab stops — the canvas is one element and
// everything in it is a rectangle — so `EVGFocus` on the Ranger side keeps the
// order and the app draws the ring; this hands the key over and stops the page
// acting on it as well. The engine is behind a worker here, so the answer
// comes back as a promise and the frame is asked for when it does.
//
// Nothing is taken while a text field has the keyboard: there the arrows move
// a caret, which is the platform's job.
const NAV_KEYS = new Set(["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End", "Tab", "Escape", "Enter", " "]);
document.addEventListener("keydown", (ev) => {
  if (!NAV_KEYS.has(ev.key)) return;
  if (textInput.activeTid()) return;
  ev.preventDefault();
  engine.call("keyWith", ev.key, ev.shiftKey, ev.ctrlKey || ev.metaKey).then((took) => {
    if (took) changed();
    // A Tab that landed on a text field hands it the keyboard — see
    // `RealTrainerDemo.keyboardTo` — so the session follows it there.
    syncTextSession();
  });
});

// Hand the keyboard to the field the app says is focused, or take it back.
// Two messages: the field, then its state — and the mirror's element for it,
// which is fetched with the tree if the mirror has not drawn it yet.
let sessionSync = 0;
async function syncTextSession() {
  const my = ++sessionSync;
  const tid = await engine.call("focusedField");
  if (my !== sessionSync) return;
  if (!tid) {
    textInput.blurField();
    return;
  }
  const st = JSON.parse(await engine.call("fieldStateJson", tid));
  if (my !== sessionSync) return;
  if (!st) {
    textInput.blurField();
    return;
  }
  if (focus !== tid) {
    focus = tid;
    engine.post("@a11yFocus", focus);
  }
  if (textInput.activeTid() === tid) {
    textInput.sync(st);
    return;
  }
  if (!mirror.elementOf(tid)) {
    mirrorDue = 0;
    await syncMirror();
  }
  textInput.focusField(tid, st, mirror.elementOf(tid));
}

// --- input -----------------------------------------------------------------------

stage.addEventListener(
  "wheel",
  (e) => {
    // A PINCH IS NOT A SCROLL. A trackpad pinch and an iPad's arrive as a
    // wheel event with `ctrlKey` set, and taking it here — scrolling and
    // calling `preventDefault` — is what stops a page from being zoomed back
    // out. It belongs to the browser.
    if (e.ctrlKey) return;
    engine.post("scrollHalt");
    engine.post("scrollDocument", e.deltaY);
    dirty = true;
    scrolledAt = performance.now();
    e.preventDefault();
  },
  { passive: false },
);

let drag = null;
let barGrab = null;
// How many fingers are on the glass. A pinch is two, and the moment the
// second arrives the drag is over: the app must not scroll the page out from
// under a gesture the browser is using to zoom it.
const down = new Set();
canvas.addEventListener("pointerdown", (ev) => {
  down.add(ev.pointerId);
  if (down.size > 1) {
    drag = null;
    barGrab = null;
    engine.post("scrollHalt");
    engine.post("setPressed", "");
    dirty = true;
    return;
  }
  const [x, y] = at(ev);
  inputAt = performance.now();
  canvas.setPointerCapture(ev.pointerId);
  // Whether the thumb took the press is the worker's to say; the drag is
  // started on the answer, and moves before it arrives go to the page.
  barGrab = engine.call("scrollbarGrab", x, y).then((took) => {
    barGrab = null;
    if (took) {
      drag = { bar: true };
      dirty = true;
    }
  });
  drag = { y, moved: false, at: ev.timeStamp || performance.now() };
  engine.post("@down", x, y);
  dirty = true;
});
canvas.addEventListener("pointerup", (ev) => {
  down.delete(ev.pointerId);
  const [x, y] = at(ev);
  const finish = () => {
    if (drag?.bar) {
      drag = null;
      engine.post("scrollbarRelease");
      dirty = true;
      return;
    }
    const scrolled = drag?.moved;
    drag = null;
    if (scrolled) {
      engine.post("scrollRelease");
      engine.post("setPressed", "");
      dirty = true;
      return;
    }
    press(x, y);
  };
  if (barGrab) barGrab.then(finish); else finish();
});
canvas.addEventListener("pointercancel", (ev) => {
  down.delete(ev && ev.pointerId);
  if (drag?.bar) engine.post("scrollbarRelease");
  drag = null;
  engine.post("scrollHalt");
  engine.post("setPressed", "");
  dirty = true;
});
canvas.addEventListener("pointermove", (ev) => {
  if (down.size > 1) return;
  const [x, y] = at(ev);
  if (drag && drag.bar) {
    engine.post("scrollbarDrag", y);
    dirty = true;
    scrolledAt = ev.timeStamp || performance.now();
    return;
  }
  if (drag) {
    const dy = drag.y - y;
    if (drag.moved || Math.abs(dy) > 6) {
      if (!drag.moved) engine.post("setPressed", "");
      const now = ev.timeStamp || performance.now();
      const dt = now - drag.at;
      drag.at = now;
      drag.moved = true;
      drag.y = y;
      engine.post("scrollDrag", dy, dt);
      dirty = true;
      scrolledAt = now;
    }
    return;
  }
  // One post, where main.js made three calls: the worker hovers what is
  // under the point and says whether a frame is owed.
  engine.post("@hover", x, y);
  dirty = true;
});
canvas.addEventListener("pointerleave", () => {
  engine.post("@leave");
  dirty = true;
});

if (fit) {
  let lastKey = "";
  const refit = () => {
    const w = Math.max(240, Math.round(stage.clientWidth));
    const h = Math.max(240, Math.round(stage.clientHeight));
    const c = !!(coarseQuery && coarseQuery.matches);
    const key = `${w}x${h}:${c}`;
    if (key === lastKey) return;
    lastKey = key;
    engine.post("setPointerCoarse", c);
    engine.post("setPageSize", w, h);
    sizeCanvas(w, h);
    changed();
  };
  new ResizeObserver(refit).observe(stage);
  window.addEventListener("resize", refit);
  if (coarseQuery && coarseQuery.addEventListener) coarseQuery.addEventListener("change", refit);
}

// --- the frame loop ----------------------------------------------------------------

let last = performance.now();
let frames = 0;
let fpsAt = last;
async function step(now) {
  const dt = now - last;
  last = now;
  let reply;
  try {
    reply = await engine.frame(dt, dirty);
  } catch (e) {
    errEl.textContent = String((e && e.stack) || e);
    requestAnimationFrame(step);
    return;
  }
  dirty = false;
  const gliding = (state.velocity || 0) !== 0;
  applyReply(reply);
  if (gliding || (state.velocity || 0) !== 0) scrolledAt = now;
  if (isMoving(now) === false) syncMirror(now);
  frames += 1;
  if (now - fpsAt >= 500) {
    fpsEl.textContent = Math.round((frames * 1000) / (now - fpsAt)) + " fps";
    frames = 0;
    fpsAt = now;
  }
  requestAnimationFrame(step);
}

// --- for the checks ---------------------------------------------------------------
//
// The same names main.js publishes, answered from the last reply's state or
// as promises, so `frame-check.mjs` drives both hosts with one script.
window.__app = {
  sceneName: () => state.scene || "",
  a11yJson: () => lastA11y,
  fieldStateJson: (tid) => engine.call("fieldStateJson", tid),
  focusedField: () => state.field || "",
  plan: { state: () => state.plan || "" },
  chat: { state: () => state.chat || "" },
  press: (id) => { engine.post("press", id); changed(); engine.flush(); },
  typeText: (t) => { engine.post("typeText", t); changed(); engine.flush(); },
  openRoute: (r) => { engine.post("openRoute", r); changed(); engine.flush(); },
  rebuild: () => { engine.post("rebuild"); changed(); engine.flush(); },
  engine,
};
// The last frame's commands, with the layers' moves since applied — what
// `displayListJson()` would say on the main thread.
Object.defineProperty(window, "__lastList", {
  get: () => {
    if (!frameDoc) return '{"cmds":[]}';
    const base = frameDoc.list.shifts || [];
    const stack = [];
    let cur = [0, 0];
    const cmds = frameDoc.list.cmds.map((c) => {
      let o = c;
      if (c.k === 4) {
        stack.push(cur);
        if (c.layer > 0) {
          const now = lastShifts[c.layer - 1] || base[c.layer - 1] || [0, 0];
          const was = base[c.layer - 1] || [0, 0];
          cur = [now[0] - was[0], now[1] - was[1]];
        }
      }
      // A COMMAND OF ITS OWN LAYER moves with THAT layer, not with the clip it
      // happens to be between — the focus ring is drawn last and outside every
      // clip and still scrolls with the feed it is round. Same rule the
      // painter follows; see `EVGDisplayList.ringAround`.
      let mine = cur;
      if (c.k !== 4 && c.k !== 5 && c.layer > 0) {
        const now = lastShifts[c.layer - 1] || base[c.layer - 1] || [0, 0];
        const was = base[c.layer - 1] || [0, 0];
        mine = [now[0] - was[0], now[1] - was[1]];
      }
      if (mine[0] !== 0 || mine[1] !== 0) {
        o = { ...c, x: c.x + mine[0], y: c.y + mine[1] };
        if (c.pts) o.pts = c.pts.map((v, i) => v + (i % 2 === 0 ? mine[0] : mine[1]));
      }
      if (c.k === 5) cur = stack.pop() || [0, 0];
      return o;
    });
    return JSON.stringify({ cmds });
  },
});

engine.ready.then((st) => {
  state = st;
  document.fonts.ready.then(() => {
    engine.post("@refreshFonts");
    changed();
    requestAnimationFrame(step);
  });
});
