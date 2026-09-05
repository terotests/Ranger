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
    // A cell's name IS its text. Nothing writes an aria-label on a table cell
    // and a trace that reported them all nameless would compare two blanks.
    "columnheader",
    "rowheader",
    "cell",
  ]);
  /**
   * The role an element has WITHOUT anyone writing one.
   *
   * A browser's accessibility tree gives `<table>`, `<tr>`, `<th>` and `<td>`
   * their roles from the tag, and nobody writing a table writes them out — so
   * a snapshot that only knew about `<button>` and `<a>` reported a whole
   * table as `none` and made the reference look like it had no accessibility
   * at all. It is the tag that carries the meaning here; the attribute is the
   * exception.
   *
   * `<th>` is a columnheader only in a header row. In a body row it labels the
   * row, which is a different role and a different thing for a reader to hear.
   */
  /**
   * Which tags carry a `value` and a caret. Reading `el.value` on anything
   * else is either undefined or, worse, meaningful for the wrong reason —
   * `<button value>` and `<li value>` both exist and neither is a text field.
   */
  const EDITABLE = (el, tag) => {
    if (tag === "textarea") return true;
    if (tag !== "input") return false;
    // A checkbox's `value` is what it SUBMITS — "on" by default — and has
    // nothing to do with what a field holds. Reading it as a text value made
    // every checkbox in the table report `value: "on"` against a Ranger side
    // that quite correctly reported nothing.
    return !NON_TEXT_INPUT.has((el.type || "text").toLowerCase());
  };

  const NON_TEXT_INPUT = new Set([
    "checkbox",
    "radio",
    "button",
    "submit",
    "reset",
    "file",
    "image",
    "hidden",
    "color",
    "range",
  ]);

  /**
   * `selectionStart`/`selectionEnd`, which THROW on an input whose type does
   * not support them — email, number and a few others — rather than returning
   * null. A field that reports no caret is a fact about that field; a
   * snapshot that dies halfway through is a lost trace.
   */
  const selOf = (el, prop) => {
    try {
      const v = el[prop];
      return typeof v === "number" ? v : null;
    } catch {
      return null;
    }
  };

  /**
   * The text of every element `aria-describedby` points at, joined with a
   * space in the order the attribute lists them — which is the order a reader
   * announces them in, and the reason this is a join rather than a set.
   * Missing ids are skipped, the way a browser skips them.
   */
  const describedBy = (el) => {
    const ids = (el.getAttribute("aria-describedby") || "").trim();
    if (!ids) return null;
    const parts = [];
    for (const id of ids.split(/\s+/)) {
      const target = el.ownerDocument.getElementById(id);
      if (!target) continue;
      const t = (target.textContent || "").replace(/\s+/g, " ").trim();
      if (t) parts.push(t);
    }
    return parts.length ? parts.join(" ") : null;
  };

  const IMPLICIT_ROLE = (el, tag) => {
    if (tag === "button") return "button";
    if (tag === "a") return "link";
    // Landmarks and lists. Absent until the breadcrumb needed them, which is
    // why a `<nav>` and an `<li>` both reported "none" — the table below grew
    // one component at a time and nothing before this was built out of them.
    if (tag === "nav") return "navigation";
    // A form's own tags, added before the form so the table stops growing one
    // component late. `<form>` is only a landmark when it is NAMED, which is
    // the HTML-ARIA mapping and not a simplification.
    if (tag === "form") return el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") ? "form" : "none";
    if (tag === "fieldset") return "group";
    if (tag === "textarea") return "textbox";
    if (tag === "select") return el.multiple || el.size > 1 ? "listbox" : "combobox";
    if (tag === "output") return "status";
    if (tag === "ol" || tag === "ul") return "list";
    if (tag === "li") return "listitem";
    if (tag === "table") return "table";
    if (tag === "tr") return "row";
    if (tag === "td") return "cell";
    if (tag === "th") return el.closest("thead") ? "columnheader" : "rowheader";
    if (tag === "input") {
      const t = (el.getAttribute("type") || "text").toLowerCase();
      if (t === "checkbox") return "checkbox";
      if (t === "radio") return "radio";
      return "textbox";
    }
    return "none";
  };
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
    if (!role) role = IMPLICIT_ROLE(el, tag);
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
      // A native checkbox carries none of this in an attribute: `checked` and
      // `indeterminate` are DOM properties. Reading only `aria-checked` made
      // the reference's select-all box report nothing at all.
      checked:
        el.getAttribute("aria-checked") != null
          ? tri(el.getAttribute("aria-checked"))
          : tag === "input" && el.type === "checkbox"
            ? el.indeterminate
              ? "mixed"
              : el.checked
            : null,
      selected: tri(el.getAttribute("aria-selected")),
      disabled,
      // Would Tab land here? Roving focus is exactly this going false on the
      // items a composite does not want in the tab order.
      tabstop: el.tabIndex >= 0 && !disabled,
      invalid: el.getAttribute("aria-invalid"),
      // `required` and `readonly` are ATTRIBUTES on a native control and
      // `aria-required`/`aria-readonly` on everything else, and a browser
      // derives the same accessibility fact from either. Reading only the aria
      // form made a `<input readonly>` report nothing at all — the same trap
      // `checked` fell into above, where a native checkbox carries its state
      // in a property and no attribute mentions it.
      //
      // The aria attribute still wins when it is there: it is the explicit
      // claim, and a control that sets it to "false" over a native `required`
      // has said something the native attribute did not.
      required:
        el.getAttribute("aria-required") != null
          ? el.getAttribute("aria-required")
          : el.required
            ? "true"
            : null,
      readonly:
        el.getAttribute("aria-readonly") != null
          ? el.getAttribute("aria-readonly")
          : EDITABLE(el, tag) && el.readOnly
            ? "true"
            : null,
      current: el.getAttribute("aria-current"),
      orientation: el.getAttribute("aria-orientation"),
      // What a text field HOLDS, and where the caret is in it. Properties, not
      // attributes: `el.value` moves as the user types while the `value`
      // attribute keeps whatever the markup said, and reading the attribute
      // would have made a typed word invisible — the same trap the checkbox's
      // `checked` set above.
      //
      // `null` on anything that is not an editable control, because a box
      // holding "" and a button are not the same claim.
      value: EDITABLE(el, tag) ? el.value : null,
      placeholder: el.getAttribute("placeholder"),
      selstart: EDITABLE(el, tag) ? selOf(el, "selectionStart") : null,
      selend: EDITABLE(el, tag) ? selOf(el, "selectionEnd") : null,
      // `aria-rowcount` / `aria-rowindex`. A virtualised table has twelve
      // rows in the DOM and ten thousand in the data, and these two are the
      // only thing that says so.
      rowcount: num("aria-rowcount"),
      rowindex: num("aria-rowindex"),
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
      // `aria-describedby` RESOLVED. The ids themselves are not comparable —
      // the two sides name their nodes differently by design — but the
      // sentence a reader announces after the role is, and that is the only
      // part of a Field's hint or error message that is observable at all.
      description: describedBy(el),
      // `aria-sort`. Absent on anything that is not a column header, and
      // present-and-"none" on a header that can be sorted but is not — the two
      // are different things and the trace keeps them apart.
      sort: el.getAttribute("aria-sort"),
      // `aria-haspopup`. The one attribute that tells a reader a row opens
      // ANOTHER menu rather than doing something — without it a submenu's
      // parent announces exactly like the item beside it, and the only clue
      // left is a chevron a reader cannot see. Its own field for the same
      // reason `sort` is one: nothing else about the node changes.
      haspopup: el.getAttribute("aria-haspopup"),
      // `aria-level` and `aria-setsize`. A tree's whole shape is these two
      // numbers plus `posinset`: how deep a row sits and how many siblings it
      // has. Nothing else in the trace can see nesting at all — every item of
      // a tree is a `treeitem` with a name, and depth is the only thing that
      // makes one of them a child of another. Numbers, not strings, so a
      // missing attribute is null rather than the string "null".
      level: el.hasAttribute("aria-level") ? Number(el.getAttribute("aria-level")) : null,
      setsize: el.hasAttribute("aria-setsize") ? Number(el.getAttribute("aria-setsize")) : null,
      // `aria-posinset` — the ATTRIBUTE, and deliberately not called
      // `posinset`. That name is already taken by a number this harness
      // DERIVES from the tree it walks, and for a flat tree DOM the two
      // disagree completely: the derived one counts every visible row 1..6,
      // while the attribute counts siblings, so a second top-level folder is
      // 4th derived and 2nd by attribute. Both are right about their own
      // question. `setpos` pairs with `setsize` — position within the set that
      // counts — and a reader announces the two together.
      setpos: el.hasAttribute("aria-posinset") ? Number(el.getAttribute("aria-posinset")) : null,
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
      invalid: null,
      required: null,
      readonly: null,
      current: null,
      orientation: null,
      value: null,
      placeholder: null,
      selstart: null,
      selend: null,
      rowcount: null,
      rowindex: null,
      valuenow: null,
      valuemin: null,
      valuemax: null,
      hidden: false,
      focused: false,
      visible: true,
      roledescription: null,
      description: null,
      sort: null,
      haspopup: null,
      level: null,
      setsize: null,
      setpos: null,
      parent: "",
      posinset: 0,
    });
  }
  return out;
}
