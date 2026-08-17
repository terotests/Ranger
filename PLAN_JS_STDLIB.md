# Portable JS API as a Ranger standard library — master plan

**Status:** proposal. Nothing here is implemented yet.
**Sub-plans:** [TEXT](PLAN_JS_STDLIB_TEXT.md) · [MATH](PLAN_JS_STDLIB_MATH.md) ·
[DATE + INTL](PLAN_JS_STDLIB_DATE_INTL.md) · [CRYPTO](PLAN_JS_STDLIB_CRYPTO.md)

---

## 1. What this is about

`gallery/game_engine/v2/interp/` contains a JavaScript engine written in Ranger.
To make that engine work, somebody had to implement — in portable Ranger — a
large amount of behaviour that has nothing to do with interpreting JavaScript:

| Behaviour | Where it lives today | Size |
| --- | --- | --- |
| ES5 time-value algebra, `Date.parse`, ISO/UTC string forms | `interp/migrate/src/DateTime.rgr` | 604 lines |
| ECMAScript regular expressions (compile + backtracking match) | `interp/migrate/src/Regex.rgr` | 2,260 lines |
| Arbitrary-precision integers | `interp/migrate/src/BigIntNum.rgr` | 805 lines |
| CLDR locale data, plural rules, collation weights, tailorings, case tables, normalization tables, `\p{…}` property sets | `interp/migrate/src/{LocaleData,LocalePlural,UnicodeCollate,UnicodeTailor,UnicodeCase,UnicodeNorm,UnicodeProps}.rgr` | 4,222 lines, generated |
| `Intl.Collator` / `NumberFormat` / `DateTimeFormat` / `PluralRules` / `ListFormat` | inside `ComponentEngine.rgr` (≈ line 38230 onward) | ≈ 1,200 lines |
| `Math`, including the IEEE-754 edge cases and the ones with no host operator (`cbrt`, `log2`, `log1p`, `expm1`, `sinh`, `asinh`, `clz32`, `imul`, `fround`) | `ComponentEngine.rgr:22575`+, helpers at `:7736`–`:7953` | ≈ 500 lines |
| `Number.prototype.toFixed` / `toPrecision` / `toString(radix)` | `ComponentEngine.rgr:26848`, `:26903`, `:27163` | ≈ 400 lines |
| `JSON.stringify` / `JSON.parse` | `ComponentEngine.rgr:43766`–`:44600` | ≈ 800 lines |
| `encodeURI(Component)` / `decodeURI(Component)` / `escape` / `unescape` | `ComponentEngine.rgr:36664`+ | ≈ 300 lines |
| A working abstraction over the fact that a Ranger `string` is bytes on some targets, code points on others, and UTF-16 units on the rest | `ComponentEngine.rgr:39365`–`:39744` | ≈ 370 lines |

Every one of those is *already portable* — it is Ranger code, compiled by the
same compiler that reaches Go, Python, C#, Kotlin, Dart, Swift, C++ and Rust.
None of it is *reachable*. A Ranger program that wants to format a number for a
German reader, hash a string, or parse an ISO date has three options today:

1. call a host operator that only exists for one or two targets
   (`lib/Time.rgr` is `es6`-only; `lib/Crypto.rgr` is `java7`/`es6`-only;
   `sha256` at `compiler/Lang.rgr:782` covers eight targets and returns hex
   only, with no HMAC, no streaming, no other digest),
2. embed the whole 45,221-line `ComponentEngine` and drive it with a string of
   JavaScript source, or
3. write it again.

This plan is about removing that choice, and about making the removal *stay*
removed: one implementation, reached both from JavaScript running inside the
engine and from native Ranger, so that neither side can advance without the
other.

## 2. The three failures to fix

**F1 — the implementation is not addressable.** `Math.trunc` is not a function.
It is a branch of an `if`-chain inside
`ComponentEngine.invokeBuiltinStatic` (`ComponentEngine.rgr:22539`), typed
`(nsName:string name:string args:[EvHandle]) → EvHandle`, that reads engine
state (`scriptThrew`), calls engine methods (`this.toNumberOf`), and returns a
tagged value. There is no `trunc(x:double):double` anywhere. A native caller
cannot use it and a native re-implementation would be a second copy.

