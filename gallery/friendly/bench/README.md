# bench — the same program, timed on every target

`bench.rgr` is five kernels: integer arithmetic, a growing array, string
building and scanning, a string-keyed map, and objects with a method on them.
Each one times itself with `wall_clock_ms` and prints a checksum beside the
milliseconds, so the numbers leave out process and VM startup and one slow
kernel cannot hide the other four.

```bash
bash gallery/friendly/bench/bench.sh            # every target
bash gallery/friendly/bench/bench.sh rust go    # a subset
BENCH_TIMEOUT=600 bash gallery/friendly/bench/bench.sh go
```

`startup.rgr` is a program whose only statement is a print. Its wall time is
what the target costs before the first statement; the program cannot measure
that itself, so `bench.sh` does, from outside.

**Read this as "what does Ranger cost here", not as "which language is
faster".** It is one program, one machine, one set of compiler flags
(`-O2` for g++, `-O` for rustc, defaults elsewhere). What it is good for is
comparing a target against *itself* after a writer change, and finding the
places where one target does something the others do not.

## Numbers

Kernels only, milliseconds, lower is better. Linux x86-64, node 22,
python 3.11, php 8, go, g++ 13 `-O2`, rustc `-O`, javac/java 21, mono/mcs,
kotlinc 2.0.21.

| Target | startup | arith | arrays | strings | maps | objects | total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C++ | 0.004 s | 13 | 18 | 4 | 147 | 83 | **265** |
| Rust | 0.004 s | 15 | 21 | 6 | 268 | 87 | **397** |
| Kotlin | 0.061 s | 20 | 124 | 54 | 246 | 41 | **485** |
| C# | 0.022 s | 35 | 51 | 14 | 483 | 101 | **684** |
| Go | 0.004 s | 14 | 185 | 4 | 325 | 166 | **694** |
| Java | 0.048 s | 114 | 119 | 36 | 367 | 117 | **753** |
| PHP | 0.046 s | 136 | 159 | 12 | 114 | 365 | **786** |
| JavaScript | 0.047 s | 18 | 157 | 9 | 629 | 227 | **1 040** |
| Python | 0.030 s | 577 | 433 | 46 | 582 | 969 | **2 607** |

All nine printed the same five checksums.

The `strings` column is what
[`docs/plans/PLAN_STRING_INDEXING.md`](../../../docs/plans/PLAN_STRING_INDEXING.md)
stage 4 was about. Before it, Rust read 2 178 ms there and Go read **143 182**
-- a single kernel that was 99.5% of Go's total:

| Target | strings, before | strings, after | total, before | total, after |
| --- | --- | --- | --- | --- |
| Rust | 2 178 | **6** | 2 556 | **397** |
| Go | 143 182 | **4** | 143 882 | **694** |

Rust moved from seventh to second and Go from ninth to fifth, on one change
to what a string index means.

Dart, Swift and Scala are not in the table: there is no `dart`, `swiftc` or
`scalac` on this machine. The writers produce the files; nothing here has run
them.

## What the numbers found

**`charAt` on a string used to be O(n) on Go and Rust — fixed.** Go wrote
`int64([]rune(s)[i])`, which decoded the whole string into a fresh rune slice
for every character read; Rust wrote `s.chars().nth(i)`, which walks from the
start. A loop that scans a string was therefore quadratic: 143 seconds on Go
and 2.2 on Rust, against 4 milliseconds on C++.

They index the UTF-8 byte their string is actually made of now, which is the
only unit either one reads in constant time — and, it turned out, the unit
their own `indexOf` had been answering in all along, so this was a
correctness fix as much as a speed one. The three of C++, PHP, Rust and Go
agree on an index; JavaScript, Java, Kotlin, C# and Python agree on a
different one; `to_chars` is the view that means the same thing on all of
them. `docs/plans/PLAN_STRING_INDEXING.md` has the whole of it.

**A Ranger map is a plain object on JavaScript.** `set`/`get`/`has` lower to
`m[key]` with `Object.prototype.hasOwnProperty.call` guarding each read — two
property probes per lookup, on an object V8 has put in dictionary mode. It is
the slowest map in the table at 648 ms, where PHP does the same work in 115.
A `Map` would be the idiom and the faster form.

**Everything else lands where the language would put it.** C++ is fastest
overall, which is what the value-semantics work was for; Rust is second;
Python is an interpreter and reads like one; the JVM and CLR pay for startup
and win it back.

## intwidth.rgr

A Ranger `int` is not the same width everywhere, and `intwidth.rgr` is the
one-line probe: `100000 * 100000`, which needs 34 bits.

| Answer | Targets |
| --- | --- |
| `10000000000` | JavaScript, Python, PHP, Go, Rust |
| `1410065408` | C++, C#, Java, Kotlin |

Dart and Swift declare a 64-bit `int` / `Int` and Scala a 32-bit `Int`; none of
the three was run here. On C++ the overflow is undefined behaviour rather than
a wrap, and an earlier draft of `bench.rgr` that crossed 2³¹ compiled at `-O2`
into a program that never finished. `bench.rgr` stays inside 32 bits on
purpose, so that its times are times rather than four targets computing
something else.
