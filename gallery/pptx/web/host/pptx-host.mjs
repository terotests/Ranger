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
export function attachPointer({ canvas, web, sceneSize, draw, afterInput, onFileRequest }) {
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
    canvas.focus();
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

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onCancel);

  return {
    detach() {
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
