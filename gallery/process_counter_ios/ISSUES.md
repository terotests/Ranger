# Swift / iOS — known issues (exploratory)

## ProcessUiHost bridging

Same as Kotlin: `notifyPath(path:)` is an empty method. SwiftUI sample uses explicit `refresh` after mutations and polls `__rangerStateGeneration` on the tick `Task`.

**Follow-up:** codegen hook or closure property on `ProcessUiHost` for Swift.

## Host registration

Call `page.__rangerRegisterRoot()` before `ProcessRuntime.startInstance(proc: page)` when constructing from Swift (not from Ranger `new` inside `.rgr`).

## API shape

| API | Swift emit |
|-----|------------|
| `ProcessRuntime.collectAllLiveRoots()` | `class func collectAllLiveRoots() -> [RangerProcessBase]` |
| `ProcessRuntime.startInstance(proc:)` | labeled `proc` |
| Singletons | `ProcessNameRegistry.__singleton()` |
| Optional board | `CounterRowProcess.board: CounterBoardPage?` |
| Row `new` in `addRow` | IIFE with `__rangerRegisterChild(parent:)` when board has id |

## SwiftUI files

`CounterBoardView.swift` imports SwiftUI — only compiles inside Xcode with iOS SDK. Not validated in Ranger CI.

## Hashable on process classes

Generated `RangerProcessBase : Hashable` uses object identity — fine for tree/debug, not for value comparison in UI.

## No Xcode project

Copy sources into your app target; align module name and fix any Swift 6 strictness warnings.
