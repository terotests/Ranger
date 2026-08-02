// Runtime conformance for the interpreter realm (gallery/game_engine/v2/interp).
//
// The parser suites measure only what is ACCEPTED. They say nothing about
// whether the evaluator produces the right value, and the two diverge badly:
// classes and regular expressions parse perfectly and evaluate to nothing. This
// suite drives the real ComponentEngine and compares the value it produces
// against the value Node produces for the same source, so a feature that parses
// but does not run is visible.
//
// Every expectation is DERIVED: each probe is executed by Node first, and the
// engine is compared against that. A probe that does not behave as expected in
// Node is a broken probe and fails the suite rather than silently passing.
//
// Known gaps are listed in KNOWN_GAPS below. The suite asserts both directions:
// a probe outside the list must pass (guarding against regression) and a probe
// inside it must still fail (so fixing one forces the list to be updated, and
// the list cannot quietly rot).
import { describe, it, expect, beforeAll } from "vitest";
import * as path from "path";
import * as fs from "fs";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const ENGINE_MODULE = path.join(
  ROOT_DIR,
  "gallery",
  "game_engine",
  "v2",
  "interp",
  "bin",
  "engine_module.cjs"
);
const ENGINE_SOURCE = path.join(
  ROOT_DIR,
  "gallery",
  "game_engine",
  "v2",
  "interp",
  "migrate",
  "src",
  "ComponentEngine.rgr"
);
const BUILD_SCRIPT = path.join(ROOT_DIR, "scripts", "build-engine-module.sh");

// EvalValue.valueType constants, as emitted by the compiled module.
const T_NULL = 0;
const T_NUM = 1;
const T_STR = 2;
const T_BOOL = 3;
const T_UNDEF = 8;

let ComponentEngine: any;
let EvalValue: any;

