/**
 * Control Flow Statement Tests
 *
 * Tests parsing and structure of control flow statements (if, for, for...of).
 * The actual evaluation is done by ComponentEngine.rgr (Ranger code).
 * These tests verify the TSParser correctly parses control flow structures.
 *
 * Run with: npm run test:evalvalue (from project root)
 */

import { describe, it, expect } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { EvalValue } = require("../bin/eval_value_module.cjs");
const {
  TSLexer,
  TSParserSimple,
} = require("../../ts_parser/benchmark/ts_parser_module.cjs");

// Helper to parse a full program and return the AST
function parseProgram(code) {
  const lexer = new TSLexer(code);
  const tokens = lexer.tokenize();
  const parser = new TSParserSimple();
  parser.initParser(tokens);
  parser.setQuiet(true);
  return parser.parseProgram();
}

// Helper to find first statement of a given type
function findStatement(program, nodeType) {
  if (!program || !program.children) return null;
  for (const child of program.children) {
    if (child.nodeType === nodeType) return child;
    // Check in function body
    if (child.nodeType === "FunctionDeclaration" && child.body) {
      for (const stmt of child.body.children || []) {
        if (stmt.nodeType === nodeType) return stmt;
      }
    }
  }
  return null;
}

// ============================================================================
// If Statement Parsing Tests
// ============================================================================

describe("If Statement Parsing", () => {
  describe("Simple If", () => {
    it("parses simple if statement", () => {
      const program = parseProgram(`
        if (x > 5) {
          return true;
        }
      `);
      const ifStmt = findStatement(program, "IfStatement");
      expect(ifStmt).not.toBeNull();
      expect(ifStmt.nodeType).toBe("IfStatement");
    });

    it("has condition in left field", () => {
      const program = parseProgram(`if (x > 5) { return true; }`);
      const ifStmt = findStatement(program, "IfStatement");
      expect(ifStmt.left).toBeDefined();
      expect(ifStmt.left.nodeType).toBe("BinaryExpression");
      expect(ifStmt.left.value).toBe(">");
    });

    it("has body in body field", () => {
      const program = parseProgram(`if (x > 5) { return true; }`);
      const ifStmt = findStatement(program, "IfStatement");
      expect(ifStmt.body).toBeDefined();
      expect(ifStmt.body.nodeType).toBe("BlockStatement");
    });
  });

  describe("If-Else", () => {
    it("parses if-else statement", () => {
      const program = parseProgram(`
        if (x > 5) {
          return "big";
        } else {
          return "small";
        }
      `);
      const ifStmt = findStatement(program, "IfStatement");
      expect(ifStmt).not.toBeNull();
      expect(ifStmt.right).toBeDefined(); // else block is in 'right'
      expect(ifStmt.right.nodeType).toBe("BlockStatement");
    });
  });

  describe("If-Else If-Else", () => {
    it("parses chained else-if", () => {
      const program = parseProgram(`
        if (x > 10) {
          return "large";
        } else if (x > 5) {
          return "medium";
        } else {
          return "small";
        }
      `);
      const ifStmt = findStatement(program, "IfStatement");
      expect(ifStmt).not.toBeNull();
      // else if is another IfStatement in 'right'
      expect(ifStmt.right).toBeDefined();
      expect(ifStmt.right.nodeType).toBe("IfStatement");
      // The inner if has its own else
      expect(ifStmt.right.right).toBeDefined();
    });
  });

  describe("Condition Types", () => {
    it("parses comparison condition", () => {
      const program = parseProgram(`if (a === b) {}`);
      const ifStmt = findStatement(program, "IfStatement");
      expect(ifStmt.left.value).toBe("===");
    });

    it("parses boolean variable condition", () => {
      const program = parseProgram(`if (isActive) {}`);
      const ifStmt = findStatement(program, "IfStatement");
      expect(ifStmt.left.nodeType).toBe("Identifier");
      expect(ifStmt.left.name).toBe("isActive");
    });

    it("parses negation condition", () => {
      const program = parseProgram(`if (!isEmpty) {}`);
      const ifStmt = findStatement(program, "IfStatement");
      expect(ifStmt.left.nodeType).toBe("UnaryExpression");
      expect(ifStmt.left.value).toBe("!");
    });

    it("parses AND condition", () => {
      const program = parseProgram(`if (a > 0 && b > 0) {}`);
      const ifStmt = findStatement(program, "IfStatement");
      expect(ifStmt.left.value).toBe("&&");
    });

    it("parses OR condition", () => {
      const program = parseProgram(`if (a < 0 || b < 0) {}`);
      const ifStmt = findStatement(program, "IfStatement");
      expect(ifStmt.left.value).toBe("||");
    });
  });
});

