
## Lifecycle of the process

Consider this example:

```ranger
class UIPage @process(true) extends RangerProcessBase {
  def screen@(optional):ScreenProcess
  def title:string ""

  fn startTimer:TickChild () {
    def t:TimerProcess (new TimerProcess)
    def c:TickChild (t.spawnTick())
    return c
  }
}
```

We need to consider at least the process lifecycle events:
- start
- stop
- hibernate
- wakeup

IMPORTANT: the stop process is quite essential, if we move away from a UIPage we might want to call recursively the stop to all the children there, right? Verify this idea.

Also, When the startTimer is called a new process is restarted multiple times I guess, in some cases this is very good behaviour, in some other cases maybe not so. We might want to create process so that it will be created or using the same existing instances if possible.

```ranger
class UIPage @process(true) extends RangerProcessBase {

  fn start:void () {
    ; do the startup initialization
  }

  fn stop():void () {
    ; when process is closed, clean up
  }

  fn hibernate:string {
    ; return string that holds the objects state
  }

  fn wakeup( old: string ) {
    ; restore the object from serialized format
  }
}
```

In addition of those the ranger process registry could have methods that allow us to start or stop processes, but we could also do it using Ranger operators I think

```
start myProcess
stop myProcess
data = (hibernate myProcess)
wakeup  data
```

We might consider a new "spawn" or "once" operator to the Ranger, which works almost as the new operator but will check the existence of the process, this should be callable only for processes.

## Local spawn

in some cases we want the process that is running to have only one child of certain type, then we can use the `spawn local` operator combo

```
; gets or creates the TimerProcess or uses existing instance locally on this process boundary
def t:TimerProcess (spawn local TimerProcess)
```

## Global Spawn

Global master object of certain instance can be created, effectively a singleton object relative to the process system.

```
; gets or creates the TimerProcess or uses existing instance locally on this process boundary
def t:TimerProcess (spawn global TimerProcess)
```

---

## Implemented in Ranger (compiler MVP)

Operator names avoid clashing with **HttpServer** `start` / `stop`:

| Operator | Meaning |
|----------|---------|
| `proc_start proc` | Calls user `fn start()` if defined |
| `proc_stop proc` | `__rangerStopSubtree()` on instance |
| `proc_stop processId` | `ProcessRuntime.stopByProcessId(int)` — same value as `__rangerId` |
| `proc_stop "ClassName"` | Stops all live instances of that `@process` class |
| `proc_hibernate proc` | Returns `string` from user `hibernate()` or `""` |
| `proc_wakeup proc state` | Calls user `wakeup(state)` |

- **`new`** only registers (parent link + registry); use **`proc_start`** when the process should run.
- **`__rangerStopSubtree`**: children first (via `__rangerChildren`), then user `stop()`, then registry `untrack`.
- **`__rangerId`**: unique across the app (`ProcessIdRegistry`); roots and children share one counter. **`__rangerParentId`** stores the parent’s `__rangerId` at registration time.

**Test fixture:** `tests/fixtures/process_page_lifecycle.rgr` — switch screen page A → B; log shows `STOP TickChild` → `STOP TimerProcess` → `STOP UIPage` before page B boots.

```bash
node bin/output.js -es6 tests/fixtures/process_page_lifecycle.rgr -nodecli -d=tests/.output -o=process_page_lifecycle.js
node tests/.output/process_page_lifecycle.js
```

**Not implemented yet:** `spawn local`, `spawn global` (see sections above).

**MVP scope & sufficiency:** [PROCESS_MVP.md](PROCESS_MVP.md) — what the compiler slice proves and what app code can build on top.

**Design comparison:** [PROCESS_COMPARE_WITH_OBJECTIVEC.md](PROCESS_COMPARE_WITH_OBJECTIVEC.md) — ObjC / UIKit messaging, protocols, run loop, and what Ranger might adopt.




