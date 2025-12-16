# Ranger Compiler Known Issues

## Issue #1: Compiler crash with `toString` method name

**Status:** Fixed  
**Severity:** High  
**Found:** December 11, 2025  
**Fixed:** December 16, 2025

### Description

The Ranger compiler crashes during the "Collecting available methods" phase when:

1. A class defines a method named `toString`
2. Another class has an array property of that class type

### Error Message

```
1. Collecting available methods.
TypeError: Cannot read properties of undefined (reading 'push')
Got unknown compiler error
```

### Minimal Reproduction

```ranger
; This code triggers the bug

class Item {
    def value:string ""

    Constructor (v:string) {
        value = v
    }

    fn toString:string () {   ; <-- This method name causes the crash
        return value
    }
}

class Container {
    def items:[Item]          ; <-- Array of the class with toString

    Constructor () {
        push items (new Item("test"))
    }
}

class Main {
    sfn m@(main):void () {
        def c (new Container())
        print "Done"
    }
}
```

### Root Cause

The `get` operator for dictionaries in ES6/JavaScript used direct bracket access `obj[key]` which returns values from the prototype chain. When `key` is `"toString"`, `obj["toString"]` returns `Object.prototype.toString` (a function) instead of `undefined`.

In `ng_RangerAppClassDesc.rgr`, the `addMethod` function uses:

```ranger
def defVs:RangerAppMethodVariants (get method_variants desc.name)
if (null? defVs) { ... }
```

When `desc.name` is `"toString"`, the `get` returned the inherited function, not `undefined`, so the code tried to access `.variants` on a function object, causing the crash.

### Resolution

Fixed the `get` operator template for ES6 in `compiler/Lang.rgr` to use `hasOwnProperty` check:

```ranger
es6 ( "( " (e 1) ".hasOwnProperty(" (e 2) ") ? " (e 1) "[" (e 2) "] : undefined )" )
```

This ensures that only properties directly on the object are returned, not inherited prototype properties like `toString`, `valueOf`, `hasOwnProperty`, etc.

### Files Changed

- `compiler/Lang.rgr` - Added ES6-specific template for dictionary `get` operator

---

## Issue #2: AI Documentation uses incorrect syntax

**Status:** Fixed  
**Severity:** Medium  
**Found:** December 11, 2025

### Description

The AI documentation initially used `set_array_at array index value` syntax which doesn't exist in Ranger.

### Correct Syntax

```ranger
set array index value
```

### Resolution

Updated AI documentation in `ai/INSTRUCTIONS.md` and `ai/EXAMPLES.md`.

---

## Issue #3: Compiler exits with code 0 on error

**Status:** Fixed  
**Severity:** Medium  
**Found:** December 11, 2025

### Description

The compiler would exit with exit code 0 (success) even when compilation failed, making it difficult to integrate with build systems and test frameworks.

### Resolution

Added `exit 1` calls to the compiler source code in `compiler/VirtualCompiler.clj` at:

- After displaying compiler errors during "Collecting available methods" phase
- After displaying compiler errors at the end of compilation
- In the catch block for unknown compiler errors

The `exit` operator was already defined in `compiler/Lang.clj` and generates `process.exit(code)` for ES6/JavaScript.

### Files Changed

- `compiler/VirtualCompiler.clj` - Added `exit 1` calls on error paths
- `bin/output.js` - Recompiled with the fix

---

## Issue #4: Go target - Integer division returns wrong type

**Status:** Fixed  
**Severity:** Medium  
**Found:** December 12, 2025  
**Fixed:** December 16, 2025

### Description

When compiling to Go (`-l=go`), dividing two integers and assigning to a `double` variable generates invalid Go code. The compiler outputs `int64` result but the variable expects `float64`.

### Error Message

```
# command-line-arguments
.\math_ops.go:29:21: cannot use a / b (value of type int64) as float64 value in variable declaration
```

### Minimal Reproduction

