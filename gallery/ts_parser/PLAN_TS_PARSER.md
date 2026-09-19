# TypeScript Parser Implementation Plan

## Status: ✅ Core Implementation Complete

**Last Updated:** December 16, 2025

### Completed Features

- ✅ TypeScript lexer with TS-specific keywords and types
- ✅ Parser using unified TSNode class (ESTree-compatible)
- ✅ Interface declarations with optional/readonly properties
- ✅ Type alias declarations
- ✅ Union types (`A | B`)
- ✅ Variable declarations with type annotations (`let x: number = 42`)
- ✅ Function declarations with typed parameters and return types
- ✅ Generic type references (`Array<string>`)
- ✅ Return statements
- ✅ Command-line interface (-h, -d, -i, --tokens)
- ✅ Cross-compilation to JavaScript, Rust, C++, Go, Swift
- ✅ Unit tests for lexer (30 tests passing)

### Files Created

```
gallery/ts_parser/
├── ts_token.rgr          # Token class definition
├── ts_lexer.rgr          # TypeScript lexer (~500 lines)
├── ts_lexer_main.rgr     # Lexer test harness
├── ts_ast.rgr            # ESTree AST definitions (reference)
├── ts_parser_simple.rgr  # Parser with unified TSNode (~830 lines)
├── ts_parser_main.rgr    # CLI entry point with demo
├── bin/                  # Compiled outputs
│   ├── ts_parser_main.js
│   ├── ts_parser_main.rs
│   ├── ts_parser_main.cpp
│   └── ts_parser_rust.exe
└── test/
    └── sample.ts         # Test TypeScript file
```

### npm Scripts Added

```bash
npm run tsparser:compile       # Compile to JavaScript
npm run tsparser:compile:rust  # Compile to Rust
npm run tsparser:compile:cpp   # Compile to C++
npm run tsparser:compile:go    # Compile to Go
npm run tsparser:compile:swift # Compile to Swift
npm run tsparser:compile:all   # Compile to all languages
npm run tsparser:build:rust    # Build Rust executable
npm run tsparser:build:go      # Build Go executable
npm run tsparser:build:swift   # Build Swift executable
npm run tsparser:run           # Run JS version (demo mode)
npm run tsparser:run:rust      # Run Rust version (demo mode)
npm run tsparser               # Compile and run
```

### Design Decision: Unified TSNode Class

Due to Ranger's strict type system (no type coercion for `def name@(optional):ParentClass`), the parser uses a single unified `TSNode` class with a `nodeType` field instead of separate AST classes:

```ranger
class TSNode {
  def nodeType:string ""        ; "Program", "TSInterfaceDeclaration", etc.
  def name:string ""
  def value:string ""
  def kind:string ""            ; "let", "const", "var"
  def optional:boolean false
  def readonly:boolean false
  def children:[TSNode]
  def params:[TSNode]
  def left@(optional):TSNode
  def right@(optional):TSNode
  def body@(optional):TSNode
  def init@(optional):TSNode
  def typeAnnotation@(optional):TSNode
  def returnType@(optional):TSNode
  ; ... position info
}
```

This matches the approach used in `js_parser_simple.rgr`.

---

## Overview

Implement a TypeScript subset parser using the Ranger language, building on top of the existing JavaScript ES6+ parser in `gallery/js_parser/`. The TypeScript parser will extend the JavaScript parser with type annotations, interfaces, type aliases, and other TypeScript-specific features.

## Goals

- **TypeScript Subset**: Focus on practical TypeScript features used in real projects
- **Reuse JS Parser**: Import and extend the existing `js_parser` components
- **Written in Ranger**: Parser implemented in `.rgr` files
- **Cross-Platform Output**: Parser can be compiled to JS, Rust, Swift, C++, etc.
- **Type-Aware AST**: Each node tracks type annotations alongside source positions

## Project Location