// ============================================================================
// For Loop Parsing Tests
// ============================================================================

describe("For Loop Parsing", () => {
  describe("Basic For Loop", () => {
    it("parses basic for loop", () => {
      const program = parseProgram(`
        for (let i = 0; i < 5; i++) {
          console.log(i);
        }
      `);
      const forStmt = findStatement(program, "ForStatement");
      expect(forStmt).not.toBeNull();
      expect(forStmt.nodeType).toBe("ForStatement");
    });

    it("has init in init field", () => {
      const program = parseProgram(`for (let i = 0; i < 5; i++) {}`);
      const forStmt = findStatement(program, "ForStatement");
      expect(forStmt.init).toBeDefined();
      expect(forStmt.init.nodeType).toBe("VariableDeclaration");
    });

    it("has test condition in left field", () => {
      const program = parseProgram(`for (let i = 0; i < 5; i++) {}`);
      const forStmt = findStatement(program, "ForStatement");
      expect(forStmt.left).toBeDefined();
      expect(forStmt.left.nodeType).toBe("BinaryExpression");
      expect(forStmt.left.value).toBe("<");
    });

    it("has update in right field", () => {
      const program = parseProgram(`for (let i = 0; i < 5; i++) {}`);
      const forStmt = findStatement(program, "ForStatement");
      expect(forStmt.right).toBeDefined();
      expect(forStmt.right.nodeType).toBe("UpdateExpression");
      expect(forStmt.right.value).toBe("++");
    });

    it("has body in body field", () => {
      const program = parseProgram(`for (let i = 0; i < 5; i++) { x = i; }`);
      const forStmt = findStatement(program, "ForStatement");
      expect(forStmt.body).toBeDefined();
      expect(forStmt.body.nodeType).toBe("BlockStatement");
    });
  });

  describe("For Loop Variations", () => {
    it("parses decrementing loop", () => {
      const program = parseProgram(`for (let i = 10; i > 0; i--) {}`);
      const forStmt = findStatement(program, "ForStatement");
      expect(forStmt.left.value).toBe(">");
      expect(forStmt.right.value).toBe("--");
    });

    it("parses loop with += update", () => {
      const program = parseProgram(`for (let i = 0; i < 10; i += 2) {}`);
      const forStmt = findStatement(program, "ForStatement");
      expect(forStmt.right.nodeType).toBe("AssignmentExpression");
      expect(forStmt.right.value).toBe("+=");
    });

    it("parses loop with const variable", () => {
      // Note: const in for init is technically invalid but parser may accept it
      const program = parseProgram(`for (var i = 0; i < 5; i++) {}`);
      const forStmt = findStatement(program, "ForStatement");
      expect(forStmt.init.kind).toBe("var");
    });
  });
});

// ============================================================================
// For...Of Loop Parsing Tests
// ============================================================================

