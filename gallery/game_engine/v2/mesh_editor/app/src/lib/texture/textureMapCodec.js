// ============================================================================
// textureMapCodec.js — persist UV atlases as base64 RGBA in project JSON.
// ============================================================================

/**
 * @typedef {{ encoding: 'rgba8-base64', w: number, h: number, data: string, name?: string }} SerializedTextureMap
 * @typedef {{ rgba: Uint8ClampedArray|Uint8Array|number[], w: number, h: number, name?: string }} TextureMap
 */

function bytesToBase64(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(u8).toString("base64");
  }
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    s += String.fromCharCode(...u8.subarray(i, i + chunk));
  }
  return btoa(s);
}

function base64ToBytes(b64) {
  if (typeof Buffer !== "undefined") {
    return new Uint8ClampedArray(Buffer.from(String(b64), "base64"));
  }
  const bin = atob(String(b64));
  const out = new Uint8ClampedArray(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Coerce live / JSON-revived RGBA into a byte view of length >= need.
 * JSON.stringify turns TypedArrays into `{ "0": n, "1": n, ... }` without
 * `.length` — `new Uint8Array(that)` is empty, so we recover index-by-index.
 * @param {unknown} src
 * @param {number} need
 * @returns {Uint8Array|null}
 */
export function rgbaSourceToBytes(src, need) {
  const n = Math.max(0, need | 0);
  if (!src || n <= 0) return null;
  if (ArrayBuffer.isView(src)) {
    const u8 = new Uint8Array(src.buffer, src.byteOffset, src.byteLength);
    return u8.length >= n ? u8.subarray(0, n) : null;
  }
  if (Array.isArray(src)) {
    if (src.length < n) return null;
    return Uint8Array.from(src.slice(0, n));
  }
  if (typeof src === "object") {
    let len = typeof src.length === "number" && Number.isFinite(src.length) ? src.length | 0 : -1;
    if (len < 0) {
      len = 0;
      while (typeof src[len] === "number") len++;
    }
    if (len < n) return null;
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) out[i] = src[i] & 255;
    return out;
  }
  return null;
}

/**
 * Encode a live atlas for project JSON.
 * @param {TextureMap|null|undefined} map
 * @returns {SerializedTextureMap|null}
 */
export function serializeTextureMap(map) {
  if (!map) return null;
  const w = Math.max(1, map.w | 0);
  const h = Math.max(1, map.h | 0);
  const need = w * h * 4;
  const bytes = rgbaSourceToBytes(map.rgba, need);
  if (!bytes) return null;
  return {
    encoding: "rgba8-base64",
    w,
    h,
    data: bytesToBase64(bytes),
    name: map.name || undefined,
  };
}

/**
 * Decode a persisted atlas (or pass through an already-live map).
 * @param {SerializedTextureMap|TextureMap|null|undefined} raw
 * @returns {TextureMap|null}
 */
export function normalizeTextureMap(raw) {
  if (!raw || typeof raw !== "object") return null;
  const w = Math.max(1, Number(raw.w) | 0);
  const h = Math.max(1, Number(raw.h) | 0);
  const need = w * h * 4;

  // Already live (in-memory after assign), or JSON-revived TypedArray shape.
  if (raw.rgba && !raw.data) {
    const bytes = rgbaSourceToBytes(raw.rgba, need);
    if (bytes) {
      return {
        rgba: new Uint8ClampedArray(bytes),
        w,
        h,
        name: raw.name,
      };
    }
  }

  if (raw.encoding !== "rgba8-base64" || typeof raw.data !== "string" || !raw.data) {
    return null;
  }
  const rgba = base64ToBytes(raw.data);
  if (rgba.length < need) return null;
  return {
    rgba: rgba.length === need ? rgba : rgba.subarray(0, need),
    w,
    h,
    name: raw.name,
  };
}
