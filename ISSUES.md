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

- Go (`-l=go`) - ❌ Fails
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

| Language | Extension |
|----------|-----------|
| es6      | .js       |
| es6 + typescript | .ts |
| swift3   | .swift    |
| php      | .php      |
| csharp   | .cs       |
| java7    | .java     |
| go       | .go       |
| scala    | .scala    |
| cpp      | .cpp      |
| python   | .py       |

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

## Issue #7: Python target - super().__init__() doesn't pass constructor arguments

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


