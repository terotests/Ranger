# Plan: Golang Test Environment for Ranger Compiler

## Status: ✅ COMPLETED

## Summary

Go testing environment has been set up successfully:

- **Go Installed**: v1.25.5
- **Tests Passing**: 14 passed, 1 skipped (due to Go type conversion issue in `math_ops.clj`)
- **CI Updated**: Separate jobs for ES6 and Go tests

---

---

# Plan: Python Target for Ranger Compiler

## Status: 🚧 IN PROGRESS

## Overview

Add Python as a new compilation target for the Ranger compiler. Python is similar to PHP in some ways (dynamic typing, interpreted) but has significant syntax differences (indentation-based blocks, no semicolons, different OOP syntax).

## Python vs Other Languages Comparison

| Feature              | PHP             | Python           | JavaScript      |
| -------------------- | --------------- | ---------------- | --------------- |
| Variable prefix      | `$var`          | `var`            | `var`/`let`     |
| String concat        | `.`             | `+`              | `+`             |
| Array literal        | `array()`       | `[]`             | `[]`            |
| Hash/Dict literal    | `array()`       | `{}`             | `{}`            |
| Class definition     | `class Foo {}`  | `class Foo:`     | `class Foo {}`  |
| Method `this`        | `$this->`       | `self.`          | `this.`         |
| Constructor          | `__construct()` | `__init__(self)` | `constructor()` |
| Block delimiters     | `{ }`           | `:` + indent     | `{ }`           |
| Statement terminator | `;`             | newline          | `;`             |
| Print                | `echo`          | `print()`        | `console.log()` |
| Null                 | `null`          | `None`           | `null`          |
| Boolean              | `true/false`    | `True/False`     | `true/false`    |
| Import               | `require`       | `import`         | `import`        |

## Files to Create/Modify

### New Files

1. **`compiler/ng_RangerPythonClassWriter.clj`** - Main Python code generator (~600-700 lines)

### Files to Modify

2. **`compiler/ng_RangerLanguageWriters.clj`** - Add import for Python writer
3. **`compiler/ng_LiveCompiler.clj`** - Add Python case to language switch
4. **`compiler/Lang.clj`** - Add `python` templates for all operators (~200+ additions)

---

## Phase 1: Create Python Class Writer

### 1.1 File Structure (`ng_RangerPythonClassWriter.clj`)

```ranger
class RangerPythonClassWriter {
  Extends (RangerGenericClassWriter)
  def compiler:LiveCompiler
  def thisName:string "self"
  def wrote_header:boolean false

  ; Core methods to implement:
  fn adjustType:string (tn:string)
  fn EncodeString:string (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
  fn WriteScalarValue:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
  fn WriteVRef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
  fn writeVarDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
  fn writeClassVarDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
  fn writeArgsDef:void (fnDesc:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter)
  fn writeFnCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
  fn writeNewCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
  fn CreateLambda:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
  fn writeArrayLiteral (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
  fn WriteClass:void (cl:RangerAppClassDesc ctx:RangerAppWriterContext wr:CodeWriter)
  fn writeMethod:void (node:CodeNode fnDesc:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter)
}
```

### 1.2 Key Python Syntax Patterns

```python
# Class with inheritance
class Dog(Animal):
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "Woof!"

# Variable assignment (no declaration keyword)
x = 10
items = []
data = {}

# Array operations
items.append("hello")
length = len(items)
item = items[0]

# Hash/dict operations
data["key"] = "value"
value = data.get("key")

# Conditionals (no braces)
if x > 10:
    print("big")
else:
    print("small")

# Loops
for item in items:
    print(item)

while x > 0:
    x = x - 1

# String operations
lower = s.lower()
upper = s.upper()
length = len(s)
substr = s[0:5]
```

---

## Phase 2: Register Python Language

### 2.1 Update `ng_RangerLanguageWriters.clj`

```ranger
Import "ng_RangerPythonClassWriter.clj"
```

### 2.2 Update `ng_LiveCompiler.clj`

Add case in the language switch:

```ranger
case "python" {
  langWriter = (new RangerPythonClassWriter ())
}
```

---

## Phase 3: Add Python Templates to Lang.clj

### 3.1 Core Operations

```ranger
; Print
print stmt:void (text:string) {
    templates {
        ; ...existing...
        python ( "print(" (e 1) ")" nl )
    }
}

; Math PI
M_PI mathPi:double () {
    templates {
        ; ...existing...
        python ( "math.pi" (imp "math"))
    }
}

; String operations
strlen strLen:int ( text:string ) {
    templates {
        ; ...existing...
        python ( "len(" (e 1) ")" )
    }
}

substring getSubString:string (text:string position:int) {
    templates {
        ; ...existing...
        python ( (e 1) "[" (e 2) ":]" )
    }
}

substring getSubString:string (text:string start:int end:int) {
    templates {
        ; ...existing...
        python ( (e 1) "[" (e 2) ":" (e 3) "]" )
    }
}
```

### 3.2 Array Operations

```ranger
push arrPush:void ( list:[T] item:T ) {
    templates {
        ; ...existing...
        python ( (e 1) ".append(" (e 2) ")" )
    }
}

array_length arrLen:int ( arr:[T] ) {
    templates {
        ; ...existing...
        python ( "len(" (e 1) ")" )
    }
}

itemAt getAt:T ( array:[T] index:int ) {
    templates {
        ; ...existing...
        python ( (e 1) "[" (e 2) "]" )
    }
}
```

