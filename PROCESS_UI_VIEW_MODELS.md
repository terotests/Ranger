# Ranger `@process` — UI view models and cross-class field assignment

**Status:** ✅ **FIXED** (compiler, v3.0.5+). Cross-class field assignment with a `@process` method call on the RHS now compiles. The history below is kept for context.  
**Pilot that surfaced this:** [realtrainer `app-ranger/demo/active-workout-process`](../realtrainer/app-ranger/demo/active-workout-process/) (Active Workout, Ranger-only phase).  
**Regression test:** [tests/fixtures/process_view_dto_assign.rgr](tests/fixtures/process_view_dto_assign.rgr) (covered by `tests/compiler.test.ts` → "Process view DTO cross-class assignment").  
**Related:** [PROCESS_MVP.md](PROCESS_MVP.md) (UI binding is app pattern), [PROCESS_STATUS.md](PROCESS_STATUS.md) (`markStateDirty` / no UI codegen yet).

---

## The fix

The infix-operator parser flattened a method-call right-hand side into siblings of `=`,
producing a malformed AST. For `row.isActive = this.isRowActive(0)` the parser yielded:

```text
(= row.isActive  this.isRowActive  ())     ; RHS split into two stray siblings
```

instead of the expected nested call form `(= row.isActive (this.isRowActive ()))`.
`stdParamMatch` then tried to type-check `=` with four operands and reported
`Could not match argument types for =` / `can not call non-class type`.

`RangerFlowParser.repairAssignMethodCallRhs` (in
[compiler/ng_RangerFlowParser.rgr](compiler/ng_RangerFlowParser.rgr)) now re-wraps
everything after the LHS of a `=` node into a single expression node, restoring the
normal call form so the existing call/assignment handling evaluates it. It is invoked
from the `=` operator paths (`cmdAssign`, `TransformOpFn`, and the operator-match branch).

---

## What we wanted

A **React-style separation** without React yet:

| Layer | Responsibility |
|-------|----------------|
| `@process` classes | Workout domain + UI flags (`uiShowFinishConfirm`, `uiNoteDraft`, …) |
| Plain **view model** classes (`ExerciseRowView`, `WorkoutListView`, …) | Immutable-ish DTOs: what a row / list / duration overlay would render |
| **Builder** (`ActiveWorkoutViewBuilder`) | Reads `@process` state, fills view DTOs |
| **Renderer** (`ActiveWorkoutTextRenderer`) | Turns DTOs into text (CLI stand-in for DOM) |

Goal: later, React only maps `ExerciseRowView` → `<ExerciseRow … />` and sends `proc_send session onRowComplete 2`.

---

## What used to happen (the original limitation)

