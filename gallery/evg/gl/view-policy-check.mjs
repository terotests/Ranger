// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The keep-or-build policy, on its own.
//
//   node gallery/evg/gl/view-policy-check.mjs
//
// `evg-view.js` is the arithmetic a host does between "the view moved" and
// "walk the scene again": is the new scale within the band the atlas and the
// flattened curves were built for, and is the new viewport still inside the
// region the walk covered. Both answers are numbers, so both can be checked
// without a browser, a GPU or a scene — which is the point of keeping them
// out of the engine and out of the painter.
//
// What each case here is guarding against is a policy that is WRONG IN THE
// CHEAP DIRECTION: one that keeps a frame it should have rebuilt shows stale
// or blurred pixels, and that is the failure nobody notices in a profile.

import {
  sceneViewport,
  regionFor,
  rectInside,
  frameFits,
  createViewKeeper,
  DEFAULT_BAND,
} from "./evg-view.js";

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
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

const W = 1000;
const H = 800;

console.log("=== keep or build ===");

// --- what the canvas shows ---------------------------------------------------
{
  const v = sceneViewport({ x: 0, y: 0, scale: 1 }, W, H);
  ok("an identity view shows the page as it is", v.x === 0 && v.y === 0 && v.w === W && v.h === H);

  // A pan of +100 puts the scene's -100 at the page's 0.
  const p = sceneViewport({ x: 100, y: 50, scale: 1 }, W, H);
  ok("a pan moves the window the other way", p.x === -100 && p.y === -50, `${p.x},${p.y}`);

  // At 2x the page covers half as much scene.
  const z = sceneViewport({ x: 0, y: 0, scale: 2 }, W, H);
  ok("a zoom in shows less scene", z.w === W / 2 && z.h === H / 2, `${z.w}x${z.h}`);
  const o = sceneViewport({ x: 0, y: 0, scale: 0.5 }, W, H);
  ok("and a zoom out shows more", o.w === W * 2 && o.h === H * 2, `${o.w}x${o.h}`);

  // The round trip: the point under the page's top-left is the scene's origin.
  const view = { x: -320, y: 180, scale: 1.6 };
  const sv = sceneViewport(view, W, H);
  ok(
    "the window is the camera read backwards",
    near(sv.x * view.scale + view.x, 0) && near(sv.y * view.scale + view.y, 0),
    `${sv.x.toFixed(2)},${sv.y.toFixed(2)}`,
  );
}

// --- the region ---------------------------------------------------------------
{
  const view = { x: 0, y: 0, scale: 1 };
  const r = regionFor(view, W, H, 1);
  ok("one viewport of overscan is three viewports across", r.w === W * 3 && r.h === H * 3, `${r.w}x${r.h}`);
  ok("centred on what is shown", r.x === -W && r.y === -H, `${r.x},${r.y}`);
  ok("and it contains what is shown", rectInside(sceneViewport(view, W, H), r));

  const none = regionFor(view, W, H, 0);
  ok("no overscan is the viewport itself", none.w === W && none.h === H);

  // In SCENE units, so the same number of viewports at any zoom — which is
  // what keeps a board at 8x from building a region nobody will ever pan to.
  const far = regionFor({ x: 0, y: 0, scale: 8 }, W, H, 1);
  ok("the overscan is viewports, not pixels", far.w === (W / 8) * 3, `${far.w}`);
}

// --- the band -----------------------------------------------------------------
{
  const built = { view: { x: 0, y: 0, scale: 1 }, region: regionFor({ x: 0, y: 0, scale: 1 }, W, H, 1) };
  ok("the same view fits", frameFits(built, { x: 0, y: 0, scale: 1 }, W, H).keep);
  ok("a scale just inside the band fits", frameFits(built, { x: 0, y: 0, scale: DEFAULT_BAND - 0.01 }, W, H).keep);
  const out = frameFits(built, { x: 0, y: 0, scale: DEFAULT_BAND + 0.01 }, W, H);
  ok("and one just outside does not", !out.keep && out.reason === "scale left the band", out.reason);
  // Both ways: a frame shrunk too far carries points nobody can see, and its
  // glyphs alias rather than blur.
  const small = frameFits(built, { x: 0, y: 0, scale: 1 / DEFAULT_BAND - 0.01 }, W, H);
  ok("the band is two-sided", !small.keep && small.reason === "scale left the band", small.reason);
  ok("a tighter band is tighter", !frameFits(built, { x: 0, y: 0, scale: 1.3 }, W, H, { band: 1.15 }).keep);
}

