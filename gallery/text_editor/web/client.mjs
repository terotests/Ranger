/**
 * Web demo with separated layers:
 *
 *   INPUT  — mouse/keyboard → POST /input → Node UIInput → EditorApp
 *   RENDER — GET /scene.json (EVGDisplayList) → evg-webgl.js (WebGL 2)
 *   OVERLAY — selection + caret with Canvas2D metrics (matches atlas)
 *
 * Selection UX mirrors canvas-editor: click caret, drag range, dblclick word,
 * triple-click line. Toolbar posts format commands (bold/font/align/list).
 */
import { renderDisplayList } from "/evg/gl/evg-webgl.js";

const canvas = document.getElementById("screen");
const overlay = document.getElementById("overlay");
const octx = overlay.getContext("2d");
const statusEl = document.getElementById("status");
const backendEl = document.getElementById("backend");
const cmdsEl = document.getElementById("cmds");
const fpsEl = document.getElementById("fps");
const selEl = document.getElementById("sel");

const gl = canvas.getContext("webgl2", {
  antialias: true,
  premultipliedAlpha: false,
  stencil: true,
});
if (!gl) {
  statusEl.textContent = "WebGL 2 not available";
  throw new Error("WebGL 2 required");
}
backendEl.textContent = "webgl2";

let pointerDown = false;
let frames = 0;
let fpsT0 = performance.now();
let fontsReady = null;
/** Logical page size in editor/layout pixels (not device framebuffer). */
let pageW = 720;
let pageH = 480;
let lastDoc = null;
let lastState = null;
let clickTimes = [];

const measureCanvas = document.createElement("canvas");
const measureCtx = measureCanvas.getContext("2d");

/** Serialize POSTs so drag-select cannot race and collapse the range. */
const inputQueue = [];
let inputBusy = false;
async function enqueueInput(payload) {
  inputQueue.push(payload);
  if (inputBusy) return;
  inputBusy = true;
  while (inputQueue.length) {
    const next = inputQueue.shift();
    try {
      await fetch("/input", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next),
      });
    } catch (_) {
      /* keep draining */
    }
  }
  inputBusy = false;
}

function canvasCoords(ev) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((ev.clientX - rect.left) / rect.width) * pageW);
  const y = Math.floor(((ev.clientY - rect.top) / rect.height) * pageH);
  return {
    x: Math.max(0, Math.min(pageW - 1, x)),
    y: Math.max(0, Math.min(pageH - 1, y)),
  };
}

function codepointStep(s, i) {
  const cp = s.codePointAt(i);
  return cp > 0xffff ? 2 : 1;
}

