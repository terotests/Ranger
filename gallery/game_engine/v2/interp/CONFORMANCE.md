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
| Test body wrapped in a function | **Low** — the test's own top-level `var` and function declarations become locals, so anything about the global scope is invisible |
| Test body at top level | **High** *(historically)* — only `ExpressionStatement`s used to execute, so `throw`/`if`/`for` silently did not run |

The runner now uses the **top-level** shape, which is what Test262 itself specifies:
each file is a script. The high-bias trap that shape used to carry is gone — every
statement kind executes — and the change was verified not to be a leniency shift
three ways: the negative controls still read **0 vacuous of 12** under it, all four
positive controls still reach their end, and the ES5-wide score was **identical**
(743/900 at the time of the change) under both shapes. Only the handful of files that genuinely depend on
script-level semantics move, which is the point.

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

- **A quantified group backtracks across its body now.** It used to take the first
  inner match that worked, so `/^(a+)\1*,\1+$/` could not find a match that needed
  `(a+)` to give characters back. The continuation is now carried explicitly as a
  `RegexCont` chain — an immutable linked list of "where to resume", which is what a
  continuation-passing matcher needs and what Ranger's lack of function values had
  been read as ruling out. *The gap was real; the conclusion that it was unfixable
  without function values was wrong — the continuation is data, not a function.* The
  same change made each repetition clear the captures inside it, per RepeatMatcher.
  `built-ins/RegExp` moved 351/490 → 365/490 on this alone.

- **The "lexer drops an escaped quote adjacent to a delimiter" gap was never the
  lexer.** The lexer's token value is already delimiter-free; the evaluator ran it
  through `unquote()` a second time, which removed whatever matching pair it found at
  the ends. Reading the token value directly was the whole fix, and `ts_lexer.rgr` is
  untouched — the re-validation that had been treated as the blocker was never needed.
  *The gap was real and worth pinning; the attributed cause was wrong, and pinning it
  as "the lexer" is what kept it unexamined.*

- **Writing an array's `length` resizes it** — truncating drops the elements past the
  new end, growing adds holes — and a value that is not a uint32 is a `RangeError`. It
  used to be stored as an ordinary property and ignored, so `x.length = 0` left the
  array untouched.

- **Array holes are modelled.** A hole is a shared sentinel value whose `valueType`
  is still 8, so anything that merely wants a value sees `undefined` and needs no
  change; only the code that asks whether the element is *present* looks at the slot.
  `0 in [,1]` is false, `forEach`/`filter`/`every`/`some`/`reduce`/`indexOf` skip
  holes, `map` preserves them, `Object.keys` and `for-in` omit them. Created by an
  elision, by `Array(n)`, by growing `length`, by `delete`, and by assigning past the
  end. *The earlier note said this needed a hole-aware element representation — it
  did, and that turned out to be one sentinel rather than a new container.*

- **Reading a field of a DESCRIPTOR is a full `[[Get]]`.** It runs an accessor and
  walks the prototype chain, and the nearest holder wins whichever kind it is — an own
  data property shadows an inherited accessor. Reading the raw map instead was the
  single largest failure family in `Object.defineProperty` and `defineProperties`. The
  same ordering bug was in ordinary property reads, where asking for the getter first
  walked the whole chain and let an inherited accessor beat an own data property.

- **An attribute the descriptor omits is KEPT on an existing property** and defaults
  to false only on a new one. Taking the descriptor's absent field as `false` stripped
  the flags a property already had on every redefinition. Changing a property's kind
  now drops the other kind's state, so a data property turned accessor stops reporting
  `value`/`writable`.

- **An accessor property is a property.** It lives in `getterMap`/`setterMap` rather
  than `objectMap`, and listing only `objectMap` left every accessor out of
  `Object.keys`, `getOwnPropertyNames` and the descriptor-map step of `Object.create`.
  `{get: undefined}` is still an accessor descriptor: the property exists and reports
  `get`/`set` rather than `value`/`writable`.

- **An array has its own `[[DefineOwnProperty]]`.** `length` resizes and rejects a
  non-uint32 with a `RangeError`; an index defines an element and pushes `length` out.
  Neither went near the elements before.

