// SPDX-License-Identifier: AGPL-3.0-or-later
//
// WHAT COUNTS AS CHROME, in one place.
//
// The build bakes a picture of the app's chrome into the document
// (`snapshot.mjs`) and the check holds that picture against a live frame
// (`shell-check.mjs`). If those two disagreed about which commands are chrome,
// the check would be proving something other than what shipped — so the rule
// lives here and neither of them owns a copy of it.

export const near = (a, b) => Math.abs(a - b) < 0.51;

export const hex = (c) =>
  "#" + [c[0], c[1], c[2]].map((n) => Math.round(n).toString(16).padStart(2, "0")).join("");

/**
 * One display-list command as a box anchored to the viewport, or null.
 *
 * Three of the four edges must sit on a viewport edge. Three, not four: a
 * full-bleed background pins all four, a top bar pins left/top/right and states
 * its own height, a rail pins left/top/bottom and states its own width. Two
 * pinned edges would be a corner, whose free size is a layout result and not
 * something CSS can restate without knowing the window.
 */
export function anchoredBox(c, W, H) {
  if (c.k !== 0 && c.k !== 1) return null;           // rects and borders only
  if (c.layer) return null;                           // an overlay is not chrome
  if (!c.c || c.c[3] !== 1) return null;              // opaque only
  if (c.r || c.rc) return null;                       // a rounded corner is content
  const l = near(c.x, 0), t = near(c.y, 0);
  const r = near(c.x + c.w, W), b = near(c.y + c.h, H);
  if ((l ? 1 : 0) + (t ? 1 : 0) + (r ? 1 : 0) + (b ? 1 : 0) < 3) return null;
  const box = { kind: c.k, l, t, r, b, colour: hex(c.c) };
  if (!l || !r) box.w = Math.round(c.w);              // the free axis, stated
  if (!t || !b) box.h = Math.round(c.h);
  if (c.k === 1) box.thickness = Math.max(1, Math.round(c.t || 1));
  return box;
}

/** Two boxes are the same box when this string is. */
export const keyOf = (b) =>
  `${b.kind}|${b.l}${b.t}${b.r}${b.b}|${b.w ?? "-"}x${b.h ?? "-"}|${b.colour}|${b.thickness ?? "-"}`;

/** A box as the CSS that puts it back where it was, at any viewport size. */
export function boxCss(b) {
  const out = [];
  out.push(b.l ? "left:0" : "right:0");
  out.push(b.l && b.r ? "right:0" : `width:${b.w}px`);
  out.push(b.t ? "top:0" : "bottom:0");
  out.push(b.t && b.b ? "bottom:0" : `height:${b.h}px`);
  out.push(b.kind === 0 ? `background:${b.colour}` : `border:${b.thickness}px solid ${b.colour}`);
  return out.join(";");
}
