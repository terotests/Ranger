/**
 * Generate detailed ESTree compliance report for Ranger js_parser
 */

const fs = require("fs");
const path = require("path");
const acorn = require("acorn");
const { Lexer, SimpleParser } = require("./js_parser_module.cjs");

// Helper to parse with Ranger
function rangerParse(code) {
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  const parser = new SimpleParser();
  parser.initParserWithSource(tokens, code);
  return parser.parseProgram();
}

// Feature definitions
const features = [
  {
    name: "Arrow Function",
    code: "const fn = (a, b) => a + b;",
    check: (n) => n.type === "ArrowFunctionExpression",
  },
  {
    name: "Let/Const",
    code: "let x = 1; const y = 2;",
    check: (n) =>
      n.type === "VariableDeclaration" &&
      (n.kind === "let" || n.kind === "const"),
  },
  {
    name: "Template Literal",
    code: "const s = `hello ${name}`;",
    check: (n) => n.type === "TemplateLiteral",
  },
  {
    name: "Object Destructuring",
    code: "const {a, b} = obj;",
    check: (n) => n.type === "ObjectPattern",
  },
  {
    name: "Array Destructuring",
    code: "const [x, y] = arr;",
    check: (n) => n.type === "ArrayPattern",
  },
  {
    name: "Default Parameters",
    code: "function fn(a = 1) { return a; }",
    check: (n) => n.type === "AssignmentPattern",
  },
  {
    name: "Rest Parameters",
    code: "function fn(...args) { return args; }",
    check: (n) => n.type === "RestElement",
  },
  {
    name: "Spread Operator",
    code: "const arr = [...a, ...b];",
    check: (n) => n.type === "SpreadElement",
  },
  {
    name: "Class Declaration",
    code: "class Foo { constructor() {} }",
    check: (n) => n.type === "ClassDeclaration",
  },
  {
    name: "Class Extends",
    code: "class Bar extends Foo { }",
    check: (n) => n.type === "ClassDeclaration" && n.superClass,
  },
  {
    name: "Static Method",
    code: "class Foo { static bar() {} }",
    check: (n) => n.type === "MethodDefinition" && n.static === true,
  },
  {
    name: "Getter",
    code: "class Foo { get x() { return 1; } }",
    check: (n) => n.type === "MethodDefinition" && n.kind === "get",
  },
  {
    name: "Setter",
    code: "class Foo { set x(v) {} }",
    check: (n) => n.type === "MethodDefinition" && n.kind === "set",
  },
  {
    name: "Private Fields",
    code: "class Foo { #x = 1; }",
    check: (n) =>
      n.type === "PrivateIdentifier" ||
      (n.type === "PropertyDefinition" && n.key?.type === "PrivateIdentifier"),
  },
  {
    name: "Static Block",
    code: 'class Foo { static { console.log("init"); } }',
    check: (n) => n.type === "StaticBlock",
  },
  {
    name: "Async Function",
    code: "async function fn() { return 1; }",
    check: (n) => n.type === "FunctionDeclaration" && n.async === true,
  },
  {
    name: "Await Expression",
    code: "async function fn() { await promise; }",
    check: (n) => n.type === "AwaitExpression",
  },
  {
    name: "Generator Function",
    code: "function* gen() { yield 1; }",
    check: (n) => n.type === "FunctionDeclaration" && n.generator === true,
  },
  {
    name: "Yield Expression",
    code: "function* gen() { yield 1; }",
    check: (n) => n.type === "YieldExpression",
  },
  {
    name: "For-Await-Of",
    code: "async function fn() { for await (const x of iter) {} }",
    check: (n) => n.type === "ForOfStatement" && n.await === true,
  },
  {
    name: "Optional Chaining",
    code: "const x = obj?.prop;",
    check: (n) => n.type === "ChainExpression" || n.optional === true,
  },
  {
    name: "Nullish Coalescing",
    code: "const x = a ?? b;",
    check: (n) => n.type === "LogicalExpression" && n.operator === "??",
  },
  {
    name: "Logical Assignment &&=",
    code: "x &&= y;",
    check: (n) => n.type === "AssignmentExpression" && n.operator === "&&=",
  },
  {
    name: "Logical Assignment ||=",
    code: "x ||= y;",
    check: (n) => n.type === "AssignmentExpression" && n.operator === "||=",
  },
  {
    name: "Logical Assignment ??=",
    code: "x ??= y;",
    check: (n) => n.type === "AssignmentExpression" && n.operator === "??=",
  },
  {
    name: "Exponentiation",
    code: "const x = 2 ** 10;",
    check: (n) => n.type === "BinaryExpression" && n.operator === "**",
  },
  {
    name: "Numeric Separators",
    code: "const x = 1_000_000;",
    check: (n) => n.type === "Literal" && n.raw && n.raw.includes("_"),
  },
  {
    name: "BigInt",
    code: "const x = 123n;",
    check: (n) => n.type === "Literal" && typeof n.bigint === "string",
  },
  {
    name: "Import Declaration",
    code: 'import { foo } from "bar";',
    check: (n) => n.type === "ImportDeclaration",
    module: true,
  },
  {
    name: "Export Declaration",
    code: "export const x = 1;",
    check: (n) => n.type === "ExportNamedDeclaration",
    module: true,
  },
  {
    name: "Export Default",
    code: "export default function() {}",
    check: (n) => n.type === "ExportDefaultDeclaration",
    module: true,
  },
  {
    name: "Dynamic Import",
    code: 'const mod = import("./mod.js");',
    check: (n) => n.type === "ImportExpression",
  },
  {
    name: "Import Meta",
    code: "const url = import.meta.url;",
    check: (n) => n.type === "MetaProperty" && n.meta?.name === "import",
    module: true,
  },
  {
    name: "For-Of Loop",
    code: "for (const x of arr) {}",
    check: (n) => n.type === "ForOfStatement",
  },
  {
    name: "Object Shorthand",
    code: "const obj = { x, method() {} };",
    check: (n) => n.type === "Property" && n.shorthand === true,
  },
  {
    name: "Computed Property",
    code: "const obj = { [key]: value };",
    check: (n) => n.type === "Property" && n.computed === true,
  },
  {
    name: "New Target",
    code: "function Foo() { if (new.target) {} }",
    check: (n) => n.type === "MetaProperty" && n.meta?.name === "new",
  },
  {
    name: "Regex Literal",
    code: "const re = /test/gi;",
    check: (n) => n.type === "Literal" && n.regex,
  },
];

