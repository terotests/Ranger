// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The display list as it crosses a thread: `EVGSceneBinary` in, the
// painter's commands out.
//
// `evg-list.js` reads the list off the Ranger OBJECT, which is what a host
// that shares a heap with the engine does. A host whose engine runs in a
// Worker (`evg-engine.js`, PLAN_NATIVE_HOSTS.md S1) cannot: what crosses is
// `EVGDisplayList.toBinary()` — three `Int32Array`s and a string pool,
// transferred rather than copied — and this is the reader. It produces the
// SAME command objects `cmdsOf` produces, key for key, so the painter does
// not know which way the list arrived. `list-binary-check.mjs` holds the two
// against each other on real frames.
//
// The record width is DERIVED from the buffer, never assumed: `cmds` is
// allocated as exactly `count * stride`, so dividing recovers the writer's
// number (ISSUES #4). This reader wants 36 fields; a wider record is fine and
// a narrower one is refused with both numbers in the message. Values are
// hundredths — `EVGDisplayList.fixed` rounds to what `toJson` writes — so the
// division below gives back exactly the JSON's numbers.
//
// Slots 36 to 40 are `letter-spacing` and a stroke's cap, join and dash, and
// they are read only when the buffer is wide
// enough to have it. Raising FIELDS_READ instead would have refused every
// bundle built before it existed — a hard failure for a field whose absence
// means "the font's own spacing", which is what those bundles meant. A slot
// that is optional in the data is optional in the reader.

export const FIELDS_READ = 36;

/** How many ints per command this buffer carries. */
export function binaryStride(bin) {
  const n = bin.count | 0;
  const len = bin.cmds.length;
  if (n === 0) return FIELDS_READ;
  const stride = (len / n) | 0;
  if (stride * n !== len) {
    throw new Error(`scene binary: ${len} ints do not divide into ${n} commands`);
  }
  if (stride < FIELDS_READ) {
    throw new Error(`scene binary: ${stride} fields per command, but this reader wants ${FIELDS_READ}`);
  }
  return stride;
}

const rgb = (packed) => [(packed >> 16) & 255, (packed >> 8) & 255, packed & 255];

/**
 * The camera on the envelope, or null when the list carried none.
 *
 * It is three numbers beside the page size rather than a field per command,
 * which is why the record stride above is untouched by it: a reader that
 * knows nothing about views reads this buffer exactly as it always did, and
 * draws the scene unpanned — which is the right answer for a list whose host
 * never asked for a camera.
 */
export function viewOfBinary(bin) {
  if (!bin || !bin.hasView) return null;
  return { x: bin.viewX || 0, y: bin.viewY || 0, scale: bin.viewScale === undefined ? 1 : bin.viewScale };
}

/** The commands, in the shape `evg-list.js`'s `cmdsOf` gives them. */
export function cmdsOfBinary(bin) {
  const n = bin.count | 0;
  const stride = binaryStride(bin);
  const r = bin.cmds, p = bin.pts, e = bin.ends, pool = bin.strings;
  const out = new Array(n);
  for (let i = 0; i < n; i += 1) {
    const b = i * stride;
    const o = { k: r[b] };
    const layer = r[b + 30];
    if (layer > 0) o.layer = layer;
    o.x = r[b + 1] / 100;
    o.y = r[b + 2] / 100;
    o.w = r[b + 3] / 100;
    o.h = r[b + 4] / 100;
    const flags = r[b + 9];
    const radius = r[b + 5] / 100;
    if (flags & 64) o.rc = [radius, r[b + 27] / 100, r[b + 28] / 100, r[b + 29] / 100];
    if (radius > 0) o.r = radius;
    const t = r[b + 6] / 100;
    if (t > 0) {
      o.t = t;
      if (stride > 38) {
        if (r[b + 37] !== 0) o.cap = r[b + 37];
        if (r[b + 38] !== 0) o.join = r[b + 38];
      }
      if (stride > 40) {
        const d = r[b + 39];
        if (d >= 0) {
          o.dash = pool[d];
          const off = r[b + 40] / 100;
          if (off !== 0) o.dashoff = off;
        }
      }
    }
    o.c = [...rgb(r[b + 7]), r[b + 8] / 100];
    if (flags & 1) {
      o.gd = r[b + 10];
      o.c2 = [...rgb(r[b + 11]), r[b + 12] / 100];
    }
    const textIdx = r[b + 15];
    if (textIdx >= 0) {
      o.text = pool[textIdx];
      o.font = pool[r[b + 16]];
      o.size = r[b + 13] / 100;
      const w = r[b + 17];
      if (w >= 0) o.weight = pool[w];
      if (stride > 36) {
        const ls = r[b + 36];
        if (ls !== 0) o.ls = ls / 100;
      }
      if (flags & 2) o.italic = true;
    }
    const src = r[b + 18];
    if (src >= 0) o.src = pool[src];
    if (flags & 4) o.fx = true;
    if (flags & 8) o.fy = true;
    // The crop window into the source, when the picture is not shown whole.
    // Ten-thousandths, not hundredths: a hundredth of a fraction is a whole
    // percent of the bitmap, sixteen pixels on a wide screenshot.
    if (stride > 44 && flags & 256) {
      o.cu = [r[b + 41] / 10000, r[b + 42] / 10000, r[b + 43] / 10000, r[b + 44] / 10000];
    }
    const rot = r[b + 14] / 100;
    if (rot !== 0) {
      o.rot = rot;
      if (flags & 32) {
        o.rox = r[b + 24] / 100;
        o.roy = r[b + 25] / 100;
      }
    }
    const bb = r[b + 26] / 100;
    if (bb > 0) o.bb = bb;
    if (flags & 128) {
      o.sh = {
        x: r[b + 31] / 100, y: r[b + 32] / 100, blur: r[b + 33] / 100,
        c: [...rgb(r[b + 34]), r[b + 35] / 100],
      };
    }
    const pStart = r[b + 19], pCount = r[b + 20];
    if (pCount > 0) {
      const pts = new Array(pCount);
      for (let j = 0; j < pCount; j += 1) pts[j] = p[pStart + j] / 100;
      o.pts = pts;
      const eStart = r[b + 21], eCount = r[b + 22];
      const ends = new Array(eCount);
      for (let j = 0; j < eCount; j += 1) ends[j] = e[eStart + j];
      o.ends = ends;
      if (flags & 16) o.eo = 1;
    }
    out[i] = o;
  }
  return out;
}

/** The typed arrays a `postMessage` may TRANSFER rather than copy. */
export function transferablesOf(bin) {
  return [bin.cmds.buffer, bin.pts.buffer, bin.ends.buffer];
}
