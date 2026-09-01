/**
 * Scenes the WebGL / DOM bench runs.
 *
 * Two families, and they answer different questions:
 *
 *   showcase-*   the six demos on /gallery/ui/demo — what that page actually
 *                paints. EVG only: the Radix side is a different tree, and
 *                comparing them would measure decoration, not the engine.
 *
 *   kit-*        the same fixture, both adapters. UiHost controllers on one
 *                side, the conformance Radix / TanStack / dnd-kit host on the
 *                other. This is the fair comparison.
 *
 * `n` is how many records / items / controls. A table with pageSize < n only
 * paints a page; the rest lives in the model. That split is the point of the
 * table-model series: how much data the controller can hold while the frame
 * stays a page.
 */

export const COLUMNS = [
  { key: "name", label: "Name", numeric: false, sortable: true },
  { key: "email", label: "Email", numeric: false, sortable: true },
  { key: "role", label: "Role", numeric: false, sortable: true },
  { key: "status", label: "Status", numeric: false, sortable: false },
  { key: "spend", label: "Spend", numeric: true, sortable: true },
];

const ROLES = ["Owner", "Admin", "Member"];
const STATUS = ["active", "invited", "paused"];

export function makeRows(n) {
  const rows = [];
  for (let i = 0; i < n; i++) {
    rows.push({
      key: "r" + i,
      cells: [
        "Person " + String(i).padStart(4, "0"),
        "p" + i + "@lab.example",
        ROLES[i % 3],
        STATUS[i % 3],
        String((i * 17) % 5000),
      ],
    });
  }
  return rows;
}

export function makeItems(n, prefix) {
  const items = [];
  for (let i = 0; i < n; i++) {
    items.push({
      value: prefix + i,
      name: "Item " + i,
      body: "Body text for section " + i + ".",
    });
  }
  return items;
}

export function fixtureFor(scene) {
  switch (scene.kind) {
    case "table":
      return {
        controls: [
          {
            type: "table",
            tid: "tbl",
            name: "Team members",
            pageSize: scene.pageSize,
            columns: COLUMNS,
            rows: makeRows(scene.n),
          },
        ],
      };
    case "sortable":
      return {
        controls: [
          {
            type: "sortable",
            tid: "sr",
            name: "Files",
            items: makeItems(scene.n, "f"),
          },
        ],
      };
    case "accordion":
      return {
        controls: [
          {
            type: "accordion",
            tid: "ac",
            name: "Sections",
            value: "i0",
            items: makeItems(scene.n, "i"),
          },
        ],
      };
    case "checkbox":
      return {
        controls: makeItems(scene.n, "cb").map((it) => ({
          type: "checkbox",
          tid: it.value,
          name: it.name,
        })),
      };
    default:
      throw new Error("no fixture for " + scene.id);
  }
}

/** What an incremental update presses. Same tid on both sides. */
export function actionTid(scene) {
  if (scene.action === "sort") return "tbl-col-name";
  if (scene.action === "toggle" && scene.kind === "accordion") return "ac-i1-trigger";
  if (scene.action === "toggle" && scene.kind === "checkbox") return "cb0";
  return "";
}

export const SCENES = [
  { id: "showcase-menubar", group: "showcase", evg: "showcase", showcase: "menubar" },
  { id: "showcase-toolbar", group: "showcase", evg: "showcase", showcase: "toolbar" },
  { id: "showcase-sortable", group: "showcase", evg: "showcase", showcase: "sortable" },
  { id: "showcase-table", group: "showcase", evg: "showcase", showcase: "table" },
  { id: "showcase-dropdown", group: "showcase", evg: "showcase", showcase: "dropdown" },
  { id: "showcase-motion", group: "showcase", evg: "showcase", showcase: "motion" },

  { id: "kit-table-vis-20", group: "table-visible", kind: "table", n: 20, pageSize: 20, action: "sort" },
  { id: "kit-table-vis-50", group: "table-visible", kind: "table", n: 50, pageSize: 50, action: "sort" },
  { id: "kit-table-vis-100", group: "table-visible", kind: "table", n: 100, pageSize: 100, action: "sort" },
  { id: "kit-table-vis-200", group: "table-visible", kind: "table", n: 200, pageSize: 200, action: "sort" },

  { id: "kit-table-model-200", group: "table-model", kind: "table", n: 200, pageSize: 20, action: "sort" },
  { id: "kit-table-model-1000", group: "table-model", kind: "table", n: 1000, pageSize: 20, action: "sort" },
  { id: "kit-table-model-5000", group: "table-model", kind: "table", n: 5000, pageSize: 20, action: "sort" },

  { id: "kit-sortable-10", group: "sortable", kind: "sortable", n: 10 },
  { id: "kit-sortable-50", group: "sortable", kind: "sortable", n: 50 },
  { id: "kit-sortable-100", group: "sortable", kind: "sortable", n: 100 },

  { id: "kit-accordion-20", group: "accordion", kind: "accordion", n: 20, action: "toggle" },
  { id: "kit-accordion-50", group: "accordion", kind: "accordion", n: 50, action: "toggle" },
  { id: "kit-accordion-100", group: "accordion", kind: "accordion", n: 100, action: "toggle" },

  { id: "kit-checkbox-50", group: "checkbox", kind: "checkbox", n: 50, action: "toggle" },
  { id: "kit-checkbox-200", group: "checkbox", kind: "checkbox", n: 200, action: "toggle" },
  { id: "kit-checkbox-500", group: "checkbox", kind: "checkbox", n: 500, action: "toggle" },
];

export const PAGE = { width: 900, height: 600 };
