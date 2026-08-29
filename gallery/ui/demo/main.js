/**
 * The demo page.
 *
 * Every control rebuilds the tree: the page holds a handful of plain values,
 * hands them to whichever demo is selected, and paints whatever comes back.
 * There is no diff and nothing is patched — a tree literal builds, and building
 * again is how a change is shown.
 *
 * Three things come out of that one tree, and this file is mostly about keeping
 * them the same thing:
 *
 *   displayListJson()   what to draw
 *   hitId(x, y)         what is under the pointer — topmost, so a click inside
 *                       an open panel reaches the panel and not the trigger it
 *                       covers
 *   a11yJson()          what it MEANS, mirrored into real DOM over the canvas,
 *                       because a canvas hands a screen reader one empty
 *                       graphic no matter what was drawn into it
 *
 * A reader activating a mirrored node is answered by pressing the app at that
 * node's rectangle — the same path a mouse takes, so there is no second set of
 * commands to keep in step and a button that moved is still pressed where it
 * now is.
 */

import { renderDisplayList } from "../../evg/gl/evg-webgl.js";
import { createA11yMirror, pressAtCentre } from "../../evg/gl/evg-a11y.js";
import { MenubarDemo, ToolbarDemo, SortableDemo, MotionDemo } from "./generated-host.js";
// The whole modules too: `keptTree` needs EVGStyleSheet, EVGLayout and the
// rest out of the same bundle the tree was built by. Two copies of a class
// are two classes.
import * as MenubarModule from "../bin/MenubarDemo.cjs";
import * as ToolbarModule from "../bin/ToolbarDemo.cjs";
import * as SortableModule from "../bin/SortableDemo.cjs";
import { MENUBAR_CSS, TOOLBAR_CSS, SORTABLE_CSS, MOTION_CSS } from "./generated.js";

const W = 1240;

const CHECK_ITEMS = ["Always Show Bookmarks Bar", "Always Show Full URLs"];
const PROFILES = ["Andy", "Benoît", "Luis"];
const MENUS = ["File", "Edit", "View", "Profiles"];
const SUB_ROWS = { File: "row-Share", Edit: "row-Find" };
const SUB_SURFACE = { File: "menu-share-content", Edit: "menu-find-content" };

const SORTABLE_IDS = ["demo", "spec", "video", "audio", "extra"];

const state = {
  which: "menubar",
  // The sortable's whole state: an order, and what is being carried. There is
  // no move and no animation — the tree is rebuilt from this list, which is
  // the claim the rest of this directory makes about tree literals.
  order: SORTABLE_IDS.slice(),
  dragging: "",
  open: "File",
  submenu: true,
  // The bar at the bottom edge, where the menus have no room below their
  // triggers and the overlay pass flips them upwards.
  atBottom: false,
  checked: ["Always Show Full URLs"],
  profile: "Luis",
  bold: true,
  italic: false,
  underline: false,
  align: "center",
  // The app's focus, and the app's alone. The mirror never reports focus back:
  // a mirror that does gets into a loop with the app that is setting it.
  focus: "",
};


/**
 * A kept tree for a demo that otherwise rebuilds.
 *
 * The three original demos here rebuild on every change, and that is the claim
 * the directory makes: reordering is rebuilding. It is still true — but it made
 * them inert. A tree rebuilt between two frames has different ELEMENTS in it,
 * and hover is a flag on an element while a transition is a memory held by one.
 * So the demos had no hover colour, no press feedback and no motion at all, and
 * the page could not have given them any.
 *
 * The fix is to be precise about what "a change" is. DATA — the order, which
 * menu is open, whether the bar is at the bottom — is rebuilt, exactly as
 * before. HOVER IS NOT DATA. It is a presentational state the stylesheet owns,
 * so it sets a flag on the tree that is already there, and the transition
 * machinery has the identity it needs.
 *
 * `key` is what decides which of the two happened: a string of everything the
 * builder is handed except the stylesheet.
 */
