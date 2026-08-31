/**
 * Radix playground — the oracle for the conformance harness.
 *
 * Real @radix-ui components in a real browser, built from the SAME fixture the
 * Ranger adapter reads, so neither side gets to describe the test in its own
 * terms. Composite controls derive their parts' test ids by the rules in
 * SPEC.md, and both adapters must derive them identically.
 *
 * Nothing here is styled. The harness compares behaviour, not pixels — the two
 * systems lay out differently on purpose.
 */

import React from "react";
import { createRoot } from "react-dom/client";
import * as Accordion from "@radix-ui/react-accordion";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import * as AspectRatio from "@radix-ui/react-aspect-ratio";
import * as Avatar from "@radix-ui/react-avatar";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as ContextMenu from "@radix-ui/react-context-menu";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as HoverCard from "@radix-ui/react-hover-card";
import * as Label from "@radix-ui/react-label";
import * as Popover from "@radix-ui/react-popover";
import * as Progress from "@radix-ui/react-progress";
import * as RadioGroup from "@radix-ui/react-radio-group";
import * as Separator from "@radix-ui/react-separator";
import * as Slider from "@radix-ui/react-slider";
// Not Radix — Radix has no resizable. ReUI's is react-resizable-panels, and
// the giveaway is its own prop names: `orientation` and percentage STRINGS
// (`"50%"`) are that library's API and nobody else's.
import { Group as RzGroup, Panel as RzPanel, Separator as RzSeparator } from "react-resizable-panels";
import * as Switch from "@radix-ui/react-switch";
import * as Tabs from "@radix-ui/react-tabs";
import * as Toast from "@radix-ui/react-toast";
import * as Toggle from "@radix-ui/react-toggle";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import * as Toolbar from "@radix-ui/react-toolbar";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Menubar from "@radix-ui/react-menubar";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as Select from "@radix-ui/react-select";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTree } from "@headless-tree/react";
import {
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from "@headless-tree/core";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";

/**
 * One menu item, which may itself be a menu.
 *
 * A submenu is three elements and not one: the row you point at
 * (`SubTrigger`, which is a menuitem carrying `aria-haspopup` and its own
 * expanded state), the surface it opens (`SubContent`, a menu), and the `Sub`
 * that pairs them. The tids follow the rule the rest of the fixture follows —
 * the surface is the item's tid plus `-content`, so a spec names a nested row
 * as `dm-item-share-item-mail` and nothing has to be looked up.
 *
 * Radix's dropdown and menubar take the same parts under different namespaces,
 * so the namespace is an argument: one function renders a nested menu for
 * either, and neither can drift from the other.
 */
function renderMenuItem(NS, prefix, it) {
  if (it.items && it.items.length) {
    const sub = prefix + "-item-" + it.value;
    return (
      <NS.Sub key={it.value}>
        <NS.SubTrigger data-tid={sub} disabled={!!it.disabled}>
          {it.name}
        </NS.SubTrigger>
        <NS.Portal>
          <NS.SubContent data-tid={sub + "-content"}>
            {it.items.map((kid) => renderMenuItem(NS, sub, kid))}
          </NS.SubContent>
        </NS.Portal>
      </NS.Sub>
    );
  }
  return (
    <NS.Item
      key={it.value}
      data-tid={prefix + "-item-" + it.value}
      disabled={!!it.disabled}
    >
      {it.name}
    </NS.Item>
  );
}

/**
 * Toast is the one control the fixture cannot express declaratively: it has no
 * trigger of its own, so the harness supplies a button that opens it. `duration`
 * is deliberately enormous — an auto-dismiss timer would make the oracle depend
 * on how fast the machine is.
 */
function ToastControl({ spec, tid }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Toast.Provider swipeDirection="right" duration={spec.duration ?? 1000000}>
      <button data-tid={tid + "-trigger"} type="button" onClick={() => setOpen(true)}>
        {spec.name}
      </button>
      <Toast.Root data-tid={tid} open={open} onOpenChange={setOpen}>
        <Toast.Title data-tid={tid + "-title"}>{spec.title || spec.name}</Toast.Title>
        <Toast.Description data-tid={tid + "-description"}>{spec.body || ""}</Toast.Description>
        <Toast.Action data-tid={tid + "-action"} altText={spec.actionName || "Undo"}>
          {spec.actionName || "Undo"}
        </Toast.Action>
        <Toast.Close data-tid={tid + "-close"}>Close</Toast.Close>
      </Toast.Root>
      {/*
        Radix wraps the viewport list in a NAMED region — that landmark is how
        a reader finds a toast at all, and it is a separate element from the
        <ol> the tid sits on. The ref reaches up one level to tag it, because
        the component renders the wrapper itself and takes no prop for it. Two
        elements on the reference side means two on the EVG side; tagging only
        the list would have quietly dropped the landmark from the comparison.
      */}
      <Toast.Viewport
        data-tid={tid + "-viewport"}
        label="Notifications"
        ref={(el) => {
          if (el && el.parentElement) el.parentElement.setAttribute("data-tid", tid + "-region");
        }}
      />
    </Toast.Provider>
  );
}


