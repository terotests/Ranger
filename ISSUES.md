# Ranger Compiler Known Issues

## Issue #1: Compiler crash with `toString` method name

**Status:** Open  
**Severity:** High  
**Found:** December 11, 2025

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

### Workaround

Rename the `toString` method to something else, like `getSymbol`, `asString`, `toStr`, etc.

```ranger
fn getSymbol:string () {
    return value
}
```

### Root Cause (Suspected)

The name `toString` is likely a reserved/special method name in JavaScript (the target language), and the compiler's method collection phase may be trying to handle it specially but encounters an uninitialized array.

### Files Affected

- Compiler source likely in `compiler/ng_LiveCompiler.clj` or related files
- The bug occurs before code analysis phase

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

**Status:** Open  
**Severity:** Medium  
**Found:** December 12, 2025

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

### Workaround

Convert integers to double before division:

```ranger
def result:double ((int2double a) / (int2double b))
```

### Root Cause

The `/` operator for integers in `Lang.clj` returns `double` conceptually, but the Go template doesn't include type conversion. The ES6 JavaScript target works correctly because JS automatically handles the conversion.

### Affected Targets

- Go (`-l=go`)
- ES6 JavaScript (`-es6`) - ✅ Works
- Other targets - Not tested

### Files to Fix

- `compiler/Lang.clj` - The `/` operator template for Go needs to cast operands to `float64`

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

**Status:** Open  
**Severity:** High  
**Found:** December 12, 2025

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

### Generated Python Code (Incorrect)

```python
class Dog(Animal):
  def __init__(self, n):
    super().__init__()  # Missing argument 'n'
    self.name = n
```

### Expected Python Code

```python
class Dog(Animal):
  def __init__(self, n):
    super().__init__(n)  # Should pass 'n' to parent
```

### Error Message

```
TypeError: Animal.__init__() missing 1 required positional argument: 'n'
```

### Workaround

None currently - inheritance with parameterized constructors doesn't work in Python target.

### Affected Tests

- `tests/compiler-python.test.ts` - "should compile and run inheritance" - **SKIPPED**

### Root Cause

The Python class writer (`compiler/ng_RangerPythonClassWriter.clj`) generates `super().__init__()` without analyzing what arguments the parent constructor requires.

### Files to Fix

- `compiler/ng_RangerPythonClassWriter.clj` - Constructor generation for inherited classes

---

## Issue #8: Python target - Variable names can shadow Python builtins

**Status:** Open  
**Severity:** Medium  
**Found:** December 12, 2025

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

### Generated Python Code

```python
def main():
  str = "Hello World"           # Shadows builtin str()
  __len = len(str)
  print("Length: " + str(__len)) # ERROR: str is now "Hello World", not str()
```

### Error Message

```
TypeError: 'str' object is not callable
```

### Workaround

Avoid using Python builtin names as variable names in Ranger source code:

- `str` → use `text`, `s`, `myStr`
- `list` → use `items`, `arr`, `myList`
- `int` → use `num`, `i`, `myInt`
- `dict` → use `map`, `data`, `myDict`
- `len` → use `length`, `size`, `cnt`
- `type` → use `kind`, `category`

### Python Builtins to Avoid

```
str, int, float, bool, list, dict, set, tuple, type, id, len,
range, print, input, open, file, map, filter, sum, min, max,
abs, round, sorted, reversed, enumerate, zip, any, all, iter, next
```

### Recommended Fix

The Python class writer should:

1. Maintain a list of Python reserved names and builtins
2. Automatically rename conflicting variables (e.g., `str` → `_str` or `str_`)
3. Or emit a warning during compilation

### Files to Fix

- `compiler/ng_RangerPythonClassWriter.clj` - Add variable name sanitization

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

The parser should be investigated to handle both LF and CRLF line endings consistently. The issue is likely in the Ranger source parser (`ng_RangerLispParser.rgr` or related files) where line ending handling affects token parsing.