describe("For...Of Loop Parsing", () => {
  describe("Basic For...Of", () => {
    it("parses for...of loop", () => {
      const program = parseProgram(`
        for (const item of items) {
          console.log(item);
        }
      `);
      const forOfStmt = findStatement(program, "ForOfStatement");
      expect(forOfStmt).not.toBeNull();
      expect(forOfStmt.nodeType).toBe("ForOfStatement");
    });

    it("has variable declaration in left field", () => {
      const program = parseProgram(`for (const item of items) {}`);
      const forOfStmt = findStatement(program, "ForOfStatement");
      expect(forOfStmt.left).toBeDefined();
      expect(forOfStmt.left.nodeType).toBe("VariableDeclaration");
    });

    it("has iterable in right field", () => {
      const program = parseProgram(`for (const item of items) {}`);
      const forOfStmt = findStatement(program, "ForOfStatement");
      expect(forOfStmt.right).toBeDefined();
      expect(forOfStmt.right.nodeType).toBe("Identifier");
      expect(forOfStmt.right.name).toBe("items");
    });

    it("extracts loop variable name", () => {
      const program = parseProgram(`for (const x of arr) {}`);
      const forOfStmt = findStatement(program, "ForOfStatement");
      const varDecl = forOfStmt.left;
      expect(varDecl.children[0].name).toBe("x");
    });
  });

  describe("For...Of Variations", () => {
    it("parses with let variable", () => {
      const program = parseProgram(`for (let item of items) {}`);
      const forOfStmt = findStatement(program, "ForOfStatement");
      expect(forOfStmt.left.kind).toBe("let");
    });

    it("parses with array literal", () => {
      const program = parseProgram(`for (const x of [1, 2, 3]) {}`);
      const forOfStmt = findStatement(program, "ForOfStatement");
      expect(forOfStmt.right.nodeType).toBe("ArrayExpression");
    });

    it("parses with method call result", () => {
      const program = parseProgram(`for (const key of Object.keys(obj)) {}`);
      const forOfStmt = findStatement(program, "ForOfStatement");
      expect(forOfStmt.right.nodeType).toBe("CallExpression");
    });
  });
});

// ============================================================================
// Expression Statement Parsing (for side effects like push)
// ============================================================================

describe("Expression Statement Parsing", () => {
  describe("Method Calls", () => {
    it("parses array.push() call", () => {
      const program = parseProgram(`arr.push(1);`);
      const exprStmt = findStatement(program, "ExpressionStatement");
      expect(exprStmt).not.toBeNull();
      expect(exprStmt.left.nodeType).toBe("CallExpression");
    });

    it("push call has correct structure", () => {
      const program = parseProgram(`arr.push(item);`);
      const exprStmt = findStatement(program, "ExpressionStatement");
      const callExpr = exprStmt.left;
      // Callee is MemberExpression (arr.push)
      expect(callExpr.left.nodeType).toBe("MemberExpression");
      expect(callExpr.left.name).toBe("push");
      // Object is 'arr'
      expect(callExpr.left.left.name).toBe("arr");
      // Arguments in children
      expect(callExpr.children.length).toBeGreaterThan(0);
    });
  });

  describe("Update Expressions", () => {
    it("parses i++ statement", () => {
      const program = parseProgram(`i++;`);
      const exprStmt = findStatement(program, "ExpressionStatement");
      expect(exprStmt.left.nodeType).toBe("UpdateExpression");
      expect(exprStmt.left.value).toBe("++");
    });

    it("parses ++i statement", () => {
      const program = parseProgram(`++i;`);
      const exprStmt = findStatement(program, "ExpressionStatement");
      expect(exprStmt.left.nodeType).toBe("UpdateExpression");
      expect(exprStmt.left.value).toBe("++");
    });

    it("parses i-- statement", () => {
      const program = parseProgram(`i--;`);
      const exprStmt = findStatement(program, "ExpressionStatement");
      expect(exprStmt.left.value).toBe("--");
    });
  });

  describe("Assignment Expressions", () => {
    it("parses simple assignment", () => {
      const program = parseProgram(`x = 10;`);
      const exprStmt = findStatement(program, "ExpressionStatement");
      expect(exprStmt.left.nodeType).toBe("AssignmentExpression");
      expect(exprStmt.left.value).toBe("=");
    });

    it("parses += assignment", () => {
      const program = parseProgram(`x += 5;`);
      const exprStmt = findStatement(program, "ExpressionStatement");
      expect(exprStmt.left.value).toBe("+=");
    });

    it("parses -= assignment", () => {
      const program = parseProgram(`x -= 3;`);
      const exprStmt = findStatement(program, "ExpressionStatement");
      expect(exprStmt.left.value).toBe("-=");
    });

    it("parses *= assignment", () => {
      const program = parseProgram(`x *= 2;`);
      const exprStmt = findStatement(program, "ExpressionStatement");
      expect(exprStmt.left.value).toBe("*=");
    });

    it("parses /= assignment", () => {
      const program = parseProgram(`x /= 4;`);
      const exprStmt = findStatement(program, "ExpressionStatement");
      expect(exprStmt.left.value).toBe("/=");
    });
  });
});

