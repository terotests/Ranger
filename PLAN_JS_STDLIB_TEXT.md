# PLAN_JS_STDLIB — text: string model, Unicode, Regex, JSON, URI

Sub-plan of [PLAN_JS_STDLIB.md](PLAN_JS_STDLIB.md). Covers phases **1
(TEXT-A)**, **4 (TEXT-B)** and **7 (TEXT-C)**.

This is the foundation phase. Every other sub-plan depends on TEXT-A, because
`Intl`, `Number.prototype.toFixed`, `JSON.stringify`, the URI functions and the
base64 encoders all index strings, and in Ranger *indexing a string means
something different on every target*.

---

## 1. The problem TEXT-A solves

A Ranger `string` has three different models depending on the target. All three
are live in the four targets `npm run test:core` builds today — measured, not
assumed:

| `strlen` | es6 | python | go | cpp |
| --- | --- | --- | --- | --- |
| `"é"` | 1 | 1 | 1 | **2** |
| `"😀"` | **2** | 1 | 1 | **4** |

es6 counts UTF-16 code units (kind 0), python and go count code points (kind 2),
C++ counts UTF-8 bytes (kind 1). The engine already discovers which one it is
running on at runtime (`ComponentEngine.rgr:39365`):

```ranger
fn strModelKind:int () {
    if (utf8ModelKnown == false) {
        if ((strlen "é") > 1) {
            utf8ModelKind = 1          ; bytes  — strlen counts UTF-8 bytes
        } {
            if ((strlen "😀") == 1) {
                utf8ModelKind = 2      ; points — strlen counts code points
            } {
                utf8ModelKind = 0      ; units  — strlen counts UTF-16 units
            }
        }
        utf8ModelBytes = (utf8ModelKind == 1)
        utf8ModelKnown = true
    }
    return utf8ModelKind
}
```

Around it sits a family that turns any of the three into the UTF-16 code-unit
addressing JavaScript requires:

| Function | Line | What it does |
| --- | --- | --- |
| `strModelKind` | `:39365` | the probe above, cached |
| `unitsAreBytes` | `:39382` | model 1 |
| `unitsArePoints` | `:39389` | model 2 |
| `utf8WidthOf` | `:39396` | UTF-8 width of a code point |
| `byteSliceOrUnit` | `:39407` | one character's worth from a byte offset |
| `byteSlice` | `:39414` | bytes `[i, j)` on a byte-model target |
| `cuDecodeAt` | `:39426` | code point starting at byte `i`, and its width |
| `cuLen` | `:39468` | code units in a string |
| `cuUnitAt` | `:39511` | the code unit at index `u` |
| `cuSlice` | `:39566` | code units `[a, b)` |
| `cuByteOf` | `:39663` | code-unit index → native offset |
| `cuIndexOfByte` | `:39709` | native offset → code-unit index |
| `cuFromCodePoint` | `:37464` | code point → string |

These 370-odd lines are the reason the engine gives the same answer for
`"😀".length` on Go, Python and Node. They are also called as `this.cuX(...)`
from hundreds of sites across the 45,221-line file, which is why the migration
has to be shim-first (§3).

## 2. TEXT-A: `lib/core/RgText.rgr`

### 2.1 Shape

```ranger
; lib/core/RgText.rgr
;
; UTF-16 code-unit addressing over a Ranger string, whichever of the three
; string models the target actually has. Lifted verbatim from
; ComponentEngine.rgr:39365-39744 — see PLAN_JS_STDLIB_TEXT.md.

class RgText {

    ; The probe is cached in a singleton because it costs three strlen calls
    ; and the answer cannot change during a run. This is the one piece of
    ; mutable state the core-layer rules allow, and it is idempotent.
    def modelKind:int (0 - 1)

    sfn __singleton:RgText () { ... }

    sfn kind:int ()                                  ; 0 units, 1 bytes, 2 points
    sfn unitsAreBytes:boolean ()
    sfn unitsArePoints:boolean ()

    sfn len:int (s:string)                           ; was cuLen
    sfn unitAt:int (s:string u:int)                  ; was cuUnitAt
    sfn slice:string (s:string a:int b:int)          ; was cuSlice
    sfn byteOf:int (s:string u:int)                  ; was cuByteOf
    sfn indexOfByte:int (s:string byteIdx:int)       ; was cuIndexOfByte
    sfn decodeAt:[int] (s:string i:int)              ; was cuDecodeAt
    sfn fromCodePoint:string (cp:int)                ; was cuFromCodePoint
    sfn utf8WidthOf:int (cp:int)
    sfn byteSlice:string (s:string i:int j:int)
    sfn byteSliceOrUnit:string (s:string i:int w:int)

    ; Additions the engine has never needed but a native caller immediately
    ; will. Each mirrors a JS name so it can carry a manifest row later.
    sfn codePointAt:int (s:string u:int)
    sfn codePointCount:int (s:string)
    sfn toCodeUnits:[int] (s:string)
    sfn fromCodeUnits:string (units:[int])
    sfn toUtf8Bytes:[int] (s:string)                 ; needed by RgCrypto, RgBase
    sfn fromUtf8Bytes:string (bytes:[int])
}
```

