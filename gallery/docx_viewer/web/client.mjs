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
  pageCount = Math.max(1, data.pageCount | 1);
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
  pageCount = Math.max(1, data.pageCount | 1);
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
  if (data.pageCount) pageCount = Math.max(1, data.pageCount | 1);
  if (data.caret && caretEl) {
    caretEl.textContent = data.caret.active
      ? `p${data.caret.paragraphId}@${data.caret.offset}${data.caret.selEnd != null && data.caret.selEnd !== data.caret.offset ? "…" + data.caret.selEnd : ""}`
      : "—";
  }
  await refreshPage();
  return data;
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

async function refreshPage() {
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
  pageCount = Math.max(1, st.pageCount | 1);
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

window.addEventListener("keydown", async (ev) => {
  if (!editMode) return;
  const tag = (ev.target && ev.target.tagName) || "";
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

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

document.getElementById("btnBold")?.addEventListener("click", () => sendInput({ type: "bold" }));

statusEl.textContent = "starting";
try {
  await loadList();
  await openDoc(docSelect.value || docs[0]);
} catch (e) {
  statusEl.textContent = "error: " + (e && e.message ? e.message : e);
}
