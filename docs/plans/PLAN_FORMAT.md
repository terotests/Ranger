# PLAN_FORMAT — clean output in every target language

Scope: making the code Ranger emits look like code a person would have written —
no redundant parentheses, chains that read as chains, and lines that do not run
off the page — as a compiler option with a configuration, on every target.

This is not a style preference. It came out of a measurement taken while
building the documentation feature, and the measurement decides most of the
design.

---

## 1. Where this came from

[`PLAN_API_DOCS.md` §18](PLAN_API_DOCS.md) put compiled example bodies into the
generated documentation. The Kotlin reference now shows readers this:

```kotlin
((_data.row()).str("region", "North")).num("sales", 120.0);
```

where a person would write

```kotlin
_data.row().str("region", "North").num("sales", 120.0)
```

The first thing to check was whether the doc renderer was adding the
parentheses. It is not: the identical source in an ordinary method body emits
`(o.a(1)).b(2);` too. The documentation only made an existing property of the
output visible, and made it visible in the one place no external tool will ever
clean up — **a doc comment is not reformatted by any formatter**, so whatever
Ranger writes there is what the reader sees, for ever.

---

## 2. What was measured

Vela's `VlChart.rgr` (982 lines of real API code with method chains) compiled to
six targets, then each ecosystem's own formatter run over the result. Comments
stripped before counting parentheses, because a formatter never touches them and
counting them made the first reading of this table wrong.

| Target | Formatter | Lines changed | Longest line | Redundant receiver parens |
| --- | --- | --- | --- | --- |
| JavaScript | `prettier` | 1612 of 2786 | 128 → 112 | 34 → **0** |
| Rust | `rustfmt` | 4030 of 2001 | 177 → **100** | 22 → **22** |
| Dart | `dart format` | 875 of 2851 | 100 → 100 | 36 → **36** |
| C++ | `clang-format` | 2035 of 2237 | 299 → **80** | 0 → 0 |
| Python | `black` | 5386 of 2634 | 104 → 108 | 0 → 0 |
| Go | `gofmt` | **the file does not parse** | 111 | 40 |

The Go row is not a formatting result. `gofmt` exits 2 on this file:

```
v.go:529:7: expected 'IDENT', found 'go'
```

because a Ranger local called `go` is emitted as `var go bool = true`. That is a
reserved-word collision in the Go writer, filed separately — and it is the
reason the first version of this table read "gofmt: 0 changed lines". `gofmt -w`
had silently done nothing to a file it could not read, and a diff of zero looked
like success. On a Go file that *does* parse (`gallery/invaders`), `gofmt -w`
changes 870 lines of 542, so the Go writer is no closer to clean than the
others.

Three things fall out of that table, and they point in different directions.

**Whitespace is the ecosystem's job and it does it well.** `clang-format` turned
a 299-character `typedef` into four aligned lines. `rustfmt` brought every line
under 100. Nothing Ranger writes will beat those tools at their own job — and
no writer is close to clean today: the smallest diff is Dart's 875 changed
lines and the largest is Python's 5386.

**Redundant parentheses are NOT the ecosystem's job, except on JavaScript.**
Prettier reprints from its own AST and drops every one (34 → 0). `rustfmt` and
`dart format` are whitespace formatters: parentheses are nodes in the tree they
are handed, so they preserve all of them (22 → 22, 36 → 36). A Ranger user on
Rust, Dart, Go, Kotlin, Swift, C# or Java has no tool that will ever remove
them.

**And on every target, a doc comment is untouched.** Prettier fixed
`((this.arr[k])).asString()` in the code on line 95 and left the identical text
inside the JSDoc on line 996 exactly as it was.

So parentheses cannot be delegated. They have to be fixed where they are
written.

---

## 3. Three categories, and only one of them is formatting

| | What it is | Who should fix it |
| --- | --- | --- |
| **A. Redundant parentheses** | A precedence decision made wrong at emission | **Ranger**, in the writers |
| **B. Whitespace and wrapping** | Line breaks, indentation, alignment | The ecosystem's formatter, with Ranger emitting something reasonable |
| **C. Emitted shapes** | `{ let _tmp_1 = …; … }` inlined into a Rust expression; a statement sequence flattened onto one line | **Ranger**, in codegen — a formatter cannot unpick it |

The plan is mostly about **A**, partly about **B**, and names **C** so it is not
confused with either.

---

## 4. A is one unconditional decision, copied into every writer

`RangerGenericClassWriter.CreateCallExpression` writes:

```ranger
wr.out("(" false)
ctx.setInExpr()
this.WalkNode( obj ctx wr)
ctx.unsetInExpr()
wr.out(")." false)
```

The receiver is wrapped **unconditionally**, with no precedence test at all.
That decision produces `(this).find(id)`, `(t).find("root")` and every
`((a.b()).c()).d()` in the table above.

This plan first said "one unconditional line", which was wrong and worth
correcting, because it changes the size of the work: the generic writer is the
fallback for five targets, and the other eleven override
`CreateCallExpression` and `CreatePropertyGet` with their own copy of the same
five lines. There are **thirteen** such sites, differing only in what they
write after the closing paren -- `.` on most, `->` on C++ and PHP, `!.` when
TypeScript sees an optional. Two are not copies: Swift 6 already tests its
receiver with `isSimpleClassCallReceiver`, and Python wrapped nothing at all.

### 4.1 The rule

