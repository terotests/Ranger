# Ranger Compiler Known Issues

## Summary (December 2025)

### Recently Fixed
- Issue #91 (fixed): `on_keypress` was unusable in two ways at once. Its emitted handler took parameters named `str` and `key`, so a Ranger variable called `key` -- the obvious name -- was SHADOWED: the block received the host runtime's key OBJECT instead of the string, and the handler's assignment landed on its own parameter. Name the variable anything else and the other half bit: the compiler emits `const` for a local nothing in the SOURCE assigns, so the first keypress died with `TypeError: Assignment to constant variable`, at runtime, in raw mode, with the screen already cleared. Fixed by prefixing the handler's parameters and declaring `keyvar@(mutates)`. `gallery/invaders` had been relying on the broken behaviour and is corrected. Gated by `tests/codegen-keypress.test.ts` (September 2026)
- Issue #88 (fixed): `join` emitted `strings.Join(...)` on Go without declaring the `strings` import, so a program whose ONLY use of that package was `join` compiled to Go that did not build (`undefined: strings`). Seventeen other Go templates reaching into that package declare it, so the defect was invisible in any program that also called one of them. Gated by `tests/fixtures/join_strings.rgr`, in which `join` is the sole user of the package (September 2026)
- Issue #83 (fixed): the PHP writer turned a `$` inside a string literal into `\"`, so `"literal $HOME stays"` came out as `"literal \"HOME stays"` — a parse error, and not the escape that was intended either. One character in `EncodeString`: the `case 36` arm emitted `(strfromcode 34)`, copied from the `case 34` arm above it. Any Ranger program carrying a shell fragment, a template, a currency amount or a regular expression through a string literal built PHP that does not parse. Gated by `tests/codegen-php.test.ts` (September 2026)
- C++ and Rust now carry a `union` / shape family in their own representation (PLAN_SHAPES.md S5): C++ as an `mpark::variant` that holds scalar-only cases **by value** rather than behind a `shared_ptr`, Rust as a native `enum` with the same rule. Constructing a scalar case allocates nothing on either. Measured on the value-layer benchmark: C++ went from 2x to **30x** faster than the equivalent wide class, Rust from 3.5x to **6.9x** (August 2026)
- Rust: a local declared as a `union`/shape family and initialised with `new` was typed `Rc<RefCell<Rc<dyn Any>>>` — the cell was wrapped around the handle as well as the value, which rustc rejects. The local's type now stays the handle and only the constructed member takes a cell (August 2026)
- `record` with a collection field generated a constructor that could not type-check: a `[T]` / `[K:V]` field carries its element type on `array_type` / `key_type` and leaves `type_name` empty, so `buildRecordConstructor` fell through to its `string` default and `record R { def xs:[int] }` failed with "Could not match argument types for =". The generated parameter now spells the collection type (August 2026)
- `union` narrowing (`case v x:T { … }`) produced code that did not build on five of nine targets: **Rust** and **Dart** had no template for a class-typed arm at all (the program failed type analysis with "Could not match argument types for case"), **Kotlin** wrote the union's name as a type nothing declares, **Go** emitted a binding it never read (which Go rejects), and the **C++** `variant.hpp` shim declared `mpark::variant` and `mpark::get` but not the `mpark::holds_alternative` the narrowing emits. All five fixed. Rust now writes a union as `Rc<dyn Any>`, marks its members shared so they coerce into it, and narrows back through a generated `RgNarrow` trait; Kotlin and Dart map a union to `Any` / `dynamic`. `tests/union-narrowing.test.ts` runs the fixture on every target whose toolchain is present (August 2026)
- Issue #68: Rust `main:int` emitted `return <code>` into a `fn main()` that returns `()` — never compiled. Body now runs as a closure feeding `std::process::exit`, so the exit status survives (July 2026)
- Issue #67: `([] _:T a b c)` — the typed array literal *without* the parenthesised element group — silently miscompiled on every backend. Now a parse error naming the correct spelling (July 2026)
- Issue #66: Rust backend emitted a fixed-size array `[a, b, c]` for the `([] ...)` array literal where every Ranger array is a `Vec<T>` — never compiled (`expected Vec<K>, found [K; 3]`). Fixed with a `writeArrayLiteral` override emitting `vec![...]`. The C++ writer moved off C99 compound literals to `std::vector<T>{...}` at the same time (July 2026)
- Issue #76: `recv.call(args).field = value` compiled and SILENTLY DROPPED the assignment — the call was emitted, the store was not - Parser now rejects it with the fix in the message (September 2026)
- Issue #65: A statement starting with a parenthesised receiver silently deleted the rest of the block (infinite loops in `game_provider.rgr`, a dropped `return` in `wasm_abi_io.rgr`) - Parser now rejects it; parse errors are fatal (July 2026)
- Issue #64: Inheritance broke when a subclass's file was imported via two different path strings (duplicate class collection) - Fixed with `RangerAppClassDesc.is_collected` guard (July 2026)
- Issue #1: `toString` method crash - Fixed with `hasOwnProperty` check
- Issue #4: Go integer division type - Fixed with `float64()` cast
- Issue #57: Go UTF-8 string handling - Fixed with rune-based operations
- Issue #58: Go slice pass-by-value - Fixed with pointer semantics
- Issue #59: Go `clear` operator - Fixed with `[:0]` slice reset
- Issue #60: Go `buffer_read_file` separator - Fixed with `filepath.Join()`
- Issue #60: Systemclass types not dynamically discovered in `isDefinedType()` - Fixed with `TTypeRegistry` and `registerLangSystemClasses()` (July 2026)
- Issue #76 (fixed): a Ranger name that is a keyword of the target was emitted verbatim and the file did not parse. Not a Go defect but a family of them: **JavaScript was worst at 41 of 46 keywords and had no `reserved_words` block at all**, C++ had 25 missing behind 56 existing entries, Go 20 of 25, Rust 2. Found by `scripts/reserved_probe.py`, which asks each target's own parser about every keyword; Dart, Kotlin, Swift and C# report UNCHECKED where no parser is installed (September 2026)
- Issue #77 (fixed): `npm test` ran 1 of its 83 test files. `es-conformance-targets.test.ts` compiles a 45,000-line interpreter to five targets, which starves the vitest reporter under `singleFork` exactly as the config's own comment predicts; the run ends with `Timeout calling "onTaskUpdate"` and the remaining 82 files never run. The summary reads `Test Files 1 failed (83)` — a suite with one failure, not a suite that stopped. Fixed by adding the file to the exclude list it was already documented as belonging to (September 2026)
- Issue #78 (fixed): on Python a method whose name is a builtin was DECLARED under its renamed form and CALLED under its original one. `fn str` came out as `def _str`, and a chained `r.str(...)` called a method that does not exist — `AttributeError: 'LcRow' object has no attribute 'str'`. Every other writer reads `compiledName` at the call site; the Python writer wrote `method.vref`. Found by the phase-3 chain fixture, which is the first Ranger program to chain a call to such a method on Python (September 2026)

