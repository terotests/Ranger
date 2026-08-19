/**
 * Web demo with separated layers:
 *
 *   INPUT  — mouse/keyboard → POST /input → Node UIInput → GridApp
 *   RENDER — GET /scene.json (EVGDisplayList) → evg-webgl.js (WebGL 2)
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
// Logical size of the scene the grid lays out in — NOT the canvas backing
// store, which is scene × devicePixelRatio.
let sceneW = 0;
let sceneH = 0;

/** CSS pixels → the grid's own coordinate space.
 *
 *  This must scale by the SCENE size, not canvas.width: the backing store is
 *  scene × dpr, so scaling by it reported every pointer at dpr× its real
 *  position on a HiDPI display. Cells picked up wrong and the few-pixel
 *  column/row resize grab zone became unreachable. */
function canvasCoords(ev) {
  const rect = canvas.getBoundingClientRect();
  const w = sceneW || canvas.width;
  const h = sceneH || canvas.height;
  const sx = w / Math.max(1, rect.width);
  const sy = h / Math.max(1, rect.height);
  return {
    x: Math.max(0, Math.min(w - 1, Math.floor((ev.clientX - rect.left) * sx))),
    y: Math.max(0, Math.min(h - 1, Math.floor((ev.clientY - rect.top) * sy))),
  };
}

async function postInput(payload) {
  const res = await fetch("/input", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 204) return null;
  try {
    return await res.json();
  } catch (_) {
    return null;
  }
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
  PageUp: "pageUp",
  PageDown: "pageDown",
  F2: "f2",
};

// Ctrl/Cmd chords the grid handles: A select-all, C copy, X cut, V paste,
// Z undo, Y redo, Space select column.
// Ctrl chords the app understands: select-all, copy, cut, paste, undo,
// redo, row/column select (space), m for "make a chart of the selection",
// f / h for find and replace, l for the conditional-format rule editor,
// k for a hyperlink, e for a validation rule, and s to save the workbook.
const CTRL_CHORD = /^[acxvzymfhlkesACXVZYMFHLKES ]$/;

/** Put the selection on the OS clipboard as BOTH flavours a spreadsheet
 *  offers: text/plain TSV and text/html holding a <table>. The HTML flavour is
 *  what Word — and the Ranger DOCX editor — paste as a real table.
 *  Falls back to plain text when ClipboardItem is unavailable, then to
 *  execCommand on non-secure origins. */
async function writeClipboard(text, html) {
  if (html && typeof ClipboardItem === "function" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([text], { type: "text/plain" }),
          "text/html": new Blob([html], { type: "text/html" }),
        }),
      ]);
      return true;
    } catch (_) {
      /* fall through to plain text */
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    canvas.focus();
    return ok;
  } catch (_) {
    return false;
  }
}

canvas.addEventListener("pointerdown", (ev) => {
  canvas.setPointerCapture(ev.pointerId);
  canvas.focus();
  pointerDown = true;
  const { x, y } = canvasCoords(ev);
  postInput({
    type: "pointer",
    x,
    y,
    down: true,
    shift: ev.shiftKey,
    ctrl: ev.ctrlKey || ev.metaKey,
  });
});

canvas.addEventListener("pointermove", (ev) => {
  if (!pointerDown) return;
  const { x, y } = canvasCoords(ev);
  postInput({
    type: "pointer",
    x,
    y,
    down: true,
    shift: ev.shiftKey,
    ctrl: ev.ctrlKey || ev.metaKey,
  });
});

function endPointer(ev) {
  if (!pointerDown) return;
  pointerDown = false;
  const { x, y } = canvasCoords(ev);
  postInput({
    type: "pointer",
    x,
    y,
    down: false,
    shift: ev.shiftKey,
    ctrl: ev.ctrlKey || ev.metaKey,
  });
}

// Double-click a column header edge (or the header) to auto-fit its width —
// no pixel-precise dragging needed.
canvas.addEventListener("dblclick", (ev) => {
  ev.preventDefault();
  const { x, y } = canvasCoords(ev);
  postInput({ type: "dblclick", x, y });
});

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

canvas.addEventListener("keydown", async (ev) => {
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
    // Ctrl+V is served by the native "paste" event below, which hands us the
    // OS clipboard without a permission prompt.
    if (ev.key === "v" || ev.key === "V") return;
    if (CTRL_CHORD.test(ev.key)) {
      ev.preventDefault();
      const reply = await postInput({
        type: "text",
        text: ev.key,
        shift: ev.shiftKey,
        ctrl: true,
      });
      if (reply && typeof reply.clipboard === "string" && reply.clipboard) {
        await writeClipboard(reply.clipboard, reply.clipboardHtml || "");
      }
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

// Ctrl+V / Cmd+V: the browser hands us the OS clipboard here. The server
// recognizes text it exported itself and keeps the formula-aware block paste.
window.addEventListener("paste", (ev) => {
  if (document.activeElement !== canvas) return;
  ev.preventDefault();
  const text = ev.clipboardData ? ev.clipboardData.getData("text/plain") : "";
  postInput({ type: "paste", text });
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
  if (!fontsReady) {
    fontsReady = ensureFonts(doc);
  }
  await fontsReady;

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const cssW = doc.width;
  const cssH = doc.height;
  sceneW = cssW;
  sceneH = cssH;
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  const bw = Math.round(cssW * dpr);
  const bh = Math.round(cssH * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.96, 0.97, 0.98, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

  const stats = renderDisplayList(gl, doc, { dpr });
  cmdsEl.textContent = String(doc.list.cmds.length);
  window.__evgStats = stats;
  window.__gridDoc = doc;

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