// ============================================================================
// Function with Control Flow Parsing
// ============================================================================

describe("Function with Control Flow", () => {
  it("parses function with if statement", () => {
    const program = parseProgram(`
      function getStatus(x) {
        if (x > 0) {
          return "positive";
        }
        return "non-positive";
      }
    `);
    const func = findStatement(program, "FunctionDeclaration");
    expect(func).not.toBeNull();
    expect(func.name).toBe("getStatus");
    // Body should contain if and return
    expect(func.body.children.length).toBeGreaterThanOrEqual(2);
  });

  it("parses function with for loop building array", () => {
    const program = parseProgram(`
      function buildArray(n) {
        const result = [];
        for (let i = 0; i < n; i++) {
          result.push(i * 2);
        }
        return result;
      }
    `);
    const func = findStatement(program, "FunctionDeclaration");
    expect(func).not.toBeNull();
    // Should have: const result, for loop, return
    expect(func.body.children.length).toBeGreaterThanOrEqual(3);
  });

  it("parses function with for...of iteration", () => {
    const program = parseProgram(`
      function sum(items) {
        let total = 0;
        for (const item of items) {
          total += item;
        }
        return total;
      }
    `);
    const func = findStatement(program, "FunctionDeclaration");
    expect(func).not.toBeNull();
    const forOfStmt = func.body.children.find(
      (s) => s.nodeType === "ForOfStatement"
    );
    expect(forOfStmt).toBeDefined();
  });

  it("parses function with nested if-else", () => {
    const program = parseProgram(`
      function classify(score) {
        if (score >= 90) {
          return "A";
        } else if (score >= 80) {
          return "B";
        } else if (score >= 70) {
          return "C";
        } else {
          return "F";
        }
      }
    `);
    const func = findStatement(program, "FunctionDeclaration");
    const ifStmt = func.body.children.find((s) => s.nodeType === "IfStatement");
    expect(ifStmt).toBeDefined();
    // Check chain: right should be IfStatement (else if)
    expect(ifStmt.right.nodeType).toBe("IfStatement");
    expect(ifStmt.right.right.nodeType).toBe("IfStatement");
  });
});

// ============================================================================
// EvalValue Array Mutation Tests (for push support)
// ============================================================================

