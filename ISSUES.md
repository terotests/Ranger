# Ranger Compiler Known Issues

## Summary (December 2025)

### Recently Fixed
- C++ and Rust now carry a `union` / shape family in their own representation (PLAN_SHAPES.md S5): C++ as an `mpark::variant` that holds scalar-only cases **by value** rather than behind a `shared_ptr`, Rust as a native `enum` with the same rule. Constructing a scalar case allocates nothing on either. Measured on the value-layer benchmark: C++ went from 2x to **30x** faster than the equivalent wide class, Rust from 3.5x to **6.9x** (August 2026)
- Rust: a local declared as a `union`/shape family and initialised with `new` was typed `Rc<RefCell<Rc<dyn Any>>>` — the cell was wrapped around the handle as well as the value, which rustc rejects. The local's type now stays the handle and only the constructed member takes a cell (August 2026)
- `record` with a collection field generated a constructor that could not type-check: a `[T]` / `[K:V]` field carries its element type on `array_type` / `key_type` and leaves `type_name` empty, so `buildRecordConstructor` fell through to its `string` default and `record R { def xs:[int] }` failed with "Could not match argument types for =". The generated parameter now spells the collection type (August 2026)
- `union` narrowing (`case v x:T { … }`) produced code that did not build on five of nine targets: **Rust** and **Dart** had no template for a class-typed arm at all (the program failed type analysis with "Could not match argument types for case"), **Kotlin** wrote the union's name as a type nothing declares, **Go** emitted a binding it never read (which Go rejects), and the **C++** `variant.hpp` shim declared `mpark::variant` and `mpark::get` but not the `mpark::holds_alternative` the narrowing emits. All five fixed. Rust now writes a union as `Rc<dyn Any>`, marks its members shared so they coerce into it, and narrows back through a generated `RgNarrow` trait; Kotlin and Dart map a union to `Any` / `dynamic`. `tests/union-narrowing.test.ts` runs the fixture on every target whose toolchain is present (August 2026)
- Issue #68: Rust `main:int` emitted `return <code>` into a `fn main()` that returns `()` — never compiled. Body now runs as a closure feeding `std::process::exit`, so the exit status survives (July 2026)
- Issue #67: `([] _:T a b c)` — the typed array literal *without* the parenthesised element group — silently miscompiled on every backend. Now a parse error naming the correct spelling (July 2026)
- Issue #66: Rust backend emitted a fixed-size array `[a, b, c]` for the `([] ...)` array literal where every Ranger array is a `Vec<T>` — never compiled (`expected Vec<K>, found [K; 3]`). Fixed with a `writeArrayLiteral` override emitting `vec![...]`. The C++ writer moved off C99 compound literals to `std::vector<T>{...}` at the same time (July 2026)
- Issue #65: A statement starting with a parenthesised receiver silently deleted the rest of the block (infinite loops in `game_provider.rgr`, a dropped `return` in `wasm_abi_io.rgr`) - Parser now rejects it; parse errors are fatal (July 2026)
- Issue #64: Inheritance broke when a subclass's file was imported via two different path strings (duplicate class collection) - Fixed with `RangerAppClassDesc.is_collected` guard (July 2026)
- Issue #1: `toString` method crash - Fixed with `hasOwnProperty` check
- Issue #4: Go integer division type - Fixed with `float64()` cast
- Issue #57: Go UTF-8 string handling - Fixed with rune-based operations
- Issue #58: Go slice pass-by-value - Fixed with pointer semantics
- Issue #59: Go `clear` operator - Fixed with `[:0]` slice reset
- Issue #60: Go `buffer_read_file` separator - Fixed with `filepath.Join()`
- Issue #60: Systemclass types not dynamically discovered in `isDefinedType()` - Fixed with `TTypeRegistry` and `registerLangSystemClasses()` (July 2026)

### Still Open
- Issue #76: a Ranger local named after a Go keyword (`go`, `chan`, `select`, `defer`, …) is emitted verbatim and the Go output does not parse. The `reserved_words` block in `Lang.rgr` lists two Go keywords out of 25; `gallery/vela` has been emitting unparseable Go because one of its locals is called `go` (August 2026)
- Issue #75 (partially fixed): any trailing block on a class declaration makes `EnterClass` take it for the class body. The real body is never flow-analysed, the compiler reports success, and the emitted method body is broken (`return+x1` for `return (x + 1)`). The `doc { … }` case is fixed by the detach pass; the arity check is still wrong for any other trailing token (August 2026)
- Issue #74: Rust emits `&self` for a method whose only statement is a mutating call on a field object, so the output does not compile. Statement-position calls keep a node shape the mutability analysis does not read. Reproduces without generics (August 2026)
- Issue #73: LLVM mishandles a collection nested inside a collection — `[[string]]` comes back with the inner array empty, and `[string:[string:int]]` segfaults once the inner map holds more than one entry. Reproduces without generics; same family as TARGET_NOTES #25/#26 (August 2026)
- Issue #63: `return call()` (a bare/compound method-call in return position) fails type analysis — must be written `return (call())`. Low priority; clean workaround exists (see below).
- Issue #59: System classes have hardcoded type handling (Design Issue)
- Issue #15: Adding new primitive types requires changes in multiple files (partially addressed by `TTypeRegistry`; full `primitivetype` registry not done)

### New in December 2025
- HTTP Server support added with annotation-based type aliasing
- New systemclasses: `HttpRequest`, `HttpResponse`, `SSEClient`, `HttpServer`
- Route annotations: `@(GET "/")`, `@(POST "/")`, `@(SSE "/")`
- `start server port` operator for HttpServer types

---

## Issue #64: Inheritance breaks when a subclass file is imported via two path strings

**Status:** Fixed (July 2026)
**Severity:** High (silent, misleading error; blocks legitimate module graphs)
**Targets:** all (front-end method collection)

### Description

Imports were de-duplicated by the **literal import string**, not the resolved
file. So the *same* file reached via two different path strings — e.g. a bare
`"three_scene.rgr"` found on a library path from one importer, and an explicit
`"gallery/game_engine/three/src/three_scene.rgr"` from another — was collected
**twice**. The second walk of a `class` body created a throw-away class desc and
registered the methods on it (the registry keeps the first desc via `addClass`).
A **subclass** defined in the doubly-loaded file then failed to resolve its
parent's inherited methods.

### Symptom (misleading)

The error surfaced at an *inherited* call inside the duplicated subclass, e.g.:

```
[FAIL]  function variable not found updateMatrixWorld
```

pointing at `three_perspective_camera.rgr` (`this.updateMatrixWorld()`), even
though the real cause was that the file was imported twice under two path
strings. This made it look like an inheritance/`extends` failure.

### Reproduction

```
; entry.rgr — the SAME subclass file imported via two different strings
Import "three_perspective_camera.rgr"
Import "gallery/game_engine/three/src/three_perspective_camera.rgr"
class M {
    sfn m@(main):void () {
        def c:ThreePerspectiveCamera (new ThreePerspectiveCamera)
        c.updateViewMatrix()   ; -> "function variable not found updateMatrixWorld"
        print "ok"
    }
}
```

Equivalently: importing `renderer` (relative internal imports) alongside explicit
full-path imports of the same core files double-loaded the subclasses.

### Fix

`RangerAppClassDesc.is_collected` (new flag), set true when a class body is first
walked in `WalkCollectMethods`. The class-creation path now skips re-walking a
class whose desc is already `is_collected`, so a duplicate load no longer creates
an orphan desc. System-class name collisions are unaffected (they are registered
without a body walk, so `is_collected` stays false and the user class is still
processed). Regression test: `tests/inheritance-dup-import.test.ts`.

