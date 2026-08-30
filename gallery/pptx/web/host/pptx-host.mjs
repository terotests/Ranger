/**
 * pptx-host.mjs — the browser half of the slide editor, once.
 *
 * `PptxWeb` is the editor: it owns the deck, the selection, the caret, the
 * undo history and the toolbar, and it answers a display list. What it cannot
 * do is hear a mouse or a keyboard, because those belong to a page. That half
 * used to live entirely inside `standalone.mjs`, so the standalone viewer had
 * a working editor and the API playground — which loads the SAME engine, and
 * draws the same toolbar — had a picture of one. Clicking a shape there did
 * nothing, because nothing was listening.
 *
 * So the listening moves here and both pages attach it. Two things stay with
 * the page, deliberately:
 *
 *   * DRAWING, because the two size their canvas differently — one fills a
 *     window and reflows on resize, the other sits in a pane beside a code
 *     editor — and a shared `draw` would have to be told about both;
 *   * CHROME, because a status line, a print button and a phone keyboard are
 *     the page's furniture, not the editor's.
 *
 * What is here is what is identical: which key means what, what a press, a
 * drag and a release mean, and how a deck's own pictures become textures.
 *
 * WHY `enabled` EXISTS. The standalone page is nothing but the editor, so
 * every keystroke belongs to it. The playground has a TEXTAREA next to the
 * canvas, and a page that sends every keystroke to the deck makes the code
 * editor unusable — typing `const` would select-all, delete and put the
 * letters in a shape. So the key listener asks first.
 */

/**
 * The scene, read out of typed arrays instead of parsed out of text.
 *
 * `web.scene()` hands the frame over as JSON, and on a chart-heavy slide that
 * is what the frame costs. Measured on one slide of 10 084 commands and
 * 88 656 point coordinates:
 *
 *     buildFrame      12 ms     the layout — the actual work
 *     toJson          62 ms     turning it into 1.47 MB of text
 *     JSON.parse      19 ms     turning that text back into objects here
 *
 * Five sixths of a frame spent handing over a picture that took a sixth to
 * compute. `web.sceneBinary()` answers the same frame as `Int32Array`s —
 * 8 ms to fill on the engine side — and this walks them.
 *
 * WHY IT STILL BUILDS OBJECTS. The renderer takes `{list:{cmds:[…]}}` and
 * reads twenty-odd fields off each command. Reading the arrays directly in it
 * is the next step and a bigger one; this is the step that removes the text,
 * which is the part that costs. Even building every object by hand here, the
 * work is a fraction of parsing the same thing out of JSON, because nothing is
 * scanned, unescaped or re-parsed — the numbers are already numbers.
 *
 * WHY FIXED POINT IS NOT A LOSS. `toJson` wrote two decimals and no more, so a
 * coordinate divided back by 100 is exactly what the JSON carried.
 *
 * That claim is checked rather than asserted: `scene-binary-check.mjs` beside
 * this file asks the engine for both, for every slide of every fixture, and
 * compares them field by field. It is in the gallery suite, and it exists
 * because for a while the claim was FALSE and nothing said so — see
 * `SCENE_FIELDS_READ` below.
 */

/**
 * How many fields of a record this decoder READS — indices 0 through 22.
 *
 * Deliberately not "the stride". The stride is the engine's business and it
 * has grown: it was 24 until a rotation needed an origin to turn about, and
 * this file went on multiplying by 24. The records then straddled the buffer,
 * every field after the first command was read from the wrong offset, and the
 * first thing that noticed was `new Array(eCount)` being handed a ring count
 * that was really somebody's colour — "RangeError: Invalid array length", a
 * hundred fields downstream of the actual mistake.
 *
 * So this is the floor, not the shape: a record must be at least this wide for
 * the reads below to mean anything. Anything past it is a field this decoder
 * does not want, and a producer is free to add one.
 */
export const SCENE_FIELDS_READ = 23;

/**
 * The stride is DERIVED from the buffer rather than agreed in advance.
 *
 * `cmds` is allocated as exactly `count * stride`, so the division is not an
 * estimate — it is the number the writer used, recovered. That matters more
 * than it looks: the three producers (the Ranger engine, the Emscripten build
 * and the Rust one) publish this frame through three different paths, and only
 * one of them is in a position to export a constant. Reading the shape off the
 * bytes is the one answer all three cannot get wrong.
 *
 * A buffer that does not divide evenly, or divides into records too narrow to
 * read, throws HERE with both numbers in the message — rather than decoding
 * nonsense and failing somewhere unrecognisable.
 */
