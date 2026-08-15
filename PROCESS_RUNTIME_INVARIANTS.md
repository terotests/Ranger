# Process runtime invariants

Normative contract for `@process` UI turns. Implementation: [`lib/RangerProcess.rgr`](lib/RangerProcess.rgr).  
Related: [PROCESS_UI_NOTIFY.md](PROCESS_UI_NOTIFY.md), [PROCESS_MVP.md](PROCESS_MVP.md), [PROCESS_STATUS.md](PROCESS_STATUS.md).

---

## Separation

| Layer | Responsibility |
|-------|----------------|
| **Process runtime** | State, `proc_send`, child tree, lifecycle, sync hooks, coalesced UI notify |
| **Host** | Timers, storage, network, UI framework, `ProcessUiHost` listeners, DTO snapshot build |

The runtime is a **portable state machine**, not a React/Zustand replacement.

---

## Turn model (target pipeline)

One **dispatch turn** on a **root** process:

```text
beginDispatchTurn(root)
  → handler / proc_send body (mutate)
  → root.__rangerSyncChildren()   ; optional override
endDispatchTurn(root)
  → at most one host UI delivery (path + id) when not suppressed
```

Hosts should build view DTOs **after** notify (in the listener), not inside Ranger handlers.

---

## Invariants

1. **One UI delivery per root turn** — While `ProcessRuntime` dispatch depth &gt; 0, `markStateDirty` / `flushUiNotify` bump generation but do **not** call host `notifyPath` / `notifyId`. `endDispatchTurn` ends suppress and calls `root.flushUiNotify()` once.

2. **No notify during suppress** — `ProcessUiHost.isUiNotifySuppressed()` is true inside `beginDispatchTurn` … `endDispatchTurn` (nested turns increase depth).

3. **Child sync in runtime hook** — Override `fn __rangerSyncChildren:void ()` on the root (or parent) instead of calling host APIs from `ProcessUiHost.notifyPath`. Parent merges child `pending*` fields here.

4. **Handlers stay pure-ish** — Handlers mutate process fields and may `proc_send`; they must not call host timer/storage/network APIs directly. To *ask* for I/O, submit an `EffectRequest` to the `EffectQueue` ([`lib/RangerEffects.rgr`](lib/RangerEffects.rgr)); the host drains it after the turn, runs it against a granted capability, and delivers the answer back as a new event. See [PLAN_IO_EFFECTS.md](PLAN_IO_EFFECTS.md).

5. **`proc_send` is turn-wrapped** — Compiler lowers `proc_send` to `beginDispatchTurn(root)` … handler … `endDispatchTurn(root)` where `root` is `target.__rangerFindRoot()`.

---

## APIs

| API | Use |
|-----|-----|
| `ProcessRuntime.beginDispatchTurn(root)` / `endDispatchTurn(root)` | Host or manual batching; Ranger source may use `begin_dispatch_turn root` / `end_dispatch_turn root` |
| `proc_send` | Compiler-wrapped in dispatch turn (find root via `__rangerFindRoot`) |
| `target.__rangerFindRoot()` | Outermost ancestor for turn root |
| `root.__rangerSyncChildren()` | Merge child → parent state (override on app root) |
| `markStateDirty()` | Bump generation; notify immediately **only** outside dispatch turn |
| `bumpStateGeneration()` | Bump without notify (legacy sync blocks; prefer turn) |
| `flushUiNotify()` | Deliver after manual suppress block |

---

## Host TypeScript pattern

```typescript
// dispatch → snapshot → subscribe (see gallery/active-workout processRoot.ts)
handle.dispatch(() => { proc_send ... });
const dto = handle.snapshot();
handle.subscribe(() => setRevision((n) => n + 1));
```

Install `notifyDepth` guard when overriding `ProcessUiHost.notifyPath` — see [PROCESS_UI_NOTIFY.md](PROCESS_UI_NOTIFY.md).

---

## Regression tests

- [`tests/fixtures/process_dispatch_turn_notify.rgr`](tests/fixtures/process_dispatch_turn_notify.rgr) — `proc_send` inside turn → `notifyPathDeliveredCount <= 1`
- [`tests/compiler-process-dispatch-turn.test.ts`](tests/compiler-process-dispatch-turn.test.ts)

---

## Not in scope (yet)

- Async message queue / `tick` in compiler
- Automatic DTO codegen
- Non-replaceable `notifyPath` wrapper (see PROCESS_UI_NOTIFY.md future work)
