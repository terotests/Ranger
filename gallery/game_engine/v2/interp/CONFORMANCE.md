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

Across this work 27 entries removed themselves this way — each caught by the suite
failing because a gap had closed, not by anyone remembering to check. Two of them
(`lex-escaped-quote-edges`, `lex-escaped-quote-single`) had been pinned as
known-wrong-and-too-risky-to-touch; when the real cause turned out to be somewhere
else entirely, the assertion is what said so.

### Vacuous passes are the thing to guard against

The engine's historical failure mode was **silence**: an unsupported operation
returned null and execution continued, so the assertion after it never ran.

Measured against Test262 this produced a *fictional* 82.6% pass rate on an engine
with no RegExp, no Proxy and no Temporal. Nine of thirteen deliberately-failing
control probes "passed".

A control that starts passing is not automatically a bug: when RegExp was
implemented, its "this feature is absent" control reached the end because the
feature had become real. That one moved to the **positive** controls rather than
being deleted, so the set still measures something. The current reading is
**0 vacuous of 12**, with every positive control reaching its end.

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
| ~~**RegExp**~~ | *No longer deferred.* Implemented — see §2.5. |
| **intl402** | Internationalisation; out of scope for a game-engine guest realm. |

The era scorer **excludes these by name and reports the excluded count**, so setting
them aside cannot quietly flatter the remaining number.

### 2.2 Correct-but-incomplete, left rather than fudged

- **Array holes are not modelled.** `[4,5,,,,].length` is 5 — the elisions are real
  element positions now — but a hole evaluates to `undefined` rather than being
  absent, so `0 in [,1]` answers `true` where the spec says `false`. Telling them
  apart needs a hole-aware element representation in `EvalValue`, not a change to
  the array methods.

- **A quantified group takes the first alternative that matches** rather than
  backtracking across alternatives from outside itself. `/^(a+)\1*,\1+$/` therefore
  fails to find a match that requires `(a+)` to give back characters. Fixing it means
  a continuation-passing matcher, and Ranger has no function values to carry the
  continuation with. See §2.5.

- **A `Date`'s local time zone is UTC, and the clock stands still.** The time-value
  arithmetic of §15.9.1 is implemented in full (`DateTime.rgr`) and validated against
  Node over 209 differential cases, but the realm has no time-zone database and no
  host clock: `getTimezoneOffset()` is 0, `getHours()` agrees with `getUTCHours()`,
  and `Date.now()` / `new Date()` report `hostNowMs`, which an embedder sets and which
  is 0 by default. A fixed UTC host is a legal choice of host, not a wrong answer —
  but it does mean nothing here observes real time.

- **`Math.exp` and `Math.log` are series approximations.** The Ranger runtime has no
  intrinsic for either. Both reduce their argument first and are accurate to roughly
  1e-15 relative — close to the host but not bit-identical, so a test comparing an
  exact bit pattern would still see a difference.

- **`Date.parse` accepts the Date Time String Format and nothing else.** Every other
  format is `NaN`, which the spec permits — an implementation may accept whatever
  else it likes, and this one likes nothing else. The strings this engine itself
  produces (`toISOString`) round-trip; `toUTCString` and `toString` do not parse back.

- **An invalid `Function` body is not reported as `SyntaxError`.** `Function(...)`
  assembles source and parses it, but the parser recovers differently inside a
  function body than at top level, so `errorCount` stays zero. `eval` *does* report
  SyntaxError correctly; only the `Function` constructor path is affected.

- **`Number.MAX_VALUE` / `MIN_VALUE` were initially omitted** rather than approximated,
  because the tests that read them check exact bit patterns. They are now present,
  parsed from strings — the Ranger lexer cannot express the literals, but the
  runtime's string-to-double conversion reproduces the exact value. *The original
  decision to omit rather than approximate was right; the conclusion that they were
  unreachable was wrong.*

- **Strictness propagates dynamically for the code being run, lexically for a
  function's own flag.** A function's `strictFn` is stamped where it is created, so
  `caller`/`arguments` poisoning is exact. The ambient "is the running code strict"
  flag is saved and restored per call, which is right for every nesting and wrong
  only for a callback that was defined in sloppy code and is called from strict code.

### 2.3 Closed since this document was written

- **`Object(5)` now boxes a primitive** into a wrapper object, and `new Object()`
  produces an object that can hold a property — it previously fell through to class
  instantiation and produced something that could not.

- **`Function.prototype` is callable**, as the spec requires.

- **A failed write to a non-writable property throws in strict mode.** The evaluator
  tracks strictness now (`D-STRICT`), and `writeRefusalError` mirrors the conditions
  `setMember` silently returns on, so the two cannot disagree.

- **The "lexer drops an escaped quote adjacent to a delimiter" gap was never the
  lexer.** The lexer's token value is already delimiter-free; the evaluator ran it
  through `unquote()` a second time, which removed whatever matching pair it found at
  the ends. Reading the token value directly was the whole fix, and `ts_lexer.rgr` is
  untouched — the re-validation that had been treated as the blocker was never needed.
  *The gap was real and worth pinning; the attributed cause was wrong, and pinning it
  as "the lexer" is what kept it unexamined.*

- **A function's source text is real, and a `Function()`-built one is its assembled
  source.** `Function.prototype.toString` returns the slice the function's node spans
  in the source it was parsed from — the parser records `end` on function nodes, and
  the value carries the whole source string so a nested function's absolute offsets
  still index into it. A built-in has no source and keeps the `[native code]` form the
  spec allows.

### 2.4 Known-wrong, pinned rather than hidden

