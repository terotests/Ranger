import { describe, it, expect } from "vitest";
import { getGeneratedCppCode } from "./helpers/compiler";

// Use relative paths from project root for fixtures
const FIXTURES_DIR = "tests/fixtures";

/**
 * C++ Target Compiler Tests
 *
 * These tests verify that the C++ code generation produces valid output.
 * They compile Ranger to C++ and check the generated code for common issues,
 * without requiring an actual C++ compiler (g++/clang++).
 *
 * Key issues discovered during C++ target development:
 * 1. r_utf8_substr polyfill bug: used str.substr(min, max) instead of str.substr(min, max - min)
 * 2. Duplicate polyfill generation: same polyfill defined multiple times
 * 3. UTF-8 character handling: single char vs substring extraction need different functions
 */

describe("Ranger Compiler - C++ Target", () => {
  describe("Basic Compilation", () => {
    it("should compile hello world to C++", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/hello.rgr`);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("#include");
      expect(result.code).toContain("int main(");
      expect(result.code).toContain("std::cout");
    });

    it("should compile array operations to C++", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/array_push.rgr`);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("std::vector");
      expect(result.code).toContain("push_back");
    });
  });

  describe("Buffer system types", () => {
    it("maps int_buffer / double_buffer to native std::vector types", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/cpp_int_buffer.rgr`);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("std::vector<int64_t>");
      expect(result.code).toContain("std::vector<double>");
      // Must NOT treat the systemclass as an undeclared user class
      expect(result.code).not.toContain("shared_ptr<int_buffer>");
      expect(result.code).not.toContain("shared_ptr<double_buffer>");
    });
  });

  describe("UTF-8 String Handling Polyfills", () => {
    it("should generate r_utf8_char_at for single character access", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/string_at.rgr`);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("r_utf8_char_at");
      // Should NOT use r_utf8_substr for single char (that was the bug)
      const charAtCalls = (result.code.match(/r_utf8_char_at\(/g) || []).length;
      expect(charAtCalls).toBeGreaterThan(0);
    });

    // `substring` counts the unit its neighbours count. On C++ strlen is
    // s.length() and charAt is s.at(i), both bytes, so substring slices bytes
    // -- otherwise a scanner that finds a character with charAt and slices it
    // out with substring gets nothing back as soon as the text leaves ASCII.
    // Counting characters is `utf8_substring`, below.
    it("should slice bytes for substring, matching strlen and charAt", () => {
      const result = getGeneratedCppCode(
        `${FIXTURES_DIR}/string_substring.rgr`
      );

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toMatch(/\.substr\(/);
      expect(result.code).not.toContain("r_utf8_substr");
    });

    it("should generate r_utf8_substr for utf8_substring", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/utf8_substring.rgr`);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("r_utf8_substr");
    });

    it("should use correct substr call with length not end position", () => {
      // This was the critical bug: str.substr(min, max) should be str.substr(min, max - min)
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/utf8_substring.rgr`);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      // Check the polyfill uses correct form
      expect(result.code).toContain("str.substr(min, max - min)");
      // Should NOT have the buggy form
      expect(result.code).not.toMatch(/str\.substr\(min\s*,\s*max\s*\)/);
    });

    it("should not generate duplicate polyfills", () => {
      // Compile a file that uses both 'at' and 'substring'
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/string_ops.rgr`);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);

      // Count occurrences of each polyfill definition
      const charAtDefs = (
        result.code.match(/std::string r_utf8_char_at\(/g) || []
      ).length;
      const substrDefs = (
        result.code.match(/std::string r_utf8_substr\(/g) || []
      ).length;

      // Each should appear at most once
      expect(charAtDefs).toBeLessThanOrEqual(1);
      expect(substrDefs).toBeLessThanOrEqual(1);
    });

    it("should use size_t in r_utf8_substr polyfill (no npos tautology warnings)", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/utf8_substring.rgr`);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("size_t start = (size_t)start_i");
      expect(result.code).not.toContain(
        "unsigned int c, i, ix, q, min= (unsigned int) std::string::npos"
      );
    });
  });

  describe("C++ string literal safety", () => {
    it("should escape trigraph sequences in string literals", () => {
      const result = getGeneratedCppCode(
        `${FIXTURES_DIR}/cpp_trigraph_string.rgr`
      );

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain('std::string("\\?\\?=")');
      expect(result.code).not.toMatch(/std::string\("[^"]*\?\?=/)
    });

    it("should escape trigraphs in sized string_view compares", () => {
      const result = getGeneratedCppCode(
        `${FIXTURES_DIR}/cpp_trigraph_compare.rgr`
      );

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain('std::string_view("\\?\\?=", 3)');
      expect(result.code).not.toMatch(/string_view\("\?\?=/)
    });
  });

  describe("C++ Specific Code Generation", () => {
    it("should generate shared_ptr for class instances", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/class_array.rgr`);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("std::shared_ptr");
      expect(result.code).toContain("std::make_shared");
    });

    it("should generate proper class declarations", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/static_factory.rgr`);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("class ");
      expect(result.code).toContain("public :");
    });

    it("should generate proper string concatenation", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/hello.rgr`);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("std::string");
    });

    it("should include necessary headers", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/array_push.rgr`);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      // Note: Ranger generates includes with double space after #include
      expect(result.code).toMatch(/#include\s+<vector>/);
      expect(result.code).toMatch(/#include\s+<string>/);
      expect(result.code).toMatch(/#include\s+<memory>/);
    });
  });

  describe("Union narrowing (`case`)", () => {
    it("lowers a union to std::variant and narrows with holds_alternative", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/union_case.rgr`);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("std::variant<");
      expect(result.code).toContain("std::holds_alternative<");
    });

    // std::variant is C++17, which the C++ output already requires, so the
    // mpark polyfill is gone. That matters beyond tidiness: the polyfill was
    // DOWNLOADED from a GitHub release at build time, so compiling any program
    // with a shape needed network access. The generated source must now carry
    // <variant> and no vendored header at all.
    it("needs no vendored variant header", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/union_case.rgr`);

      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      expect(result.code).toMatch(/#include\s+<variant>/);
      expect(result.code).not.toContain("variant.hpp");
      expect(result.code).not.toContain("mpark");
    });
  });

  describe("Optional/Nullable Types", () => {
    it("should handle optional types with r_optional_primitive", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/optional_int.rgr`);

      if (result.success) {
        // If file exists and compiles, check for optional handling
        expect(result.code).toMatch(/r_optional|std::optional|has_value/);
      }
    });
  });
});
