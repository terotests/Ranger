# Ranger I/O effects, capabilities and the application model

**Status:** milestone 1 implemented and tested — [`lib/RangerEffects.rgr`](lib/RangerEffects.rgr),
[`gallery/process_db_effects`](gallery/process_db_effects/README.md),
[`tests/io-effects.test.ts`](tests/io-effects.test.ts).

Related: [PROCESS_RUNTIME_INVARIANTS.md](PROCESS_RUNTIME_INVARIANTS.md) ·
[PROCESS_MVP.md](PROCESS_MVP.md) · [PROCESS_UI_VIEW_MODELS.md](PROCESS_UI_VIEW_MODELS.md) ·
[TARGET_NOTES.md](TARGET_NOTES.md)

---

## The layering

```text
┌─────────────────────────────────────────────┐
│                Application                  │  processes, controllers, navigation
├─────────────────────────────────────────────┤
│        Reactive Application State           │  Model → Update → ViewModel → View
│              (portable Ranger)              │  immutable / deterministic
├─────────────────────────────────────────────┤
│              Component Layer                │  TSX / components / EvElement
├─────────────────────────────────────────────┤
│              Effects / Async I/O            │  the contract: request → result
├─────────────────────────────────────────────┤
│               Host Services                 │  DB │ HTTP │ files │ timers │ IPC
├─────────────────────────────────────────────┤
│               Ranger Runtime                │
└─────────────────────────────────────────────┘
```

This document is about the fourth band, and about where the line between it and
the third one falls.

---

## The decision that shapes everything else

The obvious design is to give Ranger the types:

```ranger
fn loadUser(id: string): Task<Result<User, IOError>>
```

That is the right *destination*, and the wrong *starting point*. Three facts
about the compiler as it stands today decide it:

1. **Ranger has no generics.** `Task<T>`, `Result<T,E>` and `Stream<T>` are not
   sugar over something already present; they are a type-system project —
   parameterised types, inference through them, and a monomorphisation or
   erasure story for each of the fourteen backends. That is a large piece of
   work to put *underneath* everything else.

2. **`async` exists on exactly one target.** `hasFlag('async')` is honoured in
   `ng_RangerJavaScriptClassWriter.rgr` and in no other class writer. Go,
   Kotlin, Swift, C#, Rust, Dart, Python, C++ emit nothing for it. A model layer
   built on an `async` keyword would be a JavaScript feature wearing a
   cross-platform name.

3. **`@process` already draws the line in the right place.**
   PROCESS_RUNTIME_INVARIANTS.md states it: *"The runtime is a portable state
   machine"*, and invariant 4 says handlers *"must not call host timer/storage/
   network APIs directly."* The existing design already says I/O belongs to the
   host. What it has never said is how a handler is supposed to *ask*.

So the starting point is not a type. It is a rule:

> **Ranger code describes I/O. It never performs I/O.**

An effect is **data**: a plain Ranger class, submitted to a queue, drained by
the host, answered by another plain Ranger class delivered back as an event.
Concurrency, cancellation and scope lifetime live in the host, where every
platform already has a mature answer — promises, goroutines, coroutines, tasks,
executors. Ranger does not abstract those mechanisms. It abstracts the
*semantics* around them.

This buys, today and on every target:

- structured concurrency and cancellation
- capability security
- deterministic replay and testing without an OS
- one round trip and many round trips as distinct, named things

and it costs no compiler change at all. `Task<T>` as a language type stays on
the roadmap as an **ergonomics layer over a working runtime**, not as its
foundation.

---

## The flow

```text
              ┌──────────────┐
              │    Event     │◀─────────────────────┐
              └──────┬───────┘                      │
                     ▼                              │
              ┌──────────────┐                      │
              │  handler /   │   pure: mutates      │
              │   update()   │   state, submits     │
              └──────┬───────┘   requests           │
          ┌──────────┴──────────┐                   │
          ▼                     ▼                   │
       State               EffectRequest[]          │
          │                     │                   │
          ▼                     ▼                   │
      ViewModel         ┌───────────────┐           │
          │             │ Effect runtime│           │
          ▼             │  Scope · caps │           │
        View            └───────┬───────┘           │
          │                     ▼                   │
          ▼               Host services             │
      Renderer                  │                   │
                                └── EffectResult ───┘
```

The right-hand side is a loop, and the loop closes through the event queue. An
answer is not a return value; it is the next event.

---

## The primitives, and which side of the line they live on

| Primitive | Lives in | Why |
| --- | --- | --- |
| `EffectRequest` | Ranger — [`lib/RangerEffects.rgr`](lib/RangerEffects.rgr) | Plain data: compiles to every target |
| `EffectResult` | Ranger | Ditto; carries `more` so a stream is not a special case |
| `EffectQueue` | Ranger | The one seam, alongside `ProcessUiHost` |
| `CapabilityManifest` | Ranger | What a process declares it needs |
| `EffectPayload` / `EffectRow` | Ranger | Reads rows without linking a JSON library |
| **`Scope`** | Host | Cancellation is a platform mechanism, not a data shape |
| **`Task`** | Host | A promise, a goroutine, a coroutine — the host's own |
| **`Stream`** | Host | Ditto; expressed to Ranger as `more == true` |
| **`CapabilityTable`** | Host | Only the host can decide what exists |

