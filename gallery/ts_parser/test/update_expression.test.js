/**
 * UpdateExpression and Compound Assignment Tests
 *
 * Tests for the TSParser's handling of:
 * - UpdateExpression: ++i, i++, --i, i--
 * - Compound AssignmentExpression: +=, -=, *=, /=, %=
 *
 * These features are critical for for-loop support.
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

// Parse full program helper
function parseProgram(code) {
  const lexer = new TSLexer(code);
  const tokens = lexer.tokenize();
  const parser = new TSParserSimple();
  parser.initParser(tokens);
  parser.setQuiet(true);
  return parser.parseProgram();
}

// Find statement by type helper
function findStatement(program, nodeType) {
  if (!program || !program.children) return null;
  for (const child of program.children) {
    if (child.nodeType === nodeType) return child;
    // Check in function bodies
    if (child.body && child.body.children) {
      for (const stmt of child.body.children) {
        if (stmt.nodeType === nodeType) return stmt;
      }
    }
  }
  return null;
}

// ============================================================================
// UpdateExpression Tests
// ============================================================================

describe("UpdateExpression Parsing", () => {
  describe("Postfix Increment (i++)", () => {
    it("parses i++ as UpdateExpression", () => {
      const expr = parseExpr("i++");
      expect(expr.nodeType).toBe("UpdateExpression");
    });

    it("has operator value ++", () => {
      const expr = parseExpr("i++");
      expect(expr.value).toBe("++");
    });

    it("has prefix = false for postfix", () => {
      const expr = parseExpr("i++");
      expect(expr.prefix).toBe(false);
    });

    it("has left node as Identifier", () => {
      const expr = parseExpr("i++");
      expect(expr.left).toBeDefined();
      expect(expr.left.nodeType).toBe("Identifier");
      expect(expr.left.name).toBe("i");
    });

    it("parses count++ with different identifier", () => {
      const expr = parseExpr("count++");
      expect(expr.nodeType).toBe("UpdateExpression");
      expect(expr.value).toBe("++");
      expect(expr.left.name).toBe("count");
    });
  });

  describe("Prefix Increment (++i)", () => {
    it("parses ++i as UpdateExpression", () => {
      const expr = parseExpr("++i");
      expect(expr.nodeType).toBe("UpdateExpression");
    });

    it("has operator value ++", () => {
      const expr = parseExpr("++i");
      expect(expr.value).toBe("++");
    });

    it("has prefix = true for prefix", () => {
      const expr = parseExpr("++i");
      expect(expr.prefix).toBe(true);
    });

    it("has left node as Identifier", () => {
      const expr = parseExpr("++i");
      expect(expr.left).toBeDefined();
      expect(expr.left.nodeType).toBe("Identifier");
      expect(expr.left.name).toBe("i");
    });
  });

  describe("Postfix Decrement (i--)", () => {
    it("parses i-- as UpdateExpression", () => {
      const expr = parseExpr("i--");
      expect(expr.nodeType).toBe("UpdateExpression");
    });

    it("has operator value --", () => {
      const expr = parseExpr("i--");
      expect(expr.value).toBe("--");
    });

    it("has prefix = false for postfix", () => {
      const expr = parseExpr("i--");
      expect(expr.prefix).toBe(false);
    });

    it("has left node as Identifier", () => {
      const expr = parseExpr("i--");
      expect(expr.left.nodeType).toBe("Identifier");
      expect(expr.left.name).toBe("i");
    });
  });

  describe("Prefix Decrement (--i)", () => {
    it("parses --i as UpdateExpression", () => {
      const expr = parseExpr("--i");
      expect(expr.nodeType).toBe("UpdateExpression");
    });

    it("has operator value --", () => {
      const expr = parseExpr("--i");
      expect(expr.value).toBe("--");
    });

    it("has prefix = true for prefix", () => {
      const expr = parseExpr("--i");
      expect(expr.prefix).toBe(true);
    });
  });

  describe("UpdateExpression with member expressions", () => {
    it("parses obj.count++ as UpdateExpression on MemberExpression", () => {
      const expr = parseExpr("obj.count++");
      expect(expr.nodeType).toBe("UpdateExpression");
      expect(expr.value).toBe("++");
      expect(expr.prefix).toBe(false);
      expect(expr.left.nodeType).toBe("MemberExpression");
    });

    it("parses ++arr[0] as prefix UpdateExpression", () => {
      const expr = parseExpr("++arr[0]");
      expect(expr.nodeType).toBe("UpdateExpression");
      expect(expr.value).toBe("++");
      expect(expr.prefix).toBe(true);
    });
  });
});

// ============================================================================
// Compound Assignment Expression Tests
// ============================================================================

describe("Compound AssignmentExpression Parsing", () => {
  describe("Addition Assignment (+=)", () => {
    it("parses x += 5 as AssignmentExpression", () => {
      const expr = parseExpr("x += 5");
      expect(expr.nodeType).toBe("AssignmentExpression");
    });

    it("has operator value +=", () => {
      const expr = parseExpr("x += 5");
      expect(expr.value).toBe("+=");
    });

    it("has correct left and right nodes", () => {
      const expr = parseExpr("x += 5");
      expect(expr.left.nodeType).toBe("Identifier");
      expect(expr.left.name).toBe("x");
      expect(expr.right.nodeType).toBe("NumericLiteral");
      expect(expr.right.value).toBe("5");
    });

    it("parses compound += with expression", () => {
      const expr = parseExpr("total += a + b");
      expect(expr.nodeType).toBe("AssignmentExpression");
      expect(expr.value).toBe("+=");
      expect(expr.right.nodeType).toBe("BinaryExpression");
    });
  });

  describe("Subtraction Assignment (-=)", () => {
    it("parses x -= 3 as AssignmentExpression", () => {
      const expr = parseExpr("x -= 3");
      expect(expr.nodeType).toBe("AssignmentExpression");
      expect(expr.value).toBe("-=");
    });

    it("has correct operands", () => {
      const expr = parseExpr("balance -= withdrawal");
      expect(expr.left.name).toBe("balance");
      expect(expr.right.name).toBe("withdrawal");
    });
  });

  describe("Multiplication Assignment (*=)", () => {
    it("parses x *= 2 as AssignmentExpression", () => {
      const expr = parseExpr("x *= 2");
      expect(expr.nodeType).toBe("AssignmentExpression");
      expect(expr.value).toBe("*=");
    });

    it("has correct operands", () => {
      const expr = parseExpr("value *= multiplier");
      expect(expr.left.name).toBe("value");
      expect(expr.right.name).toBe("multiplier");
    });
  });

  describe("Division Assignment (/=)", () => {
    it("parses x /= 4 as AssignmentExpression", () => {
      const expr = parseExpr("x /= 4");
      expect(expr.nodeType).toBe("AssignmentExpression");
      expect(expr.value).toBe("/=");
    });

    it("has correct operands", () => {
      const expr = parseExpr("total /= count");
      expect(expr.left.name).toBe("total");
      expect(expr.right.name).toBe("count");
    });
  });

  describe("Modulo Assignment (%=)", () => {
    it("parses x %= 10 as AssignmentExpression", () => {
      const expr = parseExpr("x %= 10");
      expect(expr.nodeType).toBe("AssignmentExpression");
      expect(expr.value).toBe("%=");
    });
  });

  describe("Simple Assignment (=) still works", () => {
    it("parses x = 5 as AssignmentExpression", () => {
      const expr = parseExpr("x = 5");
      expect(expr.nodeType).toBe("AssignmentExpression");
      expect(expr.value).toBe("=");
    });
  });

  describe("Compound assignment with member expressions", () => {
    it("parses obj.x += 1 correctly", () => {
      const expr = parseExpr("obj.x += 1");
      expect(expr.nodeType).toBe("AssignmentExpression");
      expect(expr.value).toBe("+=");
      expect(expr.left.nodeType).toBe("MemberExpression");
    });

    it("parses arr[0] -= 5 correctly", () => {
      const expr = parseExpr("arr[0] -= 5");
      expect(expr.nodeType).toBe("AssignmentExpression");
      expect(expr.value).toBe("-=");
      expect(expr.left.nodeType).toBe("MemberExpression");
    });
  });
});

// ============================================================================
// For Loop Integration Tests
// ============================================================================

describe("For Loop with UpdateExpression", () => {
  it("parses basic for loop with i++", () => {
    const program = parseProgram("for (let i = 0; i < 10; i++) {}");
    const forStmt = findStatement(program, "ForStatement");
    expect(forStmt).toBeDefined();
    expect(forStmt.nodeType).toBe("ForStatement");
  });

  it("has correct init (VariableDeclaration)", () => {
    const program = parseProgram("for (let i = 0; i < 10; i++) {}");
    const forStmt = findStatement(program, "ForStatement");
    expect(forStmt.init).toBeDefined();
    expect(forStmt.init.nodeType).toBe("VariableDeclaration");
  });

  it("has correct test condition (BinaryExpression)", () => {
    const program = parseProgram("for (let i = 0; i < 10; i++) {}");
    const forStmt = findStatement(program, "ForStatement");
    expect(forStmt.left).toBeDefined();
    expect(forStmt.left.nodeType).toBe("BinaryExpression");
    expect(forStmt.left.value).toBe("<");
  });

  it("has correct update (UpdateExpression i++)", () => {
    const program = parseProgram("for (let i = 0; i < 10; i++) {}");
    const forStmt = findStatement(program, "ForStatement");
    expect(forStmt.right).toBeDefined();
    expect(forStmt.right.nodeType).toBe("UpdateExpression");
    expect(forStmt.right.value).toBe("++");
    expect(forStmt.right.prefix).toBe(false);
  });

  it("parses for loop with --i (prefix decrement)", () => {
    const program = parseProgram("for (let i = 10; i > 0; --i) {}");
    const forStmt = findStatement(program, "ForStatement");
    expect(forStmt.right.nodeType).toBe("UpdateExpression");
    expect(forStmt.right.value).toBe("--");
    expect(forStmt.right.prefix).toBe(true);
  });

  it("parses for loop with i-- (postfix decrement)", () => {
    const program = parseProgram("for (let i = 10; i > 0; i--) {}");
    const forStmt = findStatement(program, "ForStatement");
    expect(forStmt.right.nodeType).toBe("UpdateExpression");
    expect(forStmt.right.value).toBe("--");
    expect(forStmt.right.prefix).toBe(false);
  });

  it("parses for loop with i += 2", () => {
    const program = parseProgram("for (let i = 0; i < 10; i += 2) {}");
    const forStmt = findStatement(program, "ForStatement");
    expect(forStmt.right).toBeDefined();
    expect(forStmt.right.nodeType).toBe("AssignmentExpression");
    expect(forStmt.right.value).toBe("+=");
  });

  it("parses for loop with i -= 1", () => {
    const program = parseProgram("for (let i = 10; i > 0; i -= 1) {}");
    const forStmt = findStatement(program, "ForStatement");
    expect(forStmt.right.nodeType).toBe("AssignmentExpression");
    expect(forStmt.right.value).toBe("-=");
  });
});

// ============================================================================
// Lexer Token Tests
// ============================================================================

describe("Lexer Token Generation", () => {
  function tokenize(code) {
    const lexer = new TSLexer(code);
    return lexer.tokenize();
  }

  function getTokenValues(code) {
    return tokenize(code)
      .filter((t) => t.tokenType !== "EOF")
      .map((t) => t.value);
  }

  describe("Update operator tokens", () => {
    it("tokenizes ++ as single token", () => {
      const values = getTokenValues("i++");
      expect(values).toContain("++");
    });

    it("tokenizes -- as single token", () => {
      const values = getTokenValues("i--");
      expect(values).toContain("--");
    });

    it("tokenizes prefix ++ correctly", () => {
      const values = getTokenValues("++i");
      expect(values[0]).toBe("++");
      expect(values[1]).toBe("i");
    });
  });

  describe("Compound assignment operator tokens", () => {
    it("tokenizes += as single token", () => {
      const values = getTokenValues("x += 5");
      expect(values).toContain("+=");
    });

    it("tokenizes -= as single token", () => {
      const values = getTokenValues("x -= 5");
      expect(values).toContain("-=");
    });

    it("tokenizes *= as single token", () => {
      const values = getTokenValues("x *= 5");
      expect(values).toContain("*=");
    });

    it("tokenizes /= as single token", () => {
      const values = getTokenValues("x /= 5");
      expect(values).toContain("/=");
    });

    it("tokenizes %= as single token", () => {
      const values = getTokenValues("x %= 5");
      expect(values).toContain("%=");
    });
  });

  describe("Token order is correct", () => {
    it("x += 5 produces correct token sequence", () => {
      const values = getTokenValues("x += 5");
      expect(values).toEqual(["x", "+=", "5"]);
    });

    it("i++ produces correct token sequence", () => {
      const values = getTokenValues("i++");
      expect(values).toEqual(["i", "++"]);
    });

    it("++i produces correct token sequence", () => {
      const values = getTokenValues("++i");
      expect(values).toEqual(["++", "i"]);
    });
  });
});

// ============================================================================
// Edge Cases and Complex Expressions
// ============================================================================

describe("Complex Expressions with Update/Assignment", () => {
  it("parses result = i++ correctly", () => {
    const expr = parseExpr("result = i++");
    expect(expr.nodeType).toBe("AssignmentExpression");
    expect(expr.value).toBe("=");
    expect(expr.right.nodeType).toBe("UpdateExpression");
    expect(expr.right.value).toBe("++");
  });

  it("parses result = ++i correctly", () => {
    const expr = parseExpr("result = ++i");
    expect(expr.nodeType).toBe("AssignmentExpression");
    expect(expr.right.nodeType).toBe("UpdateExpression");
    expect(expr.right.prefix).toBe(true);
  });

  it("parses a += b += c (right-associative)", () => {
    const expr = parseExpr("a += b += c");
    expect(expr.nodeType).toBe("AssignmentExpression");
    expect(expr.value).toBe("+=");
    expect(expr.left.name).toBe("a");
    expect(expr.right.nodeType).toBe("AssignmentExpression");
    expect(expr.right.value).toBe("+=");
  });

  it("parses arr[i++] as member with update", () => {
    const expr = parseExpr("arr[i++]");
    expect(expr.nodeType).toBe("MemberExpression");
    expect(expr.right.nodeType).toBe("UpdateExpression");
  });

  it("parses function call with i++ argument", () => {
    const expr = parseExpr("foo(i++)");
    expect(expr.nodeType).toBe("CallExpression");
    // Arguments are stored in 'children' array
    expect(expr.children[0].nodeType).toBe("UpdateExpression");
  });
});
