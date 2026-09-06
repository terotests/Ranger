# Zoo.js.org compat-table scores — Ranger ComponentEngine

Measured on branch `claude/es6-builtins` (worktree `cursor/zoo-compat-score-7fe2`)
with the Kangax compat-table suite from
[ivankra/javascript-zoo](https://github.com/ivankra/javascript-zoo)
(`conformance/compat-table/`), using the same weighted scoring as
[zoo.js.org](https://zoo.js.org/).

**These are not Test262 era scores.** zoo.js.org’s ES6 / ES2016+ columns are
compat-table (Kangax) percentages. The engine’s separate Test262 `es6id` figure
in `CONFORMANCE.md` is 79.22% (2268/2863) and measures a different corpus.

## How to reproduce

```bash
# 1. Build the es6 ComponentEngine module
bash scripts/build-engine-module.sh

# 2. Clone the zoo conformance suite (once)
git clone --depth 1 https://github.com/ivankra/javascript-zoo.git /tmp/javascript-zoo

# 3. Run (prefer one edition at a time — the full suite OOMs worker heaps)
node gallery/game_engine/v2/interp/bench/zoo_octane/zoo-compat-score.cjs \
  --suite=compat-table/es6 --jobs=2 --json=/tmp/ranger-zoo-es6.json
```

Harness: `zoo-compat-score.cjs`. Pass/fail matching and group weights follow
`javascript-zoo/harness/run.py` (`tiny/small/medium/large` → 1/2/4/8, split
across group members).

## Headline scores (zoo.js.org columns)

| Column | Weighted | Raw |
| --- | ---: | ---: |
| **ES6** | **57.17%** (120.631 / 211) | 361 / 700 |
| **ES2016+** | **25.01%** (37.77 / 151) | 53 / 250 |
| ESIntl | 25% (7 / 28) | 7 / 28 |
| ESNext | 0% (0 / 33) | 0 / 43 |

Rounded the way the zoo table prints integers: **ES6 ≈ 57%, ES2016+ ≈ 25%**.

Rough zoo.js.org neighbours on ES6: Reeva (60%), Quanta (52%), Yantra (51%).

## Per-edition breakdown

| Edition | Weighted | Raw |
| --- | ---: | ---: |
| es6 | 57.17% | 361/700 |
| es2016 | 66.67% | 8/14 |
| es2017 | 28% | 8/64 |
| es2018 | 26.32% | 3/22 |
| es2019 | 44.64% | 11/24 |
| es2020 | 20% | 3/19 |
| es2021 | 19.05% | 5/15 |
| es2022 | 27.75% | 15/40 |
| es2023 | 0% | 0/10 |
| es2024 | 0% | 0/13 |
| es2025 | 0% | 0/29 |
| next | 0% | 0/43 |
| intl | 25% | 7/28 |

## Largest ES6 weighted failure families

| Family | Weighted cost | Files |
| --- | ---: | ---: |
| Proxy (misc / handler) | ~9.5 | 74 |
| TypedArray.prototype / DataView | ~5.2 | 31 |
| regex.flags | 4.0 | 6 |
| subclassing (Array / Promise / Function) | ~4.3 | 23 |
| Promise.all / constructor | 3.0 | 3 |
| tail-calls | 4.0 | 2 |
| Array.from | 1.8 | 5 |

## Relation to Test262 ES2015 (79.22%)

| Metric | Score | What it counts |
| --- | ---: | --- |
| Test262 `es6id` (`T262_ERA=es6`) | 79.22% | 2863 files, excluding module/async/intl402/Temporal |
| zoo.js.org ES6 (this run) | 57.17% | 700 weighted Kangax probes, including Proxy edge cases, TCO, subclassing builtins, modules-shaped features as present in compat-table |

Both are real; they answer different questions. Kangax is harsher on incomplete
Proxy / subclassing / TCO surface that the Test262 era filter still partly
avoids.