/**
 * Table — the second control here that is not Radix.
 *
 * ReUI's is @tanstack/react-table underneath, as is every shadcn-family one,
 * so that is the oracle. It is a NARROWER oracle than dnd-kit, and the markup
 * below is where that shows: dnd-kit writes its own roles and announcements,
 * TanStack writes nothing at all. Every role, every `aria-sort`, every
 * `aria-selected` here is the HTML table spec's, and only the STATE is
 * TanStack's.
 *
 * So this component is deliberately two things at once: TanStack driving what
 * is shown, and a plain accessible `<table>` showing it. If it were written
 * any other way the harness would be comparing EVG against a hand-written
 * table rather than against the library everyone actually ships.
 */
/**
 * A tree, driven by @headless-tree/react — which is what ReUI's tree is.
 *
 * ReUI ships `Tree`, `TreeItem` and `TreeItemLabel` as thin presentational
 * wrappers over `useTree` with `syncDataLoaderFeature` and
 * `hotkeysCoreFeature`, and nothing else. So this renders the same two
 * features with the same shape, and the wrapper's styling is left out: it is
 * the STATE MACHINE and the KEYBOARD that a conformance run is about, and both
 * of those are the library's.
 *
 * WHY THIS IS A BETTER ORACLE THAN TANSTACK WAS. The table's library is
 * headless in the strong sense — it computes state and writes not one
 * attribute, so the ARIA had to come from the HTML spec instead. headless-tree
 * publishes `role`, `aria-expanded`, `aria-level`, `aria-setsize`,
 * `aria-posinset` and `tabIndex` through `getProps()`, the way dnd-kit
 * publishes its roledescription. Copying it therefore gets the accessible tree
 * right for free — and, more usefully, MEASURES it, so a disagreement is a
 * finding rather than a matter of taste.
 *
 * The props go on verbatim, spread rather than picked apart, so nothing the
 * library says can be quietly dropped on the way to the trace.
 */
/**
 * A group of resizable panels, nestable.
 *
 * The fixture names panels by value and lets a panel carry a `group` of its
 * own, which is the shape the reference's own example has: a horizontal pair
 * whose right half is a vertical pair.
 *
 * Ids are OURS rather than the library's generated ones — `<group>-panel-<v>`
 * and `<group>-sep-<i>` — so a spec names a separator the same way it names
 * anything else, and `aria-controls` points at something a reader of the spec
 * recognises. It is not compared (see diff.mjs) but it should still be true.
 */
function ResizableGroup({ node, tid }) {
  const parts = [];
  (node.panels || []).forEach((p, i) => {
    if (i > 0) {
      parts.push(
        <RzSeparator
          key={"sep" + i}
          id={tid + "-sep-" + (i - 1)}
          data-tid={tid + "-sep-" + (i - 1)}
          // The LIBRARY publishes no accessible name for a separator, which
          // leaves a focusable control announcing "50, separator" and nothing
          // about what it splits. That is the library's omission and not a
          // contract to copy, so both sides name it the same way and the
          // catalogue records that the library itself does not.
          aria-label={"Resize " + (node.panels[i - 1].name || node.panels[i - 1].value)}
          className="rz-sep"
        />,
      );
    }
    const panelTid = tid + "-panel-" + p.value;
    parts.push(
      <RzPanel
        key={p.value}
        id={panelTid}
        data-tid={panelTid}
        defaultSize={p.defaultSize}
        minSize={p.minSize}
        maxSize={p.maxSize}
        collapsible={p.collapsible}
        collapsedSize={p.collapsedSize}
        className="rz-panel"
      >
        {p.group ? (
          <ResizableGroup node={p.group} tid={panelTid + "-group"} />
        ) : (
          <div data-tid={panelTid + "-body"}>{p.name || p.value}</div>
        )}
      </RzPanel>,
    );
  });
  return (
    <RzGroup
      id={tid}
      data-tid={tid}
      orientation={node.orientation || "horizontal"}
      className="rz-group"
      style={{ width: 400, height: 300 }}
    >
      {parts}
    </RzGroup>
  );
}

