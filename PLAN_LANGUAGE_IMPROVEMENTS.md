# PLAN: Ranger Language Improvements

> **Origin:** Authored in [terotests/koodisampo](https://github.com/terotests/koodisampo/blob/main/docs/ranger-language-improvement-plan.md)
> because the authoring agent did not have push access to the Ranger repo at the time.
> Canonical location in this repo: `PLAN_LANGUAGE_IMPROVEMENTS.md` (next to `PLAN_3.md`).
>
> Informed by the Ranger repo (README, `ISSUES.md`, `PLAN_3.md`, `ai/GRAMMAR.md`) and by
> real-world usage in koodisampo (~10 700 lines of `.rgr` game logic compiled to ES6 and Kotlin).

## Implementation status (Ranger repo)

| Item | Track | Status |
|------|-------|--------|
| Recursive relative import resolution (#61) | 4 | Done (prior work); regression tests added |
| LF/CRLF/CR line-ending normalization in parser (`ng_parser_v2.rgr`) | 1 | Done |
| Type-name diagnostics (no enum integers in errors) | 3.3 | Done |
| `SPEC_SEMANTICS.md` | 1 | Done |
| Cross-target conformance harness | 1 | Done |
| Records / payload enums / `match` | 2 | Done as `record` + `shape` / `case` / `group` + `match` with exhaustiveness — see `PLAN_SHAPES.md` (S1, S2). Payload `Enum` stays unbuilt on purpose: it would be sugar over `shape` |
| Centralized type registry (#15/#59/#60) | 3.1 | Partial (`TTypeRegistry` routes core lookups; `primitivetype` Lang syntax and writer migration ongoing) |
| Control-flow return analysis (#16) | 3.2 | Not started |
| Predictable `-d`/`-o` for `-nodemodule` (#62) | 4 | Not started |

---

## Executive summary

Ranger's core value proposition — write an algorithm once, compile it to many languages — already works.
The weakest parts today are not the compiler backends but the **language surface** (missing data-modeling
constructs force verbose, error-prone code), **semantic consistency across targets** (the same program can
behave differently in Go and ES6), and **diagnostics/tooling**. This plan proposes improvements in five
tracks, ordered so that each track delivers standalone value:

1. **Semantics first** — write down what the language means, and enforce it with a cross-target conformance suite.
2. **Data modeling** — records, enums with payloads (tagged unions), and `match`, so users stop simulating
   structure with parallel arrays and flat scalar fields.
3. **Type-system internals** — centralized type registry (fixes ISSUES #15/#59/#60 as a class, not one by one)
   and control-flow-aware return analysis (#16).
4. **Modules and imports** — recursive relative imports (#61), predictable output options (#6/#62).
5. **Developer experience** — error message quality, LSP completion, formatter, source-map-like traceability.

Non-goals: new target languages, async/concurrency primitives, macro system, self-hosted package manager.

---

## Motivating evidence

### From koodisampo (a real ~10 700-line Ranger codebase)

- `GameSession.rgr` has **~100 flat scalar fields** (`pendingEntityId`, `pendingEntityChar`,
  `pendingEntityName`, `blockedTalkId`, `blockedTalkChar`, …) because there is no lightweight way to
  declare a record/value type inline and no sum types to express "the session is in exactly one of these
  states, each with its own data".
- Related data is stored in **parallel arrays** (`memorialMournerIds` + `memorialMournerNames` +
  `memorialMournerEpitaphs`) — a classic pattern that records + a single `[Mourner]` array would replace.
- String-typed state machines (`screen:string "map"`, `actionPhase:string ""`) where a payload-less enum
  would already help, and a payload-carrying enum would eliminate the companion fields entirely.

None of this blocks shipping — koodisampo works — but every one of these patterns is a latent bug factory
(desynced parallel arrays, typo'd state strings) that the language could prevent.

### From the Ranger repo itself

- `ISSUES.md` #15, #59, #60: adding one primitive type requires edits in **6+ files, 10+ locations**, and a
  missed location surfaces as a runtime "Types were 16 vs 10" error. Root cause: no single type registry.
- `ISSUES.md` #58 (Go slice pass-by-value), #57 (UTF-8 byte vs rune indexing): the same Ranger program has
  **different observable behavior per target**. These were fixed case by case; nothing prevents the next one.
- `ISSUES.md` #12 (CRLF sensitivity): the parser silently mis-compiles LF-only sources. A silent-wrong-output
  bug class must become impossible, not just this instance.
- `ISSUES.md` #61: relative imports don't resolve recursively, blocking multi-directory projects
  (it literally blocked the EVG PDF tool inside the Ranger repo itself).
- `ISSUES.md` #16: no control-flow analysis for returns → false "Function does not return any values!"
  warnings that train users to ignore warnings.

---

## Guiding principles

1. **Semantics over features.** A smaller language that behaves identically on every target beats a bigger
   one that doesn't. Every new feature ships with conformance tests on at least ES6, Go, and Kotlin.
2. **Lower-friction data modeling is the highest-leverage language change.** Records + enums + match remove
   more real-world bugs than any other addition.
3. **Fix bug classes, not bugs.** The type registry (track 3) turns three open design issues into one fix.
4. **Don't break existing code.** All syntax additions are opt-in; existing `.rgr` sources keep compiling.
   The self-hosted compiler is the canary: every change must leave the compiler able to compile itself.
5. **ES6 stays the reference target.** New semantics are defined by the reference implementation on ES6,
   then other targets conform to it.

---

## Track 1 — Semantic specification and conformance suite

**Problem.** "What does this program do?" currently has per-target answers (Go slices vs JS arrays,
byte vs rune indexing, integer division). `ai/GRAMMAR.md` describes syntax but not semantics.

**Work items**

- [ ] Write `SPEC_SEMANTICS.md`: evaluation order, numeric semantics (`int` division, overflow expectations),
  string semantics (**define `strlen`/`charAt`/`substring` as code-point-based on every target** —
  this generalizes the Issue #57 fix into a rule), reference vs value semantics for arrays, maps, and
  class instances passed as parameters (this decides Issue #58 at the spec level: arrays are reference
  types, and targets where that is not natural must compile them accordingly, e.g. Go `*[]T` wrappers
  or a slice-header box).
- [ ] Build a **conformance harness**: one fixture directory where each fixture is a `.rgr` program plus an
  `expected_output.txt`; the harness compiles and runs it on every runnable target and diffs outputs.
  (Extends the existing `tests/compiler-*.test.ts` pattern from per-target to cross-target.)
- [ ] Seed the suite from every semantic bug already in `ISSUES.md` (#4, #57, #58, #59-go-clear, #12-CRLF).
- [x] Normalize line endings in the lexer (accept LF, CRLF, CR) and delete the CRLF workaround; add
  LF-only fixtures to CI so the Issue #12 class cannot recur.

**Exit criterion.** A target is listed as "supported" in the README if and only if it passes the
conformance suite; the support table is generated from CI results instead of hand-maintained.

---

## Track 2 — Data modeling: records, payload enums, match

**Problem.** See the koodisampo evidence above. The class construct is too heavy (separate file/section,
constructor boilerplate) for "a bag of named fields", and there is no way to express disjoint alternatives.

### 2.1 Records

Lightweight nominal value types with structural construction, compiling to plain classes/structs per target:

```ranger
record Mourner {
    id:string
    name:string
    epitaph:string
}

def m:Mourner (Mourner id:"npc1" name:"Kaisa" epitaph:"...")
def mourners:[Mourner]
push mourners m
```

- Auto-generated: field-order constructor, per-field copy (`with`-style update can come later).
- Codegen: ES6 class, Kotlin data class, Go struct, Swift struct — all targets already have the machinery
  because records are a restricted class.

### 2.2 Enums with payloads (tagged unions)

> **See `PLAN_SHAPES.md` — this section and 2.3 are built.** That document works them out
> against a real problem case (`EvalValue.rgr`) and lands the payload-carrying family as its
> own construct (`shape` / `case` / `group`) rather than an extension of `Enum` — so `Enum`
> stays a plain integer enum and each target may pick its own physical representation.
> `shape` and `match` compile and run on nine targets today, with a missing, duplicated or
> catch-all arm reported as a compile error. What remains is the semantics
> (`@(value)` / `@(reference)`) and the native per-target representations.

Extend the existing `Enum` construct (currently bare `Enum MyEnum ( Val1 Val2 )`):

```ranger
enum Screen {
    Map
    Encounter ( entityId:string entityName:string kind:string )
    GameOver  ( reason:string )
}
```

- Codegen strategy: tag field + nullable payload record per variant. ES6: `{tag, payload}`;
  Kotlin: sealed class; Go: struct with tag + pointers; targets without sum types get the tag+fields lowering.
- Bare enums stay source-compatible (a payload-less variant is just a tag).

### 2.3 `match` statement

> **Built** — over a `shape` rather than an enum; see `PLAN_SHAPES.md` §6.2 for the
> lowering and the exact diagnostics.

```ranger
match screen {
    Map { this.renderMap() }
    Encounter e { this.renderEncounter(e.entityId e.entityName) }
    GameOver g { this.renderGameOver(g.reason) }
}
```

- Exhaustiveness checking (compile error on missing variant unless `default` present) — this is the actual
  bug-prevention payoff; without it, `match` is just `switch` with extra steps.
- Lowering: `switch` on the tag + scoped payload binding; no target needs native pattern matching.

**Sequencing.** 2.1 → 2.2 → 2.3, each usable alone. Records alone would already let koodisampo collapse
its parallel arrays. Dogfood: convert one compiler-internal type cluster and one koodisampo subsystem
(e.g. memorial data) as validation before declaring stable.

---

## Track 3 — Type-system internals

### 3.1 Centralized type registry (fixes #15, #59, #60 as a class)

Adopt the `primitivetype` declaration already sketched in ISSUES.md #15:

```ranger
primitivetype buffer {
    enum Buffer
    es6 "ArrayBuffer"
    go "[]byte"
    rust "Vec<u8>"
    cpp "std::vector<uint8_t>"
    kotlin "ByteArray"
}
```

- [ ] One registry object owned by the root compilation context; `TTypes`, `isPrimitiveType`,
  `isDefinedType`, `defineNodeTypeTo`, `getType`, and every class writer's `getTypeString` query it
  instead of hardcoded lists.
- [ ] Systemclass definitions parsed from `Lang.rgr` are injected into the **root** context (Option 3 of
  Issue #60), so `class MyServer@(HttpServer)`-style extensions never need compiler edits again.
- [ ] Migrate existing hardcoded types (`buffer`, `charbuffer`, `int_buffer`, `double_buffer`, HTTP types)
  onto the registry and delete the per-file `case` lists (table in Issue #59 is the checklist).

### 3.2 Control-flow return analysis (fixes #16)

- [ ] Implement "all paths return" analysis over if/else, switch/match, and blocks; drop the false warning.
- [ ] Once reliable, promote missing-return from warning to error for non-`void` functions (behind a flag
  first, default in the next major).

### 3.3 Diagnostics quality

- [x] Every type error prints **type names**, never enum integers ("Types were 16 vs 10" → "expected
  `buffer`, got `string`).
- [ ] Errors carry file, line, column and the source line with a caret consistently (some phases already
  do this, some don't).
- [ ] "Did you mean" suggestions for unknown identifiers/types using edit distance over the registry
  and scope — cheap to add once the registry exists.

---

## Track 4 — Modules and imports

- [x] **Recursive relative import resolution** (#61): resolve each `Import` relative to the importing file's
  directory; push/pop that directory on the library-path stack while processing that file's own imports.
- [ ] **Predictable output options** (#6, #62): `-d` and `-o` behave identically on every code path including
  `-nodemodule`; extension auto-append only when `-o` has no extension; add CLI tests for the matrix.
- [ ] **Import diagnostics**: on failure, print the directories searched and closest-name matches.
- [ ] Defer full namespaces/packages: file-scoped imports with correct relative resolution are sufficient
  for current project sizes (koodisampo's 37-file tree works with a flat namespace). Revisit after Track 2.

---

## Track 5 — Developer experience

- [ ] **LSP completion** (continues PLAN_3 Phase 4): go-to-definition, hover types, and diagnostics-as-you-type
  on top of the existing introspection API (`getTypeAtPosition` already exists — wire it up).
- [ ] **Formatter** (`rgrc fmt`): canonical formatting ends the CRLF/LF ambiguity operationally and makes
  diffs in generated-code-adjacent PRs reviewable.
- [ ] **Traceability**: emit `//: <source>` comments in generated code behind a `-linemap` flag as a
  cheap first step toward source maps; real source maps for ES6 after that.
- [ ] **AI/docs**: keep `ai/QUICKREF.md` and `ai/GRAMMAR.md` in sync with new constructs (records, enums,
  match) in the same PR that lands the feature — these files are the de-facto onboarding path for both
  humans and agents.

---

## Sequencing and dependencies

```
Track 1 (spec + conformance)  ──► gates every other track's "done"
Track 3.1 (type registry)     ──► prerequisite for clean codegen of records/enums (Track 2)
Track 4 recursive imports     ──► independent, high value, small diff — do first
Track 2 records → enums → match (in order)
Track 3.2, 3.3, Track 5       ──► parallelizable, no ordering constraints
```

Suggested first three PRs, each small and independently mergeable:

1. Recursive import resolution + tests (Track 4, fixes #61). **Done in this PR (tests + prior implementation).**
2. Line-ending normalization in the lexer + LF fixtures in CI (Track 1, kills the #12 bug class). **Done in this PR.**
3. Type-name diagnostics instead of enum integers (Track 3.3). **Done in this PR.**

## Risks

| Risk | Mitigation |
|------|------------|
| Self-hosted compiler breaks mid-refactor (type registry touches everything) | Migrate one type at a time; keep hardcoded path as fallback until registry passes full test suite; compiler-compiles-itself is a CI gate |
| Sum-type lowering is awkward on struct-only targets (Go, C++) | Define lowering in the spec first; conformance fixtures per variant shape before exposing syntax |
| Array reference semantics on Go is invasive (#58) | Spec decision first; if boxing is too costly, spec documents arrays-as-parameters as copy-on-grow and the compiler **errors** on `push`/`clear` of a parameter array instead of silently mis-compiling |
| Feature creep (match guards, generics, …) | Each track has explicit non-goals; anything not listed goes to a future plan |

## Success criteria

- Conformance suite green on ES6, Go, Kotlin for every fixture; support table generated from CI.
- Adding a new primitive type = one `primitivetype` block, zero class-writer edits.
- A koodisampo-scale codebase can model its state with records/enums: no parallel arrays, no string-typed
  state machines, and the compiler catches a missing `match` arm.
- No open issue in `ISSUES.md` of the form "same program, different behavior per target".
