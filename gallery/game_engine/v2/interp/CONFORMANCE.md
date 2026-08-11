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

- **`o.p++` is `ToNumber(o.p) + 1`, never a compound `+=`.** The compound form
  concatenated for a string property, so `({foo: "bar"}).foo++` produced `"bar1"`
  where the spec says `NaN`.

- **A bound function's POISONING is not its strictness.** `bind` stamped
  `strictFn` on the copy to get `caller`/`arguments` poisoned, which also made the
  target look strict — so `f.bind()()` kept an undefined `this` for a sloppy `f`.
  The two questions are separate now: `boundExplicit` answers the first, and the
  target's own strictness still answers the second.

- **A `var` with no initialiser does not overwrite an existing binding**, which is
  what lets a hoisted function declaration survive `var x;` of the same name.

- **A name created as a PROPERTY of the global object is a binding for `++` too.**
  `this.count = 0; count++` was a ReferenceError: the update path read the scope
  directly rather than through the resolver every other read uses.

- **A top-level `var`'s initialiser runs in SOURCE ORDER.** It used to run in a
  pass of its own before the program started, so a read before the declaration saw
  the finished value — `__f(); var __f = function () {};` succeeded where the spec
  says "undefined is not a function". Only the binding is hoisted now. *This was
  pinned as `script-hoisted-var-is-undefined-property`; the assertion is what said
  it had closed.* A `var` in a `for` head hoists too, which the name collector was
  not walking into.

- **An `if` completes with `UpdateEmpty(branch, undefined)`.** When the branch it
  took produced no value of its own — a `break`, a declaration, a missing `else` —
  the `if` answers undefined rather than letting the previous statement's value
  stand. That single rule is what makes
  `eval("for (var i = 0;;) { if (i === 5) break; else i++; }")` undefined while
  `eval("for (var i = 0; i < 3; i++) { 1; break; }")` is 1 — a distinction that
  looks like "break resets the value" until you see the two side by side.

- **A keyword's TEXT inside a string literal is not the keyword.** `await`,
  `delete`, `typeof`, `void` and `yield` were matched on the token's *value* with
  no check of its *type*, so the string literals `'await'` and `'delete'` were
  consumed as operators — `var x = 'delete';` did not parse. The `<` guard beside
  them had documented exactly this trap for type assertions; the keyword operators
  had never been given it.

- **`typeof NaN` is `"number"`.** A value property of the global object was
  resolved by asking for a *namespace* of that name, which minted an empty object
  — so `NaN` and `Infinity` both reported `"object"`. The global object holds the
  real value, and that is what `typeof` reads now.

- **A non-configurable property cannot be deleted.** `delete` removed whatever it
  was pointed at, attributes and all: `delete Number.NaN` answered true and the
  property went. It is false now, and a TypeError in strict mode. The same rule
  reaches the value globals — `delete NaN` is false — which are not scope bindings
  and so were invisible to the name-delete path.

- **A strict-only reserved word is an ordinary identifier in sloppy code.**
  `var public = 1` is legal JavaScript outside strict mode; the parser refused it
  everywhere, because a `TSKeyword` token produced no identifier node at all. That
  is what made the directive-prologue tests fail — the ones that check a
  *misspelled* `"use  strict"` leaves the function sloppy.

- **Whose strictness decides `this` is the CALLEE's.** It is stamped on the
  function value when the function is created; asking the body again at call time
  folds in the ambient flag — the *caller's* — so a sloppy function called from
  strict code kept an undefined `this`, and a strict function nested in a sloppy
  one saw the sloppy one's global object. A bare `f()` supplies no receiver at
  all, which is the undefined case: a sloppy callee gets the global object and a
  strict one gets undefined, rather than the name resolving up the scope chain to
  whatever the defining scope had. Arrows are excluded — they genuinely have no
  `this` of their own.

- **A function built by the `Function` constructor never inherits the caller's
  strictness.** It is strict only if its own body says so, which is why
  `"use strict"; Function("return typeof this")()` is `"object"`.

- **Indirect `eval` binds `this` to the global object**, whatever the caller's
  `this` was. Running it at module scope alone let the name resolve to the
  enclosing function's.

- **STRICT eval code gets its own variable environment.** A `var` or function
  declaration inside it no longer leaks into the caller — the scope is pushed
  before the declarations are hoisted, or they land outside it — while sloppy eval
  still shares the caller's, which is the whole difference between the two.

- **The sloppy `arguments` object is MAPPED onto the named parameters.**
  `function f(a) { a = 1; return arguments[0]; }` answers 1, and
  `arguments[0] = 9` is visible as `a` — they are one binding, not a snapshot
  taken before the body ran. Only a sloppy function maps, only the indices a
  parameter actually declares and an argument was actually passed for, and only
  plain named parameters. Redefining a mapped index as an accessor removes the
  mapping, deleting it removes the mapping, and defining it with a value writes
  the parameter too.

- **`arguments.callee` exists**, writable and configurable but not enumerable,
  and compares equal to the running function by identity. On a STRICT arguments
  object it is a poisoned accessor pair instead: reading or writing it is a
  TypeError, and the descriptor reports `get`/`set` rather than
  `value`/`writable`.

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

- **A catch clause scopes its parameter, and nothing else.** `var` is function-scoped,
  but the handler's scope was an ordinary child, so `try { … } catch (e) { var foo = 1 }`
  bound `foo` inside the clause and it vanished the moment the clause ended — a
  declaration that reads as function-level in every JS engine silently did nothing.
  The catch scope is now marked as a block scope: a `var` declared in it binds in the
  nearest enclosing non-block scope. The catch parameter still shadows a `var` of the
  same name for the *initialiser*, so `catch (e) { var e = 5 }` writes the parameter
  and leaves the function-scoped `e` undefined.

- **A label on a block belongs to the block.** The pending label was handed to whatever
  statement ran first inside it, so in `wo: { do { … break wo } while (true); … }` the
  do-while claimed `wo`, swallowed the break as its own, and carried on with the rest of
  the block. Entering a block now drops the pending labels; the break travels out to the
  labelled statement that actually owns the name.

- **A `var` buried in a `try`/`if`/loop is a script var.** Only the *directly* top-level
  declarations were hoisted into the script scope, so `try { __f() } catch (e) {}` before
  `var __f = function () {}` raised a ReferenceError where the spec says the name exists
  holding undefined and the call is a TypeError. The hoist now walks into every nested
  statement, stopping at function boundaries.

