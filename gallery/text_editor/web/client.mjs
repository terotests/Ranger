/**
 * Web demo with separated layers:
 *
 *   INPUT  — mouse/keyboard → POST /input → Node UIInput → EditorApp
 *   RENDER — GET /scene.json (EVGDisplayList) → evg-webgl.js (WebGL 2)
 *
 * Caret hit-testing for clicks uses the same Canvas2D measureText path as the
 * WebGL text atlas (see evg-webgl.js buildTextAtlas). Ranger TTF advances are
 * kept for SoftCanvas; mixing them here put the caret at the wrong X.
 */
import { renderDisplayList } from "/evg/gl/evg-webgl.js";

const canvas = document.getElementById("screen");
const statusEl = document.getElementById("status");
const backendEl = document.getElementById("backend");
const cmdsEl = document.getElementById("cmds");
const fpsEl = document.getElementById("fps");

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

const measureCanvas = document.createElement("canvas");
const measureCtx = measureCanvas.getContext("2d");

function canvasCoords(ev) {
  const rect = canvas.getBoundingClientRect();
  // Map CSS box → page space. Do NOT use canvas.width/height here: those are
  // DPR-scaled WebGL backing-store pixels, while layout is page-sized.
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

/** Same font string the WebGL atlas uses (page pixels, not DPR). */
function hitTestCaret(px, py, doc) {
  const hit = doc && doc.hit;
  if (!hit || !hit.lines || !hit.lines.length) return null;

  let vis = Math.floor((py - hit.contentY) / hit.lineHeight);
  if (vis < 0) vis = 0;
  if (vis >= hit.lines.length) vis = hit.lines.length - 1;
  const line = hit.firstVisible + vis;
  const s = hit.lines[vis] || "";
  const localX = px - hit.contentX;
  measureCtx.font = `${hit.fontSize}px "${hit.font}", sans-serif`;

  if (localX <= 0) return { line, col: 0 };

  // Nearest UTF-16 boundary by Canvas2D advance (matches atlas rasterization).
  let bestCol = 0;
  let bestDist = Infinity;
  let i = 0;
  while (true) {
    const w = measureCtx.measureText(s.slice(0, i)).width;
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

async function postInput(payload) {
  await fetch("/input", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function postCaretAt(ev, extend) {
  const { x, y } = canvasCoords(ev);
  const hit = hitTestCaret(x, y, lastDoc);
  if (!hit) {
    await postInput({
      type: "pointer",
      x,
      y,
      down: !extend ? true : pointerDown,
      shift: ev.shiftKey || extend,
      ctrl: ev.ctrlKey || ev.metaKey,
    });
    return;
  }
  await postInput({
    type: "caret",
    line: hit.line,
    col: hit.col,
    extend: !!(ev.shiftKey || extend),
    x,
    y,
  });
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
  postCaretAt(ev, false);
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
    postInput({ type: "wheel", delta: ev.deltaY < 0 ? 1 : -1 });
  },
  { passive: false }
);

canvas.addEventListener("keydown", (ev) => {
  const special = KEY_MAP[ev.key];
  if (special) {
    ev.preventDefault();
    postInput({
      type: "key",
      key: special,
      shift: ev.shiftKey,
      ctrl: ev.ctrlKey || ev.metaKey,
    });
    return;
  }
  if (ev.ctrlKey || ev.metaKey) {
    if (/^[azyAZY]$/.test(ev.key)) {
      ev.preventDefault();
      postInput({
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
    postInput({
      type: "text",
      text: ev.key,
      shift: ev.shiftKey,
      ctrl: false,
    });
  }
});

async function ensureFonts(doc) {
  await document.fonts.ready;
  const loads = [];
  for (const c of doc.list.cmds) {
    if (c.k === 3 && c.text && c.font && c.size) {
      loads.push(document.fonts.load(`${c.size}px "${c.font}"`));
    }
  }
  if (loads.length) await Promise.all(loads);
}

async function pullScene() {
  const res = await fetch("/scene.json?" + Date.now(), { cache: "no-store" });
  if (!res.ok) throw new Error("scene " + res.status);
  const doc = await res.json();
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
  cmdsEl.textContent = String(doc.list.cmds.length);
  window.__evgStats = stats;
  window.__editorDoc = doc;

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
