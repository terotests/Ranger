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

---

## Issue #16: Function return value not recognized when both if/else branches return

**Status:** Open  
**Severity:** Low (warning only, code still compiles)  
**Found:** December 16, 2025

### Description

The Ranger compiler emits a warning "Function does not return any values!" when a function has return statements in both branches of an if/else block, but no return statement after the if/else.

### Example Code

```ranger
fn readUint16:int (offset:int) {
    if littleEndian {
        def low:int (buffer_get data offset)
        def high:int (buffer_get data (offset + 1))
        return ((high * 256) + low)
    } {
        def high:int (buffer_get data offset)
        def low:int (buffer_get data (offset + 1))
        return ((high * 256) + low)
    }
}
```

### Warning Message

```
JPEGMetadata.rgr Line: 88
Function does not return any values!
    fn readUint16:int (offset:int) {
       ^-------
```

### Expected Behavior

The compiler should recognize that when **all** branches of a conditional return a value, the function is guaranteed to return. No warning should be emitted.

### Current Workaround

Add a dummy return statement after the if/else block:

```ranger
fn readUint16:int (offset:int) {
    def result:int 0
    if littleEndian {
        result = (...)
    } {
        result = (...)
    }
    return result
}
```

### Root Cause

The return value analysis in the compiler doesn't perform control flow analysis to detect that all paths through the function return a value. It likely only checks for a return statement at the function's top level.

### Proposed Solution

Implement basic control flow analysis for return statements:

1. Track whether each branch of if/else has a return
2. If all branches return, consider the function as returning
3. For nested conditionals, recursively analyze branches

### Files Likely Affected

- `ng_Compiler.rgr` or similar - Function analysis phase
- Wherever "Function does not return any values" warning is generated

### Related

- This pattern is common in parsers and readers where behavior varies based on a flag (e.g., endianness)
- Code compiles correctly, only warning is incorrect

---

## Issue #58: Go slice/array pass-by-value causes data loss

**Status:** Open (Workaround documented)  
**Severity:** High  
**Found:** December 17, 2025

### Description

When compiling Ranger code to Go, functions that modify array parameters using `push`, `clear`, or resize operations don't work correctly because Go slices are passed by value. The slice header (pointer, length, capacity) is copied, so when `append()` creates a new backing array or changes length, the caller doesn't see the changes.

### Affected Patterns

1. **Output parameters with push:**

```ranger
fn fillArray:void (output:[int]) {
    push output 1
    push output 2
    push output 3
}

; Caller - output remains empty!
def arr:[int]
fillArray(arr)
```

2. **Clear and refill:**

```ranger
fn processArray:void (data:[int]) {
    clear data
    push data 42
}
```

3. **Any function that grows/shrinks an array parameter**

### Root Cause

In Go, slices are passed by value (the slice header struct is copied). When `append()` needs to grow the slice beyond its capacity, it allocates a new backing array. The caller's slice header still points to the old (unchanged) array.

JavaScript works because arrays are reference types and `push()` modifies in-place.

### Generated Go Code Example

```go
func fillArray(output []int64) {
    output = append(output, 1)  // Creates new slice, caller doesn't see it
    output = append(output, 2)
    output = append(output, 3)
}
```

### Workaround

Change functions to **return the array** instead of using output parameters:

```ranger
; Instead of this:
fn fillArray:void (output:[int]) {
    push output 1
}

; Do this:
fn fillArray:[int] () {
    def output:[int]
    push output 1
    return output
}
```

### Recommended Solution: Use `buffer` Type for Binary Data

For binary data handling (like PDF generation), use the `buffer` type which has fixed-size semantics that work correctly across all languages including Go:

```ranger
; Pre-allocate fixed-size buffer
def buf:buffer (buffer_alloc 1024)

; Write bytes at specific positions (no size change)
buffer_set buf 0 255
buffer_set buf 1 128

; Read bytes
def byte1:int (buffer_get buf 0)

; Copy data between buffers
buffer_copy destBuf 0 srcBuf 0 100
```