- Issue #80 (fixed): a property read through `(expr).field` emitted the SOURCE spelling of the name, not the renamed one. `GetProperty` resolves the member and attaches the descriptor to the expression node but never to the property node itself, so a name that is a keyword of the target came out unrenamed. The TS engine writes `(fnV.functionNodeOf()).async` and `async` is a Python keyword, so **the engine had never once built for Python** — a `SyntaxError` the compiler reported as a successful build. The same property is renamed correctly at its declaration (`self._async`) and at ordinary reads (`member._async`). Fixed by attaching the descriptor to the property node and by making the Python and PHP writers read it, as every other writer already did. The engine now builds, runs, and answers 2,061 of its 2,066 conformance probes identically to JavaScript (September 2026)
- Issue #85 (fixed): an array literal passed to a call whose RESULT IS IMMEDIATELY DEREFERENCED was lost — the elements were emitted bare where the array should be. `(box.take(([] _:string ( "a" "b" )))).count()` came out as `box.take("a""b").count()`, which does not parse on JavaScript or PHP; the one-element form came out as `box.take("a")`, which parses and answers the STRING's length. Every target, and the compiler reported success either way. The `recv.method()` rewrite walked the receiver and THEN copied it: walking an array literal replaces the node's children with its elements and marks the node `is_array_literal`, and a copy carries the new children without the mark — which is no longer an array literal but a bare list of its elements. The receiver is copied before it is walked now, and the copy is re-analysed whole. Gated by the program's output on es6, Go, Python and Rust (`tests/compiler-issue-85.test.ts`), and by the compiler rebuilding itself byte-identically (September 2026)
- Issue #63 (fixed): `return this.helper()` — a method call in return position written the way every C-family language writes it — failed type analysis, and said so twice in the wrong place (`Could not match argument types for return`, then `Function does not return any values!`, and often a phantom missing method in an unrelated function). The same shape is why arithmetic on a call result needed a temporary local. The parser now folds a `(` that TOUCHES a dotted name back onto that name and builds the call node itself, so the bare spelling and the parenthesised one are one program. Gated by output on es6, Go, Python and Rust (`tests/compiler-issue-63.test.ts`), and by the compiler rebuilding itself byte-identically — 50,000 lines of Ranger whose parse is unchanged (September 2026)
- Issue #82 (fixed): the `es6` keyword table added in #76 renamed METHOD and PROPERTY names as well as bindings, so `EvHandle.null()` -- the constructor three suites and every JavaScript consumer of the engine module call -- became `EvHandle._null()`. JavaScript reserves its keywords only where a name may stand: `const null = 1` is a syntax error, `obj.null` and `static null() {}` are not. `transformWord` now splits into a binding transform and a member transform. Found by CI, not locally: `runtime-conformance.test.ts` rebuilt the engine module only when a `.rgr` under `migrate/src/` was newer, so after a COMPILER change it measured the engine built by the previous compiler and reported green. The compiler is in that dependency list now (September 2026)

### Still Open
- Issue #92: `on_keypress` on Go emits a package-level `syscall.NewLazyDLL("msvcrt.dll")`, which exists only on Windows, so ANY Ranger program using the operator produces Go that does not build on Linux or macOS (`undefined: syscall.NewLazyDLL`). The polyfill has the right `runtime.GOOS != "windows"` guard inside its functions and none around the declarations. The compiler reports success; `go build` is where it stops. Found by compiling a terminal program to Go (September 2026)
- Issue #90: on Scala the `@(main)` function's body is NEVER EMITTED, and the compiler reports success. `object Main { }` comes out empty and the `object App<Name> extends App { ... }` wrapper the writer has code for (`compiler/RangerScalaClassWriter.rgr:831`) does not reach the output. So every Scala build in this repository is a library with no entry point, `targets.sh` counts it as `ok`, and nothing notices because nothing runs the Scala. Reproduced on a four-line program and on RangerStarter's own `src/Main.rgr` (September 2026)
- Issue #89: the Scala writer refuses a `continue` inside a `for` loop -- `oops, sorry. Currently Scala output can not handle for-loops with continue :/` -- in any function EXCEPT `@(main)`, where it appears to be accepted only because the whole body is dropped (#90). `continue` in a `while` loop is fine, and every other target takes either form (September 2026)
- Issue #87 (fixed): a property read on a PARENTHESISED receiver used as an operand of an infix operator -- `((unwrap x).v == 1)`, `(1 + (f()).v)`, `((unwrap x).name + "!")` -- did not compile: "WriteVREF -> Undefined variable .v" or "Could not match argument types for ==". The reader's infix rewriter took the `.v` token as an operand on its own and the expression before it was lost. The same read outside an infix expression (`def n:int ((unwrap x).v)`, `((unwrap x).v = 7)`) had always worked through the chain machinery. The reader now attaches the `.name` token to the expression it follows, flagged, and the flow parser binds that expression to a temporary in the statement's register expressions and reads `<tmp>.name` -- the mechanism operator arguments are hoisted through. Only the infix shape is rewritten, so nothing that worked changes its code generation. Two shapes are deliberately not rewritten: a method call on such a receiver inside an infix expression, and any such read in a loop condition, where the once-bound temporary would be wrong -- the compiler refuses it and names the fix. On Rust the hoisted temporary was typed as the bare struct because the shared-locals analysis walked only a statement's children; it walks the register expressions too now. Gated by `tests/compiler-paren-receiver.test.ts` on es6 and Rust (September 2026)
- Issue #86: on Rust a method named `self` is DECLARED as `self_` and CALLED as `_self`, so the generated crate does not compile (`no method named _self`). The two spellings come from two places: the language-wide `reserved_words` table in `Lang.rgr` maps `self -> _self` for every target, and the Rust writer's own word transform maps it to `self_` because `r#self` is not a legal raw identifier. Every other Rust keyword is consistent (`match` and `loop` are `r#match` / `r#loop` at both ends). Same family as #78 and #80; found while writing the #63 fixture, which had a method called `self` (September 2026)
- Issue #84: Rust drops a ONE-element inline array literal in argument position: `Take.f(([] _:string ( "a" )))` emits `Take::f("a")` where every other target emits the vector. Two elements are correct, so it is the arity, not the literal (September 2026)
- Issue #81: `(expr).field` does not resolve when it appears as a CALL ARGUMENT. `def ok:int ((h.nodeOf()).plain)` compiles; `ArgMain.id((h.nodeOf()).plain)` on the very next line gives "Undefined variable .plain". Nothing to do with keywords — any property name fails. The dot-tail branch in `WalkNode` is never reached for an argument, so the tail is left as an unresolved `.field` vref. Found while fixing #80 (September 2026)
- Issue #79: on Rust a method that returns `this` returns `self.clone()`, so every call after the first in a chain mutates a COPY. `a.bump().bump().bump()` leaves `a.n` at 1 where JavaScript, Python and Go all say 3. No error, no warning — a silently wrong answer, and the builder pattern is exactly the shape that hits it. Reproduces on a 13-line program with no generics and no aliasing (September 2026)
- Issue #75 (partially fixed): any trailing block on a class declaration makes `EnterClass` take it for the class body. The real body is never flow-analysed, the compiler reports success, and the emitted method body is broken (`return+x1` for `return (x + 1)`). The `doc { … }` case is fixed by the detach pass; the arity check is still wrong for any other trailing token (August 2026)
- Issue #74: Rust emits `&self` for a method whose only statement is a mutating call on a field object, so the output does not compile. Statement-position calls keep a node shape the mutability analysis does not read. Reproduces without generics (August 2026)
- Issue #73: LLVM mishandles a collection nested inside a collection — `[[string]]` comes back with the inner array empty, and `[string:[string:int]]` segfaults once the inner map holds more than one entry. Reproduces without generics; same family as TARGET_NOTES #25/#26 (August 2026)
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

`compiler/RangerRustClassWriter.rgr` — added a `writeArrayLiteral` that
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

`compiler/RangerFlowParser.rgr` — `cmdArray` now scans for a child carrying
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

## Issue #76: Assigning to a field of a call result silently drops the assignment

**Status:** Fixed — the parser now compiles it (September 2026)
**Severity:** **Critical** (silent wrong-code generation; no diagnostic at all)
**Found:** September 2026, drawing the ReUI stepper in `gallery/ui/demo/ControlsDemo.rgr`
**Targets:** front-end, so every backend inherits it

### Description

A statement of the form `recv.method(args).field = value` compiled without a
word of complaint and did nothing. The call was emitted; the store was not.

This is the same failure #65 documents — silent wrong-code generation with no
diagnostic — reached by the path #65's guard does not cover. That guard rejects
a statement STARTING with a parenthesised receiver, `(expr).method()`. The bare
spelling never tripped it, because it parses as an ordinary vref chain.

The two spellings therefore behaved in three different ways, and only one of
them was safe:

| spelling | result |
|---|---|
| `(b.at(0)).name = "x"` | **was rejected** by #65's guard; now compiles and stores |
| `b.at(0).name = "x"` | **compiled, did nothing** — this issue; now compiles and stores |
| `def t:Item (b.at(0))` then `t.name = "x"` | works |

All three spellings now do the same thing. The two that store reach the parser
at **different places**, which is why the fix has two halves — see *The
parenthesised spelling* below.

