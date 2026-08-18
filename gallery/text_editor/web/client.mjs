/**
 * Browser client: blit SoftCanvas RGBA frames and forward pointer/keyboard
 * into the Node present server as UIInput-shaped events.
 */
const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const fpsEl = document.getElementById("fps");

let W = canvas.width;
let H = canvas.height;
let image = ctx.createImageData(W, H);
let frames = 0;
let fpsT0 = performance.now();
let pointerDown = false;

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
    const delta = ev.deltaY < 0 ? 1 : -1;
    postInput({ type: "wheel", delta });
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
    if (ev.key === "a" || ev.key === "A" || ev.key === "z" || ev.key === "Z" || ev.key === "y" || ev.key === "Y") {
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

async function pullFrame() {
  const res = await fetch("/frame.bin?" + Date.now(), { cache: "no-store" });
  if (!res.ok) throw new Error("frame " + res.status);
  const metaW = parseInt(res.headers.get("x-frame-width") || "0", 10);
  const metaH = parseInt(res.headers.get("x-frame-height") || "0", 10);
  if (metaW && metaH && (metaW !== W || metaH !== H)) {
    W = metaW;
    H = metaH;
    canvas.width = W;
    canvas.height = H;
    image = ctx.createImageData(W, H);
  }
  const buf = await res.arrayBuffer();
  image.data.set(new Uint8ClampedArray(buf));
  ctx.putImageData(image, 0, 0);
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
    await pullFrame();
    statusEl.textContent = "live";
  } catch (e) {
    statusEl.textContent = "error: " + (e && e.message ? e.message : e);
  }
  requestAnimationFrame(loop);
}

statusEl.textContent = "starting";
canvas.focus();
loop();