The `buffer` type uses:

- Go: `[]byte` with index assignment `buf[i] = byte(v)` - no `append()`
- ES6: `ArrayBuffer` with `DataView`
- Rust: `Vec<u8>` with index assignment
- etc.

For growable binary data, use a wrapper class pattern like `GrowableBuffer` that:

1. Pre-allocates chunks: `make([]byte, chunkSize)`
2. Writes to positions: `buf[pos] = byte(b)`
3. Links chunks for growth

### Why Pointer Parameters Won't Work Well

While Go supports `*[]T` pointer parameters, this approach has drawbacks:

1. Callers must pass `&arr` explicitly
2. Syntax becomes awkward: `*arr = append(*arr, item)`
3. Doesn't solve the fundamental semantic mismatch

### Files Affected

- `compiler/ng_RangerGolangClassWriter.rgr` - Go code generation
- `compiler/Lang.rgr` - `push`, `clear`, `set` operator templates for Go

### Related Issues

- Also affects `clear` operator (see Issue #59)
- Same issue exists for any mutable container passed as parameter

---

## Issue #59: Go `clear` operator sets slice to nil

**Status:** Fixed  
**Severity:** Medium  
**Found:** December 17, 2025  
**Fixed:** December 17, 2025

### Description

The `clear` operator for arrays in Go was generating `array = nil` which completely removes the slice, making subsequent `x[:0]` slice operations panic.

### Previous Go Template

```ranger
go ( (e 1) " = nil" )
```

### Problem

```go
data = nil       // data is now nil
data = data[:0]  // PANIC: cannot slice nil
```

### Fixed Go Template

```ranger
go ( (e 1) " = " (e 1) "[:0]" )
```

### Result

```go
data = data[:0]  // Keeps backing array, just sets length to 0
```

### Files Changed

- `compiler/Lang.rgr` - Line ~3420, `clear` operator Go template

---

## Issue #60: Go `buffer_read_file` uses hardcoded `/` separator

**Status:** Fixed  
**Severity:** Medium  
**Found:** December 17, 2025  
**Fixed:** December 17, 2025

### Description

The `buffer_read_file` operator in Go used string concatenation with `/` which doesn't work on Windows.

### Previous Go Template

```ranger
go ( "func() []byte { d, _ := os.ReadFile(" (e 1) " + \"/\" + " (e 2) "); return d }()" (imp "os") )
```

### Problem

On Windows with `dir=""` and `name="file.jpg"`:

- Generated: `os.ReadFile("" + "/" + "file.jpg")` → `/file.jpg`
- Expected: `file.jpg` or `.\file.jpg`

### Fixed Go Template

```ranger
go ( "func() []byte { d, _ := os.ReadFile(filepath.Join(" (e 1) ", " (e 2) ")); return d }()" (imp "os") (imp "path/filepath") )
```

### Result

Uses `filepath.Join()` which handles:

- Empty path components correctly
- Platform-specific separators
- Path normalization

### Files Changed

- `compiler/Lang.rgr` - `buffer_read_file` operator Go template

---

## Issue #61: Import paths don't work recursively

**Status:** Open - HIGH PRIORITY  
**Severity:** High  
**Found:** December 17, 2025

### Description

When importing a file from another directory using a relative path like `Import "../ts_parser/ts_parser_simple.rgr"`, the imported file's own imports fail because they use simple filenames (e.g., `Import "ts_token.rgr"`) which are searched relative to the original file's directory, not the imported file's directory.

### Error Message

```
../ts_parser/ts_parser_simple.rgr Line: 4
Could not import file ts_token.rgr
Import "ts_token.rgr"
^-------
```

### Minimal Reproduction

```
gallery/
  pdf_writer/
    main.rgr          ; Import "../ts_parser/ts_parser_simple.rgr"
  ts_parser/
    ts_parser_simple.rgr   ; Import "ts_token.rgr"
    ts_token.rgr
```

When compiling `main.rgr`, the import of `ts_parser_simple.rgr` works, but `ts_token.rgr` fails because the compiler looks for it in `pdf_writer/` instead of `ts_parser/`.

### Root Cause

In `compiler/ng_RangerFlowParser.rgr` (and `ng_FlowWork.rgr`), the `mergeImports` function uses `rootCtx.libraryPaths` to search for imports, but doesn't update the library paths based on the directory of the currently imported file. The paths are set once at compilation start and not updated for nested imports.

### Expected Behavior

When importing a file, the compiler should:

1. Resolve the import path relative to the current file
2. Add the imported file's directory to the library paths for processing that file's imports
3. Pop the path when done processing that file

### Impact

This prevents modular organization of code across directories. Currently all files must be in the same directory or explicitly added to RANGER_LIB.

### Workaround

Add all needed directories to RANGER_LIB environment variable:

```
RANGER_LIB=./compiler/Lang.rgr;./gallery/pdf_writer;./gallery/evg;./gallery/ts_parser
```

### Proposed Fix

In `ng_RangerFlowParser.rgr`, modify `mergeImports` to:

1. Extract the directory from the imported file path
2. Push it to `libraryPaths` before processing the file
3. Pop it after processing

### Files to Change

- `compiler/ng_RangerFlowParser.rgr` - `mergeImports` function
- `compiler/ng_FlowWork.rgr` - `mergeImports` function (if still used)

---

## EVG PDF Renderer Status

**Status:** Implementation In Progress  
**Date:** December 17, 2025

### Overview

Building a pipeline to convert TSX files with JSX to PDF using EVG layout engine.

### Components Created

| File                                    | Status  | Description                                      |
| --------------------------------------- | ------- | ------------------------------------------------ |
| `gallery/pdf_writer/evg_types.tsx`      | ✅ Done | TypeScript type definitions for IDE intellisense |
| `gallery/pdf_writer/sample.tsx`         | ✅ Done | Sample TSX document with JSX content             |
| `gallery/pdf_writer/JSXToEVG.rgr`       | ✅ Done | Converts JSX AST to EVG elements                 |
| `gallery/pdf_writer/EVGPDFRenderer.rgr` | ✅ Done | Renders EVG tree to PDF                          |
| `gallery/pdf_writer/evg_pdf_tool.rgr`   | ✅ Done | CLI tool for TSX to PDF                          |
| `package.json` scripts                  | ✅ Done | npm scripts for evgpdf                           |

### Blocked By

- **Issue #61**: Import paths don't work recursively
  - Cannot import from `../ts_parser/` and `../evg/` directories
  - Need to fix compiler before EVG PDF tool can compile

### Next Steps

1. Fix Issue #61 in the Ranger compiler
2. Test compilation of evg_pdf_tool.rgr
3. Run end-to-end test with sample.tsx

---

## Issue #62: Output directory (-d) and filename (-o) options ignored for -nodemodule

**Status:** Open  
**Severity:** Medium  
**Found:** December 19, 2025

### Description

When compiling with `-nodemodule` flag to create a CommonJS module, the `-d` (output directory) and `-o` (output filename) options are ignored. The output file is always written to the current working directory with the `.js` extension, regardless of the specified destination.

### Reproduction

```bash
# Expected: output to gallery/pdf_writer/bin/eval_value_module.cjs
node bin/output.js -es6 -nodemodule ./gallery/pdf_writer/eval_value_module.rgr -d=./gallery/pdf_writer/bin -o=eval_value_module.cjs

# Actual: output to ./eval_value_module.js (root directory, wrong extension)
```

### Expected Behavior

1. `-d` should set the output directory
2. `-o` should set the output filename (including extension)
3. Both should work together: `-d=./bin -o=output.cjs` → `./bin/output.cjs`

### Current Workaround

Manually move the file after compilation:

```bash
node bin/output.js -es6 -nodemodule ./file.rgr -o=file.cjs && move file.cjs target/dir/
```

### Root Cause

The `-nodemodule` code path in `VirtualCompiler.clj` likely has separate output handling that doesn't respect the `-d` and `-o` options that work for regular compilation.

### Files Affected

- `compiler/VirtualCompiler.clj` - nodemodule output path handling

### Related

- Issue #6 documents similar problems with `-d` and `-o` for regular compilation
- This issue is specific to the `-nodemodule` flag

---

## Issue #14: EVG TSX Parser - Conditional JSX expressions not supported

**Status:** Open  
**Severity:** Medium  
**Found:** December 19, 2025

### Description

The EVG component TSX parser does not properly handle conditional JSX expressions using the `&&` logical AND pattern commonly used in React/JSX for conditional rendering.

### Error Message

```
Parse error: expected ',' but got ':'
```

Or silent failures where the expression evaluates to `null`, causing downstream errors like:

```
Error: ENOENT: no such file or directory, open '...\null'
```

### Minimal Reproduction

```tsx
// This pattern is NOT supported by EVG parser
export function MyComponent({ showLabel, data }) {
  return (
    <View>
      <Image src={data.src} />
      {showLabel && data.caption && <Label>{data.caption}</Label>}
    </View>
  );
}
```

### What Happens

1. The parser encounters `{showLabel && data.caption && (...)}`
2. It fails to parse the conditional expression correctly
3. The expression may evaluate to `null` or cause parse errors
4. When used in `src` attributes, this causes file-not-found errors trying to open "null"

### Current Workaround

Avoid conditional JSX patterns. Create separate components or use unconditional rendering:

```tsx
// WORKING: No conditionals
export function PhotoGrid({ photos }) {
  return (
    <View>
      <Image src={photos[0].src} />
      <Image src={photos[1].src} />
    </View>
  );
}

// NOT WORKING: Conditional rendering
export function PhotoGrid({ photos, showCaptions }) {
  return (
    <View>
      <Image src={photos[0].src} />
      {showCaptions && <Label>{photos[0].caption}</Label>}
    </View>
  );
}
```

### Affected Patterns

The following JSX patterns are NOT supported:

1. `{condition && <Element />}` - Logical AND rendering
2. `{condition ? <ElementA /> : <ElementB />}` - Ternary rendering
3. `{array.map(item => <Element />)}` - Map rendering (likely)
4. Complex expressions in attributes: `src={condition ? pathA : pathB}`
5. Array index access: `src={photos[0].src}` - Array element property access
6. Object destructuring with defaults from arrays
7. JSDoc-style comments `/** ... */` - Cause parse warnings (use `//` instead)

### JSDoc Comment Warnings

The parser shows warnings for JSDoc-style comments:

```
Parse error: expected ',' but got ':'
Unexpected token: *
 * FullPagePhoto - Edge-to-edge photo with no borders
```

These are non-fatal warnings but clutter the output. Use single-line comments instead:

```tsx
// CAUSES WARNINGS
/**
 * MyComponent - Description here
 */
export function MyComponent() { ... }

// RECOMMENDED
// MyComponent - Description here
export function MyComponent() { ... }
```

### Expected Behavior

The parser should either:

1. Support standard JSX conditional patterns, OR
2. Provide clear error messages when unsupported patterns are used

### Workaround for Array Props

Instead of using arrays of objects:

```tsx
// NOT WORKING
interface Props {
  photos: [PhotoProps, PhotoProps];
}
function Component({ photos }) {
  return <Image src={photos[0].src} />;
}
<Component photos={[{ src: "a.jpg" }, { src: "b.jpg" }]} />;
```

Use individual props:

```tsx
// WORKING
interface Props {
  src1: string;
  src2: string;
}
function Component({ src1, src2 }) {
  return (
    <>
      <Image src={src1} />
      <Image src={src2} />
    </>
  );
}
<Component src1="a.jpg" src2="b.jpg" />;
```

### Files Affected

- `compiler/ng_parser.rgr` or related TSX parsing code
- `gallery/pdf_writer/bin/evg_component_tool.js` - compiled parser

### Related

- This affects HOC (Higher-Order Component) patterns in photo album layouts
- Components must be designed without conditional rendering for EVG compatibility
