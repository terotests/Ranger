# PLAN_JS_STDLIB — Date and Intl

Sub-plan of [PLAN_JS_STDLIB.md](PLAN_JS_STDLIB.md). Covers phases **3 (Date)**
and **5 (Intl)**. Intl depends on Date (`DateTimeFormat` formats a time value)
and on phases 1 and 4 of [TEXT](PLAN_JS_STDLIB_TEXT.md) (`RgStr`, `RgUnicode`,
`RgCollate`, and the CLDR tables).

These two together are the largest concrete payoff in the whole plan. Ranger has
no portable date arithmetic and no locale-aware formatting of anything — while
the engine has 604 lines of ES5 time algebra and ≈1,200 lines of ECMA-402 over
39 locales of CLDR data, all of it already compiling to every target.

---

## Part I — Date (phase 3)

## 1. What exists

`interp/migrate/src/DateTime.rgr`, 604 lines, one class, **no imports and no
`EvHandle` references**. Its header states the contract:

> Everything here is pure arithmetic on doubles. Integer division is not used:
> the spec's `floor()` and `modulo()` are both defined over the reals and differ
> from C truncation for negative values — which is precisely the range that
> covers every date before 1970.

The surface is the whole of ECMA-262 §15.9.1 written out:

| Group | Functions |
| --- | --- |
| primitives | `isFiniteD`, `nanD`, `floorD`, `modD`, `truncD`, `msPerDay` |
| decomposition | `dayOf`, `timeWithinDay`, `yearFromTime`, `monthFromTime`, `dateFromTime`, `weekDay`, `hourFromTime`, `minFromTime`, `secFromTime`, `msFromTime`, `dayWithinYear`, `monthStartDay` |
| calendar | `isLeapYear`, `daysInYear`, `dayFromYear`, `timeFromYear` |
| construction | `makeTime`, `makeDay`, `makeDate`, `timeClip` |
| formatting | `dateString`, `timeString`, `toDateString`, `toTimeString`, `toFullString`, `toUTCString`, `toISOString`, `weekDayName`, `monthName`, `pad2`, `pad3`, `pad4` |
| parsing | `parseISO`, `isDigitAt`, `digitsAt`, `charIs` |

So phase 3 is a move plus a clock, not an implementation.

## 2. `lib/js/core/RgDate.rgr`

`DateTime.rgr` moves as `RgDate`, with three changes.

**A `RgDateParts` carrier**, so a native caller can decompose once instead of
calling seven accessors that each redo the division:

```ranger
class RgDateParts {
    def year:int 0
    def month:int 0        ; 0-11, as JS numbers them
    def day:int 1          ; 1-31
    def weekday:int 0      ; 0 = Sunday
    def hour:int 0
    def minute:int 0
    def second:int 0
    def ms:int 0
}
```

with `RgDate.partsOf(t:double):RgDateParts` and
`RgDate.timeOfParts(p:RgDateParts):double`.

**`parse` alongside `parseISO`.** `Date.parse` accepts more than ISO-8601 — the
`toUTCString` and `toFullString` forms have to round-trip, because JS guarantees
`Date.parse(d.toString())` works. `parseISO` stays as the strict entry point;
`RgDate.parse` tries ISO first, then the two string forms this file itself emits.
That is a small feature, and it is a real gap: `Date.parse("Tue, 05 Aug 2025
12:00:00 GMT")` currently fails.

**Explicit local-vs-UTC pairs.** Today local time *is* UTC, so `hourFromTime` is
both. With `RgClock.localOffsetMinutes()` (§3) the distinction becomes real, so
each accessor gets a UTC and a local form and the local one is the UTC one
applied to `t + offset*60000`. Default offset is 0, which reproduces today's
behaviour exactly.

## 3. `RgClock` — the clock capability

`RgDate` never reads a clock. `RgClock` does, and the engine's existing design
is the right one to copy: `ComponentEngine` holds `hostNowMs` (`:1145`), frozen
at `0.0` by default, with a `liveClock` flag (`:1612`) that switches it to the
`wall_clock_ms` operator. Frozen-by-default is what makes conformance runs
reproducible, and it should stay the default in the library too.