**F2 — the two sides can drift, and already do.** There are two
`ComponentEngine.rgr` files: 45,221 lines under `interp/migrate/src/` and 7,293
lines under `gallery/pdf_writer/src/jsx/`. Whatever the intent, that is the
failure mode this design has to make impossible.

**F3 — "portable" is asserted, not checked, per API.** `npm run test:tsengine`
compiles the whole engine to six targets and checks seven benchmark answers
against Node (`tests/ts-engine-targets.test.ts`). That is a strong gate for
*the engine*, and no gate at all for *an individual API*. `bit_ushr`
(`compiler/Lang.rgr:3486`) is `>>>` on `es6` (32-bit), a 64-bit unsigned shift
on Go/Rust/C++/Swift, and a mask-to-32-then-shift on Python/Dart. A portable
SHA-256 written without knowing that produces three different digests. Nothing
currently would say so.

## 3. Design: two layers, one manifest

```
        native Ranger caller                  JavaScript running in the engine
                 |                                          |
                 |  RgMath.hypot(3.0 4.0)                   |  Math.hypot(3, 4)
                 v                                          v
    +--------------------------+              +-------------------------------+
    |   lib/js/core/*.rgr      |              |  interp/builtins/*.rgr        |
    |                          |<-------------|  GENERATED from the manifest  |
    |  pure Ranger. typed.     |   calls      |  ToNumber / arity / tagging / |
    |  no EvHandle. no engine  |              |  throw TypeError, RangeError  |
    |  state. THIS IS the      |              +-------------------------------+
    |  native API.             |                             ^
    +--------------------------+                             |
                 ^                                           |
                 |                     +------------------------------------+
                 +---------------------|  lib/js/manifest/<Ns>.json         |
                                       |  one row per JS method:            |
                                       |  name, arity, coercions, core fn,  |
                                       |  return kind, throws, test vectors |
                                       +------------------------------------+
```

### 3.1 Core layer — and why there is no third layer

`lib/js/core/RgMath.rgr` is **both** the shared implementation and the native
Ranger API. There is no separate "native facade" wrapping it, because a wrapper
is a thing that can lag. If the native API *is* the core, it cannot.

Rules for core files, enforced by a lint step (§7.4):

- Only primitive Ranger types in signatures: `int`, `double`, `boolean`,
  `string`, `char`, `[T]`, and core classes declared in `lib/js/core/`.
- No `EvHandle`, no `EvalValue`, no `TSNode`, no engine field access.
- Statics (`sfn`) wherever the operation is a function; instances only where JS
  itself has an object with state (a `Collator`, a `RegExp`, a digest context).
- No mutable file-level state. A cached probe result is the one exception
  (§5.1) and is idempotent.
- No `throw`. See §3.3.

Consequence worth stating plainly: the core exposes **JavaScript semantics**,
including the parts that look wrong out of context — `RgMath.max()` over an
empty list is `-Infinity`, `RgMath.ceil(-0.5)` is negative zero, and
`RgDate.getHours` equals `getUTCHours` because this realm's local zone is UTC.
Those are documented at each function, not smoothed over. Where a
native-idiomatic variant is genuinely wanted it is an *additional* function in
the same file (`RgMath.maxOf2(a:double b:double)`), never a different layer.

### 3.2 Binding layer — generated, not written

`interp/builtins/JsMathBinding.rgr` and its siblings are generated from the
manifest and carry the `GENERATED. Do not edit by hand` header the repository
already uses for `LocaleData.rgr`. Each one replaces, for its namespace, the
four hand-maintained tables that exist today:

| Today | Becomes |
| --- | --- |
| `hasBuiltinStatic` (`:25432`) — today a linear string scan over `builtinStaticNames` | generated `has(name)` table lookup |
| `builtinStaticArity` (`:24739`) | generated `arity(name)` |
| `builtinStaticNames` (`:24811`) | generated `names()` |
| the `if (nsName == "Math")` body of `invokeBuiltinStatic` (`:22575`) | generated `invoke(name args)` |

