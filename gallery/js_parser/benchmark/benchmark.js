// Benchmark: Ranger js_parser vs popular JavaScript parsers (in-process comparison)
import * as espree from "espree";
import * as acorn from "acorn";
import * as babelParser from "@babel/parser";
import * as meriyah from "meriyah";
import * as esprima from "esprima";
import { createRequire } from "module";
import { performance } from "perf_hooks";
import { fileURLToPath } from "url";
import { dirname } from "path";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import Ranger js_parser as module (CommonJS)
const { Lexer, SimpleParser } = require("./js_parser_module.cjs");

// Test code samples
const smallCode = `
// Variable declarations
var x = 42;
const name = "test";
let count = 0;

// Function
function add(a, b) {
  return a + b;
}

// Arrow function
const multiply = (a, b) => a * b;

// Class
class Calculator {
  constructor(value) {
    this.value = value;
  }
  
  add(n) {
    return this.value + n;
  }
}

// Async function
async function fetchData(url) {
  const response = await fetch(url);
  return response.json();
}

// For loop
for (let i = 0; i < 10; i++) {
  console.log(i);
}

// Object and array
const obj = { a: 1, b: 2, nested: { c: 3 } };
const arr = [1, 2, 3, ...obj.nested];
`;

// Generate large test code
function generateLargeCode(multiplier = 50) {
  let code = "// Large benchmark file\n\n";

  for (let i = 0; i < multiplier; i++) {
    code += `var variable${i} = ${i} * 2;\n`;
  }

  for (let i = 0; i < multiplier; i++) {
    code += `
function compute${i}(a, b, c) {
  var result = a + b * c;
  if (result > 100) {
    return result - 50;
  } else {
    return result + 50;
  }
    // Variable declarations
    var x = 1;
    var name = "hello";
    var pi = 3.14159;
    var isReady = true;
    var nothing = null;

    // ES6 let and const
    let count = 0;
    const MAX_VALUE = 100;

    // Array literal
    var numbers = [1, 2, 3, 4, 5];

    // Object literal
    var person = {
    name: "John",
    age: 30,
    active: true,
    };

    // Shorthand properties
    const firstName = "Jane";
    const lastName = "Doe";
    const user = { firstName, lastName, age: 25 };

    /**
     * Sample comment.
     *
     * @param {*} a
     * @param {*} b
     * @returns
     */
    function add(a, b) {
    return a + b;
    }

    // Function expression
    var multiply = function (a, b) {
    return a * b;
    };

    // Arrow functions
    const double = (x) => x * 2;
    const square = (x) => x * x;
    const greet = (name) => {
    return "Hello, " + name;
    };

    // If statement
    if (x > 0) {
    x = x - 1;
    } else {
    x = 0;
    }

    // While loop
    while (x < 10) {
    x = x + 1;
    }

    // For loop
    for (var i = 0; i < 5; i++) {
    numbers[i] = i * 2;
    }

    // For-in loop
    for (var key in person) {
    console.log(key);
    }


}
`;
  }

  for (let i = 0; i < Math.floor(multiplier / 3); i++) {
    code += `
class Entity${i} {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.value = ${i} * 10;
  }
  
  process() {
    return this.id + this.value;
  }
  
  static create(name) {
    return new Entity${i}(${i}, name);
  }
}
`;
  }

  for (let i = 0; i < multiplier; i++) {
    code += `const arrow${i} = (x, y) => x * y + ${i};\n`;
  }

  for (let i = 0; i < multiplier; i++) {
    code += `var expr${i} = (${i} > 25) ? ((${i} * 2) + (${i} / 2)) : ((${i} - 10) * (${i} + 10));\n`;
  }

  return code;
}

// Generic benchmark function
function benchmark(name, parseFn, code, iterations = 100) {
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      parseFn(code);
    } catch (e) {
      // Ignore parse errors
    }
    const end = performance.now();
    times.push(end - start);
  }

  return {
    name,
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
  };
}