### 3.3 Hash Operations

```ranger
set hashSet:void (obj:[K:V] key:K value:V) {
    templates {
        ; ...existing...
        python ( (e 1) "[" (e 2) "] = " (e 3) )
    }
}

get hashGet:<optional>V (obj:[K:V] key:K) {
    templates {
        ; ...existing...
        python ( (e 1) ".get(" (e 2) ")" )
    }
}
```

---

## Phase 4: Implementation Steps

### Step-by-Step Checklist

- [ ] **Step 1**: Create `ng_RangerPythonClassWriter.clj` skeleton
- [ ] **Step 2**: Implement `WriteScalarValue` (strings, numbers, booleans)
- [ ] **Step 3**: Implement `WriteVRef` (variable references)
- [ ] **Step 4**: Implement `writeVarDef` (variable definitions)
- [ ] **Step 5**: Implement `WriteClass` (class definition)
- [ ] **Step 6**: Implement `writeMethod` (method definition)
- [ ] **Step 7**: Implement `writeNewCall` (object instantiation)
- [ ] **Step 8**: Implement `writeFnCall` (function calls)
- [ ] **Step 9**: Update `ng_RangerLanguageWriters.clj`
- [ ] **Step 10**: Update `ng_LiveCompiler.clj`
- [ ] **Step 11**: Add Python templates to `Lang.clj` (core operations)
- [ ] **Step 12**: Recompile the compiler
- [ ] **Step 13**: Test with simple fixture (`array_push.clj`)
- [ ] **Step 14**: Add more templates to `Lang.clj`
- [ ] **Step 15**: Create Python test file (`compiler-python.test.ts`)
- [ ] **Step 16**: Update CI workflow

---

## Phase 5: Python-Specific Challenges

### 5.1 Indentation-Based Blocks

Python uses indentation instead of braces. The `CodeWriter` class needs to:

- Track indentation level
- Output proper indentation for each line
- Handle block entry/exit correctly

Key pattern:

```python
if condition:
    # indented block
    statement1
    statement2
# back to original indent
```

### 5.2 No Statement Terminator

Python doesn't use semicolons. Need to ensure:

- No `;` after statements
- Proper newlines between statements

### 5.3 Self Reference

Python uses `self` explicitly in method definitions and member access:

```python
def method(self, arg):
    self.member = arg
```

### 5.4 Optional Values

Python has `None` instead of `null`. Optional handling:

```python
if value is not None:
    # use value
```

---

## Phase 6: Expected Python Output

### Input (Ranger)

```ranger
class Greeter {
    def name:string ""

    Constructor (n:string) {
        name = n
    }

    fn greet:string () {
        return "Hello, " + name
    }
}

class Main {
    sfn m@(main):void () {
        def g (new Greeter("World"))
        print (g.greet())
    }
}
```

### Expected Output (Python)

```python
class Greeter:
    def __init__(self, n):
        self.name = ""
        self.name = n

    def greet(self):
        return "Hello, " + self.name

def main():
    g = Greeter("World")
    print(g.greet())

if __name__ == "__main__":
    main()
```

---

## Phase 7: Testing

### 7.1 Test Helper Updates

Add to `tests/helpers/compiler.ts`:

- `compileRangerToPython()`
- `runCompiledPython()`
- `compileAndRunPython()`
- `isPythonAvailable()`

### 7.2 Test File

Create `tests/compiler-python.test.ts` with same fixtures as Go tests.

### 7.3 CI Updates

Add Python job to `.github/workflows/ci.yml`:

```yaml
test-python:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - uses: actions/setup-python@v5
      with:
        python-version: "3.11"
    - run: npm ci
    - run: npm run test:python
```

---

## Estimated Effort

| Phase                       | Time Estimate    |
| --------------------------- | ---------------- |
| Phase 1: Class Writer       | 4-6 hours        |
| Phase 2: Register Language  | 15 min           |
| Phase 3: Lang.clj Templates | 2-3 hours        |
| Phase 4: Implementation     | 4-6 hours        |
| Phase 5: Handle Edge Cases  | 2-3 hours        |
| Phase 6: Testing            | 2 hours          |
| **Total**                   | **~15-20 hours** |

---

## Success Criteria

1. ✅ Python class writer compiles without errors
2. ✅ Simple fixture (`array_push.clj`) compiles to valid Python
3. ✅ At least 10 fixtures pass Python tests
4. ✅ CI pipeline includes Python tests
5. ✅ Documentation updated

---

## Quick Start Commands

```powershell
# After implementation, compile a file to Python
node bin/output.js -l=python tests/fixtures/array_push.clj -d=tests/.output-python -o=array_push.py

# Run the generated Python
python tests/.output-python/array_push.py
```

---

---

# Original Go Plan (Archived Below)

---

## Overview

This document outlines the plan to create a test environment for verifying Ranger compiler output for the **Go** target language. Currently, all unit tests compile Ranger to ES6 JavaScript and execute with Node.js. We want to extend this to also test Go output.

## Current State

- **Existing Tests**: 15+ tests in `tests/compiler.test.ts`
- **Current Target**: ES6 JavaScript only (`-es6` flag)
- **Test Framework**: Vitest
- **Test Helper**: `tests/helpers/compiler.ts`
- **Fixtures Directory**: `tests/fixtures/*.clj`
- **Go Installed**: ❌ No (needs installation)

## Goals