function TreeControl({ spec, tid }) {
  // The fixture's shape is headless-tree's own: a flat record of items, each
  // naming its children, plus a root that is not itself rendered.
  // A REF and not state, mutated in place. That is what the library's own
  // examples do, and the reason is not style: `onDrop` moves the data and then
  // calls `tree.rebuildTree()`, and a React state update has not landed by
  // then — so the tree rebuilds from the data it had before the drop. Measured:
  // with `useState` the drop reported itself completed and not one row moved.
  const itemsRef = React.useRef(null);
  if (itemsRef.current === null) {
    const out = {};
    for (const it of spec.items || []) {
      out[it.value] = { name: it.name, children: [...(it.children || [])] };
    }
    itemsRef.current = out;
  }
  const items = itemsRef.current;

  const tree = useTree({
    initialState: { expandedItems: spec.expanded || [] },
    indent: spec.indent ?? 20,
    rootItemId: spec.root,
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => (item.getItemData()?.children?.length ?? 0) > 0,
    dataLoader: {
      getItem: (itemId) => items[itemId],
      getChildren: (itemId) => items[itemId]?.children ?? [],
    },
    // SELECTION IS A MODE, and off by default, because ReUI's `c-tree-1` does
    // not enable it — the eighteen behaviours already measured are measured
    // against that configuration and must not move. A fixture asks for it with
    // `"selection": true`, and then this is a different tree with a different
    // contract: `aria-selected` becomes real, `Control+Space`, `Shift+Arrow`
    // and `Control+A` do things, and a click sets the selection rather than
    // only moving focus.
    //
    // Worth knowing before reading the specs: `space` is COMMENTED OUT in the
    // library's own selection hotkeys. So Space still activates the button and
    // toggles the folder, selection or not — the one place where turning the
    // feature on does NOT change what a key does.
    // A drop MOVES the dragged items under the target, at `insertionIndex` when
    // the target is a position between rows and at the end when it is an item.
    // This is the app's job and not the library's — `onDrop` is a config hook,
    // the way TanStack leaves the actual sorting to its caller — so the two
    // sides have to agree about it explicitly rather than by both using the
    // same package.
    onDrop: (dragged, target) => {
      const ids = dragged.map((d) => d.getId());
      const data = itemsRef.current;
      // Out of every parent first, then in at the target's insertion index —
      // which is the index the library already corrected for the items about to
      // be removed. An item target with no index means "at the end".
      for (const k of Object.keys(data)) {
        data[k].children = (data[k].children || []).filter((c) => !ids.includes(c));
      }
      const parentId = target.item.getId();
      const kids = data[parentId].children || [];
      const at = "insertionIndex" in target ? target.insertionIndex : kids.length;
      data[parentId].children = [...kids.slice(0, at), ...ids, ...kids.slice(at)];
      // The data has moved; the tree has to be told. Without this the drop is
      // recorded, the state says it completed, and the rows do not move.
      tree.rebuildTree();
    },
    features: spec.dnd
      ? [
          syncDataLoaderFeature,
          hotkeysCoreFeature,
          selectionFeature,
          dragAndDropFeature,
          keyboardDragAndDropFeature,
        ]
      : spec.selection
        ? [syncDataLoaderFeature, hotkeysCoreFeature, selectionFeature]
        : [syncDataLoaderFeature, hotkeysCoreFeature],
  });

  // Published for the same reason the table's probe is: a spec can then ask
  // the library what it thinks, rather than inferring it from the DOM.
  React.useEffect(() => {
    window.__treeProbe = tree;
  });

  const containerProps = tree.getContainerProps();
  return (
    <div {...containerProps} data-tid={tid}>
      {tree.getItems().map((item) => {
        const props = item.getProps();
        return (
          <button
            {...props}
            key={item.getId()}
            data-tid={tid + "-item-" + item.getId()}
            style={{ paddingLeft: item.getItemMeta().level * (spec.indent ?? 20) }}
          >
            {item.getItemName()}
          </button>
        );
      })}
    </div>
  );
}