- **An error has a real prototype chain.** `TypeError.prototype` inherits from
  `Error.prototype`, which inherits from `Object.prototype`, and instances link to
  theirs. A property put on `Error.prototype` used to be invisible to every error.

- **A built-in constructor held as a VALUE is callable.** `var f = Number; f(42)`,
  `Number.bind(null)(42)` and `Function.call(null, "return 1")` all go through one
  value-level constructor path now; the direct call sites read the AST, so a captured
  constructor was not callable at all.

- **A sloppy function called with no receiver gets the global object**, and a
  primitive receiver is boxed — `Function("this.x = 1").apply()` turns on this rule. A
  strict function still keeps exactly what it was given.

- **A map lookup survives a key that shadows `hasOwnProperty`.** `o.hasOwnProperty = 1`
  used to take the host process down, because the compiler emitted `map.hasOwnProperty(k)`
  for `has`/`get` on a string map. The es6 templates in `compiler/Lang.rgr` now use
  `Object.prototype.hasOwnProperty.call`, which fixes the whole class rather than the
  one path that surfaced it.

- **`Object.prototype`'s methods are values, not just call-site handlers.**
  `hasOwnProperty`, `propertyIsEnumerable`, `isPrototypeOf` and `toLocaleString`
  worked when called directly but were absent from the registry, so
  `typeof Object.prototype.propertyIsEnumerable` was `"undefined"` for a method that
  plainly works — and borrowing one onto another receiver did nothing.

- **A PRIMITIVE is trivially frozen and sealed, and never extensible**, per ES2015.
  These answered from the integrity flags of a value that has none.

- **A BOUND function poisons `caller` and `arguments`** whatever its target was, and
  has no `prototype` of its own.

- **A property a PRIMITIVE does not have reads as undefined**, not as the engine's
  null sentinel — `typeof (1).nope` was `"object"`.

- **Redefining an accessor replaces only the halves the descriptor names.**
  `{set: undefined}` really does remove the setter, and a half the descriptor omits is
  kept. The properties argument of `Object.defineProperties` is `ToObject`'d rather
  than required to be an object, and an array's `length` has a real `writable`
  attribute — turning it off makes a later resize a `TypeError`.

- **`Function.prototype` is callable and returns undefined**, which is what `typeof`
  had already been saying about it, and a function's synthesised `length` and `name`
  can be deleted — `prototype` cannot, because on an ordinary function it is
  non-configurable.

- **A method the guest puts on a built-in prototype wins over the registry.**
  `Array.prototype.toString = Object.prototype.toString` now makes `[].toString()`
  brand the array. ToPrimitive already looked; the direct call path went straight to
  the registry. The two are told apart by identity against `sharedNativeMethod`, which
  is what that per-(kind, name) cache exists to make possible.

- **An array, a string, a function and a RegExp report the prototype they inherit
  from.** They dispatch by KIND and carry no prototype link of their own, so
  `Object.getPrototypeOf([])` answered null and `Array.prototype.isPrototypeOf([])`
  was false. The link is now derived from the kind when none is stored, with
  Object.prototype terminating the chain.

- **A script's `var` and function declarations are properties of the global object,
  and `globalThis` IS `this`.** Only the *directly* top-level `var` statements were
  mirrored, so a `var` inside a block or a `try` — still script-scoped, since var
  hoisting does not stop at a block — was a binding and not a property, and a function
  declaration was neither. Two different objects also answered to `this` and to
  `globalThis`. A later write keeps the property and the binding in step, and a
  function-local `var` of the same name is left alone. `let`/`const`/`class` are
  deliberately absent: they live in the declarative environment and really are not
  properties of the global object.

- **`Object.prototype.valueOf` is `ToObject`, and a built-in never gets the sloppy
  `this`.** Borrowed onto a primitive it BOXES it, so
  `typeof Object.prototype.valueOf.call(true)` is `"object"`; on `undefined` or `null`
  it throws. And because the global-object substitution the spec performs for a sloppy
  ECMAScript function does not apply to a built-in, the bare
  `var vo = Object.prototype.valueOf; vo()` is a `TypeError` rather than an answer
  about the global object. Only the wrapper prototypes' own `valueOf` unwraps.

