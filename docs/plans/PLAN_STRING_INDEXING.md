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
| Rust, Go, C++, C#, Swift 3, PHP | UTF-8 bytes |
| Java | UTF-8 bytes, but via the **platform default charset** |
| JavaScript, Kotlin, Dart | UTF-16 code units |
| Python | the string itself (code points) |
| Swift 6 | the string itself — the template was never written |
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

### Stage 1 — a `charbuffer` is bytes, and `to_charbuffer` is UTF-8 — **done**

Measured rather than read this time: `tests/fixtures/charbuffer_units.rgr`
runs the same `"a—b"` through `to_charbuffer`, `length`, `charAt`,
`substring` and `to_string` on every target with a toolchain here, and
`tests/charbuffer-units.test.ts` asserts they agree. That found more than the
table above: **JavaScript** was UTF-16 as well (a charbuffer was the string
itself), `to_string` on a charbuffer did not compile at all on Rust, Java and
Kotlin because the fallback passed the buffer through where a string was
wanted, and `charAt` on one returned a *signed* byte on Java, Kotlin and
Scala.

What changed:

- `charbuffer` is a buffer of BYTES on all thirteen targets. Its type is now
  `Uint8Array` on JavaScript and TypeScript, `bytes` on Python and
  `ByteArray` on Kotlin; the others already held bytes. One element is one
  octet, 0..255, and not one character — UTF-8 is a property of
  `to_charbuffer` and `to_string`, the two operators that cross between text
  and bytes, and not of the buffer, which is equally the type a JPEG arrives
  in. The contract is written out above the charbuffer overloads in
  `compiler/Lang.rgr`, where a reader reaching for `charAt` on one will meet
  it.
- `to_charbuffer` encodes UTF-8 explicitly — including Java, which used the
  platform default charset, and Scala, whose `toByte` cast truncated anything
  above U+00FF.
- `to_string` / `toString` on a charbuffer decodes UTF-8 on every target
  rather than falling through to a passthrough that did not typecheck.
- `charAt` on a charbuffer masks with `0xFF` on the JVM targets, so the
  answer is the 0..255 the operator is declared to return rather than a
  negative number above U+007F.
- `substring` on a charbuffer decodes UTF-8 rather than reading the bytes as
  code units (Dart, Scala, Java, Kotlin) or as a string method that does not
  exist on a byte array (JavaScript, Python).

Nine targets now print the same five bytes for `"a—b"`. The compiler's own
parser holds its source in a charbuffer, so this also means the JavaScript
self-host scans the same bytes the C++ one does; the JavaScript compile is
unchanged in speed (9.2 s against 9.7 s before), because one `TextDecoder` for
the process costs less than the slicing it replaces.

*Gate: the full suite, the self-host checks on cpp, go, python, csharp, java,
kotlin and rust, `gallery/friendly`. Dart, Swift and Scala have no toolchain
here and are read from the generated source.*

### Stage 2 — `to_chars` exists — **done**

The operator of §2.2 on all thirteen targets, and `string_units.rgr` extended
with two more lines per input so the same fixture now prints both views:
the target's own unit, which disagrees, and `to_chars`, which does not.

| | `strlen` | `to_chars` |
| --- | --- | --- |
| `"a—b"` | 3 on nine targets, 5 on two | 3 everywhere |
| `"a😀b"` | 4, 3 or 6 depending on the target | 3 everywhere |

Six targets get it from the host — `Array.from` walks code points on
JavaScript, a Python `str` and a Rust `char` and a Go `rune` already are code
points, Dart has `runes` and Swift has `unicodeScalars`. Java, Kotlin, Scala
and C# fold surrogate pairs back into the one code point they encode, PHP
uses `mb_ord` over a `//u` split, and C++ decodes the UTF-8 itself.

`tests/string-units.test.ts` now has both halves: `to_chars` must agree
across every target that ran, and `strlen` must still disagree — the second
assertion is what makes the first mean something.

*Gate: string-units on nine targets, the self-host checks on cpp, go, python,
csharp, java, kotlin and rust, rust-selfhost-check at 0, `gallery/friendly`.
Dart, Scala, Swift 3 and Swift 6 were read from the generated source.*