```ranger
; lib/js/capability/RgClock.rgr
class RgClock {
    def frozenMs:double 0.0
    def live:boolean false

    sfn __singleton:RgClock ()
    sfn nowMs:double ()                 ; frozenMs, or wall_clock_ms when live
    sfn monotonicMs:double ()           ; for performance.now; never decreases
    sfn localOffsetMinutes:int ()       ; minutes to ADD to UTC for local time
    sfn setFrozen:void (ms:double)
    sfn setLive:void (on:boolean)
}
```

### 3.1 Operators to add to `compiler/Lang.rgr`

`wall_clock_ms` already exists at `:2552` — es6, C++, Rust, Go, Python, C#,
Kotlin, Java 7, and `*` → `0.0`. Its comment explains why it is a `double` and
not an integer millisecond count (integer casts pin Octane scores to a few
buckets), and that reasoning applies unchanged to the two new ones.

**`monotonic_ms:double ()`** — a clock that cannot go backwards, which
`wall_clock_ms` can when the system clock is adjusted. `performance.now` is
specified as monotonic and the engine currently answers it from the same source
as `Date.now` (`:23075`), so this closes a real if minor conformance gap.
Templates: es6 `performance.now()`; C++ `steady_clock`; Rust `Instant`; Go
`time.Since` against a process-start anchor; Python `time.monotonic()`; C#
`Stopwatch`; Kotlin/Java `System.nanoTime()`; Dart `Stopwatch`; Swift
`DispatchTime.now().uptimeNanoseconds`. `*` → `wall_clock_ms`, which is a
degradation but a safe one.

**`local_tz_offset_min:int ()`** — es6
`(-(new Date()).getTimezoneOffset())`; Go `time.Now().Zone()`; Python
`datetime.now().astimezone().utcoffset()`; C# `TimeZoneInfo.Local.GetUtcOffset`;
Kotlin/Java `TimeZone.getDefault().getOffset`; Dart
`DateTime.now().timeZoneOffset`; Swift `TimeZone.current.secondsFromGMT`; C++
`localtime_r` vs `gmtime_r`; Rust — no std API, so `*` → `0`.

`*` → `0` is the important part: it *is* today's documented behaviour, so a
target without the operator behaves exactly as the engine does now rather than
producing a new kind of wrong.

## 4. The engine side of Date

`Date` is a constructor with a prototype, not a namespace of statics, so its
manifest entries use `"receiver": "date"` and the generator emits prototype
bindings. The engine keeps what genuinely belongs to it: the `Date` object's
brand and identity, the `[[DateValue]]` slot, `valueOf`/`toPrimitive` hooks, and
the 7-argument constructor overloading (`builtinCtorArity` gives `Date` 7).
Everything numeric goes to `RgDate`.

`Date.now()` reads `RgClock` instead of `hostNowMs`, and the engine's existing
`liveClock` flag becomes a call to `RgClock.setLive`. That keeps the Octane
benchmark path (`interp/bench/zoo_octane/`) working, which is the one consumer
that needs the clock to advance.

`Date.prototype.toLocaleDateString` / `toLocaleTimeString` /
`toLocaleString` stay stubbed until phase 5; the comment at `:27507` already
records that the spec defines them as `Intl.DateTimeFormat`.

---

## Part II — Intl (phase 5)

## 5. What exists

Roughly 1,200 lines in `ComponentEngine.rgr` from ≈`:38230`, plus the
constructors reached from `invokeBuiltinStatic` (`:22543`–`:22554`), plus the
data. Five constructors are implemented: `Collator`, `NumberFormat`,
`DateTimeFormat`, `PluralRules`, `ListFormat`, along with
`getCanonicalLocales` and `supportedLocalesOf`.

The header comment states the coverage honestly, and it is worth preserving
verbatim in the moved file:

> The CLDR data is in LocaleData.rgr (generated) for 39 locales; anything else
> falls back to "en" **AND SAYS SO** through `resolvedOptions().locale`, so a
> program can tell it did not get what it asked for.

The data is five tables in `LocaleData.rgr` (664 lines: tags, number symbols,
number ints, month/day names, date patterns, currency data) plus
`LocalePlural.rgr` (390 lines) plus `UnicodeTailor.rgr` (395 lines of per-locale
collation tailoring).

Crucially, the *logic* is already nearly pure. `intlGroupInteger`,
`localeIndexOf`, `canonicalizeLocaleTag` and their neighbours are `string`/`int`
functions over the tables; their only non-pure dependencies are
`this.unicodeCaseConvert`, `this.cuSlice`, `this.cuLen` and `this.cuUnitAt` —
all four of which phases 1 and 4 have already moved. That is why Intl is late in
the ordering and cheap once it arrives.

The `EvHandle`-shaped parts are the entry points only: `intlRequestedTag`
(reads a JS array or string), `intlFirstTag`, `constructIntl`, and the option-bag
reads.

## 6. Options are a bag of strings, not a JS object

The one design decision this phase needs. `new Intl.NumberFormat("de-DE",
{ style: "currency", currency: "EUR", minimumFractionDigits: 2 })` takes an
arbitrary JS object; a pure core cannot.

```ranger
class RgIntlOptions {
    def keys:[string]
    def values:[string]                  ; everything as its string form
    sfn create:RgIntlOptions ()
    fn set:RgIntlOptions (k:string v:string)      ; returns this, so it chains
    fn setInt:RgIntlOptions (k:string v:int)
    fn get:string (k:string fallback:string)
    fn getInt:int (k:string fallback:int)
    fn has:boolean (k:string)
}
```

Every option ECMA-402 defines is either an enumerated string or a small integer,
so a string bag loses nothing. The binding walks the JS object once, in spec
order, applying `GetOption`'s coercion and its `RangeError`s — that part must stay
in the engine, because reading a property can run a getter. The core receives a
settled bag.

Native callers get something readable:

```ranger
def opts:RgIntlOptions (RgIntlOptions.create())
opts.set("style" "currency")
opts.set("currency" "EUR")
def nf:RgIntlNumberFormat (RgIntlNumberFormat.create("de-DE" opts))
def text:string (nf.format(1234.5))        ; "1.234,50 €"
```

## 7. `lib/js/core/RgIntl.rgr`

Instances, because each of these is an object that resolves its options once and
is then used many times — which is the entire reason `Intl.Collator` exists as an
object rather than a function.

```ranger
class RgIntlLocale {
    sfn canonicalize:string (tag:string)          ; §6.2.3, was canonicalizeLocaleTag
    sfn indexOf:int (tag:string)                  ; was localeIndexOf; 0 = "en"
    sfn isSupported:boolean (tag:string)
    sfn supportedOf:[string] (tags:[string])
}

class RgIntlCollator {
    sfn create:RgIntlCollator (locale:string opts:RgIntlOptions)
    fn compare:int (a:string b:string)
    fn resolvedLocale:string ()                   ; the tag actually used
    fn resolvedOption:string (k:string)
}

class RgIntlNumberFormat {
    sfn create:RgIntlNumberFormat (locale:string opts:RgIntlOptions)
    fn format:string (v:double)
    fn formatParts:[string] ()                    ; type/value pairs, flattened
    fn resolvedLocale:string ()
    fn resolvedOption:string (k:string)
}

class RgIntlDateTimeFormat {
    sfn create:RgIntlDateTimeFormat (locale:string opts:RgIntlOptions)
    fn format:string (t:double)                   ; a time value, per RgDate
    fn formatParts:[string] ()
    fn resolvedLocale:string ()
}

class RgIntlPluralRules {
    sfn create:RgIntlPluralRules (locale:string opts:RgIntlOptions)
    fn select:string (v:double)                   ; zero|one|two|few|many|other
}

class RgIntlListFormat {
    sfn create:RgIntlListFormat (locale:string opts:RgIntlOptions)
    fn format:string (xs:[string])                ; "a, b and c" / "a, b und c"
}
```

