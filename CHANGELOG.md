# Changelog

All notable changes to the Ranger Compiler will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **`shape`: closed variant families with an exhaustive `match`** — one declaration for a value that is one of a fixed set of forms, in place of a wide class with an integer type tag. `shape Value { group Ref { … } case Nothing case Num { def value:double 0.0 } case Items does Ref { … } }` declares four cases and one named subset; `Value`, `Value.Num` and `Value.Ref` are all types, and construction is the ordinary `(new Value.Num(2.5))`. `match v { … }` must cover every case exactly once — a missing case, a case covered twice and a `_` catch-all are compile errors that name what is wrong, so a case added later breaks every match that does not handle it. A case holding only scalars is a *value* case (compares by content, immutable after construction); anything else is a *reference* case (compares by identity); `@(value)` / `@(reference)` state it explicitly, and each shape gets a generated `Value.equals` / `Value.notEquals` implementing the split. A shape lowers before class collection into one `record` per case plus a `union` over them, so no target writer knows the word `shape`.

  Per target the family is the nearest closed construct the language has: a **TypeScript union type**, a **Rust `enum`**, a **C++ `mpark::variant`**, a **Kotlin `sealed interface`**, a **C# / Dart interface**, and the case classes with a runtime type test elsewhere. On Rust and C++ a scalar-only case is carried *inside* the tag, so constructing one allocates nothing — measured against a fat-class baseline on the same interleaved run, C++ went from 2.0× to **30×** and Rust from 3.5× to **6.9×** (`gallery/game_engine/v2/interp/bench/value_layer/`). Node is unchanged at ~5×; a `kind`-tag dispatch is worth another 6× there and is not done yet.

  Also in this work: the `case` narrowing operator got `rust` and `dart` templates (class-typed arms did not type-check on either before), Go stopped emitting an unused binding, the Kotlin union type stopped reaching the output as a name nothing declares, `variant.hpp` gained `mpark::holds_alternative`, and the analyzer stopped treating the compiler's synthetic `Any` union — which contains every declared class — as a reason to make every class shared on Rust. New operator `identical` answers "the same object?" per target (`===`, `is`, `identical(…)`, `Object.ReferenceEquals`, `Rc::ptr_eq`, pointer `==`), because `==` is not identity everywhere. Design and staging in `PLAN_SHAPES.md`; docs in [Closed variants](https://terotests.github.io/Ranger/docs/language/variants/), `ai/GRAMMAR.md` and `ai/QUICKREF.md`; coverage in `tests/shapes.test.ts` and `tests/union-narrowing.test.ts`.
