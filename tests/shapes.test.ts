import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  compileRangerToDart,
  compileRangerToGo,
  expectCompileError,
  expectGoOutput,
  expectOutput,
  expectPythonOutput,
  expectRustOutput,
  getGeneratedCppCode,
  getGeneratedKotlinCode,
  getGeneratedRustCode,
  getGeneratedSwiftCode,
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
      // the group is a type, never a data struct of its own (ops class is ok)
      expect(result.code).not.toMatch(/struct Value_Ref\s*\{/);
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

      // FlatTaggedObject: each case carries a literal kind discriminant
      expect(code).toContain('readonly __rg_kind: "Value_Num" = "Value_Num";');
      expect(code).toContain('.__rg_kind === "Value_Num"');
      expect(code).not.toMatch(/instanceof Value_Num/);

      // and tsc agrees: kind-tag narrowing types each arm
      execSync(
        `npx tsc --noEmit --target es2017 --module commonjs "${file}"`,
        { cwd: ROOT, encoding: "utf-8", stdio: "pipe" }
      );
    });

    it("ES6: FlatTaggedObject kind tag instead of instanceof", () => {
      const out = path.join(ROOT, "tests", ".output-es6-shapes");
      execSync(
        `node bin/output.js -es6 "${FIXTURES_DIR}/shape_match.rgr" -d=tests/.output-es6-shapes -o=shape_match.js`,
        {
          cwd: ROOT,
          env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr;./lib/stdops.rgr" },
          encoding: "utf-8",
          stdio: "pipe",
        }
      );
      const code = fs.readFileSync(path.join(out, "shape_match.js"), "utf-8");
      expect(code).toContain('this.__rg_kind = "Value_Num";');
      expect(code).toContain('.__rg_kind === "Value_Num"');
      expect(code).not.toMatch(/instanceof Value_Num/);
    });

    it.skipIf(!isGoAvailable())("Go: tagged struct with per-variant pointers", () => {
      const outDir = path.join(ROOT, "tests", ".output-go-shapes");
      const compile = compileRangerToGo(
        `${FIXTURES_DIR}/shape_match.rgr`,
        outDir
      );
      expect(compile.success, `Compile failed: ${compile.error}`).toBe(true);
      const code = fs.readFileSync(
        path.join(outDir, "shape_match.go"),
        "utf-8"
      );
      expect(code).toContain("type union_Value struct {");
      expect(code).toContain("union_Value_tag_Value_Num");
      expect(code).toContain("Value_Num *Value_Num");
      expect(code).toContain("func mk_union_Value_Value_Num");
      expect(code).toMatch(/describe \(v union_Value\)/);
      expect(code).toContain(".tag == union_Value_tag_Value_Num");
      expect(code).not.toContain("type union_Value interface");
      expect(code).not.toMatch(/describe \(v interface\{\}\)/);
    });

    it("Swift6: a native enum with payload cases", () => {
      const result = getGeneratedSwiftCode(`${FIXTURES_DIR}/shape_match.rgr`);
      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("enum union_Value {");
      expect(result.code).toContain("case Value_Num(Value_Num)");
      expect(result.code).toContain("enum union_Value_Ref {");
      expect(result.code).toContain("if case let .Value_Num(");
      expect(result.code).toMatch(/describe\(v : union_Value\)/);
      expect(result.code).toContain("union_Value.Value_Num(");
      expect(result.code).not.toContain("protocol union_Value");
      expect(result.code).not.toMatch(/describe\(v : Any\)/);
    });

    it.skipIf(!isPythonAvailable())("Python: FlatTaggedObject kind tag instead of isinstance", () => {
      const out = path.join(ROOT, "tests", ".output-python-shapes");
      execSync(
        `node bin/output.js -l=python "${FIXTURES_DIR}/shape_match.rgr" -d=tests/.output-python-shapes -o=shape_match.py`,
        {
          cwd: ROOT,
          env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr;./lib/stdops.rgr" },
          encoding: "utf-8",
          stdio: "pipe",
        }
      );
      const code = fs.readFileSync(path.join(out, "shape_match.py"), "utf-8");
      expect(code).toContain('self._rg_kind = "Value_Num"');
      expect(code).toContain('getattr(v, "_rg_kind", None) == "Value_Num"');
      expect(code).not.toMatch(/isinstance\(\s*v\s*,\s*Value_Num\s*\)/);
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

    it("rejects an unknown member of a shape body instead of dropping it", () => {
      expectCompileError(
        `${FIXTURES_DIR}/shape_bad_member.rgr`,
        "only `case`, `group`, `fn` and `sfn` are allowed in a shape body"
      );
    });

    it("checks exhaustiveness of a match inside a shape method", () => {
      expectCompileError(
        `${FIXTURES_DIR}/shape_method_missing.rgr`,
        "does not cover MValue.Text"
      );
    });

    it("rejects a shape declared inside a class", () => {
      expectCompileError(
        `${FIXTURES_DIR}/shape_nested.rgr`,
        "must be declared at the top level"
      );
    });
  });

  /**
   * `identical` on a value of a closed family. It did not build on the two
   * targets that give a family its own representation — the C++ variant has no
   * operator== for a case it carries by value, and `Rc::ptr_eq` has no Rc to
   * take when the value is an enum — so a program that asked this question was
   * quietly limited to the reference targets.
   *
   * The fixture asks it of a REFERENCE case, where every target has an object,
   * so every target must give the same three answers.
   */
  describe("identity of a family value", () => {
    const IDENT = `${FIXTURES_DIR}/shape_identity.rgr`;
    const EXPECTED_IDENT = ["alias", "distinct", "not equal"].join("\n");

    it("ES6", () => {
      expectOutput(IDENT, EXPECTED_IDENT);
    });

    it.skipIf(!isPythonAvailable())("Python", () => {
      expectPythonOutput(IDENT, EXPECTED_IDENT);
    });

    it.skipIf(!isGoAvailable())("Go", () => {
      expectGoOutput(IDENT, EXPECTED_IDENT);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      expectRustOutput(IDENT, EXPECTED_IDENT);
    });

    it("Rust asks the trait, so one spelling serves a class and a family", () => {
      const result = getGeneratedRustCode(IDENT);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("pub trait RgIdentical");
      // a shared class keeps pointer identity...
      expect(result.code).toContain("Rc::ptr_eq(self, other)");
      // ...and the family dispatches per case: object for a reference case,
      // content for one the tag carries by value
      expect(result.code).toContain("impl RgIdentical for union_IValue");
      expect(result.code).toMatch(/IValue_List\(a\), .*IValue_List\(b\)\) => Rc::ptr_eq/);
      expect(result.code).toMatch(/IValue_Num\(a\), .*IValue_Num\(b\)\) => a == b/);
    });

    it("C++ gives a by-value case the comparison the variant needs", () => {
      const result = getGeneratedCppCode(IDENT);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      // IValue_Num rides inside the variant, so it carries its own operator==
      expect(result.code).toMatch(/bool operator==\(const IValue_Num& o\) const/);
      // IValue_List is a shared_ptr alternative — the variant compares pointers
      expect(result.code).not.toMatch(/bool operator==\(const IValue_List& o\) const/);
    });
  });

  /**
   * Group and case methods (PLAN_SHAPES.md §3.6 / §7). Bodyless group methods
   * are required capabilities; nested groups widen membership; case-only
   * methods are available after narrowing. Calls lower to static ops classes
   * with exhaustive dispatch — no wrappers, no vtables.
   */
  describe("group and case methods", () => {
    const GROUP_METHODS = `${FIXTURES_DIR}/shape_group_methods.rgr`;
    // render Num, case-only doubled, render Text, Text.value, asDouble, Printable.render
    const EXPECTED_GROUP = ["2.5", "doubled", "hi", "hi", "2.5", "2.5"].join(
      "\n"
    );

    it("ES6", () => {
      expectOutput(GROUP_METHODS, EXPECTED_GROUP);
    });

    it.skipIf(!isPythonAvailable())("Python", () => {
      expectPythonOutput(GROUP_METHODS, EXPECTED_GROUP);
    });

    it.skipIf(!isGoAvailable())("Go", () => {
      expectGoOutput(GROUP_METHODS, EXPECTED_GROUP);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      expectRustOutput(GROUP_METHODS, EXPECTED_GROUP);
    });

    it("lowers required methods to ops dispatchers and case ops", () => {
      const result = getGeneratedCppCode(GROUP_METHODS);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("Value_Printable__ops");
      expect(result.code).toContain("Value_Numeric__ops");
      expect(result.code).toContain("Value_Num__ops");
      expect(result.code).not.toContain("__shape_self_proto");
    });

    it("widens a subgroup to its parent group", () => {
      expectOutput(`${FIXTURES_DIR}/shape_group_parent_widen.rgr`, "3");
    });

    it.skipIf(!isRustAvailable())("Rust widens Numeric → Printable via widen_to_", () => {
      expectRustOutput(`${FIXTURES_DIR}/shape_group_parent_widen.rgr`, "3");
      const result = getGeneratedRustCode(
        `${FIXTURES_DIR}/shape_group_parent_widen.rgr`
      );
      expect(result.success).toBe(true);
      expect(result.code).toContain("widen_to_Value_Printable");
    });

    it("runs a group default and an @(override)", () => {
      expectOutput(
        `${FIXTURES_DIR}/shape_group_default.rgr`,
        "num:1\nprintable"
      );
    });

    it("rejects a missing required implementation", () => {
      expectCompileError(
        `${FIXTURES_DIR}/shape_group_missing_impl.rgr`,
        "does not implement"
      );
    });

    it("rejects a non-member passed to a group parameter", () => {
      expectCompileError(
        `${FIXTURES_DIR}/shape_group_bad_member.rgr`,
        "invalid argument type"
      );
    });

    it("rejects a case-only method called with a group-typed value", () => {
      expectCompileError(
        `${FIXTURES_DIR}/shape_case_method_on_group.rgr`,
        "invalid argument type"
      );
    });

    it("requires @(override) when replacing a group default", () => {
      expectCompileError(
        `${FIXTURES_DIR}/shape_group_override_missing.rgr`,
        "@(override)"
      );
    });

    it("rejects a required method with the wrong signature", () => {
      expectCompileError(
        `${FIXTURES_DIR}/shape_group_bad_signature.rgr`,
        "does not match the signature"
      );
    });

    it("runs the Callable DoD example", () => {
      expectOutput(
        `${FIXTURES_DIR}/shape_group_callable.rgr`,
        "greet:hi\nlen(x)\n1"
      );
    });

    it.skipIf(!isRustAvailable())("Rust runs the Callable DoD example", () => {
      expectRustOutput(
        `${FIXTURES_DIR}/shape_group_callable.rgr`,
        "greet:hi\nlen(x)\n1"
      );
    });

    it("preserves identity across subgroup → parent widen", () => {
      expectOutput(
        `${FIXTURES_DIR}/shape_group_widen_identity.rgr`,
        "same\n7\nobj"
      );
    });

    it.skipIf(!isRustAvailable())(
      "Rust preserves identity across Child → Parent widen",
      () => {
        expectRustOutput(
          `${FIXTURES_DIR}/shape_group_widen_identity.rgr`,
          "same\n7\nobj"
        );
      }
    );
  });

  /**
   * E1 (PLAN_SHAPES.md §7.5): target EvValue shape beside class EvalValue.
   * Callable group + toBool + identity field; nothing in the engine imports
   * it yet.
   */
  describe("EvValue E1 target shape", () => {
    const E1 = `${FIXTURES_DIR}/shape_evalvalue_e1.rgr`;
    const EXPECTED_E1 = ["greet", "zero", "two", "1"].join("\n");

    it("ES6", () => {
      expectOutput(E1, EXPECTED_E1);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      expectRustOutput(E1, EXPECTED_E1);
    });
  });

  describe("EvValue E2 compatibility bridge", () => {
    const E2 = `${FIXTURES_DIR}/shape_evalvalue_e2.rgr`;
    const EXPECTED_E2 = ["num", "truthy", "zero", "hole"].join("\n");

    it("ES6", () => {
      expectOutput(E2, EXPECTED_E2);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      expectRustOutput(E2, EXPECTED_E2);
    });
  });

  /**
   * E3 (PLAN_SHAPES.md §7.5): Hole kind is shape-owned. Creation goes
   * EvValue.Hole → toTagged; ComponentEngine uses EvValueBridge.taggedHole /
   * isHole. Storage encoding remains the tagged singleton for now.
   */
  describe("EvValue E3 Hole kind", () => {
    const E3 = `${FIXTURES_DIR}/shape_evalvalue_e3_hole.rgr`;
    const EXPECTED_E3 = ["roundtrip", "engine", "distinct", "undef", "falsy"].join(
      "\n"
    );

    it("ES6", () => {
      expectOutput(E3, EXPECTED_E3);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      expectRustOutput(E3, EXPECTED_E3);
    });
  });

  /**
   * E3 primitives: null / undefined / number / string / boolean creation and
   * checks go through EvValueBridge so the shape owns those kinds too.
   */
  describe("EvValue E3 primitive kinds", () => {
    const E3P = `${FIXTURES_DIR}/shape_evalvalue_e3_prims.rgr`;
    const EXPECTED_E3P = ["num", "zero", "nullish", "strb", "roundtrip"].join("\n");

    it("ES6", () => {
      expectOutput(E3P, EXPECTED_E3P);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      expectRustOutput(E3P, EXPECTED_E3P);
    });
  });

  /**
   * E3 reference kinds: Element, Array, Object, Map, Set, Function — all
   * create/check through EvValueBridge. Completes §7.5 step 3 (by-kind boundary).
   */
  describe("EvValue E3 reference kinds", () => {
    const E3R = `${FIXTURES_DIR}/shape_evalvalue_e3_refs.rgr`;
    const EXPECTED_E3R = ["array", "object", "mapset", "fn", "element"].join("\n");

    it("ES6", () => {
      expectOutput(E3R, EXPECTED_E3R);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      expectRustOutput(E3R, EXPECTED_E3R);
    });
  });

  /**
   * E4 (PLAN_SHAPES.md §7.5): valueType is deleted. Kind lives on
   * EvalValue.body:EvValue; is-predicates / kindName / fromTagged read the shape.
   */
  describe("EvValue E4 kind discriminant", () => {
    const E4 = `${FIXTURES_DIR}/shape_evalvalue_e4_kind.rgr`;
    const EXPECTED_E4 = ["body", "kinds", "round", "name"].join("\n");

    it("ES6", () => {
      expectOutput(E4, EXPECTED_E4);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      expectRustOutput(E4, EXPECTED_E4);
    });
  });

  /**
   * E4b (PLAN_SHAPES.md §7.5): storage fields hidden behind EvalValue
   * accessors — array dense store, own-data bag, proto link.
   */
  describe("EvValue E4b storage accessors", () => {
    const E4B = `${FIXTURES_DIR}/shape_evalvalue_e4b_accessors.rgr`;
    const EXPECTED_E4B = ["arr", "obj", "proto"].join("\n");

    it("ES6", () => {
      expectOutput(E4B, EXPECTED_E4B);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      expectRustOutput(E4B, EXPECTED_E4B);
    });
  });

  /**
   * E4c (PLAN_SHAPES.md §7.5): Array.items + Object EvPropertyBag are SoT.
   * Class wrappers round-trip via EvValueHandles (identity preserved).
   */
  describe("EvValue E4c array/object storage", () => {
    const E4C = `${FIXTURES_DIR}/shape_evalvalue_e4c_array.rgr`;
    const EXPECTED_E4C = ["arr", "sot", "id", "obj"].join("\n");

    it("ES6", () => {
      expectOutput(E4C, EXPECTED_E4C);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      expectRustOutput(E4C, EXPECTED_E4C);
    });
  });

  /**
   * Group field projection (PLAN_SHAPES.md §7 / C5). Fields declared on a
   * group are read and written through the group type via generated get_/set_
   * ops — no narrowing required, identity preserved for reference groups.
   */
  describe("group field projection", () => {
    const FIELDS = `${FIXTURES_DIR}/shape_group_fields.rgr`;
    const EXPECTED_FIELDS = ["7", "8", "8"].join("\n");

    it("ES6", () => {
      expectOutput(FIELDS, EXPECTED_FIELDS);
    });

    it.skipIf(!isPythonAvailable())("Python", () => {
      expectPythonOutput(FIELDS, EXPECTED_FIELDS);
    });

    it.skipIf(!isGoAvailable())("Go", () => {
      expectGoOutput(FIELDS, EXPECTED_FIELDS);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      expectRustOutput(FIELDS, EXPECTED_FIELDS);
    });

    it("lowers group field access to get_/set_ ops", () => {
      const result = getGeneratedCppCode(FIELDS);
      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("get_identityId");
      expect(result.code).toContain("set_identityId");
    });

    it("rejects a group field accessed through the whole shape", () => {
      expectCompileError(
        `${FIXTURES_DIR}/shape_group_field_on_shape.rgr`,
        "variable not found identityId"
      );
    });

    it("projects a class-typed group field", () => {
      expectOutput(`${FIXTURES_DIR}/shape_group_class_field.rgr`, "ok");
    });
  });

  /**
   * Methods on a shape (PLAN_SHAPES.md §3.6). A `fn` in a shape body moves to
   * the generated ops class and gains the value it acts on as `self`; an `sfn`
   * moves as it is. The body node is reused rather than reprinted, so a `match`
   * inside a method is the same node the match expansion and its exhaustiveness
   * check see — which the diagnostics block above asserts.
   */
  describe("methods on a shape", () => {
    const METHODS = `${FIXTURES_DIR}/shape_methods.rgr`;
    const EXPECTED_METHODS = "num 2.5\ntext hi\nnothing\ntrue\nnum 0";

    it("ES6", () => {
      expectOutput(METHODS, EXPECTED_METHODS);
    });

    it.skipIf(!isPythonAvailable())("Python", () => {
      expectPythonOutput(METHODS, EXPECTED_METHODS);
    });

    it.skipIf(!isGoAvailable())("Go", () => {
      expectGoOutput(METHODS, EXPECTED_METHODS);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      expectRustOutput(METHODS, EXPECTED_METHODS);
    });

    it("puts the methods on the ops class, not on the union", () => {
      const result = getGeneratedRustCode(METHODS);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("impl Value__ops");
      // the receiver is a parameter of the family, never a Rust `self`
      expect(result.code).toMatch(/fn describe\(mut __self : union_Value/);
      // and a case value returned from a function of the family is wrapped
      expect(result.code).toMatch(/fn zero\(\) -> union_Value/);
      expect(result.code).toContain("union_Value::Value_Num(");
      // the prototype used to build the receiver never reaches the output
      expect(result.code).not.toContain("__shape_self_proto");
    });
  });

  /**
   * A shape held as a FIELD, which is the form the EvalValue migration needs
   * (PLAN_SHAPES.md §7.3). Three writer faults were found by that migration
   * and are covered here; each one made the generated program fail to build,
   * so a target that RUNS the fixture proves the fix.
   */
  describe("a shape as a field", () => {
    const FIELD = `${FIXTURES_DIR}/shape_field.rgr`;
    const EXPECTED_FIELD = "empty:\ngreet/2\nelem:\n0";

    it("ES6", () => {
      expectOutput(FIELD, EXPECTED_FIELD);
    });

    it.skipIf(!isPythonAvailable())("Python", () => {
      expectPythonOutput(FIELD, EXPECTED_FIELD);
    });

    it.skipIf(!isGoAvailable())("Go", () => {
      expectGoOutput(FIELD, EXPECTED_FIELD);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      expectRustOutput(FIELD, EXPECTED_FIELD);
    });

    it("Rust wraps a union-typed field initializer and assignment in the variant", () => {
      const result = getGeneratedRustCode(FIELD);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      // the field starts as the `None` variant, not as a bare Payload_None
      expect(result.code).toContain("load:union_Payload::Payload_None(");
      // and an assignment into the field wraps the member the same way
      expect(result.code).toMatch(
        /self\.load\s*=\s*union_Payload::Payload_(FnCore|ElemBox)\(/
      );
    });

    it.skipIf(!isRustAvailable())(
      "Rust builds a record whose field is a shared class",
      () => {
        // The shape lowering makes one record per case, so a case that holds a
        // class hits this path. The synthesized constructor took the bare type
        // while the field and the call site both had Rc<RefCell<T>>.
        expectRustOutput(`${FIXTURES_DIR}/record_shared_field.rgr`, "roott");
      }
    );
  });
});
