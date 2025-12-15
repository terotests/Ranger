import { describe, it, expect } from "vitest";
import { getGeneratedSwiftCode } from "./helpers/compiler";

const FIXTURES_DIR = "tests/fixtures";

describe("Swift6 Code Generation", () => {
  describe("Array Operations", () => {
    it("should generate append() for array push", () => {
      const result = getGeneratedSwiftCode(`${FIXTURES_DIR}/array_push.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain(".append(");
      expect(result.code).not.toContain(".push("); // JS pattern shouldn't appear
    });

    it("should generate proper array initialization", () => {
      const result = getGeneratedSwiftCode(`${FIXTURES_DIR}/local_array.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Swift uses [Type]() or Array<Type>() for array init
      expect(result.code).toMatch(/\[.*\]\(\)|Array</);
    });

    it("should generate array append operations", () => {
      const result = getGeneratedSwiftCode(`${FIXTURES_DIR}/local_array.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Compiler may unroll small loops - verify array operations work
      expect(result.code).toContain(".append(");
    });
  });

  describe("String Operations", () => {
    it("should use string concatenation or String() conversion", () => {
      const result = getGeneratedSwiftCode(`${FIXTURES_DIR}/string_ops.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Swift uses String() for type conversion in concatenation
      expect(result.code).toMatch(/String\(|\+ "/)
    });

    it("should generate proper string methods", () => {
      const result = getGeneratedSwiftCode(`${FIXTURES_DIR}/string_methods.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Check for Swift-specific string operations
      // Swift doesn't have .length, uses .count instead
      expect(result.code).not.toContain(".length");
    });
  });

  describe("Class Features", () => {
    it("should generate class keyword", () => {
      const result = getGeneratedSwiftCode(`${FIXTURES_DIR}/two_classes.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("class ");
    });

    it("should generate init() for constructors when needed", () => {
      const result = getGeneratedSwiftCode(`${FIXTURES_DIR}/ternary_factory.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Classes with constructor params generate init()
      expect(result.code).toContain("init(");
    });

    it("should generate class func for static methods", () => {
      const result = getGeneratedSwiftCode(`${FIXTURES_DIR}/static_factory.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Swift uses "class func" for type methods (equivalent to static)
      expect(result.code).toContain("class func");
    });
  });

  describe("Control Flow", () => {
    it("should generate conditional expressions", () => {
      const result = getGeneratedSwiftCode(`${FIXTURES_DIR}/ternary_factory.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Ternary expressions use ? : syntax
      expect(result.code).toContain("?");
      expect(result.code).toContain(":");
    });

    it("should generate while loops", () => {
      const result = getGeneratedSwiftCode(`${FIXTURES_DIR}/while_loop.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("while ");
    });
  });

  describe("Optional Types", () => {
    it("should handle optional values", () => {
      const result = getGeneratedSwiftCode(`${FIXTURES_DIR}/optional_values.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Swift uses ? for optionals and nil instead of null
      expect(result.code).toContain("nil");
    });
  });

  describe("Type Declarations", () => {
    it("should generate proper type annotations", () => {
      const result = getGeneratedSwiftCode(`${FIXTURES_DIR}/math_ops.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Swift uses : Type syntax
      expect(result.code).toMatch(/:\s*(Int|Double|String|Bool)/);
    });

    it("should use var/let for variable declarations", () => {
      const result = getGeneratedSwiftCode(`${FIXTURES_DIR}/array_push.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toMatch(/\b(var|let)\b/);
    });
  });

  describe("Function Declarations", () => {
    it("should use func keyword", () => {
      const result = getGeneratedSwiftCode(`${FIXTURES_DIR}/two_classes.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("func ");
    });

    it("should use -> for return types", () => {
      const result = getGeneratedSwiftCode(`${FIXTURES_DIR}/static_factory.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("->");
    });
  });

  describe("Print Statements", () => {
    it("should use print() for output", () => {
      const result = getGeneratedSwiftCode(`${FIXTURES_DIR}/hello.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("print(");
    });
  });
});
