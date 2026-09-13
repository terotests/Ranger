/**
 * docx-host.mjs — the browser half of the Word editor, once.
 *
 * `DocxWeb` is the editor: it owns the document, the caret, the selection,
 * the undo history, the strip and the ruler, and it answers a display list.
 * What it cannot do is hear a mouse or a keyboard, because those belong to
 * a page. That half lived inside the docx page's own `standalone.mjs`, and
 * when the markdown page grew a DOCX tab it wrote a second copy of it —
 * shorter, and missing the drag that paints a selection, the pointer
 * capture that ends a drag off the canvas, and Ctrl+A. A fix to either page
 * reached neither, which is the pattern seam `gallery/PLAN_EDITOR_KERNEL.md`
 * §2 warns about, and the pptx page had already answered with
 * `gallery/pptx/web/host/pptx-host.mjs`. This is the same answer for Word.
 *
 * Two things stay with the page, deliberately, for the reasons that file
 * gives: DRAWING, because the pages size their canvas differently; and
 * CHROME, because a status line and a file button are the page's furniture.
 *
 * What is here is what is identical: what a press, a drag and a release
 * mean, which key means what, and which keystrokes are the editor's at all.
 */

/** The keys the frame takes by name. `DocxApp.key` reads these. */
export const KEYS = {
  Backspace: "backspace",
  Delete: "delete",
  Enter: "enter",
  Tab: "tab",
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  Home: "home",
  End: "end",
  PageUp: "pageUp",
  PageDown: "pageDown",
};

/**
 * Wire a canvas to the editor's frame.
 *
 * `sceneSize()` answers the frame's own dimensions, which is what a pointer
 * position has to be expressed in — the canvas may be drawn at any size on
 * the page and at any device pixel ratio, and the editor knows about
 * neither. Everything goes through `framePointer`, so a press lands on a
 * window, then the strip, then the paper — in that order, decided by the app
 * rather than by the page.
 *
 * `draw` is awaited after every event that could have changed the picture.
 * `afterInput` runs after a press and a release, synchronously, which is
 * where a page that keeps its keyboard on a hidden field puts the focus back.
 *
 * Returns a `detach`, so a page that shows the editor in one tab and not in
 * another does not end up with two of these arguing over one canvas.
 */
