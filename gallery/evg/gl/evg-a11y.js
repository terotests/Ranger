/**
 * evg-a11y.js — the accessibility tree, as DOM, over the canvas.
 *
 * A screen reader does not look at pixels. It asks the browser for the tree it
 * built out of the DOM, and a <canvas> contributes one empty graphic to that
 * tree no matter what was drawn into it. So the app publishes what the frame
 * MEANS — `EVGA11yTree`, built in Ranger beside the display list — and this
 * file turns it into real DOM elements positioned over the canvas, with the
 * roles, names and states the tree carries.
 *
 *   GridApp ─┬─ sceneJson()  ─► evg-webgl.js  ─► pixels
 *            └─ a11yJson()   ─► THIS FILE     ─► DOM  ─► NVDA / VoiceOver / Orca
 *
 * Google Sheets does the same thing for the same reason. There is no other
 * approach that works: `role="application"` plus an announcement region gives a
 * reader nothing to explore, and nothing to put a braille cursor on.
 *
 * What the elements look like
 * ---------------------------
 * They are transparent rather than hidden. `display:none` and
 * `visibility:hidden` remove a node from the accessibility tree, which is the
 * one thing being built here, and `opacity:0` is treated as hidden by some
 * combinations. Transparent ink over a canvas that already drew the same text
 * is visible to the accessibility API and invisible to the eye.
 *
 * They are positioned at their real rectangles, because a rectangle is not
 * decoration: touch exploration on a tablet, a screen magnifier following the
 * cursor, and "route the mouse to the focus" all use it.
 *
 * The container takes no pointer events, so the mouse keeps going to the canvas
 * and the app's own hit testing stays the only hit testing. A reader ACTIVATING
 * an element still arrives as a click on that element — and this file answers it
 * by pressing the app where the element is. That is deliberately not a mapping
 * table from node ids to commands: there is nothing to keep in step with the
 * app, and a button that moved is still pressed in the right place.
 *
 * Focus
 * -----
 * The app owns it. Whatever `tree.focus` names is the only element with
 * `tabindex="0"` — the roving tabindex an ARIA grid is built on — and this file
 * calls `.focus()` on it when it changes. It never tells the app that focus
 * moved, because a mirror that reports focus back gets into a loop with the app
 * that is trying to set it.
 *
 * Updates
 * -------
 * Elements are kept in a map by node id and reused. That is what makes the ids
 * matter: rebuilding the subtree under a reader's cursor loses the cursor, and
 * the ids the tree carries are derived from identity — `sheet/cell:B7` — so a
 * repaint, a scroll and a recalculation all leave the same element in place.
 * A tree whose `gen` has not changed is skipped entirely.
 */

const HIDDEN_ROLES = new Set(["none", "presentation"]);

// Roles whose own text IS the content, so the element carries it as text and
// takes no aria-label — a label would override the content and read instead of
// it. The rest get an aria-label and are containers for their children.
const CONTENT_ROLES = new Set([
  "text", "heading", "button", "gridcell", "columnheader", "rowheader",
  "checkbox", "radio", "tab", "menuitem", "menuitemcheckbox", "menuitemradio",
  "listitem", "link",
]);

// A native <button> is better understood by every screen reader than a div with
// role="button", and it is activatable without any extra key handling.
function elementFor(role) {
  if (role === "button") return document.createElement("button");
  return document.createElement("div");
}

function styleBase(el) {
  const s = el.style;
  s.position = "absolute";
  s.margin = "0";
  s.padding = "0";
  s.border = "0";
  s.background = "transparent";
  s.color = "transparent";
  s.font = "inherit";
  s.fontSize = "10px";
  s.lineHeight = "1";
  s.overflow = "hidden";
  s.whiteSpace = "pre";
  s.outline = "none";
  // The canvas underneath already drew all of this. Nothing here should paint,
  // and nothing here should take a click away from it.
  s.pointerEvents = "none";
  s.userSelect = "none";
}

function setAttr(el, name, value) {
  if (value === null || value === undefined || value === "") {
    if (el.hasAttribute(name)) el.removeAttribute(name);
  } else if (el.getAttribute(name) !== String(value)) {
    el.setAttribute(name, String(value));
  }
}

const TRI = { 1: "false", 2: "true", 3: "mixed" };

/**
 * Create a mirror over a canvas.
 *
 *   host      element that positions the canvas; the mirror is appended to it
 *             and must sit exactly over the canvas, so the host needs
 *             `position: relative` and no padding of its own.
 *   canvas    hidden from the accessibility tree, since the mirror replaces it
 *   onActivate(node)  a reader pressed something. Default: press the app at the
 *             node's centre.
 *   scale     app pixels → CSS pixels, when the canvas is not drawn 1:1
 */
