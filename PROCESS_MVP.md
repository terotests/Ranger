# Ranger `@process` — MVP scope and sufficiency

What the **compiler MVP** is for, what it already proves, and whether “product gaps” (messages, UI sync, timers, page store) require more **language** machinery — or are **application patterns** on top of the same primitives.

**Implementation facts and compiler checklist:** [PROCESS_STATUS.md](PROCESS_STATUS.md)  
**Operators and lifecycle:** [PROCESS_LIFECYCLE.md](PROCESS_LIFECYCLE.md)  
**Cross-paradigm comparison (Smalltalk, React, Erlang, …):** [PROCESS_COMPARISON.md](PROCESS_COMPARISON.md)  
**ObjC / UIKit comparison:** [PROCESS_COMPARE_WITH_OBJECTIVEC.md](PROCESS_COMPARE_WITH_OBJECTIVEC.md)  
**React gallery (`@name`, `useProcess`, `markStateDirty`):** [gallery/process_counter_board/README.md](gallery/process_counter_board/README.md)  
**Android / iOS exploratory galleries:** [process_counter_android](gallery/process_counter_android/README.md), [process_counter_ios](gallery/process_counter_ios/README.md)  
**UI view models vs `@process` field assignment:** [PROCESS_UI_VIEW_MODELS.md](PROCESS_UI_VIEW_MODELS.md) (pilot: Active Workout)

---

## What the MVP is

The MVP is **not** a full app kernel. It is a **small, typed object runtime** embedded in generated code:

| Primitive | Role |
|-----------|------|
| **Tree** | `__rangerParent`, `__rangerChildren`, register on `new` |
| **Identity** | `__rangerId` (one app-wide space), `proc_stop(id)` |
| **Registry** | Per-class `Foo__Registry`, `allInstances()`, `untrack` |
| **Lifecycle** | `proc_start` / `proc_stop`, optional `start` / `stop` / `hibernate` / `wakeup` |
| **Subtree teardown** | `__rangerStopSubtree()` — children first, then `stop()`, then registry |

Everything else — message queues, UI trees, clocks, navigation tables — is **expected to live in Ranger libraries or app-ranger**, composed from fields and methods on `@process` classes, plus a **host loop** that calls into them (same contract as `ProcessKernel.tick` today).

**Mental model:** “Processes are objects with a known tree and a guaranteed stop order.” That is enough to build production orchestration **next to** or **wrapping** these objects, not necessarily **inside** the compiler.

---

## What the MVP already proves

### Page switch (orchestration-shaped, no kernel)

From `process_page_lifecycle.rgr`:

```ranger
fn switchTo:void (title:string) {
  if (hasActivePage) {
    def old:UIPage (unwrap activePage)
    proc_stop old
    hasActivePage = false
  }
  def pg:UIPage (this.openPage(title))
  proc_start pg
  pg.boot()
}
```

This is already **navigation policy**: stop old subtree, create new page, start, boot children. Registry counts and `LifecycleLog` confirm **Tick → Timer → Page** stop order — the same invariant `killPage` must preserve in app-ranger.

### Tree + introspection

`process_nesting.rgr` — `parentIdOf`, registry dump, interactive playground. Proof that **ownership and query** work without a central kernel.

### Separation `new` vs `proc_start`

Matches “construct while building UI tree, activate when shown” — same as registering a VC before `viewDidAppear`, without requiring compiler magic.

---

## The four “product gaps” — MVP vs kernel today

app-ranger’s `ProcessKernel` implements messages, UI push, clock-driven timers, and page slots **today** using a single fat `Process` class. The question is whether `@process` **must grow** to match that, or whether the kernel (or a thin Ranger library) should **hold `@process` instances** and delegate.

**Default position in this doc:** the MVP primitives are **sufficient**; most “missing” pieces are **clear, local additions** (fields + host loop + existing `EventBus`). Only a few items **require compiler or analyzer work**.

---

### 1. Messages — queue on the process, drain from host `tick`

| Claim | Assessment |
|-------|------------|
| “MVP has no messages” | True for **fixtures** (they use direct calls). Not a **capability** limit. |
| “Need compiler `sendMessage`” | **No** for a first production path. |

**Enough on MVP:**