/** Probes, each the body of a zero-argument function returning a value. */
const PROBES: Array<[name: string, body: string, group: string]> = [
  // --- numeric literals -----------------------------------------------------
  ["num-exponent", "return 1e5;", "numbers"],
  ["num-exponent-neg", "return 1.5e-3;", "numbers"],
  ["num-exponent-plus", "return 2E+3;", "numbers"],
  ["num-hex", "return 0x1f;", "numbers"],
  ["num-binary", "return 0b1011;", "numbers"],
  ["num-octal", "return 0o17;", "numbers"],
  ["num-separator", "return 1_000_000;", "numbers"],
  ["num-leading-dot", "return .5;", "numbers"],
  ["num-member-on-int", "return (0).toString();", "numbers"],

  // --- string escapes -------------------------------------------------------
  ["str-unicode", "return '\\u0041';", "strings"],
  ["str-hex", "return '\\x41';", "strings"],
  ["str-brace-unicode", "return '\\u{42}';", "strings"],
  ["str-nul-length", "return '\\0'.length;", "strings"],
  ["str-newline", "return 'a\\nb'.length;", "strings"],
  ["str-tab", "return 'a\\tb'.length;", "strings"],
  ["str-escaped-quote", "return 'it\\'s';", "strings"],
  ["str-backslash", "return 'a\\\\b'.length;", "strings"],
  ["str-concat-escape", "return '\\u0041' + '\\u0042';", "strings"],

  // --- delimiters inside literals -------------------------------------------
  ["lit-paren-arg", "var f = function (s) { return s.length; }; return f(')');", "literals"],
  ["lit-brace-value", "var o = {a: '}'}; return o.a;", "literals"],
  ["lit-bracket-key", "var o = {'[': 5}; return o['['];", "literals"],
  ["lit-template-brace", "var x = `a}b`; return x.length;", "literals"],

  // --- statements -----------------------------------------------------------
  ["var-basic", "var a = 7; return a;", "statements"],
  ["var-multi", "var a = 1, b = 2; return a + b;", "statements"],
  ["var-in-block", "var t = 0; { var t2 = 5; t = t2; } return t;", "statements"],
  ["for-var-multi", "var s = 0; for (var i = 0, j = 10; i < 3; i = i + 1) { s = s + j; } return s;", "statements"],
  ["seq-expr", "var a = 0; a = (1, 2, 3); return a;", "statements"],
  ["for-in-expr-lhs", "var o = {x: 1, y: 2}; var n = 0; var k; for (k in o) { n = n + 1; } return n;", "statements"],
  ["for-of-expr-lhs", "var s = 0; var v; for (v of [1, 2, 3]) { s = s + v; } return s;", "statements"],
  ["labeled-break", "var n = 0; outer: for (var i = 0; i < 3; i = i + 1) { for (var j = 0; j < 3; j = j + 1) { if (j === 1) { break outer; } n = n + 1; } } return n;", "statements"],
  ["labeled-continue", "var n = 0; outer: for (var i = 0; i < 3; i = i + 1) { for (var j = 0; j < 2; j = j + 1) { continue outer; } n = n + 100; } return n;", "statements"],
  ["do-while", "var n = 0; do { n = n + 1; } while (n < 3); return n;", "statements"],
  ["switch-fallthrough", "var n = 0; switch (1) { case 1: n = n + 1; case 2: n = n + 1; break; default: n = 100; } return n;", "statements"],
  ["try-catch-finally", "var n = 0; try { throw 1; } catch (e) { n = 1; } finally { n = n + 1; } return n;", "statements"],

  // --- functions ------------------------------------------------------------
  ["fn-expr", "var f = function (x) { return x * 2; }; return f(4);", "functions"],
  ["fn-expr-named", "var f = function fact(n) { return n < 2 ? 1 : n * fact(n - 1); }; return f(5);", "functions"],
  ["iife", "return (function () { return 11; })();", "functions"],
  ["bare-arrow-param", "var f = x => x + 1; return f(1);", "functions"],
  ["arrow-in-call", "return [1, 2, 3].map(x => x * 2).length;", "functions"],
  ["closure-capture", "var mk = function (n) { return function () { return n; }; }; return mk(5)();", "functions"],
  ["default-param", "var f = function (a) { if (a === undefined) { return 3; } return a; }; return f();", "functions"],
  ["rest-param", "var f = function (...a) { return a.length; }; return f(1, 2, 3);", "functions"],
  ["spread-call", "var f = function (a, b) { return a + b; }; var xs = [1, 2]; return f(...xs);", "functions"],
  ["method-this", "var o = { v: 2, m() { return this.v; } }; return o.m();", "functions"],
  ["arrow-this-lexical", "var o = { v: 1, m() { var g = () => this.v; return g(); } }; return o.m();", "functions"],

  // --- destructuring --------------------------------------------------------
  ["destr-array", "var [a, b] = [1, 2]; return a + b;", "destructuring"],
  ["destr-nested", "var [[a], [b]] = [[1], [2]]; return a + b;", "destructuring"],
  ["destr-obj", "var {a, b} = {a: 1, b: 2}; return a + b;", "destructuring"],
  ["destr-obj-alias", "var {a: x, b: y} = {a: 3, b: 4}; return x + y;", "destructuring"],
  ["destr-obj-nested", "var {a: {b}} = {a: {b: 9}}; return b;", "destructuring"],
  ["destr-default", "var [a = 5] = []; return a;", "destructuring"],
  ["destr-obj-default", "var {a = 6} = {}; return a;", "destructuring"],
  ["destr-swap", "var a = 1; var b = 2; [a, b] = [b, a]; return a * 10 + b;", "destructuring"],
  ["destr-param", "var f = function ({a, b}) { return a + b; }; return f({a: 1, b: 2});", "destructuring"],

  // --- objects and arrays ---------------------------------------------------
  ["obj-missing-prop", "var o = {}; return o.nope === undefined;", "objects"],
  ["obj-in-operator", "var o = { a: 1 }; return ('a' in o) === true && ('b' in o) === false;", "objects"],
  ["obj-keys-order", "var o = { b: 1, a: 2 }; return Object.keys(o).join(',');", "objects"],
  ["obj-computed-key", "var k = 'a'; var o = { [k]: 1 }; return o.a;", "objects"],
  ["obj-spread", "var a = { x: 1 }; var b = { ...a, y: 2 }; return b.x + b.y;", "objects"],
  ["obj-getter", "var o = { get a() { return 7; } }; return o.a;", "objects"],
  ["obj-setter", "var o = { _v: 0, set a(x) { this._v = x; } }; o.a = 5; return o._v;", "objects"],
  ["arr-reduce", "var a = [1, 2, 3]; return a.reduce(function (s, x) { return s + x; }, 0);", "objects"],
  ["arr-sort-cmp", "var a = [3, 1, 2]; a.sort(function (x, y) { return x - y; }); return a.join(',');", "objects"],
  ["arr-splice", "var a = [1, 2, 3]; var r = a.splice(1, 1); return r[0] + ':' + a.join(',');", "objects"],
  ["arr-length-write", "var a = [1, 2, 3]; a.length = 1; return a.length;", "objects"],

  // --- coercion and numbers -------------------------------------------------
  ["coerce-add-num-str", "return 1 + '2';", "coercion"],
  ["coerce-sub-str-num", "return '3' - 1;", "coercion"],
  ["coerce-loose-eq", "return ('1' == 1) === true;", "coercion"],
  ["coerce-strict-eq", "return ('1' === 1) === false;", "coercion"],
  ["coerce-arr-to-string", "return String([1, 2]);", "coercion"],
  ["coerce-obj-to-string", "return String({});", "coercion"],
  ["coerce-valueof", "var o = { valueOf: function () { return 42; } }; return o + 1;", "coercion"],
  ["num-nan-ne-self", "var n = NaN; return n !== n;", "coercion"],
  ["num-negative-zero", "var z = -0; return 1 / z === -Infinity;", "coercion"],
  ["num-radix-tostring", "return (255).toString(16);", "coercion"],

  // --- iteration ------------------------------------------------------------
  ["iter-for-of-array", "var n = 0; for (var x of [1, 2, 3]) { n = n + x; } return n;", "iteration"],
  ["iter-for-of-string", "var n = 0; for (var c of 'abc') { n = n + 1; } return n;", "iteration"],
  ["iter-map", "var m = new Map(); m.set('a', 1); var n = 0; for (var kv of m) { n = n + kv[1]; } return n;", "iteration"],
  ["iter-set-dedup", "var s = new Set([1, 1, 2]); return s.size;", "iteration"],
  ["iter-generator", "function* g() { yield 1; yield 2; } var n = 0; for (var v of g()) { n = n + v; } return n;", "iteration"],
  ["iter-symbol-unique", "var a = Symbol('x'); var b = Symbol('x'); return a !== b;", "iteration"],

  // --- classes --------------------------------------------------------------
  ["class-basic", "class A { constructor() { this.x = 1; } } return new A().x;", "classes"],
  ["class-method", "class A { m() { return 3; } } return new A().m();", "classes"],
  ["class-expr", "var C = class { m() { return 3; } }; return new C().m();", "classes"],
  ["class-static", "class A { static s() { return 4; } } return A.s();", "classes"],
  ["class-getter", "class A { get v() { return 5; } } return new A().v;", "classes"],
  ["class-extends", "class A { m() { return 1; } } class B extends A {} return new B().m();", "classes"],
  ["class-super", "class A { constructor() { this.x = 1; } } class B extends A { constructor() { super(); this.y = 2; } } var b = new B(); return b.x + b.y;", "classes"],
  ["class-instanceof", "class A {} return (new A()) instanceof A;", "classes"],

  // --- regular expressions --------------------------------------------------
  ["regex-test", "return /a+/.test('caaat');", "regex"],
  ["regex-exec", "var m = /(\\d+)/.exec('a123'); return m[1];", "regex"],
  ["regex-flags", "return /A/i.test('a');", "regex"],
  ["regex-replace", "return 'aaa'.replace(/a/g, 'b');", "regex"],

  // --- errors ---------------------------------------------------------------
  ["err-throw-message", "var m = ''; try { throw new Error('x'); } catch (e) { m = e.message; } return m;", "errors"],
  ["err-instanceof", "var t = false; try { throw new TypeError('a'); } catch (e) { t = e instanceof TypeError; } return t;", "errors"],
  ["err-null-property", "var t = false; try { var n = null; n.x; } catch (e) { t = true; } return t;", "errors"],
  ["err-optional-chain", "var o = null; return o?.x === undefined;", "errors"],
  ["err-nullish", "var x = 0; return (x ?? 5);", "errors"],

  // --- errors thrown where the spec throws ----------------------------------
  // The failure mode these replace was SILENCE: an unresolvable name evaluated
  // to null and execution carried on, so a following assertion never ran and a
  // test that should have failed reported success.
  ["throw-ref-undeclared-read", "try { nopeXyz; } catch (e) { return e.name; } return 'no-throw';", "throwing"],
  ["throw-ref-undeclared-call", "try { nopeXyz(); } catch (e) { return e.name; } return 'no-throw';", "throwing"],
  ["throw-ref-message", "try { nopeXyz; } catch (e) { return e.message; } return 'no-throw';", "throwing"],
  ["throw-type-null-prop", "try { var o = null; o.x; } catch (e) { return e.name; } return 'no-throw';", "throwing"],
  ["throw-type-undef-prop", "try { var u; u.x; } catch (e) { return e.name; } return 'no-throw';", "throwing"],
  ["throw-not-a-function", "try { var n = 5; n(); } catch (e) { return e.name; } return 'no-throw';", "throwing"],
  ["throw-typeof-no-throw", "return typeof nopeXyz;", "throwing"],
  ["throw-ctor-identity", "try { nopeXyz; } catch (e) { return e.constructor === ReferenceError; } return 'no-throw';", "throwing"],
  ["throw-ctor-name", "try { nopeXyz; } catch (e) { return e.constructor.name; } return 'no-throw';", "throwing"],
  ["throw-ctor-distinct", "try { nopeXyz; } catch (e) { return e.constructor === TypeError; } return 'no-throw';", "throwing"],
  ["throw-new-typeerror", "var e = new TypeError('boom'); return e.name + ':' + e.message;", "throwing"],
  ["throw-new-error", "var e = new Error('x'); return e.message;", "throwing"],
  ["throw-ctor-global-name", "return TypeError.name;", "throwing"],
  ["throw-user-rethrow", "var f = function () { throw new RangeError('r'); }; try { f(); } catch (e) { return e.name; } return 'no-throw';", "throwing"],

  // Function declarations nested in a body: hoisted and bound in the enclosing
  // scope, so they are callable before their own line and can recurse.
  ["nested-fn-decl-call", "function g() { return 5; } return g();", "fnprops"],
  ["nested-fn-decl-hoisted", "return g(); function g() { return 5; }", "fnprops"],
  ["nested-fn-decl-recursive", "function fact(n) { if (n < 2) { return 1; } return n * fact(n - 1); } return fact(5);", "fnprops"],
  ["nested-fn-decl-sees-outer", "var k = 4; function g() { return k + 1; } return g();", "fnprops"],
  ["nested-fn-decl-prop", "function g() {} g.x = 7; return g.x;", "fnprops"],

  // --- functions are objects ------------------------------------------------
  // Test262's whole harness is built this way (`assert.sameValue = function`),
  // so without it every assertion in the suite is a silent no-op.
  ["fnprop-assign-read", "var g = function () {}; g.x = 7; return g.x;", "fnprops"],
  ["fnprop-call", "var g = function () {}; g.sub = function () { return 7; }; return g.sub();", "fnprops"],
  ["fnprop-missing", "var g = function () {}; return g.nope === undefined;", "fnprops"],
  ["fnprop-name", "var g = function () {}; g.name2 = 'x'; return g.name2;", "fnprops"],
  ["fnprop-nested-call", "var g = function () {}; g.a = {}; g.a.b = function () { return 3; }; return g.a.b();", "fnprops"],
  ["fnprop-delete", "var g = function () {}; g.x = 1; delete g.x; return g.x === undefined;", "fnprops"],
  ["fnprop-arrow-holder", "var f = function () {}; f.k = 2; return f.k;", "fnprops"],
  ["proto-object", "var F = function () {}; return typeof F.prototype;", "prototypes"],
  ["proto-persists", "var F = function () {}; F.prototype.m = function () { return 3; }; return typeof F.prototype.m;", "prototypes"],
  ["proto-method-via-instance", "var F = function () {}; F.prototype.m = function () { return 3; }; var o = new F(); return o.m();", "prototypes"],
  ["proto-prop-read", "var F = function () {}; F.prototype.k = 9; var o = new F(); return o.k;", "prototypes"],
  ["proto-own-shadows", "var F = function () { this.k = 1; }; F.prototype.k = 9; var o = new F(); return o.k;", "prototypes"],
  ["proto-this-binding", "var F = function () { this.v = 5; }; F.prototype.get = function () { return this.v; }; var o = new F(); return o.get();", "prototypes"],
  ["proto-miss-undefined", "var F = function () {}; var o = new F(); return o.nope === undefined;", "prototypes"],
  ["fnprop-ctor-instanceof", "var F = function () { this.v = 1; }; var o = new F(); return o instanceof F;", "fnprops"],
  ["fnprop-ctor-guard", "var F = function (m) { if (!(this instanceof F)) { return new F(m); } this.m = m; }; return F('x').m;", "fnprops"],

  // --- Symbol and property descriptors --------------------------------------
  // Test262 reaches for these constantly to SET UP its assertions, so each one
  // missing fails tests for reasons unrelated to what they actually check.
  ["symbol-typeof", "return typeof Symbol;", "symbols"],
  ["symbol-iterator-defined", "return Symbol.iterator !== undefined;", "symbols"],
  ["symbol-self-equal", "return Symbol.iterator === Symbol.iterator;", "symbols"],
  ["symbol-distinct", "return Symbol.iterator === Symbol.asyncIterator;", "symbols"],
  ["obj-get-prototype-of", "var F = function () {}; var o = new F(); return Object.getPrototypeOf(o) === F.prototype;", "descriptors"],
  ["obj-create", "var p = { k: 7 }; var o = Object.create(p); return o.k;", "descriptors"],
  ["obj-set-prototype-of", "var p = { k: 3 }; var o = {}; Object.setPrototypeOf(o, p); return o.k;", "descriptors"],
  ["obj-desc-value", "var o = { a: 1 }; return Object.getOwnPropertyDescriptor(o, 'a').value;", "descriptors"],
  ["obj-desc-writable", "var o = { a: 1 }; return Object.getOwnPropertyDescriptor(o, 'a').writable;", "descriptors"],
  ["obj-desc-missing", "var o = {}; return Object.getOwnPropertyDescriptor(o, 'z') === undefined;", "descriptors"],
  ["obj-define-property", "var o = {}; Object.defineProperty(o, 'a', { value: 5 }); return o.a;", "descriptors"],
  ["obj-own-property-names", "var o = { a: 1, b: 2 }; return Object.getOwnPropertyNames(o).length;", "descriptors"],

  // --- builtins -------------------------------------------------------------
  ["json-roundtrip", "var o = { a: [1, 2] }; return JSON.parse(JSON.stringify(o)).a[1];", "builtins"],
  ["json-nan-null", "return JSON.stringify(NaN);", "builtins"],
  ["math-floor-neg", "return Math.floor(-1.5);", "builtins"],
  ["math-max-empty", "return Math.max() === -Infinity;", "builtins"],
  ["date-epoch", "var d = new Date(0); return d.getTime();", "builtins"],
];

