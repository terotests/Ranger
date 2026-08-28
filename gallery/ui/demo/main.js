/**
 * The demo page.
 *
 * Every control rebuilds the tree: the page holds four plain values, hands them
 * to `MenubarDemo.displayListJson`, and paints whatever comes back. There is no
 * diff and nothing is patched — a tree literal builds, and building again is
 * how a change is shown.
 */

import { renderDisplayList } from "../../evg/gl/evg-webgl.js";
import { MenubarDemo } from "./generated-host.js";
import { MENUBAR_CSS } from "./generated.js";

const W = 1240;
const H = 560;

const CHECK_ITEMS = ["Always Show Bookmarks Bar", "Always Show Full URLs"];
const PROFILES = ["Andy", "Benoît", "Luis"];
const MENUS = ["File", "Edit", "View", "Profiles"];

const state = {
  open: "File",
  submenu: true,
  checked: ["Always Show Full URLs"],
  profile: "Luis",
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
    const list = JSON.parse(
      MenubarDemo.displayListJson(
        MENUBAR_CSS,
        state.checked,
        state.profile,
        state.open,
        state.submenu,
      ),
    );
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

paint();