```ranger
class MathTest {
    sfn m@(main):void () {
        def a 10
        def b 3
        def result:double (a / b)  ; <-- This fails in Go
        print (to_string result)
    }
}
```

### Generated Go Code (Incorrect)

```go
var result float64 = a / b  // int64 / int64 = int64, not float64
```

### Expected Go Code

```go
var result float64 = float64(a) / float64(b)
```

### Root Cause

The `/` operator for integers in `Lang.rgr` returns `double` conceptually, but the Go template didn't include type conversion. The ES6 JavaScript target works correctly because JS automatically handles the conversion.

### Resolution

Added a Go-specific template for the integer division operator in `compiler/Lang.rgr`:

```ranger
/               cmdDivOp:double         ( left:int right:int ) { templates {
    go ( "float64(" (e 1) ") / float64(" (e 2) ")" )
    * ( (e 1) " / " (e 2) )
} }
```

This ensures that when dividing two integers in Go, both operands are explicitly cast to `float64`, producing the correct floating-point result.

### Files Changed

- `compiler/Lang.rgr` - Added Go-specific template for integer division operator

---

## Issue #5: Go target - Duplicate constructor assignments in inheritance

**Status:** Open  
**Severity:** Low  
**Found:** December 12, 2025

### Description

When a class extends another class, the Go constructor generates duplicate assignments for inherited member variables.

### Example Generated Code

```go
func CreateNew_Dog(n string) *Dog {
  me := new(Dog)
  me.name = ""
  me.name = n;   // First assignment
  me.name = n;   // Duplicate assignment
  return me;
}
```

### Expected Code

```go
func CreateNew_Dog(n string) *Dog {
  me := new(Dog)
  me.name = ""
  me.name = n;   // Only one assignment needed
  return me;
}
```

### Impact

- No functional impact (code works correctly)
- Slightly larger generated code
- Minor inefficiency

### Root Cause

The constructor generation for inherited classes appears to process the parent's constructor assignments and then the child's, without deduplication.

### Affected Targets

- Go (`-l=go`)
- Other targets - Not tested

---

## Issue #6: Output directory and filename options behavior is confusing

**Status:** Open  
**Severity:** Medium  
**Found:** December 12, 2025

### Description

The compiler's `-d` (output directory) and `-o` (output filename) options have confusing behavior:

1. **Output goes to root folder**: When compiling, output may go to the working directory instead of the specified `-d` directory
2. **File extension not added**: When `-o` is specified without an extension, the language-appropriate extension is NOT automatically added
3. **Path handling issues**: The compiler may produce invalid paths like `tests\/./tests/fixtures/` when combining directory options

### Examples

```bash
# This may output to root instead of tests/.output-python/
node bin/output.js -l=python tests/fixtures/array_push.clj -d=tests/.output-python

# This creates file named "array_push" instead of "array_push.py"
node bin/output.js -l=python tests/fixtures/array_push.clj -o=array_push

# Working approach - specify full filename with extension
node bin/output.js -l=python tests/fixtures/array_push.clj -o=array_push.py
```

### Current Behavior

1. `-d=<dir>` - Should set output directory, but behavior is inconsistent
2. `-o=<file>` - Sets output filename. If `output` (default), extension is auto-added based on language
3. File extensions are ONLY auto-added when `-o` is not specified or is `output`

### File Extension Mapping (when auto-added)

| Language         | Extension |
| ---------------- | --------- |
| es6              | .js       |
| es6 + typescript | .ts       |
| swift3           | .swift    |
| swift6           | .swift    |
| php              | .php      |
| csharp           | .cs       |
| java7            | .java     |
| go               | .go       |
| scala            | .scala    |
| cpp              | .cpp      |
| python           | .py       |

### Workaround

Always specify the full output filename with extension when using `-o`:

```bash
# Correct usage
node bin/output.js -l=python myfile.clj -o=myfile.py -d=./output
```

### Root Cause

The file extension logic in `compiler/VirtualCompiler.clj` only runs when `the_target == "output"` (the default value). When a custom `-o` value is provided, the extension logic is skipped entirely.

