import { describe, it, expect } from "vitest";
import {
  expectOutput,
  expectPythonOutput,
  expectGoOutput,
  expectRustOutput,
  getGeneratedCppCode,
  isPythonAvailable,
  isGoAvailable,
  isRustAvailable,
} from "./helpers/compiler";

/**
 * Compiler v4 — shape-based AstNode + Lisp parser (PLAN_COMPILER_V4.md).
 *
 * C0: construction, exhaustive match pretty-print, mutating Expression
 * children through a union-typed handle.
 * C1: AstParser emits AstNode shapes from source text (no CodeNode).
 */
const AST_PROBE = "tests/fixtures/v4_ast_probe.rgr";
const PARSE_PROBE = "tests/fixtures/v4_parse_probe.rgr";

const AST_EXPECTED = [
  "(def x:int 1)",
  "(+ 2 3.5)",
  "children:3",
  "isExpr:true",
  "isExpr:false",
  '{print "hi"}',
].join("\n");

const PARSE_EXPECTED = [
  "(def x:int 1)",
  "(+ 2 3.5)",
  '(print "hi")',
  "(f true false)",
  '{(print "hi")}',
].join("\n");

describe("compiler v4 AstNode (shapes)", () => {
  describe("C0 manual tree", () => {
    it("ES6", () => {
      expectOutput(AST_PROBE, AST_EXPECTED);
    });

    it.skipIf(!isPythonAvailable())("Python", () => {
      expectPythonOutput(AST_PROBE, AST_EXPECTED);
    });

    it.skipIf(!isGoAvailable())("Go", () => {
      expectGoOutput(AST_PROBE, AST_EXPECTED);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      expectRustOutput(AST_PROBE, AST_EXPECTED);
    });

    it("emits one class per AstNode case (C++)", () => {
      const result = getGeneratedCppCode(AST_PROBE);
      expect(result.success, `Compile failed: ${result.error}`).toBe(true);
      for (const cls of [
        "AstNode_Integer",
        "AstNode_Double",
        "AstNode_String",
        "AstNode_Boolean",
        "AstNode_VRef",
        "AstNode_Expression",
        "AstNode_Comment",
      ]) {
        expect(result.code).toContain(cls);
      }
      expect(result.code).toContain("r_union_AstNode");
      expect(result.code).not.toMatch(/class AstNode\s*[:{]/);
    });
  });

  describe("C1 shape-based parser", () => {
    it("ES6 parses S-expressions into AstNode", () => {
      expectOutput(PARSE_PROBE, PARSE_EXPECTED);
    });

    it.skipIf(!isPythonAvailable())("Python", () => {
      expectPythonOutput(PARSE_PROBE, PARSE_EXPECTED);
    });

    it.skipIf(!isGoAvailable())("Go", () => {
      expectGoOutput(PARSE_PROBE, PARSE_EXPECTED);
    });

    it.skipIf(!isRustAvailable())("Rust", () => {
      expectRustOutput(PARSE_PROBE, PARSE_EXPECTED);
    });
  });
});