function keptTree(mod, css, label, size) {
  const sheet = new mod.EVGStyleSheet();
  sheet.parse(css);
  const transitions = new mod.EVGTransition();
  let root = null;
  let key = null;
  let hovered = "";
  let pressed = "";

  // Hover and press are the element's own business, read off the one id under
  // the pointer. Nothing walks up the tree: a row is hovered, its label is not.
  const mark = (el) => {
    const own = el.id !== "";
    el.isHovered = own && el.id === hovered;
    el.isPressed = own && el.id === pressed;
    for (let i = 0; i < el.children.length; i++) mark(el.children[i]);
  };

  const laidOut = () => {
    sheet.setViewport(size[0], size[1], false);
    mark(root);
    sheet.applyTree(root, "");
    // The sheet has written what it WANTS; this leaves on the element what is
    // actually showing, which for a property in flight is neither end.
    transitions.reconcileTree(root);
    const lay = new mod.EVGLayout();
    lay.setPageSize(size[0], size[1]);
    lay.layout(root);
    return lay;
  };

  return {
    /** Rebuild only if the data changed. */
    sync(nextKey, build) {
      if (nextKey === key) return;
      key = nextKey;
      root = build();
    },
    setHover(id) {
      if (id === hovered) return false;
      hovered = id;
      return true;
    },
    setPressed(id) {
      pressed = id;
    },
    tick(dt) {
      transitions.advanceTree(root, dt);
      return transitions.busy(root);
    },
    busy: () => transitions.busy(root),
    list() {
      const lay = laidOut();
      const dl = new mod.EVGDisplayList();
      dl.setTextEngine(lay.getTextEngine());
      dl.build(root);
      return dl.toJson();
    },
    hit(x, y) {
      laidOut();
      return new mod.EVGHitTest().idAt(root, x, y);
    },
    a11y(gen, focus) {
      laidOut();
      return new mod.EVGA11yFromTree().build(root, label, gen, focus).toJson();
    },
  };
}

let generation = 0;

/**
 * The motion showcase, and the one demo on this page that does NOT rebuild.
 *
 * A transition is a property of an ELEMENT — it remembers where the colour was
 * when the pointer arrived. Rebuild the tree and that memory is gone, so every
 * transition would establish itself at its destination and nothing would ever
 * move. This host is therefore built once and kept, and the page only sets
 * flags on it. Everything else here still rebuilds, which is the claim the
 * other three demos exist to make.
 */
let lastHover = "";
const motion = new MotionDemo();
motion.init(MOTION_CSS);

// One kept tree per demo. The builders they are handed are the same static
// `page()` functions the PNG snapshots and the accessibility audit call, so
// there is one description of each demo and not two.
const HOSTS = {
  menubar: keptTree(MenubarModule, MENUBAR_CSS, "Menubar demo", [W, 560]),
  toolbar: keptTree(ToolbarModule, TOOLBAR_CSS, "Toolbar demo", [W, 320]),
  sortable: keptTree(SortableModule, SORTABLE_CSS, "Sortable demo", [W, 560]),
};