function isWordChar(ch) {
  if (!ch) return false;
  const c = ch.codePointAt(0);
  if ((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95) {
    return true;
  }
  if (c >= 192 && c <= 255 && c !== 215 && c !== 247) return true;
  return /\p{L}|\p{N}/u.test(ch);
}

function cssFont(family, bold, size) {
  const name = bold
    ? family === "Open Sans"
      ? "Open Sans Bold"
      : family === "Cinzel"
        ? "Cinzel Bold"
        : family === "Josefin Sans"
          ? "Josefin Sans Bold"
          : family + " Bold"
    : family || "Open Sans";
  return `${size}px "${name}", sans-serif`;
}

/** Measure prefix width with per-run fonts (matches WebGL atlas). */
function measurePrefix(lineMeta, col) {
  if (!lineMeta) return 0;
  const text = lineMeta.text || "";
  const runs = lineMeta.runs || [{ bold: false, font: "Open Sans", len: text.length }];
  let pos = 0;
  let w = 0;
  const size = lastDoc?.hit?.fontSize || 14;
  for (const run of runs) {
    const end = Math.min(pos + (run.len | 0), col);
    if (end > pos) {
      measureCtx.font = cssFont(run.font || "Open Sans", !!run.bold, size);
      w += measureCtx.measureText(text.slice(pos, end)).width;
    }
    pos += run.len | 0;
    if (pos >= col) break;
  }
  if (col > pos && pos < text.length) {
    measureCtx.font = cssFont("Open Sans", false, size);
    w += measureCtx.measureText(text.slice(pos, col)).width;
  }
  return w;
}

function lineOriginX(lineMeta) {
  const hit = lastDoc?.hit;
  if (!hit || !lineMeta) return hit?.contentX || 0;
  const size = hit.fontSize || 14;
  const listPad = lineMeta.listKind ? 22 : 0;
  const base = hit.contentX + listPad;
  const align = lineMeta.align | 0;
  if (align === 0) return base;
  measureCtx.font = cssFont("Open Sans", false, size);
  // Full line width with runs:
  const tw = measurePrefix(lineMeta, (lineMeta.text || "").length);
  const avail = Math.max(1, (hit.contentW || 600) - listPad);
  if (align === 1) return base + Math.max(0, (avail - tw) / 2);
  return base + Math.max(0, avail - tw);
}

function hitTestCaret(px, py, doc) {
  const hit = doc && doc.hit;
  if (!hit || !hit.lines || !hit.lines.length) return null;

  let vis = Math.floor((py - hit.contentY) / hit.lineHeight);
  if (vis < 0) vis = 0;
  if (vis >= hit.lines.length) vis = hit.lines.length - 1;
  const line = hit.firstVisible + vis;
  const meta = hit.lineMeta?.[vis] || { text: hit.lines[vis] || "", runs: [], align: 0, listKind: 0 };
  const s = meta.text || hit.lines[vis] || "";
  const origin = lineOriginX(meta);
  const localX = px - origin;

  if (localX <= 0) return { line, col: 0 };

  let bestCol = 0;
  let bestDist = Infinity;
  let i = 0;
  while (true) {
    const w = measurePrefix(meta, i);
    const d = Math.abs(w - localX);
    if (d < bestDist || (d === bestDist && i > bestCol)) {
      bestDist = d;
      bestCol = i;
    }
    if (i >= s.length) break;
    i += codepointStep(s, i);
  }
  return { line, col: bestCol };
}

function wordBounds(s, col) {
  if (!s.length) return { a: 0, b: 0 };
  col = Math.max(0, Math.min(col, s.length));
  let i = col >= s.length ? s.length - 1 : col;
  const ch = s[i];
  if (!isWordChar(ch)) {
    return { a: col, b: Math.min(s.length, col + 1) };
  }
  let a = i;
  while (a > 0 && isWordChar(s[a - 1])) a--;
  let b = i;
  while (b < s.length && isWordChar(s[b])) b++;
  return { a, b };
}

async function postCaretAt(ev, extend) {
  const { x, y } = canvasCoords(ev);
  const hit = hitTestCaret(x, y, lastDoc);
  if (!hit) {
    await enqueueInput({
      type: "pointer",
      x,
      y,
      down: !extend ? true : pointerDown,
      shift: ev.shiftKey || extend,
      ctrl: ev.ctrlKey || ev.metaKey,
    });
    return hit;
  }
  await enqueueInput({
    type: "caret",
    line: hit.line,
    col: hit.col,
    extend: !!(ev.shiftKey || extend),
    x,
    y,
  });
  return hit;
}

const KEY_MAP = {
  Backspace: "backspace",
  Enter: "enter",
  Tab: "tab",
  Escape: "escape",
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  Delete: "del",
  Home: "home",
  End: "end",
};

canvas.addEventListener("pointerdown", (ev) => {
  canvas.setPointerCapture(ev.pointerId);
  canvas.focus();
  pointerDown = true;

  const now = performance.now();
  clickTimes = clickTimes.filter((t) => now - t < 450);
  clickTimes.push(now);
  const n = clickTimes.length;

  if (n >= 3) {
    clickTimes = [];
    const { x, y } = canvasCoords(ev);
    const hit = hitTestCaret(x, y, lastDoc);
    if (hit) {
      enqueueInput({ type: "selectLine", line: hit.line, x, y });
      return;
    }
  }
  if (n === 2) {
    // dblclick handled by dblclick event; ignore second mousedown race
    return;
  }
  postCaretAt(ev, false);
});

canvas.addEventListener("dblclick", (ev) => {
  ev.preventDefault();
  pointerDown = false;
  const { x, y } = canvasCoords(ev);
  const hit = hitTestCaret(x, y, lastDoc);
  if (!hit) return;
  const meta = lastDoc?.hit?.lineMeta?.[hit.line - (lastDoc.hit.firstVisible || 0)];
  const s = meta?.text ?? lastDoc?.hit?.lines?.[hit.line - (lastDoc.hit.firstVisible || 0)] ?? "";
  const { a, b } = wordBounds(s, hit.col);
  enqueueInput({
    type: "select",
    aLine: hit.line,
    aCol: a,
    cLine: hit.line,
    cCol: b,
    x,
    y,
  });
});

canvas.addEventListener("pointermove", (ev) => {
  if (!pointerDown) return;
  postCaretAt(ev, true);
});

function endPointer(ev) {
  if (!pointerDown) return;
  pointerDown = false;
  postCaretAt(ev, true);
}

canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);

