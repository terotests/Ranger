const statusEl = document.getElementById("status");
const sizeEl = document.getElementById("size");
const pageImg = document.getElementById("page");
const docSelect = document.getElementById("docSelect");
const pageLabel = document.getElementById("pageLabel");
const editBtn = document.getElementById("editToggle");
const caretEl = document.getElementById("caretInfo");

let docs = [];
let page = 0;
let pageCount = 1;
let editMode = false;
let dragging = false;
let dragPending = null;
let dragFlushTimer = 0;

async function api(path, opts) {
  const res = await fetch(path, opts);
  if (!res.ok) throw new Error(path + " " + res.status);
  return res;
}

async function loadList() {
  const res = await api("/api/docs");
  const data = await res.json();
  docs = data.docs || [];
  docSelect.innerHTML = "";
  for (const d of docs) {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    docSelect.appendChild(opt);
  }
  if (data.current) docSelect.value = data.current;
  page = data.page | 0;
  pageCount = Math.max(1, data.pageCount | 0);
}

async function openDoc(name) {
  statusEl.textContent = "opening…";
  const res = await api("/api/open", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ file: name }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "open failed");
  page = 0;
  pageCount = Math.max(1, data.pageCount | 0);
  editMode = false;
  syncEditBtn();
  await refreshPage();
}

function syncEditBtn() {
  if (!editBtn) return;
  editBtn.textContent = editMode ? "Edit: ON" : "Edit";
  editBtn.style.borderColor = editMode ? "#78c8ff" : "";
  pageImg.style.cursor = editMode ? "text" : "default";
}

async function setEditMode(on) {
  const res = await api("/api/edit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ enabled: !!on }),
  });
  const data = await res.json();
  editMode = !!data.editMode;
  syncEditBtn();
  await refreshPage();
}

async function sendInput(payload) {
  const res = await api("/api/input", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (data.pageCount) pageCount = Math.max(1, data.pageCount | 0);
  if (typeof data.page === "number") page = data.page;
  clampPage();
  if (data.caret && caretEl) {
    caretEl.textContent = data.caret.active
      ? `p${data.caret.paragraphId}@${data.caret.offset}${data.caret.selEnd != null && data.caret.selEnd !== data.caret.offset ? "…" + data.caret.selEnd : ""}`
      : "—";
  }
  // The chart controls appear only when a chart is selected: they are about
  // the object under the pointer, not about the document.
  if (typeof data.chart === "number") setChartTools(data.chart);
  await refreshPage();
  return data;
}

const chartToolsEl = document.getElementById("chartTools");
let selectedChart = 0;

function setChartTools(id) {
  selectedChart = id | 0;
  if (chartToolsEl) chartToolsEl.hidden = selectedChart === 0;
}

async function chartEdit(what, arg) {
  if (!selectedChart) return;
  await sendInput({ type: "chart", what, arg: arg == null ? "" : String(arg) });
}

function imgLocalXY(ev) {
  const rect = pageImg.getBoundingClientRect();
  const nw = Math.max(1, pageImg.naturalWidth || 0);
  const nh = Math.max(1, pageImg.naturalHeight || 0);
  // Map CSS box → SoftCanvas / layout pixels (same space as LaidLine.x/y).
  // Prefer natural size; fall back to 1:1 if the image has not decoded yet.
  const scaleX = nw / Math.max(1, rect.width);
  const scaleY = nh / Math.max(1, rect.height);
  let x = Math.floor((ev.clientX - rect.left) * scaleX);
  let y = Math.floor((ev.clientY - rect.top) * scaleY);
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x >= nw) x = nw - 1;
  if (y >= nh) y = nh - 1;
  return { x, y };
}

/** Keep `page` inside the document. Editing can shrink the page count under a
 *  caret that was on a later page. */
function clampPage() {
  if (!Number.isFinite(page) || page < 0) page = 0;
  if (page > pageCount - 1) page = pageCount - 1;
  if (page < 0) page = 0;
}

async function refreshPage() {
  clampPage();
  statusEl.textContent = "rendering…";
  pageLabel.textContent = `page ${page + 1} / ${pageCount}`;
  const url = `/page.png?page=${page}&t=${Date.now()}`;
  await new Promise((resolve, reject) => {
    pageImg.onload = () => {
      sizeEl.textContent = `${pageImg.naturalWidth}×${pageImg.naturalHeight}`;
      statusEl.textContent = editMode ? "edit" : "live";
      resolve();
    };
    pageImg.onerror = () => {
      statusEl.textContent = "error loading page";
      reject(new Error("page load"));
    };
    pageImg.src = url;
  });
  const st = await (await api("/api/state")).json();
  pageCount = Math.max(1, st.pageCount | 0);
  // The host reports the page it actually drew; an out-of-range request is
  // clamped there, so adopt it rather than keeping a phantom index.
  if (typeof st.page === "number") page = st.page;
  clampPage();
  pageLabel.textContent = `page ${page + 1} / ${pageCount}`;
  editMode = !!st.editMode;
  syncEditBtn();
  if (st.caret && caretEl) {
    caretEl.textContent = st.caret.active
      ? `p${st.caret.paragraphId}@${st.caret.offset}${st.caret.selEnd != null && st.caret.selEnd !== st.caret.offset ? "…" + st.caret.selEnd : ""}`
      : "—";
  }
}