/**
 * Probes the evaluator does not yet handle. Each entry is a live assertion:
 * the suite fails if one of these starts working and is not removed, so the
 * list cannot drift away from reality.
 *
 * Recorded 2026-08-02 against gallery/game_engine/v2/interp.
 */
const KNOWN_GAPS = new Set<string>([
  // Classes parse but do not evaluate: `new A()` yields nothing.
  "class-basic",
  "class-method",
  "class-expr",
  "class-static",
  "class-getter",
  "class-extends",
  "class-super",
  "class-instanceof",
  // No RegExp implementation.
  "regex-test",
  "regex-exec",
  "regex-flags",
  "regex-replace",
  // Accessors return the accessor function instead of invoking it.
  "obj-getter",
  "obj-setter",
  // Sequence expressions, labelled break and named function-expression
  // recursion evaluate to nothing.
  "seq-expr",
  "labeled-break",
  "fn-expr-named",
  "for-of-expr-lhs",
  // Destructuring: nested object patterns and swap produce wrong values.
  "destr-obj-nested",
  "destr-swap",
  // Coercion is not implemented: `==` behaves as `===`, and ToString for
  // objects and arrays is wrong.
  "coerce-loose-eq",
  "coerce-arr-to-string",
  "coerce-obj-to-string",
  "coerce-valueof",
  // NaN, -0 and radix conversion are missing.
  "num-nan-ne-self",
  "num-radix-tostring",
  // Generators parse but do not run; Symbol is absent.
  "iter-generator",
  "iter-symbol-unique",
  // Array/object details.
  "arr-length-write",
  "obj-computed-key",
  // Builtins.
  "date-epoch",
  "err-optional-chain",
  "err-nullish",
]);