canvas.addEventListener(
  "wheel",
  (ev) => {
    ev.preventDefault();
    enqueueInput({ type: "wheel", delta: ev.deltaY < 0 ? 1 : -1 });
  },
  { passive: false }
);

canvas.addEventListener("keydown", (ev) => {
  const special = KEY_MAP[ev.key];
  if (special) {
    ev.preventDefault();
    enqueueInput({
      type: "key",
      key: special,
      shift: ev.shiftKey,
      ctrl: ev.ctrlKey || ev.metaKey,
    });
    return;
  }
  if (ev.ctrlKey || ev.metaKey) {
    if (/^[abzyABZY]$/.test(ev.key)) {
      ev.preventDefault();
      enqueueInput({
        type: "text",
        text: ev.key,
        shift: ev.shiftKey,
        ctrl: true,
      });
    }
    return;
  }
  if (ev.key.length === 1) {
    ev.preventDefault();
    enqueueInput({
      type: "text",
      text: ev.key,
      shift: ev.shiftKey,
      ctrl: false,
    });
  }
});

document.getElementById("toolbar").addEventListener("click", (ev) => {
  const btn = ev.target.closest("button[data-cmd]");
  if (!btn) return;
  const cmd = btn.dataset.cmd;
  const arg = btn.dataset.arg;
  if (cmd === "bold") enqueueInput({ type: "format", op: "bold" });
  if (cmd === "align") enqueueInput({ type: "format", op: "align", value: Number(arg) });
  if (cmd === "list") enqueueInput({ type: "format", op: "list", value: Number(arg) });
  canvas.focus();
});

document.getElementById("fontSelect").addEventListener("change", (ev) => {
  enqueueInput({ type: "format", op: "font", value: ev.target.value });
  canvas.focus();
});

async function ensureFonts(doc) {
  await document.fonts.ready;
  const loads = [];
  const families = new Set([
    "Open Sans",
    "Open Sans Bold",
    "Cinzel",
    "Cinzel Bold",
    "Josefin Sans",
    "Josefin Sans Bold",
  ]);
  for (const c of doc.list.cmds) {
    if (c.k === 3 && c.text && c.font && c.size) {
      families.add(c.font);
      loads.push(document.fonts.load(`${c.size}px "${c.font}"`));
    }
  }
  for (const f of families) {
    loads.push(document.fonts.load(`14px "${f}"`));
  }
  if (loads.length) await Promise.all(loads);
}