1. Port existing fixture tests to also compile and run as Go code
2. Validate that the same Ranger source produces correct output in both JS and Go
3. Maintain parallel test execution capability
4. Keep CI/CD pipeline working (skip Go tests if Go not available)

---

## Phase 1: Prerequisites

### 1.1 Install Go

**Windows (Manual)**:

- Download from https://go.dev/dl/
- Install to default location (`C:\Program Files\Go`)
- Add to PATH

**Windows (Chocolatey)**:

```powershell
choco install golang
```

**Windows (Winget)**:

```powershell
winget install GoLang.Go
```

**CI/CD (GitHub Actions)**:

```yaml
- name: Setup Go
  uses: actions/setup-go@v5
  with:
    go-version: "1.21"
```

### 1.2 Verify Installation

```powershell
go version
# Expected: go version go1.21.x windows/amd64
```

---

## Phase 2: Test Infrastructure

### 2.1 Update Test Helper (`tests/helpers/compiler.ts`)

Add new functions to support Go compilation:

```typescript
// New constants
const GO_OUTPUT_DIR = path.join(ROOT_DIR, "tests", ".output-go");

// New function: Compile Ranger to Go
export function compileRangerToGo(
  sourceFile: string,
  outputDir?: string
): CompileResult {
  // Similar to compileRanger but uses -go flag instead of -es6
  // Uses -o="filename.go" for output
}

// New function: Build and run Go file
export function runCompiledGo(goFile: string): RunResult {
  // 1. Run: go build -o temp.exe goFile
  // 2. Execute: temp.exe
  // 3. Capture and return output
}

// New convenience function
export function compileAndRunGo(sourceFile: string): {
  compile: CompileResult;
  run?: RunResult;
} {
  // Combines compile + build + run for Go
}
```

### 2.2 Create Go-Specific Output Directory

```
tests/
  .output/          # ES6 JavaScript output (existing)
  .output-go/       # Go source output (new)
```

Add to `.gitignore`:

```
tests/.output-go/
```

### 2.3 Go Module Setup

Create `tests/.output-go/go.mod`:

```go
module ranger_test

go 1.21
```

This allows compiled Go files to be part of a module for proper builds.

---

## Phase 3: Test Organization

### 3.1 Option A: Separate Test Files (Recommended)

Create parallel test structure:

```
tests/
  compiler.test.ts       # ES6 tests (existing)
  compiler-go.test.ts    # Go tests (new)
  helpers/
    compiler.ts          # Updated with Go support
```

**Pros**:

- Clear separation of concerns
- Can skip Go tests easily
- Independent test runs

**Cons**:

- Some code duplication in test assertions

### 3.2 Option B: Parameterized Tests

Use test.each or similar to run same tests for multiple targets:

```typescript
describe.each(["es6", "go"])("Ranger Compiler - %s", (target) => {
  const compileAndRun = target === "es6" ? compileAndRunES6 : compileAndRunGo;

  it("should compile and run array push", () => {
    // Same test logic, different compiler target
  });
});
```

**Pros**:

- No code duplication
- Single source of truth for test cases

**Cons**:

- More complex setup
- Harder to skip one target

### 3.3 Recommended: Hybrid Approach

1. Create shared test case definitions
2. Import into both ES6 and Go test files
3. Use conditional skipping based on Go availability

```typescript
// tests/fixtures/test-cases.ts
export const TEST_CASES = {
  array_push: {
    fixture: "array_push.clj",
    expectedOutput: ["Done"],
  },
  // ...
};
```

---

## Phase 4: CI/CD Updates

### 4.1 Update GitHub Workflow (`.github/workflows/ci.yml`)

```yaml
name: CI

on: [push, pull_request]

jobs:
  test-es6:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test

  test-go:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20.x"
      - uses: actions/setup-go@v5
        with:
          go-version: "1.21"
      - run: npm ci
      - run: npm run test:go

  test-gate:
    needs: [test-es6, test-go]
    runs-on: ubuntu-latest
    steps:
      - run: echo "All tests passed!"
```

