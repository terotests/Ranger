// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Pan and zoom on an EVG canvas, from the pointers the browser reports.
//
// Every page that draws a scene bigger than its canvas needs the same four
// gestures, and each of them had been written again in its own standalone:
// drag to pan, wheel to zoom, a press that does not travel is a click, and —
// missing everywhere — two fingers to pinch. This is that handling, once.
//
// WHAT IT DOES NOT DO. It never touches the scene: it reads the view the host
// gives it (`view()`) and hands back another (`setView()`), so the host keeps
// deciding what a view is, when to paint one, and how to coalesce them. The
// host's own `setView` is expected to schedule rather than paint — a pinch
// reports far more moves than a display can show.
//
// THE ANCHOR is what makes a zoom feel like a zoom: the point under the
// cursor, or under the midpoint of two fingers, stays where it is. The world
// point below it is `(screen - pan) / scale`, and keeping it there after the
// scale changes gives `pan' = screen - (screen - pan) * (scale' / scale)` —
// which is also what moves the picture when the fingers move, so a pinch pans
// and zooms in one expression rather than two that fight.
//
// A trackpad pinch is not a touch: browsers report it as a wheel with `ctrl`
// held, at a fraction of a notch per event. It gets its own factor, or a
// pinch crawls where a wheel flies. Safari's own `gesture*` events are read
// too, because a Safari trackpad may send those instead.

/** How far a press may travel and still be a click, in CSS pixels. */
const DRAG_SLOP = 4;

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/**
 * Attach pan and zoom to a canvas.
 *
 *   attachViewGestures(canvas, {
 *     view: () => ({ x, y, sc }),   // the pan and scale in force
 *     setView: (x, y, sc) => {},    // schedule this one
 *     minZoom, maxZoom,             // optional clamps
 *     onTap: (clientX, clientY) => {},   // a press that did not travel
 *     onCursor: (name) => {},       // "grab" / "grabbing", for the host's CSS
 *   })
 *
 * Returns a function that removes every listener again.
 */
