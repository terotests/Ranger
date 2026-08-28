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
export function snapshotDom() {
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
  const out = [];
  for (const el of document.querySelectorAll("[data-tid]")) {
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
      // A modal takes the rest of the page out of the accessibility tree; a
      // reader that can still walk what a dialog covers will walk it. Radix
      // does that with aria-hidden on everything else rather than aria-modal
      // on the dialog, so THIS is the observable, and `aria-modal` is not
      // compared at all.
      hidden: !!el.closest('[aria-hidden="true"]'),
      focused: document.activeElement === el,
      visible: el.getClientRects().length > 0,
    });
  }
  return out;
}
