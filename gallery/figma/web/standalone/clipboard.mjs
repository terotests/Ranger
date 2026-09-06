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

// Tolerant on purpose: a browser hands pasted HTML over sanitised and
// re-serialised, so the quotes may change and the `<` / `>` around the
// comment may arrive as entities — named (`&lt;`) or numeric (`&#60;`,
// `&#x3c;`), which are what some sanitisers write.
const LT = "(?:&lt;|&#0*60;|&#[xX]0*3[cC];|<)";
const GT = "(?:&gt;|&#0*62;|&#[xX]0*3[eE];|>)";
const B64 = "([A-Za-z0-9+/=\\s]*)";
const BUFFER_RE = new RegExp("data-buffer=[\"']?\\s*" + LT + "!--\\(figma\\)" + B64 + "--" + GT);
const META_RE = new RegExp("data-metadata=[\"']?\\s*" + LT + "!--\\(figmeta\\)" + B64 + "--" + GT);

/** Names a clipboard file the page can open directly. */
export const FIG_FILE_RE = /\.(fig|deck|jam)$/i;

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

/** The bytes a fig-kiwi stream starts with, as ASCII. Read here too so a
 *  paste that decoded to something else is named on the page rather than
 *  dying inside the parser. */
function figPrelude(u8) {
  let s = "";
  for (let i = 0; i < 8 && i < u8.length; i++) {
    const c = u8[i];
    s += c >= 32 && c < 127 ? String.fromCharCode(c) : ".";
  }
  return s;
}

/** Decode a text/html clipboard payload. `buffer` is null when it is not
 *  Figma's; `reason` then says what was seen, for the status line. `debug`
 *  is always filled in — it is what the page shows when a paste that looked
 *  fine draws nothing. */
export function figmaClipboard(html) {
  const debug = { htmlChars: 0, hasFigmaMarker: false, hasMetadata: false, base64Chars: 0, bytes: 0, prelude: "", meta: null };
  if (typeof html !== "string" || !html) {
    return { buffer: null, meta: null, reason: "no text/html on the clipboard", debug };
  }
  debug.htmlChars = html.length;
  debug.hasFigmaMarker = html.includes("(figma)");
  const m = BUFFER_RE.exec(html);
  if (!m) {
    const hint = debug.hasFigmaMarker ? "has (figma) but the buffer did not parse" : "text/html is not from Figma";
    return { buffer: null, meta: null, reason: hint + " (" + html.length + " chars)", debug };
  }
  debug.base64Chars = m[1].length;
  let meta = null;
  const mm = META_RE.exec(html);
  debug.hasMetadata = !!mm;
  if (mm) {
    try { meta = JSON.parse(new TextDecoder().decode(fromBase64(mm[1]))); } catch { meta = null; }
  }
  debug.meta = meta;
  // Base64 arrives in groups of four. A payload that is not a whole number
  // of groups was cut somewhere between Figma and here, and atob() would
  // hand back a shorter buffer without complaining.
  const b64 = m[1].replace(/\s+/g, "");
  if (b64.length % 4 !== 0) {
    return { buffer: null, meta, reason: "figma buffer is truncated (" + b64.length + " base64 chars, not a multiple of 4)", debug };
  }
  let u8;
  try {
    u8 = fromBase64(b64);
  } catch (e) {
    return { buffer: null, meta, reason: "figma buffer is not base64: " + (e.message || e), debug };
  }
  debug.bytes = u8.length;
  debug.prelude = figPrelude(u8);
  const buffer = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  return { buffer, meta, reason: "", debug };
}

/** Read the clipboard through the async API (a click on Paste): the
 *  text/html item when there is one, else a .fig the OS put there as a
 *  file. When an html item was there and did not parse, its reason is what
 *  comes back — that is the diagnosis, and the list of types is not. */
export async function readFigmaClipboard() {
  if (!navigator.clipboard || !navigator.clipboard.read) {
    return { buffer: null, meta: null, reason: "this browser has no clipboard.read(); use ⌘V / Ctrl+V", debug: { types: [] } };
  }
  const items = await navigator.clipboard.read();
  const types = [];
  let failed = null;
  for (const item of items) {
    types.push(...item.types);
    if (item.types.includes("text/html")) {
      const html = await (await item.getType("text/html")).text();
      const clip = figmaClipboard(html);
      if (clip.buffer) {
        clip.debug.types = types;
        return clip;
      }
      if (!failed) failed = clip;
    }
  }
  // A .fig copied in a file manager arrives as a binary item, not as html.
  for (const item of items) {
    const type = item.types.find((t) => /zip|octet-stream|x-figma/i.test(t));
    if (!type) continue;
    const buffer = await (await item.getType(type)).arrayBuffer();
    if (buffer.byteLength) {
      return { buffer, meta: null, reason: "", debug: { types, bytes: buffer.byteLength, from: type } };
    }
  }
  if (failed) {
    failed.debug.types = types;
    return failed;
  }
  return { buffer: null, meta: null, reason: "clipboard types: " + (types.join(", ") || "none"), debug: { types } };
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
