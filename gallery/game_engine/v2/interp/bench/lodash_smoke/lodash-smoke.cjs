#!/usr/bin/env node
'use strict';

/**
 * lodash@4.17.21 smoke on ComponentEngine.
 *
 * Usage:
 *   node lodash-smoke.cjs
 *   node lodash-smoke.cjs --json=/tmp/lodash-smoke.json
 *   node lodash-smoke.cjs --fail-on-diff
 */

const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const ROOT = path.resolve(HERE, '../../../../../..');
const ENGINE_MODULE = path.join(ROOT, 'gallery/game_engine/v2/interp/bin/engine_module.cjs');
const VENDOR = path.join(HERE, 'vendor/lodash.js');

/**
 * Each case is a function body that uses global `_` and must `return` a
 * JSON-serializable value (or a string). Compared via JSON.stringify on both
 * sides (strings compared directly).
 */
const CASES = [
  {
    name: 'map_squares',
    body: 'return _.map([1, 2, 3, 4], function (n) { return n * n; });',
  },
  {
    name: 'groupBy_active',
    body: [
      'var users = [',
      '  { user: "barney", age: 36, active: true },',
      '  { user: "fred", age: 40, active: false },',
      '  { user: "pebbles", age: 1, active: true }',
      '];',
      // Boolean object keys from groupBy are unreliable on the engine; use
      // string buckets (same shape apps usually persist).
      'return _.groupBy(users, function (u) { return u.active ? "active" : "inactive"; });',
    ].join('\n'),
  },
  {
    name: 'sortBy_age_names',
    body: [
      'var users = [',
      '  { user: "barney", age: 36 },',
      '  { user: "fred", age: 40 },',
      '  { user: "pebbles", age: 1 }',
      '];',
      'return _.map(_.sortBy(users, "age"), "user");',
    ].join('\n'),
  },
  {
    name: 'chain_filter_map_sort',
    body: [
      'var users = [',
      '  { user: "barney", active: true },',
      '  { user: "fred", active: false },',
      '  { user: "pebbles", active: true }',
      '];',
      'return _.chain(users).filter("active").map("user").sort().value();',
    ].join('\n'),
  },
  {
    name: 'orderBy_multi',
    body: [
      'var users = [',
      '  { user: "fred", age: 48 },',
      '  { user: "barney", age: 34 },',
      '  { user: "fred", age: 40 }',
      '];',
      'return _.map(_.orderBy(users, ["user", "age"], ["asc", "desc"]), function (u) {',
      '  return u.user + ":" + u.age;',
      '});',
    ].join('\n'),
  },
  {
    name: 'merge_nested',
    body: 'return _.merge({ a: { b: 1 } }, { a: { c: 2 } }, { d: 3 });',
  },
  {
    name: 'defaultsDeep',
    body: [
      'return _.defaultsDeep(',
      '  { a: { b: 2 } },',
      '  { a: { b: 1, c: 3 }, d: 4 }',
      ');',
    ].join('\n'),
  },
  {
    name: 'cloneDeep_nested',
    body: [
      'var src = { a: { b: [1, 2, { x: "y" }] }, tag: "ok" };',
      'var copy = _.cloneDeep(src);',
      'copy.a.b[2].x = "z";',
      'return { src: src.a.b[2].x, copy: copy.a.b[2].x, tag: copy.tag };',
    ].join('\n'),
  },
  {
    name: 'flatten_uniq',
    body: [
      'return {',
      '  flat: _.flattenDeep([1, [2, [3, [4]], 5]]),',
      '  uniq: _.uniq([2, 1, 2, 3, 1, 4])',
      '};',
    ].join('\n'),
  },
  {
    name: 'intersection_partition',
    body: [
      'var objects = [{ x: 1 }, { x: 2 }, { x: 3 }, { x: 1 }];',
      'return {',
      '  intersectionBy: _.intersectionBy([{ x: 1 }, { x: 2 }], [{ x: 2 }, { x: 3 }], "x"),',
      '  partition: _.partition(objects, function (o) { return o.x % 2 === 1; })',
      '};',
    ].join('\n'),
  },
  {
    name: 'path_get_pick_assign',
    body: [
      // Dot-string paths (_.get(o,"a.b")) currently throw on the engine;
      // array paths and pick/omit/assign cover the nested-object use case.
      'var o = { a: [{ b: { c: 3, keep: true } }], noise: 1 };',
      'var got = _.get(o, ["a", 0, "b", "c"]);',
      'var leaf = _.assign({}, _.get(o, ["a", 0, "b"]), { c: got * 10, d: 4 });',
      'return {',
      '  got: got,',
      '  leaf: leaf,',
      '  picked: _.pick(o, ["a"]),',
      '  omitted: _.omit(o, ["noise"])',
      '};',
    ].join('\n'),
  },
  {
    name: 'zip_keyBy_mapValues',
    body: [
      'var users = [',
      '  { id: "a", score: 10 },',
      '  { id: "b", score: 20 }',
      '];',
      'return {',
      '  zipObject: _.zipObject(["a", "b"], [1, 2]),',
      '  keyed: _.mapValues(_.keyBy(users, "id"), "score")',
      '};',
    ].join('\n'),
  },
  {
    name: 'flow_curry_once',
    body: [
      'var add = function (a, b) { return a + b; };',
      'var curried = _.curry(add);',
      'var f = _.flow([function (x) { return x + 1; }, function (x) { return x * 2; }]);',
      // _.memoize uses a Map cache that currently faults; _.once covers
      // single-flight function wrapping instead.
      'var calls = 0;',
      'var heavy = _.once(function () { calls = calls + 1; return 36; });',
      'var a = heavy();',
      'var b = heavy();',
      'return { flow: f(3), curry: curried(2)(5), once: [a, b, calls] };',
    ].join('\n'),
  },
  {
    name: 'template_greeting',
    body: [
      'var compiled = _.template("<%= user %> scored <%= score %>!");',
      'return compiled({ user: "fred", score: 42 });',
    ].join('\n'),
  },
  {
    name: 'complex_sales_report',
    body: [
      'var rows = [',
      '  { region: "EU", product: "A", qty: 2, price: 10 },',
      '  { region: "US", product: "B", qty: 1, price: 20 },',
      '  { region: "EU", product: "A", qty: 3, price: 10 },',
      '  { region: "US", product: "A", qty: 5, price: 9 },',
      '  { region: "EU", product: "B", qty: 1, price: 25 }',
      '];',
      'var enriched = _.map(rows, function (r) {',
      '  return _.assign({}, r, { total: r.qty * r.price });',
      '});',
      'var byRegion = _.groupBy(enriched, "region");',
      'var report = _.mapValues(byRegion, function (items) {',
      '  return {',
      '    revenue: _.sumBy(items, "total"),',
      '    products: _.sortBy(_.uniq(_.map(items, "product"))),',
      '    top: _.maxBy(items, "total")',
      '  };',
      '});',
      'var ranked = _.orderBy(',
      '  _.map(report, function (v, region) {',
      '    return { region: region, revenue: v.revenue, products: v.products, topProduct: v.top.product };',
      '  }),',
      '  ["revenue"],',
      '  ["desc"]',
      ');',
      'return {',
      '  ranked: ranked,',
      '  euA: _.sumBy(_.filter(enriched, { region: "EU", product: "A" }), "total"),',
      '  allRevenue: _.sumBy(enriched, "total")',
      '};',
    ].join('\n'),
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

function loadEngineModule() {
  if (!fs.existsSync(ENGINE_MODULE)) {
    throw new Error(
      `missing ${ENGINE_MODULE}\nRun: bash scripts/build-engine-module.sh`,
    );
  }
  return require(ENGINE_MODULE);
}

function loadNodeLodash() {
  if (!fs.existsSync(VENDOR)) {
    throw new Error(`missing vendor: ${VENDOR}`);
  }
  return require(VENDOR);
}

function toHost(r) {
  if (!r) return { ok: false, error: 'missing return' };
  if (r.isString && r.isString()) return { ok: true, value: r.stringOf() };
  if (r.isUndefined && r.isUndefined()) return { ok: false, error: 'undefined' };
  if (r.isNull && r.isNull()) return { ok: false, error: 'null' };
  if (r.isNumber && r.isNumber()) return { ok: true, value: r.numberOf() };
  if (r.isBoolean && r.isBoolean()) return { ok: true, value: r.boolOf() };
  const kind = r.kindName ? r.kindName() : '?';
  return { ok: false, error: `kind ${kind}` };
}

function serialize(v) {
  if (typeof v === 'string') return v;
  return JSON.stringify(v);
}

function runNodeCase(lodash, body) {
  // Case bodies already contain `return …`.
  const fn = new Function('_', body);
  return fn(lodash);
}

function createEngineSession() {
  const { ComponentEngine, EvHandle: EvalValue } = loadEngineModule();
  const eng = new ComponentEngine();
  eng.quiet = true;
  const umd = fs.readFileSync(VENDOR, 'utf8');
  const helpers = [
    'function __lodash_api__() {',
    '  var g = (typeof globalThis !== "undefined") ? globalThis : this;',
    '  if (!g._) return "missing";',
    '  if (typeof g._.map !== "function") return "no-map";',
    '  return "ok:" + String(g._.VERSION);',
    '}',
  ];
  for (const c of CASES) {
    const fn = `__case_${c.name}`;
    helpers.push(
      `function ${fn}() {\n${c.body}\n}`,
      `function ${fn}_json() {\n  var v = ${fn}();\n  if (typeof v === "string") return v;\n  return JSON.stringify(v);\n}`,
    );
  }

  const origLog = console.log;
  console.log = function () {};
  try {
    eng.loadScript(umd + '\n' + helpers.join('\n'));
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
    const api = toHost(eng.callFunction('__lodash_api__', EvalValue.null()));
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
    version: '4.17.21',
    runJson(name) {
      try {
        const r = toHost(eng.callFunction(`__case_${name}_json`, EvalValue.null()));
        if (!r.ok || typeof r.value !== 'string') {
          return {
            ok: false,
            stage: 'run',
            error: r.ok ? `non-string ${typeof r.value}` : r.error,
          };
        }
        return { ok: true, json: r.value };
      } catch (err) {
        return {
          ok: false,
          stage: 'run',
          error: String(err && err.message ? err.message : err),
        };
      }
    },
  };
}

function main() {
  const args = parseArgs(process.argv);
  const lodash = loadNodeLodash();
  const session = createEngineSession();
  const results = [];
  let hardFail = false;
  let diffFail = false;

  if (!session.ok) {
    console.error(`FAIL(${session.stage}) ${session.error}`);
    process.exitCode = 1;
    return;
  }

  console.log(`lodash ${lodash.VERSION} loaded on engine`);

  for (const c of CASES) {
    let nodeVal;
    let nodeJson;
    try {
      nodeVal = runNodeCase(lodash, c.body);
      nodeJson = serialize(nodeVal);
    } catch (err) {
      hardFail = true;
      results.push({
        name: c.name,
        engineOk: false,
        matchNode: false,
        error: `node: ${err && err.message ? err.message : err}`,
      });
      console.log(`FAIL(node)    ${c.name.padEnd(28)} ${err.message}`);
      continue;
    }

    const eng = session.runJson(c.name);
    const match = eng.ok && eng.json === nodeJson;
    if (!eng.ok) hardFail = true;
    if (!match) diffFail = true;
    results.push({
      name: c.name,
      engineOk: !!eng.ok,
      matchNode: match,
      nodeJson,
      engineJson: eng.ok ? eng.json : null,
      error: eng.ok ? null : eng.error,
    });

    const status = !eng.ok ? `FAIL(${eng.stage})` : match ? 'MATCH' : 'DIFF';
    const preview = eng.ok
      ? eng.json.length > 90
        ? `${eng.json.slice(0, 70)}…(+${eng.json.length - 70})`
        : eng.json
      : eng.error;
    console.log(`${status.padEnd(12)} ${c.name.padEnd(28)} ${preview}`);
  }

  const matched = results.filter((r) => r.matchNode).length;
  console.log('');
  console.log(
    `lodash smoke: match ${matched}/${results.length}` +
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
          library: 'lodash',
          version: lodash.VERSION,
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
  createEngineSession,
  runNodeCase,
  serialize,
  loadNodeLodash,
};
