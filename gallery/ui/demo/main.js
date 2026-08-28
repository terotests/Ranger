/**
 * The demo page.
 *
 * Every control rebuilds the tree: the page holds a handful of plain values,
 * hands them to whichever demo is selected, and paints whatever comes back.
 * There is no diff and nothing is patched — a tree literal builds, and building
 * again is how a change is shown.
 */

import { renderDisplayList } from "../../evg/gl/evg-webgl.js";
import { MenubarDemo, ToolbarDemo } from "./generated-host.js";
import { MENUBAR_CSS, TOOLBAR_CSS } from "./generated.js";

const W = 1240;

const CHECK_ITEMS = ["Always Show Bookmarks Bar", "Always Show Full URLs"];
const PROFILES = ["Andy", "Benoît", "Luis"];
const MENUS = ["File", "Edit", "View", "Profiles"];

const state = {
  which: "menubar",
  open: "File",
  submenu: true,
  checked: ["Always Show Full URLs"],
  profile: "Luis",
  bold: true,
  italic: false,
  underline: false,
  align: "center",
};

// Two demos, two factories, one page. Each one only has to say how tall it is
// and how to ask Ranger for its display list; the painting below is the same.
const DEMOS = {
  menubar: {
    height: 560,
    list: () =>
      MenubarDemo.displayListJson(
        MENUBAR_CSS, state.checked, state.profile, state.open, state.submenu,
      ),
  },
  toolbar: {
    height: 320,
    list: () =>
      ToolbarDemo.displayListJson(
        TOOLBAR_CSS, state.bold, state.italic, state.underline, state.align,
        "Edited 2 hours ago",
      ),
  },
};

const canvas = document.getElementById("c");
const errEl = document.getElementById("err");

function radios(host, name, values, get, set) {
  host.replaceChildren(
    ...values.map((v) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = name;
      input.checked = get() === v;
      input.addEventListener("change", () => {
        set(v);
        paint();
      });
      label.append(input, document.createTextNode(v));
      return label;
    }),
  );
}

function boxes(host, values, has, toggle) {
  host.replaceChildren(
    ...values.map((v) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = has(v);
      input.addEventListener("change", () => {
        toggle(v);
        paint();
      });
      label.append(input, document.createTextNode(v));
      return label;
    }),
  );
}

async function paint() {
  try {
    errEl.textContent = "";
    // Ranger builds the tree, styles it, lays it out and returns the commands.
    const demo = DEMOS[state.which];
    const H = demo.height;
    const list = JSON.parse(demo.list());
    const doc = { width: W, height: H, list };
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const gl = canvas.getContext("webgl2", {
      antialias: true,
      premultipliedAlpha: false,
      stencil: true,
      preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error("WebGL 2 is not available in this browser");
    await document.fonts.ready;
    await Promise.all(
      doc.list.cmds
        .filter((c) => c.text)
        .map((c) => document.fonts.load(`${c.size}px "${c.font}"`)),
    );
    renderDisplayList(gl, doc, { dpr });
  } catch (e) {
    errEl.textContent = String((e && e.stack) || e);
  }
}

function syncPanels() {
  for (const el of document.querySelectorAll("[data-for]")) {
    el.hidden = el.dataset.for !== state.which;
  }
}

radios(
  document.getElementById("demos"),
  "demo",
  ["menubar", "toolbar"],
  () => state.which,
  (v) => {
    state.which = v;
    syncPanels();
  },
);
boxes(
  document.getElementById("format"),
  ["bold", "italic", "underline"],
  (v) => state[v],
  (v) => {
    state[v] = !state[v];
  },
);
radios(
  document.getElementById("align"),
  "align",
  ["left", "center", "right"],
  () => state.align,
  (v) => {
    state.align = v;
  },
);
radios(
  document.getElementById("menus"),
  "menu",
  MENUS,
  () => state.open,
  (v) => {
    state.open = v;
  },
);
radios(
  document.getElementById("profiles"),
  "profile",
  PROFILES,
  () => state.profile,
  (v) => {
    state.profile = v;
  },
);
boxes(
  document.getElementById("checks"),
  CHECK_ITEMS,
  (v) => state.checked.includes(v),
  (v) => {
    state.checked = state.checked.includes(v)
      ? state.checked.filter((x) => x !== v)
      : state.checked.concat(v);
  },
);
document.getElementById("submenu").addEventListener("change", (e) => {
  state.submenu = e.target.checked;
  paint();
});

syncPanels();
paint();