### Recommended Fix

1. Always append the correct extension based on language, even when `-o` is specified (unless `-o` already has an extension)
2. Fix the directory path handling to avoid doubled or malformed paths
3. Ensure `-d` option is consistently respected

### Files Affected

- `compiler/VirtualCompiler.clj` - Lines ~395-440 (file extension and directory logic)

---

## Issue #7: Python target - super().**init**() doesn't pass constructor arguments

**Status:** Fixed  
**Severity:** High  
**Found:** December 12, 2025  
**Fixed:** December 16, 2025

### Description

When a class extends another class in Python output, the generated `super().__init__()` call doesn't pass the required constructor arguments to the parent class.

### Example Ranger Code

```ranger
class Animal {
    def name:string ""

    Constructor (n:string) {
        name = n
    }
}

class Dog {
    Extends (Animal)

    Constructor (n:string) {
        ; name = n  (this should call parent constructor with n)
    }

    fn bark:void () {
        print "Woof!"
    }
}
```

### Generated Python Code (Before Fix)

```python
class Dog(Animal):
  def __init__(self, n):
    super().__init__()  # Missing argument 'n'
    self.name = n
```

### Generated Python Code (After Fix)

```python
class Dog(Animal):
  def __init__(self, n):
    super().__init__(n)  # Now passes 'n' to parent
```

### Root Cause

The Python class writer (`compiler/ng_RangerPythonClassWriter.rgr`) generated `super().__init__()` without analyzing what arguments the parent constructor requires.

### Resolution

Modified `ng_RangerPythonClassWriter.rgr` to check if the parent class has a constructor, and if so, pass the parent constructor's parameters to `super().__init__()`:

```ranger
if(parentClass) {
  if (parentClass.has_constructor) {
    def parentConstr:RangerAppFunctionDesc (unwrap parentClass.constructor_fn)
    wr.out("super().__init__(" false)
    for parentConstr.params arg:RangerAppParamDesc i {
      if (i > 0) {
        wr.out(", " false)
      }
      wr.out(arg.compiledName false)
    }
    wr.out(")" true)
  } {
    wr.out("super().__init__()" true)
  }
}
```

### Files Changed

- `compiler/ng_RangerPythonClassWriter.rgr` - Fixed `super().__init__()` to pass parent constructor arguments

---

## Issue #8: Python target - Variable names can shadow Python builtins

**Status:** Fixed  
**Severity:** Medium  
**Found:** December 12, 2025  
**Fixed:** December 16, 2025

### Description

When compiling to Python, variable names that match Python builtin function names (like `str`, `list`, `int`, `dict`, etc.) cause runtime errors because the variable shadows the builtin.

### Example Ranger Code

```ranger
class StringTest {
    sfn m@(main):void () {
        def str "Hello World"        ; 'str' shadows Python's str()
        def len (strlen str)
        print ("Length: " + len)     ; Fails: str() is now a string variable
    }
}
```

### Generated Python Code (Before Fix)

```python
def main():
  str = "Hello World"           # Shadows builtin str()
  __len = len(str)
  print("Length: " + str(__len)) # ERROR: str is now "Hello World", not str()
```

### Generated Python Code (After Fix)

```python
def main():
  _str = "Hello World"          # Renamed to avoid shadowing
  __len = len(_str)
  print("Length: " + str(__len)) # Works: str() is the builtin
```

### Root Cause

The compiler didn't have Python-specific reserved word transformations to rename conflicting variable names.

### Resolution

Added Python-specific reserved words to `compiler/Lang.rgr` in the `reserved_words` section:

```ranger
python {
    str _str
    int _int
    float _float
    bool _bool
    list _list
    dict _dict
    set _set
    tuple _tuple
    type _type
    id _id
    len _len
    range _range
    print _print
    input _input
    open _open
    file _file
    filter _filter
    sum _sum
    min _min
    max _max
    abs _abs
    round _round
    sorted _sorted
    reversed _reversed
    enumerate _enumerate
    zip _zip
    any _any
    all _all
    iter _iter
    next _next
    object _object
    bytes _bytes
    complex _complex
    property _property
    classmethod _classmethod
    staticmethod _staticmethod
    super _super
    format _format
    hash _hash
    ; ... and more
}
```