`Result<T,E>` is not in the list. `EffectResult` carries `ok`, `errorKind` and
`errorMessage`, which is a `Result` flattened into a class that needs no
generics. When Ranger grows parameterised types, `Result<T,E>` replaces those
three fields without changing the flow.

---

## Semantics, precisely

**Ownership.** Every `EffectRequest` carries `ownerPath` — the `@process` that
asked. The host maps that to a `Scope`. There is no way to start work that
belongs to nobody.

**Cancellation.** When a process stops, its scope is cancelled, children first.
Every task under it is aborted and **no result is delivered** — a stopped
process never runs another handler. When work is cancelled while its owner is
still alive (a superseded request, a timeout), the owner *is* told, with
`errorKind == "cancelled"`, so it can react.

**Staleness.** `epoch` is echoed back untouched. A model that bumps its epoch
when the user asks a new question can drop the answer to the old one before it
touches state. This is the "slow first search overwrites the fast second one"
bug, made a two-line check instead of a race.

**Task vs Stream.** One request yields exactly one result (`more == false`), or
1..n results of which only the last has `more == false`. That is the whole
distinction; nothing else in the model changes between the two.

**Capabilities.** A request names a capability. The runtime checks it against
both the process's own manifest and the host's grant table *before* any adapter
is reached — a denied request never becomes I/O. A missing grant fails at attach
time, because that is a wiring bug, not a runtime event.

**Dispatch turns.** Answers are delivered inside `beginDispatchTurn` /
`endDispatchTurn`, so the existing "one UI delivery per turn" invariant holds
for I/O-driven state changes exactly as it does for user-driven ones.

---

## Milestone 1 — what is built

A model layer written entirely in Ranger, exercised against a real database and
against no database at all, with the same source.

**Ranger side** ([`lib/RangerEffects.rgr`](lib/RangerEffects.rgr),
[`gallery/process_db_effects/ranger/notes_model.rgr`](gallery/process_db_effects/ranger/notes_model.rgr)) —
state, events, a capability manifest, effect submission, a single typed
`onEffectResult` entry point, and a pure `ViewModel` builder with a text
renderer. No promise, no callback, no driver.

**Host side** ([`gallery/process_db_effects/src`](gallery/process_db_effects/src)) —
`Scope` (structured concurrency), `CapabilityTable` (grants), `EffectRuntime`
(drain → check → run → deliver → drain), and three adapters: DuckDB, a scripted
fake, and a clock that a test can step by hand.

**Tests** — [`tests/io-effects.test.ts`](tests/io-effects.test.ts) pins the
semantics with no dependencies at all (19 cases, runs in the normal suite);
[`gallery/process_db_effects/tests/duckdb.test.ts`](gallery/process_db_effects/tests/duckdb.test.ts)
re-runs the interesting half against DuckDB (6 cases), because a contract only a
fake can satisfy is not a contract.

### Portability, measured

The claim that effects-as-data works everywhere is a test, not an assertion —
the last two cases in `tests/io-effects.test.ts` compile both files for every
target the compiler has:

| | Targets |
| --- | --- |
| `lib/RangerEffects.rgr` | **12 / 12** — es6, go, python, kotlin, csharp, rust, dart, swift6, cpp, java7, php, scala |
| `notes_model.rgr` (the whole model, `@process` included) | **11 / 12** — everything except Scala |

Scala is the one gap, and it is not this design's: `RangerProcess.rgr` does not
compile for Scala at all, because that class writer rejects a `for`-loop
containing `continue`. The effect library alone compiles for Scala fine.

Worth restating what those columns mean. Go, Kotlin, Swift, C#, Rust, Dart,
Python, C++, Java, PHP and Scala emit **nothing** for `@(async)` — the flag is
honoured by the JavaScript class writer and no other. A model layer built on an
async keyword would have exactly one column. This one has eleven, today,
without a compiler change.

### Why DuckDB

The requirement was a lightweight local database *capable of real concurrency*.

| Candidate | Verdict |
| --- | --- |
| `node:sqlite` | Zero dependencies, built into Node 22 — but **synchronous**. A runtime that never has two things in flight has not been tested. |
| `better-sqlite3` | Also synchronous, plus a native build. |
| **DuckDB** (`@duckdb/node-api`) | One dependency with prebuilt binaries, in-memory or file, **genuinely asynchronous**, and several connections to one instance really do overlap. |

DuckDB also happens to support all three things the model needs a backend to
prove it can express:

- **concurrency** — measured at 11 ms for two heavy queries in parallel against
  19 ms sequentially; the gallery test asserts `peakConcurrency > 1`
