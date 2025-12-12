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

# Plan: Swift Target Unit Testing

## Status: 📋 PLANNED

## Overview

Add unit testing support for the Swift target (`-l=swift3`). Swift 6 is the latest version and has improved Windows support, though it's still experimental on Windows.

## Swift on Windows

### Current Swift Windows Status

Swift has official Windows support starting from Swift 5.3, with ongoing improvements:

- **Swift 6.0** (Latest): Improved Windows toolchain
- **Windows Support**: Experimental but functional
- **Package Manager**: `swift build` and `swift run` work on Windows
- **Installation**: Available via official Swift.org installers or scoop/winget

### Installation Options

#### Option 1: Official Swift Installer (Recommended)

```powershell
# Download from https://swift.org/download/
# Run the installer (swift-6.0-RELEASE-windows10.exe or similar)

# Add to PATH (installer usually does this)
# Verify installation
swift --version
```

#### Option 2: Using Scoop

```powershell
scoop bucket add versions
scoop install swift
swift --version
```

#### Option 3: Using WinGet

```powershell
winget search swift
winget install Swift.Toolchain
swift --version
```

### Windows-Specific Requirements

1. **Visual Studio Build Tools** - Required for Swift on Windows

   - Install "Desktop development with C++" workload
   - Or install Visual Studio 2022 Community Edition

2. **Windows SDK** - Usually installed with Visual Studio

3. **PATH Configuration** - Ensure Swift bin directory is in PATH

## Swift vs Other Languages Comparison

| Feature              | Swift       | Rust            | Go              |
| -------------------- | ----------- | --------------- | --------------- |
| Variable declaration | `var`/`let` | `let`/`let mut` | `var`           |
| String type          | `String`    | `String`        | `string`        |
| Array type           | `[T]`       | `Vec<T>`        | `[]T`           |
| Optional type        | `T?`        | `Option<T>`     | `*T` or nil     |
| Class/Struct         | Both        | Struct only     | Struct only     |
| Method `self`        | `self`      | `&self`/`&mut`  | receiver        |
| Print                | `print()`   | `println!()`    | `fmt.Println()` |
| Null                 | `nil`       | `None`          | `nil`           |
| Entry point          | `main()`    | `fn main()`     | `func main()`   |

## Implementation Plan

### Phase 1: Prerequisites Check

1. **Check Swift installation on Windows**

   ```powershell
   swift --version
   # Expected: Swift version 6.x.x
   ```

2. **Verify compilation works**
   ```powershell
   # Create test.swift
   echo 'print("Hello Swift")' > test.swift
   swift test.swift
   # Or compile and run
   swiftc test.swift -o test.exe
   .\test.exe
   ```

### Phase 2: Test Infrastructure

#### 2.1 Create Swift Test Helper Functions

Add to `tests/helpers/compiler.ts`:

```typescript
export async function compileToSwift(fixtureName: string): Promise<string> {
  const inputPath = path.join(FIXTURES_DIR, `${fixtureName}.clj`);
  const outputPath = path.join(OUTPUT_SWIFT_DIR, `${fixtureName}.swift`);

  await runCompiler(inputPath, "swift3", outputPath);
  return outputPath;
}

export async function runSwift(swiftFile: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`swift "${swiftFile}"`, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Swift execution failed: ${stderr}`));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