Workaround (no longer needed, but still good hygiene): import each file via one
consistent path form so nothing is loaded twice.

---

## Issue #66: Rust array literals emitted `[T; N]` where `Vec<T>` was required (FIXED)

**Status**: Fixed July 2026
**Severity**: High for the Rust/wasm32 target — the generated code never compiled.

### Symptom

Ranger's static array literal is used like this:

```
sfn defaultOrbitKnots:[SplineKnot] () {
    def k:double 0.5522847498307936
    return ([] _:SplineKnot (
        (SplineKnot.of(1.0 0.0 0.0 k))
        (SplineKnot.of(0.0 1.0 (0.0 - k) 0.0))
    ))
}
```

The Rust backend emitted:

```rust
let mut knots : Vec<SplineKnot> = [SplineKnot::of(...), SplineKnot::of(...)];
```

`rustc` rejects it — `[...]` builds a fixed-size `[T; N]`, and every Ranger array
lowers to `Vec<T>`:

```
error[E0308]: mismatched types
  |     let knots: Vec<K> = [K::of(1_f64), K::of(2_f64)];
  |                ------   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ expected `Vec<K>`, found `[K; 2]`
```

### Cause

`RangerRustClassWriter` had no `writeArrayLiteral`, so it inherited
`RangerGenericClassWriter`'s, which hard-codes `"[" ... "]"`. The C++, Go, C#,
Java7 and PHP writers each override it; Rust was simply never given one.

Note the `templates { rust ( ... ) }` block in `Lang.rgr` is NOT the mechanism
here — `ng_LiveCompiler` dispatches `is_array_literal` nodes straight to
`langWriter.writeArrayLiteral`, so adding a template has no effect. The fix has
to be a writer override.

### Fix

`compiler/ng_RangerRustClassWriter.rgr` — added a `writeArrayLiteral` that
emits `vec![a, b, c]`.

### Verification

- Compiler bootstrapped to a byte-identical fixed point (two passes).
- Emitted Rust now compiles under `rustc --edition 2021 -O` and produces results
  identical to the equivalent `push`-based function.
- Negative control: `invaders.rgr`, `pong.rgr`, `js_parser_main.rgr` and
  `ts_parser_main.rgr` produce **byte-identical** Rust before and after, so the
  change is inert away from array-literal sites.
- `npm run engine:v2:test` → v2 ALL GREEN 107/107.

---

## Issue #67: `([] _:T a b c)` silently miscompiled (FIXED)

**Status**: Fixed July 2026
**Severity**: High — silent wrong code with no diagnostic on any backend.

The typed array literal has two valid spellings:

```
([] 1 2 3)                    ; untyped — element type inferred
([] _:SplineKnot ( a b c ))   ; typed — elements in a parenthesised GROUP
```

Omitting the group while keeping the type marker:

```
([] _:SplineKnot a b c)       ; used to compile, produced garbage
```

…was accepted by every backend. `cmdArray` only recognised the typed form when
the node had exactly three children (`[]`, `_:T`, `( … )`); anything else fell
through to the generic branch, which treats *every* child as an element. The
marker was emitted as a literal element and, counting as a second distinct
"type", degraded `eval_array_type` to Any:

| Target | Emitted |
|--------|---------|
| ES6    | `[_, a, b, c]` — `_` is undefined → `ReferenceError` at runtime |
| C++    | `r_make_vector_from_array( (r_union_Any[]) {_, a, b, c} )` — element type lost |
| Go     | `[]interface{} {_, a, b, c}` — element type lost |

### Fix

`compiler/ng_RangerFlowParser.rgr` — `cmdArray` now scans for a child carrying
both a `vref` and a `type_name` (only `name:Type` syntax sets both, and that is
never a valid element expression) and reports:

```
Array literal type marker '_:int' must be followed by a parenthesised element
group, as in ([] _:int ( a b c )). To let the element type be inferred, drop
the marker: ([] a b c).
```

Every typed literal already in the repo uses the group form, so nothing broke.

---

## Issue #66b: C++ array literals used C99 compound literals (FIXED)

