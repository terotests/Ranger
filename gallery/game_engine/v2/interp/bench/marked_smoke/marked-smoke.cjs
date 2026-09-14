#!/usr/bin/env node
'use strict';

/**
 * marked markdown library smoke on ComponentEngine.
 *
 * Vendors marked@4.3.0 UMD. Fixtures under fixtures/ come from marked's own
 * v4.3.0 test/specs (original / new / gfm). Node oracle = vendored marked.cjs.
 *
 * Usage:
 *   node marked-smoke.cjs                  # tiny + fixtures + gfm json
 *   node marked-smoke.cjs --quick          # tiny cases only
 *   node marked-smoke.cjs --json=/tmp/out.json
 *   node marked-smoke.cjs --fail-on-diff   # exit 1 on Node HTML mismatch
 */

const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const ROOT = path.resolve(HERE, '../../../../../..');
const ENGINE_MODULE = path.join(ROOT, 'gallery/game_engine/v2/interp/bin/engine_module.cjs');
const VENDOR_UMD = path.join(HERE, 'vendor/marked.umd.js');
const VENDOR_CJS = path.join(HERE, 'vendor/marked.cjs');
const PREPARED_UMD = path.join(HERE, '.cache/marked.umd.prepared.js');
const FIXTURES_DIR = path.join(HERE, 'fixtures');

/** Tiny always-on smoke cases. */
const TINY_CASES = [
  { name: 'tiny/heading', md: '# Hello', suite: 'tiny' },
  { name: 'tiny/paragraph', md: 'Hello **world**', suite: 'tiny' },
  { name: 'tiny/link', md: '[Ranger](https://example.com)', suite: 'tiny' },
  { name: 'tiny/list', md: '- one\n- two', suite: 'tiny' },
  { name: 'tiny/blockquote', md: '> quoted', suite: 'tiny' },
  { name: 'tiny/mixed', md: '# Title\n\nA *short* paragraph with `code`.\n', suite: 'tiny' },
];

// Back-compat export name.
const CASES = TINY_CASES;

function parseArgs(argv) {
  const out = { json: null, quick: false, failOnDiff: false };
  for (const a of argv.slice(2)) {
    if (a.startsWith('--json=')) out.json = a.slice('--json='.length);
    else if (a === '--quick') out.quick = true;
    else if (a === '--fail-on-diff') out.failOnDiff = true;
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
  const marked = fs.existsSync(VENDOR_CJS)
    ? require(VENDOR_CJS)
    : require(prepareMarkedUmdFile());
  // marked@4 mangles mailto: entities with Math.random — disable for stable
  // engine↔Node HTML compare (otherwise autolink/email cases flake as DIFF).
  if (typeof marked.setOptions === 'function') {
    marked.setOptions({ mangle: false });
  }
  return marked;
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

function walkMdFiles(dir, suite, out) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkMdFiles(abs, suite, out);
      continue;
    }
    if (!ent.name.endsWith('.md') || ent.name === 'ATTRIBUTION.md') continue;
    const rel = path.relative(FIXTURES_DIR, abs).replace(/\\/g, '/');
    out.push({
      name: rel.replace(/\.md$/i, ''),
      md: fs.readFileSync(abs, 'utf8'),
      suite,
    });
  }
}

function loadGfmJsonCases() {
  const p = path.join(FIXTURES_DIR, 'gfm', 'gfm.0.29.json');
  if (!fs.existsSync(p)) return [];
  const rows = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (!Array.isArray(rows)) return [];
  return rows.map((row, i) => ({
    name: `gfm/${row.section || 'ex'}-${row.number != null ? row.number : i}`,
    md: String(row.markdown ?? row.md ?? ''),
    suite: 'gfm',
    // Prefer Node oracle; keep marked expected html for reference only.
    markedExpectedHtml: row.html != null ? String(row.html) : null,
  }));
}

function collectCases({ quick }) {
  const cases = TINY_CASES.slice();
  if (quick) return cases;
  walkMdFiles(path.join(FIXTURES_DIR, 'original'), 'original', cases);
  walkMdFiles(path.join(FIXTURES_DIR, 'new'), 'new', cases);
  cases.push(...loadGfmJsonCases());
  return cases;
}

/**
 * Load UMD once; parse each case via __marked_parse__(md) + EvalValue.string.
 * Avoids embedding large fixture bodies into the loaded script.
 */
function createEngineSession() {
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
    'function __marked_boot__() {',
    '  // Match Node oracle: no random mailto entity mangling.',
    '  if (typeof globalThis.marked.setOptions === "function") {',
    '    globalThis.marked.setOptions({ mangle: false });',
    '  }',
    '  return "ok";',
    '}',
    'function __marked_parse__(md) {',
    '  return globalThis.marked.parse(md);',
    '}',
  ].join('\n');

  const origLog = console.log;
  console.log = function () {};
  try {
    eng.loadScript(umd + '\n' + helpers);
  } catch (err) {
    console.log = origLog;
    return {
      ok: false,
      stage: 'load',
      error: String(err && err.message ? err.message : err),
      parse() {
        return { ok: false, stage: 'load', error: this.error };
      },
    };
  } finally {
    console.log = origLog;
  }

  let apiHost;
  try {
    apiHost = toHost(eng.callFunction('__marked_api__', EvalValue.null()));
  } catch (err) {
    return {
      ok: false,
      stage: 'api',
      error: String(err && err.message ? err.message : err),
      parse() {
        return { ok: false, stage: 'api', error: this.error };
      },
    };
  }
  if (!apiHost.ok || apiHost.value !== 'ok') {
    const error = apiHost.ok ? String(apiHost.value) : apiHost.error;
    return {
      ok: false,
      stage: 'api',
      error,
      parse() {
        return { ok: false, stage: 'api', error };
      },
    };
  }

  try {
    const boot = toHost(eng.callFunction('__marked_boot__', EvalValue.null()));
    if (!boot.ok || boot.value !== 'ok') {
      const error = boot.ok ? String(boot.value) : boot.error;
      return {
        ok: false,
        stage: 'boot',
        error,
        parse() {
          return { ok: false, stage: 'boot', error };
        },
      };
    }
  } catch (err) {
    const error = String(err && err.message ? err.message : err);
    return {
      ok: false,
      stage: 'boot',
      error,
      parse() {
        return { ok: false, stage: 'boot', error };
      },
    };
  }

  return {
    ok: true,
    parse(md) {
      try {
        const parsed = toHost(eng.callFunction('__marked_parse__', EvalValue.string(md)));
        if (!parsed.ok || typeof parsed.value !== 'string') {
          return {
            ok: false,
            stage: 'parse',
            error: parsed.ok ? `non-string ${typeof parsed.value}` : parsed.error,
          };
        }
        return { ok: true, html: parsed.value, htmlType: 'string' };
      } catch (err) {
        return {
          ok: false,
          stage: 'parse',
          error: String(err && err.message ? err.message : err),
        };
      }
    },
  };
}

