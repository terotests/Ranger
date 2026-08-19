/**
 * In-page boot for @hufe921/canvas-editor.
 * Exposes window.__bench with ops driven by the Puppeteer adapter.
 */
import Editor from "../node_modules/@hufe921/canvas-editor/dist/canvas-editor.js";

function makeCorpus(lines) {
  const main = [];
  for (let i = 0; i < lines; i++) {
    const value = `L${i} the quick brown fox jumps over the lazy dog ${i}`;
    main.push({ value: i < lines - 1 ? value + "\n" : value });
  }
  return { main };
}

function now() {
  return performance.now();
}

async function nextFrame() {
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

const container = document.querySelector("#editor");
let editor = null;

window.__bench = {
  async init() {
    const t0 = now();
    editor = new Editor(container, { main: [{ value: "" }] }, {
      width: 720,
      height: 480,
      pageMode: "continuity",
    });
    await nextFrame();
    return now() - t0;
  },

  async openDocument(lines) {
    const data = makeCorpus(lines);
    const t0 = now();
    editor.command.executeSetValue(data);
    await nextFrame();
    return now() - t0;
  },

  async firstPaint() {
    const t0 = now();
    editor.command.executeForceUpdate?.();
    await nextFrame();
    return now() - t0;
  },

  async scroll1000() {
    const t0 = now();
    // Prefer continuous scroll via wheel events on the editor root.
    const root = document.querySelector("#editor");
    for (let i = 0; i < 100; i++) {
      root.dispatchEvent(
        new WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true })
      );
    }
    await nextFrame();
    return now() - t0;
  },

  async insertChar() {
    editor.command.executeFocus({ position: "before" });
    const t0 = now();
    editor.command.executeInsertElementList([{ value: "X" }]);
    await nextFrame();
    return now() - t0;
  },

  async insert1000() {
    const t0 = now();
    editor.command.executeInsertElementList([{ value: "a".repeat(1000) }]);
    await nextFrame();
    return now() - t0;
  },

  async backspace() {
    const t0 = now();
    editor.command.executeBackspace();
    await nextFrame();
    return now() - t0;
  },

  async select100() {
    const t0 = now();
    // Approximate: select from start through a large index range.
    // Element indices are character-ish; 100 lines ≈ several thousand units.
    try {
      editor.command.executeSetRange(0, 5000);
    } catch {
      editor.command.executeSelectAll();
    }
    await nextFrame();
    return now() - t0;
  },

  async replaceSelection() {
    const t0 = now();
    editor.command.executeInsertElementList([{ value: "REPLACED" }]);
    await nextFrame();
    return now() - t0;
  },

  async selectAll() {
    const t0 = now();
    editor.command.executeSelectAll();
    await nextFrame();
    return now() - t0;
  },

  async resize(w, h) {
    const t0 = now();
    container.style.width = w + "px";
    container.style.height = h + "px";
    // Trigger layout if the editor exposes paper/size APIs; otherwise rAF.
    try {
      editor.command.executeForceUpdate?.();
    } catch {
      /* ignore */
    }
    await nextFrame();
    return now() - t0;
  },

  async jumpLine(line) {
    const t0 = now();
    try {
      editor.command.executeFocus({ rowNo: line, isMoveCursorToVisible: true });
    } catch {
      /* ignore */
    }
    await nextFrame();
    return now() - t0;
  },

  ready: true,
};

document.title = "canvas-editor-bench-ready";