function findNode(ast, predicate) {
  if (!ast || typeof ast !== "object") return null;
  if (predicate(ast)) return ast;
  for (const key of Object.keys(ast)) {
    const val = ast[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        const found = findNode(item, predicate);
        if (found) return found;
      }
    } else if (val && typeof val === "object") {
      const found = findNode(val, predicate);
      if (found) return found;
    }
  }
  return null;
}

function findAllNodes(ast, predicate, results = []) {
  if (!ast || typeof ast !== "object") return results;
  if (predicate(ast)) results.push(ast);
  for (const key of Object.keys(ast)) {
    const val = ast[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        findAllNodes(item, predicate, results);
      }
    } else if (val && typeof val === "object") {
      findAllNodes(val, predicate, results);
    }
  }
  return results;
}

function collectAllTypes(ast, types = new Set()) {
  if (!ast || typeof ast !== "object") return types;
  if (ast.type) types.add(ast.type);
  for (const key of Object.keys(ast)) {
    const val = ast[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        collectAllTypes(item, types);
      }
    } else if (val && typeof val === "object") {
      collectAllTypes(val, types);
    }
  }
  return types;
}

function summarizeNode(node, depth = 0) {
  if (!node || typeof node !== "object") return String(node);
  if (depth > 2) return "{...}";

  const summary = {};
  for (const [key, val] of Object.entries(node)) {
    if (key === "loc" || key === "range" || key === "start" || key === "end")
      continue;
    if (val === null || val === undefined) continue;
    if (Array.isArray(val)) {
      summary[key] = `[${val.length} items]`;
    } else if (typeof val === "bigint") {
      summary[key] = val.toString() + "n";
    } else if (typeof val === "object") {
      summary[key] = val.type || summarizeNode(val, depth + 1);
    } else {
      summary[key] = val;
    }
  }
  return summary;
}