- **`==` between two object-like values is identity, and a function is object-like.**
  Functions, Maps and Sets were left out of the object test, so `f == f` fell through
  to the numeric comparison and answered **false** for a value identical to itself.

- **`new` through an expression that yields a constructor.**
  `new (Function("...; return f").apply())` had no name to look up, so `new` produced
  null and the instance could not be read at all.

- **`bind` curries `[[Construct]]` as well as `[[Call]]`.** Constructing through a
  bound BUILT-IN runs the built-in — `new (Function.prototype.bind.apply(Date, [null,
  1957, 4, 27]))()` is a Date, where it used to be a bare object branded
  `[object Undefined]`. A bound function has no `prototype` of its own, so the
  instance links to the TARGET's, and an ordinary `F.prototype` now terminates at
  `Object.prototype` instead of one link short — `Object.prototype.p = 1;
  (new F()).p` used to read undefined.

- **A built-in borrowed onto an object is the method ToPrimitive runs.**
  `String({toString: Function.prototype.toString})` is a `TypeError`, not
  `"[object Object]"`: the default-method shortcut treated any node-less function as
  "the default for this receiver" and never called it.

- **A registry method deleted off its prototype stays deleted.**
  `delete Object.prototype.toString` used to be a no-op, because the per-kind registry
  minted the method again on the next read. The deletion is recorded on the prototype
  object and every path that consults the registry checks it first; putting the name
  back undoes it, and a deletion on a KIND prototype still falls back to
  `Object.prototype`'s own copy.

- **`RegExp.prototype` publishes `source`/`global`/`ignoreCase`/`multiline` as
  accessors** — get-only, non-enumerable, configurable — which is the ES2015 shape
  `getOwnPropertyDescriptor` is written against. A getter may now be a built-in with
  no function node; only node-backed ones used to run.

- **A missing separator in an array or object literal is a `SyntaxError`.** The parser
  looped straight into the next element, so `[a b]` was a two-element array and
  `new Function({})` — whose body is `"[object Object]"` — built a function instead of
  throwing. Recognising the accessor forms whose key is a keyword, string or number
  (`({ get null() {} })`, `({ set "a"(v) {} })`, `({ get 10() {} })`) is what keeps the
  new rule from rejecting those; only an Identifier key had been recognised, and the
  silent-acceptance bug was hiding it.

- **`finally` runs on an abrupt completion.** A `return`, `break`, `continue` or
  pending throw in the try block sets a flag that every statement path bails on, so
  the finally block was reached and then immediately skipped — the one thing the
  clause exists for. The pending completion is set aside for its duration and
  restored afterwards, unless the finally produces an abrupt completion of its own,
  which per spec replaces it: `try { return 1 } finally { return 2 }` is 2, and
  `try { throw x } finally { break }` leaves the loop with no exception.

- **Labelled statements execute.** `LabeledStatement` had no case at all, so
  `outer: for (…)` ran *nothing*. A loop now claims the labels attached to it, and a
  `break`/`continue` naming an outer label passes straight through the inner loops
  rather than being consumed by the nearest one. A labelled block consumes a break
  that names it, which is what makes `blk: { break blk; }` leave the block.
  The switch-case parser also hand-rolled its `break`, dropping the label, so
  `case 2: break L;` parsed as a bare break followed by an expression statement `L`.

- **A `for` loop's update and init clauses are expressions, not just assignments.**
  `for (…; …; i++, j--)` never ran its update — the comma expression fell through
  the assignment-only path — so the counter stood still and the loop ran to the
  iteration cap. `for (i = 0; …)` with a non-declaration init did not initialise at
  all, and the body never executed; several tests were passing *vacuously* because
  of it, one of which (`localeCompare` with no argument) turned out to be a real
  defect once the loop started running.

- **`delete <name>` is a real operation.** It answered true and removed nothing.
  What the name resolves to decides the answer: a property of a `with` object is
  deleted, a declared `var`/function is non-configurable and answers false, a
  binding created by assignment to an undeclared name goes, and an unresolvable
  name is true. Which names are implicit is now tracked, since nothing else in the
  engine distinguished the two.

