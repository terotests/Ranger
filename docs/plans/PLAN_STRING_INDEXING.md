# PLAN_STRING_INDEXING — one meaning for a string index, on every target

> **Status: proposal. Nothing here is implemented.** The measurements are from
> this tree on a Linux x86-64 machine with node 22, python 3.11, php 8, go,
> g++ 13, rustc, javac/java 21, mono/mcs and kotlinc 2.0.21. Dart, Swift and
> Scala have no toolchain here and are read from the templates rather than run.

Ranger has one `string` type and one `charAt`, and they mean three different
things. The same program gives three different answers on text that is not
ASCII, and on two targets it is quadratic. Both facts are measured below.

This plan is the migration: what the end state is, how the codebase gets
there, and which questions have to be answered by experiment before the first
line changes.

## 1. What is actually wrong

### 1.1 Three models, measured

`"a—b"` (U+2014 EM DASH), compiled and run on every target that builds here:

```ranger
def s:string "a—b"
print ("strlen " + (to_string (strlen s)))
; …then charAt over 0..strlen, and (substring s 1 2)
```

| Targets | `strlen` | `charAt` codes | `substring s 1 2` | Unit |
| --- | --- | --- | --- | --- |
| JavaScript, Java, Kotlin, C#, Dart, Swift | 3 | 97 8212 98 | `—` | UTF-16 code unit |
| Python, Rust, Go | 3 | 97 8212 98 | `—` | Unicode code point |
| C++, PHP | 5 | 97 226 128 148 98 | one byte of the dash | UTF-8 byte |

The first two rows agree here and disagree above the Basic Multilingual
Plane: an emoji is one code point and two UTF-16 units. The third row
disagrees with both as soon as the text leaves ASCII.

Each target is internally consistent — `strlen`, `charAt` and `substring`
index the same unit as each other — and that is deliberate. From the
`substring` template in `compiler/Lang.rgr`:

> An index means the same thing to all three of `strlen`, `charAt` and
> `substring`, or a scan followed by a slice lands in the wrong place.

So the bug is not inside any one target. It is that the *language* never said
which unit it means, and each writer picked the one its host string could
index in constant time.

### 1.2 The library already works around it

`lib/evg/EVGCodepoint.rgr` exists because of this. Its own header:

> `charAt` returns a UTF-16 code unit. Everything outside the Basic
> Multilingual Plane — emoji, CJK extensions, historic scripts, most maths
> symbols — is stored as a SURROGATE PAIR of two units, so a loop written with
> `charAt` sees one character as two, and neither half is a real codepoint.

and, to tell the models apart, it asks the runtime:

```ranger
sfn stringIsBytes:boolean () {
    return ((strlen "ä") > 1)
}
```

A library probing the language at runtime to find out what an index means is
the clearest statement of the defect available. It works — `codeAt` is correct
on all three models — and 36 files depend on it. It is also not something the
rest of the codebase knows exists.

### 1.3 Indexing is O(n) on Rust and Go

`charAt` on a `string` lowers to:

| Target | Lowering | Cost |
| --- | --- | --- |
| C++ | `((unsigned char)s.at(i))` | O(1) |
| PHP | `ord(s[i])` | O(1) |
| JavaScript | `s.charCodeAt(i)` | O(1) |
| Java / Kotlin / C# / Dart | `s.charAt(i)` / `s[i].code` / `s[i]` / `s.codeUnitAt(i)` | O(1) |
| Swift | `r_char_at(s, i)` over `s.utf16` | O(1) amortised |
| **Rust** | **`s.chars().nth(i)`** | **O(n)** |
| **Go** | **`int64([]rune(s)[i])`** | **O(n), and one allocation per read** |

`strlen` and `substring` are the same story on those two: `s.chars().count()`,
`s.chars().skip(a).take(b - a)`.

A scan is therefore quadratic. The same Ranger program, four input sizes,
counting delimiters in a joined string:

