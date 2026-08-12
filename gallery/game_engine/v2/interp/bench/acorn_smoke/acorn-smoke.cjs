#!/usr/bin/env node
'use strict';

/**
 * acorn@8.14.1 smoke on ComponentEngine.
 *
 * Prepare step (engine only):
 *   1. Unwrap UMD → `var acorn={}; (function(exports){…})(acorn)`
 *   2. Rename value-position Identifier `type` → `tokType`
 *      (engine TS parser treats bare `type = …` as a type-alias)
 *   3. Rewrite `new this(` → `new Parser(`
 *      (engine throws "expression is not a constructor" for `new this`)
 *
 * Usage:
 *   node acorn-smoke.cjs
 *   node acorn-smoke.cjs --fail-on-diff --json=/tmp/acorn-smoke.json
 */

const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const ROOT = path.resolve(HERE, '../../../../../..');
const ENGINE_MODULE = path.join(ROOT, 'gallery/game_engine/v2/interp/bin/engine_module.cjs');
const VENDOR = path.join(HERE, 'vendor/acorn.js');
const PREPARED = path.join(HERE, '.cache/acorn.prepared.js');

/**
 * Each case: `source` is parsed by acorn; `summarize(ast)` returns a
 * JSON-serializable structural summary compared engine↔Node.
 */
const CASES = [
  {
    name: 'var_decl',
    source: 'var x = 1;',
    options: { ecmaVersion: 2020 },
    summarize: (ast) => ({
      type: ast.type,
      body: ast.body.map((n) => n.type),
    }),
  },
  {
    name: 'arrow_and_class',
    source:
      'const add = (a, b) => a + b;\n' +
      'class Point { constructor(x, y) { this.x = x; this.y = y; } dist() { return this.x; } }\n',
    options: { ecmaVersion: 2022, locations: true },
    summarize: (ast) => ({
      type: ast.type,
      body: ast.body.map((n) => n.type),
      arrow: ast.body[0].declarations[0].init.type,
      className: ast.body[1].id.name,
      methods: ast.body[1].body.body.map((m) => m.kind + ':' + (m.key.name || m.key.value)),
      startLine: ast.loc.start.line,
      endLine: ast.loc.end.line,
    }),
  },
  {
    name: 'async_forof_template',
    source:
      'async function load(url) { return await fetch(url); }\n' +
      'for (const n of [1, 2, 3]) { load("/" + n); }\n' +
      'const url = `http://localhost:${port}`;\n',
    options: { ecmaVersion: 2022 },
    summarize: (ast) => ({
      body: ast.body.map((n) => n.type),
      async: !!ast.body[0].async,
      await: ast.body[0].body.body[0].argument.type,
      forOf: ast.body[1].await === false ? 'ForOfStatement' : ast.body[1].type,
      tmpl: ast.body[2].declarations[0].init.type,
      tmplExprs: ast.body[2].declarations[0].init.expressions.length,
    }),
  },
  {
    name: 'module_import_export',
    source:
      "import x, { y as z } from 'mod';\n" +
      'export default function f() { return 1; }\n' +
      'export const k = 2;\n',
    options: { ecmaVersion: 2022, sourceType: 'module' },
    summarize: (ast) => ({
      sourceType: ast.sourceType,
      body: ast.body.map((n) => n.type),
      importDefault: ast.body[0].specifiers[0].type,
      importNamed: ast.body[0].specifiers[1].type,
      exportDefault: ast.body[1].declaration.type,
    }),
  },
  {
    name: 'object_spread_and_rest',
    source:
      'const cfg = { ...base, port: 8080 };\n' +
      'function take({ a, b = 2, ...rest }) { return rest; }\n',
    options: { ecmaVersion: 2022 },
    summarize: (ast) => ({
      body: ast.body.map((n) => n.type),
      props: ast.body[0].declarations[0].init.properties.map((p) => p.type),
      paramProps: ast.body[1].params[0].properties.map((p) => p.type),
      defaultParam: ast.body[1].params[0].properties[1].value.right.value,
    }),
  },
  {
    name: 'optional_chain_and_nullish',
    source: 'const x = obj?.a?.b ?? fallback;\n',
    options: { ecmaVersion: 2022 },
    summarize: (ast) => ({
      init: ast.body[0].declarations[0].init.type,
      left: ast.body[0].declarations[0].init.left.type,
      op: ast.body[0].declarations[0].init.operator,
    }),
  },
  {
    name: 'complex_program',
    source: [
      'export async function buildReport(rows) {',
      '  const active = rows.filter((r) => r.ok ?? false);',
      '  const byRegion = new Map();',
      '  for (const row of active) {',
      '    const key = row.region?.id ?? "unknown";',
      '    const cur = byRegion.get(key) ?? { total: 0, items: [] };',
      '    cur.total += row.qty * row.price;',
      '    cur.items.push({ ...row, key });',
      '    byRegion.set(key, cur);',
      '  }',
      '  return [...byRegion.entries()].map(([region, v]) => ({ region, ...v }));',
      '}',
    ].join('\n'),
    options: { ecmaVersion: 2022, sourceType: 'module', locations: true },
    summarize: (ast) => ({
      body: ast.body.map((n) => n.type),
      asyncExport: ast.body[0].declaration.async,
      name: ast.body[0].declaration.id.name,
      stmtTypes: ast.body[0].declaration.body.body.map((n) => n.type),
      lines: ast.loc.end.line - ast.loc.start.line + 1,
    }),
  },
];