```ranger
class AIChatProcess @process(true) extends RangerProcessBase {
  def inboundMessages:[ChatMessage]

  fn enqueue:void (msg:ChatMessage) {
    push inboundMessages msg
  }

  fn drainInbound:void () {
    ; handle or route each message; clear handled ones
  }
}
```

Host contract (already established in APP_PROCESS.md):

```text
chat.enqueue(userMsg)
; on main / serial executor:
chat.drainInbound()
```

Or: `ProcessKernel` slot stores `RangerProcessBase` / typed `@process` reference; `sendMessage` forwards to `enqueue` + schedules `tick` → `drainInbound`.

**What MVP already gives:** stable `__rangerId`, `proc_stop` so drain loops can exit, subtree stop so children do not keep receiving work.

**Not a fundamental gap** — pattern is explicit and matches ObjC “run loop turns, drain queue” ([PROCESS_COMPARE_WITH_OBJECTIVEC.md](PROCESS_COMPARE_WITH_OBJECTIVEC.md)).

**Compiler v1 shortcut:** `proc_send "app.chat" name value` or `proc_send target name value` calls `receiveMessage(name, value)` on a live process (both strings; override on your class). TypeScript hosts use generated `findProcess(path)` for typed lookup. Fixture: [`tests/fixtures/process_proc_send.rgr`](tests/fixtures/process_proc_send.rgr).

---

### 2. UI sync — fields + adapter, not codegen KVO

| Claim | Assessment |
|-------|------------|
| “Processes do not emit `ui.propChanged`” | Fixtures use `print`; **app-ranger already has** `pageSetValue` + `EventBus`. |
| “Need `@binds` in compiler” | **Nice-to-have**, not required for MVP sufficiency. |

**Enough on MVP:**

- Page `@process` holds `UIComponentTree` (or a page id + kernel reference).
- After changing `timeLeft`, call a small helper: `UISync.set(page, "timer", "remainingSec", value)` that emits the same event shape the host already understands.

**What MVP already gives:** typed fields on the process object; `fn stop` to detach listeners; one live page per `switchTo` pattern.

**Compiler sugar** (`@binds`, auto-emit on assign) reduces boilerplate but does not change what is **possible**.

---

### 3. Graceful timer / async teardown — contract in `fn stop`, host cleans bus

| Claim | Assessment |
|-------|------------|
| “`proc_stop` does not cancel network” | Correct: **no async in the language runtime**. Cancellation is **user + host** responsibility. |
| “MVP cannot do graceful kill” | **Incorrect** if `stop()` + host discipline are defined. |

**Enough on MVP:**

```ranger
fn stop:void () {
  this.timerArmed = false
  this.pendingRequestId = 0
  LifecycleLog.log("STOP TimerProcess")
}
```

Host on `proc_stop` or `process.lifecycle` event:

- `unregisterStreamHandler(streamId)`
- stop advancing `VirtualClock` deadlines for that `__rangerId`

**What MVP already gives:** deterministic **child-before-parent** `stop()` order; registry `untrack`; `__rangerId == 0` sentinel for “do not tick this instance”.

**Gap is documentation and pilot tests**, not missing opcodes — align `fn stop` checklist with `ProcessKernel.kill` + `abort()`.

---

### 4. Page store — navigation is a singleton or screen field

| Claim | Assessment |
|-------|------------|
| “No global page table” | True for **compiler**. False for **what you can build in .rgr**. |
| “Need `registerPage` in ProcessRuntime” | **One design**; not the only one. |

**Enough on MVP:**

- `ScreenProcess` with `activePage` + `switchTo` **is** a page store (see fixture).
- Or `NavigationStore @singleton(true)` mapping `route → UIPage` with `proc_stop` / `proc_start` on change.
- Or bridge: kernel `pageId` ↔ `@process` `__rangerId` in one adapter class.

**What MVP already gives:** registry of all live `UIPage` instances; `proc_stop` on the active root; no duplicate lifecycle if conventions are followed.

Unifying kernel `pageId` with `__rangerId` is **integration hygiene**, not proof the MVP is too weak.

---

## Summary: orchestration on top of MVP

