# Conformance — how the evaluator is measured, and what it deliberately does not do

The parser suites measure only what is **accepted**. They say nothing about whether
the evaluator produces the right **value**, and the two diverge badly: classes and
regular expressions parse perfectly and evaluate to nothing.

This document records how runtime conformance is measured, and — more importantly —
which gaps are **deliberate decisions** rather than oversights. A gap that is written
down can be argued with. A gap that lives only in a commit message is invisible.

---

## 1. How it is measured

### Expectations are derived, never hand-written

Every probe in `tests/runtime-conformance.test.ts` is executed by **Node first**, and
the engine is compared against that result. A probe that is wrong about JavaScript
fails the suite instead of silently encoding a misunderstanding.

This is not a stylistic preference. It has caught real errors three times:

- A refactor bound the receiver when a built-in method was extracted, so
  `var c = f.call; c(x)` *worked* — but in JavaScript that is a `TypeError`, because
  `f.call` is the unbound `Function.prototype.call`. The engine was accepting code
  Node rejects. A hand-written expectation would have shipped the bug.
- `math-max-empty` and `json-nan-null` were passing by comparing a broken engine
  value against a broken engine value. Making `NaN`/`Infinity` real values broke
  both, revealing two genuine defects.
- `typeof Symbol('x')` returned `"object"`; Node says `"symbol"`.

### Gaps are asserted in both directions

`KNOWN_GAPS` is a live assertion, not a comment. A probe **outside** the list must
pass; a probe **inside** it must still fail. Fixing a gap therefore *breaks the suite*
until the list is updated, so the list cannot quietly rot, and an evaluator that
returns nothing is counted as a failure rather than a pass.

Over one working session, 18 entries removed themselves this way — each caught by the
suite failing because a gap had closed, not by anyone remembering to check.

### Vacuous passes are the thing to guard against

The engine's historical failure mode was **silence**: an unsupported operation
returned null and execution continued, so the assertion after it never ran.

Measured against Test262 this produced a *fictional* 82.6% pass rate on an engine
with no RegExp, no Proxy and no Temporal. Nine of thirteen deliberately-failing
control probes "passed".

Any Test262 harness used here **must** therefore run negative controls first —
guaranteed-failing snippets that must fail. If they pass, the score means nothing.
Two structural traps to avoid:

| Harness shape | Bias |
|---|---|
| Test body wrapped in a function | **Low** — a nested function declaration binds differently |
| Test body at top level | **High** — only `ExpressionStatement`s used to execute, so `throw`/`if`/`for` silently did not run |

### Scoring is segmented by spec era

A single blended percentage hides which era is weak, and hid a 4-point regression in
`built-ins/String` behind net progress. Test262 tags older tests with `es5id` /
`es6id`; the scorer buckets on that.

---

## 2. Deliberate gaps

These are **decisions**, with the reasoning. They are not TODOs that were forgotten.

### 2.1 Deferred by policy — whole subsystems

| Area | Why |
|---|---|
| **Temporal** | A specification roughly the size of the rest of the standard library. Poor value against every other item. |
| **RegExp** | Deferred by explicit direction: base spec (ES5, then ES6) first. |
| **intl402** | Internationalisation; out of scope for a game-engine guest realm. |

The era scorer **excludes these by name and reports the excluded count**, so setting
them aside cannot quietly flatter the remaining number.

### 2.2 Correct-but-incomplete, left rather than fudged

- **`Object(5)` does not box a primitive** into a wrapper object. It returns the
  primitive. Boxing needs a wrapper-object model the evaluator does not have, and a
  half-boxed value would be worse than an honest primitive.

- **An invalid `Function` body is not reported as `SyntaxError`.** `Function(...)`
  assembles source and parses it, but the parser recovers differently inside a
  function body than at top level, so `errorCount` stays zero. `eval` *does* report
  SyntaxError correctly; only the `Function` constructor path is affected.

- **`Function.prototype` is a plain object, not callable.** Spec says it is a function
  that returns `undefined`. Nothing in the guest realm depends on calling it.