**Status**: Fixed July 2026 (alongside #66)

The C++ writer built vectors as:

```cpp
r_make_vector_from_array( ( T[] ) { a, b, c } )
```

`( T[] ) { … }` is a C99 compound literal, which ISO C++ does not have. GCC and
Clang accept it as an extension — `-Wpedantic` reports *"ISO C++ forbids
compound-literals"* — and MSVC rejects it outright, so the C++ target was not
portable. The helper also copied every element twice: it built a temporary
array, then constructed the vector from that range.

Now emits `std::vector<T>{ a, b, c }`: standard, no polyfill, elements
constructed once. Braces always prefer the `initializer_list` constructor, so
the `std::vector<int>(3)` (three zeroes) vs `std::vector<int>{3}` (one element)
trap does not arise — pinned by a test.

---

## Issue #68: Rust `main:int` never compiled (FIXED)

**Status**: Fixed July 2026

`RangerRustClassWriter` emitted `fn main() {` and then walked the Ranger body
verbatim. A Ranger `main:int` ends in `return <code>`, but Rust's `fn main`
returns `()`:

```
error[E0308]: mismatched types
   |          - expected `()` because of default return type
79 |   return 0;
   |          ^ expected `()`, found integer
```

The body now runs as a closure whose value is handed to `std::process::exit`,
which is exactly what `return 0` from a C/C++ `main` means — so the exit status
reaches the shell instead of the program failing to build:

```rust
fn main() {
  let __rg_exit_code = (|| {
    …
    return 0;
  })();
  std::process::exit(__rg_exit_code as i32);
}
```

A `main:void` is emitted as before, with no wrapper.

### Tests

`tests/array-literal.test.ts` (12 checks) covers #66, #66b, #67 and #68.
Verified as a real net: 9 of the 12 fail against the pre-fix compiler. The 3
that pass either way are deliberate over-reach guards (valid spellings still
compile; `main:void` untouched; runtime element values unchanged).

---

## Issue #65: A statement starting with a parenthesised receiver silently DELETES the rest of the block

**Status:** Fixed — the parser now rejects it (July 2026)
**Severity:** **Critical** (silent wrong-code generation; no diagnostic at all)
**Found:** July 2026, while porting the v2 mesh-editor preview host
**Targets:** all (front-end parser, so every backend inherits it)

### Description

When a **statement** begins with a parenthesised receiver followed by a method
call — `(expr).method()` — the parser opened a fresh statement at `.method`, and
that statement's recursive `parse()` then absorbed **every remaining statement of
the enclosing block** as extra children. Codegen quietly discarded them.

The result: the rest of the method body disappeared from the output. No error, no
warning, and the emitted file looked perfectly normal.

```ranger
fn probe:void () {
    (this.get()).bump()
    a = 1                 ; <-- silently deleted
    b = 2                 ; <-- silently deleted
    c = 3                 ; <-- silently deleted
}
```

emitted:

```js
probe () {
  ((this).get()).bump();     // and nothing else
};
```

The dropped statements were never even analysed: an `undefinedThing = 42` placed
after the call compiled without complaint.

### Scope — where it does NOT apply

A parenthesised receiver inside an **expression** is fine and always was, because
`curr_node` is then an expression node rather than a block node:

```ranger
def q:int ((m2.bump()).value())     ; works correctly
return ((unwrap asBridge).ar(addr)) ; works correctly
```

Only *statement* position was affected.

### Real bugs this caused in this repository

Two live sites, both silently miscompiled for as long as they have existed:

1. **`gallery/game_engine/scripting/game_provider.rgr`** — all four provider
   fan-out loops (`onDeclareAll`, `beforeUpdateAll`, `afterUpdateAll`,
   `onDetachAll`) lost their `i = (i + 1)` increment:

   ```js
   onDeclareAll () {
     const i = 0;                              // never incremented
     while (i < (this.providers.length)) {
       (this.providers[i]).onDeclare();        // infinite loop
     };
   };
   ```

   Every one was an **infinite loop** whenever a provider was attached. This is
   the provider registry IDEAL.md §6 builds the capability seam on.

2. **`gallery/game_engine/scripting/wasm_abi_io.rgr`** — `writeMem` lost the
   `return` that ends its `useAs` branch, so the branch fell through instead of
   returning.

Also present, but harmless because the call was the last statement in its block:
`compiler/ng_writer.rgr` (the compiler's own source), and
`compiler/test_call.rgr`, where the swallowed statements meant the fixture was
not testing what it appeared to.

### Fix

`compiler/ng_parser_v2.rgr` — the block-node branch now rejects a statement whose
first character is `.`, reporting the file, line and source text plus the
workaround. `compiler/VirtualCompiler.rgr` treats `parser.had_error` as fatal so
no output file is written from a truncated AST (previously a parse error printed
but the compile still "succeeded" and emitted code).

The guard tests the character at the symbol start (`charAt s i`), **not** `c` —
`c` can be stale at that point, and using it rejected innocent lines such as
`if (!null? wr) {`.

Not *supporting* the syntax was a deliberate choice: it is a LISP/S-expression
grammar where the receiver would have to be re-parented into the previous
sibling, and there is a trivial, already-idiomatic workaround. Turning silent
code loss into a hard error is the valuable part; making the syntax work is
possible future work.

### Workaround (the fix the compiler now suggests)

```ranger
def recv:SomeType (the.expression())
recv.method()
```

### Verification

- Rebuilt compiler reaches a **fixed point** (it recompiles itself byte-for-byte).
- All 7 occurrences repo-wide fixed; `game_provider` now emits `let i = 0` with
  the increment restored, `writeMem` regains its `return`.
- v2 engine gate green (106/106 suites + boundary gate) on the new compiler.

---

## Issue #63: `return this.helper()` fails type analysis — parenthesize the call

**Status:** Open (low priority — clean workaround)
**Severity:** Low (footgun, not a correctness bug)
**Found:** July 2026
**Targets:** all (es6, cpp, go — identical failure; it is a front-end analysis
issue in the `[2/5] Analyzing code` phase, not codegen)

### Description

Returning the result of a **function/method call** directly in return position
fails the compiler's argument-type matching for the `return` operator. The value
must be bound to a local first, or the call wrapped so it is the *direct*
parenthesized operand of `return`.

This follows from Ranger's LISP / S-expression grammar (a call passed as an
argument needs its own parentheses), so it is arguably by-design rather than a
bug — but it is an easy mistake that produces two confusing, misleading errors
(often surfacing at an *unrelated* inherited method, e.g. a phantom
`function variable not found updateMatrixWorld`), so it is tracked here. We could
make the bare form parse/analyze later; for now, parenthesize.

### Error messages

```
[FAIL] Could not match argument types for return
[FAIL] Function does not return any values!
```

(`return` is matched as an operator; when its argument is an unresolved call the
match fails, so the flow analyser also never records a return → the second error.)

### Reproduction / boundary

```
class P {
    fn helper:int () { return (3) }

    fn bad:int  () { return this.helper() }        ; FAIL
    fn ok1:int  () { return (this.helper()) }       ; PASS — call is the direct ( ) operand
    fn bad2:int () { return (this.helper() + 0) }    ; FAIL — call nested in a compound expr
    fn bad3:int () { return o.helper() }             ; FAIL — not this-specific
    fn bad4:int () { return P.shelper() }            ; FAIL — static call too
    fn ok2:int  () { def v:int (this.helper()) return v }  ; PASS — bind to a local first
}
```

| Pattern | Result |
|---|---|
| `return this.helper()` | FAIL |
| `return (this.helper())` | PASS |
| `return (this.helper() + 0)` | FAIL |
| `return o.helper()` / `return P.sh()` | FAIL |
| `def v:int (this.helper())` … `return v` | PASS |

### Workaround (use everywhere)

- Prefer: `return (this.helper())` — wrap the call so it is the direct operand.
- If the return value is a compound expression containing a call, bind the call
  to a typed local first: `def v:int (this.helper()) return (v + 0)`.

### Where it lives

`compiler/ng_FlowWork.rgr` (~line 722, `"Could not match argument types for " + …`)
and the `return` handling above it; the missing-return error is
`compiler/TFlow.rgr:20` (`didReturnAtIndex == -1`).

---

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

Parser now normalizes CRLF, lone CR, and LF to LF in `RangerLispParser.normalizeLineEndings()` before tokenization (`compiler/ng_parser_v2.rgr`). LF-only fixtures are covered in `tests/compiler-imports.test.ts`. The CRLF-in-git workaround can be retired once all environments use the normalized parser build.

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

**Status:** Open (partially addressed)  
**Severity:** Medium (Technical Debt)  
**Found:** December 16, 2025

### Description

Adding a new primitive-like type (such as `buffer` for binary data) to the Ranger type system requires manual updates in many files across the compiler. This is fragile, error-prone, and creates a barrier for extending the type system.

**July 2026 update:** `TTypeRegistry.rgr` centralizes primitive and systemclass type lookup for `isPrimitiveType()` / `isDefinedType()`. Full single-source `primitivetype` registration (enum values, class writers, etc.) is still outstanding.

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

**Status:** Fixed  
**Severity:** High  
**Found:** December 17, 2025  
**Fixed:** July 2026

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

### Resolution

`mergeImports` and `WalkCollectMethods` in `compiler/ng_RangerFlowParser.rgr` (and `ng_FlowWork.rgr`) now push the imported file's directory onto `rootCtx.libraryPaths` while processing nested imports, then pop it afterward. Regression tests live in `tests/compiler-imports.test.ts` (`cross_dir_lexer.rgr` imports `ts_lexer.rgr`, which imports `ts_token.rgr`).

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


---

## Issue #57: UTF-8/Unicode Support Issues in Go Target

**Status:** Partially Fixed  
**Severity:** High  
**Found:** December 21, 2025  
**Branch:** topic/fix-utf8-issue

### Description

Multiple UTF-8/Unicode handling issues were discovered when compiling Ranger code to Go, particularly affecting:

1. **TSX/JS Lexer** - Non-ASCII characters (Ä, Ö, Å, ä, ö, å) not recognized as valid identifier/text characters
2. **PDF Writer** - Scandinavian characters rendered incorrectly in generated PDFs

### Root Causes and Fixes Applied

#### 1. String Operations Using Byte Index Instead of Rune Index

Go strings are UTF-8 encoded, but many string operations in the generated Go code used byte indexing instead of rune indexing.

**Affected operators in `Lang.rgr`:**

| Operator | Old (Broken) | New (Fixed) |
|----------|--------------|-------------|
| `strlen` | `len(str)` | `len([]rune(str))` |
| `at` | `string(str[i])` | `string([]rune(str)[i])` |
| `charAt` | `int64(str[i])` | `int64([]rune(str)[i])` |
| `substring` | `str[start:end]` | `string([]rune(str)[start:end])` |
| `strfromcode` | `string([]byte{byte(ch)})` | `string([]rune{rune(ch)})` |

#### 2. Lexer `isAlpha` Function Missing High-Byte Check

The TSX lexer's `isAlpha` function did not recognize Unicode characters (code > 127) as valid alphabetic characters.

**Fixed in `ts_lexer.rgr`:**
```ranger
fn isAlpha:boolean (ch:string) {
    def code:int (charAt ch 0)
    if (code > 127) { return true }  ; <-- Added this check
    ; ... rest of function
}
```

#### 3. PDF Text Encoding Issue

PDF WinAnsiEncoding requires raw bytes, but Go strings are UTF-8. Writing `string([]rune{196})` produces UTF-8 bytes `[195, 132]` instead of single byte `[196]`.

**Solution:** Use PDF octal escapes for characters 128-255:
- `Ä` (196) → `\304` (octal)
- `ä` (228) → `\344` (octal)

**Added `toOctalEscape` function and modified `escapeText` in:**
- `EVGPDFRenderer.rgr`
- `PDFWriter.rgr`

#### 4. `floor` Operator Return Type Issue

The `floor` operator was declared to return `int` but Go's `math.Floor` returns `float64`.

**Fixed in `Lang.rgr`:**
```ranger
go ( "int64(math.Floor(" (e 1) "))" (imp "math"))
```

### Remaining Issues

1. **Text alignment with TrueType fonts** - Layout calculation may not work correctly with custom TrueType fonts (works with built-in Helvetica)

2. **Other language targets** - The following targets may need similar UTF-8 fixes:
   - Swift (`swift3`, `swift6`)
   - C++ (`cpp`)
   - Rust (`rust`)
   - Java (`java7`)
   - Kotlin (`kotlin`)
   - Python (`python`)

### New Operator Added

**`rawbytechar`** - Creates a string from a raw byte value (not UTF-8 encoded):
```ranger
rawbytechar   cmdRawByteChar:string   ( code:int ) {
    templates {
        go ("string([]byte{byte(" (e 1) ")})")
        cpp ( "std::string(1, char(" (e 1) "))")
        * ( "String.fromCharCode(" (e 1) ")")
    }
}
```

### Files Changed

- `compiler/Lang.rgr` - Fixed Go templates for string operators, added `rawbytechar`
- `gallery/ts_parser/src/ts_lexer.rgr` - Added Unicode support to `isAlpha`
- `gallery/pdf_writer/src/core/EVGPDFRenderer.rgr` - Added `toOctalEscape`, fixed `escapeText`
- `gallery/pdf_writer/src/core/PDFWriter.rgr` - Added `toOctalEscape`, fixed `escapeText`

### Testing

```bash
# Compile evg_component_tool to Go
npm run evgcomp:compile:go
npm run evgcomp:build:go

# Test with scandinavian characters
cd gallery/pdf_writer
./bin/evg_component_tool.exe examples/test_scandinavian.tsx output/pdfs/test.pdf --fonts=assets/fonts --assets=assets/fonts
```

### Related Issues

- Affects all Go-compiled programs that process non-ASCII text
- PDF generation with embedded TrueType fonts and Unicode text

---

## Issue #58: Missing UTF-8 Support for Other Language Targets

**Status:** Open  
**Severity:** Medium  
**Found:** December 21, 2025

### Description

The UTF-8 fixes applied for Go target in Issue #57 need to be verified and potentially applied to other compilation targets.

### Affected Operators

The following operators use string indexing and may need UTF-8 fixes for non-Go targets:

| Operator | Description |
|----------|-------------|
| `strlen` | String length |
| `at` | Character at index |
| `charAt` | Character code at index |
| `substring` | Substring extraction |
| `strfromcode` | String from character code |
| `indexOf` | Find substring index |

### Targets to Verify

| Target | Status | Notes |
|--------|--------|-------|
| `es6` (JavaScript) | ✅ OK | JS handles Unicode natively |
| `go` | ✅ Fixed | Issue #57 |
| `swift3` | ❓ Unknown | Swift strings are Unicode-aware but syntax may differ |
| `swift6` | ❓ Unknown | Same as swift3 |
| `cpp` | ❓ Unknown | C++ std::string is byte-based, may need fixes |
| `rust` | ❓ Unknown | Rust strings are UTF-8, but indexing is byte-based |
| `java7` | ❓ Unknown | Java String is UTF-16, charAt works on code units |
| `kotlin` | ❓ Unknown | Similar to Java |
| `python` | ✅ OK | Python 3 strings are Unicode |
| `php` | ❓ Unknown | PHP strings are byte-based by default |

### Recommended Actions

1. Create test cases with Unicode strings for each target
2. Verify string operations work correctly with multi-byte characters
3. Update `Lang.rgr` templates as needed

### Test String

Use this test string containing various Unicode characters:
```
"Äiti ja Isä - Öljy - Åland - 日本語 - 中文 - €100"
```

---

## Issue #59: System Classes Have Hardcoded Type Handling

**Status:** Open  
**Severity:** Low (Design Issue)  
**Found:** December 23, 2025

### Description

The `systemclass` declarations in `Lang.rgr` provide a dynamic way to define type mappings for different target languages. However, many class writers also have **hardcoded** `case` statements for specific system types like `buffer`, `charbuffer`, etc.

This means:
1. Adding a new `systemclass` to `Lang.rgr` may not be sufficient
2. Some class writers need manual updates to handle new system types
3. The dynamic systemclass mechanism is not fully utilized

### Evidence

The `systemclass` definitions are parsed dynamically in `ng_FlowWork.rgr` (line 3076):

```ranger
if (node.isFirstVref("systemclass")) {
    ; ... parses systemclass and stores in systemNames map
    set new_class.systemNames langName.vref langClassName.vref
}
```

And used dynamically in `ng_RangerGolangClassWriter.rgr` (line 314):

```ranger
if(cc.is_system) {
    def sysName (get cc.systemNames "go")
    ; ... uses sysName for type output
}
```

But many writers also have hardcoded type handling:

**ng_RangerGolangClassWriter.rgr:**
```ranger
case "charbuffer" { wr.out("[]byte" false) }
case "buffer" { wr.out("[]byte" false) }
```

**ng_RangerJavaScriptClassWriter.rgr:**
```ranger
case "charbuffer" { wr.out("Uint8Array" false) }
case "buffer" { wr.out("Buffer" false) }
```

**ng_RangerAppWriterContext.rgr (isPrimitiveType):**
```ranger
if (typeName == "charbuffer") || (typeName == "buffer") || ...
```

### Files with Hardcoded System Types

| File | Types Hardcoded |
|------|-----------------|
| `ng_RangerGolangClassWriter.rgr` | buffer, charbuffer |
| `ng_RangerJavaScriptClassWriter.rgr` | buffer, charbuffer |
| `ng_RangerSwift6ClassWriter.rgr` | buffer, charbuffer |
| `ng_RangerRustClassWriter.rgr` | buffer |
| `ng_RangerScalaClassWriter.rgr` | buffer |
| `ng_RangerAppWriterContext.rgr` | buffer, charbuffer, int_buffer, double_buffer |
| `ng_CodeNodeCompilerExtensions.rgr` | charbuffer |
| `TTypes.rgr` | buffer, charbuffer |

### Impact on HTTP Extension

When adding new system classes like `HttpRequest`, `HttpResponse`, `SSEClient`, `HttpServer`:

1. ✅ Adding `systemclass` to `Lang.rgr` works for type resolution
2. ⚠️ The `isPrimitiveType()` check may affect type handling
3. ⚠️ Some code paths may fall through to error cases

### Recommended Actions

1. **Short-term:** Verify new system classes work with existing code paths
2. **Long-term:** Refactor class writers to use the dynamic systemclass mechanism consistently
3. **Documentation:** Document which types require hardcoded handling and why

### Test Case

When adding a new systemclass, test:
1. Variable declaration: `def req:HttpRequest`
2. Function parameter: `fn handle(req:HttpRequest)`
3. Function return type: `fn getReq:HttpRequest ()`
4. Array of type: `def requests:[HttpRequest]`
5. Dictionary value: `def cache:[string:HttpRequest]`

---

## Issue #60: Systemclass Types Not Dynamically Discovered in isDefinedType()

**Status:** Fixed (July 2026)  
**Severity:** High  
**Found:** December 23, 2025  
**Fixed:** July 6, 2026

### Description

When adding new `systemclass` definitions to `Lang.rgr`, they are not automatically recognized as valid types. The compiler produces "Unknown type" errors even though the systemclass is properly defined.

### Fix

Added `compiler/TTypeRegistry.rgr` and `registerLangSystemClasses()` in `ng_RangerFlowParser.rgr`, called from `VirtualCompiler.rgr` after parsing `Lang.rgr`. Systemclasses are registered into the root context and consulted by `isPrimitiveType()` / `isDefinedType()` in `ng_RangerAppWriterContext.rgr`, removing hardcoded HTTP type checks.

### Root Cause (historical)

The type validation in `ng_RangerAppWriterContext.rgr` uses `isDefinedType()` which has a hardcoded list of primitive types:

```ranger
fn isDefinedType:boolean (name:string) {
    ; Hardcoded primitive types
    if( (name == "double") || (name == "string") || (name == "int") || (name == "void") || (name == "char") || (name == "boolean") || (name == "charbuffer") || (name == "buffer") || (name == "int_buffer") || (name == "double_buffer") ) {
        return true
    }
    return (this.isDefinedClass(name))
}
```

The `systemclass` definitions in `Lang.rgr` are parsed by `ng_FlowWork.rgr` and added to `ctx.addClass()`, but this happens in the context of parsing `Lang.rgr` itself - NOT the root context used when compiling user code.

### Evidence

1. `buffer` systemclass works because it's hardcoded in `isDefinedType()`
2. New systemclasses like `HttpRequest` fail with "Unknown type" error
3. The systemclass parsing code in `ng_FlowWork.rgr` line 3076 correctly calls `ctx.addClass()`, but the context is local to Lang.rgr parsing

### Error Message

```
ERROR: [1053] : Unknown type HttpRequest ( ID = 11 )
ERROR: [1053] : Unknown type HttpResponse ( ID = 11 )
ERROR: [1053] : Unknown type SSEClient ( ID = 11 )
```

### Workaround Options

**Option 1: Hardcode in isDefinedType()** (Quick fix)
```ranger
if( (name == "HttpRequest") || (name == "HttpResponse") || (name == "SSEClient") || (name == "HttpServer") ) {
    return true
}
```

**Option 2: Add to definedClasses at startup** (Better)
Manually add system classes to the root context before compilation starts.

**Option 3: Fix context propagation** (Best, but complex)
Ensure systemclass definitions from Lang.rgr are propagated to the compilation context.

### Recommended Solution

The cleanest long-term solution is to:

1. After parsing `Lang.rgr`, collect all systemclass definitions
2. Before compiling user code, inject these definitions into the root context
3. This would make all systemclasses automatically available

### Related Issues

- Issue #59: Systemclass Handling Not Dynamic (covers hardcoded writer behavior)

### Files Affected

- `ng_RangerAppWriterContext.rgr` - `isDefinedType()` function
- `ng_FlowWork.rgr` - systemclass parsing
- `Lang.rgr` - systemclass definitions

---

## Issue #61: HTTP Server Implementation - Design Notes

**Status:** Implemented (Design Documentation)  
**Severity:** N/A (Feature)  
**Found:** December 23, 2025

### Description

Documentation of the HTTP server implementation approach using annotation-based type aliasing.

### Key Design Decisions

#### 1. Annotation-Based Type Aliasing

Instead of using inheritance (`Extends(HttpServer)`), we use annotations to mark classes as specific systemclass types:

```ranger
; Class annotation marks it as HttpServer type
class MyServer@(HttpServer) {
    fn handleIndex@(GET "/"):void (req:HttpRequest res:HttpResponse) { }
}
```

**Why annotations instead of inheritance:**
- Systemclasses don't support inheritance in the traditional sense
- Annotations are more flexible and don't require class hierarchy
- Type matching can check annotations via `isSystemclassType()`

#### 2. Route Annotation Sibling Syntax

Route annotations store the HTTP method and path as **siblings** in the AST:

```ranger
; @(GET "/path") - GET and "/path" are siblings, not parent-child
fn handleIndex@(GET "/"):void (req:HttpRequest res:HttpResponse) { }
```

**Implementation insight:**
- Use `getFlagSiblingString("GET", "/")` to extract the path
- NOT `getFlag("GET").children[0]` - this is wrong!

#### 3. Custom Operator with Type Checking

The `start` operator uses `(custom _)` template and checks for `@(HttpServer)` annotation:

```ranger
; In Lang.rgr
start cmdStart:void (server:HttpServer port:int) {
    templates {
        go (custom _)
        es6 (custom _)
    }
}
```

**In Go writer CustomOperator:**
```ranger
if (cmd == "start") {
    def serverVar (node.getSecond())
    def serverClass (ctx.findClass(serverVar.value_type))
    if (!null? serverClass) && (serverClass.isSystemclassType("HttpServer")) {
        ; Generate HTTP server code
    }
}
```

#### 4. Type Matching Enhancement

Added systemclass annotation check in `areEqualTypes()`:

```ranger
; In ng_RangerArgMatch.rgr
fn areEqualTypes:boolean (type1 type2) {
    ; ... existing checks ...
    
    ; NEW: Check if type2's class has systemclass annotation matching type1
    def type2Class (ctx.findClass(type2Name))
    if (!null? type2Class) {
        if (type2Class.isSystemclassType(type1Name)) {
            return true
        }
    }
}
```

### Files Modified

| File | Changes |
|------|---------|
| `Lang.rgr` | Added HTTP systemclasses and operators |
| `ng_RangerAppWriterContext.rgr` | Added HTTP types to `isDefinedType()` |
| `ng_RangerAppClassDesc.rgr` | Added `getSystemclassType()`, `isSystemclassType()` |
| `ng_RangerArgMatch.rgr` | Added systemclass annotation check in `areEqualTypes()` |
| `ng_CodeNode.rgr` | Added `getFlagSiblingString()` helper |
| `ng_RangerGolangClassWriter.rgr` | Added CustomOperator handling for `start` |
| `ng_RangerGolangHttpServerWriter.rgr` | New file for HTTP server code generation |

### Test File

Working example: `tests/fixtures/http_server.rgr`

```bash
# Compile to Go
RANGER_LIB=./compiler/Lang.rgr node bin/output.js -l=go ./tests/fixtures/http_server.rgr -d=./tests/fixtures/bin -o=http_server.go -nodecli

# Run server
cd tests/fixtures/bin && go run http_server.go

# Test endpoints
curl http://localhost:3000/
curl http://localhost:3000/content
```

### Remaining Work

1. **ES6 target**: HTTP server not yet implemented for JavaScript/Node.js
2. **SSE testing**: Full SSE loop testing needed
3. **Path parameters**: `@(GET "/users/:id")` not yet implemented
4. **Stop operator**: Server shutdown not fully implemented
5. **Watch mode**: File watching for live preview

---

---

## Issue #69: `if!` re-parses its block as Ranger after it was written as the target

`if!` is a `@macro(true)` operator whose template is
`'if (false == (' (e 1) ' ) ) { ' (block 2) ' } '`. The macro's text is parsed
again as Ranger, but `(block 2)` has already been written in the TARGET
language, so the re-parse sees target syntax. It only compiles when the block's
generated form happens to also be valid Ranger — a lone `def` survives, an
assignment or a `print` does not.

### Reproduction

```ranger
class T {
    fn a:void () {
        def flag:boolean false
        if! flag {
            print "x"
        }
    }
    sfn main:void () { print "ok" }
}
```

```
[FAIL] WriteVREF -> Undefined variable console in class T node : ((console.log ("x")))
     1 │ if (false == (flag ) ) {
     2 │ console.log("x");
```

`more = false` inside the block fails the same way with
`WriteVREF -> Undefined variable false`, which is the re-parse reading the
macro's own `false` as a name.

### Workaround

Use the prefix `!` instead — `if (! flag) { … }` compiles and behaves the same.

### Status

Open. `if!` is used in only two places in the repository
(`compiler/ng_RangerFlowParser.rgr:282`, and a commented-out line in
`ng_LiveCompiler.rgr`), both with blocks small enough to survive the re-parse,
which is why it has not surfaced before. Found while writing `gallery/vela`,
which uses the workaround throughout.

## Issue #70: The S-expression parser recurses per group and never unwinds, so a large file exhausts the stack

`RangerLispParser.parseBuf` calls itself whenever it opens a node — `(`, `{`, or
the start of an expression — and when that node CLOSES it pops `this.parents`
and rebinds `this.curr_node` **without returning**. The frame stays live and its
`while` loop keeps parsing the rest of the buffer. Only two node kinds
(`value_type` 22 and 24) take the early `return` at the top of the loop.

So parse depth is not the source's nesting depth. It accumulates across the
file, and a big enough file runs V8 out of stack:

```
RangeError: Maximum call stack size exceeded
    at RangerLispParser.parseBuf (bin/output.js:6482)
    at RangerLispParser.parseBuf (bin/output.js:6577)
    at RangerLispParser.parseBuf (bin/output.js:6787)
    ... 2000+ frames
```

### Measured depth

Instrumenting `parseBuf` with a depth counter, compiling to es6:

| Source | Lines | Max parse depth |
| --- | --- | --- |
| anything small (baseline: Lang.rgr + stdops.rgr) | — | 70 |
| 3000 sequential `(t + 1)` groups | 3000 | 70 |
| 40 levels of literal nesting | 1 | 70 |
| a 2000-element `([] _:int ( … ))` literal | 1 | 70 |
| `BigIntNum.rgr` / `DateTime.rgr` | 805 / 604 | 70 |
| `Regex.rgr` | 2,260 | 173 |
| `EvHandle.rgr` | 2,985 | 245 |
| **`ComponentEngine.rgr`** | **45,221** | **2,117** |

Note what does NOT drive it: statement count, literal nesting, array literals
and file size on their own all stay at the 70 baseline. The depth appears where
groups nest inside function bodies, and it is roughly proportional to how much
of that a file contains.

### Consequence: compiling the JS engine is FLAKY today

At depth 2,117 `ComponentEngine.rgr` sits right at the edge of V8's default
stack. Compiling `bench_main.rgr` (engine only, no test corpus) five times in a
row on the same machine:

```
FAIL OK OK FAIL OK        →  2 failures in 5
```

The failure surfaces as `[FAIL] Unexpected compiler error / RangeError: Maximum
call stack size exceeded`, which reads like a compiler bug in the program being
compiled and is not obviously a stack issue. Any target, any run. That makes
`npm run test:tsengine` and every `selfhost:*` script intermittently red for a
reason that has nothing to do with the code being compiled.

### Workaround

Pass a bigger stack to node:

```bash
node --stack-size=60000 bin/output.js …
```

`tests/es-conformance-targets.test.ts` does this. The `selfhost:*` and
`test:tsengine` paths do not yet.

### Cause

Not the recursion itself — the frames not being released. Dumping `this.parents`
at maximum depth on `EvHandle.rgr`: **call depth 245 with 12 nodes actually
open**. So 233 frames were live for nodes that had already closed.

Three sites recurse, each pushing a node onto `parents` first. A literal `)` or
`}` ends its frame with `break`, but the third site — an implicit statement
expression inside a block, `ng_parser_v2.rgr:1054` — is closed by
`end_expression`, which pops `parents` and **does not break**. That frame then
parses the rest of the enclosing block, and the next statement recurses again on
top of it.

### Fix

`parseBuf` records `array_length parents` on entry and returns as soon as the
list is shorter than that — the node this frame was parsing is gone, so the
frame is done. Four lines in `compiler/ng_parser_v2.rgr`.

Depth after the fix:

| Source | Before | After |
| --- | --- | --- |
| `EvHandle.rgr` | 245 | **36** |
| `ComponentEngine.rgr` | 2,117 | **36** |
| `ComponentEngine.rgr` + the 2,138-probe corpus | 2,117 | **36** |

Depth is now bounded by real nesting and no longer grows with the file.

### Verification

- **Self-host fixpoint**: the rebuilt compiler compiles itself, and the second
  generation is byte-identical to the first.
- **Codegen unchanged**: the 2.1 MB of JavaScript the compiler emits for
  `bench_main.rgr` (the whole JS engine) is byte-identical before and after.
- **Semantics unchanged**: the 2,138-probe ES conformance corpus gives the same
  answers — 2,136 agreeing with Node, the same 2 known gaps.
- **The flake is gone**: `bench_main.rgr` compiled 8 times in a row at the
  DEFAULT stack, 8 successes (was 3 of 5).
- `tests/native/core_vectors.rgr` still byte-identical on es6, python, go, cpp
  and rust.

### Status

Fixed. Found while adding `tests/es-conformance-targets.test.ts`, and initially
misattributed to that suite's 2,138-probe corpus — which in fact parses at depth
70. The corpus only made an existing marginal condition reproducible.

## Issue #76: A Ranger local named after a Go keyword emits Go that does not parse

**Status:** open. Found while measuring formatter output for
[`PLAN_FORMAT.md`](PLAN_FORMAT.md).

### Reproduction

```ranger
class T {
  fn run:int () {
    def go:boolean true
    def n:int 0
    while go {
      n = (n + 1)
      if (n > 2) {
        go = false
      }
    }
    return n
  }
}
sfn main:void () {
  def t:T (new T())
  print ("" + (t.run()))
}
```

The compiler reports `[OK] Compilation successful!` and writes

```go
var go bool= true;
for go {
```

which is not Go. `gofmt` exits 2 on it:

```
k.go:21:7: expected 'IDENT', found 'go'
k.go:23:7: expected operand, found 'go'
```

Rust, C# and Kotlin compile the same source without complaint — they rename the
identifier.

### Cause

The per-target `reserved_words` block in `compiler/Lang.rgr` has **two** entries
for Go:

```ranger
go {
    type _type
    range _range
}
```

Go has 25 keywords. `func` and `map` happen to be covered by the shared `*`
block, which leaves `go`, `var`, `chan`, `select`, `defer`, `package`, `import`,
`interface`, `struct`, `switch`, `case`, `default`, `fallthrough`, `goto`,
`const`, `else`, `for`, `if`, `return` and `continue` unmapped. Most of those
would be unusual variable names; `go`, `map`, `type`, `range`, `select`, `chan`
and `defer` are not — `go` is an ordinary loop flag, and it is what
`gallery/vela/src/VlJson.rgr:636` calls one.

### Effect

`gallery/vela/src/VlChart.rgr` compiled to Go has not parsed for as long as that
local has existed. Nothing caught it because the Go path is only exercised by
programs that avoid the name, and the compiler itself reports success — the
failure is in a file nobody compiles.

### Fix

Complete the Go entry in the `reserved_words` block. It is a data change, not a
code change. It alters emitted identifiers for any program that uses one of the
names, so it wants the conformance suite and a golden review, which is why
[`PLAN_FORMAT.md`](PLAN_FORMAT.md) lists it as phase 0 rather than folding it
into the formatting work.

The same audit is worth doing for every target: the Go list being 2 entries long
suggests the others were filled in as errors were hit rather than from the
language's keyword list. The `swift3` block has 4 entries (`operator`, `static`,
`init`, `guard`) and Swift has far more keywords than that.

