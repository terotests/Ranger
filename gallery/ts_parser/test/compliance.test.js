/**
 * TypeScript Parser Compliance Tests
 *
 * Tests the Ranger TypeScript parser against 121 TypeScript features
 * organized into 13 categories.
 */

import { describe, it, expect } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const {
  TSLexer,
  TSParserSimple,
} = require("../benchmark/ts_parser_module.cjs");

// Helper: Find node in Ranger AST (with cycle detection)
function findNode(ast, predicate, visited = new Set()) {
  if (!ast || typeof ast !== "object") return false;
  if (visited.has(ast)) return false;  // Prevent infinite loops
  visited.add(ast);
  
  if (predicate(ast)) return true;

  if (ast.children && Array.isArray(ast.children)) {
    for (const child of ast.children) {
      if (findNode(child, predicate, visited)) return true;
    }
  }
  if (ast.params && Array.isArray(ast.params)) {
    for (const param of ast.params) {
      if (findNode(param, predicate, visited)) return true;
    }
  }
  if (ast.decorators && Array.isArray(ast.decorators)) {
    for (const dec of ast.decorators) {
      if (findNode(dec, predicate, visited)) return true;
    }
  }
  for (const key of ["left", "right", "body", "init", "typeAnnotation"]) {
    if (ast[key] && findNode(ast[key], predicate, visited)) return true;
  }
  return false;
}

// Parse helper
function parse(code, tsx = false) {
  const lexer = new TSLexer(code);
  const tokens = lexer.tokenize();
  const parser = new TSParserSimple();
  parser.initParser(tokens);
  parser.setQuiet(true);
  if (tsx) {
    parser.setTsxMode(true);
  }
  return parser.parseProgram();
}

// ============================================================================
// Type Declarations
// ============================================================================

describe("Type Declarations", () => {
  it("Interface Declaration", () => {
    const ast = parse("interface User { name: string; age: number; }");
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType === "InterfaceDeclaration" ||
          n.nodeType === "TSInterfaceDeclaration"
      )
    ).toBe(true);
  });

  it("Type Alias", () => {
    const ast = parse("type ID = string | number;");
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType === "TypeAliasDeclaration" ||
          n.nodeType === "TSTypeAliasDeclaration"
      )
    ).toBe(true);
  });

  it("Enum Declaration", () => {
    const ast = parse("enum Color { Red, Green, Blue }");
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType === "EnumDeclaration" || n.nodeType === "TSEnumDeclaration"
      )
    ).toBe(true);
  });

  it("Const Enum", () => {
    const ast = parse("const enum Direction { Up, Down }");
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType === "EnumDeclaration" || n.nodeType === "TSEnumDeclaration"
      )
    ).toBe(true);
  });

  it("Namespace Declaration", () => {
    const ast = parse("namespace Utils { export function helper() {} }");
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType?.includes("Namespace") || n.nodeType?.includes("Module")
      )
    ).toBe(true);
  });

  it("Declare Module", () => {
    const ast = parse(
      'declare module "lodash" { export function chunk<T>(arr: T[]): T[][]; }'
    );
    expect(findNode(ast, (n) => n.nodeType?.includes("Module"))).toBe(true);
  });
});

// ============================================================================
// Basic Types
// ============================================================================

describe("Basic Types", () => {
  it("Primitive Types", () => {
    const ast = parse("let a: string; let b: number; let c: boolean;");
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType?.includes("TypeReference") ||
          n.nodeType?.includes("Keyword") ||
          n.name === "string"
      )
    ).toBe(true);
  });

  it("Array Type (T[])", () => {
    const ast = parse("let arr: string[];");
    expect(findNode(ast, (n) => n.nodeType?.includes("ArrayType"))).toBe(true);
  });

  it("Array Type (Array<T>)", () => {
    const ast = parse("let arr: Array<string>;");
    expect(
      findNode(
        ast,
        (n) => n.nodeType?.includes("TypeReference") && n.name === "Array"
      )
    ).toBe(true);
  });

  it("Tuple Type", () => {
    const ast = parse("let tuple: [string, number];");
    expect(findNode(ast, (n) => n.nodeType?.includes("TupleType"))).toBe(true);
  });

  it("Union Type", () => {
    const ast = parse("let x: string | number;");
    expect(findNode(ast, (n) => n.nodeType?.includes("UnionType"))).toBe(true);
  });

  it("Intersection Type", () => {
    const ast = parse("let x: A & B;");
    expect(findNode(ast, (n) => n.nodeType?.includes("IntersectionType"))).toBe(
      true
    );
  });

  it("Literal Types", () => {
    const ast = parse('type Dir = "left" | "right";');
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType?.includes("LiteralType") || n.nodeType === "StringLiteral"
      )
    ).toBe(true);
  });

  it("Type Literal (Object Type)", () => {
    const ast = parse("let obj: { x: number; y: number };");
    expect(findNode(ast, (n) => n.nodeType?.includes("TypeLiteral"))).toBe(
      true
    );
  });

  it("Function Type", () => {
    const ast = parse("type Fn = (x: number) => string;");
    expect(findNode(ast, (n) => n.nodeType?.includes("FunctionType"))).toBe(
      true
    );
  });
});

