/**
 * The canonical observation, read off the DOM.
 *
 * This runs inside the browser in both places that need it — Playwright's
 * `page.evaluate` in the headless gate, and the playground page — so it must
 * stay self-contained: no imports, no closure over anything outside itself.
 * One copy, because two would drift and the harness would stop meaning
 * anything.
 *
 * The Ranger side reports the same fields off its display tree; see
 * conformance/SPEC.md for what each one means on each side.
 */
export function snapshotDom(options) {
  const NAMED_ROLES = new Set([
    "button",
    "link",
    "heading",
    "tab",
    "menuitem",
    "checkbox",
    "radio",
    "switch",
  ]);
  // aria-checked and aria-selected are tri-state: "mixed" is a real value.
  const tri = (v) => (v == null ? null : v === "mixed" ? "mixed" : v === "true");
  const tagged = [...document.querySelectorAll("[data-tid]")];
  // Where a node sits among its siblings, 1-based, counting only the nodes the
  // trace knows about and only under the same tagged parent.
  //
  // This is the field a reorder moves, and without it a sortable is invisible:
  // the diff indexes by test id, so a list whose items swapped compares equal
  // on every other field. It is `aria-posinset` in spirit — and deliberately
  // NOT read from that attribute, which almost nothing sets. Position is a
  // fact about the tree, not an annotation someone remembered to write.
  const parentTid = (el) => {
    const p = el.parentElement && el.parentElement.closest("[data-tid]");
    return p ? p.getAttribute("data-tid") : "";
  };
  const seen = new Map();
  const posOf = new Map();
  for (const el of tagged) {
    const key = parentTid(el);
    const n = (seen.get(key) || 0) + 1;
    seen.set(key, n);
    posOf.set(el, n);
  }
  const out = [];
  for (const el of tagged) {
    const explicit = el.getAttribute("role");
    const tag = el.tagName.toLowerCase();
    let role = explicit;
    if (!role) role = tag === "button" ? "button" : tag === "a" ? "link" : "none";
    const label = el.getAttribute("aria-label");
    // Accessible name from text: aria-hidden subtrees do not contribute. An
    // icon button is glyph + visually-hidden label, and counting the glyph
    // would make its name "*Favourite" — which is what the naive version said.
    const visibleText = (node) => {
      let out = "";
      for (const child of node.childNodes) {
        if (child.nodeType === 3) out += child.nodeValue;
        else if (child.nodeType === 1 && child.getAttribute("aria-hidden") !== "true") {
          out += visibleText(child);
        }
      }
      return out;
    };
    const name = label != null ? label : NAMED_ROLES.has(role) ? visibleText(el).trim() : "";
    // A slider's position and a progress bar's fill are announced as numbers
    // and are the only thing about them that changes. Without these the trace
    // cannot tell a slider at 0 from one at 100 — measured: every step of the
    // first slider spec observed identical.
    const num = (a) => {
      const v = el.getAttribute(a);
      if (v == null || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const expanded = el.getAttribute("aria-expanded");
    const pressed = el.getAttribute("aria-pressed");
    const disabled = el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true";
    out.push({
      tid: el.getAttribute("data-tid"),
      role,
      name,
      state: el.getAttribute("data-state") || "",
      expanded: expanded == null ? null : expanded === "true",
      pressed: pressed == null ? null : pressed === "true",
      checked: tri(el.getAttribute("aria-checked")),
      selected: tri(el.getAttribute("aria-selected")),
      disabled,
      // Would Tab land here? Roving focus is exactly this going false on the
      // items a composite does not want in the tab order.
      tabstop: el.tabIndex >= 0 && !disabled,
      valuenow: num("aria-valuenow"),
      valuemin: num("aria-valuemin"),
      valuemax: num("aria-valuemax"),
      // A modal takes the rest of the page out of the accessibility tree; a
      // reader that can still walk what a dialog covers will walk it. Radix
      // does that with aria-hidden on everything else rather than aria-modal
      // on the dialog, so THIS is the observable, and `aria-modal` is not
      // compared at all.
      hidden: !!el.closest('[aria-hidden="true"]'),
      focused: document.activeElement === el,
      visible: el.getClientRects().length > 0,
      // "sortable", "draggable" — what a reader says INSTEAD of the role. A
      // dnd-kit item is a `button` whose role description is the entire
      // affordance: without it a reader announces a button and nothing about
      // being able to move it.
      roledescription: el.getAttribute("aria-roledescription"),
      // Reported, not compared. The two systems disagree about the parent of a
      // floating surface ON PURPOSE — Radix portals a tooltip to the end of
      // the body, EVG keeps it the trigger's child and moves only where it is
      // painted — so this is a known design difference, not a defect. It is
      // here because `posinset` is meaningless across it; see diff.mjs.
      parent: parentTid(el),
      posinset: posOf.get(el),
    });
  }
  // What a screen reader was TOLD, as a node of its own, when the spec asks
  // for it.
  //
  // Opt-in per spec, and the measurement says why. dnd-kit announces every
  // stage of a drag into a live region — "Draggable item a was moved over
  // droppable area b." — and for a keyboard drag that is the entire
  // interaction: pressing ArrowDown changes NOTHING else observable, because
  // the displacement is a transform. Without this the spec has a step that
  // cannot fail.
  //
  // It is not global, because Radix's toast also renders an untagged live
  // region, and what it says there is a concatenation of nodes the trace
  // already carries ("Notification SavedAll goodUndo"). Comparing that would
  // be comparing one library's copy-writing, not a behaviour.
  //
  // Regions INSIDE a tagged node are skipped for the same reason: whatever
  // they say is already in the trace under its own test id.
  if (options && options.announce) {
    let said = "";
    for (const el of document.querySelectorAll("[aria-live]")) {
      if (el.parentElement && el.parentElement.closest("[data-tid]")) continue;
      const text = (el.textContent || "").trim();
      if (text) said = text;
    }
    out.push({
      tid: "@announce",
      role: "status",
      name: said,
      state: "",
      expanded: null,
      pressed: null,
      checked: null,
      selected: null,
      disabled: false,
      tabstop: false,
      valuenow: null,
      valuemin: null,
      valuemax: null,
      hidden: false,
      focused: false,
      visible: true,
      roledescription: null,
      parent: "",
      posinset: 0,
    });
  }
  return out;
}