- **A `var` initialiser inside `with` writes the object's property.** The
  declaration hoists out of the block and stays undefined; the initialiser is an
  ordinary assignment and goes through the with scope. That is the whole of
  §12.10's interaction with declarations, and about twenty tests turn on it.

- **`eval` returns the last non-empty Statement completion**, not the last
  top-level *expression statement*. A value produced inside a loop, an `if` or a
  `try` now reaches it, so `eval("if (true) { 42; }")` is 42 and
  `eval("for (i in o) s += o[i]")` is the body's last value.

- **`for (k in o)` over an existing binding assigns it.** Only the declaration form
  was read, so the loop ran its body with `k` never set. A property deleted before
  it is reached is also no longer visited — the key list is snapshotted at entry.

- **`JSON.parse` follows the JSON grammar**, which is its own grammar and not a
  lenient subset of JavaScript. It used to accept whatever it was handed —
  `{a: 1}`, `[1,]`, `01`, `1.`, `+1`, `0x10`, `'x'`, a bare `tru`, a trailing `1 2`
  — and quietly produce a value, so more than half of `built-ins/JSON` was
  asserting a SyntaxError that never came. Every production reports now: member
  names must be strings, numbers follow the JSONNumber grammar exactly, strings
  reject a raw control character and any escape outside the eight the grammar
  names, whitespace is the four characters JSON allows and no more, and nothing
  but whitespace may follow the top-level value.

- **Negative zero survives `Math`.** `Math.abs(-0)` is `+0`; `Math.floor(-0)`,
  `Math.round(-0.5)` and `Math.ceil(x)` for `-1 < x < 0` are all `-0`. Every one of
  them went through `0 - x`, which yields `+0` for both signs. `Math.round` also
  stopped using `floor(x + 0.5)` blindly: that addition ROUNDS, so an x just under
  0.5 came back 1 instead of `+0` and a large negative integer walked one step
  toward zero.

- **A named function expression binds its own name inside its own body.**
  `var f = function fact(n) { return n * fact(n - 1); }` could not recurse — the
  name was never bound anywhere — while `fact` still stays invisible outside.

- **A constructor that returns a FUNCTION yields that function.** Only `valueType 5`
  counted as "returned an object", so a returned function, array, Map or Set was
  thrown away and the fresh instance returned instead.

- **Direct `eval` inherits the strictness of the code that called it**, so
  `"use strict"; eval("var arguments;")` is an early SyntaxError even though the
  eval'd text says nothing about strictness. Only the text's own directive was
  consulted, so every strict-mode early error reached through eval went unreported.

- **`F.prototype` is fully formed when it is first read** — it carries
  `constructor` back to F (non-enumerable) and inherits from `Object.prototype`.
  Only `new F()` filled those in, so a program that merely looked at
  `F.prototype.constructor` saw undefined.

- **An invalid RegExp pattern is a `SyntaxError`.** The compiler accepted every
  pattern it was given: `a**`, `*a`, `0{2,1}`, `x{1,2}{1}`, `[b-a]`, `[a-dc-b]` and a
  trailing backslash all built a working RegExp that simply never matched. A
  quantifier now needs an atom in front of it and cannot quantify another
  quantifier, `{n,m}` bounds must be in order, and a class range must not run
  backwards — while `[\d-G]` stays legal, because a `-` beside a class escape is a
  literal. Flags are validated too: exactly `g`, `i`, `m`, each at most once.

- **A pending exception is never replaced by a later one.** Three paths built their
  result and carried on while a throw was already in flight, and the exception they
  then raised took its place: an error constructor's argument
  (`throw new Error("x" + (new RegExp("a**")))` reported an Error), a throw
  statement's own operand, and a method call's receiver
  (`new RegExp("[b-a]").exec("a")` reported a TypeError). That masking is what kept
  ~90 pattern-validation tests failing after the validation itself was correct.

