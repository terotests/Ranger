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

  describe("Nested Collections", () => {
    it("should render nested vector/map element types", () => {
      const result = getGeneratedCppCode(
        `${FIXTURES_DIR}/nested_collections.rgr`
      );
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("std::vector<std::vector<std::string>>");
      expect(result.code).toContain("rg_ordered_map<std::string,std::vector<int>>");
      expect(result.code).toContain("std::vector<rg_ordered_map<std::string,int>>");
      // no raw Ranger collection type strings should leak through
      expect(result.code).not.toContain("[string]");
      expect(result.code).not.toContain("[int]");
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

  describe("Dead-store elimination", () => {
    it("should NOT eliminate an unused local whose initializer is a call (side effects)", () => {
      const result = getGeneratedCppCode(
        `${FIXTURES_DIR}/unused_call_result.rgr`
      );
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // the call must be emitted as a live statement, not commented out
      expect(result.code).toContain("->bump()");
      expect(result.code).not.toMatch(/\/\*\* unused:[^\n]*bump\(\)/);
    });

    it("should still elide a genuinely unused pure-expression local", () => {
      const result = getGeneratedCppCode(
        `${FIXTURES_DIR}/unused_call_result.rgr`
      );
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // deadPure = 2 + 3 has no side effects -> safe to comment out
      expect(result.code).toMatch(/\/\*\* unused:[^\n]*2 \+ 3/);
    });
  });

  describe("Memory Management", () => {
    it("should use smart pointers for objects", () => {
      const result = getGeneratedCppCode(`${FIXTURES_DIR}/two_classes.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Modern C++ should use shared_ptr or unique_ptr
      expect(result.code).toMatch(
        /std::shared_ptr|std::unique_ptr|std::make_shared|std::make_unique/
      );
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

  describe("Transitive mutable reference", () => {
    // A parameter passed to a callee that mutates it (but not mutated directly
    // in the caller) must still be a non-const reference, or g++ fails with
    // "binding reference ... drops const". Regression for the RasterText
    // flattenContour -> addEdge build break.
    it("should not emit a const reference for a param forwarded to a mutating callee", () => {
      const result = getGeneratedCppCode(
        `${FIXTURES_DIR}/transitive_mut_ref.rgr`
      );
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // both the direct mutator and the forwarding wrapper take non-const T&
      expect(result.code).toContain("M::addItem( std::vector<int>& arr");
      expect(result.code).toContain("M::wrap( std::vector<int>& arr");
      expect(result.code).not.toContain("const std::vector<int>& arr");
    });
  });

  describe("Buffer return by reference", () => {
    // A buffer accessor that returns a stored buffer (member field or an element
    // of a member container) must return `std::vector<uint8_t>&`, matching ES6
    // reference semantics: the result aliases the stored buffer and binds to
    // non-const reference parameters. A method returning a freshly allocated
    // local buffer must keep value semantics so it never returns a dangling
    // reference. Regression for the ThreeCubeMap::faceBuffer / copyInto build
    // break (temporary std::vector could not bind to std::vector<uint8_t>&).
    it("should return a reference for a stored-buffer accessor and value for a fresh local", () => {
      const result = getGeneratedCppCode(
        `${FIXTURES_DIR}/buffer_return_ref.rgr`
      );
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // accessor returning a member-container element -> reference return
      expect(result.code).toContain(
        "std::vector<uint8_t>&  CubeMap::faceBuffer( int face )"
      );
      // freshly-allocated local -> value return (no dangling reference)
      expect(result.code).toContain(
        "std::vector<uint8_t>  CubeMap::makeScratch( int n )"
      );
      expect(result.code).not.toContain(
        "std::vector<uint8_t>&  CubeMap::makeScratch"
      );
      // header declaration must match the out-of-line definition
      expect(result.code).toContain(
        "std::vector<uint8_t>& faceBuffer( int face );"
      );
      // The static copyInto's read-only `src` is a const reference (so it can
      // bind to a by-value buffer temporary such as renderer.raw()), while its
      // written `dst` stays a non-const reference (writes reach the caller).
      // This also exercises mutation analysis of a static (sfn) method.
      expect(result.code).toContain(
        "Worker::copyInto( const std::vector<uint8_t>& src , std::vector<uint8_t>& dst , int n )"
      );
    });
  });

  describe("Static method parameter mutation", () => {
    // Static (sfn) methods must get the same parameter-mutation analysis as
    // instance methods: a mutated buffer/array/map parameter is a non-const
    // reference (its in-place writes must reach the caller), and a read-only
    // one is a const reference. Regression for static methods previously being
    // skipped by the analysis (mutations were silently lost / could not compile).
    it("should pass mutated static-method collection params by non-const reference", () => {
      const result = getGeneratedCppCode(
        `${FIXTURES_DIR}/static_param_mutation.rgr`
      );
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // buffer written via buffer_set -> non-const reference
      expect(result.code).toContain(
        "M::sWriteBuf( std::vector<uint8_t>& dst"
      );
      // array mutated via push -> non-const reference
      expect(result.code).toContain("M::sPush( std::vector<int>& arr");
      // buffer only read -> const reference (binds to temporaries)
      expect(result.code).toContain(
        "M::sReadBuf( const std::vector<uint8_t>& src"
      );
      // destination of buffer_copy is written -> non-const reference
      expect(result.code).toContain(
        "M::sCopy( std::vector<uint8_t>& dst , const std::vector<uint8_t>& src"
      );
    });
  });
});
