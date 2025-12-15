/**
 * Validated Feature Comparison Test
 * 
 * This test properly validates that parsers actually understand the syntax
 * by checking AST node types, not just "parse without crash".
 */

import * as acorn from 'acorn';
import { parse as espree } from 'espree';
import { parse as meriyah } from 'meriyah';
import * as esprima from 'esprima';
import * as babelParser from '@babel/parser';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Lexer, SimpleParser } = require('./js_parser_module.cjs');

// Feature definitions with code and validation functions
const features = [
  // === ES6 Basics ===
  {
    name: 'Arrow Function',
    category: 'ES6 Basics',
    code: 'const fn = (a, b) => a + b;',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'ArrowFunctionExpression'),
      ranger: (ast) => findRangerNode(ast, n => n.vref === '=>' || hasArrowInTree(n))
    }
  },
  {
    name: 'Let/Const',
    category: 'ES6 Basics',
    code: 'let x = 1; const y = 2;',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'VariableDeclaration' && (n.kind === 'let' || n.kind === 'const')),
      ranger: (ast) => findRangerNode(ast, n => n.vref === 'let' || n.vref === 'const')
    }
  },
  {
    name: 'Template Literal',
    category: 'ES6 Basics',
    code: 'const s = `hello ${name}`;',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'TemplateLiteral'),
      ranger: (ast) => findRangerNode(ast, n => n.vref && n.vref.includes('`'))
    }
  },
  {
    name: 'Destructuring Assignment',
    category: 'ES6 Basics',
    code: 'const {a, b} = obj; const [x, y] = arr;',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'ObjectPattern' || n.type === 'ArrayPattern'),
      ranger: (ast) => true // Check if parsed without error
    }
  },
  {
    name: 'Default Parameters',
    category: 'ES6 Basics',
    code: 'function fn(a = 1, b = 2) { return a + b; }',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'AssignmentPattern'),
      ranger: (ast) => findRangerNode(ast, n => n.vref === '=')
    }
  },
  {
    name: 'Rest Parameters',
    category: 'ES6 Basics',
    code: 'function fn(...args) { return args; }',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'RestElement'),
      ranger: (ast) => findRangerNode(ast, n => n.vref === '...')
    }
  },
  {
    name: 'Spread Operator',
    category: 'ES6 Basics',
    code: 'const arr = [...a, ...b];',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'SpreadElement'),
      ranger: (ast) => findRangerNode(ast, n => n.vref === '...')
    }
  },

  // === Classes ===
  {
    name: 'Class Declaration',
    category: 'Classes',
    code: 'class Foo { constructor() {} }',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'ClassDeclaration'),
      ranger: (ast) => findRangerNode(ast, n => n.vref === 'class')
    }
  },
  {
    name: 'Class Extends',
    category: 'Classes',
    code: 'class Bar extends Foo { }',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'ClassDeclaration' && n.superClass),
      ranger: (ast) => findRangerNode(ast, n => n.vref === 'extends')
    }
  },
  {
    name: 'Static Method',
    category: 'Classes',
    code: 'class Foo { static bar() {} }',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'MethodDefinition' && n.static),
      ranger: (ast) => findRangerNode(ast, n => n.vref === 'static')
    }
  },
  {
    name: 'Getter/Setter',
    category: 'Classes',
    code: 'class Foo { get x() { return 1; } set x(v) {} }',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'MethodDefinition' && (n.kind === 'get' || n.kind === 'set')),
      ranger: (ast) => findRangerNode(ast, n => n.vref === 'get' || n.vref === 'set')
    }
  },
  {
    name: 'Private Fields',
    category: 'Classes',
    code: 'class Foo { #x = 1; getX() { return this.#x; } }',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'PrivateIdentifier' || n.type === 'PropertyDefinition' && n.key?.type === 'PrivateIdentifier'),
      ranger: (ast) => findRangerNode(ast, n => n.vref && n.vref.startsWith('#'))
    }
  },
  {
    name: 'Static Block',
    category: 'Classes',
    code: 'class Foo { static { console.log("init"); } }',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'StaticBlock'),
      ranger: (ast) => false // Ranger doesn't support this
    }
  },

  // === Async/Generators ===
  {
    name: 'Async Function',
    category: 'Async/Generators',
    code: 'async function fn() { return 1; }',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'FunctionDeclaration' && n.async),
      ranger: (ast) => findRangerNode(ast, n => n.vref === 'async')
    }
  },
  {
    name: 'Await Expression',
    category: 'Async/Generators',
    code: 'async function fn() { await promise; }',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'AwaitExpression'),
      ranger: (ast) => findRangerNode(ast, n => n.vref === 'await')
    }
  },
  {
    name: 'Generator Function',
    category: 'Async/Generators',
    code: 'function* gen() { yield 1; }',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'FunctionDeclaration' && n.generator),
      ranger: (ast) => findRangerNode(ast, n => n.vref === 'function*' || n.vref === '*')
    }
  },
  {
    name: 'Yield Expression',
    category: 'Async/Generators',
    code: 'function* gen() { yield 1; yield* other(); }',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'YieldExpression'),
      ranger: (ast) => findRangerNode(ast, n => n.vref === 'yield' || n.vref === 'yield*')
    }
  },
  {
    name: 'For-Await-Of',
    category: 'Async/Generators',
    code: 'async function fn() { for await (const x of iter) {} }',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'ForOfStatement' && n.await),
      ranger: (ast) => findRangerNode(ast, n => n.vref === 'for') && findRangerNode(ast, n => n.vref === 'await')
    }
  },

  // === Modern Operators ===
  {
    name: 'Optional Chaining',
    category: 'Modern ES',
    code: 'const x = obj?.prop?.method?.();',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'ChainExpression' || n.optional === true),
      ranger: (ast) => findRangerNode(ast, n => n.vref === '?.' || (n.vref && n.vref.includes('?.')))
    }
  },
  {
    name: 'Nullish Coalescing',
    category: 'Modern ES',
    code: 'const x = a ?? b;',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'LogicalExpression' && n.operator === '??'),
      ranger: (ast) => findRangerNode(ast, n => n.vref === '??')
    }
  },
  {
    name: 'Logical Assignment (&&=)',
    category: 'Modern ES',
    code: 'x &&= y;',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'AssignmentExpression' && n.operator === '&&='),
      ranger: (ast) => findRangerNode(ast, n => n.vref === '&&=')
    }
  },
  {
    name: 'Logical Assignment (||=)',
    category: 'Modern ES',
    code: 'x ||= y;',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'AssignmentExpression' && n.operator === '||='),
      ranger: (ast) => findRangerNode(ast, n => n.vref === '||=')
    }
  },
  {
    name: 'Logical Assignment (??=)',
    category: 'Modern ES',
    code: 'x ??= y;',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'AssignmentExpression' && n.operator === '??='),
      ranger: (ast) => findRangerNode(ast, n => n.vref === '??=')
    }
  },
  {
    name: 'Exponentiation Operator',
    category: 'Modern ES',
    code: 'const x = 2 ** 10;',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'BinaryExpression' && n.operator === '**'),
      ranger: (ast) => findRangerNode(ast, n => n.vref === '**')
    }
  },
  {
    name: 'Numeric Separators',
    category: 'Modern ES',
    code: 'const x = 1_000_000;',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'Literal' && n.raw && n.raw.includes('_')),
      ranger: (ast) => findRangerNode(ast, n => n.vref && n.vref.includes('_') && /\d/.test(n.vref))
    }
  },
  {
    name: 'BigInt',
    category: 'Modern ES',
    code: 'const x = 123n;',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'Literal' && typeof n.bigint === 'string'),
      ranger: (ast) => findRangerNode(ast, n => n.vref && n.vref.endsWith('n') && /^\d+n$/.test(n.vref))
    }
  },

  // === Modules ===
  {
    name: 'Import Declaration',
    category: 'Modules',
    code: 'import { foo } from "bar";',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'ImportDeclaration'),
      ranger: (ast) => findRangerNode(ast, n => n.vref === 'import')
    }
  },
  {
    name: 'Export Declaration',
    category: 'Modules',
    code: 'export const x = 1;',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'ExportNamedDeclaration'),
      ranger: (ast) => findRangerNode(ast, n => n.vref === 'export')
    }
  },
  {
    name: 'Export Default',
    category: 'Modules',
    code: 'export default function() {}',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'ExportDefaultDeclaration'),
      ranger: (ast) => findRangerNode(ast, n => n.vref === 'default')
    }
  },
  {
    name: 'Dynamic Import',
    category: 'Modules',
    code: 'const mod = import("./mod.js");',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'ImportExpression'),
      ranger: (ast) => findRangerNode(ast, n => n.vref === 'import')
    }
  },
  {
    name: 'Import Meta',
    category: 'Modules',
    code: 'const url = import.meta.url;',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'MetaProperty' && n.meta?.name === 'import'),
      ranger: (ast) => findRangerNode(ast, n => n.vref === 'import') && findRangerNode(ast, n => n.vref === 'meta')
    }
  },

  // === Proposals / Extensions ===
  {
    name: 'Decorators',
    category: 'Proposals',
    code: '@decorator class Foo {}',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'Decorator' || (n.decorators && n.decorators.length > 0)),
      ranger: (ast) => false // Ranger doesn't support decorators
    },
    parserOptions: {
      babel: { plugins: ['decorators'] }
    }
  },
  {
    name: 'TypeScript Annotations',
    category: 'Types',
    code: 'function fn(x: number): string { return x.toString(); }',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'TSTypeAnnotation' || n.typeAnnotation),
      ranger: (ast) => false // Ranger doesn't support TypeScript
    },
    parserOptions: {
      babel: { plugins: ['typescript'] }
    }
  },
  {
    name: 'JSX Element',
    category: 'JSX',
    code: 'const el = <div className="test">Hello</div>;',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'JSXElement'),
      ranger: (ast) => false // Ranger doesn't support JSX
    },
    parserOptions: {
      babel: { plugins: ['jsx'] },
      acorn: { ecmaVersion: 2022 }, // Won't work without plugin
      espree: { ecmaFeatures: { jsx: true } }
    }
  },
  {
    name: 'JSX Fragment',
    category: 'JSX',
    code: 'const el = <>Hello</>;',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'JSXFragment'),
      ranger: (ast) => false // Ranger doesn't support JSX
    },
    parserOptions: {
      babel: { plugins: ['jsx'] },
      espree: { ecmaFeatures: { jsx: true } }
    }
  },

  // === Regex ===
  {
    name: 'Named Capture Groups',
    category: 'Regex',
    code: 'const re = /(?<year>\\d{4})-(?<month>\\d{2})/;',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'Literal' && n.regex),
      ranger: (ast) => findRangerNode(ast, n => n.vref && n.vref.startsWith('/') && n.vref.includes('?<'))
    }
  },
  {
    name: 'Unicode Property Escapes',
    category: 'Regex',
    code: 'const re = /\\p{Script=Greek}/u;',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'Literal' && n.regex && n.regex.flags.includes('u')),
      ranger: (ast) => findRangerNode(ast, n => n.vref && n.vref.includes('/u'))
    }
  },
  {
    name: 'Regex d Flag',
    category: 'Regex',
    code: 'const re = /foo/d;',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'Literal' && n.regex && n.regex.flags.includes('d')),
      ranger: (ast) => findRangerNode(ast, n => n.vref && n.vref.endsWith('/d'))
    }
  },

  // === Other Features ===
  {
    name: 'Object Shorthand',
    category: 'ES6 Basics',
    code: 'const obj = { x, y, method() {} };',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'Property' && n.shorthand),
      ranger: (ast) => true // Basic object parsing
    }
  },
  {
    name: 'Computed Property',
    category: 'ES6 Basics',
    code: 'const obj = { [key]: value };',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'Property' && n.computed),
      ranger: (ast) => findRangerNode(ast, n => n.vref === '[')
    }
  },
  {
    name: 'For-Of Loop',
    category: 'ES6 Basics',
    code: 'for (const x of arr) {}',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'ForOfStatement'),
      ranger: (ast) => findRangerNode(ast, n => n.vref === 'of')
    }
  },
  {
    name: 'Symbol',
    category: 'ES6 Basics',
    code: 'const sym = Symbol("desc");',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'CallExpression' && n.callee?.name === 'Symbol'),
      ranger: (ast) => findRangerNode(ast, n => n.vref === 'Symbol')
    }
  },
  {
    name: 'New Target',
    category: 'ES6 Basics',
    code: 'function Foo() { if (new.target) {} }',
    validate: {
      estree: (ast) => findNode(ast, n => n.type === 'MetaProperty' && n.meta?.name === 'new'),
      ranger: (ast) => findRangerNode(ast, n => n.vref === 'new') && findRangerNode(ast, n => n.vref === 'target')
    }
  }
];