### 4.2 Update `package.json` Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:es6": "vitest run compiler.test.ts",
    "test:go": "vitest run compiler-go.test.ts",
    "test:all": "vitest run"
  }
}
```

---

## Phase 5: Implementation Steps

### Step-by-Step Checklist

- [x] **Step 1**: Install Go locally
- [x] **Step 2**: Update `tests/helpers/compiler.ts` with Go functions
- [x] **Step 3**: Create `tests/.output-go/` directory (auto-created)
- [x] **Step 4**: Update `.gitignore`
- [x] **Step 5**: Create `tests/compiler-go.test.ts` with first test
- [x] **Step 6**: Verify first Go test works locally
- [x] **Step 7**: Port remaining fixture tests to Go
- [x] **Step 8**: Update CI workflow
- [ ] **Step 9**: Add conditional skip if Go not available (implemented via `describe.skipIf`)
- [ ] **Step 10**: Document in README.md

---

## Phase 6: Handling Go-Specific Differences

### 6.1 Known Differences

1. **Package declaration**: Go files need `package main`
2. **Imports**: Go compiler auto-generates imports
3. **Entry point**: `func main()` required
4. **Print output**: May have slight formatting differences

### 6.2 Test Adjustments

Some tests may need Go-specific assertions:

```typescript
// Go may format numbers differently
if (target === "go") {
  expect(run?.output).toMatch(/3\.14/);
} else {
  expect(run?.output).toContain("3.14");
}
```

### 6.3 Fixtures That May Need Adjustment

| Fixture               | Issue            | Solution          |
| --------------------- | ---------------- | ----------------- |
| `string_ops.clj`      | Unicode handling | Test both or skip |
| `optional_values.clj` | Nil vs undefined | Adjust assertions |

---

# Plan: VS Code Language Server Extension for Ranger

## Status: ⚠️ PARTIAL - Syntax highlighting works, needs real compiler integration

## Overview

Create a Visual Studio Code extension that provides language support for Ranger (`.rngr` files), including:

- **Syntax Highlighting** - Colorize Ranger code with proper token classification
- **Auto-completion** - Suggest keywords, operators, types, and context-aware completions
- **Diagnostics** - Show errors and warnings in real-time
- **Hover Information** - Display type information and documentation on hover
- **Go to Definition** - Navigate to symbol definitions
- **Document Symbols** - Outline view for classes, methods, and properties

## File Extension

The Ranger language will use the `.rngr` file extension to avoid conflicts with Clojure (`.clj`).

## Architecture

```
ranger-vscode-extension/
├── client/                    # VS Code extension client
│   ├── src/
│   │   └── extension.ts      # Extension entry point
│   └── package.json
├── server/                    # Language Server Protocol (LSP) server
│   ├── src/
│   │   ├── server.ts         # LSP server entry point
│   │   ├── parser.ts         # Ranger language parser
│   │   ├── analyzer.ts       # Semantic analyzer
│   │   ├── completion.ts     # Completion provider
│   │   ├── hover.ts          # Hover provider
│   │   ├── diagnostics.ts    # Diagnostics provider
│   │   └── symbols.ts        # Document symbols provider
│   └── package.json
├── syntaxes/
│   └── ranger.tmLanguage.json # TextMate grammar for syntax highlighting
├── language-configuration.json # Language configuration (brackets, comments)
├── package.json               # Extension manifest
├── tsconfig.json
└── README.md
```

## Phase 1: Project Setup

### 1.1 Initialize Extension Project

- Create folder structure for client/server architecture
- Set up TypeScript configuration
- Configure npm workspaces for client and server

### 1.2 Extension Manifest (package.json)

```json
{
  "name": "ranger-language-support",
  "displayName": "Ranger Language Support",
  "description": "Language support for the Ranger cross-platform compiler language",
  "version": "0.1.0",
  "publisher": "terotests",
  "engines": { "vscode": "^1.85.0" },
  "categories": ["Programming Languages"],
  "activationEvents": ["onLanguage:ranger"],
  "main": "./client/out/extension.js",
  "contributes": {
    "languages": [
      {
        "id": "ranger",
        "aliases": ["Ranger", "ranger"],
        "extensions": [".rngr", ".ranger"],
        "configuration": "./language-configuration.json"
      }
    ],
    "grammars": [
      {
        "language": "ranger",
        "scopeName": "source.ranger",
        "path": "./syntaxes/ranger.tmLanguage.json"
      }
    ]
  }
}
```

---

## Phase 2: Syntax Highlighting (TextMate Grammar)

### 2.1 Token Types to Highlight

| Token Type         | Examples                                         | Scope                      |
| ------------------ | ------------------------------------------------ | -------------------------- |
| Keywords           | `class`, `fn`, `sfn`, `def`, `if`, `while`       | `keyword.control.ranger`   |
| Types              | `int`, `string`, `boolean`, `void`               | `storage.type.ranger`      |
| Operators          | `+`, `-`, `==`, `&&`, `push`, `get`              | `keyword.operator.ranger`  |
| Comments           | `; comment`                                      | `comment.line.ranger`      |
| Strings            | `"hello"`                                        | `string.quoted.ranger`     |
| Numbers            | `123`, `3.14`                                    | `constant.numeric.ranger`  |
| Booleans           | `true`, `false`                                  | `constant.language.ranger` |
| Class Names        | `MyClass`, `Person`                              | `entity.name.class.ranger` |
| Function Names     | `myMethod`, `getValue`                           | `entity.name.function`     |
| Annotations        | `@(main)`, `@(optional)`, `@(mutable)`           | `entity.other.annotation`  |
| Built-in Functions | `print`, `new`, `return`, `push`, `array_length` | `support.function.ranger`  |

### 2.2 TextMate Grammar Structure

```json
{
  "scopeName": "source.ranger",
  "patterns": [
    { "include": "#comments" },
    { "include": "#strings" },
    { "include": "#numbers" },
    { "include": "#keywords" },
    { "include": "#types" },
    { "include": "#operators" },
    { "include": "#annotations" },
    { "include": "#class-definition" },
    { "include": "#function-definition" }
  ],
  "repository": { ... }
}
```

---

## Phase 3: Language Configuration

### 3.1 Brackets and Comments

```json
{
  "comments": {
    "lineComment": ";"
  },
  "brackets": [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"]
  ],
  "autoClosingPairs": [
    { "open": "{", "close": "}" },
    { "open": "[", "close": "]" },
    { "open": "(", "close": ")" },
    { "open": "\"", "close": "\"" }
  ],
  "surroundingPairs": [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
    ["\"", "\""]
  ]
}
```

---

## Phase 4: Language Server Implementation

### 4.1 LSP Features to Implement

| Feature             | Priority | Description                        |
| ------------------- | -------- | ---------------------------------- |
| Syntax Highlighting | P0       | TextMate grammar (Phase 2)         |
| Diagnostics         | P0       | Parse errors and warnings          |
| Completion          | P1       | Keywords, types, operators         |
| Hover               | P1       | Type information on hover          |
| Document Symbols    | P1       | Outline of classes and functions   |
| Go to Definition    | P2       | Navigate to symbol definitions     |
| Find References     | P2       | Find all usages of a symbol        |
| Rename Symbol       | P3       | Rename across all usages           |
| Signature Help      | P3       | Parameter hints for function calls |

### 4.2 Parser Implementation

The parser needs to handle:

1. **S-expressions**: `(operator arg1 arg2)`
2. **Block syntax**: `{ statements }`
3. **Type annotations**: `name:Type`, `name@(annotation):Type`
4. **Class definitions**: `class Name { ... }`
5. **Function definitions**: `fn name:Type (params) { ... }`
6. **Control flow**: `if`, `while`, `for`, `switch`

### 4.3 Symbol Table

```typescript
interface RangerSymbol {
  name: string;
  kind: SymbolKind; // class, method, property, variable
  type: string;
  location: Location;
  children?: RangerSymbol[];
  annotations?: string[];
}
```

---

## Phase 5: Auto-completion

### 5.1 Completion Contexts

| Context         | Completions                                     |
| --------------- | ----------------------------------------------- |
| Top-level       | `class`, `Enum`, `Import`, `operators`          |
| Inside class    | `def`, `fn`, `sfn`, `Constructor`, `Extends`    |
| Inside function | `def`, `if`, `while`, `for`, `return`, `switch` |
| After `:`       | Type names (`int`, `string`, class names)       |
| After `@(`      | Annotations (`main`, `optional`, `mutable`)     |
| After `.`       | Member methods and properties                   |
| Inside `(`      | Operators and function arguments                |

### 5.2 Built-in Operators to Suggest

```typescript
const BUILT_IN_OPERATORS = [
  // Array operations
  { label: "push", detail: "Add item to array", signature: "push arr item" },
  {
    label: "itemAt",
    detail: "Get item at index",
    signature: "(itemAt arr idx)",
  },
  {
    label: "array_length",
    detail: "Get array length",
    signature: "(array_length arr)",
  },
  // Map operations
  { label: "get", detail: "Get value from map", signature: "(get map key)" },
  {
    label: "set",
    detail: "Set value in map/array",
    signature: "set map key value",
  },
  { label: "has", detail: "Check if key exists", signature: "(has map key)" },
  { label: "keys", detail: "Get all keys from map", signature: "(keys map)" },
  // String operations
  { label: "strlen", detail: "Get string length", signature: "(strlen str)" },
  {
    label: "substring",
    detail: "Get substring",
    signature: "(substring str start end)",
  },
  // ... more operators
];
```

---

## Phase 6: Diagnostics

### 6.1 Error Types to Detect

| Error Type         | Example                          |
| ------------------ | -------------------------------- |
| Syntax Error       | Unmatched parentheses or braces  |
| Unknown Type       | `def x:UnknownType`              |
| Undefined Variable | Using variable before definition |
| Type Mismatch      | `def x:int "string"`             |
| Missing Return     | Non-void function without return |
| Unknown Operator   | `(unknownOp arg1 arg2)`          |

### 6.2 Warning Types

| Warning Type       | Example                       |
| ------------------ | ----------------------------- |
| Unused Variable    | Defined but never used        |
| Unreachable Code   | Code after `return` statement |
| Deprecated Feature | Using old syntax              |

---

## Implementation Tasks

### Phase 1: Project Setup (2-3 hours)

- [ ] Create folder structure
- [ ] Initialize npm packages
- [ ] Set up TypeScript build
- [ ] Create extension manifest

### Phase 2: Syntax Highlighting (2-3 hours)

- [ ] Create TextMate grammar
- [ ] Define all token patterns
- [ ] Test with sample files
- [ ] Create language configuration

### Phase 3: Basic LSP Server (3-4 hours)

- [ ] Set up LSP connection
- [ ] Implement basic parser
- [ ] Add diagnostic reporting
- [ ] Test error detection

### Phase 4: Completion Provider (2-3 hours)

- [ ] Keyword completions
- [ ] Type completions
- [ ] Context-aware completions
- [ ] Operator completions

### Phase 5: Additional Features (3-4 hours)

- [ ] Hover provider
- [ ] Document symbols
- [ ] Go to definition
- [ ] Find references

---

## Time Estimates

| Phase                        | Estimated Time  |
| ---------------------------- | --------------- |
| Phase 1: Project Setup       | 2-3 hours       |
| Phase 2: Syntax Highlighting | 2-3 hours       |
| Phase 3: Basic LSP Server    | 3-4 hours       |
| Phase 4: Completion Provider | 2-3 hours       |
| Phase 5: Additional Features | 3-4 hours       |
| **Total**                    | **12-17 hours** |

---

## Success Criteria

1. ✅ Extension activates on `.rngr` files
2. ✅ Syntax highlighting works for all token types
3. ⬜ Auto-completion suggests keywords and types
4. ⬜ Parse errors are shown as diagnostics
5. ⬜ Hover shows type information
6. ⬜ Document outline shows classes and functions
7. ⬜ Extension can be packaged and installed

---

# Plan: Integrate Real Ranger Compiler into VS Code Language Server

## Status: 📋 PLANNED

## Overview

The current VS Code extension provides basic syntax highlighting but uses a simplified mock parser. To provide accurate type information, intelligent autocomplete, and proper diagnostics, we need to integrate the real Ranger compiler (`bin/output.js`) into the language server.

## Current Limitations

- ❌ Mock parser doesn't understand Ranger's actual syntax and semantics
- ❌ No accurate type inference or type checking
- ❌ Autocomplete doesn't know about class members, methods, or variables in scope
- ❌ Cannot resolve symbol definitions or provide accurate hover information
- ❌ Diagnostics are limited to bracket matching

## Proposed Solution

Integrate `bin/output.js` (the JavaScript-compiled Ranger compiler) into the language server to:

1. **Parse Ranger code** using the real parser → get AST (`CodeNode` tree)
2. **Analyze symbols** → extract classes, methods, properties, variables
3. **Type inference** → determine types at each position
4. **Context-aware completion** → suggest relevant members based on type
5. **Real diagnostics** → show actual compilation errors

## Architecture Changes

```
ranger-vscode-extension/
├── server/
│   ├── src/
│   │   ├── server.ts           # LSP server (existing)
│   │   ├── rangerCompiler.ts   # NEW: Wrapper for bin/output.js
│   │   ├── astAnalyzer.ts      # NEW: Analyze CodeNode AST
│   │   ├── typeResolver.ts     # NEW: Type inference
│   │   ├── completionProvider.ts # NEW: Context-aware completion
│   │   └── symbolTable.ts      # NEW: Track symbols in scope
│   └── package.json
├── compiler/
│   └── output.js               # Copy of ../../bin/output.js
└── package.json
```

## Implementation Plan

### Phase 1: Integrate Compiler

**1.1 Copy Compiler**

- Copy `bin/output.js` to `ranger-vscode-extension/compiler/output.js`
- Add to `.vscodeignore` to avoid bloating the package

**1.2 Create Compiler Wrapper** (`rangerCompiler.ts`)

```typescript
import * as rangerCompiler from "../compiler/output.js";

export interface RangerCompilerAPI {
  InputEnv: any;
  VirtualCompiler: any;
  CodeNode: any;
  RangerFlowParser: any;
  CmdParams: any;
}

export function getRangerCompiler(): RangerCompilerAPI {
  return {
    InputEnv: rangerCompiler.InputEnv,
    VirtualCompiler: rangerCompiler.VirtualCompiler,
    CodeNode: rangerCompiler.CodeNode,
    RangerFlowParser: rangerCompiler.RangerFlowParser,
    CmdParams: rangerCompiler.CmdParams,
  };
}

export async function parseRangerCode(
  code: string,
  filename: string
): Promise<CodeNode> {
  const compiler = getRangerCompiler();
  const env = new compiler.InputEnv();

  // Create virtual filesystem with the code
  const folder = new compiler.InputFSFolder();
  const file = new compiler.InputFSFile();
  file.name = filename;
  file.data = code;
  folder.files.push(file);

  // Add required library files (Lang.clj, stdlib.clj, etc.)
  // TODO: Bundle these or load from workspace

  env.filesystem = folder;

  // Parse without full compilation
  const parser = new compiler.RangerFlowParser();
  const rootNode = await parser.parse(code);

  return rootNode;
}
```

**1.3 Export Classes from output.js**

The compiler needs to export its classes. Check if `bin/output.js` exports them, if not, we need to add:

```javascript
// At the end of bin/output.js (before __js_main)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    CodeNode,
    VirtualCompiler,
    InputEnv,
    RangerFlowParser,
    CmdParams,
    InputFSFolder,
    InputFSFile,
    // ... other classes
  };
}
```

---

### Phase 2: AST Analysis

**2.1 Create AST Analyzer** (`astAnalyzer.ts`)

```typescript
import { CodeNode } from './rangerCompiler';

