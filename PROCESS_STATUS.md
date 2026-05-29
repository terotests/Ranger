# Ranger `@process` — implementation status

Factual status of the **compiler and runtime** slice. For whether the MVP is **enough to build product orchestration** (messages, UI, timers, navigation), see **[PROCESS_MVP.md](PROCESS_MVP.md)**.

Last updated after unified `__rangerId` and lifecycle fixtures.

---

## Summary

| Layer | State |
|-------|--------|
| **Compiler MVP** | Working: `@process`, tree, registry, `proc_*`, subtree stop — JS / Kotlin tested; Swift6 for `process_nesting` |
| **app-ranger** | Still uses legacy `Process` / `ProcessKernel`; not yet wired to `@process` |
| **Product orchestration** | Achievable on MVP primitives + app-ranger patterns — see [PROCESS_MVP.md](PROCESS_MVP.md) |

---

## Feature checklist (compiler / runtime)

| Piece | Status |
|--------|--------|
| **`@process(true)` on classes** | Done |
| **Auto `extends RangerProcessBase`** | Done |
| **Wrapped `new` + parent registration** | Done (JS / Kotlin / Swift6) |
| **`parentIdOf(child)`** | Done — ancestor `__rangerId` or `0` |
| **Instance registry** | Done — `Foo__Registry`, `track`, `untrack`, `allInstances` |
| **Lifecycle `start` / `stop` / `hibernate` / `wakeup`** | Done — optional user methods + `__rangerInvoke*` |
| **`__rangerStopSubtree()`** | Done — children DFS → `stop()` → untrack |
| **Unified `__rangerId`** | Done — `ProcessIdRegistry` at register |
| **`proc_start` / `proc_stop` / `proc_hibernate` / `proc_wakeup`** | Done — [PROCESS_LIFECYCLE.md](PROCESS_LIFECYCLE.md) |
| **`spawn local` / `spawn global`** | Not done — **compiler** |
| **`havingChild` / tree queries** | Not done |
| **Field `describe` introspection** | Not done |
| **Message queue / `tick` in compiler** | Not done — **not required** for product; app pattern — [PROCESS_MVP.md](PROCESS_MVP.md) |
| **UI binding codegen** | Not done — **not required**; app-ranger `pageSetValue` + bus |

**Wiring:** `ng_RangerFlowParser`, `ng_RangerProcessClass`, `ng_RangerProcessLifecycle`, `ng_RangerProcessCodegen`, writers (JS / Kotlin / Swift6).

**Runtime:** `lib/RangerProcess.rgr`

---

## What works well (implementation)

Solid for demos, tests, and an app-ranger pilot:

- Wrapped `new` + parent chain without manual parent ids
- `parentIdOf`, per-class registry, `allInstances()`
- `process_page_lifecycle` — stop order Tick → Timer → Page on switch
- `proc_*` operators; `new` vs `proc_start`
- Vitest + CLI fixtures (`process_nesting`, `process_page_lifecycle`)

Details and fixture commands: [PROCESS_MVP.md](PROCESS_MVP.md).

---

## Weak areas (implementation & hygiene)

Issues in the **current slice** — mix of real limits, conventions, and missing tests.

| Area | Notes |
|------|--------|
| **Child tracking** | `__rangerChildren` only when `new` runs under a live parent process method; top-level `new` → root. Convention + possible future lint/codegen. |
| **Stopped instances** | `__rangerId == 0` after unregister; app fields may still hold references. |
| **`proc_stop "ClassName"`** | Stops all live instances of that type app-wide. |
| **Navigation** | No compiler hook on field assign; app calls `proc_stop` (fixture `switchTo`). |
| **`hibernate` / `wakeup`** | Codegen present; no standard payload format. |
| **Missing `fn start`** | Empty base stub; no compile error. |
| **Swift** | `process_page_lifecycle` not in Swift CI matrix (Kotlin runs it). |
| **Other backends** | `@process` / `proc_*` not verified on Rust, Go, Python, … |
| **`parentOf` object** | Only `parentIdOf:int` — analyzer deferred. |
| **`spawn local` / `global`** | Not implemented. |
| **Packaging** | `RangerProcess.rgr` may be absent from `dist/lib`. |
| **Bootstrap** | Stale `bin/output.js` after FlowParser edits — run `npm run compile`. |
| **app-ranger integration** | Pilot not merged; kernel still on `Process.rgr`. |

---

## Real gaps (need compiler, analyzer, or release — not “app forgot to wire”)

| Gap | Blocker type |
|-----|----------------|
| **`spawn local` / `spawn global`** | Compiler operator + registry semantics |
| **Typed optional `parentOf`** | Analyzer + codegen |
| **`@process` on unsupported targets** | Backend writers + tests |
| **Reliable child list for all `new` sites** | Codegen or static convention enforcement |
| **`describe` / `RangerClassDescriptor` wired** | Compiler tooling |
| **Cross-app `hibernate` wire format** | Spec / lib, if product needs portable sleep |

Everything else called out in older docs as “product gap” (messages, UI bus, page table, timer cancel) is covered under **fulfillable on MVP** in [PROCESS_MVP.md](PROCESS_MVP.md).

---

## Rebuild & test

```bash
cd /path/to/Ranger
npm run compile
npx vitest run tests/compiler-process.test.ts tests/codegen-process.test.ts \
  tests/compiler-process-kotlin-swift.test.ts tests/compiler-process-lifecycle.test.ts \
  tests/compiler-singleton.test.ts
```

### Manual native run

```bash
node bin/output.js -kotlin tests/fixtures/process_page_lifecycle.rgr -d=tests/.output -o=process_page_lifecycle.kt
cd tests/.output && kotlinc process_page_lifecycle.kt -include-runtime -d page.jar && java -jar page.jar

node bin/output.js -swift6 tests/fixtures/process_nesting.rgr -d=tests/.output-swift -o=process_nesting.swift
cd tests/.output-swift && swiftc process_nesting.swift -parse-as-library -o process_nesting && ./process_nesting
```

Bootstrap: if `bin/output.js` is stale after FlowParser changes, run `npm run compile` (sometimes twice).

---

## Suggested next steps

1. **app-ranger pilot** — `@process` behind one kernel path; see [PROCESS_MVP.md](PROCESS_MVP.md).
2. **`spawn local`** — when duplicate children become painful.
3. **Swift CI** for `process_page_lifecycle`.
4. **`parentOf` typed optional** — when analyzer allows.
5. **Ship `RangerProcess.rgr` in `dist/lib`** + README for `proc_*`.

---

## Related docs

| Doc | Contents |
|-----|----------|
| [PROCESS_MVP.md](PROCESS_MVP.md) | MVP scope, sufficiency argument, real vs apparent gaps, fixtures |
| [PROCESS_LIFECYCLE.md](PROCESS_LIFECYCLE.md) | Operators, `start`/`stop`/hibernate, `spawn` (planned) |
| [PROCESS_COMPARE_WITH_OBJECTIVEC.md](PROCESS_COMPARE_WITH_OBJECTIVEC.md) | ObjC messaging, protocols, run loop parallels |