`resolvedLocale` is not decoration. The 39-locale fallback means a program
asking for `sv-FI` gets `sv` or `en`, and the only way to know which is to ask.
Keeping that on the native API is what stops native callers from being *more*
misled than JS ones.

## 8. `toLocaleString` delegation

Once `RgIntl` exists, five prototype methods that are currently either stubbed or
special-cased become one-line delegations, which is where a good part of the
phase's value lands:

| Method | Delegates to |
| --- | --- |
| `Number.prototype.toLocaleString` | `RgIntlNumberFormat` (the comment at `:31964` already says so) |
| `Date.prototype.toLocaleString` | `RgIntlDateTimeFormat` with date+time components |
| `Date.prototype.toLocaleDateString` | `RgIntlDateTimeFormat`, date components |
| `Date.prototype.toLocaleTimeString` | `RgIntlDateTimeFormat`, time components |
| `String.prototype.localeCompare` | `RgIntlCollator` (already real collation via `collateStrings`, `:38195`) |
| `Array.prototype.toLocaleString` | element-wise `toLocaleString` |

## 9. Time zones — the deliberate gap, and what would close it

`DateTime.rgr`'s header records the choice:

> The one deliberate simplification is the LOCAL TIME ZONE: this engine has no
> time-zone database and no host clock beyond a caller-supplied "now", so local
> time is UTC. `getTimezoneOffset()` is therefore 0 and `getHours()` agrees with
> `getUTCHours()`. That is a legal-but-boring choice of host time zone rather
> than a wrong answer.

Phase 3 improves this from "always UTC" to "whatever fixed offset the host
reports", which covers `new Date().getHours()` correctly for the current moment
and still gets historical and DST-crossing dates wrong.

Closing it properly needs an IANA `tzdata` table — zone names, transition times,
DST rules — which is a generated data file in the same family as
`UnicodeProps.rgr` (1,683 lines) and roughly that size for a useful subset. It is
**out of scope** here, and the reason to say so explicitly is that
`Intl.DateTimeFormat`'s `timeZone` option is the natural place someone will
expect it. Until it exists, that option is accepted only as `"UTC"` and anything
else is a `RangeError`, which is what the spec requires for an unsupported zone —
a documented refusal rather than a silent wrong answer.

If it is ever wanted: `scripts/gen-js-data/gen-tzdata.cjs` producing
`lib/js/data/TzData.rgr`, plus `RgDate` gaining a zone-aware offset lookup. One
new data file, one new generator, no change to any signature in this plan.

## 10. Gates

**Phase 3 (Date)**
1. Every `Date` manifest row green on native-vs-engine-vs-Node, including the
   pre-1970 range the `floorD`/`modD` comment exists for.
2. `Date.parse(d.toString())` round-trips for all three string forms.
3. `performance.now` non-decreasing across 10,000 calls with the live clock, on
   every target with a toolchain.
4. With the frozen clock, `test:tsengine` output is byte-identical to before.

**Phase 5 (Intl)**
1. All five constructors' rows green.
2. A 39-locale sweep: `NumberFormat.format` over a fixed number set, and
   `DateTimeFormat.format` over a fixed time set, for every carried locale,
   compared against Node — Node has full ICU, so any locale where the 39-locale
   table is *right* must match exactly, and any locale where it is a documented
   approximation must be listed as such, in the `KNOWN_GAPS` style
   `CONFORMANCE.md` already uses.
3. The same sweep byte-identical across every target, which is what proves the
   CLDR tables and the collation weights survive compilation. This is the single
   most valuable vector set in the plan: it is 39 locales × two formatters ×
   ten languages, and nothing in the repository checks any of it today.
4. `resolvedOptions().locale` reports the fallback wherever one happened.