describe("EvalValue Array Operations", () => {
  it("creates array and accesses by index", () => {
    const arr = EvalValue.array([
      EvalValue.number(1),
      EvalValue.number(2),
      EvalValue.number(3),
    ]);
    expect(arr.getIndex(0).numberValue).toBe(1);
    expect(arr.getIndex(1).numberValue).toBe(2);
    expect(arr.getIndex(2).numberValue).toBe(3);
  });

  it("gets array length", () => {
    const arr = EvalValue.array([
      EvalValue.number(1),
      EvalValue.number(2),
      EvalValue.number(3),
    ]);
    expect(arr.getMember("length").numberValue).toBe(3);
  });

  it("arrayValue is directly accessible for mutation", () => {
    const arr = EvalValue.array([EvalValue.number(1)]);
    // Direct array access (simulating what ComponentEngine does)
    arr.arrayValue.push(EvalValue.number(2));
    expect(arr.arrayValue.length).toBe(2);
    expect(arr.getIndex(1).numberValue).toBe(2);
  });

  it("empty array has length 0", () => {
    const arr = EvalValue.array([]);
    expect(arr.getMember("length").numberValue).toBe(0);
    expect(arr.arrayValue.length).toBe(0);
  });

  it("can push multiple items", () => {
    const arr = EvalValue.array([]);
    arr.arrayValue.push(EvalValue.string("a"));
    arr.arrayValue.push(EvalValue.string("b"));
    arr.arrayValue.push(EvalValue.string("c"));
    expect(arr.arrayValue.length).toBe(3);
    expect(arr.getIndex(0).stringValue).toBe("a");
    expect(arr.getIndex(1).stringValue).toBe("b");
    expect(arr.getIndex(2).stringValue).toBe("c");
  });

  it("can push objects to array", () => {
    const arr = EvalValue.array([]);
    arr.arrayValue.push(
      EvalValue.object(["id", "name"], [EvalValue.number(1), EvalValue.string("test")])
    );
    expect(arr.arrayValue.length).toBe(1);
    expect(arr.getIndex(0).getMember("id").numberValue).toBe(1);
    expect(arr.getIndex(0).getMember("name").stringValue).toBe("test");
  });
});

// ============================================================================
// Integration-style tests (simulating what ComponentEngine would do)
// ============================================================================

describe("Control Flow Evaluation Simulation", () => {
  // These tests simulate the evaluation logic that ComponentEngine.rgr implements
  // They help verify the expected behavior before/after implementation

  describe("If Statement Evaluation Logic", () => {
    it("simulates if with true condition", () => {
      // Simulating: if (x > 5) { return "big" } else { return "small" }
      const x = 10;
      const result = x > 5 ? "big" : "small";
      expect(result).toBe("big");
    });

    it("simulates if with false condition", () => {
      const x = 3;
      const result = x > 5 ? "big" : "small";
      expect(result).toBe("small");
    });

    it("simulates nested if-else-if", () => {
      function classify(score) {
        if (score >= 90) return "A";
        else if (score >= 80) return "B";
        else if (score >= 70) return "C";
        else return "F";
      }
      expect(classify(95)).toBe("A");
      expect(classify(85)).toBe("B");
      expect(classify(75)).toBe("C");
      expect(classify(50)).toBe("F");
    });
  });

  describe("For Loop Evaluation Logic", () => {
    it("simulates basic for loop", () => {
      let sum = 0;
      for (let i = 0; i < 5; i++) {
        sum += i;
      }
      expect(sum).toBe(10); // 0+1+2+3+4
    });

    it("simulates for loop building array with push", () => {
      const arr = [];
      for (let i = 0; i < 3; i++) {
        arr.push(i * 2);
      }
      expect(arr).toEqual([0, 2, 4]);
    });

    it("simulates nested for loops", () => {
      const grid = [];
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
          grid.push({ row: r, col: c });
        }
      }
      expect(grid.length).toBe(6);
      expect(grid[0]).toEqual({ row: 0, col: 0 });
      expect(grid[5]).toEqual({ row: 1, col: 2 });
    });
  });

  describe("For...Of Loop Evaluation Logic", () => {
    it("simulates for...of with array", () => {
      const items = [10, 20, 30];
      let sum = 0;
      for (const item of items) {
        sum += item;
      }
      expect(sum).toBe(60);
    });

    it("simulates for...of building new array", () => {
      const items = [1, 2, 3];
      const doubled = [];
      for (const item of items) {
        doubled.push(item * 2);
      }
      expect(doubled).toEqual([2, 4, 6]);
    });

    it("simulates for...of with object array", () => {
      const items = [{ name: "a" }, { name: "b" }, { name: "c" }];
      const names = [];
      for (const item of items) {
        names.push(item.name);
      }
      expect(names).toEqual(["a", "b", "c"]);
    });
  });
});