// ============================================================================
// Generics
// ============================================================================

describe("Generics", () => {
  it("Generic Interface", () => {
    const ast = parse("interface Container<T> { value: T; }");
    expect(findNode(ast, (n) => n.nodeType?.includes("TypeParameter"))).toBe(
      true
    );
  });

  it("Generic Function", () => {
    const ast = parse("function identity<T>(arg: T): T { return arg; }");
    expect(findNode(ast, (n) => n.nodeType?.includes("TypeParameter"))).toBe(
      true
    );
  });

  it("Generic Class", () => {
    const ast = parse("class Box<T> { value: T; }");
    expect(findNode(ast, (n) => n.nodeType?.includes("TypeParameter"))).toBe(
      true
    );
  });

  it("Generic Constraint", () => {
    const ast = parse(
      "function fn<T extends object>(arg: T): T { return arg; }"
    );
    expect(findNode(ast, (n) => n.nodeType?.includes("TypeParameter"))).toBe(
      true
    );
  });

  it("Default Type Parameter", () => {
    const ast = parse("interface Container<T = string> { value: T; }");
    expect(findNode(ast, (n) => n.nodeType?.includes("TypeParameter"))).toBe(
      true
    );
  });
});

// ============================================================================
// Classes
// ============================================================================

describe("Classes", () => {
  it("Class Declaration", () => {
    const ast = parse("class MyClass { constructor() {} }");
    expect(findNode(ast, (n) => n.nodeType === "ClassDeclaration")).toBe(true);
  });

  it("Class with Extends", () => {
    const ast = parse("class Child extends Parent {}");
    expect(findNode(ast, (n) => n.nodeType === "ClassDeclaration")).toBe(true);
  });

  it("Class Implements", () => {
    const ast = parse("class MyClass implements IFace {}");
    expect(findNode(ast, (n) => n.nodeType === "ClassDeclaration")).toBe(true);
  });

  it("Public/Private/Protected", () => {
    const ast = parse(
      "class C { public a: number; private b: string; protected c: boolean; }"
    );
    expect(findNode(ast, (n) => n.nodeType === "PropertyDefinition")).toBe(
      true
    );
  });

  it("Readonly Property", () => {
    const ast = parse("class C { readonly x: number = 1; }");
    expect(findNode(ast, (n) => n.nodeType === "PropertyDefinition")).toBe(
      true
    );
  });

  it("Static Members", () => {
    const ast = parse("class C { static count: number = 0; }");
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType === "PropertyDefinition" ||
          n.nodeType === "MethodDefinition"
      )
    ).toBe(true);
  });

  it("Abstract Class", () => {
    const ast = parse("abstract class Shape { abstract area(): number; }");
    expect(findNode(ast, (n) => n.nodeType === "ClassDeclaration")).toBe(true);
  });

  it("Constructor Parameter Properties", () => {
    const ast = parse(
      "class C { constructor(public x: number, private y: string) {} }"
    );
    expect(findNode(ast, (n) => n.nodeType === "ClassDeclaration")).toBe(true);
  });
});

// ============================================================================
// Functions
// ============================================================================