`ComponentEngine` keeps the four entry points and delegates. Namespaces migrate
one at a time; an unmigrated namespace keeps its current `if`-chain.

### 3.3 Errors: the core cannot throw, so the manifest says what does

A core function must not throw, because the same call has to become a JS
`TypeError` on one side and something Ranger-shaped on the other. Three
conventions, in order of preference:

1. **Total function.** Where JS is total, so is the core. `RgMath.*` never
   fails; NaN and the infinities are values.
2. **JS-shaped sentinel.** Where JS itself answers a sentinel, return it.
   `RgDate.parseISO` returns NaN for unparseable input, exactly as
   `Date.parse` does.
3. **Result carrier.** Where JS throws, the core returns a small class and the
   manifest names the error so the binding generates the `throw`:

   ```ranger
   class RgStrResult {
       def ok:boolean false
       def value:string ""
       ; "" when ok. Otherwise one of: RangeError, URIError, SyntaxError, TypeError
       def errorKind:string ""
       def errorMessage:string ""
   }
   ```

   A native caller checks `ok`. The generated binding turns
   `errorKind`/`errorMessage` into a real engine throw. Neither side invents
   its own error text.

### 3.4 The manifest

`lib/js/manifest/Math.json`, one row per JS-visible method:

```json
{
  "namespace": "Math",
  "methods": [
    {
      "name": "hypot",
      "arity": 2,
      "variadic": { "coerce": "ToNumber" },
      "core": "RgMath.hypotList",
      "returns": "number",
      "throws": [],
      "vectors": [["3", "4"], ["-0", "0"], ["NaN", "1"], ["Infinity", "NaN"]]
    },
    {
      "name": "trunc",
      "arity": 1,
      "args": [{ "coerce": "ToNumber" }],
      "core": "RgMath.trunc",
      "returns": "number",
      "notes": "-0 for every x in (-1, 0)",
      "vectors": [["-0.5"], ["-0"], ["4.7"], ["-4.7"], ["Infinity"]]
    }
  ]
}
```

`scripts/gen-js-bindings.cjs` reads every manifest and emits four things:

1. `interp/builtins/Js<Ns>Binding.rgr` — the binding above.
2. `lib/js/generated/RgJsIndex.rgr` — a name→core reflection table, so a
   Ranger program can look an API up by its JS name. This is what lets
   `gallery/ts_to_ranger` translate `Math.floor(x)` into `RgMath.floor(x)`
   mechanically instead of by hand-written special case.
3. `tests/generated/js-stdlib-vectors.json` — the parity matrix of §7.
4. `docs/descriptions/js-stdlib/<Ns>.md` — the reference table, so the docs
   site cannot describe an API that does not exist.

A CI step regenerates and fails on any diff, the same discipline
`npm run docs:coverage` already applies.

## 4. Directory layout

```
lib/js/
  core/
    RgStr.rgr           string model + code units      (PLAN_JS_STDLIB_TEXT)
    RgUnicode.rgr       case, normalization, properties (TEXT)
    RgCollate.rgr       collation weights + tailoring   (TEXT)
    RgU32.rgr           portable 32-bit integer algebra (MATH, CRYPTO)
    RgMath.rgr          Math                            (MATH)
    RgNum.rgr           toFixed / toPrecision / radix / ToNumber / ToInt32 (MATH)
    RgBigInt.rgr        moved from BigIntNum.rgr        (MATH)
    RgDate.rgr          moved from DateTime.rgr         (DATE + INTL)
    RgIntl.rgr          Collator, NumberFormat, DateTimeFormat, PluralRules,
                        ListFormat                      (DATE + INTL)
    RgRegex.rgr         moved from Regex.rgr            (TEXT)
    RgJson.rgr          stringify / parse over RgJsonValue (TEXT)
    RgUri.rgr           encodeURI family, escape/unescape (TEXT)
    RgBase.rgr          hex, base64, base64url          (CRYPTO)
    RgCrypto.rgr        digests, HMAC, PBKDF2, random, UUID (CRYPTO)
  data/                 the seven generated table files, moved as-is
  capability/           RgClock.rgr, RgEntropy.rgr      (§5)
  manifest/             <Ns>.json
  generated/            RgJsIndex.rgr
lib/js/README.md        what is here, and the core-layer rules

gallery/game_engine/v2/interp/builtins/
                        Js<Ns>Binding.rgr, all generated

scripts/gen-js-bindings.cjs
scripts/lint-js-core.cjs
tests/js-stdlib-parity.test.ts
tests/js-stdlib-targets.test.ts
tests/native/js_stdlib_main.rgr
```

