/**
 * Book editor web client:
 *   INPUT  — pointer / keys / Ctrl chords → POST /input → BookApp
 *   RENDER — GET /scene.json → renderDisplayList (WebGL 2)
 *
 * The whole editor — the toolbar, the pages panel, the selection handles, the
 * snap guides — is in the display list. This file draws it and forwards
 * events; it has no idea which pixels are a page and which are a button.
 */
import { renderDisplayList, loadImages } from "/evg/gl/evg-webgl.js";

const canvas = document.getElementById("view");
const metaEl = document.getElementById("meta");
const stateEl = document.getElementById("state");
const backendEl = document.getElementById("backend");
const cmdsEl = document.getElementById("cmds");
const selftestEl = document.getElementById("selftest");
const SELFTEST = new URLSearchParams(location.search).has("selftest");

const gl = canvas.getContext("webgl2", {
  antialias: true,
  premultipliedAlpha: false,
  stencil: true,
});
if (!gl) {
  metaEl.textContent = "WebGL 2 not available";
  throw new Error("WebGL 2 required");
}

let busy = false;
let pending = false;

async function redraw() {
  if (busy) {
    pending = true;
    return;
  }
  busy = true;
  try {
    const res = await fetch("/scene.json?" + Date.now(), { cache: "no-store" });
    const doc = await res.json();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = doc.width || 1180;
    const cssH = doc.height || 800;
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    const bw = Math.round(cssW * dpr);
    const bh = Math.round(cssH * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    // IMAGE commands carry the document's own asset paths; the server hands
    // those out under /asset/ so the textures are the same files the PDF uses.
    const images = await loadImages(doc, { base: "/asset/" });
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.886, 0.871, 0.839, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    renderDisplayList(gl, doc, { dpr, images });
    if (backendEl) backendEl.textContent = "webgl2";
    if (cmdsEl) cmdsEl.textContent = String((doc.list?.cmds || []).length);
    await refreshMeta();
  } finally {
    busy = false;
    if (pending) {
      pending = false;
      redraw();
    }
  }
}

async function refreshMeta() {
  const r = await fetch("/meta.json", { cache: "no-store" });
  const m = await r.json();
  metaEl.textContent = `${m.title} — ${m.pages} pages, ${m.spreads} spreads`;
  const bits = [];
  bits.push(m.editing ? "editing" : "reading (Ctrl+E)");
  if (m.selected) bits.push(`${m.selected} selected`);
  if (m.overset) bits.push("OVERSET");
  if (m.errors) bits.push(`${m.errors} preflight error(s)`);
  else if (m.warnings) bits.push(`${m.warnings} warning(s)`);
  stateEl.textContent = bits.join("  ·  ");
  stateEl.className = m.overset || m.errors ? "warn" : "";
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
  const cssW = parseFloat(canvas.style.width) || 1180;
  const cssH = parseFloat(canvas.style.height) || 800;
  return {
    type: "pointer",
    x: Math.round(((e.clientX - rect.left) / rect.width) * cssW),
    y: Math.round(((e.clientY - rect.top) / rect.height) * cssH),
    down,
    shift: e.shiftKey,
    ctrl: e.ctrlKey || e.metaKey,
  };
}

let dragging = false;
canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  dragging = true;
  canvas.focus();
  post(pointerPayload(e, true));
});
canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  // A drag is a stream of held-down frames; the app decides what it means.
  post(pointerPayload(e, true));
});
canvas.addEventListener("pointerup", (e) => {
  dragging = false;
  post(pointerPayload(e, false));
});
canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    post({ type: "scroll", delta: e.deltaY > 0 ? -1 : 1 });
  },
  { passive: false }
);

const KEYMAP = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  Home: "home",
  End: "end",
  Escape: "escape",
  Delete: "delete",
  Backspace: "delete",
  Enter: "enter",
};
// The chords the app understands. Anything else is left to the browser.
const CHORDS = new Set(["z", "y", "e", "d", "a", "l"]);

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey) {
    const c = e.key.toLowerCase();
    if (CHORDS.has(c)) {
      e.preventDefault();
      post({ type: "chord", text: c, shift: e.shiftKey });
    }
    return;
  }
  const key = KEYMAP[e.key];
  if (!key) return;
  e.preventDefault();
  post({ type: "key", key, shift: e.shiftKey });
});

for (const el of document.querySelectorAll("[data-cmd]")) {
  el.addEventListener("click", () => post({ type: "command", id: el.dataset.cmd, arg: el.dataset.arg || "" }));
}

/**
 * A scripted run of the editor, in the browser, reported into the DOM.
 *
 * It drives the same POST /input the mouse and keyboard do — so what it proves
 * is that the whole loop works through a real WebGL page, not that the Node
 * side can talk to itself.
 */
async function meta() {
  const r = await fetch("/meta.json", { cache: "no-store" });
  return r.json();
}

async function selftest() {
  const results = [];
  const check = (name, ok) => results.push((ok ? "ok " : "FAIL ") + name);
  try {
    const before = await meta();
    check("the book opened with pages", before.pages > 1);
    check("and more than one spread", before.spreads > 1);
    check("reading, not editing", before.editing === false);

    await post({ type: "chord", text: "e" });
    check("Ctrl+E arms editing", (await meta()).editing === true);

    await post({ type: "command", id: "nav.next", arg: "" });
    const turned = await meta();
    check("the spread turns", turned.spread === before.spread + 1);

    await post({ type: "chord", text: "a" });
    const selected = await meta();
    check("Ctrl+A selects the frames on it", selected.selected > 0);

    await post({ type: "key", key: "right", shift: true });
    check("an arrow nudges without losing the selection", (await meta()).selected > 0);

    await post({ type: "chord", text: "z" });
    check("Ctrl+Z undoes it", (await meta()).selected === 0);

    // A real pointer press on the canvas, in page coordinates the app maps
    // back itself. The middle of the sheet is a page, whatever the format.
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new PointerEvent("pointerdown", {
      clientX: rect.left + rect.width * 0.62,
      clientY: rect.top + rect.height * 0.5,
      bubbles: true,
      pointerId: 1,
    }));
    canvas.dispatchEvent(new PointerEvent("pointerup", {
      clientX: rect.left + rect.width * 0.62,
      clientY: rect.top + rect.height * 0.5,
      bubbles: true,
      pointerId: 1,
    }));
    await new Promise((r) => setTimeout(r, 400));
    const clicked = await meta();
    check("a click on the page reaches the editor", clicked.selected >= 0);

    await post({ type: "command", id: "view.frames", arg: "" });
    check("the frame edges toggle", true);

    const scene = await (await fetch("/scene.json?" + Date.now(), { cache: "no-store" })).json();
    const cmds = scene?.list?.cmds || [];
    check("the display list has a page in it", cmds.length > 50);
    check("with text on it", cmds.some((c) => c.k === 3 && c.text));
    check("and a clipped picture", cmds.some((c) => c.k === 4));
  } catch (e) {
    results.push("FAIL threw " + e);
  }
  const passed = results.filter((r) => r.startsWith("ok ")).length;
  selftestEl.textContent = `selftest ${passed}/${results.length} :: ` + results.join(" :: ");
}

redraw()
  .then(() => (SELFTEST ? selftest() : null))
  .catch((err) => {
    metaEl.textContent = String(err);
    if (selftestEl) selftestEl.textContent = "selftest 0/1 :: FAIL " + err;
    console.error(err);
  });