### Stage 3 — `EVGCodepoint` moves onto `to_chars`

The 36 files that use it do not change. `codeAt`, `utf8CodeAt`, `unitsAt` and
`stringIsBytes` collapse into `to_chars`, and EVG text measurement stops being
quadratic on Rust and Go. This is the proof that the new primitive can carry
the hardest existing consumer, on a module that already has tests.

*Gate: the EVG suites, plus the emoji cases EVGCodepoint's header names —
`"a😀b"` measures as one glyph, the JSON display list is UTF-8 and not CESU-8.*

### Stage 4 — Rust and Go index bytes — **done**

§2.4, gated by §4.1 (answered: zero cuts in 78 012 slices).

`strlen`, `charAt` and `substring` on Rust and Go are now the UTF-8 byte
their string is actually made of. Both had been the character, which cost
them the quadratic scan of §1.3 — and, it turned out, correctness as well.

**Go was losing text.** `indexOf` is `strings.Index` and answers a BYTE
offset, while `charAt`, `strlen` and `substring` counted runes, so a scanner
that found a delimiter and sliced at it sliced in the wrong place the moment
anything non-ASCII stood before it. For `"ä,b"`:

| | `indexOf` | `strlen` | head | tail |
| --- | --- | --- | --- | --- |
| Go, before | 2 | 3 | `ä,` | *(empty)* |
| Go, after | 2 | 4 | `ä` | `b` |

The tail — the rest of the document — was dropped without a word. Rust had
the same bug and had papered over it: `rg_index_of` converted the byte offset
to a character offset with `s[..b].chars().count()`, an O(n) pass on every
call, and the comment in `compiler/RustClass.rgr` records the symptom that
paid for it — an OOXML parser reading a slide with an umlaut in it "sliced
the rest of the document one byte short per accent and dropped every shape
after the first". Making the unit the byte removes the bug and the
workaround. Rust's `charcode` had read `as_bytes()[0]` all along, so it
disagreed with Rust's own `charAt`; now it does not.

All nine runnable targets are internally consistent, in two families:

| | `indexOf` | `strlen` | `charAt` at that index | `charcode` |
| --- | --- | --- | --- | --- |
| C++, PHP, **Rust**, **Go** | 2 | 4 | 44 | 195 |
| JavaScript, Python, Java, C#, Kotlin | 1 | 3 | 44 | 228 |

The speed, from `gallery/friendly/bench/strscan.rgr`:

| n | Rust before | Rust after | Go before | Go after |
| --- | --- | --- | --- | --- |
| 15 000 | 143 ms | 1 ms | 6 906 ms | 1 ms |
| 30 000 | 564 ms | 2 ms | 27 877 ms | 8 ms |
| 60 000 | 2 250 ms | 5 ms | over 120 s | 5 ms |
| 120 000 | 8 830 ms | 11 ms | over 120 s | 19 ms |

Rust is C++ to the millisecond.

**What the self-host then found.** A compiler whose own strings are bytes was
writing every non-ASCII string literal into its output TWICE encoded: the
C++ self-host emitted `"a—b"` as `C3 A2 C2 80 C2 94` instead of `E2 80 94`.
`EncodeString` rebuilt each character with `strfromcode`, which writes a CODE
POINT, from what `charAt` gave it, which on a byte host is a byte. This was
already true of C++ and PHP and had never been noticed; Stage 4 would have
extended it to Rust and Go. The same bug is recorded in `TARGET_NOTES.md`
against the LLVM writer.

The fix is one line in each of the six `EncodeString` copies and in
`DictNode`: copy the unit with a one-unit `substring` instead of rebuilding
it from its code. That carries whatever the unit is across unchanged, on
every host. Afterwards the C++ and Go self-hosts each produce output
**byte-identical** to the node-hosted compiler's for the same input, which is
the strongest check available here.

*Gate: npm test, the self-host checks on cpp, go, python, csharp, java,
kotlin and rust, `gallery/friendly` (12 studies, 8 targets agreeing), and the
C++ and Go self-hosts built, run, and diffed against the node host. The Rust
self-host compiles to 0 errors but panics at startup on any input — it did so
before this change too, so it is a pre-existing limitation and not a check
this stage could use.*

