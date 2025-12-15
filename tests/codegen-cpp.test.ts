import { describe, it, expect } from "vitest";
import { getGeneratedCppCode } from "./helpers/compiler";

const FIXTURES_DIR = "tests/fixtures";

describe("C++ Code Generation", () => {
  describe("Vector Operations", () => {
    it("should generate std::vector for arrays", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/array_push.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("std::vector");
    });

    it("should use .push_back() for vector append", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/array_push.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain(".push_back(");
    });

    it("should generate vector operations", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/local_array.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Compiler may unroll small loops - verify push_back operations
      expect(result.code).toContain(".push_back(");
    });
  });

  describe("String Operations", () => {
    it("should use std::string type", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/string_ops.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("std::string");
    });

    it("should use proper string methods", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/string_methods.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // C++ uses .length() or .size(), .substr(), etc.
      expect(result.code).toMatch(/\.length\(\)|\.size\(\)|\.substr\(/);
    });
  });

  describe("Type System", () => {
    it("should generate proper type declarations", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/math_ops.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // C++ uses int, double, bool, std::string
      expect(result.code).toMatch(/\bint\b|\bdouble\b|\bbool\b|std::string/);
    });

    it("should use proper variable declarations", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/array_push.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // C++ can use auto or explicit type
      expect(result.code).toMatch(/\bauto\b|\bint\b|\bstd::/);
    });
  });

  describe("Memory Management", () => {
    it("should use smart pointers for objects", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/two_classes.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Modern C++ should use shared_ptr or unique_ptr
      expect(result.code).toMatch(/std::shared_ptr|std::unique_ptr|std::make_shared|std::make_unique/);
    });

    it("should use new or make_shared for object creation", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/static_factory.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toMatch(/\bnew\b|make_shared|make_unique/);
    });
  });

  describe("Class Features", () => {
    it("should generate class keyword", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/two_classes.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("class ");
    });

    it("should use public access specifier", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/two_classes.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // C++ uses "public :" with space before colon
      expect(result.code).toContain("public :");
    });

    it("should generate constructors", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/static_factory.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // C++ constructor has same name as class
      expect(result.code).toMatch(/\w+\s*\([^)]*\)\s*{/);
    });

    it("should use static keyword for static methods", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/static_factory.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("static ");
    });
  });

  describe("Optional/Nullable Types", () => {
    it("should handle null values with NULL", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/optional_values.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // C++ uses NULL for null checks
      expect(result.code).toContain("NULL");
    });
  });

  describe("Control Flow", () => {
    it("should generate conditional expressions", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/ternary_factory.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Ternary expressions use ? : syntax
      expect(result.code).toContain("?");
      expect(result.code).toContain(":");
    });

    it("should generate while loops", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/while_loop.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("while ");
    });
  });

  describe("Print Statements", () => {
    it("should use std::cout for output", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/hello.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("std::cout");
    });

    it("should include iostream header", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/hello.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("#include");
      expect(result.code).toContain("iostream");
    });
  });

  describe("Main Function", () => {
    it("should generate int main()", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/hello.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toMatch(/int\s+main\s*\(/);
    });

    it("should return 0 at end of main", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/hello.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("return 0");
    });
  });

  describe("Include Guards / Headers", () => {
    it("should include necessary headers", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/array_push.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("#include");
      expect(result.code).toContain("<vector>");
    });
  });
});
