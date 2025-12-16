import { describe, it, expect, beforeAll } from "vitest";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const TS_PARSER_MODULE_PATH = path.join(
  ROOT_DIR,
  "gallery",
  "ts_parser",
  "benchmark",
  "ts_parser_module.cjs"
);

// Module exports - populated after module is loaded
let TSLexer: any;
let TSNode: any;
let TSParserSimple: any;

// Load the pre-compiled module
beforeAll(() => {
  if (!fs.existsSync(TS_PARSER_MODULE_PATH)) {
    throw new Error(
      "Parser module not found. Run 'npm run tsparser:module' first to compile it."
    );
  }
  const require = createRequire(import.meta.url);
  const tsParserModule = require("../gallery/ts_parser/benchmark/ts_parser_module.cjs");
  TSLexer = tsParserModule.TSLexer;
  TSNode = tsParserModule.TSNode;
  TSParserSimple = tsParserModule.TSParserSimple;
});

// Helper to parse TypeScript code and return AST
function parseTS(code: string): any {
  const lexer = new TSLexer(code);
  const tokens = lexer.tokenize();
  const parser = new TSParserSimple();
  parser.initParser(tokens);
  parser.setQuiet(true);
  return parser.parseProgram();
}

/**
 * TypeScript Parser Module Tests
 */
describe("TypeScript Parser Module", () => {
  it("exports TSLexer class", () => {
    expect(TSLexer).toBeDefined();
  });

  it("exports TSParserSimple class", () => {
    expect(TSParserSimple).toBeDefined();
  });

  it("exports TSNode class", () => {
    expect(TSNode).toBeDefined();
  });
});

/**
 * TypeScript Lexer Tests
 */
describe("TypeScript Lexer", () => {
  it("tokenizes code and returns tokens", () => {
    const lexer = new TSLexer("let x = 42;");
    const tokens = lexer.tokenize();
    expect(tokens.length).toBeGreaterThan(0);
  });

  it("tokenizes identifiers", () => {
    const lexer = new TSLexer("myVar");
    const tokens = lexer.tokenize();
    expect(tokens.length).toBeGreaterThan(0);
    // Token has tokenType property
    expect(tokens[0].tokenType).toBe("Identifier");
  });

  it("tokenizes keywords", () => {
    const lexer = new TSLexer("let const");
    const tokens = lexer.tokenize();
    expect(tokens[0].tokenType).toBe("Keyword");
  });

  it("tokenizes numbers", () => {
    const lexer = new TSLexer("42");
    const tokens = lexer.tokenize();
    expect(tokens[0].tokenType).toBe("Number");
  });

  it("tokenizes strings", () => {
    const lexer = new TSLexer('"hello"');
    const tokens = lexer.tokenize();
    expect(tokens[0].tokenType).toBe("String");
  });
});

/**
 * TypeScript Parser - AST Node Tests
 */
describe("TypeScript Parser - Declarations", () => {
  it("parses interface declaration", () => {
    const ast = parseTS("interface User { name: string; }");
    expect(ast.children[0].nodeType).toBe("TSInterfaceDeclaration");
  });

  it("parses type alias declaration", () => {
    const ast = parseTS("type ID = string;");
    expect(ast.children[0].nodeType).toBe("TSTypeAliasDeclaration");
  });

  it("parses function declaration", () => {
    const ast = parseTS("function greet(name: string): void {}");
    expect(ast.children[0].nodeType).toBe("FunctionDeclaration");
  });

  it("parses variable declaration", () => {
    const ast = parseTS("let x: number = 42;");
    expect(ast.children[0].nodeType).toBe("VariableDeclaration");
  });

  it("parses class declaration", () => {
    const ast = parseTS("class User {}");
    expect(ast.children[0].nodeType).toBe("ClassDeclaration");
  });

  it("parses enum declaration", () => {
    const ast = parseTS("enum Color { Red, Green }");
    expect(ast.children[0].nodeType).toBe("TSEnumDeclaration");
  });
});