*Gate: `scripts/rust-selfhost-check.sh` at 0, `selfhost:check:go`, both
renderings of the compiler producing byte-identical output to the node build,
and the §1.3 benchmark linear.*

### Stage 5 — the pass that turns the migration into a list — **done, and the list is empty**

Not all 2 648 sites: the ones that can see non-ASCII. Found by tooling, not by
reading — §3.3.

`-strict-strings` exists and prints them. It walks every method body, finds
each `charAt`, `substring` and `charcode` whose subject is a `string`, and
reports the ones it cannot prove are an ASCII literal, with file, line,
operator and subject, followed by a per-file count. What it proves is
deliberately narrow — an ASCII string literal, and nothing else — so the list
is an upper bound, and saying so is the point: it is countable, reviewable and
it shrinks as sites move to `to_chars`.

On the compiler's own sources:

```
$ node bin/output.js -es6 -strict-strings ./compiler/Compiler.rgr …
strict-strings compiler/CodeWriter.rgr:214 charAt(line) in RangerSourceFormat.codeEndOf
…
strict-strings: 322 of 342 string index sites are not an ASCII literal, in 45 files
  44  CodeWriter.rgr
  26  PkgImport.rgr
  22  ../pkg/src/GitPkt.rgr
  21  ../pkg/src/GitStore.rgr
  16  RangerGenericClassWriter.rgr
  …
```

That was the first shape of the flag, and 322 was the wrong number to publish:
it counted every site whose subject was not a literal, which is nearly all of
them, and so it named the language rather than the defect.

#### Stage 6 — the question the flag should have been asking

The unit is not the problem. A scan that takes its bound from `strlen s` and
reads `charAt s i` lands on the same characters on a byte target and a UTF-16
one; only the numbers differ, and the program never sees them. The problem is
where a number **escapes** — where a count is shown to a person as a column, a
width or a padding, or where a code-point offset is handed to an operator that
indexes in the target's own unit.

So the flag now asks that instead. It reports:

* a `strlen` whose value indexes nothing — a count of characters;
* a `to_chars`/`char_length` offset used as a `charAt` or `substring` index;
* a `charcode` on something that is not an ASCII literal.

and it proves the rest quiet: an ASCII literal, `(strlen s) == 0` and its
spellings, a length that indexes *some* string (`(substring path 0 (strlen
prefix))` matches the same prefix everywhere), a length that bounds a variable
used as an index, and two counts of the same string compared with each other.
A length against a constant, or against *another* string's length, is listed
separately as a **note**: the answer there does move with the target, but it
is a guard on structure rather than a count of text.

`strlen` is included, which the first version was not — and it is where the
real defects were.

**`char_length`** is the operator that made the fixes possible: the count of
Unicode code points, on all fourteen targets, without building the `to_chars`
array. `len(s)` on Python, `s.chars().count()` on Rust,
`utf8.RuneCountInString` on Go, `codePointCount` on the JVM, `s.runes.length`
on Dart, `mb_strlen` on PHP, `unicodeScalars.count` on Swift, and a
non-continuation-byte or non-low-surrogate count where the standard library
has nothing.

What the pass cannot follow is provenance across a function boundary: a scan
position kept in a field, or a length arriving as a parameter. Those are
marked in the source, where a reader can see the claim:

```ranger
def srcLen@(units):int (strlen src)    ; a position, checked
fn getColumn@(units):int (sp:int) {    ; ...or a whole function
```

#### What it found

Four genuine defects, all of them a count of characters that a person sees:

| site | was | is |
| --- | --- | --- |
| `CLIProgress.padRight` / `padLeft` | `strlen` | `char_length` — the progress line padded to a different column depending on which build of the compiler wrote it |
| `RangerSourceFormat.formatSource` | `strlen` | `char_length` — the same file wrapped in different places; a comment holding an em dash was one column wide under Node and three in the Rust and Go self-hosts |
| `CodeWriter.syncColumnFromCurrentLine` | `strlen` | `char_length` — `columnNumber` goes into errors and into the source map |
| `LiveCompiler` `(cc N)` and `LowIRExpr` `ccode` | `charcode` | `to_chars` — a character code burnt into generated source, so it must not depend on which host compiled it |