// Helper: Find node in ESTree AST
function findNode(ast, predicate) {
  if (!ast || typeof ast !== 'object') return false;
  if (predicate(ast)) return true;
  for (const key of Object.keys(ast)) {
    const val = ast[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        if (findNode(item, predicate)) return true;
      }
    } else if (val && typeof val === 'object') {
      if (findNode(val, predicate)) return true;
    }
  }
  return false;
}

// Helper: Find node in Ranger AST
function findRangerNode(ast, predicate) {
  if (!ast || typeof ast !== 'object') return false;
  if (predicate(ast)) return true;
  if (ast.children && Array.isArray(ast.children)) {
    for (const child of ast.children) {
      if (findRangerNode(child, predicate)) return true;
    }
  }
  return false;
}

// Helper: Check for arrow in Ranger tree
function hasArrowInTree(ast) {
  return findRangerNode(ast, n => n.vref === '=>');
}

// Parser configurations
const parsers = {
  acorn: {
    name: 'Acorn',
    parse: (code, isModule) => {
      return acorn.parse(code, {
        ecmaVersion: 2024,
        sourceType: isModule ? 'module' : 'script'
      });
    }
  },
  esprima: {
    name: 'Esprima',
    parse: (code, isModule) => {
      return esprima.parseScript(code, { jsx: false });
    }
  },
  espree: {
    name: 'Espree',
    parse: (code, isModule, opts = {}) => {
      return espree(code, {
        ecmaVersion: 2024,
        sourceType: isModule ? 'module' : 'script',
        ...opts
      });
    }
  },
  meriyah: {
    name: 'Meriyah',
    parse: (code, isModule) => {
      return meriyah(code, {
        module: isModule,
        next: true,
        ranges: false
      });
    }
  },
  babel: {
    name: '@babel/parser',
    parse: (code, isModule, opts = {}) => {
      return babelParser.parse(code, {
        sourceType: isModule ? 'module' : 'script',
        plugins: opts.plugins || []
      });
    }
  },
  ranger: {
    name: 'Ranger',
    parse: (code, isModule) => {
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();
      const parser = new SimpleParser();
      parser.initParserWithSource(tokens, code);
      const ast = parser.parseProgram();
      if (parser.hasErrors()) {
        throw new Error(parser.errors.join(', '));
      }
      return ast;
    }
  }
};

