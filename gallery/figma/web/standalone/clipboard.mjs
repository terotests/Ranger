/**
 * Figma's clipboard shape.
 *
 * A copy in Figma lands on the clipboard as text/html:
 *
 *   <meta charset="utf-8">
 *   <span data-metadata="<!--(figmeta)BASE64-->"></span>
 *   <span data-buffer="<!--(figma)BASE64-->"></span>
 *
 * figmeta is JSON (fileKey, pasteID, dataType). figma is the same fig-kiwi
 * byte stream a .fig keeps in canvas.fig — prelude, version, compressed
 * schema, compressed message — with no ZIP around it and only the copied
 * nodes inside. The Ranger parser reads those bytes as they are.
 */

const BUFFER_RE = /data-buffer="<!--\(figma\)([A-Za-z0-9+/=\s]*)-->"/;
const META_RE = /data-metadata="<!--\(figmeta\)([A-Za-z0-9+/=\s]*)-->"/;

function fromBase64(b64) {
  const bin = atob(b64.replace(/\s+/g, ""));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function toBase64(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < u8.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

/** Decode a text/html clipboard payload. `buffer` is null when it is not Figma's. */
export function figmaClipboard(html) {
  if (typeof html !== "string") return { buffer: null, meta: null };
  const m = BUFFER_RE.exec(html);
  if (!m) return { buffer: null, meta: null };
  let meta = null;
  const mm = META_RE.exec(html);
  if (mm) {
    try { meta = JSON.parse(new TextDecoder().decode(fromBase64(mm[1]))); } catch { meta = null; }
  }
  const u8 = fromBase64(m[1]);
  const buffer = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  return { buffer, meta };
}

/** Wrap fig-kiwi bytes the way Figma does — the inverse of figmaClipboard. */
export function figmaClipboardHtml(bytes, meta) {
  const metaJson = JSON.stringify(meta || { fileKey: "", pasteID: Date.now() % 2147483647, dataType: "scene" });
  const metaB64 = toBase64(new TextEncoder().encode(metaJson));
  return '<meta charset="utf-8"><meta charset="utf-8">'
    + '<span data-metadata="<!--(figmeta)' + metaB64 + '-->"></span>'
    + '<span data-buffer="<!--(figma)' + toBase64(bytes) + '-->"></span>';
}

/** A display name for a paste, from its figmeta when there is one. */
export function figmaClipboardName(meta) {
  if (meta && typeof meta.fileKey === "string" && meta.fileKey) return "paste from " + meta.fileKey;
  return "clipboard";
}