// Clean AST for display - remove position info, handle BigInt
function cleanAst(node) {
  if (!node || typeof node !== "object") return node;
  if (typeof node === "bigint") return node.toString() + "n";

  if (Array.isArray(node)) {
    return node.map((item) => cleanAst(item));
  }

  const cleaned = {};
  for (const [key, val] of Object.entries(node)) {
    // Skip position info
    if (key === "loc" || key === "range" || key === "start" || key === "end")
      continue;
    // Skip empty arrays and default false values for cleaner output
    if (Array.isArray(val) && val.length === 0) continue;
    if (val === null) {
      cleaned[key] = null;
      continue;
    }
    if (typeof val === "bigint") {
      cleaned[key] = val.toString() + "n";
    } else if (typeof val === "object") {
      cleaned[key] = cleanAst(val);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

// Generate report
let report = `# Ranger js_parser ESTree Compliance Report

Generated: ${new Date().toISOString()}

This document details the ESTree compliance of Ranger's JavaScript parser.
It compares Ranger's AST output against Acorn (reference ESTree implementation).

## Summary

`;

const results = {
  pass: [],
  fail: [],
  parseError: [],
};

for (const feature of features) {
  let acornAst = null;
  let rangerAst = null;
  let acornError = null;
  let rangerError = null;

  // Parse with Acorn
  try {
    acornAst = acorn.parse(feature.code, {
      ecmaVersion: 2024,
      sourceType: feature.module ? "module" : "script",
    });
  } catch (e) {
    acornError = e.message;
  }

  // Parse with Ranger
  try {
    rangerAst = rangerParse(feature.code);
  } catch (e) {
    rangerError = e.message;
  }

  const acornFound = acornAst ? findNode(acornAst, feature.check) : null;
  const rangerFound = rangerAst ? findNode(rangerAst, feature.check) : null;

  feature.acornResult = { ast: acornAst, found: acornFound, error: acornError };
  feature.rangerResult = {
    ast: rangerAst,
    found: rangerFound,
    error: rangerError,
  };

  if (rangerError) {
    results.parseError.push(feature);
  } else if (rangerFound) {
    results.pass.push(feature);
  } else {
    results.fail.push(feature);
  }
}

const total = features.length;
const passCount = results.pass.length;
const failCount = results.fail.length;
const errorCount = results.parseError.length;

report += `

This section compares which ESTree node types each parser produces.

### All Node Types Found

| Feature | Acorn Types | Ranger Types | Match |
|---------|-------------|--------------|-------|
`;

for (const f of features) {
  const acornTypes = f.acornResult.ast
    ? [...collectAllTypes(f.acornResult.ast)].sort()
    : [];
  const rangerTypes = f.rangerResult.ast
    ? [...collectAllTypes(f.rangerResult.ast)].sort()
    : [];
  const match =
    JSON.stringify(acornTypes) === JSON.stringify(rangerTypes) ? "✅" : "❌";
  report += `| ${f.name} | ${acornTypes.slice(0, 5).join(", ")}${
    acornTypes.length > 5 ? "..." : ""
  } | ${rangerTypes.slice(0, 5).join(", ")}${
    rangerTypes.length > 5 ? "..." : ""
  } | ${match} |\n`;
}

report += `

## Node Type Comparison

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Pass | ${passCount} | ${((passCount / total) * 100).toFixed(1)}% |
| ❌ Fail (validation) | ${failCount} | ${((failCount / total) * 100).toFixed(
  1
)}% |
| 💥 Parse Error | ${errorCount} | ${((errorCount / total) * 100).toFixed(1)}% |
| **Total** | **${total}** | **100%** |

## Detailed Results

### ✅ Passing Features (${passCount})

`;

for (const f of results.pass) {
  report += `#### ${f.name}

**Code:** \`${f.code}\`


`;
}

report += `
### ❌ Failed Validations (${failCount})

These features parsed successfully but the AST structure doesn't match ESTree expectations.

`;

for (const f of results.fail) {
  const rangerTypes = collectAllTypes(f.rangerResult.ast);
  const acornTypes = collectAllTypes(f.acornResult.ast);

  report += `#### ${f.name}

**Code:** \`${f.code}\`

**Expected ESTree node:** Looking for specific node type/properties

**Acorn AST types:** ${[...acornTypes].join(", ")}

**Ranger AST types:** ${[...rangerTypes].join(", ")}

<details>
<summary>Full Acorn AST (reference)</summary>

\`\`\`json
${JSON.stringify(cleanAst(f.acornResult.ast), null, 2)}
\`\`\`
</details>

<details>
<summary>Full Ranger AST</summary>

\`\`\`json
${JSON.stringify(cleanAst(f.rangerResult.ast), null, 2)}
\`\`\`
</details>

**Key Differences:**
`;

  // Identify specific differences
  const differences = [];

  // Check for missing node types
  for (const t of acornTypes) {
    if (!rangerTypes.has(t)) {
      differences.push(`- Missing node type: \`${t}\``);
    }
  }

  // Check for extra node types
  for (const t of rangerTypes) {
    if (!acornTypes.has(t)) {
      differences.push(`- Extra node type: \`${t}\``);
    }
  }

  if (differences.length > 0) {
    report += differences.join("\n") + "\n";
  } else {
    report += "- Node types match but property values differ\n";
  }

  report += `
---

`;
}

report += `### 💥 Parse Errors (${errorCount})

These features failed to parse.

`;

for (const f of results.parseError) {
  report += `#### ${f.name}

**Code:** \`${f.code}\`

**Error:** ${f.rangerResult.error}

---

`;
}

report += `

## Recommendations

Based on the analysis, here are areas where Ranger's ESTree compliance could be improved:

`;

// Identify common issues
const missingTypes = new Set();
for (const f of results.fail) {
  const acornTypes = collectAllTypes(f.acornResult.ast);
  const rangerTypes = collectAllTypes(f.rangerResult.ast);
  for (const t of acornTypes) {
    if (!rangerTypes.has(t)) {
      missingTypes.add(t);
    }
  }
}

if (missingTypes.size > 0) {
  report += `### Missing Node Types

The following ESTree node types were found in Acorn output but not in Ranger:

${[...missingTypes].map((t) => `- \`${t}\``).join("\n")}

`;
}

// Write report
fs.writeFileSync(path.join(__dirname, "COMPLIANCE.md"), report);
console.log("Report written to COMPLIANCE.md");
console.log(
  `\nSummary: ${passCount}/${total} features passing (${(
    (passCount / total) *
    100
  ).toFixed(1)}%)`
);