export function sceneStride(bin) {
  const n = bin.count | 0;
  if (n <= 0) return SCENE_FIELDS_READ;
  const len = bin.cmds.length | 0;
  const stride = (len / n) | 0;
  if (stride * n !== len) {
    throw new Error(
      `scene binary: ${len} ints do not divide into ${n} commands ` +
      `(${len / n} each) — the buffer and the command count disagree`);
  }
  if (stride < SCENE_FIELDS_READ) {
    throw new Error(
      `scene binary: ${stride} fields per command, but this decoder reads ` +
      `${SCENE_FIELDS_READ} — the engine's record has shrunk`);
  }
  return stride;
}

export function decodeScene(bin) {
  const recs = bin.cmds, pts = bin.pts, ends = bin.ends, pool = bin.strings;
  const n = bin.count | 0;
  const stride = sceneStride(bin);
  const cmds = new Array(n);
  for (let i = 0; i < n; i++) {
    const b = i * stride;
    const rgb = recs[b + 7];
    const c = {
      k: recs[b],
      x: recs[b + 1] / 100,
      y: recs[b + 2] / 100,
      w: recs[b + 3] / 100,
      h: recs[b + 4] / 100,
      c: [(rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255, recs[b + 8] / 100],
    };
    if (recs[b + 5] > 0) c.r = recs[b + 5] / 100;
    if (recs[b + 6] > 0) c.t = recs[b + 6] / 100;
    const flags = recs[b + 9];
    if (flags & 1) {
      const rgb2 = recs[b + 11];
      c.gd = recs[b + 10];
      c.c2 = [(rgb2 >> 16) & 255, (rgb2 >> 8) & 255, rgb2 & 255, recs[b + 12] / 100];
    }
    const textIdx = recs[b + 15];
    if (textIdx >= 0) {
      c.text = pool[textIdx];
      c.font = pool[recs[b + 16]];
      c.size = recs[b + 13] / 100;
      const weightIdx = recs[b + 17];
      if (weightIdx >= 0) c.weight = pool[weightIdx];
      if (flags & 2) c.italic = true;
    }
    const srcIdx = recs[b + 18];
    if (srcIdx >= 0) c.src = pool[srcIdx];
    if (flags & 4) c.fx = true;
    if (flags & 8) c.fy = true;
    const rot = recs[b + 14];
    if (rot !== 0) c.rot = rot / 100;
    const pCount = recs[b + 20];
    if (pCount > 0) {
      const pAt = recs[b + 19];
      const arr = new Array(pCount);
      for (let k = 0; k < pCount; k++) arr[k] = pts[pAt + k] / 100;
      c.pts = arr;
      const eAt = recs[b + 21], eCount = recs[b + 22];
      const es = new Array(eCount);
      for (let k = 0; k < eCount; k++) es[k] = ends[eAt + k];
      c.ends = es;
      if (flags & 16) c.eo = 1;
    }
    cmds[i] = c;
  }
  return { width: bin.width, height: bin.height, list: { cmds } };
}

/**
 * Enough of a frame to tell it apart from the one before it.
 *
 * The old page compared two 1.5 MB strings, which was free only because the
 * string had to be built anyway. There is no string any more, so a redraw is
 * skipped on a fold over the frame instead: the command count moves whenever
 * anything is added or removed, and the running total over the first few
 * thousand commands' geometry and colour moves whenever anything is drawn
 * anywhere else. The cap is what keeps this cheap on a 10 000-command slide —
 * a change past it still moves the count if it added or removed a command, and
 * a pure move of one late shape is the case this can miss.
 */
export function sceneStamp(doc) {
  const cmds = doc.list.cmds;
  let h = cmds.length * 2654435761;
  const upto = Math.min(cmds.length, 4096);
  for (let i = 0; i < upto; i++) {
    const c = cmds[i];
    h = (h ^ (c.k * 31 + c.x * 7 + c.y * 13 + c.w * 17 + c.h * 19 + c.c[0] + c.c[1] * 3 + c.c[2] * 5)) | 0;
    h = (h * 16777619) | 0;
  }
  return doc.width + "x" + doc.height + ":" + cmds.length + ":" + h;
}

/** The keys the editor names, as it names them. */
export const KEYS = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  Home: "home",
  End: "end",
  PageUp: "pageUp",
  PageDown: "pageDown",
  Delete: "del",
  Backspace: "backspace",
  Escape: "escape",
  Enter: "enter",
  F2: "f2",
  F5: "f5",
};

/**
 * The deck's own image parts, as object URLs.
 *
 * The bytes are already on the model — they came out of the package with the
 * deck — so nothing is fetched. This is why pictures appear at all in a page
 * with no server behind it.
 */