```
gallery/ts_parser/
├── ts_token.rgr            # Token class definition
├── ts_lexer.rgr            # TypeScript lexer with TS keywords/types
├── ts_lexer_main.rgr       # Lexer test harness
├── ts_ast.rgr              # ESTree AST node definitions (reference)
├── ts_parser_simple.rgr    # Parser with unified TSNode class
├── ts_parser_main.rgr      # Main entry point with CLI
├── bin/                    # Compiled outputs
│   ├── ts_parser_main.js   # JavaScript version
│   ├── ts_parser_main.rs   # Rust source
│   ├── ts_parser_main.cpp  # C++ source
│   ├── ts_parser_rust.exe  # Rust binary
│   ├── ts_parser_cpp.exe   # C++ binary (via WSL)
│   └── variant.hpp         # C++ helper header
└── test/
    └── sample.ts           # Test TypeScript file
```

## Reusing the JS Parser

The TypeScript parser will import from `gallery/js_parser/`:

```ranger
; Import existing JS parser components
Import "../js_parser/js_token.rgr"      ; Token definitions
Import "../js_parser/js_ast.rgr"        ; Base AST nodes
Import "../js_parser/js_lexer.rgr"      ; Base lexer
Import "../js_parser/js_parser_impl.rgr" ; Base parser (extend from this)
```

### Cross-Folder Import Strategy

1. **Relative Imports**: Use `../js_parser/file.rgr` syntax
2. **Shared Output Directory**: Compile both parsers to a common output location
3. **Build Script**: Create npm script that compiles JS parser first, then TS parser

## Phase 1: TypeScript Token Extensions

### New Keywords (TS-specific)

```
type, interface, namespace, module, declare, readonly, abstract,
implements, private, protected, public, static, override,
as, is, keyof, typeof (in type context), infer, never, unknown,
any, void (as type), undefined (as type), null (as type)
```

### New Punctuators

```
?   (optional property/parameter)
!   (non-null assertion)
:   (type annotation separator)
<>  (generic type parameters)
|   (union type)
&   (intersection type)
=>  (arrow function, but also in type signatures)
...rest (spread in tuples)
```

### Type Literals

```typescript
// Primitive types
string, number, boolean, null, undefined, void, never, unknown, any

// Literal types
"hello"       // string literal type
42            // number literal type
true          // boolean literal type

// Array types
string[]      // array shorthand
Array<string> // generic array

// Tuple types
[string, number]
[string, ...number[]]

// Object types
{ name: string; age: number }
{ readonly id: number }
{ name?: string }

// Function types
(a: number, b: number) => number
```

## Phase 2: TypeScript AST Extensions

### New Node Types

