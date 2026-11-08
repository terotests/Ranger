# PLAN_CLEANUP — repository root and compiler

Inventory of unused files, stale markdown, and the compiler source layout.
Nothing in this file has been deleted or moved yet.

Counted against `origin/master` at `78822143` (2026-09-18). Gallery projects
have their own note: [`gallery/PLAN_GALLERY_CLEANUP.md`](gallery/PLAN_GALLERY_CLEANUP.md).
This plan does not redo that work.

## Why

The root is a working directory that never got emptied. Seventy-one markdown
files sit next to stray JPEG tests, an old npm package inside `compiler/`,
and two copies of `JSON.rgr`. The compiler that actually runs is about
eighty-six `.rgr` files; another fifty-eight in the same folder are backups,
parser experiments, and plugins that nothing imports.

The live compiler is also hard to open: `RangerFlowParser` is 9 296 lines in
one file, the Rust writer is 12 047, `Lang.rgr` is 11 129, `LowIRBuilder` is
12 302. One of those (`EnterVarDef`) already lives in its own file. That is
the pattern to copy, not a rewrite of the compiler.

## Rules

1. **One concern per PR.** Deleting unused files is not the same change as
   renaming `ng_RangerFlowParser.rgr`. Splitting a 9 000-line class is not
   the same change as moving markdown.
2. **Compiler PRs gate on the self-host.** `npm run compile` must succeed, and
   a second compile of `compiler/ng_Compiler.rgr` must be byte-identical to
   the first (the existing self-host tests). If a split changes only file
   layout, the emitted compiler is the proof.
3. **Do not invent an import path.** ISSUES.md #64: the same file reached by
   two spellings used to break inheritance. After a rename, every `Import`
   of that file uses one string.
4. **Do not import `gallery/` from `compiler/` or `lib/`.** License split.
5. **Git keeps history.** Prefer delete over rewrite of a finished PLAN; the
   commit is the archive. If a document is still cited from README or docs,
   move it rather than delete it.