`lib/` is already copied wholesale into the published package
(`build:dist:copy` does `cp -r ./lib ./dist/lib`) and already reachable through
`RANGER_LIB`, so `lib/js/` ships with no packaging change.

## 5. Capability seams

The core is pure, so anything that needs the outside world is injected. Two
capabilities, both narrow on purpose.

### 5.1 `RgClock` — wall clock and local offset

`wall_clock_ms` already exists (`compiler/Lang.rgr:2552`) and covers es6, C++,
Rust, Go, Python, C#, Kotlin and Java 7 with a `*` fallback of `0.0`. Two
additions are needed:

- `monotonic_ms:double ()` — for `performance.now`, so it cannot go backwards.
- `local_tz_offset_min:int ()` — minutes to add to UTC for local time.

`RgDate` reads the clock only through `RgClock`, and defaults to **frozen**
(`0.0`) exactly as the engine's `hostNowMs` does today
(`ComponentEngine.rgr:1145`), so conformance runs stay reproducible. A program
opts into the live clock explicitly.

`local_tz_offset_min` has a `*` fallback of `0`, which reproduces the engine's
current, deliberate, documented choice: local time is UTC. See
[PLAN_JS_STDLIB_DATE_INTL.md §6](PLAN_JS_STDLIB_DATE_INTL.md) for why a real
time-zone database is out of scope and what changes if that is revisited.

### 5.2 `RgEntropy` — cryptographically secure bytes

No such operator exists. It must be added, and it must **fail loudly** rather
than fall back:

```ranger
; lib/js/capability/RgEntropy.rgr
class RgEntropy {
    sfn available:boolean () {
        return (secure_random_available)
    }
    ; n bytes, each 0..255. Caller must check available() first.
    sfn bytes:[int] (n:int) {
        return (secure_random_bytes n)
    }
}
```

The `*` template for `secure_random_available` is `false`, and the `*` template
for `secure_random_bytes` raises. It must never degrade to the existing
`random` operator (`compiler/Lang.rgr:541`), which is `mt19937` on C++ and
`Math.random()` on es6. A silently-weak CSPRNG is worse than a build error,
because the build error is visible. Per-target templates and the reasoning are
in [PLAN_JS_STDLIB_CRYPTO.md §4](PLAN_JS_STDLIB_CRYPTO.md).

## 6. What "develop both sides simultaneously" means in practice

This is the part of the ask the whole design serves, so it is worth writing out
as the workflow it becomes.

### Adding a JS API — e.g. `Math.f16round`

1. Write `sfn f16round:double (x:double)` in `lib/js/core/RgMath.rgr`.
2. Add a manifest row: name, arity, `ToNumber`, `RgMath.f16round`, `number`,
   plus four or five vectors.
3. `npm run js-stdlib:gen`.

That is the whole change. The JS binding, the reflection entry, the docs row and
the parity vectors all appear. `Math.f16round(1.5)` works inside the engine and
`RgMath.f16round(1.5)` works in native Ranger, in the same commit, from the same
lines of code. **There is no way to add one without the other**, which is the
property that makes drift structural rather than a matter of discipline.

### Adding a native Ranger API that JS has no name for