// Four demos, four factories, one page. Each one says how tall it is and
// answers the same three questions — what to draw, what is under the pointer,
// and what it all MEANS. Three of them answer by rebuilding their tree from
// `args()`; the motion showcase answers from a tree it keeps, because a
// transition cannot survive being rebuilt. Behind these thunks the difference
// stops mattering to the rest of the page.
const DEMOS = {
  menubar: {
    height: 560,
    args: () => [MENUBAR_CSS, state.checked, state.profile, state.open, state.submenu, state.atBottom],
    module: MenubarDemo,
    // Through the kept tree, so a hover does not rebuild and a
    // transition has something to remember.
    sync: () => HOSTS.menubar.sync(JSON.stringify([state.checked, state.profile, state.open, state.submenu, state.atBottom]), () => MenubarDemo.page(state.checked, state.profile, state.open, state.submenu, state.atBottom)),
    list: () => HOSTS.menubar.list(),
    hit: (x, y) => HOSTS.menubar.hit(x, y),
    a11y: (gen, focus) => HOSTS.menubar.a11y(gen, focus),
    host: () => HOSTS.menubar,
    animated: true,
    press: pressMenubar,
    hover: hoverMenubar,
    key: keyMenubar,
  },
  toolbar: {
    height: 320,
    args: () => [
      TOOLBAR_CSS, state.bold, state.italic, state.underline, state.align,
      "Edited 2 hours ago",
    ],
    module: ToolbarDemo,
    // Through the kept tree, so a hover does not rebuild and a
    // transition has something to remember.
    sync: () => HOSTS.toolbar.sync(JSON.stringify([state.bold, state.italic, state.underline, state.align, "Edited 2 hours ago"]), () => ToolbarDemo.page(state.bold, state.italic, state.underline, state.align, "Edited 2 hours ago")),
    list: () => HOSTS.toolbar.list(),
    hit: (x, y) => HOSTS.toolbar.hit(x, y),
    a11y: (gen, focus) => HOSTS.toolbar.a11y(gen, focus),
    host: () => HOSTS.toolbar,
    animated: true,
    press: pressToolbar,
    hover: () => false,
    key: () => false,
  },
  motion: {
    height: () => motion.heightPx(),
    // Persistent: the three thunks below go to the kept host rather than
    // rebuilding a tree from arguments.
    list: () => motion.displayListJson(),
    hit: (x, y) => motion.hitId(x, y),
    a11y: (gen, focus) => motion.a11yJson(gen, focus),
    press: () => false,
    hover: (id) => {
      if (id === lastHover) return false;
      lastHover = id;
      motion.setHover(id);
      return true;
    },
    key: () => false,
    // The only demo with a clock. `flip` is what the self-running panels
    // travel between; the page turns it over and the stylesheet does the rest.
    animated: true,
  },
  sortable: {
    height: 560,
    args: () => [SORTABLE_CSS, state.order, state.dragging],
    module: SortableDemo,
    // Through the kept tree, so a hover does not rebuild and a
    // transition has something to remember.
    sync: () => HOSTS.sortable.sync(JSON.stringify([state.order, state.dragging]), () => SortableDemo.page(state.order, state.dragging)),
    list: () => HOSTS.sortable.list(),
    hit: (x, y) => HOSTS.sortable.hit(x, y),
    a11y: (gen, focus) => HOSTS.sortable.a11y(gen, focus),
    host: () => HOSTS.sortable,
    animated: true,
    press: pressSortable,
    hover: () => false,
    key: keySortable,
    // The one demo with a gesture rather than a press: the pointer has to
    // travel before anything moves, exactly as it does in dnd-kit.
    drag: dragSortable,
    drop: dropSortable,
  },
};

// --- the sortable's gesture ---------------------------------------------------
// Reordering is `arrayMove`, not a swap: the item is taken out and put back at
// the new index, so dragging the first onto the third gives 2, 3, 1. A swap
// would give 3, 2, 1, and it is the first thing a hand-written sortable gets
// wrong.

function idOfRow(hit) {
  return hit && hit.startsWith("sr-row-") ? hit.slice("sr-row-".length) : "";
}

function arrayMove(list, from, to) {
  const out = list.slice();
  const [moved] = out.splice(from, 1);
  out.splice(to, 0, moved);
  return out;
}

function pressSortable(id) {
  const value = idOfRow(id);
  if (!value) return false;
  state.dragging = value;
  state.focus = id;
  return true;
}

function dragSortable(id) {
  const over = idOfRow(id);
  if (!over || !state.dragging || over === state.dragging) return false;
  const from = state.order.indexOf(state.dragging);
  const to = state.order.indexOf(over);
  if (from < 0 || to < 0) return false;
  state.order = arrayMove(state.order, from, to);
  return true;
}

function dropSortable() {
  if (!state.dragging) return false;
  state.dragging = "";
  return true;
}

// Space picks up and drops, arrows move, Escape puts it back — the same
// keyboard the conformance harness measures `SortableCtl` against.
function keySortable(key) {
  const focused = idOfRow(state.focus);
  if (!focused) return false;
  if (key === " " || key === "Enter") {
    state.dragging = state.dragging ? "" : focused;
    return true;
  }
  if (key === "Escape") {
    if (!state.dragging) return false;
    state.dragging = "";
    return true;
  }
  if (!state.dragging) return false;
  const step = key === "ArrowDown" ? 1 : key === "ArrowUp" ? -1 : 0;
  if (!step) return false;
  const at = state.order.indexOf(state.dragging);
  const next = at + step;
  if (next < 0 || next >= state.order.length) return false;
  state.order = arrayMove(state.order, at, next);
  return true;
}

const canvas = document.getElementById("c");
const stage = document.getElementById("stage");
const errEl = document.getElementById("err");

function demo() {
  return DEMOS[state.which];
}