describe("Functions", () => {
  it("Function Declaration", () => {
    const ast = parse("function greet(name: string): string { return name; }");
    expect(findNode(ast, (n) => n.nodeType === "FunctionDeclaration")).toBe(
      true
    );
  });

  it("Arrow Function", () => {
    const ast = parse("const fn = (x: number): number => x * 2;");
    expect(findNode(ast, (n) => n.nodeType === "ArrowFunctionExpression")).toBe(
      true
    );
  });

  it("Optional Parameters", () => {
    const ast = parse("function greet(name?: string) {}");
    expect(findNode(ast, (n) => n.optional === true)).toBe(true);
  });

  it("Default Parameters", () => {
    const ast = parse('function greet(name: string = "World") {}');
    expect(findNode(ast, (n) => n.nodeType === "FunctionDeclaration")).toBe(
      true
    );
  });

  it("Rest Parameters", () => {
    const ast = parse("function sum(...nums: number[]): number { return 0; }");
    expect(
      findNode(ast, (n) => n.nodeType === "RestElement" || n.kind === "rest")
    ).toBe(true);
  });

  it("Function Overloads", () => {
    const ast = parse(
      "function fn(x: string): string;\nfunction fn(x: number): number;\nfunction fn(x: any): any { return x; }"
    );
    expect(findNode(ast, (n) => n.nodeType === "FunctionDeclaration")).toBe(
      true
    );
  });

  it("Async Function", () => {
    const ast = parse(
      "async function fetchData(): Promise<string> { return ''; }"
    );
    expect(findNode(ast, (n) => n.nodeType === "FunctionDeclaration")).toBe(
      true
    );
  });
});

// ============================================================================
// Statements
// ============================================================================

describe("Statements", () => {
  it("Variable Declaration", () => {
    const ast = parse("const x: number = 1; let y: string = 'a';");
    expect(findNode(ast, (n) => n.nodeType === "VariableDeclaration")).toBe(
      true
    );
  });

  it("If Statement", () => {
    const ast = parse("if (x > 0) { } else { }");
    expect(findNode(ast, (n) => n.nodeType === "IfStatement")).toBe(true);
  });

  it("For Loop", () => {
    const ast = parse("for (let i = 0; i < 10; i++) {}");
    expect(findNode(ast, (n) => n.nodeType === "ForStatement")).toBe(true);
  });

  it("For-Of Loop", () => {
    const ast = parse("for (const item of items) {}");
    expect(findNode(ast, (n) => n.nodeType === "ForOfStatement")).toBe(true);
  });

  it("For-In Loop", () => {
    const ast = parse("for (const key in obj) {}");
    expect(findNode(ast, (n) => n.nodeType === "ForInStatement")).toBe(true);
  });

  it("While Loop", () => {
    const ast = parse("while (x > 0) { x--; }");
    expect(findNode(ast, (n) => n.nodeType === "WhileStatement")).toBe(true);
  });

  it("Do-While Loop", () => {
    const ast = parse("do { x++; } while (x < 10);");
    expect(findNode(ast, (n) => n.nodeType === "DoWhileStatement")).toBe(true);
  });

  it("Switch Statement", () => {
    const ast = parse("switch (x) { case 1: break; default: break; }");
    expect(findNode(ast, (n) => n.nodeType === "SwitchStatement")).toBe(true);
  });

  it("Try-Catch-Finally", () => {
    const ast = parse("try { fn(); } catch (e) { } finally { }");
    expect(findNode(ast, (n) => n.nodeType === "TryStatement")).toBe(true);
  });

  it("Return Statement", () => {
    const ast = parse("function fn() { return 42; }");
    expect(findNode(ast, (n) => n.nodeType === "ReturnStatement")).toBe(true);
  });

  it("Throw Statement", () => {
    const ast = parse('throw new Error("oops");');
    expect(findNode(ast, (n) => n.nodeType === "ThrowStatement")).toBe(true);
  });
});

// ============================================================================
// Expressions
// ============================================================================