function parseArgs(argv) {
  const out = { json: null, failOnDiff: false };
  for (const a of argv.slice(2)) {
    if (a.startsWith('--json=')) out.json = a.slice('--json='.length);
    else if (a === '--fail-on-diff') out.failOnDiff = true;
  }
  return out;
}

function loadNodeAcorn() {
  return require(VENDOR);
}

function rewriteUmdToGlobal(src) {
  const startMarker = "(function (exports) { 'use strict';";
  const start = src.indexOf(startMarker);
  if (start < 0) throw new Error('acorn prepare: factory start not found');
  let end = src.lastIndexOf('})));');
  if (end < 0) end = src.lastIndexOf('}));');
  if (end < 0) throw new Error('acorn prepare: factory end not found');
  const factoryBody = src.slice(start + startMarker.length, end);
  return [
    'var acorn = {};',
    '(function (exports) {',
    "  'use strict';",
    factoryBody,
    '})(acorn);',
    'if (typeof globalThis !== "undefined") globalThis.acorn = acorn;',
  ].join('\n');
}

function renameTypeIdents(code, acorn) {
  const ast = acorn.parse(code, { ecmaVersion: 2020, ranges: true, sourceType: 'script' });
  const renames = [];
  function isPropKey(node, parent) {
    if (!parent) return false;
    if (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) return true;
    if (parent.type === 'Property' && parent.key === node && !parent.computed) return true;
    if (parent.type === 'MethodDefinition' && parent.key === node && !parent.computed) return true;
    if (parent.type === 'LabeledStatement' && parent.label === node) return true;
    return false;
  }
  function walk(node, parent) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'Identifier' && node.name === 'type' && !isPropKey(node, parent)) {
      renames.push({ start: node.start, end: node.end });
    }
    for (const key of Object.keys(node)) {
      if (key === 'start' || key === 'end' || key === 'loc' || key === 'range') continue;
      const v = node[key];
      if (Array.isArray(v)) v.forEach((c) => walk(c, node));
      else if (v && typeof v.type === 'string') walk(v, node);
    }
  }
  walk(ast, null);
  renames.sort((a, b) => b.start - a.start);
  let out = code;
  for (const r of renames) out = out.slice(0, r.start) + 'tokType' + out.slice(r.end);
  return out;
}

