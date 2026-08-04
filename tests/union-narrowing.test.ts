import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  compileRangerToDart,
  expectGoOutput,
  expectOutput,
  expectPythonOutput,
  expectRustOutput,
  getGeneratedKotlinCode,
  getGeneratedRustCode,
  isGoAvailable,
  isPythonAvailable,
  isRustAvailable,
} from "./helpers/compiler";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE = "tests/fixtures/union_case.rgr";

/**
 * `union` + the `case` narrowing operator, across targets.
 *
 * This is the substrate a closed variant family (`shape`, see PLAN_SHAPES.md)
 * lowers to on every target that has no native sum type, so a target that
 * cannot narrow a union cannot carry a shape either. Each target here was
 * broken in its own way before:
 *
 *   Rust    no `case` template for class-typed arms at all — the program did
 *           not even type-check ("Could not match argument types for case")
 *   Dart    same
 *   Kotlin  the union's name reached the output as a type nothing declares
 *   Go      the narrowed binding was emitted unused, which Go rejects
 *   C++     the installed variant.hpp shim had no mpark::holds_alternative
 *
 * The fixture prints "number", so a target that runs it proves the narrowing
 * picked the right arm rather than merely compiling.
 */
describe("union narrowing across targets", () => {
  describe("runs and picks the right arm", () => {
    it("ES6", () => {
      expectOutput(FIXTURE, "number");
    });

    it.skipIf(!isPythonAvailable())("Python", () => {
      expectPythonOutput(FIXTURE, "number");
    });

    it.skipIf(!isGoAvailable())("Go", () => {
      expectGoOutput(FIXTURE, "number");
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      expectRustOutput(FIXTURE, "number");
    });
  });

  describe("Rust representation", () => {
    it("writes the union as Rc<dyn Any> and narrows through RgNarrow", () => {
      const result = getGeneratedRustCode(FIXTURE);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      // The union type itself: nothing else can hold values of unrelated types.
      expect(result.code).toContain("Rc<dyn std::any::Any>");
      // Members are shared, so they coerce into it and downcast back out.
      expect(result.code).toContain("as RgNarrow>::rg_narrow(");
      expect(result.code).toContain("Rc<RefCell<UnionCaseNumber>>");
      // The union name must never reach the output as a Rust type.
      expect(result.code).not.toMatch(/:\s*UnionCaseValue\b/);
    });

    it("does not make classes shared in a program with no union", () => {
      // The compiler's own `Any` is a union of EVERY declared class, so the
      // "members of a union are shared" rule has to skip it — otherwise every
      // class in every program becomes Rc<RefCell<T>>.
      const result = getGeneratedRustCode(`tests/fixtures/class_array.rgr`);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).not.toContain("RgNarrow");
    });
  });

  describe("Kotlin representation", () => {
    it("writes the union as Any, not as an undeclared type name", () => {
      const result = getGeneratedKotlinCode(FIXTURE);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("is UnionCaseNumber");
      // The union name declares no Kotlin type — it must not be written as one.
      expect(result.code).not.toMatch(/:\s*UnionCaseValue\b/);
      expect(result.code).toMatch(/v\s*:\s*Any/);
    });
  });

  describe("Dart representation", () => {
    it("writes the union as dynamic and narrows with `is`", () => {
      const outDir = path.join(ROOT_DIR, "tests", ".output-dart");
      const compile = compileRangerToDart(FIXTURE, outDir);

      expect(compile.success, `Compile failed: ${compile.error}`).toBe(true);

      const code = fs.readFileSync(
        path.join(outDir, "union_case.dart"),
        "utf-8"
      );

      expect(code).toContain("is UnionCaseNumber");
      expect(code).not.toMatch(/\bUnionCaseValue\b/);
      // `dynamic` is already nullable; `dynamic?` is not valid Dart.
      expect(code).not.toContain("dynamic?");
    });
  });
});
