# The same engine, from the same source, on every target

```
npm run rangerforms:conformance
```

```
  es6      ran              276 lines
  python   identical        byte for byte with es6
  go       identical        byte for byte with es6
  cpp      identical        byte for byte with es6
  rust     BUILD FAILED     error[E0599]: no method named `clone` for FormEngine

  identical  4 of 5 that ran
  broken     1
```

This is the scoreboard nothing else in the questionnaire world can keep. One
source, five compilers, and the requirement that all of them produce the
**same bytes** — same answers, same visibility, same order, and the same
formatting of every number.

## How it is arranged so that a divergence can only be about the engine

`Conformance.rgr` has **no inputs but its own source**. The corpus is compiled
in, from `CorpusData.rgr`, which `npm run rangerforms:corpus` generates from
the same `corpus/*.json` the SurveyJS comparison uses. Reading a file would
mean a host contract on five targets and five chances for a difference to be
about the file system.

`today` is a constant for the same reason: a run that read a clock would
diverge for a reason that has nothing to do with the compiler.

Every output is diffed against the ES6 one, which is the reference only because
it is the target everything else in this repository is built with.

A target whose toolchain is not installed is reported as **skipped**, never
quietly dropped. "Identical on the four targets that ran" is a result;
"identical" on its own would not be.

## What the first run found

Four bugs, three of them in the compiler and all of them invisible to every
test that ran on one target.

**`go` is a keyword in Go.** `GltfJson.rgr` — the repository's JSON parser,
written years before this — had a local called `go` in five functions. Fine in
five languages, a syntax error in the sixth.

**A field and a static method cannot share a name in C++.** `ExprNode` had a
field `text` and a constructor `sfn text`. Renamed to `ofText`.

**The Go writer walked one level of inheritance.** Go has no inheritance, so a
derived class is emitted as a flat struct carrying everything it inherits —
and the walk only looked at direct parents. `C extends B extends A` got B's
fields and methods and not A's, so the struct was missing fields, the
constructor left them uninitialised, and the interface generated for A was not
implemented. Three separate errors naming things nobody had written.
`goAncestors` now walks the whole chain, nearest ancestor winning.

**An accessor that mutates.** `AnswerState.stateOf` inserted a default state
when asked about a question it had not seen. Harmless in a garbage-collected
language and a compile error in a language that tracks mutation: every *read*
of the state borrowed it mutably. `readState` is the non-inserting one, and
everything that only reads goes through it now.

## Rust

Not passing, and the reasons are recorded rather than worked around:

```
error[E0599]: no method named `clone` found for struct `FormEngine`
error[E0599]: no method named `compile` found for struct `Ref<'_, Questionnaire>`
error[E0277]: the trait bound `SurveyExpr: ExprHostTrait` is not satisfied
error[E0596]: cannot borrow `self.graph` as mutable, as it is behind a `&` reference
```

The third is the same one-level-inheritance gap that was fixed for Go, in the
Rust writer, where `extends_classes` is walked in about twenty places rather
than four. The others are the ownership model meeting a class that owns a
trait object. Both are real work and neither is this engine's.

The engine builds and runs identically on **es6, python, go and cpp**, and that
is what the table says.
