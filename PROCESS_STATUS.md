# Ranger `@process` — implementation status

Factual status of the **compiler and runtime** slice. For whether the MVP is **enough to build product orchestration** (messages, UI, timers, navigation), see **[PROCESS_MVP.md](PROCESS_MVP.md)**.  
For how `@process` relates to Smalltalk, React hooks, Erlang, and other models, see **[PROCESS_COMPARISON.md](PROCESS_COMPARISON.md)**.

Last updated after **`proc_send`**, **`findProcess` on `ProcessNameRegistry`**, singleton `new` for TS, and the **Vite counter-board gallery**.

---

## Summary

| Layer | State |
|-------|--------|
| **Compiler MVP** | Working: `@process`, tree, registry, `proc_*`, `proc_send`, named paths, subtree stop — JS / Kotlin tested; Swift6 for `process_nesting` + `process_page_lifecycle` (vitest when `swiftc` present) |
| **TypeScript hosts** | `-typescript` emits `ProcessPath`, `findProcess` on registry, `interface ProcessNameRegistry` overloads; `new @singleton()` returns shared instance |
| **Web gallery** | [`gallery/process_counter_board/`](gallery/process_counter_board/) — Vite + React, `findProcessByPath` / `new ProcessNameRegistry().findProcess(...)` |
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
| **Cross-class view DTO field assign** | **Limitation** — plain view classes cannot reliably be filled from `@process` builders; see [PROCESS_UI_VIEW_MODELS.md](PROCESS_UI_VIEW_MODELS.md) |
| **`@name("app.path")` on `@process` classes** | Done — compile-time unique path; `find_process "path"` in `.rgr`; `ProcessNameRegistry` bind on `proc_start` |
| **`proc_send` (typed handlers)** | Done — `proc_send target handlerName arg…`; handler is a **method identifier**; emits guarded `call` if `__rangerId != 0`; `cmdCall` type-checks args; path literals rejected (use `find_process` + cast + variable) |
| **`proc_send` (path string target)** | Not done — use typed variable after `find_process` + `cast`; see [§ `proc_send`](#proc_send--typed-handlers-mvp) |
| **`findProcess(path)` (registry)** | Done — generated `extension ProcessNameRegistry`; live-only (`hasLive`); TS: `interface` overloads for literal paths |
| **Singleton `new` in TS/JS emit** | Done — `new ProcessNameRegistry()` returns `__singleton_instance` (constructor guard) |
| **`markStateDirty` / `ProcessUiHost`** | Done — bump + notify; `flushUiNotify`, `bumpStateGeneration`, `beginSuppressUiNotify` — see [PROCESS_UI_NOTIFY.md](PROCESS_UI_NOTIFY.md) |
| **`ProcessRuntime.collectAllLiveRoots`** | Done — static extension (`sfn`); used by gallery process tree panel |

**Wiring:** `ng_RangerFlowParser`, `ng_RangerProcessClass`, `ng_RangerProcessLifecycle`, `ng_RangerJavaScriptClassWriter` (singleton ctor), `VirtualCompiler` (`file_end` TS helpers).

**Runtime:** `lib/RangerProcess.rgr`

---

## Named lookup & messaging (how to call from hosts)

| API | Where | Use |
|-----|--------|-----|
| `find_process "app.path"` | Ranger `.rgr` | Operator → `ProcessNameRegistry.__singleton().findByPath` |
| `proc_send target onHandler arg…` | Ranger `.rgr` | Typed handler method + args → guarded `call` when live |
| `findByPath` / `findProcess` | Generated `ProcessNameRegistry` | Host TS/Kotlin/Swift after `proc_start` |
| `new ProcessNameRegistry().findProcess(path)` | TypeScript | Singleton `new`; typed path when `-typescript` |
| `findProcessByPath(path)` | Gallery [`processPaths.ts`](gallery/process_counter_board/src/processPaths.ts) | Thin wrapper around `new … findProcess` |

**Gallery call sites:** [`counterBoardHost.ts`](gallery/process_counter_board/src/host/counterBoardHost.ts), [`useProcess.ts`](gallery/process_counter_board/src/hooks/useProcess.ts), [`CounterBoard.tsx`](gallery/process_counter_board/src/components/CounterBoard.tsx) (UI line showing registry lookup).

Exploratory native galleries (no CI): [`gallery/process_counter_android/`](gallery/process_counter_android/), [`gallery/process_counter_ios/`](gallery/process_counter_ios/) — `findByPath` + manual refresh patterns documented in README/ISSUES.

### `proc_send` — typed handlers (MVP)

**Syntax (compile time):**

```ranger
proc_send alphaPage onHello "hello" "world"
proc_send tickChild onTick 1
```

- **`target`** — typed `@process` variable (not a path string).
- **`handlerName`** — method identifier on the receiver class (not a string literal).
- **Arguments** — normal Ranger expressions; arity/types checked when the generated `call` is analyzed.

**Lowering:** `ng_RangerProcessProcSend.rgr` rewrites to `if (target.__rangerId != 0) { call target onHello … }`. Reserved names: `start`, `stop`, `hibernate`, `wakeup`, `receiveMessage`, `__ranger*`.

**Named path send (today):** assign `find_process` + `cast`, then `proc_send` the typed variable:

```ranger
def live:AlphaPage (cast (unwrap (find_process "app.alpha")) to:AlphaPage)
proc_send live onHello "hello" "world"
```

**Next:** `proc_send "app.alpha" onHello …` with path→class resolution in the analyzer; overload pick by argument types at send site (not only `findMethod`); optional message structs instead of loose args.

---

## What works well (implementation)

Solid for demos, tests, and an app-ranger pilot:

- Wrapped `new` + parent chain without manual parent ids
- `parentIdOf`, per-class registry, `allInstances()`, `ProcessRuntime.collectAllLiveRoots()`
- `process_page_lifecycle` — stop order Tick → Timer → Page on switch
- `proc_*` operators; `new` vs `proc_start`
- Named paths + `proc_send` fixture ([`tests/fixtures/process_proc_send.rgr`](tests/fixtures/process_proc_send.rgr))
- Vitest: `compiler-process-named`, `compiler-process-send`, `compiler-process-typescript`, lifecycle/kotlin/swift suites

Details and fixture commands: [PROCESS_MVP.md](PROCESS_MVP.md).

---

## Weak areas (implementation & hygiene)

| Area | Notes |
|------|--------|
| **Child tracking** | `__rangerChildren` only when `new` runs under a live parent process method; top-level `new` → root. |
| **Stopped instances** | `__rangerId == 0` after stop; `findProcess` / `hasLive` treat as not found; map entry may linger until overwrite. |
| **`proc_stop "ClassName"`** | Stops all live instances of that type app-wide. |
| **Navigation** | No compiler hook on field assign; app calls `proc_stop` (fixture `switchTo`). |
| **`hibernate` / `wakeup`** | Codegen present; no standard payload format. |
| **Missing `fn start` on `proc_start` target** | Compile error at `proc_start` site; with `-debug`, codegen emits a DEBUG line from `__rangerInvokeStart` when no user `start` exists. |
| **Swift** | `process_page_lifecycle` in Swift vitest matrix (`compiler-process-kotlin-swift`, `compiler-process-lifecycle`) when `swiftc` is available. |
| **Kotlin/Swift typed `findProcess`** | Not done — TS gets `ProcessPath` + interface overloads only. |
| **Singleton `new` on Kotlin/Swift** | TS/JS constructor guard only; native galleries still use `__singleton()`. |
| **Other backends** | `@process` / `proc_*` not verified on Rust, Go, Python, … |
| **`parentOf` object** | Only `parentIdOf:int` — analyzer deferred. |
| **`spawn local` / `global`** | Not implemented. |
| **Packaging** | `lib/RangerProcess.rgr` is copied by `npm run build:dist` → `dist/lib/` (use `rm -rf dist/lib` before copy; nested `dist/lib/lib/` was a stale `cp` artifact). |
| **Bootstrap** | After FlowParser / writer edits run `npm run compile` twice. |
| **app-ranger integration** | Pilot not merged; kernel still on `Process.rgr`. |
| **`proc_send` path literal target** | Rejected at compile time — use `find_process` + cast variable ([§ `proc_send`](#proc_send--typed-handlers-mvp)). |

### `@process` spawn rules (enforced at compile time)

| Rule | Meaning |
|------|---------|
| **Named `@process`** (`@name("app.…")`) | `new` only in **`@(main)` bootstrap** or inside a **named** `@process` **instance method** (`fn`). Emits **`__rangerRegisterRoot()`** (discoverable root, `__rangerParentId == 0`). |
| **Dynamic child** (no `@name`) | `new` only inside an **instance method** on any live `@process` (`fn`, not `sfn`/static). Emits **`__rangerRegisterChild(parent)`** when parent `__rangerId != 0`. |
| **Orchestrator / static** | Non-`@process` classes must not `new` `@process` types; use a named root + its methods (see fixtures’ **`AppRoot @name("app.root")`**). |

Negative fixtures: `tests/fixtures/process_spawn_orphan_bad.rgr`, `tests/fixtures/process_proc_start_no_start_bad.rgr`. Tests: `tests/compiler-process-spawn-rules.test.ts`.

---

## Real gaps (need compiler, analyzer, or release)

| Gap | Blocker type |
|-----|----------------|
| **`spawn local` / `spawn global`** | Compiler operator + registry semantics |
| **Typed optional `parentOf`** | Analyzer + codegen |
| **`@process` on unsupported targets** | Backend writers + tests |
| **`describe` / `RangerClassDescriptor` wired** | Compiler tooling |
| **Cross-app `hibernate` wire format** | Spec / lib, if product needs portable sleep |
| **`proc_send` path string + overload resolution** | Extend `RangerProcessProcSend` to resolve `@name` paths and pick variant by arg types at send site |
| **`proc_send` async / broadcast / by-id only** | Deferred v2 — see [PROCESS_COMPARE_WITH_OBJECTIVEC.md](PROCESS_COMPARE_WITH_OBJECTIVEC.md) |
| **Auto `markStateDirty` on field assign** | Codegen or analyzer hook |
| **`ProcessUiHost` forwarder in Kotlin/Swift emit** | Native gallery needs assignable host bridge |

Streams/async inside `@process` methods are **not** required — host-driven I/O + `receiveMessage` / queues per [PROCESS_MVP.md](PROCESS_MVP.md).

---

## Rebuild & test

```bash
cd /path/to/Ranger
npm run compile
npm run compile   # if FlowParser / process emit changed

npx vitest run \
  tests/compiler-process-spawn-rules.test.ts \
  tests/compiler-process-named.test.ts \
  tests/compiler-process-send.test.ts \
  tests/compiler-process-typescript.test.ts \
  tests/compiler-process.test.ts \
  tests/codegen-process.test.ts \
  tests/compiler-process-kotlin-swift.test.ts \
  tests/compiler-process-lifecycle.test.ts \
  tests/compiler-singleton.test.ts
```

### Web gallery

```bash
cd gallery/process_counter_board
npm install
npm run build:ranger   # Ranger → src/generated/counter_board.ts
npm run dev            # Vite on port 5188
```

### Manual native run

```bash
node bin/output.js -kotlin tests/fixtures/process_page_lifecycle.rgr -d=tests/.output -o=process_page_lifecycle.kt
cd tests/.output && kotlinc process_page_lifecycle.kt -include-runtime -d page.jar && java -jar page.jar

node bin/output.js -swift6 tests/fixtures/process_nesting.rgr -d=tests/.output-swift -o=process_nesting.swift
cd tests/.output-swift && swiftc process_nesting.swift -parse-as-library -o process_nesting && ./process_nesting

node bin/output.js -swift6 tests/fixtures/process_page_lifecycle.rgr -nodecli -d=tests/.output-swift -o=process_page_lifecycle.swift
cd tests/.output-swift && swiftc process_page_lifecycle.swift -parse-as-library -o process_page_lifecycle && ./process_page_lifecycle
```

---

## Suggested next steps

1. **app-ranger pilot** — one route/slot as `@process`; kernel calls `proc_start` / `findProcess` or `find_process`; messages via `proc_send` or queues — [PROCESS_MVP.md](PROCESS_MVP.md).
2. **Kotlin/Swift parity** — `findProcess` on registry (untyped `string`) + optional singleton `new` in native writers; wire `ProcessUiHost` for Compose/SwiftUI galleries.
3. **`spawn local`** — when duplicate children under one parent become painful.
4. **`parentOf` typed optional** — when analyzer allows.
5. **Gallery: `receiveMessage` demo** — console ping to `app.counterBoard` from a second named process in `.rgr` or devtools snippet.
6. **Optional stream fixture** — host pumps chunks into `receiveMessage` / `onChunk` without compiler `async`.
7. **README for `proc_*` / `@name` / TS host** — document `Import "RangerProcess.rgr"` and `RANGER_LIB` for npm installs; run `npm run build:dist` before publish.
8. **Auto `markStateDirty`** — reduce boilerplate in `.rgr` and generated hosts.
9. **`proc_send` by path** — compile-time path → class; same handler/arg checking as variable target.

---

## Related docs

| Doc | Contents |
|-----|----------|
| [PROCESS_MVP.md](PROCESS_MVP.md) | MVP scope, sufficiency, `proc_send`, streams as host pattern |
| [PROCESS_LIFECYCLE.md](PROCESS_LIFECYCLE.md) | Operators, `start`/`stop`/hibernate, `spawn` (planned) |
| [PROCESS_COMPARE_WITH_OBJECTIVEC.md](PROCESS_COMPARE_WITH_OBJECTIVEC.md) | ObjC messaging, protocols, run loop parallels |
| [PROCESS_COMPARISON.md](PROCESS_COMPARISON.md) | Smalltalk / React / Erlang vs `@process` |
| [gallery/process_counter_board/README.md](gallery/process_counter_board/README.md) | Vite sample, `find_process` vs `findProcess` vs `useProcess` |
