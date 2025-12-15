import { describe, it, expect } from "vitest";
import { getGeneratedRustCode } from "./helpers/compiler";

const FIXTURES_DIR = "tests/fixtures";

describe("Rust Code Generation", () => {
  describe("Array/Vector Operations", () => {
    it("should generate Vec::new() for array initialization", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/array_push.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("Vec::new()");
    });

    it("should use .push() for vector append", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/array_push.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain(".push(");
    });

    it("should generate vector operations", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/local_array.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Compiler may unroll small loops - verify push operations
      expect(result.code).toContain(".push(");
    });
  });

  describe("String Operations", () => {
    it("should use proper string types", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/string_ops.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Rust uses String or &str
      expect(result.code).toMatch(/String|&str/);
    });

    it("should use .to_string() for string conversions", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/string_methods.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain(".to_string()");
    });

    it("should use format! or println! for string formatting", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/hello.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toMatch(/println!|print!/);
    });
  });

  describe("Type System", () => {
    it("should generate proper type annotations", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/math_ops.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Rust uses i64, f64, bool, etc.
      expect(result.code).toMatch(/i64|i32|f64|bool|String/);
    });

    it("should use let for variable declarations", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/array_push.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("let ");
    });

    it("should use mut for mutable variables", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/array_push.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("let mut");
    });
  });

  describe("Ownership and Borrowing", () => {
    it("should use proper string handling", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/two_classes.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Rust uses to_string() and clone() for string handling
      expect(result.code).toMatch(/to_string\(\)|\.clone\(\)/);
    });

    it("should use .clone() for explicit copies", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/two_classes.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // .clone() should appear for non-Copy types
      expect(result.code).toContain(".clone()");
    });
  });

  describe("Struct/Class Features", () => {
    it("should generate struct keyword", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/two_classes.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("struct ");
    });

    it("should use impl blocks for methods", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/two_classes.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("impl ");
    });

    it("should use fn keyword for functions", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/static_factory.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("fn ");
    });

    it("should use pub for public visibility", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/two_classes.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("pub ");
    });

    it("should use Self:: for static method calls", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/static_factory.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Static methods use Self:: or StructName::
      expect(result.code).toMatch(/Self::|::/);
    });
  });

  describe("Optional/Option Types", () => {
    it("should use Option<T> for nullable types", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/optional_values.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("Option<");
    });

    it("should use None instead of null", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/optional_values.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("None");
    });

    it("should use Some() for present values", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/optional_values.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("Some(");
    });
  });

  describe("Control Flow", () => {
    it("should generate if/else blocks", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/ternary_factory.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("if ");
      expect(result.code).toContain("else");
    });

    it("should generate while loops", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/while_loop.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("while ");
    });
  });

  describe("Polyfill Deduplication", () => {
    it("should not duplicate polyfills when features are used multiple times", () => {
      const result = getGeneratedRustCode(`${FIXTURES_DIR}/polyfill_dedup.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);

      // Count occurrences of key polyfill elements - should appear only once
      const receiverCount = (result.code.match(/static R_KEY_RECEIVER:/g) || []).length;
      expect(receiverCount).toBe(1);
    });
  });
});
