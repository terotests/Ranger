# `lib/core` — the Ranger Core API

Portable, dependency-free Ranger classes for the things every language's standard
library has and Ranger does not: IEEE-754 arithmetic, 32-bit integer algebra,
string/Unicode handling, dates, formatting, hashing.

One implementation, compiled to every target. No `systemclass`, no operator
templates, no per-target branches.

**Status: first slice.** `RgNum` and `RgU32` are landed and gated. The rest is
planned in [PLAN_JS_STDLIB.md](../../PLAN_JS_STDLIB.md).

| File | What | State |
| --- | --- | --- |
| `RgNum.rgr` | IEEE-754 doubles: rounding, `exp`, `log`, `pow`, signed zero, ToInt32/ToUint32, float32 | landed |
| `RgU32.rgr` | 32-bit unsigned algebra: and/or/xor/not, shifts, rotations, add/sub, clz, popcount, big-endian bytes | landed |
| `RgStr.rgr` | UTF-16 code-unit addressing over all three string models; UTF-8 bytes | planned |
| `RgBase.rgr` | hex, base64, base64url | planned |
| `RgDate.rgr` | ES5 time algebra, ISO parsing and formatting | planned |
| `RgIntl.rgr` | collation, number and date formatting over CLDR | planned |
| `RgCrypto.rgr` | SHA-2, HMAC, PBKDF2, secure random, UUID | planned |

## Why this is not `lib/stdlib.rgr`

`lib/stdlib.rgr` and `lib/stdops.rgr` contain **only operator templates** — no
classes at all. "stdlib" in this repository already means "language-level
operator definitions with a per-target template each". This directory is the
opposite: plain Ranger classes with one body that every target compiles.

The rest of `lib/` is mostly host shims — `lib/Time.rgr` is `es6`-only,
`lib/Crypto.rgr` has a `java7` template and nothing else. Those work on the
target they were written for. `lib/core` is for code that has to work on all of
them.

## Rules for a file in here

1. **No host operators with partial coverage.** If an operator has no `*`
   fallback and is missing on a target, it does not belong in a signature here.
2. **No `EvHandle`, `EvalValue`, `TSNode` or any engine type.** These are
   callable from a native Ranger program with no interpreter present.
3. **Primitive types only** in signatures: `int`, `double`, `boolean`, `string`,
   `char`, `[T]`, and classes declared in `lib/core/`.
4. **No `throw`.** Where JavaScript throws, return a result carrier — the value
   plus an error kind — so the same function can become a JS exception on one
   side and an ordinary check on the other.