A postfix `.` binds tighter than nearly everything in every target language, so
a receiver needs parentheses only when it is one of a short list:

| Receiver is | Parens needed | Because |
| --- | --- | --- |
| an identifier, `this` / `self` | no | `o.m()` |
| a field access `a.b` | no | already postfix |
| another call `a.b()` | no | already postfix |
| an index `a[0]` | no | already postfix |
| a binary or unary expression | **yes** | `(a + b).m()` |
| a conditional / ternary | **yes** | `(c ? a : b).m()` |
| a lambda or closure literal | **yes** | every target |
| a cast | **yes** on C#, Java, C++ | `((T)x).m()` |
| a numeric literal | **yes** on JS, Dart | `(1).toString()` — `1.toString()` is a parse error |
| `new X()` | **no** on C#, Java, Kotlin, Dart; **yes** on C++ for `new` | `new X().m()` is fine on the managed targets |
| `await` / `?` / `try` | target-specific | Rust `?` binds tighter; `await` does not |

So the predicate is mostly shared, with a small per-target table. It belongs on
`RangerGenericClassWriter` with per-writer overrides, next to the existing
`suppress_expr_parens` machinery rather than replacing it.

**What was built instead, and why.** The table above classifies a NODE. The
implementation classifies the emitted TEXT, because what a receiver turns into
is the target writer's business and not something a node-shape rule can know:
Rust appends `.borrow()`, C++ writes `->`, a register expression becomes a
temporary name, and `WriteVRef` is overridden in sixteen writers. Asking the
question of the text needs none of that — a name, a path, a call, an index and
any chain of those is a postfix expression in every one of these languages, and
binds tighter than `.` in all of them.

`writeCallReceiver` walks the receiver into a writer of its own, reads what came
out, and wraps only if the text is neither a postfix expression nor already a
single parenthesised group. Once, not twice: walking a node a second time runs
its side effects a second time.

The rule is a whitelist, so the default is to KEEP the pair. `(new NBox()).get()`
keeps its parentheses because `new NBox()` has a space in it, and a cast, a
ternary and an `await` stop at the same test. That is deliberately blunter than
the table above — a target where `new X().m()` is legal keeps a pair it does not
need — and it is the shape of conservatism this change wanted: a receiver loses
its parentheses only when it is proven not to need them.

### 4.2 The second source

`joined = joined + ((this.arr[k])).asString();` is **two** wraps stacked: the
receiver wrap above, and an expression wrap from the `suppress_expr_parens`
path. That flag is declared once (`compiler/ng_writer.rgr:177`), **written at 59
sites** — 54 of them in the Rust writer alone — and **read at exactly one**
(`walkCommandList`, `compiler/ng_LiveCompiler.rgr:666`), where it is saved,
immediately cleared, and used to cancel one wrap. A single boolean set from 59
places and consumed in one is a one-shot suppression, not a precedence model,
which is why it has to be set and cleared by hand at each site and still misses
cases.

Phase 2 replaces the flag with a real model: each emission site states the
precedence of the context it is writing into, each expression knows its own, and
the writer wraps only when the child binds looser than the parent. That is how
Prettier and every other pretty-printer does it, and it is the only version that
does not need a new manual `suppress` at each new call site.

---

## 5. B: what to emit, and where to stop

The temptation is to write a Prettier for eleven languages. That would be the
same mistake `PLAN_API_DOCS.md` §9.4 avoided when it declined to write an HTML
renderer: competing with tools that are better at it, for output that is already
being handed to those tools.

The position instead:

> **Ranger emits code that the target's own formatter accepts with no changes,
> or as few as possible. Where it cannot, it emits something readable and lets
> the formatter finish.**

No writer reaches the first bar today, so the bar is a direction rather than a
claim. Dart is nearest at 875 changed lines of 2851; Python is furthest at 5386
of 2634.

Three things are worth doing in the writers, and they are the ones a formatter
cannot do *well* even though it can do them:

**Method chains.** Prettier's and Biome's rule, which both arrived at
independently: keep a chain on one line while it is short, break **every** link
onto its own line once it is not — never break some and not others. The
threshold both use is a chain of more than two calls that does not fit the
width, with a "factory" exception for a short head like `data.row()`. The
Ranger version:

```text
one line          when the whole chain fits and has ≤ 2 calls
fully broken      otherwise, one call per line, indented one step
```

```kotlin
// fits: stays
chart.bar().x("region")

// does not: every link breaks, not just the overflowing one
data
    .row()
    .str("region", "North")
    .num("sales", 120.0)
```

**Argument lists.** Same rule: all on one line, or one argument per line. Never
a half-broken list.

**Statement sequences.** The C++ `{ int32_t s = slot_sv_(k); if (s == -1) { … } return …; }`
on one 163-character line is category C, not B: the writer emitted a body as an
expression. A formatter will break it, but the shape is wrong before that.

---

## 6. The option surface

```text
-format=none      emit exactly what is emitted today
-format=ranger    Ranger's own pass: precedence-correct parens, chain and
                  argument breaking, target width           (default)
-format=native    -format=ranger, then run the target's own formatter if it
                  is on PATH: gofmt, rustfmt, prettier, dart format,
                  clang-format, black, ktlint, swift-format
-width=<n>        target line width; per-target default below
```