export function createMediaCache({ web, loadImages }) {
  const imageCache = new Map();
  const blobUrls = new Map();

  function refresh() {
    for (const url of blobUrls.values()) if (url) URL.revokeObjectURL(url);
    blobUrls.clear();
    imageCache.clear();
    let parts = [];
    try {
      parts = JSON.parse(web.imageParts() || "[]");
    } catch (_) {
      parts = [];
    }
    for (const part of parts) {
      const raw = web.imageBytes(part);
      const view = raw instanceof ArrayBuffer ? new Uint8Array(raw) : raw;
      if (!view || !(view.length || view.byteLength)) continue;
      const type = /\.png$/i.test(part) ? "image/png" : "image/jpeg";
      blobUrls.set(part, URL.createObjectURL(new Blob([view], { type })));
    }
  }

  async function imagesFor(doc) {
    const wanted = new Set(doc.list.cmds.filter((c) => c.k === 2 && c.src).map((c) => c.src));
    for (const src of wanted) {
      if (imageCache.has(src)) continue;
      const url = blobUrls.get(src) || "";
      if (!url) {
        imageCache.set(src, null);
        continue;
      }
      const got = await loadImages({ list: { cmds: [{ k: 2, src: url }] } }, { base: "" });
      imageCache.set(src, got.get(url) || null);
    }
    const out = new Map();
    for (const src of wanted) out.set(src, imageCache.get(src) || null);
    return out;
  }

  function dispose() {
    for (const url of blobUrls.values()) if (url) URL.revokeObjectURL(url);
    blobUrls.clear();
    imageCache.clear();
  }

  return { refresh, imagesFor, dispose };
}

/**
 * Wire a canvas to the editor.
 *
 * `sceneSize()` answers the display list's own dimensions, which is what a
 * pointer position has to be expressed in — the canvas may be drawn at any
 * size on the page and at any device pixel ratio, and the editor knows about
 * neither.
 *
 * `draw` is awaited on every event that could have changed the picture, and
 * `afterInput` runs after the ones that could have changed the MODE — a caret
 * appearing, a show starting. Both are optional.
 *
 * Returns a `detach` so a page that rebuilds its editor does not end up with
 * two of these arguing over one canvas.
 */
export function attachPointer({ canvas, web, sceneSize, draw, afterInput, onFileRequest, keepsFocus }) {
  const redraw = draw || (async () => {});
  const settled = afterInput || (() => {});

  // Whether the button is still held is the page's to remember: the app is
  // told down/pressed/released, and a move that says "not down" cannot be a
  // drag — which is the whole of dragging a shape.
  let pointerHeld = false;

  function coords(ev) {
    const rect = canvas.getBoundingClientRect();
    const { width, height } = sceneSize();
    return {
      x: Math.max(0, Math.min(width - 1, Math.floor((ev.clientX - rect.left) * (width / Math.max(1, rect.width))))),
      y: Math.max(0, Math.min(height - 1, Math.floor((ev.clientY - rect.top) * (height / Math.max(1, rect.height))))),
    };
  }

  const onDown = async (ev) => {
    // Not while the page is holding focus somewhere on purpose. On a phone
    // that somewhere is the off-screen field the soft keyboard is attached
    // to, and taking focus off it is how a keyboard is dismissed — including
    // by a tap inside the very text being typed into.
    if (!keepsFocus || !keepsFocus()) canvas.focus();
    const { x, y } = coords(ev);
    pointerHeld = true;
    web.mods(!!ev.shiftKey, !!(ev.ctrlKey || ev.metaKey));
    // Through the frame: a press lands on a window, then the toolbar, then
    // the slide — in that order, decided by the app rather than by the page.
    web.pointerAt(x, y, true, true, false);
    // BEFORE any await. iOS raises its keyboard only for a `focus()` that
    // happens synchronously inside the handler for a real gesture; once the
    // task has been yielded — and `await draw()` yields — the same call is
    // ignored, silently.
    settled();
    await redraw();
    settled();
    if (onFileRequest) onFileRequest(web.takeFileRequest());
  };

  const onMove = async (ev) => {
    const { x, y } = coords(ev);
    if (web.pointerAt(x, y, false, pointerHeld, false)) await redraw();
  };

  const onUp = async (ev) => {
    const { x, y } = coords(ev);
    pointerHeld = false;
    web.pointerAt(x, y, false, false, true);
    // The release is where a caret actually appears — clicking a shape that
    // is already selected is what asks to type in it — so this is the call
    // that matters, and it has to come before the redraw for the reason
    // above.
    settled();
    await redraw();
    settled();
  };

  const onCancel = () => { pointerHeld = false; };

  /**
   * The browser's own focus grab, refused.
   *
   * Every touch browser synthesises `mousedown`/`mouseup`/`click` after
   * `touchend`, so that pages written for a mouse work with a finger. The
   * canvas is `tabindex="0"`, and the DEFAULT ACTION of a mousedown on a
   * focusable element is to focus it. So one tap ran like this:
   *
   *     pointerdown  pointerup   → the page focuses the keyboard field
   *     touchend
   *     mousedown               → the BROWSER focuses the canvas
   *
   * and the keyboard rose and vanished a moment later, with the app still in
   * text edit and nothing able to type into it. No amount of re-focusing on
   * our side fixes that, because the grab happens after we are done.
   *
   * Preventing the default costs nothing: this module focuses the canvas
   * itself in `onDown`, on every backend, so the only behaviour removed is
   * the one that was taking focus away.
   */
  const onMouseDown = (ev) => ev.preventDefault();

  /**
   * The end of a touch, which is where a phone decides about its keyboard.
   *
   * Two things have to happen here and neither can happen anywhere else.
   *
   * FIRST, `preventDefault` — which is the ONLY reliable way to stop the
   * compatibility mouse events being synthesised at all. Refusing the
   * `mousedown` default (above) stops it taking focus in Chrome, but Safari
   * decides about focus at the end of the gesture rather than at that event,
   * so on an iPhone the keyboard still went. It is worth having both: the
   * mousedown guard covers a stylus and a trackpad, this covers a finger.
   * `{ passive: false }` is not decoration — without it the browser ignores
   * the preventDefault and logs nothing.
   *
   * SECOND, `settled()` — the page's chance to focus the keyboard field —
   * runs here as well as on `pointerup`, synchronously, because iOS raises
   * its keyboard only for a `focus()` inside a handler for a gesture it
   * recognises, and `touchend` is the one it honours. `pointerup` is already
   * past by then.
   *
   * The symptom this is here to fix, reported from an iPhone and precise
   * enough to name the cause: the keyboard stays up for as long as the finger
   * is held down, and goes the moment it lifts — and can be kept by sliding
   * the finger off the edge of the screen so it never lifts on the canvas.
   * That is the end of the gesture, not a re-render.
   */
  const onTouchEnd = (ev) => {
    ev.preventDefault();
    settled();
  };

  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("touchend", onTouchEnd, { passive: false });
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onCancel);

  return {
    detach() {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
    },
    /** An event's position in the display list's own coordinates. A page with
     *  a wheel or a context menu of its own needs the same arithmetic. */
    coords,
    get held() { return pointerHeld; },
  };
}

