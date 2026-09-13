// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The browser host for the M-Files emulator. It owns the pixels, the pointer,
// the keyboard session and the clock — and nothing else:
//
//   MfilesApp (Ranger)  the client window, the vault, the gRPC API, and a
//                       ComponentEngine per UIX application
//   this file           WebGL, events, the text-input proxy, the code drawer
//
// `?mode=1` starts the emulator in UIX v1 mode.

import { renderDisplayList } from "./evg/gl/evg-webgl.js";
import { createA11yMirror, pressAtCentre } from "./evg/gl/evg-a11y.js";
import { installCanvasMeasurer } from "./evg/gl/evg-measure.js";
import { createTextInputBridge } from "./evg/gl/evg-textinput.js";
import MfilesModule, { MfilesApp } from "./generated-host.js";
import { CSS, SCRIPTS, EXTENSIONS } from "./generated.js";
import { createPreview } from "./preview.js";
import { createCodeEditor } from "./code-editor.js";

const stage = document.getElementById("stage");
const canvas = document.getElementById("c");
const errEl = document.getElementById("err");
const preview = createPreview({
  canvas: document.getElementById("pv"),
  onError: (e) => {
    // The next paint clears the error line, so the console keeps it too.
    console.error("preview:", e);
    errEl.textContent = String((e && e.stack) || e);
  },
});

installCanvasMeasurer(MfilesModule);

const app = new MfilesApp();
app.init(CSS, SCRIPTS.api, SCRIPTS.core, SCRIPTS.v1, SCRIPTS.v2, SCRIPTS.grpc);
const params = new URLSearchParams(location.search);
if (params.get("mode") === "1") app.setMode(1);
for (const ext of EXTENSIONS) app.addExtension(ext.name, ext.guid, ext.version, ext.source);
window.__mfiles = app;

let generation = 0;
let mirror = null;

function sizeOfWindow() {
  return [Math.max(320, Math.floor(window.innerWidth)), Math.max(480, Math.floor(window.innerHeight))];
}

function paint() {
  try {
    errEl.textContent = "";
    const [w, h] = sizeOfWindow();
    const list = JSON.parse(app.displayListJson());
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    if (canvas.width !== Math.round(w * dpr)) canvas.width = Math.round(w * dpr);
    if (canvas.height !== Math.round(h * dpr)) canvas.height = Math.round(h * dpr);
    stage.style.width = `${w}px`;
    stage.style.height = `${h}px`;
    const gl = canvas.getContext("webgl2", { antialias: true, premultipliedAlpha: false, stencil: true, preserveDrawingBuffer: true });
    if (!gl) throw new Error("WebGL 2 is not available in this browser");
    renderDisplayList(gl, { width: w, height: h, list }, { dpr });
    placeCodePanel();
    preview.update(app.previewJson());
    generation += 1;
    if (mirror) {
      const tree = JSON.parse(app.a11yJson(generation, app.focusedField()));
      tree.byId = new Map(tree.nodes.map((n) => [n.id, n]));
      mirror.update(tree);
    }
  } catch (e) {
    errEl.textContent = String((e && e.stack) || e);
  }
}

function resize() {
  const [w, h] = sizeOfWindow();
  app.setPageSize(w, h);
  paint();
  syncTextSession();
}

// --- the text session ---------------------------------------------------------
const textInput = createTextInputBridge({
  host: stage,
  canvas,
  onEdit: ({ value, selStart, selEnd }) => {
    const tid = textInput.activeTid();
    if (!tid || !app.applyEdit(tid, value, selStart, selEnd)) return;
    paint();
  },
  onKey: (k) => {
    if (k.key !== "Tab" && k.key !== "Escape" && k.key !== "Enter") return false;
    const took = app.keyWith(k.key, k.shiftKey, k.ctrlKey || k.metaKey);
    if (took) paint();
    syncTextSession();
    return took;
  },
});

function syncTextSession() {
  const tid = app.focusedField();
  if (!tid) {
    textInput.blurField();
    return;
  }
  const st = JSON.parse(app.fieldStateJson(tid));
  if (!st) {
    textInput.blurField();
    return;
  }
  if (textInput.activeTid() === tid) textInput.sync(st);
  else textInput.focusField(tid, st);
}

mirror = createA11yMirror(stage, {
  canvas,
  label: "M-Files emulator",
  onActivate: (node) =>
    pressAtCentre(node, (x, y) => {
      app.pointerDown(x, y, 0);
      paint();
      syncTextSession();
    }),
});