6. **`Lang.rgr` is not a class file.** It is the `language { }` document
   loaded through `RANGER_LIB`, not through `Import`. Do not split it until
   the language definition has an include mechanism. See [§6.4](#64-langrgr).

---

## Phase 1 — stray files in the root and `bin/`

Safe to delete. None of these are imported by the compiler, the test suite, or
the documentation site. Several are compiled copies of files that already live
under `gallery/`.

### Root

| Path | What it is |
| --- | --- |
| `buffer_test.js`, `evg_test.js`, `font_test.js`, `progressive_jpeg_test.js`, `simple_test.js`, `simple2.js`, `minimal_test.js`, `test_eval_value.js`, `ts_parser_main.js` | Compiled JS left in the root. Live copies: `gallery/evg/bin`, `gallery/pdf_writer/bin`, `gallery/ts_parser/bin`. |
| `test_buffer_from.rgr`, `test_buffers.rgr`, `test_buffers_simple.rgr`, `test_buffers_simple.js`, `test_buffers_simple.go`, `test_buf_minimal.rgr`, `test_int_buffer_minimal.rgr` | Buffer experiments. Suite lives in `tests/`. |
| `test_fdct_local.rgr`, `test_fdct_member.rgr`, `test_fdct_method.rgr`, `test_fdct_simple.rgr` | JPEG FDCT probes. Live tests are under `gallery/pdf_writer`. |
| `test_error.rgr` | One-off parse-error fixture. |
| `f.ll` | Empty LLVM dump. |
| `test.zip` | Binary fixture in the root. |
| `ctrl.txt` | Node `MODULE_NOT_FOUND` stack for `/home/user/Ranger/t262_control.cjs`. |
| `rustc_errors.txt` | rustc log. |
| `weak_ref_test.rs` | Hand-written Rust probe. |
| `pubspec.yaml` | `name: vela_chart` at repo root. Vela's Dart bits belong under `gallery/vela`. |

`index.html` is a GitHub Pages redirect that still says “Open the Ranger
playground”. The site root is `landing/` (`/`), playground is `/playground/`.
Either point it at the front page or delete it if `deploy-pages.yml` no longer
needs it.

### `bin/` leftovers (tracked)

Keep: `output.js`, `Lang.rgr`, `stdops.rgr`, `git-http.mjs`, `testcomp.js`.

Delete:

```
bin/test_buffer_from.js
bin/test_buffers.js
bin/test_buffers_simple.js
bin/test_fdct_local.js
bin/test_fdct_member.js
bin/test_fdct_method.js
bin/test_fdct_simple.js
bin/test_static_analysis.cpp
```

`bin/evg_server.js` and `bin/jpeg_scaler.js` look like gallery tools compiled
into the compiler's bin. Confirm they are not a documented entry point, then
delete or move next to the gallery source that produces them.

Add a `.gitignore` rule for `bin/test_*` so the next local compile of a root
fixture does not come back.

**Gate:** `npm test` (or at least `tests/compiler-selfhost.test.ts` + the ES6
suite). No source change.

---

## Phase 2 — directories that are not the product

| Directory | Verdict |
| --- | --- |
| `adventofcode/` | Puzzle solutions, 99 files. Not referenced by CI, npm scripts, or docs. Delete, or move to a personal branch. |
| `rust_compiler/` | Four `.rs` files: a sketch of a Rust rewrite of `systemclass`. Not wired to anything. Delete. |
| `fiddle/` | Pre-playground browser editor (`VirtualCompiler.js`, 776 KB, plus `compileEnv.json`). Replaced by `playground/`. Delete. |
| `native/` | `native/httpd/*.clj` — old HTTP demo, `.clj` extension. Delete. |
| `features/` | `features/any/test_any.clj` and compiled `bin/`. npm scripts `test-any*` still point here. Either port the fixture into `tests/` as `.rgr` and drop the folder, or delete the scripts with the folder. |
| `generated/` | Historical AI-smoke `.clj` chess boards. `generated/README.md` already says they are not a tutorial; `package.json` still has `gen:chess` etc. Drop the npm scripts, then the folder. |
| `versions/` | Frozen compiler snapshots per target (`es6/compiler.js`, …), ~3 MB. README still tells you to keep `versions/<target>/compiler.js` as a rollback. Git history of `bin/output.js` is the rollback. Delete the directory and that README sentence. |
| `compiler/index.js` | 1.0 MB generated compiler, `package.json` inside `compiler/` still says version `2.1.61` and `"bin": {"ranger-compiler":"index.js"}`. The published CLI is `dist/rgrc.js`. Delete `compiler/index.js` and `compiler/package.json`. |

Keep as they are: `compiler/`, `lib/`, `pkg/`, `gallery/`, `docs/`, `tests/`,
`examples/`, `landing/`, `playground/`, `plugins/`, `scripts/`, `runtime/`,
`ranger-vscode-extension/`, `ai/`, `dist/` (build output that ships).

`runtime/` is the C/WASM runtime for LLVM/WAT, not junk.

---

## Phase 3 — markdown in the root

71 `*.md` files in `/`. The living set should be small. Everything else is a
finished plan, a status snapshot that was never ticked, or a document that
belongs next to the code it describes.

### Keep at the root

| File | Role |
| --- | --- |
| `README.md` | Project entry |
| `AGENTS.md` | Agent / PR rules |
| `CHANGELOG.md` | What shipped |
| `ISSUES.md` | What is broken |
| `LICENSE`, `LICENSE-MIT`, `LICENSE-AGPL-3.0`, `LICENSING.md` | License split |
| `TARGET_NOTES.md` | Per-target caveats (long; could later move under `docs/`) |
| `PLAN_CLEANUP.md` | This file, until the work is done |

`SPEC_SEMANTICS.md` is a draft (Track 1 of `PLAN_LANGUAGE_IMPROVEMENTS.md`).
Move with that plan, do not keep a second language spec at the root.

### Historical — delete (git already has them)

These announce themselves as done, or they still talk about `.clj` files that
no longer exist.

| File | Why |
| --- | --- |
| `PLAN.md` | Two plans concatenated. First section “Go test environment — COMPLETED”. Rest is “add Python” with `ng_RangerPythonClassWriter.clj`. Python shipped years ago. |
| `PLAN_3.md` | First paragraph: **Status: historical.** Release is past 3.0; checkboxes were never updated. |
| `INCREMENTAL_PLAN.md` | Points at `compiler/ng_FlowWork.clj`. |
| `PLAN_DART.md` | Dart target exists; self-host runs it. |
| `PLAN_TS_PARSER.md`, `PLAN_JS_PARSER.md` | Parsers live in `gallery/ts_parser`, `gallery/js_parser`. |
| `PLAN_RGRC_NPM.md`, `TODO_RGRC_NPM.md` | npm package is 3.5.1. TODO still has “create `CLIProgress.rgr`” — the file exists. |
| `PLAN_HTTP.md`, `TODO_HTTP.md` | December 2025 checklists. HTTP operators are in `Lang.rgr`. Remaining work belongs in ISSUES if anything is still open. |
| `PLAN_INLINE_STATICS.md` | Status: implemented and **not worth turning on**. |
| `TODO_JPEG.md` | Investigation log. Live JPEG work is under `gallery/pdf_writer`. |
| `RUST_TODO.md` | Status dated December 21, 2025. Open Rust bugs are ISSUES #74, #79, #84, #86 and `TARGET_NOTES.md`. |
| `PROCESS_UI_VIEW_MODELS.md` | Status: **FIXED**. |

### Move next to the code (still useful, wrong place)

| File | Move to |
| --- | --- |
| `PLAN_EVG.md`, `TODO_EVG.md` | `gallery/evg/` (there is already `gallery/evg/PLAN_EVG.md`) |
| `PLAN_FIRESIM.md` | `gallery/firesim/` |
| `PLAN_RANGERDBVIEWER.md`, `PLAN_RANGERDBVIEWER_FORMS.md` | `gallery/rangerdbviewer/` |
| `PLAN_COMPACT_UI_PARITY_DEMO.md`, `PLAN_REALTRAINER_STATE_PARITY.md` | `gallery/realtrainer/` |
| `PLAN_RANGER_ENGINE.md`, `TS_ENGINE_PERF.md`, `CPP_ENGINE_ANALYSIS.md`, `QUICKJS_COMPARISON.md` | `gallery/ranger_engine/` or `gallery/game_engine/v2/interp/` |
| `PLAN_PDF_NPM.md` | `gallery/pdf_writer/` |
| `PLAN_JS_PARSER.md` / `PLAN_TS_PARSER.md` if kept as history | `gallery/js_parser/`, `gallery/ts_parser/` |
| `PROCESS_*.md` (except the FIXED one) | `docs/site/src/content/docs/language/` or `compiler/docs/process/` |
| `PLUGINS_REVIEW.md` | `compiler/docs/` next to `ng_RangerPlugin.rgr` |
| `RUST_ISSUES.md` | Fold open items into `ISSUES.md` / `TARGET_NOTES.md`, then delete |
| `SHAPES_IS_OPERATOR.md` | Next to `PLAN_SHAPES.md` after that file moves |

### Living plans — keep, but not in `/`

These still describe unfinished work. Put them in `docs/plans/` so the root
lists the product, not the backlog.

| File | Topic |
| --- | --- |
| `PLAN_SHAPES.md` | Closed variants; large, still the design record |
| `PLAN_FORMAT.md`, `PLAN_FORMATS.md` | Output formatting; reading more formats |
| `PLAN_JS_STDLIB.md` and `PLAN_JS_STDLIB_*.md` | Portable JS stdlib |
| `PLAN_WASM_*.md`, `PLAN_LLVM_MEMORY.md` | LLVM / WASM |
| `PLAN_CODEGEN_OWNERSHIP.md`, `PLAN_OWNERSHIP_SOUNDNESS.md`, `PLAN_RUST_OWNERSHIP.md`, `PLAN_RUST_IDIOMATICITY.md` | Ownership / Rust output. Several rows already “Done” — trim or fold into TARGET_NOTES when moving. |
| `PLAN_LANGUAGE_IMPROVEMENTS.md`, `PLAN_OPERATORS.md`, `PLAN_METHOD_CHAINING.md`, `PLAN_TREE_LITERALS.md`, `PLAN_GENERICS.md` | Language |
| `PLAN_STATIC_ANALYSIS.md` | Phase 1 done; rest still a plan |
| `PLAN_WEB_LOADING.md` | **Design only**, nothing implemented |
| `PLAN_AI_BRIDGE.md` | Agent surface |
| `PLAN_API_DOCS.md` | Phases A/B/D shipped; rest is design |
| `PLAN_DOCS.md` | Docs site — **implemented**. Move to `docs/` as history of that pipeline. |

### Stale sentences inside files we keep

Fix these when touching the file, not as a separate archaeology pass:

- `.claude/skills/ranger-lang/SKILL.md` still says the compiler **exits 0 on
  `[FAIL]`**. That was PR #980. The skill is now wrong and will make agents
  grep logs instead of using the status.
- `README.md` still documents `versions/<target>/compiler.js` and
  `-compiler -copysrc`.
- Root `index.html` still calls the site the playground.
- `PLAN_3.md` (until deleted) says the release is 3.3.0; npm is 3.5.1.

**Gate:** grep the tree for links to a moved file and update them in the same
PR as the move. `CHANGELOG.md` may mention old names; leave it.

---

## Phase 4 — compiler files that nothing live imports

The running graph starts at `compiler/ng_Compiler.rgr` → `VirtualCompiler.rgr`
and follows `Import`. `Lang.rgr` is extra: it is not imported, it is the
`RANGER_LIB` language document. Counted that way:

- **Live:** 86 `.rgr` files plus `Lang.rgr`
- **Dead:** 58 `.rgr` files in the same folder

Dead means “not on the compile graph of `ng_Compiler.rgr`”. Some are older
editions of live files (`*Orig`, `*backup`). Some are experiments. None of
them should stay next to the compiler that ships.

### Delete — backups and previous parsers

```
ng_CompilerOrig.rgr
ng_CompilerGeneric.rgr
ng_RangerFlowParserOrig.rgr          # 4007 lines; live parser is ng_RangerFlowParser.rgr
ng_FlowWork.rgr                      # 3997 lines; older FlowParser, still cited by INCREMENTAL_PLAN.md
ng_RangerRustClassWriter_backup.rgr  # 2753 lines
ng_RagnerJavaScriptClassWriter.rgr   # typo in the filename; live writer is ng_RangerJavaScriptClassWriter.rgr
ng_RangerSwiftClassWriter.rgr        # superseded by Swift3 / Swift6 writers
ng_RangerZigClassWriter.rgr          # no Zig target in Lang.rgr `targets {}`
ng_parser.rgr
ng_parser2.rgr
ng_parser_backup.rgr
ng_parser2_backup.rgr
ng_parser_ok.rgr
ng_parser_ok2.rgr
ng_parser_std_match.rgr              # live is ng_parser_std_match2.rgr, imported at the end of FlowParser
ng_parser_v2.rgr is LIVE             # class RangerLispParser — do not delete
ng_SourceParser.rgr
ng_SourceParser2.rgr
ng_RangerLispParser.rgr              # duplicate name; live Lisp parser is class in ng_parser_v2.rgr
ng_jsonParser.rgr
ng_xmlParser.rgr
ng_xmlParser2.rgr
ng_xmlParser3.rgr
ng_DictNode2.rgr
ng_Execute.rgr
ng_Execute1.rgr
```

Confirm `ng_parser_v2.rgr` vs `ng_RangerLispParser.rgr` before deleting the
latter: the live `Import` from FlowParser is `"ng_parser_v2.rgr"`.

### Delete — compiler-folder tests and plugins

Tests belong in `tests/`. These are not run by vitest:

```
test_any.rgr test_call.rgr test_chain.rgr test_json.rgr test_lambda.rgr
test_pcmd.rgr test_pcmd2.rgr test_plugin.rgr test_readfile.rgr
test_reveal.rgr test_slides.rgr test_types.rgr test_types2.rgr
test_types3.rgr test_var.rgr test_plugin.css
feature_tests.rgr issue_57.rgr ng_p_test.rgr ng_ui.rgr ng_ui_test.rgr
commonmark_plugin.rgr makefile_plugin.rgr markdown_plugin.rgr
maven_plugin.rgr plaintext_plugin.rgr plugin_apps.rgr
reveal_plugin.rgr simplePlugin.rgr ui_plugin.rgr ui_plugin2.rgr
```

`docs/sources.json` marks `lib/DOMLib.rgr` and `lib/JinxProcess.rgr` legacy
because **only** `compiler/test_slides.rgr` imported them. After that test
goes, those lib files can be retired in a later lib-cleanup PR (out of scope
here, but do not revive the import).

### Delete — Windows helper scripts and generated JS

```
compiler/*.bat          # feat2, feats, opdoc, p, pcmd, plugin, tonpm, vcomp, …
compiler/index.js       # 1.0 MB
compiler/package.json   # 2.1.61
compiler/operators.md   # generated operator table; live reference is docs/
```

`RangerDocs.rgr` and `TFlow.rgr` are unused on the live graph. Read them once
before deleting; if they are notes, they go with the markdown move.

### Duplicate sources (do not delete blindly)

| Pair | Fact |
| --- | --- |
| `compiler/JSON.rgr` and `lib/JSON.rgr` | **Byte-identical** (5 587 lines). The compiler imports `JSON.rgr` via `compiler/stdlib.rgr`. User programs import `lib/JSON.rgr`. Keep one file: `lib/JSON.rgr`. Point the compiler stdlib at `../lib/JSON.rgr`, or copy-on-compile the way `stdops.rgr` is copied into `bin/`. |
| `compiler/stdlib.rgr` and `lib/stdlib.rgr` | **Not identical.** Compiler copy has LLVM `case` templates and Swift `_ = binding` lines the lib copy dropped. The compiler is what `VirtualCompiler` inserts as `Import "stdlib.rgr"`. Treat `compiler/stdlib.rgr` as source of truth until they are merged; then there should be one file. |

This is a separate PR from the dead-file delete: a wrong `Import` here breaks
every program.

**Gate for Phase 4:** `npm run compile` (byte-identical to the pre-delete
`bin/output.js`, because no live source changed) and the compiler test files.

---

## Phase 5 — names: one class, one file, drop `ng_`

Almost every live compiler file is still prefixed `ng_` (“new generation”)
from the previous compiler. The class inside is not named `ng_…`. Agents and
humans grep for `RangerFlowParser` and open `ng_RangerFlowParser.rgr`.

### Convention

```
compiler/
  Compiler.rgr              # today's ng_Compiler.rgr (CompilerInterface + main)
  VirtualCompiler.rgr       # already matches
  LiveCompiler.rgr
  RangerFlowParser.rgr
  RangerLispParser.rgr      # today's ng_parser_v2.rgr
  RangerAppWriterContext.rgr
  RangerJavaScriptClassWriter.rgr
  … one file per class …
  Lang.rgr                  # stays; not a class
```

Helper types that only exist for one class may stay in that class's file
(`WalkLater` next to `RangerFlowParser`) until the file is too large, then
they get `WalkLater.rgr`.

### Already close

`VirtualCompiler.rgr`, `ColorConsole.rgr`, `CLIProgress.rgr`, `TTypeRegistry.rgr`,
`PkgImport.rgr`, `FlowEnterVarDef.rgr` already follow the rule.

### Do this as a dedicated rename PR, after Phase 4

Renaming 80 files without deleting the dead ones first doubles the diff with
no benefit. After the dead files are gone:

1. `git mv` each live `ng_X.rgr` to `X.rgr` (or the class name).
2. Rewrite every `Import "ng_X.rgr"` to `Import "X.rgr"` in the same commit.
3. Self-host byte-identical.

Do not batch-rename in the same PR as a behaviour fix.

---

## Phase 6 — split the files that are actually too big

Live compiler, largest first:

| File | Lines | What is in it |
| --- | --- | --- |
| `ng_LowIRBuilder.rgr` | 12 302 | LLVM lowering |
| `ng_RangerRustClassWriter.rgr` | 12 047 | Entire Rust target |
| `Lang.rgr` | 11 129 | Language definition — see §6.4 |
| `ng_RangerFlowParser.rgr` | 9 296 | Parse / collect / walk / shapes / trees |
| `JSON.rgr` | 5 587 | Duplicate of `lib/JSON.rgr` — see Phase 4 |
| `ng_StaticAnalysis.rgr` | 3 537 | One class, leave until FlowParser is split |
| `ng_RangerCppClassWriter.rgr` | 2 583 | C++ target |
| `ng_RangerGolangClassWriter.rgr` | 2 503 | Go target |
| `ng_RangerAppWriterContext.rgr` | 2 171 | Context + 10 helper types |
| `ng_parser_v2.rgr` | 2 005 | `RangerLispParser` |
| `ng_LiveCompiler.rgr` | 1 803 | Writer dispatch |
| `VirtualCompiler.rgr` | 1 650 | CLI, install, compile driver |

### 6.1 How to split a class without a rewrite

`FlowEnterVarDef.rgr` already adds a method to `RangerFlowParser` from another
file:

```ranger
operator type:RangerFlowParser all {
  fn EnterVarDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    …
  }
}
```

The class stays in one place. Methods move. The FlowParser file `Import`s the
method files. Self-host stays byte-identical if the method bodies are copied
verbatim.

Do **not** introduce a new IR or a new pass structure as part of cleanup.

### 6.2 `RangerFlowParser` — suggested files

Keep `class RangerFlowParser` and the small helpers (`ClassJoinPoint`,
`WalkLater`, `RangerFnParts`) in `RangerFlowParser.rgr` together with
`WalkNode` / `StartWalk` (the dispatcher).

Move, using `operator type:RangerFlowParser`:

| New file | Methods (line numbers in today's file) |
| --- | --- |
| `FlowCollect.rgr` | `CollectMethods`, `WalkCollectMethods`, `CreateFunctionObject`, `DetachDocBlocks`, record constructors (~7297–8590) |
| `FlowCall.rgr` | `cmdCall`, `cmdLocalCall`, `matchMethodCall`, lambda matching, `transformDotMethodCallExpr` (~1847–2640) |
| `FlowAssign.rgr` | `cmdAssign`, unary-minus repair, immutable assignment (~2481–2914) |
| `FlowClass.rgr` | `EnterClass`, `EnterMethod`, `EnterStaticMethod`, `EnterLambdaMethod`, `Constructor`, `cmdNew` (~1082–4100) |
| `FlowGeneric.rgr` | type annotations, generic instance names (~4101–4324) |
| `FlowImport.rgr` | `mergeImports`, `prepareImport`, `clearImports`, systemclass registration (~4420–4840) |
| `FlowTree.rgr` | `DesugarTrees` and the `lowerTree*` family (~4841–5275) |
| `FlowShape.rgr` | `DesugarShapes`, `expandShape`, `expandMatch`, group tests (~5276–7194) |
| `FlowOpFn.rgr` | `DefineOpFn`, `TransformOpFn`, static inlining (~3116–3895) |
| `FlowProcess.rgr` | `@process` path validation (~9159–end) |
| `FlowTypes.rgr` | `areEqualTypes`, `findFunctionDesc`, `findParamDesc`, union convert (~8600–9158) |

`FlowShape.rgr` will still be large (`expandShape` starts at 5763). That is
fine; it is one feature. Split again only if it stays above ~2 000 lines after
the first cut.

Do this in two or three PRs (collect+import, call+assign+class, trees+shapes),
not one 9 000-line move.

### 6.3 Writers

Same `operator type:` trick.

- **Rust** (`RangerRustClassWriter`, 12k): split emission of types, methods,
  unions/shapes, and `writeFnCall` / mutability. `#74`, `#79`, `#84`, `#86`
  all live in this file — do not split and fix in the same PR.
- **LowIRBuilder** (12k): already three types (`LowIRLowerContext`,
  `LambdaCaptureInfo`, `LowIRBuilderPass`). One file per type is the first
  cut; then split the pass by instruction kind if needed.
- **C++ / Go** (~2.5k): leave until FlowParser and Rust are done.
- **WriterContext** (11 types in 2 171 lines): extract `RangerAppEnum`,
  `ContextTransaction*`, `OpFindResult` into their own files named after the
  type. Keep `RangerAppWriterContext` in its file.

### 6.4 `Lang.rgr`

Do not split in this cleanup.

It is one `language { targets {…} reserved_words {…} operators {…} }` document.
The compiler loads it as a library path (`RANGER_LIB=./compiler/Lang.rgr:…`),
copies it to `bin/Lang.rgr` and `dist/Lang.rgr`, and user projects override it
by dropping another `Lang.rgr` in the working directory. A naive file split
would need a new include syntax inside `language { }` and would change how
every target finds operators.

If it is ever split, the seams are already commented in the file (reserved
words, system classes, per-domain operators). That is a language-definition
change, not a cleanup.

### 6.5 `VirtualCompiler.rgr`

Three types: `CompilerResults`, `VirtualCompiler`, `tester`. Extracting
`runInstall` (pkg fetch) into `CompilerInstall.rgr` is optional and should
wait until Phase 4's JSON/stdlib unification, because install is the other
thing that must keep working.

---

## Phase 7 — small follow-ups (not blockers)

- **`lib/` legacy operators.** After `compiler/test_slides.rgr` is gone,
  `docs/sources.json` already lists `DOMLib`, `ViewLib`, `JinxProcess`,
  `Engine3D`, `WebServerLib`, `ServiceLib` as unused. Retire or freeze them
  in a lib PR.
- **`compiler/stdlib.rgr` vs `lib/stdlib.rgr`.** Merge to one file; the
  compiler copy currently has more target templates.
- **Skill / agent docs.** Correct the “exits 0 on `[FAIL]`” line in
  `.claude/skills/ranger-lang/SKILL.md` and the copy under `plugins/ranger/`.
- **README compile section.** Describe `npm run compile` and `dist/rgrc.js`
  only; drop `versions/` and `compiler/index.js`.
- **Gallery** remains [`gallery/PLAN_GALLERY_CLEANUP.md`](gallery/PLAN_GALLERY_CLEANUP.md).
  Do not mix EVG/Office tree surgery into these PRs.

---

## Suggested PR order

| PR | Content | Risk |
| --- | --- | --- |
| 1 | Phase 1: root + `bin/` stray files, `.gitignore` | Very low |
| 2 | Phase 3: delete historical PLAN/TODO that self-identify as done | Low (link updates) |
| 3 | Phase 3: move living plans to `docs/plans/` and gallery folders | Low |
| 4 | Phase 2: `adventofcode`, `fiddle`, `rust_compiler`, `native`, `versions`, `generated`, `features` | Low; drop npm scripts in the same PR |
| 5 | Phase 4: delete dead compiler `.rgr` / `.bat` / `index.js` | Low if the import graph was right; high if one “dead” file is loaded by name |
| 6 | One `stdlib.rgr` / one `JSON.rgr` | Medium — every program |
| 7 | Phase 5: `git mv` `ng_*` → class names | Medium — every Import |
| 8+ | Phase 6: FlowParser splits, then Rust writer, then LowIR | Medium each; self-host identical |

Do not start 7 before 5. Do not start 8 before 7 (splits against the new names,
not a third rename).

---

## How this was counted

- Live compiler graph: BFS of `Import "…"` from `compiler/ng_Compiler.rgr`,
  plus `Lang.rgr` as `RANGER_LIB`.
- Dead compiler files: every `compiler/*.rgr` not in that set.
- Root markdown: first-line title + a Status line in the first fifteen lines.
- Cross-check: `git ls-files`, `package.json` scripts, `docs/sources.json`,
  `.github/workflows`, and a grep of `tests/` for `compiler/test_`.
