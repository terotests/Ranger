# Kotlin / Android — known issues (exploratory)

## ProcessUiHost cannot be bridged like TypeScript

Web gallery assigns `ProcessUiHost.notifyPath = (path) => …`. Generated Kotlin has **methods**, not assignable callbacks. `markStateDirty()` calls the empty stub.

**Workarounds in this sample:**

- `CounterBoardController` refreshes after each user action.
- Background tick compares `__rangerStateGeneration` after `pulseAll()`.
- `ProcessUiBridge.dispatchPath` for a manual/test hook.

**Compiler follow-up:** emit `ProcessUiHost` forwarder to `ProcessUiBridge` when targeting Kotlin, or generate a `var onNotifyPath: ((String) -> Unit)?`.

## Plain `CounterBoardPage()` needs `__rangerRegisterRoot()`

Ranger wraps `new CounterRowProcess` inside `.rgr` methods; host code must call `page.__rangerRegisterRoot()` before `ProcessRuntime.startInstance(page)` (same as web host).

## API shape

| API | Kotlin emit |
|-----|-------------|
| `ProcessRuntime.collectAllLiveRoots()` | `ProcessRuntime.collectAllLiveRoots()` in **companion object** |
| `ProcessRuntime.startInstance` | companion |
| Registries | `ProcessNameRegistry.__singleton()` |
| Optional board on row | `CounterRowProcess.board: CounterBoardPage?` |
| Lists | `MutableList` / `arrayListOf()` |

## `printProcessTree` companion bug

Emitted body uses `this.collectAllLiveRoots()` inside companion — should be `ProcessRuntime.collectAllLiveRoots()`. CLI `printProcessTree` may need the same fix as JS (already fixed for TS static emit).

## No Gradle module

This folder is documentation + source sketches only. Create an Android Studio project and copy sources; expect to fix package names and dependencies.
