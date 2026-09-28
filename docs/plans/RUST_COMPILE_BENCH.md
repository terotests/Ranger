# Compile time on large strict-Rust programs

`scripts/rust-compile-bench.mjs` generates a strict-Rust program of N units
(two structs, an enum, a function each; `main` calls every unit) and times
`node dist/rgrc.js -l=<target>` on it.

    node scripts/rust-compile-bench.mjs --sizes=50,200,700 --langs=es6,go

## Go vs ES6

The report that started this: Go took 0.47s / 2.4s / 32s on 1.1k / 5.7k /
22.6k lines where ES6 took 0.4s / 1.3s / 5.3s. The generator used for those
numbers was not committed, and on master of 2026-09-28 the gap does not
reproduce with either of two generators:

- this script's units (below): Go is as fast as ES6 or faster;
- the `tests/fixtures/rust_strict/*.rs` programs, renamed per unit and
  concatenated (maps, traits, iterators, `Rc`/`Weak`, `#[ranger::serialize]`):
  42k lines take 14.4s on ES6 and 13.5s on Go.

## Class writers: union membership was quadratic

The ES6, Python, C#, Kotlin and Dart class writers ask
`RangerGenericClassWriter.unionInterfacesOf` for every class they write, and
it scanned every defined class for sealable unions each time. With 2100
classes that was 10s of a 30s ES6 compile. It now builds a class-name →
interfaces index on the first question and reads it after that. The output is
byte-identical.

Before / after (one run each, Linux container, Node 22):

| units | lines | es6 before | es6 after | go before | go after |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 50 | 1 656 | 1.82s | 1.80s | 1.89s | 1.76s |
| 200 | 6 606 | 5.88s | 4.56s | 4.24s | 4.31s |
| 700 | 23 106 | 29.77s | 18.98s | 17.78s | 16.59s |

## What is left

Time still grows faster than the input (200 → 700 units: 3.5× the lines,
about 4× the time). The CPU profile puts it in the garbage collector and in
the `CodeNode` and `RangerAppWriterContext` constructors: the number of
objects allocated is linear (about 1 760 `CodeNode`s and 530 contexts per
unit), but the heap reaches 2.6 GB on the 700-unit program and every
collection has more to walk. A context allocates about 60 maps and arrays when
it is forked, a `CodeNode` about 15. Allocating those lazily, or not keeping
forked contexts reachable from the nodes after type checking, is the next
step; both touch every target the compiler is written for.