### Reproduction

```ranger
class Item {
    def name:string "unset"
    Constructor () {
    }
}
class Box {
    def items:[Item]
    Constructor () { def none:[Item] items = none }
    fn add:void () { def i:Item (new Item ()) push items i }
    fn at:Item (i:int) { return (itemAt items i) }
}
class Main {
    Constructor () {
    }
    sfn main:void () {
        def b:Box (new Box ())
        b.add()
        b.at(0).name = "bare"
        def chk:Item (b.at(0))
        print ("-> " + chk.name)     ; prints "-> unset"
    }
}
```

### What was emitted

```js
function __js_main() {
  const b = new Box();
  b.add();
  (b).at(0);                 // <-- the call survives; `.name = "bare"` is gone
  const chk = (b).at(0);
  console.log("-> " + chk.name);
}
```

### Why it bit

`gallery/ui/demo/ControlsDemo.rgr` set each stepper step's icon with
`stepper.stepAt(0).icon = "user"`. Every circle drew the fallback glyph and the
panel came up empty, with a clean compile. The gate could not catch it either:
the gate is JavaScript, where that same expression works exactly as it reads.
One line, two meanings across the boundary, and only one of them a mistake.

### What has been ruled out

Four probes, each compiled and run, narrowing where the store was lost:

| probe | result |
|---|---|
| `b.at(0).rename("x")` — a chained METHOD call | **works**, emits `((b).at(0)).rename("x")` |
| `((b.at(0)).name)` — reading a field of a call result | **works** |
| `b.solo.name = "x"` — a plain field chain | **works**, emits `b.solo.name = "x"` |
| `b.first().name = "x"` — zero-arg call, still an assignment | **silent no-op** |

So:

- **The parser handles the chain.** A method call on a call result parses and
  renders correctly, and the renderer already produces exactly the receiver
  syntax an assignment would need.
- **Reading is fine.** Only writing was lost.
- **It is not arity.** A zero-argument call fails the same way.
- **It is lost before codegen.** Nothing of the assignment appears in the
  output at all — not a mangled store, no store.
- **It is NOT the `=` operator overload.** `Lang.rgr` declares
  `= cmdAssign:void ( target:vref expr:expression )`, and a chain is not a
  plain `vref`, so that looked like the cause. Adding a sibling overload
  `( target:expression expr:expression )` and rebuilding the compiler changes
  nothing — the statement never reaches operator matching in this shape.
  (Tried and reverted; recorded so nobody spends the afternoon on it twice.)

That left the symbol/vref scanner in `RangerLispParser.rgr`, which absorbed the
trailing `.field` into the chain it was building and then dropped it when the
statement turned out to be an assignment rather than a call.

### The fix

The trailing `.field` is scanned as a vref **whose name begins with a dot** —
there is no receiver in front of it, because the receiver was the call, already
folded into a group. Nothing downstream knew that shape, so the statement
collapsed to the call alone.

Two other shapes reach the same point with a dot-leading vref and are both
legal, so the test is not "does it lead with a dot" but *what follows it*.
Established by instrumenting the parser and running all three, rather than by
reasoning:

| source | next char | meaning |
|---|---|---|
| `b.at(0).rename(x)` | `(` | chained method CALL — folds correctly today |
| `((b.at(0)).name)` | `)` | READ inside an expression — always worked |
| `b.at(0).name = x` | `=` | the assignment, this issue |

At that point — a dot-leading vref followed by `=`, with `==` excluded so a
comparison on a call result stays a legal read — the parser now **desugars the
statement into the two it always had to be written as**:

```ranger
b.at(0).name = "x"
```

becomes, before anything downstream sees it,

```ranger
def __rgr_recv_1 (b.at(0))
__rgr_recv_1.name = "x"
```

Both halves are shapes the compiler already handled: a `def` whose type is
inferred from a call, and a plain field store on a local. **Nothing downstream
of the parser changed** — no new operator overload, no codegen change, no type
rule. That is the whole reason this route works where the `Lang.rgr` route
ruled out above does not.

The surgery is three moves at the detection point in `RangerLispParser.rgr`:

1. The children the statement node has accumulated so far *are* the receiver
   (the callee vref and its argument group). They are moved into the new
   `def`'s value expression.
2. The `def` is inserted into the enclosing **block**, immediately ahead of the
   statement being parsed. The statement is already a child of that block — a
   statement is pushed onto its block before its own parse begins — so the
   insert point is that statement's own index, found by start offset, which is
   unique per statement, rather than by object identity.
3. The dot-leading vref is renamed from `.name` to `__rgr_recv_1.name`, so it
   hangs off the temporary instead of off nothing. Parsing then continues
   normally and the `=` is matched by the ordinary `cmdAssign` overload.

The temporaries are numbered per parser instance, so per **file**; they are
block locals, so two files never see each other's.

The old diagnostic is kept as the `else` branch, for a shape this cannot
rewrite — no enclosing block, or no receiver to move. Silently dropping the
store is the one outcome that must never come back.

### The parenthesised spelling

`(b.at(0)).name = "x"` never reaches that point. The statement starts with `(`,
so the group is parsed as a statement of its own and is **already the block's
last child** by the time `.name` is scanned — with `curr_node` back at the
block, which is exactly the condition #65's guard fires on. The receiver is not
in the statement's children; it is the sibling behind it.

So the same desugaring is taught to reach for it there, at the #65 guard site,
before the guard gives up. It pops the block's last child as the receiver,
builds the same `def`, then opens the statement itself — pushing a vref named
`__rgr_recv_N.name` and handing the rest of the line (` = "x"`) to the ordinary
recursion, which is the same thing the normal statement path does one token
later.

**The receiver is only taken when the `.` sits immediately after a `)`, with
nothing between.** That single check is what separates a rewrite from a theft:

```ranger
b.touch()
.name = "stolen"
```

Here the previous statement also ends in `)`, and a rewrite that looked only
for a call result behind it would store into whatever `b.touch()` returned.
Whitespace or a newline before the dot means no rewrite, and #65's error
stands. `tests/fixtures/issue_76_dangling_dot.rgr` gates it.

A parenthesised receiver followed by a **call** — `(a.b()).c()` — is also still
#65's error, gated by `tests/fixtures/issue_76_paren_receiver_call.rgr`. The
lookahead fires only on `=`, and that shape has a bare spelling,
`a.b().c()`, that has always worked.

### What it emits

```js
const __rgr_recv_1 = (b).at(0);
__rgr_recv_1.name = "zero";
const __rgr_recv_2 = (b).at(1);
__rgr_recv_2.name = "one";
const __rgr_recv_3 = (b).first();
__rgr_recv_3.n = 42;
```

### What was tried first, and does not work

The obvious route is the operator declaration in `Lang.rgr`,
`= cmdAssign:void ( target:vref expr:expression )`: a call chain is not a plain
`vref`, so no overload can match. Adding a sibling overload with an expression
target and rebuilding the compiler changes nothing — **the statement never
reaches operator matching in this shape**, because the dot-leading vref is
already lost by then. Recorded so the next person does not spend an afternoon
on it. The parser is the only place early enough to see the receiver still
intact.

### Verified

A probe compiled and run against the rebuilt compiler, covering the shapes that
reach the rewrite and the ones that must not:

| shape | result |
|---|---|
| `b.at(0).name = "zero"` | stores |
| `b.first().n = 42` — zero-arg call | stores |
| `b.at(k).n = (k + 100)` inside a `while` block | stores |
| two rewrites in the same block | both store, distinct temporaries |
| `b.at(0).self().name = "chained"` — chained receiver | stores |
| `b.at(0).inner.tag = "deep"` — nested field path | stores |
| `b.at(i).n = (i + 7)` inside a `for` block | stores |
| `(b.at(0)).name = "paren"` — the parenthesised spelling | stores |
| `(b.at(0)).n= 5` — no space before the `=` | stores |
| `(b.at(1)).inner.tag = "deep"` — parenthesised, nested path | stores |
| `((b.at(1)).name) == "one"` | still a READ, unchanged |
| `def r:string ((b.at(0)).name)` | still a READ, unchanged |
| `b.touch()` then `.name = "x"` on the next line | still #65's error — not stolen |
| `(b.at(0)).ping()` — parenthesised receiver, a CALL | still #65's error |