export interface SymbolInfo {
  name: string;
  kind: 'class' | 'method' | 'property' | 'variable' | 'parameter';
  type: string;
  node: CodeNode;
  range: { start: number; end: number };
  scope: SymbolScope;
}

export interface SymbolScope {
  parent?: SymbolScope;
  symbols: Map<string, SymbolInfo>;
  children: SymbolScope[];
}

export class ASTAnalyzer {
  private rootScope: SymbolScope;

  constructor(private rootNode: CodeNode) {
    this.rootScope = this.buildSymbolTable(rootNode);
  }

  /**
   * Walk AST and build symbol table
   */
  private buildSymbolTable(node: CodeNode, parentScope?: SymbolScope): SymbolScope {
    const scope: SymbolScope = {
      parent: parentScope,
      symbols: new Map(),
      children: []
    };

    // Extract symbols based on node type
    if (this.isClassDefinition(node)) {
      const className = this.getClassName(node);
      scope.symbols.set(className, {
        name: className,
        kind: 'class',
        type: className,
        node: node,
        range: { start: node.sp, end: node.ep },
        scope: scope
      });

      // Process class members
      for (const child of node.children) {
        if (this.isMethodDefinition(child)) {
          const methodName = this.getMethodName(child);
          scope.symbols.set(methodName, {
            name: methodName,
            kind: 'method',
            type: this.inferMethodReturnType(child),
            node: child,
            range: { start: child.sp, end: child.ep },
            scope: scope
          });
        } else if (this.isPropertyDefinition(child)) {
          const propName = this.getPropertyName(child);
          scope.symbols.set(propName, {
            name: propName,
            kind: 'property',
            type: this.getPropertyType(child),
            node: child,
            range: { start: child.sp, end: child.ep },
            scope: scope
          });
        }
      }
    }

    // Recursively process children
    for (const child of node.children) {
      const childScope = this.buildSymbolTable(child, scope);
      scope.children.push(childScope);
    }

    return scope;
  }

