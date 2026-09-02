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

  describe("Nested Collections", () => {
    it("should render nested array/dictionary element types", () => {
      const result = getGeneratedSwiftCode(
        `${FIXTURES_DIR}/nested_collections.rgr`
      );
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("[[String]]");
      expect(result.code).toContain("[String:[Int]]");
      expect(result.code).toContain("[[String:Int]]");
      // no raw Ranger collection type strings should leak through
      expect(result.code).not.toContain("[string]");
      expect(result.code).not.toContain("[int]");
    });
  });

  describe("String Operations", () => {
    it("should use string concatenation or String() conversion", () => {
      const result = getGeneratedSwiftCode(`${FIXTURES_DIR}/string_ops.rgr`);
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Swift uses String() for type conversion in concatenation
      expect(result.code).toMatch(/String\(|\+ "/);
    });

    it("should generate proper string methods", () => {
      const result = getGeneratedSwiftCode(
        `${FIXTURES_DIR}/string_methods.rgr`
      );
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
      const result = getGeneratedSwiftCode(
        `${FIXTURES_DIR}/ternary_factory.rgr`
      );
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Classes with constructor params generate init()
      expect(result.code).toContain("init(");
    });

    it("should generate class func for static methods", () => {
      const result = getGeneratedSwiftCode(
        `${FIXTURES_DIR}/static_factory.rgr`
      );
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Swift uses "class func" for type methods (equivalent to static)
      expect(result.code).toContain("class func");
    });

    it("should emit argument labels for static calls in expressions", () => {
      const result = getGeneratedSwiftCode(
        `${FIXTURES_DIR}/swift_static_call_labels.rgr`
      );
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toMatch(/NumUtil\.parseStrict\(s\s*:/);
      expect(result.code).not.toMatch(
        /\(NumUtil\)\.parseStrict\([^s]/
      );
    });
  });

  describe("Control Flow", () => {
    it("should generate conditional expressions", () => {
      const result = getGeneratedSwiftCode(
        `${FIXTURES_DIR}/ternary_factory.rgr`
      );
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
      const result = getGeneratedSwiftCode(
        `${FIXTURES_DIR}/optional_values.rgr`
      );
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
      const result = getGeneratedSwiftCode(
        `${FIXTURES_DIR}/static_factory.rgr`
      );
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("->");
    });
  });

  describe("inout parameters", () => {
    // Swift arrays, dictionaries and buffers are VALUE types, so a function
    // that mutates one of its parameters needs `inout` -- and so does every
    // function that only passes its own parameter along to that one. Fixing
    // one level at a time exposes the next, which is why the requirement is
    // inferred transitively (StaticAnalyzer.propagateArgMutRef) rather than
    // annotated by hand.
    const chain = () =>
      getGeneratedSwiftCode(`${FIXTURES_DIR}/swift_inout_chain.rgr`);

    it("marks the function that does the mutating", () => {
      const result = chain();
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("func put16(b : inout [UInt8]");
      expect(result.code).toContain("func fill(xs : inout [Int]");
    });

    it("carries the requirement up through the callers", () => {
      const result = chain();
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // putLoca only hands `out` to put16; writeLoca only hands it to putLoca
      expect(result.code).toContain("func putLoca(out : inout [UInt8]");
      expect(result.code).toContain("func writeLoca(out : inout [UInt8]");
      expect(result.code).toContain("func fillTwice(xs : inout [Int]");
    });

    it("passes &x at every call site, and never through a let", () => {
      const result = chain();
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("InoutChain.put16(b : &out");
      expect(result.code).toContain("InoutChain.putLoca(out : &out");
      expect(result.code).toContain("InoutChain.fill(xs : &xs");
    });

    it("leaves a reassigned string parameter alone, with a var copy", () => {
      const result = chain();
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // Ranger has no operator that writes into a string in place, so `s = s +
      // "x"` rebinds a local name; `inout` would make Swift alone write it back
      // to the caller and demand a `var` at every call site.
      expect(result.code).toContain("func clampName(name name__p : String)");
      expect(result.code).toContain("var name : String = name__p");
      expect(result.code).not.toContain("clampName(name : &name)");
    });
  });

  describe("let, var and char", () => {
    // Swift is stricter than any other target about three things Ranger says
    // freely: char and int are the same integer, a loop binds an index whether
    // or not the body wants it, and a binding the body never writes to should
    // be a `let`. Each of these is a warning or an error the reader has to
    // wade through to find a real one.
    const gen = () =>
      getGeneratedSwiftCode(`${FIXTURES_DIR}/swift_let_and_char.rgr`);

    it("treats char as the integer code unit it is everywhere else", () => {
      const result = gen();
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // `def ch:char (charAt text 0)` then `def code:int ch` — UInt8 made both
      // lines a type error
      expect(result.code).toContain("let ch : Int = Int(");
      expect(result.code).toContain("let code : Int = ch");
      expect(result.code).not.toContain("UInt8 = Int(");
    });

    it("writes _ for a loop index the body never reads", () => {
      const result = gen();
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("for (_, v) in values.enumerated()");
      // and keeps the name where the body does read it
      expect(result.code).toContain("for (i, v) in values.enumerated()");
    });

    it("declares a local let unless the body writes to it", () => {
      const result = gen();
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      // never written
      expect(result.code).toContain("let copyOf : [Int] = values");
      // appended to
      expect(result.code).toContain("var out : [Int] = [Int]()");
      // a Ranger class is a Swift class, so assigning its fields writes
      // through a let binding
      expect(result.code).toContain("let p : Point = Point()");
    });

    it("discards the result of a call kept for its side effect", () => {
      const result = gen();
      expect(result.success, `Failed: ${result.error}`).toBe(true);
      expect(result.code).toContain("_ = SwiftLetAndChar.counted(text : \"abc\")");
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
