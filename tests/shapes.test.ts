import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
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
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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
      // identityOf takes Value.Ref: on Rust that is the group's own enum, not
      // one concrete case class (S5 replaced the dyn-Any handle with it)
      const result = getGeneratedRustCode(SHAPE);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("fn identityOf(&self, mut r : union_Value_Ref)");
      expect(result.code).toContain("pub enum union_Value_Ref");
      // the group is a type, never a struct of its own
      expect(result.code).not.toContain("struct Value_Ref");
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

  describe("the `identical` operator", () => {
    const ID = `${FIXTURES_DIR}/identical_op.rgr`;
    const EXPECTED_ID = ["same", "different"].join("\n");

    it("ES6", () => {
      expectOutput(ID, EXPECTED_ID);
    });

    it.skipIf(!isPythonAvailable())("Python", () => {
      expectPythonOutput(ID, EXPECTED_ID);
    });

    it.skipIf(!isGoAvailable())("Go", () => {
      expectGoOutput(ID, EXPECTED_ID);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      // the operand class is put in a cell so that Rc::ptr_eq has something to
      // compare — identity of a plain struct is not a question Rust answers
      expectRustOutput(ID, EXPECTED_ID);
    });

    it("uses each target's own identity test", () => {
      const py = getGeneratedRustCode(ID);
      expect(py.success).toBe(true);
      expect(py.code).toContain("Rc::ptr_eq(");

      const kt = getGeneratedKotlinCode(ID);
      expect(kt.success).toBe(true);
      expect(kt.code).toMatch(/a === c/);
    });
  });

  describe("value and reference semantics", () => {
    const EQ = `${FIXTURES_DIR}/shape_equality.rgr`;
    // content, different case, two objects, same object, notEquals, no fields
    const EXPECTED_EQ = ["true", "false", "false", "true", "false", "true"].join(
      "\n"
    );

    it("ES6", () => {
      expectOutput(EQ, EXPECTED_EQ);
    });

    it.skipIf(!isPythonAvailable())("Python", () => {
      expectPythonOutput(EQ, EXPECTED_EQ);
    });

    it.skipIf(!isGoAvailable())("Go", () => {
      expectGoOutput(EQ, EXPECTED_EQ);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      expectRustOutput(EQ, EXPECTED_EQ);
    });

    it("compares a reference case with the target's identity operator", () => {
      // Rust cannot use == for identity (it wants a PartialEq bound) and Kotlin
      // must not (== is structural there), so both go through `identical`
      const rust = getGeneratedRustCode(EQ);
      expect(rust.success, `Compile failed: ${rust.error}`).toBe(true);
      expect(rust.code).toContain("Rc::ptr_eq(");

      const kotlin = getGeneratedKotlinCode(EQ);
      expect(kotlin.success, `Compile failed: ${kotlin.error}`).toBe(true);
      expect(kotlin.code).toMatch(/===/);
    });
  });

  // PLAN_SHAPES.md S5: each target's own representation of the family, instead
  // of the portable-but-slow union of classes S1 lowers to.
  describe("a local declared as the family", () => {
    const LOCAL = `${FIXTURES_DIR}/shape_union_local.rgr`;
    const EXPECTED_LOCAL = ["num:2.5", "text:hi"].join("\n");

    it("ES6", () => {
      expectOutput(LOCAL, EXPECTED_LOCAL);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      // the local's type is the union handle and only the constructed member
      // takes a cell — wrapping both gave Rc<RefCell<Rc<dyn Any>>>
      expectRustOutput(LOCAL, EXPECTED_LOCAL);
    });

    it.skipIf(!isGoAvailable())("Go", () => {
      expectGoOutput(LOCAL, EXPECTED_LOCAL);
    });
  });

  describe("per-target representation", () => {
    it("TypeScript: a real union type, and the generated file type-checks", () => {
      const out = path.join(ROOT, "tests", ".output");
      execSync(
        `node bin/output.js -es6 -typescript "${FIXTURES_DIR}/shape_match.rgr" -d=tests/.output -o=shape_match.ts`,
        {
          cwd: ROOT,
          env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr;./lib/stdops.rgr" },
          encoding: "utf-8",
          stdio: "pipe",
        }
      );
      const file = path.join(out, "shape_match.ts");
      const code = fs.readFileSync(file, "utf-8");

      // the family is a union type; the group is a union of its members
      expect(code).toContain(
        "type union_Value = Value_Nothing|Value_Num|Value_Text|Value_Items;"
      );
      expect(code).toContain("type union_Value_Ref = Value_Items;");
      expect(code).toMatch(/describe\s*\(v : union_Value\)/);

      // and tsc agrees: instanceof narrowing types each arm
      execSync(
        `npx tsc --noEmit --target es2017 --module commonjs "${file}"`,
        { cwd: ROOT, encoding: "utf-8", stdio: "pipe" }
      );
    });

    it("Kotlin: a sealed interface the cases implement", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/shape_match.rgr`);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("sealed interface union_Value");
      expect(result.code).toContain("sealed interface union_Value_Ref");
      // a case in both the family and a group implements both
      expect(result.code).toMatch(
        /class Value_Items\(.*\) : union_Value, union_Value_Ref/
      );
      // ...and the signatures carry the type instead of erasing it to Any
      expect(result.code).toMatch(/describe\( v : union_Value\)/);
      expect(result.code).not.toMatch(/describe\( v : Any\)/);
    });

    it("C#: an interface per union instead of dynamic", () => {
      // `dynamic` compiled but gave up every compile-time check and routed
      // each member access through the DLR
      const out = path.join(ROOT, "tests", ".output-csharp");
      execSync(
        `node bin/output.js -l=csharp "${FIXTURES_DIR}/shape_match.rgr" -d=tests/.output-csharp -o=shape_match.cs`,
        {
          cwd: ROOT,
          env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr;./lib/stdops.rgr" },
          encoding: "utf-8",
          stdio: "pipe",
        }
      );
      const code = fs.readFileSync(path.join(out, "shape_match.cs"), "utf-8");

      expect(code).toContain("public interface union_Value { }");
      expect(code).toMatch(/class Value_Items\s*: union_Value, union_Value_Ref/);
      expect(code).toMatch(/describe\( union_Value v \)/);
      expect(code).not.toMatch(/describe\( dynamic v \)/);
    });

    it("Dart: an abstract class per union instead of dynamic", () => {
      const outDir = path.join(ROOT, "tests", ".output-dart");
      const compile = compileRangerToDart(
        `${FIXTURES_DIR}/shape_match.rgr`,
        outDir
      );
      expect(compile.success, `Compile failed: ${compile.error}`).toBe(true);

      const code = fs.readFileSync(
        path.join(outDir, "shape_match.dart"),
        "utf-8"
      );
      expect(code).toContain("abstract class union_Value {}");
      expect(code).toContain(
        "class Value_Items implements union_Value, union_Value_Ref"
      );
      expect(code).toMatch(/describe\(union_Value v\)/);
    });

    it("Rust: a native enum, scalar cases carried inline", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/shape_match.rgr`);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("pub enum union_Value {");
      // a case that holds only scalars rides inside the variant...
      expect(result.code).toContain("Value_Num(Value_Num),");
      // ...a case with a collection keeps its cell
      expect(result.code).toContain("Value_Items(Rc<RefCell<Value_Items>>),");
      // narrowing is `if let` on the tag — no trait object, no downcast
      expect(result.code).toContain("if let union_Value::Value_Num(");
      expect(result.code).not.toContain("Rc<dyn std::any::Any>");
    });

    it("C++: the variant carries scalar cases by value", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/shape_match.rgr`);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      // Value_Num and Value_Text by value, Value_Items still behind a pointer
      expect(result.code).toContain(
        "typedef mpark::variant<Value_Nothing, Value_Num, Value_Text, std::shared_ptr<Value_Items>>"
      );
      // constructing one allocates nothing
      expect(result.code).toContain("( Value_Num(1.5))");
      expect(result.code).not.toContain("std::make_shared<Value_Num>");
      // and its fields are reached with a dot
      expect(result.code).toMatch(/\.value\b/);
    });

    it("Kotlin: the compiler's own `Any` union is not made an interface", () => {
      // `Any` is a union of EVERY declared class; turning it into a sealed
      // interface would make every class in every program implement it
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/shape_match.rgr`);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).not.toContain("union_Any");
    });
  });

  describe("diagnostics", () => {
    it("refuses to mutate a value case", () => {
      expectCompileError(
        `${FIXTURES_DIR}/shape_value_assign.rgr`,
        "cannot assign to a field of AValue.Num"
      );
    });

    it("refuses @(value) on a case that holds a collection", () => {
      expectCompileError(
        `${FIXTURES_DIR}/shape_value_nonscalar.rgr`,
        "is @(value) but holds a field that is not a scalar"
      );
    });

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
