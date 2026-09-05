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
    if (t > 0) o.t = t;
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
      if (flags & 2) o.italic = true;
    }
    const src = r[b + 18];
    if (src >= 0) o.src = pool[src];
    if (flags & 4) o.fx = true;
    if (flags & 8) o.fy = true;
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