// --- the pointer ----------------------------------------------------------------
function at(ev) {
  const r = canvas.getBoundingClientRect();
  return [ev.clientX - r.left, ev.clientY - r.top];
}

canvas.addEventListener("contextmenu", (ev) => ev.preventDefault());

// Over the Preview tab's hole the pointer belongs to the viewer beneath it —
// unless something of the app's own (a menu, a toast, a dialog) is on top.
const overPreview = (x, y) => preview.covers(x, y) && app.hitId(x, y) === "mf-pscroll";

canvas.addEventListener("pointerdown", (ev) => {
  const [x, y] = at(ev);
  canvas.focus({ preventScroll: true });
  if (ev.button === 0 && overPreview(x, y)) {
    canvas.setPointerCapture(ev.pointerId);
    // The app still hears the press — it closes an open menu — and the viewer gets it.
    if (app.pointerDown(x, y, 0)) paint();
    preview.pointer("down", x, y, ev);
    return;
  }
  app.setPressed(app.hitId(x, y));
  if (app.pointerDown(x, y, ev.button)) paint();
  syncTextSession();
});

canvas.addEventListener("pointerup", (ev) => {
  app.setPressed("");
  if (preview.dragging()) {
    const [x, y] = at(ev);
    preview.pointer("up", x, y, ev);
  }
});

canvas.addEventListener("dblclick", (ev) => {
  const [x, y] = at(ev);
  if (overPreview(x, y)) return;
  if (app.doubleClick(x, y)) paint();
  syncTextSession();
});

canvas.addEventListener("pointermove", (ev) => {
  const [x, y] = at(ev);
  if (preview.dragging() || overPreview(x, y)) {
    canvas.style.cursor = "default";
    preview.pointer("move", x, y, ev);
    if (app.setHover("")) paint();
    return;
  }
  const id = app.hitId(x, y);
  canvas.style.cursor = id ? (id === "mf-search" || id.startsWith("mf-field-") ? "text" : "pointer") : "default";
  if (app.setHover(id)) paint();
});

canvas.addEventListener("pointerleave", () => {
  if (app.setHover("")) paint();
});

canvas.addEventListener(
  "wheel",
  (ev) => {
    const [x, y] = at(ev);
    if (overPreview(x, y)) {
      ev.preventDefault();
      preview.wheel(x, y, ev);
      return;
    }
    if (app.wheel(x, y, ev.deltaY)) {
      ev.preventDefault();
      paint();
    }
  },
  { passive: false }
);

window.addEventListener("keydown", (ev) => {
  const t = ev.target;
  if (t && (t.tagName === "TEXTAREA" || t.tagName === "SELECT" || (t.tagName === "INPUT" && t !== textInput.element()))) return;
  if (textInput.isActive()) return;
  if (app.keyWith(ev.key, ev.shiftKey, ev.ctrlKey || ev.metaKey)) {
    ev.preventDefault();
    paint();
    syncTextSession();
  }
});

window.addEventListener("resize", resize);

// --- the code drawer --------------------------------------------------------------
const drawer = document.getElementById("code");
const pick = document.getElementById("code-app");
// The Ranger code editor, over the plain textarea it replaces once it loads.
const src = createCodeEditor({
  box: document.getElementById("code-editor"),
  fallback: document.getElementById("code-src"),
  onError: (e) => console.warn("code editor: the plain textarea stays —", e),
});
const fileName = (name) => `${(name || "extension").replace(/[^\w.]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "extension"}.js`;
const ver = document.getElementById("code-version");
const nameEl = document.getElementById("code-name");
const status = document.getElementById("code-status");

