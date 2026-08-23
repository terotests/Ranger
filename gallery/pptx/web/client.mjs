/**
 * PPTX viewer web client:
 *   INPUT  — keys / clicks / fixture select → PptxApp
 *   RENDER — GET /scene.json → renderDisplayList (WebGL 2)
 */
import { renderDisplayList, loadImages } from "/evg/gl/evg-webgl.js";

const canvas = document.getElementById("view");
const metaEl = document.getElementById("meta");
const featuresEl = document.getElementById("features");
const fixtureSel = document.getElementById("fixture");

const gl = canvas.getContext("webgl2", {
  antialias: true,
  premultipliedAlpha: false,
  stencil: true,
});
if (!gl) {
  metaEl.textContent = "WebGL 2 not available";
  throw new Error("WebGL 2 required");
}

async function refreshMeta() {
  const r = await fetch("/meta.json", { cache: "no-store" });
  const m = await r.json();
  metaEl.textContent = `${m.basename || m.file}  ·  slide ${m.index + 1} / ${m.slides}  ·  ← → or click sides`;
}

async function redraw() {
  const res = await fetch("/scene.json?" + Date.now(), { cache: "no-store" });
  const doc = await res.json();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const cssW = doc.width || 960;
  const cssH = doc.height || 720;
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  const bw = Math.round(cssW * dpr);
  const bh = Math.round(cssH * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  // Display-list IMAGE cmds use OPC part paths (ppt/media/…). Serve them via
  // /part/… and upload textures before painting — otherwise WebGL skips them.
  const images = await loadImages(doc, { base: "/part/" });
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.07, 0.08, 0.11, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
  renderDisplayList(gl, doc, { dpr, images });
  await refreshMeta();
}

async function post(ev) {
  await fetch("/input", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ev),
  });
  await redraw();
}

function pointerPayload(e, down) {
  const rect = canvas.getBoundingClientRect();
  const cssW = parseFloat(canvas.style.width) || 960;
  const cssH = parseFloat(canvas.style.height) || 720;
  return {
    type: "pointer",
    x: Math.round(((e.clientX - rect.left) / rect.width) * cssW),
    y: Math.round(((e.clientY - rect.top) / rect.height) * cssH),
    down,
    shift: !!e.shiftKey,
    ctrl: !!(e.ctrlKey || e.metaKey),
  };
}

canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  post(pointerPayload(e, true));
});
// A drag is a press, a MOVE and a release: without the moves in between, a
// shape teleports on release and a rubber band never appears.
canvas.addEventListener("pointermove", (e) => {
  if (!(e.buttons & 1)) return;
  post(pointerPayload(e, true));
});
canvas.addEventListener("pointerup", (e) => {
  post(pointerPayload(e, false));
});
// How far the gesture actually travelled, in pixels — not which way it went.
//
// This used to send +1 or -1 per event and the app turned each into a 40-pixel
// notch. A mouse fires one event per notch, so that was right for a mouse and
// wrong by a factor of thirty for a trackpad: one two-finger swipe is dozens
// of small events, every one of which counted as a full notch, and a hundred
// slides went past in a flick.
//
// `deltaMode` says what the numbers are in. Firefox reports LINES for a mouse
// wheel and Chrome reports pixels, so a host that ignores it scrolls at
// completely different speeds in the two browsers.
const LINE_PX = 16;
canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= LINE_PX;
    else if (e.deltaMode === 2) dy *= canvas.clientHeight;
    post({ type: "wheel", delta: Math.round(dy) });
  },
  { passive: false },
);

const KEYS = {
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
  Tab: "tab",
  F2: "f2",
  F5: "f5",
};

window.addEventListener("keydown", (e) => {
  const ctrl = !!(e.ctrlKey || e.metaKey);
  const key = KEYS[e.key];
  if (key) {
    e.preventDefault();
    post({ type: "key", key, shift: !!e.shiftKey, ctrl });
    return;
  }
  // Anything printable is text — including a Ctrl chord, which the app reads
  // as a shortcut. This window used to send five keys and nothing else, so a
  // box could be dragged and its words could not be changed.
  if (e.key.length === 1) {
    e.preventDefault();
    post({ type: "text", text: e.key, shift: !!e.shiftKey, ctrl });
  }
});

async function loadFixtures() {
  const r = await fetch("/fixtures.json", { cache: "no-store" });
  const data = await r.json();
  fixtureSel.innerHTML = "";
  for (const f of data.fixtures || []) {
    const opt = document.createElement("option");
    opt.value = f.file;
    opt.textContent = `${f.file} — ${f.title}`;
    opt.dataset.features = (f.features || []).join(", ");
    if (f.file === data.current) opt.selected = true;
    fixtureSel.appendChild(opt);
  }
  const selected = fixtureSel.selectedOptions[0];
  featuresEl.textContent = selected?.dataset.features
    ? `features: ${selected.dataset.features}`
    : "";
}

fixtureSel.addEventListener("change", async () => {
  const file = fixtureSel.value;
  const selected = fixtureSel.selectedOptions[0];
  featuresEl.textContent = selected?.dataset.features
    ? `features: ${selected.dataset.features}`
    : "";
  metaEl.textContent = `loading ${file}…`;
  const r = await fetch("/open", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file }),
  });
  const body = await r.json();
  if (!body.ok) {
    metaEl.textContent = body.error || "open failed";
    return;
  }
  await redraw();
});

await loadFixtures();
redraw().catch((err) => {
  metaEl.textContent = String(err);
  console.error(err);
});