| n | Rust | C++ |
| --- | --- | --- |
| 15 000 | 141 ms | 1 ms |
| 30 000 | 555 ms | 2 ms |
| 60 000 | 2 220 ms | 5 ms |
| 120 000 | 8 806 ms | 10 ms |

Rust's time multiplies by 3.9–4.0 per doubling; C++'s by 2. In
`gallery/friendly/bench` this is 2 178 ms of Rust's 2 556 ms total and
143 182 ms of Go's 143 882 ms. Rust without that one kernel is 378 ms, second
only to C++.

Swift had exactly this bug and it is already fixed — the `r_strlen` polyfill
comment records the cost: *"parsing a 28 KB stylesheet walked 1.25 BILLION
characters where Kotlin read 84 000."* The fix there was to move off Swift's
grapheme-cluster view and onto `utf16`. Rust and Go have no equivalent view to
move to, which is what makes this a language question rather than a template
fix.

### 1.4 Why the two defects are one decision

A uniform unit and O(1) indexing cannot both hold for a UTF-8 or UTF-16
string:

| If the portable unit is… | O(1) on | O(n) on |
| --- | --- | --- |
| UTF-8 byte | C++, PHP, (Rust, Go) | JavaScript, Java, Kotlin, C#, Dart, Swift, Python |
| UTF-16 code unit | JavaScript, Java, Kotlin, C#, Dart, Swift | Rust, Go, Python, C++, PHP |
| Unicode code point | Python | everyone else |

There is no unit that is free everywhere. Picking any one of them makes the
other targets decode on every access — which is precisely the Rust/Go
behaviour this plan is trying to remove, spread to more targets.

The way out is that **materialising an indexable sequence is the only form
that is both uniform and O(1)**, and the only open question is who
materialises it. A compiler that hoists it behind the program's back hides an
allocation and only fires where an analysis recognises the shape. A program
that names it pays the same cost, once, in the open.

## 2. The end state

### 2.1 `string` is text, not an array

A `string` is an opaque sequence of text. `strlen`, `charAt` and `substring`
on one remain **the target's own unit** — that is what makes them O(1) — and
are documented as such. They are correct for ASCII, which is what a scanner
over source code, JSON, CSS or a wire protocol actually needs, and they are
not portable for anything else.

### 2.2 `to_chars` is the portable indexable view

```ranger
def cs:[int] (to_chars s)      ; Unicode code points, one meaning everywhere
def n:int    (array_length cs)
def i:int 0
while (i < n) {
    def c:int (itemAt cs i)
    …
}
```

| Target | `to_chars` |
| --- | --- |
| JavaScript / TypeScript | `Array.from(s, c => c.codePointAt(0))` |
| Python | `[ord(c) for c in s]` |
| Java | `s.codePoints().toArray()` |
| Kotlin | `s.codePoints().toArray()` |
| C# | `s.EnumerateRunes()` → `int[]` |
| Dart | `s.runes.toList()` |
| Swift | `s.unicodeScalars.map { Int($0.value) }` |
| Rust | `s.chars().map(\|c\| c as i64).collect::<Vec<i64>>()` |
| Go | `[]rune(s)` → `[]int64` |
| C++ | UTF-8 decode into `std::vector<int>` |
| PHP | `array_map('mb_ord', preg_split('//u', …))` |
| Scala | `s.codePoints().toArray` |

O(n) once, O(1) per access, identical answers on every target including above
the BMP. This is the tool `EVGCodepoint` has been hand-rolling.

### 2.3 `to_charbuffer` is the byte view, and is currently wrong

`to_charbuffer` already exists and is already the explicit-conversion shape.
Its unit is not uniform:

| Target | Produces |
| --- | --- |
| Rust, Go, C++, Java, C#, Swift, PHP | UTF-8 bytes |
| Kotlin, Dart | UTF-16 code units |
| Python | the string itself (code points) |
| Scala | `toCharArray.map(_.toByte)` — **lossy above U+00FF** |