```ranger
; === Type Annotations ===

class TypeAnnotation {
  def type:string "TypeAnnotation"
  def typeNode@(optional):TypeNode
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

class TypeNode {
  def kind:string ""  ; "primitive", "reference", "union", "intersection", etc.
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

class PrimitiveType {
  def kind:string "primitive"
  def name:string ""  ; "string", "number", "boolean", "any", "void", etc.
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

class TypeReference {
  def kind:string "reference"
  def typeName@(optional):Identifier
  def typeArguments:[TypeNode]  ; generic parameters
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

class UnionType {
  def kind:string "union"
  def types:[TypeNode]
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

class IntersectionType {
  def kind:string "intersection"
  def types:[TypeNode]
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

class ArrayType {
  def kind:string "array"
  def elementType@(optional):TypeNode
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

class TupleType {
  def kind:string "tuple"
  def elementTypes:[TypeNode]
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

class FunctionType {
  def kind:string "function"
  def parameters:[TSParameter]
  def returnType@(optional):TypeNode
  def typeParameters:[TypeParameter]
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

class ObjectType {
  def kind:string "object"
  def members:[TypeMember]
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

class TypeMember {
  def kind:string ""  ; "property", "method", "index", "call"
  def name@(optional):Identifier
  def typeAnnotation@(optional):TypeNode
  def optional:boolean false
  def readonly:boolean false
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

class LiteralType {
  def kind:string "literal"
  def value:string ""
  def litType:string ""  ; "string", "number", "boolean"
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

; === Type Declarations ===

class TypeAliasDeclaration {
  def type:string "TypeAliasDeclaration"
  def id@(optional):Identifier
  def typeParameters:[TypeParameter]
  def typeAnnotation@(optional):TypeNode
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

class InterfaceDeclaration {
  def type:string "InterfaceDeclaration"
  def id@(optional):Identifier
  def typeParameters:[TypeParameter]
  def extends:[TypeReference]
  def body@(optional):ObjectType
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

class TypeParameter {
  def type:string "TypeParameter"
  def name@(optional):Identifier
  def constraint@(optional):TypeNode  ; extends clause
  def default@(optional):TypeNode     ; default type
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

; === Extended Declarations ===

class TSParameter {
  def type:string "TSParameter"
  def name@(optional):Identifier
  def typeAnnotation@(optional):TypeNode
  def optional:boolean false
  def defaultValue@(optional):ASTNode
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

class TSFunctionDeclaration {
  def type:string "TSFunctionDeclaration"
  def id@(optional):Identifier
  def params:[TSParameter]
  def returnType@(optional):TypeNode
  def typeParameters:[TypeParameter]
  def body@(optional):BlockStatement
  def async:boolean false
  def generator:boolean false
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

class TSClassDeclaration {
  def type:string "TSClassDeclaration"
  def id@(optional):Identifier
  def typeParameters:[TypeParameter]
  def superClass@(optional):ASTNode
  def superTypeParameters:[TypeNode]
  def implements:[TypeReference]
  def body@(optional):ClassBody
  def abstract:boolean false
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

class TSPropertyDefinition {
  def type:string "TSPropertyDefinition"
  def key@(optional):ASTNode
  def typeAnnotation@(optional):TypeNode
  def value@(optional):ASTNode
  def accessibility:string ""  ; "public", "private", "protected", ""
  def readonly:boolean false
  def static:boolean false
  def optional:boolean false
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

class TSMethodDefinition {
  def type:string "TSMethodDefinition"
  def key@(optional):ASTNode
  def params:[TSParameter]
  def returnType@(optional):TypeNode
  def typeParameters:[TypeParameter]
  def body@(optional):BlockStatement
  def accessibility:string ""
  def static:boolean false
  def abstract:boolean false
  def async:boolean false
  def generator:boolean false
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

; === Type Expressions ===

class TSAsExpression {
  def type:string "TSAsExpression"
  def expression@(optional):ASTNode
  def typeAnnotation@(optional):TypeNode
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

class TSNonNullExpression {
  def type:string "TSNonNullExpression"
  def expression@(optional):ASTNode
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}

class TSTypeAssertion {
  def type:string "TSTypeAssertion"
  def typeAnnotation@(optional):TypeNode
  def expression@(optional):ASTNode
  def start:int 0
  def end:int 0
  def line:int 0
  def col:int 0
}
```

## Phase 3: Lexer Extensions

```ranger
; ts_lexer.rgr - TypeScript lexer extensions

Import "../js_parser/js_lexer.rgr"

class TSLexer {
  def baseLexer:Lexer

  Constructor (src:string) {
    baseLexer = (new Lexer(src))
  }

  fn isTypeKeyword:boolean (word:string) {
    if (word == "type") { return true }
    if (word == "interface") { return true }
    if (word == "namespace") { return true }
    if (word == "declare") { return true }
    if (word == "readonly") { return true }
    if (word == "abstract") { return true }
    if (word == "implements") { return true }
    if (word == "private") { return true }
    if (word == "protected") { return true }
    if (word == "public") { return true }
    if (word == "as") { return true }
    if (word == "is") { return true }
    if (word == "keyof") { return true }
    if (word == "infer") { return true }
    if (word == "never") { return true }
    if (word == "unknown") { return true }
    if (word == "any") { return true }
    return false
  }

  fn isPrimitiveType:boolean (word:string) {
    if (word == "string") { return true }
    if (word == "number") { return true }
    if (word == "boolean") { return true }
    if (word == "void") { return true }
    if (word == "null") { return true }
    if (word == "undefined") { return true }
    if (word == "never") { return true }
    if (word == "unknown") { return true }
    if (word == "any") { return true }
    if (word == "object") { return true }
    if (word == "symbol") { return true }
    if (word == "bigint") { return true }
    return false
  }

  fn tokenize:[Token] () {
    return (baseLexer.tokenize())
  }
}
```

