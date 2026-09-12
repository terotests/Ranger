// SPDX-License-Identifier: AGPL-3.0-or-later
//
// When a built frame may be drawn again, and when it has to be built.
//
// A display list that carries a camera (`EVGDisplayList.setView`) can be
// drawn at a view it was not built at: the painter multiplies in the shader,
// so a pan costs a uniform rather than a walk, a layout and a flatten
// (PLAN_VIEW_TRANSFORM.md). Two things stop that being true for every view,
// and this is the arithmetic that decides:
//
//   THE BAND. A run was rasterised into the glyph atlas at a size and a curve
//   was flattened for one. Stretched far enough, text blurs and a circle
//   shows its facets; shrunk far enough, the frame carries points nobody can
//   see. So a frame is good between `1/band` and `band` of the scale it was
//   built at — √2 by default, about three notches of a pinch.
//
//   THE REGION. Culling asks what is inside the frame, and a frame drawn at a
//   view it was not built at shows scene the build never considered. So a
//   frame is built for the viewport GROWN by an overscan, and it is good
//   until the viewport leaves that.
//
// Both are host decisions rather than engine ones — a viewer that would
// rather have sharp text than frames picks a tighter band, and one on a
// phone picks a smaller overscan — which is why they are here and not in the
// display list.
//
// Everything in this file is arithmetic on plain numbers: no GL, no DOM, and
// `view-policy-check.mjs` holds it to its own rules without a browser.

/** The default overscan: one viewport of scene in every direction. */
export const DEFAULT_OVERSCAN = 1;

/** The default band: √2 either way. See the note above. */
export const DEFAULT_BAND = Math.SQRT2;

const scaleOf = (v) => {
  const s = v && v.scale;
  return s === undefined || s === null || s === 0 ? 1 : s;
};

/**
 * What the canvas shows, in scene coordinates.
 *
 * The inverse of the camera: a point on the page is `scene * scale + pan`, so
 * the scene under the page is `(page - pan) / scale`.
 */
export function sceneViewport(view, width, height) {
  const s = scaleOf(view);
  const x = ((view && view.x) || 0);
  const y = ((view && view.y) || 0);
  return { x: -x / s, y: -y / s, w: width / s, h: height / s };
}

/**
 * The region to build for: what the canvas shows, grown by the overscan.
 *
 * `overscan` is in viewports, not pixels, so the same number means the same
 * thing at every zoom — one viewport each way is 9× the area in the worst
 * case and usually far less, since a board at 8× has almost nothing on it.
 */
export function regionFor(view, width, height, overscan = DEFAULT_OVERSCAN) {
  const v = sceneViewport(view, width, height);
  const gx = v.w * overscan;
  const gy = v.h * overscan;
  return { x: v.x - gx, y: v.y - gy, w: v.w + gx * 2, h: v.h + gy * 2 };
}

/** Is `inner` wholly inside `outer`? */
export function rectInside(inner, outer) {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  );
}

/**
 * May a frame built as `built` be drawn at `view` on a `width` x `height`
 * canvas — and if not, why not?
 *
 * `built` is `{ view, region }`: the camera the list was walked at and the
 * scene it was walked for. Returns `{ keep, reason }`, and the reason is
 * what a host prints when someone asks why a pan cost a rebuild.
 */
export function frameFits(built, view, width, height, opts = {}) {
  if (!built || !built.view || !built.region) return { keep: false, reason: "nothing built" };
  const band = opts.band || DEFAULT_BAND;
  const ratio = scaleOf(view) / scaleOf(built.view);
  if (ratio > band || ratio < 1 / band) {
    return { keep: false, reason: "scale left the band", ratio };
  }
  const shown = sceneViewport(view, width, height);
  if (!rectInside(shown, built.region)) {
    return { keep: false, reason: "viewport left the region" };
  }
  return { keep: true, reason: "" };
}

/**
 * A frame keeper: the state above, with the two calls a host makes.
 *
 *   const keep = createViewKeeper({ overscan: 1 });
 *   if (!keep.fits(view, w, h).keep) { …build…; keep.built(view, w, h); }
 *   frame.draw(shifts, view);
 *
 * `built` records what the host just walked, and returns the region it
 * should have walked for — a host that culls to it passes the region to the
 * engine BEFORE building, so the two calls are `regionFor` then `built`.
 */
export function createViewKeeper(opts = {}) {
  const overscan = opts.overscan === undefined ? DEFAULT_OVERSCAN : opts.overscan;
  const band = opts.band || DEFAULT_BAND;
  let state = null;
  let kept = 0;
  let builds = 0;
  return {
    /** The region a build at this view should cover. */
    region: (view, w, h) => regionFor(view, w, h, overscan),
    /** Can the frame in hand be drawn at this view? */
    fits(view, w, h) {
      const f = frameFits(state, view, w, h, { band });
      if (f.keep) kept += 1;
      return f;
    },
    /** Remember what was just built, and for what. */
    built(view, w, h) {
      builds += 1;
      state = { view: { x: view.x || 0, y: view.y || 0, scale: scaleOf(view) }, region: regionFor(view, w, h, overscan) };
      return state.region;
    },
    /** Throw the frame away: a new document, an edit, a resize. */
    reset() {
      state = null;
    },
    get state() {
      return state;
    },
    /** Draws served from a kept frame, and builds. For a status line. */
    get counts() {
      return { kept, builds };
    },
  };
}
