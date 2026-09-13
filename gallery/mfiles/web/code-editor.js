// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The Extension code tab's editor: the gallery's Ranger code editor
// (gallery/datagrid/web/code_editor_web.rgr — buffer, JavaScript lexer and
// diagnostics, caret, completion) drawing into a canvas inside the code drawer.
//
// The canvas is a picture. The keyboard goes to a hidden <textarea> holding
// the caret's line, the way the editor's own page does it (and Monaco and
// CodeMirror 5): that is what gets IME composition, dead keys, a phone's
// keyboard and the clipboard events for free. Until the engine has loaded — or
// if it cannot — the drawer's plain <textarea> is the editor.

import { renderDisplayList } from "./evg/gl/evg-webgl.js";
import { loadEngine, withFonts } from "./preview.js";

const KEY_MAP = {
  Backspace: "backspace",
  Enter: "enter",
  Tab: "tab",
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  Delete: "delete",
  Home: "home",
  End: "end",
  PageUp: "pageUp",
  PageDown: "pageDown",
};
// The chords the editor answers. Ctrl+K and Ctrl+L are left out on purpose:
// on the editor's own page they swap in its demo documents, which here would
// replace an extension's source.
const CTRL_CHORD = /^[aezyAEZY]$/;
const CLIPBOARD_CHORD = /^[cxvCXV]$/;

/**
 * `box` is the element the editor fills; `fallback` the plain textarea it
 * replaces. Returns `{ value, setValue(name, text), resize() }`.
 */