function hitAt(x, y) {
  const d = demo();
  if (d.sync) d.sync();
  return d.hit(x, y);
}

// --- what a press means ------------------------------------------------------
// Each returns true when something changed, so a press on empty space does not
// repaint the page for nothing.

function pressMenubar(id) {
  for (const label of MENUS) {
    if (id === `trigger-${label}`) {
      state.open = state.open === label ? "" : label;
      state.focus = id;
      return true;
    }
  }
  // A row that opens a submenu toggles it, and nothing else about it is
  // special: it is a row in a menu that happens to have a menu beside it.
  if (id === SUB_ROWS[state.open]) {
    state.submenu = !state.submenu;
    state.focus = id;
    return true;
  }
  if (id.startsWith("row-")) {
    const label = id.slice(4);
    state.focus = id;
    if (label === "New Incognito Window") return true; // disabled: focus only
    if (CHECK_ITEMS.includes(label)) {
      state.checked = state.checked.includes(label)
        ? state.checked.filter((x) => x !== label)
        : state.checked.concat(label);
      return true;
    }
    if (PROFILES.includes(label)) {
      state.profile = label;
      return true;
    }
    // Any other row is a command. It has none, so it does what a menu does
    // after one: it closes.
    state.open = "";
    return true;
  }
  // Anywhere else — including the page behind the menu — closes.
  if (state.open) {
    state.open = "";
    return true;
  }
  return false;
}

function pressToolbar(id) {
  const toggles = { "tb-bold": "bold", "tb-italic": "italic", "tb-underline": "underline" };
  if (toggles[id]) {
    state[toggles[id]] = !state[toggles[id]];
    state.focus = id;
    return true;
  }
  if (id.startsWith("tb-align-")) {
    state.align = id.slice("tb-align-".length);
    state.focus = id;
    return true;
  }
  if (id === "share") {
    state.focus = id;
    return true;
  }
  return false;
}

// A submenu opens when the pointer is over the row that owns it and closes when
// it leaves both the row and the surface — the surface included, or crossing
// into it would close the thing you are reaching for.
function hoverMenubar(id) {
  const row = SUB_ROWS[state.open];
  if (!row) return false;
  const inside = id === row || isInside(id, SUB_SURFACE[state.open]);
  if (inside === state.submenu) return false;
  state.submenu = inside;
  return true;
}

function isInside(id, surfaceId) {
  if (!id || !surfaceId) return false;
  if (id === surfaceId) return true;
  // The rows of a submenu are its children in the accessible tree, which is the
  // same tree the picture came from — so "is this inside the submenu" is a
  // question the app can already answer without a second structure.
  const tree = lastTree;
  if (!tree) return false;
  let node = tree.byId.get(id);
  while (node) {
    if (node.id === surfaceId) return true;
    node = node.p ? tree.byId.get(node.p) : null;
  }
  return false;
}

// --- keys --------------------------------------------------------------------

function keyMenubar(key) {
  if (key === "Escape") {
    if (!state.open) return false;
    state.open = "";
    state.focus = "";
    return true;
  }
  if (key === "ArrowRight" || key === "ArrowLeft") {
    if (!state.open) return false;
    const i = MENUS.indexOf(state.open);
    const n = MENUS.length;
    state.open = MENUS[(i + (key === "ArrowRight" ? 1 : n - 1)) % n];
    state.focus = `trigger-${state.open}`;
    return true;
  }
  if (key === "ArrowDown" || key === "ArrowUp") {
    // Within an open menu, move the reader's cursor over the rows. The rows
    // are the focusable children of the open surface, in tree order.
    const rows = focusableRows();
    if (!rows.length) return false;
    const at = rows.indexOf(state.focus);
    const step = key === "ArrowDown" ? 1 : rows.length - 1;
    state.focus = rows[(at < 0 ? 0 : (at + step) % rows.length)];
    return true;
  }
  return false;
}

function focusableRows() {
  if (!lastTree) return [];
  const surface = `menu-${state.open.toLowerCase()}-content`;
  return lastTree.nodes
    .filter((n) => n.p === surface && n.focusable && !n.disabled)
    .map((n) => n.id);
}

// --- painting ----------------------------------------------------------------

let lastTree = null;
let mirror = null;

