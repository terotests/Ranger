# Plan: Repository responsibility layout (compiler / language / packages / runtime)

## Status: DEFERRED — plan only, do not execute yet

**Do not start file moves or renames while other feature work is active.** Merge
conflicts across `compiler/`, `lib/`, `package.json`, self-host scripts, VS Code
extension, gallery, and tests would be large and noisy.

This document captures an agreed direction so the work can start later as a
**responsibility-visibility** refactor, not a compiler rewrite.

When to reopen:

- Feature / target / process / docs PRs that touch `compiler/` and `lib/` have
  quieted for a stretch
- A dedicated window for a move-only PR (or a small series) is available
- Inventory of the live self-host compile path has been refreshed against
  current `master`

---

## Goal

Make the filesystem answer a new contributor’s questions:

| I want to… | Go here |
| --- | --- |
| Change Ranger syntax / AST | `compiler/syntax/` |
| Change type checking / semantic analysis | `compiler/semantic/` |
| Add a language-feature transform | `compiler/lowering/` |
| Add a new target language | `compiler/codegen/targets/` |
| Add a built-in operator template | `language/core.rgr` |
| Add a near-always-on helper / extension | `language/prelude.rgr` |
| Add HTTP / DB / I/O library code | `packages/` |
| Add target-side native/WASM support | `runtime/` |
| Add a compiler regression test | `tests/compiler/` |

Clarify four concepts that are currently interleaved by history:

1. **Language kernel** — operators, prelude, language definition (`Lang.rgr` today)
2. **Compiler implementation** — parse → analyze → lower → codegen
3. **Application packages** — Ranger libraries under `lib/` today
4. **Target runtime** — C / WASM helpers under `runtime/`

**Out of scope for the first campaigns:** rewriting `RangerFlowParser`,
splitting `Lang.rgr` into many files, inventing a new Typed AST / IR pipeline,
or changing codegen behaviour.

---

## Why the current tree misleads

`compiler/` is flat and mixes phases: parsers, AST, semantic analysis, codegen,
every target writer, process features, LLVM, plugins, CLI helpers, plus clear
legacy (`Orig` / `backup` / `parser2` / one-off tests).

Misleading names (keep behaviour; rename later):

| Today | Actual role | Target name (phase 3) |
| --- | --- | --- |
| `ng_Compiler.rgr` / `CompilerInterface` | Tiny CLI entry that boots the orchestrator | stays thin; public API later `Compiler` |
| `VirtualCompiler` | Compilation orchestrator: targets, CLI, env, result | `CompilerDriver` / `CompilerSession` |
| `LiveCompiler` | Codegen driver; `initWriter()` picks target writer | `CodeGenerator` |
| `RangerFlowParser` (~8.2k LOC) | Semantic / static analysis + feature hooks | `SemanticAnalyzer` (split later) |
| `ng_RangerLanguageWriters.rgr` | Import barrel for all writers | `TargetRegistry` |
| `compiler/Lang.rgr` (~8.5k LOC) | Compile-time language/operator definition (not baked into binary) | `language/core.rgr` |
| `lib/stdlib.rgr` | Near-always helpers + ops (imports JSON etc.) | `language/prelude.rgr` |
| `lib/stdops.rgr` | Macro / operator extensions | `language/macros.rgr` (or keep `stdops` until settled) |

`CodeNode` is both parsed AST and semantically enriched IR. Do **not** try to
split that in the reorg; only place the file under `compiler/syntax/`.

---

## Target top-level layout

```text
Ranger/
├── compiler/            # compiler implementation only
├── language/            # language definition / builtins / prelude
├── packages/            # Ranger-authored general libraries (today: most of lib/)
├── runtime/             # native / WASM support for generated programs
├── tools/               # docs tooling, language server, playground support
├── tests/
├── examples/
├── gallery/
├── scripts/
└── archive/             # historical sources worth keeping, not on the live path
```

### Ideal `compiler/` (by compilation phase)

```text
compiler/
├── api/                 # public compile API surface (later)
├── driver/              # CLI + session orchestration (today: VirtualCompiler + helpers)
├── syntax/              # SourceCode, CodeNode, LispParser, SourceMap
├── semantic/            # FlowParser → SemanticAnalyzer + descriptors / type registry
├── lowering/
│   ├── process/
│   ├── immutable/
│   ├── serialize/
│   └── service/
├── codegen/
│   └── targets/         # one writer per language + TargetRegistry
├── llvm/
├── plugins/
└── docs/                # DocGenerator (compiler-side)
```

### Ideal `language/`

```text
language/
├── core.rgr             # from compiler/Lang.rgr
├── prelude.rgr          # from lib/stdlib.rgr
└── macros.rgr           # from lib/stdops.rgr (name TBD)
```