- **`RegExp(re)` called as a function is `re` itself**, while `new RegExp(re)`
  copies; `exec` and `test` require a real RegExp receiver; a RegExp is neither
  callable nor constructible; and `RegExp.prototype.constructor` used as a
  constructor builds a RegExp.

- **A generic `Array.prototype` method asks the object, not a snapshot.**
  `length` is read with a full `[[Get]]` so an accessor runs (and a throwing one is
  the answer, ahead of the callback-callable check, as the spec orders it); each
  index is re-checked for presence and re-read at the step that needs it, so a
  callback that shortens the array or deletes an element is observed. An index the
  object does not have — anywhere up its prototype chain — is *absent*, not
  undefined, so the iteration methods skip it exactly as they skip an array hole,
  and an index inherited from `Object.prototype` is visited.

- **An array hole is only absent on the array itself.** An array carries no
  prototype link of its own, so the value layer's chain walk stopped there and
  `Array.prototype[1] = 7; [0,,][1]` read undefined. `concat` copies such an
  inherited index too, and no longer spreads a receiver that is not an array —
  `Object.prototype.concat = Array.prototype.concat; ({0: 0}).concat()` is one
  element, whatever `length` it happens to inherit.

- **`Array.prototype.toString` IS `join(",")`.** A separate renderer disagreed with
  join about an object element (which must run its own `toString`) and about a hole
  the prototype supplies a value for. An absent, null or undefined element
  contributes the empty string to both.

- **`Array.prototype` is itself an array**, so `Array.isArray(Array.prototype)` is
  true and its `length` is 0 — just as `Function.prototype` is itself callable.

- **A length past what the dense store can hold is DECLARED, not materialised.**
  `new Array(4294967295)` is legal and has no elements at all; it used to be a
  RangeError, which confused "too big to allocate" with "not a length". Shrinking
  `length` now also deletes the FAR index properties kept in the property map, and
  `delete arr[i]` clears an accessor defined on that index rather than only
  blanking the dense slot.

- **`Array.prototype.toLocaleString` exists.** It called nothing and answered
  undefined; it now calls each element's own `toLocaleString` and joins with a
  comma, with a null or undefined element contributing the empty string.

- **A built-in prototype stringifies like the value it stands for.**
  `String(Error.prototype)` is `"Error"` and `String(RegExp.prototype)` is `"/(?:)/"`,
  where the fall-through used to hand back the engine's own debug rendering of the
  property map — guest-visible text that no JavaScript engine produces. An object that
  matches no kind now brands; a primitive receiver still renders itself.

- **Indirect `eval` is callable.** `var e = eval; e(src)`, `(0, eval)(src)` and
  `eval.call(null, src)` all run now, in the GLOBAL scope rather than the caller's —
  which is the whole difference from the direct form. The value had no function node,
  so every call path skipped it and reported "not a function".

- **A built-in static no longer coerces its first argument.** `invokeBuiltinStatic`
  computed `ToNumber(args[0])` for every static before dispatching, so
  `Object.isExtensible(Date.prototype)` ran a `ToPrimitive` nobody asked for — and once
  that conversion could throw, the throw became the answer.

- **A function's source text is real, and a `Function()`-built one is its assembled
  source.** `Function.prototype.toString` returns the slice the function's node spans
  in the source it was parsed from — the parser records `end` on function nodes, and
  the value carries the whole source string so a nested function's absolute offsets
  still index into it. A built-in has no source and keeps the `[native code]` form the
  spec allows.

### 2.4 Known-wrong, pinned rather than hidden

- **A top-level `var`'s INITIALISER runs ahead of the script's other statements**
  rather than in source order, so a read before the declaration sees the initialised
  value where the spec says `undefined`. The binding hoists correctly; it is only the
  order the initialiser runs in that is wrong. Pinned in the script-level probe block
  as `script-hoisted-var-is-undefined-property`, asserted in both directions.

- **A map key literally named `__proto__` cannot be stored.** The es6 target
  compiles a Ranger string map to a plain JavaScript object, and assigning that
  name sets the object's prototype instead of creating a property — so
  `JSON.parse('{"__proto__": []}')` loses the member. Fixing it means changing how
  EVERY map write is emitted: either `Object.defineProperty` on a hot path, or a
  template that evaluates its key and value twice. That costs more than the one
  behaviour it buys, so it is pinned rather than paid for. Asserted in both
  directions as `json-proto-is-ordinary-key`.