5. **No mutable file-level state**, so two callers cannot interfere.
6. **Every claim gets a vector.** Anything asserted about behaviour goes in
   `tests/native/core_vectors.rgr` and is compared against Node and across
   targets. See [Testing](#testing).

### Naming: the `D` suffix, and why

**A static method may not take the name of a global operator.** The resolver
rewrites `RgNum.floor(x)` into the operator call and then reports
`Class RgNum does not have method floor`. `EvValueBridge.rgr` documents the same
trap for `isArray`.

Nine names are affected: `floor`, `ceil`, `sqrt`, `sin`, `cos`, `tan`, `asin`,
`acos`, `atan2`. Each carries a `D` suffix here — `RgNum.floorD`, `RgNum.ceilD`,
`RgNum.sqrtD` — which is the convention `DateTime.rgr` already uses for `floorD`,
`truncD` and `modD`. For `floor` and `ceil` the suffix marks a real distinction:
**the operators return `int`**, and these return `double`.

Two more names collide for the same reason and are spelled around it: `wrap` (the
optional-wrapping operator) is `RgU32.wrap32`, and `add` is `RgU32.addU`.
Instance methods are unaffected — only statics enter the operator namespace.

Before adding a method, check the name:

```
node -e 'const fs=require("fs");const n=process.argv[1];
 const re=/^\s{4,20}([a-zA-Z_][\w]*)\s+(?:_|[a-zA-Z_][\w]*)(?:@\([^)]*\))?\s*:/;
 for(const f of ["compiler/Lang.rgr","lib/stdops.rgr","lib/stdlib.rgr"])
  for(const l of fs.readFileSync(f,"utf8").split("\n")){const m=l.match(re);
   if(m&&m[1]===n)console.log("COLLIDES with an operator in",f);}' floor
```

## What was measured

Everything below came out of running the same Ranger source on five targets. It
is written down because each item silently rules out an implementation that looks
obviously correct.

### `int` is not one type

|  | es6 | python | go | cpp | rust |
| --- | --- | --- | --- | --- | --- |
| `2147483647 + 1` | 2147483648 | 2147483648 | 2147483648 | **-2147483648** | 64-bit |
| `bit_shl 1 31` | **-2147483648** | 2147483648 | 2147483648 | -2147483648 | 64-bit |
| `bit_shl 1 40` | **256** | 1099511627776 | 1099511627776 | **0** | 64-bit |
| `bit_ushr (0-1) 4` | 268435455 | 268435455 | **1152921504606846975** | 64-bit | 64-bit |

- **`int` is 32-bit signed on C++.** Plain *arithmetic* overflows there. A u32
  cannot be held as an `int` in `[0, 2^32)`, because that range does not exist.
- **`bit_shl` is not portable.** On es6 it is JavaScript's `<<`: the result wraps
  to 32 bits and the **count is taken mod 32**, so `1 << 40` is 256. On C++ it is
  undefined past the width and gives 0. On go/python/rust it grows unbounded.
- **`bit_ushr` is three different operators** — 32-bit on es6 and python, 64-bit
  on go, cpp, rust and swift. `RgU32` does not use it at all.

`RgU32` therefore carries a u32 as a **signed 32-bit bit pattern**, keeps every
intermediate under 2^31 by splitting into 16-bit halves, and never writes a
literal above 2147483647.

### Double literals may be emitted as int literals

`def z:double 0.0` compiles to `z = 0` on the **Python** target — an int. So

```ranger
def z:double 0.0
return (z * (0.0 - 1.0))     ; +0 on Python. The sign was gone a line earlier.
```

The C++ writer has the same habit for bare literals, which is why the JS engine's
`negativeZero()` bound the value first. That fixes C++ and not Python.

**A division cannot be folded into an int on any target**, because every one of
them routes double division through a helper (Python's `/` raises
`ZeroDivisionError`, so `r_div_f64` is already generated). `RgNum.negZero()` is
therefore `-1 / Infinity`, and the cross-target suite is what found this.

### Strings have three models, and all three are live

| `strlen` | es6 | python | go | cpp |
| --- | --- | --- | --- | --- |
| `"é"` | 1 | 1 | 1 | **2** |
| `"😀"` | **2** | 1 | 1 | **4** |

es6 counts UTF-16 code units, python and go count code points, C++ counts UTF-8
bytes. Any function that indexes a string has to know which, which is what
`RgStr` will encapsulate (`PLAN_JS_STDLIB_TEXT.md`).

### There is no `exp`, `log`, `pow`, `round`, `min` or `atan` operator

`sqrt`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan2` and `fabs` exist as host
operators. `exp`, `log` and `pow` **do not exist on any target**, and
`floor`/`ceil` return `int`. So `RgNum` implements them: `exp` by range reduction
plus a Taylor series, `log` by reduction plus the atanh series, `pow` by squaring
for integer exponents and the identity otherwise.

The trade is explicit. These land **1 ULP** from each platform's libm — so they
are *not* bit-identical to `Math.exp` in Node. In exchange they are **identical
across all five targets**, which delegating to each platform's libm would not
have been. For a program that has to agree with itself on Go and on Node, that is
the direction worth being wrong in. The suite asserts the ULP bound rather than
equality, so a regression in the series cannot hide behind "it was never exact".

## Testing

```bash
npm run test:core          # oracle + every target
```

Three legs, in `tests/core-targets.test.ts` over
`tests/native/core_vectors.rgr`:

1. **Node as oracle.** Every expectation is computed by the JavaScript built-in
   the function mirrors, never hand-written. `CONFORMANCE.md` records
   hand-written expectations encoding a misunderstanding three separate times.
2. **Byte-for-byte across targets.** Compiled to es6, python, go, cpp and rust;
   built and run where the toolchain is on `PATH`; output compared character for
   character against the es6 run.
3. **The `D` bound** on `exp`/`log`, asserted as a bound.

Doubles are never printed directly — each target's own number formatter
disagrees about trailing `.0`, exponent spelling and digit count. `showD`
decomposes a double into sign, a 52-bit mantissa in two halves, and a binary
exponent, and the test does the same decomposition in JavaScript.

Current reading: **104 vectors, identical on es6 / python / go / cpp / rust;
101 of them exact against Node**, the other three being the `exp`/`log` series.
