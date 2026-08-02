# Changelog

All notable changes to the Ranger Compiler will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **JSON for the Python and the Rust target** — `lib/JSON.rgr` declared no `python` and no `rust` template in any of its operator blocks, and `systemclass JSONDataObject` / `JSONArrayObject` / `JSONValueUnion` named no type for either target. A template block is part of the match, so the absence was not a fallback to some generic form: every program that touched a JSON object stopped in the type check with `Could not match argument types for json_object`, and `@serialize(true)` could not work on either target. The [FAQ answer on `toDictionary` / `fromDictionary`](https://terotests.github.io/Ranger/docs/faq/#how-do-i-write-an-object-to-json-and-read-it-back) showed that message in place of the Python and the Rust tab. Both targets now hold `print`, `getStr`, `getInt`, `getDouble`, `getBoolean`, `getObject`, `getArray`, `keys`, `isArray`, `asArray`, `getValue`, `array_length`, all six `set` variants, `push`, `json_object`, `json_array`, `from_string` and `to_string`, and `lib/stdlib.rgr` holds the union `case` for both:

  - **Python** maps the three shapes onto `dict`, `list` and `object`, and reads and writes the text with the `json` module of the standard library. A getter is an inline lambda that checks the type of the value, so no polyfill is needed: `getInt` rejects a `bool`, because `bool` is a subclass of `int` in Python and `{"ok": true}` must not read back as an integer.
  - **Rust** has no JSON type in the standard library, and the target writes code that `rustc` builds with no crate. The compiler adds the enum `RJson` as a polyfill, together with a reader and a writer for the text. A JSON object is a `std::collections::HashMap<String, RJson>` and a JSON array is a `Vec<RJson>`, both spelled in full so that the output needs no `use` line. The trait `RJsonValue` converts an argument of the union type `JSONArrayUnion` to the variant that fits it, which is what `push` and the `set` of a union value need.

  `tests/fixtures/json_ops.rgr` builds an object, writes it as text, reads it back and reaches every value in it. `tests/compiler-json.test.ts` runs the generated program on JavaScript, on Python and on Rust and compares the three outputs, so a missing template can not pass as a compile-only success. `tests/compiler-serialize.test.ts` adds `python` and `rust` to the target list and runs the round trip of `serialize_roundtrip.rgr` — nested object, object array and object hash — on both

### Fixed

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
