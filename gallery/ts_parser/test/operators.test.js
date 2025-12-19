/**
 * Operator Parsing Tests
 *
 * Tests for Issues #3, #4, #5 in TSParser:
 * - Issue #3: Ternary/Conditional Expression
 * - Issue #4: Missing binary operators (==, !=, <=, >=, %, &&, ||)
 * - Issue #5: Object literals parsed as BlockStatement
 */

import { describe, it, expect } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const {
  TSLexer,
  TSParserSimple,
} = require("../benchmark/ts_parser_module.cjs");

// Parse expression helper - returns the expression from first statement
function parseExpr(code) {
  const lexer = new TSLexer(code);
  const tokens = lexer.tokenize();
  const parser = new TSParserSimple();
  parser.initParser(tokens);
  parser.setQuiet(true);
  const program = parser.parseProgram();

  if (program && program.children && program.children.length > 0) {
    const firstStmt = program.children[0];
    if (firstStmt.nodeType === "ExpressionStatement" && firstStmt.left) {
      return firstStmt.left;
    }
    return firstStmt;
  }
  return null;
}

// ============================================================================
// Issue #4: Binary Operators
// ============================================================================

describe("Issue #4: Binary Operators", () => {
  describe("Working operators (baseline)", () => {
    it("parses + operator", () => {
      const expr = parseExpr("1 + 2");
      expect(expr.nodeType).toBe("BinaryExpression");
      expect(expr.value).toBe("+");
      expect(expr.left.value).toBe("1");
      expect(expr.right.value).toBe("2");
    });

    it("parses - operator", () => {
      const expr = parseExpr("5 - 3");
      expect(expr.nodeType).toBe("BinaryExpression");
      expect(expr.value).toBe("-");
    });

    it("parses * operator", () => {
      const expr = parseExpr("4 * 2");
      expect(expr.nodeType).toBe("BinaryExpression");
      expect(expr.value).toBe("*");
    });

    it("parses / operator", () => {
      const expr = parseExpr("8 / 2");
      expect(expr.nodeType).toBe("BinaryExpression");
      expect(expr.value).toBe("/");
    });

    it("parses < operator", () => {
      const expr = parseExpr("3 < 5");
      expect(expr.nodeType).toBe("BinaryExpression");
      expect(expr.value).toBe("<");
    });

    it("parses > operator", () => {
      const expr = parseExpr("5 > 3");
      expect(expr.nodeType).toBe("BinaryExpression");
      expect(expr.value).toBe(">");
    });
  });

  describe("Equality operators (missing)", () => {
    it("parses == operator", () => {
      const expr = parseExpr("5 == 5");
      expect(expr.nodeType).toBe("BinaryExpression");
      expect(expr.value).toBe("==");
      expect(expr.left.value).toBe("5");
      expect(expr.right.value).toBe("5");
    });

    it("parses != operator", () => {
      const expr = parseExpr("5 != 3");
      expect(expr.nodeType).toBe("BinaryExpression");
      expect(expr.value).toBe("!=");
    });

    it("parses === operator", () => {
      const expr = parseExpr("5 === 5");
      expect(expr.nodeType).toBe("BinaryExpression");
      expect(expr.value).toBe("===");
    });

    it("parses !== operator", () => {
      const expr = parseExpr("5 !== 3");
      expect(expr.nodeType).toBe("BinaryExpression");
      expect(expr.value).toBe("!==");
    });
  });

  describe("Comparison operators (missing)", () => {
    it("parses <= operator", () => {
      const expr = parseExpr("5 <= 5");
      expect(expr.nodeType).toBe("BinaryExpression");
      expect(expr.value).toBe("<=");
      expect(expr.left.value).toBe("5");
      expect(expr.right.value).toBe("5");
    });

    it("parses >= operator", () => {
      const expr = parseExpr("5 >= 3");
      expect(expr.nodeType).toBe("BinaryExpression");
      expect(expr.value).toBe(">=");
    });
  });

  describe("Arithmetic operators (missing)", () => {
    it("parses % modulo operator", () => {
      const expr = parseExpr("17 % 5");
      expect(expr.nodeType).toBe("BinaryExpression");
      expect(expr.value).toBe("%");
      expect(expr.left.value).toBe("17");
      expect(expr.right.value).toBe("5");
    });
  });

  describe("Logical operators (missing)", () => {
    it("parses && operator", () => {
      const expr = parseExpr("true && false");
      expect(expr.nodeType).toBe("BinaryExpression");
      expect(expr.value).toBe("&&");
      expect(expr.left.value).toBe("true");
      expect(expr.right.value).toBe("false");
    });

    it("parses || operator", () => {
      const expr = parseExpr("false || true");
      expect(expr.nodeType).toBe("BinaryExpression");
      expect(expr.value).toBe("||");
      expect(expr.left.value).toBe("false");
      expect(expr.right.value).toBe("true");
    });
  });
});

