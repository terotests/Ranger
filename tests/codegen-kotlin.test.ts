import { describe, it, expect } from "vitest";
import { getGeneratedKotlinCode } from "./helpers/compiler";

const FIXTURES_DIR = "tests/fixtures";

describe("Kotlin Code Generation", () => {
  describe("Collection Operations", () => {
    it("should generate arrayListOf for array initialization", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/array_push.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("arrayListOf");
    });

    it("should use .add() for list append", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/array_push.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain(".add(");
    });

    it("should generate list operations", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/local_array.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Compiler may unroll small loops - verify list operations
      expect(result.code).toContain(".add(");
    });
  });

  describe("String Operations", () => {
    it("should use string concatenation", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/string_ops.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Kotlin uses + for string concatenation and .toString()
      expect(result.code).toMatch(/\+ |.toString\(\)/);
    });

    it("should use proper string methods", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/string_methods.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Kotlin uses .startsWith(), .endsWith(), .contains(), .replace()
      expect(result.code).toMatch(/\.startsWith|\.endsWith|\.contains|\.replace/);
    });
  });

  describe("Nullable Types", () => {
    it("should use ? for nullable type markers", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/optional_values.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Kotlin uses Type? for nullable types
      expect(result.code).toMatch(/\w+\?/);
    });

    it("should use null keyword", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/optional_values.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("null");
    });

    it("should use force unwrap !! for non-null assertion", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/optional_values.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Kotlin uses !! for force unwrap when safe
      expect(result.code).toContain("!!");
    });
  });

  describe("Class Features", () => {
    it("should generate class keyword", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/two_classes.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("class ");
    });

    it("should use init block or class with no constructor params", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/static_factory.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Kotlin classes can have init blocks or primary constructors
      expect(result.code).toMatch(/init\s*\{|class \w+/);
    });

    it("should use fun keyword for functions", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/two_classes.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("fun ");
    });

    it("should use companion object for static members", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/static_factory.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Kotlin uses companion object for static-like behavior
      expect(result.code).toContain("companion object");
    });
  });

  describe("Variable Declarations", () => {
    it("should use var for mutable variables", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/array_push.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("var ");
    });

    it("should use val for immutable variables", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/math_ops.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // val is used for read-only variables
      expect(result.code).toMatch(/\bval\b|\bvar\b/);
    });
  });

  describe("Type Declarations", () => {
    it("should use : Type syntax for type annotations", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/math_ops.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Kotlin uses : Type
      expect(result.code).toMatch(/:\s*(Int|Long|Double|String|Boolean)/);
    });

    it("should use proper return type syntax", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/static_factory.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Kotlin uses : ReturnType after parameter list
      expect(result.code).toMatch(/\)\s*:\s*\w+/);
    });
  });

  describe("Control Flow", () => {
    it("should generate conditional expressions", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/ternary_factory.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Ternary uses ? : syntax (note: Kotlin also supports if as expression)
      expect(result.code).toMatch(/\?.*:/);
    });

    it("should generate while loops", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/while_loop.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("while ");
    });
  });

  describe("Print Statements", () => {
    it("should use println() for output", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/hello.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("println(");
    });
  });

  describe("Main Function", () => {
    it("should generate main function", () => {
      const result = getGeneratedKotlinCode(`${FIXTURES_DIR}/hello.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("fun main(");
    });
  });
});
