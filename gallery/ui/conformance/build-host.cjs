/**
 * Build a UiHost from a conformance fixture.
 *
 * Shared by the headless adapter and the browser playground so a control can
 * never be set up two different ways — the fixture is the contract.
 */

"use strict";

/** Same fixture the Radix playground reads; see conformance/SPEC.md. */
/**
 * A menu's items, which may themselves be menus. `addSub` returns the row so
 * its children can be hung on it, and `MenuCtl.addKid` does the same one level
 * down — so nesting is written the same way at every depth, and the fixture
 * needs no special case for "a submenu of a submenu".
 */
function addMenuItems(ctl, items, parent) {
  for (const it of items || []) {
    const kids = it.items || [];
    if (kids.length) {
      const sub = parent
        ? ctl.constructor.addKid(parent, it.value, it.name, !!it.disabled)
        : ctl.addSub(it.value, it.name, !!it.disabled);
      addMenuItems(ctl, kids, sub);
    } else if (parent) {
      ctl.constructor.addKid(parent, it.value, it.name, !!it.disabled);
    } else {
      ctl.addItem(it.value, it.name, !!it.disabled);
    }
  }
}

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

      case "togglegroup":
        // A single-select toggle group IS a radio group; Radix says so with
        // role=radiogroup, so the same controller serves both.
        ctl = host.addRadioGroup(c.tid, c.name);
        ctl.toggleMode = true;
        for (const it of c.items) ctl.addItem(it.value, it.name, !!it.disabled);
        ctl.value = c.value || "";
        break;

      case "toolbar":
        ctl = host.addToolbar(c.tid, c.name);
        for (const it of c.items) ctl.addItem(it.value, it.name, !!it.disabled);
        break;

      case "dialog":
        ctl = host.addDialog(c.tid, c.name, c.title || c.name);
        break;

      case "alertdialog":
        ctl = host.addAlertDialog(c.tid, c.name, c.title || c.name);
        ctl.bodyText = c.body || "";
        break;

      case "popover":
        ctl = host.addPopover(c.tid, c.name);
        ctl.bodyText = c.body || "";
        break;

      case "tooltip":
        ctl = host.addTooltip(c.tid, c.name);
        ctl.bodyText = c.body || c.name;
        break;

      case "hovercard":
        ctl = host.addHoverCard(c.tid, c.name);
        ctl.bodyText = c.body || "";
        break;

      case "dropdownmenu":
        ctl = host.addDropdownMenu(c.tid, c.name);
        addMenuItems(ctl, c.items);
        break;

      case "contextmenu":
        ctl = host.addContextMenu(c.tid, c.name);
        addMenuItems(ctl, c.items);
        break;

      case "slider":
        ctl = host.addSlider(c.tid, c.name);
        ctl.minValue = c.min ?? 0;
        ctl.maxValue = c.max ?? 100;
        ctl.step = c.step ?? 1;
        ctl.value = c.value ?? 50;
        break;

      case "toast":
        ctl = host.addToast(c.tid, c.name);
        ctl.title = c.title || c.name;
        ctl.bodyText = c.body || "";
        ctl.actionLabel = c.actionName || "Undo";
        break;

      case "label":
        ctl = host.addLabel(c.tid, c.name);
        break;

      case "separator":
        ctl = host.addSeparator(c.tid);
        ctl.decorative = !!c.decorative;
        ctl.vertical = c.orientation === "vertical";
        break;

      case "progress":
        ctl = host.addProgress(c.tid, c.name);
        ctl.indeterminate = c.value == null;
        ctl.value = c.value || 0;
        ctl.maxValue = c.max || 100;
        break;

      case "aspectratio":
        ctl = host.addAspectRatio(c.tid, c.name || "");
        ctl.boxWidth = c.width || 120;
        ctl.ratioW = c.ratio || 1;
        ctl.ratioH = 1;
        break;

      case "accessibleicon":
        ctl = host.addAccessibleIcon(c.tid, c.name, c.glyph || "*");
        break;

      case "avatar":
        ctl = host.addAvatar(c.tid, c.name, c.fallback || "?");
        break;

      case "menubar":
        ctl = host.addMenubar(c.tid, c.name || "");
        for (const m of c.items) {
          const menu = ctl.addMenu(m.value, m.name);
          if (m.disabled) menu.disabled = true;
          for (const it of m.items || []) {
            ctl.addItem(m.value, it.value, it.name, !!it.disabled);
          }
        }
        break;

      case "select":
        ctl = host.addSelect(c.tid, c.name || "");
        for (const it of c.items) ctl.addItem(it.value, it.name, !!it.disabled);
        ctl.value = c.value || "";
        break;

      case "navigationmenu":
        ctl = host.addNavMenu(c.tid, c.name || "");
        for (const s of c.items) {
          ctl.addSection(s.value, s.name);
          for (const l of s.links || []) ctl.addLink(s.value, l.value, l.name);
        }
        break;

      case "scrollarea":
        ctl = host.addScrollArea(c.tid, c.name || "");
        for (const it of c.items || []) ctl.addItem(it.value, it.name);
        break;

      case "sortable":
        ctl = host.addSortable(c.tid, c.name || "");
        for (const it of c.items) ctl.addItem(it.value, it.name, !!it.disabled);
        break;

      case "tree": {
        ctl = host.addTree(c.tid, c.name || "", c.root);
        // Selection is a MODE, off unless the fixture asks. ReUI's tree does
        // not enable it, and the eighteen behaviours measured against that
        // configuration must not move.
        if (c.selection) ctl.selectable = true;
        // Drag and drop needs selection: a drag carries the selected rows.
        if (c.dnd) {
          ctl.selectable = true;
          ctl.draggable = true;
        }
        // Two passes: every node first, then the child lists — a fixture may
        // name a child before the line that declares it, and the library's own
        // data loader has the same freedom.
        const made = new Map();
        for (const it of c.items || []) made.set(it.value, ctl.addNode(it.value, it.name));
        for (const it of c.items || []) {
          for (const kid of it.children || []) ctl.constructor.addKid(made.get(it.value), kid);
        }
        for (const v of c.expanded || []) ctl.setExpanded(v, true);
        ctl.build();
        break;
      }

      case "table": {
        ctl = host.addTable(c.tid, c.name || "");
        for (const col of c.columns || []) {
          ctl.addColumn(col.key, col.label || col.key, !!col.numeric, col.sortable !== false);
        }
        for (const r of c.rows || []) ctl.addRecord(r.key, r.cells || []);
        if (c.pageSize) ctl.pageSize = c.pageSize;
        ctl.build();
        break;
      }

      case "accordion":
        ctl = host.addAccordion(c.tid, c.name || "");
        for (const it of c.items) ctl.addItem(it.value, it.name, it.body || "", !!it.disabled);
        ctl.openValue = c.value || "";
        break;

      default:
        throw new Error(
          "unknown control type: " + c.type + " (known: " + SUPPORTED_TYPES.join(", ") + ")",
        );
    }
    if (c.disabled) ctl.disabled = true;
    // Every field above is initial state, so the subtree is built once here
    // rather than after each assignment.
    ctl.build();
  }
  return host;
}

/**
 * The control types the kit can actually build. The inventory reads this rather
 * than a hand-kept list, so "implemented" cannot drift from what the code does.
 */
const SUPPORTED_TYPES = [
  "toggle",
  "collapsible",
  "checkbox",
  "switch",
  "radiogroup",
  "tabs",
  "accordion",
  "togglegroup",
  "toolbar",
  "dialog",
  "label",
  "separator",
  "progress",
  "aspectratio",
  "accessibleicon",
  "avatar",
  "alertdialog",
  "popover",
  "tooltip",
  "hovercard",
  "dropdownmenu",
  "contextmenu",
  "slider",
  "toast",
  "sortable",
  "tree",
  "menubar",
  "select",
  "navigationmenu",
  "scrollarea",
  "table",
];

module.exports = { buildHost, SUPPORTED_TYPES };
