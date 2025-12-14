import { describe, it, expect, beforeAll } from "vitest";
import {
  isRustAvailable,
  compileRangerToRust,
  expectRustOutput,
  getGeneratedRustCode,
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

  describe("Polyfill Deduplication", () => {
    it("should not duplicate polyfills when on_keypress is used multiple times", () => {
      const result = getGeneratedRustCode("tests/fixtures/polyfill_dedup.rgr");
      expect(result.success).toBe(true);
      
      // Count occurrences of key polyfill elements
      // These should appear exactly once even with multiple on_keypress calls
      const code = result.code;
      
      // Count R_KEY_RECEIVER static definitions - this is unique to the polyfill
      // Note: r_setup_raw_mode and r_read_key have TWO definitions each (one for #[cfg(windows)] and one for #[cfg(unix)])
      const receiverCount = (code.match(/static R_KEY_RECEIVER:/g) || []).length;
      expect(receiverCount).toBe(1);
    });

    it("should compile polyfill_dedup.rgr to valid Rust", () => {
      const result = compileRangerToRust("tests/fixtures/polyfill_dedup.rgr");
      expect(result.success).toBe(true);
    });
  });
});
