# PLAN_JS_STDLIB — Math and Number

Sub-plan of [PLAN_JS_STDLIB.md](PLAN_JS_STDLIB.md). Covers phase **2**.
Depends on phase 1 (`RgText`, see [PLAN_JS_STDLIB_TEXT.md](PLAN_JS_STDLIB_TEXT.md))
because number *formatting* builds strings.

This is the phase that proves the architecture on something small enough to
finish and sharp enough to matter: `Math` is 35 methods whose entire content is
edge cases, and the parity harness either catches them on ten targets or it does
not work.

---

## 1. What exists

`Math` is dispatched from four hand-maintained tables in `ComponentEngine.rgr`:

| Table | Line |
| --- | --- |
| `invokeBuiltinStatic`, the `if (nsName == "Math")` body | `:22575` |
| `builtinStaticArity` | `:24751` |
| `builtinStaticNames` | `:24940` |
| `hasBuiltinStatic` | `:25432` |

`hasBuiltinStatic` has no per-namespace branch: it calls `builtinStaticNames` and
walks the returned list comparing strings, so every membership test allocates a
string array and does a linear scan. A generated binding answers from a table
instead, which is a small performance win the migration gets for free.

The implementations split three ways.

**Host operators** — `sqrt`, `sin`, `cos`, `tan`, `random`
(`:22671`–`:22674`). These are `compiler/Lang.rgr` operators with per-target
templates; nothing to move.

**Pure Ranger already** — the numeric helpers that had to be written because no
portable operator exists:

| Helper | Line |
| --- | --- |
| `expNum` | `:7736` |
| `logNum` | `:7763` |
| `isNegZero` | `:7801` |
| `negativeZero` | `:7808` |
| `floorNum` | `:7823` |
| `powNum` | `:7953` |
| `powNum2` | `:21547` |

**Inline in the dispatch chain** — `abs`, `floor`, `ceil`, `trunc`, `sign`,
`round`, `cbrt`, `log2`, `log10`, `log1p`, `expm1`, `sinh`, `cosh`, `tanh`,
`asinh`, `acosh`, `atanh`, `hypot`, `clz32`, `imul`, `fround`, `max`, `min`.
These are the ones with no callable form at all.

`Number` is in the same state: `numberToRadix` (`:26848`), `toFixedString`
(`:26903`), `toPrecisionString` (`:27163`), plus the coercions `toNumberOf`,
`toInt32Of` and `int32Wrap` that every other namespace's binding will need.

## 2. Two hazards this phase has to settle first

Both are per-target divergences that no existing test would report, and both
block correct code rather than merely nice code.

### 2.1 `bit_ushr` is three different operators

`compiler/Lang.rgr:3486`:

```
es6      ( "(" (e 1) " >>> " (e 2) ")" )                       ; 32-bit, unsigned
go       ( "int64(uint64(" (e 1) ") >> uint(" (e 2) "))" )     ; 64-bit
rust     ( "(((" (e 1) ") as u64 >> (" (e 2) ")) as i64)" )    ; 64-bit
cpp      ( "(int64_t)((uint64_t)(" (e 1) ") >> (" (e 2) "))" ) ; 64-bit
swift6   ( "Int(bitPattern: UInt(bitPattern: " (e 1) ") >> …" ) ; 64-bit
python   ( "((" (e 1) " & 0xFFFFFFFF) >> (" (e 2) "))" )       ; masked to 32
dart     ( "((" (e 1) " & 0xFFFFFFFF) >> (" (e 2) "))" )       ; masked to 32
kotlin   ( "((" (e 1) ") ushr (" (e 2) "))" )                  ; 32-bit on Int
csharp   ( "(int)((uint)(" (e 1) ") >> (int)(" (e 2) "))" )    ; 32-bit
```

`bit_ushr(-1, 28)` is `15` on es6, `68719476735` on Go, `15` on Python. Any code
that reaches for it as "the unsigned shift" is target-dependent. `bit_shr`
(`:3470`) has the same class of problem for negative inputs.

**Decision: `RgU32` never calls `bit_ushr`.** — and, as the landed
implementation found, it cannot rely on `bit_shl` either. Measured:

|  | es6 | python | go | cpp |
| --- | --- | --- | --- | --- |
| `2147483647 + 1` | 2147483648 | 2147483648 | 2147483648 | **-2147483648** |
| `bit_shl 1 31` | **-2147483648** | 2147483648 | 2147483648 | -2147483648 |
| `bit_shl 1 40` | **256** | 1099511627776 | 1099511627776 | **0** |