// --- the region, as a gate ------------------------------------------------------
{
  const at = (x, y, scale = 1) => ({ x, y, scale });
  const built = { view: at(0, 0), region: regionFor(at(0, 0), W, H, 1) };
  // One viewport of overscan means the window may travel one viewport.
  ok("a pan inside the overscan keeps the frame", frameFits(built, at(-W * 0.9, 0), W, H).keep);
  const gone = frameFits(built, at(-W * 1.1, 0), W, H);
  ok("and one past it does not", !gone.keep && gone.reason === "viewport left the region", gone.reason);
  ok("upward too", !frameFits(built, at(0, H * 1.1), W, H).keep);
  // WHICH OF THE TWO BINDS, and it depends on the overscan. With one
  // viewport each way the region is three viewports across and the band is
  // 1.41, so a zoom OUT always hits the band first — the window can only
  // grow to 1.41 viewports and the region holds three.
  ok("with a generous overscan the band binds a zoom", frameFits(built, at(0, 0, 1 / 1.39), W, H).keep);
  // Shrink the overscan and the region binds first: the window at 1.3x out
  // is 1.3 viewports and the region is only 1.2.
  const tight = { view: at(0, 0), region: regionFor(at(0, 0), W, H, 0.1) };
  const wider = frameFits(tight, at(0, 0, 1 / 1.3), W, H);
  ok("with a tight one the region binds it instead", !wider.keep && wider.reason === "viewport left the region", wider.reason);
}

// --- nothing built ---------------------------------------------------------------
{
  const f = frameFits(null, { x: 0, y: 0, scale: 1 }, W, H);
  ok("with no frame there is nothing to keep", !f.keep && f.reason === "nothing built");
  ok("and half a state is no state", !frameFits({ view: { scale: 1 } }, { x: 0, y: 0, scale: 1 }, W, H).keep);
}

// --- the keeper, as a host drives it -----------------------------------------
{
  const keep = createViewKeeper({ overscan: 1 });
  const at = (x, y, scale = 1) => ({ x, y, scale });

  ok("the first view has to be built", !keep.fits(at(0, 0), W, H).keep);
  const region = keep.built(at(0, 0), W, H);
  ok("and the build is told what to cover", region.w === W * 3, `${region.w}`);

  // A pan across the overscan: every one of these is a uniform, not a walk.
  let kept = 0;
  for (let i = 0; i <= 8; i += 1) {
    if (keep.fits(at(-i * 100, 0), W, H).keep) kept += 1;
  }
  ok("a pan across the overscan is free the whole way", kept === 9, `${kept} of 9`);

  // …and one step past it is not.
  ok("until it is not", !keep.fits(at(-W * 1.2, 0), W, H).keep);

  // A reset is what a new document or an edit does.
  keep.built(at(-W * 1.2, 0), W, H);
  ok("a rebuild moves the region with it", keep.fits(at(-W * 1.2, 0), W, H).keep);
  keep.reset();
  ok("and a reset throws the frame away", !keep.fits(at(-W * 1.2, 0), W, H).keep);
  ok("the counts are kept", keep.counts.builds === 2, JSON.stringify(keep.counts));
}

// --- a pinch, counted ----------------------------------------------------------
//
// The design's own claim, as a number: a zoom gesture costs a rebuild about
// every third frame and the pans between them cost nothing. A policy that
// rebuilt every frame would score 0 here, and one that never rebuilt would
// score 1 — both are wrong and both are easy to write.
{
  const keep = createViewKeeper({ overscan: 1 });
  let builds = 0;
  let scale = 1;
  for (let i = 0; i < 60; i += 1) {
    scale *= 1.05; // a steady pinch, 5% a frame
    const view = { x: 0, y: 0, scale };
    if (!keep.fits(view, W, H).keep) {
      keep.built(view, W, H);
      builds += 1;
    }
  }
  // √2 is about seven frames of 5%, so a sixty-frame pinch is eight or nine.
  ok("a steady pinch rebuilds on the band, not on the frame", builds >= 7 && builds <= 10, `${builds} builds in 60 frames`);
}

console.log("");
console.log(`passed=${passed} failed=${failed}`);
if (failed > 0) {
  console.log("SOME FAILED");
  process.exit(1);
}
console.log("ALL PASS");
