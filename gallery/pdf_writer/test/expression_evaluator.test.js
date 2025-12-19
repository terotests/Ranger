/**
 * ExpressionEvaluator Unit Tests
 *
 * Tests the expression evaluation engine using TSParser AST nodes.
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

// Helper to parse an expression
// Since TSParser doesn't have parseExpression, we parse as a program
// and extract the first expression statement
function parseExpr(code) {
  const lexer = new TSLexer(code);
  const tokens = lexer.tokenize();
  const parser = new TSParserSimple();
  parser.initParser(tokens);
  parser.setQuiet(true);
  const program = parser.parseProgram();

  // Find the first ExpressionStatement and return its expression (in 'left' field)
  if (program && program.children && program.children.length > 0) {
    const firstStmt = program.children[0];
    if (firstStmt.nodeType === "ExpressionStatement" && firstStmt.left) {
      return firstStmt.left;
    }
    // If it's already an expression, return it
    return firstStmt;
  }
  return null;
}

// Simple evaluator for testing - will be replaced by Ranger implementation
// NOTE: Adapted for TSParser AST which uses different field names than standard ESTree:
//   - BinaryExpression: operator is in 'value' field, not 'operator'
//   - UnaryExpression: argument is in 'left' field, not 'argument'
//   - MemberExpression: object is 'left', property is 'right' or 'name'
//   - LogicalExpression: parsed as BinaryExpression
//   - ArrayExpression: elements are in 'children', not 'elements'
function evaluate(ast, context = {}) {
  if (!ast) return EvalValue.null();

  switch (ast.nodeType) {
    case "NumericLiteral":
      return EvalValue.number(parseFloat(ast.value));

    case "StringLiteral":
      // Remove quotes
      let str = ast.value;
      if (
        (str.startsWith('"') && str.endsWith('"')) ||
        (str.startsWith("'") && str.endsWith("'"))
      ) {
        str = str.slice(1, -1);
      }
      return EvalValue.string(str);

    case "BooleanLiteral":
      return EvalValue.boolean(ast.value === "true" || ast.value === true);

    case "NullLiteral":
      return EvalValue.null();

    case "Identifier":
      if (context[ast.name] !== undefined) {
        return context[ast.name];
      }
      return EvalValue.null();

    case "BinaryExpression": {
      // TSParser uses 'value' for operator
      const op = ast.value;
      // Check if this is a logical operator (TSParser treats && and || as BinaryExpression)
      if (op === "&&" || op === "||") {
        const lhs = evaluate(ast.left, context);
        if (op === "&&") {
          if (!lhs.toBool()) return lhs;
          return evaluate(ast.right, context);
        }
        if (op === "||") {
          if (lhs.toBool()) return lhs;
          return evaluate(ast.right, context);
        }
      }
      const left = evaluate(ast.left, context);
      const right = evaluate(ast.right, context);
      return evalBinaryOp(op, left, right);
    }

    case "UnaryExpression": {
      // TSParser uses 'left' for argument and 'value' for operator
      const arg = evaluate(ast.left, context);
      return evalUnaryOp(ast.value, arg);
    }

    case "ConditionalExpression": {
      const test = evaluate(ast.test, context);
      if (test.toBool()) {
        return evaluate(ast.consequent, context);
      }
      return evaluate(ast.alternate, context);
    }

    case "MemberExpression": {
      // TSParser: 'left' is object, 'right' is computed index, 'name' is property name
      const obj = evaluate(ast.left, context);
      if (ast.right) {
        // Computed: arr[0] - 'right' has the index expression
        const idx = evaluate(ast.right, context);
        return obj.getIndex(Math.floor(idx.toNumber()));
      } else if (ast.name) {
        // Non-computed: obj.prop - 'name' has property name
        return obj.getMember(ast.name);
      }
      return EvalValue.null();
    }

    case "LogicalExpression": {
      const lhs = evaluate(ast.left, context);
      const op = ast.value || ast.operator;
      if (op === "&&") {
        if (!lhs.toBool()) return lhs;
        return evaluate(ast.right, context);
      }
      if (op === "||") {
        if (lhs.toBool()) return lhs;
        return evaluate(ast.right, context);
      }
      return EvalValue.null();
    }

    case "ArrayExpression": {
      // TSParser uses 'children' for array elements
      const items = (ast.children || []).map((el) => evaluate(el, context));
      return EvalValue.array(items);
    }

    case "ObjectExpression": {
      // TSParser uses 'children' for properties, 'name' for key, 'left' for value
      const keys = [];
      const values = [];
      for (const prop of ast.children || []) {
        const key =
          prop.name || (prop.key && (prop.key.name || prop.key.value));
        keys.push(key);
        const val = prop.left || prop.value;
        values.push(evaluate(val, context));
      }
      return EvalValue.object(keys, values);
    }

    default:
      console.log("Unknown node type:", ast.nodeType, ast);
      return EvalValue.null();
  }
}

function evalBinaryOp(op, left, right) {
  switch (op) {
    // Arithmetic
    case "+":
      if (left.isString() || right.isString()) {
        return EvalValue.string(left.toString() + right.toString());
      }
      return EvalValue.number(left.toNumber() + right.toNumber());
    case "-":
      return EvalValue.number(left.toNumber() - right.toNumber());
    case "*":
      return EvalValue.number(left.toNumber() * right.toNumber());
    case "/":
      return EvalValue.number(left.toNumber() / right.toNumber());
    case "%":
      return EvalValue.number(left.toNumber() % right.toNumber());

    // Comparison
    case "==":
    case "===":
      return EvalValue.boolean(left.equals(right));
    case "!=":
    case "!==":
      return EvalValue.boolean(!left.equals(right));
    case "<":
      return EvalValue.boolean(left.toNumber() < right.toNumber());
    case ">":
      return EvalValue.boolean(left.toNumber() > right.toNumber());
    case "<=":
      return EvalValue.boolean(left.toNumber() <= right.toNumber());
    case ">=":
      return EvalValue.boolean(left.toNumber() >= right.toNumber());

    default:
      return EvalValue.null();
  }
}

function evalUnaryOp(op, arg) {
  switch (op) {
    case "!":
      return EvalValue.boolean(!arg.toBool());
    case "-":
      return EvalValue.number(-arg.toNumber());
    case "+":
      return EvalValue.number(arg.toNumber());
    default:
      return EvalValue.null();
  }
}

// ============================================================================
// Tests
// ============================================================================

describe("Literal Evaluation", () => {
  it("evaluates numeric literals", () => {
    const ast = parseExpr("42");
    const result = evaluate(ast);
    expect(result.numberValue).toBe(42);
  });

  it("evaluates decimal numbers", () => {
    const ast = parseExpr("3.14159");
    const result = evaluate(ast);
    expect(result.numberValue).toBeCloseTo(3.14159);
  });

  it("evaluates string literals with double quotes", () => {
    const ast = parseExpr('"hello"');
    const result = evaluate(ast);
    expect(result.stringValue).toBe("hello");
  });

  it("evaluates string literals with single quotes", () => {
    const ast = parseExpr("'world'");
    const result = evaluate(ast);
    expect(result.stringValue).toBe("world");
  });

  it("evaluates true", () => {
    const ast = parseExpr("true");
    const result = evaluate(ast);
    expect(result.boolValue).toBe(true);
  });

  it("evaluates false", () => {
    const ast = parseExpr("false");
    const result = evaluate(ast);
    expect(result.boolValue).toBe(false);
  });

  it("evaluates null", () => {
    const ast = parseExpr("null");
    const result = evaluate(ast);
    expect(result.isNull()).toBe(true);
  });
});

describe("Arithmetic Operators", () => {
  it("evaluates addition", () => {
    const ast = parseExpr("10 + 5");
    const result = evaluate(ast);
    expect(result.numberValue).toBe(15);
  });

  it("evaluates subtraction", () => {
    const ast = parseExpr("10 - 3");
    const result = evaluate(ast);
    expect(result.numberValue).toBe(7);
  });

  it("evaluates multiplication", () => {
    const ast = parseExpr("6 * 7");
    const result = evaluate(ast);
    expect(result.numberValue).toBe(42);
  });

  it("evaluates division", () => {
    const ast = parseExpr("20 / 4");
    const result = evaluate(ast);
    expect(result.numberValue).toBe(5);
  });

  it("evaluates modulo", () => {
    const ast = parseExpr("17 % 5");
    const result = evaluate(ast);
    expect(result.numberValue).toBe(2);
  });

  it("evaluates string concatenation", () => {
    const ast = parseExpr('"hello" + " " + "world"');
    const result = evaluate(ast);
    expect(result.stringValue).toBe("hello world");
  });

  it("evaluates number + string concatenation", () => {
    const ast = parseExpr('"value: " + 42');
    const result = evaluate(ast);
    expect(result.stringValue).toBe("value: 42");
  });

  it("evaluates complex expression with precedence", () => {
    const ast = parseExpr("2 + 3 * 4");
    const result = evaluate(ast);
    // Should be 14 (3*4=12, 2+12=14) due to operator precedence
    expect(result.numberValue).toBe(14);
  });

  it("evaluates negative numbers", () => {
    const ast = parseExpr("-5 + 3");
    const result = evaluate(ast);
    expect(result.numberValue).toBe(-2);
  });
});

describe("Comparison Operators", () => {
  it("evaluates == for equal numbers", () => {
    const ast = parseExpr("5 == 5");
    const result = evaluate(ast);
    expect(result.boolValue).toBe(true);
  });

  it("evaluates == for unequal numbers", () => {
    const ast = parseExpr("5 == 3");
    const result = evaluate(ast);
    expect(result.boolValue).toBe(false);
  });

  it("evaluates != for unequal numbers", () => {
    const ast = parseExpr("5 != 3");
    const result = evaluate(ast);
    expect(result.boolValue).toBe(true);
  });

  it("evaluates < for less than", () => {
    const ast = parseExpr("3 < 5");
    const result = evaluate(ast);
    expect(result.boolValue).toBe(true);
  });

  it("evaluates > for greater than", () => {
    const ast = parseExpr("5 > 3");
    const result = evaluate(ast);
    expect(result.boolValue).toBe(true);
  });

  it("evaluates <= for less or equal", () => {
    const ast = parseExpr("5 <= 5");
    const result = evaluate(ast);
    expect(result.boolValue).toBe(true);
  });

  it("evaluates >= for greater or equal", () => {
    const ast = parseExpr("5 >= 5");
    const result = evaluate(ast);
    expect(result.boolValue).toBe(true);
  });
});

// Logical operators now supported
describe("Logical Operators", () => {
  it("evaluates && with both true", () => {
    const ast = parseExpr("true && true");
    const result = evaluate(ast);
    expect(result.toBool()).toBe(true);
  });

  it("evaluates && with one false", () => {
    const ast = parseExpr("true && false");
    const result = evaluate(ast);
    expect(result.toBool()).toBe(false);
  });

  it("evaluates || with one true", () => {
    const ast = parseExpr("false || true");
    const result = evaluate(ast);
    expect(result.toBool()).toBe(true);
  });

  it("evaluates || with both false", () => {
    const ast = parseExpr("false || false");
    const result = evaluate(ast);
    expect(result.toBool()).toBe(false);
  });

  it("evaluates ! negation", () => {
    const ast = parseExpr("!false");
    const result = evaluate(ast);
    expect(result.boolValue).toBe(true);
  });

  it("evaluates double negation", () => {
    const ast = parseExpr("!!true");
    const result = evaluate(ast);
    expect(result.toBool()).toBe(true);
  });

  it("&& short-circuits on false", () => {
    const ast = parseExpr("false && true");
    const result = evaluate(ast);
    expect(result.toBool()).toBe(false);
  });

  it("|| short-circuits on true", () => {
    const ast = parseExpr("true || false");
    const result = evaluate(ast);
    expect(result.toBool()).toBe(true);
  });
});

// Ternary operator now supported
describe("Ternary Operator", () => {
  it("evaluates true condition", () => {
    const ast = parseExpr("true ? 1 : 2");
    const result = evaluate(ast);
    expect(result.numberValue).toBe(1);
  });

  it("evaluates false condition", () => {
    const ast = parseExpr("false ? 1 : 2");
    const result = evaluate(ast);
    expect(result.numberValue).toBe(2);
  });

  it("evaluates with comparison", () => {
    const ast = parseExpr("5 > 3 ? 'yes' : 'no'");
    const result = evaluate(ast);
    expect(result.stringValue).toBe("yes");
  });

  it("evaluates nested ternary", () => {
    const ast = parseExpr("true ? (false ? 1 : 2) : 3");
    const result = evaluate(ast);
    expect(result.numberValue).toBe(2);
  });
});

describe("Variable Lookup", () => {
  it("looks up variable from context", () => {
    const ast = parseExpr("x");
    const context = { x: EvalValue.number(42) };
    const result = evaluate(ast, context);
    expect(result.numberValue).toBe(42);
  });

  it("uses variable in expression", () => {
    const ast = parseExpr("x + y");
    const context = {
      x: EvalValue.number(10),
      y: EvalValue.number(5),
    };
    const result = evaluate(ast, context);
    expect(result.numberValue).toBe(15);
  });

  it("returns null for undefined variable", () => {
    const ast = parseExpr("undefined_var");
    const result = evaluate(ast, {});
    expect(result.isNull()).toBe(true);
  });
});

describe("Member Access", () => {
  it("accesses object property", () => {
    const ast = parseExpr("obj.name");
    const context = {
      obj: EvalValue.object(
        ["name", "age"],
        [EvalValue.string("Alice"), EvalValue.number(30)]
      ),
    };
    const result = evaluate(ast, context);
    expect(result.stringValue).toBe("Alice");
  });

  it("accesses array index", () => {
    const ast = parseExpr("arr[1]");
    const context = {
      arr: EvalValue.array([
        EvalValue.number(10),
        EvalValue.number(20),
        EvalValue.number(30),
      ]),
    };
    const result = evaluate(ast, context);
    expect(result.numberValue).toBe(20);
  });

  it("accesses string length", () => {
    const ast = parseExpr("str.length");
    const context = {
      str: EvalValue.string("hello"),
    };
    const result = evaluate(ast, context);
    expect(result.numberValue).toBe(5);
  });

  it("accesses array length", () => {
    const ast = parseExpr("arr.length");
    const context = {
      arr: EvalValue.array([
        EvalValue.number(1),
        EvalValue.number(2),
        EvalValue.number(3),
      ]),
    };
    const result = evaluate(ast, context);
    expect(result.numberValue).toBe(3);
  });
});

describe("Array Literals", () => {
  it("evaluates empty array", () => {
    const ast = parseExpr("[]");
    const result = evaluate(ast);
    expect(result.isArray()).toBe(true);
    expect(result.arrayValue.length).toBe(0);
  });

  it("evaluates array with numbers", () => {
    const ast = parseExpr("[1, 2, 3]");
    const result = evaluate(ast);
    expect(result.isArray()).toBe(true);
    expect(result.arrayValue.length).toBe(3);
    expect(result.getIndex(0).numberValue).toBe(1);
    expect(result.getIndex(2).numberValue).toBe(3);
  });

  it("evaluates array with mixed types", () => {
    const ast = parseExpr('[1, "two", true]');
    const result = evaluate(ast);
    expect(result.getIndex(0).isNumber()).toBe(true);
    expect(result.getIndex(1).isString()).toBe(true);
    expect(result.getIndex(2).isBoolean()).toBe(true);
  });
});

// Object literals work when wrapped in parentheses (workaround for Issue #5)
describe("Object Literals", () => {
  it("evaluates empty object", () => {
    const ast = parseExpr("({})");
    const result = evaluate(ast);
    expect(result.isObject()).toBe(true);
  });

  it("evaluates object with properties", () => {
    const ast = parseExpr('({ name: "test", value: 42 })');
    const result = evaluate(ast);
    expect(result.isObject()).toBe(true);
    expect(result.getMember("name").stringValue).toBe("test");
    expect(result.getMember("value").numberValue).toBe(42);
  });
});