## Phase 4: Parser Extensions

```ranger
; ts_parser_impl.rgr - TypeScript parser

Import "ts_ast.rgr"
Import "ts_lexer.rgr"
Import "../js_parser/js_parser_impl.rgr"

class TSParser {
  def tokens:[Token]
  def pos:int 0
  def currentToken@(optional):Token

  ; ... base parser methods inherited conceptually ...

  ; === Type Parsing ===

  fn parseTypeAnnotation@(optional):TypeNode () {
    ; After seeing `:`, parse the type
    if (this.matchValue(":")) {
      this.advance()
      return (this.parseType())
    }
    return _
  }

  fn parseType:TypeNode () {
    def left (this.parseUnionOrIntersectionType())
    return left
  }

  fn parseUnionOrIntersectionType:TypeNode () {
    def types:[TypeNode]
    def first (this.parsePrimaryType())
    push types first

    def operator ""
    while ((this.matchValue("|")) || (this.matchValue("&"))) {
      def op (this.peekValue())
      if (operator == "") {
        operator = op
      }
      this.advance()
      def next (this.parsePrimaryType())
      push types next
    }

    if ((array_length types) == 1) {
      return first
    }

    if (operator == "|") {
      def union (new UnionType())
      union.types = types
      return union
    } {
      def intersection (new IntersectionType())
      intersection.types = types
      return intersection
    }
  }

  fn parsePrimaryType:TypeNode () {
    def tokVal (this.peekValue())

    ; Primitive types
    if (this.isPrimitiveType(tokVal)) {
      def prim (new PrimitiveType())
      prim.name = tokVal
      this.advance()
      return prim
    }

    ; Array type shorthand: string[]
    def baseType (this.parseTypeReference())
    while (this.matchValue("[")) {
      this.advance()
      this.expectValue("]")
      def arrType (new ArrayType())
      arrType.elementType = baseType
      baseType = arrType
    }

    return baseType
  }

  fn parseTypeReference:TypeNode () {
    def idTok (this.expect("Identifier"))
    def ref (new TypeReference())
    def id (new Identifier())
    id.name = idTok.value
    ref.typeName = id

    ; Generic type parameters
    if (this.matchValue("<")) {
      this.advance()
      while ((this.matchValue(">")) == false) {
        if ((array_length ref.typeArguments) > 0) {
          this.expectValue(",")
        }
        def typeArg (this.parseType())
        push ref.typeArguments typeArg
      }
      this.expectValue(">")
    }

    return ref
  }

  ; === Declaration Parsing ===

  fn parseTypeAliasDeclaration:TypeAliasDeclaration () {
    def decl (new TypeAliasDeclaration())
    this.expectValue("type")

    def idTok (this.expect("Identifier"))
    def id (new Identifier())
    id.name = idTok.value
    decl.id = id

    ; Optional type parameters
    if (this.matchValue("<")) {
      decl.typeParameters = (this.parseTypeParameters())
    }

    this.expectValue("=")
    decl.typeAnnotation = (this.parseType())

    if (this.matchValue(";")) {
      this.advance()
    }

    return decl
  }

  fn parseInterfaceDeclaration:InterfaceDeclaration () {
    def decl (new InterfaceDeclaration())
    this.expectValue("interface")

    def idTok (this.expect("Identifier"))
    def id (new Identifier())
    id.name = idTok.value
    decl.id = id

    ; Optional type parameters
    if (this.matchValue("<")) {
      decl.typeParameters = (this.parseTypeParameters())
    }

    ; Optional extends
    if (this.matchValue("extends")) {
      this.advance()
      ; Parse comma-separated type references
      def first true
      while (first || (this.matchValue(","))) {
        if (first == false) {
          this.advance()
        }
        first = false
        def extType:TypeReference (this.parseTypeReference())
        push decl.extends extType
      }
    }

    ; Interface body
    decl.body = (this.parseObjectType())

    return decl
  }

  fn parseTypeParameters:[TypeParameter] () {
    def params:[TypeParameter]
    this.expectValue("<")

    while ((this.matchValue(">")) == false) {
      if ((array_length params) > 0) {
        this.expectValue(",")
      }

      def param (new TypeParameter())
      def idTok (this.expect("Identifier"))
      def id (new Identifier())
      id.name = idTok.value
      param.name = id

      ; Optional constraint: extends SomeType
      if (this.matchValue("extends")) {
        this.advance()
        param.constraint = (this.parseType())
      }

      ; Optional default: = DefaultType
      if (this.matchValue("=")) {
        this.advance()
        param.default = (this.parseType())
      }

      push params param
    }

    this.expectValue(">")
    return params
  }

  fn parseObjectType:ObjectType () {
    def objType (new ObjectType())
    this.expectValue("{")

    while ((this.matchValue("}")) == false) {
      def member (this.parseTypeMember())
      push objType.members member

      ; Separator: ; or ,
      if ((this.matchValue(";")) || (this.matchValue(","))) {
        this.advance()
      }
    }

    this.expectValue("}")
    return objType
  }

  fn parseTypeMember:TypeMember () {
    def member (new TypeMember())

    ; Check for readonly
    if (this.matchValue("readonly")) {
      member.readonly = true
      this.advance()
    }

    ; Property name
    def idTok (this.expect("Identifier"))
    def id (new Identifier())
    id.name = idTok.value
    member.name = id
    member.kind = "property"

    ; Optional marker
    if (this.matchValue("?")) {
      member.optional = true
      this.advance()
    }

    ; Type annotation
    if (this.matchValue(":")) {
      this.advance()
      member.typeAnnotation = (this.parseType())
    }

    return member
  }
}
```

