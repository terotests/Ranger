// ============================================================================
// live-editor.js — Monaco shell boot for v2 live2d / live3d demos.
// ============================================================================
//
// Loads demos.json, lets you pick a game, mounts its scene.zip into a VFS,
// runs WebLive2dHost / WebLive3dHost, and hot-reloads the editable .tsx when
// Monaco changes (full host rebuild — same pattern as tsx3d-gl-viewer).
// ============================================================================

(function () {
  "use strict";

  const statusEl = document.getElementById("status");
  const selectEl = document.getElementById("game");
  const controlsEl = document.getElementById("controls");
  const fileCapEl = document.getElementById("filecap");
  const autoEl = document.getElementById("autoreload");
  const splitEl = document.getElementById("split");
  const splitterEl = document.getElementById("splitter");
  let canvas = document.getElementById("screen");

  let registry = [];
  let session = null;
  let editor = null;
  let paused = false;
  let editTimer = 0;
  let suppressChange = false;
  let assetBase = "./"; // where demos/<id>/ lives relative to this page

  const SPLIT_KEY = "ranger-v2-editor-pct";
  const SPLIT_DEFAULT = 55;
  const SPLIT_MIN = 20;
  const SPLIT_MAX = 80;

  const setStatus = (msg, ok) =>
    (statusEl.innerHTML = ok ? '<span class="ok">' + msg + "</span>" : msg);

  function setEditorPct(pct) {
    const n = Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, Math.round(pct)));
    splitEl.style.setProperty("--editor-pct", n + "%");
    splitterEl.setAttribute("aria-valuenow", String(n));
    try {
      localStorage.setItem(SPLIT_KEY, String(n));
    } catch (_) {}
    return n;
  }

  function initSplitter() {
    let saved = SPLIT_DEFAULT;
    try {
      const raw = localStorage.getItem(SPLIT_KEY);
      if (raw != null && raw !== "") saved = Number(raw);
    } catch (_) {}
    if (!Number.isFinite(saved)) saved = SPLIT_DEFAULT;
    setEditorPct(saved);

    let dragging = false;
    const onMove = (clientX) => {
      const rect = splitEl.getBoundingClientRect();
      if (rect.width <= 0) return;
      setEditorPct(((clientX - rect.left) / rect.width) * 100);
    };
    splitterEl.addEventListener("pointerdown", (e) => {
      if (window.matchMedia("(max-width: 900px)").matches) return;
      dragging = true;
      document.body.classList.add("splitting");
      splitterEl.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    splitterEl.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      onMove(e.clientX);
    });
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove("splitting");
      try {
        splitterEl.releasePointerCapture(e.pointerId);
      } catch (_) {}
    };
    splitterEl.addEventListener("pointerup", endDrag);
    splitterEl.addEventListener("pointercancel", endDrag);
    splitterEl.addEventListener("dblclick", () => setEditorPct(SPLIT_DEFAULT));
    splitterEl.addEventListener("keydown", (e) => {
      const cur = Number(splitterEl.getAttribute("aria-valuenow")) || SPLIT_DEFAULT;
      if (e.key === "ArrowLeft") {
        setEditorPct(cur - 2);
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        setEditorPct(cur + 2);
        e.preventDefault();
      } else if (e.key === "Home") {
        setEditorPct(SPLIT_MIN);
        e.preventDefault();
      } else if (e.key === "End") {
        setEditorPct(SPLIT_MAX);
        e.preventDefault();
      }
    });
  }

  async function fetchText(u) {
    const r = await fetch(u);
    if (!r.ok) throw new Error("fetch " + u + " -> " + r.status);
    return r.text();
  }
  async function fetchBuffer(u) {
    const r = await fetch(u);
    if (!r.ok) throw new Error("fetch " + u + " -> " + r.status);
    return r.arrayBuffer();
  }

  function ensureEditor(value) {
    if (!window.RangerEditor) return null;
    if (!editor) {
      editor = window.RangerEditor.create(document.getElementById("editor"), value, {});
      editor.onDidChangeModelContent(() => {
        if (suppressChange) return;
        if (!autoEl.checked) {
          setStatus("edited — press Reload now");
          return;
        }
        clearTimeout(editTimer);
        editTimer = setTimeout(applyEdit, 400);
      });
    } else {
      suppressChange = true;
      editor.setValue(value);
      suppressChange = false;
    }
    return editor;
  }

  function applyEdit() {
    if (!session || !editor || typeof session.reload !== "function") return;
    try {
      const rebuilt = session.reload(editor.getValue());
      setStatus(rebuilt ? "reloaded ✓ (scene rebuilt)" : "reloaded ✓", true);
    } catch (e) {
      setStatus("reload error: " + e.message);
      console.error(e);
    }
  }

  function freshCanvas(width, height, square) {
    const old = document.getElementById("screen");
    const c = document.createElement("canvas");
    c.id = "screen";
    c.width = width || 480;
    c.height = height || 270;
    c.tabIndex = 0;
    if (square) c.className = "square";
    old.replaceWith(c);
    canvas = c;
    return c;
  }

  function demoUrl(entry, file) {
    // Hub pages nest demos under <id>/; locked per-demo pages already sit inside
    // that folder, so assets are siblings of index.html.
    if (window.RANGER_V2_LOCKED_DEMO) return assetBase + file;
    return assetBase + entry.id + "/" + file;
  }

  async function loadGame(entry) {
    if (session) {
      session.stop();
      if (typeof session.dispose === "function") session.dispose();
    }
    setStatus("loading " + entry.title + "…");
    controlsEl.textContent = entry.controls || "";
    fileCapEl.textContent = entry.editPath || entry.id;
    const square = entry.kind === "live3d";
    const w = entry.width || (square ? 480 : 480);
    const h = entry.height || (square ? 480 : 270);
    freshCanvas(w, h, square);

    const bundleSource = await fetchText(demoUrl(entry, entry.bundle || "live3d.bundle.js"));
    const zipBuffer = await fetchBuffer(demoUrl(entry, "scene.zip"));
    const scene = JSON.parse(await fetchText(demoUrl(entry, "scene.json")));

    if (entry.kind === "live2d") {
      session = await window.RangerLive2d.launch({
        bundleSource,
        zipBuffer,
        canvas,
        width: scene.width || w,
        height: scene.height || h,
        clearRgb: scene.clearRgb || entry.clearRgb || 0,
        gameDir: scene.gameDir || entry.gameDir,
        gameFile: scene.gameFile || entry.gameFile || "index.tsx",
      });
    } else if (entry.kind === "live3d") {
      session = await window.RangerLive3d.launch({
        bundleSource,
        zipBuffer,
        canvas,
        size: scene.size || w,
        facadeDir: scene.facadeDir,
        facadeFile: scene.facadeFile,
        guestDir: scene.guestDir,
        guestFile: scene.guestFile,
        packageDir: scene.packageDir || "",
      });
    } else {
      throw new Error("unknown demo kind: " + entry.kind);
    }

    ensureEditor(session.getSource());
    paused = false;
    document.getElementById("pause").textContent = "Pause";
    canvas.focus();
    setStatus(entry.title + " — edit the script; auto-reload rebuilds the scene", true);

    // Keep the URL shareable per game.
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("demo", entry.id);
      history.replaceState(null, "", u.pathname + u.search + u.hash);
    } catch (_) {}
  }

  function pickInitialIndex() {
    const locked = window.RANGER_V2_LOCKED_DEMO;
    if (locked) {
      const i = registry.findIndex((d) => d.id === locked);
      return i >= 0 ? i : 0;
    }
    try {
      const id = new URL(window.location.href).searchParams.get("demo");
      if (id) {
        const i = registry.findIndex((d) => d.id === id);
        if (i >= 0) return i;
      }
    } catch (_) {}
    return 0;
  }

  async function boot() {
    try {
      assetBase = window.RANGER_V2_ASSET_BASE || "./";
      const demosPath = window.RANGER_V2_DEMOS_JSON || "./demos.json";
      registry = JSON.parse(await fetchText(demosPath));
      if (window.RANGER_V2_LOCKED_DEMO) {
        selectEl.disabled = true;
      }
      selectEl.innerHTML = registry
        .map((g, i) => '<option value="' + i + '">' + g.title + "</option>")
        .join("");
      const initial = pickInitialIndex();
      selectEl.value = String(initial);
      selectEl.onchange = () => loadGame(registry[+selectEl.value]);
      document.getElementById("reload").onclick = applyEdit;
      document.getElementById("restart").onclick = () => loadGame(registry[+selectEl.value]);
      document.getElementById("pause").onclick = () => {
        if (!session) return;
        paused = !paused;
        if (paused) session.stop();
        else session.start();
        document.getElementById("pause").textContent = paused ? "Resume" : "Pause";
      };
      initSplitter();
      await loadGame(registry[initial]);
      if (!window.RangerEditor) {
        splitEl.classList.add("no-editor");
        document.getElementById("editor").innerHTML =
          '<p style="padding:16px;color:#97a0bd">Editor bundle not built — run <code>npm ci</code> in <code>gallery/game_engine/v2/web</code> then rebuild.</p>';
      }
    } catch (e) {
      setStatus("error: " + e.message);
      console.error(e);
    }
  }

  boot();
})();