function prepareAcornForEngine() {
  if (!fs.existsSync(VENDOR)) throw new Error(`missing ${VENDOR}`);
  const nodeAcorn = loadNodeAcorn();
  let code = rewriteUmdToGlobal(fs.readFileSync(VENDOR, 'utf8'));
  code = renameTypeIdents(code, nodeAcorn);
  // Engine cannot construct with `new this(...)` (acorn Parser.parse).
  code = code.replace(/new this\s*\(/g, 'new Parser(');
  fs.mkdirSync(path.dirname(PREPARED), { recursive: true });
  fs.writeFileSync(PREPARED, code);
  return PREPARED;
}

function loadEngineModule() {
  if (!fs.existsSync(ENGINE_MODULE)) {
    throw new Error(`missing ${ENGINE_MODULE}\nRun: bash scripts/build-engine-module.sh`);
  }
  return require(ENGINE_MODULE);
}

function toHost(r) {
  if (!r) return { ok: false, error: 'missing return' };
  if (r.isString && r.isString()) return { ok: true, value: r.stringOf() };
  if (r.isUndefined && r.isUndefined()) return { ok: false, error: 'undefined' };
  if (r.isNull && r.isNull()) return { ok: false, error: 'null' };
  return { ok: false, error: `kind ${r.kindName ? r.kindName() : '?'}` };
}

function summarizeSrc(fn) {
  // Serialize summarize function for embedding into engine script.
  return fn.toString();
}

function createEngineSession() {
  const { ComponentEngine, EvHandle: EvalValue } = loadEngineModule();
  const eng = new ComponentEngine();
  eng.quiet = true;
  const prepared = fs.readFileSync(prepareAcornForEngine(), 'utf8');

  const helpers = [
    'function __acorn_api__() {',
    '  if (!globalThis.acorn || typeof acorn.parse !== "function") return "missing";',
    '  return "ok:" + String(acorn.version);',
    '}',
  ];

  for (const c of CASES) {
    // Embed source + options; summarize runs on engine and returns JSON.
    helpers.push(
      `function __case_${c.name}_json() {`,
      `  var src = ${JSON.stringify(c.source)};`,
      `  var options = ${JSON.stringify(c.options)};`,
      `  var summarize = ${summarizeSrc(c.summarize)};`,
      '  try {',
      '    var ast = acorn.parse(src, options);',
      '    return JSON.stringify(summarize(ast));',
      '  } catch (err) {',
      '    return "THREW:" + (err && err.message ? err.message : String(err));',
      '  }',
      '}',
    );
  }

  const origLog = console.log;
  console.log = function () {};
  try {
    eng.loadScript(prepared + '\n' + helpers.join('\n'));
  } catch (err) {
    console.log = origLog;
    return {
      ok: false,
      stage: 'load',
      error: String(err && err.message ? err.message : err),
    };
  } finally {
    console.log = origLog;
  }

  try {
    const api = toHost(eng.callFunction('__acorn_api__', EvalValue.null()));
    if (!api.ok || String(api.value).indexOf('ok:') !== 0) {
      return {
        ok: false,
        stage: 'api',
        error: api.ok ? String(api.value) : api.error,
      };
    }
  } catch (err) {
    return {
      ok: false,
      stage: 'api',
      error: String(err && err.message ? err.message : err),
    };
  }

  return {
    ok: true,
    runJson(name) {
      try {
        const r = toHost(eng.callFunction(`__case_${name}_json`, EvalValue.null()));
        if (!r.ok || typeof r.value !== 'string') {
          return {
            ok: false,
            error: r.ok ? `non-string ${typeof r.value}` : r.error,
          };
        }
        if (String(r.value).indexOf('THREW:') === 0) {
          return { ok: false, error: r.value };
        }
        return { ok: true, json: r.value };
      } catch (err) {
        return {
          ok: false,
          error: String(err && err.message ? err.message : err),
        };
      }
    },
  };
}

function runNodeCase(acorn, c) {
  const ast = acorn.parse(c.source, c.options);
  return JSON.stringify(c.summarize(ast));
}

function main() {
  const args = parseArgs(process.argv);
  const acorn = loadNodeAcorn();
  const session = createEngineSession();
  if (!session.ok) {
    console.error(`FAIL(${session.stage}) ${session.error}`);
    process.exitCode = 1;
    return;
  }

  console.log(`acorn ${acorn.version} loaded on engine (prepared)`);
  const results = [];
  let hardFail = false;
  let diffFail = false;

  for (const c of CASES) {
    let nodeJson;
    try {
      nodeJson = runNodeCase(acorn, c);
    } catch (err) {
      hardFail = true;
      console.log(`FAIL(node)    ${c.name.padEnd(28)} ${err.message}`);
      results.push({ name: c.name, matchNode: false, error: String(err.message) });
      continue;
    }
    const eng = session.runJson(c.name);
    const match = eng.ok && eng.json === nodeJson;
    if (!eng.ok) hardFail = true;
    if (!match) diffFail = true;
    results.push({
      name: c.name,
      matchNode: match,
      engineOk: !!eng.ok,
      nodeJson,
      engineJson: eng.ok ? eng.json : null,
      error: eng.ok ? null : eng.error,
    });
    const status = !eng.ok ? 'FAIL' : match ? 'MATCH' : 'DIFF';
    const preview = eng.ok
      ? eng.json.length > 90
        ? eng.json.slice(0, 70) + '…'
        : eng.json
      : eng.error;
    console.log(`${status.padEnd(12)} ${c.name.padEnd(28)} ${preview}`);
  }

  const matched = results.filter((r) => r.matchNode).length;
  console.log('');
  console.log(
    `acorn smoke: match ${matched}/${results.length}` +
      (hardFail ? '  [HARD FAIL]' : '  [hard gates ok]') +
      (args.failOnDiff && diffFail ? '  [DIFF FAIL]' : ''),
  );

  if (args.json) {
    const abs = path.resolve(args.json);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(
      abs,
      JSON.stringify(
        {
          library: 'acorn',
          version: acorn.version,
          prepare: ['unwrap-umd', 'rename-type-idents', 'new-this→new-Parser'],
          cases: results.length,
          matchNode: matched,
          hardFail,
          results,
        },
        null,
        2,
      ),
    );
    console.log(`wrote ${abs}`);
  }

  process.exitCode = hardFail || (args.failOnDiff && diffFail) ? 1 : 0;
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}

module.exports = {
  CASES,
  VENDOR,
  PREPARED,
  prepareAcornForEngine,
  createEngineSession,
  runNodeCase,
  loadNodeAcorn,
};