Later (not phase 1–3): split `core.rgr` into control_flow / arithmetic /
strings / collections / optionals / ownership / system.

### Ideal `packages/` (from today’s `lib/`)

Group by use, not by “stdlib”:

```text
packages/
├── data/          # json, sql
├── collections/   # immutable-vector, regex
├── time/
├── web/           # dom, http, storage, indexeddb
├── process/
├── server/        # http
└── legacy/        # engine3d, …
```

Future stack-shaped packages (`async/`, `io/`, `database/`, `state/`,
`view-model/`, `components/`) fit the same tree.

### Ideal `runtime/`

Keep the concept; clarify layout:

```text
runtime/
├── native/   # c/, cpp/ as needed
└── wasm/
```

**Terminology:** `packages/` = visible to Ranger programs; `runtime/` =
infrastructure required by generated target code.

---

## Mapping: current files → first homes (move-only)

Illustrative; refine during inventory. Class names stay until phase 3.

| Current | First destination (phase 2) |
| --- | --- |
| `ng_Compiler.rgr` | `compiler/driver/CompilerEntry.rgr` or keep path until API exists |
| `VirtualCompiler.rgr` | `compiler/driver/VirtualCompiler.rgr` |
| `InputFileSystem.rgr`, `CLIProgress.rgr`, `ColorConsole.rgr`, `CmdParams` usage | `compiler/driver/` |
| `ng_CodeNode.rgr`, `ng_parser_v2.rgr`, `ng_RangerLispParser.rgr` | `compiler/syntax/` |
| `ng_RangerFlowParser.rgr`, descriptors, `TTypeRegistry`, `ng_StaticAnalysis` | `compiler/semantic/` |
| `ng_RangerProcess*`, immutable / serialize / service builders | `compiler/lowering/...` |
| `ng_LiveCompiler.rgr`, `ng_RangerGenericClassWriter.rgr`, `ng_writer.rgr` | `compiler/codegen/` |
| `ng_Ranger*ClassWriter.rgr`, `ng_RangerLanguageWriters.rgr` | `compiler/codegen/targets/` |
| LLVM / LowIR family | `compiler/llvm/` |
| Plugins | `compiler/plugins/` |
| `RangerDocs` / `ng_RangerDocGenerator` | `compiler/docs/` |
| `Lang.rgr` | `language/core.rgr` |
| `lib/stdlib.rgr`, `lib/stdops.rgr` | `language/` |
| Rest of `lib/*.rgr` | `packages/...` |
| Dead Orig/backup/parser variants | `archive/compiler/` or delete |

---

## Migration phases (strict order)

**Never combine move + rename + behaviour change in one PR.**

### Phase 0 — Preconditions (checklist before starting)

- [ ] Rebase / branch from latest `origin/master`
- [ ] No large open PRs touching the same trees (or coordinate freeze)
- [ ] Agree PR base is `master` and this is a **new** branch (never reopen a merged reorg PR)

### Phase 1 — Inventory + dead-file cleanup

Build the **live self-host / `npm run compile` dependency graph** from:

- Entry: `compiler/ng_Compiler.rgr`
- Orchestrator: `VirtualCompiler.rgr` → `ng_LiveCompiler.rgr` → writers / FlowParser
- Env libs: `RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr` (see `package.json`)
- Dist copy: `lib/` → `dist/lib`, `Lang.rgr` / `stdops.rgr` → `bin/` / `dist/`

Classify everything else as: **live** | **test** | **example** | **archive** | **delete**.

Known archive candidates already sitting next to production sources:

```text
ng_CompilerOrig.rgr
ng_RangerFlowParserOrig.rgr
ng_RangerRustClassWriter_backup.rgr
ng_parser.rgr / ng_parser2.rgr / *_backup.rgr / ng_parser_ok*.rgr
ng_Execute.rgr / ng_Execute1.rgr
feature_tests.rgr / issue_57.rgr / ng_p_test.rgr / ng_ui_test.rgr
ng_DictNode2.rgr (verify unused)
```

Git already keeps history. Prefer **delete** if unused; else `archive/compiler/`
or `tests/compiler/legacy/`. Never leave them beside live sources.

**Deliverable:** a short inventory markdown (or section update here) listing
live roots and files to remove/move, with “referenced by” notes.

**Success:** compile / self-host / vitest still green after cleanup-only PR.

### Phase 2 — Move-only refactor

- Create new directories
- `git mv` (preserve history) for live files
- Update Imports, `RANGER_LIB`, `package.json` scripts, VS Code compile path,
  docs that hardcode paths
- **No class renames, no logic changes**

Suggested PR slices if one PR is too large:

1. Archive/delete only (if not already done)
2. `compiler/codegen/targets/` + writer barrel (easiest win)
3. `compiler/lowering/` for process / immutable / service / serialize
4. `compiler/semantic/` + `syntax/` + `driver/` moves
5. `language/` (`Lang` / prelude / macros) + `packages/` from `lib/`
6. `runtime/` layout polish + `tools/` gathering

After each slice: `npm run compile`, core tests, and at least one self-host
target smoke if that area was touched.

**Success:** same behaviour; paths updated; conformance / self-host green.

### Phase 3 — Naming refactor (high leverage first)

Do renames in small PRs after moves settle:

1. `LiveCompiler` → `CodeGenerator` (file + class)
2. `VirtualCompiler` → `CompilerDriver` (or `CompilerSession`) 
3. `RangerFlowParser` → `SemanticAnalyzer` (file + class; **no** internal split yet)
4. `ng_RangerLanguageWriters` → `TargetRegistry`
5. `Lang.rgr` → `language/core.rgr` (if not already path-renamed in phase 2)
6. `stdlib.rgr` → `prelude.rgr`

Optional public API sketch (later, after driver rename):

```ranger
def compiler (new Compiler)
def result (compiler.compile(source options))
```

CLI remains a thin shell: `rgrc` → `CompilerCLI` → `Compiler`.

**Success:** greps for old names are gone or aliased briefly then removed;
docs/FAQ updated for the three headline renames.

### Phase 4 — Responsibility refactor (only after 1–3)

Split monoliths **without** changing the directory story again:

From `SemanticAnalyzer` (ex-FlowParser), eventually:

```text
DeclarationCollector
TypeChecker
CallResolver
OperatorResolver
OwnershipAnalyzer
ShapeLowering
ProcessLowering   ; already partly separate under lowering/
```

From `language/core.rgr`: topic files under `language/core/`.

Still later / separate design: Source AST → Typed AST → Lowered IR → codegen.
Do not start that as part of “reorg”.

---

## Highest-value early wins (when the freeze lifts)

If only a short quiet window exists, prefer in this order:

1. **Dead-file cleanup** (phase 1) — immediate readability, tiny risk
2. **`codegen/targets/` + TargetRegistry barrel** — answers “where do I add a target?”
3. **Move `Lang.rgr` → `language/`** (still named `Lang.rgr` or already `core.rgr`) — separates language kernel from compiler
4. **Rename `LiveCompiler` / `VirtualCompiler` / `stdlib→prelude`** — architecture becomes legible without moving everything else

Avoid starting with FlowParser internal splits or `lib/` → full `packages/` tree
unless phases 1–2 for compiler are already landed.

---

## Risk register

| Risk | Mitigation |
| --- | --- |
| Massive merge conflicts with active feature PRs | Wait; freeze or rebase feature branches onto reorg; one concern per PR |
| Import path inconsistency (bare vs path) breaking inherited methods | One consistent import form per file; see AGENTS.md / ISSUES #64 |
| `RANGER_LIB` / dist / npm package path breakage | Checklist of `package.json`, `bin/`, `dist/`, gallery `RANGER_LIB`, langserver |
| VS Code extension compile entry (`VirtualCompiler.rgr`) | Update `compile:langserver` and extension docs in same PR as driver move |
| Accidental behaviour change during “move” | Diff review: only paths + imports; no method body edits |
| Trying to fix AST vs IR in the same effort | Explicitly forbidden until phase 4+ design doc |

---

## Non-goals (this initiative)

- Compiler architecture rewrite
- Aggressive FlowParser / Lang.rgr decomposition in the first PRs
- New IR layers or Typed AST
- Renaming `CodeNode` → `AstNode` before compatibility story exists
- Reworking gallery/game_engine layout (optional later under `tools/` / examples)

---

## Suggested kickoff commands (when ready — not now)

```bash
git fetch origin master
git checkout -B cursor/repo-reorg-inventory-<id> origin/master
# Phase 1: dependency inventory script + archive/delete PR only
# Then separate branches per phase-2 slice; each rebased on latest master
```

Self-host / compile anchors to keep green:

- `npm run compile`
- `npm test` (or the scoped conformance set agreed at kickoff)
- Relevant `selfhost:*` smokes if language path or driver moved

---

## Decision summary

- Primary purpose: **make responsibilities visible**, not rewrite the compiler
- Separate **compiler / language / packages / runtime** at the top level
- Organize `compiler/` by **phase** (syntax → semantic → lowering → codegen)
- Treat process / immutable / service / serialize as **lowering**, not forever
  inside the semantic monolith
- Migrate in **inventory → move-only → rename → split** order
- **No code moves in this planning PR**; execute only when other work has paused
)