- **`Number.MAX_VALUE` / `MIN_VALUE` were initially omitted** rather than approximated,
  because the tests that read them check exact bit patterns. They are now present,
  parsed from strings — the Ranger lexer cannot express the literals, but the
  runtime's string-to-double conversion reproduces the exact value. *The original
  decision to omit rather than approximate was right; the conclusion that they were
  unreachable was wrong.*

- **A failed write to a non-writable property is silent.** This models sloppy mode.
  Strict mode would throw, and the evaluator does not track strictness per scope.

### 2.3 Known-wrong, pinned rather than hidden

- **The lexer drops an escaped quote adjacent to a string's own delimiters.**
  `'\'a\' + \'b\''` yields `` a' + 'b `` — the first and last escaped quotes vanish
  while the middle ones survive. This silently corrupts string values.

  Pinned as `lex-escaped-quote-edges` / `lex-escaped-quote-single`, asserted to
  **still fail**. Not fixed because `ts_lexer.rgr` is what the 3380/3380
  `test262-parser-tests` result runs on, and a change there needs that suite
  re-validated. This is the first thing to pick up.

- **`export` is not a visibility gate.** Every top-level binding in a virtual module
  is reachable through the namespace, exported or not. The cross-module block in the
  runtime suite asserts the positive path passes *and* that this negative case still
  fails, so it is measured rather than forgotten.

- **Nested class declarations are visible wider than the spec allows.** A class
  declared inside a function body registers in the engine-wide class table, because
  that table is keyed by name rather than scoped. Strictly better than `new C()`
  resolving to nothing; shadowing still follows declaration order.

### 2.4 Structural ceiling, now removed (recorded for context)

Built-in methods used to be an internal `methodName` if-chain rather than first-class
values, so `Array.prototype.slice.call(...)` **could not work** no matter how many
methods were added. That was the hard ceiling on ES5.

Resolved by the registry (§3). Recorded here because it explains why some earlier
work moved the score very little: it removed a ceiling rather than clearing a backlog.

---

## 3. Binding decisions introduced

Tagged in the source with these markers.

| Tag | Decision |
|---|---|
| `D-REGISTRY` | Built-ins are keyed by `(receiverKind, name)` and dispatched receiver-kind-first. Ranger has no function pointers, so that **pair** is also what is handed out as a first-class value. `builtinArity` is the single authority on what exists. |
| `D-PROTO` | Prototype chain. `F.prototype` is created on first read and stored; `new F()` links to it; property misses walk it, depth-bounded against cycles. |
| `D-ACCESSORS` | Getters/setters stored apart from `objectMap` so an accessor is never mistaken for a data property. Invoked at the member-access sites, since `EvalValue` has no evaluator reference. |
| `D-ATTRS` | Property attributes as a bitmask keyed by name, where an **absent** entry means all-true. Plain assignment costs no bookkeeping; only `defineProperty` pays. |
| `D-ERRORS` | Error constructors are seeded singletons, so `thrown.constructor === TypeError` holds **by identity** — which is what `assert.throws` actually compares. |
| `D-GLOBALOBJ` | Built-in namespaces are real objects, not names recognised structurally. Calls still dispatch structurally first, so reachability is added without changing dispatch. |
| `D-IEEE` | Division by zero, negative zero, `Infinity`/`NaN` as values. The zero case is `left * (1/right)` because that respects the **divisor's** sign. |

### Framework surface is deliberately outside the registry

The native bridge, `registerGlobal` host injections, EVG/JSX helpers and
AssemblyScript sized casts are the **embedding**, not ECMAScript. They are routed
*ahead* of the registry so they keep priority. That ordering is explicit rather than
emergent from where a branch happened to sit in a chain.

---

## 4. Running the suites

```bash
npm run test:runtime      # runtime conformance probes (fast, ~0.5s)
npm run engine:v2:test    # engine contract suite (106 suites, ~1900 assertions)
npm run engine:pong:runner # gallery smoke
```

Both `runtime-conformance` and `engine-contract` run in CI, ungated: the interpreter
lives under `gallery/` but its tests live in `tests/`, so gating either would let a
change on one side of that boundary skip the check.