Write it in the core file. Omit the manifest row. It is native-only, and the
lint step confirms it still obeys the core rules, so it stays portable and stays
callable from the binding layer later if a JS name ever arrives for it.

### Moving code between the two worlds

Because the names line up 1:1, a JS prototype can be rewritten as native Ranger
mechanically — and `gallery/ts_to_ranger` can do it from `RgJsIndex.rgr` rather
than from hand-written cases. The reverse direction is how you debug: run a
native `RgIntl` call and the equivalent `Intl` JavaScript through the engine and
diff, which is exactly what §7.2 automates.

### Working on the engine without touching the library

Unmigrated namespaces keep their `if`-chains, and migrated ones are delegations.
No phase of this plan requires a coordinated rewrite of the 45,221-line file.

## 7. The parity harness

Three legs. Each catches a different failure, and the third is the one that
makes "on all platforms" a checked claim.

### 7.1 Node as oracle

`tests/runtime-conformance.test.ts` already derives every expectation by running
Node first, and `CONFORMANCE.md` records why: hand-written expectations
encoded misunderstandings three separate times, and `KNOWN_GAPS` is asserted in
*both* directions so a closed gap breaks the suite until the list is updated.
Vectors in the manifest are inputs only. Expected values are whatever Node
answers. A vector Node cannot run is a broken vector, not a new expectation.

### 7.2 Facade parity — the anti-drift leg

For every manifest row, `tests/js-stdlib-parity.test.ts` evaluates each vector
three ways and requires all three to agree:

| Leg | How |
| --- | --- |
| native | the core compiled to JS as a module, called directly |
| engine | the equivalent JavaScript source, evaluated by `ComponentEngine` |
| Node | the same JavaScript source, `eval`'d in the test process |

`native == engine` catches a binding that coerces wrongly. `engine == Node`
catches a semantics bug. `native == Node` catches a core that is right for the
engine's conventions and wrong for JavaScript. A row with no vectors fails the
suite, so the manifest cannot grow untested entries.

### 7.3 Cross-target — the anti-optimism leg

`tests/native/js_stdlib_main.rgr` is a native entry point in the same style as
`bench/native/bench_main.rgr`: it takes a vector-set name, prints one answer per
line, and does nothing else. `tests/js-stdlib-targets.test.ts` compiles it to
every target, builds and runs it where the toolchain is on `PATH`, and compares
the output **byte for byte** against the JS run of the same vectors.

This is the leg that would have caught `bit_ushr`, `-0` literals surviving a
round trip, and `strlen` on `"é"` — each of which is a per-target divergence
invisible to any single-target test. It follows `tests/vitest.tsengine.config.ts`
in living outside the default `npm test` run, because it compiles and builds
several times.

### 7.4 The core lint

`scripts/lint-js-core.cjs` rejects, in `lib/js/core/`: any mention of
`EvHandle`, `EvalValue`, `TSNode`; any `throw`; any file-level mutable state
outside the declared probe caches; and any signature naming a type outside the
allowed set. Cheap, and it is what keeps the core layer from quietly becoming
engine code again.

## 8. Phases and their gates

Each phase lands independently and each gate is a command that either passes or
does not.

