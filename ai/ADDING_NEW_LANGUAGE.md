# Adding a New Language Target to Ranger

This guide documents the steps required to add a new compilation target language to the Ranger compiler.

## Overview

Adding a new language target requires changes to multiple files:

1. **Lang.rgr** - Add language to targets list and operator templates
2. **ng_RangerXxxClassWriter.rgr** - Create the code generator class
3. **ng_RangerLanguageWriters.rgr** - Import the new class writer
4. **ng_LiveCompiler.rgr** - Register the language writer in initWriter
5. **VirtualCompiler.rgr** - Add to allowed_languages and file extension handling
6. **Tests** - Create test helpers and test file

## Step-by-Step Guide

### Step 1: Add Language to Lang.rgr Targets

In `compiler/Lang.rgr`, find the `targets` block and add your language:

```ranger
targets {
    ; short     common name     file extension
    es6         JavaScript      js
    kotlin      Kotlin          kt      ; <-- Add new language here
    ; ... other languages
}
```

### Step 2: Create the Class Writer

Create `compiler/ng_RangerXxxClassWriter.rgr` (e.g., `ng_RangerKotlinClassWriter.rgr`).

The class writer must:

- Extend `RangerGenericClassWriter`
- Implement key methods for code generation

**Required Methods:**

```ranger
class RangerXxxClassWriter {
  Extends (RangerGenericClassWriter)
  def compiler:LiveCompiler

  ; Map Ranger types to target language types
  fn getTypeString:string (type_string:string) { ... }
  fn getObjectTypeString:string (type_string:string ctx:RangerAppWriterContext) { ... }

  ; Write type definitions
  fn writeTypeDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) { ... }

  ; Write variable references
  fn WriteVRef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) { ... }

  ; Write scalar values (strings, numbers, booleans)
  fn WriteScalarValue:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) { ... }

  ; Write variable definitions
  fn writeVarDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) { ... }

  ; Write function argument definitions
  fn writeArgsDef:void (fnDesc:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter) { ... }

  ; Write function calls
  fn writeFnCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) { ... }

  ; Write constructor calls (new)
  fn writeNewCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) { ... }

  ; Write class definition
  fn writeClass:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) { ... }

  ; Optional: Custom operator handling
  fn CustomOperator:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) { ... }
}
```

**Type Mapping Example (Kotlin):**

```ranger
fn getTypeString:string (type_string:string) {
  switch type_string {
    case "int" { return "Int" }
    case "string" { return "String" }
    case "boolean" { return "Boolean" }
    case "double" { return "Double" }
    case "char" { return "Char" }
    case "void" { return "Unit" }
  }
  return type_string
}
```

### Step 3: Import the Class Writer

In `compiler/ng_RangerLanguageWriters.rgr`, add the import:

```ranger
Import "ng_RangerKotlinClassWriter.rgr"
```

### Step 4: Register in LiveCompiler

In `compiler/ng_LiveCompiler.rgr`, find the `initWriter` function and add a case:

```ranger
fn initWriter:void (ctx:RangerAppWriterContext) {
  ; ... existing code ...
  switch langName {
    ; ... existing cases ...
    case "kotlin" {
      langWriter = (new RangerKotlinClassWriter())
    }
    ; ... more cases ...
  }
}
```

### Step 5: Enable in VirtualCompiler

In `compiler/VirtualCompiler.rgr`:

**5a. Add to allowed_languages:**

```ranger
def allowed_languages:[string] ([] "es6" "go" "scala" "java7" "swift3" "swift6" "kotlin" "cpp" "php" "csharp" "python" "rust" )
```

**5b. Add file extension handling:**

```ranger
switch the_lang {
  ; ... existing cases ...
  case "kotlin" {
    if( false == (endsWith the_target ".kt")) {
      the_target = the_target + ".kt"
    }
  }
}
```

### Step 6: Add Operator Templates to Lang.rgr

For each operator in `compiler/Lang.rgr`, add a template for your language.

**Example - print operator:**

```ranger
print cmdPrint:void (text:string) {
  templates {
    kotlin ( nl "println( " (e 1) " )" nl )
    ; ... other languages ...
  }
}
```

