import { describe, it, expect } from "vitest";
import {
  expectOutput,
  expectGoOutput,
  expectKotlinOutput,
  expectPythonOutput,
  expectRustOutput,
  getGeneratedCppCode,
  getGeneratedKotlinCode,
  getGeneratedRustCode,
  getGeneratedSwiftCode,
  isGoAvailable,
  isKotlinAvailable,
  isPythonAvailable,
  isRustAvailable,
} from "./helpers/compiler";

const FIXTURE = "tests/fixtures/is_operator.rgr";

/**
 * `is v _:Shape.Case` — the kind test of `case` with the binding and the block
 * removed (SHAPES_IS_OPERATOR.md).
 *
 * The fixture answers every question twice, once through `case` and once
 * through `is`, so a disagreement between the two lowerings shows up as a
 * mismatched pair in the output rather than as a silent wrong answer. Each row
 * is `case/is/group/composed/describe`.
 *
 * Targets whose toolchain is not installed are covered by asserting the
 * emitted expression instead: that is the only guard Swift has, since its
 * toolchain cannot be fetched in CI sandboxes.
 */
describe("the `is` kind test", () => {
  // nul          num          txt           lst
  const EXPECTED =
    "TFF/TFF/TF/FT/nul FTF/FTF/TF/TF/num42 FFT/FFT/FT/TT/txthi FFF/FFF/FT/FT/lst";

  describe("runs identically across targets", () => {
    it("ES6", () => {
      expect(expectOutput(FIXTURE, EXPECTED).output).toContain(EXPECTED);
    });

    it.skipIf(!isPythonAvailable())("Python", () => {
      expect(expectPythonOutput(FIXTURE, EXPECTED).output).toContain(EXPECTED);
    });

    it.skipIf(!isGoAvailable())("Go", () => {
      expect(expectGoOutput(FIXTURE, EXPECTED).output).toContain(EXPECTED);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      expect(expectRustOutput(FIXTURE, EXPECTED).output).toContain(EXPECTED);
    });

    it.skipIf(!isKotlinAvailable())("Kotlin", () => {
      expect(expectKotlinOutput(FIXTURE, EXPECTED).output).toContain(EXPECTED);
    });
  });

  /**
   * Each target must emit the discriminant test it already uses for `case`,
   * and nothing more — no binding, no clone, no block.
   */
  describe("lowers to the target's own discriminant test", () => {
    it("Rust: matches! — no clone of the scrutinee", () => {
      const gen = getGeneratedRustCode(FIXTURE);
      expect(gen.success).toBe(true);
      expect(gen.code).toContain("matches!(v, union_Val::Val_Num(..))");
      // the `case` form clones; the `is` form must not
      expect(gen.code).toMatch(/fn isNum\([^)]*\)[^{]*\{\s*matches!\(/);
    });

    it("C++: holds_alternative, without the std::get the case form adds", () => {
      const gen = getGeneratedCppCode(FIXTURE);
      expect(gen.success).toBe(true);
      expect(gen.code).toContain("std::holds_alternative<Val_Num>(v)");
    });

    it("Kotlin: an `is` check against the case class", () => {
      const gen = getGeneratedKotlinCode(FIXTURE);
      expect(gen.success).toBe(true);
      expect(gen.code).toContain("(v is Val_Num)");
    });

    it("Swift: `if case` has no expression form, so an applied closure", () => {
      const gen = getGeneratedSwiftCode(FIXTURE);
      expect(gen.success).toBe(true);
      expect(gen.code).toContain("if case .Val_Num = v { return true }; return false");
      // the value operand is named once, so it is evaluated once
      const test = gen.code.match(
        /\{ \(\) -> Bool in if case \.Val_Num = (\w+) \{ return true \}; return false \}\)\(\)/
      );
      expect(test).not.toBeNull();
    });
  });

  /**
   * A group is not a discriminant any target can compare: the generated union
   * carries one tag per CASE. Rust and Go would not compile a group tag at all
   * (`union_Val::union_Val_Prim` names no variant), and the tag-string targets
   * would compare against a tag no case ever carries and answer false forever.
   * So a group test expands into a disjunction over the group's member cases.
   */
  describe("a group expands into its member cases", () => {
    it("Rust: one matches! per case of the group, or-ed", () => {
      const gen = getGeneratedRustCode(FIXTURE);
      expect(gen.success).toBe(true);
      expect(gen.code).toContain(
        "(matches!(v, union_Val::Val_Nul(..))) || (matches!(v, union_Val::Val_Num(..)))"
      );
      // the group must never reach a writer as a tag of its own
      expect(gen.code).not.toContain("union_Val::union_Val_Prim");
    });

    it("Kotlin: one `is` per case of the group, or-ed", () => {
      const gen = getGeneratedKotlinCode(FIXTURE);
      expect(gen.success).toBe(true);
      expect(gen.code).toContain("((v is Val_Nul)) || ((v is Val_Num))");
    });

    it("Swift: one `if case` per case of the group, or-ed", () => {
      const gen = getGeneratedSwiftCode(FIXTURE);
      expect(gen.success).toBe(true);
      expect(gen.code).toContain("if case .Val_Nul = v");
      expect(gen.code).toContain("if case .Val_Num = v");
      // Swift lowers a group to its OWN enum, so a group tag here would be a
      // comparison against a different type entirely
      expect(gen.code).not.toContain("if case .union_Val_Prim");
    });
  });
});