Three corrections to the paragraph above:

- **`bit_shl` is JavaScript's `<<` on es6**: the result wraps to 32 bits *and the
  count is taken mod 32*, so `1 << 40` is 256, not 0 and not 2^40. On C++ it is
  undefined past the width. Masking afterwards cannot recover either.
- **`int` is 32-bit signed on C++, so plain `+` overflows.** A u32 cannot be held
  as an `int` in `[0, 2^32)`; that range does not exist on that target. Values in
  it must be carried as `double`.
- Therefore the u32 is a **signed 32-bit bit pattern**, every intermediate stays
  under 2^31 by splitting into 16-bit halves, and no literal above 2147483647 is
  ever written.

`lib/core/RgU32.rgr` is landed on that basis and its header carries the table.

### 2.2 Negative zero may not survive the trip

The engine has `negativeZero()` (`:7808`) and `isNegZero()` (`:7801`) precisely
because writing `0.0 - n` collapses the sign — the comment at `:22579` records
that `Math.abs`, `floor`, `ceil` and `round` each lost the distinction that way.
Whether a `-0.0` literal, a `-0.0` passed through a function boundary, and a
`-0.0` printed by the target's own number formatter all preserve the sign is a
**per-target question with ten answers**, and nothing in the repository asks it.

`Math.ceil(-0.5)`, `Math.trunc(-0.5)`, `Math.round(-0.5)`, `Math.abs(-0)`,
`Math.sign(-0)`, `1 / Math.min(0, -0)` and `Object.is(x, -0)` all depend on the
answer. So does `RgNum.toFixed(-0.0, 2)` → `"-0.00"`.

**Decision:** a dedicated `negzero` vector set, run through the cross-target leg
as an explicit phase-2 gate, before any `Math` row is declared green.

**Landed, and it found one immediately.** The `negzero` set is 19 vectors in
`tests/native/core_vectors.rgr`. On its first cross-target run, Python answered
`negZero_is_neg=false` where es6, Go and C++ all said `true`. Cause: the Python
writer emits `def z:double 0.0` as `z = 0` — an **int literal** — so the engine's
bind-the-value-first trick (which exists because the C++ writer folds bare double
literals) fixes C++ and not Python. `RgNum.negZero()` is now `-1 / Infinity`,
because no target folds a *division* into an int: each one routes double division
through a generated helper. All 19 vectors are identical on all five targets.

## 3. `lib/core/RgU32.rgr` — LANDED

Portable 32-bit integer algebra. Small, boring, and the thing SHA-256, `clz32`,
`imul`, `fround` and every `ToInt32` coercion stand on. As shipped:

```ranger
class RgU32 {
    ; a u32 is a SIGNED 32-bit BIT PATTERN — see §2.1
    sfn signBit:int ()                ; 0x80000000, built by subtraction
    sfn loHalf:int (v:int)            sfn hiHalf:int (v:int)
    sfn fromHalves:int (hi:int lo:int)
    sfn wrap32:int (v:int)            ; low 32 bits, sign-extended
    sfn band:int (a:int b:int)        sfn bor:int (a:int b:int)
    sfn bxor:int (a:int b:int)        sfn bnot:int (a:int)
    sfn shl:int (v:int n:int)         ; count mod 32, halves shifted separately
    sfn shr:int (v:int n:int)         ; LOGICAL; never bit_ushr
    sfn sar:int (v:int n:int)         ; ARITHMETIC
    sfn rotl:int (v:int n:int)        sfn rotr:int (v:int n:int)
    sfn addU:int (a:int b:int)        ; (a + b) mod 2^32, through the halves
    sfn sub:int (a:int b:int)
    sfn toUnsignedD:double (v:int)    ; [0, 2^32) needs a DOUBLE, not an int
    sfn fromUnsignedD:int (d:double)
    sfn clz:int (v:int)               sfn popcount:int (v:int)
    sfn byteAt:int (v:int i:int)      ; big-endian
    sfn fromBytesBE:int (b0:int b1:int b2:int b3:int)
}
```

Three things differ from the sketch this section used to carry, all forced by
§2.1: `mask` became `wrap32` (a mask cannot express it — the sign has to be
re-extended), `toUnsigned` returns a **`double`** because `[0, 2^32)` is not an
int range on C++, and `and`/`or`/`not`/`add` are spelled `band`/`bor`/`bnot`/
`addU` because `add` and `wrap` are global operator names.

