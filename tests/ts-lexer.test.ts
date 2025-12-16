import { describe, it, expect, beforeAll } from "vitest";
import { compileRanger, compileAndRun } from "./helpers/compiler";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const TS_PARSER_DIR = path.join(ROOT_DIR, "gallery", "ts_parser");

/**
 * TypeScript Lexer Tests
 *
 * Tests that the TypeScript lexer correctly tokenizes TypeScript source code
 * following the ESTree token format with TypeScript extensions.
 *
 * Token types:
 *   - Identifier: variable and type names
 *   - Keyword: JavaScript keywords (let, const, function, etc.)
 *   - TSKeyword: TypeScript keywords (type, interface, readonly, etc.)
 *   - TSType: TypeScript primitive types (string, number, boolean, etc.)
 *   - Punctuator: operators and punctuation
 *   - String: string literals
 *   - Number: numeric literals
 *   - Boolean: true/false
 *   - Null: null
 *   - LineComment: // comments
 *   - BlockComment: /* comments
 *   - EOF: end of file
 */

describe("TypeScript Lexer", () => {
  describe("Compilation", () => {
    it("compiles ts_lexer_main.rgr to JavaScript", () => {
      const result = compileRanger(
        "gallery/ts_parser/ts_lexer_main.rgr",
        "es6",
        TS_PARSER_DIR
      );
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("ESTree Token Recognition", () => {
    let lexerOutput: string;

    beforeAll(() => {
      // Compile and run the lexer to get output
      const result = compileAndRun("gallery/ts_parser/ts_lexer_main.rgr");
      expect(result.compile.success).toBe(true);
      expect(result.run?.success).toBe(true);
      lexerOutput = result.run?.output || "";
    });

    it("tokenizes TypeScript keywords as TSKeyword", () => {
      // TypeScript-specific keywords get TSKeyword type
      expect(lexerOutput).toContain("TSKeyword: 'interface'");
      expect(lexerOutput).toContain("TSKeyword: 'readonly'");
      expect(lexerOutput).toContain("TSKeyword: 'implements'");
      expect(lexerOutput).toContain("TSKeyword: 'public'");
      expect(lexerOutput).toContain("TSKeyword: 'private'");
      expect(lexerOutput).toContain("TSKeyword: 'protected'");
    });

    it("tokenizes TypeScript primitive types as TSType", () => {
      // Primitive types recognized as TSType (following ESTree TS extensions)
      expect(lexerOutput).toContain("TSType: 'string'");
      expect(lexerOutput).toContain("TSType: 'number'");
      expect(lexerOutput).toContain("TSType: 'boolean'");
      expect(lexerOutput).toContain("TSType: 'any'");
      expect(lexerOutput).toContain("TSType: 'unknown'");
    });

    it("tokenizes JavaScript keywords as Keyword", () => {
      // Standard JavaScript keywords
      expect(lexerOutput).toContain("Keyword: 'let'");
      expect(lexerOutput).toContain("Keyword: 'const'");
      expect(lexerOutput).toContain("Keyword: 'var'");
      expect(lexerOutput).toContain("Keyword: 'function'");
      expect(lexerOutput).toContain("Keyword: 'return'");
      expect(lexerOutput).toContain("Keyword: 'class'");
      expect(lexerOutput).toContain("Keyword: 'this'");
    });

    it("tokenizes identifiers correctly", () => {
      expect(lexerOutput).toContain("Identifier: 'name'");
      expect(lexerOutput).toContain("Identifier: 'count'");
      expect(lexerOutput).toContain("Identifier: 'Person'");
      expect(lexerOutput).toContain("Identifier: 'User'");
      expect(lexerOutput).toContain("Identifier: 'greet'");
      expect(lexerOutput).toContain("Identifier: 'identity'");
    });

    it("tokenizes literals correctly", () => {
      // String literals
      expect(lexerOutput).toContain("String: 'TypeScript'");
      expect(lexerOutput).toContain("String: 'Hello, '");

      // Number literals
      expect(lexerOutput).toContain("Number: '42'");
      expect(lexerOutput).toContain("Number: '1'");

      // Boolean literals
      expect(lexerOutput).toContain("Boolean: 'true'");

      // Null literal
      expect(lexerOutput).toContain("Null: 'null'");
    });

    it("tokenizes punctuators for type annotations", () => {
      // Type annotation colon
      expect(lexerOutput).toContain("Punctuator: ':'");

      // Optional property marker
      expect(lexerOutput).toContain("Punctuator: '?'");

      // Union type operator
      expect(lexerOutput).toContain("Punctuator: '|'");

      // Intersection type operator
      expect(lexerOutput).toContain("Punctuator: '&'");

      // Generic brackets
      expect(lexerOutput).toContain("Punctuator: '<'");
      expect(lexerOutput).toContain("Punctuator: '>'");

      // Arrow function
      expect(lexerOutput).toContain("Punctuator: '=>'");
    });

    it("tokenizes comments", () => {
      // Line comments
      expect(lexerOutput).toContain("LineComment:");
    });

    it("tracks line and column positions", () => {
      // Position format [line:col]
      expect(lexerOutput).toMatch(/\[\d+:\d+\]/);
    });

    it("produces EOF token at end", () => {
      expect(lexerOutput).toContain("EOF:");
    });
  });
});

describe("TypeScript Lexer - Specific Token Tests", () => {
  // These tests verify the lexer output from the main test file
  // The main test file contains comprehensive TypeScript code

  let lexerOutput: string;

  beforeAll(() => {
    const result = compileAndRun("gallery/ts_parser/ts_lexer_main.rgr");
    expect(result.compile.success).toBe(true);
    expect(result.run?.success).toBe(true);
    lexerOutput = result.run?.output || "";
  });

  describe("Generic Type Syntax", () => {
    it("tokenizes generic parameters with angle brackets", () => {
      // Test file has: Array<string>, Result<T>
      expect(lexerOutput).toContain("Identifier: 'Array'");
      expect(lexerOutput).toContain("Punctuator: '<'");
      expect(lexerOutput).toContain("Punctuator: '>'");
    });

    it("tokenizes generic function: identity<T>", () => {
      // Test file has: function identity<T>(arg: T): T
      expect(lexerOutput).toContain("Identifier: 'identity'");
      expect(lexerOutput).toContain("Identifier: 'T'");
      expect(lexerOutput).toContain("Identifier: 'arg'");
    });
  });

  describe("Union and Intersection Types", () => {
    it("tokenizes union type operator", () => {
      // Test file has: type ID = string | number
      expect(lexerOutput).toContain("TSType: 'string'");
      expect(lexerOutput).toContain("Punctuator: '|'");
      expect(lexerOutput).toContain("TSType: 'number'");
    });

    it("tokenizes intersection type operator", () => {
      // Test file has: type NamedPerson = Named & Aged
      expect(lexerOutput).toContain("Identifier: 'Named'");
      expect(lexerOutput).toContain("Punctuator: '&'");
      expect(lexerOutput).toContain("Identifier: 'Aged'");
    });

    it("tokenizes null in union types", () => {
      // Test file has: type Result<T> = T | null
      expect(lexerOutput).toContain("Null: 'null'");
    });
  });

  describe("Type Assertions (ESTree: TSAsExpression)", () => {
    it("tokenizes 'as' keyword for type assertion", () => {
      // Test file has: (someValue as string)
      expect(lexerOutput).toContain("Identifier: 'someValue'");
      expect(lexerOutput).toContain("Keyword: 'as'");
    });
  });

  describe("Optional Properties (ESTree: optional flag)", () => {
    it("tokenizes optional property marker", () => {
      // Test file has: age?: number (in interface and function params)
      expect(lexerOutput).toContain("Identifier: 'age'");
      expect(lexerOutput).toContain("Punctuator: '?'");
    });
  });

  describe("TypeScript Keywords (ESTree: TSKeyword nodes)", () => {
    it("tokenizes 'type' keyword", () => {
      expect(lexerOutput).toContain("TSKeyword: 'type'");
    });

    it("tokenizes 'interface' keyword", () => {
      expect(lexerOutput).toContain("TSKeyword: 'interface'");
    });

    it("tokenizes 'implements' keyword", () => {
      // Test file has: class User implements Person
      expect(lexerOutput).toContain("TSKeyword: 'implements'");
    });
  });

  describe("TypeScript Primitive Types (ESTree: TS*Keyword nodes)", () => {
    it("tokenizes 'any' type", () => {
      // Test file has: let value: any
      expect(lexerOutput).toContain("TSType: 'any'");
    });

    it("tokenizes 'unknown' type", () => {
      // Test file has: let data: unknown
      expect(lexerOutput).toContain("TSType: 'unknown'");
    });

    it("tokenizes 'void' in function return type", () => {
      // Test file has: greet(msg: string): void
      expect(lexerOutput).toContain("Keyword: 'void'");
    });
  });

  describe("Access Modifiers (ESTree: accessibility property)", () => {
    it("tokenizes 'public' modifier", () => {
      // Test file has: public readonly id: number
      expect(lexerOutput).toContain("TSKeyword: 'public'");
    });

    it("tokenizes 'private' modifier", () => {
      // Test file has: private name: string
      expect(lexerOutput).toContain("TSKeyword: 'private'");
    });

    it("tokenizes 'protected' modifier", () => {
      // Test file has: protected age: number
      expect(lexerOutput).toContain("TSKeyword: 'protected'");
    });

    it("tokenizes 'readonly' modifier", () => {
      // Test file has: readonly id: number
      expect(lexerOutput).toContain("TSKeyword: 'readonly'");
    });
  });

  describe("Array Types", () => {
    it("tokenizes array shorthand brackets", () => {
      // Test file has: number[] and similar
      expect(lexerOutput).toContain("Punctuator: '['");
      expect(lexerOutput).toContain("Punctuator: ']'");
    });

    it("tokenizes generic array: Array<string>", () => {
      // Test file has: Array<string>
      expect(lexerOutput).toContain("Identifier: 'Array'");
    });
  });

  describe("Function Types", () => {
    it("tokenizes arrow function type syntax", () => {
      // Test file has: const add: (a: number, b: number) => number
      expect(lexerOutput).toContain("Identifier: 'add'");
      expect(lexerOutput).toContain("Punctuator: '=>'");
    });
  });
});