describe("TypeScript Parser - Types", () => {
  it("parses string keyword", () => {
    const ast = parseTS("type S = string;");
    expect(ast.children[0].typeAnnotation.nodeType).toBe("TSStringKeyword");
  });

  it("parses number keyword", () => {
    const ast = parseTS("type N = number;");
    expect(ast.children[0].typeAnnotation.nodeType).toBe("TSNumberKeyword");
  });

  it("parses union types", () => {
    const ast = parseTS("type U = string | number;");
    expect(ast.children[0].typeAnnotation.nodeType).toBe("TSUnionType");
  });

  it("parses intersection types", () => {
    const ast = parseTS("type I = A & B;");
    expect(ast.children[0].typeAnnotation.nodeType).toBe("TSIntersectionType");
  });

  it("parses array types", () => {
    const ast = parseTS("type A = string[];");
    expect(ast.children[0].typeAnnotation.nodeType).toBe("TSArrayType");
  });

  it("parses tuple types", () => {
    const ast = parseTS("type T = [string, number];");
    expect(ast.children[0].typeAnnotation.nodeType).toBe("TSTupleType");
  });

  it("parses type references", () => {
    const ast = parseTS("type R = MyType;");
    expect(ast.children[0].typeAnnotation.nodeType).toBe("TSTypeReference");
  });

  it("parses function types", () => {
    const ast = parseTS("type F = (x: number) => string;");
    expect(ast.children[0].typeAnnotation.nodeType).toBe("TSFunctionType");
  });

  it("parses type literal", () => {
    const ast = parseTS("type O = { x: number; };");
    expect(ast.children[0].typeAnnotation.nodeType).toBe("TSTypeLiteral");
  });
});

describe("TypeScript Parser - Statements", () => {
  it("parses if statement", () => {
    const ast = parseTS("if (x) { y; }");
    expect(ast.children[0].nodeType).toBe("IfStatement");
  });

  it("parses while statement", () => {
    const ast = parseTS("while (x) { y; }");
    expect(ast.children[0].nodeType).toBe("WhileStatement");
  });

  it("parses for statement", () => {
    const ast = parseTS("for (let i = 0; i < 10; i = i + 1) {}");
    expect(ast.children[0].nodeType).toBe("ForStatement");
  });

  it("parses for-of statement", () => {
    const ast = parseTS("for (const x of items) {}");
    expect(ast.children[0].nodeType).toBe("ForOfStatement");
  });

  it("parses switch statement", () => {
    const ast = parseTS("switch (x) { case 1: break; }");
    expect(ast.children[0].nodeType).toBe("SwitchStatement");
  });

  it("parses try statement", () => {
    const ast = parseTS("try { x; } catch (e) { y; }");
    expect(ast.children[0].nodeType).toBe("TryStatement");
  });

  it("parses return statement", () => {
    const ast = parseTS("function f() { return 42; }");
    expect(ast.children[0].body.children[0].nodeType).toBe("ReturnStatement");
  });
});

describe("TypeScript Parser - Expressions", () => {
  it("parses binary expression", () => {
    const ast = parseTS("let x = a + b;");
    expect(ast.children[0].children[0].init.nodeType).toBe("BinaryExpression");
  });

  it("parses call expression", () => {
    const ast = parseTS("let x = foo();");
    expect(ast.children[0].children[0].init.nodeType).toBe("CallExpression");
  });

  it("parses member expression", () => {
    const ast = parseTS("let x = obj.prop;");
    expect(ast.children[0].children[0].init.nodeType).toBe("MemberExpression");
  });

  it("parses as expression", () => {
    const ast = parseTS("let x = value as string;");
    expect(ast.children[0].children[0].init.nodeType).toBe("TSAsExpression");
  });
});

describe("TypeScript Parser - Class Members", () => {
  it("parses property definition", () => {
    const ast = parseTS("class C { name: string; }");
    expect(ast.children[0].body.children[0].nodeType).toBe(
      "PropertyDefinition"
    );
  });

  it("parses method definition", () => {
    const ast = parseTS("class C { foo(): void {} }");
    expect(ast.children[0].body.children[0].nodeType).toBe("MethodDefinition");
  });

  it("parses constructor", () => {
    const ast = parseTS("class C { constructor() {} }");
    expect(ast.children[0].body.children[0].kind).toBe("constructor");
  });
});

describe("TypeScript Parser - Generics", () => {
  it("parses generic interface", () => {
    const ast = parseTS("interface Box<T> { value: T; }");
    expect(ast.children[0].params.length).toBe(1);
    expect(ast.children[0].params[0].nodeType).toBe("TSTypeParameter");
  });

  it("parses generic type alias", () => {
    const ast = parseTS("type Container<T> = { value: T; };");
    expect(ast.children[0].params.length).toBe(1);
  });

  it("parses generic class", () => {
    const ast = parseTS("class Box<T> { value: T; }");
    expect(ast.children[0].params.length).toBe(1);
  });
});