The compiler bootstraps to a fixpoint on the change (stage1 == stage2 ==
stage3), and all 79 gallery editor suites pass.

The probe is kept as `tests/fixtures/issue_76_call_result_field.rgr` with
`tests/compiler-issue-76.test.ts` over it, so it is a gate rather than a
session. The gate reads the program's OUTPUT, not the emitted source: grepping
for `__rgr_recv_` would pass on a rewrite that stored the wrong thing, and fail
on a future fix that reached the same result another way.

Mutation-proved against both earlier states of the compiler, by compiling and
running the same fixture:

| compiler | result |
|---|---|
| before any fix (`f57e27d^`) | **compiles cleanly, prints `unset\|0\|unset` four times** — every store dropped, and the comparison branch never fires |
| the reject-only fix (`f57e27d`) | parse error, no output |
| this fix | the eight expected lines |

`vitest` is not installed in the environment this was written in, so the test
file itself was not executed here; the fixture was compiled and run directly
with `bin/output.js` and its output matched every assertion in the file,
line for line.

`gallery/ui/demo/ControlsDemo.rgr` — the file that found the bug — is written
back in the natural spelling, so the fix has a live user rather than only a
probe.

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
`compiler/CodeWriter.rgr` (the compiler's own source), and
`compiler/test_call.rgr`, where the swallowed statements meant the fixture was
not testing what it appeared to.

### Fix

`compiler/RangerLispParser.rgr` — the block-node branch now rejects a statement whose
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

## Issue #63: `return this.helper()` failed type analysis (FIXED)

**Status:** Fixed (September 2026)
**Severity:** High for the person writing Ranger — the compiler was correct and
the program was not, but the message pointed somewhere else entirely, and the
rule it was enforcing had to be memorised from `AGENTS.md`.
**Targets:** all (front-end, the `[2/5] Analyzing code` phase)

### What was wrong

Ranger is an s-expression language, and a call used as a VALUE needs to be one
node. `return this.helper()` parsed as three sibling nodes — `return`, the name
`this.helper`, and an empty `()` — so the `return` operator saw two arguments
where it takes one and refused to match. The flow analyser then never recorded a
return either, so a second error followed the first:

```
[FAIL] Could not match argument types for return
[FAIL] Function does not return any values!
```

Neither message names the real problem, and on a class with inheritance the
failure often surfaced as a phantom `function variable not found <some other
method>` in a different file.

The same three-sibling shape is why arithmetic on a call result needed a
temporary: in `(this.helper() + 1)` the infix rewriter treated `this.helper` and
`()` as two separate operands and pulled them apart.

### The fix

`compiler/RangerLispParser.rgr` folds the call back together while parsing. A `(`
that **touches** a dotted name — no space in between — is that name's argument
list, so the two become one call node before anything downstream sees them:

- `insertCallOrNode` folds at the opening paren, which covers a call in operand
  position (`return this.h.value()`, `f(a.b())`) and carries the rest of a
  chain into the same node (`return a.b().c()`).
- `foldCallChainToGroup` folds one token later, for a call that is already at
  the start of its expression and would otherwise be taken apart by the infix
  rewriter — `(this.h.value() + 1)`.

Three exclusions keep everything else parsing exactly as it did, and each one is
a shape that broke when it was missing:

| Not folded | Why |
| --- | --- |
| `print (x)` — a space before the `(` | An operand followed by a group, not a call |
| `new Value.Num(2.5)` | The dotted name is a TYPE and the parens are the constructor's arguments; folding left `new` without its type |
| `.tail()` of a chain whose receiver is not a folded call | The existing chain handling owns that shape |

### What works now

```
return this.helper()                  ; the bare form
return P.staticHelper()
return this.helper() + 10             ; a call as an arithmetic operand
def v:int (this.helper() + 1)         ; no temporary needed
def v:int (100 - this.helper())
this.other(this.helper())             ; a call as an argument
return this.h.same().value()          ; a bare chain
def v:int (this.h.same().value() * 5)
```

`tests/fixtures/issue_63_bare_call.rgr` is all of the above, asserted against
the parenthesised spelling of the same expressions, on es6, Go, Python and Rust.

### What still needs its own parentheses

A callee that is **not** dotted — a lambda in a local, say — is unchanged:

```
def fn1 (fn:int (p:int) { return (p + 1) })
return (fn1(3))    ; the bare `return fn1(3)` still fails
```

An undotted name in operand position is also how `new Type(...)` and a method
declaration are spelled, so the fold does not reach there. So do these, which
are their own issues:

- a statement that starts with a parenthesised receiver (#65)
- `(expr).field` used as a call argument (#81)

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

In `RangerAppClassDesc.rgr`, the `addMethod` function uses:

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

The Python class writer (`compiler/RangerPythonClassWriter.rgr`) generated `super().__init__()` without analyzing what arguments the parent constructor requires.

### Resolution

Modified `RangerPythonClassWriter.rgr` to check if the parent class has a constructor, and if so, pass the parent constructor's parameters to `super().__init__()`:

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

- `compiler/RangerPythonClassWriter.rgr` - Fixed `super().__init__()` to pass parent constructor arguments

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

Parser now normalizes CRLF, lone CR, and LF to LF in `RangerLispParser.normalizeLineEndings()` before tokenization (`compiler/RangerLispParser.rgr`). LF-only fixtures are covered in `tests/compiler-imports.test.ts`. The CRLF-in-git workaround can be retired once all environments use the normalized parser build.

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
- `compiler/RangerGenericClassWriter.rgr` or similar - polyfill emission logic

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

The parser in `RangerLispParser.rgr` was incorrectly tokenizing identifiers that started with `true` or `false`. For example, `trueType` was being split into `true` (boolean literal) + `Type` (identifier), causing parsing errors.

The `true`/`false` keyword matching checked for the character sequence but did not verify that it was followed by a word boundary character.

### Resolution

Fixed `RangerLispParser.rgr` to add word boundary checks when matching `true` and `false` keywords:

```ranger
; Check for 'true' keyword - but only if followed by a word boundary
def nextCharT:char (charAt s (i + 4))
if ((fc == ((ccode "t"))) && ... && ((nextCharT <= 32) || (nextCharT == 40) || (nextCharT == 41) || (nextCharT == 58) || (nextCharT == ((ccode "}"))) || ((i + 4) >= len))) {
```

This ensures `true` is only recognized as a boolean literal when followed by whitespace, parentheses, colon, brace, or end of input - not when it's part of a longer identifier like `trueType`.

### Files Changed

- `compiler/RangerLispParser.rgr` - Added word boundary checks for `true`/`false` keyword parsing
- `compiler/RangerLispParser.rgr` - Same fix for consistency

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

1. **`compiler/RangerAppEnums.rgr`** - Add `Buffer` to `RangerNodeType` enum
2. **`compiler/TTypes.rgr`** - Add cases in three places:
   - `nameToValue()` - return `RangerNodeType.Buffer` for "buffer"
   - `isPrimitive()` - return `true` for `RangerNodeType.Buffer`
   - `valueAsString()` - return "buffer" for `RangerNodeType.Buffer`
3. **`compiler/RangerAppWriterContext.rgr`** - Update two places:
   - `isPrimitiveType()` - add `|| (typeName == "buffer")`
   - `isDefinedType()` - add `|| (typeName == "buffer")`
4. **`compiler/CodeNodeCompilerExtensions.rgr`** - Add case in `defineNodeTypeTo()`:
   ```ranger
   case "buffer" {
     node.value_type = RangerNodeType.Buffer
     node.eval_type = RangerNodeType.Buffer
     node.eval_type_name = "buffer"
   }
   ```
5. **`compiler/RangerArgMatch.rgr`** - Add case in `getType()`:
   ```ranger
   case "buffer" {
     return RangerNodeType.Buffer
   }
   ```
6. **Each class writer** - Add type mapping (e.g., `RangerJavaScriptClassWriter.rgr`, `RangerGolangClassWriter.rgr`, etc.):
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
| `RangerAppEnums.rgr`             | `RangerNodeType` enum                               |
| `TTypes.rgr`                        | `nameToValue()`, `isPrimitive()`, `valueAsString()` |
| `RangerAppWriterContext.rgr`     | `isPrimitiveType()`, `isDefinedType()`              |
| `CodeNodeCompilerExtensions.rgr` | `defineNodeTypeTo()` switch                         |
| `RangerArgMatch.rgr`             | `getType()` switch                                  |
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

- `Compiler.rgr` or similar - Function analysis phase
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

- `compiler/RangerGolangClassWriter.rgr` - Go code generation
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

In `compiler/RangerFlowParser.rgr` (and `ng_FlowWork.rgr`), the `mergeImports` function uses `rootCtx.libraryPaths` to search for imports, but doesn't update the library paths based on the directory of the currently imported file. The paths are set once at compilation start and not updated for nested imports.

### Expected Behavior

When importing a file, the compiler should:

1. Resolve the import path relative to the current file
2. Add the imported file's directory to the library paths for processing that file's imports
3. Pop the path when done processing that file

### Resolution

`mergeImports` and `WalkCollectMethods` in `compiler/RangerFlowParser.rgr` (and `ng_FlowWork.rgr`) now push the imported file's directory onto `rootCtx.libraryPaths` while processing nested imports, then pop it afterward. Regression tests live in `tests/compiler-imports.test.ts` (`cross_dir_lexer.rgr` imports `ts_lexer.rgr`, which imports `ts_token.rgr`).

### Impact

This prevents modular organization of code across directories. Currently all files must be in the same directory or explicitly added to RANGER_LIB.

### Workaround

Add all needed directories to RANGER_LIB environment variable:

```
RANGER_LIB=./compiler/Lang.rgr;./gallery/pdf_writer;./lib/evg;./gallery/ts_parser
```

### Proposed Fix

In `RangerFlowParser.rgr`, modify `mergeImports` to:

1. Extract the directory from the imported file path
2. Push it to `libraryPaths` before processing the file
3. Pop it after processing

### Files to Change

- `compiler/RangerFlowParser.rgr` - `mergeImports` function
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

And used dynamically in `RangerGolangClassWriter.rgr` (line 314):

```ranger
if(cc.is_system) {
    def sysName (get cc.systemNames "go")
    ; ... uses sysName for type output
}
```

But many writers also have hardcoded type handling:

**RangerGolangClassWriter.rgr:**
```ranger
case "charbuffer" { wr.out("[]byte" false) }
case "buffer" { wr.out("[]byte" false) }
```

**RangerJavaScriptClassWriter.rgr:**
```ranger
case "charbuffer" { wr.out("Uint8Array" false) }
case "buffer" { wr.out("Buffer" false) }
```

**RangerAppWriterContext.rgr (isPrimitiveType):**
```ranger
if (typeName == "charbuffer") || (typeName == "buffer") || ...
```

### Files with Hardcoded System Types

| File | Types Hardcoded |
|------|-----------------|
| `RangerGolangClassWriter.rgr` | buffer, charbuffer |
| `RangerJavaScriptClassWriter.rgr` | buffer, charbuffer |
| `RangerSwift6ClassWriter.rgr` | buffer, charbuffer |
| `RangerRustClassWriter.rgr` | buffer |
| `RangerScalaClassWriter.rgr` | buffer |
| `RangerAppWriterContext.rgr` | buffer, charbuffer, int_buffer, double_buffer |
| `CodeNodeCompilerExtensions.rgr` | charbuffer |
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

Added `compiler/TTypeRegistry.rgr` and `registerLangSystemClasses()` in `RangerFlowParser.rgr`, called from `VirtualCompiler.rgr` after parsing `Lang.rgr`. Systemclasses are registered into the root context and consulted by `isPrimitiveType()` / `isDefinedType()` in `RangerAppWriterContext.rgr`, removing hardcoded HTTP type checks.

### Root Cause (historical)

The type validation in `RangerAppWriterContext.rgr` uses `isDefinedType()` which has a hardcoded list of primitive types:

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

- `RangerAppWriterContext.rgr` - `isDefinedType()` function
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
; In RangerArgMatch.rgr
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
| `RangerAppWriterContext.rgr` | Added HTTP types to `isDefinedType()` |
| `RangerAppClassDesc.rgr` | Added `getSystemclassType()`, `isSystemclassType()` |
| `RangerArgMatch.rgr` | Added systemclass annotation check in `areEqualTypes()` |
| `CodeNode.rgr` | Added `getFlagSiblingString()` helper |
| `RangerGolangClassWriter.rgr` | Added CustomOperator handling for `start` |
| `RangerGolangHttpServerWriter.rgr` | New file for HTTP server code generation |

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
(`compiler/RangerFlowParser.rgr:282`, and a commented-out line in
`LiveCompiler.rgr`), both with blocks small enough to survive the re-parse,
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
expression inside a block, `RangerLispParser.rgr:1054` — is closed by
`end_expression`, which pops `parents` and **does not break**. That frame then
parses the rest of the enclosing block, and the next statement recurses again on
top of it.

### Fix

`parseBuf` records `array_length parents` on entry and returns as soon as the
list is shorter than that — the node this frame was parsing is gone, so the
frame is done. Four lines in `compiler/RangerLispParser.rgr`.

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

## Issue #92: `on_keypress` on Go declares a Windows-only symbol at package level

**Status:** open.

Any Ranger program that calls `on_keypress` compiles to Go that will not build on
anything but Windows:

```
./kv.go:21:19: undefined: syscall.NewLazyDLL
```

The polyfill opens with:

```go
var (
	msvcrt = syscall.NewLazyDLL("msvcrt.dll")
	kbhit  = msvcrt.NewProc("_kbhit")
	getch  = msvcrt.NewProc("_getch")
)
```

`syscall.NewLazyDLL` is declared only in Go's Windows build of `syscall`, and a
package-level `var` is compiled on every platform. The functions BELOW it are
guarded properly -- `if runtime.GOOS != "windows"` -- so the intent is clearly
there; the guard is just in the wrong place for a declaration.

Go has the mechanism for this: the Windows half belongs behind a build
constraint, which for a single generated file means the `kbhit`/`getch` handles
have to be resolved lazily inside the Windows branch rather than declared at the
top.

The compiler reports `[OK] Compilation successful!`, because the defect is in code
it emits and never reads back -- the same shape as #88.

Found while compiling a terminal program to Go. The same program's Python output
builds and runs.

---

## Issue #91: `on_keypress` shadowed its key variable, and emitted it as a constant

**Status: fixed.**

Two defects in one operator, and either one alone made it unusable.

### The shadowing

The es6 handler was emitted as:

```javascript
process.stdin.on('keypress', (str, key) => {
  ...
  if (__rgr_k !== "") { key = __rgr_k; global.r_key_queue.push(__rgr_k); }
  /* the block */
});
```

`key` is the obvious name for a key variable, so `on_keypress key { ... }` was the
obvious spelling — and the handler's own parameter is called `key`. The Ranger
local was shadowed: the assignment landed on the parameter, and the BLOCK received
the host runtime's key object rather than the string. Code in the block that
compared it to `"left"` never matched and never could.

`gallery/invaders` is exactly that program. Its block called `game.handleKey(key)`
with the key object; the game worked only because `gameLoop` also polls
`poll_keypress`, which is a separate and correct path.

### The constant

Name the variable anything else and the other half bites. The compiler emits
`const` for a local that nothing in the SOURCE assigns, and the operator's
assignment is in a template:

```javascript
const lastKey = "";
...
if (__rgr_k !== "") { lastKey = __rgr_k; ... }
```

`TypeError: Assignment to constant variable` — thrown at runtime, inside a keypress
handler, in raw mode, with the screen already cleared, on the first key the user
pressed.

### The fix

The handler's parameters are prefixed (`__rgr_s`, `__rgr_key`), so nothing the
author can name is shadowed; and the operator declares `keyvar@(mutates):string`,
which is what tells the compiler to emit `let`. Both in `compiler/Lang.rgr`,
`bin/Lang.rgr` and `dist/Lang.rgr`.

`gallery/invaders` is corrected at the same time, because the fix makes its latent
bug manifest: with the block finally receiving the string, its `handleKey` call
would run in ADDITION to the one its poll loop makes, and the ship would move twice
per keypress. Its block is now empty, which is the correct shape for a program that
polls.

### What is still true, and worth knowing

**Only es6 assigns the key variable at all.** The rust, go, cpp, python and kotlin
templates fill the queue that `poll_keypress` reads and never touch `keyvar`, so a
block that reads it sees an empty string on those targets. The portable shape is
therefore an EMPTY block plus a `poll_keypress` loop, and that is what
`gallery/invaders` and RangerStarter's wizard both do.

Verified through a real pty: three keys in, and the block and the poll loop each
report `a`, `up`, `space`.

---

## Issue #90: on Scala the `@(main)` function is never emitted, and the compiler says OK

**Status:** open.

```ranger
class ScE {
    sfn m@(main):void () {
        def names:[string]
        push names "a"
        for names n:string i {
            print n
        }
    }
}
```

```
[OK] Compilation successful!
```

and the whole of the emitted Scala is:

```scala
case class ScalaReturnValue(value:Any) extends Exception

// companion object for static methods of ScE static cnt == 1
object ScE {
}
```

No `main`, no `object AppScE extends App`, nothing from the body. It is not the
minimal program: `src/Main.rgr` from RangerStarter emits its `Greeter` class
correctly — methods, constructor and all — and then the same empty companion
object.

`compiler/RangerScalaClassWriter.rgr:831` has the code and it looks right:

```ranger
if b_had_app {
  def theEnd (wr.getTag("file_end"))
  theEnd.out((("object App" + cl.name) + " extends App {") true)
  this.WalkNode( (unwrap variant.fnBody ) subCtx theEnd)
```

So either `b_had_app` is false — the `@(main)` annotation is not recognised for this
writer — or the `file_end` tag's content is not flushed into the single-file output.
One print tells them apart.

Nothing noticed because a target whose output is never executed can be missing its
entry point indefinitely: `targets.sh` reports what COMPILED, and the three targets
it runs are es6, Python and Go.

---

## Issue #89: the Scala writer cannot emit `continue` inside a `for` loop

**Status:** open. The compiler says so itself, which is the good part:

```
[FAIL] oops, sorry. Currently Scala output can not handle for-loops with continue :/
```

The refusal is per function, and `@(main)` is the exception — the same loop there
reports success, because that body is never emitted at all (#90). A static method
and an instance method both refuse it; whether the collection is a local, a
parameter or a field makes no difference. `continue` inside a `while` loop
compiles: the gap is specific to the `for` form, which the writer emits as a
`foreach`, and a Scala `foreach` has no `continue`.

A `continue` guard at the top of a loop body is the ordinary way to write a filter,
and the alternative costs a level of indentation per guard. RangerStarter's core
uses it in about ten places and is otherwise portable: it **runs** on es6, Python
and Go and **compiles** on eleven of the remaining twelve. Scala is the only
compile failure and this is the only reason for it.

The writer already has a while-loop path that handles `continue`, so a `for` whose
body contains one could be emitted as an indexed `while` over the same collection —
which is what the other targets' output amounts to.

---

## Issue #88: `join` on Go emits `strings.Join` without importing `strings`

**Status: fixed.**

`join`'s Go template called into the standard library with no `(imp "strings")`
beside it, so the generated file named a package it never imported and `go build`
rejected it with `undefined: strings`. The compiler reported
`[OK] Compilation successful!`, because the defect is in code it emits and never
reads back.

Eighteen Go templates in `Lang.rgr` reach into that package and seventeen declared
it, so the import usually arrived for another reason — a `trim`, a `strsplit`, a
`contains`, or one of the five `+` concatenations that go through
`strings.Join([]string{…})`. It only showed up in a program that joins an array and
does nothing else stringly, which the corpus did not have.

`tests/fixtures/join_strings.rgr` joins a three-element array, a one-element array
and an empty one, and uses no other operator that touches `strings`. That
exclusivity is the whole test: add a `trim` to the fixture and it passes with the
defect reinstated.

---

## Issue #85: an array literal is lost when the call taking it is immediately dereferenced

**Status:** fixed (September 2026). Found while writing `lib/Shell.rgr`, where
every command is a program name and an argument vector, so the shape is
unavoidable. The reproduction below is what it did before the fix;
`tests/fixtures/issue_85_chained_array_literal.rgr` is the same program as a
gate.

### Reproduction

```ranger
class Box {
    def n:int 0
    fn take:Box (v:[string]) {
        n = (array_length v)
        return this
    }
    fn count:int () {
        return n
    }
}
class Bugs {
    sfn m@(main):void () {
        def b:Box (new Box)
        print "chained one = " + ((b.take(([] _:string ( "a" )))).count())
        print "chained two = " + ((b.take(([] _:string ( "a" "b" )))).count())
    }
}
```

JavaScript:

```javascript
console.log("chained one = " + b.take("a").count());
console.log("chained two = " + b.take("a""b").count());
```

The array is gone. One element parses and is silently wrong — `array_length`
answers the string's length rather than 1. Two elements do not parse at all,
on JavaScript or on PHP.

### Where it bites

Any API of the form "a name and a list": a command and its arguments, a query
and its parameters, a template and its values. The natural way to write the
assertion is

```ranger
this.check("it ran" ((sh.capture("ls" ([] _:string ( "-la" )))).ok()))
```

and it has to be written

```ranger
def argv:[string]
push argv "-la"
def res:ShellResult (sh.capture("ls" argv))
this.check("it ran" (res.ok()))
```

### The fix

`transformDotMethodCallExpr` (`compiler/RangerFlowParser.rgr`) rewrites
`(recv).method(args)` into a `call` node. It walked the receiver first — to
learn its type, which is how it decides whether this is a method call at all —
and then put a COPY of the walked receiver into the new node.

Walking an array literal is destructive: `EnterArrayLiteral` replaces the
node's children with its elements and sets `is_array_literal` on the node. The
two together are what an array literal IS after analysis. `copy()` rebuilds a
node for re-analysis and carries no analysis result, so the copy had the
elements as its children and no mark — a plain expression with two strings in
it, which is exactly what the writer emitted.

The receiver is now copied BEFORE it is walked, and that untouched copy is what
the rewritten call gets. The walk below it re-analyses the copy from the
original source shape, so the literal comes out whole. The walked original is
still used for its type, and nothing is walked more times than before.

Note that the one-element inline literal still goes missing on **Rust**, in a
dereferenced call or a plain one: that is Issue #84, a defect in that writer.

---

## Issue #84: Rust drops a one-element inline array literal in argument position

**Status:** open.

### Reproduction

```ranger
class ArrLit {
    sfn take:int (v:[string]) {
        return (array_length v)
    }
    sfn m@(main):void () {
        def bound:[string] ([] _:string ( "a" ))
        print "bound one  = " + (ArrLit.take(bound))
        print "inline one = " + (ArrLit.take(([] _:string ( "a" ))))
        print "inline two = " + (ArrLit.take(([] _:string ( "a" "b" ))))
    }
}
```

Rust:

```rust
ArrLit::take(&bound)                                   // correct
ArrLit::take("a")                                      // expected &[String]
ArrLit::take(&vec!["a".to_string(), "b".to_string()])  // correct
```

`rustc` rejects the middle one, so this is a build failure rather than a wrong
answer — which is the good version of this bug. JavaScript emits `["a"]` for
the same line, so it is the Rust writer and not the parser.

### Workaround

Bind it, or build it with `push`. `lib/apple/` does the latter throughout for
this reason and is checked on seven targets because of it.

---

## Issue #83: the PHP writer mangles a `$` inside a string literal

**Status: fixed.**

```ranger
def dollar:string "literal $HOME stays"
```

PHP, before: `$dollar = "literal \"HOME stays";` — the `$` became `\"`, and the
file does not parse.

One character. `RangerPHPClassWriter.EncodeString` switches on each codepoint, and
the `$` arm was a copy of the `"` arm above it with its case label changed and its
body left alone:

```ranger
case 34 { ... (strfromcode 92) + (strfromcode 34) ... }
case 36 { ... (strfromcode 92) + (strfromcode 34) ... }   ; <- 34, needs 36
```

The escape itself is needed: PHP interpolates `$name` inside a double-quoted
string, so a Ranger string holding a `$` must come out as `\$`. The writer was
right about escaping it and wrong about what to escape it to.

`bin/output.js` was rebuilt and differs from its predecessor by exactly that one
emitted line; the rebuilt compiler reproduces itself byte-identically.
`dist/rgrc.js`, which is not a plain copy of `bin/output.js` in this tree, carries
the same one-line change at its own copy of the site.

It was invisible until the PHP target was built, because every other target writes
the string through. Found while writing a project generator whose templates are
shell scripts. `tests/codegen-php.test.ts` asserts the emitted text for a `$`
mid-word, two in one string, one beside a real escaped quote, and a string with
none — and asserts the absence of the defect's signature, since the failure mode is
an unbalanced quote rather than a wrong answer.

---

## Issue #82: the JavaScript keyword table renamed METHOD and PROPERTY names, which changed the API its callers already spell

**Status:** fixed (September 2026). Caught by CI, not by the local suite --
see "Why the local run said PASS" below, which is the more useful half.

### Reproduction

`gallery/game_engine/v2/interp/migrate/src/EvHandle.rgr` declares

```ranger
sfn null:EvHandle () {
    return ((EvalConstPool.__singleton()).nullValue)
}
```

`EvHandle.null()` is the constructor three test suites and every JavaScript
consumer of the engine module call. After #76 added an `es6` block to
`reserved_words` and put `null` beside the C#/Dart cases in `transformWord`,
the module emitted `EvHandle._null` -- declaration and call site consistently,
so the module itself worked, but the name its callers use was gone:

```
AssertionError: expected '<threw EvalValue.null is not a function>' to deeply equal '10'
```

2,209 of the 2,215 assertions in `runtime-conformance.test.ts` failed that way,
because every one of them goes through `engine.callFunction(fn, EvalValue.null())`.

### Cause

A keyword table is not a single word set. JavaScript reserves its keywords only
where a NAME may stand:

```js
const null = 1;          // SyntaxError
function f(null) {}      // SyntaxError
obj.null                 // legal
this.null = 1            // legal
class X { static null() {} }   // legal
```

`transformWord` is called from both positions -- from `defineVariable` and
`assignParamCompiledName` for bindings, and from `createStaticMethod`,
`r.funcdesc` and the two flow parsers for members -- and had no way to tell
them apart. C# and Dart reserve the word in both positions, so for those the
single table was right and the defect never showed.

Two names in the repo were hit. `EvHandle.null` broke three suites;
`EvHandle.function` broke nothing in tree but had equally been renamed out
from under any caller.

### Fix

`transformWord` splits three ways in `RangerAppWriterContext.rgr`:

- `transformBindingWord` -- locals, parameters, and any non-property
  `defineVariable`. Adds the es6 `null` case.
- `transformMemberWord` -- methods, static methods and properties. For es6 it
  is the identity; every other target reserves the word in both positions, so
  for those it is `transformWord` unchanged.
- `transformWord` -- unchanged behaviour for everything else, minus the es6
  `null` case that moved into `transformBindingWord`.

The member sites are `createStaticMethod` and the property branch of
`defineVariable` in `RangerAppWriterContext.rgr`, `r.funcdesc` in
`RangerAppFunctionDesc.rgr`, and the three/two `m.compiledName`
assignments in `ng_FlowWork.rgr` and `RangerFlowParser.rgr`.

Fixture, compiled to es6 and run by node:

```ranger
class MKw {
  def class:int 1
  def default:int 2
  fn function:int (function:int) {
    def new:int function
    return (new + this.class + this.default)
  }
  fn delete:int () { return (this.function(3)) }
}
```

```js
class MKw  {
  constructor() { this.class = 1; this.default = 2; }
  function (_function) {
    const _new = _function;
    return (_new + this.class) + this.default;
  };
  delete () { return this.function(3); };
}
```

Members keep their names; the parameter and the local are renamed. `node
--check` accepts it and it answers 6.

### Why the local run said PASS and CI said FAIL

This is the part worth keeping. `engine_module.cjs` is a build artifact, and
`buildEngineModuleIfNeeded` in `tests/runtime-conformance.test.ts` rebuilt it
only when one of four `.rgr` files under `migrate/src/` was newer than it. The
COMPILER was not in that list. So after any compiler change the module was
judged up to date, and the suite measured the engine built by the PREVIOUS
compiler -- it passed locally for exactly the same reason `scripts/build-engine-module.sh`
already carries a comment about a stale `.cjs` reading as success. CI builds
the module fresh on every run and caught it in seven seconds.

`bin/output.js` and `compiler/Lang.rgr` are now in that dependency list. Any
test that consumes a build artifact needs the tool that produced it among its
dependencies, or the gate measures the wrong thing and reports green.

### Verification

- Self-host reaches a fixpoint (gen2 == gen3) and `node --check` reads it
- `runtime-conformance.test.ts`: 2,215 of 2,215 pass, from a module rebuilt by
  the fixed compiler
- The keyword fixture above compiles, parses and runs on node
- Repo-wide: no es6 output renames a member any more; before the fix
  `engine_module.cjs` had `_null` at 12 sites and `_function` at 2
- `scripts/suite_matrix.sh`: 72 pass, 5 fail, 9 excluded, and
  `scripts/suite_baseline_diff.sh` against the pre-fix compiler says
  regressions=0 pre-existing=5 -- the same five files as before
- `scripts/fmt_parity.sh` against the compiler from before the formatter work:
  every target byte-identical under `-format=none` except the two already
  documented there (C++ 44 lines of `rg_ordered_map`, Python 20 lines of #78)
- `tests/fixtures/format_members.rgr` and three cases in `format.test.ts` pin
  the split: members keep their names, the parameter and the two locals are
  renamed, `node --check` accepts it, and it answers `6 1 2`

## Issue #81: `(expr).field` does not resolve as a call argument

**Status:** open. Found while fixing #80, which is a different defect in the
same shape.

### Reproduction

```ranger
class NodeA {
  def plain:int 7
}
class HolderA {
  def n:NodeA (new NodeA())
  fn nodeOf:NodeA () {
    return n
  }
}
class ArgMain {
  sfn id:int (v:int) {
    return v
  }
  sfn main:void () {
    def h:HolderA (new HolderA())
    def ok:int ((h.nodeOf()).plain)               ; compiles
    def bad:int (ArgMain.id((h.nodeOf()).plain))  ; Undefined variable .plain
  }
}
```

The two lines differ only in whether the property read is an initialiser or an
argument.

### Not a keyword problem

`.plain` fails exactly as `.async` does. This is unrelated to `reserved_words`
and unrelated to #80 — it is the resolution of the dot-tail itself.

### Cause

`(expr).field` is parsed with the field as a dot-prefixed tail vref, and
`RangerFlowParser.WalkNode` has a branch that rewrites that pair into a
`property` expression. Instrumenting that branch shows it is reached for the
initialiser and never for the argument, so the tail stays an unresolved
`.field` vref and the "Undefined variable" check fires on it later.

### Workaround

Bind the receiver first, which is the same workaround Issue #63 needs:

```ranger
def n:NodeA (h.nodeOf())
def bad:int (ArgMain.id(n.plain))
```

## Issue #79: a Rust method returning `this` returns a clone, so a chain mutates copies

**Status:** open. Found while testing chain formatting
([`PLAN_FORMAT.md`](docs/plans/PLAN_FORMAT.md) phase 3) — the fixture chains six calls and
Rust was the one target that printed the wrong number.

### Reproduction

```ranger
class Acc {
  def n:int 0
  fn bump:Acc () {
    n = n + 1
    return this
  }
}
class RbMain {
  sfn main:void () {
    def a:Acc (new Acc())
    a.bump().bump().bump()
    print ("" + a.n)
  }
}
```

| Target | Answer |
| --- | --- |
| JavaScript | 3 |
| Python | 3 |
| Go | 3 |
| **Rust** | **1** |

### Cause

`return this` is emitted as `self.clone()`:

```rust
  fn bump(&mut self) -> Acc {
    self.n += 1;
    self.clone()
  }
```

The first `bump()` mutates `a`. It then hands back a copy, and the second and
third `bump()` calls mutate that copy, which is dropped. The count reaches 1
and no one is told.

`Acc` is not detected as shared here — nothing aliases it — so it is emitted as
a value struct, and a value struct cannot return itself by reference from a
`&mut self` method. The shared-class path (`Rc<RefCell<T>>`, the default since
PLAN_RUST_OWNERSHIP 2b) is the one that could, and the sharing analysis does
not currently count "returns `this`" as a reason to treat a class as shared.

### Why it matters more than most

It is silent. There is no compile error, no warning and no panic — the program
runs and prints the wrong number. The shape that triggers it is the builder
pattern, which is the single most common reason to return `this` at all, and
it is what `gallery/vela`'s chart API is built on.

### Note

This is not a formatting defect and phase 3 did not cause it: a copy of the
pre-change compiler produces the identical output. It was found because chain
breaking needed a chain to test, and the fixture was run rather than only
inspected.

## Issue #78: a Python method renamed at its declaration was called by its old name

**Status:** fixed.

### Reproduction

```ranger
class LcRow {
  def cells:[string]
  fn str:LcRow (k:string v:string) {
    push cells (k + "=" + v)
    return this
  }
}
```

compiled with `-l=python` declares

```python
  def _str(self, k, v):
```

because `str` is a Python builtin and the `python` block of `reserved_words`
renames it — and then writes the chained call as

```python
  r._str("region", "North").str("category", "Hardware")
```

The first call is renamed; every call after it in the chain is not. The
program raises at runtime:

```
AttributeError: 'LcRow' object has no attribute 'str'. Did you mean: '_str'?
```

### Cause

`RangerPythonClassWriter.CreateCallExpression` wrote `method.vref` — the name
as it appears in the Ranger source. Every other writer resolves the same thing
through `node.fnDesc.compiledName`, which is where the rename lives:

```ranger
def methodName method.vref
if ((!null? node.fnDesc) && ((strlen node.fnDesc.compiledName) > 0)) {
  methodName = node.fnDesc.compiledName
}
```

The first call in the chain came out right because it reaches the writer by a
different path.

### Why it went unnoticed

It needs a method whose name is a Python builtin AND a call to it in a chain.
`reserved_words` has 100 entries for Python, so the declaration side has been
right all along, and the failure is a runtime `AttributeError` in generated
Python rather than anything the compiler reports.

It was found by the phase-3 fixture in `tests/fixtures/format_longchain.rgr`,
which chains `str` six times — written to test chain breaking, not renaming.

### Effect on output

20 lines across `gallery/vela/src/VlChart.rgr`, all of them `.str(` becoming
`._str(`. `scripts/fmt_parity.sh` reports Python as the one target that
differs from a pre-fix baseline, and says why.

## Issue #77: `npm test` ran one of its eighty-three test files

**Status:** fixed. Found while trying to verify the formatter change
([`PLAN_FORMAT.md`](docs/plans/PLAN_FORMAT.md)), which is the only reason it was found at
all — the summary line does not look like a failure.

### What it looked like

```
 Test Files  1 failed (83)
      Tests  5 failed | 1 passed (6)
     Errors  1 error
```

Read quickly, that is a suite of 83 files with one failing. It is not. Six
tests ran in total; 82 files never started. The `Errors 1 error` line is the
whole story:

```
Error: [vitest-worker]: Timeout calling "onTaskUpdate"
```

### Cause

`tests/vitest.config.ts` already carries the explanation, written for three
other files:

> each shells out to compilers for a minute or more, and a single file that
> long starves the reporter under singleFork — the run then stops with
> `Timeout calling "onTaskUpdate"` and the files after it never run

`es-conformance-targets.test.ts` is worse than any of them: it compiles a
45,000-line interpreter plus a 2,138-probe corpus once per target, builds two
native binaries and evaluates 2,138 pieces of JavaScript in each. Its own
config, `tests/vitest.esconformance.config.ts`, says so in as many words —
*"Out of the default run for the same reason as vitest.tsengine.config.ts"* —
and gives it a 3,600,000ms timeout against the default config's 30,000.

But nothing ever added it to the default config's `exclude` list. The intent
was written down twice and never acted on once.

### Effect

Every `npm test` since the file landed has reported on `es-conformance-targets`
and nothing else. Its five failures were also an artifact in part: under the
default 30-second `testTimeout` the Go and C++ legs cannot finish a build, so
they time out where their own config would let them run.

### Fix

One line in the exclude list, plus the comment saying why. `npm run
test:esconformance` runs it under the config built for it.

### Worth noting

A suite that stops early is indistinguishable from a suite that passes, if the
only thing read is the exit code — and it is nearly indistinguishable from a
suite with one failure, if the only thing read is the summary. The signal that
gives it away is the file count not matching the test count.

## Issue #76: A Ranger name that is a keyword of the target emits a file the target cannot parse

**Status:** fixed for every target whose parser is installed here (JavaScript,
C++, Go, Rust, Python). Dart, Kotlin, Swift and C# are UNCHECKED, not clean.
Found while measuring formatter output for
[`PLAN_FORMAT.md`](docs/plans/PLAN_FORMAT.md).

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

### It was not a Go defect

The Go list being 2 entries long suggested the tables had been filled in as
errors were hit rather than from any language's keyword list. So rather than
hand-listing Go's 25, `scripts/reserved_probe.py` was written to ask the
question of every target: for each keyword of the language it compiles a Ranger
program naming a local, a parameter, a property and a method after it, and
hands the output to that target's own parser.

| Target | Broken | Of | Note |
| --- | --- | --- | --- |
| **JavaScript** | **41** | 46 | there was no `es6` block at all |
| C++ | 25 | 85 | behind 56 existing entries |
| Go | 20 | 25 | the one this issue was filed for |
| Rust | 2 | 41 | `crate` and `super` — the writer spells every other keyword `r#kw`, and those two cannot be raw identifiers |
| Python | 0 | 37 | 100 entries; the one table that was complete |
| Dart, Kotlin, Swift 6, C# | ? | 230 | **UNCHECKED — no parser installed** |

JavaScript is the compiler's own primary target, and `def new:int 1` emitted
`const new = 1`. It had been broken longer than Go and by more.

### Fix

Data, in the `reserved_words` block of `compiler/Lang.rgr`, plus one code
change: `null` cannot be listed there at all — the Ranger parser reads it as a
literal rather than a name, so the `word transform` pair does not parse — and
it is renamed for JavaScript in `transformWord`, beside the C# and Dart cases
already there for the same reason.

The blast radius was measurable exactly, because the compiler self-hosts to
JavaScript: rebuilding it with the new `es6` block changed **4 lines**, all of
them the source edit itself. The compiler's own sources use none of the 40
names. `scripts/fmt_parity.sh` confirms the same for `gallery/invaders` and
`gallery/vela` across eleven targets.

### What is still open

The four unchecked targets. The probe reports them as UNCHECKED on every run
rather than passing them, so the gap is visible rather than assumed closed;
running it where a Dart, Kotlin, Swift or C# toolchain exists would close it.
That matters most for Dart and C#, whose blocks (60 and 74 entries) are large
enough to look finished and were built the same way as the Go one.

## Issue #75: A trailing block on a `class` is taken for the class body, so the real body is never analysed

**Status:** partially fixed. The `doc { … }` case is gone: `DetachDocBlocks`
(`compiler/RangerFlowParser.rgr`) removes a documentation tail from the
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
(`compiler/RangerLispParser.rgr:64`, `skip_space`), so `} doc { … }` on the closing
line stays inside the `class` expression and adds two more children to it.

`EnterClass` (`compiler/RangerFlowParser.rgr:2891`) then takes the class body as the
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
Ranger source, `compiler/CodeNodeCompilerExtensions.rgr:402`, is:

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
`Compiler.rgr` and copying the result over `bin/output.js` — the obvious
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

`RangerFlowParser.rgr`. The two body forms go through `markParentClass`,
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