## Phase 5: Supported TypeScript Subset

### Tier 1: Essential (Phase 1-2)

```typescript
// Type annotations on variables
let name: string = "hello";
const count: number = 42;
var flag: boolean = true;

// Function parameter and return types
function add(a: number, b: number): number {
  return a + b;
}

// Type aliases
type ID = string | number;
type Point = { x: number; y: number };

// Interfaces
interface Person {
  name: string;
  age: number;
  email?: string; // optional
}

// Arrays
let numbers: number[] = [1, 2, 3];
let strings: Array<string> = ["a", "b"];

// Union types
let value: string | number = "hello";

// Literal types
type Direction = "north" | "south" | "east" | "west";
```

### Tier 2: Classes & Generics (Phase 3-4)

```typescript
// Classes with types
class Animal {
  private name: string;
  protected age: number;
  public readonly id: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
    this.id = Math.random();
  }

  speak(): void {
    console.log(this.name);
  }
}

// Generic functions
function identity<T>(arg: T): T {
  return arg;
}

// Generic classes
class Container<T> {
  private value: T;

  constructor(value: T) {
    this.value = value;
  }

  getValue(): T {
    return this.value;
  }
}

// Generic constraints
function getLength<T extends { length: number }>(arg: T): number {
  return arg.length;
}
```

### Tier 3: Advanced Types (Phase 5)

```typescript
// Intersection types
type Named = { name: string };
type Aged = { age: number };
type Person = Named & Aged;

// Tuple types
type Point3D = [number, number, number];

// Function types
type BinaryOp = (a: number, b: number) => number;

// Conditional types (simplified)
type NonNullable<T> = T extends null | undefined ? never : T;

// Mapped types (simplified)
type Readonly<T> = { readonly [K in keyof T]: T[K] };

// Type assertions
let value = someValue as string;
let value2 = <string>someValue;

// Type guards
function isString(x: unknown): x is string {
  return typeof x === "string";
}
```