| Target | Default width | Native formatter |
| --- | --- | --- |
| Go | 100 | `gofmt` |
| Rust | 100 | `rustfmt` |
| C++ | 80 | `clang-format` |
| JavaScript / TypeScript | 80 | `prettier` |
| Dart | 80 | `dart format` |
| Python | 88 | `black` |
| Kotlin | 100 | `ktlint -F` |
| Swift | 100 | `swift-format` |
| C#, Java, PHP, Scala | 100 | — |

`-format=native` is opt-in and never required: a build without the tool
installed still produces `-format=ranger` output, and the tests say so rather
than skipping.

Configuration in the source, beside the module declaration, so a project states
it once rather than in every build command:

```ranger
format {
    width 100
    chains broken-when-long
    target python { width 88 }
}
```

---

## 7. Verification: the ecosystem formatter is the oracle

This is the part that makes the work checkable rather than a matter of taste,
and it is the same criterion `PLAN_API_DOCS.md` §7.3 used for documentation.

> **A target is clean when running its own formatter over Ranger's output
> changes nothing.**

Every one of those tools has a check mode that exits non-zero on a diff:

| Target | Check |
| --- | --- |
| Go | `gofmt -l` prints nothing |
| Rust | `rustfmt --check` |
| JavaScript | `prettier --check` |
| Dart | `dart format --output=none --set-exit-if-changed` |
| C++ | `clang-format --dry-run -Werror` |
| Python | `black --check` |

No target passes it today. Each one gets a test that records the current count
and fails when it rises, ratcheted down as the phases land. Go gets a stricter
one first: `gofmt` must at least **parse** the output, which it currently cannot.

Two more gates, because a formatter cannot tell right from wrong:

- **The output still compiles and still runs.** Removing a parenthesis that was
  load-bearing is a behaviour change, and only execution catches it. Three nets,
  strongest first: **the self-host** — the compiler is ~40k lines of Ranger that
  it compiles with itself, so a precedence mistake anywhere near a hot path stops
  the build reproducing; `tests/compiler-conformance.test.ts`, which runs 9 cases
  on JavaScript, Dart, Go and Kotlin and compares real program output; and the
  gallery programs, which compile and run per target. These are the safety net for
  phase 1 — the formatter is not.
- **Byte-for-byte golden diffs**, reviewed once per phase. A parenthesis change
  is easy to read in a diff; a precedence mistake is not, and the diff is where
  it shows.

---

## 8. Phases

**Phase 0 — the Go keyword collision. DONE, and it was not a Go problem.**
`var go bool` is a syntax error and nothing downstream of it can be measured.
Asking the same question of every target found JavaScript in a worse state
(41 of 46 keywords, no block at all) and C++ close behind. §10.1.

**Phase 1 — the receiver. DONE, all targets.**
`writeCallReceiver` at thirteen sites across eleven writers, deciding from the
emitted text rather than the node. JavaScript 34 → 1, C++ 32 → 1, Dart 36 → 4,
Kotlin 37 → 4, C# 37 → 3, Go 41 → 8, Swift 34 → 1 — and the doc examples of
`PLAN_API_DOCS.md` §18 stop reading like Lisp, which no formatter would ever
have fixed. Rust and Swift 6 followed in phase 1b (§10.2).

**Phase 2 — a precedence model for expressions. DONE.** Parent/child binding
powers, plus a second rule for operators the table does not know. §10.6.

**Phase 3 — chains and argument lists. DONE.** The all-or-nothing rule of §5,
width aware, applied to finished lines rather than during emission. §10.5.

**Phase 4 — native formatting. DONE, as a step rather than a flag.** §10.8.

**Phase 5 — category C. DONE, and both of its premises were wrong.** §10.7.

---

## 9. Risks

**A wrong precedence table changes what the program does.** This is the whole
risk of the plan, and it is concentrated in phases 1 and 2. `(a + b).m()` losing
its parentheses is a silent behaviour change on every target. The mitigations
are ordered by how much they actually catch: the runtime conformance suite
first, then per-target compilation (most such mistakes are also syntax or type
errors), then golden diffs. Phase 1 is deliberately narrow — a closed list of
receiver shapes that need parens, defaulting to *keeping* them for anything not
on the list.

**Ratchets rot.** A "recorded count that only goes down" is a test that passes
while the number is wrong. Each target's count should be committed with the
number in the test, not in a generated file, so lowering it is a visible diff.

**`-format=native` makes the build depend on what is installed.** It stays
opt-in, and CI records which tools were present rather than silently skipping —
the same rule the documentation tests follow.

**Width is a preference and preferences start arguments.** The defaults above
are each ecosystem's own default, not a Ranger opinion. Anything else belongs in
the `format { }` block.

---

## 10. What shipped: phases 0 and 1

### 10.1 Phase 0 — reserved words

The Go defect turned out not to be a Go defect. `scripts/reserved_probe.py`
asks the question the tables were never asked: for every keyword of a target
language, it compiles a Ranger program that names a local, a parameter, a
property and a method after it, and hands the result to that target's own
parser. A keyword Ranger itself cannot spell (`return`, `this`, `true`) is
reported separately from one Ranger spells fine and the target then rejects —
only the second is a defect. A target whose parser is not installed is reported
as UNCHECKED and never as a pass, because a silent skip reads as "no
collisions", which is how the Go table stayed at 2 entries.

