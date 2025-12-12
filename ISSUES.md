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