## Issue #75: A trailing block on a `class` is taken for the class body, so the real body is never analysed

**Status:** partially fixed. The `doc { … }` case is gone: `DetachDocBlocks`
(`compiler/ng_RangerFlowParser.rgr`) removes a documentation tail from the
declaration node before `CollectMethods`, so `EnterClass` counts the children it
counted before the feature existed. `tests/api-docs.test.ts` compiles and runs
the reproduction. The underlying arity check is still wrong for any OTHER
trailing token, which is what the Fix section below describes; that part is
open.

### Reproduction

```ranger
class Sample {
  fn foo:int ( x:int ) {
    return (x + 1)
  }
} doc { public }

sfn main:void () {
  def s:Sample (new Sample())
  print ("" + (s.foo(1)))
}
```

The compiler reports `[OK] Compilation successful!` and writes JavaScript that is not
valid JavaScript:

```javascript
foo (x) {
    return+x1
}
```

A `record` in the same shape, with a method, fails compilation outright instead.

### Cause

The parser ends an expression at a newline when the parent is a block node
(`compiler/ng_RangerLispParser.rgr:64`, `skip_space`), so `} doc { … }` on the closing
line stays inside the `class` expression and adds two more children to it.

`EnterClass` (`compiler/ng_RangerFlowParser.rgr:2891`) then takes the class body as the
**last** child:

```ranger
def body_index ( (node.chlen())  - 1)
```

and accepts a 5-child node, because `class Child extends Base { }` is 5 children. With a
trailing block the count is also 5, `body_index` lands on the trailing block, and the real
body — child 2 — is never walked. Nothing else reports it: the methods were already
collected by `WalkCollectMethods`, so the class and its method exist; only the flow pass
that repairs infix operators and type-checks the body was skipped. `return (x + 1)` is
written out with the operator un-repaired.

Any trailing token sequence produces it, not just `doc`. The 5-child branch was written
for one specific shape and never checked that the extra children are that shape.

### Fix

`body_index` must not be `chlen() - 1`. The class body is the last child **of the
declaration**, which is child 2 in the 3-child form and child 4 in the `extends` form —
so the branch that accepts 5 children should assert that children 2 and 3 are `extends`
and a name, and take child 4 only then. Anything else is a malformed declaration and
should be the error the 3-child path already gives.

PLAN_API_DOCS.md §5.1 proposes a pass that strips a trailing `doc { … }` from every
declaration before `CollectMethods`, which removes this shape for the documented case.
It does not remove the bug: the arity check is still wrong for any other trailing token,
and it should be fixed on its own.

## Issue #74: Rust writes `&self` for a method whose only job is to mutate a field object

