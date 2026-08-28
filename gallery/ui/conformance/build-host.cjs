/**
 * Build a UiHost from a conformance fixture.
 *
 * Shared by the headless adapter and the browser playground so a control can
 * never be set up two different ways — the fixture is the contract.
 */

"use strict";

/** Same fixture the Radix playground reads; see conformance/SPEC.md. */
function buildHost(M, fixture, css) {
  const host = new M.UiHost();
  if (css) host.addStyleSheet(css);

  for (const c of fixture.controls) {
    let ctl;
    switch (c.type) {
      case "toggle":
        ctl = host.addToggle(c.tid, c.name);
        break;

      case "collapsible":
        ctl = host.addCollapsible(c.tid, c.name, c.body || "");
        break;

      case "checkbox":
        ctl = host.addCheckbox(c.tid, c.name);
        ctl.checkState = c.checked === "indeterminate" ? 2 : c.checked ? 1 : 0;
        break;

      case "switch":
        ctl = host.addSwitch(c.tid, c.name);
        ctl.checkState = c.checked ? 1 : 0;
        break;

      case "radiogroup":
        ctl = host.addRadioGroup(c.tid, c.name);
        for (const it of c.items) ctl.addItem(it.value, it.name, !!it.disabled);
        ctl.value = c.value || "";
        break;

      case "tabs":
        ctl = host.addTabs(c.tid, c.name);
        for (const it of c.items) ctl.addItem(it.value, it.name, it.body || "", !!it.disabled);
        ctl.value = c.value || "";
        break;

      case "accordion":
        ctl = host.addAccordion(c.tid, c.name || "");
        for (const it of c.items) ctl.addItem(it.value, it.name, it.body || "", !!it.disabled);
        ctl.openValue = c.value || "";
        break;

      default:
        throw new Error("unknown control type: " + c.type);
    }
    if (c.disabled) ctl.disabled = true;
    // Every field above is initial state, so the subtree is built once here
    // rather than after each assignment.
    ctl.build();
  }
  return host;
}

module.exports = { buildHost };
