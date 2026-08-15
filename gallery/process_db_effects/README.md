# process_db_effects — a Model layer with real I/O behind it

A small notes application whose **entire model is written in Ranger** and
performs no I/O, driven by a host runtime that performs all of it. The same
model runs against DuckDB and against a database that does not exist, without a
build flag or a branch.

This is milestones 1 and 4 of [PLAN_IO_EFFECTS.md](../../PLAN_IO_EFFECTS.md).

```text
ranger/notes_model.rgr
   NotesState    an @(immutable) value — every transition returns a new one
   NotesReducer  pure (state, event) -> (state', [EffectRequest]); no queue,
                 no clock, no database, no process
   NotesPage     the @process: owns the state, runs the reducer, submits
        │  EffectRequest
        ▼
src/runtime/effectRuntime.ts  drain → check capability → run → deliver → drain
src/runtime/scope.ts          structured concurrency and cancellation
src/runtime/capabilities.ts   what I/O is, and who is allowed to reach it
        │
        ▼
src/adapters/duckdbDatabase.ts   real: pooled connections, interrupt, streaming
src/adapters/fakeDatabase.ts     scripted answers, scripted latency, no OS
src/adapters/systemClock.ts      the clock as a capability (and a manual one)
```

## Run it

```bash
cd gallery/process_db_effects
npm install        # also compiles the Ranger model
npm run demo       # drives the model twice: DuckDB, then the fake
npm test           # the DuckDB half of the contract
```

From the repository root, the dependency-free half of the contract runs in the
normal suite:

```bash
npx vitest run --config tests/vitest.config.ts io-effects
```

## What the model may and may not do

`ranger/notes_model.rgr` contains no promise, no callback, no driver and no
`await`. A transition is a function: state in, new state and the I/O it wants
out.

```ranger
sfn search:NotesUpdate (s:NotesState owner:string text:string) {
  def nextEpoch:int (s.epoch + 1)           ; supersede every search in flight
  def next:NotesState (with s searchText text phase "loading" epoch nextEpoch)
  def args:[string]
  ...
  def eff:EffectRequest (EffectRequests.query(owner sql args nextEpoch "search"))
  return (NotesReducer.oneEffect(next eff))  ; described, not performed
}
```

Nothing here submits anything, so a test calls it with a bare `new NotesState()`
and no runtime at all. Every answer arrives through one typed function:

```ranger
sfn result:NotesUpdate (s:NotesState owner:string r:EffectResult) {
  if (r.isCancelled())        { ... }       ; the owner outlived the work
  if (r.isDenied())           { ... }       ; no grant, no I/O
  if (r.isStale(base.epoch))  { ... }       ; a newer question already won
  ...
}
```

and the process is left with the small part:

```ranger
fn applyUpdate:void (u:NotesUpdate) {
  previous = state                          ; free: the old value is still there
  state = u.state
  def q:EffectQueue (EffectQueue.__singleton())
  for u.effects e:EffectRequest i {
    q.submit(e)
  }
  this.markStateDirty()
}
```

One typed function rather than name-based dispatch, so this compiles unchanged
for Go, Swift, C++ and Rust, none of which has reflection to dispatch by string.

## What the demo shows

| Step | What it demonstrates |
| --- | --- |
| `onOpen` | `schema → seed → list` — sequencing expressed as events, not as awaits |
| `onSearch` | Prepared parameters; a superseded search is dropped, not applied |
| `onLoadStats` | Three queries submitted together, three connections busy at once |
| `onStreamAll(2)` | One request, three results, only the last with `more == false` |
| `onTryForbidden` | An ungranted capability refused before any adapter is reached |
| `app.stop()` | The page closes mid-query: DuckDB is interrupted and nothing is delivered |

Output of `npm run demo`, abridged:

```text
-- three queries at once ----------------------------------------
in flight before any answer: 3
count=5 shortest=19 longest=32
-- stream in chunks of 2 ---------------------------------------
3 chunks, 5 rows
-- ask for a capability nobody granted --------------------------
denied: 1  (capability denied: filesystem)
-- close the page while a query is running ----------------------
in flight: 1
after stop: in flight 0, dropped 1
peak connections busy at once: 3
```

The FakeDatabase run prints the same numbers.

## Why DuckDB

`node:sqlite` needs no dependency but is synchronous, and a runtime that never
has two things in flight has not been exercised. DuckDB's Node API is genuinely
asynchronous, runs queries on a background thread pool, supports
`connection.interrupt()` for real cancellation, and streams rows before a query
finishes — the three things the effect model needs a backend to prove it can
express. See [PLAN_IO_EFFECTS.md](../../PLAN_IO_EFFECTS.md#why-duckdb).

## Testing without an OS

`FakeDatabase` answers SQL from a table of registrations, with latency as a
parameter:

```ts
db.on("WHERE title ILIKE", ({ args }) => matching(args[0]), {
  // the first search is slow and the second is fast, so the answers arrive in
  // the opposite order to the questions
  delayMs: ({ callIndex }) => (callIndex === 0 ? 40 : 0),
});
```

Races that are luck against a real database become ordinary test cases here —
which is the point of routing I/O through a capability rather than importing a
driver.

## Layout

```text
ranger/notes_model.rgr     the model (Ranger)
scripts/build-ranger.mjs   compiles it to src/generated/notes_model.ts
src/generated/             compiler output, committed
src/runtime/               scope, capabilities, effect runtime  (host, portable TS)
src/adapters/              DuckDB, fake, clocks
src/app.ts                 the wiring — the only file that knows both halves exist
src/main.ts                the demo
tests/duckdb.test.ts       the contract, against a real database
```