export function attachPointer({ canvas, web, sceneSize, draw, afterInput, keepsFocus }) {
  const redraw = draw || (async () => {});
  const settled = afterInput || (() => {});

  // Whether the button is still down is the page's to remember. A move with
  // nothing held is a hover; a move with the button held is a DRAG, and the
  // app cannot tell the two apart unless told — without this, dragging
  // across text selected nothing.
  let buttonDown = false;

  // Two fingers are a pinch, not two drags. The fingers on the canvas are
  // kept by pointer id; while there are two of them their distance is what
  // the gesture means, and the editor is asked to zoom by the ratio of one
  // move to the last rather than told about either finger. The first finger
  // may already have started a drag — the press is released where it is, so
  // a pinch never leaves a selection half painted.
  const fingers = new Map();
  let pinchDist = 0;
  const fingerDistance = () => {
    const [a, b] = [...fingers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  function coords(ev) {
    const rect = canvas.getBoundingClientRect();
    const { width, height } = sceneSize();
    return {
      x: Math.max(0, Math.min(width - 1, Math.floor((ev.clientX - rect.left) * (width / Math.max(1, rect.width))))),
      y: Math.max(0, Math.min(height - 1, Math.floor((ev.clientY - rect.top) * (height / Math.max(1, rect.height))))),
    };
  }

  const onDown = async (ev) => {
    if (!keepsFocus || !keepsFocus()) canvas.focus();
    const { x, y } = coords(ev);
    if (ev.pointerType === "touch") {
      fingers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (fingers.size === 2) {
        pinchDist = fingerDistance();
        if (buttonDown) {
          buttonDown = false;
          web.framePointer(x, y, false, false, true, false);
        }
        return;
      }
    }
    buttonDown = true;
    // Captured, so a drag that leaves the canvas keeps arriving here —
    // letting go outside the window otherwise leaves the app believing the
    // button is still down forever.
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* not captured */ }
    }
    web.framePointer(x, y, true, true, false, !!ev.shiftKey);
    settled();
    await redraw();
  };

  const onMove = async (ev) => {
    if (fingers.has(ev.pointerId)) {
      fingers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (fingers.size >= 2) {
        const d = fingerDistance();
        if (pinchDist > 0 && d > 0 && typeof web.zoomBy === "function") {
          if (web.zoomBy(d / pinchDist)) await redraw();
        }
        pinchDist = d;
        return;
      }
    }
    const { x, y } = coords(ev);
    if (web.framePointer(x, y, false, buttonDown, false, false)) await redraw();
  };

  const onUp = async (ev) => {
    const { x, y } = coords(ev);
    if (fingers.has(ev.pointerId)) {
      fingers.delete(ev.pointerId);
      if (fingers.size < 2) pinchDist = 0;
      if (!buttonDown) return;
    }
    buttonDown = false;
    if (canvas.releasePointerCapture) {
      try { canvas.releasePointerCapture(ev.pointerId); } catch (_) { /* not captured */ }
    }
    web.framePointer(x, y, false, false, true, !!ev.shiftKey);
    settled();
    await redraw();
  };

  // A pointer the browser took (the gesture became a scroll) ends the drag
  // too, or the next move paints a selection nobody is dragging.
  const onCancel = async (ev) => {
    const { x, y } = coords(ev);
    fingers.delete(ev.pointerId);
    if (fingers.size < 2) pinchDist = 0;
    buttonDown = false;
    web.framePointer(x, y, false, false, true, false);
    await redraw();
  };

  // The browser's own focus grab on mousedown, refused — the page decides
  // where the keyboard points, in `onDown` and `settled`.
  const onMouseDown = (ev) => ev.preventDefault();

  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onCancel);

  return {
    detach() {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
    },
    coords,
    get held() { return buttonDown; },
  };
}

/**
 * Wire the keyboard to the editor's frame.
 *
 * `enabled()` decides whether a keystroke is the document's at all — a page
 * with a text field beside the canvas answers no while that field has the
 * keyboard. `onCopy` and `onCut` take Ctrl+C and Ctrl+X, because the
 * clipboard is the page's to write; Ctrl+V is left alone so the page's own
 * `paste` event can carry both flavours. Everything else goes through
 * `frameKey`, so the strip's shortcuts and the caret's keys are the app's
 * table and not a second one here; Ctrl+A is the one key the frame does not
 * know by that name, and it is spelled out.
 */
export function attachKeys({ web, draw, afterInput, enabled, target, onCopy, onCut }) {
  const redraw = draw || (async () => {});
  const settled = afterInput || (() => {});
  const wants = enabled || (() => true);
  const on = target || window;

  const onKey = async (ev) => {
    if (!wants(ev)) return;
    const ctrl = !!(ev.ctrlKey || ev.metaKey);
    if (ctrl) {
      const k = ev.key.toLowerCase();
      if (k === "v") return;
      if (k === "a") {
        ev.preventDefault();
        web.key("selectAll", false, true);
        await redraw();
        return;
      }
      if (k === "c" || k === "x") {
        ev.preventDefault();
        const text = k === "c" ? web.copySelection() : web.cutSelection();
        const take = k === "c" ? onCopy : onCut;
        if (take) take(text);
        await redraw();
        return;
      }
      if (k.length === 1) {
        if (web.frameKey(k, !!ev.shiftKey, true)) {
          ev.preventDefault();
          await redraw();
        }
        return;
      }
    }
    const name = KEYS[ev.key];
    if (name) {
      ev.preventDefault();
      web.frameKey(name, !!ev.shiftKey, false);
      await redraw();
      settled();
      return;
    }
    if (ev.key.length === 1 && web.editMode()) {
      ev.preventDefault();
      web.typeText(ev.key);
      await redraw();
      settled();
    }
  };

  on.addEventListener("keydown", onKey);
  return { detach() { on.removeEventListener("keydown", onKey); } };
}
