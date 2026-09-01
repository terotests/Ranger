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

## 4. A is one unconditional line

`RangerGenericClassWriter.CreateCallExpression`
(`compiler/ng_RangerGenericClassWriter.rgr:511`) writes:

```ranger
wr.out("(" false)
ctx.setInExpr()
this.WalkNode( obj ctx wr)
ctx.unsetInExpr()
wr.out(")." false)
```

The receiver is wrapped **unconditionally**, with no precedence test at all.
That single site produces `(this).find(id)`, `(t).find("root")` and every
`((a.b()).c()).d()` in the table above. On the measured file it accounts for 34
of the JavaScript output's parentheses and 36 of Dart's.

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

**Phase 0 — the Go keyword collision.** `var go bool` is a syntax error and
nothing downstream of it can be measured. It is not formatting work, but it
blocks the Go half of this plan's own verification, so it goes first.

**Phase 1 — the receiver.** The predicate of §4.1 at the one site in
`CreateCallExpression`, plus per-target overrides. Measured effect on the
sample: 36 parentheses gone on Dart, 40 on Go, 22 on Rust, 34 on JavaScript
that prettier would otherwise have to remove — and the doc examples of
`PLAN_API_DOCS.md` §18 stop reading like Lisp, which no formatter would ever
have fixed. Smallest change in the plan and the largest visible win.

**Phase 2 — a precedence model for expressions.** Replace the ad-hoc
`suppress_expr_parens` flag with parent/child binding powers. Removes the
stacked `((…))`, and removes the need for a new manual suppression at every
future call site.

**Phase 3 — chains and argument lists.** The all-or-nothing rule of §5, width
aware. `CodeWriter` already tracks `columnNumber` and `currentLine`
(`compiler/ng_writer.rgr:189`), so the writer can already tell how much room is
left — the information needed for this is present and unused.

**Phase 4 — `-format=native`.** Run the ecosystem tool when it is present. Cheap
once phases 1–3 mean it has little to do.

**Phase 5 — category C.** The Rust inline `{ let _tmp_1 = …; }` and the C++
one-line function body. Codegen shape work, tracked separately; listed here only
so it is not mistaken for formatting.

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