This uses Ranger's existing `reserved_words` system which automatically transforms variable names during compilation.

### Files Changed

- `compiler/Lang.rgr` - Added Python reserved words mapping

---

## Issue #9: Go target - Math operations type conversion issues

**Status:** Open  
**Severity:** Medium  
**Found:** December 12, 2025

### Description

The Go target has issues with math operations involving type conversions between `int` and `double`. Integer division, mixed-type operations, and type inference don't generate correct Go code.

### Affected Tests

- `tests/compiler-go.test.ts` - "should compile and run math operations" - **SKIPPED**

### Related Issues

See Issue #4 for the integer division specific case.

### Workaround

Use explicit type conversions in Ranger source code:

```ranger
def result:double ((int2double a) / (int2double b))
```

---

## Issue #10: Rust target - String literals vs String type mismatch

**Status:** Fixed  
**Severity:** High  
**Found:** December 12, 2025

### Description

The Rust code generator outputs string literals (`"hello"`) where owned `String` types are expected. In Rust, `"hello"` is a `&str` (string slice), but `Vec<String>` and `String` fields require owned `String` values.

### Resolution

Fixed comprehensively - see Issue #13 for full details. Key fixes:

- Added `.to_string()` to all string literals in `WriteScalarValue`
- Added custom `push` operator handling for string arrays
- String concatenation now uses `format!` macro

---

## Issue #11: Rust target - Many fixtures fail to compile

**Status:** Fixed  
**Severity:** High  
**Found:** December 12, 2025

### Description

Most Ranger fixtures failed to compile to Rust due to missing templates and incomplete class writer implementation.

### Resolution

Fixed comprehensively - see Issue #13 for the full list of 15 fixes applied. The ChessBoard demo now compiles and runs successfully, demonstrating:

- Classes with constructors
- Static factory methods
- Instance methods with `&mut self`
- String operations and concatenation
- Array operations (push, itemAt, set)
- While loops
- Ternary expressions
- Object instantiation and method calls

---

## Issue #12: File extension double-added with default output name

**Status:** Fixed  
**Severity:** Low  
**Found:** December 12, 2025

### Description

When using `-o=output.js` explicitly, the file extension was added twice, resulting in `output.js.js`.

### Resolution

Added `endsWith` check in `compiler/VirtualCompiler.clj` before appending file extension:

```ranger
if ((endsWith the_target ".js") == false)
    the_target = the_target + ".js"
```

The fix ensures extensions are only added when not already present.

---

## Issue #13: Rust target - Comprehensive Rust Code Generation Fixes

**Status:** Fixed  
**Severity:** High  
**Found:** December 12, 2025  
**Fixed:** December 12, 2025

### Description

Multiple issues prevented Rust code from compiling. After systematic fixes, the ChessBoard demo now compiles and runs successfully.

### Fixes Applied

#### 1. Ternary Operator (Lang.clj)

**Problem:** Rust doesn't have a `? :` ternary operator like JavaScript.  
**Fix:** Added Rust template using `if/else` expression syntax.

```ranger
rust ( 'if ' (e 1) ' { ' (e 2) ' } else { ' (e 3) ' }' )
```

#### 2. Function Calls as Arguments (ng_RangerRustClassWriter.clj)

**Problem:** Extra semicolons added when function calls were used as arguments.  
**Fix:** Added `ctx.setInExpr()/unsetInExpr()` around argument walking in `writeFnCall`.

#### 3. Constructor `this` vs `me` (ng_RangerRustClassWriter.clj)

**Problem:** Constructor used hardcoded `"self"` instead of `thisName` variable (`me`).  
**Fix:** Changed `WriteVRef` to use the `thisName` variable consistently.

