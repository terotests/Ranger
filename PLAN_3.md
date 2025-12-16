# Ranger 3.0 Roadmap

## Executive Summary

Ranger 3.0 represents a major evolution of the Ranger cross-language compiler, transitioning from an experimental tool to a production-ready development environment. This plan outlines the transition from version 2.x to 3.0, including modernization of the toolchain, improved language target support, and ecosystem enhancements.

---

## Table of Contents

1. [Version 3.0 Goals](#version-30-goals)
2. [Phase 1: Foundation (Immediate)](#phase-1-foundation-immediate)
3. [Phase 2: Unit Testing Infrastructure](#phase-2-unit-testing-infrastructure)
4. [Phase 3: Language Target Improvements](#phase-3-language-target-improvements)
5. [Phase 4: VSCode Extension Finalization](#phase-4-vscode-extension-finalization)
6. [Phase 5: Incremental Compilation](#phase-5-incremental-compilation)
7. [Phase 6: Advanced Features](#phase-6-advanced-features)
8. [Language Target Strategy](#language-target-strategy)
9. [Testing Strategy](#testing-strategy)
10. [Release & Publishing](#release--publishing)
11. [Future Considerations](#future-considerations)

---

## Completed Work ✅

### VSCode Extension Updates (December 2024)

- [x] Updated extension version to 0.3.0
- [x] Added proper file icon support for `.rgr` files (language icon property)
- [x] Created shield-style SVG icon matching the Ranger logo (gold shield with R)
- [x] Registered icon theme for file explorer
- [x] Updated package.json with icon configuration

### File Extension Migration

- [x] Renamed all compiler files from `.clj` to `.rgr`
- [x] Updated parser to support `.rgr` extension
- [x] VSCode extension recognizes `.rgr` files

### JavaScript Module Output (December 2025)

- [x] CommonJS module format (`-nodemodule` flag) - `module.exports.X = X`
- [x] ES6/ESM module format (`-esm` flag) - `export class X`
- [x] Auto-detect file extensions (`.js`, `.ts`, `.mjs`, `.cjs`) to prevent double extensions

### Rust Target Improvements (December 2025)

- [x] Comprehensive fixes for Rust code generation (Issue #13 - 15 fixes)
- [x] Classes compiled to structs with `impl` blocks
- [x] Proper String handling with `.to_string()` for literals
- [x] Array operations (`push`, `itemAt`, `set`) with `Vec<T>`
- [x] String concatenation using `format!` macro
- [x] Ternary expressions as `if/else` expressions
- [x] Automatic `#[derive(Clone)]` for structs
- [x] Instance methods with `&mut self`

### Swift 6 Target Improvements (December 2025)

- [x] Modern Swift 6 compatible code generation
- [x] Proper integer-to-string conversion using `String()`
- [x] Array operations using `.append()` instead of `.push()`
- [x] String operations: `substring`, `indexOf`, `startsWith`, `endsWith`, `contains`, `split`, `trim`
- [x] CRLF grapheme cluster handling for cross-platform compatibility

### TypeScript Parser (December 2025)

- [x] Complete TypeScript/JavaScript/JSX parser (`gallery/ts_parser`)
- [x] 137/137 compliance tests passing (100%)
- [x] Compiles to JavaScript, Rust, Go, C++
- [x] Native benchmark showing cross-language performance comparison

---

## Version 3.0 Goals

### Primary Objectives

1. **Modernize the Developer Experience** - VSCode extension, Monaco editor integration
2. **Production-Ready Toolchain** - NPM publishing, CI/CD pipelines, comprehensive testing
3. **File Extension Standardization** - Transition from `.clj` to `.rgr` ✅
4. **Simplified Import System** - Auto-load standard library, clearer path resolution, better error messages
5. **Improved Language Targets** - Focus on Python, JavaScript/TypeScript, Swift, Rust, C++
6. **Developer Productivity** - Source maps, incremental compilation, module packaging

### Non-Goals for 3.0

- Mobile app development tooling (deferred)
- Visual programming interfaces (deferred)
- Cloud compilation service (deferred)
- Web-based playground IDE (deferred to 4.0)

---

## Phase 1: Foundation (Immediate)

**Timeline: Week 1-2**

### 1.1 Version Bump & Package Updates

- [x] Update `package.json` version from `2.1.70` to `3.0.0-alpha.1`
- [x] Update all documentation to reflect version 3.0
- [x] Create `CHANGELOG.md` with version history
- [x] Update `README.md` with 3.0 features and migration guide

### 1.2 File Extension Change (`.clj` → `.rgr`) ✅ COMPLETED

- [x] Update parser to accept `.rgr` extension
- [x] Rename all files in `compiler/` from `.clj` to `.rgr`
- [x] Update VSCode extension for `.rgr` support
- [x] Add file icons for `.rgr` files

### 1.3 NPM Publish Pipeline (Deferred)

**Status:** Postponed for now - will implement after testing infrastructure is solid.

### 1.4 Project Structure Cleanup

- [ ] Remove deprecated files and examples
- [ ] Organize `examples/` folder by complexity
- [ ] Create `docs/` folder for extended documentation
- [ ] Add `.nvmrc` for Node.js version specification

### 1.5 Import System Improvements

- [ ] Auto-load `Lang.rgr` when compiler initializes (unless `--no-stdlib` flag)
- [ ] Bundle `Lang.rgr` content directly in the compiled `output.js`
- [ ] Add `RANGER_LIB_PATH` environment variable for custom library location
- [ ] Improve import error messages with suggestions

---

## Phase 2: Unit Testing Infrastructure

**Timeline: Week 3-6** (CURRENT PRIORITY)

### 2.1 Testing Philosophy

The goal is to verify code generation correctness **without requiring target language compilation**. This enables:

- Fast CI/CD pipelines without installing Swift, Rust, Kotlin, C++ toolchains
- Immediate feedback on code generation changes
- Easier contributor onboarding
- Regression detection for subtle code generation issues

### 2.2 Code-Only Tests (No Runtime Execution)

These tests verify the **generated code structure** without compiling/running in the target language.

**Test Categories:**

1. **Syntax Correctness** - Generated code has valid syntax patterns
2. **Type Annotations** - Correct type declarations for each language
3. **Memory Management** - Ownership patterns (Rust), reference counting (Swift)
4. **Operator Translation** - Correct operator mapping per language
5. **String Operations** - String methods translate correctly
6. **Array Operations** - Array/collection methods work properly
7. **Control Flow** - if/else, loops, switch statements
8. **Class Features** - Inheritance, constructors, static methods
9. **Optional Handling** - Nullable types, unwrapping patterns

### 2.3 Test Fixture Design

Reference the `gallery/js_parser` project as the gold standard for complex code patterns:

```
tests/fixtures/
├── core/                    # Basic language features
│   ├── array_push.rgr       ✅ exists
│   ├── local_array.rgr      ✅ exists
│   ├── string_ops.rgr       ✅ exists
│   ├── string_methods.rgr   ✅ exists
│   ├── math_ops.rgr         ✅ exists
│   └── while_loop.rgr       ✅ exists
├── classes/                 # OOP features
│   ├── two_classes.rgr      ✅ exists
│   ├── inheritance.rgr      ✅ exists
│   ├── static_factory.rgr   ✅ exists
│   └── forward_ref.rgr      ✅ exists
├── memory/                  # Memory management patterns (NEW)
│   ├── ownership.rgr        # Rust borrowing patterns
│   ├── optional_chain.rgr   # Optional chaining (Swift, Kotlin)
│   └── reference_cycle.rgr  # Reference handling
├── lexer/                   # From js_parser (NEW)
│   ├── string_peek.rgr      # charAt, at, substr patterns
│   ├── char_classify.rgr    # isDigit, isAlpha patterns
│   └── token_scan.rgr       # Loop + string accumulation
└── parser/                  # Complex control flow (NEW)
    ├── recursive_descent.rgr
    ├── ast_construction.rgr
    └── error_recovery.rgr
```

### 2.4 Target-Specific Code Generation Tests

For each target (Swift6, Rust, Kotlin, C++), verify code patterns without execution:

#### Swift6 Code Generation Tests

```typescript
describe("Swift6 Code Generation", () => {
  it("should generate proper optional unwrapping", () => {
    const code = getGeneratedSwiftCode("tests/fixtures/optional_values.rgr");
    expect(code).toContain("guard let");
    expect(code).toContain("if let");
    expect(code).not.toContain("!"); // No force unwrap in safe patterns
  });

  it("should use proper string interpolation", () => {
    const code = getGeneratedSwiftCode("tests/fixtures/string_ops.rgr");
    expect(code).toContain("\\("); // Swift string interpolation
  });

  it("should generate correct array methods", () => {
    const code = getGeneratedSwiftCode("tests/fixtures/array_push.rgr");
    expect(code).toContain(".append(");
    expect(code).not.toContain(".push("); // JS pattern shouldn't appear
  });
});
```

#### Rust Code Generation Tests

```typescript
describe("Rust Code Generation", () => {
  it("should use proper ownership patterns", () => {
    const code = getGeneratedRustCode("tests/fixtures/string_methods.rgr");
    expect(code).toContain("&str"); // String references
    expect(code).toContain(".to_string()"); // String conversions
  });

  it("should handle Option types correctly", () => {
    const code = getGeneratedRustCode("tests/fixtures/optional_values.rgr");
    expect(code).toContain("Option<");
    expect(code).toContain(".unwrap_or(");
  });

  it("should generate correct vector operations", () => {
    const code = getGeneratedRustCode("tests/fixtures/array_push.rgr");
    expect(code).toContain("Vec::new()");
    expect(code).toContain(".push(");
  });
});
```

#### Kotlin Code Generation Tests

```typescript
describe("Kotlin Code Generation", () => {
  it("should use nullable types correctly", () => {
    const code = getGeneratedKotlinCode("tests/fixtures/optional_values.rgr");
    expect(code).toContain("?"); // Nullable type marker
    expect(code).toContain("?."); // Safe call operator
  });

  it("should generate proper list operations", () => {
    const code = getGeneratedKotlinCode("tests/fixtures/array_push.rgr");
    expect(code).toContain("mutableListOf");
    expect(code).toContain(".add(");
  });

  it("should use when instead of switch", () => {
    const code = getGeneratedKotlinCode("tests/fixtures/switch_case.rgr");
    expect(code).toContain("when");
    expect(code).not.toContain("switch");
  });
});
```

#### C++ Code Generation Tests

```typescript
describe("C++ Code Generation", () => {
  it("should use smart pointers", () => {
    const code = getGeneratedCppCode("tests/fixtures/two_classes.rgr");
    expect(code).toMatch(/std::shared_ptr|std::unique_ptr/);
  });

  it("should generate proper vector operations", () => {
    const code = getGeneratedCppCode("tests/fixtures/array_push.rgr");
    expect(code).toContain("std::vector");
    expect(code).toContain(".push_back(");
  });

  it("should use proper string methods", () => {
    const code = getGeneratedCppCode("tests/fixtures/string_methods.rgr");
    expect(code).toContain("std::string");
    expect(code).toContain(".substr(");
  });
});
```

### 2.5 Implementation Tasks

#### Test Helper Functions (Priority 1)

- [x] `compileRangerToRust()` - exists
- [x] `getGeneratedRustCode()` - exists
- [x] `compileRangerToSwift()` - exists
- [x] `compileRangerToKotlin()` - exists
- [x] `compileRangerToGo()` - exists
- [x] `compileRangerToPython()` - exists
- [x] `compileRangerToCpp()` - exists

#### New Test Files (Priority 2)

- [ ] `tests/codegen-swift.test.ts` - Swift6 code pattern tests
- [ ] `tests/codegen-rust.test.ts` - Rust code pattern tests
- [ ] `tests/codegen-kotlin.test.ts` - Kotlin code pattern tests
- [ ] `tests/codegen-cpp.test.ts` - C++ code pattern tests

#### New Test Fixtures (Priority 3)

Based on `gallery/js_parser` patterns:

- [ ] `tests/fixtures/string_peek.rgr` - charAt, at, substr from Lexer
- [ ] `tests/fixtures/char_classify.rgr` - isDigit, isAlpha patterns
- [ ] `tests/fixtures/token_scan.rgr` - Loop + string accumulation
- [ ] `tests/fixtures/recursive_parse.rgr` - Recursive descent patterns
- [ ] `tests/fixtures/switch_case.rgr` - Switch/when statement tests

### 2.6 Cross-Language Comparison Tests

Verify semantic equivalence across targets:

```typescript
describe("Cross-Language Semantic Equivalence", () => {
  const targets = ["es6", "python", "rust", "swift6", "kotlin", "cpp"];

  it("should generate functionally equivalent array operations", () => {
    for (const target of targets) {
      const code = compileToTarget("tests/fixtures/array_push.rgr", target);
      expect(code.success).toBe(true);
      // Verify each has the appropriate push/append/add method
    }
  });
});
```

### 2.7 Pattern Library Tests

Extract testable patterns from `gallery/js_parser`:

| Pattern                  | Source File   | Tests                        |
| ------------------------ | ------------- | ---------------------------- |
| String iteration         | js_lexer.rgr  | peek(), advance(), charAt    |
| Character classification | js_lexer.rgr  | isDigit(), isAlpha()         |
| Token accumulation       | js_lexer.rgr  | Building strings in loops    |
| Recursive parsing        | js_parser.rgr | Nested function calls        |
| AST construction         | js_ast.rgr    | Class instantiation patterns |
| Error handling           | js_parser.rgr | Try/catch, error propagation |

---

## Phase 3: Language Target Improvements

**Timeline: Week 9-14**

### 3.1 Priority Tier 1: Core Targets

**JavaScript/ES6 (Maintained)**

- [x] Full support - production ready
- [ ] Add source map generation (see Phase 6)
- [x] Improve module export patterns (CommonJS and ESM)
- [x] Add ESM output option (`-esm` flag for ES6 modules)

**TypeScript (Maintained)**

- [x] Full support via `-typescript` flag
- [ ] Improve generic type output
- [ ] Add strict mode support
- [ ] Better interface generation

**Python (Enhanced)**

- [x] Good support
- [ ] Fix inheritance constructor issues
- [ ] Add type hints (Python 3.9+)
- [ ] Improve module/package structure
- [ ] Add `__init__.py` generation
- [ ] Support dataclasses for simple classes

**Rust (Major Enhancement)**

- [x] Preliminary support
- [x] Improve ownership/borrowing patterns (Issue #13 - 15 fixes applied)
- [ ] Add lifetime annotations where needed
- [ ] Better error handling with Result types
- [ ] Cargo.toml generation
- [ ] Module structure (`mod.rs`)
- [ ] Support for traits

### 3.2 Priority Tier 2: Important Targets

**Swift 6 (Enhanced)**

- [x] Basic support
- [x] Modern Swift 6 compatible code generation
- [x] Proper integer-to-string conversion using `String()`
- [x] Array operations using `.append()` instead of `.push()`
- [x] File I/O with `Foundation` framework integration
- [x] String operations: `substring`, `indexOf`, `startsWith`, `endsWith`, `contains`, `split`, `trim`
- [x] CRLF grapheme cluster handling for cross-platform compatibility
- [ ] Improve protocol conformance
- [ ] Better optional handling
- [ ] Swift Package Manager integration
- [ ] async/await support
- [ ] Actor support for concurrency

**C++ (Enhanced)**

- [x] Partial support
- [ ] Modern C++17/20 features
- [ ] Smart pointer usage (unique_ptr, shared_ptr)
- [ ] CMake generation
- [ ] Header/implementation file split
- [ ] Template support improvements

### 3.3 Priority Tier 3: Secondary Targets

**Go (Maintained)**

- [x] Good support
- [ ] Fix integer division type conversion
- [ ] Better error handling patterns
- [ ] Go modules support (go.mod)
- [ ] Interface generation

**Java (Maintained)**

- [x] Good support (Java 7+)
- [ ] Update to Java 17+ features
- [ ] Record classes for data types
- [ ] Maven/Gradle build file generation
- [ ] Better generics support

**Kotlin (New Target)**

- [ ] New implementation
- [ ] Data classes
- [ ] Null safety mapping
- [ ] Coroutines for async
- [ ] Extension functions
- [ ] Gradle integration

**Dart (New Target - Evaluation)**

- [ ] Evaluate feasibility
- [ ] Flutter compatibility
- [ ] Null safety
- [ ] async/await patterns
- [ ] pubspec.yaml generation

### 3.4 Priority Tier 4: Maintenance Mode

**PHP (Updated)**

- [x] Basic support
- [ ] Update to PHP 8.x features
- [ ] Type declarations
- [ ] Composer integration
- [ ] Namespace support improvements

**C# (Maintained)**

- [x] Good support
- [ ] .NET 6+ features (if demand exists)
- [ ] Record types
- [ ] NuGet package generation

**Scala (Deprecated)**

- [x] Current support
- [ ] Mark as deprecated in docs
- [ ] Remove in Ranger 4.0
- [ ] Provide migration guide to Kotlin

---

## Phase 4: VSCode Extension Finalization

**Timeline: Week 15-18**

### 4.1 Extension Updates

**File Extension Support:**

- [ ] Register `.rgr` file extension
- [ ] Keep `.clj` support with deprecation notice
- [ ] Update language configuration

**Syntax Highlighting:**

- [ ] Update TextMate grammar for `.rgr`
- [ ] Improve operator highlighting
- [ ] Add semantic token support

**Language Features:**

- [ ] Autocomplete for keywords and types
- [ ] Hover information for variables/methods
- [ ] Go to definition
- [ ] Find all references
- [ ] Rename symbol
- [ ] Code folding
- [ ] Breadcrumbs support

### 4.2 Language Server Protocol (LSP) Implementation

Implement a full Language Server to provide IDE features across editors (VSCode, Neovim, etc.).

**Core Navigation Features:**

- [ ] **Go to Definition** - Jump to class, method, or variable definition
- [ ] **Go to Declaration** - Navigate to where symbol is declared
- [ ] **Go to Type Definition** - Jump to the type of a variable/parameter
- [ ] **Go to Implementation** - Find implementations of interfaces/abstract methods
- [ ] **Find All References** - List all usages of a symbol across the project
- [ ] **Peek Definition** - Inline preview without leaving current file

**Code Intelligence:**

- [ ] **Hover Information** - Show type, documentation, and signature on hover
- [ ] **Signature Help** - Parameter hints when typing function calls
- [ ] **Autocomplete** - Context-aware completions for:
  - Keywords and operators
  - Class names and types
  - Method names (including inherited)
  - Variable names in scope
  - Import paths
- [ ] **Document Symbols** - Outline view of classes, methods, variables
- [ ] **Workspace Symbols** - Search symbols across all files

**Refactoring Support:**

- [ ] **Rename Symbol** - Rename across all files with preview
- [ ] **Extract Method** - Extract selection to new method
- [ ] **Extract Variable** - Extract expression to variable
- [ ] **Inline Variable** - Replace variable with its value
- [ ] **Organize Imports** - Sort and remove unused imports

**Diagnostics & Validation:**

- [ ] **Real-time Error Checking** - Syntax and semantic errors as you type
- [ ] **Warning Highlights** - Unused variables, deprecated features
- [ ] **Quick Fixes** - Suggested fixes for common errors:
  - Add missing import
  - Fix typo in identifier
  - Add missing method parameter
  - Convert type automatically

**Code Actions:**

- [ ] **Generate Constructor** - Create constructor from class fields
- [ ] **Generate Getters/Setters** - Auto-generate accessors
- [ ] **Implement Interface** - Stub out interface methods
- [ ] **Override Method** - Generate override with super call

**Implementation Approach:**

```typescript
// Leverage existing introspection infrastructure
import {
  getTypeAtPosition,
  getClassProperties,
  getClassMethods,
  findDefinitionLocation,
} from "./introspection";

// Language Server handlers
server.onDefinition((params) => {
  const position = params.position;
  const symbolInfo = getTypeAtPosition(document, position);
  return findDefinitionLocation(symbolInfo);
});

server.onHover((params) => {
  const typeInfo = getTypeAtPosition(document, params.position);
  return {
    contents: formatHoverContent(typeInfo),
  };
});
```

**Tasks:**

- [ ] Set up `vscode-languageserver` package
- [ ] Create Language Server entry point
- [ ] Integrate with compiler's introspection API (see [ai/INTROSPECTION.md](ai/INTROSPECTION.md))
- [ ] Implement document synchronization
- [ ] Add incremental parsing for performance
- [ ] Cache symbol tables per file
- [ ] Support multi-root workspaces

### 4.3 Compilation Integration

- [ ] Build task integration
- [ ] Problem matcher for errors
- [ ] Output channel for compiler messages
- [ ] Target language selection in settings
- [ ] Multi-target compilation support

### 4.4 Debugging Support (Future)

- [ ] Debug adapter protocol (DAP) research
- [ ] Source map consumption
- [ ] Breakpoint support (JavaScript target initially)

### 4.5 Extension Publishing

- [ ] Create VS Code Marketplace account
- [ ] Package extension (vsce)
- [ ] Write marketplace description
- [ ] Add screenshots and demos
- [ ] Set up auto-publish workflow

---

## Phase 5: Incremental Compilation

**Timeline: Week 19-24**

_See [INCREMENTAL_PLAN.md](INCREMENTAL_PLAN.md) for detailed implementation plan._

### 5.1 Summary of Phases

1. **Context Serialization** - Save/restore compilation state
2. **Method-Level Recompilation** - Recompile only changed methods
3. **Dependency Tracking** - Track cross-file dependencies
4. **IDE Integration** - Real-time error checking in VSCode

### 5.2 Integration Points

- [ ] Web IDE: Real-time compilation feedback
- [ ] VSCode Extension: Incremental error checking
- [ ] CLI: Watch mode with incremental builds

---

## Phase 6: Advanced Features

**Timeline: Week 25-30**

### 6.1 JavaScript Source Maps

**Implementation Plan:**

```typescript
interface SourceMapGenerator {
  addMapping(
    generated: Position,
    original: Position,
    source: string,
    name?: string
  ): void;
  toJSON(): RawSourceMap;
  toString(): string;
}

// Integration in RangerJavaScriptClassWriter
class SourceMapWriter {
  private generator: SourceMapGenerator;

  addMapping(jsLine: number, jsCol: number, rangerNode: CodeNode) {
    this.generator.addMapping(
      { line: jsLine, column: jsCol },
      { line: rangerNode.row, column: rangerNode.col },
      rangerNode.sourceFile
    );
  }
}
```

**Tasks:**

- [ ] Add `source-map` library dependency
- [ ] Modify code writers to track positions
- [ ] Emit inline or external source maps
- [ ] Add `-sourcemap` compiler flag
- [ ] Test with browser dev tools
- [ ] Test with Node.js debugging

### 6.2 Module Packaging

**JavaScript/TypeScript:**

- [x] ES modules (import/export) - `-esm` flag
- [x] CommonJS modules (require/module.exports) - `-nodemodule` flag
- [ ] UMD bundles
- [x] package.json generation - `-npm` flag

**Python:**

- [ ] `setup.py` / `pyproject.toml`
- [ ] Package structure with `__init__.py`
- [ ] pip installable packages

**Rust:**

- [ ] Cargo.toml generation
- [ ] Crate structure
- [ ] Library vs binary targets

**Go:**

- [ ] go.mod generation
- [ ] Package structure

### 6.3 Documentation Generator

- [ ] Generate API documentation from Ranger source
- [ ] Markdown output
- [ ] HTML output (via template)
- [ ] Include in compilation output

---

## Language Target Strategy

### Target Language Priority Matrix

| Language   | Priority | Current Status | 3.0 Goal    | Use Case                |
| ---------- | -------- | -------------- | ----------- | ----------------------- |
| JavaScript | P0       | ✅ Production  | Source Maps | Web, Node.js            |
| TypeScript | P0       | ✅ Production  | Strict Mode | Web, Node.js with types |
| Python     | P1       | ✅ Good        | Type Hints  | ML, scripting, backends |
| Rust       | P1       | ✅ Good        | Production  | Systems, performance    |
| Swift      | P1       | ✅ Good        | SwiftPM     | iOS, macOS              |
| C++        | P2       | ⚠️ Partial     | C++17       | Performance, systems    |
| Go         | P2       | ✅ Good        | Maintenance | Cloud, microservices    |
| Java       | P2       | ✅ Good        | Java 17+    | Enterprise, Android     |
| Kotlin     | P3       | ❌ New         | Basic       | Android, multiplatform  |
| Dart       | P3       | ❌ Evaluate    | TBD         | Flutter                 |
| PHP        | P3       | ✅ Basic       | PHP 8.x     | Web backends            |
| C#         | P3       | ✅ Good        | Maintenance | .NET, Unity             |
| Scala      | P4       | ✅ Good        | Deprecate   | (Migration to Kotlin)   |

### New Language Considerations

**Kotlin** - Recommended

- Modern, concise syntax similar to Ranger
- Strong type system
- Excellent Java interoperability
- Growing Android ecosystem
- Multiplatform capabilities

**Dart** - Evaluate

- Flutter is very popular
- Good type system
- May have limited non-Flutter use cases

**Zig** - Future Consideration

- Systems programming
- No hidden allocations
- C interoperability
- Growing community

**Nim** - Future Consideration

- Python-like syntax
- Compiles to C/JS
- Metaprogramming support

---

## Testing Strategy

### 9.1 Test Architecture

```
tests/
├── compiler.test.ts           # ES6/JS runtime tests ✅
├── compiler-rust.test.ts      # Rust runtime tests ✅
├── compiler-kotlin.test.ts    # Kotlin runtime tests ✅
├── compiler-python.test.ts    # Python runtime tests ✅
├── compiler-go.test.ts        # Go runtime tests ✅
├── compiler-cpp.test.ts       # C++ runtime tests
├── codegen-swift.test.ts      # Swift6 code pattern tests (NEW)
├── codegen-rust.test.ts       # Rust code pattern tests (NEW)
├── codegen-kotlin.test.ts     # Kotlin code pattern tests (NEW)
├── codegen-cpp.test.ts        # C++ code pattern tests (NEW)
├── introspection.test.ts      # Compiler introspection ✅
├── bugs.test.ts               # Regression tests ✅
├── fixtures/                  # Test source files
│   ├── core/                  # Basic language features
│   ├── classes/               # OOP features
│   ├── memory/                # Memory management (NEW)
│   ├── lexer/                 # String/char operations (NEW)
│   └── parser/                # Complex patterns (NEW)
└── helpers/
    └── compiler.ts            # Test utilities ✅
```

### 9.2 Test Types

#### Type 1: Code Generation Tests (Fast, No Runtime)

Verify generated code patterns without compiling the target:

```bash
npm run test:codegen          # All code generation tests
npm run test:codegen:swift    # Swift6 patterns only
npm run test:codegen:rust     # Rust patterns only
```

#### Type 2: Runtime Tests (Requires Target Toolchain)

Compile AND execute in target language:

```bash
npm test                      # All tests (skips unavailable targets)
npm run test:es6              # JavaScript target
npm run test:python           # Python target
npm run test:rust             # Rust target (requires rustc)
npm run test:kotlin           # Kotlin target (requires kotlinc)
npm run test:swift            # Swift6 target (requires swiftc)
npm run test:cpp              # C++ target (requires g++)
```

### 9.3 CI/CD Test Matrix

```yaml
# Fast tests (every PR)
fast-tests:
  - test:codegen # Code pattern verification
  - test:es6 # JavaScript (always available)
  - test:python # Python (usually available)

# Full tests (nightly/release)
full-tests:
  - all fast tests
  - test:rust # Requires Rust toolchain
  - test:kotlin # Requires Kotlin/JVM
  - test:swift # Requires Swift (macOS/Linux)
  - test:cpp # Requires C++ compiler
  - test:go # Requires Go
```

### 9.4 Adding New Tests

**For code generation tests:**

1. Add fixture to `tests/fixtures/`
2. Add test in `tests/codegen-{target}.test.ts`
3. Verify expected code patterns with `expect(code).toContain()`

**For runtime tests:**

1. Add fixture to `tests/fixtures/`
2. Add test in `tests/compiler-{target}.test.ts`
3. Verify output with `expectOutput()`

### 9.5 Test Coverage Goals

| Area             | Current    | Target   |
| ---------------- | ---------- | -------- |
| Array operations | ✅ Good    | Maintain |
| String methods   | ✅ Good    | Expand   |
| Class features   | ✅ Good    | Maintain |
| Optional types   | ⚠️ Partial | Improve  |
| Memory patterns  | ❌ Missing | Add      |
| Lexer patterns   | ❌ Missing | Add      |
| Parser patterns  | ❌ Missing | Add      |

---

## Release & Publishing

### 10.1 Version Numbering

```
3.0.0-alpha.1  - Initial 3.0 with file extension change
3.0.0-alpha.2  - Web IDE MVP
3.0.0-beta.1   - Feature complete
3.0.0-rc.1     - Release candidate
3.0.0          - Stable release
```

### 10.2 NPM Publishing

**Package Configuration:**

```json
{
  "name": "ranger-compiler",
  "version": "3.0.0",
  "description": "Cross-language compiler for portable algorithms",
  "main": "dist/bin/api.js",
  "types": "dist/bin/api.d.ts",
  "bin": {
    "ranger-compiler": "bin/output.js",
    "rgrc": "bin/output.js"
  },
  "files": ["bin/", "dist/", "lib/", "compiler/Lang.rgr"],
  "keywords": [
    "compiler",
    "cross-platform",
    "transpiler",
    "javascript",
    "python",
    "rust",
    "swift"
  ]
}
```

### 10.3 Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version bumped
- [ ] Git tag created
- [ ] NPM published
- [ ] GitHub release created
- [ ] VSCode extension published
- [ ] Web IDE deployed

---

## Future Considerations

### 11.1 Deferred to Ranger 4.0

**Web-Based Playground IDE** (moved from 3.0)

- Monaco Editor integration in browser
- Virtual filesystem with IndexedDB
- Project management and export
- Sample project gallery
- Real-time compilation in Web Worker

**Other Deferred Features:**

- **WASM Compilation Target** - Compile Ranger to WebAssembly
- **Cloud Compilation Service** - API for online compilation
- **Visual Debugger** - Integrated debugging experience
- **Package Manager** - Ranger-specific package management
- **Target Fallback System** - Automatic template fallback chain for related targets:
  - If target-specific template not found, try fallback target (e.g., swift6 → swift3)
  - Then try wildcard "\*" template
  - Would reduce code duplication in Lang.rgr for similar targets

### 11.2 Community Building

- [ ] GitHub Discussions enabled
- [ ] Contributing guide
- [ ] Code of conduct
- [ ] Example project gallery
- [ ] Tutorial series

### 11.3 Long-Term Vision

Ranger 3.x establishes the foundation for a mature cross-language development environment. Future versions (4.x) will focus on:

- Advanced IDE features
- Machine learning code generation assistance
- More sophisticated incremental compilation
- Extended standard library
- Plugin system for custom targets

---

## Implementation Timeline Summary

| Phase | Timeline   | Key Deliverables                                         | Status                    |
| ----- | ---------- | -------------------------------------------------------- | ------------------------- |
| 1     | Week 1-2   | Version 3.0, .rgr extension, cleanup                     | ✅ Complete               |
| 2     | Week 3-6   | Unit testing infrastructure for all targets              | ✅ Complete               |
| 3     | Week 7-12  | Language target improvements (Swift6, Rust, Kotlin, C++) | 🔄 In Progress            |
| 4     | Week 13-16 | VSCode extension finalization                            | Planned                   |
| 5     | Week 17-22 | Incremental compilation                                  | Planned                   |
| 6     | Week 23-28 | Source maps, module packaging                            | 🔄 Partial (ESM/CJS done) |

**Total Estimated Timeline: ~28 weeks (6-7 months)**

---

## Appendix A: Migration Guide (2.x → 3.0)

### File Extension Change

```bash
# Rename all .clj files to .rgr
find . -name "*.clj" -exec rename 's/\.clj$/.rgr/' {} \;

# Update imports in your code
sed -i 's/Import "\(.*\)\.clj"/Import "\1.rgr"/g' *.rgr
```

### Breaking Changes

1. **File Extension** - `.clj` deprecated, use `.rgr`
2. **Scala Target** - Deprecated, will be removed in 4.0

### New Features

1. **Source Maps** - Enable with `-sourcemap` flag
2. **Web IDE** - Available at playground.ranger-lang.org (TBD)
3. **Improved Targets** - Better Python, Rust, Swift support

---

## Appendix B: Web IDE Deployment

**Recommended Hosting:**

- **Vercel** - Easy deployment, good CDN
- **Netlify** - Alternative with good features
- **GitHub Pages** - Free, integrated with repo

**Domain:**

- `playground.ranger-lang.org` (recommended)
- `ranger-playground.vercel.app` (development)

**CI/CD:**

```yaml
# .github/workflows/deploy-playground.yml
name: Deploy Playground

on:
  push:
    branches: [main]
    paths:
      - "ranger-playground/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: cd ranger-playground && npm ci && npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```