describe("Expressions", () => {
  it("Type Assertion (as)", () => {
    const ast = parse("const x = value as string;");
    expect(findNode(ast, (n) => n.nodeType?.includes("AsExpression"))).toBe(
      true
    );
  });

  it("Type Assertion (<T>)", () => {
    const ast = parse("const x = <string>value;");
    expect(findNode(ast, (n) => n.nodeType?.includes("TypeAssertion"))).toBe(
      true
    );
  });

  it("Non-Null Assertion", () => {
    const ast = parse("const x = value!;");
    expect(
      findNode(ast, (n) => n.nodeType?.includes("NonNullExpression"))
    ).toBe(true);
  });

  it("Satisfies Expression", () => {
    const ast = parse("const x = { a: 1 } satisfies Record<string, number>;");
    expect(
      findNode(ast, (n) => n.nodeType?.includes("SatisfiesExpression"))
    ).toBe(true);
  });

  it("Template Literal", () => {
    const ast = parse("const s = `Hello ${name}`;");
    expect(findNode(ast, (n) => n.nodeType === "TemplateLiteral")).toBe(true);
  });

  it("Object Literal", () => {
    const ast = parse("const obj = { x: 1, y: 2 };");
    expect(findNode(ast, (n) => n.nodeType === "ObjectExpression")).toBe(true);
  });

  it("Array Literal", () => {
    const ast = parse("const arr = [1, 2, 3];");
    expect(findNode(ast, (n) => n.nodeType === "ArrayExpression")).toBe(true);
  });

  it("New Expression", () => {
    const ast = parse("const d = new Date();");
    expect(findNode(ast, (n) => n.nodeType === "NewExpression")).toBe(true);
  });

  it("Await Expression", () => {
    const ast = parse("async function fn() { const x = await promise; }");
    expect(findNode(ast, (n) => n.nodeType === "AwaitExpression")).toBe(true);
  });

  it("Optional Chaining", () => {
    const ast = parse("const x = obj?.prop;");
    expect(findNode(ast, (n) => n.optional === true)).toBe(true);
  });

  it("Nullish Coalescing", () => {
    const ast = parse("const x = a ?? b;");
    expect(
      findNode(
        ast,
        (n) =>
          (n.nodeType === "BinaryExpression" ||
            n.nodeType === "LogicalExpression") &&
          n.value === "??"
      )
    ).toBe(true);
  });
});

// ============================================================================
// Modules
// ============================================================================

describe("Modules", () => {
  it("Import Declaration", () => {
    const ast = parse('import { foo } from "module";');
    expect(findNode(ast, (n) => n.nodeType === "ImportDeclaration")).toBe(true);
  });

  it("Import Default", () => {
    const ast = parse('import foo from "module";');
    expect(findNode(ast, (n) => n.nodeType === "ImportDeclaration")).toBe(true);
  });

  it("Import Namespace", () => {
    const ast = parse('import * as mod from "module";');
    expect(findNode(ast, (n) => n.nodeType === "ImportDeclaration")).toBe(true);
  });

  it("Import Type", () => {
    const ast = parse('import type { Type } from "module";');
    expect(findNode(ast, (n) => n.nodeType === "ImportDeclaration")).toBe(true);
  });

  it("Export Named", () => {
    const ast = parse("export { foo, bar };");
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType?.includes("ExportDeclaration") ||
          n.nodeType?.includes("ExportNamed")
      )
    ).toBe(true);
  });

  it("Export Default", () => {
    const ast = parse("export default function() {}");
    expect(findNode(ast, (n) => n.nodeType?.includes("ExportDefault"))).toBe(
      true
    );
  });

  it("Re-Export", () => {
    const ast = parse('export { foo } from "module";');
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType?.includes("ExportDeclaration") ||
          n.nodeType?.includes("ExportNamed")
      )
    ).toBe(true);
  });
});

// ============================================================================
// Advanced Types
// ============================================================================

describe("Advanced Types", () => {
  it("Conditional Type", () => {
    const ast = parse("type IsString<T> = T extends string ? true : false;");
    expect(findNode(ast, (n) => n.nodeType?.includes("ConditionalType"))).toBe(
      true
    );
  });

  it("Mapped Type", () => {
    const ast = parse("type Readonly<T> = { readonly [K in keyof T]: T[K] };");
    expect(findNode(ast, (n) => n.nodeType?.includes("MappedType"))).toBe(true);
  });

  it("Indexed Access Type", () => {
    const ast = parse('type T = Person["name"];');
    expect(
      findNode(ast, (n) => n.nodeType?.includes("IndexedAccessType"))
    ).toBe(true);
  });

  it("Keyof Type", () => {
    const ast = parse("type Keys = keyof Person;");
    expect(
      findNode(
        ast,
        (n) => n.nodeType?.includes("TypeOperator") || n.value === "keyof"
      )
    ).toBe(true);
  });

  it("Typeof Type", () => {
    const ast = parse("type T = typeof obj;");
    expect(
      findNode(
        ast,
        (n) => n.nodeType?.includes("TypeQuery") || n.value === "typeof"
      )
    ).toBe(true);
  });

  it("Infer Type", () => {
    const ast = parse("type Unpacked<T> = T extends Array<infer U> ? U : T;");
    expect(findNode(ast, (n) => n.nodeType?.includes("InferType"))).toBe(true);
  });

  it("Template Literal Type", () => {
    const ast = parse("type Greeting = `Hello ${string}`;");
    expect(
      findNode(ast, (n) => n.nodeType?.includes("TemplateLiteralType"))
    ).toBe(true);
  });
});