**Template Commands:**

- `(e N)` - Emit expression at argument position N (1-based)
- `(block N)` - Emit a code block at argument position N
- `(typeof N)` - Emit the type name of argument N
- `nl` - Newline
- `I` - Increase indentation
- `i` - Decrease indentation
- `"string"` - Literal string output
- `(imp "x")` - Add import statement
- `(polyfill "location" "code")` - Add polyfill code
- `(create_polyfill "code")` - Legacy polyfill (goes to "utilities")
- `*` - Default template for all languages without specific template

**Common Operators to Implement:**

- `print` - Console output
- `strlen` - String length
- `substring` - String slicing
- `indexOf` - Find string index
- `push` - Array append
- `itemAt` - Array access
- `array_length` - Array size
- `for` - Loop iteration
- `if` / `switch` / `while` - Control flow
- `+` (string concat) - String operations
- Math operators: `sin`, `cos`, `sqrt`, `floor`, `ceil`

### Step 7: Create Tests

**7a. Add test helpers in `tests/helpers/compiler.ts`:**

```typescript
export function isKotlinAvailable(): boolean {
  try {
    execSync("kotlinc -version", { encoding: "utf-8", stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function compileRangerToKotlin(
  sourceFile: string,
  outputDir?: string
): CompileResult {
  // Similar pattern to compileRangerToGo, compileRangerToPython, etc.
}

export function compileAndRunKotlin(sourceFile: string): {
  compile: CompileResult;
  run?: RunResult;
} {
  // Compile .rgr to .kt, then compile .kt to .jar, then run
}
```

**7b. Create test file `tests/compiler-kotlin.test.ts`:**

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { compileAndRunKotlin, isKotlinAvailable } from "./helpers/compiler";

const kotlinAvailable = isKotlinAvailable();

describe.skipIf(!kotlinAvailable)("Ranger Compiler - Kotlin Target", () => {
  it("should compile and run array push", () => {
    const { compile, run } = compileAndRunKotlin(
      "tests/fixtures/array_push.rgr"
    );
    expect(compile.success).toBe(true);
    expect(run?.output).toContain("Done");
  });
  // ... more tests
});
```

**7c. Add test script to `package.json`:**

```json
"test:kotlin": "vitest run --config tests/vitest.config.ts compiler-kotlin.test.ts"
```

### Step 8: Rebuild the Compiler

After making changes to `.rgr` files:

```bash
npm run compile
```

This regenerates `bin/output.js` with your new language support.

### Step 9: Test the New Target

```bash
# Set environment
$env:RANGER_LIB="./compiler/Lang.rgr;./lib/stdops.rgr"

# Compile a test file
node bin/output.js tests/fixtures/array_push.rgr -l=kotlin -d=tests/.output-kotlin -o=array_push.kt

# Run tests
npm run test:kotlin
```

## Checklist

- [ ] Added to `Lang.rgr` targets block
- [ ] Created `ng_RangerXxxClassWriter.rgr`
- [ ] Added import to `ng_RangerLanguageWriters.rgr`
- [ ] Added case to `ng_LiveCompiler.rgr` initWriter
- [ ] Added to `VirtualCompiler.rgr` allowed_languages
- [ ] Added file extension case in `VirtualCompiler.rgr`
- [ ] Added templates for essential operators in `Lang.rgr`
- [ ] Created test helpers in `tests/helpers/compiler.ts`
- [ ] Created test file `tests/compiler-xxx.test.ts`
- [ ] Added test script to `package.json`
- [ ] Ran `npm run compile` to rebuild compiler
- [ ] Verified tests pass with `npm run test:xxx`

## Tips

1. **Start Simple**: Implement basic operators first (`print`, `def`, `=`, `+`)
2. **Use Existing Writers as Reference**: Look at `ng_RangerGolangClassWriter.rgr` or `ng_RangerRustClassWriter.rgr`
3. **Test Incrementally**: Compile simple programs and inspect the output
4. **Check Default Templates**: Many operators have `*` (default) templates that may work for your language
5. **Handle Optionals**: Consider how your language handles nullable/optional values