Three places asked the question of a code unit where the text was the better
subject: `RangerDocCommentWriter.xmlEscape`,
`RangerApiArtifactWriter.jsonEscape` and `SourceMapBuilder.jsonEscape` now
`switch` on the one-character slice rather than on `charcode` of it.
`CodeWriter.line_end` compares the line's tail against the separator instead
of comparing two code units. One dead `strlen` in `RangerLispParser.joo` was
deleted.

A fifth was found by CI rather than by the flag, and is Stage 1's: the
parser decodes `\"` and its siblings by hand, and it did that through a
`charbuffer` — UTF-8 bytes on every target since Stage 1 — copying one unit
at a time. Every byte of a multi-byte character was therefore decoded by
itself, so `"merkintä... esim. \"treeni\""` compiled to
`merkint\uFFFD\uFFFD...`. It reads the string directly now, the same fix as
`EncodeString` in the six writers, in the one place that was missed. The
checked-in `bin/output.js` carried the damage in one of its own diagnostics
and took two bootstrap passes to converge. `tests/fixtures/string_units.rgr`
now holds a literal with both an escape and an em dash in it — the escape is
what puts a literal on that path, so no fixture had asked.

A sixth: a Rust `match` arm is a pattern, and the
writer wrote the case literal unescaped, so the new `case "\""` came out as
`"""` and rustc read three tokens where one was meant. `(estr N)` is the
template accessor that escapes without quoting, and the Rust `case` template
uses it now. The Rust rendering of the compiler had never contained a string
`switch` with a quote in it, so nothing had asked.

```
$ node bin/output.js -es6 -strict-strings ./compiler/Compiler.rgr …
strict-strings: 0 of 1726 string index sites read a unit the program can observe, in 0 files

  32 more are a length against a constant or against another length:
  a guard on structure rather than a count of text.

  1694 sites are self-consistent and not listed.
```

*Gate for the pass: it changes no output — it is a report. Gate for the
migration: the flag at zero on the compiler's own sources, `npm test` at its
known baseline, every self-host check green, and `gallery/friendly`'s
cross-target diff.*

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

**Answer: zero cuts.** The experiment was run by replacing the `cpp` arm of
the `substring` template with a counting wrapper, generating and building the
C++ self-host compiler from it, and reading the count at exit. A cut is a
start or end index that lands on a UTF-8 continuation byte (`0b10xxxxxx`)
with text on both sides of it.

| workload | slices | cuts |
|---|---|---|
| the compiler compiling its own sources (`compiler/Compiler.rgr`, 12 targets' writers, `Lang.rgr`) | 37 193 | 0 |
| the compiler compiling the markdown gallery (`gallery/markdown/bench/md_bench.rgr` and its imports) | 40 819 | 0 |

Both inputs contain plenty of non-ASCII — em dashes, arrows and emoji in
comments and string literals — so the zero is not for want of multi-byte text
to cut. It is what §1 predicts: a scanner slices at a delimiter it found with
`charAt`, every delimiter in this codebase is ASCII, and an ASCII byte is
always a character boundary in UTF-8.

So **Stage 4 is safe**: Rust can index and slice bytes, and a byte slice the
compiler actually takes is always valid UTF-8. Stage 4 still has to decide
what a Rust `substring` does when a *user's* program slices mid-character —
the proposal is to keep it total by falling back to `from_utf8_lossy`, and to
let the `-strict-strings` pass of §3.3 point at the call site instead of
silently producing U+FFFD.

One limit worth recording: this measures the compiler, which is the largest
text walker in the repository but is still one program. An application-level
run was attempted with the markdown bench, and could not be completed —
`gallery/markdown/bench/md_bench.rgr` does not currently build on C++ for
reasons unrelated to strings (a `MdBox::text` static/field collision and an
`argc` shadow in the generated `main`). That is a separate defect; it is not a
gap in this answer, since the compiler's own parser is precisely the code the
template comment says depends on byte slicing.

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
