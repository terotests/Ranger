const statusEl = document.getElementById("status");
const sizeEl = document.getElementById("size");
const pageImg = document.getElementById("page");
const docSelect = document.getElementById("docSelect");
const pageLabel = document.getElementById("pageLabel");

let docs = [];
let page = 0;
let pageCount = 1;

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
  await refreshPage();
}

async function refreshPage() {
  statusEl.textContent = "rendering…";
  pageLabel.textContent = `page ${page + 1} / ${pageCount}`;
  const url = `/page.png?page=${page}&t=${Date.now()}`;
  pageImg.onload = () => {
    sizeEl.textContent = `${pageImg.naturalWidth}×${pageImg.naturalHeight}`;
    statusEl.textContent = "live";
  };
  pageImg.onerror = () => {
    statusEl.textContent = "error loading page";
  };
  pageImg.src = url;
  const st = await (await api("/api/state")).json();
  pageCount = Math.max(1, st.pageCount | 1);
  pageLabel.textContent = `page ${page + 1} / ${pageCount}`;
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

statusEl.textContent = "starting";
try {
  await loadList();
  await openDoc(docSelect.value || docs[0]);
} catch (e) {
  statusEl.textContent = "error: " + (e && e.message ? e.message : e);
}
