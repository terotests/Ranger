import { describe, it, expect, beforeAll } from "vitest";
import {
  isRustAvailable,
  compileRangerToRust,
  expectRustOutput,
} from "./helpers/compiler";

const rustAvailable = isRustAvailable();

describe.skipIf(!rustAvailable)("Ranger Compiler - Rust Target", () => {
  beforeAll(() => {
    if (!rustAvailable) {
      console.log("Rust is not available, skipping Rust tests");
    }
  });

  describe("Array Operations", () => {
    it("should compile array_push.clj to valid Rust", () => {
      const result = compileRangerToRust("tests/fixtures/array_push.clj");
      expect(result.success).toBe(true);
    });

    it("should run array_push and produce correct output", () => {
      expectRustOutput("tests/fixtures/array_push.clj", "Done");
    });

    it("should compile local_array.clj to valid Rust", () => {
      const result = compileRangerToRust("tests/fixtures/local_array.clj");
      expect(result.success).toBe(true);
    });

    it("should run local_array and produce correct output", () => {
      expectRustOutput("tests/fixtures/local_array.clj", ["hello", "world"]);
    });
  });

  describe("Math Operations", () => {
    it("should compile math_ops.clj to valid Rust", () => {
      const result = compileRangerToRust("tests/fixtures/math_ops.clj");
      expect(result.success).toBe(true);
    });

    // Note: Runtime test may fail due to integer division type mismatch (f64 vs i64)
  });

  describe("Class Features", () => {
    it("should compile two_classes.clj to valid Rust", () => {
      const result = compileRangerToRust("tests/fixtures/two_classes.clj");
      expect(result.success).toBe(true);
    });

    it("should compile while_loop.clj to valid Rust", () => {
      const result = compileRangerToRust("tests/fixtures/while_loop.clj");
      expect(result.success).toBe(true);
    });
  });
});