// Parser definitions
const parsers = [
  {
    name: "meriyah",
    description: "Ultra-fast ES2022+ parser",
    parse: (code) => meriyah.parseScript(code, { next: true, loc: true }),
  },
  {
    name: "acorn",
    description: "Lightweight ES2020+ parser",
    parse: (code) =>
      acorn.parse(code, {
        ecmaVersion: 2022,
        sourceType: "module",
        locations: true,
      }),
  },
  {
    name: "esprima",
    description: "Original ECMAScript parser",
    parse: (code) => esprima.parseScript(code),
  },
  {
    name: "espree",
    description: "ESLint's parser (based on acorn)",
    parse: (code) =>
      espree.parse(code, {
        ecmaVersion: 2022,
        sourceType: "module",
        loc: true,
      }),
  },
  {
    name: "@babel/parser",
    description: "Full-featured Babel parser",
    parse: (code) => babelParser.parse(code, { sourceType: "module" }),
  },
  {
    name: "Ranger js_parser",
    description: "Parser written in Ranger language",
    parse: (code) => {
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();
      const parser = new SimpleParser();
      parser.initParserWithSource(tokens, code);
      return parser.parseProgram();
    },
  },
];

// Run benchmarks
async function main() {
  const useLarge = process.argv.includes("--large");
  const iterations = 100;

  console.log(
    "╔════════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║       JavaScript Parser Benchmark (in-process comparison)          ║"
  );
  console.log(
    "╚════════════════════════════════════════════════════════════════════╝\n"
  );

  console.log("Parsers being compared:");
  for (const p of parsers) {
    console.log(`  • ${p.name.padEnd(18)} - ${p.description}`);
  }
  console.log(`\nIterations per test: ${iterations}`);
  console.log("All parsers run in-process with warm-up runs.\n");

  const testCases = [{ name: "Small Code (~50 lines)", code: smallCode }];

  if (useLarge) {
    testCases.push({
      name: "Large Code (~1000 lines)",
      code: generateLargeCode(50),
    });
    testCases.push({
      name: "XL Code (~2000 lines)",
      code: generateLargeCode(100),
    });
  }

  for (const { name, code } of testCases) {
    const lines = code.split("\n").length;
    const bytes = Buffer.byteLength(code, "utf8");

    console.log(`\n${"═".repeat(70)}`);
    console.log(`▸ ${name}`);
    console.log(`  Lines: ${lines}, Size: ${(bytes / 1024).toFixed(1)} KB`);
    console.log(`${"─".repeat(70)}`);

    // Warm up all parsers
    for (const p of parsers) {
      try {
        for (let i = 0; i < 5; i++) p.parse(code);
      } catch (e) {}
    }

    // Run benchmarks
    const results = [];
    for (const p of parsers) {
      process.stdout.write(`  Benchmarking ${p.name}...`);
      const result = benchmark(p.name, p.parse, code, iterations);
      results.push(result);
      console.log(` ${result.avg.toFixed(3)} ms`);
    }

    // Sort by average time (fastest first)
    results.sort((a, b) => a.avg - b.avg);

    // Display results table
    console.log(`\n  ${"─".repeat(66)}`);
    console.log(
      "  │ Rank │ Parser              │ Avg (ms)  │ Min (ms)  │ vs Fastest │"
    );
    console.log(`  ${"─".repeat(66)}`);

    const fastest = results[0].avg;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const rank = `#${i + 1}`.padStart(4);
      const name = r.name.padEnd(19);
      const avg = r.avg.toFixed(3).padStart(9);
      const min = r.min.toFixed(3).padStart(9);
      const ratio = (r.avg / fastest).toFixed(2).padStart(5) + "x";
      console.log(
        `  │ ${rank} │ ${name} │ ${avg} │ ${min} │ ${ratio.padStart(10)} │`
      );
    }
    console.log(`  ${"─".repeat(66)}`);

    // Highlight Ranger's position
    const rangerIdx = results.findIndex((r) => r.name === "Ranger js_parser");
    if (rangerIdx === 0) {
      console.log("\n  🏆 Ranger js_parser is the FASTEST!");
    } else if (rangerIdx === 1) {
      console.log(
        `\n  🥈 Ranger js_parser is 2nd fastest (${(
          results[rangerIdx].avg / fastest
        ).toFixed(2)}x slower than ${results[0].name})`
      );
    } else {
      console.log(
        `\n  📊 Ranger js_parser ranked #${rangerIdx + 1} of ${results.length}`
      );
    }
  }

  console.log("\n" + "═".repeat(70));
  console.log("Notes:");
  console.log("  • All parsers run in the same Node.js process");
  console.log("  • Warm-up runs before timing to allow JIT optimization");
  console.log("  • meriyah is known for being one of the fastest JS parsers");
  console.log("  • @babel/parser is the most feature-rich but heavier");
  console.log("═".repeat(70) + "\n");
}

main().catch(console.error);