/** A module and an entry that imports from it, to check export visibility. */
const MODULE_SOURCE = [
  "const shown = 10;",
  "const notShown = 99;",
  "export const exported = 20;",
  "export function twice(n) { return n * 2; }",
  "function notExportedFn(n) { return n + 1000; }",
  "export class Widget { label() { return 'widget'; } }",
].join("\n");

const MODULE_ENTRY = [
  "import { exported, twice } from 'ranger:probe';",
  "import * as NS from 'ranger:probe';",
  "function readExportedConst() { return exported; }",
  "function callExportedFn() { return twice(21); }",
  "function readViaNamespace() { return NS.exported; }",
  "function callViaNamespace() { return NS.twice(20); }",
  "function entryOnlyBinding() { return typeof somethingLocalToTheModule; }",
  // Negative: these were never exported and must not be reachable.
  "function reachUnexportedConst() { const v = NS.notShown; if (v === undefined) { return 'blocked'; } return 'REACHABLE'; }",
  "function reachUnexportedFn() { if (NS.notExportedFn === undefined) { return 'blocked'; } return 'REACHABLE'; }",
].join("\n");

/** Cross-module checks that already hold. */
const MODULE_EXPECTATIONS: Array<[fn: string, expected: unknown, what: string]> = [
  ["readExportedConst", 20, "a named import of an exported const"],
  ["callExportedFn", 42, "a named import of an exported function"],
  ["readViaNamespace", 20, "namespace access to an exported const"],
  ["callViaNamespace", 40, "a namespace call to an exported function"],
  ["entryOnlyBinding", "undefined", "a binding the module never declared"],
];