function press(x, y) {
  const id = hitAt(x, y);
  if (demo().press(id)) paint();
}

function paint() {
  try {
    errEl.textContent = "";
    const d = demo();
    if (d.sync) d.sync();
    const H = typeof d.height === "function" ? d.height() : d.height;
    const listJson = d.list();
    // The last frame's display list, for anything driving this page from
    // outside: a browser check needs the COLOUR a control was painted, and
    // only the list knows that. The playground exposes its host for the same
    // reason.
    window.__lastList = listJson;
    const list = JSON.parse(listJson);
    const doc = { width: W, height: H, list };
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    stage.style.width = W + "px";
    stage.style.height = H + "px";
    const gl = canvas.getContext("webgl2", {
      antialias: true,
      premultipliedAlpha: false,
      stencil: true,
      preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error("WebGL 2 is not available in this browser");
    document.fonts.ready.then(() =>
      Promise.all(
        doc.list.cmds
          .filter((c) => c.text)
          .map((c) => document.fonts.load(`${c.size}px "${c.font}"`)),
      ).then(() => renderDisplayList(gl, doc, { dpr })),
    );
    renderDisplayList(gl, doc, { dpr });

    // The same tree, said out loud. `gen` rises every paint so the mirror
    // knows the frame changed; it keeps its elements by id, which is why a
    // reader's cursor survives a repaint.
    generation += 1;
    const tree = JSON.parse(d.a11y(generation, state.focus));
    tree.byId = new Map(tree.nodes.map((n) => [n.id, n]));
    lastTree = tree;
    mirror.update(tree);
    syncControls();
  } catch (e) {
    errEl.textContent = String((e && e.stack) || e);
  }
}

// --- the page ----------------------------------------------------------------

function radios(host, name, values, get, set) {
  host.replaceChildren(
    ...values.map((v) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = name;
      input.value = v;
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
      input.value = v;
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

// The sidebar is a second view of the same state, so a click on the canvas has
// to move it too — otherwise the panel says "File" while the screen shows View.
function syncControls() {
  for (const input of document.querySelectorAll("#menus input")) {
    input.checked = input.value === state.open;
  }
  for (const input of document.querySelectorAll("#profiles input")) {
    input.checked = input.value === state.profile;
  }
  for (const input of document.querySelectorAll("#checks input")) {
    input.checked = state.checked.includes(input.value);
  }
  for (const input of document.querySelectorAll("#format input")) {
    input.checked = state[input.value];
  }
  for (const input of document.querySelectorAll("#align input")) {
    input.checked = input.value === state.align;
  }
  document.getElementById("submenu").checked = state.submenu;
  document.getElementById("atbottom").checked = state.atBottom;
  // The order, as a second view of the same state — the sidebar is where you
  // check that what you dragged is what the page now holds.
  document.getElementById("order").textContent = state.order.join(" → ");
}

function syncPanels() {
  for (const el of document.querySelectorAll("[data-for]")) {
    el.hidden = el.dataset.for !== state.which;
  }
}

radios(
  document.getElementById("demos"),
  "demo",
  ["menubar", "toolbar", "sortable", "motion"],
  () => state.which,
  (v) => {
    state.which = v;
    state.focus = "";
    syncPanels();
    syncMotionClock();
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
document.getElementById("atbottom").addEventListener("change", (e) => {
  state.atBottom = e.target.checked;
  paint();
});

// --- input -------------------------------------------------------------------

// The canvas is where the picture is, so the canvas is where a press lands.
// `offsetX/offsetY` are already in the page's own coordinates because the
// canvas is laid out at exactly the size the display list was built for.
/**
 * What the pointer is standing on, said by the cursor.
 *
 * A canvas has one cursor for the whole surface, so the page has to change it
 * by hand — and without that a button in here looked exactly like the
 * background, which is the first thing that makes a canvas UI feel like a
 * picture rather than an interface. `activate` is the accessible tree's own
 * word for "this can be pressed", so there is no second list of what counts.
 */
function setCursor(id) {
  const node = id && lastTree && lastTree.byId && lastTree.byId.get(id);
  canvas.style.cursor = node && node.activate ? "pointer" : "default";
}

let held = false;
canvas.addEventListener("pointerdown", (ev) => {
  ev.preventDefault();
  const d = demo();
  const h = d.host && d.host();
  if (h) h.setPressed(hitAt(ev.offsetX, ev.offsetY));
  if (d.drag) {
    // A demo with a gesture: the press picks up, the move carries, the release
    // puts down. Nothing happens on a press that never travels.
    held = d.press(hitAt(ev.offsetX, ev.offsetY));
    if (held) {
      canvas.setPointerCapture(ev.pointerId);
      paint();
    }
    return;
  }
  press(ev.offsetX, ev.offsetY);
});
canvas.addEventListener("pointermove", (ev) => {
  const d = demo();
  const id = hitAt(ev.offsetX, ev.offsetY);
  setCursor(id);
  if (held && d.drag) {
    if (d.drag(id)) paint();
    return;
  }
  // Two different things, and both have to happen. `d.hover` is the demo's own
  // BEHAVIOUR — hovering Share opens the submenu — and `setHover` is the
  // presentational flag the stylesheet reads. A demo with no hover behaviour
  // still gets the second one, which is why the toolbar and the sortable now
  // light up at all.
  let changed = d.hover(id);
  const h = d.host && d.host();
  if (h && h.setHover(id)) changed = true;
  if (changed) {
    paint();
    // A hover starts a transition, and a transition needs frames.
    if (d.animated) animate();
  }
});
canvas.addEventListener("pointerup", () => {
  const d = demo();
  const h = d.host && d.host();
  if (h) {
    h.setPressed("");
    paint();
    if (d.animated) animate();
  }
  if (!held || !d.drop) return;
  held = false;
  if (d.drop()) paint();
});
canvas.addEventListener("pointerleave", () => {
  const d = demo();
  setCursor("");
  let changed = d.hover("");
  const h = d.host && d.host();
  if (h && h.setHover("")) changed = true;
  if (changed) {
    paint();
    if (d.animated) animate();
  }
});
// Keys are the window's: the canvas is not focusable, and the mirror element
// that has the focus is inside this page.
window.addEventListener("keydown", (ev) => {
  if (ev.target instanceof HTMLInputElement) return;
  if (demo().key(ev.key)) {
    ev.preventDefault();
    paint();
  }
});

mirror = createA11yMirror(stage, {
  canvas,
  label: "Ranger tree literal demos",
  // A reader pressed something: press the app in the middle of the rectangle
  // the reader was given. Not a table from node ids to commands — there is
  // nothing to keep in step, and the rectangle is the one that was drawn.
  onActivate: (node) => pressAtCentre(node, press),
});

// --- the motion showcase's clock ---------------------------------------------
//
// Two loops, and they are different things.
//
// `animate` is the frame loop: while anything is in flight it advances the
// engine by the REAL elapsed time and repaints, and it stops the moment
// nothing is moving. Handing it the real dt rather than a fixed step is what
// makes a dropped frame shorten the animation instead of stretching it.
//
// `flip` is the demonstration itself: the self-running panels travel between
// two ends, so something has to turn the page over. It is a theme change and
// nothing else — no element gains or loses a class.
let animating = 0;
let flipTimer = 0;

/** Whatever the selected demo keeps a clock for. */
function clockOf() {
  const d = demo();
  if (d.host) return d.host();
  return { tick: (dt) => motion.tick(dt), busy: () => motion.busyNow() };
}

function animate() {
  if (animating) return;
  const clock = clockOf();
  let last = performance.now();
  const step = () => {
    const now = performance.now();
    const dt = now - last;
    last = now;
    clock.tick(dt);
    paint();
    animating = clock.busy() ? requestAnimationFrame(step) : 0;
  };
  animating = requestAnimationFrame(step);
}

function startFlipping() {
  stopFlipping();
  // Long enough for the slowest row (900ms plus the 360ms delay) to arrive and
  // be looked at before it leaves again.
  flipTimer = setInterval(() => {
    motion.setFlipped(!motion.isFlipped());
    paint();
    animate();
  }, 1700);
}

function stopFlipping() {
  if (flipTimer) clearInterval(flipTimer);
  flipTimer = 0;
  if (animating) cancelAnimationFrame(animating);
  animating = 0;
}

function syncMotionClock() {
  if (state.which === "motion") startFlipping();
  else stopFlipping();
}

syncPanels();
syncMotionClock();
paint();