- **The binding and the global object property are one location, in both directions.**
  A write through the binding already updated the property; a write through `this.x` did
  not update the binding, so `this['v'] = 1; v` still read the old value. Deleting is
  symmetric: a declared `var` is `{ DontDelete }` and `delete this['v']` answers false,
  while a name an assignment created is configurable and deleting the property removes
  the binding with it. A `var` lifted out of a `with` body is published the same way.

- **A LineTerminator after `return` inserts a semicolon.** §7.9.1 — the argument was
  parsed across the newline, so `return\n1;` returned 1 where every engine returns
  undefined and treats `1;` as a statement of its own.

- **Deleting a mapped `arguments` index unlinks it for good.** The mapping was inferred
  from the index being present on the object, so `delete arguments[0]` followed by
  `arguments[0] = 'A'` revived it: the write went to the parameter and the read came back
  with the parameter's value. The delete now clears the mapped parameter NAME, which is
  what makes the link one-way permanent.

- **Indirect eval declares into the GLOBAL variable environment.** The scope it ran
  in existed only to carry `this`, so a `var` or function declaration in the eval'd
  text died with the call — `(0,eval)("function fun(){}")` left nothing behind.

- **A directive is matched against the raw text.** §14.1: `'use\u0020strict'` and a
  literal broken by a line continuation both *evaluate* to `use strict` but neither is
  a directive. The engine compared the cooked value, so both turned strict mode on.
  The lexer already tracked whether a string literal contained an escape; that flag now
  reaches the AST.

- **A function built by the Function constructor is sloppy in a strict caller.** The
  capture already set the ambient flag aside, but the CALL folded it back in, so
  `"use strict"; Function("eval('public = 1')")()` reported a SyntaxError for a
  strict-only reserved word in code that is not strict. The lexical strictness stamped
  on the function value is now the whole answer.

- **Every LineTerminator ends a single-line comment.** Only LF and CRLF did, so a lone
  CR, U+2028 or U+2029 was swallowed along with the rest of the line — `//x\u2028y = 1`
  never ran the assignment.

- **A function object obeys its property attributes.** `setMember` skipped the
  writability check entirely for a value of function type, so `Number.NaN = 1` took.
  Most of the sibling constants survived only because a structural read path answered
  ahead of the stored property.

- **`NaN`, `Infinity` and `undefined` refuse assignment.** They are non-writable
  properties of the global object; assigning to the bare name created an ordinary
  binding that shadowed the constant. It is now ignored in sloppy mode and a TypeError
  in strict.

- **A bare `var x;` in sloppy eval creates a LOCAL binding.** The "do not clobber an
  existing binding" rule consulted the whole scope chain, so eval'd code whose caller
  could already see an outer `x` bound nothing at all. It now consults the own binding
  of the scope the `var` belongs to, which is the only thing the rule was ever about.

### 2.4 Known-wrong, pinned rather than hidden

- **A loop exits after 100000 iterations, silently.** Every loop runner carries a
  `maxIterations` guard against a runaway program hanging the host, and reaching it
  ends the loop as if the condition had gone false — no error, no diagnostic. A
  program that legitimately iterates more than that gets a wrong answer with nothing
  to say so, which is the worst shape a limit can have. Nothing in the ES5 corpus
  reaches it, so the conformance score does not see it; `bench/bench.cjs` does, and
  its same-answer check is what surfaced it. Recorded here because the fix is a
  decision — raise the ceiling, or make hitting it throw — not an oversight.


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
| `D-STRICT` | Strict mode. `writeRefusalError` mirrors `setMember`'s silent-refusal conditions so the two cannot disagree. A function's own strictness is stamped on the value at creation, because poisoning `caller`/`arguments` turns on the ACCESSED function's strictness, not the accessing code's — and because that stamp is complete, the CALL must not fold the ambient flag back in, which is what keeps a `Function`-built body sloppy inside a strict caller. A directive is recognised by its RAW text: a literal carrying an escape or a line continuation is an ordinary expression statement. |
| `D-STRNUM` | ToNumber on a string follows the StringNumericLiteral grammar rather than the host parser, which is lenient (`"12x"` → 12) and knows nothing of `0x`/`0b`/`0o`. |
| `D-REGEX` | The pattern grammar as a node tree, matched by backtracking. See §2.5. |
| `D-ARGUMENTS` | `arguments` as an array-like OBJECT — brands as `[object Arguments]`, and `Array.isArray` says false. |
| `D-FNSRC` | A function value carries the WHOLE source string it was parsed from, not a pre-cut slice, and `Function.prototype.toString` cuts `[node.start, node.end)` out of it. The whole string, because a nested function's offsets are absolute in the same one; a call swaps the source in effect so a closure returned by an eval'd factory records its own. |
| `D-HOLES` | An absent array element is one shared sentinel whose `valueType` is 8, so a value-consuming path sees `undefined` without knowing about holes; only presence questions (`in`, `hasOwnProperty`, the iteration methods, key enumeration) inspect the slot. |
| `D-ARRAYSPARSE` | Which key names an ELEMENT is decided by the key TEXT — only `ToString(ToUint32(k)) === k` — not by whether the operand was a number. An index too far past the end for the dense store is kept as an ordinary property, which cannot move `length` but also cannot crash the host. |
| `D-GLOBALTHIS` | A script's `var` and function names are properties of the global object as well as bindings, kept in step in BOTH directions: a write through the binding updates the property, a write through `this.x` updates the binding, and deleting a configurable one removes both. A declared `var` is `{ DontDelete }`, so `delete this.x` answers false for it and true for a name an assignment created. `globalThis` resolves to that same object. `let`/`const` are not properties — the declarative environment is separate. |
| `D-VALUEOF` | Every prototype's `valueOf` begins with `ToObject(this)`, so a null/undefined receiver throws before anything else — and a BUILT-IN never receives the sloppy-mode global-`this` substitution an ordinary function does, which is why the unbound `Object.prototype.valueOf()` throws. `Object.prototype`'s own `valueOf` boxes; the wrapper prototypes' unwrap. |
| `D-NEWCALLEE` | `new <expression>` where the expression is a CALL constructs through the value the call returns. There is no name to look up, so the name-keyed constructor path cannot see it. |
| `D-REGEXACCESSOR` | `source`/`global`/`ignoreCase`/`multiline` are accessors on `RegExp.prototype`, registered under a kind of their own (`regexpget`) so they are dispatchable values without becoming methods anyone can call as `re.source()`. The instance keeps its ES5 own data properties as well, so the two shapes coexist — see §2.4. |
| `D-FINALLY` | A pending abrupt completion is set aside while the finally block runs and restored after, unless the finally produced one of its own — which replaces it. |
| `D-LABELS` | A labelled break/continue carries the NAME alongside the flag. A loop takes the labels attached to it on entry; an abrupt completion whose label is not one of them stops the loop and stays set for the statement that owns it. A label on a BLOCK is the block's own — the pending labels are dropped on entry so the first statement inside cannot claim them. |
| `D-COMPLETION` | The completion value lives on the statement runner, not at the top level, so a value produced inside a loop or an `if` reaches `eval`. Only an ExpressionStatement produces one; every other kind completes empty and leaves the previous value standing. |
| `D-ARRAYLIKE` | Array.prototype methods are generic over their receiver — the mutating ones still require a real array, since they write back into it — and read it LIVE: `length` once at the start through a full `[[Get]]`, then presence and value per index at the step that needs them. An absent index answers the same hole sentinel a real array's hole does, so every skip site already handles it. |
| `D-ARGMAP` | A sloppy `arguments` object carries an index into the engine's list of call scopes plus the parameter names it maps, because there is nowhere on an EvalValue to put a scope. Reads and writes of a mapped index route to the binding; an accessor define or strict mode removes the mapping, and a `delete` clears the mapped NAME so re-creating the key cannot revive it. |
| `D-JSON` | JSON.parse is a validating recursive descent over the JSON grammar, with a failure flag rather than a guess. The grammar is deliberately NOT the language's: its whitespace set, number syntax and string escapes are all narrower. |
| `D-FNEXPRNAME` | A named function expression's own name is bound in a scope interposed between its closure and its body, so the name is reachable from inside and nowhere else. |
| `D-EVAL` | DIRECT eval shares the caller's scope and strictness; INDIRECT eval runs in a scope of its own that exists only to carry the global `this`, and is marked as a block scope so a `var` or function it declares lands in the GLOBAL variable environment and survives the call. Strict eval gets a real scope of its own, which is what keeps its declarations from leaking. |
| `D-DELETE` | Names created by assignment to an undeclared identifier are tracked, because that is the only thing separating a configurable implicit global from a non-configurable declared binding — and `delete` answers differently for the two. |
| `D-CATCHVAR` | A catch clause gets a scope of its own, but it is marked as a BLOCK scope: it holds the parameter and nothing else. A `var` declared inside it binds in the nearest non-block scope, so it outlives the clause — and if the catch parameter shares the name, the initialiser writes the parameter while the function-scoped binding the hoist created stays undefined. |
| `D-DATE` | A Date is arithmetic on one time value (`DateTime.rgr`, ECMA-262 §15.9.1). Local time is UTC and the clock is `hostNowMs`, so every result is reproducible. The default ToPrimitive hint behaves as STRING for a Date and as NUMBER for everything else, which is what makes `date + ''` the date's text while `+date` is its time. |