| Concern | In compiler MVP today? | Fulfillable without new language features? | Typical owner |
|---------|------------------------|------------------------------------------|---------------|
| Lifecycle / subtree stop | ✅ | — | Compiler |
| Message queue + drain | ❌ (not in fixtures) | ✅ fields + `enqueue` / `drain` + host `tick` | app-ranger / lib |
| UI sync to host | ❌ (printf demos) | ✅ `UIComponentTree` + `EventBus` (exists) | app-ranger |
| Timer / async cancel | ⚠️ `stop()` hook only | ✅ `stop()` + host handler cleanup | app + host contract |
| Page / navigation store | ❌ (app field) | ✅ `switchTo` or singleton store | app-ranger |

**Conclusion:** The MVP is **mechanism-complete** for realtrainer-style orchestration. app-ranger’s `ProcessKernel` is an **instance** of that orchestration using a legacy `Process` type; migrating to `@process` is **refactor and wiring**, not waiting for a second runtime.

**Practical pilot (unchanged):** one route where the slot’s logic is a `@process` class; `switchTo` / `killPage` call `proc_stop`; messages and UI go through existing bus APIs.

---

## What is *not* in the MVP (and is fine there)

These are **intentionally** out of scope for the compiler slice — implement in app or a Ranger lib, or add as sugar later:

- Standard message type hierarchy (app defines `ChatMessage`, `PageActionMessage`, …)
- `EventBus` wiring and stream handler tables
- `VirtualClock` and test `advance(ms)`
- Navigation routes (`ApplicationController`)
- Auto `pageSetValue` on every field write

None of these require rethinking `__rangerStopSubtree` or registries.

---

## Real gaps — cannot be “fixed in app code” alone

These are **objective** limits of the **current compiler / runtime** slice. They are worth tracking in [PROCESS_STATUS.md](PROCESS_STATUS.md); they are **not** the same as “we have not written the kernel adapter yet.”

| Gap | Why app code alone is insufficient | Severity |
|-----|-----------------------------------|----------|
| **`spawn local` / `spawn global`** | Needs compile-time `spawn` operator and registry lookup semantics ([PROCESS_LIFECYCLE.md](PROCESS_LIFECYCLE.md)) | Medium — duplicate children until implemented |
| **Typed `parentOf` → object** | Analyzer / codegen must return optional parent reference, not only `parentIdOf:int` | Low — work around with fields |
| **`@process` on unverified backends** | No wrapped `new` / registration on Rust, Go, Python, etc. | High if you target those targets |
| **Child tree when `new` outside parent method** | `__rangerChildren` only filled for codegen-wrapped `new` under live parent; top-level `new` attaches as root | Medium — **convention** helps; **fix** needs codegen or lint |
| **`proc_stop "ClassName"`** | Stops all instances app-wide — language exposes footgun; no “stop siblings under this parent only” operator | Low — use instance `proc_stop` |
| **No compile error on missing `start`** | Forgotten `fn start` fails silently via empty stub | Low — lint or review |
| **Packaging `RangerProcess.rgr` in dist** | Release consumers cannot Import without manual copy | Logistics, not design |
| **Introspection `describe` / `RangerClassDescriptor`** | Not wired to compiler | Low — tooling only |
| **`hibernate` / `wakeup` format** | No standard serialization — policy, but cross-app interchange needs a spec | Medium for “sleep mode” product feature |

**Swift lifecycle** — `process_page_lifecycle` runs in vitest when `swiftc` is available (`compiler-process-kotlin-swift`, `compiler-process-lifecycle`), same assertions as Kotlin/JS.

---

## What works well (MVP quality bar)

| Area | Why it is in good shape |
|------|-------------------------|
| **Core registration model** | Wrapped `new` + parent detection (JS / Kotlin / Swift6) — consistent tree without manual parent ids |
| **`parentIdOf(child)`** | Debugging and tests; used successfully in both fixtures |
| **Per-class registry + `allInstances()`** | Same mental model as “list live timers/pages” |
| **Lifecycle stop** | Right shape for leave-page → tear down children |
| **`process_page_lifecycle.rgr`** | Best proof of switch + stop order + registry counts |
| **`proc_*` operators** | Clear vs HttpServer; instance / id / class forms |
| **`new` vs `proc_start`** | Construct vs activate |
| **Tests** | JS + Kotlin lifecycle; Swift nesting compile/run |

---

## Usage convention

```ranger
Import "RangerProcess.rgr"

class TimerProcess @process(true) extends RangerProcessBase {
  def timeLeft:int 60
}
```