export function createA11yMirror(host, { canvas, onActivate, scale = 1, label = "Application" } = {}) {
  const root = document.createElement("div");
  root.className = "evg-a11y";
  root.style.position = "absolute";
  root.style.left = "0";
  root.style.top = "0";
  root.style.right = "0";
  root.style.bottom = "0";
  root.style.overflow = "hidden";
  root.style.pointerEvents = "none";
  host.appendChild(root);

  if (canvas) {
    // The canvas is scenery now. Leaving it in the accessibility tree gives the
    // reader an empty graphic beside a full tree of real nodes.
    canvas.setAttribute("aria-hidden", "true");
  }

  const els = new Map();      // node id → element
  let lastGen = -1;
  let lastFocus = null;
  let settingFocus = false;

  function activate(node) {
    if (onActivate) onActivate(node);
  }

  function ensure(node) {
    let entry = els.get(node.id);
    // A node that changed role cannot keep its element: a <button> does not
    // become a gridcell, and a reader would keep the old one's semantics.
    if (entry && entry.role !== node.role) {
      entry.el.remove();
      entry = null;
    }
    if (!entry) {
      const el = elementFor(node.role);
      styleBase(el);
      if (node.role === "button") {
        el.type = "button";
        el.tabIndex = -1;
      }
      el.dataset.a11yId = node.id;
      el.addEventListener("click", (ev) => {
        ev.preventDefault();
        // The elements are NESTED — a row is inside its menu is inside the
        // bar — so a click that keeps bubbling reaches every ancestor's
        // listener too, and each one presses the app at ITS OWN centre. One
        // activation on a menu row then became three: the row, the menu
        // behind it, and the page behind that.
        ev.stopPropagation();
        const n = els.get(node.id);
        if (n) activate(n.node);
      });
      entry = { el, role: node.role, node };
      els.set(node.id, entry);
    }
    entry.node = node;
    return entry;
  }

  function applyAria(el, node, byId) {
    const role = node.role;
    // A native <button> already has the role; anything else is a div and needs
    // to be told what it is.
    if (el.tagName !== "BUTTON") setAttr(el, "role", role);

    const content = CONTENT_ROLES.has(role);
    if (role === "textbox") {
      // A field's label and its contents are two different strings, and a
      // reader announces both: "Formula, equals SUM open paren…".
      setAttr(el, "aria-label", node.name);
      const text = node.value || "";
      if (el.textContent !== text) el.textContent = text;
      setAttr(el, "aria-multiline", "false");
    } else if (role === "status") {
      const text = node.value || node.name || "";
      if (el.textContent !== text) el.textContent = text;
      setAttr(el, "aria-label", null);
    } else if (content) {
      const text = node.name || "";
      if (el.textContent !== text) el.textContent = text;
      setAttr(el, "aria-label", null);
    } else {
      setAttr(el, "aria-label", node.name);
    }

    setAttr(el, "aria-description", node.desc);
    // Some controls are a known role doing an unfamiliar job. A sortable row
    // is a `button`, and a reader told only that learns nothing about being
    // able to move it.
    setAttr(el, "aria-roledescription", node.roledesc);
    // Open or closed. A trigger that never says which is a trigger a reader
    // cannot tell has already been pressed.
    setAttr(el, "aria-expanded", node.expanded ? TRI[node.expanded] || null : null);
    setAttr(el, "aria-disabled", node.disabled ? "true" : null);
    setAttr(el, "aria-readonly", node.readonly ? "true" : null);
    setAttr(el, "aria-modal", node.modal ? "true" : null);
    setAttr(el, "aria-selected", node.selected ? "true" : null);
    // A toggle button is pressed; a checkbox or a radio is checked. Same field
    // in the tree, two different words on the way out.
    if (node.checked) {
      const state = TRI[node.checked] || null;
      if (role === "button") {
        setAttr(el, "aria-pressed", state);
        setAttr(el, "aria-checked", null);
      } else {
        setAttr(el, "aria-checked", state);
        setAttr(el, "aria-pressed", null);
      }
    } else {
      setAttr(el, "aria-pressed", null);
      setAttr(el, "aria-checked", null);
    }
    // A number the reader announces. `now` is deliberately absent on an
    // indeterminate progress bar: a range with no position in it is how every
    // platform spells "busy, length unknown", and writing 0 there instead
    // would have the reader say the work has not started.
    setAttr(el, "aria-valuenow", node.now == null ? null : node.now);
    setAttr(el, "aria-valuemin", node.min == null ? null : node.min);
    setAttr(el, "aria-valuemax", node.max == null ? null : node.max);
    // Virtualization: the counts are the whole sheet, the indices say where the
    // emitted rows sit in it.
    setAttr(el, "aria-rowcount", node.rows || null);
    setAttr(el, "aria-colcount", node.cols || null);
    setAttr(el, "aria-rowindex", node.row || null);
    setAttr(el, "aria-colindex", node.col || null);
    setAttr(el, "aria-posinset", node.pos || null);
    setAttr(el, "aria-setsize", node.size || null);
    setAttr(el, "aria-live", node.live === 2 ? "assertive" : node.live === 1 ? "polite" : null);

    const b = node.b || [0, 0, 0, 0];
    const parent = node.p ? byId.get(node.p) : null;
    const pb = parent ? parent.b || [0, 0, 0, 0] : [0, 0, 0, 0];
    // Relative to the parent, because an absolutely positioned ancestor is the
    // containing block for everything under it.
    const left = (b[0] - pb[0]) * scale;
    const top = (b[1] - pb[1]) * scale;
    const w = Math.max(0, b[2] * scale);
    const h = Math.max(0, b[3] * scale);
    const s = el.style;
    if (s.left !== left + "px") s.left = left + "px";
    if (s.top !== top + "px") s.top = top + "px";
    if (s.width !== w + "px") s.width = w + "px";
    if (s.height !== h + "px") s.height = h + "px";
  }

  /** Hide everything a modal dialog is covering. A reader that can still walk
   *  the sheet behind an open dialog will walk it, and none of those keys are
   *  going anywhere. */
  function applyModal(tree, byId) {
    const modal = tree.nodes.find((n) => n.modal);
    const keep = new Set();
    if (modal) {
      let at = modal;
      while (at) {
        keep.add(at.id);
        at = at.p ? byId.get(at.p) : null;
      }
    }
    // Only the top-level regions are hidden or shown: hiding deeper would have
    // to be undone node by node, and hiding a subtree the dialog is inside of
    // would hide the dialog.
    for (const n of tree.nodes) {
      if (n.p !== tree.root) continue;
      const entry = els.get(n.id);
      if (!entry) continue;
      const hide = modal && !keep.has(n.id);
      setAttr(entry.el, "aria-hidden", hide ? "true" : null);
    }
  }

  function update(tree) {
    if (!tree || !tree.nodes) return { skipped: true };
    if (tree.gen === lastGen && tree.focus === lastFocus) return { skipped: true };
    lastGen = tree.gen;

    const byId = new Map();
    for (const n of tree.nodes) byId.set(n.id, n);

    const seen = new Set();
    for (const node of tree.nodes) {
      if (HIDDEN_ROLES.has(node.role)) continue;
      seen.add(node.id);
      const entry = ensure(node);
      applyAria(entry.el, node, byId);
      // Re-parent only when it actually changed: moving an element the reader
      // is sitting on drops its cursor.
      const parentEl = node.p ? (els.get(node.p) || {}).el : root;
      const want = parentEl || root;
      if (entry.el.parentNode !== want) want.appendChild(entry.el);
    }

    for (const [id, entry] of els) {
      if (!seen.has(id)) {
        entry.el.remove();
        els.delete(id);
      }
    }

    applyModal(tree, byId);

    // Roving tabindex: exactly one element in the whole mirror is tabbable, and
    // it is the one the app says has focus.
    if (tree.focus !== lastFocus) {
      const prev = lastFocus ? els.get(lastFocus) : null;
      if (prev) prev.el.tabIndex = -1;
    }
    const focused = tree.focus ? els.get(tree.focus) : null;
    if (focused) {
      focused.el.tabIndex = 0;
      if (document.activeElement !== focused.el) {
        settingFocus = true;
        try {
          focused.el.focus({ preventScroll: true });
        } finally {
          settingFocus = false;
        }
      }
    }
    lastFocus = tree.focus;

    return { nodes: tree.nodes.length, elements: els.size, gen: tree.gen };
  }

  function destroy() {
    root.remove();
    els.clear();
    if (canvas) canvas.removeAttribute("aria-hidden");
  }

  root.setAttribute("aria-label", label);
  return {
    root,
    update,
    destroy,
    get size() {
      return els.size;
    },
    isSettingFocus() {
      return settingFocus;
    },
  };
}

/** The default answer to "a reader pressed this": press the app where it is.
 *  No mapping table, and nothing to keep in step with the app's own commands. */
export function pressAtCentre(node, press) {
  const b = node.b || [0, 0, 0, 0];
  const cx = Math.round(b[0] + b[2] / 2);
  const cy = Math.round(b[1] + b[3] / 2);
  press(cx, cy);
}
