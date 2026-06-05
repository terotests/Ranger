# Process UI notify — avoiding host re-entrancy loops

When the host wires `ProcessUiHost.notifyPath` to “sync view model + re-render”, calling `markStateDirty()` from inside that sync path causes **infinite recursion** (`Maximum call stack size exceeded`).

This is not unique to Active Workout; any `@process` parent that merges child `pending*` state during notify needs a **batching contract**.

---

**Normative turn contract:** [PROCESS_RUNTIME_INVARIANTS.md](PROCESS_RUNTIME_INVARIANTS.md) (`ProcessRuntime.beginDispatchTurn` / `endDispatchTurn`, `proc_send` wrapping).

## Language/runtime primitives (`lib/RangerProcess.rgr`)

| API | Role |
|-----|------|
| `bumpStateGeneration()` | Increment `__rangerStateGeneration` **without** host notify |
| `markStateDirty()` | Bump + `flushUiNotify()` (unless suppressed) |
| `flushUiNotify()` | Host notify only (no extra bump) |
| `ProcessUiHost.beginSuppressUiNotify()` / `endSuppressUiNotify()` | Coalesce notifies while merging child → parent state |
| `ProcessUiHost.isUiNotifySuppressed()` | Query suppress depth |

### Recommended pattern: parent `sync*RunState`

```ranger
fn syncActiveChildRun:void () {
  if (hasActiveRun == false) {
    return
  }
  def uiHost:ProcessUiHost (ProcessUiHost.__singleton())
  uiHost.beginSuppressUiNotify()
  def changed:boolean false
  ; if child.pending* → changed = true, apply to parent (may call markStateDirty — notify suppressed)
  uiHost.endSuppressUiNotify()
  if (changed) {
    this.flushUiNotify()
  }
}
```

**Do not** call `markStateDirty()` at the end of sync when already inside a notify handler.

Child handlers may still call `markStateDirty()`; during suppress only the generation bump applies until `flushUiNotify()`.

---

## Host layer (TypeScript / Swift / Kotlin)

Ranger stubs are empty; hosts often **replace** `notifyPath` on the singleton. That bypasses any guard inside Ranger’s `notifyPath` body.

Hosts should also use a **re-entrancy guard** around their listener dispatch:

```typescript
let notifyDepth = 0;
function notifyListeners() {
  if (notifyDepth > 0) return;
  notifyDepth += 1;
  try {
    syncViewModelFromProcesses();
    for (const fn of listeners) fn();
  } finally {
    notifyDepth -= 1;
  }
}
```

Reference: `gallery/process_counter_board/src/host/processUiBridge.ts`, `realtrainer/.../active-workout-process/src/host/processUiBridge.ts`.

---

## Future compiler option (not implemented)

Emit `ProcessUiHost.notifyPath` as a non-replaceable wrapper that calls a host-registered callback with built-in depth guard, instead of assigning `host.notifyPath = …` directly.

Until then: **Ranger suppress + host depth guard** is the supported combination.