### Explicitly NOT Supported (Out of Scope)

- Decorators (`@decorator`)
- Namespaces/modules
- Declaration files (`.d.ts`)
- `declare` statements
- Enums (complex)
- `infer` keyword
- Template literal types
- Recursive conditional types

## Phase 6: Pretty Printer

```ranger
; ts_printer.rgr - TypeScript pretty printer

Import "ts_ast.rgr"

class TSPrinter {
  def indent:int 0
  def output:string ""

  fn printType:string (node:TypeNode) {
    def kind node.kind

    if (kind == "primitive") {
      def prim:PrimitiveType node
      return prim.name
    }

    if (kind == "reference") {
      def ref:TypeReference node
      def id (unwrap ref.typeName)
      def result id.name
      if ((array_length ref.typeArguments) > 0) {
        result = result + "<"
        for ref.typeArguments arg:TypeNode i {
          if (i > 0) {
            result = result + ", "
          }
          result = result + (this.printType(arg))
        }
        result = result + ">"
      }
      return result
    }

    if (kind == "union") {
      def union:UnionType node
      def result ""
      for union.types t:TypeNode i {
        if (i > 0) {
          result = result + " | "
        }
        result = result + (this.printType(t))
      }
      return result
    }

    if (kind == "array") {
      def arr:ArrayType node
      def elemType (unwrap arr.elementType)
      return (this.printType(elemType)) + "[]"
    }

    return "unknown"
  }

  fn printInterface:string (node:InterfaceDeclaration) {
    def id (unwrap node.id)
    def result "interface " + id.name

    ; Type parameters
    if ((array_length node.typeParameters) > 0) {
      result = result + "<"
      for node.typeParameters param:TypeParameter i {
        if (i > 0) {
          result = result + ", "
        }
        def paramId (unwrap param.name)
        result = result + paramId.name
      }
      result = result + ">"
    }

    result = result + " {\n"

    ; Members
    if (!null? node.body) {
      def body (unwrap node.body)
      for body.members member:TypeMember i {
        result = result + "  "
        if (member.readonly) {
          result = result + "readonly "
        }
        def memId (unwrap member.name)
        result = result + memId.name
        if (member.optional) {
          result = result + "?"
        }
        if (!null? member.typeAnnotation) {
          result = result + ": " + (this.printType((unwrap member.typeAnnotation)))
        }
        result = result + ";\n"
      }
    }

    result = result + "}"
    return result
  }
}
```

## Phase 7: Testing

### Test Files

```typescript
// test/test_basic.ts
let name: string = "TypeScript";
const version: number = 5.0;
var enabled: boolean = true;

function greet(name: string): string {
  return "Hello, " + name;
}

type ID = string | number;
```

```typescript
// test/test_interface.ts
interface Point {
  x: number;
  y: number;
}

interface Point3D extends Point {
  z: number;
}

interface Config {
  readonly id: number;
  name: string;
  debug?: boolean;
}
```

```typescript
// test/test_generics.ts
function identity<T>(value: T): T {
  return value;
}

interface Container<T> {
  value: T;
  getValue(): T;
}

type Nullable<T> = T | null;
```

### Unit Tests (Vitest)

```typescript
// tests/ts-parser.test.ts
import { describe, it, expect } from "vitest";
import { compileRanger } from "./helpers/compiler";

describe("TypeScript Parser", () => {
  it("parses type annotations", async () => {
    const result = await compileRanger("gallery/ts_parser/ts_parser.rgr", "js");
    expect(result.success).toBe(true);
  });

  it("parses interface declarations", async () => {
    // Run parser on test file
    // Verify AST structure
  });

  it("parses generic types", async () => {
    // Run parser on test file
    // Verify type parameters are captured
  });
});
```

