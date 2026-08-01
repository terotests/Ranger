# Changelog

All notable changes to the Ranger Compiler will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