- **Dart target for Flutter-ready packages** — `-l=dart` generates idiomatic Dart (`T?` null safety, `List`/`Map`, top-level `main`, `import '…';`) aimed at shared application logic a handwritten Flutter UI can import, not widget trees. `-pubspec` writes `pubspec.yaml` (`-name=` `-version=` `-description=`); `-flutter` adds a Flutter SDK dependency. Registration covers `Lang.rgr`, `RangerDartClassWriter`, LiveCompiler, VirtualCompiler, conformance, `npm run test:dart`, the syntax-app matrix, and `examples/dart_flutter_logic/`. See `PLAN_DART.md` and `TARGET_NOTES.md`.
- **Dart golden: `gallery/ts_parser`** — the ~10k LOC TypeScript/ES5 parser compiles with `-l=dart -nodecli`; the `-d` demo AST is identical to the JS reference. Adds host ops (`shell_arg*`, `read_file`), `$` escaping in Dart string literals, `npm run tsparser:compile:dart` / `tsparser:run:dart`, and `npm run test:dart:tsparser`. Operator-reference docs include Dart in `docs/tools/lib/compile.mjs` `TARGETS` (so pages such as string `at` list Dart after deploy). `at` on Dart uses `.substring(i, i+1)` — the `*` fallback `s[i]` is a code unit, not a string.
- **Language switches for Kotlin, Python, Rust and Dart** — `if_kotlin`, `if_python`, `if_rust`, `if_dart`; `if_swift` also emits under `-l=swift6`.
- **Docs: target maturity** — README, `targets/overview`, FAQ and `TARGET_NOTES` record the TypeScript-engine gate (Go / Kotlin / Python / C# 8/8 vs Node; Swift 6 compile-only in CI) and stop calling C# unmaintained.
- **Target fixes found by the syntax app** — the matrix of `tests/syntax_app/` went from 82 of its 238 cells rejected by the compiler to 43, and from 41 cells that compile, run and print the expected output to 57. Java moved from 17 rejected units to 3 and from no unit running to seven; Python from 5 rejected to 1 and from 2 running to 6; Rust from 7 rejected to 3, C# from 8 to 3, Scala from 10 to 6, Kotlin from 6 to 4, Swift 3 from 6 to 4. The work is in `compiler/Lang.rgr`, so it needs no rebuild of the compiler, and `tests/syntax_app/TARGET_FIXES_TODO.md` records what is done and what is next.

  - **`for` over a hash map was JavaScript only.** Both shapes carried one template, so every program that walked a map answered `Could not match argument types for for` on the other thirteen targets. Both now cover the list.
  - **Four operators wrote source no target could parse.** `regex_test` and the three `iso_*` operators fell back to a Ranger-spelled call — `RegexMatch.testIgnoreCase(a b)`, a space where the target needs a comma — for every target with no entry of its own. `pushString` fell back to the JavaScript `.push()`, `rawbytechar` and `strfromcode` to `String.fromCharCode`, and `join` to `.join()`. `regex_test` now has Go, Python, C++, PHP, Scala, C# and a corrected Java entry and **no `*` fallback**: a target with no regular expression engine fails the match at compile time, which is where the absence belongs.
  - **The same program printed different answers.** `replace` changed the first occurrence on four targets and every occurrence on the other seven — it now changes every occurrence, which is what the trigraph escaping of `ng_RangerCppClassWriter.rgr` has always assumed. A double reaching a string printed `1.500000` on Go and C++, which both fixed six digits; both now write the shortest form that reads back as the same value. `to_string(boolean)` printed `True` on Python. `to_int(double)` truncated toward zero on Go instead of flooring, and refused an untyped constant. `indexOf` on a string gave the empty string rather than `-1` on PHP. `/` between two integers is real division, and Java, C#, Scala, Swift, Python and PHP were left with their own `/` — Java refused the program outright. The C++ `r_optional_primitive` left `has_value` uninitialised, so a failed `str2int` read back as a value.
  - **Operators that existed on one or two targets** now cover the list: `sort`, `reverse`, `remove`, `error_msg`, and the entries for `M_PI` / `fabs` / `tan`, `to_double(int)`, `cast`, `insert`, the string `indexOf` family, `to_lowercase` / `to_uppercase`, `charcode`, `throw`, the four `if`-over-an-optional-number forms, and `switch` / `case` / `default` on Python 3.10 `match` and Rust `match`.
  - **Two wrong templates.** `if!` carried a Rust entry that was a macro — so it wrote Ranger source — with the else branch spelled the Rust way and no parentheses around the condition; the target-independent `*` macro was already correct. `!!` on Java called `java.util.Optional.get()` while `unwrap` on the same target wrote the value itself.
  - **`reserved_words` had no `java7`, `csharp` or `scala` section**, so a Ranger name that is a keyword of those languages reached the output unchanged: `def double (fn:int …)` wrote `LambdaSignature1 double = …` on Java, which is what the lambda section failed on. All three now list their keywords. PHP deliberately gets none: its writer emits every function as a class method, PHP 7 allows a reserved word there, and a variable is `$name` and never clashes, so a section would rename `list`, `empty`, `clone`, `match` and `print` across some fifty files for no gain — measured, the PHP column is identical either way.
  - **`tests/syntax-app.test.ts` is excluded from the default Vitest config**, next to `compiler-llvm.test.ts`, and keeps its own `npm run test:syntaxapp`. A file that runs for two minutes starves the reporter under `singleFork`; the run then ends with `Timeout calling "onTaskUpdate"` and the files after it never run.
  - **`ranger-vscode-extension/compiler/output.js` is rebuilt.** It is a second copy of the compiler that only `introspection.test.ts` loads, and nothing in the build or in CI regenerates it. It had fallen behind `compiler/Lang.rgr` far enough to stop parsing the operator definitions, and four of its thirty-seven tests were failing before this branch. `npm run compile:langserver` brings it back; all thirty-seven pass.
  - **The test harness looked for one output file.** The Java target writes one file per class and ignores `-o`, so the whole java7 column of the matrix read `compile-error` while Java in fact compiled. `tests/helpers/syntax-app.ts` now accepts any file with the extension of the target, prefers the one holding `main`, hands every `.java` in the directory to `javac`, and runs the TypeScript of the repository rather than whichever `tsc` is first on PATH.

### Changed

- **The Rust jpeg output is clippy-clean: 1395 warnings → 0** — the fourth PLAN_RUST_IDIOMATICITY round closes every remaining warning class with emission fixes, and names four allows for shapes that mirror the Ranger source itself. Structurally: an argument slot or an already-delimited operand tells the next operator emission it needs no parens of its own (a one-shot flag the expression walker consumes), self-delimiting templates (bit ops, casts, format!) are declared so the walker never double-wraps them, and the bit operators became writer customs that parenthesize once — `(oldVal | (1 << bit))`, not `((oldVal) | (((1) << (bit))))`. Literal positions carry no casts (indexes, ranges, `vec!` sizes, u8 stores, f64 casts — with macro-wrapped literals unwrapped before the test), `int / int` emits `x as f64 / y as f64`, comparisons are idiomatic (`x == false` → `!x`, `s != ""` → `!s.is_empty()`, literal strings compare as `&str`, `a >= lo && a <= hi` → `(lo..=hi).contains(&a)`), a borrowed or mut-reference parameter passed straight through goes bare (`x`, not `&x`/`&mut x`), a class without a constructor body returns its struct literal as the tail, `strfromcode` inside a format! argument stays a `char`, and `substring` drops a literal-zero start instead of emitting `x - 0` or a deny-level `skip(0)`. The named allows, each commented in the generated header: `clippy::manual_clamp` and `clippy::collapsible_if` (user statement sequences), `clippy::too_many_arguments` (user arity), `clippy::upper_case_acronyms` (user type names), `unused_assignments` (the init-discipline family). The image stays byte-identical at both gate sizes; the clippy-clean shapes are pinned by greps on the flagship program in `codegen-rust.test.ts`

- **The Rust output reads on: `pos += 1`, tail expressions, slice parameters** — the third PLAN_RUST_IDIOMATICITY round (clippy on the jpeg output: 1395 → 512 across the three): **`x = x + e` is `x += e`** — and `-`, `*`, `/` — when the target is a plain scalar path (no cell, no optional, no weak segment) and the right side starts from the same path, with anything less plain falling through to the full assignment machinery (297 warnings, 273 compound sites on the jpeg output); **the last `return x;` of a body is the tail expression `x`** — the body walk marks its final statement, the return custom drops the keyword and semicolon on exactly that node, a bare tail `return;` disappears, and a constructor ends in `me` (all 85 `needless_return` warnings); and **a borrowed collection or buffer of scalars is a slice** — `&[i64]` / `&[u8]` / `&[f64]` where the signature said `&Vec<T>` (clippy's `ptr_arg`), safe because `&Vec` coerces to `&[T]` at every call site and borrowed-to-borrowed chains pass the slice straight through. The image stays byte-identical at both gate sizes. What remains is parked with reasons in PLAN_RUST_IDIOMATICITY.md: double parens need precedence-aware emission (the walker's parens are load-bearing for `a * (b + c)`), snake_case sits behind the `allow` and collides with `@serialize` field names, and borrow hoisting needs a loop-invariance analysis. Coverage: `tests/fixtures/rust_slice_params.rgr` + extended `codegen-rust.test.ts`

- **The Rust output prints like Rust: `println!("numbers {}", numbers.len() as i64)`** — the second round of PLAN_RUST_IDIOMATICITY, all template-level: **string concatenation is `format!`** — `print` flattens a whole `+` chain into one `println!` with the literals inlined in the format string, and a chain in any other position becomes a single `format!` (`"rows: " + n + " first: " + name` → `format!("rows: {} first: {}", n, name)`), replacing the `[&*a, &*b].concat()` and `[a, (b.to_string())].join("")` forms entirely, with an explicit `to_string` of a scalar dropped since `{}` is already Display; **an integer-literal index takes no cast** — the new `(idx N)` template op emits `arr[0]` where every index used to be `arr[(0) as usize]`, applied across the element, buffer and vec-init templates; **a Copy element read takes no clone** — the new `(cloneif N)` op keeps `.clone()` for String and struct elements and drops it for scalars, in `itemAt` and the `for` loop; and **a free `fn main` is a crate entry** — a file-level `fn main` lands on a class as an ordinary method, and no crate main was emitted, so `rustc` stopped with E0601; when the program declares no `sfn m@(main)`, the writer now emits `fn main()` calling it. clippy on the jpeg output: 1395 → 899 across the two rounds, the image byte-identical at both gate sizes throughout. Also recorded on the way: **Go now prints doubles in their shortest form** (`strconv.FormatFloat(x, 'f', -1, 64)` instead of six fixed decimals, matching the reference targets — the syntax-app numeric section on Go went run-error → **ok** in the recorded matrix), and the Go for-over-object-array gap of `tests/syntax_app/known_gaps.md` is closed by the earlier `treeReferencesVRef` fix — the probe is deleted and the shared `render()` of the syntax app uses the natural `for rows row:CheckRow i` form again. Coverage: `tests/fixtures/rust_format.rgr` + `codegen-rust.test.ts`

- **A read-only Rust method takes `&self`** — ranked first in PLAN_RUST_IDIOMATICITY and closed there: the writer has carried the full receiver machinery all along (per-method mutation detection, a same-class call graph, transitive propagation), and it never fired because of one truthiness fault — `def dm:boolean (get directMutations methodName)` binds an optional, `if dm` compiles to a presence check, so `false` counted as `true` and all 136 methods of the jpeg output took `&mut self`. Fixing it exposed three precision holes, each now closed: a read operator on a member collection (`itemAt items 0` is a `has_call` on the vector) counted as a write — reads on plain collections, strings and buffers no longer do, while the mutating operators and any user-class receiver still do; mutation through a collection operator (`push labels s` — never an `=` node) was invisible — the detector now reads the same mutating-operator list the template engine uses for LHS marking; and an uninitialized member collection carries `is_optional` on its desc, which forced `&mut self` though the Rust field is a plain `Vec`, never `Option`. The jpeg output lands at 41 of 136 methods on `&self`, `rustc -O` clean, byte-identical at both gate sizes. Also from the ranked list: void functions drop `-> ()` (84 clippy warnings), a parameterless method drops the `(&mut self, )` trailing comma (42 sites) — clippy 1395 → 1310 — `use std::rc::Weak;` is emitted only when a `@(weak)` field exists, and thirteen unconditional `print ("DEBUG …")` statements are gone from the Rust writer, which wrote them to stdout on every compile. Coverage: `tests/fixtures/rust_receivers.rgr` + `codegen-rust.test.ts`

- **The shared-class `Rc<RefCell<T>>` model is the Rust default** — `-rust-shared-classes` graduated from an experimental flag: a bare `-l=rust` build now applies the sharing verdict (value classes stay plain structs; the classes the analysis proves shared take `Rc<RefCell<T>>`), which is what lets the object-sharing programs of the docs — and `weak` back references — compile and run on Rust out of the box. The new flag `-rust-value-classes` restores the old all-value model, and `-rust-shared-classes` is still accepted as a no-op for compatibility. Turning the default on surfaced two writer gaps the serialize round trip caught: a strong optional field of a shared class was unwrapped mid-path without borrowing the cell (`back.one.as_mut().unwrap().name` does not compile — the segment now appends `.borrow()` for a read, `.borrow_mut()` for a write or call receiver), and an expression receiver — an unwrap, an element read, a call result — of a shared class was called without a borrow (`(self.one.clone().unwrap()).toDictionary()`; the receiver now borrows mutably, with `new` kept as the one shared-class expression that is still a plain value). The conformance gate holds under the default: the flag-less Rust `jpeg_scaler` build writes the reference image byte for byte at both test sizes, and the `@serialize(true)` round trip runs on Rust with the same output as ES6 and Python

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