/**
 * Cross-module checks that do NOT hold: `export` is not enforced, so every
 * top-level binding of a module is reachable through its namespace. Listed the
 * same way as KNOWN_GAPS so a fix forces an update.
 */
const MODULE_KNOWN_GAPS: Array<[fn: string, what: string]> = [
  ["reachUnexportedConst", "an unexported const is reachable through the namespace"],
  ["reachUnexportedFn", "an unexported function is reachable through the namespace"],
];

function buildEngineModuleIfNeeded(): void {
  const upToDate =
    fs.existsSync(ENGINE_MODULE) &&
    fs.statSync(ENGINE_MODULE).mtimeMs >= fs.statSync(ENGINE_SOURCE).mtimeMs;
  if (upToDate) return;
  execFileSync("bash", [BUILD_SCRIPT], { cwd: ROOT_DIR, stdio: "pipe" });
}

/** The value Node produces for a probe body. Throws if the probe is broken. */
function nodeValue(body: string): unknown {
  return new Function(body)();
}

/** The value the engine produces, or a marker for a non-value result. */
function engineValue(engine: any, fnName: string): unknown {
  const original = console.log;
  console.log = () => {};
  try {
    const r = engine.callFunction(fnName, EvalValue.null());
    if (!r) return "<missing>";
    switch (r.valueType) {
      case T_NUM:
        return r.numberValue;
      case T_STR:
        return r.stringValue;
      case T_BOOL:
        return r.boolValue;
      case T_UNDEF:
        return undefined;
      case T_NULL:
        return "<null>";
      default:
        return "<valueType " + r.valueType + ">";
    }
  } catch (e: any) {
    return "<threw " + (e && e.message) + ">";
  } finally {
    console.log = original;
  }
}