| # | Phase | Gate |
| --- | --- | --- |
| 0 | Manifest, generator, all three parity legs, wired for exactly five `Math` methods (`abs`, `floor`, `ceil`, `trunc`, `sign`) | the three legs green on those five, on every target with a toolchain; regeneration produces no diff |
| 1 | **TEXT-A**: `RgStr` — lift `strModelKind` … `cuIndexOfByte` (`:39365`–`:39744`); `ComponentEngine` keeps one-line delegating shims | `npm test` and `npm run test:tsengine` unchanged; new per-target string-model probe green |
| 2 | **MATH**: `RgU32`, `RgMath`, `RgNum`; `Math` and `Number` namespaces fully generated | `Math`/`Number` rows green on all three legs; the `if`-chains at `:22575`, `:24751`, `:24940` deleted |
| 3 | **DATE**: `DateTime.rgr` → `lib/js/core/RgDate.rgr`; `RgClock`; `monotonic_ms` and `local_tz_offset_min` operators | `Date` rows green; `performance.now` monotonic under the live clock |
| 4 | **TEXT-B**: `RgUnicode`, `RgCollate`, the seven data files moved with their generators | case/normalize/collate rows green; generators still reproduce the tables |
| 5 | **INTL**: `RgIntl`, all five constructors | `Intl` rows green; `toLocaleString` family delegating |
| 6 | **CRYPTO**: `secure_random_*` operators, `RgBase`, `RgCrypto`; new `crypto` namespace in the engine | NIST/RFC vectors green on all targets; entropy absent ⇒ loud failure, verified |
| 7 | **TEXT-C**: `RgJson`, `RgUri`, `RgRegex`, `RgBigInt` promoted | rows green; `gallery/pdf_writer/src/jsx/` pointed at `lib/js/`; `lib/Crypto.rgr` and `lib/Time.rgr` marked superseded |

Phases 2–6 are independent once 0 and 1 are in. Phase 5 needs 3 and 4.

## 9. Non-goals

- **No new JS features.** This plan moves and exposes what the engine already
  does. `Temporal`, `Intl.Segmenter`, `Intl.DurationFormat` are out.
- **No IANA time-zone database.** UTC-as-local is inherited deliberately from
  `DateTime.rgr` and stays. §6 of the DATE+INTL plan says what it would take.
- **No symmetric or public-key cryptography in v1.** Digests, HMAC, KDF,
  random and encodings only. The reasoning — that a pure high-level port cannot
  honestly promise constant-time behaviour on ten targets — is in
  [PLAN_JS_STDLIB_CRYPTO.md §2](PLAN_JS_STDLIB_CRYPTO.md).
- **No rewrite of `ComponentEngine.rgr`.** It shrinks as namespaces migrate.
  Splitting the class is a separate concern, already tracked in
  `interp/migrate/README.md`.
- **No change to the operator/template mechanism.** Three new host operators,
  written the way `compiler/Lang.rgr` already writes them.

## 10. Risks

| Risk | Why it is real | Mitigation |
| --- | --- | --- |
| A lifted function behaves differently once outside the engine | it read engine state that was not in its signature | phase 1 lands `RgStr` behind delegating shims, so the *old* suites run against the *new* code before any caller changes |
| Per-target integer divergence | `bit_ushr` is three different operations (§2, F3) | `RgU32` is built only on `bit_and`/`bit_or`/`bit_xor`/`bit_shl` with explicit masking; phase 2 gate includes a per-target algebra probe |
| Per-target `double` divergence, especially `-0` | `Math.ceil(-0.5)`, `Math.trunc(-0.5)` and `Math.abs(-0)` all depend on it; `negativeZero()` exists at `:7808` because plain arithmetic collapsed the sign | dedicated `-0` vector set run through leg 7.3 on every target, as a phase 2 gate |
| Generator becomes a second thing to maintain | it always is | it is ~300 lines of `.cjs` producing text, in the same shape as the seven `interp/migrate/tools/gen-*.cjs` files; the no-diff CI check is what keeps it honest |
| The two `ComponentEngine.rgr` copies diverge further while this lands | 45,221 vs 7,293 lines already | phase 7 converges them on `lib/js/`; until then only the large copy is migrated, so the small one is never a *second* implementation of a *migrated* API |
| Cross-target leg is slow and gets skipped | `test:tsengine` is already about a minute | it lives in its own vitest config, runs in CI and before publish, and is not in the default `npm test` |

## 11. Payoffs beyond the ask

- `gallery/ts_to_ranger` gets a mechanical translation table for the JS standard
  library instead of hand-written cases.
- `gallery/pdf_writer` stops needing a JS engine to format a number or a date.
- `sha256`/`md5` stop being the only digests, and stop being host operators with
  eight separate implementations to keep in agreement.
- The compiler itself gains a portable clock, portable secure random, and
  portable locale-aware formatting — none of which it has today.
