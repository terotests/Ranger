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
import { MenubarDemo, ToolbarDemo, SortableDemo, MotionDemo, TableDemo, DropdownDemo, DialogDemo, TreeDemo } from "./generated-host.js";
// The whole modules too: `keptTree` needs EVGStyleSheet, EVGLayout and the
// rest out of the same bundle the tree was built by. Two copies of a class
// are two classes.
import * as MenubarModule from "../bin/MenubarDemo.cjs";
import * as ToolbarModule from "../bin/ToolbarDemo.cjs";
import * as SortableModule from "../bin/SortableDemo.cjs";
import { MENUBAR_CSS, TOOLBAR_CSS, SORTABLE_CSS, MOTION_CSS, TABLE_CSS, DROPDOWN_CSS, DIALOG_CSS, TREE_CSS } from "./generated.js";

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
  // Where the carried row would land if the pointer let go now, and where its
  // floating copy currently is. The ORDER is not touched until the drop — see
  // `dragSortable`.
  over: "",
  previewX: 0,
  previewY: 0,
  // Only a POINTER drag floats a copy. A keyboard pick-up moves the row with
  // the arrow keys and never leaves the list, so there is nothing following
  // anything and a preview would be a lie about where the row is.
  floating: false,
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
  // A row asked for by a key press that has not been built yet — see
  // `settlePendingRow`.
  pendingRow: "",
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

  // Kept across frames, so a frame that changes nothing geometric can reuse
  // the positions rather than recompute them. There is no "is this the same
  // tree" check: a freshly built tree has no element the sheet has written to
  // and a reconciled one has had every element overwritten, so either reports
  // itself layout-dirty and lays out without being asked.
  let lay = null;

  const laidOut = () => {
    sheet.setViewport(size[0], size[1], false);
    mark(root);
    sheet.applyTree(root, "");
    // The sheet has written what it WANTS; this leaves on the element what is
    // actually showing, which for a property in flight is neither end.
    transitions.reconcileTree(root);
    if (!lay) {
      lay = new mod.EVGLayout();
      lay.setPageSize(size[0], size[1]);
      lay.layout(root);
      return lay;
    }
    // The invalidation decision. `layoutClean()` is true when nothing the
    // sheet wrote this pass can have moved a box — a hover that changes a
    // colour, a transform, an opacity. On a large page that is most of the
    // frame; see gallery/evg/EVGInvalidateTest.rgr for what it is allowed to
    // mean and the one thing it cannot see (a bare `textContent` edit, which
    // nothing here does: text comes from a rebuild).
    if (!sheet.layoutClean()) lay.layout(root);
    return lay;
  };

  const reconciler = new mod.EVGReconcile();

  return {
    /** Rebuild only if the data changed. */
    sync(nextKey, build) {
      if (nextKey === key) return;
      key = nextKey;
      root = build();
    },
    /**
     * Rebuild EVERY time, and keep the elements.
     *
     * `sync` above is the old answer to a problem that has a real one now: a
     * tree built from scratch has different elements in every position, so
     * anything an element remembers — a flight, most of all — is gone, and the
     * only way to keep it was to not rebuild. `EVGReconcile` matches the new
     * children against the live ones by key and moves the elements instead of
     * replacing them, so a rebuild is once again the way to say what changed.
     *
     * The first call has nothing to reconcile against and simply takes the
     * tree.
     */
    rebuild(build) {
      const next = build();
      if (!root) {
        root = next;
        return;
      }
      reconciler.resetStats();
      reconciler.reconcile(root, next);
    },
    /** How the last rebuild went, for a page that wants to prove it works. */
    reconcileStats: () => reconciler.stats,
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
    /**
     * The kept tree itself, for the one thing a rebuild cannot express: a
     * value that changes on every pointer move. Putting it in the sync key
     * rebuilds the tree sixty times a second, and then NOTHING on the page can
     * animate — every element is new every frame, so every flight establishes
     * at its destination. Measured before it was believed: the rows making
     * room for a dragged item were at their final positions 40ms after the
     * pointer crossed, having travelled through nothing.
     */
    root: () => root,
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
let lastTableHover = "";
const motion = new MotionDemo();
motion.init(MOTION_CSS);

/**
 * The table, and the second demo here that keeps its tree.
 *
 * A PRESS changes the data and rebuilds; the pointer moving does not, so it
 * only sets a flag. That is the same split `keptTree` makes for the other
 * three, and the reason both of them can animate at all.
 *
 * Its state is `TableCtl`'s — the controller the conformance harness measures
 * against TanStack — so the demo owns the look and nothing else. Writing the
 * sort cycle again here would be writing an untested second copy of the only
 * hard part of a table.
 */
const table = new TableDemo();
table.init(TABLE_CSS);

/**
 * The dropdown menu, and the third demo here that keeps its tree.
 *
 * The one whose state is not its own AT ALL. `MenuCtl` — the controller the
 * conformance harness measures against @radix-ui/react-dropdown-menu — owns
 * open/closed, the roving focus, the submenu stack and every key; this file
 * routes the pointer and the keyboard into it and paints what it says. So the
 * demo's keyboard is not a demo keyboard: it is the measured one, and the
 * menubar demo above it (which has its own, written by hand and matched
 * against nothing) is the counter-example this exists to retire.
 *
 * It is also the first demo with a clock the CONTROLLER owns: a submenu opens
 * 100ms after the pointer settles on its row, so `tick` has to keep running
 * while that wait is outstanding even though nothing is moving on screen.
 */
const dropdown = new DropdownDemo();
dropdown.init(DROPDOWN_CSS);
let lastDropdownHover = "";

/**
 * The dialog and the window — the same class twice, with one flag different.
 *
 * This is the demo with a gesture the others do not have: the window's title
 * bar is DRAGGED, and a drag is not a click. The pointer handlers below ask
 * the controller whether a press starts one, and while it has, every move is
 * a delta rather than a position — which is what lets the window be picked up
 * anywhere along its bar and not jump.
 *
 * Both windows start open, because a page whose demo is two closed triggers
 * shows nothing.
 */
const dialog = new DialogDemo();
dialog.init(DIALOG_CSS);
dialog.openWindow();
dialog.openModal();
let lastDialogHover = "";
// Where the pointer was when the drag began, in page pixels. The controller
// only ever hears "this much further", so the subtracting happens here.
let dialogDragAt = null;

/**
 * The tree. Every arrow, Home, End, Enter and Space on this page is answered
 * by `TreeCtl` — the same controller three conformance specs run against — so
 * the demo owns the look and not one rule of the behaviour.
 */
const treeview = new TreeDemo();
treeview.init(TREE_CSS);
let lastTreeHover = "";

// One kept tree per demo. The builders they are handed are the same static
// `page()` functions the PNG snapshots and the accessibility audit call, so
// there is one description of each demo and not two.
const HOSTS = {
  menubar: keptTree(MenubarModule, MENUBAR_CSS, "Menubar demo", [W, 560]),
  toolbar: keptTree(ToolbarModule, TOOLBAR_CSS, "Toolbar demo", [W, 320]),
  sortable: keptTree(SortableModule, SORTABLE_CSS, "Sortable demo", [W, 560]),
};

// Six demos, six factories, one page. Each one says how tall it is and
// answers the same three questions — what to draw, what is under the pointer,
// and what it all MEANS. Three of them answer by rebuilding their tree from
// `args()`; the motion showcase, the table and the dropdown answer from a tree
// they keep, because a transition cannot survive being rebuilt. Behind these
// thunks the difference stops mattering to the rest of the page.
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
  table: {
    height: () => table.heightPx(),
    list: () => table.displayListJson(),
    hit: (x, y) => table.hit ? table.hit(x, y) : table.hitId(x, y),
    a11y: (gen, focus) => table.a11yJson(gen, focus),
    press: (id) => table.press(id),
    hover: (id) => {
      if (id === lastTableHover) return false;
      lastTableHover = id;
      table.setHover(id);
      return true;
    },
    key: () => false,
    host: () => ({
      tick: (dt) => table.tick(dt),
      busy: () => table.busyNow(),
      setHover: (id) => {
        if (id === lastTableHover) return false;
        lastTableHover = id;
        table.setHover(id);
        return true;
      },
      setPressed: (id) => table.setPressed(id),
      root: () => null,
    }),
    animated: true,
  },

  dropdown: {
    height: () => dropdown.heightPx(),
    list: () => dropdown.displayListJson(),
    hit: (x, y) => dropdown.hitId(x, y),
    a11y: (gen, focus) => dropdown.a11yJson(gen, focus),
    press: (id) => dropdown.press(id),
    hover: (id) => {
      if (id === lastDropdownHover) return false;
      lastDropdownHover = id;
      dropdown.setHover(id);
      return true;
    },
    // Straight through to MenuCtl. Every arrow, Enter and Escape on this demo
    // is answered by the controller five conformance specs are run against —
    // which is the whole point of the demo owning no state.
    key: (k) => dropdown.key(k),
    host: () => ({
      tick: (dt) => dropdown.tick(dt),
      busy: () => dropdown.busyNow(),
      setHover: (id) => {
        if (id === lastDropdownHover) return false;
        lastDropdownHover = id;
        dropdown.setHover(id);
        return true;
      },
      setPressed: (id) => dropdown.setPressed(id),
      root: () => null,
    }),
    animated: true,
  },

  tree: {
    height: () => treeview.heightPx(),
    list: () => treeview.displayListJson(),
    hit: (x, y) => treeview.hitId(x, y),
    a11y: (gen, focus) => treeview.a11yJson(gen, focus),
    press: (id) => treeview.press(id),
    hover: (id) => {
      if (id === lastTreeHover) return false;
      lastTreeHover = id;
      treeview.setHover(id);
      return true;
    },
    // Straight through to TreeCtl, like the dropdown's.
    key: (k) => treeview.key(k),
    host: () => ({
      tick: (dt) => treeview.tick(dt),
      busy: () => treeview.busyNow(),
      setHover: (id) => {
        if (id === lastTreeHover) return false;
        lastTreeHover = id;
        treeview.setHover(id);
        return true;
      },
      setPressed: (id) => treeview.setPressed(id),
      root: () => null,
    }),
    animated: true,
  },

  dialog: {
    height: () => dialog.heightPx(),
    list: () => dialog.displayListJson(),
    hit: (x, y) => dialog.hitId(x, y),
    a11y: (gen, focus) => dialog.a11yJson(gen, focus),
    // The page's gesture protocol: `press` picks something up and says so,
    // `drag` carries it, `drop` puts it down. The sortable uses the same three.
    //
    // A press that is NOT the window's title bar has to do the ordinary thing
    // instead, and do it here: once a demo has a `drag`, the page stops calling
    // its plain click path and this is the only handler a button will get.
    press: (id) => {
      if (dialog.beginDrag(id)) {
        // `grabPointer` is set by the pointerdown handler just before this
        // runs, so the press point is already recorded and needs no argument.
        dialogDragAt = { x: grabPointer.x, y: grabPointer.y };
        return true;
      }
      dialog.press(id);
      return false;
    },
    // Deltas, not positions. The controller never learns where it was picked
    // up, so a window grabbed by the right end of its bar does not jump left.
    drag: (id, ev) => {
      if (!dialogDragAt) return false;
      dialog.dragBy(ev.offsetX - dialogDragAt.x, ev.offsetY - dialogDragAt.y);
      dialogDragAt = { x: ev.offsetX, y: ev.offsetY };
      return true;
    },
    drop: () => {
      dialogDragAt = null;
      dialog.endDrag();
      return true;
    },
    hover: (id) => {
      if (id === lastDialogHover) return false;
      lastDialogHover = id;
      dialog.setHover(id);
      return true;
    },
    key: (k) => dialog.key(k),
    host: () => ({
      tick: (dt) => dialog.tick(dt),
      busy: () => dialog.busyNow(),
      setHover: (id) => {
        if (id === lastDialogHover) return false;
        lastDialogHover = id;
        dialog.setHover(id);
        return true;
      },
      setPressed: (id) => dialog.setPressed(id),
      root: () => null,
    }),
    animated: true,
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
    // Rebuilt from the whole state on every frame of a drag, target and
    // preview position included, and reconciled into the live tree.
    //
    // This is the one place in the gallery where the declarative claim is
    // actually being made at 60Hz. It used to be three things: a `sync` whose
    // key deliberately left out the target and the preview position, a
    // hand-written `applyShift` that re-aimed the existing rows, and a
    // `movePreview` that reached in and set two attributes. All three existed
    // because a rebuilt row was a NEW row with no flight, so the gap appeared
    // instead of opening. With keys it is one call.
    sync: () => {
      HOSTS.sortable.rebuild(() =>
        SortableDemo.dragPage(
          state.order,
          state.dragging,
          state.over,
          state.previewX,
          state.previewY,
          state.floating,
        ),
      );
    },
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

/**
 * Put the floating copy under the pointer, by mutating the element rather than
 * rebuilding the tree around it.
 *
 * It is found by its class and not by an id, because it deliberately has none:
 * hit testing scans the display list backwards, and an id here would put the
 * preview under the cursor so the row beneath it could never be found. The
 * preview is a picture; the list is what answers.
 */
// Handles for a browser check driving this page from outside; the playground
// exposes its host for the same reason. A drag and a keyboard walk are both
// things whose CORRECTNESS is a sequence of internal states, and reading them
// off the pixels would test the screenshot rather than the behaviour.
window.__sortRoot = () => HOSTS.sortable.root();
window.__sortState = () => ({ dragging: state.dragging, over: state.over, order: state.order });
window.__mbState = () => ({ open: state.open, focus: state.focus, which: state.which });
// The dropdown's state is MenuCtl's, so this reads the controller rather than
// the page: what is open, where focus is, and how deep the submenu stack goes.
window.__dlgState = () => ({
  summary: dialog.summary(),
  dragging: dialog.isDragging(),
});
window.__ddState = () => ({
  open: dropdown.model.open,
  focus: dropdown.focused,
  depth: dropdown.model.openPath.length,
  status: dropdown.status,
  theme: dropdown.theme,
});

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

// Where the row was when it was picked up, and where the pointer was. The
// preview's position is the first plus how far the second has travelled — so
// the row stays exactly under the part of it that was grabbed, rather than
// jumping its own centre to the cursor.
let grab = null;
let grabPointer = { x: 0, y: 0 };

function pressSortable(id) {
  const value = idOfRow(id);
  if (!value) return false;
  state.dragging = value;
  state.over = value;
  state.floating = true;
  state.focus = id;
  // `left`/`top` are measured from the PARENT's content box, and the preview's
  // parent is the padded page — so a page-absolute rectangle put it forty
  // pixels down and right of the row it is a copy of. The list's own corner is
  // that content origin, so subtracting it needs no knowledge of the padding.
  const node = lastTree && lastTree.byId && lastTree.byId.get(id);
  const list = lastTree && lastTree.byId && lastTree.byId.get("sr-list");
  if (node && node.b && list && list.b) {
    grab = { x: node.b[0] - list.b[0], y: node.b[1] - list.b[1] };
    state.previewX = grab.x;
    state.previewY = grab.y;
  }
  return true;
}

/**
 * A pointer move during a drag.
 *
 * The ORDER IS NOT TOUCHED. That is the change, and it is what dnd-kit does:
 * reordering live means rebuilding the list on every move, and the rows then
 * teleport into their new places with nothing to watch. Instead the target is
 * recorded, the rows between here and there are shifted a place by the
 * stylesheet, and the array is rearranged once, on the drop.
 */
function dragSortable(id, ev) {
  let changed = false;
  if (grab && ev) {
    const px = grab.x + (ev.offsetX - grabPointer.x);
    const py = grab.y + (ev.offsetY - grabPointer.y);
    if (px !== state.previewX || py !== state.previewY) {
      state.previewX = px;
      state.previewY = py;
      changed = true;
    }
  }
  const over = idOfRow(id);
  if (over && state.dragging && over !== state.over) {
    state.over = over;
    changed = true;
  }
  return changed;
}

function dropSortable() {
  if (!state.dragging) return false;
  const from = state.order.indexOf(state.dragging);
  const to = state.order.indexOf(state.over);
  // One `arrayMove`, at the end. The rows are already sitting where this puts
  // them, so the swap is invisible — which is the point of having shifted them.
  if (from >= 0 && to >= 0 && from !== to) state.order = arrayMove(state.order, from, to);
  state.dragging = "";
  state.over = "";
  state.floating = false;
  grab = null;
  return true;
}

// Space picks up and drops, arrows move, Escape puts it back — the same
// keyboard the conformance harness measures `SortableCtl` against.
function keySortable(key) {
  const focused = idOfRow(state.focus);
  if (!focused) return false;
  if (key === " " || key === "Enter") {
    state.dragging = state.dragging ? "" : focused;
    state.floating = false;
    state.over = "";
    return true;
  }
  if (key === "Escape") {
    if (!state.dragging) return false;
    state.dragging = "";
    state.floating = false;
    state.over = "";
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

/**
 * The menubar keyboard, as WAI-ARIA's menubar pattern describes it.
 *
 * What was here handled two of the eight keys and gave up. The hole that
 * mattered was that every branch began `if (!state.open) return false` — so
 * pressing Escape, or arriving with nothing open, left the component
 * completely dead to the keyboard. A pointer user would never find it; a
 * keyboard user finds nothing else.
 *
 * The pattern in full:
 *
 *   ON THE BAR       Left/Right walk the triggers and wrap. They only OPEN a
 *                    menu if one was already open, which is what lets you look
 *                    along the bar without pulling menus down.
 *                    Down opens and lands on the first row, Up on the last.
 *                    Enter and Space open and land on the first.
 *                    Home/End jump to the ends of the bar.
 *
 *   IN A MENU        Up/Down walk the rows and wrap, skipping the disabled
 *                    ones — a row you cannot use is a row the cursor should
 *                    not stop on.
 *                    Right opens a submenu when the row has one, and otherwise
 *                    moves to the next menu. Left closes a submenu and returns
 *                    to the row that owns it, and otherwise moves to the
 *                    previous menu. That double meaning is the pattern's, and
 *                    it is why Right on `Share` used to jump to Edit.
 *                    Home/End jump to the ends of the menu.
 *                    Enter and Space do what a click does.
 *                    Escape closes one level and puts focus back where it came
 *                    from, which is the part that makes it recoverable.
 */
function rowsIn(surface) {
  if (!lastTree || !surface) return [];
  return lastTree.nodes
    .filter((n) => n.p === surface && n.focusable && !n.disabled)
    .map((n) => n.id);
}

const menuSurface = (label) => `menu-${String(label).toLowerCase()}-content`;

function focusableRows() {
  return rowsIn(menuSurface(state.open));
}

/** Is the keyboard inside the open menu's submenu? */
function inSubmenu() {
  const sub = SUB_SURFACE[state.open];
  return !!sub && state.submenu && rowsIn(sub).includes(state.focus);
}

/** The rows the cursor is currently walking: a submenu's, or the menu's. */
function currentRows() {
  return inSubmenu() ? rowsIn(SUB_SURFACE[state.open]) : focusableRows();
}

function keyMenubar(key) {
  // An empty focus means "on the bar", which is where a Tab into the component
  // lands and where the page starts. Normalising here rather than at load
  // matters: writing a focus into the state before the user has pressed
  // anything would take the browser's focus off whatever they were on.
  const focus = state.focus || `trigger-${state.open || MENUS[0]}`;
  const onTrigger = focus.startsWith("trigger-");
  const label = onTrigger ? focus.slice("trigger-".length) : state.open;
  const at = Math.max(0, MENUS.indexOf(label));

  const goToTrigger = (i) => {
    const next = MENUS[(i + MENUS.length) % MENUS.length];
    // Only follow with the menu if one was already down. Walking the bar with
    // everything closed should not start opening things.
    if (state.open) state.open = next;
    state.focus = `trigger-${next}`;
    return true;
  };

  const openMenu = (name, which) => {
    state.open = name;
    state.submenu = false;
    const rows = rowsIn(menuSurface(name));
    // The tree for a menu that is not open yet has no rows in it, so the
    // landing place is decided on the next frame instead. Focusing the trigger
    // is not a fallback nobody sees: it is where a menu opened by a pointer
    // leaves the cursor too.
    state.focus = rows.length
      ? rows[which === "last" ? rows.length - 1 : 0]
      : `trigger-${name}`;
    state.pendingRow = rows.length ? "" : which || "first";
    return true;
  };

  if (key === "Escape") {
    if (inSubmenu()) {
      state.submenu = false;
      state.focus = SUB_ROWS[state.open] || `trigger-${state.open}`;
      return true;
    }
    if (state.open) {
      state.focus = `trigger-${state.open}`;
      state.open = "";
      return true;
    }
    return false;
  }

  if (key === "Enter" || key === " ") {
    if (onTrigger) return openMenu(label, "first");
    return pressMenubar(state.focus);
  }

  if (key === "Home" || key === "End") {
    if (onTrigger) return goToTrigger(key === "Home" ? 0 : MENUS.length - 1);
    const rows = currentRows();
    if (!rows.length) return false;
    state.focus = key === "Home" ? rows[0] : rows[rows.length - 1];
    return true;
  }

  if (key === "ArrowDown" || key === "ArrowUp") {
    if (onTrigger) return openMenu(label, key === "ArrowDown" ? "first" : "last");
    const rows = currentRows();
    if (!rows.length) return false;
    const i = rows.indexOf(state.focus);
    const step = key === "ArrowDown" ? 1 : rows.length - 1;
    state.focus = rows[(i < 0 ? 0 : (i + step) % rows.length)];
    return true;
  }

  if (key === "ArrowRight") {
    // A row that owns a submenu opens it rather than leaving the menu. This is
    // the case that used to jump to the next menu instead.
    if (!onTrigger && state.focus === SUB_ROWS[state.open]) {
      state.submenu = true;
      const rows = rowsIn(SUB_SURFACE[state.open]);
      if (rows.length) state.focus = rows[0];
      else state.pendingRow = "first";
      return true;
    }
    return goToTrigger(at + 1);
  }

  if (key === "ArrowLeft") {
    if (inSubmenu()) {
      state.submenu = false;
      state.focus = SUB_ROWS[state.open] || `trigger-${state.open}`;
      return true;
    }
    return goToTrigger(at - 1);
  }

  return false;
}

/**
 * Land on the row a key asked for once the tree that holds it exists.
 *
 * Opening a menu and choosing a row inside it are one keystroke but two
 * frames: the rows are read off the accessible tree, and the tree for a menu
 * that was closed a moment ago has none. So the request is remembered and
 * settled after the paint that built them.
 */
function settlePendingRow() {
  if (!state.pendingRow || state.which !== "menubar") return false;
  const rows = state.submenu && SUB_SURFACE[state.open]
    ? rowsIn(SUB_SURFACE[state.open])
    : focusableRows();
  if (!rows.length) return false;
  state.focus = state.pendingRow === "last" ? rows[rows.length - 1] : rows[0];
  state.pendingRow = "";
  return true;
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
  ["menubar", "toolbar", "sortable", "table", "tree", "dropdown", "dialog", "motion"],
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
    grabPointer = { x: ev.offsetX, y: ev.offsetY };
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
    if (d.drag(id, ev)) {
      paint();
      // The gap opening is a transition like any other, and a transition needs
      // FRAMES. This branch returns early, so without this the flights were
      // started and never advanced: the classes were right, the rules were
      // right, and every row sat at zero progress for the whole drag.
      if (d.animated) animate();
    }
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
  if (!demo().key(ev.key)) return;
  ev.preventDefault();
  paint();
  // A key that opened a menu asked for a row inside it, and the rows only
  // exist once that paint has built them. One more pass settles it.
  if (settlePendingRow()) paint();
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
