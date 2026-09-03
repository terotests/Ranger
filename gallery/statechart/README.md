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
assignments to a string context, driven by events with named fields. A transition with no target assigns and stays
— XState's internal transition, and the reason typing into a dialog does not
re-enter its state.

Guards, entry actions and nesting arrive when the machine that needs them does,
and each arrives with the transition table that proves it. A runtime that grew
features nobody had a machine for would have no way to know it got them right.

## It takes the shape XState writes

`StatechartJson.load()` reads `createMachine()`'s own config object:

```json
{ "id": "addWorkoutDialog", "initial": "closed",
  "context": { "today": "", "inputText": "" },
  "states": {
    "closed": { "on": { "OPEN": { "target": "open", "actions": [ … ] } } },
    "open":   { "on": { "START_SAVING": "saving" } } } }
```

Structure, state names, event names, targets and the `"EVENT": "target"`
shorthand are all XState's. A machine is then ONE FILE the app and this can
both hold, neither a transcription of the other.

The one thing that cannot come across as-is is `assign`: in XState it is a
FUNCTION, and a function is not data. So assignments are written declaratively
(below), and `{ "event": "value", "default": { "context": "today" } }` is
`event.targetDate || today` written down instead of run.

That the config is still the machine is checked, not assumed:
`npm run rt:machine:config` evaluates the real TypeScript with `xstate`
stubbed — `createMachine` hands back its config — and diffs the structure:
states, the events each one handles, and where each goes. It needs the
monorepo, so it exits 0 and says so where the sources are not checked out.

## Events are objects, and assignments are expressions

XState's events are objects — `{ type: "OPEN", targetDate: "2026-02-09" }` —
and an assignment reads them by name, so this takes the same:

```
ScEvent.of("OPEN").with("targetDate", "2026-02-09")
```

An earlier draft took a single payload string. It worked for one machine and
would have broken on the next: `OPEN` carries a date AND a calendar id, and
nothing tells them apart when they are both "the value".

An assignment's new value is an expression, in the general forms rather than
one per machine:

```
{ "value": "x" }              a literal
{ "event": "targetDate" }     a named field of the event
{ "context": "today" }        a context key
{ "or": [ … ] }               the first part that has anything in it
```

`{"or": [{"event":"targetDate"}, {"context":"today"}]}` is
`event.targetDate || today`. **`or` is what `||` is**, not a special case for
the machine that needed it first — naming the general form rather than the
instance is the difference between a runtime and a fixture.

**Context values are strings, and that is tier one.** XState's context holds
anything; here it is two parallel string arrays, which reads worse than a map
and travels better — this compiles to Kotlin and Swift as well as ES6. A typed
context arrives with the machine that needs one, like everything else here.

## Conformance — against XState itself

This module has no gate of its own; that would be the runtime grading its own
homework. It is measured where it is used, and the oracle is the real library:

```bash
npm run rt:machine   # four implementations of one machine, XState among them
```

Four readings of one specification: the machine hand-written as branches, the
same machine as data, the config loaded and run by this runner, and **the same
config executed by `xstate` itself**. All twenty-one cells of the transition
table agree in all four.

A table is not a parity test, though — twenty-one cells from three seeds only
ask what happens from the three contexts someone thought to write down. So the
gate also walks **400 random event sequences of twelve events** and requires
every implementation to stay in lockstep with XState after every step, state
and whole context. The sequences are seeded, so a divergence is reproducible.

That fuzz earned its place on the run that introduced it. It caught a
divergence immediately — in the harness, not the runner: the XState adapter was
answering "did anything change" where every other implementation answers "did
the current state handle this event", and `SET_INPUT_TEXT { text: "" }` when
the text is already empty is handled and changes nothing. `snapshot.can(event)`
is the question the others answer, and asking XState the same question is what
made the comparison mean anything.

Without `xstate` installed the gate still runs and says so, rather than passing
quietly on a transcription.

### And a machine too big to transcribe

A hand-written table proves a machine was READ right, once. It does not scale:
`planDialogMachine` is six states and eighteen events, and a hundred and eight
cells transcribed by hand is a hundred and eight chances to write down what you
assumed. So `npm run rt:machine:live` asks XState instead — the same config in
both, every state crossed with every event from a seeded path, then 300 random
sequences of fourteen events.

It found the thing reading could not, on its first run: **`a || b` yields its
LAST operand when everything is falsy.** `undefined || false` is `false`, and
this runner returned nothing — so a context held `null` where the machine holds
`false`. One character of semantics, in eighty-four cells that do nothing and
twenty-four that do, and no amount of re-reading the source would have shown
it.