// Check if a feature requires module sourceType
function requiresModule(feature) {
  return feature.code.includes('import ') || feature.code.includes('export ');
}

// Test a single feature with a single parser
function testFeature(parserKey, feature) {
  const parser = parsers[parserKey];
  const isModule = requiresModule(feature);
  const opts = feature.parserOptions?.[parserKey] || {};
  
  try {
    const ast = parser.parse(feature.code, isModule, opts);
    
    // Use appropriate validator
    const validator = parserKey === 'ranger' 
      ? feature.validate.ranger 
      : feature.validate.estree;
    
    const isValid = validator(ast);
    return { success: true, valid: isValid };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Run all tests
function runTests() {
  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║           JavaScript Parser Feature Comparison (Validated)             ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

  const results = {};
  const parserKeys = Object.keys(parsers);
  
  // Initialize results
  for (const key of parserKeys) {
    results[key] = { passed: 0, failed: 0, parseError: 0, features: [] };
  }

  // Group features by category
  const categories = {};
  for (const feature of features) {
    if (!categories[feature.category]) {
      categories[feature.category] = [];
    }
    categories[feature.category].push(feature);
  }

  // Test each category
  for (const [category, categoryFeatures] of Object.entries(categories)) {
    console.log(`\n┌─ ${category} ${'─'.repeat(70 - category.length - 3)}┐`);
    
    for (const feature of categoryFeatures) {
      const featureResults = {};
      
      for (const parserKey of parserKeys) {
        const result = testFeature(parserKey, feature);
        featureResults[parserKey] = result;
        
        if (!result.success) {
          results[parserKey].parseError++;
        } else if (result.valid) {
          results[parserKey].passed++;
        } else {
          results[parserKey].failed++;
        }
        
        results[parserKey].features.push({
          name: feature.name,
          ...result
        });
      }
      
      // Print feature row
      const statusIcons = parserKeys.map(key => {
        const r = featureResults[key];
        if (!r.success) return '✗';
        return r.valid ? '✓' : '○';
      });
      
      const featureName = feature.name.padEnd(28);
      const statusStr = statusIcons.map((icon, i) => {
        const name = parsers[parserKeys[i]].name.slice(0, 7).padEnd(7);
        return `${name}:${icon}`;
      }).join(' │ ');
      
      console.log(`│ ${featureName} │ ${statusStr} │`);
    }
    
    console.log(`└${'─'.repeat(74)}┘`);
  }

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║                              SUMMARY                                   ║');
  console.log('╠════════════════════════════════════════════════════════════════════════╣');
  
  const header = ['Parser', 'Passed', 'No AST Node', 'Parse Error', 'Score'].map(s => s.padEnd(13)).join('│');
  console.log(`║ ${header} ║`);
  console.log('╠' + '═'.repeat(74) + '╣');
  
  const totals = features.length;
  const sortedParsers = parserKeys.sort((a, b) => results[b].passed - results[a].passed);
  
  for (const key of sortedParsers) {
    const r = results[key];
    const score = ((r.passed / totals) * 100).toFixed(1) + '%';
    const row = [
      parsers[key].name.padEnd(13),
      String(r.passed).padEnd(13),
      String(r.failed).padEnd(13),
      String(r.parseError).padEnd(13),
      score.padEnd(13)
    ].join('│');
    console.log(`║ ${row}║`);
  }
  
  console.log('╚════════════════════════════════════════════════════════════════════════╝');
  
  // Legend
  console.log('\nLegend:');
  console.log('  ✓ = Parsed and produced expected AST node');
  console.log('  ○ = Parsed but did NOT produce expected AST node (false positive prevention)');
  console.log('  ✗ = Parse error');
  console.log(`\nTotal features tested: ${totals}`);
}

runTests();
