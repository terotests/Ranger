# Ranger `@process` vs Apple Objective-C — comparison

How the Ranger process model relates to **Objective-C** (and, by inheritance, much of **UIKit / AppKit** on Apple platforms). This is a design comparison, not a plan to reimplement the ObjC runtime inside Ranger.

See also:

- [PROCESS_LIFECYCLE.md](PROCESS_LIFECYCLE.md) — operators, `start` / `stop` / `hibernate` / `wakeup`
- [PROCESS_STATUS.md](PROCESS_STATUS.md) — compiler / runtime checklist and hard gaps
- [PROCESS_MVP.md](PROCESS_MVP.md) — MVP sufficiency vs app orchestration

---

## Why Objective-C is a useful reference

Apple’s stack solved the same *shape* of problems realtrainer cares about:

- **Objects** with identity, parent/child relationships, and teardown order
- **Asynchronous delivery** of work onto a serial “main” executor (run loop)
- **Loose coupling** between UI controllers, timers, and network via **messages**, **protocols**, and **notifications**
- **Lifecycle** hooks when views/controllers appear and disappear

Ranger’s `@process` MVP is closer to “know the object tree and stop subtrees” than to a full ObjC runtime. **app-ranger** `ProcessKernel` is closer to a **custom run loop + message pump** sitting above plain objects.

Objective-C is worth studying because it separates **mechanism** (runtime messaging, retain counts) from **policy** (view-controller lifecycle, delegate patterns) — and Ranger is still deciding how much of each layer to encode in the language vs the kernel.

---

## Concept map (at a glance)

| Objective-C idea | Typical Apple usage | Ranger / app-ranger today | Gap |
|------------------|---------------------|---------------------------|-----|
| **Object / instance** | `UIViewController *vc` | `@process` class instance, `Process` in kernel | Typed processes vs one fat `Process` class |
| **Identity** | Pointer equality | `__rangerId` (app-wide) | Same role as `processId`; not a pointer |
| **Message send** | `[receiver selector:arg]` | Direct `fn` calls (MVP); `sendMessage` queue (kernel) | No universal dynamic `perform` yet |
| **Selector** | `SEL` (name + arity) | `messageType:string` + typed message classes | Strings today; could be stronger |
| **Protocol** | `@protocol Foo <Bar>` | None in Ranger; `kind:string` on `Process` | No compile-time protocol conformance |
| **Class cluster / factory** | `+[NSString string]` | `new` + wrapped register | `spawn local` not implemented |
| **Delegation** | `weak id<UITableViewDelegate>` | `EventBus` handlers, `registerStreamHandler` | Similar intent, different wiring |
| **NSNotification** | Broadcast by name | `EventBus.emit` with `event.type` | Close cousin |
| **Retain / release** | ARC, `weak` for delegates | Registry `track` / `untrack`; app holds fields | No `weak`; stale refs possible |
| **dealloc** | Final cleanup when refcount → 0 | `fn stop()` + `__rangerUnregister` | Explicit `proc_stop`, not GC |
| **viewWillAppear / …** | VC lifecycle | `proc_start` / `proc_stop` / hibernate | Fewer named phases |
| **NSRunLoop / main queue** | Serial UI thread | Host calls `kernel.tick` + `VirtualClock` | Same contract, host-owned |
| **KVO** | Key-path → callback | `pageSetValue` → `ui.propChanged` | Property-level, not key-path |
| **Blocks** | Async completion | Not in Ranger; host JS/Swift | Completion handlers live outside |

---

## 1. Objects and identity

### Objective-C

Every instance is a heap object; **identity is the pointer**. You compare with `==` (same instance) vs `isEqual:` (value). Hierarchy is expressed with **superclass** (`UIViewController` → `UIResponder` → `NSObject`).

### Ranger `@process`

Instances are **typed classes** extending `RangerProcessBase`. Identity for registry and `proc_stop(id)` is **`__rangerId`**, allocated from `ProcessIdRegistry` — an integer, not an address. Parent link is **`__rangerParent`** (object reference where the analyzer allows) plus **`__rangerParentId`** snapshot at registration.

**What ObjC got right:** one clear notion of “this instance” for lifetime and messaging.

**What Ranger does differently:** IDs are stable for logging and `proc_stop(42)` even if the host copies references around; stopped instances set `__rangerId = 0` (sentinel) instead of freeing memory like `dealloc`.

**Could add:**

- Optional **`weak`**-style references in the language or codegen for parent/child fields (avoid retaining stopped pages).
- **`isLive` / `isStopped`** as generated helpers instead of exposing `__rangerId == 0` everywhere.

