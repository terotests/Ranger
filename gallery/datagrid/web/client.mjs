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

function canvasCoords(ev) {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  return {
    x: Math.max(0, Math.min(canvas.width - 1, Math.floor((ev.clientX - rect.left) * sx))),
    y: Math.max(0, Math.min(canvas.height - 1, Math.floor((ev.clientY - rect.top) * sy))),
  };
}

async function postInput(payload) {
  await fetch("/input", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
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