- **`export` is not a visibility gate.** Every top-level binding in a virtual module
  is reachable through the namespace, exported or not. The cross-module block in the
  runtime suite asserts the positive path passes *and* that this negative case still
  fails, so it is measured rather than forgotten.

- **A RegExp instance owns `source`/`global`/`ignoreCase`/`multiline` AND inherits
  them as accessors.** ES5 put them on the instance as non-writable, non-enumerable,
  non-configurable data properties; ES2015 moved them to `RegExp.prototype` as
  getters. Both shapes are present: the instance's own data property answers an
  ordinary read, and the prototype's accessor is what `getOwnPropertyDescriptor` and a
  borrowed `d.get.call(re)` see. A test that asserts the instance does NOT own them
  would fail — the mixed shape is a decision to keep the ES5 reads working while the
  descriptor tests get the modern answer, not an oversight.

- **A method deleted from `Object.prototype` is only hidden from kinds that do not
  publish their own copy of the name.** The deletion record lives on the prototype
  object and is consulted for the receiver's own kind; the registry has no chain to
  walk, so `delete Object.prototype.hasOwnProperty` does not reach an array receiver.

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
that produced it and the next count is tried. Inside a group the remainder is not
lexically at hand, so it is carried as a `RegexCont` chain and the group's body
backtracks against everything that follows the group.

| Supported | Absent |
|---|---|
| classes with ranges, negation, `\d \w \s` | `u` and `y` flags |
| `* + ? {n,m}` and their lazy forms | named groups |
| groups, non-capturing groups, alternation | lookbehind |
| `^ $ \b \B`, backreferences, lookahead | Unicode property escapes |
| `i`, `g`, `m` | |
| backtracking into a quantified group's body | |
| capture reset per repetition | |
| rejecting a malformed pattern at construction | |

The whole directory passes now, which it did not when this section was written: the
gap that remained after the matcher was correct was that the compiler *accepted
everything*, so a malformed pattern built a RegExp that simply never matched.

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
| `D-REGEX` | The pattern grammar as a node tree, matched by backtracking. See §2.5. |
| `D-ARGUMENTS` | `arguments` as an array-like OBJECT — brands as `[object Arguments]`, and `Array.isArray` says false. |
| `D-FNSRC` | A function value carries the WHOLE source string it was parsed from, not a pre-cut slice, and `Function.prototype.toString` cuts `[node.start, node.end)` out of it. The whole string, because a nested function's offsets are absolute in the same one; a call swaps the source in effect so a closure returned by an eval'd factory records its own. |
| `D-HOLES` | An absent array element is one shared sentinel whose `valueType` is 8, so a value-consuming path sees `undefined` without knowing about holes; only presence questions (`in`, `hasOwnProperty`, the iteration methods, key enumeration) inspect the slot. |
| `D-ARRAYSPARSE` | Which key names an ELEMENT is decided by the key TEXT — only `ToString(ToUint32(k)) === k` — not by whether the operand was a number. An index too far past the end for the dense store is kept as an ordinary property, which cannot move `length` but also cannot crash the host. |
| `D-GLOBALTHIS` | A script's `var` and function names are properties of the global object as well as bindings, kept in step on write; `globalThis` resolves to that same object. `let`/`const` are not properties — the declarative environment is separate. |
| `D-VALUEOF` | Every prototype's `valueOf` begins with `ToObject(this)`, so a null/undefined receiver throws before anything else — and a BUILT-IN never receives the sloppy-mode global-`this` substitution an ordinary function does, which is why the unbound `Object.prototype.valueOf()` throws. `Object.prototype`'s own `valueOf` boxes; the wrapper prototypes' unwrap. |
| `D-NEWCALLEE` | `new <expression>` where the expression is a CALL constructs through the value the call returns. There is no name to look up, so the name-keyed constructor path cannot see it. |
| `D-REGEXACCESSOR` | `source`/`global`/`ignoreCase`/`multiline` are accessors on `RegExp.prototype`, registered under a kind of their own (`regexpget`) so they are dispatchable values without becoming methods anyone can call as `re.source()`. The instance keeps its ES5 own data properties as well, so the two shapes coexist — see §2.4. |
| `D-FINALLY` | A pending abrupt completion is set aside while the finally block runs and restored after, unless the finally produced one of its own — which replaces it. |
| `D-LABELS` | A labelled break/continue carries the NAME alongside the flag. A loop takes the labels attached to it on entry; an abrupt completion whose label is not one of them stops the loop and stays set for the statement that owns it. |
| `D-COMPLETION` | The completion value lives on the statement runner, not at the top level, so a value produced inside a loop or an `if` reaches `eval`. Only an ExpressionStatement produces one; every other kind completes empty and leaves the previous value standing. |
| `D-ARRAYLIKE` | Array.prototype methods are generic over their receiver — the mutating ones still require a real array, since they write back into it — and read it LIVE: `length` once at the start through a full `[[Get]]`, then presence and value per index at the step that needs them. An absent index answers the same hole sentinel a real array's hole does, so every skip site already handles it. |
| `D-JSON` | JSON.parse is a validating recursive descent over the JSON grammar, with a failure flag rather than a guess. The grammar is deliberately NOT the language's: its whitespace set, number syntax and string escapes are all narrower. |
| `D-FNEXPRNAME` | A named function expression's own name is bound in a scope interposed between its closure and its body, so the name is reachable from inside and nowhere else. |
| `D-DELETE` | Names created by assignment to an undeclared identifier are tracked, because that is the only thing separating a configurable implicit global from a non-configurable declared binding — and `delete` answers differently for the two. |
| `D-DATE` | A Date is arithmetic on one time value (`DateTime.rgr`, ECMA-262 §15.9.1). Local time is UTC and the clock is `hostNowMs`, so every result is reproducible. The default ToPrimitive hint behaves as STRING for a Date and as NUMBER for everything else, which is what makes `date + ''` the date's text while `+date` is its time. |

