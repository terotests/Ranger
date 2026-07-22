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
 * Encode a live atlas for project.json.
 * @param {TextureMap|null|undefined} map
 * @returns {SerializedTextureMap|null}
 */
export function serializeTextureMap(map) {
  if (!map) return null;
  const w = Math.max(1, map.w | 0);
  const h = Math.max(1, map.h | 0);
  const need = w * h * 4;
  const src = map.rgba;
  if (!src || src.length < need) return null;
  const bytes = src instanceof Uint8Array ? src.subarray(0, need) : new Uint8Array(src).subarray(0, need);
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

  // Already live (in-memory after assign)
  if (raw.rgba && raw.rgba.length >= need && !raw.data) {
    const rgba =
      raw.rgba instanceof Uint8ClampedArray
        ? raw.rgba
        : new Uint8ClampedArray(raw.rgba);
    return { rgba, w, h, name: raw.name };
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