**`mul` is deliberately absent.** A 32×32 product mod 2^32 needs a 16×16 partial
product, and 65535 × 65535 = 4294836225 is past what a C++ int holds — so it needs
8-bit limbs and four more partial products. SHA-256, SHA-1, HMAC and CRC use only
add/xor/and/not/rot/shr, so nothing downstream is blocked. `Math.imul` waits.

`RgU32` is native-only — no manifest rows — but it is the reason `Math.imul`
and all of CRYPTO can be written once. 40 of its vectors are in the `u32` set.

## 4. `lib/core/RgMath.rgr`

Every `Math` method as a plain function. Signatures are `double → double`
throughout, so the binding is a coercion and a tag and nothing else.

```ranger
class RgMath {
    ; --- constants ---
    sfn PI:double ()      sfn E:double ()       sfn LN2:double ()
    sfn LN10:double ()    sfn LOG2E:double ()   sfn LOG10E:double ()
    sfn SQRT2:double ()   sfn SQRT1_2:double ()

    ; --- IEEE helpers, promoted from ComponentEngine ---
    sfn nan:double ()             sfn inf:double ()
    sfn negInf:double ()          sfn negativeZero:double ()
    sfn isNegZero:boolean (v:double)
    sfn isNaN:boolean (v:double)  sfn isFinite:boolean (v:double)

    ; --- rounding, with the -0 rules spelled out at each one ---
    sfn abs:double (x:double)     ; abs(-0) is +0
    sfn floor:double (x:double)   ; floor(-0) is -0
    sfn ceil:double (x:double)    ; ceil(x) is -0 for -1 < x < 0, and for -0
    sfn trunc:double (x:double)   ; trunc(x) is -0 for -1 < x < 0
    sfn round:double (x:double)   ; round(-0.5) is -0; round(0.5) is 1
    sfn sign:double (x:double)    ; sign(-0) is -0, sign(NaN) is NaN

    ; --- transcendental ---
    sfn sqrt:double (x:double)    sfn exp:double (x:double)
    sfn log:double (x:double)     sfn pow:double (b:double e:double)
    sfn cbrt:double (x:double)    sfn log2:double (x:double)
    sfn log10:double (x:double)   sfn log1p:double (x:double)
    sfn expm1:double (x:double)
    sfn sin:double (x:double)     sfn cos:double (x:double)
    sfn tan:double (x:double)     sfn asin:double (x:double)
    sfn acos:double (x:double)    sfn atan:double (x:double)
    sfn atan2:double (y:double x:double)
    sfn sinh:double (x:double)    sfn cosh:double (x:double)
    sfn tanh:double (x:double)    sfn asinh:double (x:double)
    sfn acosh:double (x:double)   sfn atanh:double (x:double)

    ; --- list forms. JS is variadic; the core takes a list and the binding
    ;     coerces each argument exactly once (a valueOf hook must not see two
    ;     visits — see ComponentEngine.rgr:22843).
    sfn hypotList:double (xs:[double])   ; any infinity wins outright, over NaN
    sfn maxList:double (xs:[double])     ; empty is -Infinity; -0 loses to +0
    sfn minList:double (xs:[double])     ; empty is +Infinity; -0 beats +0
    sfn hypot2:double (a:double b:double)   ; native convenience
    sfn max2:double (a:double b:double)
    sfn min2:double (a:double b:double)

    ; --- integer-flavoured ---
    sfn clz32:int (x:double)
    sfn imul:int (a:double b:double)
    sfn fround:double (x:double)         ; nearest float32; Ranger has no float32,
                                         ; so the round trip is done by hand
    sfn random:double ()                 ; host `random` operator; NOT for crypto
}
```

`RgMath.random` carries the warning in its doc comment and `lib/core/README.md`
repeats it: `Math.random` is not a CSPRNG on any target, and
[CRYPTO](PLAN_JS_STDLIB_CRYPTO.md) explains what to use instead and why there is
no fallback between them.

## 5. `lib/core/RgNum.rgr`

Number formatting and the ECMAScript coercions. The coercions are the part every
*other* namespace's binding needs, which is why they belong in the core rather
than in the engine.