It should be UTF-8 bytes everywhere. Only 9 `charbuffer` declarations and 21
`to_charbuffer` calls exist in the repository, so this is a small, contained
correction and a good first commit.

### 2.4 Rust and Go index their own unit

Once §2.1 says the unit is the target's own, Rust and Go should use the unit
their string actually is — the UTF-8 byte — and become O(1) like C++ and PHP:

| | today | proposed |
| --- | --- | --- |
| `strlen` | `s.chars().count()` | `s.len()` |
| `charAt` | `s.chars().nth(i)` | `s.as_bytes()[i]` |
| `substring` | `s.chars().skip(a).take(b-a)` | a byte slice |

That removes the quadratic behaviour entirely, on both targets, with no
analysis and no hidden temporary — and it makes `EVGCodepoint.stringIsBytes()`
answer `true` there, which sends it down the UTF-8 path it already has and
already tests.

**This is the step with the sharp edge, and §4.1 is the experiment that
decides it.**

## 3. Migration

The surface, counted in this tree:

| | `charAt` | `substring` | `strlen` |
| --- | --- | --- | --- |
| `compiler/` | 291 | 256 | 1 324 |
| `lib/` | 222 | 256 | 658 |
| `gallery/` | 2 135 | 3 376 | 9 141 |

Almost all of it is on a `string`: the whole repository holds 9 `charbuffer`
declarations. 176 files contain a `while (… < (strlen …))` scan.

Most of those call sites do **not** need to change. A scanner whose structure
is ASCII — every parser in `compiler/`, every JSON and CSS reader — is correct
today and stays correct. What has to change is the code that walks text a
human wrote, and that is a much smaller set which §3.3 identifies by tooling
rather than by reading.

### Stage 0 — make the defect visible and testable

- `tests/fixtures/string_units.rgr`: the `"a—b"` probe of §1.1, plus an
  astral case (`"a😀b"`), asserted per target. It fails today by design and is
  the gate every later stage is measured against.
- `gallery/friendly/bench/strscan.rgr`: the O(n²) probe of §1.3 as a committed
  benchmark, so the Rust and Go numbers move in a file rather than in a chat.
- Write the three models into `docs/site` where the `string` type is
  documented. The present documentation does not mention that an index has a
  different meaning per target.

*Gate: the new tests run and fail for the reasons stated.*

### Stage 1 — `to_charbuffer` becomes UTF-8 bytes everywhere

Fix Kotlin, Dart and Scala. 21 call sites, 9 declarations; Scala's is a
correctness fix regardless of the rest of this plan.

*Gate: the full suite, the eight self-host checks, `gallery/friendly`.*

### Stage 2 — `to_chars` exists

Add the operator of §2.2 on all thirteen targets, with `string_units.rgr`
extended to assert that `to_chars` gives the same answer everywhere including
the astral case. Nothing migrates yet.

*Gate: `string_units.rgr` passes on `to_chars` on every runnable target while
still failing on raw `charAt`, which is the point.*

### Stage 3 — `EVGCodepoint` moves onto `to_chars`

The 36 files that use it do not change. `codeAt`, `utf8CodeAt`, `unitsAt` and
`stringIsBytes` collapse into `to_chars`, and EVG text measurement stops being
quadratic on Rust and Go. This is the proof that the new primitive can carry
the hardest existing consumer, on a module that already has tests.

*Gate: the EVG suites, plus the emoji cases EVGCodepoint's header names —
`"a😀b"` measures as one glyph, the JSON display list is UTF-8 and not CESU-8.*

### Stage 4 — Rust and Go index bytes

§2.4, gated by the §4.1 experiment. The self-host is the test: the compiler's
own parser scans `Lang.rgr`, which contains em dashes, and the C++ rendering
already does byte indexing, so C++ and Rust should agree afterwards where they
differ today.

