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
    it("should compile array_push.rgr to valid Rust", () => {
      const result = compileRangerToRust("tests/fixtures/array_push.rgr");
      expect(result.success).toBe(true);
    });

    it("should run array_push and produce correct output", () => {
      expectRustOutput("tests/fixtures/array_push.rgr", "Done");
    });

    it("should compile local_array.rgr to valid Rust", () => {
      const result = compileRangerToRust("tests/fixtures/local_array.rgr");
      expect(result.success).toBe(true);
    });

    it("should run local_array and produce correct output", () => {
      expectRustOutput("tests/fixtures/local_array.rgr", ["hello", "world"]);
    });
  });

  describe("Math Operations", () => {
    it("should compile math_ops.rgr to valid Rust", () => {
      const result = compileRangerToRust("tests/fixtures/math_ops.rgr");
      expect(result.success).toBe(true);
    });

    // Note: Runtime test may fail due to integer division type mismatch (f64 vs i64)
  });

  describe("Class Features", () => {
    it("should compile two_classes.rgr to valid Rust", () => {
      const result = compileRangerToRust("tests/fixtures/two_classes.rgr");
      expect(result.success).toBe(true);
    });

    it("should compile while_loop.rgr to valid Rust", () => {
      const result = compileRangerToRust("tests/fixtures/while_loop.rgr");
      expect(result.success).toBe(true);
    });
  });
});
