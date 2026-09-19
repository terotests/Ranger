// SPDX-License-Identifier: MIT
//
// The effect driver: what turns a pointer into the events a surface effect
// reads, from what the DOCUMENT said rather than from what the page's code
// remembered to do.
//
// BEFORE THIS, the ripple was driven like this, in the demo's own main.js:
//
//   canvas.addEventListener("pointerdown", (ev) => {
//     app.ripple(ev.offsetX, ev.offsetY);   // every press, anywhere
//   });
//
// and the application kept the drops, aged them on every tick, retired them,
// and stamped them onto the root at paint time. Three arrays of state and four
// methods on a dashboard, for an effect the dashboard has no opinion about.
// Nothing in that chain could answer "which element ripples" — the answer was
// "the page", because the effect was the page's.
//
// Now the document answers it:
//
//   .card    { evg-surface-effect: ripple;    evg-effect-on: press drag }
//   .hero-sky { evg-surface-effect: starfield; evg-effect-on: always }
//
// and this file is the whole of the wiring:
//
//   const fx = createEffectDriver();
//   attachEffectPointer(canvas, fx, () => schedule());   // optional
//   // per frame:
//   fx.tick(dtMs, list);      // ages the events, stamps the clock on
//   renderDisplayList(gl, { width, height, list }, { dpr });
//
// WHAT IT OWNS is the events: where a press landed, in PAGE pixels, and how
// long ago. What it does not own is anything about how they look — that is the
// plugin's, in `evg-webgl.js` — or which element they belong to, which is the
// display list's, because that came from the stylesheet.
//
// WHY IT IS NOT IN THE ENGINE. The engine has no pointer. A press is a browser
// event on the web, a MotionEvent on Android and a UITouch on iOS, and the one
// thing all three have in common is that the box they landed in is already in
// the display list. So the driver is per host and small, and the part that is
// the same everywhere — which box, what trigger, how the event ages — is here
// rather than written again in each one.

/** How far a drag travels before it drops another event, in page pixels.
 *  Closer and the rings pile into one bright blob; further and a wake reads
 *  as a row of separate taps. */
const DRAG_STEP = 26;

/** The most events one instance carries. Eight is what a dragged finger fills
 *  in a third of a second, and it is what the shaders' `MAX_EVENTS` is. */
const MAX_EVENTS = 8;

/** How long an event lives, in seconds. The ripple's own decay has taken it
 *  under a 250th by three seconds, so this is the renderer's number and not a
 *  guess. */
const LIFE = 3;

/** Does this instance's trigger list mention `what`? A trigger is a list of
 *  words — `press drag` — because a card can want both and CSS has no better
 *  shape for "one or more of these". */
export function triggerHas(inst, what) {
  const on = (inst && inst.on) || "";
  return on.length > 0 && on.split(/[\s,]+/).indexOf(what) >= 0;
}

/** Is the point inside the instance's box? Corners are not tested: an effect
 *  is triggered by a press on the element, and the element's rounded corner is
 *  a question about painting rather than about who was pressed. */
function inBox(inst, x, y) {
  const b = inst.box;
  return !!b && x >= b[0] && y >= b[1] && x <= b[0] + b[2] && y <= b[1] + b[3];
}

