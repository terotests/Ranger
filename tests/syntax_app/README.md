# Ranger syntax test app

One Ranger program that uses as much of `compiler/Lang.rgr` and of the language
as can be written portably, plus the harness that compiles it to **every**
target the CLI accepts and runs it wherever the toolchain is installed.

The point is not only that the program works. It is to have one artefact whose
compilation across fourteen targets is measured on every test run, so that the
answer to "how well does target X work" is data rather than memory.

- The app: [`syntax_app.rgr`](syntax_app.rgr) and the `sx_*.rgr` sections.
- The test: [`../syntax-app.test.ts`](../syntax-app.test.ts).
- The measurement: [`TARGET_REPORT.md`](TARGET_REPORT.md) (generated) and
  [`target_matrix.json`](target_matrix.json) (the baseline the test asserts).
- What does not work at all: [`known_gaps.md`](known_gaps.md) and the probes in
  [`gaps/`](gaps/).
- What has been fixed and what is next:
  [`TARGET_FIXES_TODO.md`](TARGET_FIXES_TODO.md).

## Running it

```bash
# the app, on the reference target
RANGER_LIB="./compiler/Lang.rgr;./lib/stdops.rgr" \
  node bin/output.js -es6 ./tests/syntax_app/syntax_app.rgr \
  -nodecli -d=tests/.output -o=syntax_app.js
node tests/.output/syntax_app.js

# the whole matrix
npm run test:syntaxapp

# after a compiler change that moves the matrix
npm run test:syntaxapp:update
```

The full run takes about one hundred seconds: it compiles eighteen units to
fourteen targets and then builds and runs the output with `node`, `tsc`, `go`,
`python3`, `rustc`, `g++`, `javac`, `php` and `lli` — whichever of them the
machine has.

## Layout

| File | What it holds |
| --- | --- |
| `syntax_app.rgr` | The entry point. Builds the section list and prints the report. |
| `sx_base.rgr` | The harness: `Enum`, `record`, a plain `trait`, a generic `trait @params`, the `SyntaxSection` base class. |
| `sx_numeric.rgr` | `+ - * / % idiv max`, the conversions, the math library, the comparisons, `&&` and `\|\|` at every arity. |
| `sx_bitwise.rgr` | `bit_and bit_or bit_xor bit_not bit_shl bit_shr bit_ushr`. |
| `sx_strings.rgr` | The whole string operator set, character codes, the string-to-number conversions, `regex_test`. |
| `sx_arrays.rgr` | The array operators, the `([] …)` literals, `for` with `break` and `continue`, nested arrays. |
| `sx_maps.rgr` | `set get has keys`, the elvis operator, maps of arrays and of objects. |
| `sx_optionals.rgr` | `@(optional)`, `null? !null? unwrap !! ?? wrap`, optional fields, parameters and return values. |
| `sx_control.rgr` | `if`, `if!`, the ternary, `switch`/`case`/`default` over int, string and char, `while`, `try`/`throw`. |
| `sx_oop.rgr` | Classes, inheritance, override, `extension`, `record` both ways, `cast`, static factories, reference semantics. |
| `sx_lambdas.rgr` | Lambdas in a local, as a parameter, as a block, capturing, mutating a capture, on a field. |
| `sx_buffers.rgr` | `buffer`, `int_buffer`, `double_buffer`, `charbuffer` and their operators. |
| `sx_operators.rgr` | Custom operators: a macro, a direct template with a `*` fallback, `*` and `+` overloaded on a class, an Enum matcher, a block operator, an `operator type:` block. |
| `sx_stdlib.rgr` | The collection methods of `lib/stdlib.rgr`: `forEach map filter reduce find count any all slice clone groupBy`, `values map_length get_or`. |
| `sx_narrow.rgr` | Operators that work on ES6 but whose `templates {}` block covers few targets: `sort reverse remove error_msg`, `for` over a hash, `toString`, the ISO date operators. Kept out of the app so one narrow operator does not stop every section. |
| `sx_hostops.rgr` | Files, paths, environment, digests, terminal, timing, immutable collections and the `if_javascript`-style language switches. Compiled, never run. |
| `sx_http.rgr` | `@(HttpServer)`, the route annotations and the `http_*` / `sse_*` / `start` / `stop` operators. Go only; compiled, never run. |
| `sx_process.rgr` | `@process`, `proc_start proc_stop proc_send proc_hibernate proc_wakeup`, `begin_dispatch_turn`, `find_process`. |
| `drv_*.rgr` | One-class drivers, so a target that rejects one section does not hide the others. |
| `expected_*.txt` | The output the reference target prints. Every target that runs is compared against it. |
| `gaps/` | Short programs for constructs that do not work, with `gaps.json` recording what each one does today. |

## Coverage

`compiler/Lang.rgr` declares 336 core operator definitions under 207 distinct
names. The app and its side sections use **203** of them. The test holds that
number at 195 or above, so the app can only grow.

The four that are left out are the four that do not work: `empty`,
`last_index`, `make` and `nullify`. Each has a probe in `gaps/` and an entry in
[`known_gaps.md`](known_gaps.md), so they are measured on every run even though
the app cannot call them.

## What the app deliberately avoids

Three kinds of thing are out of the runnable app on purpose.

1. **Anything whose answer depends on the machine** — the clock, the file
   system, the environment, the terminal, sockets, randomness. Comparing the
   printed output of eight language runtimes only means something when the
   program is a pure function of its source. Those operators are in
   `sx_hostops.rgr`, which is compiled on every target and run on none.

2. **Anything whose answer depends on the target** — the `if_javascript` family
   emits code for one target by definition. Same file, same reason.

3. **Doubles printed as doubles.** Targets disagree about how many digits a
   double prints, and that disagreement says nothing about the language. Every
   double goes through `sayD`, which rounds to three decimals and prints an
   integer. `double2str` is the one exception, and it is measured by its length
   — which already differs: ES6 writes `1.5` and C++ writes `1.500000`.

One thing the app *does* avoid for a target-specific reason, and says so at the
site: the shared `render()` walks its rows by index rather than with `for`,
because the Go writer does not declare the item variable of a `for` loop over an
array of objects. Leaving that construct in the harness would have made every
Go run fail for one reason, hiding everything else. It lives in the `arrays` and
`oop` sections instead, where the matrix can attribute it, and in
`gaps/go_for_object_array.rgr`.

## Reading the matrix

| Symbol | Meaning |
| --- | --- |
| `ok` | Compiled, ran, printed exactly the expected output. |
| `c` | Compiled. Either the unit is not run, or the toolchain is not on this machine. |
| `diff` | Compiled and ran, and printed something else. The report says which line. |
| `run` | Compiled, and then the target toolchain or the generated program failed. |
| `-` | The Ranger compiler rejected it. The report names the operators it could not match. |

A `-` is nearly always a missing entry in a `templates {}` block:
`tests/operator-coverage.test.ts` explains why that surfaces as
`Could not match argument types for <name>` rather than as a missing-template
message. The first unmatched operator usually drags unrelated names in with it,
because an expression whose type is unknown does not match anything either — so
read the first name in a row, not the whole row.