const TEMPLATE_V2 = `// UIX v2 — async. Enums (Event, MenuLocation, …) and MFGrpc are globals here.
function OnNewShellUI(shellUI) {
  shellUI.Events.Register(Event.NewNormalShellFrame, (shellFrame) => {
    shellFrame.Events.Register(Event.Started, async () => {
      const cmd = await shellFrame.Commands.CreateCustomCommand("My command");
      // Right-click an object for the context menu; the top pane puts it in the toolbar too.
      await shellFrame.Commands.AddCustomCommandToMenu(cmd, MenuLocation.MenuLocation_ContextMenu_Bottom, 1);
      await shellFrame.Commands.AddCustomCommandToMenu(cmd, MenuLocation.MenuLocation_TopPaneMenu, 1);
      await shellFrame.ShowToast("My application", "started — try \"My command\"", ToastType.ToastType_Info);
      shellFrame.Commands.Events.Register(Event.CustomCommand, async (id) => {
        if (id !== cmd) return;
        const sel = shellFrame.Listing.CurrentSelection.ObjectVersions;
        await shellFrame.ShowMessage("Selected: " + sel.map((o) => o.version_info.title).join(", "));
      });
    });
  });
}
`;
const TEMPLATE_V1 = `// UIX v1 — synchronous, COM-style. Switch the emulator to UIX v1 mode to run it.
function OnNewShellUI(shellUI) {
  shellUI.Events.Register(Event_NewNormalShellFrame, function (shellFrame) {
    shellFrame.Events.Register(Event_Started, function () {
      var cmd = shellFrame.Commands.CreateCustomCommand("My v1 command");
      shellFrame.Commands.AddCustomCommandToMenu(cmd, MenuLocation_ContextMenu_Bottom, 1);
      shellFrame.Commands.AddCustomCommandToMenu(cmd, MenuLocation_TopPaneMenu, 1);
      shellFrame.Commands.Events.Register(Event_CustomCommand, function (id) {
        if (id !== cmd) return;
        var sel = shellFrame.Listing.CurrentSelection.ObjectVersions;
        shellFrame.ShowMessage(sel.Count ? sel.Item(1).Title : "Nothing selected");
      });
    });
  });
}
`;

function fillPicker(selected) {
  pick.innerHTML = "";
  for (let i = 0; i < app.appCount(); i += 1) {
    const o = document.createElement("option");
    o.value = String(i);
    o.textContent = app.appName(i);
    pick.appendChild(o);
  }
  for (const [v, label] of [["new2", "+ New UIX v2 application"], ["new1", "+ New UIX v1 application"]]) {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = label;
    pick.appendChild(o);
  }
  pick.value = selected;
  showPicked();
}

function showPicked() {
  const v = pick.value;
  status.textContent = "";
  if (v === "new2" || v === "new1") {
    src.setValue("my-application.js", v === "new2" ? TEMPLATE_V2 : TEMPLATE_V1);
    ver.value = v === "new2" ? "2" : "1";
    nameEl.value = "My application";
    nameEl.disabled = false;
    return;
  }
  const i = Number(v);
  src.setValue(fileName(app.appName(i)), app.appSource(i));
  ver.value = String(app.appVersion(i));
  nameEl.value = app.appName(i);
  nameEl.disabled = true;
  status.textContent = app.appError(i);
}

pick.addEventListener("change", showPicked);
// The editor lives in the right pane's "Extension code" tab: the app reports
// the pane's content box, and the DOM editor is laid over exactly that box.
let codeWasOpen = false;
function placeCodePanel() {
  const r = JSON.parse(app.codeRectJson());
  if (!r) {
    drawer.classList.remove("open");
    codeWasOpen = false;
    return;
  }
  drawer.style.left = r.x + "px";
  drawer.style.top = r.y + "px";
  drawer.style.width = r.w + "px";
  drawer.style.height = r.h + "px";
  drawer.classList.add("open");
  if (!codeWasOpen) {
    codeWasOpen = true;
    fillPicker(pick.value && pick.value !== "" ? pick.value : "0");
  }
}
document.getElementById("code-close").addEventListener("click", () => {
  app.press("mf-ptab-_metadata");
  paint();
});
document.getElementById("code-run").addEventListener("click", () => {
  const v = pick.value;
  const version = Number(ver.value);
  let index;
  if (v === "new2" || v === "new1") {
    const guid = `{${crypto.randomUUID().toUpperCase()}}`;
    index = app.addExtension(nameEl.value || "My application", guid, version, src.value);
  } else {
    index = Number(v);
    app.updateExtension(index, version, src.value);
  }
  const error = app.appError(index);
  const running = !error && version === app.modeNow();
  app.host.shell.toast(app.appName(index), error ? error : running ? "loaded and started" : `loaded — switch to UIX v${version} mode to run it`, error ? 3 : running ? 1 : 2);
  paint();
  fillPicker(String(index));
  status.textContent = error || (running ? "running — its commands are in the toolbar and the context menu" : `loaded — switch the emulator to UIX v${version} mode to run it`);
});

// --- the clock -------------------------------------------------------------------
let last = performance.now();
function frame(now) {
  const dt = Math.min(now - last, 250);
  last = now;
  if (app.tick(dt)) paint();
  requestAnimationFrame(frame);
}

resize();
requestAnimationFrame(frame);