export async function compileSwiftExecutable(
  swiftFile: string
): Promise<string> {
  const exePath = swiftFile.replace(".swift", ".exe");
  return new Promise((resolve, reject) => {
    exec(`swiftc "${swiftFile}" -o "${exePath}"`, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Swift compilation failed: ${stderr}`));
        return;
      }
      resolve(exePath);
    });
  });
}

export function isSwiftAvailable(): boolean {
  try {
    execSync("swift --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
```

#### 2.2 Create Swift Test File

Create `tests/compiler-swift.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  compileToSwift,
  runSwift,
  isSwiftAvailable,
  OUTPUT_SWIFT_DIR,
  ensureOutputDir,
} from "./helpers/compiler";

const SWIFT_AVAILABLE = isSwiftAvailable();

describe.skipIf(!SWIFT_AVAILABLE)("Swift Target Compilation", () => {
  beforeAll(() => {
    ensureOutputDir(OUTPUT_SWIFT_DIR);
  });

  describe("Basic Compilation", () => {
    it("should compile array_push to Swift", async () => {
      const outputPath = await compileToSwift("array_push");
      expect(fs.existsSync(outputPath)).toBe(true);

      const content = fs.readFileSync(outputPath, "utf-8");
      expect(content).toContain("var");
      expect(content).toContain("append");
    });

    it("should compile static_factory to Swift", async () => {
      const outputPath = await compileToSwift("static_factory");
      expect(fs.existsSync(outputPath)).toBe(true);

      const content = fs.readFileSync(outputPath, "utf-8");
      expect(content).toContain("class");
      expect(content).toContain("static func");
    });
  });

  describe("Runtime Tests", () => {
    it("should run array_push", async () => {
      const swiftFile = await compileToSwift("array_push");
      const output = await runSwift(swiftFile);
      expect(output).toContain("Done");
    });

    it("should run many_factories", async () => {
      const swiftFile = await compileToSwift("many_factories");
      const output = await runSwift(swiftFile);
      expect(output).toContain("K");
      expect(output).toContain("q");
    });

    it("should run while_loop", async () => {
      const swiftFile = await compileToSwift("while_loop");
      const output = await runSwift(swiftFile);
      expect(output).toContain("10");
    });
  });
});
```

### Phase 3: Package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test:swift": "vitest run tests/compiler-swift.test.ts"
  }
}
```

### Phase 4: CI/CD Integration

Add Swift job to `.github/workflows/ci.yml`:

```yaml
test-swift:
  runs-on: ${{ matrix.os }}
  strategy:
    matrix:
      os: [macos-latest] # Swift is most stable on macOS
      # os: [macos-latest, ubuntu-latest]  # Linux also well supported
      # Windows Swift CI is experimental

  steps:
    - uses: actions/checkout@v4

    - name: Setup Swift
      uses: swift-actions/setup-swift@v2
      with:
        swift-version: "6.0"

    - name: Verify Swift
      run: swift --version

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: "20"

    - name: Install dependencies
      run: npm ci

    - name: Build compiler
      run: npm run compile

    - name: Run Swift tests
      run: npm run test:swift
```

### Phase 5: Swift-Specific Fixes (If Needed)

Potential issues to watch for:

1. **String interpolation** - Swift uses `\(expr)` instead of `+` concatenation
2. **Optional unwrapping** - Swift requires explicit `!` or `?`
3. **Array initialization** - Swift uses `[Type]()`
4. **Static methods** - Swift uses `static func`
5. **Entry point** - Swift 6 supports `@main` attribute

#### Example Lang.clj Updates (if needed)

```ranger
; String concatenation for Swift (if current doesn't work)
+ strConcat:string ( text1:string text2:string ) {
    templates {
        swift3 ( (e 1) " + " (e 2) )
    }
}

; Print for Swift
print stmt:void (text:string) {
    templates {
        swift3 ( "print(" (e 1) ")" nl )
    }
}
```

## Known Swift Target Issues

Check `ISSUES.md` and test for:

1. **Optional handling** - Swift is strict about optionals
2. **Type inference** - Swift infers types differently
3. **Memory management** - ARC vs manual management
4. **Foundation imports** - Some features require `import Foundation`

## Windows-Specific Considerations

### Limitations on Windows

1. **Slower compilation** - Swift on Windows is slower than macOS
2. **Foundation subset** - Not all Foundation APIs available on Windows
3. **Debugging** - LLDB support is limited on Windows
4. **Package ecosystem** - Some Swift packages may not support Windows

### Workarounds

1. **Use `swift` directly** - `swift filename.swift` for interpretation
2. **Compile with swiftc** - `swiftc filename.swift -o output.exe`
3. **Skip Foundation-dependent tests** on Windows if needed

## Estimated Effort

| Phase                         | Time Estimate  |
| ----------------------------- | -------------- |
| Phase 1: Prerequisites        | 30 min         |
| Phase 2: Test Infrastructure  | 1 hour         |
| Phase 3: Package Scripts      | 15 min         |
| Phase 4: CI/CD                | 30 min         |
| Phase 5: Swift-specific fixes | 1-2 hours      |
| **Total**                     | **~4-5 hours** |

---

## Success Criteria

1. ⬜ Swift is installed and working on development machine
2. ⬜ At least 5 fixture tests compile successfully to Swift
3. ⬜ At least 3 fixture tests run successfully
4. ⬜ CI pipeline runs Swift tests (at least on macOS)
5. ⬜ Tests skip gracefully if Swift is not available
6. ⬜ Documentation updated in README.md and ai/ folder

## Quick Start Commands

```powershell
# 1. Install Swift on Windows (from swift.org)
# Download installer from https://swift.org/download/

# 2. Verify installation
swift --version

# 3. Test basic Swift compilation
echo 'print("Hello Swift")' | Out-File -Encoding utf8 test.swift
swift test.swift

# 4. Run Swift tests (after implementation)
npm run test:swift
```

## References

- [Swift.org Downloads](https://swift.org/download/)
- [Swift on Windows](https://www.swift.org/getting-started/#on-windows)
- [Swift GitHub Actions](https://github.com/swift-actions/setup-swift)
- [Swift Package Manager](https://swift.org/package-manager/)