  /**
   * Find symbol at given offset
   */
  findSymbolAtOffset(offset: number): SymbolInfo | undefined {
    return this.findSymbolInScope(this.rootScope, offset);
  }

  private findSymbolInScope(scope: SymbolScope, offset: number): SymbolInfo | undefined {
    // Check symbols in current scope
    for (const symbol of scope.symbols.values()) {
      if (offset >= symbol.range.start && offset <= symbol.range.end) {
        return symbol;
      }
    }

    // Check child scopes
    for (const child of scope.children) {
      const result = this.findSymbolInScope(child, offset);
      if (result) return result;
    }

    return undefined;
  }

  /**
   * Get all symbols in scope at given offset
   */
  getSymbolsInScope(offset: number): SymbolInfo[] {
    const scope = this.findScopeAtOffset(this.rootScope, offset);
    if (!scope) return [];

    const symbols: SymbolInfo[] = [];
    let currentScope: SymbolScope | undefined = scope;

    // Collect symbols from current scope and parent scopes
    while (currentScope) {
      symbols.push(...currentScope.symbols.values());
      currentScope = currentScope.parent;
    }

    return symbols;
  }

  private findScopeAtOffset(scope: SymbolScope, offset: number): SymbolScope | undefined {
    // Check if offset is in any child scope
    for (const child of scope.children) {
      const result = this.findScopeAtOffset(child, offset);
      if (result) return result;
    }

    // Check if offset is in current scope
    for (const symbol of scope.symbols.values()) {
      if (offset >= symbol.range.start && offset <= symbol.range.end) {
        return scope;
      }
    }

    return scope; // Default to current scope
  }