**Status:** open. Reproduces with no generic class in the program.

### Reproduction

```ranger
class SlotI {
    def held:[int]
    fn put:void (v:int) {
        clear held
        push held v
    }
}
class HolderI {
    def slot:SlotI (new SlotI ())
    fn keep:void (v:int) {
        slot.put(v)
    }
}
```

`rustc` rejects the output:

```
error[E0596]: cannot borrow `self.slot` as mutable, as it is behind a `&` reference
    self.slot.put(v);
```

`fn keep` is emitted `&self`. Writing it `this.slot.put(v)` makes no difference.

### Cause

`fnBodyDirectlyMutatesThis` recognises a mutating call on a field, but only in
the shape the front end produces for a call in VALUE position. `return
(slot.get())` is desugared to `(call slot get ())` — three children, receiver
at index 1 — and the check reads exactly that. A call in STATEMENT position is
left as `(slot.put (v))`: two children, the whole dotted path in the first.
That shape never reaches the member-call branch, so a method that mutates a
field object *and does nothing else* is analysed as non-mutating.

Traced with a print at the top of `fnBodyDirectlyMutatesThis`: it visits
`(slot.put (v))`, and the `node.has_call` branch below never fires for it.

### Fix

Recognise the statement-position shape as well. The two guards the desugared
branch applies — a collection target only counts for a mutating operator, and a
cell-wrapped or Rc field does not count at all — both read the RECEIVER node,
which the statement shape does not hand over, so they have to be re-expressed
over the field's `RangerAppParamDesc` instead. Not attempted here: this decides
`&self` vs `&mut self` for every method on the target, and getting it wrong in
the other direction produces E0499 double borrows rather than a clean error.

