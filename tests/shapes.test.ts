import { describe, it, expect } from "vitest";
import {
  compileRangerToDart,
  expectCompileError,
  expectGoOutput,
  expectOutput,
  expectPythonOutput,
  expectRustOutput,
  getGeneratedCppCode,
  getGeneratedKotlinCode,
  getGeneratedRustCode,
  isGoAvailable,
  isPythonAvailable,
  isRustAvailable,
} from "./helpers/compiler";

const FIXTURES_DIR = "tests/fixtures";
const SHAPE = `${FIXTURES_DIR}/shape_value.rgr`;

/**
 * `shape` / `case` / `group` — closed variant families (PLAN_SHAPES.md, S1).
 *
 * The lowering is target-independent: one `record` class per case, a `union`
 * over them, and one union per group over that group's members. No writer
 * knows the word `shape`, so a target carries a shape exactly as well as it
 * carries a union — which is what S0 made true everywhere.
 *
 * The fixture prints `num,text,items,nothing,` and `7`, so a target that runs
 * it proves construction, narrowing, collections of the shape type and group
 * typing all work, not merely that the program compiled.
 */
describe("shapes (closed variant families)", () => {
  const EXPECTED = "num,text,items,nothing,";

  describe("runs identically across targets", () => {
    it("ES6", () => {
      const run = expectOutput(SHAPE, EXPECTED);
      expect(run.output).toContain("7");
    });

    it.skipIf(!isPythonAvailable())("Python", () => {
      const run = expectPythonOutput(SHAPE, EXPECTED);
      expect(run.output).toContain("7");
    });

    it.skipIf(!isGoAvailable())("Go", () => {
      const run = expectGoOutput(SHAPE, EXPECTED);
      expect(run.output).toContain("7");
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      const run = expectRustOutput(SHAPE, EXPECTED);
      expect(run.output).toContain("7");
    });
  });

  describe("lowering", () => {
    it("emits one class per case and keeps the shape name for the union", () => {
      const result = getGeneratedCppCode(SHAPE);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      for (const cls of [
        "Value_Nothing",
        "Value_Num",
        "Value_Text",
        "Value_Items",
      ]) {
        expect(result.code).toContain(cls);
      }
      // the union carries every case; the shape itself is never a class
      expect(result.code).toContain("r_union_Value");
      expect(result.code).not.toMatch(/class Value\s*[:{]/);
      // the source spelling `Value.Num` must not survive into any output
      expect(result.code).not.toContain("Value.Num");
    });

    it("gives a case the fields of the group it belongs to", () => {
      const result = getGeneratedKotlinCode(SHAPE);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      // Items does Ref, so it carries Ref's identityId as well as its own items
      const items = result.code.slice(result.code.indexOf("class Value_Items"));
      expect(items).toContain("identityId");
      expect(items).toContain("items");
      // ...and a case outside the group does not
      const num = result.code.slice(
        result.code.indexOf("class Value_Num"),
        result.code.indexOf("class Value_Text")
      );
      expect(num).not.toContain("identityId");
    });

    it("makes a group a type of its own", () => {
      // identityOf takes Value.Ref: on Rust that is the group's union, so the
      // parameter is the dyn-Any handle and not one concrete case class
      const result = getGeneratedRustCode(SHAPE);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toMatch(/fn identityOf\(&self, mut r : Rc<dyn/);
      expect(result.code).not.toContain("Value_Ref {");
    });

    it("keeps generated classes where the shape was written", () => {
      // Python emits classes in source order and calls main at the end of the
      // file: appending the lowering instead of splicing it in left every case
      // class defined after its first use.
      const result = getGeneratedRustCode(SHAPE);

      expect(result.success).toBe(true);
      const numAt = result.code.indexOf("struct Value_Num");
      const probeAt = result.code.indexOf("struct ShapeProbe");
      expect(numAt).toBeGreaterThan(-1);
      expect(probeAt).toBeGreaterThan(-1);
      expect(numAt).toBeLessThan(probeAt);
    });

    it("compiles to Dart with the union as dynamic", () => {
      const compile = compileRangerToDart(SHAPE);
      expect(compile.success, `Compile failed: ${compile.error}`).toBe(true);
    });
  });

  describe("match", () => {
    const MATCH = `${FIXTURES_DIR}/shape_match.rgr`;
    // one arm over two cases, one qualified name, one group arm, and a match
    // over a group type that covers only that group
    const EXPECTED_MATCH = [
      "num:1.5",
      "primitive",
      "ref:3",
      "primitive",
      "items:0",
    ].join("\n");

    it("ES6", () => {
      expectOutput(MATCH, EXPECTED_MATCH);
    });

    it.skipIf(!isPythonAvailable())("Python", () => {
      expectPythonOutput(MATCH, EXPECTED_MATCH);
    });

    it.skipIf(!isGoAvailable())("Go", () => {
      expectGoOutput(MATCH, EXPECTED_MATCH);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      expectRustOutput(MATCH, EXPECTED_MATCH);
    });

    it("lowers to narrowings — no `match` survives into the output", () => {
      const result = getGeneratedCppCode(MATCH);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).not.toMatch(/\bmatch\b/);
      // the group arm expands to one narrowing per member of the group
      expect(result.code).toContain("holds_alternative<std::shared_ptr<Value_Items>>");
    });
  });

  describe("diagnostics", () => {
    it("names the cases a match does not cover", () => {
      expectCompileError(
        `${FIXTURES_DIR}/shape_match_missing.rgr`,
        "does not cover MValue.Num, MValue.Text"
      );
    });

    it("rejects a case covered twice", () => {
      expectCompileError(
        `${FIXTURES_DIR}/shape_match_duplicate.rgr`,
        "`DValue.Num` is covered twice"
      );
    });

    it("counts a group as complete only for a value of that group's type", () => {
      // the same arm set is exhaustive in shape_match.rgr, where the parameter
      // is declared as the group
      expectCompileError(
        `${FIXTURES_DIR}/shape_match_group_only.rgr`,
        "does not cover GValue.Nothing, GValue.Num, GValue.Text"
      );
    });

    it("rejects a catch-all arm", () => {
      expectCompileError(
        `${FIXTURES_DIR}/shape_match_wildcard.rgr`,
        "has no catch-all arm"
      );
    });

    it("rejects a method in a shape body instead of dropping it", () => {
      expectCompileError(
        `${FIXTURES_DIR}/shape_bad_member.rgr`,
        "only `case` and `group` are allowed in a shape body"
      );
    });

    it("rejects a shape declared inside a class", () => {
      expectCompileError(
        `${FIXTURES_DIR}/shape_nested.rgr`,
        "must be declared at the top level"
      );
    });
  });
});