  // Helper methods to identify node types
  private isClassDefinition(node: CodeNode): boolean {
    return node.vref === 'class' || node.value_type === /* class type value */;
  }

  private isMethodDefinition(node: CodeNode): boolean {
    return node.vref === 'fn' || node.vref === 'sfn';
  }

  private isPropertyDefinition(node: CodeNode): boolean {
    return node.vref === 'def';
  }

  // ... more helper methods
}
```

---

### Phase 3: Type Resolution

**3.1 Create Type Resolver** (`typeResolver.ts`)

```typescript
import { CodeNode } from "./rangerCompiler";
import { ASTAnalyzer, SymbolInfo } from "./astAnalyzer";

export class TypeResolver {
  constructor(private analyzer: ASTAnalyzer) {}

  /**
   * Get type of expression at offset
   */
  getTypeAtOffset(offset: number): string | undefined {
    const symbol = this.analyzer.findSymbolAtOffset(offset);
    if (symbol) {
      return symbol.type;
    }

    // If not a symbol, analyze the expression
    // Use CodeNode.eval_type_name for evaluated type
    return undefined;
  }

  /**
   * Get members of a type (for autocomplete after '.')
   */
  getTypeMembers(typeName: string): SymbolInfo[] {
    // Find class definition for typeName
    // Return all methods and properties
    return [];
  }
}
```

---

### Phase 4: Context-Aware Completion

**4.1 Update Completion Provider** (`completionProvider.ts`)

```typescript
import { ASTAnalyzer } from "./astAnalyzer";
import { TypeResolver } from "./typeResolver";
import { CompletionItem, CompletionItemKind } from "vscode-languageserver";

export class CompletionProvider {
  constructor(
    private analyzer: ASTAnalyzer,
    private typeResolver: TypeResolver
  ) {}

  provideCompletions(
    offset: number,
    triggerCharacter?: string
  ): CompletionItem[] {
    if (triggerCharacter === ".") {
      // Member access - get type before '.' and suggest its members
      const type = this.typeResolver.getTypeAtOffset(offset - 1);
      if (type) {
        const members = this.typeResolver.getTypeMembers(type);
        return members.map((m) => ({
          label: m.name,
          kind:
            m.kind === "method"
              ? CompletionItemKind.Method
              : CompletionItemKind.Property,
          detail: m.type,
          documentation: `${m.kind} of ${type}`,
        }));
      }
    }

    if (triggerCharacter === "@") {
      // Property access - suggest class properties
      return this.getClassProperties();
    }

    // Default: suggest symbols in scope + keywords
    const symbolsInScope = this.analyzer.getSymbolsInScope(offset);
    return [
      ...this.getKeywordCompletions(),
      ...symbolsInScope.map((s) => ({
        label: s.name,
        kind: this.symbolKindToCompletionKind(s.kind),
        detail: s.type,
      })),
    ];
  }

  private symbolKindToCompletionKind(kind: string): CompletionItemKind {
    switch (kind) {
      case "class":
        return CompletionItemKind.Class;
      case "method":
        return CompletionItemKind.Method;
      case "property":
        return CompletionItemKind.Property;
      case "variable":
        return CompletionItemKind.Variable;
      case "parameter":
        return CompletionItemKind.Variable;
      default:
        return CompletionItemKind.Text;
    }
  }
}
```

---

### Phase 5: Integration with LSP Server

**5.1 Update server.ts**

```typescript
import { parseRangerCode } from './rangerCompiler';
import { ASTAnalyzer } from './astAnalyzer';
import { TypeResolver } from './typeResolver';
import { CompletionProvider } from './completionProvider';

