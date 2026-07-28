// ============================================================================
// array-literal.test.ts — static array literals `([] ...)` across backends.
// ============================================================================
//
// Regression cover for three defects found while replacing a run of `push`
// statements with a single literal (ISSUES.md #66 / #67):
//
//   1. Rust emitted a fixed-size `[T; N]` where every Ranger array is a
//      `Vec<T>`, so the generated code never compiled at all.
//   2. C++ built the vector through a C99 compound literal — a C construct ISO
//      C++ does not have. GCC/Clang take it as an extension; MSVC rejects it.
//   3. `([] _:T a b c)` — the typed spelling WITHOUT the parenthesised element
//      group — was accepted everywhere and produced silent garbage.
//
// Where these assert on generated text rather than behaviour it is because the
// defect *was* in the generated text: (1) and (2) are both "this string cannot
// be compiled by the target toolchain".
// ============================================================================

import { describe, it, expect } from "vitest";
import {
  getGeneratedRustCode,
  getGeneratedCppCode,
  compileRanger,
  compileAndRun,
} from "./helpers/compiler";

const FIXTURES_DIR = "tests/fixtures";
const LITERAL = `${FIXTURES_DIR}/array_literal.rgr`;

describe("Static array literals", () => {
  describe("Rust (ISSUES.md #66)", () => {
    it("emits vec![...] rather than a fixed-size array", () => {
      const result = getGeneratedRustCode(LITERAL);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("vec![1, 2, 3]");
    });

    it("uses vec![] for object elements too", () => {
      const result = getGeneratedRustCode(LITERAL);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toMatch(/vec!\[Knot::of\(/);
    });

    it("never assigns a bare [ ... ] array to a Vec binding", () => {
      // The exact shape of the old bug: `let x : Vec<T> = [a, b];`
      // → error[E0308]: expected `Vec<K>`, found `[K; 2]`
      const result = getGeneratedRustCode(LITERAL);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).not.toMatch(/:\s*Vec<[^>=]*>\s*=\s*\[/);
    });
  });

  describe("C++ (ISO conformance)", () => {
    it("brace-initialises a std::vector", () => {
      const result = getGeneratedCppCode(LITERAL);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("std::vector<int>{1, 2, 3}");
    });

    it("does not emit a C99 compound literal", () => {
      // The old form was `r_make_vector_from_array( ( T[] ) { ... } )`:
      // a compound literal, which GCC/Clang accept only as an extension
      // (-Wpedantic: "ISO C++ forbids compound-literals") and MSVC rejects.
      const result = getGeneratedCppCode(LITERAL);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).not.toContain("r_make_vector_from_array");

      // Scope the shape check to vector-building lines. A whole-file regex for
      // `( ... [] ) {` also matches `int main(int argc, char* argv[]) {`.
      const vectorLines = result.code
        .split("\n")
        .filter((line) => line.includes("std::vector<"));
      expect(vectorLines.length).toBeGreaterThan(0);
      for (const line of vectorLines) {
        expect(line, `compound literal in: ${line.trim()}`).not.toMatch(
          /\[\]\s*\)\s*\{/,
        );
      }
    });

    it("brace-init means one element, not N zeroed ones", () => {
      // std::vector<int>(3) is three zeroes; std::vector<int>{3} is [3].
      // Braces are what make the single-element literal correct.
      const result = getGeneratedCppCode(LITERAL);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("std::vector<int>{3}");
      expect(result.code).not.toContain("std::vector<int>(3)");
    });
  });

  describe("behaviour", () => {
    it("produces the right elements at runtime", () => {
      const result = compileAndRun(LITERAL);
      expect(result.compile.success, `Failed: ${result.compile.error}`).toBe(
        true,
      );
      expect(result.run?.success, `Run failed: ${result.run?.error}`).toBe(true);
      const out = result.run?.output ?? "";
      expect(out).toContain("nums=3");
      expect(out).toContain("objs=2");
      // The single-element case, checked by value and not just by length.
      expect(out).toContain("one=1");
      expect(out).toContain("one0=3");
    });
  });

  describe("the misspelled typed form (ISSUES.md #67)", () => {
    it("is rejected instead of silently miscompiling", () => {
      const result = compileRanger(
        `${FIXTURES_DIR}/array_literal_bad_marker.rgr`,
      );
      expect(result.success).toBe(false);
    });

    it("says what to write instead", () => {
      const result = compileRanger(
        `${FIXTURES_DIR}/array_literal_bad_marker.rgr`,
      );
      const text = `${result.output}${result.error ?? ""}`;
      expect(text).toContain("Array literal type marker");
      expect(text).toContain("parenthesised element group");
    });

    it("still accepts both valid spellings", () => {
      // ([] a b c) and ([] _:T ( a b c )) both live in the fixture.
      const result = compileRanger(LITERAL);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
    });
  });
});

describe("Rust main return value", () => {
  it("routes a main:int return through process::exit", () => {
    const result = getGeneratedRustCode(`${FIXTURES_DIR}/main_returns_int.rgr`);
    expect(result.success, `Failed: ${result.error}`).toBe(true);
    expect(result.code).toContain("std::process::exit");
    // The body has to run somewhere that CAN return a value.
    expect(result.code).toMatch(/let __rg_exit_code = \(\|\| \{/);
  });

  it("leaves a main:void alone", () => {
    const result = getGeneratedRustCode(`${FIXTURES_DIR}/main_returns_void.rgr`);
    expect(result.success, `Failed: ${result.error}`).toBe(true);
    expect(result.code).toContain("fn main() {");
    expect(result.code).not.toContain("__rg_exit_code");
    expect(result.code).not.toContain("std::process::exit");
  });
});