---

## 2. Messaging — the core metaphor

### Objective-C

A **message send** is dynamic:

```objc
[timerProcess tick];                    // might not exist → forward or crash
[(id)target performSelector:@selector(pause) withObject:nil];
```

The runtime looks up **implementation** at send time (`objc_msgSend`). **Selectors** are named, arity-sensitive keys; **forwarding** (`forwardInvocation:`) allows proxies and lazy work.

Properties are often **syntactic sugar** for `setFoo:` / `foo` messages.

### Ranger today

| Layer | Style |
|-------|--------|
| **Compiler MVP** | Static calls: `t.spawnTick()`, `proc_stop old` — like C++ or Java, not ObjC |
| **app-ranger kernel** | **Queued messages**: `sendMessage(processId, msg)` with `msg.messageType`, drained in `tick` |

Kernel example (conceptually):

```text
; ObjC-ish mental model:
;   [chatProcess handleUserMessage:msg];
; Ranger kernel:
sendMessage(chatId, userMsg)
tick(chatId)    ; "run loop turned" — drain inboundMessages
```

**What to learn from ObjC:**

1. **Decouple sender from receiver timing** — sender should not assume the receiver is mid-`boot()`; queue + later drain matches `[performSelector:afterDelay:]` and run-loop sources.
2. **One serial executor for UI-facing processes** — ObjC’s main thread; Ranger’s **host must call `tick` on one thread** (documented in APP_PROCESS.md). Same invariant as “only touch UIKit on main.”
3. **Typed envelopes, loose dispatch** — ObjC uses `SEL` + untyped `id`; kernel uses `messageType` string then switches in `processPageMessages`. Ranger could keep strings for extensibility but add **typed message classes** checked at compile time where possible (already started with `AIChatUserMessage`, `PageActionMessage`).

**What is different:**

- Ranger **prefers static `fn` calls** inside a process for clarity and analyzer checking; messages are for **cross-boundary** input (host → process, process → bus), not every internal call.
- No **forwarding** chain — unknown `messageType` is typically left on the queue or dropped, not forwarded to a parent automatically.

**Could add:**

- **`performMessage`** operator: `performMessage proc "pause"` → compiler-known selector table or runtime dispatch table per `@process` class.
- **Default handler** on base class: `fn onMessage(msg:ProcessMessage):boolean` override, return true if handled (like `respondsToSelector:` + single entry point).
- **Async reply path**: ObjC delegates often use callbacks; align with existing **`streamId`** + `registerStreamHandler` as the typed “reply channel.”

---

## 3. Protocols — contracts without implementation

### Objective-C

```objc
@protocol TimerDisplaying <NSObject>
- (void)setRemainingSeconds:(NSInteger)s;
@optional
- (void)timerDidFinish:(id)sender;
@end

@interface WorkoutViewController : UIViewController <TimerDisplaying>
@end
```

- **Protocol** = interface only; class **conforms** at compile time (warnings) and runtime (`conformsToProtocol:`).
- **Optional** methods — caller must `respondsToSelector:` before send.
- **Composition over inheritance** — common in UIKit delegates.

### Ranger today

- **No `protocol` keyword** in Ranger for processes.
- **app-ranger** uses **`kind:string`** (`kindUIPage`, `kindAIChat`, …) and big `Process` with many fields — closer to one **god object** + kind switch than to small protocol-shaped APIs.
- **`@process` classes** are full classes with fields and methods — conformance is “you extended the right base and implemented `fn stop`.”

**What to learn:**

1. **Split “what callers may invoke” from “how it is implemented”** — e.g. `TimerDisplaying` vs `TimerProcess` implementation.
2. **Optional capabilities** — pause/resume only if the process implements them; avoids kernel `if kind == …` growing without bound.
3. **Delegate as protocol + weak ref** — `id<WorkoutTimerDelegate>` is how ObjC avoids retain cycles; maps to **weak parent** or **EventBus** subscription cleaned on `stop`.

**Could add (language / codegen):**

```ranger
protocol TimerDisplaying {
  fn setRemainingSeconds:void (sec:int)
  fn timerDidFinish:void () @optional
}

class TimerProcess @process(true) implements TimerDisplaying extends RangerProcessBase {
  ...
}
```

- Compiler checks that required methods exist.
- Kernel or host holds **`TimerDisplaying`**-shaped view adapter, not concrete class.
- **`@optional`** → codegen for `hasTimerDidFinish` + safe call (like `respondsToSelector`).

Even a **lighter** step: **`@processCapability("timer")`** annotation generating a dispatch table — protocols without full ObjC runtime.

