
# TypeScript Parser Benchmark & Compliance

This document benchmarks the **Ranger TypeScript parser** against popular TypeScript/JavaScript parsers and summarizes its feature compliance.

## Compliance Summary (as of 2025-12-16)

| Metric                | Count      |
|-----------------------|------------|
| ✅ Features Supported | 75 / 80    |
| 🔧 Needs Implementation | 5 / 80     |
| ❌ Parse Errors        | 0 / 80     |
| **Compliance Score**  | **93.8%**  |

**All TypeScript features except JSX are fully supported (100% in all non-JSX categories).**

#### Unsupported (JSX) Features
- JSX Element
- JSX Self-Closing
- JSX Expression
- JSX Fragment
- JSX Spread Attribute

See [COMPLIANCE.md](../COMPLIANCE.md) for full details.

## Parsers Compared

| Parser                 | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| **Ranger ts_parser**   | Our parser written in Ranger, compiled to JavaScript |
| **TypeScript (tsc)**   | Official TypeScript compiler's parser                |
| **ts-morph**           | TypeScript compiler wrapper with easier API          |
| **@babel/parser**      | Babel's parser with TypeScript plugin                |
| **@typescript-eslint** | ESLint's TypeScript parser (typescript-estree)       |
| **acorn-typescript**   | Acorn parser with TypeScript extension               |

## Setup

```bash
# From the benchmark directory
cd gallery/ts_parser/benchmark
npm install

# Or from root, compile the module and run benchmark
npm run tsparser:benchmark
```

## Running Benchmarks

```bash
# Small code sample (samples/small.ts)
npm run benchmark

# Large code sample (samples/large.ts)
npm run benchmark:large

# Custom iteration count
npm run benchmark:iterations
node benchmark.js --iterations=500

# Custom file
node benchmark.js --file=path/to/your/file.ts

# Combine options
node benchmark.js --large --iterations=200
```

## Sample Files

Benchmark code is loaded from the `samples/` folder:

- `samples/small.ts` - Small TypeScript file (~40 lines)
- `samples/large.ts` - Large TypeScript file (~1100 lines)

You can add your own `.ts` files to the samples folder or use `--file=` to benchmark any TypeScript file.

## What's Measured

- **Median**: Middle value of all runs (most representative)
- **Min/Max**: Best and worst times
- **Avg**: Average of all runs
- **P95**: 95th percentile (worst 5% excluded)
- **vs Fastest**: Ratio compared to the fastest parser

## Expected Results

The Ranger ts_parser should be competitive because:

1. **Simple implementation**: Only parses a TypeScript subset, no type checking
2. **No overhead**: No compiler infrastructure, just lexing + parsing
3. **Optimized output**: Ranger generates clean, efficient JavaScript

Full TypeScript parsers (tsc, ts-morph) do more work:

- Full TypeScript grammar support
- Symbol table building
- Type information preparation


## Latest Benchmark Results (2025-12-16)

### Small File (40 lines, 876 chars, 100 iterations)

| Parser                | Median (ms) | Min   | Max    | Avg    | P95    | vs Fastest |
|-----------------------|-------------|-------|--------|--------|--------|------------|
| **Ranger ts_parser**  | **0.030**   | 0.027 | 3.413  | 0.078  | 0.128  | 1.00x      |
| TypeScript (tsc)      | 0.172       | 0.090 | 0.684  | 0.222  | 0.485  | 5.73x      |
| @babel/parser         | 0.311       | 0.101 | 5.690  | 0.371  | 0.753  | 10.37x     |
| ts-morph              | 0.347       | 0.183 | 1.370  | 0.394  | 0.767  | 11.57x     |
| @typescript-eslint    | 0.383       | 0.266 | 1.599  | 0.438  | 0.722  | 12.77x     |
| acorn-typescript      | 0.642       | 0.486 | 4.257  | 0.722  | 1.052  | 21.40x     |

**Ranger ts_parser is the fastest parser on small files.**

### Large File (1149 lines, 28,057 chars, 100 iterations)

| Parser                | Median (ms) | Min   | Max    | Avg    | P95    | vs Fastest |
|-----------------------|-------------|-------|--------|--------|--------|------------|
| **Ranger ts_parser**  | **0.741**   | 0.641 | 2.564  | 0.902  | 1.917  | 1.00x      |
| @babel/parser         | 1.875       | 1.647 | 12.559 | 2.150  | 3.264  | 2.53x      |
| TypeScript (tsc)      | 2.041       | 1.774 | 3.716  | 2.172  | 3.066  | 2.75x      |
| ts-morph              | 2.763       | 2.230 | 13.438 | 3.369  | 10.114 | 3.73x      |
| @typescript-eslint    | 5.595       | 5.208 | 13.380 | 6.236  | 11.223 | 7.55x      |
| acorn-typescript      | 17.921      | 16.762| 25.574 | 18.847 | 22.320 | 24.18x     |

**Ranger ts_parser is the fastest parser on large files.**

---

**Summary:**
- Ranger ts_parser is the fastest parser in both small and large file benchmarks.
- All TypeScript features except JSX are fully supported (100% compliance in all non-JSX categories).
- See [COMPLIANCE.md](../COMPLIANCE.md) for detailed feature support.

## Notes

- First run includes JIT warm-up; results exclude warm-up iterations
- ts-morph creates a Project instance (cached), measuring only parse time
- All parsers configured for maximum compatibility with TypeScript syntax