### Framework surface is deliberately outside the registry

The native bridge, `registerGlobal` host injections, EVG/JSX helpers and
AssemblyScript sized casts are the **embedding**, not ECMAScript. They are routed
*ahead* of the registry so they keep priority. That ordering is explicit rather than
emergent from where a branch happened to sit in a chain.

---

## 4. Where the score stands

Sampled over the ES5-tagged corpus (6839 files), excluding Temporal and intl402.
`built-ins/RegExp` used to be excluded from the sample as well, back when there was
no RegExp at all; now that it is at 100% of its own directory the exclusion is gone
and the corpus is 490 files larger, so the percentage below is measured against
more, not less.

| Area | Result |
|---|---|
| `language/expressions` | **100%** (1318/1318, whole directory) |
| `built-ins/Number` | **100%** (146/146, whole directory) |
| `built-ins/Date` | **100%** (4/4, whole directory) |
| `built-ins/String` | **100%** (709/709, whole directory) |
| `built-ins/Boolean` | **100%** (7/7, whole directory) |
| `built-ins/Object` | **100%** (2080/2080, whole directory) |
| `built-ins/Function` | **100%** (361/361, whole directory) |
| `built-ins/RegExp` | **100%** (490/490, whole directory) |
| `built-ins/Array` | **100%** (212/212, whole directory) |
| `built-ins/Math` | **100%** (81/81, whole directory) |
| `built-ins/JSON` | 98% (46/47) |
| `language/statements` | 96% (540/562) |
| ES5 overall | **98.6%** (887/900 sampled) |

`built-ins/Number`, `built-ins/String`, `built-ins/Object`, `built-ins/Function`,
`built-ins/RegExp`, `built-ins/Array`, `built-ins/Math`, `built-ins/Date`,
`built-ins/Boolean` and `language/expressions` are each at 100% of their whole
directory — no sampling, no
exclusions beyond the era filter.

The runtime-conformance suite is at 1168 checks, every one of them derived from Node —
1156 expression probes plus 12 script-level probes run through Node's `vm` so the
script global is real.
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