docSelect.addEventListener("change", () => openDoc(docSelect.value));
document.getElementById("prevPage").addEventListener("click", async () => {
  if (page <= 0) return;
  page -= 1;
  await refreshPage();
});
document.getElementById("nextPage").addEventListener("click", async () => {
  if (page + 1 >= pageCount) return;
  page += 1;
  await refreshPage();
});
document.getElementById("reload").addEventListener("click", () => openDoc(docSelect.value));
if (editBtn) {
  editBtn.addEventListener("click", () => setEditMode(!editMode));
}

pageImg.addEventListener("mousedown", async (ev) => {
  if (!editMode) return;
  ev.preventDefault();
  dragging = true;
  dragPending = null;
  const { x, y } = imgLocalXY(ev);
  await sendInput({ type: "click", x, y, shift: !!ev.shiftKey });
  pageImg.focus?.();
});

async function flushDrag() {
  dragFlushTimer = 0;
  if (!dragging || !dragPending) return;
  const payload = dragPending;
  dragPending = null;
  await sendInput(payload);
  if (dragPending) {
    // Another move arrived while we were flushing.
    scheduleDragFlush();
  }
}

function scheduleDragFlush() {
  if (dragFlushTimer) return;
  dragFlushTimer = window.setTimeout(() => {
    flushDrag().catch(() => {});
  }, 32);
}

window.addEventListener("mouseup", async () => {
  if (!editMode) {
    dragging = false;
    return;
  }
  if (dragging && dragPending) {
    const payload = dragPending;
    dragPending = null;
    dragging = false;
    if (dragFlushTimer) {
      clearTimeout(dragFlushTimer);
      dragFlushTimer = 0;
    }
    await sendInput(payload);
    return;
  }
  dragging = false;
});

pageImg.addEventListener("mousemove", (ev) => {
  if (!editMode || !dragging) return;
  const { x, y } = imgLocalXY(ev);
  dragPending = { type: "click", x, y, shift: true };
  scheduleDragFlush();
});

// Caret navigation keys → one "move" event each. Shift extends the selection,
// Ctrl turns Home/End into document start/end.
const MOVE_KEYS = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  PageUp: "pageUp",
  PageDown: "pageDown",
  Home: "home",
  End: "end",
};

/** Put text on the OS clipboard, falling back to execCommand when the async
 *  Clipboard API is unavailable or denied (e.g. a non-secure origin). */
async function writeClipboard(text) {
  if (!text) return false;
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
    pageImg.focus?.();
    return ok;
  } catch (_) {
    return false;
  }
}

// --- the wheel, and a swipe ------------------------------------------------
// A document you are reading has to answer a scroll gesture, and this page had
// nothing on the wheel at all: the mouse did nothing, the trackpad did nothing,
// and a finger did nothing. All three are the same question — how far did it
// travel — so all three send `scroll` and the viewer decides when that adds up
// to a page. Deciding it there rather than here is what keeps this host and
// the serverless page feeling the same.
let scrollBusy = false;

async function sendScroll(dy) {
  if (!dy) return;
  if (scrollBusy) return;
  scrollBusy = true;
  try {
    const data = await sendInput({ type: "scroll", dy: Math.round(dy) });
    if (data && typeof data.page === "number" && data.page !== page) {
      page = data.page;
      await refreshPage();
    }
  } finally {
    scrollBusy = false;
  }
}

pageImg?.addEventListener(
  "wheel",
  (ev) => {
    ev.preventDefault();
    // A wheel notch is reported in lines or pages on some browsers; scale
    // those to something comparable to the pixels a trackpad sends.
    let dy = ev.deltaY;
    if (ev.deltaMode === 1) dy *= 16;
    else if (ev.deltaMode === 2) dy *= 400;
    sendScroll(dy);
  },
  { passive: false }
);

let touchY = 0;
let touchActive = false;
pageImg?.addEventListener(
  "touchstart",
  (ev) => {
    if (ev.touches.length !== 1) return;
    touchY = ev.touches[0].clientY;
    touchActive = true;
  },
  { passive: true }
);
pageImg?.addEventListener(
  "touchmove",
  (ev) => {
    if (!touchActive || ev.touches.length !== 1) return;
    const y = ev.touches[0].clientY;
    const dy = touchY - y;
    touchY = y;
    ev.preventDefault();
    sendScroll(dy);
  },
  { passive: false }
);
pageImg?.addEventListener("touchend", () => {
  touchActive = false;
});