## Build Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "tsparser:compile": "node bin/output.js gallery/ts_parser/ts_parser.rgr -d=gallery/ts_parser -o=ts_parser.js",
    "tsparser:compile:rust": "node bin/output.js gallery/ts_parser/ts_parser.rgr -l=rust -d=gallery/ts_parser -o=ts_parser.rs",
    "tsparser:compile:swift": "node bin/output.js gallery/ts_parser/ts_parser.rgr -l=swift6 -d=gallery/ts_parser -o=ts_parser.swift",
    "tsparser:compile:cpp": "node bin/output.js gallery/ts_parser/ts_parser.rgr -l=cpp -d=gallery/ts_parser -o=ts_parser.cpp",
    "tsparser:run": "node gallery/ts_parser/ts_parser.js -i test.ts --ast",
    "tsparser:test": "node gallery/ts_parser/ts_parser.js -d"
  }
}
```

## Implementation Order

### Week 1: Foundation ✅ COMPLETE

- [x] Create `gallery/ts_parser/` directory structure
- [x] Create `ts_ast.rgr` with type annotation nodes
- [x] Create `ts_lexer.rgr` extending JS lexer with TS keywords
- [x] Verify imports from `../js_parser/` work (decided to use standalone approach)

### Week 2: Basic Types ✅ COMPLETE

- [x] Parse primitive types (string, number, boolean, etc.)
- [x] Parse type annotations on variable declarations
- [x] Parse type annotations on function parameters
- [x] Parse function return types

### Week 3: Type Aliases & Interfaces ✅ COMPLETE

- [x] Parse `type` declarations
- [x] Parse union types (`A | B`)
- [x] Parse `interface` declarations
- [x] Parse optional properties (`prop?:`)
- [x] Parse readonly properties

### Week 4: Arrays & Generics ✅ PARTIAL

- [x] Parse array types (`Array<T>`)
- [x] Parse generic type parameters (`<T>`)
- [ ] Parse generic constraints (`<T extends Base>`)
- [ ] Parse generic function calls
- [ ] Parse array shorthand (`T[]`)

### Week 5: Classes

- [ ] Parse class property types
- [ ] Parse accessibility modifiers (public, private, protected)
- [ ] Parse `implements` clause
- [ ] Parse abstract classes and methods

### Week 6: Advanced & Testing

- [ ] Parse intersection types (`A & B`)
- [ ] Parse tuple types (`[A, B]`)
- [ ] Parse `as` type assertions
- [ ] Complete test suite
- [ ] Benchmark against JS parser

## Cross-Platform Compilation

Once working in JS, compile to other targets:

```bash
# JavaScript (primary development)
npm run tsparser:compile
node gallery/ts_parser/ts_parser.js -d

# Rust
npm run tsparser:compile:rust
rustc -O gallery/ts_parser/ts_parser.rs -o gallery/ts_parser/ts_parser_rust.exe
./gallery/ts_parser/ts_parser_rust.exe -d

# Swift
npm run tsparser:compile:swift
swiftc -O -parse-as-library gallery/ts_parser/ts_parser.swift -o gallery/ts_parser/ts_parser_swift.exe
./gallery/ts_parser/ts_parser_swift.exe -d

# C++
npm run tsparser:compile:cpp
# Use WSL for compilation as documented in js_parser
```

## Future Extensions

- Full TypeScript compatibility (decorators, enums, etc.)
- Type checking / type inference engine
- Source map generation
- VS Code extension integration for real-time parsing
- TypeScript-to-Ranger transpiler (use TS parser to bootstrap!)

## References

- [TypeScript Language Specification](https://github.com/microsoft/TypeScript/blob/main/doc/spec-ARCHIVED.md)
- [TypeScript AST Viewer](https://ts-ast-viewer.com/)
- [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [ESTree TypeScript Extensions](https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/ast-spec)
- Existing JS Parser: `gallery/js_parser/`