function drawOverlay(doc, state) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const cssW = doc.width;
  const cssH = doc.height;
  overlay.style.width = cssW + "px";
  overlay.style.height = cssH + "px";
  const bw = Math.round(cssW * dpr);
  const bh = Math.round(cssH * dpr);
  if (overlay.width !== bw || overlay.height !== bh) {
    overlay.width = bw;
    overlay.height = bh;
  }
  octx.setTransform(dpr, 0, 0, dpr, 0, 0);
  octx.clearRect(0, 0, cssW, cssH);

  const hit = doc.hit;
  if (!hit || !state) return;

  const aLine = state.anchorLine | 0;
  const aCol = state.anchorCol | 0;
  const cLine = state.caretLine | 0;
  const cCol = state.caretCol | 0;
  const collapsed = aLine === cLine && aCol === cCol;

  const ordered = (() => {
    if (aLine < cLine || (aLine === cLine && aCol <= cCol)) {
      return { sL: aLine, sC: aCol, eL: cLine, eC: cCol };
    }
    return { sL: cLine, sC: cCol, eL: aLine, eC: aCol };
  })();

  if (!collapsed) {
    octx.fillStyle = "rgba(60, 110, 200, 0.45)";
    for (let line = ordered.sL; line <= ordered.eL; line++) {
      const vis = line - hit.firstVisible;
      if (vis < 0 || vis >= (hit.lineMeta?.length || hit.lines.length)) continue;
      const meta = hit.lineMeta?.[vis] || { text: hit.lines[vis] || "", runs: [], align: 0 };
      const text = meta.text || "";
      let c0 = 0;
      let c1 = text.length;
      if (line === ordered.sL) c0 = ordered.sC;
      if (line === ordered.eL) c1 = ordered.eC;
      const ox = lineOriginX(meta);
      const x0 = ox + measurePrefix(meta, c0);
      let x1 = ox + measurePrefix(meta, c1);
      if (line < ordered.eL) x1 = Math.max(x1, ox + measurePrefix(meta, text.length) + 6);
      const y0 = hit.contentY + vis * hit.lineHeight;
      const rw = Math.max(2, x1 - x0);
      octx.fillRect(x0, y0, rw, hit.lineHeight);
    }
  }

  if (state.focused !== false) {
    const phase = Math.floor(performance.now() / 530) % 2;
    if (phase === 0) {
      const vis = cLine - hit.firstVisible;
      if (vis >= 0 && vis < (hit.lineMeta?.length || hit.lines.length)) {
        const meta = hit.lineMeta?.[vis] || { text: hit.lines[vis] || "", runs: [], align: 0 };
        const ox = lineOriginX(meta);
        const cx = ox + measurePrefix(meta, cCol);
        const cy = hit.contentY + vis * hit.lineHeight;
        octx.fillStyle = "rgb(120, 200, 255)";
        octx.fillRect(cx, cy, 2, hit.lineHeight);
      }
    }
  }

  selEl.textContent = collapsed
    ? `${cLine + 1}:${cCol + 1}`
    : `${ordered.sL + 1}:${ordered.sC + 1}–${ordered.eL + 1}:${ordered.eC + 1}`;
}

async function pullScene() {
  const [sceneRes, stateRes] = await Promise.all([
    fetch("/scene.json?" + Date.now(), { cache: "no-store" }),
    fetch("/state.json?" + Date.now(), { cache: "no-store" }),
  ]);
  if (!sceneRes.ok) throw new Error("scene " + sceneRes.status);
  const doc = await sceneRes.json();
  lastState = stateRes.ok ? await stateRes.json() : null;
  pageW = doc.width || pageW;
  pageH = doc.height || pageH;
  lastDoc = doc;
  if (!fontsReady) {
    fontsReady = ensureFonts(doc);
  }
  await fontsReady;

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const cssW = doc.width;
  const cssH = doc.height;
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  const bw = Math.round(cssW * dpr);
  const bh = Math.round(cssH * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.07, 0.08, 0.11, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

  const stats = renderDisplayList(gl, doc, { dpr });
  drawOverlay(doc, lastState);
  cmdsEl.textContent = String(doc.list.cmds.length);
  window.__evgStats = stats;
  window.__editorDoc = doc;
  window.__editorState = lastState;

  frames++;
  const now = performance.now();
  if (now - fpsT0 >= 1000) {
    fpsEl.textContent = String(frames);
    frames = 0;
    fpsT0 = now;
  }
}

async function loop() {
  try {
    await pullScene();
    statusEl.textContent = "live";
  } catch (e) {
    statusEl.textContent = "error: " + (e && e.message ? e.message : e);
  }
  requestAnimationFrame(loop);
}

statusEl.textContent = "starting";
canvas.focus();
loop();