### Where it shows

`tests/conformance/generic_class_kernel/` has this shape (`Holder@(T)` holding
a `Slot@(T)`), because one generic class holding another at its own type
parameter is what `Transaction<Op>` inside `History<Op>` needs. It runs on
thirteen targets; the Rust RUN is skipped with a pointer here, and Rust codegen
is still asserted.

## Issue #73: LLVM mishandles a collection nested inside a collection

**Status:** open. Reproduces with no generic class anywhere in the program, so
this is a Low IR ownership defect and not part of the generics work — it is
written down here because the generics conformance case is what surfaced it.

### Reproduction

```ranger
class A {
    def rows:[[string]]
    fn addRow:void (r:[string]) {
        push rows r
    }
    fn lastRow:[string] () {
        def v:[string] (last rows)
        return v
    }
}
```

Push one `["x" "y"]` and read it back:

| target | output |
| --- | --- |
| es6, go, python, php, cpp, rust | `rows 1 x,y` |
| **llvm** | `rows 1  ,` — the row survives, its elements do not |

`tests/conformance/generic_class/program.rgr` instantiates a generic class at
`[string]` and hits the same thing (`rows: 2 @>` instead of `rows: 2 z`), which
is why `tests/compiler-generics.test.ts` compares every line but that one on
LLVM and says so in a comment.

### The map form is worse: it crashes, and only past one entry

```ranger
class Rows {
    def byId:[string:[string:int]]
    def ids:[string]
    fn put:void (id:string v:[string:int]) {
        set byId id v
        push ids id
    }
    fn take:[string:int] (id:string) {
        def v:[string:int] (unwrap (get byId id))
        return v
    }
}
```

Put a `[string:int]` with **one** entry into it and read it back: correct on
every target, LLVM included. Put one with **two** entries in: LLVM segfaults,
every other target is fine. One entry surviving and two not is what an
under-retained buffer looks like — the inner map's storage is freed at the end
of the scope that built it, and the outer map is left pointing at it; with one
entry the read happens to land inside memory that has not been reused yet.

No generic class appears anywhere in that program, which is why
`tests/conformance/generic_class_kernel/` asserts LLVM CODEGEN and skips the
LLVM run.

### Cause (not yet confirmed)

