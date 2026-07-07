# LLVM backend bugs found while building the game-engine base

While bringing the portable game-engine base to a **native Raspberry Pi
binary** (Ranger → LLVM IR → `clang` → ELF, linked against
`runtime/ranger_rt.c`), three problems in the LLVM / Low-IR backend were hit.
This file documents each one, the root cause, and the status.

The reference program that exercises all of them is
[`pong.rgr`](./pong.rgr); the flagship [`gallery/invaders`](../invaders) game
was affected by the same first bug.

---

## Bug 1 — Double `zext i1` on boolean literals stored to a class field  ✅ FIXED

### Symptom

`clang` rejected the generated IR:

```
pong.ll:59:17: error: '%z1' defined with type 'i32' but expected 'i1'
  %z3 = zext i1 %z1 to i32
                ^
```

Every game with a boolean field initialised/assigned by name (`invaders.rgr`
sets `alive`, `active`, `gameOver`, …) failed to build natively — the LLVM path
was effectively unusable for real programs.

### Reproduction

A bare (non-`this.`) assignment of a boolean literal to a class field:

```ranger
class Flags {
    def ready:boolean false
    fn enable:void () {
        ready = true          ; <-- bare field name triggers the bug
    }
}
```

Emitted IR (before the fix):

```llvm
%c0 = icmp eq i32 0, 1      ; boolean literal `false`  -> i1
%z1 = zext i1 %c0 to i32    ; widened to i32 in lowerAssign
%f2 = getelementptr ...
%z3 = zext i1 %z1 to i32    ; BUG: widened AGAIN, but %z1 is already i32
store i32 %z3, i32* %f2
```

### Root cause

Two independent places widened the value:

* `RangerLowIRBuilder.lowerAssign` pre-widened a boolean literal with
  `emitZextI1ToI32` before calling `emitFieldStore`, **and**
* `emitFieldStoreOn` already widens an `i1` to the `i32` storage slot for any
  boolean field.

The `recv.field = false` (receiver) path never pre-widened — which is exactly
why only *bare* field assignments miscompiled.

### Fix

Removed the redundant widening in `lowerAssign` so the single, correct widening
in `emitFieldStoreOn` runs. See
[`compiler/ng_LowIRBuilder.rgr`](../../compiler/ng_LowIRBuilder.rgr) (function
`lowerAssign`, class-field branch).

After rebuilding the self-hosted compiler (`npm run compile`):

* `gallery/game_engine/pong` builds and runs natively;
* `gallery/invaders` builds and runs natively (previously failed at `%z5`);
* covered by regression tests in
  [`tests/compiler-llvm.test.ts`](../../tests/compiler-llvm.test.ts)
  (`does not double zext …` and `native boolean field binary returns 42`, using
  fixture `tests/fixtures/llvm_bool_field.rgr`).

---

## Bug 2 — `to_int` operator is not lowered by the LLVM backend  ⚠️ OPEN (worked around)

### Symptom

```
pong.ll:143:13: error: use of undefined value '%to_int'
  store i32 %to_int, i32* %f0
```

### Root cause

The `to_int` operator (in `compiler/Lang.rgr`) provides templates for `es6`,
`cpp`, `go`, `rust`, … but **no `llvm` template**, so the Low-IR emitter drops
in a bare `%to_int` placeholder that never gets defined.

### Status

Not yet fixed in the compiler. The game-engine base avoids the operator: it
does integer division with a portable `half()` helper (repeated subtraction),
which lowers cleanly on every target. A proper fix is to add an `llvm` template
for `to_int` (float→int is `fptosi`; int→int is a no-op) — tracked as follow-up
work.

---

## Bug 3 — A class with no fields emits no `%struct.<Name>`  ⚠️ OPEN (worked around)

### Symptom

```
pong.ll:1201:31: error: use of undefined type named 'struct.Main'
  %p75 = inttoptr i64 %c74 to %struct.Main*
```

Triggered by instantiating (`new Main`) a class whose body only contains
methods (no `def` fields).

### Root cause

The LLVM backend only emits a `%struct.<Name>` type for classes that have at
least one field, but `lowerNewObject` still tries to `inttoptr` to that struct
type when the class is instantiated.

### Status

Not yet fixed. Two clean options for a compiler fix: emit an empty/one-byte
struct for field-less classes, or skip the struct cast when there are no
fields. The game-engine base avoids it by letting the platform backend
(`Terminal`, which has a field) own the frame loop and `main`, so no field-less
class is instantiated.

---

## Related (non-LLVM) target note — Go terminal input is Windows-only  ⚠️ OPEN

Not an LLVM bug, but relevant to "which native target for the Pi": the `go`
template for `on_keypress` in `compiler/Lang.rgr` uses
`syscall.NewLazyDLL("msvcrt.dll")`, so any game that reads the keyboard fails to
build with `go build` on Linux/macOS:

```
invaders.go:23:19: undefined: syscall.NewLazyDLL
```

Both `gallery/invaders/invaders.go` and a Go build of `pong.rgr` reproduce it.
Until the Go polyfill grows a POSIX (`termios`) branch, **Go is not usable for
the on-device build**; use the LLVM+C runtime, C++, or Rust path instead (see
[README.md](./README.md)).