> Historical — these cases now compile. See [The fix](#the-fix) above.

The compiler **allows** plain classes with `def` fields and `fn` methods that assign **`this.field`** inside **the same class**.

It used to **reject** (or mis-type) assignments of the form **`other.field = expr`** when:

- `other` is an instance of a **plain** (non-`@process`) class, and
- `expr` involves **method calls** on a **`@process`** instance (e.g. `session.completedCount()`), or sometimes even **fields** on another plain object.

Typical analyzer message:

```text
[FAIL] Could not match argument types for =
    row.isActive = session.isRowCurrent(index)
```

Same failure when the caller is itself a `@process` method building a child DTO:

```text
[FAIL] Could not match argument types for =
    v.currentSet = run.currentSetNumber()
```

(where `v` is `DurationSeriesScreenView`, `run` is `DurationSeriesRunProcess @process`).

So you **could not** reliably implement “builder sets properties on a separate view object” the way you would in TypeScript or Kotlin. This now works.

### Minimal repro (now compiles; previously failed)

**Plain view + builder calling `@process`:**

```ranger
class RowView {
  def label:string ""
  def isActive:boolean false
}

class MyPage @process(true) extends RangerProcessBase {
  def selected:int 0

  fn buildRow:RowView () {
    def row:RowView (new RowView)
    row.label = "A"                    ; may work (literal / same-class patterns vary)
    row.isActive = (index == selected) ; field-from-field often OK
    row.isActive = this.isRowActive(0) ; FAIL: assigning result of @process method to plain row field
    return row
  }

  fn isRowActive:boolean (index:int) {
    return index == selected
  }
}
```

**Plain builder class calling `@process` on a parameter:**

```ranger
class RowView {
  def isActive:boolean false
}

class ViewBuilder {
  fn fill:void (page:MyPage index:int) {
    def row:RowView (new RowView)
    row.isActive = page.isRowActive(index)   ; FAIL (plain class → @process call → plain field)
  }
}
```

**`@process` filling plain view from child `@process`:**

```ranger
class DurationScreenView {
  def seconds:int 0
}

class TimerRun @process(true) extends RangerProcessBase {
  def remainingSec:int 45
  fn displaySeconds:int () { return remainingSec }
}

class Session @process(true) extends RangerProcessBase {
  fn toView:DurationScreenView (run:TimerRun) {
    def v:DurationScreenView (new DurationScreenView)
    v.seconds = run.displaySeconds()   ; FAIL in pilot (parent @process → child @process method → plain field)
    return v
  }
}
```

### What still works

| Pattern | Example |
|---------|---------|
| Assign **inside** plain class method on **`this`** | `fn populate:void () { this.label = "x" }` |
| `@process` reads/writes **own** fields | `uiNoteDraft = text` on `ActiveWorkoutSession` |
| `@process` calls **other `@process`** methods | `run.tick(1000)` from session |
| `proc_send` to handlers | `proc_send session onUiOpenFinishConfirm` |
| Plain class assigns from **locals** filled by `@process` first | see workaround below |
| **String** built in `@process`, then one `print` | `session.printUiSnapshot()` |

**Counter-board gallery** avoids the problem: React reads **`CounterBoardPage` fields directly** (`page.rows`, `page.selectedIndex`) — no intermediate DTO layer. See [gallery/process_counter_board/README.md](gallery/process_counter_board/README.md).

---

## Pilot workaround (Active Workout, Ranger-only)

We dropped separate `ExerciseRowView` / `WorkoutListView` population from an external builder and used:

### 1. Screen router (plain DTO, only routing + refs)

`ActiveWorkoutRootView` holds **which screen** and **references** to live processes — not a full copy of UI state:

```ranger
class ActiveWorkoutRootView {
  def screen:string "idle"       ; idle | list | duration | finished
  def idleMessage:string ""
  def session@(optional):ActiveWorkoutSession
  def durationRun@(optional):DurationSeriesRunProcess
}
```

Built from `@process` on the session (assigning `root.screen`, `root.session = this` worked; filling nested row DTOs did not):

```ranger
fn buildRootView:ActiveWorkoutRootView () {
  def root:ActiveWorkoutRootView (new ActiveWorkoutRootView)
  root.screen = "list"
  root.session = this
  return root
}
```

### 2. Render inside `@process` (or only read fields in host)

CLI trace lives on **`ActiveWorkoutSession`** as `printListTrace`, `printDurationTrace`, `printUiSnapshot` — all methods on the same `@process` that own the data.

React phase (later): same as counter board — **`useProcess` + read `session.exercises[i]`**, or call thin TS wrappers that invoke `onRow*` handlers (stand-in for `proc_send`).

### 3. Child timer without importing parent session type

`DurationSeriesRunProcess` sets **`pendingApplySet`** / **`pendingMeasuredSec`**; parent **`syncDurationRunState`** applies to exercises after `tick`. Avoids circular imports and keeps timer logic in the child.

---

## Architecture diagram (current vs intended)

```text
INTENDED (blocked by compiler today):

  ActiveWorkoutSession ──► ActiveWorkoutViewBuilder ──► WorkoutListView
        │                         │                      ├── ExerciseRowView × N
        │                         │                      └── ConfirmModalView
        └── DurationSeriesRunProcess ──► DurationSeriesScreenView


WORKING (pilot + counter board):

  ActiveWorkoutSession ──► buildRootView() ──► ActiveWorkoutRootView
        │   (fields + onUi*)     │              screen + optional refs
        │                        └──► printUiSnapshot()  (or React reads fields)
        └── DurationSeriesRunProcess (pending* sync)
```

---

## Implications for hosts (React / Swift / Kotlin)

| Approach | Viable today? |
|----------|----------------|
| **A. Host reads `@process` fields** (counter board) | Yes — primary pattern |
| **B. Host reads generated view DTOs** filled in Ranger | Yes — cross-class field assign from `@process` methods now compiles |
| **C. Plain Ranger “builder” class** calling `@process` APIs | Yes — fixed; see [process_view_dto_assign.rgr](tests/fixtures/process_view_dto_assign.rgr) (`ViewBuilder.fillRow`) |
| **D. `proc_send` + handler methods** for events | Yes — [process_proc_send.rgr](tests/fixtures/process_proc_send.rgr) |

TypeScript `WorkoutMessages.session.confirmFinish(s)` is fine: it calls **`onUiConfirmFinish()`** on the live instance — no DTO assignment in Ranger.

---

## Future work (language / compiler)

Possible directions (not scheduled):

1. ✅ **Allow cross-class field assign** when RHS type matches field type (including calls to `@process` methods returning primitives / strings / bools). **Done** — `repairAssignMethodCallRhs`.
2. **`populate` codegen** — `fn buildRowView:RowView ()` syntactic sugar that expands to legal assignments.
3. **`@view` / `@immutable` data classes** with constructor-style all-args init (one assignment site).
4. **Document officially** if the restriction is intentional (encapsulation) vs incomplete typing.

Until then, treat **view models as host-side types** (TS/Swift structs) filled from `@process` in the host, or keep **screen enum + process refs** in Ranger and map to components in the host.

---

## References

| Artifact | Role |
|----------|------|
| [realtrainer `demo/active-workout-process/README.md`](../realtrainer/app-ranger/demo/active-workout-process/README.md) | Modular layout, `npm run sim` |
| [tests/fixtures/process_view_dto_assign.rgr](tests/fixtures/process_view_dto_assign.rgr) | Regression test for cross-class view-DTO assignment (the fix) |
| [tests/fixtures/process_proc_send.rgr](tests/fixtures/process_proc_send.rgr) | Typed `proc_send` handlers |
| [lib/RangerProcess.rgr](lib/RangerProcess.rgr) | `markStateDirty`, `ProcessUiHost` stubs |
| [PROCESS_MVP.md](PROCESS_MVP.md) § UI | UI sync is app pattern, not compiler queue |
