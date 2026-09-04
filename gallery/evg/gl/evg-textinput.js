// SPDX-License-Identifier: AGPL-3.0-or-later
//
// A real text-input session for a canvas that draws its own fields.
//
// THE ARGUMENT. A canvas UI has no text field, so the obvious thing is to turn
// `keydown` into edits: a printable key inserts, Backspace deletes, Ctrl+Arrow
// moves by a word. That is what this codebase did, and it is a dead end — not
// because it is hard, but because the list of things it cannot do never ends:
// IME and dead keys, the clipboard, undo, emoji, mobile keyboards that send no
// per-character keydown at all, and platform-specific word boundaries.
//
// So the platform owns the editing session instead. A real `<input>` sits over
// the drawn field, transparent and one pixel of nothing; it receives the keys,
// the IME, the paste and the undo; and Ranger MIRRORS its state. Ranger keeps
// what it is good at — the tree, the layout, the styles, the hit targets, the
// pixels — and hands over the one system service the platform genuinely knows
// better.
//
// WHAT WAS MEASURED FIRST (conformance/oracle/textinput.json, from a real
// `<input>` driven through the DevTools protocol, IME composition included):
//
//   `beforeinput` fires with the OLD value; `input` fires with the new one.
//   So this can be a plain mirror — read `value`, `selectionStart` and
//   `selectionEnd` on `input` — and never has to diff or replay an inputType.
//   That one fact is the whole design.
//
//   Composition arrives as compositionstart, then compositionupdate +
//   beforeinput/input `insertCompositionText` per keystroke, then
//   compositionend. At `beforeinput` the selection is the range being
//   replaced and `data` is what replaces it, so the composing range is
//   `selectionStart .. selectionStart + data.length` — which is what a field
//   has to underline, and the one part a hidden proxy cannot draw for us.
//
//   Copy, cut, paste and undo need no code at all: they arrive as
//   `insertFromPaste`, `deleteByCut`, `historyUndo` and `historyRedo` like any
//   other edit.
//
//   And one Backspace removes 1 code unit from "abc", 2 from an emoji, 4 from
//   a flag and 11 from a ZWJ family — while ArrowLeft over a combining acute
//   skips 2 where Backspace removes 1. Chromium's own delete and its own
//   caret motion disagree about that cluster. A hand-written grapheme walker
//   would have to reproduce an inconsistency rather than a standard; through
//   the proxy there is nothing to reproduce.
//
// WHAT THIS DELIBERATELY DOES NOT DO. It does not draw anything, it does not
// decide what a field looks like, and it does not know what a field IS. It
// takes a value and a selection in and reports a value and a selection out.

/**
 * @param {object} opts
 * @param {HTMLElement} opts.host    where to park the proxy
 * @param {HTMLCanvasElement} opts.canvas  the element that keeps focus when no
 *                                   field is active
 * @param {(edit: {value: string, selStart: number, selEnd: number,
 *                 inputType: string, isComposing: boolean}) => void} opts.onEdit
 * @param {(c: {active: boolean, start: number, end: number, text: string}) => void} [opts.onComposition]
 * @param {(k: {key: string, shiftKey: boolean, ctrlKey: boolean,
 *              metaKey: boolean, altKey: boolean,
 *              preventDefault: () => void}) => boolean} [opts.onKey]
 *        Keys the APPLICATION owns rather than the field: Tab, Escape, and
 *        anything that opens a menu. Returning true consumes the key.
 */