| Target | Keywords broken before | After |
| --- | --- | --- |
| **JavaScript** | **41 of 46** — there was no `es6` block at all | 0 |
| C++ | 25, despite 56 existing entries | 0 |
| Go | 20 of 25 | 0 |
| Rust | 2 (`crate`, `super` — the writer spells the rest `r#kw`, and those two cannot be raw identifiers) | 0 |
| Python | 0 of 37 | 0 |
| Dart, Kotlin, Swift, C# | **unchecked — no parser installed here** | unchecked |

JavaScript was worse than Go and had gone unnoticed for longer: `def new:int 1`
emitted `const new = 1`. The compiler self-hosts to JavaScript, so the fix's
blast radius was measurable exactly — rebuilding the compiler with the new
`es6` block changed **4 lines**, all of them the source edit itself. The
compiler's own sources use none of the 40 names.

`null` cannot be listed in a `reserved_words` block: the Ranger parser reads it
as a literal rather than a name, so the pair does not parse. It is renamed for
JavaScript in `transformWord`, beside the C# and Dart cases already there for
the same reason.

The four unchecked targets are not claimed to be clean. They are targets whose
compiler is not installed in this environment, and the probe says so on every
run rather than quietly passing.

### 10.2 Phase 1 — the receiver

`writeCallReceiver` on `RangerGenericClassWriter`, called from thirteen sites
across eleven writers. Measured on `gallery/vela/src/VlChart.rgr`, redundant
parenthesised receivers, comments and string bodies stripped:

| Target | `-format=none` | `-format=ranger` |
| --- | --- | --- |
| JavaScript | 35 | **1** |
| Go | 41 | **8** |
| C++ | 35 | **1** |
| Dart | 39 | **6** |
| Kotlin | 37 | **4** |
| C# | 37 | **3** |
| Python | 1 | 1 |
| Rust | 18 | 18 — *not done, see below* |
| Swift 6 | 34 | 34 — *not done, see below* |

(`python3 scripts/fmt_measure.py --self-check` checks the counter against known
cases before any of these numbers are believed. It has already been wrong once:
a regex anchored on an identifier head counted `((a.b()).c()).d()` as one
redundant pair rather than two, because a parenthesised group is also a legal
head. The `-format=none` column above is a point or two higher than the first
version of this section for that reason.)

**Rust and Swift 6 are deliberately not in this phase.** Rust's
`CreateCallExpression` is not a copy of the shared block: it has several
receiver paths that append `.borrow()` or `.borrow_mut()` depending on the
sharing analysis, and changing it is its own piece of work. Swift 6 already
tests its receiver with `isSimpleClassCallReceiver`, and replacing a working
predicate with a different one, on a target whose compiler is not installed
here, buys nothing. Both are phase 1b. Rust's `CreatePropertyGet`, which *is* a
copy of the shared block, was done.

The generic writer's own copy serves C#, Java 7, Scala, LLVM and Zig — none of
which can be executed here, which is why the parity check below matters more
for them than the paren count does.

### 10.3 How it was verified

Four gates, and the order is the order of how much each one catches.

**The self-host.** The compiler is ~40k lines of Ranger that it compiles with
itself. It reached a fixpoint: gen2 == gen3, and `node --check` reads the
result. An earlier attempt did not, and the way it failed is worth recording —
`wr.fork()` splices a slice at the fork point, but a `CodeWriter` buffers the
line it is building in `currentLine` and only flushes at a newline, so a fork
taken mid-line lands **ahead** of everything the parent had buffered:

```js
(        (this.filesystem))        res["filesystem"] = .toDictionary();
```

`fork()` is safe only at a line boundary, which is why the imports were its only
other use. The implementation uses a detached writer whose content is written
back as one string.

**`-format=none` is byte-for-byte identical to the previous compiler.**
`scripts/fmt_parity.sh` compiles the same sources with both compilers on eleven
targets and compares bytes. All identical (Java 7 fails to compile both
programs, before and after alike). This is the check that catches a change
nobody thought to test, and it is the one that caught a Swift visibility
regression the test suite missed during the documentation work.

**Execution, both ways, from one compiler.** `scripts/fmt_runcheck.sh` compiles
every conformance program with `-format=none` and `-format=ranger`, builds and
runs both, and compares the outputs to each other and to the committed
expectation: 45 program/target pairs across JavaScript, Python, Go, C++ and
Rust, all agreeing. `gallery/invaders` builds and runs identically both ways on
JavaScript, Python, C++ and Rust; its Go build fails on a Windows-only syscall
in both modes alike.

**`tests/format.test.ts`**, 12 cases: the chain shape, the absence of
`(x).`, `-format=none` restoring the old text exactly, the conservative case
(`(new NBox2()).get()` keeps its parentheses), and a keyword fixture whose
output is handed to `node --check`, `gofmt -e`, `python3` and `g++` and then
run.

**What is NOT verified by execution, and should be read as such.** Dart,
Kotlin, C#, Swift, Java, Scala and PHP have no toolchain on this machine, so
for those targets the claim is only that the paren count fell and that
`-format=none` reproduces the previous bytes exactly. Nothing here has run
their output. Three things carry the risk in the meantime: the predicate is a
whitelist that keeps the pair unless the text is provably postfix, the same
predicate is what JavaScript, Go, C++, Python and Rust were verified on, and
`-format=none` is a one-flag way back to the previous output if a target turns
out to disagree.