#### 4. String Literal Initialization (ng_RangerRustClassWriter.clj)

**Problem:** String literals (`"hello"`) are `&str` in Rust, not `String`.  
**Fix:** Added `.to_string()` to all string literals in `WriteScalarValue`.

#### 5. Primitive Type References (ng_RangerRustClassWriter.clj)

**Problem:** Generated `&bool`, `&i64` instead of `bool`, `i64` for primitives.  
**Fix:** Removed `&` prefix for primitive types in `writeArgsDef`.

#### 6. Array Field Initialization (ng_RangerRustClassWriter.clj)

**Problem:** Array fields in structs had no default initialization.  
**Fix:** Added `Vec::new()` for array fields without defaults in struct initialization.

#### 7. Method Self Reference (ng_RangerRustClassWriter.clj)

**Problem:** Used `&self` which doesn't allow mutation.  
**Fix:** Changed all methods to use `&mut self`.

#### 8. String Concatenation (Lang.clj)

**Problem:** Rust doesn't support `+` for string concatenation like JavaScript.  
**Fix:** Added `format!` macro templates for string + string and int + string.

```ranger
rust ( "format!(\"{}{}\", " (e 1) ", " (e 2) ")" )
```

#### 9. Array Indexing (Lang.clj)

**Problem:** Array indices must be `usize`, not `i64`. Also needed `.clone()` for non-Copy types.  
**Fix:** Added `as usize` conversion and `.clone()` for `itemAt` operator.

```ranger
rust ( (e 1) "[" (e 2) " as usize].clone()" )
```

#### 10. Array Set Operator (Lang.clj)

**Problem:** Used `.insert()` instead of index assignment for arrays.  
**Fix:** Changed to proper array index assignment with `as usize`.

```ranger
rust ( (e 1) "[" (e 2) " as usize] = " (e 3) ";" )
```

#### 11. Clone Derive (ng_RangerRustClassWriter.clj)

**Problem:** Structs couldn't be cloned when returned from methods.  
**Fix:** Added `#[derive(Clone)]` before all struct definitions.

#### 12. Return Statement Cloning (Lang.clj + ng_RangerRustClassWriter.clj)

**Problem:** Returning String/Object fields moves them from `&mut self`.  
**Fix:** Added `(custom _)` for Rust returns with `.clone()` for String/Object types.

#### 13. While Loop Parentheses (Lang.clj)

**Problem:** Rust warns about unnecessary parentheses in `while (condition)`.  
**Fix:** Added Rust template without parentheses: `while condition {`.

---

## Issue #12: CI Tests Fail with LF Line Endings

**Status:** Resolved (workaround in place)  
**Severity:** High  
**Found:** December 13, 2025

### Description

Tests pass locally on Windows but fail in GitHub Actions CI (Linux). The compiled JavaScript output contains broken operator syntax like `while<i5` instead of `while (i < 5)` and `*ab` instead of `a * b`.

### Root Cause