// ============================================================================
// Decorators
// ============================================================================

describe("Decorators", () => {
  it("Class Decorator", () => {
    const ast = parse("@Component\nclass MyClass {}");
    expect(findNode(ast, (n) => n.nodeType === "Decorator")).toBe(true);
  });

  it("Method Decorator", () => {
    const ast = parse("class C { @log method() {} }");
    expect(findNode(ast, (n) => n.nodeType === "Decorator")).toBe(true);
  });

  it("Property Decorator", () => {
    const ast = parse("class C { @observable prop: string; }");
    expect(findNode(ast, (n) => n.nodeType === "Decorator")).toBe(true);
  });

  it("Parameter Decorator", () => {
    const ast = parse("class C { method(@inject dep: Service) {} }");
    expect(findNode(ast, (n) => n.nodeType === "Decorator")).toBe(true);
  });
});

// ============================================================================
// JavaScript (ES6+)
// ============================================================================

describe("JavaScript (ES6+)", () => {
  it("Generator Function", () => {
    const ast = parse("function* gen() { yield 1; yield 2; }");
    expect(
      findNode(
        ast,
        (n) => n.nodeType === "FunctionDeclaration" && n.generator === true
      )
    ).toBe(true);
  });

  it("Yield Expression", () => {
    const ast = parse("function* gen() { yield 1; yield* other(); }");
    expect(findNode(ast, (n) => n.nodeType === "YieldExpression")).toBe(true);
  });

  it("For-Await-Of", () => {
    const ast = parse("async function fn() { for await (const x of iter) {} }");
    expect(
      findNode(ast, (n) => n.nodeType === "ForOfStatement" && n.await === true)
    ).toBe(true);
  });

  it("Spread Operator (Array)", () => {
    const ast = parse("const arr = [...a, ...b];");
    expect(findNode(ast, (n) => n.nodeType === "SpreadElement")).toBe(true);
  });

  it("Spread Operator (Call)", () => {
    const ast = parse("fn(...args);");
    expect(findNode(ast, (n) => n.nodeType === "SpreadElement")).toBe(true);
  });

  it("Spread Operator (Object)", () => {
    const ast = parse("const obj = { ...a, ...b };");
    expect(findNode(ast, (n) => n.nodeType === "SpreadElement")).toBe(true);
  });

  it("Destructuring Object", () => {
    const ast = parse("const { a, b } = obj;");
    expect(findNode(ast, (n) => n.nodeType === "ObjectPattern")).toBe(true);
  });

  it("Destructuring Array", () => {
    const ast = parse("const [x, y] = arr;");
    expect(findNode(ast, (n) => n.nodeType === "ArrayPattern")).toBe(true);
  });

  it("Private Field", () => {
    const ast = parse("class Foo { #x = 1; getX() { return this.#x; } }");
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType === "PrivateIdentifier" ||
          n.nodeType === "PropertyDefinition"
      )
    ).toBe(true);
  });

  it("Static Block", () => {
    const ast = parse('class Foo { static { console.log("init"); } }');
    expect(findNode(ast, (n) => n.nodeType === "StaticBlock")).toBe(true);
  });

  it("Logical Assignment (&&=)", () => {
    const ast = parse("x &&= y;");
    expect(
      findNode(
        ast,
        (n) => n.nodeType === "AssignmentExpression" && n.value === "&&="
      )
    ).toBe(true);
  });

  it("Logical Assignment (||=)", () => {
    const ast = parse("x ||= y;");
    expect(
      findNode(
        ast,
        (n) => n.nodeType === "AssignmentExpression" && n.value === "||="
      )
    ).toBe(true);
  });

  it("Logical Assignment (??=)", () => {
    const ast = parse("x ??= y;");
    expect(
      findNode(
        ast,
        (n) => n.nodeType === "AssignmentExpression" && n.value === "??="
      )
    ).toBe(true);
  });

  it("Exponentiation Operator", () => {
    const ast = parse("const x = 2 ** 10;");
    expect(
      findNode(
        ast,
        (n) => n.nodeType === "BinaryExpression" && n.value === "**"
      )
    ).toBe(true);
  });

  it("Numeric Separators", () => {
    const ast = parse("const x = 1_000_000;");
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType === "Literal" ||
          n.nodeType === "NumberLiteral" ||
          n.nodeType === "NumericLiteral"
      )
    ).toBe(true);
  });

  it("BigInt Literal", () => {
    const ast = parse("const x = 123n;");
    expect(
      findNode(ast, (n) => n.nodeType === "BigIntLiteral" || n.value === "123n")
    ).toBe(true);
  });

  it("Dynamic Import", () => {
    const ast = parse('const mod = import("./mod.js");');
    expect(findNode(ast, (n) => n.nodeType === "ImportExpression")).toBe(true);
  });

  it("Import Meta", () => {
    const ast = parse("const url = import.meta.url;");
    expect(
      findNode(ast, (n) => n.nodeType === "MetaProperty" || n.name === "import")
    ).toBe(true);
  });

  it("Object Shorthand", () => {
    const ast = parse("const obj = { x, y };");
    expect(
      findNode(ast, (n) => n.nodeType === "Property" && n.shorthand === true)
    ).toBe(true);
  });

  it("Computed Property", () => {
    const ast = parse("const obj = { [key]: value };");
    expect(
      findNode(ast, (n) => n.nodeType === "Property" && n.computed === true)
    ).toBe(true);
  });

  it("Getter", () => {
    const ast = parse("const obj = { get x() { return 1; } };");
    expect(
      findNode(
        ast,
        (n) =>
          (n.nodeType === "Property" || n.nodeType === "MethodDefinition") &&
          n.kind === "get"
      )
    ).toBe(true);
  });

  it("Setter", () => {
    const ast = parse("const obj = { set x(v) {} };");
    expect(
      findNode(
        ast,
        (n) =>
          (n.nodeType === "Property" || n.nodeType === "MethodDefinition") &&
          n.kind === "set"
      )
    ).toBe(true);
  });

  it("New Target", () => {
    const ast = parse("function Foo() { if (new.target) {} }");
    expect(findNode(ast, (n) => n.nodeType === "MetaProperty")).toBe(true);
  });

  it("Tagged Template", () => {
    const ast = parse("const result = tag`hello ${name}`;");
    expect(
      findNode(ast, (n) => n.nodeType === "TaggedTemplateExpression")
    ).toBe(true);
  });
});