---

## 4. Delegation vs EventBus

### Objective-C

**Delegation:** one-to-one (usually), **weak** delegate, callbacks like `tableView:didSelectRowAtIndexPath:`.

**NSNotificationCenter:** one-to-many broadcast by **name**; observers register with selectors or blocks.

### Ranger / app-ranger

| Pattern | Ranger analogue |
|---------|-----------------|
| Delegate | `registerStreamHandler(streamId, …)`, `registerProcessEventHandler`, parent `emitToParent` |
| Notification | `EventBus.emit(AppEvent)` with `ev.type` string |

**What to learn:**

- **Delegate** = directed, typed, lifecycle-bound (tear down observer when process killed).
- **Notification** = loose coupling for cross-cutting concerns (`ui.propChanged`, `process.lifecycle`).

**Could add:**

- On `proc_stop`, **auto-unregister** all handlers for that `processId` / `streamId` (ObjC removes observers in `dealloc` / `viewDidDisappear` — easy to forget in Ranger).
- Explicit **`delegate`** field codegen: `def delegate@(weak):TimerDelegate` with compiler-enforced protocol type.

---

## 5. Lifecycle — UIViewController as the mental model

### Objective-C (UIKit)

Typical view-controller chain:

```text
init → loadView → viewDidLoad
→ viewWillAppear → viewDidAppear
→ … user interaction …
→ viewWillDisappear → viewDidDisappear
→ dealloc
```

Child VCs are **added** as children; removal triggers disappear + teardown. **Not** identical to `proc_stop`, but the *user-visible* “leave screen → stop children” matches `process_page_lifecycle.rgr`.

### Ranger

| UIKit phase | Ranger analogue (today) |
|-------------|-------------------------|
| `init` / `alloc` | `new` → register in tree + registry |
| `viewDidLoad` | `proc_start` → `fn start()` |
| `viewWillDisappear` | beginning of `proc_stop` / `__rangerStopSubtree` |
| `dealloc` | `fn stop()` + untrack; `__rangerId = 0` |
| State restoration | `hibernate` / `wakeup` (sketched, underused) |

**What to learn:**

- **Named phases** help hosts and tests (`assert phase == Appeared`); Ranger could add optional **`fn willStop`** / **`fn didStop`** or document mapping to existing `stop`.
- **Child containment** — `addChildViewController:` maps to **`__rangerRegisterChild`** when `new` runs under a live parent; breaking that (child created at top level) is like adding a view without a parent VC — works sometimes, breaks teardown expectations.

**Could add:**

- Compiler hook: **`onNavigateAway`** generated from route layer (still calls `proc_stop` under the hood).
- **`spawn local`** (PROCESS_LIFECYCLE.md) ≈ “reuse child VC if already present” instead of new instance every `boot()`.

---

## 6. Run loop, timers, and async

### Objective-C

- **NSRunLoop** on main thread: sources, timers, performSelector requests.
- **GCD**: `dispatch_async(main_queue, ^{ ... })` — still serial on main.
- **NSTimer** — retained by run loop until invalidated; **must** invalidate in `dealloc` / disappear (classic leak footgun).

### Ranger

- **No run loop inside Ranger** — host drives **`kernel.tick`** and **`VirtualClock.advance`**.
- **Timer in fixture** — synchronous `tick()` method on `TimerProcess`, not a run-loop source.
- **Network** — `scheduleNetworkTimeoutFor` + clock snapshot; closer to **timer fire date** than to `NSTimer`.

**What to learn:**