The Ranger compiler/parser appears to be sensitive to line endings. When source files (`.rgr`) have LF-only line endings (as happens on Linux or when git's `core.autocrlf` normalizes files), the operator infixing logic fails silently, producing invalid JavaScript output.

### Error Messages in CI

```
SyntaxError: Unexpected token '<'
    while<i5
         ^

SyntaxError: Unexpected token '*'
    const prod = *ab;
                 ^
```

### Resolution

Ensured all `.rgr` source files and `bin/output.js` are committed with CRLF line endings:

1. Convert files to CRLF locally
2. Disable `core.autocrlf` temporarily: `git config core.autocrlf false`
3. Remove files from index and re-add: `git rm --cached *.rgr` then `git add *.rgr`
4. Commit and push

### Files Affected

- All `.rgr` files in `compiler/`, `lib/`, `tests/fixtures/`
- `bin/output.js`

### Future Fix Needed

## The parser should be investigated to handle both LF and CRLF line endings consistently. The issue is likely in the Ranger source parser (`ng_RangerLispParser.rgr` or related files) where line ending handling affects token parsing.

## Issue #13: Duplicate Polyfill Generation in C++ Target

**Status:** Open  
**Severity:** Medium  
**Found:** December 15, 2025

### Description

When multiple operators in `Lang.rgr` use `create_polyfill` with the same function name, the compiler generates duplicate function definitions in the C++ output, causing compilation errors.

### Example

The `at` operator and `substring` operator both generated `r_utf8_substr` polyfills:

```cpp
// Generated twice - causes "redefinition" error
std::string r_utf8_substr(const std::string& str, int start_i, int leng_i) { ... }
std::string r_utf8_substr(const std::string& str, int start_i, int leng_i) { ... }
```

### Current Workaround

Renamed the polyfill in `at` operator to `r_utf8_char_at` to avoid collision.

### Proposed Solution

Add a polyfill identifier/tag system to `create_polyfill`:

```ranger
; Option 1: Named polyfill with explicit ID
cpp ( 'r_utf8_substr(' (e 1) ', ' (e 2) ', 1)'
  (create_polyfill "r_utf8_substr" '...')  ; ID as first argument
)

; Option 2: Auto-detect duplicates via source hash
; Compiler computes hash of polyfill source and skips if already emitted
```

### Implementation Ideas

1. **Tag-based deduplication**: Add an optional ID parameter to `create_polyfill`. Track emitted IDs and skip duplicates.

2. **Hash-based deduplication**: Compute a hash (MD5/SHA256) of the polyfill source code. Maintain a set of emitted hashes and skip if already present.

3. **Shared polyfill registry**: Define common polyfills once in a central location and reference them by name from operators.

### Files Affected

- `compiler/Lang.rgr` - polyfill definitions
- `compiler/ng_RangerGenericClassWriter.rgr` or similar - polyfill emission logic

---

## Issue #14: Variable definition fails inside nested if blocks

**Status:** Fixed  
**Severity:** Medium  
**Found:** December 16, 2025  
**Fixed:** December 16, 2025

### Description

When defining a variable with a function call result inside a nested `if` block, the compiler reports "invalid variable definition" and type mismatch errors, even when the variable has an explicit type annotation.

### Error Message

```
ts_parser_simple.rgr Line: 1240
invalid variable definition
        def trueType:TSNode (this.parseType())
        ^-------
ts_parser_simple.rgr Line: 1241
Could not match argument types for =
        conditional.body = trueType
        ^-------
ts_parser_simple.rgr Line: 1241
Type mismatch boolean <> TSNode. Can not assign variable.
        conditional.body = trueType
        ^-------
```

### Root Cause

The parser in `ng_parser_v2.rgr` was incorrectly tokenizing identifiers that started with `true` or `false`. For example, `trueType` was being split into `true` (boolean literal) + `Type` (identifier), causing parsing errors.

The `true`/`false` keyword matching checked for the character sequence but did not verify that it was followed by a word boundary character.

### Resolution

Fixed `ng_parser_v2.rgr` to add word boundary checks when matching `true` and `false` keywords:

```ranger
; Check for 'true' keyword - but only if followed by a word boundary
def nextCharT:char (charAt s (i + 4))
if ((fc == ((ccode "t"))) && ... && ((nextCharT <= 32) || (nextCharT == 40) || (nextCharT == 41) || (nextCharT == 58) || (nextCharT == ((ccode "}"))) || ((i + 4) >= len))) {
```

This ensures `true` is only recognized as a boolean literal when followed by whitespace, parentheses, colon, brace, or end of input - not when it's part of a longer identifier like `trueType`.

### Files Changed

- `compiler/ng_parser_v2.rgr` - Added word boundary checks for `true`/`false` keyword parsing
- `compiler/ng_RangerLispParser.rgr` - Same fix for consistency

---

## Issue #15: Adding new primitive types requires changes in multiple files

**Status:** Open  
**Severity:** Medium (Technical Debt)  
**Found:** December 16, 2025

### Description

Adding a new primitive-like type (such as `buffer` for binary data) to the Ranger type system requires manual updates in many files across the compiler. This is fragile, error-prone, and creates a barrier for extending the type system.

### Example: Adding `buffer` type

When adding a `buffer` type for binary data operations, the following files needed modifications:

1. **`compiler/ng_RangerAppEnums.rgr`** - Add `Buffer` to `RangerNodeType` enum
2. **`compiler/TTypes.rgr`** - Add cases in three places:
   - `nameToValue()` - return `RangerNodeType.Buffer` for "buffer"
   - `isPrimitive()` - return `true` for `RangerNodeType.Buffer`
   - `valueAsString()` - return "buffer" for `RangerNodeType.Buffer`
3. **`compiler/ng_RangerAppWriterContext.rgr`** - Update two places:
   - `isPrimitiveType()` - add `|| (typeName == "buffer")`
   - `isDefinedType()` - add `|| (typeName == "buffer")`
4. **`compiler/ng_CodeNodeCompilerExtensions.rgr`** - Add case in `defineNodeTypeTo()`:
   ```ranger
   case "buffer" {
     node.value_type = RangerNodeType.Buffer
     node.eval_type = RangerNodeType.Buffer
     node.eval_type_name = "buffer"
   }
   ```
5. **`compiler/ng_RangerArgMatch.rgr`** - Add case in `getType()`:
   ```ranger
   case "buffer" {
     return RangerNodeType.Buffer
   }
   ```
6. **Each class writer** - Add type mapping (e.g., `ng_RangerJavaScriptClassWriter.rgr`, `ng_RangerGolangClassWriter.rgr`, etc.):
   - `getObjectTypeString()` or `getTypeString()`
   - `writeTypeDef()` switch cases
7. **`compiler/Lang.rgr`** - Add `systemclass buffer { ... }` with target mappings

### Problems

1. **Easy to miss locations** - The type must be added in 6+ files with 10+ specific locations
2. **No compiler errors** - If you miss a location, you get runtime type mismatches like "Types were 16 vs 10"
3. **Inconsistent patterns** - Different files use different approaches (`switch`, `if` chains, etc.)
4. **Hard to discover** - No documentation of all required changes

### Proposed Solution

Consider refactoring to use a centralized type registry approach:

```ranger
; Ideal: Define a type once in Lang.rgr
primitivetype buffer {
    enum Buffer              ; RangerNodeType enum value
    es6 ArrayBuffer
    go "[]byte"
    rust "Vec<u8>"
    cpp "std::vector<uint8_t>"
    java7 "byte[]"
    python bytearray
}
```

This would:

1. Automatically add the enum value
2. Automatically register in all type-checking functions
3. Automatically add to class writers
4. Single source of truth

### Workaround

Until refactored, document the full list of files that need changes when adding a new primitive type. Create a checklist in `ai/ADDING_NEW_LANGUAGE.md` or similar.

### Files That Need Updates for New Types

| File                                | Functions/Sections                                  |
| ----------------------------------- | --------------------------------------------------- |
| `ng_RangerAppEnums.rgr`             | `RangerNodeType` enum                               |
| `TTypes.rgr`                        | `nameToValue()`, `isPrimitive()`, `valueAsString()` |
| `ng_RangerAppWriterContext.rgr`     | `isPrimitiveType()`, `isDefinedType()`              |
| `ng_CodeNodeCompilerExtensions.rgr` | `defineNodeTypeTo()` switch                         |
| `ng_RangerArgMatch.rgr`             | `getType()` switch                                  |
| `ng_Ranger*ClassWriter.rgr`         | `getTypeString()`, `writeTypeDef()`                 |
| `Lang.rgr`                          | `systemclass` declaration, operators                |

### Related

- `buffer` type was added in December 2025 for PDF generation support
- Type mismatch errors appear as "Types were X vs Y" where X and Y are enum integers