// Cache for parsed documents
const documentCache = new Map<string, {
  ast: CodeNode;
  analyzer: ASTAnalyzer;
  typeResolver: TypeResolver;
  completionProvider: CompletionProvider;
}>();

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const text = textDocument.getText();
  const uri = textDocument.uri;

  try {
    // Parse with real compiler
    const ast = await parseRangerCode(text, uri);

    // Build analysis tools
    const analyzer = new ASTAnalyzer(ast);
    const typeResolver = new TypeResolver(analyzer);
    const completionProvider = new CompletionProvider(analyzer, typeResolver);

    // Cache for later use
    documentCache.set(uri, {
      ast,
      analyzer,
      typeResolver,
      completionProvider
    });

    // Extract diagnostics from compilation errors
    const diagnostics = extractDiagnostics(ast);
    connection.sendDiagnostics({ uri, diagnostics });

  } catch (error) {
    // Send parse error as diagnostic
    connection.sendDiagnostics({
      uri,
      diagnostics: [{
        severity: DiagnosticSeverity.Error,
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
        message: `Parse error: ${error.message}`,
        source: 'ranger'
      }]
    });
  }
}

connection.onCompletion((params: TextDocumentPositionParams): CompletionItem[] => {
  const cached = documentCache.get(params.textDocument.uri);
  if (!cached) return [];

  const offset = /* convert position to offset */;
  return cached.completionProvider.provideCompletions(offset);
});

connection.onHover((params: TextDocumentPositionParams): Hover | null => {
  const cached = documentCache.get(params.textDocument.uri);
  if (!cached) return null;

  const offset = /* convert position to offset */;
  const type = cached.typeResolver.getTypeAtOffset(offset);

  if (type) {
    return {
      contents: {
        kind: 'markdown',
        value: `**Type**: \`${type}\``
      }
    };
  }

  return null;
});
```

---

## Challenges & Solutions

### Challenge 1: Bundling Library Files

**Problem**: The compiler needs `Lang.clj`, `stdlib.clj`, `stdops.clj`, `JSON.clj` to parse code.

**Solution**:

- Bundle these files in the extension
- Load them when initializing the compiler
- Or: make parsing work without full compilation (partial AST generation)

### Challenge 2: Performance

**Problem**: Parsing on every keystroke might be slow.

**Solution**:

- Debounce parsing (wait 300ms after last edit)
- Use incremental parsing if available
- Cache parsed AST and only reparse changed sections

### Challenge 3: Error Handling

**Problem**: Compiler might throw errors on incomplete code.

**Solution**:

- Wrap compiler calls in try-catch
- Use error recovery in parser
- Provide partial completions even with errors

---

## Timeline

| Task                        | Estimate        |
| --------------------------- | --------------- |
| Phase 1: Integrate Compiler | 2-3 hours       |
| Phase 2: AST Analysis       | 3-4 hours       |
| Phase 3: Type Resolution    | 2-3 hours       |
| Phase 4: Context Completion | 2-3 hours       |
| Phase 5: LSP Integration    | 2-3 hours       |
| Testing & Debugging         | 3-4 hours       |
| **Total**                   | **14-20 hours** |

---

## Success Criteria

1. ⬜ Real Ranger compiler parses `.rngr` files
2. ⬜ AST is extracted and analyzed for symbols
3. ⬜ Type information is accurate
4. ⬜ Autocomplete suggests class members after `.`
5. ⬜ Autocomplete suggests properties after `@`
6. ⬜ Hover shows accurate type information
7. ⬜ Real compilation errors are shown as diagnostics
8. ⬜ Performance is acceptable (< 500ms parse time)

---

## Testing

```bash
# Test with real Ranger files
cd ranger-vscode-extension

# Open a .rngr file with:
# - Class definitions
# - Method calls
# - Property access with @
# - Type annotations

# Verify:
# 1. Completion after '.' shows class methods
# 2. Completion after '@' shows class properties
# 3. Hover on variable shows its type
# 4. Syntax errors are highlighted
```

## References

- [Ranger Compiler bin/output.js](../../bin/output.js)
- [Ranger README - Using TypeScript](../../README.md#compiling-using-typescript)
- [CodeNode Class](../../bin/output.js#L1487) - AST node structure
- [RangerFlowParser](../../bin/output.js#L7318) - Parser class

---

# Previous Success Criteria for Basic Extension

1. ✅ Extension activates on `.rngr` files
2. ✅ Syntax highlighting works for all token types
3. ⬜ Auto-completion suggests keywords and types (needs real compiler)
4. ⬜ Parse errors are shown as diagnostics (needs real compiler)
5. ⬜ Hover shows type information (needs real compiler)
6. ⬜ Document outline shows classes and functions (needs real compiler)
7. ⬜ Extension can be packaged and installed

## Testing

```bash
# Install dependencies
cd ranger-vscode-extension
npm install

# Build
npm run compile

# Test in VS Code
# Press F5 to launch Extension Development Host

# Package extension
npm run package
```

## References

- [VS Code Language Server Extension Guide](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide)
- [TextMate Grammar Documentation](https://macromates.com/manual/en/language_grammars)
- [LSP Specification](https://microsoft.github.io/language-server-protocol/)
- [VS Code Extension API](https://code.visualstudio.com/api)