// ============================================================================
// JSX
// ============================================================================

describe("JSX", () => {
  it("JSX Element", () => {
    const ast = parse('const el = <div className="test">Hello</div>;', true);
    expect(findNode(ast, (n) => n.nodeType === "JSXElement")).toBe(true);
  });

  it("JSX Self-Closing", () => {
    const ast = parse('<input type="text" />', true);
    expect(
      findNode(
        ast,
        (n) => n.nodeType === "JSXElement" && n.left?.kind === "self-closing"
      )
    ).toBe(true);
  });

  it("JSX Expression", () => {
    const ast = parse("<div>{value}</div>", true);
    expect(findNode(ast, (n) => n.nodeType === "JSXExpressionContainer")).toBe(
      true
    );
  });

  it("JSX Fragment", () => {
    const ast = parse("const el = <>Hello</>;", true);
    expect(findNode(ast, (n) => n.nodeType === "JSXFragment")).toBe(true);
  });

  it("JSX Spread Attribute", () => {
    const ast = parse("<div {...props} />", true);
    expect(findNode(ast, (n) => n.nodeType === "JSXSpreadAttribute")).toBe(
      true
    );
  });

  it("Ambiguous <T> as JSX in TSX mode", () => {
    const ast = parse("const fn = <T>() => {}", true);
    expect(
      findNode(
        ast,
        (n) => n.nodeType === "JSXElement" || n.nodeType === "JSXOpeningElement"
      )
    ).toBe(true);
  });

  it("Generic <T extends {}> not JSX", () => {
    const ast = parse(
      'const fn = <T extends {}>() => { return "test"; }',
      true
    );
    expect(findNode(ast, (n) => n.nodeType === "ArrowFunctionExpression")).toBe(
      true
    );
    expect(findNode(ast, (n) => n.nodeType === "JSXElement")).toBe(false);
  });

  it("Generic <T extends unknown> not JSX", () => {
    const ast = parse(
      'const fn = <T extends unknown>() => { return "test"; }',
      true
    );
    expect(findNode(ast, (n) => n.nodeType === "ArrowFunctionExpression")).toBe(
      true
    );
    expect(findNode(ast, (n) => n.nodeType === "JSXElement")).toBe(false);
  });
});