function TableControl({ spec, tid }) {
  const columns = React.useMemo(
    () =>
      (spec.columns || []).map((c) => ({
        id: c.key,
        accessorKey: c.key,
        header: c.label || c.key,
        enableSorting: c.sortable !== false,
        // The one line that decides a numeric column sorts biggest-first.
        // TanStack infers it from the value type, and the fixture's cells are
        // strings, so it is said explicitly here rather than left to a guess
        // about what "30" is.
        sortDescFirst: !!c.numeric,
        sortingFn: c.numeric ? "basic" : "alphanumeric",
      })),
    [spec],
  );
  const data = React.useMemo(
    () =>
      (spec.rows || []).map((r) => {
        const row = { __id: r.key };
        (spec.columns || []).forEach((c, i) => {
          const raw = (r.cells || [])[i];
          row[c.key] = c.numeric ? Number(raw) : raw;
        });
        return row;
      }),
    [spec],
  );

  const [sorting, setSorting] = React.useState([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: spec.pageSize || 4,
  });
  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getRowId: (r) => r.__id,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const allOnPage = table.getIsAllPageRowsSelected();
  const someOnPage = table.getIsSomePageRowsSelected();
  const selectAll = React.useRef(null);
  React.useEffect(() => {
    // `indeterminate` is a DOM property with no attribute, so React cannot set
    // it and a ref is the only way. Without this the header box reads as
    // unchecked while half the page is selected — the one state the control
    // exists to show.
    if (selectAll.current) selectAll.current.indeterminate = someOnPage;
  }, [someOnPage, allOnPage]);

  if (typeof window !== "undefined") window.__tableProbe = table;
  const header = table.getHeaderGroups()[0];
  return (
    <div>
      <table data-tid={tid} aria-label={spec.name}>
        <thead>
          <tr data-tid={tid + "-headrow"}>
            <th data-tid={tid + "-selectcol"}>
              <input
                ref={selectAll}
                data-tid={tid + "-selectall"}
                type="checkbox"
                aria-label="Select all"
                checked={allOnPage}
                onChange={() => table.toggleAllPageRowsSelected(!allOnPage)}
              />
            </th>
            {header.headers.map((h) => {
              const dir = h.column.getIsSorted();
              return (
                <th
                  key={h.id}
                  data-tid={tid + "-col-" + h.column.id}
                  // Present-and-"none" on a sortable header, absent on one that
                  // cannot be sorted. The two are different and the trace keeps
                  // them apart.
                  aria-sort={
                    h.column.getCanSort()
                      ? dir === "asc"
                        ? "ascending"
                        : dir === "desc"
                          ? "descending"
                          : "none"
                      : undefined
                  }
                  tabIndex={h.column.getCanSort() ? 0 : undefined}
                  onClick={h.column.getToggleSortingHandler()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      h.column.toggleSorting();
                    }
                  }}
                >
                  {String(h.column.columnDef.header)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {table.getRowModel().rows.map((r) => (
            <tr
              key={r.id}
              data-tid={tid + "-row-" + r.id}
              aria-selected={r.getIsSelected()}
            >
              {/*
                Selection is a checkbox IN the row, which is how ReUI does it
                and the only way a keyboard reaches it. A focusable row would
                also have no name to announce, and giving it one means reading
                every cell twice.
              */}
              <td data-tid={tid + "-row-" + r.id + "-checkcell"}>
                <input
                  data-tid={tid + "-check-" + r.id}
                  type="checkbox"
                  aria-label={"Select " + String(r.getValue((spec.columns || [])[0].key))}
                  checked={r.getIsSelected()}
                  onChange={() => r.toggleSelected()}
                />
              </td>
              {(spec.columns || []).map((c) => (
                <td key={c.key} data-tid={tid + "-cell-" + r.id + "-" + c.key}>
                  {String(r.getValue(c.key))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button
        data-tid={tid + "-prev"}
        type="button"
        aria-label="Previous page"
        disabled={!table.getCanPreviousPage()}
        onClick={() => table.previousPage()}
      >
        Previous page
      </button>
      <button
        data-tid={tid + "-next"}
        type="button"
        aria-label="Next page"
        disabled={!table.getCanNextPage()}
        onClick={() => table.nextPage()}
      >
        Next page
      </button>
    </div>
  );
}

/**
 * Sortable — the one control here that is not Radix.
 *
 * ReUI's Sortable, and every shadcn-family one, is @dnd-kit underneath, so
 * that is the oracle: `SortableContext` + `useSortable`, the default sensors,
 * and the DEFAULT accessibility contract, which is the part worth measuring.
 * dnd-kit gives each item `role="button"`, `aria-roledescription="sortable"`,
 * `aria-pressed` while it is picked up, and announces every stage into a live
 * region — "Picked up draggable item A." and so on. None of that is decoration:
 * for someone who cannot see the list move, it is the whole interaction.
 *
 * Nothing is styled, but the items are given a height, because a drag is
 * resolved against rectangles and zero-height rows collide with nothing. That
 * is geometry the harness needs, not appearance it compares.
 */
function SortableItem({ tid, id, name, disabled }) {
  // No `data-state`: dnd-kit does not set one, and inventing an attribute on
  // the reference side would make the harness compare this file's choices
  // instead of the library's behaviour. Being picked up is observable through
  // `aria-pressed`, which dnd-kit does set.
  const { attributes, listeners, setNodeRef } = useSortable({ id, disabled });
  // Divs, not <ul>/<li>: dnd-kit puts `role="button"` on each item, and a
  // button is not a list item — real <li>s would make axe report a broken list
  // on the REFERENCE side, a violation this file invented rather than measured.
  return (
    <div
      ref={setNodeRef}
      data-tid={tid}
      style={{ height: 40, border: "1px solid #ccc" }}
      {...attributes}
      {...listeners}
    >
      {name}
    </div>
  );
}

function SortableControl({ spec, tid }) {
  const [items, setItems] = React.useState(spec.items.map((it) => it.value));
  const byValue = new Map(spec.items.map((it) => [it.value, it]));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 1 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return;
        setItems((cur) => arrayMove(cur, cur.indexOf(active.id), cur.indexOf(over.id)));
      }}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div data-tid={tid} aria-label={spec.name} style={{ width: 200 }}>
          {items.map((value) => (
            <SortableItem
              key={value}
              id={value}
              tid={tid + "-item-" + value}
              name={byValue.get(value).name}
              disabled={!!byValue.get(value).disabled}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function Control({ spec }) {
  const tid = spec.tid;

  switch (spec.type) {
    case "toggle":
      return (
        <Toggle.Root data-tid={tid} aria-label={spec.name} disabled={!!spec.disabled}>
          {spec.name}
        </Toggle.Root>
      );

    case "collapsible":
      return (
        <Collapsible.Root data-tid={tid} disabled={!!spec.disabled}>
          <Collapsible.Trigger data-tid={tid + "-trigger"}>{spec.name}</Collapsible.Trigger>
          <Collapsible.Content data-tid={tid + "-content"}>{spec.body || ""}</Collapsible.Content>
        </Collapsible.Root>
      );

    case "checkbox":
      return (
        <Checkbox.Root
          data-tid={tid}
          aria-label={spec.name}
          disabled={!!spec.disabled}
          defaultChecked={spec.checked === "indeterminate" ? "indeterminate" : !!spec.checked}
        >
          <Checkbox.Indicator />
        </Checkbox.Root>
      );

    case "switch":
      return (
        <Switch.Root
          data-tid={tid}
          aria-label={spec.name}
          disabled={!!spec.disabled}
          defaultChecked={!!spec.checked}
        >
          <Switch.Thumb />
        </Switch.Root>
      );

    case "radiogroup":
      return (
        <RadioGroup.Root data-tid={tid} aria-label={spec.name} defaultValue={spec.value}>
          {spec.items.map((it) => (
            <RadioGroup.Item
              key={it.value}
              value={it.value}
              data-tid={tid + "-" + it.value}
              aria-label={it.name}
              disabled={!!it.disabled}
            >
              <RadioGroup.Indicator />
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>
      );

    case "tabs":
      return (
        <Tabs.Root data-tid={tid} defaultValue={spec.value}>
          <Tabs.List data-tid={tid + "-list"} aria-label={spec.name}>
            {spec.items.map((it) => (
              <Tabs.Trigger
                key={it.value}
                value={it.value}
                data-tid={tid + "-tab-" + it.value}
                disabled={!!it.disabled}
              >
                {it.name}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {spec.items.map((it) => (
            <Tabs.Content key={it.value} value={it.value} data-tid={tid + "-panel-" + it.value}>
              {it.body || ""}
            </Tabs.Content>
          ))}
        </Tabs.Root>
      );

    case "accordion":
      return (
        <Accordion.Root type="single" collapsible data-tid={tid} defaultValue={spec.value}>
          {spec.items.map((it) => (
            <Accordion.Item key={it.value} value={it.value} data-tid={tid + "-" + it.value}>
              <Accordion.Header>
                <Accordion.Trigger data-tid={tid + "-" + it.value + "-trigger"}>
                  {it.name}
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content data-tid={tid + "-" + it.value + "-content"}>
                {it.body || ""}
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      );

    case "label":
      return (
        <Label.Root data-tid={tid} htmlFor={tid + "-for"}>
          {spec.name}
        </Label.Root>
      );

    case "separator":
      return (
        <Separator.Root
          data-tid={tid}
          orientation={spec.orientation || "horizontal"}
          decorative={!!spec.decorative}
        />
      );

    case "progress":
      return (
        <Progress.Root data-tid={tid} aria-label={spec.name} value={spec.value ?? null} max={spec.max || 100}>
          <Progress.Indicator data-tid={tid + "-indicator"} />
        </Progress.Root>
      );

    case "aspectratio":
      return (
        <div data-tid={tid + "-outer"} style={{ width: (spec.width || 120) + "px" }}>
          <AspectRatio.Root data-tid={tid} ratio={spec.ratio || 1}>
            <span data-tid={tid + "-content"}>{spec.name || ""}</span>
          </AspectRatio.Root>
        </div>
      );

    case "accessibleicon":
      return (
        <button data-tid={tid} type="button" disabled={!!spec.disabled}>
          <AccessibleIcon.Root label={spec.name}>
            <span data-tid={tid + "-glyph"} aria-hidden="true">
              {spec.glyph || "★"}
            </span>
          </AccessibleIcon.Root>
        </button>
      );

    case "avatar":
      return (
        <Avatar.Root data-tid={tid}>
          {spec.src ? <Avatar.Image data-tid={tid + "-image"} src={spec.src} alt={spec.name} /> : null}
          <Avatar.Fallback data-tid={tid + "-fallback"} delayMs={spec.delayMs ?? 0}>
            {spec.fallback || "?"}
          </Avatar.Fallback>
        </Avatar.Root>
      );

    case "togglegroup":
      return (
        <ToggleGroup.Root
          data-tid={tid}
          type="single"
          aria-label={spec.name}
          defaultValue={spec.value}
        >
          {spec.items.map((it) => (
            <ToggleGroup.Item
              key={it.value}
              value={it.value}
              data-tid={tid + "-" + it.value}
              aria-label={it.name}
              disabled={!!it.disabled}
            >
              {it.name}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      );

    case "toolbar":
      return (
        <Toolbar.Root data-tid={tid} aria-label={spec.name}>
          {spec.items.map((it) => (
            <Toolbar.Button
              key={it.value}
              data-tid={tid + "-" + it.value}
              disabled={!!it.disabled}
            >
              {it.name}
            </Toolbar.Button>
          ))}
        </Toolbar.Root>
      );

    case "dialog":
      return (
        <Dialog.Root data-tid={tid}>
          <Dialog.Trigger data-tid={tid + "-trigger"}>{spec.name}</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay data-tid={tid + "-overlay"} />
            <Dialog.Content data-tid={tid + "-content"} aria-describedby={undefined}>
              <Dialog.Title data-tid={tid + "-title"}>{spec.title || spec.name}</Dialog.Title>
              <Dialog.Close data-tid={tid + "-close"}>Close</Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      );

    case "alertdialog":
      return (
        <AlertDialog.Root data-tid={tid}>
          <AlertDialog.Trigger data-tid={tid + "-trigger"}>{spec.name}</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Overlay data-tid={tid + "-overlay"} />
            <AlertDialog.Content data-tid={tid + "-content"}>
              <AlertDialog.Title data-tid={tid + "-title"}>{spec.title || spec.name}</AlertDialog.Title>
              <AlertDialog.Description data-tid={tid + "-description"}>
                {spec.body || ""}
              </AlertDialog.Description>
              <AlertDialog.Cancel data-tid={tid + "-cancel"}>Cancel</AlertDialog.Cancel>
              <AlertDialog.Action data-tid={tid + "-action"}>OK</AlertDialog.Action>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      );

    case "popover":
      return (
        <Popover.Root data-tid={tid}>
          <Popover.Trigger data-tid={tid + "-trigger"}>{spec.name}</Popover.Trigger>
          <Popover.Portal>
            <Popover.Content data-tid={tid + "-content"}>
              {spec.body || ""}
              <button data-tid={tid + "-inner"} type="button">Inner</button>
              <Popover.Close data-tid={tid + "-close"}>Close</Popover.Close>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      );

    case "tooltip":
      // delayDuration 0: a timer would make the oracle depend on the machine.
      return (
        <Tooltip.Provider delayDuration={0} skipDelayDuration={0}>
          <Tooltip.Root data-tid={tid}>
            <Tooltip.Trigger data-tid={tid + "-trigger"}>{spec.name}</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content data-tid={tid + "-content"}>{spec.body || spec.name}</Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      );

    case "hovercard":
      return (
        <HoverCard.Root data-tid={tid} openDelay={0} closeDelay={0}>
          <HoverCard.Trigger data-tid={tid + "-trigger"} href="#">{spec.name}</HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Content data-tid={tid + "-content"}>{spec.body || ""}</HoverCard.Content>
          </HoverCard.Portal>
        </HoverCard.Root>
      );

    case "toast":
      return <ToastControl spec={spec} tid={tid} />;

    // A plain <input>. Deliberately NOT a Radix component: Radix has no text
    // field, because a text field is what the platform already is — and that
    // makes this the one oracle in the gallery that is the browser itself
    // rather than a library's reading of it.
    case "input":
      return (
        <input
          data-tid={tid}
          type={spec.kind || "text"}
          aria-label={spec.name}
          defaultValue={spec.value || ""}
          placeholder={spec.placeholder || undefined}
          readOnly={!!spec.readonly}
          // The NATIVE attribute alone. Adding `aria-required` beside it would
          // be making the oracle agree with this side rather than measuring
          // it: a platform text field publishes required through the
          // attribute, and the snapshot has to read that. `aria-invalid` has
          // no native counterpart — validity state is not this — so there it
          // is the real expression and stays.
          required={!!spec.required}
          aria-invalid={spec.invalid ? "true" : undefined}
          maxLength={spec.maxlength || undefined}
          disabled={!!spec.disabled}
        />
      );

    case "slider":
      // The ONLY styled control here, and only its geometry. Everything else in
      // this host is deliberately unstyled — the harness compares behaviour,
      // not pixels — but a slider's pointer behaviour IS a function of its
      // geometry: with no width its track is 0x0, there is nothing to press,
      // and dragging it measured no change at any position. Sizes, not colours.
      return (
        <Slider.Root
          data-tid={tid}
          style={{ position: "relative", display: "flex", alignItems: "center", width: 200, height: 18 }}
          aria-label={spec.name}
          defaultValue={[spec.value ?? 50]}
          min={spec.min ?? 0}
          max={spec.max ?? 100}
          step={spec.step ?? 1}
          disabled={!!spec.disabled}
        >
          <Slider.Track
            data-tid={tid + "-track"}
            style={{ position: "relative", flexGrow: 1, height: 6, background: "#e2e8f0" }}
          >
            <Slider.Range
              data-tid={tid + "-range"}
              style={{ position: "absolute", height: "100%", background: "#2563eb" }}
            />
          </Slider.Track>
          <Slider.Thumb
            data-tid={tid + "-thumb"}
            aria-label={spec.name}
            style={{ display: "block", width: 18, height: 18, background: "#fff", border: "1px solid #2563eb", borderRadius: 999 }}
          />
        </Slider.Root>
      );

    case "dropdownmenu":
      return (
        <DropdownMenu.Root data-tid={tid}>
          <DropdownMenu.Trigger data-tid={tid + "-trigger"}>{spec.name}</DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content data-tid={tid + "-content"}>
              {spec.items.map((it) => renderMenuItem(DropdownMenu, tid, it))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      );

    case "contextmenu":
      return (
        <ContextMenu.Root data-tid={tid}>
          <ContextMenu.Trigger data-tid={tid + "-trigger"}>{spec.name}</ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Content data-tid={tid + "-content"}>
              {spec.items.map((it) => (
                <ContextMenu.Item
                  key={it.value}
                  data-tid={tid + "-item-" + it.value}
                  disabled={!!it.disabled}
                >
                  {it.name}
                </ContextMenu.Item>
              ))}
            </ContextMenu.Content>
          </ContextMenu.Portal>
        </ContextMenu.Root>
      );

    case "sortable":
      return <SortableControl spec={spec} tid={tid} />;

    case "table":
      return <TableControl spec={spec} tid={tid} />;

    case "tree":
      return <TreeControl spec={spec} tid={tid} />;

    case "resizable":
      return <ResizableGroup node={spec} tid={tid} />;

    /**
     * A breadcrumb. NOT a library: Radix has no breadcrumb and neither does
     * anything else ReUI uses, so this markup is written to the HTML and ARIA
     * specs — which means it is a SECOND IMPLEMENTATION and not an independent
     * oracle. A spec over it catches the two sides disagreeing; it cannot
     * catch both being wrong. `behaviours.json` says so too.
     *
     * The collapse is driven by the fixture's stated widths on both sides,
     * because two layout engines have no reason to agree about how wide
     * "Components" is and the rule is what is under test.
     */
    case "breadcrumb": {
      const items = spec.items || [];
      const n = items.length;
      const sepW = spec.separatorWidth ?? 20;
      const dotsW = spec.ellipsisWidth ?? 24;
      const avail = spec.available ?? 0;
      const widthAll = items.reduce((a, it) => a + (it.width ?? 0), 0) + sepW * Math.max(0, n - 1);
      const widthTail = (k) =>
        (items[0].width ?? 0) + dotsW + sepW * (k + 1) +
        items.slice(n - k).reduce((a, it) => a + (it.width ?? 0), 0);
      const tail = n <= 2 || avail <= 0 || widthAll <= avail ? n : widthTail(2) <= avail ? 2 : 1;
      const firstShown = n - tail;
      const parts = [];
      let drawn = 0;
      items.forEach((it, i) => {
        if (!(i === 0 || i >= firstShown)) return;
        if (drawn > 0) {
          parts.push(
            <li key={"s" + drawn} data-tid={tid + "-sep-" + (drawn - 1)} role="none" aria-hidden="true">/</li>,
          );
        }
        if (i === firstShown && firstShown > 1) {
          parts.push(
            <li key="dots-li" data-tid={tid + "-ellipsis-li"}>
              <span data-tid={tid + "-ellipsis"} aria-label="More">…</span>
            </li>,
          );
          parts.push(
            <li key={"s" + drawn + "b"} data-tid={tid + "-sep-" + drawn} role="none" aria-hidden="true">/</li>,
          );
          drawn += 1;
        }
        const last = i === n - 1;
        parts.push(
          <li key={it.value} data-tid={tid + "-item-" + it.value + "-li"}>
            {last ? (
              <span
                data-tid={tid + "-item-" + it.value}
                role="link"
                aria-disabled="true"
                aria-current="page"
              >
                {it.name}
              </span>
            ) : (
              <a data-tid={tid + "-item-" + it.value} href="#">{it.name}</a>
            )}
          </li>,
        );
        drawn += 1;
      });
      return (
        <nav data-tid={tid} aria-label={spec.name || "breadcrumb"}>
          <ol data-tid={tid + "-list"}>{parts}</ol>
        </nav>
      );
    }

    /**
     * A bar of menus. The parts follow the same rule the rest do — `x-<value>`
     * for a menu, and its trigger and content beneath it — so a spec names a
     * menu by the value it was given and never by position.
     */
    case "menubar":
      return (
        <Menubar.Root data-tid={tid} aria-label={spec.name}>
          {spec.items.map((menu) => (
            <Menubar.Menu key={menu.value}>
              <Menubar.Trigger
                data-tid={tid + "-" + menu.value + "-trigger"}
                disabled={!!menu.disabled}
              >
                {menu.name}
              </Menubar.Trigger>
              <Menubar.Portal>
                <Menubar.Content data-tid={tid + "-" + menu.value + "-content"}>
                  {(menu.items || []).map((it) => (
                    <Menubar.Item
                      key={it.value}
                      data-tid={tid + "-" + menu.value + "-item-" + it.value}
                      disabled={!!it.disabled}
                    >
                      {it.name}
                    </Menubar.Item>
                  ))}
                </Menubar.Content>
              </Menubar.Portal>
            </Menubar.Menu>
          ))}
        </Menubar.Root>
      );

    case "navigationmenu":
      return (
        <NavigationMenu.Root data-tid={tid} aria-label={spec.name}>
          <NavigationMenu.List data-tid={tid + "-list"}>
            {spec.items.map((it) => (
              // Tagged, because it is a real `<li>` and the list needs
              // listitem children to be a valid list. Untagged it was absent
              // from the trace entirely, so neither side could be wrong about
              // it — and axe was the only thing that noticed.
              <NavigationMenu.Item key={it.value} data-tid={tid + "-" + it.value + "-trigger-li"}>
                <NavigationMenu.Trigger data-tid={tid + "-" + it.value + "-trigger"}>
                  {it.name}
                </NavigationMenu.Trigger>
                <NavigationMenu.Content data-tid={tid + "-" + it.value + "-content"}>
                  {(it.links || []).map((l) => (
                    <NavigationMenu.Link
                      key={l.value}
                      data-tid={tid + "-" + it.value + "-link-" + l.value}
                      href="#"
                    >
                      {l.name}
                    </NavigationMenu.Link>
                  ))}
                </NavigationMenu.Content>
              </NavigationMenu.Item>
            ))}
          </NavigationMenu.List>
          <NavigationMenu.Viewport data-tid={tid + "-viewport"} />
        </NavigationMenu.Root>
      );

    /**
     * A scrolling box. The content is taller than the viewport on purpose —
     * a scroll area with nothing to scroll has no scrollbar and no behaviour.
     */
    case "scrollarea":
      return (
        <ScrollArea.Root data-tid={tid} style={{ height: 120, width: 200, overflow: "hidden" }}>
          <ScrollArea.Viewport
            data-tid={tid + "-viewport"}
            style={{ width: "100%", height: "100%" }}
          >
            <div data-tid={tid + "-content"} style={{ height: 480 }}>
              {(spec.items || []).map((it) => (
                <div key={it.value} data-tid={tid + "-item-" + it.value} style={{ height: 80 }}>
                  {it.name}
                </div>
              ))}
            </div>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" data-tid={tid + "-scrollbar"}>
            <ScrollArea.Thumb data-tid={tid + "-thumb"} />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      );

    case "select":
      return (
        <Select.Root defaultValue={spec.value}>
          <Select.Trigger data-tid={tid + "-trigger"} aria-label={spec.name}>
            <Select.Value data-tid={tid + "-value"} />
          </Select.Trigger>
          <Select.Portal>
            <Select.Content data-tid={tid + "-content"}>
              <Select.Viewport>
                {spec.items.map((it) => (
                  <Select.Item
                    key={it.value}
                    value={it.value}
                    data-tid={tid + "-item-" + it.value}
                    disabled={!!it.disabled}
                  >
                    <Select.ItemText>{it.name}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      );

    default:
      throw new Error("unknown control type: " + spec.type);
  }
}

export function App({ fixture }) {
  return (
    <div>
      {fixture.controls.map((c) => (
        <Control key={c.tid} spec={c} />
      ))}
    </div>
  );
}

// Auto-mount only when the headless harness injected a fixture. The playground
// imports Control/App instead, so both hosts render the same Radix tree.
if (typeof window !== "undefined" && window.__FIXTURE__) {
  createRoot(document.getElementById("root")).render(<App fixture={window.__FIXTURE__} />);
  window.__READY__ = true;
}
