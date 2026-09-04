// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The display list as the painter wants it, read straight off the Ranger
// object — no JSON in between.
//
// A host that shares a process with the app used to ask for `toJson()` and
// parse it back: a string of every coordinate on the page written and read
// on every frame, and a heap of garbage to collect after. That is the whole
// of what this file removes. It has to produce exactly what `toJson` would,
// key for key — `rt:scroll` holds the two against each other on every frame
// it draws — because the painter was written against the JSON and nothing in
// it should have to know which way the list arrived.
//
// Numbers come through as they are rather than rounded to the hundredth the
// JSON writer spells, which is the one difference: the painter gets what the
// layout computed, not its decimal form.

/** The commands of an `EVGDisplayList` in the JSON writer's shape. */
export function cmdsOf(dl) {
  const attribute = !!dl.attribute;
  const out = new Array(dl.cmds.length);
  for (let i = 0; i < dl.cmds.length; i += 1) {
    const c = dl.cmds[i];
    const o = { k: c.kind };
    if (attribute) o.n = c.node;
    if (c.layer > 0) o.layer = c.layer;
    o.x = c.x;
    o.y = c.y;
    o.w = c.w;
    o.h = c.h;
    if (c.perCorner) o.rc = [c.radius, c.radiusTR, c.radiusBR, c.radiusBL];
    if (c.radius > 0) o.r = c.radius;
    if (c.thickness > 0) o.t = c.thickness;
    o.c = [c.r, c.g, c.b, c.a];
    if (c.hasGrad) {
      o.gd = c.gradDir;
      o.c2 = [c.r2, c.g2, c.b2, c.a2];
    }
    if (c.text.length > 0) {
      o.text = c.text;
      o.font = c.fontFamily;
      o.size = c.fontSize;
      if (c.fontWeight.length > 0) o.weight = c.fontWeight;
      if (c.textAlign === "italic") o.italic = true;
    }
    if (c.src.length > 0) o.src = c.src;
    if (c.flipH) o.fx = true;
    if (c.flipV) o.fy = true;
    if (c.rotate !== 0) {
      o.rot = c.rotate;
      if (c.hasRotOrigin) {
        o.rox = c.rotOriginX;
        o.roy = c.rotOriginY;
      }
    }
    if (c.backdropBlur > 0) o.bb = c.backdropBlur;
    if (c.pts.length > 0) {
      o.pts = c.pts.slice();
      o.ends = c.ringEnds.length === 0 ? [c.pts.length] : c.ringEnds.slice();
      if (c.evenOdd) o.eo = 1;
    }
    out[i] = o;
  }
  return out;
}

/** The surface effect, or undefined — the JSON's `effect`. */
export function effectOf(dl) {
  if (!dl.effectKind || dl.effectKind.length === 0) return undefined;
  const drops = [];
  for (let i = 0; i < dl.effectAges.length; i += 1) {
    drops.push([dl.effectXs[i], dl.effectYs[i], dl.effectAges[i]]);
  }
  return {
    kind: dl.effectKind,
    drops,
    speed: dl.effectSpeed,
    width: dl.effectWidth,
    strength: dl.effectStrength,
    decay: dl.effectDecay,
    highlight: dl.effectHighlight,
    rings: dl.effectRings,
    stagger: dl.effectStagger,
    falloff: dl.effectFalloff,
    shine: dl.effectShine,
    gloss: dl.effectGloss,
    bump: dl.effectBump,
    light: [dl.effectLightX, dl.effectLightY, dl.effectLightZ],
  };
}

/** How far each scroll layer's content has moved since the list was built —
 *  the JSON's `shifts`. Read on every frame: it is the one thing about a kept
 *  list that changes. */
export function shiftsOf(dl) {
  const out = new Array(dl.layerShiftX.length);
  for (let i = 0; i < dl.layerShiftX.length; i += 1) out[i] = [dl.layerShiftX[i], dl.layerShiftY[i]];
  return out;
}

/** The whole list, as `JSON.parse(dl.toJson())` would give it. */
export function listOf(dl) {
  const out = { seq: dl.buildSeq, shifts: shiftsOf(dl), cmds: cmdsOf(dl) };
  const effect = effectOf(dl);
  if (effect) out.effect = effect;
  return out;
}
