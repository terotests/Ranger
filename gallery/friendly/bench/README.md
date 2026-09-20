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
| C++ | 0.004 s | 13 | 18 | 4 | 139 | 86 | **260** |
| Kotlin | 0.059 s | 20 | 133 | 52 | 222 | 39 | **466** |
| C# | 0.020 s | 34 | 51 | 14 | 466 | 98 | **663** |
| Java | 0.049 s | 119 | 116 | 35 | 393 | 97 | **760** |
| PHP | 0.041 s | 136 | 167 | 12 | 115 | 371 | **801** |
| JavaScript | 0.044 s | 18 | 167 | 9 | 648 | 234 | **1 076** |
| Rust | 0.004 s | 15 | 22 | 2 178 | 251 | 90 | **2 556** |
| Python | 0.030 s | 522 | 435 | 45 | 572 | 992 | **2 566** |
| Go | 0.004 s | 14 | 272 | 143 182 | 273 | 141 | **143 882** |

All nine printed the same five checksums.

Dart, Swift and Scala are not in the table: there is no `dart`, `swiftc` or
`scalac` on this machine. The writers produce the files; nothing here has run
them.

## What the numbers found

**`charAt` on a string is O(n) on Go and Rust.** Go writes
`int64([]rune(s)[i])`, which decodes the whole string into a fresh rune slice
for every character read; Rust writes `s.chars().nth(i)`, which walks from the
start. A loop that scans a string is therefore quadratic: 143 seconds on Go
and 2.2 on Rust, against 4 milliseconds on C++.

The cost buys something. Ranger's `charAt` is by code point on those two, the
same as Python's `ord(s[i])`. Every other target indexes its own unit in
constant time — a byte on C++ and PHP, a UTF-16 unit on C#, Java, Kotlin, Dart
and JavaScript — so they are fast and they disagree with each other above the
ASCII range. Making Go and Rust constant-time means either caching the decoded
form or moving them onto the same unit as their neighbours, which is a
language decision rather than a writer fix.

**A Ranger map is a plain object on JavaScript.** `set`/`get`/`has` lower to
`m[key]` with `Object.prototype.hasOwnProperty.call` guarding each read — two
property probes per lookup, on an object V8 has put in dictionary mode. It is
the slowest map in the table at 648 ms, where PHP does the same work in 115.
A `Map` would be the idiom and the faster form.

**Everything else lands where the language would put it.** C++ is fastest
overall, which is what the value-semantics work was for; Rust is second on
every kernel except the string scan; Python is an interpreter and reads like
one; the JVM and CLR pay for startup and win it back.

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