`toUtf8Bytes` / `fromUtf8Bytes` are worth calling out: they are the single
conversion every digest, every base64 encoder and every URI escape needs, and
each of those three currently does its own version of it. Landing them once in
TEXT-A is what keeps CRYPTO from adding a fourth.

### 2.2 Naming

`cuLen` → `RgText.len`. The `cu` prefix meant "code unit" when the file it lived
in also had byte and point variants in scope; on a class called `RgText` whose
documented contract is code units, the prefix is noise. The delegating shims
(§3) keep the old names alive inside `ComponentEngine`, so nothing has to be
renamed at the call sites.

## 3. Migration technique: shim first, callers later

`ComponentEngine` has hundreds of `this.cuLen(...)` calls. Rewriting them in the
same commit that moves the code makes the diff unreviewable and puts the move
and the rewrite in one basket. Instead, phase 1 replaces each body with a
one-line delegation:

```ranger
    ; Moved to lib/core/RgText.rgr. Kept as a delegate so the call sites can
    ; migrate separately; see PLAN_JS_STDLIB_TEXT.md §3.
    fn cuLen:int (s:string) {
        return (RgText.len(s))
    }
```

The gate for phase 1 is therefore strong and cheap: **the existing suites must
pass unchanged.** `npm test` and `npm run test:tsengine` are running the real
engine, on six targets, against Node's answers — over code that now lives in
`lib/core/`. If a lifted function depended on engine state that was not in its
signature, that is where it shows up, before any new caller exists.

Call sites migrate opportunistically afterwards. The shims are deleted when the
last one is gone, not before.

Note the one thing that does change: the probe cache moves from two
`ComponentEngine` fields (`utf8ModelKnown`, `utf8ModelKind`) to an `RgText`
singleton. Two engines in one process previously each probed once; now they
share. The probe is a pure function of the target, so this is a saving rather
than a semantic change — but it is the only behavioural difference in phase 1
and it belongs in the commit message.

## 4. New gate: the string-model probe test

A per-target test that does not exist today and should:

```ranger
; tests/native/js_stdlib_main.rgr, vector set "strmodel"
;   é   len=1  unitAt(0)=233     codePointCount=1
;   😀  len=2  unitAt(0)=55357   unitAt(1)=56832   codePointCount=1
;   a😀b len=4  slice(1,3)="😀"   indexOfByte(byteOf(3))=3
```

Run through leg 7.3 of the master plan: compiled to Go, Python, C#, Kotlin,
Dart, Swift, C++ and Rust, built where the toolchain exists, output compared
byte for byte against the JS run. This is the first place in the repository
where the string-model abstraction is checked *as an abstraction* rather than
implicitly through a benchmark answer.

## 5. TEXT-B: Unicode (phase 4)

### 5.1 The data files move as-is

Seven generated files, 4,222 lines, no imports, no `EvHandle` references, no
methods — pure table classes:

| File | Lines | Generator |
| --- | --- | --- |
| `UnicodeProps.rgr` | 1,683 | `gen-unicode-props.cjs` |
| `LocaleData.rgr` | 664 | `gen-locale-data.cjs` |
| `UnicodeNorm.rgr` | 599 | `gen-unicode-norm-tables.cjs` |
| `UnicodeTailor.rgr` | 395 | `gen-unicode-tailoring-tables.cjs` |
| `LocalePlural.rgr` | 390 | `gen-locale-plural.cjs` |
| `UnicodeCollate.rgr` | 260 | `gen-unicode-collation-tables.cjs` |
| `UnicodeCase.rgr` | 231 | `gen-unicode-case-tables.cjs` |

They move to `lib/core/data/` together with their generators
(`interp/migrate/tools/gen-*.cjs` → `scripts/gen-js-data/`), and each file's
`GENERATED. Do not edit by hand; regenerate with …` header is updated to the new
path. The gate is that re-running every generator reproduces the moved file
byte for byte — which also verifies the generators still work, something nothing
currently checks.

`LocaleData.rgr` and `LocalePlural.rgr` are used by INTL rather than by TEXT;
they move here because they are the same kind of artifact and want the same
regeneration gate.

### 5.2 The logic moves out of `ComponentEngine`

| Today | Line | Becomes |
| --- | --- | --- |
| `unicodeCaseConvert(s upper)` | `:37517` | `RgUnicode.toUpper(s)` / `toLower(s)`, plus a locale-aware pair for INTL |
| `normalizeString(s form)` | `:37826` | `RgUnicode.normalize(s form)`, `form` ∈ NFC/NFD/NFKC/NFKD |
| `collateStrings(a b)` | `:38195` | `RgCollate.compare(a b)` |
| `collateStringsLevels(a b levels)` | `:38203` | `RgCollate.compareLevels(a b levels)` |