function probeFunctionName(name: string): string {
  return name.replace(/-/g, "_");
}

describe("runtime conformance (interp realm)", () => {
  let engine: any;
  const engineResults = new Map<string, unknown>();
  const nodeResults = new Map<string, unknown>();

  beforeAll(() => {
    buildEngineModuleIfNeeded();
    const require = createRequire(import.meta.url);
    const mod = require(ENGINE_MODULE);
    ComponentEngine = mod.ComponentEngine;
    EvalValue = mod.EvalValue;

    // Derive every expectation from Node before touching the engine.
    for (const [name, body] of PROBES) {
      nodeResults.set(name, nodeValue(body));
    }

    engine = new ComponentEngine();
    engine.quiet = true;
    let src = "";
    for (const [name, body] of PROBES) {
      src += "function " + probeFunctionName(name) + "() { " + body + " }\n";
    }
    const original = console.log;
    console.log = () => {};
    try {
      engine.loadScript(src);
    } finally {
      console.log = original;
    }
    for (const [name] of PROBES) {
      engineResults.set(name, engineValue(engine, probeFunctionName(name)));
    }
  }, 120000);

  it("every probe behaves as written when Node runs it", () => {
    // A probe whose Node result is not a plain value is a broken probe: the
    // comparison below would be meaningless.
    const broken: string[] = [];
    for (const [name] of PROBES) {
      const v = nodeResults.get(name);
      if (typeof v === "object" && v !== null) broken.push(name);
    }
    expect(broken).toEqual([]);
  });

  it("known gaps are named by a real probe", () => {
    const probeNames = new Set(PROBES.map(([n]) => n));
    const stale = [...KNOWN_GAPS].filter((n) => !probeNames.has(n));
    expect(stale).toEqual([]);
  });

  const supported = PROBES.filter(([name]) => !KNOWN_GAPS.has(name));
  describe("supported features produce the same value as Node", () => {
    for (const [name, , group] of supported) {
      it(`${group}: ${name}`, () => {
        expect(engineResults.get(name)).toEqual(nodeResults.get(name));
      });
    }
  });

  it("known gaps still fail (remove one from KNOWN_GAPS when it is fixed)", () => {
    const nowWorking: string[] = [];
    for (const [name] of PROBES) {
      if (!KNOWN_GAPS.has(name)) continue;
      if (Object.is(engineResults.get(name), nodeResults.get(name))) {
        nowWorking.push(name);
      }
    }
    expect(nowWorking).toEqual([]);
  });

  describe("cross-module imports and exports", () => {
    let moduleEngine: any;
    const moduleResults = new Map<string, unknown>();

    beforeAll(() => {
      moduleEngine = new ComponentEngine();
      moduleEngine.quiet = true;
      moduleEngine.registerVirtualModule("ranger:probe", MODULE_SOURCE);
      const original = console.log;
      console.log = () => {};
      try {
        moduleEngine.loadScript(MODULE_ENTRY);
      } finally {
        console.log = original;
      }
      for (const [fn] of [...MODULE_EXPECTATIONS, ...MODULE_KNOWN_GAPS]) {
        moduleResults.set(fn, engineValue(moduleEngine, fn));
      }
    }, 120000);

    for (const [fn, expected, what] of MODULE_EXPECTATIONS) {
      it(what, () => {
        expect(moduleResults.get(fn)).toEqual(expected);
      });
    }

    it("export is not yet a visibility gate (known gap)", () => {
      // `export` changes nothing inside a module; it only decides what another
      // module may import. Today every top-level binding is reachable, so these
      // report REACHABLE rather than blocked.
      const unexpectedlyBlocked = MODULE_KNOWN_GAPS.filter(
        ([fn]) => moduleResults.get(fn) === "blocked"
      ).map(([fn]) => fn);
      expect(unexpectedlyBlocked).toEqual([]);
    });
  });
});