```ranger
class RgNum {
    ; --- formatting, lifted from ComponentEngine ---
    ; toFixed / toPrecision throw RangeError in JS, so they return a carrier.
    sfn toFixed:RgTextResult (v:double digits:int)      ; digits 0..100
    sfn toPrecision:RgTextResult (v:double digits:int)  ; digits 1..100
    sfn toRadix:RgTextResult (v:double radix:int)       ; radix 2..36
    sfn toExponential:RgTextResult (v:double digits:int)
    ; The default Number->String algorithm: shortest round-tripping form.
    sfn asString:string (v:double)

    ; --- ECMAScript coercions, on primitives only ---
    sfn parseFloatOf:double (s:string)   ; leading-number semantics, NaN if none
    sfn parseIntOf:double (s:string radix:int)
    sfn toInt32:int (v:double)
    sfn toUint32:int (v:double)
    sfn toIntegerOrInfinity:double (v:double)
    sfn int32Wrap:int (v:int)
    sfn toFloat32:double (v:double)
}
```

`asString` is the load-bearing one and the riskiest. "Shortest string that
round-trips" is what `String(0.1 + 0.2)` returning `"0.30000000000000004"`
means, and each target's own formatter has its own idea — `compiler/Lang.rgr`
already carries a hand-written `r_double_to_string` for C++ that loops over
precisions 1..18 looking for a round trip, precisely because `std::ostringstream`
would not do it. Phase 2 therefore treats `asString` as its own vector set with
a few hundred adversarial doubles (powers of two, `1e21` where JS switches to
exponential, denormals, `-0`, values with 17 significant digits), run through the
cross-target leg. If a target disagrees, `RgNum.asString` implements the shortest
round-trip search itself rather than delegating.

Deliberately **not** in `RgNum`: anything that coerces a JS *object*. `ToNumber`
on an object can run `valueOf`, which is arbitrary JavaScript. That stays in the
engine's binding layer where the interpreter is; the core sees only primitives.

## 6. Manifest coverage

`lib/core/manifest/Math.json` — 35 methods, 8 constants.
`lib/core/manifest/Number.json` — `isFinite`, `isInteger`, `isNaN`,
`isSafeInteger`, `parseFloat`, `parseInt`, the `MAX_*`/`MIN_*`/`EPSILON`
constants, and the four prototype methods (`toFixed`, `toPrecision`,
`toString`, `toExponential`) which the manifest marks `"receiver": "number"` so
the generator emits a prototype-method binding rather than a static one.

Global functions `parseInt`, `parseFloat`, `isNaN`, `isFinite` (seeded at
`ComponentEngine.rgr:40206`+) get rows in a `Global.json` manifest pointing at
the same `RgNum` functions, so the two spellings cannot diverge — which they can
today, since `isNaN` and `Number.isNaN` are genuinely different functions and
each has its own branch.

## 7. Vector sets

| Set | Contents | Why |
| --- | --- | --- |
| `negzero` | every rounding and sign method against `-0`, `-0.4`, `-0.5`, `-0.6`, `+0` | §2.2; gates the phase |
| `u32` | `RgU32` identities over `0`, `1`, `0x7FFFFFFF`, `0x80000000`, `0xFFFFFFFF`, `-1` | §2.1 |
| `ieee` | NaN and ±Infinity into all 35 methods | NaN propagation is per-method in the spec |
| `mathedge` | `hypot(Infinity, NaN)`, `max()`, `min()`, `pow(-1, 0.5)`, `pow(1, Infinity)`, `atan2` quadrants, `acosh(0.5)` | the branches that exist only for these |
| `dtoa` | ≈300 adversarial doubles through `asString`, `toFixed`, `toPrecision`, `toRadix` | §5 |
| `radix` | every radix 2..36 over positive, negative, and fractional values | `numberToRadix` is 55 lines of special cases |

All six run on all three parity legs. `dtoa` and `negzero` also run on the
cross-target leg as gates.

## 8. Gate for phase 2

1. Every `Math` and `Number` manifest row green on native-vs-engine-vs-Node.
2. `negzero`, `u32` and `dtoa` byte-identical across every target with a
   toolchain on `PATH`.
3. The three `Math` `if`-chains (`:22575`, `:24751`, `:24940`) deleted, with
   `ComponentEngine` delegating to the generated `JsMathBinding`.
4. `npm test` and `npm run test:tsengine` unchanged.
5. Regenerating from the manifest produces no diff.

Point 3 is what makes this a migration rather than an addition. The phase is not
done while two implementations of `Math.trunc` exist.