**The whole suite, read one file at a time, and every failure checked against
the baseline.** `npm test` cannot be read: it stops early and the summary looks
like a suite with a few failures rather than a suite that stopped (ISSUES.md
#77). `scripts/suite_matrix.sh` runs one vitest invocation per file, which
cannot starve, and `scripts/suite_baseline_diff.sh` re-runs the failing ones
against a copy of the previous compiler. Result over 82 files: five with
failing tests — `codegen-rust`, `compiler-ownership`, `engine-imports`,
`ranger-engine`, `ts-to-ranger-native` — and **all five fail on the pre-change
compiler too. Zero regressions.**

**One bug this change did introduce, which none of the gates caught.**
`writeCallReceiver` walks into a detached `CodeWriter`, and three flags live on
the WRITER and are read during that walk: `in_format_args`,
`suppress_expr_parens`, `current_op_no_parens`. The previous code shared them
by walking into `wr` itself; a fresh writer starts all three false, so a
receiver inside a Rust `format!` argument lost `in_format_args`. It needs a
receiver inside a format argument to show, which no fixture and no conformance
program has. It was found by reading the suite output, not by running any gate
— worth recording, because the gates below are otherwise easy to over-trust.

**A failure already in the suite was established rather than assumed.**
`es-conformance-targets.test.ts` fails five of its six cases, and the first
reading was that the change had caused it. Running the same file against a copy
of the previous compiler produced the *same five failures*, down to the probe
name: the es6 oracle case, a Rust `uni-lastindexof` difference that
`KNOWN_TARGET_GAPS` does not record, and Go and C++ hitting the 30-second test
timeout while building on this machine. None of them are this change, and none
of them are fixed by it. The habit worth keeping is the one that produced that
answer: when a suite fails, run it against the baseline before believing the
diff caused it.

### 10.4 What the measurement says about the rest of the plan

Nothing about the whitespace numbers moved, and nothing should have: `changed
lines` is unchanged on every target, because phase 1 removes characters the
ecosystem formatter was going to reprint anyway. The value of phase 1 is
entirely in the places no formatter reaches — the doc comments of
`PLAN_API_DOCS.md` §18, and every target that has no reprinting formatter at
all.

Phase 2 remains the larger correctness win: `(xs[i]).get()` still has one pair,
because the operator path wraps its own result independently of the receiver
decision. Phase 1 stopped that becoming `((xs[i])).get()`; it did not remove it.

---

## 10.5 What shipped: phase 3

`RangerSourceFormat` in `compiler/ng_writer.rgr`, applied in
`CodeFileSystem.saveTo` to the finished text of every file whose extension
names a source language.

### Why on finished lines rather than during emission

A chain is assembled by `CreateCallExpression` recursing through its receiver,
so at no point mid-emission does anyone hold the whole chain. Deciding there
would mean editing eleven writers and knowing, at each one, how much of the
line was still to come. A finished line knows its own length, its own
indentation, and every link it holds.

It is also why phase 3 did not have to wait for phase 2. The decision is made
on the text, so however the operator path ends up parenthesising
`(xs[i]).get()`, the breaking rule reads the result rather than the shape that
produced it.

Keying on the file extension rather than the target language means
`package.json`, `.md` and `.csproj` — which come through the same loop — are
left alone with no plumbing at all.

### The rule

Prettier's and Biome's, which arrived at it independently: a chain stays on one
line while it fits; once it does not, **every** link goes onto its own line. A
half-broken chain is the one shape that reads worse than either. Same for
argument lists: all on one line, or one argument per line. Chains are tried
first — a chain that fits once broken never needs its arguments expanded too.

Thresholds: more than two calls in the chain (two split points), three or more
arguments in the list, and the line over the width. Widths are each ecosystem's
own default — 80 on JavaScript, Dart and C++, 100 elsewhere — with `-width=`
overriding and `-format=none` disabling.

### Calls only, not declarations

A line whose code ends in `{` is a declaration or a lambda header, not a call:
`void Worker::copyInto( const std::vector<uint8_t>& dst, ... ) {`. Expanding
its parameter list is legal on every target here and clang-format does it —
and the first version of this did it, which is how `codegen-cpp` found it. It
is excluded on purpose: a signature is the most-read line in a file and the
most asserted-on text in the suite, and reflowing one buys the least.

### Two things the parser, not the style guide, decided

**Go breaks after the dot, not before it.** Go inserts a semicolon after a line
ending in `)`, so the usual form —

```go
r.str("region", "North")
    .str("category", "Hardware")
```

— is a syntax error there. Go gets `r.str("region", "North").` with the dot
trailing. `gofmt -e` accepts the result and the program runs; the test asserts
both, and asserts that no *other* target uses the Go form.

**An expanded argument list needs a trailing comma on Go**, for the same
reason: `)` on its own line after a bare identifier is a semicolon insertion
away from a parse error.

Python is excluded entirely: a line cannot be broken outside brackets there
without enclosing parentheses, which would put back what phase 1 removed.

### What it is worth on real code, which is less than it looks

| Target | longest line before | after |
| --- | --- | --- |
| C# | 132 | **117** (12 lines over 100 → 10) |
| JavaScript | 128 | 128 |
| Go | 111 | 111 |
| Kotlin | 101 | 101 |
| Swift | 176 | 176 |
| Dart | 100 | 100 |

Only C# moved on `VlChart.rgr`, and the honest reading is that **most long
lines in real Ranger output are neither chains nor multi-argument calls**. They
are operator expressions:

```js
if ( ( typeof(this.members[key] ) != "undefined" && Object.prototype.hasOwnProperty.call(this.members, key) ) )
```

```swift
if ( (String(text[text.index(text.startIndex, offsetBy:0)..<text.index(text.startIndex, offsetBy:1)])) == "-" ) {
```

Neither is a chain; neither has three arguments at any one level. The rule
declines both, correctly. Where it does apply — a builder chain, a wide call —
it produces exactly what prettier and clang-format produce, and it produces it
on the targets that have no formatter to produce it for them.

### Probed the way a text rule fails

A rule that reads text fails on text, so `tests/fixtures/format_stress.rgr`
feeds it the characters it scans for, inside string literals where they mean
nothing: `a.b().c()`, `))((`, `x,y,z`, an escaped quote, and `http://x//y` —
a chain link, unbalanced brackets, separators, a quote and a comment marker.
It also chains inside an `if` condition, where the links sit at bracket depth
1 and must be left alone, and nests a call inside a call, where only the outer
argument list may expand.

```js
r.put("dot", "a.b().c()")
  .put("paren", "))((")
  .put("comma", "x,y,z")
  .put("quote", "he said \"hi\"")
  .put("slash", "http://x//y");
let n = r.size();
if ( r.put("k", "v").size() > 0 ) {
  n = n + 100;
}
const s = SMain.join3(
  SMain.join3("aa", "bb", "cc", "dd"),
  "eeeeeeeeeeee",
  ...
```

JavaScript, Go, C++ and Python all print the same answer.

So phase 3 is done as specified, and the measurement says the next line-length
win is not here. It is in how operator expressions are emitted, which is §5's
category B on the targets that have a reprinting formatter (prettier takes
JavaScript's 128 to 112 by itself) and Ranger's own problem on Go, Kotlin, C#,
Swift and Java.

---

## 10.6 What shipped: phases 1b and 2

### 1b — the two targets phase 1 left out

**Rust.** Its `CreateCallExpression` is not a copy of the shared block: the
pair opened there is closed by one of three suffixes — `).`, `).borrow().`,
`).borrow_mut().` — chosen from the sharing analysis, and a second branch
(`{ let tmp = … ; let tmp_r = (tmp`) opens its own. An `rcvClose` string now
carries which of the two is open, so the predicate can drop the pair on the
formatted path without the suffixes having to know why.

**Swift 6.** It already had a predicate, `isSimpleClassCallReceiver`, and that
is why it was left alone — but the predicate answers only for a receiver that
*names a class*, so every instance call was parenthesised anyway. The shared
one subsumes it: 34 → 1 on the sample. The old test stays on the
`-format=none` path, because it already suppressed the pair there.

### 2 — binding powers, and a second rule for what they cannot answer

The Ranger tree is already fully parenthesised by construction — the nesting
IS the precedence — so a pair in the OUTPUT is needed only where the target
would re-associate differently from the tree.

**The table.** One shared set of binding powers on `RangerGenericClassWriter`.
The rule is deliberately one-directional: **drop the pair only when the operand
binds STRICTLY tighter than the operator it sits inside.** Parentheses around a
tighter-binding operand are never required in any context, so the rule cannot
change what a program means. Equal precedence keeps its pair, which leaves
`(a - b) - c` alone rather than reasoning about associativity, and an operator
missing from the table keeps its pair too.

**The first version of this table was wrong, and the Go self-host build is what
said so.** It claimed "every target here is C-family and orders these operators
the same way". That is false:

- **Go gives all six comparison operators one precedence level**, where C, Java
  and JavaScript put `<` above `==`. So `false == (u < s)` became
  `false == u < s`, which Go reads as `(false == u) < s`:
  `invalid operation: false == int64(len(...))`, seven times over, and the
  compiler no longer built for Go.
- **Go also puts `|` and `^` beside `+`**, and `&` and the shifts beside `*`,
  where C puts the whole bitwise family below comparison. `a | (b + c)` would
  have become `a | b + c`, which Go reads as `(a | b) + c`.
- **Python is different again**: `&` binds tighter than comparison there, and
  `a == b < c` is a chained comparison meaning `(a == b) and (b < c)`.
- **Rust and Swift make comparison non-associative**, so `a == b < c` does not
  parse at all.

What survives is only what every target really agrees on:
`|| < && < comparisons < additive < multiplicative`, with **all six comparisons
at one level** and the bitwise and shift operators given no entry at all —
C, Go and Python place them in three different positions, so nothing there can
be dropped safely.

The correction cost **one pair per target** on the sample. The distinction that
could have broken Go, Python, Rust and Swift bought almost nothing, which is
the argument for the conservative table rather than an argument against
precedence.

```js
a + (b * c)      ->  a + b * c          // tighter: dropped
(a + b) * c      ->  (a + b) * c        // looser: load-bearing, kept
a - (b - c)      ->  a - (b - c)        // equal: kept
(a < b) && (b < c)  ->  a < b && b < c  // relational binds tighter than &&
false == (u < s) ->  false == u < s     // and tighter than equality
```

**The second rule.** The table cannot answer for an operator that is not one:
`(to_double digit)` emits `digit`, `(itemAt xs i)` emits `xs[i]`, and both kept
a pair because their binding power is unknown. So when the model still says
"wrap", the body is written into a writer of its own and the pair is dropped if
what came out is a postfix expression or is already a single balanced group —
the same predicate phase 1 uses on receivers, and safe for the same reason: a
pair around a postfix expression is never required, whatever sits outside it.

That is what finally removes the worked example of §4.2:

```js
joined = joined + ((this.arr[k])).asString();   // before
joined = joined + this.arr[k].asString();       // after
```

both wraps, in one pass — and the double-wrapped ternary with it:

```js
const v = (( … ? this.members[key] : undefined ));   // before
const v = ( … ? this.members[key] : undefined );     // after
```

### What the two phases are worth

Total parentheses in the output of `gallery/vela/src/VlChart.rgr`, against the
compiler as it stood after phase 3:

| Target | Before | After | Removed |
| --- | --- | --- | --- |
| Swift 6 | 1268 | 1131 | **137 (10%)** |
| Go | 1417 | 1346 | 71 (5%) |
| JavaScript | 1144 | 1075 | 69 (6%) |
| Python | 1031 | 962 | 69 (6%) |
| Rust | 1978 | 1948 | 30 (1%) |

### A measurement error worth recording

The receiver-paren counter in `scripts/fmt_measure.py` was over-counting, and
Rust was where it showed: 18 of its reported pairs were not pairs at all. A
`(` that follows a name opens that call's ARGUMENT LIST — `intToText(whole)`
is not a parenthesised receiver — and a `->` separated from its `)` by a space
is a Rust return type, `fn f(self) -> Self`, not a member access. Both are
fixed, both are in `--self-check`, and Rust's real figure was 6 rather than 18.
Every "before" number this plan quoted for Rust was inflated by that.

---

## 10.7 What shipped: phase 5, and why its premises did not survive contact

§3 put two shapes in category C — "**Ranger**, in codegen — a formatter cannot
unpick it" — and named them in §8 as phase 5: the Rust inline
`{ let _tmp_1 = …; }` and the C++ one-line function body. Both claims turned
out to be wrong, in different ways, and finding that out is most of what phase
5 was.

### The Rust block: a formatter CAN unpick it

`rustfmt` reformats it correctly and completely:

```rust
let _tmp_1 = {
    let _tmp_2 = FmtRow::name(&r1, "north".to_string()).clone();
    let _tmp_2_r = FmtRow::add(&_tmp_2, "a");
    _tmp_2_r
}
.clone();
```

So it was category **B**, not C. That does not make it worthless to fix — it is
only reformatted for someone who runs `rustfmt`, and the whole argument of §2 is
that Ranger should not depend on that. But the reason given for calling it
codegen work was false.

It is also worth being clear about what was NOT changed: the block itself is the
ownership machinery hoisting a temporary so a `RefMut` does not outlive the
binding it borrows from (E0597). Questioning that is not a formatting job. Only
its arrival as one line was.

Fixed where phase 3 already works — on the finished line, in
`breakRustBlockLine`, restricted to a line whose code IS the block: it starts
with `{` and nothing follows the matching `}` but a semicolon. An initialiser
like `let x = { … };` is left alone.

### The C++ one-line body: not codegen at all

```cpp
V& at(const K& k) { int32_t s = slot_(k); if (s == -1) { throw std::out_of_range("rg_ordered_map::at"); } return entries[(size_t)s].second; }
```

That is not generated from any Ranger program. It is a **string literal in
`ng_RangerCppClassWriter.rgr`** — `rg_ordered_map` is a hand-written runtime
helper the C++ writer prints verbatim, and four of its bodies (and four `find`
overloads) were written as a whole statement sequence on one line, up to 186
characters.

So there was no codegen shape to fix. The fix is to write the literal across
several lines, which is why it is the one change in this whole plan with no risk
at all: the text is not parsed, transformed or reasoned about by anything.

It does mean C++ output differs from a pre-work baseline by 44 lines whatever
`-format` says — gating the readability of a hand-written string on a compiler
flag would mean keeping two copies of it. `scripts/fmt_parity.sh` names that
difference, and the diff is 0 lines outside the helper.

### What is left of the category

One shape genuinely fits the original description, and it was not named: a
generated `typedef std::variant<…>` at 299 characters, which `clang-format`
does reduce to 80. It is a template argument list rather than a call argument
list, so phase 3's rule declines it. Not done, and not pretended otherwise.

### Verified

`rustc` builds and runs the reformatted Rust block (prints `3`); `g++` builds
and runs the reformatted helper, and a map-heavy conformance program still
produces its committed output byte for byte through `at` and `find`. Two new
cases in `tests/format.test.ts`, 36 in total.

### Verified, phase 5

`scripts/suite_matrix.sh` over all 82 files: **72 pass, 5 fail, 9 excluded**,
and `scripts/suite_baseline_diff.sh` re-ran every one of the five against a
copy of the pre-work compiler — **regressions=0, pre-existing=5**. The self-host
reaches a fixpoint, `-format=none` is byte-identical to the baseline on nine
targets (Python and C++ differ by the two deliberate emission fixes named in
`scripts/fmt_parity.sh`), and 45 program/target pairs run identically both ways.

---

## 10.8 What shipped: phase 4, as a step rather than a flag

### Why it is not `-format=native`

§6 drew phase 4 as a compiler flag. It cannot honestly be one: **Ranger has no
subprocess primitive.** Giving the compiler one would mean implementing process
execution for eleven targets — and putting "run an arbitrary program off PATH"
inside a compiler that is itself compiled to C++, Go, Rust and the rest — so
that a cosmetic pass could call `gofmt`. That is a large and permanent
capability to add for a formatting nicety.

Outside the compiler it needs none of that, and it lands where it was asked to
be: a step you run, or do not.

```
npm run format:native -- <output directory>
npm run format:native:check -- <output directory>
python3 scripts/fmt_native.py <paths> [--check] [--strict]
```

`-format=native` still fails, because a flag that silently means something else
is worse than one that fails — but it now names the command instead of leaving
the feature looking absent.

### Optional in every direction

A step that can break a build is not optional, so none of this can:

- **A formatter that is not installed** is reported by name and file count,
  and those files are left exactly as Ranger wrote them. Exit code 0.
- **A formatter that fails** — it could not parse the file, it crashed — leaves
  the file exactly as Ranger wrote it. A failing tool's stdout is not the file,
  and treating it as one is how a formatter truncates output it could not read.
- **Every tool is run as a stdin→stdout filter**, and the result is written to
  a temporary in the same directory and moved into place. Nothing edits a file
  in place, so a tool that dies mid-write cannot leave a half-written source
  file.
- **A file type with no formatter configured** is skipped without comment.
- Nothing in the build, the test suite or any other script calls it.

`--strict` exists for the opposite need: it fails on a missing or failing tool,
which is §7's "records which tools were present rather than silently skipping".
A silent skip is what makes a formatting gate meaningless.

`--check` changes nothing and reports what would be rewritten.

### Measured

On `VlChart.rgr`, five of six targets are reformatted and `dart format` is
absent here — reported, skipped, exit 0. Every target of the stress fixture
still produces its exact answer afterwards on JavaScript, Python, Go and C++.

Rust prints `101` where the others print `105`, before *and* after `rustfmt` —
that is ISSUES #79 (a chained `return this` returns a clone), reproduced
independently by a fixture written for something else entirely, and not
anything native formatting did.

### The argument for doing it last

Phase 4 is the one phase whose value depends on what is installed on the
machine, and the one that would have **masked every defect this work found**.
`gofmt` run over the Go output from the start would have reformatted around the
reserved-word collisions and the precedence error instead of letting them
surface as parse and build failures. A formatter is a poor oracle for
correctness precisely because it is good at making things look fine.

---

## 10.9 The ComponentEngine suites, with the formatter on

The strongest semantic check available in this repository, and the one that
matters most for a change that rewrites expressions: the ES conformance corpus
is 2,138 probes run through a ~45,000-line interpreter, compiled to five
targets. It is run under its own config (`npm run test:esconformance`); the
default config's 30-second timeout cannot build the Go and C++ legs at all.

### The headline

**All 2,066 answered probes are byte-identical between the pre-formatter
compiler and the formatted one**, while the two JavaScript builds differ by
7,796 lines of text (62,574 → 63,302 lines). Every parenthesis removed, every
chain broken, every argument list expanded — and not one probe answer moved.

**Go and C++ both pass**, probe by probe against the es6 build: 2,138 probes
each, no differences outside `KNOWN_TARGET_GAPS`.

### The three failures, all pre-existing

| Leg | Failure | Same on the pre-work compiler? |
| --- | --- | --- |
| es6 oracle | 72 probes `missing` — the engine answers 2,066 of 2,138 | **yes**, 2138/2066/2064/2/72 identical |
| rust | 1 difference, `uni-lastindexof` | **yes**, identical |
| python | `SyntaxError` — the build does not run at all | **yes**, identical |

Of the 2,066 answered, 2,064 agree with Node and the 2 that differ are both
documented gaps. There are no unexpected differences on any target.

### `npm run test:tsengine`

7 passed, 2 failed, 3 skipped. Both failures are pre-existing, verified by
compiling the same engine with a copy of the previous compiler: 14 `.async`,
22 `.clear` and 1 `DateTime.UtcNow` in both outputs, and both builds fail
identically (Python `SyntaxError`, C# 4 errors either way).

### What this found that is not the formatter's

**The TS engine has never built for Python**, and nothing said so. The engine
emits `fnV.functionNodeOf().async`, and `async` is a Python keyword. The
property IS renamed at its declaration — `self._async = False` — and read
correctly almost everywhere as `member._async`; this one shape is not.

The first guess was that Python's `CreatePropertyGet` writes `prop.vref` where
the generic and C++ writers walk the node, so the rename never reaches it.
Made alone, that change emitted byte-for-byte identical output, and it was
reverted rather than kept.

It was half of the answer. `GetProperty` resolves the member and attaches the
descriptor to the property EXPRESSION node but never to the property node
itself, so there was nothing on that node to be renamed from — which is why
walking it changed nothing. **Fixed (ISSUES.md #80)**: the descriptor is
attached to the property node, and Python and PHP walk it like every other
writer. Either change alone does nothing; together they close it.

The Python engine now builds, runs, and answers all 2,066 probes — agreeing
with es6 on 2,061. The five that differ are recorded in `KNOWN_TARGET_GAPS`
rather than hidden: four are negative zero not surviving an operation, so
`1/-0` answers `+Infinity`, and the fifth is `uni-lastindexof`, which Rust
gets wrong identically. They are newly visible, not newly broken.

A second defect turned up in the same shape and is filed unfixed
(**ISSUES.md #81**): `(expr).field` does not resolve at all as a CALL
ARGUMENT. `def ok:int ((h.nodeOf()).plain)` compiles and
`ArgMain.id((h.nodeOf()).plain)` on the next line does not. Nothing to do with
keywords — any property name fails.
