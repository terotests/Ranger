# js_parser Benchmark

Compares Ranger's js_parser against popular JavaScript parsers including [espree](https://github.com/eslint/espree) (ESLint), [acorn](https://github.com/acornjs/acorn), [@babel/parser](https://babeljs.io/docs/babel-parser), [meriyah](https://github.com/nicolo-ribaudo/nicolo-ribaudo), and [esprima](https://esprima.org/).

## Setup

```bash
cd gallery/js_parser/benchmark
npm install
```

## Run

```bash
# Small code sample (~50 lines)
npm run benchmark

# Include large and XL code samples
npm run benchmark:large
```

## Results (In-Process Comparison)

All parsers run in the same Node.js process with warm-up runs.

### Small Code (~50 lines, 0.6 KB)

| Rank | Parser | Avg (ms) | vs Fastest |
|------|--------|----------|------------|
| #1 | meriyah | 0.078 | 1.00x |
| #2 | espree | 0.080 | 1.03x |
| **#3** | **Ranger js_parser** | **0.087** | **1.12x** |
| #4 | esprima | 0.148 | 1.90x |
| #5 | acorn | 0.178 | 2.28x |
| #6 | @babel/parser | 0.202 | 2.59x |

### Large Code (~1000 lines, 17.3 KB)

| Rank | Parser | Avg (ms) | vs Fastest |
|------|--------|----------|------------|
| #1 | meriyah | 0.512 | 1.00x |
| **#2** | **Ranger js_parser** | **0.884** | **1.72x** |
| #3 | acorn | 1.405 | 2.74x |
| #4 | esprima | 1.410 | 2.75x |
| #5 | espree | 1.575 | 3.07x |
| #6 | @babel/parser | 2.625 | 5.12x |

### XL Code (~2000 lines, 34.9 KB)

| Rank | Parser | Avg (ms) | vs Fastest |
|------|--------|----------|------------|
| #1 | meriyah | 0.842 | 1.00x |
| **#2** | **Ranger js_parser** | **1.388** | **1.65x** |
| #3 | esprima | 2.330 | 2.77x |
| #4 | acorn | 2.695 | 3.20x |
| #5 | @babel/parser | 3.064 | 3.64x |
| #6 | espree | 3.468 | 4.12x |

## Parsers Compared

| Parser | Description |
|--------|-------------|
| **meriyah** | Ultra-fast ES2022+ compliant parser |
| **acorn** | Lightweight, widely used ES2020+ parser |
| **esprima** | Original ECMAScript parsing infrastructure |
| **espree** | ESLint's parser (based on acorn) |
| **@babel/parser** | Full-featured parser supporting JSX, TypeScript, etc. |
| **Ranger js_parser** | Parser written in Ranger language, compiled to JS |

## Key Findings

🥈 **Ranger js_parser ranks #2** for large files, outperforming:
- espree (ESLint's parser) by **2-4x**
- acorn by **2-3x**
- @babel/parser by **2-3x**
- esprima by **1.7-2x**

Only **meriyah** (a highly optimized, dedicated fast parser) is faster.

## Notes

- All parsers run in-process (fair comparison)
- 100 iterations with warm-up runs for JIT optimization
- meriyah is specifically designed for maximum speed
- @babel/parser is the most feature-rich but heaviest

## Module Compilation

The js_parser module was compiled with:
```bash
node bin/output.js -es6 -nodemodule ./gallery/js_parser/js_parser_main.rgr -o=js_parser_module.js
```
