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
python 3.12, go 1.22, g++ 13 `-O2`, rustc `-O`, javac/java 21. No
`php`, `mcs` or `kotlinc` on this machine this run.

| Target | startup | arith | arrays | strings | maps | objects | total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C++ | 0.002 s | 11 | 11 | 2 | 74 | 38 | **136** |
| Rust | 0.002 s | 13 | 11 | 3 | 101 | 42 | **170** |
| Go | 0.002 s | 12 | 34 | 4 | 125 | 61 | **236** |
| Java | 0.024 s | 53 | 60 | 12 | 189 | 37 | **351** |
| JavaScript | 0.015 s | 14 | 82 | 4 | 263 | 145 | **508** |
| Python | 0.016 s | 245 | 166 | 13 | 181 | 366 | **971** |

All six printed the same five checksums.

Go sits third, next to Rust. PHP, C#, Kotlin, Dart, Swift and Scala are
not in the table: no toolchain for them on this machine this run.

## What the numbers found

Go and Rust index the UTF-8 byte their string is made of, the same unit
as C++. How that used to be a rune walk is
[`PLAN_STRING_INDEXING.md`](../../../docs/plans/PLAN_STRING_INDEXING.md).

**A Ranger map is a plain object on JavaScript.** `set`/`get`/`has` lower to
`m[key]` with `Object.prototype.hasOwnProperty.call` guarding each read — two
property probes per lookup, on an object V8 has put in dictionary mode. It is
the slowest map in this run at 263 ms, against 74 on C++. A `Map` would be
the idiom and the faster form.

**Everything else lands where the language would put it.** C++ is fastest
overall; Rust then Go; Python is an interpreter and reads like one.

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