- **A script's top-level `var` is not a property of the global object, and top-level
  `this` is not the global object.** The global object exists and a bare name falls
  back to it, but the module scope is not object-backed, so `var toString = f` at the
  top level of a script does not become `globalThis.toString`. Making it work needs an
  object-backed environment record on `EvalContext`. One `built-ins/String` file turns
  on exactly this.

- **`export` is not a visibility gate.** Every top-level binding in a virtual module
  is reachable through the namespace, exported or not. The cross-module block in the
  runtime suite asserts the positive path passes *and* that this negative case still
  fails, so it is measured rather than forgotten.

- **Nested class declarations are visible wider than the spec allows.** A class
  declared inside a function body registers in the engine-wide class table, because
  that table is keyed by name rather than scoped. Strictly better than `new C()`
  resolving to nothing; shadowing still follows declaration order.

### 2.5 RegExp — what it does and does not do

Implemented because `String.prototype.match`, `replace`, `search` and `split` are all
specified against it: without a RegExp those four could not be written at all, and
every failure in them was the same missing piece.

The ES5 pattern grammar compiles to a node tree, matched by backtracking. Backtracking
is recursion over a node **list** — match node *i*, then ask yourself to match the rest
from wherever that landed — so a failure deep in the tail unwinds into the quantifier
that produced it and the next count is tried.

| Supported | Absent |
|---|---|
| classes with ranges, negation, `\d \w \s` | `u` and `y` flags |
| `* + ? {n,m}` and their lazy forms | named groups |
| groups, non-capturing groups, alternation | lookbehind |
| `^ $ \b \B`, backreferences, lookahead | Unicode property escapes |
| `i`, `g`, `m` | full backtracking across a group's alternatives |

The compiled program is recompiled from source at each use: a `RegexProgram` cannot be
stored inside an `EvalValue`. Slower, and invisible to the guest.

### 2.6 Structural ceiling, now removed (recorded for context)

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
| `D-STATICS` | Built-in **statics** are values too, keyed `(namespace, name)`. Two lists on purpose: what EXISTS as a describable value, and the subset invocable from a captured value. Keeping them apart is what stops a direct `Object.create(...)` being intercepted and answered with `undefined`. |
| `D-CLASSOF` | The `[[Class]]` brand behind `Object.prototype.toString`. The only way a program can observe an internal type, and 86 ES5 files capture the method under the name `getClass` to assert it. |
| `D-STRICT` | Strict mode. `writeRefusalError` mirrors `setMember`'s silent-refusal conditions so the two cannot disagree. A function's own strictness is stamped on the value at creation, because poisoning `caller`/`arguments` turns on the ACCESSED function's strictness, not the accessing code's. |
| `D-STRNUM` | ToNumber on a string follows the StringNumericLiteral grammar rather than the host parser, which is lenient (`"12x"` → 12) and knows nothing of `0x`/`0b`/`0o`. |
| `D-ARRAYLIKE` | Array.prototype methods are generic over their receiver. The mutating ones still require a real array, since they write back into it. |
| `D-REGEX` | The pattern grammar as a node tree, matched by backtracking. See §2.5. |
| `D-ARGUMENTS` | `arguments` as an array-like OBJECT — brands as `[object Arguments]`, and `Array.isArray` says false. |
| `D-FNSRC` | A function value carries the WHOLE source string it was parsed from, not a pre-cut slice, and `Function.prototype.toString` cuts `[node.start, node.end)` out of it. The whole string, because a nested function's offsets are absolute in the same one; a call swaps the source in effect so a closure returned by an eval'd factory records its own. |
| `D-DATE` | A Date is arithmetic on one time value (`DateTime.rgr`, ECMA-262 §15.9.1). Local time is UTC and the clock is `hostNowMs`, so every result is reproducible. The default ToPrimitive hint behaves as STRING for a Date and as NUMBER for everything else, which is what makes `date + ''` the date's text while `+date` is its time. |

### Framework surface is deliberately outside the registry

The native bridge, `registerGlobal` host injections, EVG/JSX helpers and
AssemblyScript sized casts are the **embedding**, not ECMAScript. They are routed
*ahead* of the registry so they keep priority. That ordering is explicit rather than
emergent from where a branch happened to sit in a chain.

---

## 4. Where the score stands

Sampled over the ES5-tagged corpus (6349 files), excluding Temporal and intl402:

| Area | Result |
|---|---|
| `language/expressions` | **100%** (1318/1318, whole directory) |
| `built-ins/Number` | **100%** (146/146, whole directory) |
| `built-ins/Date` | **100%** (4/4, whole directory) |
| `built-ins/String` | **99.7%** (707/709, whole directory) |
| `built-ins/Math` | 91% (74/81) |
| `built-ins/Object` | 76% (1577/2080) |
| `language/statements` | 72% (403/562) |
| `built-ins/Function` | 71% (257/361) |
| `built-ins/Array` | 58% (124/212) |
| ES5 overall | **82.6%** (743/900 sampled) |

`built-ins/String`'s two remaining files are both named above as deliberate gaps: the
regex quantified-group backtracking case (§2.2) and the global-object-as-var-home case
(§2.4). Nothing in String is unexplained.

The runtime-conformance suite is at 823 probes, every one of them derived from Node.
Date is additionally validated by 209 differential cases against Node covering the
component getters, the setter family, `Date.parse`, `Date.UTC` and both range extremes.

---

## 5. Running the suites

```bash
npm run test:runtime      # runtime conformance probes (fast, ~0.5s)
npm run engine:v2:test    # engine contract suite (106 suites, ~1900 assertions)
npm run engine:pong:runner # gallery smoke
```

Both `runtime-conformance` and `engine-contract` run in CI, ungated: the interpreter
lives under `gallery/` but its tests live in `tests/`, so gating either would let a
change on one side of that boundary skip the check.