Same family as TARGET_NOTES #25 and #26: a collection whose element type is
itself a collection reaches the Low IR builder as a descriptor with no retain,
so the outer array holds a pointer into memory that has already been released.
`smapValueOwnKind` answering 0 for a nested value type is the shape of the two
recorded map defects, and the array path looks like a third.

### Fix

Not attempted here. The element-kind classification has to be recursive on the
Low IR side, the same way the C# and Dart writers had to be given a recursive
type spelling.

## Issue #71: `tryDesugarNewMethodChain` exists only as hand-written JavaScript, so every self-hosted compiler is missing it

`npm run compile` does not finish at the compiler. It ends with

```
node bin/output.js … -o=output.js && npm run compile:fixcrlf
  && node scripts/patch-chain-desugar.js && npm run compile:copylibs
```

and that patch step **replaces a method body in the freshly built compiler** with
about 45 lines of hand-written JavaScript kept in `scripts/patch-chain-desugar.js`.

The script's header says the bootstrap compiler "cannot emit
tryDesugarNewMethodChain from .rgr yet". That is not what is happening. The
Ranger source, `compiler/ng_CodeNodeCompilerExtensions.rgr:402`, is:

```ranger
  fn tryDesugarNewMethodChain:boolean () {
    return false
  }
```

There is nothing to emit. **The only implementation of the feature is the
JavaScript in the patch script.** The `.rgr` is a permanent stub that compiles
to exactly the `return false` the patcher then looks for and overwrites.

### What this costs

The patch is applied in exactly two places in `package.json`:

- `compile` → `bin/output.js`
- `build:dist:module` → `dist/api.js`

Every other build gets the stub. In particular **none of the `selfhost:*`
scripts patch anything**, so the C++, Dart, Python, C#, Go and Kotlin
self-hosted compilers all have `tryDesugarNewMethodChain` returning `false`.

It is not a silent degradation — it is a **hard compile error**. Building an
unpatched compiler (exactly what `selfhost:*` produces) and giving it the
repository's own chaining fixture:

```
$ node tmp/unpatched.js -es6 tests/fixtures/chain_new_method.rgr
  [FAIL] WriteVREF -> Undefined variable .hello in class ChainNewMethod
    13 │         new Greeter().hello().world()
```

The patched compiler compiles the same file and prints `hello` / `world`.

Five of the six chaining fixtures fail on an unpatched compiler:

| Fixture | Unpatched |
| --- | --- |
| `chain_new_method` | FAILS |
| `chain_fluent_builder` | FAILS |
| `chain_local_var` | FAILS |
| `chain_polymorphic_add` | FAILS |
| `chain_return_int` | FAILS |
| `chain_operator_substring` | compiles (operator chaining is a different path) |

So **a self-hosted Ranger compiler cannot compile a Ranger program that uses
method chaining at all**. The self-hosting claim in `TARGET_NOTES.md` holds for
the compiler reproducing its own output byte for byte; it does not hold for the
language the resulting compiler accepts.

The feature is not dead code either — `PLAN_METHOD_CHAINING.md` records phase 1
(codegen) as delivered, and `tests/compiler-chain.test.ts` plus
`tests/compiler-chain-kotlin-swift.test.ts` gate it with ten fixtures.

It is also a trap for anyone rebuilding the compiler. Compiling
`ng_Compiler.rgr` and copying the result over `bin/output.js` — the obvious
thing to do — removes a language feature, and the resulting compiler then
rejects code the previous one accepted.

### Fix

Written in Ranger, in the stub's place. It is ordinary `CodeNode` manipulation —
`copy`, `children`, `add`, `newVRefNode`, `getChildrenFrom` — and needed no
construct the language lacks; the "cannot emit it yet" note was never the
reason. `scripts/patch-chain-desugar.js` is deleted and the patch step is gone
from `compile` and `build:dist:module`.

### Verification

- The Ranger version produces **byte-identical generated code** to the
  JavaScript patch on all six `chain_*.rgr` fixtures, and identical program
  output (`hello`/`world`, `6`, `30`, `3`/`Hello`, `6`, `ello`).
- All six fixtures compile on a compiler built with **no patch step at all**.
  Five of them could not be compiled before.
- Chaining now works on every target, not just es6: `chain_new_method` compiles
  for go, cpp, rust, python, kotlin, csharp, dart and swift6, and prints
  `hello world` on go, cpp and python.
- Self-host fixpoint over **three** generations with no patch anywhere:
  gen2 == gen1 and gen3 == gen2, byte for byte.
- Unchanged elsewhere: the engine's seven benchmark answers on es6 and on Go,
  the 2138-probe ES conformance corpus (2136 agreeing with Node, same 2 known
  gaps), `core_vectors` byte-identical on five targets, and the engine still
  writes for go/kotlin/csharp/dart/swift6/python.

### Status

Fixed. Surfaced while rebuilding the compiler for Issue #70: the rebuild had to
re-apply the patch by hand to avoid regressing, which is what drew attention to
what the patch actually contained.

---

## Issue #72: Kotlin wrote a `final` class for `class Child extends Base`, so its own subclass would not compile

Kotlin classes and methods are final unless they say `open`. The Kotlin writer
knows that — it emits `open class` when `RangerAppClassDesc.is_extended_by_children`
is set, and `open fun` on the same test — but that flag was only ever set for
**two of the three** ways Ranger spells inheritance.

### Reproduction

Twelve lines, any target flag `-l=kotlin`:

```ranger
class Base {
    def n:int 0
    Constructor () {
    }
    fn hello:string () {
        return "base"
    }
}

class Child extends Base {
    Constructor () {
    }
}
```

Before the fix, the generated Kotlin was:

```kotlin
class Base( )            // ← final
 {
  fun  hello() : String { … }   // ← final
}

class Child( ) : Base()
```

…which `kotlinc` rejects: `this type is final, so it cannot be extended`.

Writing the same inheritance as `Extends(Base)` **inside** the class body
produced `open class Base` and compiled. So did `extends Base` as a body
statement. Only the class-header form was wrong, which is why this survived so
long: the compiler's own sources and the `@process` runtime use the other forms,
and the JavaScript/TypeScript/Go/Python targets do not care either way.

### Cause

`ng_RangerFlowParser.rgr`. The two body forms go through `markParentClass`,
which sets `is_inherited`, sets `is_extended_by_children`, and records the child
in `child_classes`. The header form is collected separately into the
`extendedClasses` map and re-applied in `CollectMethods`, which set only
`is_inherited` — so any target that asks "is anything derived from this class?"
was told no.

### Fix

`CollectMethods` now marks the parent the same way `markParentClass` does:

```ranger
ch.addParentClass(item)
parent.is_inherited = true
parent.is_extended_by_children = true
push parent.child_classes index
```

### What it was blocking

`gallery/pptx` on Kotlin. The PPTX viewer has exactly one subclass —
`class PptxToolbar extends EVGToolbar` — and it produced **one** `kotlinc` error
in 66,082 generated lines. Everything else in the viewer (the ZIP reader, the
OOXML parser, the theme resolver, the JPEG/PNG decoders, the TrueType reader,
the EVG layout engine) compiled clean on the first attempt.

### Verification

- The twelve-line fixture above now writes `open class Base` and `open fun hello`.
- `gallery/pptx/android/ranger/pptx_android.rgr` → Kotlin → `kotlinc`: **zero
  errors**, and the compiled viewer opens real `.pptx` fixtures on a JVM
  (`npm run pptx:android:verify`).
- Compiler self-host fixpoint held: rebuilding `bin/output.js` twice from the
  patched sources produced byte-identical output.

### Status

Fixed (August 2026).