1. **Timer ownership** — ObjC timer is tied to run loop mode; Ranger timer should be tied to **`processId` + pageId`** and cancelled in `kill` / `proc_stop`.
2. **Coalesced UI updates** — run loop often batches layout; `pageSetValue` bursts could be batched per tick (one `ui.propChanged` flush at end of `tick`).

**Could add:**

- **`scheduleOnProcess(processId, delayMs, message)`** — performSelector:afterDelay equivalent, implemented via `VirtualClock`, not OS timer inside Ranger.
- **`invalidateTimer`** generated when `fn stop` runs.

---

## 7. KVO and UI binding

### Objective-C

**Key-value observing:** observe `remainingSeconds` on a model; UI updates when value changes. Fragile (string key paths) but decoupled.

### Ranger / app-ranger

**Explicit push:** `pageSetValue(pageId, nodeId, key, value)` → **`ui.propChanged`**. No automatic observe of `def timeLeft` on `@process`.

**What to learn:**

- ObjC KVO is **magic** and hard to static-check; Ranger’s explicit push fits a **compiler-checked UI tree** better long term.
- Middle ground: **`@observable def timeLeft`** on `@process` fields → codegen calls `pageSetValue` when assigned (KVO-like, but explicit and typed).

**Could add:**

- Field annotation **`@binds("circularTimer", "remainingSec")`** on `TimerProcess.timeLeft`.
- Or **reactive** layer in PROCESS_STATUS “UI sync” gap — learned from KVO’s goal, not its mechanism.

---

## 8. What Ranger should *not* copy blindly

| ObjC feature | Why hesitate in Ranger |
|--------------|-------------------------|
| Fully dynamic every call | Conflicts with Ranger’s static analyzer and multi-backend codegen |
| `performSelector:` everywhere | Hard to emit safe Kotlin/Swift/JS |
| Swizzling | No runtime rewrite of method tables |
| Key-path strings | Prefer node id + key from UIComponentTree |
| NSObject everywhere | Prefer small typed `@process` classes |

Ranger targets **Kotlin, Swift, JS** from one `.rgr` source — the sweet spot is **ObjC’s process architecture**, not its runtime tricks.

---

## 9. Suggested additions (prioritized)

Inspired by ObjC / UIKit, compatible with [PROCESS_STATUS.md](PROCESS_STATUS.md) roadmap:

| Priority | Feature | ObjC inspiration | Fits where |
|----------|---------|------------------|------------|
| 1 | **Message queue + `tick` on `@process`** | Run loop + performSelector | Extend `ProcessRuntime` or fold kernel into compiler |
| 2 | **Auto-remove bus handlers on `proc_stop`** | `dealloc` / `removeObserver` | `ProcessKernel` / generated `stop` |
| 3 | **`protocol` for process capabilities** | `@protocol` + optional methods | Ranger language + kernel dispatch |
| 4 | **`spawn local`** | Child VC reuse | PROCESS_LIFECYCLE — reduces duplicate timers |
| 5 | **`@binds` / observable fields** | KVO | UI sync without manual `pageSetValue` spam |
| 6 | **`performMessage` / default `onMessage`** | `performSelector:` / forwarding | Typed alternative to raw strings |
| 7 | **Weak delegate/codegen** | `weak id<Delegate>` | Parent/page fields, stream handlers |
| 8 | **Scheduled messages via VirtualClock** | `NSTimer` / `afterDelay` | Timer processes without host `setInterval` |

---

## 10. Side-by-side story: “user pauses workout timer”

### Objective-C shaped (conceptual)

```objc
// Main thread only
[workoutVC.timer setPaused:YES];           // property → message
// or
[[NSNotificationCenter defaultCenter]
    postNotificationName:@"WorkoutTimerPause" object:workoutVC];

// Timer VC holds weak delegate; table updates via delegate callback
[delegate workoutTimerDidPause:remaining];
```

### Ranger today (split across layers)

```text
; Host (Swift/JS) after button tap:
kernel.sendMessage(timerProcessId, pageActionPauseMsg)
kernel.tick(timerProcessId)
; Inside kernel: processTimerMessages → toggleTimerPause
;                  → pageSetValue(..., "paused", "true")
; EventBus: ui.propChanged → host updates view
```

### Ranger target (unified mental model)

```ranger
; Host still drives tick, but process is typed:
proc_send timerProc (PageActionMessage.pause())
; TimerProcess implements TimerDisplaying + handles message in onMessage
; @binds updates circularTimer.remainingSec when timeLeft changes
```

One story, three layers — ObjC collapsed runtime + UIKit conventions; Ranger is **separating** compile-time process objects, kernel queue, and host rendering.

---

## Summary

| Question | Short answer |
|----------|----------------|
| **Is `@process` like NSObject?** | Partially — instance lifecycle and hierarchy, not dynamic messaging everywhere. |
| **Is `ProcessKernel` like NSRunLoop + center?** | Closer — serial `tick`, queued messages, `EventBus` ≈ notifications. |
| **What should Ranger adopt?** | Queued messages, protocol-shaped APIs, weak delegates, observer cleanup, scheduled clock-driven messages, optional property→UI binding. |
| **What should stay different?** | Static typing, explicit `proc_stop`, no swizzling, multi-target codegen. |

Objective-C teaches **how to structure responsibility** (who receives what, when, and on which thread). Ranger’s compiler MVP teaches **how to structure ownership** (tree, registry, stop order). The product work is merging those lessons without importing the ObjC runtime — see the expanded gap analysis in [PROCESS_STATUS.md](PROCESS_STATUS.md).
