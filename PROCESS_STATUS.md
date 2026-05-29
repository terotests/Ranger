# Ranger `@process` — implementation status

Factual status of the **compiler and runtime** slice. For whether the MVP is **enough to build product orchestration** (messages, UI, timers, navigation), see **[PROCESS_MVP.md](PROCESS_MVP.md)**.  
For how `@process` relates to Smalltalk, React hooks, Erlang, and other models, see **[PROCESS_COMPARISON.md](PROCESS_COMPARISON.md)**.

Last updated after **`proc_send`**, **`findProcess` on `ProcessNameRegistry`**, singleton `new` for TS, and the **Vite counter-board gallery**.

---

## Summary

| Layer | State |
|-------|--------|
| **Compiler MVP** | Working: `@process`, tree, registry, `proc_*`, `proc_send`, named paths, subtree stop — JS / Kotlin tested; Swift6 for `process_nesting` |
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
| **`@name("app.path")` on `@process` classes** | Done — compile-time unique path; `find_process "path"` in `.rgr`; `ProcessNameRegistry` bind on `proc_start` |
| **`proc_send`** | Done — `proc_send "path" name value` or `proc_send target name value` → `receiveMessage(name, value)` if live; stub on `RangerProcessBase` |
| **`findProcess(path)` (registry)** | Done — generated `extension ProcessNameRegistry`; live-only (`hasLive`); TS: `interface` overloads for literal paths |
| **Singleton `new` in TS/JS emit** | Done — `new ProcessNameRegistry()` returns `__singleton_instance` (constructor guard) |
| **`markStateDirty` / `ProcessUiHost`** | Done (stubs) — manual state generation bump + host notify; auto-dirty on assign deferred |
| **`ProcessRuntime.collectAllLiveRoots`** | Done — static extension (`sfn`); used by gallery process tree panel |

**Wiring:** `ng_RangerFlowParser`, `ng_RangerProcessClass`, `ng_RangerProcessLifecycle`, `ng_RangerJavaScriptClassWriter` (singleton ctor), `VirtualCompiler` (`file_end` TS helpers).

**Runtime:** `lib/RangerProcess.rgr`

---

## Named lookup & messaging (how to call from hosts)

| API | Where | Use |
|-----|--------|-----|
| `find_process "app.path"` | Ranger `.rgr` | Operator → `ProcessNameRegistry.__singleton().findByPath` |
| `proc_send "app.path" name value` | Ranger `.rgr` | Resolve path → `receiveMessage(name, value)` |
| `findByPath` / `findProcess` | Generated `ProcessNameRegistry` | Host TS/Kotlin/Swift after `proc_start` |
| `new ProcessNameRegistry().findProcess(path)` | TypeScript | Singleton `new`; typed path when `-typescript` |
| `findProcessByPath(path)` | Gallery [`processPaths.ts`](gallery/process_counter_board/src/processPaths.ts) | Thin wrapper around `new … findProcess` |

**Gallery call sites:** [`counterBoardHost.ts`](gallery/process_counter_board/src/host/counterBoardHost.ts), [`useProcess.ts`](gallery/process_counter_board/src/hooks/useProcess.ts), [`CounterBoard.tsx`](gallery/process_counter_board/src/components/CounterBoard.tsx) (UI line showing registry lookup).

Exploratory native galleries (no CI): [`gallery/process_counter_android/`](gallery/process_counter_android/), [`gallery/process_counter_ios/`](gallery/process_counter_ios/) — `findByPath` + manual refresh patterns documented in README/ISSUES.

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
| **Missing `fn start`** | Empty base stub; no compile error. |
| **Swift** | `process_page_lifecycle` not in Swift CI matrix (Kotlin runs it). |
| **Kotlin/Swift typed `findProcess`** | Not done — TS gets `ProcessPath` + interface overloads only. |
| **Singleton `new` on Kotlin/Swift** | TS/JS constructor guard only; native galleries still use `__singleton()`. |
| **Other backends** | `@process` / `proc_*` not verified on Rust, Go, Python, … |
| **`parentOf` object** | Only `parentIdOf:int` — analyzer deferred. |
| **`spawn local` / `global`** | Not implemented. |
| **Packaging** | `lib/RangerProcess.rgr` is copied by `npm run build:dist` → `dist/lib/` (use `rm -rf dist/lib` before copy; nested `dist/lib/lib/` was a stale `cp` artifact). |
| **Bootstrap** | After FlowParser / writer edits run `npm run compile` twice. |
| **app-ranger integration** | Pilot not merged; kernel still on `Process.rgr`. |

---

## Real gaps (need compiler, analyzer, or release)

| Gap | Blocker type |
|-----|----------------|
| **`spawn local` / `spawn global`** | Compiler operator + registry semantics |
| **Typed optional `parentOf`** | Analyzer + codegen |
| **`@process` on unsupported targets** | Backend writers + tests |
| **Reliable child list for all `new` sites** | Codegen or static convention enforcement |
| **`describe` / `RangerClassDescriptor` wired** | Compiler tooling |
| **Cross-app `hibernate` wire format** | Spec / lib, if product needs portable sleep |
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
```

---

## Suggested next steps

1. **app-ranger pilot** — one route/slot as `@process`; kernel calls `proc_start` / `findProcess` or `find_process`; messages via `proc_send` or queues — [PROCESS_MVP.md](PROCESS_MVP.md).
2. **Kotlin/Swift parity** — `findProcess` on registry (untyped `string`) + optional singleton `new` in native writers; wire `ProcessUiHost` for Compose/SwiftUI galleries.
3. **`spawn local`** — when duplicate children under one parent become painful.
4. **Swift CI** — add `process_page_lifecycle` to matrix.
5. **`parentOf` typed optional** — when analyzer allows.
6. **Gallery: `receiveMessage` demo** — console ping to `app.counterBoard` from a second named process in `.rgr` or devtools snippet.
7. **Optional stream fixture** — host pumps chunks into `receiveMessage` / `onChunk` without compiler `async`.
8. **README for `proc_*` / `@name` / TS host** — document `Import "RangerProcess.rgr"` and `RANGER_LIB` for npm installs; run `npm run build:dist` before publish.
9. **Auto `markStateDirty`** — reduce boilerplate in `.rgr` and generated hosts.

---

## Related docs

| Doc | Contents |
|-----|----------|
| [PROCESS_MVP.md](PROCESS_MVP.md) | MVP scope, sufficiency, `proc_send`, streams as host pattern |
| [PROCESS_LIFECYCLE.md](PROCESS_LIFECYCLE.md) | Operators, `start`/`stop`/hibernate, `spawn` (planned) |
| [PROCESS_COMPARE_WITH_OBJECTIVEC.md](PROCESS_COMPARE_WITH_OBJECTIVEC.md) | ObjC messaging, protocols, run loop parallels |
| [gallery/process_counter_board/README.md](gallery/process_counter_board/README.md) | Vite sample, `find_process` vs `findProcess` vs `useProcess` |
