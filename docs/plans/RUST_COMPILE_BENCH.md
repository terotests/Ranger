# rgrc vs rustc: compiling a Rust source

`node scripts/rust-compile-bench.mjs` compiles the same `.rs` programs with
rgrc and with rustc and prints wall times (best of 3). Recorded 2026-09-28 on
a 4-CPU cloud container.

Columns:

- **node es6**: `node dist/rgrc.js -l=es6` — rgrc as shipped (JavaScript on Node).
- **native es6**: rgrc compiled to C++ with `g++ -O2` (`tmp/selfhost/rangerc`), `.rs` → JavaScript.
- **native go**: the same binary, `.rs` → Go source.
- **native go+build**: `.rs` → Go → native binary (`go build`, std library from cache).
- **rustc check**: `rustc --emit=metadata` (parse, type and borrow check, no code generation).
- **rustc debug** / **rustc -O**: a native binary without / with optimisation.

rgrc does parsing, lowering and type checking and then writes source for
another language. The comparable rustc column is **rustc check**; the
native-binary comparison is **native go+build** vs **rustc debug**.

The generated program is N units of ~113 lines (a trait with a default method,
two impls and `dyn` dispatch, an enum with `match`, a generic struct, a generic
function, a closure, a `HashMap`). Its output from the rustc build, the rgrc
es6 build and the rgrc Go build is checked to be the same.

## Results

### Startup (fn main() {})

| input | lines | node es6 | native es6 | native go | native go+build | rustc check | rustc debug | rustc -O |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| empty | 1 | 735 ms | 191 ms | 183 ms | 411 ms | 35 ms | 99 ms | 110 ms |

### Generated program

| input | lines | node es6 | native es6 | native go | native go+build | rustc check | rustc debug | rustc -O |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 units | 120 | 860 ms | 215 ms | 216 ms | 521 ms | 79 ms | 213 ms | 332 ms |
| 10 units | 1137 | 1283 ms | 396 ms | 465 ms | 981 ms | 196 ms | 410 ms | 1232 ms |
| 50 units | 5657 | 2841 ms | 1261 ms | 2376 ms | 3856 ms | 671 ms | 1419 ms | 7423 ms |
| 200 units | 22607 | 9734 ms | 5310 ms | 32092 ms | 37799 ms | 3918 ms | 6809 ms | 70853 ms |

### tests/fixtures/rust_strict

| input | lines | node es6 | native es6 | native go | native go+build | rustc check | rustc debug | rustc -O |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| ex_enums.rs | 69 | 1016 ms | 239 ms | 225 ms | 564 ms | 64 ms | 173 ms | 244 ms |
| ex_iterators.rs | 53 | 807 ms | 219 ms | 204 ms | 532 ms | 65 ms | 279 ms | 530 ms |
| ex_ownership.rs | 81 | 744 ms | 191 ms | 188 ms | 484 ms | 74 ms | 158 ms | 209 ms |
| ex_results.rs | 76 | 801 ms | 197 ms | 188 ms | 474 ms | 68 ms | 186 ms | 350 ms |
| ex_strings.rs | 55 | 836 ms | 229 ms | 197 ms | 485 ms | 59 ms | 204 ms | 374 ms |
| ex_traits.rs | 88 | 733 ms | 199 ms | 203 ms | 496 ms | 74 ms | 184 ms | 266 ms |
| r1_arith.rs | 29 | 820 ms | 193 ms | 187 ms | 468 ms | 53 ms | 134 ms | 134 ms |
| r1_collections.rs | 62 | 756 ms | 190 ms | 213 ms | 537 ms | 61 ms | 208 ms | 329 ms |
| r1_control.rs | 76 | 836 ms | 198 ms | 195 ms | 521 ms | 59 ms | 152 ms | 162 ms |
| r1_structs.rs | 63 | 762 ms | 206 ms | 200 ms | 480 ms | 70 ms | 158 ms | 214 ms |
| r2_closure_return.rs | 32 | 729 ms | 203 ms | 188 ms | 467 ms | 51 ms | 125 ms | 146 ms |
| r2_closures.rs | 69 | 768 ms | 203 ms | 206 ms | 504 ms | 93 ms | 279 ms | 534 ms |
| r2_enums.rs | 123 | 860 ms | 229 ms | 219 ms | 517 ms | 83 ms | 176 ms | 251 ms |
| r2_maps.rs | 40 | 719 ms | 216 ms | 217 ms | 513 ms | 60 ms | 273 ms | 564 ms |
| r2_results.rs | 93 | 807 ms | 217 ms | 212 ms | 518 ms | 69 ms | 200 ms | 249 ms |
| r2_traits.rs | 111 | 782 ms | 205 ms | 196 ms | 502 ms | 67 ms | 179 ms | 277 ms |
| r3_moves.rs | 88 | 742 ms | 201 ms | 196 ms | 512 ms | 70 ms | 161 ms | 249 ms |
| **total** | 1208 | 13519 ms | 3537 ms | 3435 ms | 8574 ms | 1140 ms | 3230 ms | 5082 ms |


## Reading

- rgrc has a fixed cost of ~190 ms native (loading `Lang.rgr`, `stdops.rgr`
  and the Rust prelude `lib/rust/RsPrelude.rgr`) and ~750 ms on Node; rustc
  starts in ~35 ms. For the small fixtures that fixed cost is most of the time,
  so rgrc is 3× (native) to 12× (Node) slower than `rustc check`.
- With size the gap closes: at 22.6k lines native rgrc (es6) takes 5.3 s,
  rustc check 3.9 s, rustc debug 6.8 s and rustc -O 70.9 s. rgrc's front end
  plus es6 writer is in the same range as rustc's front end; rustc's cost is
  mostly in code generation, especially with `-O`.
- The Go writer is not linear: 2.4 s at 5.7k lines, 32 s at 22.6k lines,
  while es6 from the same input takes 1.3 s and 5.3 s.
- The C++ build of rgrc stops with `vector::_M_range_check` when writing
  `-l=cpp` for a `.rs` input (near `RsPrelude.rgr:1463`), so there is no
  rgrc → C++ → g++ column. `dist/rgrc.js -l=cpp` on the same input works.
- The Go build of rgrc (`npm run selfhost:build:go`) refuses `while let`
  (`unknown name`), so it is not measured.