*Gate: `scripts/rust-selfhost-check.sh` at 0, `selfhost:check:go`, both
renderings of the compiler producing byte-identical output to the node build,
and the §1.3 benchmark linear.*

### Stage 5 — migrate the text walkers

Not all 2 648 sites: the ones that can see non-ASCII. Found by tooling, not by
reading — §3.3.

*Gate: `gallery/friendly`'s cross-target diff, extended with a study whose
input is not ASCII.*

### 3.3 Finding the call sites that matter

A `charAt` is at risk when the string it indexes can hold non-ASCII **and**
the result is compared against something other than an ASCII literal, or the
index is carried into a `substring`. That is a dataflow question the compiler
can already answer: `StaticAnalyzer` walks every function body and
`RangerAppParamDesc` already records where a value came from.

So Stage 5 starts with a **diagnostic pass**, not an edit: a
`-strict-strings` flag that prints every `charAt`/`substring` whose subject is
not provably ASCII, the way `-strict-ownership` prints sharing verdicts. The
list it produces is the migration, and it is checkable, reviewable and
countable before anyone edits a file.

## 4. Open questions, and the experiment that settles each

### 4.1 Can Rust take a byte `substring`?

`std::string` is a byte bag; a C++ `substr` that cuts a multi-byte character
yields a piece that concatenates back. The `substring` template's comment says
the compiler's own string parser relies on that. A Rust `String` cannot hold
invalid UTF-8, so the same slice has to go through `from_utf8_lossy` and comes
back as U+FFFD — it does not reassemble.

**Experiment:** instrument the C++ self-host build to log every `substring`
whose start or end falls inside a multi-byte sequence, and run it over the
compiler's own sources and the gallery. If the count is zero — which it should
be, since every delimiter a scanner slices at is ASCII, and an ASCII byte is
always a character boundary in UTF-8 — Stage 4 is safe and Rust can slice
bytes directly. If it is not zero, Stage 4 needs Rust's string to be
byte-backed, which is a much larger change and should be reconsidered against
keeping `chars()` plus the Stage 5 migration.

**This experiment runs before Stage 1**, because its answer changes the shape
of the plan.

### 4.2 Does `to_chars` cost the fast targets anything that matters?

On JavaScript and Java a `charAt` scan allocates nothing today. Migrating one
to `to_chars` allocates an array. For source-file inputs that is noise; for a
hot loop it may not be.

**Experiment:** add a `to_chars` variant of the `strings` kernel to
`gallery/friendly/bench` and compare on all nine runnable targets. If the cost
is material on the fast targets, Stage 5 keeps raw `charAt` for provably-ASCII
scans — which §3.3's pass already identifies — and migrates only the rest.

### 4.3 Code points or UTF-16 units for `to_chars`?

Code points are proposed. Six targets are natively UTF-16 and would pay a
conversion; three are natively code-point and would not. The argument for code
points is that `EVGCodepoint` was written because UTF-16 units are the wrong
unit for text — surrogate halves are not characters — and that module is the
codebase's most considered opinion on the question.

**Decision, not experiment.** It should be made before Stage 2 and written
into the type's documentation.

### 4.4 What happens to `charAt` on a `string` in the long run?

This plan keeps it, target-specific and documented. The alternative is to
remove it from the portable surface and make `to_chars` or `to_charbuffer`
mandatory, which is a larger break and can be decided after Stage 5 shows how
many sites were genuinely at risk.

## 5. Sizing

Stages 0–2 are small and independent: new tests, one operator, one correction
to three templates. Stage 3 is a module rewrite with existing tests. Stage 4
is three templates and a self-host, gated by §4.1. Stage 5 is the long tail,
and the diagnostic pass of §3.3 turns it from "read 2 648 call sites" into a
list.

The order matters more than the speed. Stages 0–3 leave the codebase strictly
better with no behaviour change to existing programs; Stage 4 is the one that
changes what existing Rust and Go programs do, and it should not start until
§4.1 has an answer.