/**
 * Wire the keyboard to the editor.
 *
 * `enabled()` decides whether a keystroke is the deck's at all — see the
 * banner. `onSave` takes Ctrl+S, which is the one chord a page wants for
 * itself; every other chord is a character with a modifier held, and the
 * editor decides which of them mean anything.
 */
export function attachKeys({ web, draw, afterInput, onSave, enabled, target }) {
  const redraw = draw || (async () => {});
  const settled = afterInput || (() => {});
  const wants = enabled || (() => true);
  const on = target || window;

  const onKey = async (ev) => {
    if (!wants(ev)) return;
    const ctrl = !!(ev.ctrlKey || ev.metaKey);
    if (ctrl && (ev.key === "s" || ev.key === "S")) {
      if (!onSave) return;
      ev.preventDefault();
      onSave();
      return;
    }
    if (ctrl && ev.key.length === 1) {
      ev.preventDefault();
      web.type(ev.key, !!ev.shiftKey, true);
      await redraw();
      return;
    }
    // Tab is the one key that cannot simply be in the map. Inside a text box
    // it means "indent this list item", the way it does in every editor — but
    // everywhere else it is how somebody who does not use a mouse leaves the
    // canvas, and a page that swallows it unconditionally is a page they are
    // trapped in. So it is taken only while there is a caret, and handed back
    // to the browser the rest of the time.
    //
    // Until this existed the app's Tab handling could never run at all: the
    // key was not in the map, the browser moved focus away from the canvas,
    // and `text.indent` was reachable only from the toolbar.
    if (ev.key === "Tab") {
      if (!web.editingText()) return;
      ev.preventDefault();
      web.keyMod("tab", !!ev.shiftKey, ctrl);
      await redraw();
      settled();
      return;
    }
    const name = KEYS[ev.key];
    if (name) {
      ev.preventDefault();
      web.keyMod(name, !!ev.shiftKey, ctrl);
      await redraw();
      settled();
      return;
    }
    // Typing into the selected shape — and, while a show is running, the
    // letters a presenter reaches for.
    if (ev.key.length === 1 && (web.editing() || web.presenting())) {
      ev.preventDefault();
      web.type(ev.key, !!ev.shiftKey, false);
      await redraw();
      settled();
    }
  };

  on.addEventListener("keydown", onKey);
  return { detach() { on.removeEventListener("keydown", onKey); } };
}