export function attachViewGestures(el, opts) {
  const view = opts.view;
  const setView = opts.setView;
  const minZoom = opts.minZoom ?? 0.05;
  const maxZoom = opts.maxZoom ?? 16;
  const onTap = opts.onTap || (() => {});
  const onCursor = opts.onCursor || (() => {});

  // Every pointer currently down on the canvas, in canvas coordinates.
  const points = new Map();
  let drag = null;   // one pointer: a pan, or a click that has not moved yet
  let pinch = null;  // two pointers: the scale and the midpoint they started at
  let gestureScale = 1;

  const at = (ev) => {
    const r = el.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  };

  /** Scale by `factor` about a point on the canvas, which stays put. */
  function zoomAbout(factor, px, py) {
    const now = view();
    const next = Math.min(maxZoom, Math.max(minZoom, now.sc * factor));
    if (next === now.sc) return;
    const k = next / now.sc;
    setView(px - (px - now.x) * k, py - (py - now.y) * k, next);
  }

  function beginPinch() {
    const [a, b] = [...points.values()];
    pinch = { d0: dist(a, b), m0: mid(a, b), view: { ...view() } };
    drag = null;
    onCursor("grabbing");
  }

  function movePinch() {
    const [a, b] = [...points.values()];
    const d = dist(a, b);
    if (!pinch.d0 || !d) return;
    const m = mid(a, b);
    const want = pinch.view.sc * (d / pinch.d0);
    const sc = Math.min(maxZoom, Math.max(minZoom, want));
    const k = sc / pinch.view.sc;
    // The world point under the fingers' midpoint when the pinch began is
    // put back under the midpoint where they are now: the spread scales,
    // the travel pans.
    setView(m.x - (pinch.m0.x - pinch.view.x) * k, m.y - (pinch.m0.y - pinch.view.y) * k, sc);
  }

  // Capture keeps the moves coming when a finger leaves the canvas, and is
  // not worth a broken gesture when the browser will not give it: a pointer
  // the host synthesised has no capture to take.
  const capture = (id) => { try { el.setPointerCapture(id); } catch (_) { /* no capture */ } };
  const release = (id) => { try { if (el.hasPointerCapture(id)) el.releasePointerCapture(id); } catch (_) { /* gone */ } };

  const onDown = (ev) => {
    points.set(ev.pointerId, at(ev));
    capture(ev.pointerId);
    if (points.size === 2) {
      beginPinch();
      return;
    }
    if (points.size > 2) return;
    const now = view();
    drag = { id: ev.pointerId, from: at(ev), ox: now.x, oy: now.y, moved: false, button: ev.button };
  };

  const onMove = (ev) => {
    if (!points.has(ev.pointerId)) return;
    points.set(ev.pointerId, at(ev));
    if (pinch && points.size >= 2) {
      movePinch();
      return;
    }
    if (!drag || ev.pointerId !== drag.id) return;
    const p = at(ev);
    const dx = p.x - drag.from.x;
    const dy = p.y - drag.from.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < DRAG_SLOP) return;
    if (!drag.moved) onCursor("grabbing");
    drag.moved = true;
    // The scene is laid out in CSS pixels and so is the pan: the pointer's
    // travel goes in as it comes. Scaling it by the device pixel ratio makes
    // the page slide at twice the cursor's speed on a HiDPI screen.
    setView(drag.ox + dx, drag.oy + dy, view().sc);
  };

  const onUp = (ev) => {
    const had = points.delete(ev.pointerId);
    release(ev.pointerId);
    if (!had) return;
    onCursor("grab");
    if (pinch) {
      pinch = null;
      // One finger left on the glass goes on panning from where it is,
      // rather than the picture stopping until it is lifted and put down.
      if (points.size === 1) {
        const [id] = [...points.keys()];
        const now = view();
        drag = { id, from: points.get(id), ox: now.x, oy: now.y, moved: true, button: 0 };
      }
      return;
    }
    if (!drag || ev.pointerId !== drag.id) return;
    const wasDrag = drag.moved;
    const button = drag.button;
    drag = null;
    if (!wasDrag && button === 0) onTap(ev.clientX, ev.clientY);
  };

  const onWheel = (ev) => {
    ev.preventDefault();
    // Firefox reports wheel deltas in lines and Chrome in pixels: one notch
    // of the same wheel arrives as 3 there and as 100 here. Counting a line
    // as 33 pixels makes a notch a notch in both, which is the point — a
    // line's real height would make Firefox scroll at half speed.
    const perUnit = ev.deltaMode === 1 ? 33 : ev.deltaMode === 2 ? 400 : 1;
    const dy = Math.max(-240, Math.min(240, ev.deltaY * perUnit));
    // A trackpad pinch is a wheel with ctrl held, and it arrives a fraction
    // of a notch at a time: on the wheel's own scale a pinch would crawl.
    const rate = ev.ctrlKey ? 0.01 : 0.0015;
    const p = at(ev);
    zoomAbout(Math.exp(-dy * rate), p.x, p.y);
  };

  // Safari's trackpad pinch, which is not a wheel. Preventing the default is
  // what keeps it from zooming the whole page instead of the canvas.
  const onGestureStart = (ev) => { ev.preventDefault(); gestureScale = ev.scale || 1; };
  const onGestureChange = (ev) => {
    ev.preventDefault();
    const s = ev.scale || 1;
    if (!gestureScale) gestureScale = s;
    const p = at(ev);
    zoomAbout(s / gestureScale, p.x, p.y);
    gestureScale = s;
  };
  const onGestureEnd = (ev) => { ev.preventDefault(); gestureScale = 1; };

  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onUp);
  el.addEventListener("wheel", onWheel, { passive: false });
  el.addEventListener("gesturestart", onGestureStart);
  el.addEventListener("gesturechange", onGestureChange);
  el.addEventListener("gestureend", onGestureEnd);

  return function detach() {
    el.removeEventListener("pointerdown", onDown);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerup", onUp);
    el.removeEventListener("pointercancel", onUp);
    el.removeEventListener("wheel", onWheel);
    el.removeEventListener("gesturestart", onGestureStart);
    el.removeEventListener("gesturechange", onGestureChange);
    el.removeEventListener("gestureend", onGestureEnd);
    points.clear();
    drag = null;
    pinch = null;
  };
}

export { DRAG_SLOP };