window.addEventListener("keydown", async (ev) => {
  const tag = (ev.target && ev.target.tagName) || "";
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

  // Reading a document is not editing one, but the arrow keys still have to
  // do something. In view mode they turn the page — the viewer decides that,
  // not this file, so the serverless page behaves the same — and everything
  // that types, deletes or pastes stays behind the edit switch.
  if (!editMode) {
    const turn = MOVE_KEYS[ev.key];
    if (!turn) return;
    ev.preventDefault();
    const moved = await sendInput({ type: "move", dir: turn, shift: false, ctrl: false });
    if (moved && typeof moved.page === "number" && moved.page !== page) {
      page = moved.page;
      await refreshPage();
    }
    return;
  }

  // Tab moves between table cells. preventDefault keeps the browser from
  // moving focus off the page. (Cmd+Tab belongs to macOS and never reaches us;
  // Shift+Tab is the "previous cell" binding.)
  if (ev.key === "Tab") {
    ev.preventDefault();
    const data = await sendInput({ type: "tab", shift: ev.shiftKey });
    if (data && typeof data.page === "number" && data.page !== page) {
      page = data.page;
      await refreshPage();
    }
    return;
  }

  const move = MOVE_KEYS[ev.key];
  if (move) {
    ev.preventDefault();
    const data = await sendInput({
      type: "move",
      dir: move,
      shift: ev.shiftKey,
      ctrl: ev.ctrlKey || ev.metaKey,
    });
    // The caret may have walked onto another page; follow it.
    if (data && typeof data.page === "number" && data.page !== page) {
      page = data.page;
      await refreshPage();
    }
    return;
  }
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "a") {
    ev.preventDefault();
    await sendInput({ type: "selectAll" });
    return;
  }
  if ((ev.ctrlKey || ev.metaKey) && (ev.key.toLowerCase() === "c" || ev.key.toLowerCase() === "x")) {
    ev.preventDefault();
    const data = await sendInput({ type: ev.key.toLowerCase() === "c" ? "copy" : "cut" });
    if (data && data.clipboard) await writeClipboard(data.clipboard);
    return;
  }
  // Ctrl+V is served by the native "paste" event below.
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "v") return;

  if (ev.key === "Backspace") {
    ev.preventDefault();
    await sendInput({ type: "backspace" });
    return;
  }
  if (ev.key === "Delete") {
    ev.preventDefault();
    await sendInput({ type: "delete" });
    return;
  }
  if (ev.key === "Enter") {
    ev.preventDefault();
    await sendInput({ type: "enter" });
    return;
  }
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "b") {
    ev.preventDefault();
    await sendInput({ type: "bold" });
    return;
  }
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "z") {
    ev.preventDefault();
    await sendInput({ type: ev.shiftKey ? "redo" : "undo" });
    return;
  }
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "y") {
    ev.preventDefault();
    await sendInput({ type: "redo" });
    return;
  }
  if (ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
    ev.preventDefault();
    await sendInput({ type: "text", text: ev.key });
  }
});

// Paste from the OS clipboard. A spreadsheet selection carries a text/html
// <table> next to the TSV; the server turns that into a real Word table.
window.addEventListener("paste", async (ev) => {
  if (!editMode) return;
  const tag = (ev.target && ev.target.tagName) || "";
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
  ev.preventDefault();
  const cd = ev.clipboardData;
  const html = cd ? cd.getData("text/html") : "";
  const text = cd ? cd.getData("text/plain") : "";
  if (!html && !text) return;
  await sendInput({ type: "paste", html, text });
});

document.getElementById("btnBold")?.addEventListener("click", () => sendInput({ type: "bold" }));

// Editing a chart in the document. Each of these changes the chart's own Vela
// document and it is drawn again from the numbers — none of them touch pixels.
document.getElementById("chartType")?.addEventListener("click", () => chartEdit("kind.next", 1));
document.getElementById("chartStyle")?.addEventListener("click", () => chartEdit("style.next", 1));
document.getElementById("chartLegend")?.addEventListener("click", () => chartEdit("legend", ""));
document.getElementById("chartTitle")?.addEventListener("click", () => {
  const title = window.prompt("Chart title");
  if (title != null) chartEdit("title", title);
});
document.getElementById("chartWider")?.addEventListener("click", () => chartEdit("width", 520));
document.getElementById("chartDelete")?.addEventListener("click", () => chartEdit("delete", ""));

statusEl.textContent = "starting";
try {
  await loadList();
  await openDoc(docSelect.value || docs[0]);
} catch (e) {
  statusEl.textContent = "error: " + (e && e.message ? e.message : e);
}