- **cancellation** — `connection.interrupt()` aborts a running query, so
  cancellation is real rather than the host politely ignoring a late answer
- **streaming** — `streamAndRead()` yields rows before the query has finished

None of that leaks upward. The model sees a request and a result.

### Bugs the exercise found

Building it against a real driver was worth doing; three defects only a real
backend surfaces:

1. **`idle()` resolved mid-chain.** The in-flight counter was decremented before
   the answer was delivered, so a program pausing between `schema → seed → list`
   looked finished. Fixed by settling idle waiters *after* delivery and the
   re-drain.
2. **Cancellation lost the race with connection acquisition.** Acquiring a
   pooled connection costs a microtask; a scope cancelled inside it registered
   its abort listener too late, and DuckDB's `interrupt()` on a connection that
   has not started a query is a no-op — so the query ran to completion with
   nobody waiting. Fixed by re-checking `signal.aborted` after acquisition.
3. **`chunkSize` was a hint, not a contract.** DuckDB returns a whole 2048-row
   vector at a time, so a stream requested in chunks of 2 arrived as one chunk —
   different behaviour from the fake adapter for identical model code. The
   adapter now re-slices, and both backends produce 3 chunks for 5 rows.

---

## Roadmap

### Milestone 2 — a second host language

The contract is six operations (`drain`, `check`, `run`, `deliver`, `cancel`,
`idle`). Reimplementing the runtime in Go over `context.Context` + goroutines,
against the same `notes_model.rgr` compiled with `-l=go`, is what proves the
model is portable rather than JavaScript-shaped. Expected friction: none in the
model, some in `EffectPayload` (Go string handling) — which is itself a useful
compiler test.

### Milestone 3 — more capabilities

Nothing new is needed architecturally; each is a name and an interface.

```text
http    request/response, plus streaming bodies
files   read/write/watch  (watch is a Stream)
timer   delay/ticker      (ticker is a Stream)
storage key/value
socket  a Stream in both directions
```

The capability model doubles as the sandbox story for embedded JS/TS: a script
gets `storage`, `clock`, `http`, `documents` and simply has no name for
`filesystem` or `process`.

### Milestone 4 — `update()` as a returned value

Today a handler mutates fields and submits requests. The reducer form —

```ranger
fn update:Update (state:UserState event:UserEvent)
```

— returning both the new state and the effects, is a better fit for replay,
time-travel and testing. It wants either records with cheap copies or ownership
support that makes `state.withLoading(true)` non-tragic. Worth doing after the
capability set is broad enough to be interesting.

### Milestone 5 — compiler support

Only once the runtime is load-bearing:

- an `@effect` annotation that refuses to compile a handler which calls a
  known-blocking operator, turning the "handlers stay pure" invariant from
  documentation into a diagnostic
- a `@capability` annotation that emits the manifest instead of hand-writing it
- effect and event enums generated from a declaration, replacing the string
  labels used today

### Milestone 6 — `Task<T>` / `Stream<T>` as language types

The ergonomics layer, on top of a runtime that already works:

```ranger
fn loadUser:Task<Result<User, IOError>> (id:string)
```

This needs generics, and it needs an async story for more than one target. Both
are large. Neither blocks anything above.

---

## Target mapping

What a host adapter is expected to bring, per target. The Ranger side is
identical in every column.

| Target | Scope / cancellation | Task | Stream | Database |
| --- | --- | --- | --- | --- |
| JavaScript / TypeScript | `AbortController` | `Promise` | async iterator | DuckDB, SQLite, Postgres, IndexedDB |
| Go | `context.Context` | goroutine | channel | `database/sql` |
| Kotlin | `CoroutineScope` | `Deferred` | `Flow` | JDBC / Room |
| Swift | task group | `Task` | `AsyncSequence` | SQLite / CoreData |
| C# | `CancellationToken` | `Task<T>` | `IAsyncEnumerable` | ADO.NET |
| Rust | `CancellationToken` | `Future` | `Stream` | `sqlx` / `rusqlite` |
| Dart | — | `Future` | `Stream` | `sqflite` |
| Python | `asyncio` cancellation | coroutine | async generator | `sqlite3` / `asyncpg` |
| C++ | stop token | executor task | callback / coroutine | SQLite |

---

## Open questions

- **Where should the runtime live?** It sits in the gallery today. A published
  `@ranger/effects-runtime` package would make it reusable, at the cost of
  versioning it against `lib/RangerEffects.rgr`.
- **Payload encoding.** JSON text is portable and needs no generics, but it
  costs a parse per result. A typed row buffer would be faster and much less
  portable. JSON is the right trade until something measures slow.
- **Should `EffectQueue` be a singleton?** It matches `ProcessUiHost` and every
  request names its owner, so ownership survives. A per-root queue would isolate
  two independent applications in one process image; nothing needs that yet.
- **Backpressure.** A `Stream` currently pushes as fast as the adapter produces.
  A model that cannot keep up has no way to say so. This becomes real with
  sockets and file watchers, not with query results.
