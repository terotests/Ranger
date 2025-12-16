# TypeScript Parser Benchmark

Benchmark comparing the Ranger-generated TypeScript parser against popular TypeScript/JavaScript parsers.

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

## Sample Output

```
================================================================================
TypeScript Parser Benchmark
================================================================================
Code size: 1234 characters, 56 lines
Iterations: 100
Mode: SMALL code sample
================================================================================

Benchmarking Ranger ts_parser... done (median: 0.123ms)
Benchmarking TypeScript (tsc)... done (median: 0.456ms)
...

================================================================================
Results (times in milliseconds)
================================================================================

Parser                      Median       Min       Max       Avg       P95  vs Fastest
---------------------------------------------------------------------------------------
Ranger ts_parser             0.123     0.100     0.200     0.130     0.180        1.00x
acorn-typescript             0.234     0.200     0.300     0.240     0.280        1.90x
@babel/parser                0.345     0.300     0.400     0.350     0.380        2.80x
...
```

## Notes

- First run includes JIT warm-up; results exclude warm-up iterations
- ts-morph creates a Project instance (cached), measuring only parse time
- All parsers configured for maximum compatibility with TypeScript syntax