export function createEffectDriver(opts = {}) {
  // Per instance id: the events in flight and where the last drag event was
  // dropped. Keyed by ID and not by object, because the display list is
  // rebuilt — a reflow makes new instance objects for the same elements, and
  // a ripple must not die because the window was resized.
  const state = new Map();
  // Seconds since the driver was made. What `always` effects run on, and the
  // reason a starfield needs no events at all.
  let clock = 0;
  const life = opts.life === undefined ? LIFE : opts.life;
  const step = opts.dragStep === undefined ? DRAG_STEP : opts.dragStep;

  const stateFor = (id) => {
    let st = state.get(id);
    if (!st) { st = { events: [], lastX: -1, lastY: -1 }; state.set(id, st); }
    return st;
  };

  // The instances of the list last synced, newest first — the reverse of paint
  // order, so the TOPMOST element that wants the event gets it. Two effects
  // that overlap are a stack, and a press belongs to the one on top.
  let instances = [];

  const fire = (x, y, what) => {
    let hit = null;
    for (let i = instances.length - 1; i >= 0; i -= 1) {
      const inst = instances[i];
      if (!triggerHas(inst, what)) continue;
      if (!inBox(inst, x, y)) continue;
      hit = inst;
      break;
    }
    if (!hit) return null;
    const st = stateFor(hit.id);
    st.events.push([x, y, 0]);
    if (st.events.length > MAX_EVENTS) st.events.shift();
    st.lastX = x;
    st.lastY = y;
    return hit;
  };

  return {
    /** The instances this driver is watching, for a host that wants to look. */
    instances: () => instances,

    /** Seconds since the driver was made. */
    time: () => clock,

    /** Take the list of the frame about to be drawn, advance every event by
     *  `dtMs`, and stamp what the painter reads onto each instance.
     *
     *  IT MUTATES THE LIST, and that is deliberate: the instances are the
     *  painter's own objects, so a host that keeps a built frame across many
     *  draws sees the events move without rebuilding anything. Nothing in the
     *  tree changes — the clock is not in the document, which is what keeps a
     *  running effect off the layout's critical path entirely. */
    tick(dtMs, list) {
      const dt = (dtMs || 0) / 1000;
      clock += dt;
      for (const st of state.values()) {
        if (!st.events.length) continue;
        const kept = [];
        for (const e of st.events) {
          e[2] += dt;
          if (e[2] < life) kept.push(e);
        }
        st.events = kept;
      }
      instances = (list && list.effects) || [];
      for (const inst of instances) {
        const st = state.get(inst.id);
        inst.events = st ? st.events : [];
        inst.time = clock;
      }
      return this.busy();
    },

    /** Is anything still moving? A page whose effects are all idle can stop
     *  asking for frames, which is the difference between an effect and a
     *  background process. */
    busy() {
      for (const inst of instances) {
        if (triggerHas(inst, "always")) return true;
        const st = state.get(inst.id);
        if (st && st.events.length) return true;
      }
      return false;
    },

    /** A press at a point in PAGE pixels. Returns the instance it went to, or
     *  null when it landed on nothing that wanted it — which is the ordinary
     *  case, and the whole difference from a page that ripples everywhere. */
    press(x, y) { return fire(x, y, "press"); },

    /** The pointer moving with the button down. One event per step rather than
     *  one that follows the pointer: a wake is a row of sources, and a single
     *  source that moves has no history. */
    drag(x, y) {
      for (let i = instances.length - 1; i >= 0; i -= 1) {
        const inst = instances[i];
        if (!triggerHas(inst, "drag")) continue;
        if (!inBox(inst, x, y)) continue;
        const st = stateFor(inst.id);
        if (st.lastX < 0) { st.lastX = x; st.lastY = y; return null; }
        const dx = x - st.lastX, dy = y - st.lastY;
        if (dx * dx + dy * dy < step * step) return null;
        return fire(x, y, "drag");
      }
      return null;
    },

    /** The pointer moving with no button down. */
    hover(x, y) { return fire(x, y, "hover"); },

    /** The button came up: the next drag starts a fresh trail rather than
     *  joining the last one. */
    release() {
      for (const st of state.values()) { st.lastX = -1; st.lastY = -1; }
    },

    /** Everything in flight, gone. For a host that navigated away from the
     *  page the events belonged to. */
    clear() { state.clear(); },
  };
}

/**
 * The web host's three lines of it. `onChange` is called whenever something
 * happened that the page has to draw — a host that is already drawing every
 * frame can leave it out.
 *
 * The coordinates are `offsetX`/`offsetY`, which are CSS pixels relative to the
 * canvas, which is the page space the display list is in. A canvas with a
 * camera on it has to unproject them first, and then this is the wrong helper —
 * pass the driver the page point yourself.
 */
export function attachEffectPointer(canvas, driver, onChange) {
  const poke = () => { if (onChange) onChange(); };
  const down = (ev) => { if (driver.press(ev.offsetX, ev.offsetY)) poke(); };
  const move = (ev) => {
    const hit = ev.buttons ? driver.drag(ev.offsetX, ev.offsetY) : driver.hover(ev.offsetX, ev.offsetY);
    if (hit) poke();
  };
  const up = () => driver.release();
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("pointerleave", up);
  return () => {
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", up);
    canvas.removeEventListener("pointercancel", up);
    canvas.removeEventListener("pointerleave", up);
  };
}