These four are already almost pure — their only engine dependencies are the
`cu*` family that TEXT-A moved and the data tables that §5.1 moved, which is
exactly why TEXT-A comes first. `RgCollate` gains a locale parameter in INTL
(the tailoring tables are already there, `UnicodeTailor.rgr`); in TEXT-B it keeps
the current root-locale behaviour so the phase is a move, not a feature.

Manifest rows land at the same time, so `String.prototype.toUpperCase`,
`toLowerCase`, `normalize` and `localeCompare` become generated bindings.

## 6. TEXT-C: JSON, URI, Regex, BigInt (phase 7)

### 6.1 `RgRegex` and `RgBigInt` — the easy two

`Regex.rgr` (2,260 lines, 50 public functions) and `BigIntNum.rgr` (805 lines,
31 public functions) already have **zero** `EvHandle` references and zero
imports. They are portable, self-contained Ranger libraries sitting in a gallery
subdirectory. Phase 7 moves them to `lib/core/RgRegex.rgr` and
`lib/core/RgBigInt.rgr`, adds manifest rows for the `RegExp` and `BigInt`
namespaces, and leaves the implementations alone.

The only real work is the `RegExp` *object* semantics — `lastIndex`, the sticky
and global flags, `exec` returning an array with `index` and `groups` — which
today live in the engine because they need a JS object to hang on. The core gets
a plain result class:

```ranger
class RgRegexMatch {
    def matched:boolean false
    def index:int 0
    def groups:[string]                 ; group 0 is the whole match
    def groupStarts:[int]               ; -1 for a group that did not participate
    def namedKeys:[string]
    def namedValues:[string]
}
```

and the binding turns that into the JS array-with-properties. A native caller
gets something considerably more pleasant than JS offers.

`RgRegex` also wants `UnicodeProps.rgr` for `\p{…}`, which TEXT-B already moved.

### 6.2 `RgJson` — the one that needs a value type

`JSON.stringify` and `JSON.parse` (`:43766`–`:44600`, ≈800 lines) are the only
text APIs whose *signature* is a JS value, so they cannot simply be lifted:
`jsonSerializeValue(valueIn:EvHandle):string` is engine-typed by nature.

The core gets its own value type, deliberately small:

```ranger
class RgJsonValue {
    ; 0 null, 1 boolean, 2 number, 3 string, 4 array, 5 object
    def kind:int 0
    def boolVal:boolean false
    def numVal:double 0.0
    def strVal:string ""
    def items:[RgJsonValue]
    def keys:[string]
    def values:[RgJsonValue]
}
```

- `RgJson.parse(src:string):RgJsonResult` — carries `ok` plus a `SyntaxError`
  message and the offset, per §3.3 of the master plan. Native callers get real
  error positions, which the engine currently formats and discards.
- `RgJson.stringify(v:RgJsonValue indent:string):string`
- `RgJson.quote(s:string):string` — lifted from `jsonQuote` (`:43766`)
  unchanged; it is already pure and is the piece most likely to be wanted alone.

The binding does `EvHandle ↔ RgJsonValue` at the boundary, keeping `replacer`,
`toJSON`, `space` coercion and the cycle detection (`jsonSeenAlready`, `:44024`)
on the engine side where the callbacks live. That split is the honest one:
`replacer` can run arbitrary JavaScript, so it cannot move into a pure core.

Ranger already has `@serialize` and `lib/JSON.rgr` (5,562 lines). `RgJson` is not
a replacement for either — it is JSON as JavaScript defines it, for programs that
need to agree with a JS peer byte for byte. The relationship gets one paragraph
in `lib/core/README.md` so nobody has to guess which to reach for.

### 6.3 `RgUri` and escape/unescape

`encodeURI`, `encodeURIComponent`, `decodeURI`, `decodeURIComponent`
(`:36664`+, ≈300 lines) plus Annex B `escape`/`unescape`. Pure string
functions over the reserved sets, already written; they move to
`lib/core/RgUri.rgr` and gain `RgTextResult` returns because the decoders
throw `URIError` on a malformed sequence.

These are wanted natively far more often than the JS framing suggests — any
Ranger program building a URL needs `encodeURIComponent`, and today there is no
portable one.

## 7. Order and gates

| Phase | Lands | Gate |
| --- | --- | --- |
| 1 (TEXT-A) | `RgText` + delegating shims | `npm test` and `npm run test:tsengine` pass **unchanged**; the `strmodel` vector set matches byte for byte on every target with a toolchain |
| 4 (TEXT-B) | data files + generators moved; `RgUnicode`, `RgCollate`; `String` case/normalize/localeCompare rows | every generator reproduces its moved table byte for byte; the four `String` rows green on all three parity legs |
| 7 (TEXT-C) | `RgRegex`, `RgBigInt`, `RgJson`, `RgUri` | `RegExp`, `BigInt`, `JSON`, URI rows green; `gallery/pdf_writer/src/jsx/` imports `lib/core/` instead of carrying its own copy |

TEXT-A blocks everything. TEXT-B blocks INTL. TEXT-C blocks nothing and can slip
without holding another phase.
