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
const pageParam = params.get("page");
const fit = !pageParam || pageParam === "fit";
const coarseQuery = window.matchMedia ? window.matchMedia("(pointer: coarse)") : null;
const coarse = !!(coarseQuery && coarseQuery.matches);

let W = 0, H = 0;
if (fit) {
  document.body.classList.add("fit");
  W = stage.clientWidth;
  H = stage.clientHeight;
} else {
  const [w, h] = pageParam.split("x").map(Number);
  if (w > 0 && h > 0) { W = w; H = h; }
}
const route = params.get("route") || (fit ? "/" : "");

// The worker, and the app inside it.
const worker = new Worker(new URL("./worker-bundle.js", import.meta.url), { type: "module" });
const engine = connectEngine(worker, { w: W, h: H, coarse, route });
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
    focus = node.id;
    engine.post("@a11yFocus", focus);
    engine.call("hasField", node.id).then((has) => {
      if (has) {
        if (state.field !== node.id) {
          engine.post("setFocus", node.id);
          engine.post("rebuild");
        }
      } else if (state.field) {
        engine.post("setFocus", "");
        engine.post("rebuild");
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
    if (k.key === "Tab") {
      textInput.release();
      engine.post("setFocus", "");
      engine.post("rebuild");
      changed();
      return false;
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
canvas.addEventListener("pointerdown", (ev) => {
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
canvas.addEventListener("pointercancel", () => {
  if (drag?.bar) engine.post("scrollbarRelease");
  drag = null;
  engine.post("scrollHalt");
  engine.post("setPressed", "");
  dirty = true;
});
canvas.addEventListener("pointermove", (ev) => {
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
      if (cur[0] !== 0 || cur[1] !== 0) {
        o = { ...c, x: c.x + cur[0], y: c.y + cur[1] };
        if (c.pts) o.pts = c.pts.map((v, i) => v + (i % 2 === 0 ? cur[0] : cur[1]));
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