export function createCodeEditor({ box, fallback, onError }) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.className = "code-canvas";
  const ta = document.createElement("textarea");
  ta.className = "code-keys";
  ta.setAttribute("aria-label", "Extension source — the caret's line");
  ta.setAttribute("aria-multiline", "true");
  ta.spellcheck = false;
  ta.autocapitalize = "off";
  ta.setAttribute("autocorrect", "off");
  box.append(canvas, ta);

  let web = null;
  let gl = null;
  let size = [0, 0];
  let lastScene = "";
  let lastRev = "";
  let pointerDown = false;
  let composing = false;
  let pending = null; // [name, text] set before the engine arrived

  function fit() {
    const r = box.getBoundingClientRect();
    const w = Math.max(1, Math.floor(r.width));
    const h = Math.max(1, Math.floor(r.height));
    if (w === size[0] && h === size[1]) return false;
    size = [w, h];
    if (web) web.resize(w, h);
    return true;
  }

  function draw(force) {
    if (!web || !gl || size[0] < 2 || size[1] < 2) return;
    const text = web.scene();
    if (!force && text === lastScene) return;
    lastScene = text;
    const doc = JSON.parse(text);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.style.width = `${doc.width}px`;
    canvas.style.height = `${doc.height}px`;
    const bw = Math.round(doc.width * dpr);
    const bh = Math.round(doc.height * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    gl.viewport(0, 0, bw, bh);
    gl.clearColor(0.06, 0.06, 0.08, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    renderDisplayList(gl, doc, { dpr, images: new Map() });
    window.__mfEditorDoc = doc;
  }

  function mirrorLine() {
    if (!web) return;
    const line = web.currentLine();
    if (ta.value !== line) ta.value = line;
    const col = Math.max(0, Math.min(line.length, web.caretCol()));
    let from = col;
    let to = col;
    if (web.hasSelection() && web.anchorLine() === web.caretLine()) {
      const anchor = Math.max(0, Math.min(line.length, web.anchorCol()));
      from = Math.min(anchor, col);
      to = Math.max(anchor, col);
    }
    try {
      ta.setSelectionRange(from, to);
    } catch (_) {
      /* not in the document yet */
    }
  }

  function afterInput() {
    draw();
    lastRev = web.revision();
    mirrorLine();
  }

  function coords(ev) {
    const r = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(size[0] - 1, Math.floor(ev.clientX - r.left))),
      y: Math.max(0, Math.min(size[1] - 1, Math.floor(ev.clientY - r.top))),
    };
  }

  // --- the pointer: the caret is placed from the picture, focus goes to the keys
  canvas.addEventListener("pointerdown", (ev) => {
    if (!web) return;
    ev.preventDefault();
    canvas.setPointerCapture(ev.pointerId);
    ta.focus({ preventScroll: true });
    pointerDown = true;
    const { x, y } = coords(ev);
    web.pointer(x, y, true, ev.shiftKey, ev.ctrlKey || ev.metaKey);
    afterInput();
  });
  canvas.addEventListener("pointermove", (ev) => {
    if (!web || !pointerDown) return;
    const { x, y } = coords(ev);
    web.pointer(x, y, true, ev.shiftKey, ev.ctrlKey || ev.metaKey);
    afterInput();
  });
  const release = (ev) => {
    if (!web || !pointerDown) return;
    pointerDown = false;
    const { x, y } = coords(ev);
    web.pointer(x, y, false, ev.shiftKey, ev.ctrlKey || ev.metaKey);
    afterInput();
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("dblclick", (ev) => {
    if (!web) return;
    ev.preventDefault();
    const { x, y } = coords(ev);
    web.selectWord(x, y);
    ta.focus({ preventScroll: true });
    afterInput();
  });
  canvas.addEventListener("click", (ev) => {
    if (!web || ev.detail < 3) return;
    const { x, y } = coords(ev);
    web.selectLine(x, y);
    afterInput();
  });
  canvas.addEventListener(
    "wheel",
    (ev) => {
      if (!web) return;
      ev.preventDefault();
      const { x, y } = coords(ev);
      web.wheel(x, y, ev.deltaY < 0 ? 1 : -1);
      afterInput();
    },
    { passive: false }
  );

  // --- the keyboard ------------------------------------------------------------
  ta.addEventListener("keydown", (ev) => {
    if (!web) return;
    if (ev.key === "Escape") {
      ev.preventDefault();
      web.key("escape", ev.shiftKey, false);
      afterInput();
      return;
    }
    if (ev.key === "Tab" && ev.shiftKey) return; // the way out of the editor
    const special = KEY_MAP[ev.key];
    if (special) {
      ev.preventDefault();
      web.key(special, ev.shiftKey, ev.ctrlKey || ev.metaKey);
      afterInput();
      return;
    }
    if ((ev.ctrlKey || ev.metaKey) && ev.key === " ") {
      ev.preventDefault();
      web.text(" ", false, true);
      afterInput();
      return;
    }
    if (ev.ctrlKey || ev.metaKey) {
      if (CLIPBOARD_CHORD.test(ev.key)) return;
      if (CTRL_CHORD.test(ev.key)) {
        ev.preventDefault();
        web.text(ev.key, ev.shiftKey, true);
        afterInput();
      }
    }
  });
  ta.addEventListener("compositionstart", () => {
    composing = true;
  });
  ta.addEventListener("compositionend", (ev) => {
    composing = false;
    if (web && ev.data) web.text(ev.data, false, false);
    if (web) afterInput();
  });
  ta.addEventListener("beforeinput", (ev) => {
    if (!web || composing) return;
    const type = ev.inputType;
    ev.preventDefault();
    if (type === "insertText" && ev.data) web.text(ev.data, false, false);
    else if (type === "insertFromPaste" || type === "insertFromDrop") {
      const text = ev.dataTransfer ? ev.dataTransfer.getData("text/plain") : "";
      if (text) web.text(text, false, false);
    } else if (type === "insertLineBreak" || type === "insertParagraph") web.key("enter", false, false);
    else if (type === "deleteContentBackward") web.key("backspace", false, false);
    else if (type === "deleteContentForward") web.key("delete", false, false);
    else if (type === "historyUndo" || type === "historyRedo") web.text(type === "historyUndo" ? "z" : "y", false, true);
    afterInput();
  });
  ta.addEventListener("copy", (ev) => {
    const text = web ? web.selectionText() : "";
    if (!text) return;
    ev.preventDefault();
    ev.clipboardData?.setData("text/plain", text);
  });
  ta.addEventListener("cut", (ev) => {
    const text = web ? web.cutSelection() : "";
    if (!text) return;
    ev.preventDefault();
    ev.clipboardData?.setData("text/plain", text);
    afterInput();
  });
  ta.addEventListener("paste", (ev) => {
    const text = ev.clipboardData?.getData("text/plain") || "";
    if (!web || !text) return;
    ev.preventDefault();
    web.text(text, false, false);
    afterInput();
  });
  ta.addEventListener("focus", () => {
    mirrorLine();
    draw();
  });

  // The caret blinks, so the picture is asked for every frame while the box is
  // on screen — and only drawn when the editor says something changed.
  function loop() {
    if (web && box.offsetParent !== null) {
      if (fit()) lastRev = "";
      const rev = web.revision();
      if (rev !== lastRev) {
        lastRev = rev;
        draw();
      }
    }
    requestAnimationFrame(loop);
  }

  (async () => {
    try {
      const Engine = await loadEngine("viewers/code_editor_web.js", "CodeEditorWeb");
      const made = new Engine();
      const r = box.getBoundingClientRect();
      size = [Math.max(1, Math.floor(r.width)), Math.max(1, Math.floor(r.height))];
      made.start(size[0], size[1]);
      await withFonts(made);
      gl = canvas.getContext("webgl2", { antialias: true, premultipliedAlpha: false, stencil: true });
      if (!gl) throw new Error("WebGL 2 is not available for the code editor");
      const [name, text] = pending || ["extension.js", fallback.value];
      made.setDocumentNamed(name, text);
      web = made;
      window.__mfEditor = web;
      box.classList.add("ready");
      fallback.hidden = true;
      draw(true);
      mirrorLine();
      requestAnimationFrame(loop);
    } catch (e) {
      box.remove();
      onError(e);
    }
  })();

  return {
    get value() {
      return web ? web.documentText() : fallback.value;
    },
    setValue(name, text) {
      fallback.value = text;
      pending = [name, text];
      if (!web) return;
      web.setDocumentNamed(name, text);
      lastScene = "";
      afterInput();
    },
  };
}