// ============================================================================
// Issue #3: Ternary/Conditional Expression
// ============================================================================

describe("Issue #3: Ternary/Conditional Expression", () => {
  it("parses simple ternary", () => {
    const expr = parseExpr("a ? 1 : 2");
    expect(expr.nodeType).toBe("ConditionalExpression");
    expect(expr.test.nodeType).toBe("Identifier");
    expect(expr.test.name).toBe("a");
    expect(expr.consequent.value).toBe("1");
    expect(expr.alternate.value).toBe("2");
  });

  it("parses ternary with boolean literal", () => {
    const expr = parseExpr("true ? 1 : 2");
    expect(expr.nodeType).toBe("ConditionalExpression");
    expect(expr.test.nodeType).toBe("BooleanLiteral");
  });

  it("parses ternary with comparison", () => {
    const expr = parseExpr("x > 0 ? 'yes' : 'no'");
    expect(expr.nodeType).toBe("ConditionalExpression");
    expect(expr.test.nodeType).toBe("BinaryExpression");
    expect(expr.test.value).toBe(">");
  });

  it("parses nested ternary", () => {
    const expr = parseExpr("a ? b ? 1 : 2 : 3");
    expect(expr.nodeType).toBe("ConditionalExpression");
    expect(expr.consequent.nodeType).toBe("ConditionalExpression");
  });
});

// ============================================================================
// Issue #5: Object Literals
// ============================================================================

describe("Issue #5: Object Literals in Expression Context", () => {
  it("parses empty object in parentheses", () => {
    const expr = parseExpr("({})");
    expect(expr.nodeType).toBe("ObjectExpression");
    expect(expr.properties || expr.children).toHaveLength(0);
  });

  it("parses object with properties in parentheses", () => {
    const expr = parseExpr('({ name: "test", value: 42 })');
    expect(expr.nodeType).toBe("ObjectExpression");
  });

  // These may fail if object literals without parens are parsed as blocks
  it("parses object in variable declaration", () => {
    const lexer = new TSLexer("const obj = { a: 1 }");
    const tokens = lexer.tokenize();
    const parser = new TSParserSimple();
    parser.initParser(tokens);
    parser.setQuiet(true);
    const program = parser.parseProgram();

    const decl = program.children[0];
    expect(decl.nodeType).toBe("VariableDeclaration");
    // The init should be an ObjectExpression
    const init = decl.children?.[0]?.init || decl.left?.init;
    expect(init?.nodeType).toBe("ObjectExpression");
  });
});

describe("Operator Precedence", () => {
  it("* has higher precedence than +", () => {
    // 2 + 3 * 4 should parse as 2 + (3 * 4)
    const expr = parseExpr("2 + 3 * 4");
    expect(expr.nodeType).toBe("BinaryExpression");
    expect(expr.value).toBe("+");
    expect(expr.left.value).toBe("2");
    expect(expr.right.nodeType).toBe("BinaryExpression");
    expect(expr.right.value).toBe("*");
    expect(expr.right.left.value).toBe("3");
    expect(expr.right.right.value).toBe("4");
  });

  it("/ has higher precedence than -", () => {
    // 10 - 6 / 2 should parse as 10 - (6 / 2)
    const expr = parseExpr("10 - 6 / 2");
    expect(expr.value).toBe("-");
    expect(expr.left.value).toBe("10");
    expect(expr.right.value).toBe("/");
  });

  it("% has higher precedence than +", () => {
    // 5 + 10 % 3 should parse as 5 + (10 % 3)
    const expr = parseExpr("5 + 10 % 3");
    expect(expr.value).toBe("+");
    expect(expr.right.value).toBe("%");
  });

  it("** is parsed (same precedence as * for now)", () => {
    // NOTE: In JS, ** has higher precedence than * and is right-associative
    // Current parser treats ** same as *, which works for most cases
    const expr = parseExpr("2 ** 3");
    expect(expr.value).toBe("**");
    expect(expr.left.value).toBe("2");
    expect(expr.right.value).toBe("3");
  });

  it("comparison has lower precedence than arithmetic", () => {
    // 2 + 3 < 10 should parse as (2 + 3) < 10
    const expr = parseExpr("2 + 3 < 10");
    expect(expr.value).toBe("<");
    expect(expr.left.value).toBe("+");
    expect(expr.right.value).toBe("10");
  });

  it("&& has lower precedence than comparison", () => {
    // a < 5 && b > 3 should parse as (a < 5) && (b > 3)
    const expr = parseExpr("a < 5 && b > 3");
    expect(expr.value).toBe("&&");
    expect(expr.left.value).toBe("<");
    expect(expr.right.value).toBe(">");
  });

  it("|| has lower precedence than &&", () => {
    // a && b || c should parse as (a && b) || c
    const expr = parseExpr("a && b || c");
    expect(expr.value).toBe("||");
    expect(expr.left.value).toBe("&&");
    expect(expr.right.name).toBe("c");
  });
});
