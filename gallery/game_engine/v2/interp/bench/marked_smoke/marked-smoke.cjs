#!/usr/bin/env node
'use strict';

/**
 * marked markdown library smoke on ComponentEngine.
 *
 * Vendors marked@4.3.0 UMD (classic CommonJS build) — newer marked releases
 * use syntax the engine cannot parse yet (e.g. typeof x<"u").
 *
 * Usage:
 *   node marked-smoke.cjs
 *   node marked-smoke.cjs --json=/tmp/marked-smoke.json
 */

const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const ROOT = path.resolve(HERE, '../../../../../..');
const ENGINE_MODULE = path.join(ROOT, 'gallery/game_engine/v2/interp/bin/engine_module.cjs');
const VENDOR_UMD = path.join(HERE, 'vendor/marked.umd.js');
const VENDOR_CJS = path.join(HERE, 'vendor/marked.cjs');
const PREPARED_UMD = path.join(HERE, '.cache/marked.umd.prepared.js');

const CASES = [
  { name: 'heading', md: '# Hello' },
  { name: 'paragraph', md: 'Hello **world**' },
  { name: 'link', md: '[Ranger](https://example.com)' },
  { name: 'list', md: '- one\n- two' },
  { name: 'blockquote', md: '> quoted' },
  { name: 'mixed', md: '# Title\n\nA *short* paragraph with `code`.\n' },
];

function parseArgs(argv) {
  const out = { json: null };
  for (const a of argv.slice(2)) {
    if (a.startsWith('--json=')) out.json = a.slice('--json='.length);
  }
  return out;
}

/** Rewrite `typeof x<"u"` / `typeof x>"u"` — engine rejects the comparison form. */
function prepareMarkedUmdSource(src) {
  return src
    .replace(/typeof\s+([A-Za-z_$][\w$]*)\s*<\s*"u"/g, 'typeof $1 !== "undefined"')
    .replace(/typeof\s+([A-Za-z_$][\w$]*)\s*>\s*"u"/g, 'typeof $1 === "undefined"')
    .replace(/typeof\s+([A-Za-z_$][\w$]*)\s*<\s*'u'/g, "typeof $1 !== 'undefined'")
    .replace(/typeof\s+([A-Za-z_$][\w$]*)\s*>\s*'u'/g, "typeof $1 === 'undefined'");
}

function prepareMarkedUmdFile() {
  if (!fs.existsSync(VENDOR_UMD)) {
    throw new Error(`missing vendor UMD: ${VENDOR_UMD}`);
  }
  fs.mkdirSync(path.dirname(PREPARED_UMD), { recursive: true });
  const prepared = prepareMarkedUmdSource(fs.readFileSync(VENDOR_UMD, 'utf8'));
  fs.writeFileSync(PREPARED_UMD, prepared);
  return PREPARED_UMD;
}

function loadNodeMarked() {
  if (fs.existsSync(VENDOR_CJS)) {
    return require(VENDOR_CJS);
  }
  return require(prepareMarkedUmdFile());
}

function loadEngineModule() {
  if (!fs.existsSync(ENGINE_MODULE)) {
    throw new Error(
      `missing ${ENGINE_MODULE}\nRun: bash scripts/build-engine-module.sh`,
    );
  }
  return require(ENGINE_MODULE);
}

function toHost(r) {
  if (!r) return { ok: false, error: 'missing return' };
  if (r.isString && r.isString()) return { ok: true, value: r.stringOf() };
  if (r.isUndefined && r.isUndefined()) return { ok: false, error: 'undefined' };
  if (r.isNull && r.isNull()) return { ok: false, error: 'null' };
  if (r.isNumber && r.isNumber()) return { ok: false, error: `number ${r.numberOf()}` };
  if (r.isBoolean && r.isBoolean()) return { ok: false, error: `boolean ${r.boolOf()}` };
  const kind = r.kindName ? r.kindName() : '?';
  return { ok: false, error: `kind ${kind}` };
}

function fnNameFor(caseName) {
  return `__parse_${String(caseName).replace(/[^a-zA-Z0-9_]/g, '_')}__`;
}