// ============================================================================
// Tricky Cases
// ============================================================================

describe("Tricky Cases", () => {
  it("Generic Function Call in TSX (not JSX)", () => {
    const ast = parse("const result = foo<number>(42);", true);
    expect(findNode(ast, (n) => n.nodeType === "CallExpression")).toBe(true);
    expect(findNode(ast, (n) => n.nodeType === "JSXElement")).toBe(false);
  });

  it("Comparison Chain (not generic/JSX)", () => {
    const ast = parse("const result = a < b && b > c;");
    expect(
      findNode(ast, (n) => n.nodeType === "BinaryExpression" && n.value === "<")
    ).toBe(true);
    expect(
      findNode(ast, (n) => n.nodeType === "BinaryExpression" && n.value === ">")
    ).toBe(true);
  });

  it("Type Predicate", () => {
    const ast = parse(
      "function isString(x: unknown): x is string { return typeof x === 'string'; }"
    );
    expect(findNode(ast, (n) => n.nodeType === "TSTypePredicate")).toBe(true);
  });

  it("Assertion Function", () => {
    const ast = parse(
      "function assert(value: unknown): asserts value { if (!value) throw new Error(); }"
    );
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType === "TSTypePredicate" ||
          n.nodeType === "TSAssertsThisTypePredicate"
      )
    ).toBe(true);
  });

  it("Index Signature", () => {
    const ast = parse("interface Dict { [key: string]: number; }");
    expect(findNode(ast, (n) => n.nodeType === "TSIndexSignature")).toBe(true);
  });

  it("Labeled Statement", () => {
    const ast = parse("outer: for (let i = 0; i < 10; i++) { break outer; }");
    expect(findNode(ast, (n) => n.nodeType === "LabeledStatement")).toBe(true);
  });

  it("As Const Assertion", () => {
    const ast = parse("const colors = ['red', 'green'] as const;");
    expect(findNode(ast, (n) => n.nodeType === "TSAsExpression")).toBe(true);
  });

  it("Nested Conditional Type", () => {
    const ast = parse(
      "type Check<T> = T extends string ? 'str' : T extends number ? 'num' : 'other';"
    );
    expect(findNode(ast, (n) => n.nodeType === "TSConditionalType")).toBe(true);
  });

  it("Constructor Type", () => {
    const ast = parse("type Ctor = new (x: string) => MyClass;");
    expect(findNode(ast, (n) => n.nodeType === "TSConstructorType")).toBe(true);
  });

  it("Import Type Inline", () => {
    const ast = parse("type Config = import('./config').Settings;");
    expect(findNode(ast, (n) => n.nodeType === "TSImportType")).toBe(true);
  });

  it("Named Tuple Elements", () => {
    const ast = parse("type Point = [x: number, y: number];");
    expect(findNode(ast, (n) => n.nodeType === "TSNamedTupleMember")).toBe(
      true
    );
  });

  it("Rest in Tuple Type", () => {
    const ast = parse(
      "type Tail<T extends any[]> = T extends [any, ...infer Rest] ? Rest : never;"
    );
    expect(findNode(ast, (n) => n.nodeType === "TSRestType")).toBe(true);
  });

  it("Override Modifier", () => {
    const ast = parse(
      "class Child extends Parent { override method() { return 1; } }"
    );
    expect(
      findNode(
        ast,
        (n) => n.nodeType === "MethodDefinition" && n.name === "method"
      )
    ).toBe(true);
  });

  it("Accessor Keyword", () => {
    const ast = parse("class Foo { accessor x: number = 0; }");
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType === "PropertyDefinition" ||
          n.nodeType === "AccessorProperty"
      )
    ).toBe(true);
  });
});