### Framework surface is deliberately outside the registry

The native bridge, `registerGlobal` host injections, EVG/JSX helpers and
AssemblyScript sized casts are the **embedding**, not ECMAScript. They are routed
*ahead* of the registry so they keep priority. That ordering is explicit rather than
emergent from where a branch happened to sit in a chain.

---

## 4. Where the score stands

Measured over the WHOLE ES5-tagged corpus (6839 files), excluding Temporal and
intl402. `built-ins/RegExp` used to be excluded as well, back when there was no
RegExp at all; now that it is at 100% of its own directory the exclusion is gone
and the corpus is 490 files larger, so the figure below is measured against more,
not less. There is no sampling step any more: the numbers are file counts.

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
| `language/arguments-object` | **100%** (38/38, whole directory) |
| `language/reserved-words` | **100%** (13/13, whole directory) |
| `language/function-code` | **100%** (212/212, whole directory) |
| `language/statements` | **100%** (562/562, whole directory) |
| `language/types` | **100%** (94/94, whole directory) |
| `language/eval-code` | **100%** (57/57, whole directory) |
| `language/directive-prologue` | **100%** (51/51, whole directory) |
| `built-ins/global` | **100%** (27/27, whole directory) |
| `language` (whole tree) | **100%** (2649/2649) |
| `built-ins` (whole tree) | **100%** (4189/4190) |
| ES5 overall | **99.99%** (6838/6839, the WHOLE ES5 corpus) |

The score is no longer a sample: every ES5-era test in the corpus runs, and one
file fails — `built-ins/JSON/parse/S15.12.2_A1.js`, the `__proto__` map-key gap
pinned in §2.4. Everything else in `language/` and `built-ins/` passes.

One place the engine follows the SPEC where V8 does not:
`language/expressions/assignment/S11.13.1_A6_T1.js` checks that `x = (eval("var
x;"), 1)` writes through the reference resolved BEFORE the right-hand side ran.
Node 22 writes to the binding the eval just created; this engine writes to the
outer one, which is what §11.13.1 says. It is the one probe that could not be
derived from Node, so it lives in the test262 measurement rather than in the
runtime-conformance suite.

### ES2015 (test262 `es6id` corpus)

Measured with `T262_ERA=es6` over the whole `es6id`-tagged corpus, 2863 files
after excluding intl402, Temporal, module and async flags:

| | |
|---|---|
| **ES2015 overall** | **84.32% (2414/2863)** |
| pass | 2414 |
| fail (ran, wrong answer) | 433 |
| crash (did not run to completion) | 16 |

The fail/crash split changed meaning partway through this work. An
uncaught exception used to be swallowed in silence, so a fixture that ran
and asserted was indistinguishable from one that died on line 1 -- almost
everything counted as a crash. Uncaught exceptions now print, so a failed
assertion is reported as a failure. The pass count is unaffected either
way; only the two failure buckets moved.

**Six wrong answers, and that number has not moved.** It is the useful part of
the ratio: what stands between this engine and ES2015 is missing surface, not
semantics it gets subtly wrong. Every gain below is a non-starter that started.

How it got here, each row a measured run of the same corpus against the C++
`octane_runner`:

