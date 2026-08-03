# Changelog

All notable changes to the Ranger Compiler will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Syntax test app, compiled to every target and measured** — `tests/syntax_app/` holds one Ranger program that uses 203 of the 207 core operator names of `compiler/Lang.rgr` — every one of them except the four that do not work — together with classes, inheritance, method override, `extension`, `record` in both of its construction forms, `Enum`, a plain `trait` and a generic `trait @params`, lambdas in five positions, optionals, the four buffer types, custom operators (macro, direct template with a `*` fallback, `*` and `+` overloaded on a class, an Enum matcher, a block operator, an `operator type:` block) and the collection methods of `lib/stdlib.rgr`. `npm run test:syntaxapp` compiles the app — and each of its twelve sections on its own, so a rejected section does not hide the others — to all fourteen targets the CLI accepts, then builds and runs the output with `node`, `tsc`, `go`, `python3`, `rustc`, `g++`, `javac`, `php` and `lli` and compares what each one printed with the output of the reference target.

  The result is a matrix asserted against `tests/syntax_app/target_matrix.json`. The comparison is two directional: a target that gets worse and a target that gets better both fail until the record is updated with `npm run test:syntaxapp:update`, so an improvement is recorded rather than lost. `tests/syntax_app/TARGET_REPORT.md` is the readable form, with the operators each target could not match and the first failure of every cell that is not green.

  Writing the app surfaced seventeen defects, each pinned by a short program in `tests/syntax_app/gaps/` that the test compiles on every run so that a fix cannot pass unnoticed: `last_index` expands to the unparenthesised `(array_length x) - 1` and never compiles; `make` drops its fill value on ES6 and prints `undefined`; `nullify` does not count as a mutation, so the JavaScript writer emits `const` and the program throws; `empty` cannot be assigned to a typed optional; the elvis operator is documented as infix and is not; `for` takes neither an array of arrays nor — on the Go target — an array of objects; an array of function values cannot be declared; inheritance is one level deep and a subclass constructor calls `super` with the parameter names of the base; strings have no ordering operators and no `string + boolean`; `[T].has` in `lib/stdlib.rgr` calls `indexOf` without a receiver; `[T].contains` does not bind its block parameter; Go compiles `if!` with one block without negating it; and the Python writer emits nothing under `def` for an empty method body. They are written up in `tests/syntax_app/known_gaps.md`.