/** Load UMD once; run every case helper on the same engine. */
function runAllOnEngine(cases) {
  const { ComponentEngine, EvHandle: EvalValue } = loadEngineModule();
  const eng = new ComponentEngine();
  eng.quiet = true;
  const umd = fs.readFileSync(prepareMarkedUmdFile(), 'utf8');
  const helpers = [
    'function __marked_api__() {',
    '  var g = (typeof globalThis !== "undefined") ? globalThis : this;',
    '  if (!g.marked) return "missing";',
    '  if (typeof g.marked.parse !== "function") return "no-parse";',
    '  return "ok";',
    '}',
  ];
  for (const c of cases) {
    helpers.push(
      `function ${fnNameFor(c.name)}() { return globalThis.marked.parse(${JSON.stringify(c.md)}); }`,
    );
  }

  const origLog = console.log;
  console.log = function () {};
  try {
    eng.loadScript(umd + '\n' + helpers.join('\n'));
  } catch (err) {
    console.log = origLog;
    const error = String(err && err.message ? err.message : err);
    return cases.map((c) => ({
      name: c.name,
      ok: false,
      stage: 'load',
      error,
    }));
  } finally {
    console.log = origLog;
  }

  let apiHost;
  try {
    apiHost = toHost(eng.callFunction('__marked_api__', EvalValue.null()));
  } catch (err) {
    const error = String(err && err.message ? err.message : err);
    return cases.map((c) => ({ name: c.name, ok: false, stage: 'api', error }));
  }
  if (!apiHost.ok || apiHost.value !== 'ok') {
    const error = apiHost.ok ? String(apiHost.value) : apiHost.error;
    return cases.map((c) => ({ name: c.name, ok: false, stage: 'api', error }));
  }

  return cases.map((c) => {
    try {
      const parsed = toHost(eng.callFunction(fnNameFor(c.name), EvalValue.null()));
      if (!parsed.ok || typeof parsed.value !== 'string') {
        return {
          name: c.name,
          ok: false,
          stage: 'parse',
          error: parsed.ok ? `non-string ${typeof parsed.value}` : parsed.error,
        };
      }
      return {
        name: c.name,
        ok: true,
        html: parsed.value,
        htmlType: 'string',
      };
    } catch (err) {
      return {
        name: c.name,
        ok: false,
        stage: 'parse',
        error: String(err && err.message ? err.message : err),
      };
    }
  });
}

function main() {
  const args = parseArgs(process.argv);
  prepareMarkedUmdFile();
  const nodeMarked = loadNodeMarked();
  if (typeof nodeMarked.parse !== 'function') {
    throw new Error('Node marked.parse missing after vendor load');
  }

  const engineRows = runAllOnEngine(CASES);
  const byName = new Map(engineRows.map((r) => [r.name, r]));
  const results = [];
  let hardFail = false;

  for (const c of CASES) {
    const nodeHtml = nodeMarked.parse(c.md);
    const eng = byName.get(c.name) || { ok: false, stage: 'unknown', error: 'missing' };

    const row = {
      name: c.name,
      md: c.md,
      nodeHtml: String(nodeHtml),
      engineOk: !!eng.ok,
      engineStage: eng.stage || (eng.ok ? 'parse' : 'unknown'),
      engineError: eng.error || null,
      engineHtml: eng.ok ? eng.html : null,
      engineHtmlType: eng.htmlType || null,
      matchNode: eng.ok && eng.html === nodeHtml,
      engineLen: eng.ok && typeof eng.html === 'string' ? eng.html.length : null,
      nodeLen: String(nodeHtml).length,
    };

    if (!eng.ok || typeof eng.html !== 'string') hardFail = true;
    results.push(row);

    const status = !eng.ok
      ? `FAIL(${eng.stage})`
      : row.matchNode
        ? 'MATCH'
        : 'DIFF';
    const preview =
      eng.ok && typeof eng.html === 'string'
        ? eng.html.length > 80
          ? `${JSON.stringify(eng.html.slice(0, 60))}…(+${eng.html.length - 60})`
          : JSON.stringify(eng.html)
        : eng.error;
    console.log(
      `${status.padEnd(12)} ${c.name.padEnd(12)} node=${row.nodeLen} eng=${row.engineLen ?? '-'}  ${preview}`,
    );
  }

  const matched = results.filter((r) => r.matchNode).length;
  const summary = {
    library: 'marked',
    version: '4.3.0',
    vendor: 'vendor/marked.umd.js',
    prepare: 'typeof x<"u" → typeof x !== "undefined"',
    cases: results.length,
    loadAndParseOk: results.filter((r) => r.engineOk && r.engineHtmlType === 'string').length,
    matchNode: matched,
    hardFail,
    note:
      'Parity with Node is NOT a hard gate yet — marked@4 output on the engine is often corrupted. ' +
      'Hard gate = UMD loads, marked.parse is callable, and returns a string.',
    results: results.map((r) => ({
      ...r,
      engineHtml:
        r.engineHtml && r.engineHtml.length > 500
          ? `${r.engineHtml.slice(0, 200)}…[+${r.engineHtml.length - 200}]`
          : r.engineHtml,
    })),
  };

  console.log('');
  console.log(
    `marked smoke: load+parse string ${summary.loadAndParseOk}/${summary.cases}, Node match ${matched}/${summary.cases}` +
      (hardFail ? '  [HARD FAIL]' : '  [hard gates ok]'),
  );

  if (args.json) {
    const abs = path.resolve(args.json);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, JSON.stringify(summary, null, 2));
    console.log(`wrote ${abs}`);
  }

  process.exitCode = hardFail ? 1 : 0;
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
  prepareMarkedUmdSource,
  prepareMarkedUmdFile,
  PREPARED_UMD,
  VENDOR_UMD,
  VENDOR_CJS,
  runAllOnEngine,
};