| step | pass | score |
|---|---:|---:|
| start of the ES2015 work | 883 | 30.84% |
| the ES2015 `Math` additions, `String.fromCodePoint`, the annexB HTML wrappers | 930 | 32.48% |
| `Object.getOwnPropertyNames` / `getOwnPropertyDescriptor` callable from a value | 1187 | 41.46% |
| `Reflect` | 1278 | 44.64% |
| a class is one value, with a real prototype | 1317 | 46.00% |
| class expressions parse; anonymous functions take their name | 1329 | 46.42% |
| the String search trio takes a position; symbols are real property keys | 1372 | 47.92% |
| the iterator protocol, and computed class members | 1393 | 48.66% |
| RegExp's four well-known-symbol methods | 1452 | 50.72% |
| object-literal names and `__proto__`, `const`, defaulted-parameter arity | 1455 | 50.82% |
| annexB `escape`/`unescape`, and `typeof` for the global function properties | 1471 | 51.38% |
| `Array.from` over an iterable, an array-like, and a map function | 1474 | 51.48% |
| tagged templates carry cooked and raw parts; `Promise` and its job queue | 1604 | 56.02% |
| a block is a scope, and `for (let i…)` binds per iteration | 1637 | 57.18% |
| `Proxy` and its traps, wired into every property operation | 1744 | 60.92% |
| RegExp sticky flag, `RegExpExec` delegation, `@@replace`/`@@split` | 1802 | 62.94% |
| `Symbol.species`, `@@unscopables`, `@@isConcatSpreadable` | 1847 | 64.51% |
| a class's methods, accessors and statics land on a real prototype | 1876 | 65.53% |
| a string's own properties; `Reflect.set` honours its receiver | 1881 | 65.70% |
| `Math` special values, template ToString, function `name` inference | 1928 | 67.34% |
| `Reflect` receivers, `Object.setPrototypeOf` rules, `@@hasInstance` | 1943 | 67.87% |
| generators suspend and resume on an explicit frame stack | 1980 | 69.16% |
| a generator stays lazy on the consuming side; `%GeneratorPrototype%` | 2009 | 70.17% |
| `yield*` delegates through the iterator protocol | 2026 | 70.76% |
| `get`/`set`/`async` as identifiers; a derived ctor must call `super()` | 2073 | 72.41% |
| generator methods; loop completion values; `f.length` is not writable | 2139 | 74.71% |
| typed arrays; live array iteration; proxy trap results | 2170 | 75.79% |
| `new.target`; `Object.create(Array.prototype)`; a trap's `this` | 2182 | 76.21% |
| class calls on the value path; `this` before `super()` | 2188 | 76.42% |
| the proxy `has` and `set` traps | 2202 | 76.91% |
| `yield` in an array literal; the generator function object | 2219 | 77.51% |
| for-of steps and closes a guest iterator | 2230 | 77.89% |
| template escapes; `Object.assign` boxes a primitive target | 2243 | 78.34% |
| class definition at the declaration; derived-constructor returns | 2256 | 78.80% |
| per-kind iterator prototypes; Map/Set answer iterators | 2268 | 79.22% |
| IteratorClose actually runs; for-of no longer compiles to a drain | 2272 | 79.36% |
| `class E extends Array` produces a real array | 2274 | 79.43% |
| live Map/Set iteration; iterator results read as properties | 2282 | 79.71% |
| for-in heads that are not plain names; `yield*` across a newline | 2289 | 79.95% |
| `Symbol.toStringTag` on the built-ins that brand with it | 2293 | 80.09% |
| the ES1-ES5 sweep below (JSON, bind, URI, parseInt, evaluation order) | 2295 | 80.16% |
| the ES5 attribute sweep below | 2296 | 80.20% |
| the ES5 long tail below | 2298 | 80.27% |
| Promise built through NewPromiseCapability | 2354 | 82.22% |
| ArrayBuffer, DataView and the %TypedArray% intrinsic | 2365 | 82.61% |
| Proxy trap invariants, and proxy reads in the compiled tier | 2382 | 83.20% |
| the temporal dead zone for let and const | 2390 | 83.48% |
| one string model -- code units -- on every target | 2395 | 83.65% |
| non-ASCII identifiers, on the byte-model targets | 2399 | 83.79% |
| compare, pad, case and the regex engine in code units | 2410 | 84.18% |
| normalize() and a real localeCompare | 2412 | 84.25% |
| toLocale casing, ToUint16, and 27 collation locales | 2414 | 84.32% |
| Intl.Collator, NumberFormat and DateTimeFormat | 2414 | 84.32% |

The single largest step is not an ES2015 feature at all. `propertyHelper.js` --
which 543 of these files include -- opens with
`var __getOwnPropertyNames = Object.getOwnPropertyNames;` and then calls it
detached. Statics that existed only on the AST call-site chain answered
undefined that way, so `verifyProperty` died on the first line and 543 files
failed for a reason unrelated to what they were testing.

Failures by family, at the end of the run above (570 files):

| family | files | why |
|---|---:|---|
| `built-ins/Promise` | 60 | NewPromiseCapability and the species lookups: `Promise.all` does not construct C or call each element's own `then` |
| `language/statements/class` | 60 | 30 of them subclass a BUILT-IN other than Array -- ArrayBuffer, DataView, Function, GeneratorFunction |
| `built-ins/RegExp` | 45 | unicode mode, `compile`, and decimal escapes the lexer refuses |
| `built-ins/Proxy` | 45 | the remaining trap invariants, and `with (proxy)` |
| `built-ins/String` | 34 | lone surrogates (12), `normalize` (3), coercion order |
| `annexB` | 26 | 20 of them `RegExp.prototype.compile` |
| `built-ins/Object` | 23 | 12 of them the descriptor shape of `Object.prototype.__proto__` |
| `language/global-code` | 19 | 11 need `$262.createRealm`, 7 need `$262.evalScript` |
| `language/expressions/super` | 13 | `super()` through a plain function base |
| `language/expressions/object` | 13 | super-property in an object method |
| `language/expressions/yield` | 12 | `yield` in a call argument or an object literal |
| `language/statements/for-of` | 8 | mapped `arguments`, TDZ in the loop head, astral string iteration |

Nineteen of the remaining files need `$262` -- the test262 host object.
Eleven of those want `createRealm`, a second global this engine has no way
to make; the other seven want `evalScript`. That is a harness capability
rather than an engine one, and nothing here provides it.

#### The four subsystems, done

The gaps this section used to name as structural have been closed.

**Promise** builds every result through NewPromiseCapability: `new
C(executor)`, capturing the resolve/reject pair the executor is handed. It
used to mint an intrinsic promise and settle it by hand, so a subclass was
never constructed and an overridden `then` or `resolve` never ran. On top
of it: `all`/`race` read `C.resolve` once and drive each element through it
and through the element's own `then`; `then` builds its result with
SpeciesConstructor; the minted functions are anonymous with the right
arity, which is what a guest `then` override asserts on before it does
anything else. 60 failures -> 4.

