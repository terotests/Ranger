/**
 * The multi-file tools: go to definition across Import / pkg:, and
 * diagnostics from the checkout's own compiler, mapped to the right file.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ProjectIndex, wordAt, resolveImport } from "../projectIndex";
import { parseCompilerOutput, runRealCheck, findRangerRoot } from "../realCheck";

const RANGER = path.resolve(__dirname, "..", "..", "..", "..");
let dir = "";

beforeAll(() => {
  // A tiny project: a library under lib/ reached through ranger.json, a
  // helper reached by a relative Import, and a main file using both.
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "ranger-lsp-test-"));
  fs.mkdirSync(path.join(dir, "lib", "kit"), { recursive: true });
  fs.mkdirSync(path.join(dir, "app", "src"), { recursive: true });
  fs.writeFileSync(
    path.join(dir, "app", "ranger.json"),
    JSON.stringify({ name: "app", dependencies: { kit: { path: "../lib/kit" } } })
  );
  fs.writeFileSync(path.join(dir, "lib", "kit", "ranger.json"), JSON.stringify({ name: "kit" }));
  fs.writeFileSync(
    path.join(dir, "lib", "kit", "Box.rgr"),
    "class Box {\n    def width:int 0\n    sfn make:Box () {\n        return (new Box())\n    }\n}\n"
  );
  fs.writeFileSync(
    path.join(dir, "app", "src", "Helper.rgr"),
    'Import "pkg:kit/Box.rgr"\n\nclass Helper {\n    fn area:int (b:Box) {\n        return (b.width * 2)\n    }\n    fn card:void () {\n    }\n}\n'
  );
  fs.writeFileSync(
    path.join(dir, "app", "Main.rgr"),
    'Import "src/Helper.rgr"\n\nclass Main {\n    def h:Helper (new Helper())\n    fn run:int () {\n        def b:Box (Box.make())\n        return (h.area(b))\n    }\n}\n'
  );
});

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("ProjectIndex", () => {
  it("follows relative and pkg: imports", () => {
    const idx = new ProjectIndex(path.join(dir, "app", "Main.rgr"));
    expect(idx.files.map((f) => path.basename(f))).toEqual(["Main.rgr", "Helper.rgr", "Box.rgr"]);
    expect(resolveImport("pkg:kit/Box.rgr", path.join(dir, "app", "src", "Helper.rgr"))).toBe(
      path.join(dir, "lib", "kit", "Box.rgr")
    );
  });

  it("finds a class, a static method by class name, and a field", () => {
    const main = path.join(dir, "app", "Main.rgr");
    const idx = new ProjectIndex(main);
    const box = idx.definition("Box", "", main);
    expect(box[0].kind).toBe("class");
    expect(path.basename(box[0].file)).toBe("Box.rgr");
    const make = idx.definition("make", "Box", main);
    expect(make).toHaveLength(1);
    expect(make[0].line).toBe(2);
    const width = idx.definition("width", "b", main);
    expect(width[0].kind).toBe("field");
    expect(width[0].container).toBe("Box");
  });

  it("uses the editor's unsaved text for the current file", () => {
    const main = path.join(dir, "app", "Main.rgr");
    const text = fs.readFileSync(main, "utf8") + "\nclass Fresh {\n}\n";
    const idx = new ProjectIndex(main, text);
    expect(idx.definition("Fresh", "", main)[0].file).toBe(main);
  });

  it("sends a component tag to its function", () => {
    const f = path.join(dir, "app", "Comp.rgr");
    fs.writeFileSync(
      f,
      "class Page {\n    sfn star:EVGElement (n:int) {\n        return (new EVGElement())\n    }\n    treefactory Ui {\n        component Star Page.star\n    }\n}\n"
    );
    const idx = new ProjectIndex(f);
    const hit = idx.definition("Star", "", f);
    expect(hit[0].name).toBe("star");
    expect(hit[0].line).toBe(1);
  });

  it("reads the word and its qualifier under the cursor", () => {
    expect(wordAt("        def b:Box (Box.make())", 24)).toEqual({ word: "make", qualifier: "Box" });
    expect(wordAt("    return (h.area(b))", 15)).toEqual({ word: "area", qualifier: "h" });
    expect(wordAt("   ", 1)).toBeNull();
  });
});

describe("compiler diagnostics", () => {
  it("parses rgrc's messages", () => {
    const out = [
      "../src/RatingCtl.rgr:60:8",
      "",
      "  [FAIL] Variable was assigned an incompatible type. Types were int vs string",
      "",
      "    60 │         def q:int \"s\"",
      "",
      "/abs/Main.rgr:3:4",
      "",
      "  [FAIL] WriteVREF -> Undefined variable foo",
      "[FAIL] Compilation FAILED (2 errors)",
    ].join("\n");
    const m = parseCompilerOutput(out);
    expect(m).toHaveLength(2);
    expect(m[0]).toMatchObject({ file: "../src/RatingCtl.rgr", line: 59, column: 8, severity: "error" });
    expect(m[1].message).toBe("WriteVREF -> Undefined variable foo");
  });

  it("finds the checkout for a file inside it", () => {
    expect(findRangerRoot(path.join(RANGER, "compiler", "VirtualCompiler.rgr"))).toBe(RANGER);
    expect(findRangerRoot(path.join(dir, "app", "Main.rgr"), [RANGER])).toBe(RANGER);
  });

  it("runs the real compiler and puts an imported file's error on that file", async () => {
    const helper = path.join(dir, "app", "src", "Helper.rgr");
    const good = fs.readFileSync(helper, "utf8");
    const main = path.join(dir, "app", "Main.rgr");
    const clean = await runRealCheck(main, RANGER);
    expect(clean.flatMap((g) => g.messages)).toEqual([]);

    fs.writeFileSync(helper, good.replace("    fn card:void () {\n", '    fn card:void () {\n        def q:int "s"\n'));
    try {
      const groups = await runRealCheck(main, RANGER);
      const onHelper = groups.find((g) => g.file === helper);
      expect(onHelper, JSON.stringify(groups)).toBeTruthy();
      expect(onHelper!.messages[0].line).toBe(7);
      expect(onHelper!.messages[0].message).toContain("incompatible type");
      expect(groups.find((g) => g.file === main)!.messages).toEqual([]);
    } finally {
      fs.writeFileSync(helper, good);
    }
  }, 60000);
});