// ============================================================================
// Async/Await Parsing
// ============================================================================

describe("Async/Await Parsing", () => {
  it("Async Function Declaration", () => {
    const ast = parse("async function fetchData() { return 1; }");
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType === "FunctionDeclaration" &&
          (n.async === true || n.kind === "async")
      )
    ).toBe(true);
  });

  it("Async Function Declaration with Return Type", () => {
    const ast = parse(
      "async function fetchData(): Promise<string> { return ''; }"
    );
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType === "FunctionDeclaration" &&
          (n.async === true || n.kind === "async")
      )
    ).toBe(true);
  });

  it("Async Arrow Function", () => {
    const ast = parse("const fn = async () => { return 1; };");
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType === "ArrowFunctionExpression" &&
          (n.async === true || n.kind === "async")
      )
    ).toBe(true);
  });

  it("Async Arrow Function with Param", () => {
    const ast = parse("const fn = async (x) => x * 2;");
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType === "ArrowFunctionExpression" &&
          (n.async === true || n.kind === "async")
      )
    ).toBe(true);
  });

  it("Async Arrow Function Single Param No Parens", () => {
    const ast = parse("const fn = async x => x * 2;");
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType === "ArrowFunctionExpression" &&
          (n.async === true || n.kind === "async")
      )
    ).toBe(true);
  });

  it("Await Expression", () => {
    const ast = parse("async function fn() { const x = await promise; }");
    expect(findNode(ast, (n) => n.nodeType === "AwaitExpression")).toBe(true);
  });

  it("Await Expression with Call", () => {
    const ast = parse("async function fn() { const x = await fetchData(); }");
    const awaitNode = findNode(ast, (n) => n.nodeType === "AwaitExpression");
    expect(awaitNode).toBe(true);
  });

  it("Await Expression Chained", () => {
    const ast = parse(
      "async function fn() { const x = await (await fetch()).json(); }"
    );
    // Should find at least one AwaitExpression
    expect(findNode(ast, (n) => n.nodeType === "AwaitExpression")).toBe(true);
  });

  it("For-Await-Of Loop", () => {
    const ast = parse("async function fn() { for await (const x of iter) {} }");
    expect(
      findNode(ast, (n) => n.nodeType === "ForOfStatement" && n.await === true)
    ).toBe(true);
  });

  it("Async Method in Class", () => {
    const ast = parse("class Foo { async fetchData() { return 1; } }");
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType === "MethodDefinition" &&
          (n.async === true || n.kind === "async")
      )
    ).toBe(true);
  });

  it("Async Method in Object Literal", () => {
    const ast = parse("const obj = { async fetch() { return 1; } };");
    expect(
      findNode(
        ast,
        (n) =>
          (n.nodeType === "Property" || n.nodeType === "MethodDefinition") &&
          (n.async === true || n.kind === "async" || n.method === true)
      )
    ).toBe(true);
  });

  it("Export Async Function", () => {
    const ast = parse("export async function fetchData() { return 1; }");
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType === "FunctionDeclaration" &&
          (n.async === true || n.kind === "async")
      )
    ).toBe(true);
  });

  it("Export Default Async Function", () => {
    const ast = parse("export default async function() { return 1; }");
    // Either finds async function or the export wrapping it
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType === "ExportDefaultDeclaration" ||
          (n.nodeType === "FunctionDeclaration" &&
            (n.async === true || n.kind === "async"))
      )
    ).toBe(true);
  });

  it("Async IIFE", () => {
    const ast = parse("(async () => { await promise; })();");
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType === "ArrowFunctionExpression" &&
          (n.async === true || n.kind === "async")
      )
    ).toBe(true);
  });

  it("Await with Ternary", () => {
    const ast = parse(
      "async function fn() { const x = condition ? await a : await b; }"
    );
    expect(findNode(ast, (n) => n.nodeType === "AwaitExpression")).toBe(true);
  });

  it("Async Generator Function", () => {
    const ast = parse("async function* gen() { yield await promise; }");
    expect(
      findNode(
        ast,
        (n) =>
          n.nodeType === "FunctionDeclaration" &&
          n.generator === true &&
          (n.async === true || n.kind === "async")
      )
    ).toBe(true);
  });
});
