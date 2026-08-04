# Zoo.js / Octane results — Ranger TS engine

Measured on this machine against the same Octane v9 suites published on
[zoo.js.org](https://zoo.js.org/?arch=amd64&v8=true) (`arch=amd64`, V8 columns).

Runner: `node gallery/game_engine/v2/interp/bench/zoo_octane/run.cjs`
Engine build: `bash scripts/build-engine-module.sh` (ComponentEngine on Node).

## Passing suites

| Suite | Engine score | Same-machine Node | % of Node | zoo.js V8 (amd64) | % of zoo V8 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Richards | 21.7 | 53652 | **0.040%** | 37102 | **0.058%** |
| DeltaBlue | 40.6 | 130596 | **0.031%** | 106675 | **0.038%** |
| RegExp | 75.8 | 10627 | **0.713%** | 9499 | **0.798%** |
| **geo mean (these 3)** | **40.6** | 42070 | **0.096%** | — | — |

Octane scores are higher-is-faster throughput numbers (reference / measured time).
Percentages are `engine / baseline × 100`.

Rough table placement on zoo.js.org (amd64 Richards column): **21.7** sits next
to interpreters such as rust-js (~22), dmdscript (~24), otto (~24), and sval
(~28) — well below MuJS (~260), Duktape (~381), QuickJS (~787), and V8 (~37k).

## Suites that did not produce a valid score

| Suite | Outcome |
| --- | --- |
| Crypto | Runs, then `Error: Crypto operation failed` (wrong crypto result). Parser also warns `Unknown type: this`. |
| RayTrace | Runs after `new ns.Deep.C()` fix; `Error: Scene rendered incorrectly` (checksum). |
| Splay | `Error: Key not found: …` (tree lookup). |
| NavierStokes | `Error: checksum failed` (numeric correctness). |
| EarleyBoyer | Many parse errors (octal literals / Scheme-compiled JS forms). |

Larger Octane files (PdfJS, Mandreel, Gameboy, Box2D, zlib, TypeScript, CodeLoad)
were not run in this pass.

## Harness notes

- Live `Date` clock via `hostNowMs` getter (realm clock is frozen by default).
- `maxLoopIterations` raised so long suites are not truncated.
- `print` prelude (guest `console.log` is not a first-class value).
- DeltaBlue `inheritsFrom` installed on `Function.prototype` (functions do not
  see `Object.prototype` additions in this realm).
- Engine fix included: `new ns.Deep.Ctor()` now constructs from the resolved
  function value (previously returned `null`).