**ArrayBuffer, DataView and %TypedArray%** now exist. The bytes live in an
ordinary array of numbers: this realm has no linear memory to model. The
float accessors compute IEEE 754 by arithmetic, byte by byte, because a
float64 pattern is 64 bits and does not fit exactly in a double -- assembled
as one integer, a round-tripped 3.14159 came back as 3.1415900000001784.
13 "ArrayBuffer is not defined" failures -> 0.

**Proxy** checks its trap post-conditions: a trap may lie about what it did,
and the spec compares its answer against the target. None were checked, so
a handler could report a frozen property as holding a different value or
announce a prototype change that never happened. Separately, the compiled
tier had no proxy case in its field read at all, so a read inside a function
body answered the TARGET's property and the trap never ran. 45 -> 28.

**TDZ** for `let` and `const`: the binding is created uninitialised at the
top of its block, marked with a hole -- a value the guest can never produce
-- so the check costs one predicate on a value the reader already holds.
Class declarations are deliberately excluded: they are registered eagerly
and their declaration statement does not re-bind, so a hole there would
never be replaced. That is the one half of the class case still missing.

Subclassing a built-in works for Array (both halves: the instance IS an
array and the class's own methods stay reachable), for the Error
constructors and for Promise. The function constructors remain.

#### Unicode: one string model across three targets

A JS string is a sequence of UTF-16 CODE UNITS. Nothing in the host
languages agrees with that: C++ `std::string` is bytes, Rust `String`
iterates characters, and only JS itself speaks units. The engine used to
let whichever model the target happened to have leak into guest semantics,
which is not a rounding error -- it silently gave different answers for
ordinary non-ASCII text:

| on the C++ build | was | is |
|---|---:|---:|
| `"héllo".length` | 6 | 5 |
| `"héllo".indexOf("l")` | 3 | 2 |
| `"日本".length` | 6 | 2 |
| `[..."héllo"].join("")` | truncated | `"héllo"` |
| `var а = 1` (Cyrillic) | parse error | 1 |

The fix is a code-unit layer (`cuLen`, `cuUnitAt`, `cuSlice`, `cuIndexOfByte`
and friends) that every string builtin goes through. It is not a conversion
pass: the strings stay in their native representation and the layer
translates INDICES, so no allocation is added on any path. Which
translation applies is detected once, from the target itself
(`(strlen "é") > 1`), rather than compiled in -- the es6 build takes a
passthrough and pays nothing.

The per-string unit count is memoised on the handle, because `s.length` is
O(1) in every other engine and rescanning per read would make
`for (i = 0; i < s.length; i++)` quadratic. The memo is VALIDATED by byte
length rather than invalidated by hand: any mutation that changes the text
changes its byte count, so a stale entry corrects itself on the next read
instead of depending on every writer remembering to clear it. An all-ASCII
string -- nearly all of them -- settles in one model-independent scan and
never consults the model at all, which is why the benchmark geomean did not
move.

The lexer had the same defect one level down. `at source i` walks code
points on the byte-model target but hands back their UTF-8 BYTES, and the
identifier classifier read only the first of them: Cyrillic `а` was queried
against the ID tables as its lead byte 0xD0, so `var а = 1` was a parse
error on C++ and Rust while parsing fine on es6. Decoding that string
before the lookup fixes every category at once -- Cyrillic, accented Latin,
CJK, Greek, runic, and supplementary-plane letters like `𝒜`, in
identifiers, member names, object-literal keys and parameter names.

#### Five paths to the text, not one

Writing the seventy `unicode` probes down found that the index layer was only
one of FIVE ways the engine reached a character, and that the other four each
had the defect in its own form. Every row below was a case where the three
targets answered differently FROM EACH OTHER, which is the real hazard: not a
missing feature, but the same guest program meaning different things depending
on which build ran it.

| path | what it did | why |
|---|---|---|
| `<` and `sort()` | `'é' < 'z'` answered true | §7.2.13 compares code units; this read raw `charAt`, a SIGNED char on the byte target, so every non-ASCII byte compared as negative. `sort()` with no comparator is defined in terms of it, so every sorted index came out scrambled. `strCmp` was a second copy and only the other one had been fixed |
| `padStart`/`padEnd` | `'é'.padStart(4, '.')` gave two dots; `'日本'.padEnd(5)` gave none | measured in bytes, so the byte count had already passed the target width |
| `toUpperCase` | `'café'` → `'CAFÉ'` on es6 and Rust, `'CAFé'` on C++ | each build used its host language's case function, and the hosts disagree |
| the RegExp engine | `/\w+/` over `'naïve café'` → `['na', 'e ', 'afé']` | the matcher stepped the subject a byte at a time and `m.index` came back as a byte offset, so a character was split in half |
| `JSON.parse` | threw SyntaxError on anything the engine had itself stringified with a non-ASCII character in it | the scanner read `substring` (code points) and `charAt` (bytes) as one index, and a negative byte read as a control character |

Casing, normalization and collation are DATA, not rules, and the data lives in
four generated files -- `UnicodeCase.rgr`, `UnicodeNorm.rgr`,
`UnicodeCollate.rgr`, `UnicodeTailor.rgr` -- as ordinary Ranger array literals. They are committed
source: no target needs a generator in order to build. The generators sit beside
them in `migrate/tools/`, read the UCD files when pointed at them, and verify
their output against all 1.1M code points before they will write anything.

Two model bugs surfaced the same way. **Rust is a third string model**, not the
es6 one: `strlen` counts characters, so it is not a byte model, but a
supplementary character is one character where JS counts a surrogate PAIR, so
it is not the unit model either -- and its native string SEARCH answers in
bytes regardless. Taking it for es6 is what made `"日本".length` answer 1 there.
And the string ITERATOR ran the UTF-8 decoder unconditionally on all three
targets, so `[...'héllo']` came out as `h`, `"éll"`, `o` on es6 and Rust both.
That one had been there all along and was invisible until it was measured.

The `u` flag went from ignored to implemented on the way through, because the
old byte-stepping matcher had been passing its test262 fixtures by accident:
AdvanceStringIndex in the matcher and in `@@match`/`@@replace`/`@@split`, and
`.` and a character class consume a whole code point.

What this cost: 6% on the QuickJS-normalized benchmark, all of it the regex row,
and it is the price of correct positions -- the matcher reads its subject
through an index rather than straight off the string. An all-ASCII subject skips
the decode entirely, and hoisting the matcher out of the three scan loops paid
most of the rest back; built per iteration it re-decoded the whole subject every
time.

#### async / await

`async` and `await` parsed and were then IGNORED. An async function ran to
completion synchronously and returned its value RAW, so `f().then(...)` was
"then is not a function" and `await p` evaluated to null. Every library that
assumes an async function returns a thenable -- which is all of them -- was
broken against this engine.

An async body is a body that stops in the middle and starts again, which is the
problem generators already solve here, so it runs on the same explicit frame
stack with `await` as the suspension point instead of `yield`. What sits on top
is the driver: the call returns a promise immediately, and each time the body
suspends the driver subscribes to the awaited value through
`Promise.resolve().then()` and resumes the body when it settles. Going through
Promise.resolve rather than inspecting the value is what makes awaiting a
THENABLE work and what keeps awaiting a plain value one turn behind.

Working: async functions, expressions, arrows (both body forms), object and
class methods; await of values, promises, thenables and rejections; try /
catch / finally around await; await in loops, conditions, binary operands,
ternaries, array literals and call arguments; `for await`; interleaving of
several async bodies; and the ordering rule that the synchronous part of an
async body runs before the caller continues.

Four things this turned up that were not obvious:

- **Five doors, not four.** Patching the walker's call paths appeared to do
  nothing, because a body with no `await` in it compiles to bytecode and never
  reaches any of them. Generators were already excluded from that tier for the
  same reason; async had to be too.
- **An async call must ALWAYS answer a promise.** The first shape made that
  conditional on the frame machine accepting the body's spine, so whether
  `f()` was thenable depended on what the function happened to contain. A body
  the driver declines now runs on the walker with a blocking `await` and still
  settles a promise -- ordering differs there, values do not.
- **Thenable adoption was missing from Promise itself.** §25.4.1.3.2 adopts any
  object with a callable `then`, and only real promises were, so
  `Promise.resolve({then})` fulfilled with the OBJECT. Fixing it for `await`
  fixed it for everyone.
- **Three latent Rust double-borrows** in `Promise.all`, `Promise.race` and the
  generator frame stack, all in reuse branches that nothing had exercised
  before. One of them was the pre-existing `iter-generator` crash on that
  target, which is now gone: native conformance is 1467/1469 on BOTH targets
  with no crashes.

Not done: top-level await (a module feature, and the module story is separate),
and async generators produce values but are not themselves resumable -- `for
await (x of asyncGen())` works because the generator is collected eagerly, as
sync generators outside the driver are.

#### The ES2016-2024 library: arrays, promise combinators, Object statics, weak collections

None of the following existed, and every one of them is the kind of thing a
real program reaches for in its first hundred lines rather than an edge case:

- **Arrays.** `flatMap`, `findLast`, `findLastIndex`, and the four
  change-by-copy methods `toReversed` / `toSorted` / `toSpliced` / `with`.
  `includes` existed but compared with reference equality and discarded its
  `fromIndex`, so `[NaN].includes(NaN)` was false -- SameValueZero is the whole
  reason `includes` exists next to `indexOf` -- and `[1,2,3].includes(1, 1)`
  was true.
- **Promise combinators.** `allSettled`, `any` (with `AggregateError`),
  `withResolvers`, and `Promise.prototype.finally`. The three combinators
  differ only in what an element does with its answer, so they share
  `Promise.all`'s element function and select on a mode; `finally` is `then`
  with a pair of wrappers that RESTORE the settlement, which is what makes it
  transparent to both a value and a reason.
- **Object statics.** `fromEntries`, `hasOwn`, `getOwnPropertyDescriptors`,
  `groupBy`.
- **`String.prototype.matchAll`**, which is `match` with /g except that it
  keeps the captures and the index of each match.
- **Optional call `f?.()`.** The parser produced an `OptionalCallExpression`
  and the evaluator treated it as an ordinary call, so it reported "f is not a
  function" -- the one thing the syntax exists to avoid.
- **The weak collections.** `WeakMap` and `WeakSet` were missing entirely, and
  `WeakRef` and `FinalizationRegistry` with them.

Two things worth recording:

- **A weak collection with no collector is a legal weak collection.** Nothing
  in this realm is ever collected, so a `WeakMap` here is a `Map` that keeps
  its keys alive. The spec never REQUIRES collection, and a program cannot
  observe the difference except through memory. What it can observe -- the key
  must be an object, `get`/`has`/`delete` answer "not there" for a primitive
  rather than throwing, there is no iteration, and `deref` answers the target
  -- is implemented rather than approximated.
- **A bound `this` on a built-in is not a receiver.** `Promise.withResolvers()`
  returned the right three things and the promise never settled: reading
  `w.resolve` off the result object and calling it rebound the function's
  `this` to that object, so the capability settled the RESULT instead of the
  promise. Every function the promise machinery mints closes over its state
  through a bound `this`, and `shapeAnonFn` -- which already gave them their
  arity and empty name -- now marks that binding explicit so the method-call
  path leaves it alone. The same bug was latent in every `Promise.all` element
  function and every async step function; nothing had yet read one off an
  object and called it.

#### Intl

`Intl` did not exist, so `new Intl.NumberFormat('de').format(n)` was a
ReferenceError -- and `Number.prototype.toLocaleString` and the `Date`
toLocale family, which the spec defines IN TERMS of Intl, quietly answered the
non-locale forms. A German document got English dates and English thousands
separators with nothing to indicate it.

Carried now: `Intl.Collator`, `Intl.NumberFormat`, `Intl.DateTimeFormat`,
`Intl.getCanonicalLocales`, and the `toLocaleString` family delegating to them.
`Collator`'s `compare` and the formatters' `format` are bound accessors as the
spec requires -- `list.sort(collator.compare)` is how they are meant to be used,
and a shared unbound method loses its object and silently sorts in the root
order.

The CLDR data is in `LocaleData.rgr` (generated) for 39 locales. A tag outside
that set falls back to `en` AND SAYS SO through `resolvedOptions().locale`, so a
program can tell it did not get what it asked for.

What the data has to carry is the part worth recording, because almost none of
it is derivable from a rule, and every rule attempted here was wrong for some
locale:

| | |
|---|---|
| affixes | recorded whole, not assembled from a sign and a symbol: German puts a space before the percent sign, Dutch puts the minus after the currency symbol |
| currency spacing | two templates per locale, because CLDR only inserts a space where symbol and digits would run letter-into-digit -- Japanese writes `€1,234` and `US$ 1,234` from the same pattern |
| minimum grouping | Spanish and Italian do not group a four-digit number at all, so 9876.5 is `9876,5` |
| month and weekday names | taken from a formatted DATE, not standing alone: Finnish May is *toukokuu* alone and *toukokuuta* in a date, and Czech, Slovak, Polish and Russian inflect the same way |
| field widths | observed per field, not assumed: Polish pads the month but not the day |
| name vs number | flagged, not inferred from length -- Korean's long-date month is `5월`, two characters, exactly like a zero-padded number |
| year offset | Thai defaults to the Buddhist calendar, so 2021 prints as 2564 |
| the date-time joiner | carried as its own pattern: `, ` in English, a plain space in French, and derivable from neither half |

Verified by formatting ten numbers, two percent and currency styles and six date
and time styles in each of the 39 locales -- 273 lines -- and comparing every one
against the host. `formatToParts` and `format` disagree in the host itself about
the space before AM/PM, so the generator reassembles each pattern and checks it
against `format()`, which is what real code calls.

`formatToParts` came next, on both formatters, and `formatRange` /
`formatRangeToParts` with it. Both formatters produce PARTS and `format()` is
the parts joined, so the two cannot disagree -- a formatToParts that has drifted
from its own format() is the one bug that shape makes impossible.
`supportedLocalesOf` sits on each CONSTRUCTOR, which is where the spec puts it;
publishing it as an `Intl` static, as the first pass did, was inventing an API.

`Intl.PluralRules` and `Intl.ListFormat` followed. CLDR states plural rules as
expressions over the operands n, i, v, f and t -- "one" when i is 1 and v is 0,
"few" when i mod 10 is 2..4 and i mod 100 is not 12..14. Porting those would
mean writing a little rule language and an evaluator for it; what is carried
instead is the ANSWER, keyed on just enough of the operands to determine it. The
key being SUFFICIENT is checked rather than assumed, and the check earned its
keep twice: Italian's ordinal rules name 8, 11, 80 and 800 individually, which
collided 800 with 200 under the first key; and a sweep that stopped at 50000
never created the multiple-of-a-million keys the French "many" rule needs, nor
noticed they were missing.

Not implemented, and not pretended: `RelativeTimeFormat`, `Segmenter`,
`DisplayNames`, and any calendar other than Gregorian and the Thai year offset.
`DateTimeFormat` formats in UTC -- this realm has no time zone database.

What is still not done:

- **NFKC and NFKD.** The compatibility forms need a second and much larger
  mapping table, and they are lossy -- they fold ﬁ to fi and ² to 2. They
  answer the string unchanged rather than silently returning a canonical form,
  which would leave a program worse off than being told the form is missing.
- **Locale tailorings beyond the 27 carried.** `localeCompare` reads its
  `locales` argument and applies a tailoring for 27 of them, verified against
  CLDR: the Nordic alphabets, Czech and Slovak `ch`, the Hungarian digraphs,
  Polish, Turkish and Azerbaijani, Spanish `ñ`, the South Slavic `lj`/`nj`,
  Baltic, Romanian, Albanian, Vietnamese, Estonian and Icelandic. Nine more
  were checked and carry no table because their alphabet IS the root alphabet
  (de, fr, en, it, nl, pt, ca, eu, ga). A locale outside that set falls back to
  the root order, which is what it did for all of them before.
- **Supplementary characters through a Rust slice.** A cut that lands INSIDE a
  surrogate pair has no representation on that target -- its string type holds
  characters, and half a pair is not one. The half is dropped rather than faked.
  C++ and es6 are exact.

#### What resumable generators cost the rest of the engine

Nothing measurable. A generator body runs on an explicit frame stack rather
than the host stack, but only the SPINE of nodes leading down to a `yield`
becomes frames -- every subtree with no yield in it is handed to the ordinary
walker and evaluated in one shot (`genPushExpr`, `genRunBranch`). Non-generator
code never enters the driver at all.

Measured over three benchmark runs each, cpp geomean, on one machine:

| | run 1 | run 2 | run 3 | mean |
|---|---:|---:|---:|---:|
| before generators | 8.638 | 8.983 | 8.865 | 8.83 |
| after | 8.862 | 9.276 | 8.689 | 8.94 |

The 1.2% difference in means is inside the run-to-run spread of either set
(±3%); Node's own reading moved 3% across the same runs. Generator throughput
itself is in line with the engine's general speed rather than carrying a
penalty of its own: 200,000 lazy yields consumed through a `for-of` take 0.64s,
about 3.2µs per suspend/resume.

#### The ES5 layer, on the same corpus

The ES5 figures in §4 above are measured over a narrower selection (6839 files,
no annexB). Running the SAME command as the ES2015 measurement -- `T262_ERA=es5`
over the whole tree -- gives 8115 files, and it is the number to compare against
when asking whether ES2015 work cost anything:

| | pass | score |
|---|---:|---:|
| merge base (`9a13ee28`) | 7149 | 88.10% |
| after the ES2015 work | 7784 | 95.92% |
| after the ES1-ES5 sweep | 7814 | 96.29% |
| after the ES5 attribute sweep | 8037 | 99.04% |
| after the ES5 long tail | 8061 | 99.33% |
| after the Unicode string model | 8069 | 99.43% |
| after non-ASCII identifiers | 8071 | 99.46% |
| after the five text paths below | 8077 | 99.53% |
| after toLocale casing and ToUint16 | 8080 | 99.57% |

The ES2015 work did not cost ES5 anything; it gained 665 files, most of them
from the same detached-statics fix.

#### The ES1-ES5 sweep

A separate report listed 36 failures across an ES1/ES3/ES5 suite. Working
through it found these, each verified against node before and after:

| area | what was wrong |
|---|---|
| `JSON.stringify` | took a value and nothing else: no `space`, neither replacer form, no `toJSON`, and a cyclic object recursed until the host stack gave out |
| `JSON.parse` | accepted a reviver and ignored it |
| `JSON.*` | neither static existed on the value path, so `var f = JSON.stringify; f(o)` was undefined |
| `Function.prototype.bind` | binding an already-bound function REPLACED its `this` and partial arguments instead of wrapping them; and a second copy on the call-site chain set neither the bound flag nor the suppressed `prototype` |
| `propertyIsEnumerable` | called every synthesised key enumerable -- a function's `length`/`name`/`prototype`, an array's `length` |
| `Array#indexOf` / `#lastIndexOf` | read `fromIndex` and discarded it |
| `Array#sort` | took the PRESENCE of an argument for a comparator, so `sort(undefined)` left the array untouched; a non-callable one sorted rather than throwing |
| Array mutators | not generic: push/pop/shift/unshift/splice/reverse/sort/fill/copyWithin silently did nothing on an array-like |
| `encodeURI` and the other three | named as globals, implemented by none of them -- every call answered null |
| strict refused writes | a frozen or non-extensible ARRAY took element writes; a mutator moved a non-writable `length`; a write through a primitive receiver was silent |
| compound assignment | evaluated its right-hand side BEFORE reading the target, and re-evaluated a member target's base and index afterwards |
| `x ? (a = 1) : (b = 2)` | a parse error: the parser read the ternary's `:` as a TypeScript return-type annotation |
| `parseInt` / `parseFloat` | ToNumber in disguise -- radix ignored, no prefix or trailing-junk handling |
| `toFixed` / `toExponential` | `integerDigits` stripped at the dot before looking for an exponent; `toExponential()` with no argument used six digits instead of as many as the value needs |
| annexB octal | `010` read as decimal 10; `"\101"` kept as the three characters "101" |
| numeric object keys | `{1.0: v}` keyed under the source text rather than ToString of the value |

One defect surfaced on the way that belonged to none of them: a throw
inside a `console.log` argument printed a line assembled from the failed
evaluation before the exception surfaced.

#### The ES5 attribute sweep

A second report put two thirds of the remaining shared-corpus gap in one
subsystem: array and string `[[DefineOwnProperty]]` attribute rules. That
turned out to be right, and one defect accounted for most of it.

| area | what was wrong | files |
|---|---|---:|
| `delete a[0]` | succeeded however the element had been defined -- frozen array, sealed array, index made non-configurable. The element branch of the delete operator ran BEFORE the refusal check, and the check could not see an element anyway: it lives in the dense store, not in own data. The suite's own `isConfigurable` helper measures exactly this -- it deletes and asks whether the property is gone | 56 |
| non-ASCII whitespace | the lexer knew the code POINTS but read only the lead byte on the native targets, so NBSP, the Zs block, the BOM and LS/PS were not whitespace in source text; `trim` stripped what the host's trim strips, and trimStart/trimEnd stripped spaces only | 33 |
| generic descriptors | a descriptor mentioning neither value nor writable nor get nor set must change only the attributes; it fell through to the data branch and destroyed the accessor | |
| array `length` | reported `writable: true` whatever defineProperty had said, and a non-writable length did not refuse an assignment. The attribute was recorded correctly all along; nothing read it | 8 |
| SameValue | redefinition compared values with strict equality, so a frozen NaN refused a redefinition to NaN and a frozen -0 accepted one to +0 | 6 |
| evaluation order | `x() + y()` with both throwing reported "y": the right operand ran before scriptThrew was consulted, and a call's later argument displaced an earlier one's throw | 22 |
| poisoned `caller` | only `arguments` threw on a strict or bound function; `caller` was answered earlier on the member path, and the bytecode tier checked neither -- so the same expression threw at top level and read undefined inside a function | 9 |
| frozen array elements | freezing sets a flag rather than per-index attributes, so the descriptor read reported every element of a frozen array as writable and configurable | 4 |
| code-unit width | `charCodeAt` masked every read to the low byte, which is right for the native builds and wrong for es6; `String.fromCharCode` truncated above 255 | 5 |

#### The ES5 long tail

The tail named above, worked through:

| area | what was wrong |
|---|---|
| accessor indices | redefining an index that held an accessor back to a data property left the getter in place, so the getter still won the read; and clearing it dropped the recorded attributes, letting a non-enumerable element come back enumerable |
| `arguments` | making a mapped index non-writable did not break its mapping, so a later `arguments[0] = x` still wrote the parameter through it; the internal index-to-parameter map also leaked into `getOwnPropertyNames` |
| synthesised own names | `getOwnPropertyNames` walked stored keys only, so `length` on an array and a function's length/name/prototype were all missing -- on a function it answered nothing at all |
| `ToLength` | array-likes read `length` with ToUint32, so `length: -4294967294` wrapped to 2 and generic methods visited elements they must not see; `every`/`some` derived their bound from the materialised count, which a `length` of Infinity made 0 |
| short-circuit order | `x() \|\| y()` with both throwing reported "y": a throw makes the left answer undefined, which is both falsy and nullish, so all three operators fell through |
| `delete f.prototype` | answered true and the property survived -- the synthesised prototype is not own data, so the refusal could not see it |
| annexB Date | `toGMTString` was a second function rather than `toUTCString` itself; `setYear()` with no argument left the year unchanged instead of invalidating the date |
| inherited getters | a write through an inherited getter with no setter created a shadowing own property instead of being refused |
| non-extensible proto | `Object.preventExtensions(o).__proto__ = p` mutated the prototype |
| parser diagnostics | every token after the first error produced another message -- one bad `function a.b()` printed fifteen, quoting source that was never the problem |

Three of those were the same shape and worth naming as one: a rule the
walker applies and the bytecode tier does not, so an expression meant one
thing at top level and another inside a function body. `f.prototype` is
completed lazily on the walker's member path; `caller` and `arguments` are
poisoned there. The compiled `get_field` checked none of it and now
declines all three names.

What remains is genuinely long-tail: annexB RegExp escapes (7) and single
files spread across a dozen areas. The `String.fromCharCode` and
code-unit-width rows above, the six special-casing files, and the RegExp
fixtures that match a non-ASCII literal are all closed on every target --
see "Unicode: one string model" and "Five paths to the text" above.
Accessor properties
are also listed after data properties by `getOwnPropertyNames` rather than
in insertion order, because they live in a separate map; fixing that means
giving the property bag one order across both.

### ES2016 and later: not measured, and not measurable as an era

test262 tags ES5-era tests `es5id` and ES2015-era tests `es6id`. Everything from
ES2016 onward carries only the modern `esid` with no era marker -- 42,616 files
with no way to bucket them by edition. An ES2016+ column would have to be built
from FEATURE tags (`features: [optional-chaining]`, …), which is a different job.
No number is published here rather than a synthesised one.

### What the probe suite is not

`npm run jsengine:conformance` reports 1551/1553 on each native target. That is
the runtime-conformance corpus, whose expectations are derived by running the
same source through Node. It is a regression net, not test262, and the two
numbers must not be quoted side by side as if they measured the same thing.

The runtime-conformance suite is at 1586 checks, every one of them derived from
Node — 1556 expression probes plus 21 script-level probes run through Node's
`vm` so the script global is real, plus the module and gap assertions.
Date is additionally validated by 209 differential cases against Node covering the
component getters, the setter family, `Date.parse`, `Date.UTC` and both range extremes.
The 47 whole-program cases in `tests/async-conformance.test.ts` cover what a
returned value cannot show: what an async body, a promise combinator or
`finally` actually PRODUCES once the queue drains, compared against Node
running the same program.

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