- Use **`@process(true)`** on the class node.
- After **`new`**, call **`proc_start`** when the process should run.
- On teardown, **`proc_stop`** on the subtree root (or `proc_stop id` / `proc_stop "ClassName"` when intentional).

For production-shaped code, add **`fn stop`** cleanup and a **host-driven tick** that drains message queues — do not expect the compiler to inject a run loop.

---

## Example fixtures

### `process_nesting.rgr` — stack + timer playground

```bash
node bin/output.js -es6 tests/fixtures/process_nesting.rgr -nodecli -d=tests/.output -o=process_nesting.js
node tests/.output/process_nesting.js
node tests/.output/process_nesting.js interactive
```

### `process_page_lifecycle.rgr` — two pages, stop on switch

```bash
node bin/output.js -es6 tests/fixtures/process_page_lifecycle.rgr -nodecli -d=tests/.output -o=process_page_lifecycle.js
node tests/.output/process_page_lifecycle.js
node tests/.output/process_page_lifecycle.js interactive
```

### `process_modal_dialog_timer.rgr` — page → modal → timer → close → repeat

Home `UIPage` opens a `ModalDialog` child; the modal owns a `DialogTimer` (4 ticks). When the timer hits zero the modal and timer are `proc_stop`ped, then the page opens the next modal (3 cycles, then exit). CLI shows the process tree and lifecycle log each frame.

```bash
node bin/output.js -es6 tests/fixtures/process_modal_dialog_timer.rgr -nodecli -d=tests/.output -o=process_modal_dialog_timer.js
node tests/.output/process_modal_dialog_timer.js
node tests/.output/process_modal_dialog_timer.js interactive
```

Vitest: `tests/compiler-process-modal-dialog.test.ts` (auto mode).

### `process_external_spawn.rgr` — `new` parent when caller is outside the process

A normal class calls `host.spawnWorkerFromOutside()`; `new WorkerProcess` inside that method must register under the host (`parentIdOf` / `__rangerParentId`). Controls: direct `new` from the orchestrator (root) and `sfn` static spawn on the process class (root).

```bash
node bin/output.js -es6 tests/fixtures/process_external_spawn.rgr -nodecli -d=tests/.output -o=process_external_spawn.js
node tests/.output/process_external_spawn.js
```

Vitest: `tests/compiler-process-external-spawn.test.ts`.

### `process_counter_board.rgr` — dynamic counter rows (workout-style CLI)

`CounterBoardPage` owns a list of `CounterRowProcess` children. Add/remove rows at runtime; **r** run/stop keeps `reps` and `ticks`; **space** adds a rep on the selected row. Console UI with **+**, **-**, **up**/**down**, **q**.

```bash
node bin/output.js -es6 tests/fixtures/process_counter_board.rgr -nodecli -d=tests/.output -o=process_counter_board.js
node tests/.output/process_counter_board.js interactive
```

Vitest: `tests/compiler-process-counter-board.test.ts`.

### `ProcessTreeView` — CLI process tree (debugger-style)

Class in [`lib/RangerProcess.rgr`](lib/RangerProcess.rgr). Walks `__rangerChildren` from roots. For each app compile that uses `@process`, the compiler emits `ProcessRuntime.collectAllLiveRoots()` and `printProcessTree()` / `printProcessTreeTitled(title)` (instances with `__rangerParentId == 0`).

```ranger
Import "RangerProcess.rgr"
ProcessRuntime.printProcessTreeTitled("  @process tree")
```

Fixture: `tests/fixtures/process_tree_introspection.rgr` — Vitest: `tests/compiler-process-tree-view.test.ts`. Interactive demos: **t** in `process_counter_board` / `process_nesting`.

These are **mechanism demos**. A follow-up fixture could add `inboundMessages` + `drainInbound` on the same classes to show orchestration **without** compiler changes — optional next step.

---

## Suggested next steps (product, not compiler)

1. **app-ranger pilot** — `@process` instance behind one kernel slot; `proc_stop` on navigation.
2. **Document `fn stop` + host checklist** — stream handlers, clock deadlines, UI unbind (parity with `kill`).
3. **Optional `process_messages.rgr` fixture** — queue + drain on `@process` only.
4. **`spawn local`** when duplicate timers hurt — compiler feature, not MVP blocker for first pilot.

See [PROCESS_STATUS.md](PROCESS_STATUS.md) for compiler checklist, weak areas, and rebuild commands.