export function createTextInputBridge({ host, canvas, onEdit, onComposition, onKey }) {
  // ONE PROXY PER SESSION, not one for the page. Chromium keeps an input's
  // undo history across a programmatic `value` write when the input is not
  // focused at the time, so a proxy reused from field to field carried the
  // last field's edits in its history: measured, the third Ctrl+Z in Full
  // Name — after two had taken back the typed "zz" — restored a state from
  // the session before it, with the caret at 0. A fourth would have put
  // another field's text into this one. A fresh element has an empty history,
  // which is what a fresh field has.
  const makeProxy = () => {
    const own = document.createElement("input");
    own.type = "text";
    // Off the accessibility tree: the drawn field already has a `textbox` node
    // with a name and a value, and two text boxes for one control is one too
    // many for a reader. The proxy is a keyboard fixture, not a control.
    own.setAttribute("aria-hidden", "true");
    own.tabIndex = -1;
    own.autocapitalize = "off";
    own.autocomplete = "off";
    own.spellcheck = false;
    // Positioned over the field rather than off-screen. An off-screen input is
    // the usual trick and it is wrong on a phone: the browser scrolls to the
    // focused element and to the composition popup, so an input at -9999px
    // takes the page with it. Transparent and in place costs nothing and keeps
    // the IME candidate window next to the text it is composing.
    Object.assign(own.style, {
      position: "absolute",
      opacity: "0",
      padding: "0",
      margin: "0",
      border: "0",
      outline: "none",
      background: "transparent",
      color: "transparent",
      caretColor: "transparent",
      zIndex: "1",
      // It must not take the pointer. Ranger does every hit test and places
      // every caret; the proxy only needs the keyboard, and it is sitting
      // exactly on top of the field it serves. Without this it swallows the
      // pointermove over its own box — measured: the I-beam cursor stopped
      // appearing the moment a field was focused, because the canvas never saw
      // the pointer again.
      pointerEvents: "none",
    });
    own.style.display = "none";
    host.appendChild(own);
    return own;
  };
  let own = makeProxy();
  let el = own;

  let active = null;      // the tid of the field the session belongs to
  let composing = false;
  let echo = false;       // set while WE are writing to the proxy
  // The elements the listeners below have been put on: the own proxy once,
  // and every mirror input the session has been handed.
  const wired = new WeakSet();

  const report = (inputType, isComposing) => {
    if (echo) return;
    onEdit({
      value: el.value,
      selStart: el.selectionStart ?? 0,
      selEnd: el.selectionEnd ?? 0,
      inputType: inputType || "",
      isComposing: !!isComposing,
    });
  };

  function wire(target) {
    if (wired.has(target)) return;
    wired.add(target);
    // Only the element the session is on reports: a mirror input the session
    // left keeps its listeners and must stay quiet.
    const mine = () => target === el && active !== null;
    target.addEventListener("input", (ev) => { if (mine()) report(ev.inputType, ev.isComposing); });

    // The composing range, for the underline. Taken at `beforeinput`, where
    // the selection is still the range about to be replaced — after `input`
    // it has collapsed to the caret and the range is gone.
    target.addEventListener("beforeinput", (ev) => {
      if (!mine() || !onComposition) return;
      if (ev.inputType !== "insertCompositionText") return;
      const start = target.selectionStart ?? 0;
      const text = ev.data || "";
      onComposition({ active: true, start, end: start + text.length, text });
    });
    target.addEventListener("compositionend", () => {
      if (!mine()) return;
      composing = false;
      if (onComposition) onComposition({ active: false, start: 0, end: 0, text: "" });
    });
    target.addEventListener("compositionstart", () => {
      if (mine()) composing = true;
    });

    // The selection can move without an edit: an arrow key, Ctrl+A, a
    // double-click, a drag with the mouse. Those are the platform's word and
    // grapheme rules doing exactly what the bridge exists to borrow, so they
    // are mirrored like any other change.
    target.addEventListener("keyup", () => { if (mine()) report("", composing); });
    target.addEventListener("select", () => { if (mine()) report("", composing); });
    target.addEventListener("mouseup", () => { if (mine()) report("", composing); });

    // Keys the application owns. A field must not swallow Tab or Escape, and
    // the page's own shortcuts have to keep working while a field has focus.
    target.addEventListener("keydown", (ev) => {
      if (!mine() || !onKey) return;
      if (ev.isComposing) return;   // an IME is using this key; it is not ours
      const taken = onKey({
        key: ev.key,
        shiftKey: ev.shiftKey,
        ctrlKey: ev.ctrlKey,
        metaKey: ev.metaKey,
        altKey: ev.altKey,
        preventDefault: () => ev.preventDefault(),
      });
      if (taken) ev.preventDefault();
    });
  }
  wire(own);

  // A mirror's input, while the session is in it, takes the pointer: a click
  // puts the caret where the platform says, a drag selects, a double-click
  // takes the word — and every one of those comes back through `select` and
  // `mouseup` for the app to draw. The canvas keeps everything outside it.
  function takePointer(target, yes) {
    if (target === own) return;
    target.style.pointerEvents = yes ? "auto" : "none";
    target.style.cursor = yes ? "text" : "";
    target.style.caretColor = "transparent";
  }

  return {
    /** True while a field owns the keyboard. */
    isActive: () => active !== null,
    activeTid: () => active,
    isComposing: () => composing,

    /**
     * Hand the session to a field. `box` is where the field is drawn, in
     * canvas coordinates, so the proxy can sit on top of it.
     */
    focusField(tid, { value, selStart, selEnd, kind, maxLength, readOnly, box }, element) {
      // The element the session edits in: the accessibility mirror's own
      // input for this field when the host has one — then the reader, the
      // keyboard and the pointer all meet in one element and Tab walks on
      // from it to the next control — and the hidden proxy otherwise.
      // A field of our own gets a NEW proxy — see `makeProxy`. A mirror input
      // is the host's element and keeps whatever history the host gives it.
      if (!element) {
        const fresh = makeProxy();
        if (el === own) takePointer(own, false);
        own.remove();
        own = fresh;
      }
      const next = element || own;
      if (next !== el) {
        takePointer(el, false);
        if (el === own) own.style.display = "none";
        el = next;
        wire(el);
      }
      takePointer(el, true);
      active = tid;
      echo = true;
      // `type` is the platform's, not ours. A password proxy gives the right
      // reveal behaviour and the right keyboard; a number proxy gives a
      // numeric keypad on a phone. The character filtering `InputCtl` grew by
      // hand belongs here instead, where the platform already does it.
      el.type = kind === "password" ? "password" : "text";
      el.inputMode = kind === "number" ? "decimal" : kind === "email" ? "email" : "text";
      el.readOnly = !!readOnly;
      if (maxLength > 0) el.maxLength = maxLength;
      else el.removeAttribute("maxlength");
      el.value = value;
      el.setSelectionRange(selStart, selEnd);
      if (box && el === own) {
        el.style.display = "block";
        el.style.left = box.x + "px";
        el.style.top = box.y + "px";
        el.style.width = box.w + "px";
        el.style.height = box.h + "px";
      }
      if (document.activeElement !== el) el.focus({ preventScroll: true });
      echo = false;
    },

    /**
     * Ranger changed the state — a click moved the caret, say.
     *
     * This also takes the focus BACK, and has to: the page focuses its canvas
     * on every pointerdown so that keys reach it, which quietly ends the
     * session on the second click of a double-click. Measured — the word was
     * selected in Ranger, the proxy still read 4,4 and unfocused, and the
     * keystroke went round the old keydown path and inserted instead of
     * replacing. While a session is active the proxy holds the keyboard, and
     * "active" is not a thing anything else gets to decide by accident.
     */
    sync({ value, selStart, selEnd }) {
      if (active === null) return;
      echo = true;
      if (el.value !== value) el.value = value;
      el.setSelectionRange(selStart, selEnd);
      if (document.activeElement !== el) el.focus({ preventScroll: true });
      echo = false;
    },

    blurField() {
      if (active === null) return;
      this.release();
      if (canvas) canvas.focus({ preventScroll: true });
    },

    /**
     * End the session and leave the focus where it is going. Tab out of a
     * field is this: the browser moves the focus to the next control, and
     * the canvas must not take it back on the way.
     */
    release() {
      if (active === null) return;
      active = null;
      composing = false;
      takePointer(el, false);
      if (el === own) {
        own.style.display = "none";
        own.value = "";
      }
    },

    /** For tests and for anything that needs to see the real element. */
    element: () => el,
  };
}
