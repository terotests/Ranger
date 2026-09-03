# gallery/statechart — a machine as data

A small statechart runtime in Ranger: a machine is a **definition** and the
runner walks it. Written for porting RealTrainer's XState machines
(see [`../../PLAN_REALTRAINER_STATE_PARITY.md`](../../PLAN_REALTRAINER_STATE_PARITY.md)),
and useful anywhere a Ranger program has states rather than flags.

**License: AGPL-3.0-or-later** (Gallery).

## What this is not

Not a clone of XState. [XState](https://github.com/statelyai/xstate) is MIT
(Copyright © 2015 David Khourshid), so a clone would be *allowed* — it is the
wrong thing to build. A clone means API compatibility with actors, spawning,
the actor system and inspection, none of which the machines being ported use,
and it would be judged against XState's whole semantics rather than against
the behaviour of the app that has to keep working.

No XState source is copied here. What is followed is its *semantics* for the
subset below, and that following is measured rather than asserted: the
transition table transcribed from each machine is run against this runner and
against a hand-written port of the same machine, and all three have to agree.

## The subset, measured rather than guessed

`grep` over the three machines being ported says what is actually used:

| Machine | Uses |
| --- | --- |
| `addWorkoutDialogMachine` (123 r) | states · `on` · `assign` |
| `planDialogMachine` (289 r) | + entry actions |
| `chatMachine` (449 r) | + guards · `always` · `after` · `invoke` · nested states |

**Tier one, here now:** states, transitions with an optional target, and
assignments to a string context. A transition with no target assigns and stays
— XState's internal transition, and the reason typing into a dialog does not
re-enter its state.

Guards, entry actions and nesting arrive when the machine that needs them does,
and each arrives with the transition table that proves it. A runtime that grew
features nobody had a machine for would have no way to know it got them right.

## An assignment's source

```
literal          the literal, as written
value            the event's payload
context          another context key
valueOrContext   the payload when it has one, else that key
```

The last one is `event.targetDate || today` from the original. The context is
two parallel string arrays rather than a map: a map reads better and travels
worse, and this compiles to Kotlin and Swift as well as ES6.

## Conformance

This module has no gate of its own — that would be the runtime grading its own
homework. It is measured where it is used:

```bash
npm run rt:machine   # the table from addWorkoutDialogMachine.ts, through
                     # BOTH the hand-written port and this runner
```

Twenty-one cells, thirteen of them events the machine ignores. Two independent
readings of one specification either agree with it or one of them is wrong.
