// Benchmark: Ranger ts_parser vs popular TypeScript parsers
import ts from "typescript";
import { Project } from "ts-morph";
import * as babelParser from "@babel/parser";
import { parse as parseESTree } from "@typescript-eslint/typescript-estree";
import { Parser } from "acorn";
import acornTs from "acorn-typescript";
import { createRequire } from "module";
import { performance } from "perf_hooks";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, existsSync } from "fs";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import Ranger ts_parser as module (CommonJS)
const { TSLexer, TSParserSimple } = require("./ts_parser_module.cjs");

// Acorn with TypeScript plugin
const AcornTS = Parser.extend(acornTs());

// Load test code from files
function loadSampleCode(name) {
  const filePath = join(__dirname, "samples", `${name}.ts`);
  if (existsSync(filePath)) {
    return readFileSync(filePath, "utf-8");
  }
  throw new Error(`Sample file not found: ${filePath}`);
}

// Fallback inline code if files don't exist
const fallbackSmallCode = `
// Interface declaration
interface Person {
  readonly id: number;
  name: string;
  age?: number;
}

type ID = string | number;
let count: number = 42;
const message: string = "hello";

function greet(name: string, age?: number): string {
  return "Hello, " + name;
}
`;

function getCode(useLarge) {
  try {
    return loadSampleCode(useLarge ? "large" : "small");
  } catch (e) {
    console.warn(`Warning: ${e.message}, using fallback code`);
    return fallbackSmallCode;
  }
}

// Generic benchmark function
function benchmark(name, parseFn, code, iterations = 100) {
  const times = [];
  let success = true;
  let errorMsg = null;

  // Warm up
  for (let i = 0; i < 5; i++) {
    try {
      parseFn(code);
    } catch (e) {
      // Ignore warm-up errors
    }
  }

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      parseFn(code);
    } catch (e) {
      if (i === 0) {
        success = false;
        errorMsg = e.message;
      }
    }
    const end = performance.now();
    times.push(end - start);
  }

  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  const min = times[0];
  const max = times[times.length - 1];
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const p95 = times[Math.floor(times.length * 0.95)];

  return {
    name,
    success,
    errorMsg,
    median: median.toFixed(3),
    min: min.toFixed(3),
    max: max.toFixed(3),
    avg: avg.toFixed(3),
    p95: p95.toFixed(3),
    iterations,
  };
}

// Parser functions
function parseWithRanger(code) {
  const lexer = new TSLexer(code);
  const tokens = lexer.tokenize();
  const parser = new TSParserSimple(tokens);
  return parser.parseProgram();
}

function parseWithTypeScript(code) {
  return ts.createSourceFile("test.ts", code, ts.ScriptTarget.Latest, true);
}

// ts-morph creates a Project which is heavy - we'll measure just the parse
let tsMorphProject = null;
function parseWithTsMorph(code) {
  if (!tsMorphProject) {
    tsMorphProject = new Project({ useInMemoryFileSystem: true });
  }
  const sourceFile = tsMorphProject.createSourceFile("temp.ts", code, {
    overwrite: true,
  });
  return sourceFile;
}

function parseWithBabel(code) {
  return babelParser.parse(code, {
    sourceType: "module",
    plugins: ["typescript"],
  });
}

function parseWithESTreeTS(code) {
  return parseESTree(code, {
    jsx: false,
    loc: true,
    range: true,
  });
}

function parseWithAcornTS(code) {
  return AcornTS.parse(code, {
    sourceType: "module",
    ecmaVersion: "latest",
    locations: true,
  });
}

// Main benchmark runner
async function runBenchmarks() {
  const args = process.argv.slice(2);
  const useLarge = args.includes("--large");
  const iterArg = args.find((a) => a.startsWith("--iterations="));
  const iterations = iterArg ? parseInt(iterArg.split("=")[1]) : 100;
  const fileArg = args.find((a) => a.startsWith("--file="));

  let code;
  let sampleName;

  if (fileArg) {
    // Load custom file
    const customFile = fileArg.split("=")[1];
    code = readFileSync(customFile, "utf-8");
    sampleName = customFile;
  } else {
    code = getCode(useLarge);
    sampleName = useLarge ? "samples/large.ts" : "samples/small.ts";
  }

  const codeSize = code.length;
  const lineCount = code.split("\n").length;

  console.log("=".repeat(80));
  console.log("TypeScript Parser Benchmark");
  console.log("=".repeat(80));
  console.log(`Sample file: ${sampleName}`);
  console.log(`Code size: ${codeSize} characters, ${lineCount} lines`);
  console.log(`Iterations: ${iterations}`);
  console.log("=".repeat(80));
  console.log();

  const parsers = [
    { name: "Ranger ts_parser", fn: parseWithRanger },
    { name: "TypeScript (tsc)", fn: parseWithTypeScript },
    { name: "ts-morph", fn: parseWithTsMorph },
    { name: "@babel/parser", fn: parseWithBabel },
    { name: "@typescript-eslint", fn: parseWithESTreeTS },
    { name: "acorn-typescript", fn: parseWithAcornTS },
  ];

  const results = [];

  for (const parser of parsers) {
    process.stdout.write(`Benchmarking ${parser.name}...`);
    const result = benchmark(parser.name, parser.fn, code, iterations);
    results.push(result);
    console.log(` done (median: ${result.median}ms)`);
  }

  console.log();
  console.log("=".repeat(80));
  console.log("Results (times in milliseconds)");
  console.log("=".repeat(80));
  console.log();

  // Sort by median time
  results.sort((a, b) => parseFloat(a.median) - parseFloat(b.median));

  // Find the fastest for comparison
  const fastest = parseFloat(results[0].median);

  // Print table header
  console.log(
    "Parser".padEnd(25) +
      "Median".padStart(10) +
      "Min".padStart(10) +
      "Max".padStart(10) +
      "Avg".padStart(10) +
      "P95".padStart(10) +
      "vs Fastest".padStart(12)
  );
  console.log("-".repeat(87));

  for (const r of results) {
    const ratio = (parseFloat(r.median) / fastest).toFixed(2) + "x";
    const status = r.success ? "" : " (FAILED)";
    console.log(
      (r.name + status).padEnd(25) +
        r.median.padStart(10) +
        r.min.padStart(10) +
        r.max.padStart(10) +
        r.avg.padStart(10) +
        r.p95.padStart(10) +
        ratio.padStart(12)
    );
  }

  console.log();
  console.log("=".repeat(80));
  console.log("Summary");
  console.log("=".repeat(80));
  console.log(`Fastest: ${results[0].name} (${results[0].median}ms median)`);
  console.log(
    `Slowest: ${results[results.length - 1].name} (${
      results[results.length - 1].median
    }ms median)`
  );

  const rangerResult = results.find((r) => r.name.includes("Ranger"));
  if (rangerResult) {
    const rangerRank = results.indexOf(rangerResult) + 1;
    console.log(`Ranger ts_parser rank: #${rangerRank} of ${results.length}`);
  }

  // Show any failures
  const failures = results.filter((r) => !r.success);
  if (failures.length > 0) {
    console.log();
    console.log("Failures:");
    for (const f of failures) {
      console.log(`  ${f.name}: ${f.errorMsg}`);
    }
  }
}

runBenchmarks().catch(console.error);
