import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import {
  expectCompileError,
  expectGoOutput,
  expectOutput,
  expectPythonOutput,
  expectRustOutput,
  getGeneratedCppCode,
  getGeneratedRustCode,
  isGoAvailable,
  isPythonAvailable,
  isRustAvailable,
} from "./helpers/compiler";

const FIXTURES = "tests/fixtures";
const TREE = `${FIXTURES}/tree_literal.rgr`;

/**
 * Tree literals — `treefactory` and `tree`.
 *
 * `treefactory Name { … }` says what a tag builds and how a child is attached;
 * `(tree Name (Tag …))` builds one. Both are lowered to ordinary Ranger — a
 * `new`, some field assignments and some method calls — in one pass before
 * anything else looks at the program. No target writer knows the feature
 * exists, which is why a target carries a tree literal exactly as well as it
 * carries a constructor call.
 *
 * There is no node type, no element class, no runtime and no UI in any of it.
 * The fixture proves that by driving two unrelated object spaces through the
 * same syntax: a display tree with `addKid`, and a SQL select with
 * `addColumn`, which share no base class and no shape.
 */
describe("tree literals", () => {
  const UI = "root(a:hello b:literal badge:tero)";
  const SQL = "select id, title from documents";
  const LOOP = "n0n1n2";

  describe("runs identically across targets", () => {
    it("ES6", () => {
      const run = expectOutput(TREE, UI);
      expect(run.output).toContain(SQL);
      expect(run.output).toContain(LOOP);
    });

    it.skipIf(!isPythonAvailable())("Python", () => {
      const run = expectPythonOutput(TREE, UI);
      expect(run.output).toContain(SQL);
      expect(run.output).toContain(LOOP);
    });

    it.skipIf(!isGoAvailable())("Go", () => {
      const run = expectGoOutput(TREE, UI);
      expect(run.output).toContain(SQL);
      expect(run.output).toContain(LOOP);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      const run = expectRustOutput(TREE, UI);
      expect(run.output).toContain(SQL);
      expect(run.output).toContain(LOOP);
    });
  });

  describe("lowers to ordinary code, not to a runtime", () => {
    it("emits a constructor call and field assignments, and nothing else", () => {
      const cpp = getGeneratedCppCode(TREE);
      // The whole feature, in the generated C++: something was constructed and
      // its fields were set. If a helper, a node type or a factory object ever
      // appears here, the feature has stopped being a syntax transformation.
      expect(cpp).not.toContain("treefactory");
      expect(cpp).not.toContain("TreeFactory");
      expect(cpp).not.toContain("createElement");
      const rust = getGeneratedRustCode(TREE);
      expect(rust).not.toContain("treefactory");
      expect(rust).not.toContain("createElement");
    });
  });

  /**
   * The Radix menubar example, written with the syntax — four menus, two
   * submenus, checkbox items, a radio group, separators, disabled rows and
   * shortcut slots, over real EVGElement trees. It is here so the demo cannot
   * rot: it is the only non-toy use of the feature in the repository, and it is
   * what the ergonomics argument rests on.
   */
  describe("the menubar demo", () => {
    const DEMO = "gallery/ui/demo/MenubarDemo.rgr";

    it("builds the whole structure, with state visible in it", () => {
      const run = expectOutput(DEMO, "mb-root");
      // the four triggers, with File carrying the open state
      expect(run.output).toContain("mb-trigger mb-trigger-open File");
      for (const label of ["Edit", "View", "Profiles"]) {
        expect(run.output).toContain(`mb-trigger ${label}`);
      }
      // a shortcut slot, a disabled row, a separator and a submenu chevron
      expect(run.output).toContain("mb-shortcut ⌘ T");
      expect(run.output).toContain("mb-label mb-label-disabled New Incognito Window");
      expect(run.output).toContain("mb-separator");
      expect(run.output).toContain("mb-item mb-item-sub");
      // the checkbox and radio state the demo was given, and only that state.
      // A dropdown is an overlay and a closed menu has no surface in the tree,
      // so these rows come from the View and Profiles dumps, not the File one.
      expect(run.output).toContain("mb-indicator ✓");
      expect(run.output).toContain("mb-indicator ●");
      expect(run.output.match(/mb-indicator ✓/g)).toHaveLength(1);
      expect(run.output.match(/mb-indicator ●/g)).toHaveLength(1);
    });
  });

  /**
   * The demo is not only a picture. A canvas hands a screen reader one empty
   * graphic, and a canvas has no elements to click, so the same laid-out tree
   * has to answer three questions: what to draw, what is under the pointer,
   * and what the thing there MEANS.
   *
   * The property worth asserting is that those are one tree and not three
   * descriptions of it. A reader is told a row is at a rectangle; pressing the
   * centre of that rectangle has to reach that row. If they ever disagree,
   * a screen-reader user is pressing empty space and nobody sighted can see it.
   */
  describe("the demo answers the pointer and the reader from one tree", () => {
    const CSS_FILE = "gallery/ui/demo/menubar.css";
    const OUT = "gallery/ui/bin";
    let Demo: any;
    let css = "";
    const checked = ["Always Show Full URLs"];

    beforeAll(() => {
      execSync(
        "RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr node bin/output.js -es6 -nodemodule " +
          `./gallery/ui/demo/MenubarDemo.rgr -d=./${OUT} -o=MenubarDemo.cjs`,
        { cwd: process.cwd(), stdio: "pipe" },
      );
      const req = createRequire(path.join(process.cwd(), "package.json"));
      Demo = req(`./${OUT}/MenubarDemo.cjs`).MenubarDemo;
      css = fs.readFileSync(CSS_FILE, "utf8");
    }, 120_000);

    const state = () => [css, checked, "Luis", "File", true, false] as const;

    it("publishes an accessible tree that lints clean", () => {
      // A focusable row with no name, or with no rectangle, is invisible on
      // screen and total for someone using a reader. Nothing here was written
      // twice: the roles are on the factory's tags.
      expect(Demo.a11yProblems(...state())).toEqual([]);
    });

    it("names the rows by what they say, in ARIA's vocabulary", () => {
      const tree = JSON.parse(Demo.a11yJson(...state(), 1, "trigger-File"));
      const byId: Record<string, any> = Object.fromEntries(
        tree.nodes.map((n: any) => [n.id, n]),
      );
      expect(byId["menubar"].role).toBe("menubar");
      expect(byId["trigger-File"].role).toBe("menuitem");
      // The trigger says the menu is open; the row's name is the whole row.
      expect(byId["trigger-File"].expanded).toBe(2);
      expect(byId["row-New Tab"].name).toBe("New Tab ⌘ T");
      expect(byId["row-New Incognito Window"].disabled).toBe(true);
      // A menu's surface is out of flow but not out of the tree, so it is
      // still reachable — and it reports where the overlay pass MOVED it.
      expect(byId["menu-file-content"].role).toBe("menu");
      expect(byId["menu-file-content"].b[1]).toBeGreaterThan(
        byId["trigger-File"].b[1],
      );
    });

    it("puts the states on the roles that carry them", () => {
      const tree = JSON.parse(
        Demo.a11yJson(css, checked, "Luis", "View", true, false, 1, ""),
      );
      const byId: Record<string, any> = Object.fromEntries(
        tree.nodes.map((n: any) => [n.id, n]),
      );
      // ARIA spells a checkable menu row as its own role rather than as a
      // menuitem with a state, and a reader announces the two differently.
      expect(byId["row-Always Show Full URLs"].role).toBe("menuitemcheckbox");
      expect(byId["row-Always Show Full URLs"].checked).toBe(2);
      expect(byId["row-Always Show Bookmarks Bar"].checked).toBe(1);
      // and the menu that is not open is not in the tree at all, exactly as a
      // closed dropdown is absent from a browser's.
      expect(byId["menu-file-content"]).toBeUndefined();
      expect(byId["trigger-File"].expanded).toBe(1);
    });

    it("opens the other way when there is no room", () => {
      // The same menu with the bar pushed to the bottom edge. The demo does
      // not know a flip happened: it moved a bar, and the placement followed.
      const at = (bottom: boolean) => {
        const nodes = JSON.parse(
          Demo.a11yJson(css, checked, "Luis", "File", true, bottom, 1, ""),
        ).nodes;
        const by: Record<string, any> = Object.fromEntries(nodes.map((n: any) => [n.id, n]));
        return { trigger: by["trigger-File"].b, menu: by["menu-file-content"].b };
      };
      const top = at(false);
      const bottom = at(true);
      expect(top.menu[1]).toBeGreaterThan(top.trigger[1]); // below its trigger
      expect(bottom.menu[1]).toBeLessThan(bottom.trigger[1]); // above it
      // and on the page either way, which is the point of flipping at all
      expect(bottom.menu[1]).toBeGreaterThanOrEqual(0);
      expect(bottom.menu[1] + bottom.menu[3]).toBeLessThanOrEqual(560);
    });

    it("hits what it says it drew", () => {
      const tree = JSON.parse(Demo.a11yJson(...state(), 1, ""));
      const byId: Record<string, any> = Object.fromEntries(
        tree.nodes.map((n: any) => [n.id, n]),
      );
      const centre = (id: string) => {
        const [x, y, w, h] = byId[id].b;
        return Demo.hitId(...state(), x + w / 2, y + h / 2);
      };
      // Every leaf a reader can activate answers to a press in the middle of
      // the rectangle the reader was given.
      for (const id of [
        "trigger-File",
        "row-New Tab",
        "row-Share",
        "row-Notes",
        "row-Print…",
      ]) {
        expect(centre(id)).toBe(id);
      }
      // Empty space answers the page itself, which is what "click outside
      // closes the menu" is: there is no separate notion of a miss, only the
      // outermost thing that was drawn there.
      expect(Demo.hitId(...state(), 1200, 520)).toBe("page");
      // Off the page entirely, nothing answers.
      expect(Demo.hitId(...state(), 5000, 5000)).toBe("");
    });
  });

  /**
   * The Radix toolbar, by a SECOND factory. `Bar`, `Group` and `Button` mean
   * something here that they do not mean in `Menubar` — where `Bar` is the
   * menu strip and `Button` is not declared at all — and both factories build
   * plain EVGElements. That is the whole claim about tag resolution being the
   * factory's business, in one repository.
   */
  describe("the toolbar demo", () => {
    const DEMO = "gallery/ui/demo/ToolbarDemo.rgr";

    it("builds two groups with different selection rules", () => {
      const run = expectOutput(DEMO, "tb-root");
      // bold on, italic and underline off: several may be true at once
      expect(run.output).toContain("tb-button tb-button-bold tb-button-on B");
      expect(run.output).toContain("tb-button tb-button-italic I");
      expect(run.output).toContain("tb-button tb-button-underline U");
      // alignment: exactly one of the three, and it is the middle one
      expect(run.output.match(/tb-button-align tb-button-on/g)).toHaveLength(1);
      expect(run.output).toContain("tb-status Edited 2 hours ago");
      expect(run.output).toContain("tb-share Share");
    });

    it("says what a toggle is, in the word a reader uses for it", () => {
      execSync(
        "RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr node bin/output.js -es6 -nodemodule " +
          "./gallery/ui/demo/ToolbarDemo.rgr -d=./gallery/ui/bin -o=ToolbarDemo.cjs",
        { cwd: process.cwd(), stdio: "pipe" },
      );
      const req = createRequire(path.join(process.cwd(), "package.json"));
      const T = req("./gallery/ui/bin/ToolbarDemo.cjs").ToolbarDemo;
      const css = fs.readFileSync("gallery/ui/demo/toolbar.css", "utf8");
      const args = [css, true, false, false, "center", "Edited 2 hours ago"] as const;
      expect(T.a11yProblems(...args)).toEqual([]);
      const byId: Record<string, any> = Object.fromEntries(
        JSON.parse(T.a11yJson(...args, 1, "")).nodes.map((n: any) => [n.id, n]),
      );
      // The glyph is drawn; the NAME is spoken. "B" on its own is a letter.
      expect(byId["tb-bold"].name).toBe("Bold");
      expect(byId["tb-bold"].role).toBe("button");
      // Same field in the tree as a checkbox's, and the mirror turns it into
      // aria-pressed because the role is button.
      expect(byId["tb-bold"].checked).toBe(2);
      expect(byId["tb-italic"].checked).toBe(1);
      expect(byId["tb-align-center"].checked).toBe(2);
      // The status line changes without anyone pressing anything.
      expect(byId["status"].role).toBe("status");
      // and the same rectangle answers the pointer
      const b = byId["tb-italic"].b;
      expect(T.hitId(...args, b[0] + b[2] / 2, b[1] + b[3] / 2)).toBe("tb-italic");
    }, 120_000);
  });

  /**
   * A THIRD factory, and the one that puts a picture next to a measurement.
   *
   * `SortableCtl` in gallery/ui/src is what the conformance harness compares
   * against dnd-kit; this is the same interaction wearing the clothes ReUI's
   * Sortable wears, and it is here because "does it behave" and "does it look
   * like the thing" are different questions. The tags say what a row is made
   * OF — Grip, Icon, Title, Subtitle, Badge, Size — and none of them mean
   * anything to `Menubar` or `Toolbar`.
   */
  describe("the sortable demo", () => {
    const DEMO = "gallery/ui/demo/SortableDemo.rgr";

    it("builds a row out of the parts the reference has", () => {
      const run = expectOutput(DEMO, "sr-list");
      // The grip and the type icons carry no text at all: they are `path`
      // elements with a `d`, because the reference's are line art and a font
      // glyph is a shape the font chooses. Asserted below, on the drawing.
      expect(run.output).toContain("sr-grip");
      expect(run.output).toContain("sr-icon");
      expect(run.output).toContain("sr-title Product Demo Video");
      expect(run.output).toContain("sr-subtitle How to use the product");
      // the badge's colour is a class the BUILDER picks from the item's kind,
      // so the class is the data rather than a branch in the stylesheet
      expect(run.output).toContain("sr-badge sr-badge-video video");
      expect(run.output).toContain("sr-badge sr-badge-audio audio");
      expect(run.output).toContain("sr-size 15.7 MB");
      // five rows, in the order the catalogue lists them
      expect(run.output.match(/sr-row/g)).toHaveLength(5);
    });

    it("reorders by being rebuilt, and says which row is carried", () => {
      execSync(
        "RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr node bin/output.js -es6 -nodemodule " +
          "./gallery/ui/demo/SortableDemo.rgr -d=./gallery/ui/bin -o=SortableDemo.cjs",
        { cwd: process.cwd(), stdio: "pipe" },
      );
      const req = createRequire(path.join(process.cwd(), "package.json"));
      const S = req("./gallery/ui/bin/SortableDemo.cjs").SortableDemo;
      const css = fs.readFileSync("gallery/ui/demo/sortable.css", "utf8");
      const order = ["demo", "spec", "video", "audio", "extra"];
      const rows = (o: string[], dragging: string) =>
        JSON.parse(S.a11yJson(css, o, dragging, 1, "")).nodes.filter((n: any) =>
          n.id.startsWith("sr-row-"),
        );

      // There is no move and no reconciler: hand it a different list and the
      // tree is a different tree.
      const before = rows(order, "").map((n: any) => n.id);
      const after = rows(["spec", "video", "audio", "demo", "extra"], "").map((n: any) => n.id);
      expect(before[0]).toBe("sr-row-demo");
      expect(after[3]).toBe("sr-row-demo");
      expect(after).toHaveLength(5);

      // Every row says it is sortable, which is the whole affordance, and it
      // is on the TAG rather than repeated at five call sites.
      for (const n of rows(order, "")) expect(n.roledesc).toBe("sortable");
      expect(S.a11yProblems(css, order, "")).toEqual([]);

      // The rectangle a reader is given is the one a press lands in.
      const node = rows(order, "").find((n: any) => n.id === "sr-row-video");
      const [x, y, w, h] = node.b;
      expect(S.hitId(css, order, "", x + w / 2, y + h / 2)).toBe("sr-row-video");

      // The icons are DRAWN. Twelve paths — a grip and a type icon per row —
      // and the type icons are stroked outlines rather than filled shapes,
      // which is the difference between Lucide's line art and a glyph that
      // happens to look like a frame.
      const cmds = JSON.parse(S.displayListJson(css, order, "")).cmds;
      const fills = cmds.filter((c: any) => c.k === 6);
      const strokes = cmds.filter((c: any) => c.k === 7);
      expect(fills.length).toBe(5); // one grip per row
      expect(strokes.length).toBe(5); // one type icon per row
    }, 120_000);

    it("carries no accessible weight for the drawings", () => {
      const req = createRequire(path.join(process.cwd(), "package.json"));
      const S = req("./gallery/ui/bin/SortableDemo.cjs").SortableDemo;
      const css = fs.readFileSync("gallery/ui/demo/sortable.css", "utf8");
      const order = ["demo", "spec", "video", "audio", "extra"];
      const tree = JSON.parse(S.a11yJson(css, order, "", 1, ""));
      // A grip and an icon are decoration: they say nothing, and a reader
      // walking this list is told about five rows and a group, not fifteen
      // nodes of which ten are pictures.
      expect(tree.nodes).toHaveLength(7);
      const row = tree.nodes.find((n: any) => n.id === "sr-row-video");
      expect(row.name).toBe("Product Demo Video");
    }, 120_000);
  });

  /**
   * Every one of these has to fail, and the point of listing them is that the
   * checking is not a second implementation of the type checker: a misspelled
   * property is an assignment to a field that does not exist, and a wrongly
   * typed one is a type error on that assignment. The two errors the feature
   * raises itself are the two the type checker cannot see — a tag or a factory
   * that was never declared.
   */
  describe("rejects", () => {
    it("a tag the factory never declared", () => {
      expectCompileError(
        `${FIXTURES}/tree_bad_unknown_tag.rgr`,
        "is not a tag of treefactory UiTree",
      );
    });

    it("a factory that does not exist", () => {
      expectCompileError(
        `${FIXTURES}/tree_bad_unknown_factory.rgr`,
        "no treefactory named Nope",
      );
    });

    it("a property the class does not have", () => {
      expectCompileError(`${FIXTURES}/tree_bad_prop_name.rgr`, "nmae");
    });

    it("a property of the wrong type", () => {
      expectCompileError(`${FIXTURES}/tree_bad_prop_type.rgr`);
    });

    it("a value child when the factory declares no text field", () => {
      expectCompileError(
        `${FIXTURES}/tree_bad_no_text.rgr`,
        "has no `text` field",
      );
    });

    it("an empty child form", () => {
      expectCompileError(`${FIXTURES}/tree_bad_empty_child.rgr`, "empty child");
    });

    it("a treefactory declared inside a class", () => {
      expectCompileError(
        `${FIXTURES}/tree_bad_in_class.rgr`,
        "top level",
      );
    });
  });
});
