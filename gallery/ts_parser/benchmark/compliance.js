/**
 * TypeScript Parser Compliance Test
 *
 * Tests the Ranger TypeScript parser to measure feature support completeness
 * against the TypeScript language specification.
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { writeFileSync } from "fs";

const require = createRequire(import.meta.url);
const { TSLexer, TSParserSimple } = require("./ts_parser_module.cjs");

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper: Find node in Ranger AST
function findNode(ast, predicate) {
  if (!ast || typeof ast !== "object") return false;
  if (predicate(ast)) return true;

  // Check children array
  if (ast.children && Array.isArray(ast.children)) {
    for (const child of ast.children) {
      if (findNode(child, predicate)) return true;
    }
  }
  // Check params
  if (ast.params && Array.isArray(ast.params)) {
    for (const param of ast.params) {
      if (findNode(param, predicate)) return true;
    }
  }
  // Check decorators
  if (ast.decorators && Array.isArray(ast.decorators)) {
    for (const dec of ast.decorators) {
      if (findNode(dec, predicate)) return true;
    }
  }
  // Check other node references
  for (const key of ["left", "right", "body", "init", "typeAnnotation"]) {
    if (ast[key] && findNode(ast[key], predicate)) return true;
  }
  return false;
}

// Feature definitions - testing what Ranger supports vs TypeScript spec
const features = [
  // === Type Declarations ===
  {
    name: "Interface Declaration",
    category: "Type Declarations",
    code: "interface User { name: string; age: number; }",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType === "InterfaceDeclaration" ||
          n.nodeType === "TSInterfaceDeclaration"
      ),
  },
  {
    name: "Type Alias",
    category: "Type Declarations",
    code: "type ID = string | number;",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType === "TypeAliasDeclaration" ||
          n.nodeType === "TSTypeAliasDeclaration"
      ),
  },
  {
    name: "Enum Declaration",
    category: "Type Declarations",
    code: "enum Color { Red, Green, Blue }",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType === "EnumDeclaration" || n.nodeType === "TSEnumDeclaration"
      ),
  },
  {
    name: "Const Enum",
    category: "Type Declarations",
    code: "const enum Direction { Up, Down }",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType === "EnumDeclaration" || n.nodeType === "TSEnumDeclaration"
      ),
  },
  {
    name: "Namespace Declaration",
    category: "Type Declarations",
    code: "namespace Utils { export function helper() {} }",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType?.includes("Namespace") || n.nodeType?.includes("Module")
      ),
  },
  {
    name: "Declare Module",
    category: "Type Declarations",
    code: 'declare module "lodash" { export function chunk<T>(arr: T[]): T[][]; }',
    validate: (ast) => findNode(ast, (n) => n.nodeType?.includes("Module")),
  },

  // === Basic Types ===
  {
    name: "Primitive Types",
    category: "Basic Types",
    code: "let a: string; let b: number; let c: boolean;",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType?.includes("TypeReference") ||
          n.nodeType?.includes("Keyword") ||
          n.name === "string"
      ),
  },
  {
    name: "Array Type (T[])",
    category: "Basic Types",
    code: "let arr: string[];",
    validate: (ast) => findNode(ast, (n) => n.nodeType?.includes("ArrayType")),
  },
  {
    name: "Array Type (Array<T>)",
    category: "Basic Types",
    code: "let arr: Array<string>;",
    validate: (ast) =>
      findNode(
        ast,
        (n) => n.nodeType?.includes("TypeReference") && n.name === "Array"
      ),
  },
  {
    name: "Tuple Type",
    category: "Basic Types",
    code: "let tuple: [string, number];",
    validate: (ast) => findNode(ast, (n) => n.nodeType?.includes("TupleType")),
  },
  {
    name: "Union Type",
    category: "Basic Types",
    code: "let x: string | number;",
    validate: (ast) => findNode(ast, (n) => n.nodeType?.includes("UnionType")),
  },
  {
    name: "Intersection Type",
    category: "Basic Types",
    code: "let x: A & B;",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType?.includes("IntersectionType")),
  },
  {
    name: "Literal Types",
    category: "Basic Types",
    code: 'type Dir = "left" | "right";',
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType?.includes("LiteralType") || n.nodeType === "StringLiteral"
      ),
  },
  {
    name: "Type Literal (Object Type)",
    category: "Basic Types",
    code: "let obj: { x: number; y: number };",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType?.includes("TypeLiteral")),
  },
  {
    name: "Function Type",
    category: "Basic Types",
    code: "type Fn = (x: number) => string;",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType?.includes("FunctionType")),
  },

  // === Generics ===
  {
    name: "Generic Interface",
    category: "Generics",
    code: "interface Container<T> { value: T; }",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType?.includes("TypeParameter")),
  },
  {
    name: "Generic Function",
    category: "Generics",
    code: "function identity<T>(arg: T): T { return arg; }",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType?.includes("TypeParameter")),
  },
  {
    name: "Generic Class",
    category: "Generics",
    code: "class Box<T> { value: T; }",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType?.includes("TypeParameter")),
  },
  {
    name: "Generic Constraint",
    category: "Generics",
    code: "function fn<T extends object>(arg: T): T { return arg; }",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType?.includes("TypeParameter")),
  },
  {
    name: "Default Type Parameter",
    category: "Generics",
    code: "interface Container<T = string> { value: T; }",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType?.includes("TypeParameter")),
  },

  // === Classes ===
  {
    name: "Class Declaration",
    category: "Classes",
    code: "class MyClass { constructor() {} }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "ClassDeclaration"),
  },
  {
    name: "Class with Extends",
    category: "Classes",
    code: "class Child extends Parent {}",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "ClassDeclaration"),
  },
  {
    name: "Class Implements",
    category: "Classes",
    code: "class MyClass implements IFace {}",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "ClassDeclaration"),
  },
  {
    name: "Public/Private/Protected",
    category: "Classes",
    code: "class C { public a: number; private b: string; protected c: boolean; }",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType === "PropertyDefinition"),
  },
  {
    name: "Readonly Property",
    category: "Classes",
    code: "class C { readonly x: number = 1; }",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType === "PropertyDefinition"),
  },
  {
    name: "Static Members",
    category: "Classes",
    code: "class C { static count: number = 0; }",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType === "PropertyDefinition" ||
          n.nodeType === "MethodDefinition"
      ),
  },
  {
    name: "Abstract Class",
    category: "Classes",
    code: "abstract class Shape { abstract area(): number; }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "ClassDeclaration"),
  },
  {
    name: "Constructor Parameter Properties",
    category: "Classes",
    code: "class C { constructor(public x: number, private y: string) {} }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "ClassDeclaration"),
  },

  // === Functions ===
  {
    name: "Function Declaration",
    category: "Functions",
    code: "function greet(name: string): string { return name; }",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType === "FunctionDeclaration"),
  },
  {
    name: "Arrow Function",
    category: "Functions",
    code: "const fn = (x: number): number => x * 2;",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType === "ArrowFunctionExpression"),
  },
  {
    name: "Optional Parameters",
    category: "Functions",
    code: "function greet(name?: string) {}",
    validate: (ast) => findNode(ast, (n) => n.optional === true),
  },
  {
    name: "Default Parameters",
    category: "Functions",
    code: 'function greet(name: string = "World") {}',
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType === "FunctionDeclaration"),
  },
  {
    name: "Rest Parameters",
    category: "Functions",
    code: "function sum(...nums: number[]): number { return 0; }",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType === "RestElement" || n.kind === "rest"),
  },
  {
    name: "Function Overloads",
    category: "Functions",
    code: "function fn(x: string): string;\nfunction fn(x: number): number;\nfunction fn(x: any): any { return x; }",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType === "FunctionDeclaration"),
  },
  {
    name: "Async Function",
    category: "Functions",
    code: "async function fetchData(): Promise<string> { return ''; }",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType === "FunctionDeclaration"),
  },

  // === Statements ===
  {
    name: "Variable Declaration",
    category: "Statements",
    code: "const x: number = 1; let y: string = 'a';",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType === "VariableDeclaration"),
  },
  {
    name: "If Statement",
    category: "Statements",
    code: "if (x > 0) { } else { }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "IfStatement"),
  },
  {
    name: "For Loop",
    category: "Statements",
    code: "for (let i = 0; i < 10; i++) {}",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "ForStatement"),
  },
  {
    name: "For-Of Loop",
    category: "Statements",
    code: "for (const item of items) {}",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "ForOfStatement"),
  },
  {
    name: "For-In Loop",
    category: "Statements",
    code: "for (const key in obj) {}",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "ForInStatement"),
  },
  {
    name: "While Loop",
    category: "Statements",
    code: "while (x > 0) { x--; }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "WhileStatement"),
  },
  {
    name: "Do-While Loop",
    category: "Statements",
    code: "do { x++; } while (x < 10);",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "DoWhileStatement"),
  },
  {
    name: "Switch Statement",
    category: "Statements",
    code: "switch (x) { case 1: break; default: break; }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "SwitchStatement"),
  },
  {
    name: "Try-Catch-Finally",
    category: "Statements",
    code: "try { fn(); } catch (e) { } finally { }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "TryStatement"),
  },
  {
    name: "Return Statement",
    category: "Statements",
    code: "function fn() { return 42; }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "ReturnStatement"),
  },
  {
    name: "Throw Statement",
    category: "Statements",
    code: 'throw new Error("oops");',
    validate: (ast) => findNode(ast, (n) => n.nodeType === "ThrowStatement"),
  },

  // === Expressions ===
  {
    name: "Type Assertion (as)",
    category: "Expressions",
    code: "const x = value as string;",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType?.includes("AsExpression")),
  },
  {
    name: "Type Assertion (<T>)",
    category: "Expressions",
    code: "const x = <string>value;",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType?.includes("TypeAssertion")),
  },
  {
    name: "Non-Null Assertion",
    category: "Expressions",
    code: "const x = value!;",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType?.includes("NonNullExpression")),
  },
  {
    name: "Satisfies Expression",
    category: "Expressions",
    code: "const x = { a: 1 } satisfies Record<string, number>;",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType?.includes("SatisfiesExpression")),
  },
  {
    name: "Template Literal",
    category: "Expressions",
    code: "const s = `Hello ${name}`;",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "TemplateLiteral"),
  },
  {
    name: "Object Literal",
    category: "Expressions",
    code: "const obj = { x: 1, y: 2 };",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "ObjectExpression"),
  },
  {
    name: "Array Literal",
    category: "Expressions",
    code: "const arr = [1, 2, 3];",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "ArrayExpression"),
  },
  {
    name: "New Expression",
    category: "Expressions",
    code: "const d = new Date();",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "NewExpression"),
  },
  {
    name: "Await Expression",
    category: "Expressions",
    code: "async function fn() { const x = await promise; }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "AwaitExpression"),
  },
  {
    name: "Optional Chaining",
    category: "Expressions",
    code: "const x = obj?.prop;",
    validate: (ast) => findNode(ast, (n) => n.optional === true),
  },
  {
    name: "Nullish Coalescing",
    category: "Expressions",
    code: "const x = a ?? b;",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          (n.nodeType === "BinaryExpression" ||
            n.nodeType === "LogicalExpression") &&
          n.value === "??"
      ),
  },

  // === Modules ===
  {
    name: "Import Declaration",
    category: "Modules",
    code: 'import { foo } from "module";',
    validate: (ast) => findNode(ast, (n) => n.nodeType === "ImportDeclaration"),
  },
  {
    name: "Import Default",
    category: "Modules",
    code: 'import foo from "module";',
    validate: (ast) => findNode(ast, (n) => n.nodeType === "ImportDeclaration"),
  },
  {
    name: "Import Namespace",
    category: "Modules",
    code: 'import * as mod from "module";',
    validate: (ast) => findNode(ast, (n) => n.nodeType === "ImportDeclaration"),
  },
  {
    name: "Import Type",
    category: "Modules",
    code: 'import type { Type } from "module";',
    validate: (ast) => findNode(ast, (n) => n.nodeType === "ImportDeclaration"),
  },
  {
    name: "Export Named",
    category: "Modules",
    code: "export { foo, bar };",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType?.includes("ExportDeclaration") ||
          n.nodeType?.includes("ExportNamed")
      ),
  },
  {
    name: "Export Default",
    category: "Modules",
    code: "export default function() {}",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType?.includes("ExportDefault")),
  },
  {
    name: "Re-Export",
    category: "Modules",
    code: 'export { foo } from "module";',
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType?.includes("ExportDeclaration") ||
          n.nodeType?.includes("ExportNamed")
      ),
  },

  // === Advanced Types ===
  {
    name: "Conditional Type",
    category: "Advanced Types",
    code: "type IsString<T> = T extends string ? true : false;",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType?.includes("ConditionalType")),
  },
  {
    name: "Mapped Type",
    category: "Advanced Types",
    code: "type Readonly<T> = { readonly [K in keyof T]: T[K] };",
    validate: (ast) => findNode(ast, (n) => n.nodeType?.includes("MappedType")),
  },
  {
    name: "Indexed Access Type",
    category: "Advanced Types",
    code: 'type T = Person["name"];',
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType?.includes("IndexedAccessType")),
  },
  {
    name: "Keyof Type",
    category: "Advanced Types",
    code: "type Keys = keyof Person;",
    validate: (ast) =>
      findNode(
        ast,
        (n) => n.nodeType?.includes("TypeOperator") || n.value === "keyof"
      ),
  },
  {
    name: "Typeof Type",
    category: "Advanced Types",
    code: "type T = typeof obj;",
    validate: (ast) =>
      findNode(
        ast,
        (n) => n.nodeType?.includes("TypeQuery") || n.value === "typeof"
      ),
  },
  {
    name: "Infer Type",
    category: "Advanced Types",
    code: "type Unpacked<T> = T extends Array<infer U> ? U : T;",
    validate: (ast) => findNode(ast, (n) => n.nodeType?.includes("InferType")),
  },
  {
    name: "Template Literal Type",
    category: "Advanced Types",
    code: "type Greeting = `Hello ${string}`;",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType?.includes("TemplateLiteralType")),
  },

  // === Decorators ===
  {
    name: "Class Decorator",
    category: "Decorators",
    code: "@Component\nclass MyClass {}",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "Decorator"),
  },
  {
    name: "Method Decorator",
    category: "Decorators",
    code: "class C { @log method() {} }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "Decorator"),
  },
  {
    name: "Property Decorator",
    category: "Decorators",
    code: "class C { @observable prop: string; }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "Decorator"),
  },
  {
    name: "Parameter Decorator",
    category: "Decorators",
    code: "class C { method(@inject dep: Service) {} }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "Decorator"),
  },

  // === JavaScript Features (ES6+) ===
  {
    name: "Generator Function",
    category: "JavaScript",
    code: "function* gen() { yield 1; yield 2; }",
    validate: (ast) =>
      findNode(
        ast,
        (n) => n.nodeType === "FunctionDeclaration" && n.generator === true
      ),
  },
  {
    name: "Yield Expression",
    category: "JavaScript",
    code: "function* gen() { yield 1; yield* other(); }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "YieldExpression"),
  },
  {
    name: "For-Await-Of",
    category: "JavaScript",
    code: "async function fn() { for await (const x of iter) {} }",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType === "ForOfStatement" && n.await === true),
  },
  {
    name: "Spread Operator (Array)",
    category: "JavaScript",
    code: "const arr = [...a, ...b];",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "SpreadElement"),
  },
  {
    name: "Spread Operator (Call)",
    category: "JavaScript",
    code: "fn(...args);",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "SpreadElement"),
  },
  {
    name: "Spread Operator (Object)",
    category: "JavaScript",
    code: "const obj = { ...a, ...b };",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "SpreadElement"),
  },
  {
    name: "Destructuring Object",
    category: "JavaScript",
    code: "const { a, b } = obj;",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "ObjectPattern"),
  },
  {
    name: "Destructuring Array",
    category: "JavaScript",
    code: "const [x, y] = arr;",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "ArrayPattern"),
  },
  {
    name: "Private Field",
    category: "JavaScript",
    code: "class Foo { #x = 1; getX() { return this.#x; } }",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType === "PrivateIdentifier" ||
          n.nodeType === "PropertyDefinition"
      ),
  },
  {
    name: "Static Block",
    category: "JavaScript",
    code: 'class Foo { static { console.log("init"); } }',
    validate: (ast) => findNode(ast, (n) => n.nodeType === "StaticBlock"),
  },
  {
    name: "Logical Assignment (&&=)",
    category: "JavaScript",
    code: "x &&= y;",
    validate: (ast) =>
      findNode(
        ast,
        (n) => n.nodeType === "AssignmentExpression" && n.value === "&&="
      ),
  },
  {
    name: "Logical Assignment (||=)",
    category: "JavaScript",
    code: "x ||= y;",
    validate: (ast) =>
      findNode(
        ast,
        (n) => n.nodeType === "AssignmentExpression" && n.value === "||="
      ),
  },
  {
    name: "Logical Assignment (??=)",
    category: "JavaScript",
    code: "x ??= y;",
    validate: (ast) =>
      findNode(
        ast,
        (n) => n.nodeType === "AssignmentExpression" && n.value === "??="
      ),
  },
  {
    name: "Exponentiation Operator",
    category: "JavaScript",
    code: "const x = 2 ** 10;",
    validate: (ast) =>
      findNode(
        ast,
        (n) => n.nodeType === "BinaryExpression" && n.value === "**"
      ),
  },
  {
    name: "Numeric Separators",
    category: "JavaScript",
    code: "const x = 1_000_000;",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType === "Literal" ||
          n.nodeType === "NumberLiteral" ||
          n.nodeType === "NumericLiteral"
      ),
  },
  {
    name: "BigInt Literal",
    category: "JavaScript",
    code: "const x = 123n;",
    validate: (ast) =>
      findNode(
        ast,
        (n) => n.nodeType === "BigIntLiteral" || n.value === "123n"
      ),
  },
  {
    name: "Dynamic Import",
    category: "JavaScript",
    code: 'const mod = import("./mod.js");',
    validate: (ast) => findNode(ast, (n) => n.nodeType === "ImportExpression"),
  },
  {
    name: "Import Meta",
    category: "JavaScript",
    code: "const url = import.meta.url;",
    validate: (ast) =>
      findNode(
        ast,
        (n) => n.nodeType === "MetaProperty" || n.name === "import"
      ),
  },
  {
    name: "Object Shorthand",
    category: "JavaScript",
    code: "const obj = { x, y };",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType === "Property" && n.shorthand === true),
  },
  {
    name: "Computed Property",
    category: "JavaScript",
    code: "const obj = { [key]: value };",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType === "Property" && n.computed === true),
  },
  {
    name: "Getter",
    category: "JavaScript",
    code: "const obj = { get x() { return 1; } };",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          (n.nodeType === "Property" || n.nodeType === "MethodDefinition") &&
          n.kind === "get"
      ),
  },
  {
    name: "Setter",
    category: "JavaScript",
    code: "const obj = { set x(v) {} };",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          (n.nodeType === "Property" || n.nodeType === "MethodDefinition") &&
          n.kind === "set"
      ),
  },
  {
    name: "New Target",
    category: "JavaScript",
    code: "function Foo() { if (new.target) {} }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "MetaProperty"),
  },
  {
    name: "Tagged Template",
    category: "JavaScript",
    code: "const result = tag`hello ${name}`;",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType === "TaggedTemplateExpression"),
  },

  // === JSX (TSX) ===
  {
    name: "JSX Element",
    category: "JSX",
    code: 'const el = <div className="test">Hello</div>;',
    validate: (ast) => findNode(ast, (n) => n.nodeType === "JSXElement"),
    tsxMode: true,
  },
  {
    name: "JSX Self-Closing",
    category: "JSX",
    code: '<input type="text" />',
    validate: (ast) =>
      findNode(
        ast,
        (n) => n.nodeType === "JSXElement" && n.left?.kind === "self-closing"
      ),
    tsxMode: true,
  },
  {
    name: "JSX Expression",
    category: "JSX",
    code: "<div>{value}</div>",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType === "JSXExpressionContainer"),
    tsxMode: true,
  },
  {
    name: "JSX Fragment",
    category: "JSX",
    code: "const el = <>Hello</>;",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "JSXFragment"),
    tsxMode: true,
  },
  {
    name: "JSX Spread Attribute",
    category: "JSX",
    code: "<div {...props} />",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType === "JSXSpreadAttribute"),
    tsxMode: true,
  },
  // === JSX vs Generic Disambiguation ===
  {
    name: "Ambiguous <T> as JSX in TSX mode",
    category: "JSX",
    code: "const fn = <T>() => {}",
    validate: (ast) =>
      findNode(
        ast,
        (n) => n.nodeType === "JSXElement" || n.nodeType === "JSXOpeningElement"
      ),
    tsxMode: true,
  },
  {
    name: "Generic <T extends {}> not JSX",
    category: "JSX",
    code: 'const fn = <T extends {}>() => { return "test"; }',
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType === "ArrowFunctionExpression") &&
      !findNode(ast, (n) => n.nodeType === "JSXElement"),
    tsxMode: true,
  },
  {
    name: "Generic <T extends unknown> not JSX",
    category: "JSX",
    code: 'const fn = <T extends unknown>() => { return "test"; }',
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType === "ArrowFunctionExpression") &&
      !findNode(ast, (n) => n.nodeType === "JSXElement"),
    tsxMode: true,
  },

  // === Tricky Parsing Cases ===
  {
    name: "Generic Function Call in TSX (not JSX)",
    category: "Tricky Cases",
    code: "const result = foo<number>(42);",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType === "CallExpression") &&
      !findNode(ast, (n) => n.nodeType === "JSXElement"),
    tsxMode: true,
  },
  {
    name: "Comparison Chain (not generic/JSX)",
    category: "Tricky Cases",
    code: "const result = a < b && b > c;",
    validate: (ast) =>
      findNode(
        ast,
        (n) => n.nodeType === "BinaryExpression" && n.value === "<"
      ) &&
      findNode(
        ast,
        (n) => n.nodeType === "BinaryExpression" && n.value === ">"
      ),
  },
  {
    name: "Type Predicate",
    category: "Tricky Cases",
    code: "function isString(x: unknown): x is string { return typeof x === 'string'; }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "TSTypePredicate"),
  },
  {
    name: "Assertion Function",
    category: "Tricky Cases",
    code: "function assert(value: unknown): asserts value { if (!value) throw new Error(); }",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType === "TSTypePredicate" ||
          n.nodeType === "TSAssertsThisTypePredicate"
      ),
  },
  {
    name: "Index Signature",
    category: "Tricky Cases",
    code: "interface Dict { [key: string]: number; }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "TSIndexSignature"),
  },
  {
    name: "Labeled Statement",
    category: "Tricky Cases",
    code: "outer: for (let i = 0; i < 10; i++) { break outer; }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "LabeledStatement"),
  },
  {
    name: "As Const Assertion",
    category: "Tricky Cases",
    code: "const colors = ['red', 'green'] as const;",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "TSAsExpression"),
  },
  {
    name: "Nested Conditional Type",
    category: "Tricky Cases",
    code: "type Check<T> = T extends string ? 'str' : T extends number ? 'num' : 'other';",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "TSConditionalType"),
  },
  {
    name: "Constructor Type",
    category: "Tricky Cases",
    code: "type Ctor = new (x: string) => MyClass;",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "TSConstructorType"),
  },
  {
    name: "Import Type Inline",
    category: "Tricky Cases",
    code: "type Config = import('./config').Settings;",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "TSImportType"),
  },
  {
    name: "Named Tuple Elements",
    category: "Tricky Cases",
    code: "type Point = [x: number, y: number];",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType === "TSNamedTupleMember"),
  },
  {
    name: "Rest in Tuple Type",
    category: "Tricky Cases",
    code: "type Tail<T extends any[]> = T extends [any, ...infer Rest] ? Rest : never;",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "TSRestType"),
  },
  {
    name: "Override Modifier",
    category: "Tricky Cases",
    code: "class Child extends Parent { override method() { return 1; } }",
    validate: (ast) =>
      findNode(
        ast,
        (n) => n.nodeType === "MethodDefinition" && n.name === "method"
      ),
  },
  {
    name: "Accessor Keyword",
    category: "Tricky Cases",
    code: "class Foo { accessor x: number = 0; }",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType === "PropertyDefinition" ||
          n.nodeType === "AccessorProperty"
      ),
  },

  // === Async/Await Parsing ===
  {
    name: "Async Function Declaration",
    category: "Async/Await",
    code: "async function fetchData() { return 1; }",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType === "FunctionDeclaration" &&
          (n.async === true || n.kind === "async")
      ),
  },
  {
    name: "Async Function with Return Type",
    category: "Async/Await",
    code: "async function fetchData(): Promise<string> { return ''; }",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType === "FunctionDeclaration" &&
          (n.async === true || n.kind === "async")
      ),
  },
  {
    name: "Async Arrow Function",
    category: "Async/Await",
    code: "const fn = async () => { return 1; };",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType === "ArrowFunctionExpression" &&
          (n.async === true || n.kind === "async")
      ),
  },
  {
    name: "Async Arrow Function with Param",
    category: "Async/Await",
    code: "const fn = async (x) => x * 2;",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType === "ArrowFunctionExpression" &&
          (n.async === true || n.kind === "async")
      ),
  },
  {
    name: "Async Arrow Single Param No Parens",
    category: "Async/Await",
    code: "const fn = async x => x * 2;",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType === "ArrowFunctionExpression" &&
          (n.async === true || n.kind === "async")
      ),
  },
  {
    name: "Await Expression",
    category: "Async/Await",
    code: "async function fn() { const x = await promise; }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "AwaitExpression"),
  },
  {
    name: "Await Expression with Call",
    category: "Async/Await",
    code: "async function fn() { const x = await fetchData(); }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "AwaitExpression"),
  },
  {
    name: "Await Expression Chained",
    category: "Async/Await",
    code: "async function fn() { const x = await (await fetch()).json(); }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "AwaitExpression"),
  },
  {
    name: "For-Await-Of Loop",
    category: "Async/Await",
    code: "async function fn() { for await (const x of iter) {} }",
    validate: (ast) =>
      findNode(ast, (n) => n.nodeType === "ForOfStatement" && n.await === true),
  },
  {
    name: "Async Method in Class",
    category: "Async/Await",
    code: "class Foo { async fetchData() { return 1; } }",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType === "MethodDefinition" &&
          (n.async === true || n.kind === "async")
      ),
  },
  {
    name: "Async Method in Object Literal",
    category: "Async/Await",
    code: "const obj = { async fetch() { return 1; } };",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType === "Property" && n.async === true && n.method === true
      ),
  },
  {
    name: "Export Async Function",
    category: "Async/Await",
    code: "export async function fetchData() { return 1; }",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType === "FunctionDeclaration" &&
          (n.async === true || n.kind === "async")
      ),
  },
  {
    name: "Export Default Async Function",
    category: "Async/Await",
    code: "export default async function() { return 1; }",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType === "ExportDefaultDeclaration" ||
          (n.nodeType === "FunctionDeclaration" &&
            (n.async === true || n.kind === "async"))
      ),
  },
  {
    name: "Async IIFE",
    category: "Async/Await",
    code: "(async () => { await promise; })();",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType === "ArrowFunctionExpression" &&
          (n.async === true || n.kind === "async")
      ),
  },
  {
    name: "Await with Ternary",
    category: "Async/Await",
    code: "async function fn() { const x = condition ? await a : await b; }",
    validate: (ast) => findNode(ast, (n) => n.nodeType === "AwaitExpression"),
  },
  {
    name: "Async Generator Function",
    category: "Async/Await",
    code: "async function* gen() { yield await promise; }",
    validate: (ast) =>
      findNode(
        ast,
        (n) =>
          n.nodeType === "FunctionDeclaration" &&
          n.generator === true &&
          (n.async === true || n.kind === "async")
      ),
  },
];

// Parse with Ranger
function parseWithRanger(code, tsx = false) {
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

// Test a single feature
function testFeature(feature) {
  const result = {
    name: feature.name,
    category: feature.category,
    success: false,
    valid: false,
    error: null,
  };

  try {
    const ast = parseWithRanger(feature.code, feature.tsxMode);
    result.success = true;
    result.valid = feature.validate(ast);
  } catch (e) {
    result.error = e.message;
  }

  return result;
}

// Run all tests
function runCompliance() {
  console.log(
    "╔══════════════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║       TypeScript Parser Compliance Test - Ranger vs TS Specification     ║"
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════════════════╝\n"
  );

  const results = { passed: 0, failed: 0, parseError: 0 };

  // Group features by category
  const categories = {};
  for (const feature of features) {
    if (!categories[feature.category]) {
      categories[feature.category] = [];
    }
    categories[feature.category].push(feature);
  }

  const categoryResults = {};
  const allResults = [];

  // Test each category
  for (const [category, categoryFeatures] of Object.entries(categories)) {
    console.log(`\n┌─ ${category} ${"─".repeat(72 - category.length - 3)}┐`);
    categoryResults[category] = { total: 0, passed: 0 };

    for (const feature of categoryFeatures) {
      const result = testFeature(feature);
      allResults.push({ feature, result });
      categoryResults[category].total++;

      if (!result.success) {
        results.parseError++;
      } else if (result.valid) {
        results.passed++;
        categoryResults[category].passed++;
      } else {
        results.failed++;
      }

      // Print result row
      const icon = !result.success ? "✗" : result.valid ? "✓" : "○";
      const featureName = feature.name.padEnd(45);
      console.log(`│ ${featureName} │ ${icon} │`);
    }

    console.log(`└${"─".repeat(76)}┘`);
  }

  // Print summary
  const total = features.length;
  const score = ((results.passed / total) * 100).toFixed(1);

  console.log(
    "\n╔══════════════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║                              SUMMARY                                     ║"
  );
  console.log(
    "╠══════════════════════════════════════════════════════════════════════════╣"
  );

  console.log(
    `║ Features Supported:   ${results.passed
      .toString()
      .padStart(3)} / ${total}`.padEnd(77) + "║"
  );
  console.log(
    `║ Needs Implementation: ${results.failed
      .toString()
      .padStart(3)} / ${total}`.padEnd(77) + "║"
  );
  console.log(
    `║ Parse Errors:         ${results.parseError
      .toString()
      .padStart(3)} / ${total}`.padEnd(77) + "║"
  );

  console.log(
    "╠══════════════════════════════════════════════════════════════════════════╣"
  );
  console.log(
    "║                        CATEGORY BREAKDOWN                                ║"
  );
  console.log(
    "╠══════════════════════════════════════════════════════════════════════════╣"
  );

  for (const [category, data] of Object.entries(categoryResults)) {
    const pct = ((data.passed / data.total) * 100).toFixed(0);
    const bar =
      "█".repeat(Math.floor((data.passed / data.total) * 20)) +
      "░".repeat(20 - Math.floor((data.passed / data.total) * 20));
    const line = `║ ${category.padEnd(25)} ${bar} ${data.passed}/${
      data.total
    } (${pct}%)`;
    console.log(line.padEnd(77) + "║");
  }

  console.log(
    "╚══════════════════════════════════════════════════════════════════════════╝"
  );

  // Legend
  console.log("\nLegend:");
  console.log("  ✓ = Parsed and produced expected AST node type");
  console.log(
    "  ○ = Parsed but did NOT produce expected AST node (needs implementation)"
  );
  console.log("  ✗ = Parse error");

  // Missing features (using stored results)
  const missing = allResults.filter(
    ({ result }) => result.success && !result.valid
  );

  if (missing.length > 0) {
    console.log(
      "\n┌─ Features Needing Implementation ─────────────────────────────────────────┐"
    );
    for (const { feature } of missing) {
      console.log(`│ • ${feature.name} (${feature.category})`.padEnd(76) + "│");
    }
    console.log("└" + "─".repeat(76) + "┘");
  }

  // Parse errors (using stored results)
  const errors = allResults.filter(({ result }) => !result.success);

  if (errors.length > 0) {
    console.log(
      "\n┌─ Features with Parse Errors ──────────────────────────────────────────────┐"
    );
    for (const { feature } of errors) {
      console.log(`│ • ${feature.name} (${feature.category})`.padEnd(76) + "│");
    }
    console.log("└" + "─".repeat(76) + "┘");
  }

  console.log(`\n📊 Overall Compliance: ${score}%`);

  // Generate COMPLIANCE.md
  generateComplianceMarkdown(
    results,
    categoryResults,
    allResults,
    total,
    score
  );

  return {
    total,
    passed: results.passed,
    failed: results.failed,
    parseError: results.parseError,
    score: parseFloat(score),
  };
}

// Generate COMPLIANCE.md file
function generateComplianceMarkdown(
  results,
  categoryResults,
  allResults,
  total,
  score
) {
  const date = new Date().toISOString().split("T")[0];

  let md = `# TypeScript Parser Compliance Report

> Generated: ${date}  
> Parser: Ranger TypeScript Parser  
> Compliance Score: **${score}%**

## Quick Start

### Running the Compliance Test

\`\`\`bash
# From the ts_parser directory
cd gallery/ts_parser/benchmark
node compliance.js
\`\`\`

This will:
1. Run all ${total} TypeScript feature tests against the Ranger parser
2. Display results in the terminal
3. Generate this COMPLIANCE.md report

### Regenerating This Report

\`\`\`bash
node compliance.js
\`\`\`

The report is automatically regenerated each time you run the compliance test.

---

## Summary

| Metric | Count |
|--------|-------|
| ✅ Features Supported | ${results.passed} / ${total} |
| 🔧 Needs Implementation | ${results.failed} / ${total} |
| ❌ Parse Errors | ${results.parseError} / ${total} |

## Category Breakdown

| Category | Progress | Score |
|----------|----------|-------|
`;

  for (const [category, data] of Object.entries(categoryResults)) {
    const pct = ((data.passed / data.total) * 100).toFixed(0);
    const filled = Math.floor((data.passed / data.total) * 10);
    const bar = "🟩".repeat(filled) + "⬜".repeat(10 - filled);
    md += `| ${category} | ${bar} | ${data.passed}/${data.total} (${pct}%) |\n`;
  }

  md += `\n## Detailed Results\n\n`;

  // Group by category
  const categories = {};
  for (const { feature, result } of allResults) {
    if (!categories[feature.category]) {
      categories[feature.category] = [];
    }
    categories[feature.category].push({ feature, result });
  }

  for (const [category, items] of Object.entries(categories)) {
    md += `### ${category}\n\n`;
    md += `| Feature | Status |\n`;
    md += `|---------|--------|\n`;

    for (const { feature, result } of items) {
      const icon = !result.success ? "❌" : result.valid ? "✅" : "🔧";
      md += `| ${feature.name} | ${icon} |\n`;
    }
    md += `\n`;
  }

  // Missing features
  const missing = allResults.filter(
    ({ result }) => result.success && !result.valid
  );
  if (missing.length > 0) {
    md += `## Features Needing Implementation\n\n`;
    md += `The following features parse successfully but don't produce the expected AST node types yet:\n\n`;
    for (const { feature } of missing) {
      md += `- [ ] **${feature.name}** (${feature.category})\n`;
    }
    md += `\n`;
  }

  // Parse errors
  const errors = allResults.filter(({ result }) => !result.success);
  if (errors.length > 0) {
    md += `## Features with Parse Errors\n\n`;
    md += `The following features cause parse errors and need investigation:\n\n`;
    for (const { feature, result } of errors) {
      md += `- ❌ **${feature.name}** (${feature.category}): ${result.error}\n`;
    }
    md += `\n`;
  }

  md += `---\n\n`;
  md += `## Legend\n\n`;
  md += `- ✅ = Parsed and produced expected AST node type\n`;
  md += `- 🔧 = Parsed but needs AST node type implementation\n`;
  md += `- ❌ = Parse error\n`;
  md += `\n## How to Improve Compliance\n\n`;
  md += `1. **Check the parser source**: \`gallery/ts_parser/ts_parser_simple.rgr\`\n`;
  md += `2. **Add missing node types**: Look at the feature's expected node type in \`benchmark/compliance.js\`\n`;
  md += `3. **Recompile**: \`npm run tsparser:module\`\n`;
  md += `4. **Re-run tests**: \`node compliance.js\`\n`;

  // Write to file
  const outputPath = join(__dirname, "..", "COMPLIANCE.md");
  writeFileSync(outputPath, md);
  console.log(`\n📄 Generated: ${outputPath}`);
}

runCompliance();