/** @deprecated use createEngineSession — kept for module.exports callers */
function runAllOnEngine(cases) {
  const session = createEngineSession();
  return cases.map((c) => {
    if (!session.ok) {
      return { name: c.name, ok: false, stage: session.stage, error: session.error };
    }
    const r = session.parse(c.md);
    return { name: c.name, ...r };
  });
}

function truncate(s, n) {
  if (s == null) return s;
  const str = String(s);
  if (str.length <= n) return str;
  return `${str.slice(0, n)}…[+${str.length - n}]`;
}

function main() {
  const args = parseArgs(process.argv);
  prepareMarkedUmdFile();
  const nodeMarked = loadNodeMarked();
  if (typeof nodeMarked.parse !== 'function') {
    throw new Error('Node marked.parse missing after vendor load');
  }

  const cases = collectCases({ quick: args.quick });
  const session = createEngineSession();
  const results = [];
  let hardFail = false;
  let diffFail = false;
  const bySuite = Object.create(null);

  for (const c of cases) {
    const nodeHtml = String(nodeMarked.parse(c.md));
    const eng = session.ok
      ? session.parse(c.md)
      : { ok: false, stage: session.stage, error: session.error };

    const row = {
      name: c.name,
      suite: c.suite || 'other',
      mdBytes: Buffer.byteLength(c.md, 'utf8'),
      engineOk: !!eng.ok,
      engineStage: eng.stage || (eng.ok ? 'parse' : 'unknown'),
      engineError: eng.error || null,
      engineHtml: eng.ok ? eng.html : null,
      engineHtmlType: eng.htmlType || null,
      matchNode: eng.ok && eng.html === nodeHtml,
      engineLen: eng.ok && typeof eng.html === 'string' ? eng.html.length : null,
      nodeLen: nodeHtml.length,
    };

    if (!eng.ok || typeof eng.html !== 'string') hardFail = true;
    if (!row.matchNode) diffFail = true;
    results.push(row);

    const bucket = bySuite[row.suite] || (bySuite[row.suite] = { total: 0, match: 0, parseOk: 0 });
    bucket.total++;
    if (row.engineOk) bucket.parseOk++;
    if (row.matchNode) bucket.match++;

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
      `${status.padEnd(12)} ${c.name.padEnd(42)} node=${String(row.nodeLen).padStart(5)} eng=${String(row.engineLen ?? '-').padStart(5)}  ${preview}`,
    );
  }

  const matched = results.filter((r) => r.matchNode).length;
  const summary = {
    library: 'marked',
    version: '4.3.0',
    tipNote: 'fixtures from marked@4.3.0 test/specs; oracle = Node marked.cjs parse',
    vendor: 'vendor/marked.umd.js',
    prepare: 'typeof x<"u" → typeof x !== "undefined"',
    quick: args.quick,
    cases: results.length,
    loadAndParseOk: results.filter((r) => r.engineOk && r.engineHtmlType === 'string').length,
    matchNode: matched,
    hardFail,
    bySuite,
    results: results.map((r) => ({
      name: r.name,
      suite: r.suite,
      mdBytes: r.mdBytes,
      engineOk: r.engineOk,
      engineStage: r.engineStage,
      engineError: r.engineError,
      matchNode: r.matchNode,
      engineLen: r.engineLen,
      nodeLen: r.nodeLen,
      engineHtmlPreview: truncate(r.engineHtml, 160),
    })),
  };

  console.log('');
  for (const [suite, b] of Object.entries(bySuite)) {
    console.log(
      `  suite ${suite.padEnd(10)} parseOk ${b.parseOk}/${b.total}  match ${b.match}/${b.total}`,
    );
  }
  console.log('');
  console.log(
    `marked smoke: load+parse string ${summary.loadAndParseOk}/${summary.cases}, Node match ${matched}/${summary.cases}` +
      (hardFail ? '  [HARD FAIL]' : '  [hard gates ok]') +
      (args.failOnDiff && diffFail ? '  [DIFF FAIL]' : ''),
  );

  if (args.json) {
    const abs = path.resolve(args.json);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, JSON.stringify(summary, null, 2));
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
  TINY_CASES,
  prepareMarkedUmdSource,
  prepareMarkedUmdFile,
  collectCases,
  createEngineSession,
  PREPARED_UMD,
  VENDOR_UMD,
  VENDOR_CJS,
  FIXTURES_DIR,
  runAllOnEngine,
};