- **The Go `jpeg_scaler` writes the reference image, byte for byte** — running the Rust conformance gate against Go surfaced two writer faults and the target's `to_int` gap, all three now fixed: **double literals were emitted as source slices** (the Go writer's `WriteScalarValue` Double case called `node.getParsedString()`, which re-reads the source file at the node's recorded position — under macro-shifted positions the slice lands on unrelated bytes, so `1.0` came out as fragments of neighbouring lines and the generated program did not parse; the case now formats `double_value`, with a `.0` suffix on whole values so Go types them as `float64`); **the `for`-loop item binding was dropped when the body only used a field path** (`go_for_bind` asks `treeReferencesVRef` whether the loop body mentions the item, and the walk never matched a namespaced path's root — a body reading only `tag.tagName` was judged not to reference `tag`, so the binding line was omitted and `go build` stopped at `undefined: tag`; the walk now matches the first segment of any `ns` path); and **`to_int` truncated on Go** where the reference targets floor — same fault as the Rust one above, fixed the same way: `int64(…)` is now `int64(math.Floor(…))`. With the three fixes the Go build of `gallery/pdf_writer/src/tools/jpeg_scaler.rgr` is byte-identical to the ES6/C++/Rust image at both test sizes, making four targets that agree to the byte; timed on the same machine the Go binary lands within ~1.2× of the two ahead-of-time natives (C#, Swift, Kotlin and Scala still truncate `to_int`; recorded in PLAN_RUST_OWNERSHIP.md). Regression coverage in `tests/codegen-go-writer.test.ts`

- **JSON for the Python and the Rust target** — `lib/JSON.rgr` declared no `python` and no `rust` template in any of its operator blocks, and `systemclass JSONDataObject` / `JSONArrayObject` / `JSONValueUnion` named no type for either target. A template block is part of the match, so the absence was not a fallback to some generic form: every program that touched a JSON object stopped in the type check with `Could not match argument types for json_object`, and `@serialize(true)` could not work on either target. The [FAQ answer on `toDictionary` / `fromDictionary`](https://terotests.github.io/Ranger/docs/faq/#how-do-i-write-an-object-to-json-and-read-it-back) showed that message in place of the Python and the Rust tab. Both targets now hold `print`, `getStr`, `getInt`, `getDouble`, `getBoolean`, `getObject`, `getArray`, `keys`, `isArray`, `asArray`, `getValue`, `array_length`, all six `set` variants, `push`, `json_object`, `json_array`, `from_string` and `to_string`, and `lib/stdlib.rgr` holds the union `case` for both:

  - **Python** maps the three shapes onto `dict`, `list` and `object`, and reads and writes the text with the `json` module of the standard library. A getter is an inline lambda that checks the type of the value, so no polyfill is needed: `getInt` rejects a `bool`, because `bool` is a subclass of `int` in Python and `{"ok": true}` must not read back as an integer.
  - **Rust** has no JSON type in the standard library, and the target writes code that `rustc` builds with no crate. The compiler adds the enum `RJson` as a polyfill, together with a reader and a writer for the text. A JSON object is a `std::collections::HashMap<String, RJson>` and a JSON array is a `Vec<RJson>`, both spelled in full so that the output needs no `use` line. The trait `RJsonValue` converts an argument of the union type `JSONArrayUnion` to the variant that fits it, which is what `push` and the `set` of a union value need.

  `tests/fixtures/json_ops.rgr` builds an object, writes it as text, reads it back and reaches every value in it. `tests/compiler-json.test.ts` runs the generated program on JavaScript, on Python and on Rust and compares the three outputs, so a missing template can not pass as a compile-only success. `tests/compiler-serialize.test.ts` adds `python` and `rust` to the target list and runs the round trip of `serialize_roundtrip.rgr` — nested object, object array and object hash — on both

- **The flag-on Rust `jpeg_scaler` writes the reference image, byte for byte** — the last divergence of the conformance gate was hunted with staged instrumentation (per-block reader positions, then per-stage checksums: decoded pixels, scaled pixels, code tables, quantized coefficients, bits written), each round fixing the first stage where the Rust run left the ES6 run. Every fault was a compiler fault, and three sat in the flag-off Rust writer all along: **`clear` was silently dropped from every Rust program** (the template said `rust ( custom )` where the dispatcher expects `( (custom _) )`, and the handler behind it emitted JavaScript `.length = 0;` — a re-parsed Huffman table therefore kept its old symbols, which was the two AC-refine decode errors); **a pre-evaluated mutable argument was never written back** (the borrow-conflict path cloned `self.dcYCodes` into `__arg_2`, passed `&mut __arg_2` and dropped the result, so the encoder ran with empty code tables); and **`to_int` truncated on Rust where JS, C++, Python and PHP floor** — the two differ on every negative quotient, exactly the encoder's quantization of negative coefficients (C#, Go, Swift, Kotlin and Scala still truncate; recorded in PLAN_RUST_OWNERSHIP.md). The sharing analysis also learned to see a local defined inside a while or an if body (the function-level lookup cannot; the walk now resolves through the node's own desc), the `at` macro's paren-wrapped expansion, `for`-loop iteration variables, and raw `new` pushes into shared-element vectors. Verdict on the program: 16 `value` classes, 6 shared — exactly the codec's mutable state. Final run: 0 decode errors, 1434621 bits written = the ES6 count, 180280 bytes out, `md5` equal to the C++ image. The wrong-image fault of PLAN_CODEGEN_OWNERSHIP is closed on Rust under the flag

- **The Rust flag survives its first conformance gate, and the gate paid for itself** — `-rust-shared-classes` was run against `gallery/pdf_writer/src/tools/jpeg_scaler.rgr`, the largest program in the repository, with the C++ image (byte-identical to the ES6 image) as the reference. Six real faults surfaced and are fixed: a constructor field initializer of a shared class was not wrapped; a self-referential field kept its `Box` where the `Rc` already provides the indirection, in the type, the assignment and the unwrap; `push` through a cell borrowed shared where a write needs `borrow_mut` (the first operand of every mutating operator now carries the LHS flag through the template engine); and three holes in the sharing analysis itself — the short form `return dcTable0` was not read as returning stored state, the `at` operator is a macro whose expansion hides `itemAt` behind an extra pair of parens, and mutation through a call argument (`decodeDCFirstBlock(reader buf …)` mutates `buf`) was invisible until `computeSharingMutations` propagated per-parameter mutation through call chains to a fixpoint. The two `__self_rc` edges are closed too: the hidden parameter is transitive through self-calls, an unnameable receiver is a compiler error that says to bind the receiver first, and an assignment whose right side reads a shared cell pre-evaluates it (`a.name = c.name` with `c` an alias of `a` used to panic `RefCell already borrowed`). The decoder's verdict is 18 `value` classes and 4 shared — exactly its mutable state — and the run went from 4332 Huffman decode errors and a 625-byte image to 2 errors and 8413 bytes, `rustc` clean, with every flag-off output still byte-identical. What remains is bit-level: two symbols across two progressive AC-refine scans, recorded in PLAN_RUST_OWNERSHIP.md; the flag stays experimental until that closes

- **Returns, optional fields and element reads follow a shared class on Rust** — the remaining produced-or-consumed surfaces of `-rust-shared-classes`: a shared class in a return position hands out the `Rc` (`writeRustReturnType`), a strong optional field is `Option<Rc<RefCell<T>>>`, a call result or strong-optional unwrap that already carries an `Rc` is taken as one, and the sharing analysis learned the two events that make those surfaces matter — a named value stored into any object graph, and a function that returns stored state (`return (itemAt items 0)` hands the caller an alias of the stored element). A field read now borrows shared while a write or a method receiver borrows mutably, so two reads of one cell can overlap — the aliasing probe used to panic with `RefCell already borrowed` and now prints `yy`, the same as the ES6 output: store an object into a list and an optional field, read it back through two getters, mutate through one name, and every name sees the change, on Rust. The jpeg verdict is unchanged (21 of 22 classes `value`), and without the flag every output stays byte-identical

- **`weak` works on Rust for the first time, behind `-rust-shared-classes`** — the two gaps between the flag and the parent–child program are closed. A method of a shared class that uses `this` as a value takes a hidden first parameter `__self_rc : &Rc<RefCell<T>>` and every call site passes the receiver's Rc alongside the `borrow_mut()` (safe: the callee only clones or downgrades the Rc, it never borrows the cell again), so `c.parent = this` emits `Some(Rc::downgrade(__self_rc))` — a live back reference where the old output built a fresh cell around a copy of self, dead on arrival. A collection of a shared class carries `Rc<RefCell<T>>` elements (`kids:[Child]` → `Vec<Rc<RefCell<Child>>>`), and a weak read upgrades to the Rc itself with no second cell and no `RefMut` type error. The parent–child program of the docs — adopt, then read the parent's name back through the child's weak field — compiles with `rustc`, runs, and prints what the ES6 output prints. That is finding 4c of PLAN_CODEGEN_OWNERSHIP, open since the ownership work began. Without the flag every Rust output stays byte-identical; what the flag does not cover yet is listed in PLAN_RUST_OWNERSHIP.md

- **A shared class can be `Rc<RefCell<T>>` on Rust, behind `-rust-shared-classes`** — the experimental other half of the sharing analysis: every field, parameter and local of a class the analysis marks shared takes the `rust_needs_rc_wrap` mode the writer already had for weak-wrapped values, and a def whose initializer is already `Rc<RefCell<T>>` now clones the Rc instead of wrapping a second cell around it — `def b:Counter a` is the language's aliasing form, and both names must reach one cell. The program the docs define the object model with (`def b:Counter a` … `b.add(1)`) compiles with `rustc` for the first time and prints `a 1`, the same as every other target. Without the flag every Rust output is byte-identical to before. What still stands between the flag and the parent–child `weak` program is documented in PLAN_RUST_OWNERSHIP.md: `this` as a value inside a shared class (the `shared_from_this` question in Rust form) and collection element types following the class

- **The compiler names the classes that need reference semantics on Rust** — `analyzeClassSharing` (`ng_StaticAnalysis.rgr`) runs after the ownership fixpoint and decides, per class, whether some object of it is ever aliased and held: a parameter of its type `moved`/`shared`, an alias a name then mutates through, a stored object read into a mutated local, or the target of a `weak` field. `-strict-ownership` prints the verdict per class (`ownership[rust] class Counter -> Rc<RefCell> (aliased and mutated in main)` / `-> value`) on every target. Measured on `gallery/pdf_writer/src/tools/jpeg_scaler.rgr`: 21 of 22 classes stay `value`, and the single exception — `BufferChunk`, a linked-list node aliased from a field into mutated locals — is precisely the pattern the Rust struct model breaks on. No output of any target changes; this is the diagnostic half of PLAN_RUST_OWNERSHIP step 2, staged the same way the C++ `const&` work was

- **Rust reads the ownership summary: a proven-borrowed object parameter is `&T`** — the immutable-borrow marking had always excluded object types, because nothing proved where such a parameter went, so every read-only object argument paid a whole-struct `#[derive(Clone)]` copy at every call. The interprocedural summary now proves it (`borrowed` = no store into any graph, no return, no storing callee down the chain), and the mutation pass already guards the rest, so `applyOwnershipToRustBorrows` (`ng_StaticAnalysis.rgr`, run for the rust target in `VirtualCompiler.rgr`) upgrades such a parameter to the `&T` mode the writer already has. `fn sumValue(…, mut a : Node, mut b : Node)` called as `sumValue(root.clone(), child.clone())` becomes `fn sumValue(…, a : &Node, b : &Node)` called as `sumValue(&root, &child)`. On `gallery/pdf_writer/src/tools/jpeg_scaler.rgr` the removed clone sites are the ones inside the pixel loops (`setPixel(x, y, c.clone())` → `setPixel(x, y, &c)`); `rustc -O` accepts the output before and after, and the binary writes a byte-identical file. A `moved` or `shared` parameter keeps the owned mode. PLAN_RUST_OWNERSHIP.md holds the measurements and the staged next step — the Rust object model itself, which is what still makes an object a value on Rust and a reference on the other eleven targets

- **Interprocedural ownership summaries (the "Phase B" the code comments promised)** — an argument passed to a resolved call is no longer undecidable: the pass records a pending edge per (caller parameter, callee, argument index) and `resolveCallEscapes` runs the edges against the callee summaries to a fixpoint. A parameter handed down a chain of read-only functions stays `borrowed` — which is what keeps the `const&` win on real programs — and `k.adopt(p)` where `adopt` stores its parameter now reads `moved (call adopt.p)`. Escalation is monotone (`borrowed` → `moved` → `shared`, or → `unknown` when the callee itself cannot be decided), so the fixpoint terminates; a recursion cycle of readers stays `borrowed`. Measured on `gallery/pdf_writer/src/tools/jpeg_scaler.rgr`: 110 functions, 256 of 256 parameters decided (254 `borrowed`, 2 buffer parameters the decoder really does store into `this.data`), zero warnings — before, the same program printed one warning, and it was the `blockIdx` false positive below. What stays open is documented in PLAN_OWNERSHIP_SOUNDNESS.md: a two-step escape through a local collection, an argument passed to a received lambda, a receiver stored via `this`, and a meet over virtual overrides

### Fixed

- **The borrowed `const&` parameter could alias the storage the callee mutates (C++)** — the ownership inference turns a `borrowed` object parameter into `const std::shared_ptr<T>&` (3.3.1). `borrowed` means the parameter does not escape the callee; it does not mean the caller's argument expression names storage that stays put. Passing a member field bound the field itself, so a callee that reassigned the field read the new object where every reference-semantics target reads the call-time one, and passing a member-collection element was a use-after-free once the callee grew the collection (AddressSanitizer: `heap-use-after-free`, in a program whose callee only reads its parameter and pushes one element to a member list). The signature keeps `const&`; the call site now decides: a local, a parameter, `this`, or a fresh temporary binds directly, and any other argument — a field, a collection element, an `unwrap` of either — is wrapped in a call-time copy `std::shared_ptr<T>( … )` that pins the object for the whole call (`cppNeedsCallTempCopy` in `ng_RangerCppClassWriter.rgr`, applied in `writeFnCall` and `writeNewCall`). The `jpeg_scaler.rgr` output is byte-identical before and after — no call site there passes a field to a borrowed parameter — and `tests/fixtures/ownership_alias_call.rgr` holds the aliasing case: JS and C++ now print the same text, and the ASan run is clean

- **The ownership inference missed most of the escape forms it claimed to see** — five separate holes in `walkForEscapes` (`ng_StaticAnalysis.rgr`), each one classifying a stored parameter as `borrowed`: the value of a `set`/`put` was read from child 2, which is the key (`set slots "x" p` escaped the string `"x"`, not `p`); the short form of a member store (`last = p`) was not counted while the long form (`this.last = p`) was; a store through a local alias (`def q p` … `this.last = q`) was invisible; so was a store behind `unwrap`; and the escape-via-call marking only understood the normalized `(call …)` node, which at analysis time exists for almost no real call — measured on `gallery/pdf_writer`, the only parameter it ever flagged was `blockIdx:int`, a primitive that can never carry ownership, flagged because `buf.get(…)` collides with the system name `get`. All five are fixed; the walk now reads the same `has_call` / `hasFnCall` / `hasNewOper` shapes as `walkForTransitiveWeak`, and a primitive argument is never flagged. `tests/fixtures/ownership_escape_forms.rgr` asserts each form

- **The `@serialize(true)` reader needed a lambda** — the generated `fromDictionary` read an object array and an object hash with `arr.forEach({ ... })`. The callback is the one construct that neither the Python nor the Rust writer emits: Python got a multi-statement `lambda` (`SyntaxError`) and Rust got the JavaScript arrow form (`expected one of ), ,, ., ? or an operator, found =>`). `ng_RangerSerializeClass.rgr` now writes an index loop over `array_length` / `getValue` for an array and over `keys` / `itemAt` for a hash. The loop uses the operators that every target already declares, so the reader no longer depends on the callback support of the target. A side effect on the JavaScript output: `fromDictionary` is no longer `async`, because the callback was what marked it so — `await` on the return value still works, and `dist/api.d.ts` states `T` in place of `Promise<T>`

- **`try { } { }` wrote JavaScript for the Python and the Rust target** — neither had a template, so both fell through to the `*` form and the output held `try { ... } catch(e) { }` verbatim. Python now writes a `try:` / `except Exception:` statement, and each suite opens with `pass` because a generated catch block is often empty and a Python suite needs a statement. Rust has no exceptions, so the compiler writes the try block and states in a comment that it does not write the catch block

- **The Rust file header sat after the first `use` line** — the writer put `#![allow(unused_parens)]` and the four other inner attributes into the class content, while an `(imp "...")` from an operator template writes its `use` line into the import slice, which is ahead of the content. An inner attribute has to precede every item of the file, so `rustc` rejected the output of every program that used a hash map with `an inner attribute is not permitted in this context`. The header now goes into the `before_imports` slice

- **A Rust systemclass reached the output under its Ranger name** — `writeTypeDef` and `getObjectTypeString` in `ng_RangerRustClassWriter.rgr` did not read `systemNames`, so a `JSONDataObject` parameter compiled to `dict : JSONDataObject` and `rustc` saw an undeclared type. Both now name the type that the systemclass declares for `rust`

- **`get` on a Rust hash map gave `Option<&T>`** — the operator is typed to give an optional `T`, and `HashMap::get` hands back a reference and takes one, so `scores.get("Alice".to_string())` did not compile at all. The template is now `get(&key).cloned()`

- **A Rust hash field was constructed as `None`** — the constructor of a class initialized an array field with `Vec::new()` and an optional field with `None`, and a hash field fell into the second branch, so a `[string:T]` field made `rustc` report `expected HashMap<String, T>, found Option<_>`. A hash field now takes `HashMap::new()`

- **A Python class field with no value read an undefined attribute** — `writeVarInitDef` wrote `self.one` with no assignment for a field that is neither an array nor a hash, and the constructor raised `AttributeError` the first time the class was used. The field now takes `None`, as a local variable already did

- **A Python `(typeof N)` template wrote the Ranger type name** — the Python writer inherited the generic `writeTypeDef`, which writes `node.type_name`, so the union `case` produced `isinstance(item, JSONDataObject)` in place of `isinstance(item, dict)`. The Python writer now maps the built-in types and reads `systemNames`

### Known gaps closed

- **Python has no JSON support at all** (listed under 3.3.1) is closed by the entry above. The lambda gap of the `operator type:[T]` block stays open: `.map()`, `.filter()` and the other callback operators still emit a multi-statement Python lambda. The `@serialize(true)` reader no longer depends on that support

## [3.3.1] - 2026-08-01

### Fixed

- **A recursive macro hung the compiler with no diagnostic** — macro expansion renders the template to Ranger source and walks the result again (`buildMacro` + `WalkNode` in `ng_parser_std_match2.rgr`), so an expansion that reaches the same call site again never terminates. Unguarded this was not a stack overflow and not an error: the compiler simply never returned, and had to be killed. The root context now carries an `active_macros` map; re-entering a call site already being expanded fails immediately:

  ```text
  [FAIL] Macro expansion of operator 'selfmac' is recursive: expanding it
         reaches the same call site again, so it never terminates.
  ```

  The key is the operator name **plus the source position**, never the name alone. `if ... else` and `if!` are themselves macros that emit `if` — they lower to the three-argument `if`, which is not a macro — so a nested if/else legitimately re-enters the same operator while the outer expansion is in flight. A name-keyed guard would reject nearly every real program, the compiler's own source included. A depth ceiling of 512 remains as a backstop for a cycle that keeps producing fresh positions and so never repeats a key.

  For the same reason there is no static "does this macro name itself" check: self-naming macro templates are legal, so such a check is false-positive by design. `tests/macro-recursion.test.ts` covers the direct cycle, the indirect one (`macA` → `macB` → `macA`) and the legitimate nested-if case, with explicit timeouts because a regression here would hang the suite rather than fail it

- **Two `to_string (value:int)` operators, one of them dead and the other emitting `to_int`** — `Lang.rgr` declared the same signature twice. The first (`to_string _:string`) wins every match, which the second (`to_string cmdIntToString:string`) shadowed entirely: `cmdIntToString` appears nowhere else in the tree, and removing the block leaves the emission for go, csharp, es6, python, cpp, rust, kotlin and swift6 byte-identical. The winning block's `ranger` template emitted `(to_int x)` rather than `(to_string x)` — a copy-paste error, not a deliberate lowering: `to_int` has no `(value:int)` variant at all, so the rendered Ranger would not type check. `ranger` templates are not confined to a Ranger-to-Ranger build: `ng_LiveCompiler.rgr` forks a context with `targetLangName = "ranger"` to render expressions back to Ranger source for polyfill identity, so they run during a normal compile to any target

- **Python had no template for nine operators** — `M_PI`, `fabs`, `tan`, `random` (both variants), `wait`, `file_exists`, `dir_exists` and `create_dir` could not compile for the `python` target. Added, and verified by running the generated Python rather than only compiling it (`tests/compiler-python.test.ts`), which the environment allows for Python but not for Kotlin or Swift

### Known gaps (Python)

- **Every operator taking a lambda emits invalid Python** — `.map()`, `.filter()`, `.reduce()`, `.find()`, `.count()`, `.groupBy()` and the newly added `.any()` / `.all()` compile successfully for `python` and then fail at runtime with `SyntaxError: invalid syntax`. The backend emits the Ranger callback body as a multi-statement Python `lambda`, and a Python lambda holds a single expression:

  ```python
  out = operatorsOf.map_2(a, lambda item:
    return item * 2;          # SyntaxError
  )
  ```

  Pre-existing and independent of the operators added above. Fixing it means hoisting callback bodies into named functions in `ng_RangerPythonClassWriter.rgr` — a codegen change, not a template. Until then, treat the `operator type:[T]` block as unavailable on Python

- **Python has no JSON support at all** — 0 of the 34 operator template blocks in `lib/JSON.rgr` declare `python`, and `systemclass JSONDataObject` / `JSONArrayObject` declare no Python type, so `@serialize(true)` cannot work there. Unlike C++ and Rust, Python has an obvious representation (`dict` / `list`), so this is tractable — but it is a full JSON backend, not a template gap

## [3.3.0] - 2026-08-01

### Added

- **`.any()`, `.all()`, `.slice()` on arrays; `.values()`, `.map_length()`, `.get_or()` on maps** — added to `lib/stdlib.rgr` as Ranger source in the `operator type:[T]` / `operator type:[string:T]` blocks, not as per-target templates, so they compile for es6, cpp, kotlin, swift3, swift6, go and rust without a template matrix. `get_or` replaces the `has` + `get` + `unwrap` triple. Note that `map`, `filter`, `reduce`, `find`, `count` and `groupBy` already existed in this same block and already worked on all seven targets — they are method-style (`items.map({ ... })`), which is why they are easy to miss when reading `Lang.rgr` alone

- **Operator coverage audit** — `tests/operator-coverage.test.ts` fails when an operator declares a `swift3` template but no `swift6` one and no `*` fallback, which is exactly the shape that let `@serialize(true)` ship broken for Swift 6 in 3.2.0. The check is one-directional on purpose: swift6 is a primary target and swift3 is legacy, so a newer operator existing only on swift6 is correct. It also pins the count of silent `not implemented` templates at its current 30 as a ratchet that may only go down

### Fixed

- **`keys` on `JSONDataObject` had no `kotlin` template** — any hash field (`[string:int]`, `[string:Child]`) in a `@serialize(true)` class failed to compile for Kotlin. Added a polyfill mirroring the existing `java7` one over the same `org.json` API. **The emitted Kotlin has not been run through `kotlinc`** — no Kotlin toolchain in the build environment — so this needs verification before it is relied on

- **`keys` on a map had no `rust` template** — `forKeys`, and therefore the whole `operator type:[string:T]` block, failed to compile for Rust

- **Seven operators lacked a `swift6` template** — `M_PI`, `fabs`, `tan`, `wait`, `file_exists`, `dir_exists` mirror their `swift3` counterparts verbatim (`file_exists` / `dir_exists` including their `FileManager` polyfills). `create_dir` got a real implementation (`FileManager.default.createDirectory(atPath:withIntermediateDirectories:)`) rather than a copy, because the `swift3` template is an empty no-op that silently skips the operation. `switch` on a generic condition also gained `swift6`, and `buffer_alloc` gained `swift3`

- **`random` had no Swift template at all** — neither `random:double ()` nor `random:int (min max)` could compile for Swift. Added `Double.random(in:)` / `Int.random(in:)` for swift6 and `arc4random` equivalents for swift3

- **`ceil` declared `:int` but emitted floating point** — `go` emitted `math.Ceil`, `cpp` emitted `ceil`, and so on, while the sibling `floor` truncated on every target. `ceil` now matches `floor` on swift3, swift6, cpp, kotlin, csharp, go, rust and java7, and gained the `kotlin` and `swift6` templates it was missing

- **Go's SHA-256 helper was named `_r_md5`** — renamed to `_r_sha256`; it calls `sha256.Sum256`

- **`rust` was missing from the `targets {}` block** in `Lang.rgr` although it compiles

- **`fn has:boolen` typo** in the array operator block of `stdlib.rgr`

### Known gaps

- **`@serialize(true)` does not work for `cpp` or `rust`** — not a template gap: `systemclass JSONDataObject` and `JSONArrayObject` declare no C++ or Rust type at all, so these targets have no JSON representation to serialize into. Needs a design decision, not a template
- Unary minus, `range`, `min`, `abs(int)`, `round`, `pow` and `log` remain unimplemented; see [PLAN_OPERATORS.md](./PLAN_OPERATORS.md) §5

## [3.2.1] - 2026-08-01

### Fixed

- **`@serialize(true)` did not compile for Swift 6** — 3.2.0 fixed serialization on ES6/TypeScript and Kotlin, but a `@serialize(true)` class still failed on the `swift6` target, and four of the five errors landed inside the compiler's own `JSON.rgr` rather than in user code:

  ```text
  JSON.rgr:48:12          [FAIL] Unknown type:  type ID : 0
  JSON.rgr:49:1            [FAIL] Could not match argument types for getValue
  JSON.rgr:50:5           [FAIL] Invalid types for lambda call
  extension WithSer:9:10  [FAIL] Could not match argument types for case
  ```

  Three operators on the generated `toDictionary` / `fromDictionary` path had a `swift3` template but no `swift6` one, and no `*` fallback, so operator matching failed for that target only: `getValue` and `keys` (`lib/JSON.rgr`) and the union-narrowing `case` (`lib/stdlib.rgr`). Each `swift6` template mirrors its `swift3` counterpart verbatim — across the four operator files, 86 operators already declare identical `swift3` / `swift6` templates and the 13 that differ do so only for genuine Swift 3 → 6 API changes (`.characters`, `UnicodeScalar`, `Data(bytes:)`), none of which these three use.

  Reported with a three-target repro in [realtrainer `ai/RANGER_COMPILER_ISSUES.md` §D](https://github.com/terotests/realtrainer): the same two-file library compiles on ES6 and Kotlin and fails on Swift 6, isolating the cause to the annotation rather than to user code.

### Added

- **Cross-target `@serialize(true)` regression tests** — `tests/compiler-serialize.test.ts` now compiles the serialization fixtures for `es6`, `swift3`, `swift6` and `go`, plus `tests/fixtures/serialize/serialize_union_case.rgr` for the union-narrowing path. An ES6-only test cannot see a missing template on another backend, which is how this reached a release

### Known gaps (unfixed, same defect class)

- **`keys` on `JSONDataObject` has no `kotlin` template** — any hash field (`[string:int]`, `[string:Child]`) in a `@serialize(true)` class fails to compile for Kotlin with 15 errors in the generated extension. Pre-existing, independent of the Swift fix
- **Seven operators still lack a `swift6` template** — `M_PI`, `fabs`, `tan`, `wait`, `file_exists`, `dir_exists`, `create_dir` (`compiler/Lang.rgr`). All fail on `swift6` today; none is on the `@serialize` path. `create_dir` additionally needs a real implementation rather than a copy: its `swift3` template is an empty no-op

## [3.2.0] - 2026-08-01

### Fixed

- **`@serialize(true)` array / hash / property types without the annotation** — the generator assumed every referenced class had `toDictionary` / `fromDictionary` and emitted the call regardless, so the compile failed inside `extension <Class>` with `Could not match argument types for push` / `for case` and never named the real cause. Hash-valued fields were worse: the field was silently dropped from the serialized output. A `@serialize(true)` class that references a class which is neither `@serialize(true)` nor implements the pair by hand now fails at the declaration:

  ```text
  [FAIL] Parent.kids: [Child] can not be serialized - class Child is not @serialize(true).
         Add @serialize(true) to Child, or implement toDictionary / fromDictionary in it.
      9 │     def kids:[Child]
                  ^── here
  ```

- **`@serialize(true)` with mutually referencing classes** — serializer extensions were generated one class at a time and `is_serialized` was set as each was reached, so whichever class came first in the dependency sort saw its peer as non-serializable and emitted primitive element code. All `@serialize(true)` classes are now marked before any extension is generated, which mutual references could not satisfy by sorting.

- **`@serialize(true)` element types with hand-written `toDictionary` / `fromDictionary`** — accepted as serializable; the generator now routes them through the object path instead of treating them as primitives.

- **Duplicate serializer extension when one file is reached by two import spellings** — a file imported as both `Child.rgr` and `domain/Child.rgr` was expanded twice, and with `@serialize(true)` the second expansion produced `method with the same name and parameter signature declared earlier` pointing at generated code. Fixed since 3.1.1 was published, released here; covered by a regression test.

- **`SourceCode` constructed with three arguments in `ng_CodeNode.rgr`** — `SourceCode` takes a single `code_str`, but `vref1`, `vref2`, `newStr`, `newBool` and nine sibling factories passed `(name 0 (strlen name))` or `("" 0 0)`, copying the shape of the adjacent `new CodeNode(code 0 ...)`. JavaScript discards the extra arguments, so this was invisible until the TypeScript API bundle was type checked, where it produced all 13 of the `TS2554: Expected 1 arguments, but got 3` errors that `build:dist:module` reported. Dropping the dead arguments makes `tsc` clean, so the step is `&&`-chained again and a real type error blocks the build instead of scrolling past

- **`file_mtime` C++ backend** — added missing `cpp` template in `Lang.rgr` (`stat()` + ms, matching es6 `mtimeMs`); fixes `game_runtime.rgr` hot-reload compile for `game_sdl` native binary

- **`TSLexer` UTF-8 / native C++ tokenization** — code-unit length vs byte `charAt` mismatch after multi-byte characters (e.g. em dash in comments) no longer desyncs the lexer; fixes native SDL parse failures on [`invaders.game.tsx`](./gallery/game_engine/scripting/invaders.game.tsx) and similar scripts

### Added

- **LPC spritesheet compositor (standalone MVP)** — Ranger-native `gallery/game_engine/lpc/` (`png_decoder.rgr`, layer blit, male walk demo); embedded `pack/demo-male-walk` (~28 KB); `npm run engine:lpc:build` / `engine:lpc:run`; design doc [`LPC_HEADLESS_SPRITESHEET.md`](./gallery/game_engine/LPC_HEADLESS_SPRITESHEET.md)

- **JPEG background loading for scripted games** — `GameImageLoader` + `GameRunner` asset queue (`resources()`, `backgroundImage()`, `onLoading()`); `splash_demo.game.tsx` smoke test; `game.d.ts` `ResourceDef` / `LoadingProps` types

- **In-process TS hot reload (Path A)** — `TSAstPatcher` (`ts_ast_patch.rgr`), `ComponentEngine.patchScript()`, `GameRunner` runtime options (`setHotReload`, `trackScriptFile`, `maybeHotReload`); `game_sdl --hot-reload` / `--no-hot-reload`; default on for interactive SDL, off for `maxFrames` smoke runs

- **SDL + native compiled games (Path B)** — `game_sdl_native_host.rgr`, `invaders_native_sdl_runner.rgr`, `build-game-sdl-native.sh`; `npm run engine:game-sdl-native:run:invaders` runs emitter output in an SDL window without `ComponentEngine`

- **`@serialize(true)` regression suite** — `tests/compiler-serialize.test.ts` and `tests/fixtures/serialize/`: round trip over primitives, nested objects, object arrays and object hashes; mutual references; hand-written `toDictionary` / `fromDictionary`; duplicate import spellings; and the three diagnostics above

### Changed

- **`prepublishOnly` no longer runs the whole repository suite** — publishing the compiler ran all 56 test files, including the gallery, game-engine and native-toolchain suites. Those need SDL2, `g++`, Cannon and game fixtures that ship with neither the repo nor the package, so `npm publish` failed on the publisher's machine for reasons unrelated to the compiler (missing `SDL2/SDL.h`, `gallery/game_engine/games/ylos/index.tsx` and `physics_race/index.tsx` are absent from the repository entirely). `prepublishOnly` and `.github/workflows/publish.yml` now run `npm run test:publish` — 44 files, 355 tests, ~90s — covering parsing, type checking and code generation for every target backend. `npm test` still runs everything, and `ci.yml` is unchanged.

- **`build:dist` now includes `build:dist:module`** — `dist/api.js` was not rebuilt by the release build, which is how it drifted behind `bin/output.js`

- **`dist/api.js` rebuilt from current sources** — the committed programmatic-API bundle predated several compiler fixes, so `require("ranger-compiler")` shipped older behaviour than the `rgrc` CLI. `scripts/patch-chain-desugar.js` now patches `dist/api.js` as well as `bin/output.js`, and `build:dist:module` runs it after `tsc`

## [3.1.1] - 2026-06-23

### Changed

- Version bump for npm publish — recommended for cloud CI and projects that install `ranger-compiler` from npm (e.g. koodisampo) instead of a sibling `../agent/Ranger` checkout
- Default `npm test` / `prepublishOnly` skips `compiler-llvm.test.ts` (experimental LLVM/WAT backend); run `npm run test:llvm` when working on native/WASM codegen

### Added

- **IsoDate stdlib** — `lib/IsoDate/` (`DateMath`, `IsoDateParse`, `IsoCalendar`) and `lib/IsoDateLib.rgr` for portable ISO calendar dates without host `Date`; see [ai/ISO_DATE.md](ai/ISO_DATE.md)
- **IsoDate compiler intrinsics** — `iso_add_days`, `iso_compare`, `iso_between` in `Lang.rgr` (Kotlin/Java `java.time.LocalDate`, ES6 UTC-safe helper)
- **IsoDate regression** — `tests/fixtures/iso_date_ops.rgr` in Kotlin compiler tests
- **Regex stdlib** — `lib/Regex/` (`RegexMatch`) and `lib/RegexLib.rgr` for string-pattern matching without `/literal/` syntax; see [ai/REGEX.md](ai/REGEX.md)
- **Regex compiler intrinsic** — `regex_test(pattern, haystack)` in `Lang.rgr` (Kotlin/Java `Regex`/`Pattern`, ES6 `RegExp`, Swift `range(of:options:)`)
- **Regex regression** — `tests/fixtures/regex_test_ops.rgr` in Kotlin compiler tests

- **JavaScript/TypeScript source maps (`-sourcemap`)** — `SourceMapBuilder` with VLQ encoding (`compiler/ng_SourceMap.rgr`); `CodeWriter` line/column tracking, `walkNodeStack`, and `outMapped()`; embedded `sourcesContent` for `.rgr` sources; `.js.map` + `//# sourceMappingURL=` on save; statement/expression mappings via `LiveCompiler.WalkNode` walk context; expression `names` from `node.vref` / parameter names; regression `tests/compiler-sourcemap.test.ts`; README section *JavaScript / TypeScript source maps*

### Fixed

- **Source map VLQ line breaks** — `buildMappingsString` no longer resets source/original relative state on `;` (fixes DevTools breakpoints on `.rgr` sources)
- **Source map original line** — `addMappingFromNode` uses `node.getLine()` from `sp` instead of stale `node.row`
- **Kotlin `floor` / `int2double`** — `int2double` emits `.toDouble()`; reserved parameter names escaped (`val`, `object`, …)
- **`proc_send` dispatch wrapping** — turn boundaries around handler calls; `ProcessRuntime.beginDispatchTurn` / `endDispatchTurn`

## [3.1.0] - 2026-06-02

### Added

- **`ProcessUiHost` notify suppress** — `beginSuppressUiNotify` / `endSuppressUiNotify` / `isUiNotifySuppressed` for batching parent↔child sync without re-entrant UI notify loops ([PROCESS_UI_NOTIFY.md](PROCESS_UI_NOTIFY.md))
- **Process view DTO regression fixture** — [tests/fixtures/process_view_dto_assign.rgr](tests/fixtures/process_view_dto_assign.rgr) (cross-class field assignment with method call on RHS)
- **Docs** — [PROCESS_UI_NOTIFY.md](PROCESS_UI_NOTIFY.md), [PROCESS_UI_VIEW_MODELS.md](PROCESS_UI_VIEW_MODELS.md); README `@process` quick start

### Fixed

- **Parser: assignment RHS method calls** — `row.field = this.helper(index)` no longer splits the call into invalid `=` operands ([PROCESS_UI_VIEW_MODELS.md](PROCESS_UI_VIEW_MODELS.md)); fix in [compiler/ng_RangerFlowParser.rgr](compiler/ng_RangerFlowParser.rgr) (`repairAssignMethodCallRhs`)

### Changed

- Version bumped from `3.0.5` to `3.1.0`

## [3.0.5] - 2026-05-29

### Added

- **`@process` messaging** — `proc_send` operator; `receiveMessage` on `RangerProcessBase`; `find_process` / `ProcessNameRegistry.findProcess`
- **TypeScript named paths** — `-typescript` emits `ProcessPath`, `findProcess` on registry, singleton `new` returns shared instance
- **`RangerProcess.rgr` in npm lib** — included under `dist/lib/` when running `npm run build:dist`

### Fixed

- **`build:dist:copy`** — `rm -rf dist/lib` before copy so new lib files (e.g. `RangerProcess.rgr`) land in `dist/lib/` instead of nested `dist/lib/lib/`

### Changed

- Version bumped from `3.0.4` to `3.0.5`

## [3.0.4] - 2026-05-12

### Fixed

- **Installed npm package library lookup** — The published compiler now also searches `./lib` relative to the compiler binary, so locally installed `ranger-compiler` packages can resolve `stdlib.rgr` and related bundled libraries correctly
- **Virtual compiler bundled file loading** — Bundled library files are now loaded from `./lib/` inside the packaged distribution instead of assuming a development-only `../lib/` layout

### Changed

- Version bumped from `3.0.3` to `3.0.4`

## [3.0.3] - 2026-05-12

### Fixed

- **TypeScript module build path** — `npm run module` now builds through the same explicit `dist/api.ts` path that the packaged API uses, instead of generating `compiler/bin/api.ts` and relying on a stale `tsconfig` include pattern
- **CI publish verification** — Release builds no longer depend on a globally available `tsc`; the repository now declares a local `typescript` dev dependency for consistent CI behavior
- **TypeScript config compatibility** — Updated the TypeScript configuration to remove deprecated settings that broke newer TypeScript runners in CI

### Changed

- Version bumped from `3.0.2` to `3.0.3`

## [3.0.2] - 2026-05-12

### Fixed

- **Rust and Swift string method codegen** — Added missing target templates for `startsWith`, `endsWith`, `contains`, and `replace`, so `tests/fixtures/string_methods.rgr` now generates output correctly for Rust and Swift 6
- **Compiler test diagnostics** — Shared test helpers now report the actual compiler failure when a compilation does not produce an output file, instead of masking the root cause behind a generic generated-file-not-found error

### Changed

- **Release automation** — Updated the publish workflow to trigger on release publication and allow manual dispatch, making retries and release recovery less brittle
- **Release metadata** — Version bumped from `3.0.1` to `3.0.2`

## [3.0.1] - 2026-05-12

### Added

- **Kotlin union-case dispatch** — `case item oo:SomeClass` now emits correct Kotlin `is`/`as` pattern for class, boolean, int, double, and string variants (in `lib/stdlib.rgr` and `compiler/stdlib.rgr`)
- **JSON.rgr ng version** — Updated `lib/JSON.rgr` and `compiler/JSON.rgr` to ng version with Kotlin and Swift 6 templates and four typed `set` overloads
- **TypeScript README example** — Added parsing example to `modules/ts/README.md`

### Fixed

- **Kotlin ternary operator** — Emits `if (cond) a else b` form instead of JavaScript `? :` syntax (`compiler/Lang.rgr`)
- **Kotlin `indexOf`** — Emits `.indexOf(x)` method call instead of invalid syntax (`compiler/Lang.rgr`)
- **Kotlin int/int division** — Casts operands with `.toDouble()` to avoid integer truncation (`compiler/Lang.rgr`)
- **Kotlin `open fun` warnings** — `open` modifier now only emitted when a class actually has subclasses (`compiler/ng_RangerKotlinClassWriter.rgr`)
- **TypeScript `instanceof` with structural types** — `typeof` in `case` context no longer emits `instanceof Record<string,any>` for mapped types; collapses to `Object`/`Array` at runtime (`compiler/ng_LiveCompiler.rgr`)
- **npm package bin path** — Changed from `bin/output.js` to `dist/rgrc.js` so the published package contains a valid binary

### Changed

- Version bumped from `3.0.0-beta.2` to `3.0.1`
- `prepublishOnly` builds dist and runs tests before every publish

## [3.0.0-alpha.1] - 2024-12-13

### Added

- **PLAN_3.md** - Comprehensive roadmap for Ranger 3.0 development
- **Compiler Introspection API** - Position-based type queries for IDE integration
  - `getTypeAtPosition()` - Get type information at cursor position
  - `getClassProperties()` / `getClassMethods()` - Inspect class structures
  - See [ai/INTROSPECTION.md](ai/INTROSPECTION.md) for documentation
- **AI Documentation** - Enhanced documentation for GenAI assistants
  - [ai/INTROSPECTION.md](ai/INTROSPECTION.md) - Introspection API guide
  - Updated [ai/QUICKREF.md](ai/QUICKREF.md) with introspection examples

### Changed

- Version bump from 2.1.70 to 3.0.0-alpha.1
- Updated test configuration to exclude ranger-vscode-extension tests from root

### Planned for 3.0

- File extension change from `.clj` to `.rgr`
- Web-based IDE with Monaco editor
- Simplified import system with auto-loaded standard library
- Language Server Protocol (LSP) for VSCode extension
- JavaScript source map generation
- Improved language targets: Python, Rust, Swift, C++

---

## [2.1.70] - Previous Release

### Features

- Cross-language compilation to JavaScript, TypeScript, Python, Go, Rust, Swift, C++, Java, Kotlin, C#, PHP, Scala
- Lisp-like syntax with object-oriented programming support
- VirtualCompiler for in-browser compilation
- VSCode extension (preliminary)

---

## Version History Notes

Ranger has been in development since 2016. Major milestones:

- **1.0** - Initial release with basic cross-compilation
- **2.0** - Introduced VirtualCompiler and improved type system
- **2.1** - Added more language targets and improved code generation
- **3.0** - (Current) Modernization with web IDE, LSP, and simplified tooling
