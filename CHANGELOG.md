# Changelog

All notable changes to the Ranger Compiler will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **`TSLexer` UTF-8 / native C++ tokenization** — code-unit length vs byte `charAt` mismatch after multi-byte characters (e.g. em dash in comments) no longer desyncs the lexer; fixes native SDL parse failures on [`invaders.game.tsx`](./gallery/game_engine/scripting/invaders.game.tsx) and similar scripts

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
