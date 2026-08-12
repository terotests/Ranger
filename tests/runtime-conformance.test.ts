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
import * as vm from "vm";
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
  // D-REGEX: the pattern grammar, the flags, and the four String methods
  // specified against RegExp.
  ["regex-source", "return /ab+c/gi.source;", "regex"],
  ["regex-flags-prop", "return /ab+c/gi.flags;", "regex"],
  ["regex-global-prop", "return /a/g.global;", "regex"],
  ["regex-exec-index", "return /b/.exec('abc').index;", "regex"],
  ["regex-exec-null", "return String(/z/.exec('abc'));", "regex"],
  ["regex-exec-capture", "return /b(c)/.exec('abc')[1];", "regex"],
  ["regex-exec-optional-capture", "var m = /a(x)?b/.exec('ab'); return String(m[1]);", "regex"],
  ["regex-lastindex", "var r = /a/g; r.exec('aa'); return r.lastIndex;", "regex"],
  ["regex-exec-twice", "var r = /a/g; r.exec('aa'); return r.exec('aa').index;", "regex"],
  ["regex-class", "return /[a-c]+/.exec('xxabcyy')[0];", "regex"],
  ["regex-class-negated", "return /[^a-c]+/.exec('abcxyz')[0];", "regex"],
  ["regex-quantifier-bounds", "return /a{2,3}/.exec('aaaa')[0];", "regex"],
  ["regex-quantifier-exact", "return /a{2}/.exec('aaaa')[0];", "regex"],
  ["regex-lazy", "return /a+?/.exec('aaa')[0];", "regex"],
  ["regex-alternation", "return /cat|dog/.exec('a dog')[0];", "regex"],
  ["regex-anchor-start", "return /^ab/.test('abc');", "regex"],
  ["regex-anchor-end", "return /bc$/.test('abc');", "regex"],
  ["regex-word-boundary", "return /\\bcat\\b/.test('a cat here');", "regex"],
  ["regex-not-word-boundary", "return /\\Bcat/.test('scat');", "regex"],
  ["regex-multiline", "return /^b/m.test('a\\nb');", "regex"],
  ["regex-backreference", "return /(a)\\1/.test('aa');", "regex"],
  ["regex-lookahead", "return /a(?=b)/.exec('ab')[0];", "regex"],
  ["regex-negative-lookahead", "return /a(?!b)/.test('ac');", "regex"],
  ["regex-non-capturing", "return /(?:ab)+/.exec('ababx')[0];", "regex"],
  ["regex-dot", "return /a.c/.test('abc');", "regex"],
  ["regex-dot-no-newline", "return /a.c/.test('a\\nc');", "regex"],
  ["regex-escape-digit", "return /\\d+/.exec('ab123')[0];", "regex"],
  ["regex-escape-word", "return /\\w+/.exec(' abc ')[0];", "regex"],
  ["regex-escape-space", "return /\\s/.test('a b');", "regex"],
  ["regex-ctor", "return new RegExp('a+', 'g').source;", "regex"],
  ["regex-ctor-test", "return new RegExp('a+').test('baa');", "regex"],
  ["regex-ctor-copy", "return new RegExp(/x/g).flags;", "regex"],
  ["regex-ctor-bad", "try { new RegExp('('); return 'no-throw'; } catch (e) { return e.name; }", "regex"],
  ["regex-brand", "return Object.prototype.toString.call(/a/);", "regex"],
  ["regex-match", "return 'abc'.match(/b/)[0];", "regex"],
  ["regex-match-global", "return 'aXbXc'.match(/X/g).join(',');", "regex"],
  ["regex-match-none", "return String('abc'.match(/z/));", "regex"],
  ["regex-search", "return 'hello'.search(/ll/);", "regex"],
  ["regex-search-none", "return 'hello'.search(/zz/);", "regex"],
  ["regex-replace-first", "return 'a1b2'.replace(/\\d/, '#');", "regex"],
  ["regex-replace-groups", "return 'John Smith'.replace(/(\\w+)\\s(\\w+)/, '$2 $1');", "regex"],
  ["regex-replace-dollar-amp", "return 'abc'.replace(/b/, '[$&]');", "regex"],
  ["regex-replace-fn", "return 'a1b'.replace(/\\d/, function (m) { return '[' + m + ']'; });", "regex"],
  ["regex-replace-fn-groups", "return 'a1b'.replace(/(\\d)/, function (m, g) { return g + g; });", "regex"],
  ["regex-split", "return 'a1b2c'.split(/\\d/).join('|');", "regex"],
  ["regex-split-captures", "return 'a1b'.split(/(\\d)/).join('|');", "regex"],
  ["regex-split-limit", "return 'a1b2c'.split(/\\d/, 2).join('|');", "regex"],

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
  ["acc-literal-getter", "var o = { get a() { return 7; } }; return o.a;", "accessors"],
  ["acc-literal-setter", "var o = { _v: 0, set a(x) { this._v = x; } }; o.a = 5; return o._v;", "accessors"],
  ["acc-getter-setter-pair", "var o = { _v: 1, get a() { return this._v; }, set a(x) { this._v = x * 2; } }; o.a = 4; return o.a;", "accessors"],
  ["acc-define-getter", "var o = {}; Object.defineProperty(o, 'a', { get: function () { return 3; } }); return o.a;", "accessors"],
  ["acc-define-setter", "var o = { _v: 0 }; Object.defineProperty(o, 'a', { set: function (x) { this._v = x; } }); o.a = 9; return o._v;", "accessors"],
  ["acc-desc-reports-get", "var o = { get a() { return 1; } }; return typeof Object.getOwnPropertyDescriptor(o, 'a').get;", "accessors"],
  ["acc-desc-no-value", "var o = { get a() { return 1; } }; return Object.getOwnPropertyDescriptor(o, 'a').value === undefined;", "accessors"],
  ["acc-proto-getter", "var F = function () { this._v = 6; }; Object.defineProperty(F.prototype, 'a', { get: function () { return this._v; } }); var o = new F(); return o.a;", "accessors"],
  ["symbol-factory-typeof", "var s = Symbol('x'); return typeof s;", "symbols"],
  ["symbol-factory-unique", "return Symbol('a') === Symbol('a');", "symbols"],
  ["symbol-description", "return Symbol('hi').description;", "symbols"],
  ["es5-number-max-value", "return Number.MAX_VALUE;", "es5"],
  ["es5-number-min-value", "return Number.MIN_VALUE;", "es5"],
  ["es5-number-max-finite", "return Number.MAX_VALUE !== Infinity;", "es5"],
  ["es5-number-min-positive", "return Number.MIN_VALUE > 0;", "es5"],
  ["es5-define-properties", "var o = {}; Object.defineProperties(o, { a: { value: 1 }, b: { value: 2 } }); return o.a + o.b;", "es5"],
  ["es5-define-properties-accessor", "var o = {}; Object.defineProperties(o, { x: { get: function () { return 8; } } }); return o.x;", "es5"],

  // D-REGISTRY: built-in dispatch keyed by receiver kind. Before the registry
  // these nine methods fired on ANY receiver, so [1,2].charAt(0) stringified
  // the array and indexed its debug format to return "[".
  // The canonical ES5 idioms, structurally impossible before the registry:
  // a built-in reached from its constructor's prototype rather than an instance.
  // String.prototype methods coerce `this` via ToString. Reading stringValue
  // directly gave "" for a non-string receiver -- silently, which is why it
  // cost Test262 score rather than raising an error.
  // D-ATTRS: property attributes. defineProperty defaults all three to FALSE,
  // plain assignment defaults them TRUE -- the engine could not tell the two
  // apart, so every descriptor reported true and freeze/seal did nothing.
  // D-ARGCHECK: Object statics reject non-objects. Accepting them silently was
  // the largest failure bucket in built-ins/Object -- the call did nothing and
  // the assertion after it measured whatever the no-op left behind.
  // D-GLOBALOBJ: built-in namespaces are real objects, not names the engine
  // merely recognises. They resolved to undefined, which was the largest ES5
  // failure bucket -- every property read off one failed.
  // D-CBCHECK / D-DESCVALID: higher-order Array methods need a callable, and a
  // descriptor is either a data or an accessor descriptor, never both.
  // D-RADIX / D-WRAPPER: Number.prototype.toString(radix), and boxed
  // primitives. new String(x) used to make an empty object, so whole
  // String.prototype areas scored zero -- their fixtures are built that way.
  // D-PROTOCTOR: every prototype carries `constructor` back to its global, and
  // a non-object value falls back to its kind's prototype to reach it.
  ["protoctor-array", "return [1, 2].constructor === Array;", "protoreg"],
  ["protoctor-string", "return 'a'.constructor === String;", "protoreg"],
  ["protoctor-number", "return (5).constructor === Number;", "protoreg"],
  ["protoctor-split-result", "return 'a,b'.split(',').constructor === Array;", "protoreg"],
  ["protoctor-on-prototype", "return Array.prototype.constructor === Array;", "protoreg"],

  ["radix-base2", "return (5).toString(2);", "radix"],
  ["radix-base16", "return (255).toString(16);", "radix"],
  ["radix-base36", "return (35).toString(36);", "radix"],
  ["radix-negative", "return (-10).toString(2);", "radix"],
  ["radix-default", "return (10).toString();", "radix"],
  ["radix-explicit-10", "return (10).toString(10);", "radix"],
  ["radix-range-error", "try { (5).toString(1); } catch (e) { return e.name; } return 'no-throw';", "radix"],
  ["wrap-string-slice", "return new String('abcdef').slice(1, 3);", "wrappers"],
  ["wrap-string-upper", "return new String('ab').toUpperCase();", "wrappers"],
  ["wrap-string-split", "return new String('a,b').split(',').length;", "wrappers"],
  ["wrap-string-indexof", "return new String('hello').indexOf('ll');", "wrappers"],
  ["wrap-string-substring", "return new String('abcdef').substring(1, 3);", "wrappers"],
  ["wrap-number-radix", "return new Number(255).toString(16);", "wrappers"],
  ["wrap-boolean-tostring", "return new Boolean(true).toString();", "wrappers"],
  ["wrap-typeof-object", "return typeof new String('a');", "wrappers"],
  ["wrap-valueof", "return new Number(7).valueOf();", "wrappers"],
  ["wrap-plain-unaffected", "return 'abc'.slice(1);", "wrappers"],

  ["cb-foreach-nonfn", "try { [1, 2].forEach(5); } catch (e) { return e.name; } return 'no-throw';", "validation"],
  ["cb-every-nonfn", "try { [1].every(true); } catch (e) { return e.name; } return 'no-throw';", "validation"],
  ["cb-map-null", "try { [1].map(null); } catch (e) { return e.name; } return 'no-throw';", "validation"],
  ["cb-reduce-nonfn", "try { [1].reduce('x'); } catch (e) { return e.name; } return 'no-throw';", "validation"],
  ["cb-foreach-ok", "var n = 0; [1, 2].forEach(function (x) { n = n + x; }); return n;", "validation"],
  // D-REDEFINE: defineProperty validated against the property already there.
  // A non-configurable property is close to frozen; accepting a redefinition
  // let a test's SETUP succeed where the spec requires it to fail.
  // D-INDEXDESC: array and string indices are real own properties but live
  // outside objectMap, so their descriptors came back undefined.
  // D-WITH / D-SOURCETYPE: `with` puts an object at the front of the scope
  // chain. It was rejected at PARSE time because the engine treated every
  // guest source as a module, and module code is always strict -- so sloppy
  // syntax failed before the evaluator ever saw it.
  // D-GLOBALTHIS: top-level `this` is the global object, and a property set
  // through it becomes a global binding. A large family of sloppy-script tests
  // declares its fixtures that way on their FIRST line, so without it they
  // failed before reaching what they actually test.
  ["with-coerces-primitive", "var r; with ('ab') { r = length; } return r;", "with"],
  ["with-var-lifts-out", "var o = { a: 1 }; with (o) { var lifted = 5; } return lifted;", "with"],
  ["eval-sloppy-source", "return eval('var q = 1; q + 1');", "with"],

  ["globalthis-typeof", "return typeof this;", "with"],

  // D-TOPRIMITIVE: objects convert via valueOf/toString before every operator
  // that is not ===. Reading raw values sent an object straight to its debug
  // form, so arithmetic on it concatenated text instead of adding numbers.
  // D-LOOSEEQ: abstract equality. `==` used to be `===` plus a null/undefined
  // case, so the comparisons it exists to make were all false.
  ["looseeq-num-str", "return 1 == '1';", "coercion"],
  ["looseeq-bool-num", "return true == 1;", "coercion"],
  ["looseeq-false-zero", "return false == 0;", "coercion"],
  ["looseeq-empty-zero", "return '' == 0;", "coercion"],
  ["looseeq-null-undefined", "return null == undefined;", "coercion"],
  ["looseeq-null-not-zero", "return null == 0;", "coercion"],
  ["looseeq-nan", "return (0 / 0) == (0 / 0);", "coercion"],
  ["looseeq-array-num", "return [1] == 1;", "coercion"],
  ["looseeq-valueof", "var o = { valueOf: function () { return 3; } }; return o == 3;", "coercion"],
  ["looseeq-obj-reference", "var a = {}; var b = {}; return a == b;", "coercion"],
  ["looseeq-obj-self", "var a = {}; return a == a;", "coercion"],
  ["looseeq-strict-unaffected", "return 1 === '1';", "coercion"],
  ["looseeq-not-equal", "return 1 != '2';", "coercion"],
  ["looseeq-undefined-zero", "return undefined == 0;", "coercion"],
  ["looseeq-bitwise-coerce", "var o = { valueOf: function () { return 5; } }; return o | 0;", "coercion"],

  ["toprim-valueof-add", "var o = { valueOf: function () { return 5; } }; return o + 1;", "coercion"],
  ["toprim-tostring-add", "var o = { toString: function () { return 'x'; } }; return o + 'y';", "coercion"],
  ["toprim-valueof-wins", "var o = { valueOf: function () { return 2; }, toString: function () { return 'z'; } }; return o + 1;", "coercion"],
  ["toprim-array-concat", "return [1, 2] + '';", "coercion"],
  ["toprim-object-concat", "return ({}) + '';", "coercion"],
  ["toprim-string-lexical-lt", "return '10' < '9';", "coercion"],
  ["toprim-string-lexical-gt", "return 'b' > 'a';", "coercion"],
  ["toprim-numeric-compare", "return 10 < 9;", "coercion"],
  ["toprim-mixed-compare", "return '10' < 9;", "coercion"],
  ["toprim-nan-compare", "return (0 / 0) < 1;", "coercion"],
  ["toprim-valueof-compare", "var o = { valueOf: function () { return 5; } }; return o > 3;", "coercion"],
  ["toprim-wrapper-add", "return new Boolean(true) + true;", "coercion"],
  ["toprim-subtract-object", "var o = { valueOf: function () { return 9; } }; return o - 4;", "coercion"],

  ["with-read", "var o = { a: 5 }; var r; with (o) { r = a; } return r;", "with"],
  ["with-shadows-outer", "var a = 1; var o = { a: 9 }; var r; with (o) { r = a; } return r;", "with"],
  ["with-writes-through", "var o = { a: 1 }; with (o) { a = 7; } return o.a;", "with"],
  ["with-falls-through", "var b = 3; var o = { a: 1 }; var r; with (o) { r = b; } return r;", "with"],
  ["with-scope-ends", "var a = 1; var o = { a: 9 }; with (o) {} return a;", "with"],
  ["with-method-call", "var o = { a: 'xy' }; var r; with (o) { r = a.length; } return r;", "with"],
  ["with-null-throws", "try { with (null) {} } catch (e) { return e.name; } return 'no-throw';", "with"],
  ["with-nested", "var o = { a: 1 }; var p = { b: 2 }; var r; with (o) { with (p) { r = a + b; } } return r;", "with"],

  // D-CLASSOF: Object.prototype.toString is the only way a program can observe
  // a value's internal type. The `getClass` idiom below -- storing the built-in
  // under another name and calling it as a method -- is how the suite writes it.
  ["classof-array", "return Object.prototype.toString.call([1, 2]);", "classof"],
  ["classof-object", "return Object.prototype.toString.call({});", "classof"],
  ["classof-number", "return Object.prototype.toString.call(5);", "classof"],
  ["classof-string", "return Object.prototype.toString.call('a');", "classof"],
  ["classof-boolean", "return Object.prototype.toString.call(true);", "classof"],
  ["classof-null", "return Object.prototype.toString.call(null);", "classof"],
  ["classof-undefined", "return Object.prototype.toString.call(undefined);", "classof"],
  ["classof-function", "return Object.prototype.toString.call(function () {});", "classof"],
  ["classof-boxed-number", "return Object.prototype.toString.call(new Number(1));", "classof"],
  ["classof-boxed-string", "return Object.prototype.toString.call(new String('a'));", "classof"],
  ["classof-boxed-boolean", "return Object.prototype.toString.call(new Boolean(true));", "classof"],
  ["classof-error", "try { null.x; } catch (e) { return Object.prototype.toString.call(e); }", "classof"],
  ["classof-getclass-array", "var a = [1]; a.getClass = Object.prototype.toString; return a.getClass();", "classof"],
  ["classof-getclass-object", "var o = {}; o.getClass = Object.prototype.toString; return o.getClass();", "classof"],
  ["classof-plain-tostring", "return ({}).toString();", "classof"],
  ["classof-array-tostring", "return [1, 2].toString();", "classof"],
  ["classof-number-proto", "return Object.prototype.toString.call(Number.prototype);", "classof"],
  ["classof-object-proto", "return Object.prototype.toString.call(Object.prototype);", "classof"],
  ["classof-bind-keeps-this", "var f = Object.prototype.toString.bind([1]); var o = {}; o.g = f; return o.g();", "classof"],
  // Boxed prototypes: Number.prototype et al hold a primitive of their own.
  ["boxproto-number-tostring", "return Number.prototype.toString();", "classof"],
  ["boxproto-boolean-tostring", "return Boolean.prototype.toString();", "classof"],
  ["boxproto-number-valueof", "return Number.prototype.valueOf();", "classof"],
  ["boxproto-string-length-intact", "return 'abcd'.length;", "classof"],
  ["boxproto-no-leaked-slots", "return Object.keys(new String('ab')).join(',');", "classof"],
  // Native errors all inherit from Error.
  ["errproto-type-is-error", "try { null.x; } catch (e) { return e instanceof Error; }", "classof"],
  ["errproto-type-is-type", "try { null.x; } catch (e) { return e instanceof TypeError; }", "classof"],
  ["errproto-range-is-error", "try { (5).toString(1); } catch (e) { return e instanceof Error; }", "classof"],
  ["errproto-user-not-error", "function F() {} var f = new F(); return f instanceof Error;", "classof"],

  // D-DEFINEOWN: defineProperty and defineProperties run the SAME
  // [[DefineOwnProperty]]. The plural form used to validate nothing at all.
  ["defown-data-to-accessor", "try { var o = {}; Object.defineProperty(o, 'a', { value: 1, configurable: false }); Object.defineProperty(o, 'a', { get: function () { return 2; } }); return 'no-throw'; } catch (e) { return e.name; }", "defineown"],
  ["defown-accessor-to-data", "try { var o = {}; Object.defineProperty(o, 'a', { get: function () { return 1; }, configurable: false }); Object.defineProperty(o, 'a', { value: 2 }); return 'no-throw'; } catch (e) { return e.name; }", "defineown"],
  ["defown-accessor-swap-getter", "try { var o = {}; Object.defineProperty(o, 'a', { get: function () { return 1; }, configurable: false }); Object.defineProperty(o, 'a', { get: function () { return 2; } }); return 'no-throw'; } catch (e) { return e.name; }", "defineown"],
  ["defown-accessor-same-getter", "try { var g = function () { return 1; }; var o = {}; Object.defineProperty(o, 'a', { get: g, configurable: false }); Object.defineProperty(o, 'a', { get: g }); return 'no-throw'; } catch (e) { return e.name; }", "defineown"],
  ["defown-accessor-enumerable", "try { var g = function () { return 1; }; var o = {}; Object.defineProperty(o, 'a', { get: g, enumerable: true, configurable: false }); Object.defineProperty(o, 'a', { get: g, enumerable: false }); return 'no-throw'; } catch (e) { return e.name; }", "defineown"],
  ["defown-plural-bad-desc", "try { Object.defineProperties({}, { p: true }); return 'no-throw'; } catch (e) { return e.name; }", "defineown"],
  ["defown-plural-atomic", "var o = {}; try { Object.defineProperties(o, { p: true }); } catch (e) {} return o.hasOwnProperty('p');", "defineown"],
  ["defown-plural-redefine", "try { var o = {}; Object.defineProperty(o, 'p', { value: 1, configurable: false }); Object.defineProperties(o, { p: { value: 2, configurable: true } }); return 'no-throw'; } catch (e) { return e.name; }", "defineown"],
  ["defown-plural-applies", "var o = {}; Object.defineProperties(o, { a: { value: 1, enumerable: true }, b: { value: 2 } }); return o.a + ':' + o.b + ':' + Object.keys(o).join(',');", "defineown"],
  ["defown-plural-attrs", "var o = {}; Object.defineProperties(o, { a: { value: 1 } }); return Object.getOwnPropertyDescriptor(o, 'a').enumerable;", "defineown"],
  ["defown-function-desc", "var o = {}; Object.defineProperty(o, 'k', function () {}); return o.hasOwnProperty('k') + ':' + String(o.k);", "defineown"],
  ["defown-array-desc", "var o = {}; Object.defineProperty(o, 'k', []); return o.hasOwnProperty('k');", "defineown"],
  ["defown-accessor-desc-attrs", "var o = {}; Object.defineProperty(o, 'a', { get: function () { return 1; }, enumerable: true }); var d = Object.getOwnPropertyDescriptor(o, 'a'); return d.enumerable + ':' + d.configurable;", "defineown"],
  // D-THISCHECK: a borrowed Number/Boolean prototype method rejects a foreign
  // receiver rather than answering for it.
  ["thischeck-boolean-borrowed", "try { var o = {}; o.f = Boolean.prototype.toString; return o.f(); } catch (e) { return e.name; }", "defineown"],
  ["thischeck-number-borrowed", "try { var o = {}; o.f = Number.prototype.toString; return o.f(); } catch (e) { return e.name; }", "defineown"],
  ["thischeck-number-tofixed", "try { var o = {}; o.f = Number.prototype.toFixed; return o.f(2); } catch (e) { return e.name; }", "defineown"],
  ["thischeck-number-own-ok", "var n = 255; n.toString = Number.prototype.toString; return (255).toString(16);", "defineown"],
  ["thischeck-boxed-ok", "var o = new Boolean(true); o.f = Boolean.prototype.toString; return o.f();", "defineown"],
  ["thischeck-string-coerces", "var o = { toString: function () { return 'xy'; } }; return String.prototype.charAt.call(o, 1);", "defineown"],

  // D-FNPROPS: a function's own length/name/prototype, and their descriptors.
  ["fnprops-length", "var f = function (a, b) {}; return f.length;", "fnprops"],
  ["fnprops-length-zero", "var f = function () {}; return f.length;", "fnprops"],
  ["fnprops-length-default", "var f = function (a, b) { return a + b; }; return f.length;", "fnprops"],
  ["fnprops-length-decl", "function g(a, b, c) {} return g.length;", "fnprops"],
  ["fnprops-desc-length", "var f = function (a, b) {}; var d = Object.getOwnPropertyDescriptor(f, 'length'); return d.value + ':' + d.writable + ':' + d.enumerable + ':' + d.configurable;", "fnprops"],
  ["fnprops-desc-name", "var f = function foo() {}; var d = Object.getOwnPropertyDescriptor(f, 'name'); return d.value + ':' + d.enumerable + ':' + d.configurable;", "fnprops"],
  ["fnprops-desc-prototype", "var f = function () {}; var d = Object.getOwnPropertyDescriptor(f, 'prototype'); return (typeof d.value) + ':' + d.writable + ':' + d.enumerable + ':' + d.configurable;", "fnprops"],
  ["fnprops-desc-has-no-get", "var f = function () {}; var d = Object.getOwnPropertyDescriptor(f, 'length'); return d.hasOwnProperty('get');", "fnprops"],
  // Property keys go through ToString, so an object key runs its own toString.
  ["propkey-array", "var o = { '1': 1 }; return Object.getOwnPropertyDescriptor(o, [1]).value;", "fnprops"],
  ["propkey-number", "var o = { '1': 1 }; return Object.getOwnPropertyDescriptor(o, 1).value;", "fnprops"],
  ["propkey-object", "var o = { xy: 1 }; var k = { toString: function () { return 'xy'; } }; return Object.getOwnPropertyDescriptor(o, k).value;", "fnprops"],
  ["propkey-define", "var o = {}; Object.defineProperty(o, [1], { value: 5 }); return o['1'];", "fnprops"],
  // Built-in prototype methods are non-enumerable.
  ["protoenum-string", "return Object.keys(String.prototype).length;", "fnprops"],
  ["protoenum-array", "return Object.keys(Array.prototype).length;", "fnprops"],
  ["protoenum-forin", "var n = 0; for (var k in String.prototype) { n++; } return n;", "fnprops"],
  ["protoenum-still-there", "return typeof String.prototype.charAt;", "fnprops"],

  // D-ARRAYLIKE: Array.prototype methods are generic over their receiver, take a
  // thisArg, and hand the object itself to the callback as a third argument.
  ["arraylike-filter", "var o = { length: 3, 0: 1, 1: 2, 2: 3 }; return Array.prototype.filter.call(o, function (v) { return v > 1; }).join(',');", "arraylike"],
  ["arraylike-map", "var o = { length: 2, 0: 1, 1: 2 }; return Array.prototype.map.call(o, function (v) { return v * 2; }).join(',');", "arraylike"],
  ["arraylike-foreach", "var o = { length: 2, 0: 1, 1: 2 }; var s = 0; Array.prototype.forEach.call(o, function (v) { s += v; }); return s;", "arraylike"],
  ["arraylike-join", "var o = { length: 2, 0: 'a', 1: 'b' }; return Array.prototype.join.call(o, '-');", "arraylike"],
  ["arraylike-slice", "var o = { length: 3, 0: 1, 1: 2, 2: 3 }; return Array.prototype.slice.call(o, 1).join(',');", "arraylike"],
  ["arraylike-indexof", "var o = { length: 2, 0: 'a', 1: 'b' }; return Array.prototype.indexOf.call(o, 'b');", "arraylike"],
  ["arraylike-no-length", "return Array.prototype.join.call({}, '-');", "arraylike"],
  ["cb-third-arg", "return [1, 2].filter(function (v, i, o) { return o.length === 2; }).length;", "arraylike"],
  ["cb-third-arg-map", "return [1].map(function (v, i, o) { return o === undefined ? 'no' : 'yes'; })[0];", "arraylike"],
  ["cb-thisarg-filter", "return [1, 2].filter(function (v) { return v === this.n; }, { n: 2 }).join(',');", "arraylike"],
  ["cb-thisarg-map", "return [1].map(function (v) { return this.k; }, { k: 9 })[0];", "arraylike"],
  ["cb-thisarg-foreach", "var s = 0; [1, 2].forEach(function (v) { s += v * this.m; }, { m: 10 }); return s;", "arraylike"],
  ["cb-thisarg-every", "return [1].every(function () { return this.ok; }, { ok: true });", "arraylike"],
  ["reduce-right", "return [1, 2, 3].reduceRight(function (a, b) { return a + b; });", "arraylike"],
  ["reduce-right-order", "return ['a', 'b', 'c'].reduceRight(function (a, b) { return a + b; });", "arraylike"],
  ["reduce-right-seed", "return [1, 2].reduceRight(function (a, b) { return a + b; }, 10);", "arraylike"],
  ["reduce-no-thisarg", "return [1, 2].reduce(function (a, b) { return a + b; }, 10);", "arraylike"],
  ["reduce-empty-throws", "try { [].reduce(function (a, b) { return a + b; }); return 'no-throw'; } catch (e) { return e.name; }", "arraylike"],
  // Array(len) validates its length instead of crashing the host.
  ["arraylen-negative", "try { new Array(-1); return 'no-throw'; } catch (e) { return e.name; }", "arraylike"],
  ["arraylen-too-big", "try { new Array(4294967296); return 'no-throw'; } catch (e) { return e.name; }", "arraylike"],
  ["arraylen-fractional", "try { new Array(1.5); return 'no-throw'; } catch (e) { return e.name; }", "arraylike"],
  ["arraylen-ok", "return new Array(3).length;", "arraylike"],
  ["arraylen-call-form", "try { Array(-1); return 'no-throw'; } catch (e) { return e.name; }", "arraylike"],
  // D-PROTOKIND: a built-in method reached through the prototype chain.
  ["protokind-filter", "function F() {} F.prototype = new Array(1, 2, 3); var f = new F(); return f.filter(function (v) { return v > 1; }).join(',');", "arraylike"],
  ["protokind-join", "function F() {} F.prototype = [1, 2]; var f = new F(); return f.join('-');", "arraylike"],
  ["protokind-length", "function F() {} F.prototype = new Array(1, 2, 3); return new F().length;", "arraylike"],
  ["protokind-typeof", "function F() {} F.prototype = [1, 2]; return typeof new F().join;", "arraylike"],
  ["protokind-own-wins", "function F() {} F.prototype = [1, 2]; var f = new F(); f.join = function () { return 'mine'; }; return f.join();", "arraylike"],
  // A constructor call in statement position runs, and its errors escape.
  ["stmt-new-runs", "var n = 0; function F() { n = 5; } new F(); return n;", "arraylike"],
  ["stmt-new-throws", "try { new Array(-1); return 'no-throw'; } catch (e) { return e.name; }", "arraylike"],
  ["stmt-index-read", "var a = [1, 2]; return a['0'] + ':' + a['1'];", "arraylike"],

  // D-INSTANCEOF: the built-in constructors, which a literal cannot answer for
  // through a `constructor` property or a `__class__` tag.
  ["instof-array", "return [] instanceof Array;", "instanceof"],
  ["instof-array-object", "return [] instanceof Object;", "instanceof"],
  ["instof-object", "return ({}) instanceof Object;", "instanceof"],
  ["instof-function", "return (function () {}) instanceof Function;", "instanceof"],
  ["instof-function-object", "return (function () {}) instanceof Object;", "instanceof"],
  ["instof-object-not-array", "return ({}) instanceof Array;", "instanceof"],
  ["instof-primitive-string", "return 'a' instanceof String;", "instanceof"],
  ["instof-primitive-number", "return 1 instanceof Number;", "instanceof"],
  ["instof-boxed-string", "return new String('a') instanceof String;", "instanceof"],
  ["instof-boxed-cross", "return new String('a') instanceof Number;", "instanceof"],
  ["instof-null", "return null instanceof Object;", "instanceof"],
  ["instof-undefined", "return undefined instanceof Object;", "instanceof"],
  ["instof-fn-ctor", "var f = Function('return 1;'); return f instanceof Function;", "instanceof"],
  ["instof-user-ctor", "function F() {} return new F() instanceof F;", "instanceof"],
  ["instof-proto-array", "function F() {} F.prototype = []; return new F() instanceof Array;", "instanceof"],
  // Own properties the engine synthesises rather than stores.
  ["hasown-fn-length", "return (function () {}).hasOwnProperty('length');", "instanceof"],
  ["hasown-fn-name", "return (function () {}).hasOwnProperty('name');", "instanceof"],
  ["hasown-fn-prototype", "return (function () {}).hasOwnProperty('prototype');", "instanceof"],
  ["hasown-fn-missing", "return (function () {}).hasOwnProperty('nope');", "instanceof"],
  ["hasown-array-index", "return [1, 2].hasOwnProperty('1');", "instanceof"],
  ["hasown-array-oob", "return [1, 2].hasOwnProperty('5');", "instanceof"],
  ["hasown-array-length", "return [1].hasOwnProperty('length');", "instanceof"],
  ["propenum-nonenumerable", "var o = {}; Object.defineProperty(o, 'a', { value: 1 }); return o.propertyIsEnumerable('a');", "instanceof"],
  ["propenum-plain", "var o = { a: 1 }; return o.propertyIsEnumerable('a');", "instanceof"],
  ["propenum-missing", "return ({}).propertyIsEnumerable('a');", "instanceof"],
  // Function.prototype.apply takes any array-like; bind adjusts the arity.
  ["apply-arraylike", "var f = function (a, b) { return a + b; }; return f.apply(null, { length: 2, 0: 1, 1: 2 });", "instanceof"],
  ["apply-non-object", "try { (function () {}).apply(null, 1); return 'no-throw'; } catch (e) { return e.name; }", "instanceof"],
  ["apply-null-args", "return (function () { return 5; }).apply(null, null);", "instanceof"],
  ["bind-length", "var f = function (a, b) {}; return f.bind(null, 1).length;", "instanceof"],
  ["bind-length-floor", "var f = function (a) {}; return f.bind(null, 1, 2).length;", "instanceof"],
  ["fnproto-typeof", "return typeof Function.prototype;", "instanceof"],
  ["fnproto-callable", "return Function.prototype();", "instanceof"],

  // D-STRICT: sloppy mode drops a refused write on the floor; strict mode
  // reports it. Both halves are asserted, since the sloppy behaviour is just as
  // much a requirement as the strict one.
  ["strict-nonwritable", "'use strict'; try { var o = {}; Object.defineProperty(o, 'p', { value: 10, writable: false }); o.p = 20; return 'no-throw'; } catch (e) { return e.name; }", "strict"],
  ["strict-compound-assign", "'use strict'; try { var o = {}; Object.defineProperty(o, 'p', { value: 10, writable: false, configurable: true }); o.p *= 20; return 'no-throw'; } catch (e) { return e.name; }", "strict"],
  ["strict-frozen", "'use strict'; try { var o = Object.freeze({ a: 1 }); o.a = 2; return 'no-throw'; } catch (e) { return e.name; }", "strict"],
  ["strict-non-extensible", "'use strict'; try { var o = {}; Object.preventExtensions(o); o.n = 1; return 'no-throw'; } catch (e) { return e.name; }", "strict"],
  ["strict-getter-only", "'use strict'; try { var o = {}; Object.defineProperty(o, 'g', { get: function () { return 1; } }); o.g = 2; return 'no-throw'; } catch (e) { return e.name; }", "strict"],
  ["strict-undeclared", "'use strict'; try { undeclaredXyz = 5; return 'no-throw'; } catch (e) { return e.name; }", "strict"],
  ["strict-nested-fn", "'use strict'; try { function inner() { var o = Object.freeze({ a: 1 }); o.a = 2; } inner(); return 'no-throw'; } catch (e) { return e.name; }", "strict"],
  ["strict-this-undefined", "'use strict'; function f() { return this; } return String(f());", "strict"],
  ["strict-this-receiver", "'use strict'; var o = { f: function () { return this.k; }, k: 3 }; return o.f();", "strict"],
  ["strict-write-ok", "'use strict'; var o = { a: 1 }; o.a = 2; return o.a;", "strict"],
  ["strict-declared-ok", "'use strict'; var q = 1; q = 2; return q;", "strict"],
  ["strict-setter-ok", "'use strict'; var o = {}; var seen = 0; Object.defineProperty(o, 's', { set: function (v) { seen = v; }, get: function () { return seen; } }); o.s = 2; return seen;", "strict"],
  ["sloppy-nonwritable", "var o = {}; Object.defineProperty(o, 'p', { value: 10, writable: false }); o.p = 20; return o.p;", "strict"],
  ["sloppy-frozen", "var o = Object.freeze({ a: 1 }); o.a = 2; return o.a;", "strict"],
  ["sloppy-undeclared", "undeclaredAbc = 5; return undeclaredAbc;", "strict"],
  ["sloppy-this-global", "function f() { return typeof this; } return f();", "strict"],

  // String.prototype methods the registry did not carry, plus ToString proper.
  ["str-locale-compare-lt", "return 'a'.localeCompare('b');", "stringmethods"],
  ["str-locale-compare-eq", "return 'a'.localeCompare('a');", "stringmethods"],
  ["str-locale-lower", "return 'AB'.toLocaleLowerCase();", "stringmethods"],
  ["str-locale-upper", "return 'ab'.toLocaleUpperCase();", "stringmethods"],
  ["str-locale-string", "return 'ab'.toLocaleString();", "stringmethods"],
  ["str-normalize", "return 'abc'.normalize();", "stringmethods"],
  ["str-search-found", "return 'hello'.search('ll');", "stringmethods"],
  ["str-search-missing", "return 'hello'.search('zz');", "stringmethods"],
  ["str-codepointat", "return 'A'.codePointAt(0);", "stringmethods"],
  ["str-codepointat-oob", "return String('abc'.codePointAt(9));", "stringmethods"],
  ["str-substr", "return 'abcdef'.substr(1, 3);", "stringmethods"],
  ["str-substr-negative", "return 'abcdef'.substr(-2);", "stringmethods"],
  ["str-substr-no-len", "return 'abcdef'.substr(2);", "stringmethods"],
  ["str-substr-past-end", "return 'abc'.substr(5, 2);", "stringmethods"],
  ["str-split-limit", "return 'a,b,c'.split(',', 2).join('|');", "stringmethods"],
  ["str-split-limit-zero", "return 'a,b,c'.split(',', 0).length;", "stringmethods"],
  ["str-split-no-limit", "return 'a,b,c'.split(',').length;", "stringmethods"],
  ["str-replace-fn", "return 'abc'.replace('b', function (m) { return m.toUpperCase(); });", "stringmethods"],
  ["str-replace-fn-offset", "return 'abc'.replace('b', function (m, i) { return String(i); });", "stringmethods"],
  ["str-replace-string", "return 'a-b-c'.replace('-', '+');", "stringmethods"],
  ["tostring-object-method", "var o = { toString: function () { return 'X'; } }; return String(o);", "stringmethods"],
  ["tostring-valueof-only", "var o = { valueOf: function () { return 7; } }; return String(o);", "stringmethods"],
  ["tostring-array", "return String([1, 2]);", "stringmethods"],
  ["tostring-plain", "return String({});", "stringmethods"],

  // D-STATICS: a built-in static is a value, not just a call-site shape.
  ["static-typeof-math", "return typeof Math.floor;", "statics"],
  ["static-typeof-object", "return typeof Object.keys;", "statics"],
  ["static-hasown-math", "return Math.hasOwnProperty('floor');", "statics"],
  ["static-hasown-object", "return Object.hasOwnProperty('keys');", "statics"],
  ["static-identity", "return Object.keys === Object.keys;", "statics"],
  ["static-desc-math", "var d = Object.getOwnPropertyDescriptor(Math, 'floor'); return (typeof d.value) + ':' + d.writable + ':' + d.enumerable + ':' + d.configurable;", "statics"],
  ["static-desc-object", "var d = Object.getOwnPropertyDescriptor(Object, 'keys'); return (typeof d.value) + ':' + d.enumerable + ':' + d.configurable;", "statics"],
  ["static-desc-value-identity", "return Object.getOwnPropertyDescriptor(Object, 'keys').value === Object.keys;", "statics"],
  ["static-not-enumerable", "var n = 0; for (var k in Math) { n++; } return n;", "statics"],
  ["static-capture-math", "var f = Math.floor; return f(2.7);", "statics"],
  ["static-capture-keys", "var f = Object.keys; return f({ a: 1, b: 2 }).join(',');", "statics"],
  ["static-capture-isarray", "var f = Array.isArray; return f([]) + ':' + f({});", "statics"],
  ["static-capture-getproto", "var f = Object.getPrototypeOf; function F() {} return f(new F()) === F.prototype;", "statics"],
  ["static-capture-argcheck", "try { var f = Object.keys; f(null); return 'no-throw'; } catch (e) { return e.name; }", "statics"],
  ["static-as-callback", "return [1.7, 2.2].map(Math.floor).join(',');", "statics"],
  // Math rounding is toward negative infinity, not toward zero.
  ["math-floor-negative", "return Math.floor(-1.5);", "statics"],
  ["math-ceil-negative", "return Math.ceil(-1.5);", "statics"],
  ["math-round-negative", "return Math.round(-1.5);", "statics"],
  ["math-round-half", "return Math.round(0.5);", "statics"],
  ["math-trunc-negative", "return Math.trunc(-1.9);", "statics"],
  ["math-max-nan", "return String(Math.max(1, NaN));", "statics"],
  ["math-min-empty", "return String(Math.min());", "statics"],
  ["math-max-empty", "return String(Math.max());", "statics"],
  ["math-abs-coerces", "return Math.abs('-3');", "statics"],
  ["math-floor-large", "return Math.floor(1e20);", "statics"],

  // D-STRNUM: ToNumber on a string follows the StringNumericLiteral grammar.
  ["strnum-hex", "return Number('0x1A');", "numbers"],
  ["strnum-hex-unary", "return +('0xff');", "numbers"],
  ["strnum-binary", "return Number('0b101');", "numbers"],
  ["strnum-octal", "return Number('0o17');", "numbers"],
  ["strnum-trailing-junk", "return String(Number('12x'));", "numbers"],
  ["strnum-leading-junk", "return String(Number('x12'));", "numbers"],
  ["strnum-empty", "return Number('');", "numbers"],
  ["strnum-whitespace", "return Number('  12  ');", "numbers"],
  ["strnum-infinity", "return String(Number('Infinity'));", "numbers"],
  ["strnum-neg-infinity", "return String(Number('-Infinity'));", "numbers"],
  ["strnum-exponent", "return Number('1e3');", "numbers"],
  ["strnum-bad-exponent", "return String(Number('1e'));", "numbers"],
  ["strnum-two-dots", "return String(Number('1.2.3'));", "numbers"],
  ["strnum-signed-hex", "return String(Number('-0x10'));", "numbers"],
  ["strnum-object", "var o = { valueOf: function () { return '1'; }, toString: function () { return 0; } }; return Number(o);", "numbers"],
  ["isfinite-infinity", "return isFinite(Number.POSITIVE_INFINITY);", "numbers"],
  ["isfinite-nan", "return isFinite(NaN);", "numbers"],
  ["isfinite-ok", "return isFinite(1);", "numbers"],
  // D-NUMFMT
  ["numfmt-tofixed", "return (1.25).toFixed(1);", "numbers"],
  ["numfmt-tofixed-negative", "return (-1.25).toFixed(1);", "numbers"],
  ["numfmt-tofixed-zero", "return (5).toFixed(0);", "numbers"],
  ["numfmt-tofixed-nan-arg", "return (1).toFixed(NaN);", "numbers"],
  ["numfmt-tofixed-nan-recv", "return (NaN).toFixed(2);", "numbers"],
  ["numfmt-tofixed-frac-arg", "return (1).toFixed(-0.1);", "numbers"],
  ["numfmt-tofixed-range", "try { (1).toFixed(101); return 'no-throw'; } catch (e) { return e.name; }", "numbers"],
  ["numfmt-tofixed-pad", "return (1).toFixed(3);", "numbers"],
  ["numfmt-toexponential", "return (77.1234).toExponential(2);", "numbers"],
  ["numfmt-toexponential-neg", "return (-77.1234).toExponential(2);", "numbers"],
  ["numfmt-toexponential-small", "return (0.0001).toExponential(2);", "numbers"],
  ["numfmt-toprecision", "return (123.456).toPrecision(4);", "numbers"],
  ["numfmt-toprecision-exp", "return (123.456).toPrecision(2);", "numbers"],
  ["numfmt-toprecision-range", "try { (1).toPrecision(0); return 'no-throw'; } catch (e) { return e.name; }", "numbers"],
  // Built-in constructors are functions; their methods have a stable identity.
  ["ctor-instanceof-function", "return Number instanceof Function;", "numbers"],
  ["ctor-fnproto-isproto", "return Function.prototype.isPrototypeOf(Number);", "numbers"],
  ["ctor-length", "return Number.length;", "numbers"],
  ["ctor-hasown-length", "return Number.hasOwnProperty('length');", "numbers"],
  ["method-identity-number", "return (new Number()).toString === Number.prototype.toString;", "numbers"],
  ["method-identity-array", "return [].slice === Array.prototype.slice;", "numbers"],
  ["method-identity-string", "return 'a'.charAt === String.prototype.charAt;", "numbers"],
  ["method-arity", "return Number.prototype.toFixed.length;", "numbers"],
  ["proto-chain-to-object", "return Object.prototype.isPrototypeOf(Number.prototype);", "numbers"],
  // Deleting a built-in prototype method falls through to Object.prototype.
  // The probes share one engine, so this one puts the method back.
  ["proto-delete-falls-back", "var saved = Number.prototype.toString; delete Number.prototype.toString; var r = (new Number()).toString(); Number.prototype.toString = saved; return r;", "numbers"],
  // D-TOOBJECT: Object(x) boxes a primitive; new Object() makes a usable object.
  ["toobject-new-usable", "var o = new Object(); o.a = 1; return o.a;", "numbers"],
  ["toobject-boxes-number", "return typeof Object(5);", "numbers"],
  ["toobject-boxes-brand", "return Object.prototype.toString.call(Object(5));", "numbers"],
  ["toobject-passthrough", "var a = { k: 1 }; return Object(a) === a;", "numbers"],
  ["toobject-null", "return typeof Object(null);", "numbers"],
  ["toobject-boxed-valueof", "return Object(5).valueOf();", "numbers"],
  ["toprim-both-objects", "try { var o = { valueOf: function () { return {}; }, toString: function () { return {}; } }; Number(o); return 'no-throw'; } catch (e) { return e.name; }", "numbers"],
  ["toprim-string-hint-default", "var o = { valueOf: function () { return 7; } }; return String(o);", "numbers"],

  // D-ARGUMENTS
  ["args-length", "function f() { return arguments.length; } return f(1, 2, 3);", "latest"],
  ["args-index", "function f() { return arguments[1]; } return f(1, 2, 3);", "latest"],
  ["args-empty", "function f() { return arguments.length; } return f();", "latest"],
  ["args-brand", "function f() { return Object.prototype.toString.call(arguments); } return f();", "latest"],
  ["args-not-array", "function f() { return Array.isArray(arguments); } return f();", "latest"],
  ["args-generic-slice", "function f() { return Array.prototype.slice.call(arguments, 1).join(','); } return f(1, 2, 3);", "latest"],
  // Errors stringify as "Name: message".
  ["err-tostring", "return String(new TypeError('test'));", "latest"],
  ["err-tostring-empty", "return String(new Error());", "latest"],
  ["err-borrowed-trim", "return String.prototype.trim.call(new Error('test'));", "latest"],
  ["err-call-without-new", "var e = Error('x'); return e.name + ':' + e.message;", "latest"],
  // The global object carries its value and function properties.
  ["global-nan", "return typeof this.NaN;", "latest"],
  ["global-parseint", "return typeof this.parseInt;", "latest"],
  ["global-object-ctor", "return this.Object === Object;", "latest"],
  // instanceof walks the prototype chain by identity.
  ["instof-proto-chain", "function F() {} var o = Object.create(F.prototype); return o instanceof F;", "latest"],
  ["instof-bad-prototype", "try { function F() {} F.prototype = undefined; ({}) instanceof F; return 'no-throw'; } catch (e) { return e.name; }", "latest"],
  ["instof-non-callable", "try { 1 instanceof Math; return 'no-throw'; } catch (e) { return e.name; }", "latest"],
  ["instof-error-ctor", "return new TypeError() instanceof Error;", "latest"],
  // Aliased constructors and borrowed methods on any receiver.
  ["alias-ctor", "var C = String.prototype.constructor; return String(new C('choosing one'));", "latest"],
  ["borrow-onto-function", "function f() {} Function.prototype.slice = String.prototype.slice; return typeof f.slice(0, 4);", "latest"],
  // NaN is falsy; the remainder keeps the dividend's sign.
  ["nan-falsy", "return !NaN;", "latest"],
  ["nan-and", "return String(NaN && 1);", "latest"],
  ["neg-zero-remainder", "return 1 / (-1 % -1);", "latest"],
  ["float-remainder", "return 5.5 % 2;", "latest"],
  ["div-by-zero-compound", "var x = 1; x /= 0; return String(x);", "latest"],
  ["plus-equals-boxed", "var x = new String('1'); x += 1; return x;", "latest"],
  // Math functions built from series.
  ["math-exp-zero", "return Math.exp(0);", "latest"],
  ["math-log-one", "return Math.log(1);", "latest"],
  ["math-log-zero", "return String(Math.log(0));", "latest"],
  ["math-atan-typeof", "return typeof Math.atan;", "latest"],
  // Array elisions keep their positions.
  ["elision-length", "return [4, 5, , , ,].length;", "latest"],
  ["elision-value", "return String([, 1][0]);", "latest"],

  ["idxdesc-array-value", "return Object.getOwnPropertyDescriptor([7, 8], '1').value;", "validation"],
  ["idxdesc-array-enumerable", "return Object.getOwnPropertyDescriptor([7, 8], '0').enumerable;", "validation"],
  ["idxdesc-array-length", "return Object.getOwnPropertyDescriptor([7, 8], 'length').value;", "validation"],
  ["idxdesc-array-length-not-enum", "return Object.getOwnPropertyDescriptor([7, 8], 'length').enumerable;", "validation"],
  ["idxdesc-array-oob", "return Object.getOwnPropertyDescriptor([7], '5') === undefined;", "validation"],
  ["idxdesc-string-value", "return Object.getOwnPropertyDescriptor('abc', '1').value;", "validation"],
  ["idxdesc-string-not-writable", "return Object.getOwnPropertyDescriptor('abc', '0').writable;", "validation"],
  ["idxdesc-string-length", "return Object.getOwnPropertyDescriptor('abc', 'length').value;", "validation"],

  ["redef-nonconf-to-conf", "var o = {}; Object.defineProperty(o, 'p', { value: 1 }); try { Object.defineProperty(o, 'p', { configurable: true }); } catch (e) { return e.name; } return 'no-throw';", "validation"],
  ["redef-nonconf-enum-flip", "var o = {}; Object.defineProperty(o, 'p', { value: 1 }); try { Object.defineProperty(o, 'p', { enumerable: true }); } catch (e) { return e.name; } return 'no-throw';", "validation"],
  ["redef-nonwritable-to-writable", "var o = {}; Object.defineProperty(o, 'p', { value: 1 }); try { Object.defineProperty(o, 'p', { writable: true }); } catch (e) { return e.name; } return 'no-throw';", "validation"],
  ["redef-nonwritable-value", "var o = {}; Object.defineProperty(o, 'p', { value: 1 }); try { Object.defineProperty(o, 'p', { value: 2 }); } catch (e) { return e.name; } return 'no-throw';", "validation"],
  ["redef-nonextensible-add", "var o = {}; Object.preventExtensions(o); try { Object.defineProperty(o, 'q', { value: 1 }); } catch (e) { return e.name; } return 'no-throw';", "validation"],
  ["redef-same-value-ok", "var o = {}; Object.defineProperty(o, 'p', { value: 1 }); try { Object.defineProperty(o, 'p', { value: 1 }); } catch (e) { return e.name; } return 'no-throw';", "validation"],
  ["redef-configurable-ok", "var o = {}; Object.defineProperty(o, 'p', { value: 1, configurable: true }); try { Object.defineProperty(o, 'p', { value: 2 }); } catch (e) { return e.name; } return 'no-throw';", "validation"],
  ["redef-fresh-define-ok", "var o = {}; try { Object.defineProperty(o, 'p', { value: 1 }); } catch (e) { return e.name; } return 'no-throw';", "validation"],

  ["desc-value-and-get", "try { Object.defineProperty({}, 'p', { value: 1, get: function () {} }); } catch (e) { return e.name; } return 'no-throw';", "validation"],
  ["desc-writable-and-set", "try { Object.defineProperty({}, 'p', { writable: true, set: function () {} }); } catch (e) { return e.name; } return 'no-throw';", "validation"],
  ["desc-get-not-function", "try { Object.defineProperty({}, 'p', { get: 5 }); } catch (e) { return e.name; } return 'no-throw';", "validation"],
  ["desc-valid-data-ok", "try { Object.defineProperty({}, 'p', { value: 1, writable: true }); } catch (e) { return e.name; } return 'no-throw';", "validation"],
  ["desc-valid-accessor-ok", "try { Object.defineProperty({}, 'p', { get: function () { return 1; } }); } catch (e) { return e.name; } return 'no-throw';", "validation"],

  ["ctor-array-call-length", "return Array(2).length;", "globals"],
  ["ctor-array-call-items", "return Array(1, 2).length;", "globals"],
  ["ctor-object-call-empty", "return typeof Object();", "globals"],
  ["ctor-function-body", "var f = new Function('return 1;'); return f();", "globals"],
  ["ctor-function-params", "var f = new Function('a', 'b', 'return a+b;'); return f(2, 3);", "globals"],
  ["ctor-function-no-new", "var f = Function('return 7;'); return f();", "globals"],
  ["ctor-function-typeof", "return typeof new Function('return 1;');", "globals"],
  ["ctor-new-fn-expression", "var x = new function f1() { this.v = 1; }; return x.v;", "globals"],

  ["glob-typeof-math", "return typeof Math;", "globals"],
  ["glob-typeof-array", "return typeof Array;", "globals"],
  ["glob-typeof-function", "return typeof Function;", "globals"],
  ["glob-math-writable", "Math.value = 'Math'; return Math.value;", "globals"],
  ["glob-math-as-descriptor", "var o = {}; Math.value = 'Math'; Object.defineProperty(o, 'p', Math); return o.p;", "globals"],
  ["glob-math-identity", "return Math === Math;", "globals"],
  ["glob-array-prototype", "return typeof Array.prototype;", "globals"],
  ["glob-math-floor-works", "return Math.floor(2.7);", "globals"],
  ["glob-json-works", "return JSON.stringify({ a: 1 });", "globals"],
  ["stat-fromcharcode", "return String.fromCharCode(65);", "globals"],
  ["stat-fromcharcode-multi", "return String.fromCharCode(72, 105);", "globals"],
  ["stat-number-parsefloat", "return Number.parseFloat('1.5');", "globals"],
  ["stat-array-of", "return Array.of(1, 2).length;", "globals"],
  ["stat-array-from-array", "return Array.from([1, 2]).length;", "globals"],
  ["stat-array-from-string", "return Array.from('abc').length;", "globals"],
  ["stat-object-keys-string", "return Object.keys('abc').length;", "globals"],
  ["stat-object-keys-number", "return Object.keys(5).length;", "globals"],
  ["stat-getproto-string", "return typeof Object.getPrototypeOf('a');", "globals"],

  ["argchk-defineprop-primitive", "try { Object.defineProperty(5, 'a', { value: 1 }); } catch (e) { return e.name; } return 'no-throw';", "attrs"],
  ["argchk-defineprop-undefined", "try { Object.defineProperty(undefined, 'a', { value: 1 }); } catch (e) { return e.name; } return 'no-throw';", "attrs"],
  ["argchk-defineprop-bad-desc", "try { Object.defineProperty({}, 'a', 42); } catch (e) { return e.name; } return 'no-throw';", "attrs"],
  ["argchk-keys-null", "try { Object.keys(null); } catch (e) { return e.name; } return 'no-throw';", "attrs"],
  ["argchk-keys-undefined", "try { Object.keys(undefined); } catch (e) { return e.name; } return 'no-throw';", "attrs"],
  ["argchk-getproto-null", "try { Object.getPrototypeOf(null); } catch (e) { return e.name; } return 'no-throw';", "attrs"],
  ["argchk-getownpropdesc-null", "try { Object.getOwnPropertyDescriptor(null, 'a'); } catch (e) { return e.name; } return 'no-throw';", "attrs"],
  ["argchk-create-primitive", "try { Object.create(5); } catch (e) { return e.name; } return 'no-throw';", "attrs"],
  ["argchk-freeze-primitive-ok", "try { Object.freeze(5); } catch (e) { return e.name; } return 'no-throw';", "attrs"],
  ["argchk-create-null-legal", "var o = Object.create(null); o.a = 1; return o.a;", "attrs"],
  ["argchk-keys-array-ok", "return Object.keys([1, 2]).length;", "attrs"],
  ["attr-create-descriptors", "var o = Object.create(null, { p: { value: 7, enumerable: true } }); return o.p;", "attrs"],

  ["attr-defineprop-not-enumerable", "var o = {}; Object.defineProperty(o, 'a', { value: 1 }); return Object.getOwnPropertyDescriptor(o, 'a').enumerable;", "attrs"],
  ["attr-defineprop-not-writable", "var o = {}; Object.defineProperty(o, 'a', { value: 1 }); return Object.getOwnPropertyDescriptor(o, 'a').writable;", "attrs"],
  ["attr-defineprop-not-configurable", "var o = {}; Object.defineProperty(o, 'a', { value: 1 }); return Object.getOwnPropertyDescriptor(o, 'a').configurable;", "attrs"],
  ["attr-assignment-enumerable", "var o = {}; o.a = 1; return Object.getOwnPropertyDescriptor(o, 'a').enumerable;", "attrs"],
  ["attr-explicit-true-honoured", "var o = {}; Object.defineProperty(o, 'a', { value: 1, enumerable: true }); return Object.getOwnPropertyDescriptor(o, 'a').enumerable;", "attrs"],
  ["attr-keys-skips-non-enumerable", "var o = { b: 2 }; Object.defineProperty(o, 'a', { value: 1 }); return Object.keys(o).join(',');", "attrs"],
  ["attr-getownpropertynames-all", "var o = { b: 2 }; Object.defineProperty(o, 'a', { value: 1 }); return Object.getOwnPropertyNames(o).length;", "attrs"],
  ["attr-non-writable-rejects", "var o = {}; Object.defineProperty(o, 'a', { value: 1 }); o.a = 99; return o.a;", "attrs"],
  ["attr-freeze-blocks-write", "var o = { a: 1 }; Object.freeze(o); o.a = 2; return o.a;", "attrs"],
  ["attr-freeze-blocks-add", "var o = { a: 1 }; Object.freeze(o); o.b = 2; return o.b === undefined;", "attrs"],
  ["attr-freeze-blocks-delete", "var o = { a: 1 }; Object.freeze(o); delete o.a; return o.a;", "attrs"],
  ["attr-is-frozen-true", "var o = { a: 1 }; Object.freeze(o); return Object.isFrozen(o);", "attrs"],
  ["attr-is-frozen-false", "var o = { a: 1 }; return Object.isFrozen(o);", "attrs"],
  ["attr-seal-blocks-add", "var o = { a: 1 }; Object.seal(o); o.b = 2; return o.b === undefined;", "attrs"],
  ["attr-seal-allows-write", "var o = { a: 1 }; Object.seal(o); o.a = 5; return o.a;", "attrs"],
  ["attr-is-sealed", "var o = {}; Object.seal(o); return Object.isSealed(o);", "attrs"],
  ["attr-prevent-extensions", "var o = {}; Object.preventExtensions(o); o.a = 1; return o.a === undefined;", "attrs"],
  ["attr-is-extensible-true", "var o = {}; return Object.isExtensible(o);", "attrs"],
  ["attr-is-extensible-false", "var o = {}; Object.preventExtensions(o); return Object.isExtensible(o);", "attrs"],

  ["coerce-charat-number-recv", "return String.prototype.charAt.call(512, 1);", "protoreg"],
  ["coerce-indexof-number-recv", "return String.prototype.indexOf.call(512, '1');", "protoreg"],
  ["coerce-slice-bool-recv", "return String.prototype.slice.call(true, 1);", "protoreg"],
  ["coerce-toupper-number-recv", "return String.prototype.toUpperCase.call(12);", "protoreg"],

  ["proto-array-slice-call", "return Array.prototype.slice.call([1, 2, 3], 1).join(',');", "protoreg"],
  ["proto-array-join-call", "return Array.prototype.join.call([1, 2, 3], '-');", "protoreg"],
  ["proto-array-map-call", "return Array.prototype.map.call([1, 2], function (x) { return x * 2; }).join(',');", "protoreg"],
  ["proto-string-slice-call", "return String.prototype.slice.call('hello', 1, 3);", "protoreg"],
  ["proto-string-trim-call", "return String.prototype.trim.call('  x  ');", "protoreg"],
  ["proto-array-slice-typeof", "return typeof Array.prototype.slice;", "protoreg"],
  ["proto-function-call-typeof", "return typeof Function.prototype.call;", "protoreg"],
  ["proto-method-identity", "return Array.prototype.slice === Array.prototype.slice;", "protoreg"],
  ["proto-indexof-call", "return Array.prototype.indexOf.call([7, 8, 9], 8);", "protoreg"],
  ["reg-map-get", "var m = new Map(); m.set('a', 1); return m.get('a');", "registry"],
  ["reg-map-delete", "var m = new Map(); m.set('a', 1); m.delete('a'); return m.has('a');", "registry"],
  ["reg-set-dedup", "var s = new Set(); s.add(1); s.add(1); return s.size;", "registry"],
  ["reg-set-foreach", "var n = 0; var s = new Set([1, 2, 3]); s.forEach(function (v) { n = n + v; }); return n;", "registry"],
  ["reg-map-foreach", "var n = 0; var m = new Map([['a', 1], ['b', 2]]); m.forEach(function (v) { n = n + v; }); return n;", "registry"],

  ["reg-arr-first-class-typeof", "return typeof [1, 2].slice;", "registry"],
  ["reg-arr-slice-call", "return [1, 2, 3].slice.call([9, 8, 7], 1).join(',');", "registry"],
  ["reg-arr-join-call", "return [].join.call([1, 2, 3], '-');", "registry"],
  ["reg-arr-map-call", "return [].map.call([1, 2], function (x) { return x * 3; }).join(',');", "registry"],
  ["reg-arr-indexof-apply", "return [].indexOf.apply([5, 6, 7], [6]);", "registry"],
  ["reg-arr-bind-method", "var f = [1, 2, 3].join.bind([4, 5]); return f('-');", "registry"],
  ["reg-arr-unbound-throws", "var f = [1, 2].slice; try { f(0); } catch (e) { return e.name; } return 'no-throw';", "registry"],
  ["reg-arr-map", "return [1, 2, 3].map(function (x) { return x * 2; }).join(',');", "registry"],
  ["reg-arr-reduce", "return [1, 2, 3].reduce(function (a, b) { return a + b; }, 0);", "registry"],
  ["reg-arr-sort-cmp", "return [3, 1, 2].sort(function (a, b) { return a - b; }).join(',');", "registry"],
  ["reg-array-ctor-length", "return new Array(3).fill(7).join(',');", "registry"],
  ["reg-array-ctor-items", "return new Array(1, 2).join(',');", "registry"],

  ["reg-str-first-class-typeof", "return typeof 'abc'.slice;", "registry"],
  ["reg-str-call-receiver", "return 'abc'.slice.call('xyz', 1);", "registry"],
  ["reg-str-apply-args", "return 'abc'.indexOf.apply('hello', ['ll']);", "registry"],
  ["reg-str-bind-builtin", "var f = 'abc'.toUpperCase.bind('hey'); return f();", "registry"],
  ["reg-str-unbound-throws", "var f = 'abc'.slice; try { f(1); } catch (e) { return e.name; } return 'no-throw';", "registry"],
  ["reg-str-indexof", "return 'hello'.indexOf('ll');", "registry"],
  ["reg-str-split-len", "return 'a,b,c'.split(',').length;", "registry"],
  ["reg-str-replaceall", "return 'aXbXc'.replaceAll('X', '-');", "registry"],
  ["reg-str-concat", "return 'a'.concat('b', 'c');", "registry"],
  ["reg-str-charcodeat", "return 'hello'.charCodeAt(0);", "registry"],

  ["reg-array-tostring", "return [1, 2].toString();", "registry"],
  ["reg-object-tostring", "return ({}).toString();", "registry"],
  ["reg-nested-array-tostring", "return [[1, 2], [3]].toString();", "registry"],
  ["reg-number-tostring", "return (5).toString();", "registry"],
  ["reg-string-charat", "return 'abc'.charAt(1);", "registry"],
  ["reg-array-charat-throws", "try { [1, 2].charAt(0); } catch (e) { return e.name; } return 'no-throw';", "registry"],
  ["reg-object-trim-throws", "try { ({}).trim(); } catch (e) { return e.name; } return 'no-throw';", "registry"],
  ["reg-array-tofixed-throws", "try { [1].toFixed(1); } catch (e) { return e.name; } return 'no-throw';", "registry"],
  ["reg-string-substring-swap", "return 'abcdef'.substring(4, 1);", "registry"],
  ["reg-string-padstart", "return 'x'.padStart(4, '-');", "registry"],
  ["reg-string-padend", "return 'x'.padEnd(4, '-');", "registry"],
  ["reg-builtin-as-value", "var f = function () { return this.v; }; var c = f.call; return typeof c;", "registry"],
  ["reg-builtin-unbound-throws", "var f = function () { return this.v; }; var c = f.call; try { c({ v: 4 }); } catch (e) { return e.name; } return 'no-throw';", "registry"],
  ["reg-builtin-explicit-receiver", "var f = function () { return this.v; }; return f.call.call(f, { v: 4 });", "registry"],
  ["reg-builtin-composed", "var f = function (a) { return a * 2; }; var g = f.bind(null, 5); return g();", "registry"],
  // A throw inside a returned expression must reach the enclosing catch.
  ["throw-in-return-catchable", "try { return (function () { throw new TypeError('x'); })(); } catch (e) { return e.name; }", "registry"],

  ["fnproto-call-this", "var f = function () { return this.v; }; return f.call({ v: 5 });", "fnproto"],
  ["fnproto-call-args", "var f = function (a, b) { return a + b; }; return f.call(null, 2, 3);", "fnproto"],
  ["fnproto-apply-array", "var f = function (a, b) { return a + b; }; return f.apply(null, [4, 6]);", "fnproto"],
  ["fnproto-apply-this", "var f = function () { return this.v; }; return f.apply({ v: 9 });", "fnproto"],
  ["fnproto-bind-this", "var f = function () { return this.v; }; var g = f.bind({ v: 3 }); return g();", "fnproto"],
  ["fnproto-bind-partial", "var f = function (a, b) { return a + b; }; var g = f.bind(null, 10); return g(5);", "fnproto"],
  ["fnproto-bind-all-args", "var f = function (a, b) { return a * b; }; var g = f.bind(null, 3, 4); return g();", "fnproto"],
  ["fnproto-bind-this-and-arg", "var o = { v: 7 }; var f = function (a) { return this.v + a; }; var g = f.bind(o, 1); return g();", "fnproto"],
  ["fnproto-call-on-method", "var o = { v: 2, m: function () { return this.v; } }; return o.m.call({ v: 99 });", "fnproto"],
  ["fnproto-bind-typeof", "var f = function () {}; return typeof f.bind(null);", "fnproto"],

  ["eval-expr", "return eval('1 + 2');", "eval"],
  ["eval-sees-scope", "var a = 7; return eval('a + 1');", "eval"],
  ["eval-declares-var", "eval('var q = 5;'); return q;", "eval"],
  ["eval-declares-fn", "eval('function g(){ return 4; }'); return g();", "eval"],
  ["eval-non-string", "return eval(42);", "eval"],
  ["eval-syntax-error", "try { eval('var ='); } catch (e) { return e.name; } return 'no-throw';", "eval"],
  ["eval-throw-propagates", "try { eval('throw new TypeError(1);'); } catch (e) { return e.name; } return 'no-throw';", "eval"],
  ["eval-completion-value", "return eval('1; 2; 3');", "eval"],
  ["eval-typeof", "return typeof eval;", "eval"],

  // Lexer: an escaped quote directly inside the opening/closing quote of a
  // string literal was DROPPED. The cause was not the lexer at all: the
  // evaluator unquoted the token value a second time, so real characters went
  // with the delimiters that were no longer there.
  ["lex-escaped-quote-edges", "var s = '\\'a\\' + \\'b\\''; return s;", "literals"],
  ["lex-escaped-quote-single", "var s = '\\'hi\\''; return s;", "literals"],

  ["ieee-div-zero-pos", "return 1 / 0;", "ieee"],
  ["ieee-div-zero-neg", "return -1 / 0;", "ieee"],
  ["ieee-div-neg-zero", "var z = -0; return 1 / z;", "ieee"],
  ["ieee-zero-over-zero", "var r = 0 / 0; return r !== r;", "ieee"],
  ["ieee-mod-zero", "var r = 5 % 0; return r !== r;", "ieee"],
  ["ieee-object-is-zeros", "return Object.is(0, -0);", "ieee"],
  ["ieee-object-is-nan", "return Object.is(0 / 0, 0 / 0);", "ieee"],
  ["ieee-infinity-global", "return Infinity;", "ieee"],
  ["ieee-nan-global", "return NaN !== NaN;", "ieee"],
  ["ieee-strict-eq-zeros", "return 0 === -0;", "ieee"],
  ["ieee-json-infinity", "return JSON.stringify(Infinity);", "ieee"],
  ["ieee-normal-div", "return 10 / 4;", "ieee"],
  ["ieee-normal-mod", "return 10 % 4;", "ieee"],
  ["dstr-param-rest-pattern", "var f = function ([...[x, y]]) { return x + y; }; return f([3, 4]);", "destructuring"],
  ["dstr-arrow-rest-pattern", "var f = ([...[x, y]]) => x + y; return f([3, 4]);", "destructuring"],
  ["dstr-param-obj-default", "var f = function ({ a = 5 } = {}) { return a; }; return f();", "destructuring"],
  ["dstr-param-obj-nested", "var f = function ({ a: { b } }) { return b; }; return f({ a: { b: 8 } });", "destructuring"],
  ["dstr-param-array-nested", "var f = function ([[a]]) { return a; }; return f([[5]]);", "destructuring"],
  ["dstr-param-pattern-dflt", "var f = function ([_, x] = []) { return x; }; return f();", "destructuring"],
  ["class-nested-decl", "class N { m() { return 3; } } return new N().m();", "classes"],
  ["class-expr-nested", "var C = class { m() { return 3; } }; return new C().m();", "classes"],
  ["class-static-call", "class S { static s() { return 8; } } return S.s();", "classes"],
  ["class-accessor-get", "class G { get v() { return 4; } } return new G().v;", "classes"],
  ["class-accessor-set", "class T { set v(x) { this._v = x; } } var t = new T(); t.v = 6; return t._v;", "classes"],
  ["class-extends-super", "class P { constructor() { this.x = 1; } } class Q extends P { constructor() { super(); this.y = 2; } } var q = new Q(); return q.x + q.y;", "classes"],
  ["class-extends-field", "class P2 { constructor() { this.x = 10; } } class Q2 extends P2 { constructor() { super(); } } return new Q2().x;", "classes"],
  ["class-extends-method", "class P3 { m() { return 7; } } class Q3 extends P3 {} return new Q3().m();", "classes"],
  ["objproto-hasown-true", "var o = { a: 1 }; return o.hasOwnProperty('a');", "objproto"],
  ["objproto-hasown-false", "var o = { a: 1 }; return o.hasOwnProperty('b');", "objproto"],
  ["objproto-hasown-not-inherited", "var F = function () {}; F.prototype.k = 1; var o = new F(); return o.hasOwnProperty('k');", "objproto"],
  ["objproto-hasown-own-wins", "var F = function () { this.k = 2; }; F.prototype.k = 1; var o = new F(); return o.hasOwnProperty('k');", "objproto"],
  ["objproto-hasown-accessor", "var o = { get a() { return 1; } }; return o.hasOwnProperty('a');", "objproto"],
  ["objproto-hasown-array-index", "var a = [1, 2]; return a.hasOwnProperty('1');", "objproto"],
  ["objproto-hasown-array-oob", "var a = [1, 2]; return a.hasOwnProperty('9');", "objproto"],
  ["objproto-is-prototype-of", "var F = function () {}; var o = new F(); return F.prototype.isPrototypeOf(o);", "objproto"],
  ["objproto-is-prototype-of-no", "var F = function () {}; var G = function () {}; var o = new F(); return G.prototype.isPrototypeOf(o);", "objproto"],
  ["builtin-array-prototype", "return typeof Array.prototype;", "objproto"],
  ["builtin-proto-stable", "return Array.prototype === Array.prototype;", "objproto"],
  ["builtin-proto-distinct", "return Array.prototype === Object.prototype;", "objproto"],
  ["builtin-number-max-safe", "return Number.MAX_SAFE_INTEGER;", "objproto"],
  ["builtin-number-neg-inf", "return Number.NEGATIVE_INFINITY;", "objproto"],
  ["throw-missing-method", "try { var o = {}; o.nope(); } catch (e) { return e.name; } return 'no-throw';", "objproto"],
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

  // --- Date -----------------------------------------------------------------
  // A Date is arithmetic on one time value. Local time is UTC in this realm, so
  // each accessor and its UTC twin agree -- these probes use the UTC forms,
  // which are time-zone independent and so mean the same in Node.
  ["date-value", "return new Date(6).valueOf();", "date"],
  ["date-utc-year", "return new Date(951782400000).getUTCFullYear();", "date"],
  ["date-utc-month", "return new Date(951782400000).getUTCMonth();", "date"],
  ["date-utc-date", "return new Date(951782400000).getUTCDate();", "date"],
  ["date-utc-day", "return new Date(951782400000).getUTCDay();", "date"],
  ["date-utc-time-parts", "var d = new Date(1234567890123); return d.getUTCHours() + ':' + d.getUTCMinutes() + ':' + d.getUTCSeconds() + '.' + d.getUTCMilliseconds();", "date"],
  ["date-before-epoch", "return new Date(-86400000).toISOString();", "date"],
  ["date-far-past", "return new Date(-1e12).getUTCFullYear();", "date"],
  ["date-leap-day", "return new Date(Date.UTC(2016, 1, 29)).getUTCDate();", "date"],
  ["date-century-not-leap", "return new Date(Date.UTC(1900, 1, 28)).getUTCMonth();", "date"],
  ["date-month-rolls-year", "return new Date(Date.UTC(2000, 12, 1)).getUTCFullYear();", "date"],
  ["date-two-digit-year", "return new Date(Date.UTC(99, 0, 1)).getUTCFullYear();", "date"],
  ["date-iso-roundtrip", "return Date.parse(new Date(1234567890123).toISOString());", "date"],
  ["date-parse-date-only", "return Date.parse('2000-01-01');", "date"],
  ["date-parse-offset", "return Date.parse('2000-01-01T12:34:56.789+02:00');", "date"],
  ["date-parse-garbage", "return String(Date.parse('not a date'));", "date"],
  ["date-parse-bad-month", "return String(Date.parse('2000-13-01'));", "date"],
  ["date-utc-static", "return Date.UTC(2000, 0, 1);", "date"],
  ["date-range-limit", "return String(new Date(8640000000000001).getTime());", "date"],
  ["date-invalid-string", "return String(new Date('nope'));", "date"],
  ["date-tostring-invalid-iso", "try { new Date(NaN).toISOString(); return 'no-throw'; } catch (e) { return e.name; }", "date"],
  ["date-tojson-invalid", "return String(new Date(NaN).toJSON());", "date"],
  ["date-settime", "var d = new Date(0); d.setTime(5000); return d.getTime();", "date"],
  ["date-brand", "return Object.prototype.toString.call(new Date(0));", "date"],
  ["date-typeof-parse", "return typeof Date.parse;", "date"],
  ["date-typeof-now", "return typeof Date.now;", "date"],
  ["performance-typeof", "return typeof performance;", "date"],
  ["performance-typeof-now", "return typeof performance.now;", "date"],
  ["performance-now-typeof", "return typeof performance.now();", "date"],
  ["performance-now-length", "return performance.now.length;", "date"],
  ["date-call-no-new", "return typeof Date();", "date"],
  ["date-plus-is-string", "return typeof (new Date(0) + '');", "date"],
  ["date-unary-plus-is-number", "return +new Date(6);", "date"],
  ["date-borrowed-is-typeerror", "try { Date.prototype.getTime.call({}); return 'no-throw'; } catch (e) { return e.name; }", "date"],
  ["date-set-ms", "var d = new Date(0); d.setUTCMilliseconds(500); return d.getTime();", "date"],
  ["date-set-seconds-rolls", "var d = new Date(0); d.setUTCSeconds(70); return d.getTime();", "date"],
  ["date-set-hours-tail", "var d = new Date(0); d.setUTCHours(25, 1, 2, 3); return d.getTime();", "date"],
  ["date-set-date-rolls-month", "var d = new Date(0); d.setUTCDate(32); return d.toISOString();", "date"],
  ["date-set-fullyear-leap", "var d = new Date(0); d.setUTCFullYear(2020, 1, 29); return d.toISOString();", "date"],
  ["date-set-fullyear-revives", "var d = new Date(NaN); d.setUTCFullYear(2020); return d.toISOString();", "date"],
  ["date-set-month-stays-invalid", "var d = new Date(NaN); d.setUTCMonth(3); return String(d.getTime());", "date"],
  ["date-set-nan-poisons", "var d = new Date(0); return String(d.setUTCSeconds(NaN));", "date"],
  ["date-truncates-toward-zero", "return new Date(-6.5).valueOf();", "date"],
  ["date-negative-zero-clipped", "return 1 / new Date(-0).valueOf();", "date"],
  ["date-setter-arity", "return Date.prototype.setHours.length + ',' + Date.prototype.setUTCFullYear.length;", "date"],
  ["date-gmtstring-alias", "return typeof Date.prototype.toGMTString;", "date"],

  // --- regex backtracking ---------------------------------------------------
  // A quantified group's body must be able to give characters back so that what
  // follows the group can match. That needs the rest of the pattern to be
  // reachable from inside the group, which is what RegexCont carries.
  ["re-backtrack-into-group", "return 'aaaaaaaaaa,aaaaaaaaaaaaaaa'.replace(/^(a+)\\1*,\\1+$/, '$1');", "regexback"],
  ["re-backtrack-exec", "return String(/^(a+)\\1*,\\1+$/.exec('aaaaaaaaaa,aaaaaaaaaaaaaaa'));", "regexback"],
  ["re-backtrack-short", "return String('aaa,aaaaaa'.match(/^(a+),\\1+$/));", "regexback"],
  ["re-alt-inside-group", "return String(/(a|ab)(c|bcd)(d*)$/.exec('abcd'));", "regexback"],
  ["re-alt-first-wins-when-it-can", "return String(/(a|ab)(c|bcd)(d*)/.exec('abcd'));", "regexback"],
  ["re-nested-alt-groups", "return String(/((a)|(ab))((c)|(bc))/.exec('abc'));", "regexback"],
  ["re-capture-reset-per-repetition", "return String(/(z)((a+)?(b+)?(c))*/.exec('zaacbbbcac'));", "regexback"],
  ["re-backref-to-star-group", "return String(/(a*)b\\1+/.exec('baaaac'));", "regexback"],
  ["re-star-group-no-runaway", "return String(/^(a+)*$/.test('aaaa'));", "regexback"],
  ["re-nested-quant-fails-cleanly", "return String(/^(a+)+$/.test('aaaaaaaaab'));", "regexback"],
  ["re-lookahead-capture", "return String(/(?=(a+))a*b\\1/.exec('baaabac'));", "regexback"],
  ["re-optional-group-undefined", "return String(/(x)?y/.exec('y'));", "regexback"],
  ["re-backref-to-unmatched-group", "return String(/(x)?\\1y/.exec('y'));", "regexback"],
  ["re-alternation-group", "return String(/^(a|b)*c$/.exec('ababc'));", "regexback"],
  ["re-split-capturing", "return String('2011-10-10'.split(/(-)/));", "regexback"],

  // --- array length and holes -----------------------------------------------
  // Writing `length` resizes the array; a value that is not a uint32 is a
  // RangeError; deleting an element leaves a hole without shortening it.
  ["arrlen-truncate", "var x = [1, 2, 3]; x.length = 1; return x.toString();", "arraylen"],
  ["arrlen-truncate-empty", "var x = [1, 2, 3]; x.length = 0; return x.length;", "arraylen"],
  ["arrlen-grow", "var x = [1]; x.length = 3; return x.toString();", "arraylen"],
  ["arrlen-grow-reads-undefined", "var x = [1]; x.length = 3; return String(x[2]);", "arraylen"],
  ["arrlen-string-coerced", "var x = [1, 2, 3]; x.length = '2'; return x.toString();", "arraylen"],
  ["arrlen-negative-throws", "var x = []; try { x.length = -1; return 'no-throw'; } catch (e) { return e.name; }", "arraylen"],
  ["arrlen-fractional-throws", "var x = []; try { x.length = 1.5; return 'no-throw'; } catch (e) { return e.name; }", "arraylen"],
  ["arrlen-compound", "var x = [1, 2, 3]; x.length -= 1; return x.toString();", "arraylen"],
  ["arrlen-sparse-assign", "var x = []; x[3] = 1; return x.length + '|' + x.toString();", "arraylen"],
  ["arrlen-delete-leaves-hole", "var x = [1, 2, 3]; delete x[1]; return x.length + '|' + x.toString();", "arraylen"],
  ["arrlen-delete-out-of-range", "var x = [1]; return String(delete x[9]) + '|' + x.length;", "arraylen"],
  ["arrlen-join-after-truncate", "var x = [1, 2, 3]; x.length = 2; return x.join('-');", "arraylen"],
  // Which keys are ELEMENTS is decided by the key text, not by the operand's
  // type: only ToString(ToUint32(k)) === k reaches an element.
  ["arridx-string-key-is-element", "var x = []; x['0'] = 7; return String(x[0]) + '|' + x.length;", "arraylen"],
  ["arridx-leading-zero-is-property", "var x = []; x['00'] = 7; return String(x[0]) + '|' + x.length + '|' + x['00'];", "arraylen"],
  ["arridx-negative-is-property", "var x = []; x[-1] = 1; return x.length + '|' + String(x[-1]);", "arraylen"],
  ["arridx-boolean-key-is-property", "var x = []; x[true] = 1; return x.length + '|' + String(x[true]);", "arraylen"],
  ["arridx-fractional-is-property", "var x = []; x[1.5] = 1; return x.length + '|' + String(x[1.5]);", "arraylen"],
  ["arridx-max-uint32-is-property", "var x = []; x[4294967295] = 1; return x.length + '|' + String(x[4294967295]);", "arraylen"],
  ["arridx-far-index-readable", "var x = []; x[2147483648] = 1; return String(x[2147483648]);", "arraylen"],

  // --- array holes ----------------------------------------------------------
  // An ABSENT element reads as undefined but is not present: `in` says false and
  // the iteration methods skip it. This is what an undefined element cannot say.
  ["hole-in-elision", "return String(0 in [, 1]);", "holes"],
  ["hole-in-present", "return String(1 in [, 1]);", "holes"],
  ["hole-in-middle", "return String(1 in [0, , 2]);", "holes"],
  ["hole-delete-makes-absent", "var a = [1, 2, 3]; delete a[1]; return String(1 in a);", "holes"],
  ["hole-sparse-assign-absent", "var a = []; a[3] = 1; return String(0 in a) + ',' + a.length;", "holes"],
  ["hole-length-growth-absent", "var a = [1, 2, 3]; a.length = 5; return String(4 in a) + ',' + a.length;", "holes"],
  ["hole-hasownproperty-absent", "return String([, 1].hasOwnProperty(0));", "holes"],
  ["hole-hasownproperty-present", "return String([, 1].hasOwnProperty(1));", "holes"],
  ["hole-foreach-skips", "var n = 0; new Array(10).forEach(function () { n++; }); return n;", "holes"],
  ["hole-foreach-visits-explicit-undefined", "var n = 0; var a = new Array(10); a[1] = undefined; a.forEach(function () { n++; }); return n;", "holes"],
  ["hole-filter-skips", "var a = new Array(10); a[1] = undefined; return a.filter(function () { return false; }).length;", "holes"],
  ["hole-filter-counts-present", "return [, 1, , 2].filter(function () { return true; }).length;", "holes"],
  ["hole-map-preserves", "return String([1, , 3].map(function (x) { return x * 2; }));", "holes"],
  ["hole-map-hole-stays-absent", "return String(1 in [1, , 3].map(function (x) { return x * 2; }));", "holes"],
  ["hole-every-vacuous", "return String([, , ].every(function () { return false; }));", "holes"],
  ["hole-some-vacuous", "return String([, , ].some(function () { return true; }));", "holes"],
  ["hole-indexof-skips", "return String([1, , 3].indexOf(undefined));", "holes"],
  ["hole-reduce-skips", "return [1, , 3].reduce(function (a, b) { return a + b; }, 0);", "holes"],
  ["hole-reduce-seeds-first-present", "return [, 1, 2].reduce(function (a, b) { return a + b; });", "holes"],
  ["hole-object-keys-skips", "return String(Object.keys([1, , 3]));", "holes"],
  ["hole-forin-skips", "var s = ''; for (var k in [1, , 3]) s += k; return s;", "holes"],
  ["hole-length-counts", "return [, 1, , 2].length;", "holes"],
  ["hole-join-renders-empty", "return String([, 1, , 2]);", "holes"],
  ["hole-json-is-null", "return JSON.stringify([1, , 3]);", "holes"],

  // --- prototype of an exotic value -----------------------------------------
  // An array, a string, a function and a RegExp dispatch by KIND and carry no
  // prototype link of their own, but the language still says what they inherit.
  ["protoof-array", "return String(Object.getPrototypeOf([]) === Array.prototype);", "protoof"],
  ["protoof-array-isprototypeof", "return String(Array.prototype.isPrototypeOf([]));", "protoof"],
  ["protoof-array-via-object", "return String(Object.prototype.isPrototypeOf([]));", "protoof"],
  ["protoof-array-not-unrelated", "return String(Array.prototype.isPrototypeOf({}));", "protoof"],
  ["protoof-function", "return String(Object.getPrototypeOf(function () {}) === Function.prototype);", "protoof"],
  ["protoof-object-terminates", "return String(Object.getPrototypeOf(Object.prototype));", "protoof"],
  ["protoof-array-proto-chains-to-object", "return String(Object.getPrototypeOf(Array.prototype) === Object.prototype);", "protoof"],
  ["protoof-primitive-is-false", "return String(String.prototype.isPrototypeOf('a'));", "protoof"],
  ["protoof-user-instance", "function F() {} var o = new F(); return String(F.prototype.isPrototypeOf(o)) + ',' + String(Object.prototype.isPrototypeOf(o));", "protoof"],

  // --- guest overrides of built-in prototype methods -------------------------
  // A method the guest puts on a built-in prototype wins over the registry, on
  // the direct call path as well as through ToPrimitive. These probes RESTORE
  // what they replace: the suite shares one engine, so a destructive probe would
  // poison every probe after it.
  ["ovr-array-tostring-brands", "var saved = Array.prototype.toString; Array.prototype.toString = Object.prototype.toString; var r = [0, 1, 2].toString(); Array.prototype.toString = saved; return r;", "override"],
  ["ovr-array-join", "var saved = Array.prototype.join; Array.prototype.join = function () { return 'J'; }; var r = [1, 2].join(); Array.prototype.join = saved; return r;", "override"],
  ["ovr-string-charat", "var saved = String.prototype.charAt; String.prototype.charAt = function () { return 'X'; }; var r = 'abc'.charAt(0); String.prototype.charAt = saved; return r;", "override"],
  ["ovr-number-tofixed", "var saved = Number.prototype.toFixed; Number.prototype.toFixed = function () { return 'N'; }; var r = (1.5).toFixed(1); Number.prototype.toFixed = saved; return r;", "override"],
  ["ovr-restored-array-join", "return [1, 2].join('-');", "override"],
  ["ovr-restored-string-charat", "return 'abc'.charAt(1);", "override"],
  ["ovr-restored-array-tostring", "return [1, 2].toString();", "override"],

  // --- descriptors reached through accessors and prototypes -----------------
  // Reading a field OF a descriptor is a full [[Get]]: it runs an accessor and
  // it walks the prototype chain, and the nearest holder wins whichever kind it
  // is -- an OWN data property beats an INHERITED accessor.
  ["desc-value-via-getter", "var attr = {}; Object.defineProperty(attr, 'value', { get: function () { return 'v'; } }); var o = {}; Object.defineProperty(o, 'p', attr); return o.p;", "descriptors2"],
  ["desc-writable-via-getter", "var attr = {}; Object.defineProperty(attr, 'writable', { get: function () { return true; } }); var o = {}; Object.defineProperty(o, 'p', attr); o.p = 'w'; return o.p;", "descriptors2"],
  ["desc-inherited-field", "var proto = { value: 'inh' }; var F = function () {}; F.prototype = proto; var o = {}; Object.defineProperty(o, 'p', new F()); return o.p;", "descriptors2"],
  ["desc-own-shadows-inherited-accessor", "var proto = {}; Object.defineProperty(proto, 'value', { get: function () { return 'inh'; } }); var F = function () {}; F.prototype = proto; var c = new F(); Object.defineProperty(c, 'value', { value: 'own' }); var o = {}; Object.defineProperty(o, 'p', c); return o.p;", "descriptors2"],
  ["read-own-data-beats-inherited-accessor", "var p = {}; Object.defineProperty(p, 'v', { get: function () { return 'inh'; } }); var F = function () {}; F.prototype = p; var c = new F(); Object.defineProperty(c, 'v', { value: 'own' }); return c.v;", "descriptors2"],
  ["read-set-only-accessor-is-undefined", "var p = {}; Object.defineProperty(p, 'v', { get: function () { return 'inh'; } }); var F = function () {}; F.prototype = p; var c = new F(); Object.defineProperty(c, 'v', { set: function () {} }); return typeof c.v;", "descriptors2"],

  // Attributes the descriptor omits are KEPT on an existing property and
  // default to false on a new one; changing a property's kind drops the other
  // kind's state.
  ["desc-keeps-omitted-attributes", "var o = {}; Object.defineProperty(o, 'p', { value: 1, writable: true, enumerable: true, configurable: true }); Object.defineProperty(o, 'p', { value: 2 }); var d = Object.getOwnPropertyDescriptor(o, 'p'); return d.value + ',' + d.writable + ',' + d.enumerable + ',' + d.configurable;", "descriptors2"],
  ["desc-new-defaults-false", "var o = {}; Object.defineProperty(o, 'p', { value: 1 }); var d = Object.getOwnPropertyDescriptor(o, 'p'); return d.writable + ',' + d.enumerable + ',' + d.configurable;", "descriptors2"],
  ["desc-data-to-accessor", "var o = {}; o.foo = 101; Object.defineProperty(o, 'foo', { get: function () { return 1; } }); var d = Object.getOwnPropertyDescriptor(o, 'foo'); return d.enumerable + ',' + d.configurable + ',' + d.hasOwnProperty('value');", "descriptors2"],
  ["desc-undefined-getter-still-accessor", "var o = {}; Object.defineProperty(o, 'p', { get: undefined, configurable: true }); var d = Object.getOwnPropertyDescriptor(o, 'p'); return typeof d.get + ',' + d.hasOwnProperty('value');", "descriptors2"],
  ["desc-empty-descriptor-defines", "var o = {}; Object.defineProperty(o, 'p', {}); return String(o.hasOwnProperty('p'));", "descriptors2"],
  ["desc-accessor-listed-by-keys", "var o = {}; Object.defineProperty(o, 'p', { get: function () { return 1; }, enumerable: true }); return String(Object.keys(o));", "descriptors2"],
  ["desc-create-from-accessor-map", "var props = {}; Object.defineProperty(props, 'prop', { get: function () { return {}; }, enumerable: true }); var n = Object.create({}, props); return String(n.hasOwnProperty('prop'));", "descriptors2"],
  ["desc-builtin-prototype-attrs", "var d = Object.getOwnPropertyDescriptor(Object, 'prototype'); return d.writable + ',' + d.enumerable + ',' + d.configurable;", "descriptors2"],

  // --- array defineProperty --------------------------------------------------
  ["arrdef-length-truncates", "var a = [0, 1, 2]; Object.defineProperty(a, 'length', { value: 1 }); return a.toString();", "descriptors2"],
  ["arrdef-length-null-is-zero", "var a = [0, 1]; Object.defineProperty(a, 'length', { value: null }); return a.length;", "descriptors2"],
  ["arrdef-length-undefined-throws", "var a = []; try { Object.defineProperty(a, 'length', { value: undefined }); return 'no-throw'; } catch (e) { return e.name; }", "descriptors2"],
  ["arrdef-index-extends-length", "var a = []; Object.defineProperty(a, '2', { value: 'x' }); return a.length + ',' + String(a[2]);", "descriptors2"],
  ["arrdef-index-accessor", "var a = []; Object.defineProperty(a, '0', { get: function () { return 9; } }); return String(a[0]);", "descriptors2"],

  // --- errors have a real prototype chain ------------------------------------
  ["errproto-instance-links", "return String(Object.getPrototypeOf(new Error()) === Error.prototype);", "errproto"],
  ["errproto-inherits-property", "var saved = Error.prototype.value; Error.prototype.value = 'E'; var r = String(new Error().value); Error.prototype.value = saved; return r;", "errproto"],
  ["errproto-subclass-chain", "return String(Object.getPrototypeOf(TypeError.prototype) === Error.prototype);", "errproto"],
  ["errproto-isprototypeof", "return String(Error.prototype.isPrototypeOf(new TypeError()));", "errproto"],

  // --- built-in constructors as values ---------------------------------------
  ["ctorval-number-bind", "var bnc = Number.bind(null); return bnc(42);", "ctorvalue"],
  ["ctorval-function-call", "var f = Function.call(null, 'return 1;'); return typeof f;", "ctorvalue"],
  ["ctorval-function-apply", "var f = Function.apply(null, ['return 2;']); return f();", "ctorvalue"],
  ["ctorval-string-as-callback", "return [1, 2].map(String).join('|');", "ctorvalue"],
  ["ctorval-array-apply", "return Array.apply(null, [1, 2, 3]).length;", "ctorvalue"],

  // --- sloppy-mode this coercion ---------------------------------------------
  ["thiscoerce-apply-no-arg", "var f = Function('this.__probeField = 42; return 1;'); f.apply(); return typeof globalThis.__probeField;", "thiscoerce"],
  ["thiscoerce-primitive-boxed", "function f() { return typeof this; } return f.call('s');", "thiscoerce"],
  ["thiscoerce-strict-keeps-undefined", "function f() { 'use strict'; return typeof this; } return f.call(undefined);", "thiscoerce"],
  ["thiscoerce-apply-arraylike-function", "function f() { return this instanceof String; } return String(f.apply('', Array));", "thiscoerce"],
  ["fnctor-tostring-arg-coerced", "try { new Function({ toString: function () { throw 7; } }); return 'no-throw'; } catch (e) { return String(e); }", "thiscoerce"],

  // --- Object.prototype is reachable as values -------------------------------
  ["objproto-typeof-hasownproperty", "return typeof Object.prototype.hasOwnProperty;", "objproto"],
  ["objproto-typeof-propertyisenumerable", "return typeof Object.prototype.propertyIsEnumerable;", "objproto"],
  ["objproto-typeof-isprototypeof", "return typeof Object.prototype.isPrototypeOf;", "objproto"],
  ["objproto-typeof-tolocalestring", "return typeof Object.prototype.toLocaleString;", "objproto"],
  ["objproto-borrowed-hasownproperty", "var o = { a: 1 }; var f = Object.prototype.hasOwnProperty; return String(f.call(o, 'a')) + ',' + String(f.call(o, 'b'));", "objproto"],
  ["objproto-borrowed-propertyisenumerable", "var o = {}; Object.defineProperty(o, 'p', { value: 1 }); var f = Object.prototype.propertyIsEnumerable; return String(f.call(o, 'p'));", "objproto"],
  ["objproto-tolocalestring-defers", "return ({}).toLocaleString();", "objproto"],

  // --- integrity of primitives ----------------------------------------------
  ["frozen-undefined", "return String(Object.isFrozen(undefined));", "objproto"],
  ["frozen-number", "return String(Object.isFrozen(1));", "objproto"],
  ["sealed-string", "return String(Object.isSealed('a'));", "objproto"],
  ["extensible-number", "return String(Object.isExtensible(1));", "objproto"],
  ["frozen-plain-object", "return String(Object.isFrozen({}));", "objproto"],
  ["frozen-after-freeze", "var o = {}; Object.freeze(o); return String(Object.isFrozen(o));", "objproto"],
  ["extensible-array", "return String(Object.isExtensible([]));", "objproto"],

  // --- Function.prototype and the synthesised function properties -----------
  ["fnproto-is-callable", "return String(Function.prototype());", "fnprops2"],
  ["fnproto-ignores-arguments", "return String(Function.prototype(1, 2));", "fnprops2"],
  ["fnprops-length-deletable", "var f = new Function('a,b,c', 'return 1;'); return String(f.hasOwnProperty('length')) + ',' + String(delete f.length) + ',' + String(f.hasOwnProperty('length'));", "fnprops2"],
  ["fnprops-prototype-not-configurable", "function g() {} delete g.prototype; return String(g.hasOwnProperty('prototype'));", "fnprops2"],
  ["fnprops-length-still-works", "function g(a, b) {} return g.length;", "fnprops2"],
  ["fnprops-missing-prop-on-number", "return typeof (1).nope;", "fnprops2"],
  ["fnprops-missing-prop-on-string", "return typeof 'a'.nope;", "fnprops2"],
  ["fnprops-apply-boxes-primitive", "var obj = 1; var f = Function('this.touched = true; return this;'); var r = f.apply(obj); return typeof obj.touched + ',' + String(r.touched);", "fnprops2"],
  ["desc-accessor-set-undefined-removes", "var o = {}; Object.defineProperty(o, 'foo', { get: function () { return 10; }, set: function () {}, configurable: true }); Object.defineProperty(o, 'foo', { set: undefined }); var d = Object.getOwnPropertyDescriptor(o, 'foo'); return typeof d.set + ',' + typeof d.get;", "descriptors2"],
  ["defprops-primitive-properties", "var o = {}; return String(Object.defineProperties(o, false) === o);", "descriptors2"],
  ["arrdef-length-nonwritable", "var a = []; Object.defineProperty(a, 'length', { writable: false }); try { Object.defineProperty(a, 'length', { value: 12 }); return 'no-throw'; } catch (e) { return e.name; }", "descriptors2"],
  ["bind-poisons-caller", "function foo() {} var b = foo.bind({}); try { b.caller; return 'no-throw'; } catch (e) { return e.name; }", "fnprops2"],
  ["bind-poisons-arguments", "function foo() {} var b = foo.bind({}); try { b.arguments; return 'no-throw'; } catch (e) { return e.name; }", "fnprops2"],
  ["bind-has-no-prototype", "var foo = function () {}; var b = foo.bind({}); return String(b.hasOwnProperty('prototype'));", "fnprops2"],
  ["bind-target-keeps-prototype", "var foo = function () {}; foo.bind({}); return String(foo.hasOwnProperty('prototype'));", "fnprops2"],

  // --- function source text -------------------------------------------------
  // Function.prototype.toString returns the function's own source, which is
  // what makes `f + 1` and `eval("(" + f + ")")` behave. It needs the parser to
  // record where each function node ends.
  ["fnsrc-decl", "function f1() { return 1; }\nreturn f1.toString();", "fnsrc"],
  ["fnsrc-expr", "var g = function (a, b) { return a + b; };\nreturn g.toString();", "fnsrc"],
  ["fnsrc-arrow-block", "var h = (x) => { return x * 2; };\nreturn h.toString();", "fnsrc"],
  ["fnsrc-arrow-concise", "var h = (x) => x * 2;\nreturn h.toString();", "fnsrc"],
  ["fnsrc-method", "var o = { m: function () { return 2; } };\nreturn o.m.toString();", "fnsrc"],
  ["fnsrc-concat", "function f1() {}\nreturn (f1 + 1) === (f1.toString() + 1);", "fnsrc"],
  ["fnsrc-string-of", "function f1(a) { return a; }\nreturn String(f1);", "fnsrc"],
  ["fnsrc-roundtrip", "function f1() { return 41; }\nvar back = eval('(' + f1.toString() + ')');\nreturn back() + 1;", "fnsrc"],
  ["fnsrc-from-eval", "var q = eval('(function q() { return 7; })');\nreturn q.toString();", "fnsrc"],
  ["fnsrc-nested-from-eval", "var mk = eval('(function () { return function inner() { return 3; }; })');\nreturn mk().toString();", "fnsrc"],
  ["fnsrc-builtin-native", "return Object.keys.toString().indexOf('native code') > 0;", "fnsrc"],
  ["fnsrc-fn-ctor-name", "return Function('a', 'return a').toString().indexOf('anonymous') > 0;", "fnsrc"],

  // --- computed property access ---------------------------------------------
  // A computed key is the same reference a written one is: same accessor, same
  // strict-mode refusal. Only a numeric index into a real array differs.
  ["computed-getter", "var o = {}; Object.defineProperty(o, 'bar', { get: function () { return 42; } }); return o['bar'];", "accessors"],
  ["computed-getter-this", "var o = { n: 5 }; Object.defineProperty(o, 'bar', { get: function () { return this.n; } }); return o['bar'];", "accessors"],
  ["computed-getter-numeric-key", "var o = {}; Object.defineProperty(o, '0', { get: function () { return 7; } }); return o[0];", "accessors"],
  ["computed-setter", "var o = {}; Object.defineProperty(o, 'bar', { set: function (x) { this.seen = x; } }); o['bar'] = 9; return o.seen;", "accessors"],
  ["computed-setter-not-shadowed", "var o = {}; Object.defineProperty(o, 'bar', { get: function () { return 1; }, set: function () {} }); o['bar'] = 9; return o.bar;", "accessors"],
  ["computed-arg-order", "var o = {}; Object.defineProperty(o, 'bar', { get: function () { this.ran = true; return 42; } }); try { o.nope(o['bar']); } catch (e) {} return o.ran;", "accessors"],
  ["computed-array-index-still-element", "var a = [1, 2, 3]; a[1] = 9; return a[1];", "accessors"],
  ["computed-strict-refusal", "'use strict'; var o = {}; Object.defineProperty(o, 'p', { value: 1 }); try { o['p'] = 2; return 'no-throw'; } catch (e) { return e.name; }", "accessors"],

  // --- ToPrimitive ordering -------------------------------------------------
  // valueOf then toString for a number hint, the other way for a string hint --
  // for arrays and functions and boxed primitives alike, not objects only.
  ["toprim-fn-valueof", "function f() {} f.valueOf = function () { return 5; }; return f * 2;", "toprimitive"],
  ["toprim-fn-tostring-object", "function f() {} f.valueOf = function () { return true; }; f.toString = function () { return {}; }; return String(f);", "toprimitive"],
  ["toprim-array-valueof", "var a = [1, 2]; a.valueOf = function () { return 5; }; return a * 2;", "toprimitive"],
  ["toprim-array-default-join", "return String([1, 2, 3]);", "toprimitive"],
  ["toprim-boxed-string-override", "var s = new String('ABCDEF'); s.valueOf = function () { return 'ed'; }; s.toString = function () { return 'ed'; }; return s == 'ed';", "toprimitive"],
  ["toprim-boxed-length-unchanged", "var s = new String('ABCDEF'); s.valueOf = function () { return 'ed'; }; return s.length;", "toprimitive"],
  ["toprim-boxed-default", "return String(new String('abc')) + (1 + new Number(4));", "toprimitive"],
  ["toprim-string-proto-empty", "return String.prototype == '';", "toprimitive"],
  ["toprim-object-brand", "return String({});", "toprimitive"],
  ["toprim-object-valueof-skipped-for-string", "return String({ valueOf: function () { return 7; } });", "toprimitive"],
  ["toprim-both-objects-throws", "var o = { valueOf: function () { return {}; }, toString: function () { return {}; } }; try { return String(o); } catch (e) { return e.name; }", "toprimitive"],
  // A built-in borrowed onto an object is the one ToPrimitive must RUN, not the
  // default the receiver's own kind would use.
  ["toprim-borrowed-fnproto-tostring", "var o = { toString: Function.prototype.toString }; try { return String(o); } catch (e) { return e.name; }", "toprimitive"],
  ["toprim-borrowed-numproto-tostring", "var o = { toString: Number.prototype.toString }; try { return String(o); } catch (e) { return e.name; }", "toprimitive"],
  ["toprim-own-objproto-tostring-still-default", "var o = { toString: Object.prototype.toString }; return String(o);", "toprimitive"],

  // --- Object.prototype.valueOf is ToObject, and a built-in never gets the
  // sloppy-mode global `this` an ordinary function does. -----------------------
  ["valueof-boxes-boolean", "return typeof Object.prototype.valueOf.call(true);", "objvalueof"],
  ["valueof-boxes-number", "return typeof Object.prototype.valueOf.call(1);", "objvalueof"],
  ["valueof-identity-on-object", "var o = {}; return String(Object.prototype.valueOf.call(o) === o);", "objvalueof"],
  ["valueof-undefined-throws", "try { Object.prototype.valueOf.call(undefined); return 'no-throw'; } catch (e) { return e.name; }", "objvalueof"],
  ["valueof-null-throws", "try { Object.prototype.valueOf.call(null); return 'no-throw'; } catch (e) { return e.name; }", "objvalueof"],
  ["valueof-unbound-throws", "var vo = Object.prototype.valueOf; try { vo(); return 'no-throw'; } catch (e) { return e.name; }", "objvalueof"],
  ["valueof-comma-unbound-throws", "try { (1, Object.prototype.valueOf)(); return 'no-throw'; } catch (e) { return e.name; }", "objvalueof"],
  ["valueof-wrapper-still-unwraps", "return String(new Number(7).valueOf());", "objvalueof"],

  // --- `==` between two object-like values is identity, functions included ---
  ["loose-eq-function-self", "var f = function () {}; return String(f == f);", "objvalueof"],
  ["loose-eq-function-alias", "var f = function () {}; var g = f; return String(f == g);", "objvalueof"],
  ["loose-eq-function-distinct", "return String((function () {}) == (function () {}));", "objvalueof"],
  ["loose-eq-getter-roundtrip", "var o = { get foo() { return 1; } }; var d1 = Object.getOwnPropertyDescriptor(o, 'foo'); var d2 = Object.getOwnPropertyDescriptor(o, 'foo'); return String(d1.get == d2.get);", "objvalueof"],

  // --- `new` through an expression, and bind currying [[Construct]] ----------
  ["new-callexpression-callee", "var obj = new (Function('function f(){this.p1=1;};return f').apply()); return obj.p1;", "newcallee"],
  ["new-bound-builtin-date", "function construct(f, args) { var bound = Function.prototype.bind.apply(f, [null].concat(args)); return new bound(); } return Object.prototype.toString.call(construct(Date, [1957, 4, 27]));", "newcallee"],
  ["new-bound-this-ignored", "var obj = { p: 1 }; var f = function () { return Object.prototype.toString.call(this); }; var B = Function.prototype.bind.call(f, obj); var seen = ''; var g = function () { seen = String(this === obj); }; var C = Function.prototype.bind.call(g, obj); new C(); return seen;", "newcallee"],
  ["new-instance-inherits-object-proto", "Object.defineProperty(Object.prototype, 'vtProbe', { value: 'VT', configurable: true }); function F() {} var out = String(new F().vtProbe); delete Object.prototype.vtProbe; return out;", "newcallee"],
  ["new-bound-instance-inherits", "Object.defineProperty(Object.prototype, 'vtProbe2', { value: 'VT', configurable: true }); var F = function () {}; var B = F.bind({}); var out = String(new B().vtProbe2); delete Object.prototype.vtProbe2; return out;", "newcallee"],

  // --- a registry method deleted off its prototype stays deleted -------------
  ["delete-objproto-tostring-typeof", "var saved = Object.prototype.toString; delete Object.prototype.toString; var out = typeof Object.prototype.toString; Object.defineProperty(Object.prototype, 'toString', { value: saved, writable: true, enumerable: false, configurable: true }); return out;", "protodelete"],
  ["delete-objproto-tostring-throws", "var saved = Object.prototype.toString; delete Object.prototype.toString; var out; try { Object.prototype.toString(); out = 'no-throw'; } catch (e) { out = e.name; } Object.defineProperty(Object.prototype, 'toString', { value: saved, writable: true, enumerable: false, configurable: true }); return out;", "protodelete"],
  ["delete-objproto-tostring-hides-from-object", "var saved = Object.prototype.toString; delete Object.prototype.toString; var out = typeof ({}).toString; Object.defineProperty(Object.prototype, 'toString', { value: saved, writable: true, enumerable: false, configurable: true }); return out;", "protodelete"],
  ["delete-restore-brings-back", "var saved = Object.prototype.toString; delete Object.prototype.toString; Object.defineProperty(Object.prototype, 'toString', { value: saved, writable: true, enumerable: false, configurable: true }); return ({}).toString();", "protodelete"],
  ["delete-kindproto-falls-back", "var saved = Number.prototype.toString; delete Number.prototype.toString; var out = new Number().toString(); Object.defineProperty(Number.prototype, 'toString', { value: saved, writable: true, enumerable: false, configurable: true }); return out;", "protodelete"],

  // --- RegExp.prototype publishes source/global/ignoreCase/multiline as
  // accessors, which is what getOwnPropertyDescriptor is asked about. ---------
  ["regexdesc-source-is-accessor", "var d = Object.getOwnPropertyDescriptor(RegExp.prototype, 'source'); return String(d.hasOwnProperty('writable')) + ',' + typeof d.get + ',' + String(d.set) + ',' + String(d.enumerable) + ',' + String(d.configurable);", "regexdesc"],
  ["regexdesc-global-is-accessor", "var d = Object.getOwnPropertyDescriptor(RegExp.prototype, 'global'); return typeof d.get + ',' + String(d.enumerable) + ',' + String(d.configurable);", "regexdesc"],
  ["regexdesc-ignorecase-is-accessor", "var d = Object.getOwnPropertyDescriptor(RegExp.prototype, 'ignoreCase'); return typeof d.get + ',' + String(d.set);", "regexdesc"],
  ["regexdesc-multiline-is-accessor", "var d = Object.getOwnPropertyDescriptor(RegExp.prototype, 'multiline'); return typeof d.get + ',' + String(d.set);", "regexdesc"],
  ["regexdesc-getter-reads-instance", "var d = Object.getOwnPropertyDescriptor(RegExp.prototype, 'source'); return d.get.call(/ab+c/i);", "regexdesc"],
  ["regexdesc-flag-getter-reads-instance", "var d = Object.getOwnPropertyDescriptor(RegExp.prototype, 'ignoreCase'); return String(d.get.call(/ab/i)) + ',' + String(d.get.call(/ab/));", "regexdesc"],
  ["regex-source-still-reads", "return /ab+c/i.source;", "regexdesc"],

  // --- a missing separator in a literal is a SyntaxError ---------------------
  ["fnctor-object-body-syntaxerror", "try { new Function({}); return 'no-throw'; } catch (e) { return e.name; }", "litsep"],
  ["fnctor-array-missing-comma", "try { new Function('[object Object]'); return 'no-throw'; } catch (e) { return e.name; }", "litsep"],
  ["fnctor-object-missing-comma", "try { new Function('({a: 1 b: 2})'); return 'no-throw'; } catch (e) { return e.name; }", "litsep"],
  ["fnctor-good-body-still-works", "var f = new Function('return [1, 2];'); return f().join('|');", "litsep"],
  ["accessor-keyword-name", "var o = { get null() { return 1; }, set true(v) {} }; return String(o['null']);", "litsep"],
  ["accessor-string-name", "var o = { get 'a'() { return 2; } }; return String(o.a);", "litsep"],
  ["accessor-number-name", "var o = { get 10() { return 3; } }; return String(o[10]);", "litsep"],
  ["object-get-as-plain-key", "var o = { get: 1, set: 2 }; return String(o.get) + ',' + String(o.set);", "litsep"],

  // --- labelled statements, and finally on an abrupt completion --------------
  ["label-break-outer", "var out = ''; outer: for (var i = 0; i < 3; i++) { for (var j = 0; j < 3; j++) { if (j === 1) { break outer; } out += '' + i + j; } } return out;", "labels"],
  ["label-continue-outer", "var out = ''; outer: for (var i = 0; i < 3; i++) { for (var j = 0; j < 3; j++) { if (j === 1) { continue outer; } out += '' + i + j; } } return out;", "labels"],
  ["label-break-block", "var out = ''; blk: { out += 'a'; break blk; out += 'b'; } return out;", "labels"],
  ["label-break-own-loop", "var out = ''; lbl: for (var i = 0; i < 4; i++) { if (i === 2) { break lbl; } out += i; } return out;", "labels"],
  ["label-continue-own-loop", "var out = ''; lbl: for (var i = 0; i < 4; i++) { if (i === 2) { continue lbl; } out += i; } return out;", "labels"],
  ["label-chain", "var out = ''; a: b: for (var i = 0; i < 3; i++) { if (i === 1) { break a; } out += i; } return out;", "labels"],
  ["label-while", "var out = ''; var i = 0; w: while (i < 5) { i++; if (i === 2) { continue w; } if (i === 4) { break w; } out += i; } return out;", "labels"],
  ["label-do-while", "var out = ''; var i = 0; d: do { i++; if (i === 2) { break d; } out += i; } while (i < 5); return out;", "labels"],
  ["label-forin", "var o = { a: 1, b: 2, c: 3 }; var out = ''; L: for (var k in o) { if (k === 'b') { continue L; } out += k; } return out;", "labels"],
  ["label-switch-in-loop", "var out = ''; L: for (var i = 0; i < 4; i++) { switch (i) { case 2: break L; default: out += i; } } return out;", "labels"],
  ["unlabelled-break-still-inner", "var out = ''; outer: for (var i = 0; i < 2; i++) { for (var j = 0; j < 3; j++) { if (j === 1) { break; } out += '' + i + j; } } return out;", "labels"],

  ["finally-on-return", "var g = ''; function f() { try { return 1; } finally { g = 'F'; } } var v = f(); return g + '/' + v;", "finally"],
  ["finally-on-break", "var s = ''; for (var i = 0; i < 3; i++) { try { s += 'T'; break; } finally { s += 'F'; } } return s;", "finally"],
  ["finally-on-continue", "var s = ''; for (var i = 0; i < 2; i++) { try { s += 'T'; continue; } finally { s += 'F'; } } return s;", "finally"],
  ["finally-on-throw", "var s = ''; try { try { s += 'T'; throw 1; } finally { s += 'F'; } } catch (e) { s += 'C'; } return s;", "finally"],
  ["finally-return-overrides-return", "function f() { try { return 1; } finally { return 2; } } return f();", "finally"],
  ["finally-return-overrides-throw", "function f() { try { throw 1; } finally { return 2; } } return f();", "finally"],
  ["finally-break-swallows-throw", "var s = ''; for (var i = 0; i < 3; i++) { try { throw 1; } finally { break; } } return 'ok' + i;", "finally"],
  ["finally-catch-and-finally-on-return", "var g = ''; function f() { try { return 1; } catch (e) {} finally { g = 'F'; } } var v = f(); return g + '/' + v;", "finally"],
  ["finally-normal-still-runs", "var s = ''; try { s += 'T'; } finally { s += 'F'; } return s;", "finally"],

  // --- for-clause forms, and delete of a NAME --------------------------------
  ["for-update-comma", "var s = ''; for (var i = 0, j = 5; i < 3; i++, j--) { s += '' + i + j; } return s;", "forclause"],
  ["for-expression-init", "var s = ''; var i; for (i = 0; i < 3; i++) { s += '' + i; } return s;", "forclause"],
  ["for-init-side-effect", "var log = ''; var i; for (i = (log += 'I', 0); i < 2; i++) { log += 'B'; } return log;", "forclause"],
  ["forin-delete-skips", "var o = { p1: 1, p2: 2, p3: 3 }; var s = ''; for (var k in o) { delete o.p3; s += k; } return s;", "forclause"],
  ["delete-with-property", "var o = { p: 1 }; var d; with (o) { d = delete p; } return String(d) + '/' + String(o.p);", "forclause"],
  ["delete-var-is-false", "var v = 1; return String(delete v) + '/' + String(v);", "forclause"],
  ["delete-function-is-false", "function fn() {} return String(delete fn) + '/' + typeof fn;", "forclause"],
  ["delete-implicit-global", "impl = 5; return String(delete impl) + '/' + String(typeof impl);", "forclause"],
  ["delete-unresolvable-is-true", "return String(delete nosuchnameanywhere);", "forclause"],
  ["with-var-writes-property", "var o = { value: 'V' }; function f() { with (o) { var value = 'new'; } } f(); return String(o.value) + '/' + String(typeof value);", "forclause"],
  ["with-var-leaves-binding-undefined", "var o = { value: 'V' }; function f() { with (o) { var value = 'n'; } return typeof value; } var r = f(); return r + '/' + String(o.value);", "forclause"],

  // --- eval's completion value is the last non-empty Statement completion ----
  ["completion-block", "return String(eval('1; 2; 3;'));", "completion"],
  ["completion-if", "return String(eval('if (true) { 42; }'));", "completion"],
  ["completion-for", "return String(eval('for (var q = 0; q < 3; q++) { q * 2; }'));", "completion"],
  ["completion-while", "return String(eval('var w = 0; while (w < 3) { w++; w * 10; }'));", "completion"],
  ["completion-do-while", "var n = 0; return String(eval('do { n++; n; } while (n < 3)'));", "completion"],
  ["completion-for-in", "var s = ''; var h; var r = eval(\"for (i in (h = {2: 'b', 1: 'a'})) s += h[i]\"); return String(r) + '|' + s;", "completion"],
  ["completion-var-is-empty", "return String(eval('var zz = 1;'));", "completion"],
  ["completion-var-keeps-previous", "return String(eval('7; var zz2 = 1;'));", "completion"],
  ["completion-try", "return String(eval('try { 5; } finally { }'));", "completion"],
  ["completion-switch", "return String(eval('switch (1) { case 1: 9; }'));", "completion"],

  // --- for-in over an existing binding, and localeCompare's absent argument --
  ["forin-existing-binding", "var o = { x: 1, y: 2 }; var k; var out = ''; for (k in o) { out += k; } return out + '/' + k;", "forclause"],
  ["forin-nested-two-deep", "var m = { a: { aa: 1, ab: 2 }, b: { ba: 1, bb: 2 } }; var out = ''; for (var k in m) { for (var i in m[k]) { out += '' + i + m[k][i]; } } return out;", "forclause"],
  ["localecompare-missing-arg", "return String('a'.localeCompare() === 'a'.localeCompare(undefined));", "forclause"],
  ["localecompare-undefined-is-text", "return String('a'.localeCompare(undefined) === 'a'.localeCompare('undefined'));", "forclause"],

  // --- generic Array.prototype methods over an array-LIKE receiver ----------
  ["arraylike-filter-skips-absent", "var obj = { 0: 0, 2: 2, length: 3 }; var n = Array.prototype.filter.call(obj, function () { return true; }); return String(n.length) + '|' + n.join(',');", "arraylike"],
  ["arraylike-filter-sees-inherited", "Object.defineProperty(Object.prototype, '1', { value: 1, configurable: true }); var obj = { 2: 2, length: 3 }; var n = Array.prototype.filter.call(obj, function () { return true; }); delete Object.prototype[1]; return String(n.length) + '|' + n.join(',');", "arraylike"],
  ["arraylike-foreach-skips-absent", "var obj = { 0: 'a', 2: 'c', length: 3 }; var s = ''; Array.prototype.forEach.call(obj, function (v, i) { s += i + v; }); return s;", "arraylike"],
  ["arraylike-length-getter-runs", "var acc = false; var obj = { 0: 1 }; Object.defineProperty(obj, 'length', { get: function () { acc = true; return 1; } }); Array.prototype.every.call(obj, function () { return true; }); return String(acc);", "arraylike"],
  ["arraylike-length-getter-throws-first", "var obj = { 0: 11, 1: 12 }; Object.defineProperty(obj, 'length', { get: function () { throw new TypeError('LEN'); }, configurable: true }); try { Array.prototype.every.call(obj, undefined); return 'no-throw'; } catch (e) { return e.name + ':' + e.message; }", "arraylike"],
  ["arraylike-index-getter-runs", "var acc = false; var obj = { length: 2 }; Object.defineProperty(obj, '0', { get: function () { acc = true; return 1; }, configurable: true }); Array.prototype.every.call(obj, function () { return true; }); return String(acc);", "arraylike"],
  ["array-filter-sees-shrink", "var srcArr = [1, 2, 3, 4, 6]; function cb() { srcArr.length = 2; return true; } var r = srcArr.filter(cb); return String(r.length);", "arraylike"],
  ["array-tolocalestring", "var n = 0; var obj = { toLocaleString: function () { n++; return 'x'; } }; var a = [obj, obj]; var s = a.toLocaleString(); return String(n) + '|' + s;", "arraylike"],
  ["array-tolocalestring-nulls", "return [1, null, undefined, 2].toLocaleString();", "arraylike"],
  ["concat-nonarray-receiver-is-one-element", "Object.defineProperty(Object.prototype, 'length', { value: 2, configurable: true }); Object.defineProperty(Object.prototype, 'concat', { value: Array.prototype.concat, configurable: true }); var x = { 0: 0 }; var arr = x.concat(); var out = String(arr.length) + '|' + String(arr[0] === x); delete Object.prototype.length; delete Object.prototype.concat; return out;", "arraylike"],
  ["concat-copies-inherited-index", "Object.defineProperty(Array.prototype, '1', { value: 1, configurable: true }); var x = [0]; x.length = 2; var arr = x.concat(); var out = String(arr[0]) + ',' + String(arr[1]) + ',' + String(arr.hasOwnProperty('1')); delete Array.prototype[1]; Array.prototype.length = 0; return out;", "arraylike"],
  ["array-hole-reads-prototype", "Object.defineProperty(Array.prototype, '1', { value: 7, configurable: true }); var x = [0]; x.length = 2; var out = String(x[1]); delete Array.prototype[1]; Array.prototype.length = 0; return out;", "arraylike"],

  // --- arguments.callee, and its poisoned strict-mode form -------------------
  ["callee-identity", "function foo() { return arguments.callee === foo; } return String(foo());", "callee"],
  ["callee-recursion", "var f = function (n) { if (n <= 1) { return 1; } return n * arguments.callee(n - 1); }; return f(4);", "callee"],
  ["callee-attributes", "function foo() { return Object.getOwnPropertyDescriptor(arguments, 'callee'); } var d = foo(); return String(d.configurable) + '/' + String(d.enumerable) + '/' + String(d.writable) + '/' + String(d.hasOwnProperty('get'));", "callee"],
  ["callee-not-enumerable", "function foo() { var ks = []; for (var k in arguments) { ks.push(k); } return ks.join(','); } return foo(1, 2);", "callee"],
  ["callee-strict-read-throws", "return (function () { 'use strict'; function f() { return arguments.callee; } try { f(); return 'no-throw'; } catch (e) { return e.name; } })();", "callee"],
  ["callee-strict-write-throws", "return (function () { 'use strict'; var a = (function () { return arguments; })(); try { a.callee = {}; return 'no-throw'; } catch (e) { return e.name; } })();", "callee"],
  ["callee-strict-descriptor", "return (function () { 'use strict'; function f() { return Object.getOwnPropertyDescriptor(arguments, 'callee'); } var d = f(); return String(d.configurable) + '/' + String(d.enumerable) + '/' + String(d.hasOwnProperty('value')) + '/' + String(d.hasOwnProperty('get')) + '/' + String(d.hasOwnProperty('set')); })();", "callee"],

  // --- ++/-- coerce, bind's poisoning is not its strictness ------------------
  ["update-string-property-is-nan", "var m = { foo: 'bar' }; m.foo++; return String(m.foo);", "update"],
  ["update-numeric-string-property", "var m = { s: '5' }; m.s++; return m.s;", "update"],
  ["update-postfix-returns-old", "var m = { n: 1 }; var r = m.n++; return String(r) + '/' + String(m.n);", "update"],
  ["update-prefix-returns-new", "var m = { n: 1 }; var r = ++m.n; return String(r) + '/' + String(m.n);", "update"],
  ["update-array-element", "var a = [1, 2]; a[0]++; return a[0];", "update"],
  ["bind-does-not-make-target-strict", "var glob = this; function f() { return this === glob; } return String((function () { 'use strict'; return f.bind()(); })());", "update"],
  ["bind-still-poisons-caller", "function foo() {} var b = foo.bind({}); try { b.caller; return 'no-throw'; } catch (e) { return e.name; }", "update"],
  ["var-without-init-keeps-function", "function f2() { var x; return typeof x; function x() { return 7; } } return f2();", "update"],
  ["var-without-init-is-undefined", "function g() { var y; return typeof y; } return g();", "update"],

  // --- a keyword's TEXT in a string literal is not the keyword ---------------
  ["strlit-await", "var x = 'await'; return x;", "kwtext"],
  ["strlit-delete", "var x = 'delete'; return x;", "kwtext"],
  ["strlit-typeof", "var x = 'typeof'; return x;", "kwtext"],
  ["strlit-void", "var x = 'void'; return x;", "kwtext"],
  ["strlit-yield", "var x = 'yield'; return x;", "kwtext"],
  ["strlit-as-argument", "function f(a) { return a; } return f('await') + f('delete');", "kwtext"],
  ["keyword-keys-and-values", "var o = { await: 'await', delete: 'delete', typeof: 'typeof', in: 'in', do: 'do' }; return o.await + o.delete + o.typeof + o.in + o.do;", "kwtext"],
  ["keyword-accessor-and-member", "var o = { get delete() { return 'g'; } }; o.typeof = 't'; return o.delete + o.typeof;", "kwtext"],
  ["operators-still-work", "var o = { a: 1 }; return String(delete o.a) + '/' + typeof o + '/' + String(void 0);", "kwtext"],

  // --- the value globals, non-configurable delete, sloppy reserved words ----
  ["typeof-nan-is-number", "return typeof NaN;", "globals"],
  ["typeof-infinity-is-number", "return typeof Infinity;", "globals"],
  ["typeof-math-is-object", "return typeof Math;", "globals"],
  ["typeof-object-is-function", "return typeof Object;", "globals"],
  ["typeof-unresolvable", "return typeof nosuchnameanywhere2;", "globals"],
  ["delete-nan-is-false", "return String(delete NaN);", "globals"],
  ["delete-infinity-is-false", "return String(delete Infinity);", "globals"],
  ["delete-number-nan-is-false", "return String(delete Number.NaN);", "globals"],
  ["delete-nonconfigurable-is-false", "var o = {}; Object.defineProperty(o, 'a', { value: 1 }); return String(delete o.a) + '/' + String(o.a);", "globals"],
  ["delete-configurable-is-true", "var o = {}; Object.defineProperty(o, 'a', { value: 1, configurable: true }); return String(delete o.a) + '/' + String(o.a);", "globals"],
  ["delete-plain-property", "var o = { a: 1 }; return String(delete o.a) + '/' + String(o.a);", "globals"],
  ["sloppy-strict-reserved-as-name", "function f() { var public = 1; var interface = 2; return public + interface; } return f();", "globals"],
  ["misspelled-directive-leaves-sloppy", "function f() { 'use  strict'; var public = 1; return public; } return f();", "globals"],
  ["strict-reserved-still-rejected", "return (function () { 'use strict'; try { eval('var public = 1;'); return 'no-throw'; } catch (e) { return e.name; } })();", "globals"],

  // --- whose strictness decides `this`, and strict eval's own scope ---------
  ["fnctor-is-sloppy", "return (function () { 'use strict'; var f = Function('return typeof this;'); return f(); })();", "thisstrict"],
  ["fnctor-own-directive-strict", "var f = Function('\"use strict\"; return typeof this;'); return f();", "thisstrict"],
  ["sloppy-bare-call-gets-global", "function g() { return typeof this; } return g();", "thisstrict"],
  ["strict-nested-in-sloppy-keeps-undefined", "var glob = this; function f1() { function f() { 'use strict'; return typeof this; } return f() === 'undefined' && this === glob; } return String(f1());", "thisstrict"],
  ["arrow-this-still-lexical-bare", "var o = { v: 1, m: function () { var a = () => this.v; return a(); } }; return o.m();", "thisstrict"],
  ["indirect-eval-this-is-global", "var glob = this; function t() { var me = eval; return me('this') === glob; } return String(t());", "thisstrict"],
  ["strict-eval-var-does-not-leak", "return (function () { 'use strict'; eval('var xz = 1;'); return typeof xz; })();", "thisstrict"],
  ["strict-eval-function-does-not-leak", "return (function () { 'use strict'; eval('function fz() {}'); return typeof fz; })();", "thisstrict"],
  ["sloppy-eval-var-does-leak", "return (function () { eval('var xz2 = 1;'); return typeof xz2; })();", "thisstrict"],
  ["strict-source-eval-var-does-not-leak", "return (function () { eval('\"use strict\"; var xz3 = 1;'); return typeof xz3; })();", "thisstrict"],
  ["strict-eval-still-reads-and-writes-outer", "return (function () { 'use strict'; var q = 5; eval('q = 7'); return q; })();", "thisstrict"],
  ["strict-eval-function-usable-inside", "return (function () { 'use strict'; return eval('function fz() { return 3; } fz();'); })();", "thisstrict"],

  // --- the sloppy arguments object is MAPPED onto the named parameters ------
  ["argmap-param-to-arguments", "function foo(a, b, c) { a = 1; b = 'str'; c = 2.1; return arguments[0] === 1 && arguments[1] === 'str' && arguments[2] === 2.1; } return String(foo(10, 'sss', 1));", "argmap"],
  ["argmap-arguments-to-param", "function foo(a) { arguments[0] = 9; return a; } return foo(1);", "argmap"],
  ["argmap-extra-arg-unmapped", "function foo(a) { return String(arguments[1]); } return foo(1, 2);", "argmap"],
  ["argmap-missing-arg-unmapped", "function foo(a, b) { b = 5; return String(arguments.length) + '/' + String(arguments[1]); } return foo(1);", "argmap"],
  ["argmap-length-unaffected", "function foo(a) { a = 2; return arguments.length; } return foo(1, 2, 3);", "argmap"],
  ["argmap-through-generic-join", "function foo(a, b) { a = 7; return Array.prototype.join.call(arguments, ','); } return foo(1, 2);", "argmap"],
  ["argmap-strict-not-mapped", "return (function () { 'use strict'; function foo(a) { a = 1; return String(arguments[0]); } return foo(10); })();", "argmap"],
  ["argmap-delete-unmaps", "function foo(a) { delete arguments[0]; return String(arguments[0]) + '/' + String(a); } return foo(1);", "argmap"],
  ["argmap-accessor-define-unmaps", "var argObj = (function (a, b, c) { return arguments; })(1, 2, 3); var accessed = false; Object.defineProperty(argObj, 0, { get: function () { accessed = true; return 12; } }); return String(argObj[0]) + '/' + String(accessed);", "argmap"],
  ["argmap-value-define-updates", "var out = ''; (function (x) { Object.defineProperty(arguments, '0', { value: 2010, writable: true, enumerable: true, configurable: false }); out = String(arguments[0]) + '/' + String(x); })(1001); return out;", "argmap"],

  // --- JSON.parse follows the JSON grammar, not a lenient subset of JS ------
  ["json-reject-unquoted-key", "try { JSON.parse('{a:1}'); return 'no-throw'; } catch (e) { return e.name; }", "jsonparse"],
  ["json-reject-trailing-comma-array", "try { JSON.parse('[1,]'); return 'no-throw'; } catch (e) { return e.name; }", "jsonparse"],
  ["json-reject-trailing-comma-object", "try { JSON.parse('{\"a\":1,}'); return 'no-throw'; } catch (e) { return e.name; }", "jsonparse"],
  ["json-reject-leading-zero", "try { JSON.parse('01'); return 'no-throw'; } catch (e) { return e.name; }", "jsonparse"],
  ["json-reject-trailing-dot", "try { JSON.parse('1.'); return 'no-throw'; } catch (e) { return e.name; }", "jsonparse"],
  ["json-reject-leading-dot", "try { JSON.parse('.5'); return 'no-throw'; } catch (e) { return e.name; }", "jsonparse"],
  ["json-reject-leading-plus", "try { JSON.parse('+1'); return 'no-throw'; } catch (e) { return e.name; }", "jsonparse"],
  ["json-reject-hex", "try { JSON.parse('0x10'); return 'no-throw'; } catch (e) { return e.name; }", "jsonparse"],
  ["json-reject-single-quotes", "try { JSON.parse(\"'x'\"); return 'no-throw'; } catch (e) { return e.name; }", "jsonparse"],
  ["json-reject-partial-keyword", "try { JSON.parse('tru'); return 'no-throw'; } catch (e) { return e.name; }", "jsonparse"],
  ["json-reject-trailing-junk", "try { JSON.parse('1 2'); return 'no-throw'; } catch (e) { return e.name; }", "jsonparse"],
  ["json-reject-empty", "try { JSON.parse(''); return 'no-throw'; } catch (e) { return e.name; }", "jsonparse"],
  ["json-reject-missing-comma", "try { JSON.parse('[1 2]'); return 'no-throw'; } catch (e) { return e.name; }", "jsonparse"],
  ["json-reject-bad-escape", "try { JSON.parse('\"\\\\x\"'); return 'no-throw'; } catch (e) { return e.name; }", "jsonparse"],
  ["json-accepts-nested", "var v = JSON.parse('{\"a\":{\"b\":[1,2]}}'); return String(v.a.b[1]);", "jsonparse"],
  ["json-accepts-exponent", "return String(JSON.parse('-1.5e-3'));", "jsonparse"],
  ["json-accepts-escapes", "return JSON.parse('\"\\\\u0041\\\\n\"').length + '|' + JSON.parse('\"\\\\u0041\"');", "jsonparse"],
  ["json-accepts-whitespace", "return String(JSON.parse(' \\t\\r\\n{ \"a\" : 1 } ').a);", "jsonparse"],
  ["json-negative-zero", "return String(1 / JSON.parse('-0'));", "jsonparse"],
  ["json-proto-is-ordinary-key", "var x = JSON.parse('{\"__proto__\":[]}'); return String(Array.isArray(x.__proto__));", "jsonparse"],

  // --- direct eval inherits strictness; F.prototype is fully formed ---------
  ["strict-eval-early-error", "return (function () { 'use strict'; try { eval('var arguments;'); return 'no-throw'; } catch (e) { return e.name; } })();", "fnexpr"],
  ["sloppy-eval-no-early-error", "try { eval('var argumentsx;'); return 'no-throw'; } catch (e) { return e.name; }", "fnexpr"],
  ["strict-eval-param-name", "return (function () { 'use strict'; try { eval('var f = function (eval) {};'); return 'no-throw'; } catch (e) { return e.name; } })();", "fnexpr"],
  ["fnproto-constructor-identity", "function F() {} return String(F.prototype.constructor === F);", "fnexpr"],
  ["fnproto-constructor-not-enumerable", "function F() {} var ks = []; for (var k in F.prototype) { ks.push(k); } return String(ks.length);", "fnexpr"],
  ["fnproto-inherits-object-prototype", "Object.defineProperty(Object.prototype, 'zzProbe', { value: 1, configurable: true }); function F() {} var out = String(F.prototype.zzProbe); delete Object.prototype.zzProbe; return out;", "fnexpr"],

  // --- named function expressions, and a constructor returning a function ---
  ["fnexpr-name-visible-inside", "var f = function fact(n) { if (n === 1) { return 1; } return fact(n - 1) * n; }; return f(4);", "fnexpr"],
  ["fnexpr-name-not-leaked", "var f = function fact(n) { return n; }; return typeof fact;", "fnexpr"],
  ["fnexpr-name-shadows-outer", "function fact() { return 'outer'; } var f = function fact() { return typeof fact; }; return f();", "fnexpr"],
  ["ctor-returning-function-wins", "var g = function () { this.first = 1; function h(x) { return x + 1; } return h; }; var i = new g(); return typeof i + '/' + String(i.first) + '/' + String(i(1));", "fnexpr"],
  ["ctor-returning-array-wins", "var g = function () { this.first = 1; return [7]; }; var i = new g(); return String(i.length) + '/' + String(i[0]);", "fnexpr"],
  ["ctor-returning-primitive-ignored", "var g = function () { this.first = 1; return 5; }; var i = new g(); return String(i.first);", "fnexpr"],

  // --- negative zero survives Math ------------------------------------------
  ["mathzero-abs", "return String(1 / Math.abs(-0));", "mathzero"],
  ["mathzero-floor", "return String(1 / Math.floor(-0));", "mathzero"],
  ["mathzero-ceil-neg-frac", "return String(1 / Math.ceil(-0.5));", "mathzero"],
  ["mathzero-ceil-pos-zero", "return String(1 / Math.ceil(0));", "mathzero"],
  ["mathzero-round-neg-half", "return String(1 / Math.round(-0.5));", "mathzero"],
  ["mathzero-round-pos-zero", "return String(1 / Math.round(0));", "mathzero"],
  ["mathzero-round-just-under-half", "var x = 0.5 - Number.EPSILON / 4; return String(1 / Math.round(x));", "mathzero"],
  ["mathzero-round-big-integer", "var x = -(2 / Number.EPSILON - 1); return String(Math.round(x) === x);", "mathzero"],
  ["mathzero-round-ties-up", "return String(Math.round(-1.5)) + ',' + String(Math.round(2.5)) + ',' + String(Math.round(-0.6));", "mathzero"],
  ["mathzero-ceil-floor-agree", "var out = ''; for (var i = -9; i < 0; i++) { var x = i / 10.0; if (Math.ceil(x) !== -Math.floor(-x)) { out += i + ','; } } return out || 'same';", "mathzero"],

  // --- array length, join/toString agreement, and index accessors -----------
  ["array-huge-declared-length", "return String(new Array(4294967295).length);", "arraylen2"],
  ["array-length-too-big-throws", "try { new Array(4294967296); return 'no-throw'; } catch (e) { return e.name; }", "arraylen2"],
  ["array-length-fractional-throws", "try { new Array(1.5); return 'no-throw'; } catch (e) { return e.name; }", "arraylen2"],
  ["array-shrink-drops-far-index", "var x = [0, 1, 2]; x[4294967294] = 4294967294; x.length = 2; return String(x[2]) + '/' + String(x[4294967294]) + '/' + String(x.length);", "arraylen2"],
  ["array-tostring-is-join", "var x = []; x[0] = 0; x[3] = 3; return x.toString() + '|' + x.join();", "arraylen2"],
  ["array-tostring-object-element", "var x = [{ valueOf: function () { return 7; } }]; return x.toString() + '|' + x.join();", "arraylen2"],
  ["array-tostring-nulls", "var x = new Array(null, null, null); return x.toString() + '|' + x.join();", "arraylen2"],
  ["array-tostring-reads-prototype", "Object.defineProperty(Array.prototype, '1', { value: 1, configurable: true }); var x = [0]; x.length = 2; var out = x.toString(); delete Array.prototype[1]; Array.prototype.length = 0; return out;", "arraylen2"],
  ["array-index-accessor-runs", "var arr = [1, 2]; Object.defineProperty(arr, '0', { get: function () { return 9; }, configurable: true }); return String(arr[0]) + '/' + arr.join(',');", "arraylen2"],
  ["array-delete-clears-accessor", "var arr = [1, 2]; Object.defineProperty(arr, '1', { get: function () { return 6; }, configurable: true }); delete arr[1]; return String(arr[1]) + '/' + String(1 in arr);", "arraylen2"],
  ["array-hex-string-length", "var obj = { 1: 11, 2: 9, length: '0x0002' }; var seen = ''; Array.prototype.forEach.call(obj, function (v) { seen += v; }); return seen;", "arraylen2"],
  ["array-isarray-prototype", "return String(Array.isArray(Array.prototype));", "arraylen2"],
  ["array-prototype-length", "return String(Array.prototype.length);", "arraylen2"],

  // --- an invalid RegExp pattern is a SyntaxError at construction ------------
  ["rx-double-star", "try { new RegExp('a**'); return 'no-throw'; } catch (e) { return e.name; }", "rxvalid"],
  ["rx-double-plus", "try { new RegExp('a++'); return 'no-throw'; } catch (e) { return e.name; }", "rxvalid"],
  ["rx-triple-question", "try { new RegExp('a???'); return 'no-throw'; } catch (e) { return e.name; }", "rxvalid"],
  ["rx-leading-star", "try { new RegExp('*a'); return 'no-throw'; } catch (e) { return e.name; }", "rxvalid"],
  ["rx-leading-question", "try { new RegExp('?a'); return 'no-throw'; } catch (e) { return e.name; }", "rxvalid"],
  ["rx-bound-out-of-order", "try { new RegExp('0{2,1}'); return 'no-throw'; } catch (e) { return e.name; }", "rxvalid"],
  ["rx-bound-then-bound", "try { new RegExp('x{1,2}{1}'); return 'no-throw'; } catch (e) { return e.name; }", "rxvalid"],
  ["rx-class-range-out-of-order", "try { new RegExp('[b-a]'); return 'no-throw'; } catch (e) { return e.name; }", "rxvalid"],
  ["rx-class-second-range-out-of-order", "try { new RegExp('[a-dc-b]'); return 'no-throw'; } catch (e) { return e.name; }", "rxvalid"],
  ["rx-trailing-backslash", "try { new RegExp('\\\\'); return 'no-throw'; } catch (e) { return e.name; }", "rxvalid"],
  ["rx-unknown-flag", "try { new RegExp('a', 'z'); return 'no-throw'; } catch (e) { return e.name; }", "rxvalid"],
  ["rx-duplicate-flag", "try { new RegExp('a', 'ii'); return 'no-throw'; } catch (e) { return e.name; }", "rxvalid"],
  ["rx-lazy-is-legal", "return new RegExp('a*?').source;", "rxvalid"],
  ["rx-class-escape-dash-is-legal", "return new RegExp('[\\\\d-G]').source;", "rxvalid"],
  ["rx-lone-brace-is-literal", "return String(new RegExp('x{').test('x{'));", "rxvalid"],
  ["rx-good-flags", "var r = new RegExp('a', 'gim'); return String(r.global) + String(r.ignoreCase) + String(r.multiline);", "rxvalid"],
  ["rx-call-form-is-identity", "var re = /x/i; var i2 = RegExp(re); re.indicator = 1; return String(i2.indicator);", "rxvalid"],
  ["rx-new-form-copies", "var re = /x/i; var i2 = new RegExp(re); re.indicator = 1; return String(i2.indicator);", "rxvalid"],
  ["rx-not-callable", "try { var q = /a/(); return 'no-throw'; } catch (e) { return e.name; }", "rxvalid"],
  ["rx-not-constructible", "try { var q = new /a/(); return 'no-throw'; } catch (e) { return e.name; }", "rxvalid"],
  ["rx-exec-needs-regexp", "var o = {}; o.exec = RegExp.prototype.exec; try { o.exec('x'); return 'no-throw'; } catch (e) { return e.name; }", "rxvalid"],
  ["rx-test-needs-regexp", "var o = {}; o.test = RegExp.prototype.test; try { o.test('x'); return 'no-throw'; } catch (e) { return e.name; }", "rxvalid"],
  ["rx-constructor-length", "return String(RegExp.length);", "rxvalid"],
  ["rx-constructor-alias-constructs", "var F = RegExp.prototype.constructor; var i = new F(); return String(i instanceof RegExp);", "rxvalid"],

  // --- a pending exception is never replaced by a later one ------------------
  ["throw-arg-throws-first", "try { throw new Error('x' + (new RegExp('a**'))); } catch (e) { return e.name; }", "rxvalid"],
  ["receiver-throw-beats-typeerror", "try { return String(new RegExp('[b-a]').exec('a')); } catch (e) { return e.name; }", "rxvalid"],
  ["call-arg-throw-propagates", "function f(x) { return 'called'; } try { return f(new RegExp('a**')); } catch (e) { return e.name; }", "rxvalid"],

  // --- a built-in prototype stringifies like the value it stands for, and
  // never leaks the engine's own debug rendering. -----------------------------
  ["protostr-error-prototype", "return String(Error.prototype);", "protostr"],
  ["protostr-typeerror-prototype", "return String(TypeError.prototype);", "protostr"],
  ["protostr-regexp-prototype", "return String(RegExp.prototype);", "protostr"],
  ["protostr-number-prototype", "return String(Number.prototype);", "protostr"],
  ["protostr-boolean-prototype", "return String(Boolean.prototype);", "protostr"],
  ["protostr-array-prototype", "return String(Array.prototype);", "protostr"],
  ["protostr-string-prototype", "return String(String.prototype);", "protostr"],
  ["protostr-math", "return String(Math);", "protostr"],
  ["protostr-date-prototype-throws", "try { return String(Date.prototype); } catch (e) { return e.name; }", "protostr"],
  ["protostr-error-instance", "return String(new TypeError('boom'));", "protostr"],

  // --- indirect eval --------------------------------------------------------
  ["eval-as-value", "var me = eval; return String(me('1 + 1'));", "indirecteval"],
  ["eval-comma-form", "return String((0, eval)('2 + 2'));", "indirecteval"],
  ["eval-call-form", "return String(eval.call(null, '3 + 3'));", "indirecteval"],
  ["eval-indirect-not-caller-scope", "function g() { var loc = 7; var me = eval; return String(me('typeof loc')); } return g();", "indirecteval"],
  ["eval-direct-sees-caller-scope", "function g() { var loc = 7; return String(eval('loc')); } return g();", "indirecteval"],
  ["eval-non-string-passthrough", "var me = eval; return String(me(42));", "indirecteval"],

  // --- §12.14: a catch clause scopes its PARAMETER, nothing else ------------
  ["catchvar-outlives-clause", "try { throw 1; } catch (e) { var v = 'kept'; } return String(v);", "catchvar"],
  ["catchvar-typeof-after", "try { throw 1; } catch (e) { var v2 = 1; } return typeof v2;", "catchvar"],
  ["catchvar-param-shadows", "try { throw 1; } catch (e) { var e = 5; } return String(typeof e);", "catchvar"],
  ["catchvar-param-not-leaked", "try { throw 9; } catch (e) { ; } return String(typeof e);", "catchvar"],
  ["catchvar-hoisted-before-clause", "var r = typeof v3; try { throw 1; } catch (e) { var v3 = 2; } return String(r);", "catchvar"],
  ["catchvar-let-stays-in-clause", "try { throw 1; } catch (e) { let q = 3; } return String(typeof q);", "catchvar"],
  ["catchvar-nested", "try { throw 1; } catch (a) { try { throw 2; } catch (b) { var z = 8; } } return String(z);", "catchvar"],
  ["catchvar-assign-param", "var got = ''; try { throw 1; } catch (e) { e = 7; got = String(e); } return got;", "catchvar"],

  // --- §12.12: a label on a BLOCK is the block's, not the first statement's --
  ["label-block-break-from-loop", "var i = 0; wo: { do { i++; if (i === 10) { break wo; } } while (true); i = 99; } return String(i);", "labelblock"],
  ["label-block-break-from-while", "var n = 0; lb: { while (true) { n++; if (n === 3) { break lb; } } n = 99; } return String(n);", "labelblock"],
  ["label-block-break-from-for", "var s = 0; lc: { for (var k = 0; k < 9; k++) { s += k; if (k === 2) { break lc; } } s = 99; } return String(s);", "labelblock"],
  ["label-loop-keeps-own-label", "var t = 0; ld: for (var m = 0; m < 3; m++) { for (var p = 0; p < 3; p++) { if (p === 1) { continue ld; } t++; } } return String(t);", "labelblock"],
  ["label-block-inner-loop-unlabelled-break", "var u = 0; le: { for (var w = 0; w < 3; w++) { break; } u = 5; } return String(u);", "labelblock"],

  // --- §7.9.1: a LineTerminator after `return` inserts a semicolon ----------
  ["asi-return-newline", "function f() { return\n1; } return String(f());", "asireturn"],
  ["asi-return-same-line", "function f() { return 1; } return String(f());", "asireturn"],
  ["asi-return-newline-object", "function f() { return\n{ a: 1 }; } return String(f());", "asireturn"],
  ["asi-return-paren-same-line", "function f() { return (\n1); } return String(f());", "asireturn"],

  // --- §10.6: deleting a mapped index unlinks it for good -------------------
  ["argmap-delete-then-set", "function f(a) { delete arguments[0]; arguments[0] = 'A'; return String(arguments[0]); } return f(1);", "argmap"],
  ["argmap-delete-then-set-param-untouched", "function f(a) { delete arguments[0]; arguments[0] = 'A'; return String(a); } return f(1);", "argmap"],
  ["argmap-delete-reads-undefined", "function f(a) { delete arguments[0]; return String(arguments[0]); } return f(1);", "argmap"],
  ["argmap-no-delete-still-mapped", "function f(a) { arguments[0] = 'A'; return String(a); } return f(1);", "argmap"],

  // --- §14.1: a directive is matched against the RAW text -------------------
  ["directive-escape-not-strict", "function f() { '\\u0075se strict'; return this === undefined; } return String(f.call(undefined));", "directive"],
  ["directive-space-escape-not-strict", "function f() { 'use\\u0020strict'; return this === undefined; } return String(f.call(undefined));", "directive"],
  ["directive-continuation-not-strict", "function f() { 'use str\\\nict'; return this === undefined; } return String(f.call(undefined));", "directive"],
  ["directive-plain-is-strict", "function f() { 'use strict'; return this === undefined; } return String(f.call(undefined));", "directive"],
  // A function built by the Function constructor never inherits the caller's
  // strictness.
  ["fnctor-body-is-sloppy-in-strict-caller", "function outer() { 'use strict'; return Function('return typeof this;')(); } return String(outer());", "directive"],
  ["fnctor-own-directive-is-strict", "var f = Function('\"use strict\"; return this;'); return String(f() === undefined);", "directive"],

  // --- §7.3: every LineTerminator ends a single-line comment ----------------
  ["comment-ends-at-cr", "var y = 0; eval('//c\\ry = 1'); return String(y);", "comments"],
  ["comment-ends-at-ls", "var y = 0; eval('//c\\u2028y = 1'); return String(y);", "comments"],
  ["comment-ends-at-ps", "var y = 0; eval('//c\\u2029y = 1'); return String(y);", "comments"],
  ["comment-swallows-non-terminator", "var y = 0; eval('//c\\u0009y = 1'); return String(y);", "comments"],

  // --- read-only built-in properties refuse writes --------------------------
  ["number-nan-is-readonly", "Number.NaN = 1; return String(Number.NaN !== Number.NaN);", "readonly"],
  ["number-max-value-is-readonly", "Number.MAX_VALUE = 1; return String(Number.MAX_VALUE);", "readonly"],
  ["error-ctor-length", "return String(Error.length) + String(TypeError.length);", "readonly"],
  ["error-proto-desc-writable", "return String(Object.getOwnPropertyDescriptor(EvalError, 'prototype').writable);", "readonly"],
  ["global-nan-write-sloppy-ignored", "NaN = 12; return String(NaN !== NaN);", "readonly"],
  ["global-undefined-write-sloppy-ignored", "undefined = 12; return String(typeof undefined);", "readonly"],

  // --- §10.4.2: sloppy eval declares into the CALLER's variable environment -
  // `var x;` in sloppy eval creates a LOCAL binding even when an outer scope
  // already has that name — it does not silently resolve outwards.
  ["eval-bare-var-shadows-outer", "var x = 1; function g() { eval('var x;'); return String(x); } return g();", "evalvar"],
  ["eval-bare-var-then-assign-is-local", "var x = 1; function g() { eval('var x;'); x = 2; return String(x); } return g() + '/' + String(x);", "evalvar"],
  ["eval-var-visible-to-caller", "function g() { eval('var ev = 5;'); return String(ev); } return g();", "evalvar"],
  ["eval-fn-visible-to-caller", "function g() { eval('function ef() { return 3; }'); return String(ef()); } return g();", "evalvar"],
  ["eval-strict-var-not-visible", "function g() { 'use strict'; eval('var sv = 5;'); return String(typeof sv); } return g();", "evalvar"],

  // --- VM re-entry: user code reached THROUGH an operation inside a compiled
  // body (getter, setter, valueOf, toString) must not corrupt the caller's
  // frame. These caught a real clobber: helper call-outs from the bytecode VM
  // ran nested compiled frames on top of the caller's live slots.
  ["reentry-getter", "var o = { get g() { var a = 1; var b = 2; return 10; } }; function f() { var x = 5; var y = 42; var z = o.g; return x + ',' + y + ',' + z; } return f();", "vmreentry"],
  ["reentry-setter", "var hit = 0; var o = { set s(v) { var c = 3; hit = v + c; } }; function f() { var x = 5; var y = 6; o.s = 1; return x + ',' + y + ',' + hit; } return f();", "vmreentry"],
  ["reentry-valueof-add", "var vo = { valueOf: function () { var a = 7; var b = 8; return 100; } }; function f() { var x = 5; var y = 6; var t = vo + 1; return x + ',' + y + ',' + t; } return f();", "vmreentry"],
  ["reentry-valueof-compare", "var vo = { valueOf: function () { var a = 7; return 100; } }; function f() { var x = 5; var y = 6; var t = vo < 200; return x + ',' + y + ',' + t; } return f();", "vmreentry"],
  ["reentry-valueof-inc", "var vo = { valueOf: function () { var a = 7; return 100; } }; function f() { var x = 5; var y = 6; var c = vo; c++; return x + ',' + y + ',' + c; } return f();", "vmreentry"],
  ["reentry-valueof-neg", "var vo = { valueOf: function () { var a = 7; return 100; } }; function f() { var x = 5; var y = 6; var t = -vo; return x + ',' + y + ',' + t; } return f();", "vmreentry"],
  ["reentry-valueof-addput", "var vo = { valueOf: function () { var a = 7; return 100; } }; function f() { var x = 5; var y = 6; var s = 1; s += vo; return x + ',' + y + ',' + s; } return f();", "vmreentry"],
  ["reentry-getter-into-array", "var o = { get g() { var a = 1; var b = 2; return 10; } }; function f(p, q) { var arr = [7]; arr[0] = arr[0] + o.g; return p + ',' + q + ',' + arr[0]; } return f(9, 11);", "vmreentry"],

  // --- compiled member/element access agrees with the walker on the edge
  // shapes: misses read undefined (never null), sparse writes pad and move
  // length, non-canonical string keys are properties, arguments-mapped
  // indexes alias parameters through compiled callees, and the array
  // push/pop inline cache respects overrides and own properties.
  ["vmelem-miss-empty-array", "function f() { var a = []; return '' + a[0]; } return f();", "vmelem"],
  ["vmelem-noncanonical-key", "function f() { var a = [4, 5]; return '' + a['1'] + ',' + a['01']; } return f();", "vmelem"],
  ["vmelem-primitive-miss", "function f() { var s = 'ab'; var n = 5; return '' + s.foo + ',' + n.foo; } return f();", "vmelem"],
  ["vmelem-sparse-write", "function f() { var a = []; a[5] = 7; return a.length + ',' + a[0] + ',' + a[5]; } return f();", "vmelem"],
  ["vmelem-frac-neg-keys", "function f() { var a = [1, 2]; a[-1] = 5; a[0.5] = 9; return '' + a[-1] + ',' + a[0.5] + ',' + a.length + ',' + a[0]; } return f();", "vmelem"],
  ["vmelem-argmap-through-call", "function writer(a) { a[0] = 99; return a[0]; } function outer(x, y) { var w = writer(arguments); return x + ',' + y + ',' + w; } return outer(1, 2);", "vmelem"],
  ["vmic-push-override", "function f() { var a = [1]; var old = Array.prototype.push; Array.prototype.push = function (v) { this[this.length] = v * 100; return this.length; }; a.push(2); Array.prototype.push = old; a.push(3); return a.join(','); } return f();", "vmelem"],
  ["vmic-own-push-wins", "function f() { var a = [1]; a.push = function (v) { return 'own:' + v; }; return a.push(9) + ',' + a.length; } return f();", "vmelem"],
  ["vmic-pop-empty", "function f() { var a = []; return '' + a.pop() + ',' + a.length; } return f();", "vmelem"],

  // --- the compiled long tail: break/continue in every loop kind,
  // try/catch/throw (nested, rethrow, across calls, inside loops),
  // for-in with the walker's snapshot + delete semantics, for-of over
  // arrays and strings. finally and labels stay on the walker.
  ["vmlt-break", "function f() { var s = 0; for (var i = 0; i < 100; i++) { if (i == 7) break; s = s + i; } return s; } return f();", "vmlongtail"],
  ["vmlt-continue", "function f() { var s = 0; for (var i = 0; i < 10; i++) { if (i % 2 == 0) continue; s = s + i; } return s; } return f();", "vmlongtail"],
  ["vmlt-while-true-break", "function f() { var i = 0; var s = 0; while (true) { i++; if (i > 5) break; if (i == 2) continue; s = s + i; } return s + ',' + i; } return f();", "vmlongtail"],
  ["vmlt-dowhile", "function f() { var i = 0; var s = 0; do { i++; if (i == 3) continue; s = s + i; } while (i < 6); return s + ',' + i; } return f();", "vmlongtail"],
  ["vmlt-catch-typeerror", "function f() { try { null.x; } catch (e) { return 'c:' + (e instanceof TypeError); } return 'no'; } return f();", "vmlongtail"],
  ["vmlt-throw-string", "function f() { var r = ''; try { r += 'a'; throw 'boom'; } catch (err) { r += 'c:' + err; } return r; } return f();", "vmlongtail"],
  ["vmlt-throw-across-call", "function inner3() { throw 42; } function f() { try { return inner3(); } catch (e) { return 'outer:' + e; } } return f();", "vmlongtail"],
  ["vmlt-try-in-loop", "function f() { var n = 0; for (var i = 0; i < 5; i++) { try { if (i == 2) throw i; n = n + 10; } catch (e) { n = n + e; } } return n; } return f();", "vmlongtail"],
  ["vmlt-nested-rethrow", "function f() { try { try { throw 'in'; } catch (a) { throw 're:' + a; } } catch (b) { return b; } } return f();", "vmlongtail"],
  ["vmlt-break-inside-try", "function f() { var s = ''; while (true) { try { s += 'x'; break; } catch (e) { s += 'bad'; } } try { null.x; } catch (e2) { s += '!ok'; } return s; } return f();", "vmlongtail"],
  ["vmlt-throw-object", "function f() { try { throw { code: 5 }; } catch (e) { return e.code; } } return f();", "vmlongtail"],
  ["vmlt-forin-order", "function f() { var o = { a: 1, b: 2, c: 3 }; var s = ''; for (var k in o) { s += k + ':' + o[k] + ';'; } return s; } return f();", "vmlongtail"],
  ["vmlt-forin-break-continue", "function f() { var o = { x: 1, y: 2, z: 3 }; var s = ''; for (var k in o) { if (k == 'y') continue; if (k == 'z') break; s += k; } return s; } return f();", "vmlongtail"],
  ["vmlt-forin-array", "function f() { var a = [10, 20, 30]; var s = ''; for (var i in a) { s += i + '=' + a[i] + ','; } return s; } return f();", "vmlongtail"],
  ["vmlt-forin-delete", "function f() { var o = { p: 1, q: 2, r: 3 }; var s = ''; for (var k in o) { s += k; delete o.r; } return s; } return f();", "vmlongtail"],
  ["vmlt-forof-array", "function f() { var a = [3, 5, 7]; var s = 0; for (var v of a) { s = s + v; } return s; } return f();", "vmlongtail"],
  ["vmlt-forof-string", "function f() { var s = ''; for (var ch of 'abc') { s += ch + '.'; } return s; } return f();", "vmlongtail"],
  ["vmlt-forof-break", "function f() { var a = [1, 2, 3, 4]; var s = 0; for (var v of a) { if (v == 3) break; s = s + v; } return s; } return f();", "vmlongtail"],
  ["vmlt-finally-still-walker", "function f() { var r = ''; try { r += 't'; } finally { r += 'f'; } return r; } return f();", "vmlongtail"],

  // --- switch and try/finally in compiled bodies: fall-through, default
  // anywhere, continue passing through a switch to its loop, finally on
  // the normal / caught / replacing-throw / cross-function paths.
  ["vmsw-fallthrough", "function f(x) { var r = ''; switch (x) { case 1: r += 'a'; case 2: r += 'b'; break; case 3: r += 'c'; default: r += 'd'; } return r; } return f(1) + ',' + f(2) + ',' + f(3) + ',' + f(9);", "vmswitch"],
  ["vmsw-default-first", "function f(x) { switch (x) { default: return 'def'; case 1: return 'one'; } } return f(1) + ',' + f(7);", "vmswitch"],
  ["vmsw-strict-eq", "function f(x) { var r = ''; switch (x) { case 's': r = 'str'; break; case null: r = 'nul'; break; case undefined: r = 'und'; break; } return r + '!'; } return f('s') + ',' + f(null) + ',' + f(undefined) + ',' + f(0);", "vmswitch"],
  ["vmsw-continue-through", "function f() { var s = 0; for (var i = 0; i < 6; i++) { switch (i % 3) { case 0: s += 100; break; case 1: continue; case 2: s += i; break; } s += 1; } return s; } return f();", "vmswitch"],
  ["vmfin-normal", "function f() { var r = ''; try { r += 't'; } finally { r += 'f'; } return r; } return f();", "vmfinally"],
  ["vmfin-caught-then-finally", "function f() { var r = ''; try { r += 't'; null.x; r += 'X'; } catch (e) { r += 'c'; } finally { r += 'f'; } return r; } return f();", "vmfinally"],
  ["vmfin-runs-before-outer-catch", "function f() { var r = ''; try { try { r += 't'; throw 'e1'; } finally { r += 'f'; } } catch (e) { r += 'c:' + e; } return r; } return f();", "vmfinally"],
  ["vmfin-throw-replaces", "function f() { var r = ''; try { try { throw 'orig'; } finally { r += 'f'; throw 'repl'; } } catch (e) { return r + '|' + e; } } return f();", "vmfinally"],
  ["vmfin-loop-inside-try", "function f() { var r = ''; try { for (var i = 0; i < 3; i++) { if (i == 1) continue; r += i; } } finally { r += 'f'; } return r; } return f();", "vmfinally"],
  ["vmfin-cross-function", "function inner7() { var r = ''; try { throw 'deep'; } finally { r += 'fin'; } } function f() { try { return inner7(); } catch (e) { return 'caught:' + e; } } return f();", "vmfinally"],

  // --- Unicode strings ------------------------------------------------------
  // A JS string is a sequence of UTF-16 CODE UNITS, and none of the three host
  // languages agrees with that: C++ std::string is bytes, Rust String iterates
  // characters, and only JS itself speaks units. Every probe here is one the
  // targets used to answer differently FROM EACH OTHER, which is the real
  // hazard -- not a missing feature but the same program meaning different
  // things depending on where it runs.
  //
  // The groups map one-to-one onto the paths that reach a character: the index
  // translation, the relational operator, the padding pair, the casing tables
  // and the regular-expression engine. Each was its own way of reaching the
  // text, and each had to be routed separately.
  ["uni-len-latin1", "return 'héllo'.length;", "unicode"],
  ["uni-len-cjk", "return '日本語'.length;", "unicode"],
  ["uni-len-astral", "return '𝒜'.length;", "unicode"],
  ["uni-len-emoji", "return '😀'.length;", "unicode"],
  ["uni-len-mixed", "return '第1章 — 𝒜 is a set 😀'.length;", "unicode"],
  ["uni-indexof", "return 'héllo wörld'.indexOf('l');", "unicode"],
  ["uni-indexof-cjk", "return 'a日b'.indexOf('b');", "unicode"],
  ["uni-lastindexof", "return 'héllo'.lastIndexOf('l');", "unicode"],
  ["uni-slice", "return 'héllo wörld'.slice(0, 5);", "unicode"],
  ["uni-slice-negative", "return 'héllo'.slice(-3);", "unicode"],
  ["uni-substring", "return 'héllo'.substring(1, 3);", "unicode"],
  ["uni-charat", "return 'héllo'.charAt(1);", "unicode"],
  ["uni-charcodeat", "return 'héllo'.charCodeAt(1);", "unicode"],
  ["uni-codepointat-astral", "return '𝒜b'.codePointAt(0);", "unicode"],
  ["uni-at-negative", "return 'héllo wörld'.at(-1);", "unicode"],
  ["uni-split-empty", "return 'héllo'.split('').join('-');", "unicode"],
  ["uni-spread", "return [...'héllo'].length;", "unicode"],
  ["uni-spread-astral", "return [...'a𝒜b'].length;", "unicode"],
  ["uni-for-of", "var s = ''; for (var c of 'é日') { s += c + '.'; } return s;", "unicode"],
  ["uni-reverse", "return 'héllo'.split('').reverse().join('');", "unicode"],
  ["uni-fromcharcode", "return String.fromCharCode(233, 0x65E5);", "unicode"],
  ["uni-fromcodepoint-len", "return String.fromCodePoint(0x1D49C).length;", "unicode"],
  ["uni-concat-len", "return ('é' + '日').length;", "unicode"],
  ["uni-repeat-len", "return 'é'.repeat(3).length;", "unicode"],
  ["uni-trim-len", "return '  é  '.trim().length;", "unicode"],
  ["uni-json-roundtrip", "return JSON.parse(JSON.stringify({ 'clé': 'café — 日本' })).clé;", "unicode"],
  ["uni-encodeuri", "return encodeURIComponent('café/日本');", "unicode"],

  // Relational comparison is its own path: it never went through the index
  // layer, so on the byte target it compared SIGNED bytes and 'é' < 'z' came
  // out true. That is what scrambled a sorted index.
  ["uni-lt-latin1", "return 'é' < 'z';", "unicode"],
  ["uni-gt-ascii", "return 'Z' < 'é';", "unicode"],
  ["uni-lt-cjk", "return 'a' < '日';", "unicode"],
  ["uni-lt-astral", "return '\\uFFFD' < '𝒜';", "unicode"],
  ["uni-sort-default", "return ['é', 'z', 'a', '日'].sort().join('|');", "unicode"],
  ["uni-sort-index", "return ['Zürich', 'apple', 'Éclair', 'Ångström', 'banana', 'Ostrich'].sort().join('|');", "unicode"],
  ["uni-cmp-prefix", "return 'café' < 'cafés';", "unicode"],
  ["uni-cmp-equal", "return ('é' < 'é') + ',' + ('é' > 'é');", "unicode"],
  ["uni-cmp-ge", "return ('日' >= '日') + ',' + ('日' <= '日');", "unicode"],

  // padStart / padEnd count units, not bytes: on the byte target 'é' already
  // measured 2 toward the width, so the column never lined up.
  ["uni-padstart", "return 'é'.padStart(4, '.');", "unicode"],
  ["uni-padend", "return '日本'.padEnd(5, '·');", "unicode"],
  ["uni-padstart-multi-unit-filler", "return 'x'.padStart(5, 'é');", "unicode"],
  ["uni-padend-len", "return '日本'.padEnd(5, '·').length;", "unicode"],
  ["uni-padstart-noop", "return 'héllo'.padStart(3, '.');", "unicode"],

  // Casing needs the Unicode tables, not a rule: ß uppercases to two letters
  // and Turkish İ lowercases to two units.
  ["uni-upper-latin1", "return 'café société'.toUpperCase();", "unicode"],
  ["uni-lower-latin1", "return 'CAFÉ SOCIÉTÉ'.toLowerCase();", "unicode"],
  ["uni-upper-sharp-s", "return 'Straße'.toUpperCase();", "unicode"],
  ["uni-upper-oslash", "return 'Ærø'.toUpperCase();", "unicode"],
  ["uni-lower-dotless", "return 'IŞIK'.toLowerCase();", "unicode"],
  ["uni-upper-greek", "return 'αβγδ'.toUpperCase();", "unicode"],
  ["uni-lower-cyrillic", "return 'ПРИВЕТ'.toLowerCase();", "unicode"],
  ["uni-upper-extended-a", "return 'ąćęłńóśźż'.toUpperCase();", "unicode"],
  ["uni-case-roundtrip", "return 'Grüße'.toUpperCase().toLowerCase();", "unicode"],
  ["uni-upper-cjk-noop", "return '日本'.toUpperCase();", "unicode"],
  ["uni-upper-len", "return 'Straße'.toUpperCase().length;", "unicode"],
  ["uni-case-insensitive-dedup", "var seen = {}; var out = []; var idx = ['Éclair', 'eclair', 'ÉCLAIR', 'Zebra']; for (var i = 0; i < idx.length; i++) { var k = idx[i].toLowerCase(); if (!seen[k]) { seen[k] = 1; out.push(idx[i]); } } return out.join('|');", "unicode"],

  // The regular-expression engine reaches the text by its own path too, so a
  // byte-indexed matcher split characters in half: /\w+/ over 'naïve' answered
  // ['na', 've'] with the ï's two bytes counted as a word boundary and a
  // stray character.
  ["uni-re-word", "return 'naïve café'.match(/\\w+/g).join(',');", "unicode"],
  ["uni-re-dot-count", "return 'é日x'.match(/./g).length;", "unicode"],
  ["uni-re-literal", "return /ï/.test('naïve');", "unicode"],
  ["uni-re-replace", "return 'naïve'.replace(/ï/, 'i');", "unicode"],
  ["uni-re-anchor", "return /^é+$/.test('éé');", "unicode"],
  ["uni-re-search", "return 'héllo wörld'.search(/ö/);", "unicode"],
  ["uni-re-split", "return 'a—b—c'.split(/—/).join('|');", "unicode"],
  ["uni-re-class", "return 'aébé'.replace(/[é]/g, 'E');", "unicode"],
  ["uni-re-class-negated", "return 'aébé'.replace(/[^é]/g, '.');", "unicode"],
  ["uni-re-index", "var m = /ö/.exec('héllo wörld'); return m.index;", "unicode"],
  ["uni-re-lastindex", "var r = /l/g; r.exec('héllo'); return r.lastIndex;", "unicode"],
  ["uni-re-escape-match", "return /\\u00FF/.exec('\\u00FF')[0].charCodeAt(0);", "unicode"],
  ["uni-re-quantifier", "return 'ééé'.replace(/é{2}/, 'X');", "unicode"],
  ["uni-re-alternation", "return '日本'.replace(/日|本/g, '.');", "unicode"],
  ["uni-re-capture", "var m = /(é)(l)/.exec('héllo'); return m[1] + m[2] + ':' + m.index;", "unicode"],
  ["uni-re-global-count", "return ('日a日b日'.match(/日/g) || []).length;", "unicode"],
  ["uni-re-replace-fn-offset", "return 'héllo'.replace(/l/, function (m, off) { return '[' + off + ']'; });", "unicode"],

  // normalize() existed as a no-op, which is worse than not existing: "café"
  // typed with a combining accent and "café" typed with the precomposed letter
  // are the same word, they compared unequal, and the one call that exists to
  // fix that quietly did nothing.
  ["uni-nfc-composes", "return 'cafe\u0301'.normalize('NFC') === 'caf\u00e9';", "unicode"],
  ["uni-nfd-decomposes", "return 'caf\u00e9'.normalize('NFD') === 'cafe\u0301';", "unicode"],
  ["uni-nfd-length", "return 'caf\u00e9'.normalize('NFD').length;", "unicode"],
  ["uni-nfc-idempotent", "return '\u00c5'.normalize('NFD').normalize('NFC') === '\u00c5';", "unicode"],
  ["uni-nfc-angstrom", "return '\u212b'.normalize('NFC').charCodeAt(0);", "unicode"],
  ["uni-nfd-reorders", "return 'q\u0307\u0323'.normalize('NFD') === 'q\u0323\u0307';", "unicode"],
  ["uni-nfc-multi-accent", "return 'q\u0307\u0323'.normalize('NFC').length;", "unicode"],
  ["uni-nfd-hangul", "return '\uac01'.normalize('NFD').length;", "unicode"],
  ["uni-nfc-hangul", "return '\u1100\u1161\u11a8'.normalize('NFC') === '\uac01';", "unicode"],
  ["uni-nfc-kannada", "return '\u0cc6\u0cc2\u0cd5'.normalize('NFC').charCodeAt(0);", "unicode"],
  ["uni-nfc-exclusion", "return '\u0f76'.normalize('NFC').length;", "unicode"],
  ["uni-nfc-ascii-untouched", "return 'abc'.normalize('NFD');", "unicode"],
  ["uni-nfc-sharp-s", "return 'Stra\u00dfe'.normalize('NFC');", "unicode"],
  ["uni-normalize-bad-form", "try { 'a'.normalize('NFX'); return 'no-throw'; } catch (e) { return e.name; }", "unicode"],

  // localeCompare was a code-unit comparison, which is the one thing it is
  // specified NOT to be: every accented word sorted after every unaccented
  // one, so an index came out with Éclair and Ångström in a clump at the end
  // rather than under E and A.
  ["uni-coll-accent-under-letter", "return 'é'.localeCompare('z');", "unicode"],
  ["uni-coll-case-after-lower", "return 'a'.localeCompare('B');", "unicode"],
  ["uni-coll-accent-secondary", "return 'resume'.localeCompare('résumé');", "unicode"],
  ["uni-coll-accent-order", "return 'é'.localeCompare('è');", "unicode"],
  ["uni-coll-stroke-under-o", "return 'Ø'.localeCompare('z');", "unicode"],
  ["uni-coll-expansion", "return 'Straße'.localeCompare('Strasse');", "unicode"],
  ["uni-coll-equal", "return 'x'.localeCompare('x');", "unicode"],
  ["uni-coll-sort-index", "return ['Zürich', 'apple', 'Éclair', 'Ångström', 'banana', 'Ostrich'].sort(function (a, b) { return a.localeCompare(b); }).join('|');", "unicode"],
  ["uni-coll-case-tiebreak", "return ['eclair', 'ECLAIR', 'Éclair'].sort(function (a, b) { return a.localeCompare(b); }).join('|');", "unicode"],
  ["uni-coll-greek", "return ['ΟΔΟΣ', 'οδος', 'άλφα'].sort(function (a, b) { return a.localeCompare(b); }).join('|');", "unicode"],
  ["uni-coll-cyrillic", "return ['ПРИВЕТ', 'привет', 'мир'].sort(function (a, b) { return a.localeCompare(b); }).join('|');", "unicode"],
  ["uni-coll-punct-before-digit", "return ['1', '_', '.'].sort(function (a, b) { return a.localeCompare(b); }).join('|');", "unicode"],
  // toLocaleLowerCase/UpperCase have no locale data behind them, so they are
  // the plain ones -- but they must be the plain ones as THIS engine defines
  // them. Left on the host's case function they were the only two string
  // methods still answering 'cafÉ' where toLowerCase answered 'café'.
  ["uni-locale-lower", "return 'CAFÉ SOCIÉTÉ'.toLocaleLowerCase();", "unicode"],
  ["uni-locale-upper", "return 'Straße'.toLocaleUpperCase();", "unicode"],
  ["uni-locale-sigma", "return 'ΟΔΟΣ'.toLocaleLowerCase();", "unicode"],
  ["uni-locale-matches-plain", "var s = 'Grüße İstanbul ΟΔΟΣ'; return s.toLocaleUpperCase() === s.toUpperCase() && s.toLocaleLowerCase() === s.toLowerCase();", "unicode"],
  // ToUint16 through a double: the integer path clamps at the 32-bit maximum.
  ["uni-fromcharcode-touint16", "return String.fromCharCode(4294967294).charCodeAt(0);", "unicode"],
  ["uni-fromcharcode-negative", "return String.fromCharCode(-5.4321).charCodeAt(0);", "unicode"],
  ["uni-fromcharcode-big", "return String.fromCharCode(Math.pow(2, 40) + 65).charCodeAt(0);", "unicode"],

  // localeCompare's second argument was dropped on the floor, so a Swedish
  // index asked for in Swedish came back in root order. The root order is
  // right for en/fr/de/it/nl/pt -- their alphabets ARE the root alphabet -- and
  // wrong for every language that tailors it.
  ["uni-tailor-sv", "return ['apa', 'bok', 'zebra', 'åka', 'ängel', 'öl'].sort(function (a, b) { return a.localeCompare(b, 'sv'); }).join('|');", "unicode"],
  ["uni-tailor-da", "return ['and', 'bo', 'zoo', 'æble', 'ø', 'års'].sort(function (a, b) { return a.localeCompare(b, 'da'); }).join('|');", "unicode"],
  ["uni-tailor-fi", "return ['auto', 'valo', 'zebra', 'åka', 'ähtäri', 'öljy'].sort(function (a, b) { return a.localeCompare(b, 'fi'); }).join('|');", "unicode"],
  ["uni-tailor-cs-ch", "return ['cukr', 'čaj', 'hora', 'chleba', 'ráno'].sort(function (a, b) { return a.localeCompare(b, 'cs'); }).join('|');", "unicode"],
  ["uni-tailor-hu-digraph", "return ['cukor', 'csok', 'daru', 'dzsem', 'zab', 'zsir'].sort(function (a, b) { return a.localeCompare(b, 'hu'); }).join('|');", "unicode"],
  ["uni-tailor-pl", "return ['akta', 'ąkra', 'łoś', 'lampa', 'zebra', 'źle', 'żaba'].sort(function (a, b) { return a.localeCompare(b, 'pl'); }).join('|');", "unicode"],
  ["uni-tailor-tr-dotless", "return ['ışık', 'ilik', 'iyi'].sort(function (a, b) { return a.localeCompare(b, 'tr'); }).join('|');", "unicode"],
  ["uni-tailor-es-enye", "return ['ano', 'año', 'nube', 'ñu', 'zapato'].sort(function (a, b) { return a.localeCompare(b, 'es'); }).join('|');", "unicode"],
  ["uni-tailor-hr-lj", "return ['luk', 'ljut', 'nos', 'njiva'].sort(function (a, b) { return a.localeCompare(b, 'hr'); }).join('|');", "unicode"],
  ["uni-tailor-is-thorn", "return ['afi', 'dagur', 'ðar', 'eldur', 'þak', 'æði', 'ös'].sort(function (a, b) { return a.localeCompare(b, 'is'); }).join('|');", "unicode"],
  ["uni-tailor-et", "return ['saag', 'šokk', 'zoo', 'žurnaal', 'tuba', 'õun', 'äär'].sort(function (a, b) { return a.localeCompare(b, 'et'); }).join('|');", "unicode"],
  ["uni-tailor-region-subtag", "return ['apa', 'zebra', 'åka'].sort(function (a, b) { return a.localeCompare(b, 'sv-SE'); }).join('|');", "unicode"],
  ["uni-tailor-array-arg", "return ['apa', 'zebra', 'åka'].sort(function (a, b) { return a.localeCompare(b, ['sv']); }).join('|');", "unicode"],
  ["uni-tailor-root-locales-unchanged", "var w = ['Apfel', 'Ärger', 'Öl', 'Zug']; return w.slice().sort(function (a, b) { return a.localeCompare(b, 'de'); }).join('|') === w.slice().sort(function (a, b) { return a.localeCompare(b); }).join('|');", "unicode"],
  ["uni-tailor-unknown-locale-is-root", "return ['åka', 'apa', 'zebra'].sort(function (a, b) { return a.localeCompare(b, 'xx'); }).join('|');", "unicode"],
  ["uni-tailor-does-not-leak", "var sv = 'åka'.localeCompare('apa', 'sv'); var root = 'åka'.localeCompare('apa'); return sv + ',' + root;", "unicode"],

  // Intl. The engine had no `Intl` at all, so `new Intl.NumberFormat('de')`
  // was a ReferenceError -- and Number/Date toLocaleString, which the spec
  // defines IN TERMS of Intl, answered the non-locale forms, so a German
  // document got English dates and English thousands separators.
  ["intl-exists", "return typeof Intl;", "unicode"],
  ["intl-canonical", "return Intl.getCanonicalLocales(['EN-latn-us', 'de-de']).join('|');", "unicode"],
  ["intl-collator-sort", "var c = new Intl.Collator('sv'); return ['apa', 'bok', 'zebra', 'åka', 'ängel', 'öl'].sort(c.compare).join('|');", "unicode"],
  ["intl-collator-detached-compare", "var c = new Intl.Collator('sv'); var f = c.compare; return f('åka', 'apa');", "unicode"],
  ["intl-collator-base-sensitivity", "var c = new Intl.Collator('en', { sensitivity: 'base' }); return c.compare('resume', 'résumé') + ',' + c.compare('a', 'A');", "unicode"],
  ["intl-collator-resolved", "var c = new Intl.Collator('sv'); var r = c.resolvedOptions(); return r.locale + ',' + r.usage + ',' + r.sensitivity;", "unicode"],
  ["intl-nf-de", "return new Intl.NumberFormat('de').format(1234567.891);", "unicode"],
  ["intl-nf-en", "return new Intl.NumberFormat('en').format(1234567.891);", "unicode"],
  ["intl-nf-fr", "return new Intl.NumberFormat('fr').format(1234567.891);", "unicode"],
  ["intl-nf-min-grouping", "return new Intl.NumberFormat('es').format(9876.5);", "unicode"],
  ["intl-nf-hi-grouping", "return new Intl.NumberFormat('hi').format(1234567);", "unicode"],
  ["intl-nf-percent", "return new Intl.NumberFormat('de', { style: 'percent' }).format(0.256);", "unicode"],
  ["intl-nf-currency", "return new Intl.NumberFormat('de', { style: 'currency', currency: 'EUR' }).format(1234.5);", "unicode"],
  ["intl-nf-currency-us", "return new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' }).format(-99);", "unicode"],
  ["intl-nf-currency-nl-minus", "return new Intl.NumberFormat('nl', { style: 'currency', currency: 'USD' }).format(-99);", "unicode"],
  ["intl-nf-currency-ja-spacing", "return new Intl.NumberFormat('ja', { style: 'currency', currency: 'EUR' }).format(1234.5);", "unicode"],
  ["intl-nf-fraction-digits", "return new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(3.14159);", "unicode"],
  ["intl-nf-no-grouping", "return new Intl.NumberFormat('en', { useGrouping: false }).format(1234567);", "unicode"],
  ["intl-nf-resolved", "var r = new Intl.NumberFormat('de', { style: 'percent' }).resolvedOptions(); return r.locale + ',' + r.style + ',' + r.maximumFractionDigits;", "unicode"],
  ["intl-dtf-default", "return new Intl.DateTimeFormat('en').format(new Date(Date.UTC(2021, 4, 7)));", "unicode"],
  ["intl-dtf-gb", "return new Intl.DateTimeFormat('en-GB').format(new Date(Date.UTC(2021, 4, 7)));", "unicode"],
  ["intl-dtf-de", "return new Intl.DateTimeFormat('de').format(new Date(Date.UTC(2021, 4, 7)));", "unicode"],
  ["intl-dtf-ja", "return new Intl.DateTimeFormat('ja').format(new Date(Date.UTC(2021, 4, 7)));", "unicode"],
  ["intl-dtf-hu", "return new Intl.DateTimeFormat('hu').format(new Date(Date.UTC(2021, 4, 7)));", "unicode"],
  ["intl-dtf-long-month", "return new Intl.DateTimeFormat('de', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(Date.UTC(2021, 4, 7)));", "unicode"],
  ["intl-dtf-inflected-month", "return new Intl.DateTimeFormat('fi', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(Date.UTC(2021, 4, 7)));", "unicode"],
  ["intl-dtf-weekday", "return new Intl.DateTimeFormat('fr', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(Date.UTC(2021, 4, 7)));", "unicode"],
  ["intl-dtf-korean-month", "return new Intl.DateTimeFormat('ko', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(Date.UTC(2021, 4, 7)));", "unicode"],
  ["intl-dtf-buddhist-year", "return new Intl.DateTimeFormat('th').format(new Date(Date.UTC(2021, 4, 7)));", "unicode"],
  ["intl-dtf-time", "return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(Date.UTC(2021, 4, 7, 15, 4, 5)));", "unicode"],
  ["intl-number-tolocalestring", "return (1234567.891).toLocaleString('de');", "unicode"],
  ["intl-number-tolocalestring-currency", "return (1234.5).toLocaleString('de', { style: 'currency', currency: 'EUR' });", "unicode"],
  ["intl-date-tolocaledatestring", "return new Date(Date.UTC(2021, 4, 7)).toLocaleDateString('de');", "unicode"],
  ["intl-date-tolocalestring", "return new Date(Date.UTC(2021, 4, 7, 15, 4, 5)).toLocaleString('fr');", "unicode"],
  ["intl-unsupported-locale-falls-back", "return new Intl.NumberFormat('xx-YY').format(1234.5);", "unicode"],

  // async / await. `async` and `await` parsed and were then IGNORED: an async
  // function ran synchronously and returned its value RAW, so `f().then(...)`
  // was "then is not a function" and `await p` evaluated to null.
  //
  // Only the SHAPE of the result is checked here, because this harness compares
  // a probe's return value synchronously and no microtask has run by then --
  // in Node either. The values an async function actually produces are checked
  // by tests/async-conformance.test.ts, which runs whole programs to
  // completion and compares their output.
  ["async-returns-object", "async function f() { return 1; } return typeof f();", "async"],
  ["async-returns-thenable", "async function f() { return 1; } return typeof f().then;", "async"],
  ["async-ctor-is-promise", "async function f() { return 1; } return f().constructor.name;", "async"],
  ["async-arrow-returns-thenable", "var g = async (x) => x; return typeof g(1).then;", "async"],
  ["async-arrow-block-returns-thenable", "var g = async function (x) { return x; }; return typeof g(1).then;", "async"],
  ["async-method-returns-thenable", "var o = { async m() { return 1; } }; return typeof o.m().then;", "async"],
  ["async-class-method-returns-thenable", "class C { async go() { return 1; } } return typeof new C().go().then;", "async"],
  ["async-throwing-still-returns-promise", "async function f() { throw new Error('x'); } var p = f(); p.catch(function () {}); return typeof p.then;", "async"],
  ["async-tostring-tag", "async function f() { return 1; } return Object.prototype.toString.call(f());", "async"],
  ["async-instanceof-promise", "async function f() { return 1; } return f() instanceof Promise;", "async"],

  // What an async function IS, rather than what it returns. `async` and
  // `await` are CONTEXTUAL keywords, and treating them as reserved everywhere
  // broke ordinary script code: `async(1)` was read as a malformed arrow and
  // `function f() { var await = 3; return await; }` did not parse at all.
  ["async-fn-proto-ctor-name", "async function f() {} return Object.getPrototypeOf(f).constructor.name;", "async"],
  ["async-fn-proto-tag", "async function f() {} return Object.getPrototypeOf(f)[Symbol.toStringTag];", "async"],
  ["async-fn-proto-is-fn-proto", "async function f() {} return Object.getPrototypeOf(Object.getPrototypeOf(f)) === Function.prototype;", "async"],
  ["async-fn-tostring-tag", "async function f() {} return Object.prototype.toString.call(f);", "async"],
  ["async-gen-fn-tostring-tag", "async function* f() {} return Object.prototype.toString.call(f);", "async"],
  ["async-fn-not-a-ctor", "async function f() {} try { new f(); return 'CONSTRUCTED'; } catch (e) { return e.constructor.name; }", "async"],
  ["async-fn-no-prototype", "async function f() {} return typeof f.prototype;", "async"],
  ["async-arrow-not-a-ctor", "var g = async () => 1; try { new g(); return 'CONSTRUCTED'; } catch (e) { return e.constructor.name; }", "async"],
  ["async-method-no-prototype", "var o = { async m() {} }; return typeof o.m.prototype;", "async"],
  ["async-fn-length", "async function f(a, b) {} return f.length;", "async"],
  ["async-fn-name", "async function f() {} return f.name;", "async"],
  ["async-fn-tostring-keeps-async", "async function f() {} return f.toString().slice(0, 5);", "async"],
  ["async-ctor-via-proto", "async function f() {} var AF = Object.getPrototypeOf(f).constructor; var h = new AF('x', 'return x * 2;'); return typeof h(3).then;", "async"],
  ["async-ctor-not-global", "return typeof AsyncFunction === 'undefined' ? 'unbound' : 'BOUND';", "async"],
  // `async` and `await` as ordinary identifiers.
  ["async-as-fn-name", "function async(x) { return x + 1; } return async(1);", "async"],
  ["async-as-call-target", "var async = function (x) { return x * 3; }; return async(4);", "async"],
  ["async-prop-shorthand", "var async = 7; var o = { async }; return o.async;", "async"],
  ["await-as-name-in-sync-fn", "function f() { var await = 3; return await; } return f();", "async"],
  ["await-as-name-in-nested-fn", "async function f() { function g() { var await = 2; return await; } return g(); } return typeof f().then;", "async"],
  ["async-linebreak-is-identifier", "var async = 5; var r = async\nfunction f() { return 1; }\nreturn r === undefined ? 'stmt' : String(r);", "async"],
  ["async-linebreak-before-arrow", "var async = function (x) { return 'called'; }; var r = async\n(1);\nreturn r;", "async"],
  // The parameters of an async function are not part of its body.
  ["async-params-no-await", "try { eval('async function f(x = await 1) {}'); return 'ACCEPTED'; } catch (e) { return e.constructor.name; }", "async"],
  // Subclassing the keyed collections. `extends Array`, `extends Error`,
  // `extends RegExp` and `extends Function` already worked; Map and Set did
  // not, and failed in a way that LOOKED like it worked -- the instance had
  // the right prototype and reported the right brand, but its `set` stored
  // nothing and `size` was undefined, because a Map keeps its entries in an
  // internal list that a plain object does not have.
  ["sub-map-basic", "class SubM extends Map {} var m = new SubM(); m.set('a', 1); return m.get('a') + ',' + m.size;", "class"],
  ["sub-map-instanceof", "class SubM2 extends Map {} var m = new SubM2(); return (m instanceof SubM2) + ',' + (m instanceof Map);", "class"],
  ["sub-map-from-entries", "class SubM3 extends Map {} var m = new SubM3([['a', 1], ['b', 2]]); return m.size + ',' + m.get('b');", "class"],
  ["sub-set-basic", "class SubS extends Set {} var s = new SubS(); s.add(1); return s.size + ',' + s.has(1);", "class"],
  ["sub-set-from-iterable", "class SubS2 extends Set {} var s = new SubS2([1, 2, 2]); return s.size + ',' + s.has(2);", "class"],
  ["sub-set-instanceof", "class SubS3 extends Set {} var s = new SubS3(); return (s instanceof SubS3) + ',' + (s instanceof Set);", "class"],
  ["sub-map-explicit-super", "class SubM4 extends Map { constructor(x) { super(x); } } return new SubM4([['k', 9]]).get('k');", "class"],
  ["sub-map-own-method", "class SubM5 extends Map { twice() { return this.size * 2; } } var m = new SubM5(); m.set('a', 1); return m.twice();", "class"],
  // A Map and a Set are their own value kinds here, so neither reached the
  // object branch of the brand: even a PLAIN `new Map()` was "[object Object]".
  ["brand-map", "return Object.prototype.toString.call(new Map());", "class"],
  ["brand-set", "return Object.prototype.toString.call(new Set());", "class"],
  ["brand-subclassed-map", "class SubM6 extends Map {} return Object.prototype.toString.call(new SubM6());", "class"],

  // RegExp: General_Category LONG names, which are as legal as the two-letter
  // spelling. The generated table holds the short names -- the ranges are
  // identical, so storing both would double it to say the same thing twice --
  // and the long spelling folds onto the short one at lookup.
  ["prop-letter-long", "return /\\p{Letter}/u.test('a');", "unicode"],
  ["prop-letter-long-negative", "return /\\p{Letter}/u.test('1');", "unicode"],
  ["prop-uppercase-letter-long", "return /\\p{Uppercase_Letter}/u.test('A') + ',' + /\\p{Uppercase_Letter}/u.test('a');", "unicode"],
  ["prop-decimal-number-long", "return /\\p{Decimal_Number}/u.test('7');", "unicode"],
  ["prop-space-separator-long", "return /\\p{Space_Separator}/u.test(' ');", "unicode"],
  ["prop-long-and-short-agree", "return /\\p{Letter}/u.test('x') === /\\p{L}/u.test('x');", "unicode"],
  ["prop-v-intersection-long-name", "return /[\\p{ASCII}&&\\p{Letter}]/v.test('a') + ',' + /[\\p{ASCII}&&\\p{Letter}]/v.test('1');", "unicode"],
  ["prop-unknown-still-throws", "try { new RegExp('\\\\p{Nope}', 'u'); return 'ACCEPTED'; } catch (e) { return e.constructor.name; }", "unicode"],
  // annexB B.2.2.12/13: the pre-rename spellings of trimStart/trimEnd.
  ["annexb-trimleft", "return '  a '.trimLeft() + '|';", "unicode"],
  ["annexb-trimright", "return '| ' + ' a  '.trimRight();", "unicode"],
  ["annexb-trimleft-matches-trimstart", "return '  a '.trimLeft() === '  a '.trimStart();", "unicode"],

  // Typed arrays and their backing buffer.
  ["ta-buffer-is-minted", "var a = new Int32Array(4); return Object.prototype.toString.call(a.buffer);", "typedarray"],
  ["ta-buffer-bytelength", "var a = new Int32Array(4); return a.buffer.byteLength;", "typedarray"],
  ["ta-minted-buffer-aliases", "var p = new Int32Array(1); p[0] = 258; var u = new Uint8Array(p.buffer); return u[0] + ',' + u[1];", "typedarray"],
  ["ta-minted-buffer-writes-back", "var p = new Int32Array(1); p[0] = 258; var u = new Uint8Array(p.buffer); u[0] = 1; return p[0];", "typedarray"],
  ["ta-buffer-identity-stable", "var a = new Int32Array(2); return a.buffer === a.buffer;", "typedarray"],
  ["ta-buffer-from-list", "var q = new Int32Array([7]); return new Uint8Array(q.buffer)[0] + ',' + q.buffer.byteLength;", "typedarray"],
  // Brands. Even `new ArrayBuffer(8)` answered "[object Object]".
  ["brand-arraybuffer", "return Object.prototype.toString.call(new ArrayBuffer(8));", "typedarray"],
  ["brand-dataview", "return Object.prototype.toString.call(new DataView(new ArrayBuffer(8)));", "typedarray"],
  ["brand-int32array", "return Object.prototype.toString.call(new Int32Array(2));", "typedarray"],
  ["brand-uint8array", "return Object.prototype.toString.call(new Uint8Array(2));", "typedarray"],
  ["brand-plain-array-still-array", "return Object.prototype.toString.call([1, 2]);", "typedarray"],
  // set / subarray -- the two typed-array methods with no Array counterpart,
  // both of which were "not a function".
  ["ta-set-from-typed", "var b = new ArrayBuffer(8); var x = new Uint8Array(b); x.set(new Uint8Array([9, 8]), 2); return x[2] + ',' + x[3];", "typedarray"],
  ["ta-set-from-plain-array", "var x = new Int32Array(4); x.set([1, 2], 1); return x.join(',');", "typedarray"],
  ["ta-set-coerces", "var x = new Int8Array(2); x.set([300, -1]); return x[0] + ',' + x[1];", "typedarray"],
  ["ta-set-out-of-range-throws", "var x = new Int8Array(2); try { x.set([1, 2, 3]); return 'ACCEPTED'; } catch (e) { return e.constructor.name; }", "typedarray"],
  ["ta-subarray-shares", "var a = new Int32Array([1,2,3,4]); var s = a.subarray(1,3); s[0] = 99; return a[1] + ',' + s.length + ',' + (s.buffer === a.buffer);", "typedarray"],
  ["ta-subarray-negative", "var a = new Int32Array([1,2,3,4]); return a.subarray(-2).join(',');", "typedarray"],
  ["ta-slice-still-copies", "var a = new Int32Array([1,2,3]); var s = a.slice(0,2); s[0] = 99; return a[0] + ',' + s.length;", "typedarray"],
  // A view onto a detached buffer has no elements.
  ["ta-detached-length", "var b = new ArrayBuffer(8); var a = new Uint8Array(b); b.transfer(); return a.length;", "typedarray"],
  ["ta-detached-bytelength", "var b = new ArrayBuffer(8); var a = new Uint8Array(b); b.transfer(); return a.byteLength;", "typedarray"],

  // Radix-prefixed BigInt literals. The `n` suffix was read only on the
  // DECIMAL path, so `0xffn` reached the malformed-literal check, which sees
  // `n` as an identifier character and rejected the whole literal. Everything
  // downstream was already right: BigNum.parse reads the radix prefixes
  // itself, and DataView.setBigInt64/BigInt.asUintN/BigInt64Array all handled
  // the full 64-bit range once a literal could reach them.
  ["bigint-hex", "return (0x1fn).toString();", "bigint"],
  ["bigint-hex-64bit", "return (0xFFFFFFFFFFFFFFFFn).toString();", "bigint"],
  ["bigint-octal", "return (0o17n).toString();", "bigint"],
  ["bigint-binary", "return (0b1011n).toString();", "bigint"],
  ["bigint-hex-separators", "return (0xff_ffn).toString();", "bigint"],
  ["bigint-hex-typeof", "return typeof 0x1fn;", "bigint"],
  ["bigint64array-from-hex", "var a = new BigInt64Array(1); a[0] = 0x7fffffffffffffffn; return a[0].toString();", "bigint"],
  ["bigint64array-hex-wraps", "var a = new BigInt64Array(1); a[0] = 0x8000000000000000n; return a[0].toString();", "bigint"],
  ["biguint64array-from-hex", "var a = new BigUint64Array(1); a[0] = 0xffffffffffffffffn; return a[0].toString();", "bigint"],
  ["dataview-bigint64-hex", "var d = new DataView(new ArrayBuffer(8)); d.setBigInt64(0, 0x1234n); return d.getBigInt64(0).toString();", "bigint"],
  ["dataview-biguint64-hex", "var d = new DataView(new ArrayBuffer(8)); d.setBigUint64(0, 0xffffffffffffffffn); return d.getBigUint64(0).toString();", "bigint"],
  ["bigint-asuintn-hex", "return BigInt.asUintN(8, 0x1ffn).toString();", "bigint"],
  ["bigint-asintn-hex", "return BigInt.asIntN(8, 0xffn).toString();", "bigint"],
  // Still malformed, and still reported as such: the suffix must follow digits.
  ["bigint-hex-no-digits-is-an-error", "try { eval('0xn'); return 'ACCEPTED'; } catch (e) { return e.constructor.name; }", "bigint"],
  ["bigint-hex-bad-digit-is-an-error", "try { eval('0b12n'); return 'ACCEPTED'; } catch (e) { return e.constructor.name; }", "bigint"],

  // Private-field edges. Eleven of these already held; `o?.#x` did not --
  // parseMemberName reads a private name fine, but the `?.` branch gated on
  // isNameToken() and `#` is a punctuator, so the branch never fired and the
  // postfix loop left the OBJECT as the result: `o?.#x` evaluated to `o`.
  ["priv-in-operator", "class PrivIn { #x = 1; static has(o) { return #x in o; } } return PrivIn.has(new PrivIn()) + ',' + PrivIn.has({});", "class"],
  ["priv-optional-chain", "class PrivOC { #x = 5; get(o) { return o?.#x; } } return String(new PrivOC().get(new PrivOC()));", "class"],
  ["priv-optional-chain-null", "class PrivOCN { #x = 5; get(o) { return o?.#x; } } return String(new PrivOCN().get(null));", "class"],
  ["priv-optional-chain-method", "class PrivOCM { #f() { return 6; } go(o) { return o?.#f(); } } return String(new PrivOCM().go(new PrivOCM()));", "class"],
  ["priv-static-field", "class PrivSF { static #n = 7; static get() { return PrivSF.#n; } } return PrivSF.get();", "class"],
  ["priv-static-method", "class PrivSM { static #f() { return 3; } static go() { return PrivSM.#f(); } } return PrivSM.go();", "class"],
  ["priv-method", "class PrivM { #f() { return 4; } go() { return this.#f(); } } return new PrivM().go();", "class"],
  ["priv-getter-setter", "class PrivGS { #v = 1; get x() { return this.#v; } set x(n) { this.#v = n; } } var c = new PrivGS(); c.x = 9; return c.x;", "class"],
  ["priv-brand-check-throws", "class PrivBC { #x = 1; static read(o) { return o.#x; } } try { PrivBC.read({}); return 'NO-THROW'; } catch (e) { return e.constructor.name; }", "class"],
  ["priv-not-in-keys", "class PrivNK { #x = 1; y = 2; } return Object.keys(new PrivNK()).join(',');", "class"],
  ["priv-static-block", "class PrivSB { static #n; static { PrivSB.#n = 11; } static get() { return PrivSB.#n; } } return PrivSB.get();", "class"],
  ["priv-inherited-not-shared", "class A { #x = 1; static hasA(o) { return #x in o; } } class B extends A {} return String(A.hasA(new B()));", "class"],
  ["priv-name-collision", "class A { #x = 1; ax() { return this.#x; } } class B { #x = 2; bx() { return this.#x; } } return new A().ax() + ',' + new B().bx();", "class"],

  ["async-inner-arrow-params-ok", "async function f() { var g = (x = 1) => x; return g(); } return typeof f().then;", "async"],
  // The async-generator OBJECT is an async iterator now: next() answers a
  // promise for an iteration result, it brands through
  // %AsyncGeneratorPrototype%, and it publishes Symbol.asyncIterator (and
  // deliberately NOT Symbol.iterator -- `for (x of asyncGen())` is a TypeError).
  ["async-gen-obj-tostring-tag", "async function* f() {} return Object.prototype.toString.call(f());", "async"],
  ["async-gen-next-is-a-promise", "async function* f() { yield 1; } return typeof f().next().then;", "async"],
  ["async-gen-has-async-iterator", "async function* f() { yield 1; } return typeof f()[Symbol.asyncIterator];", "async"],
  ["async-gen-async-iterator-is-self", "async function* f() { yield 1; } var it = f(); return it[Symbol.asyncIterator]() === it;", "async"],
  ["async-gen-no-sync-iterator", "async function* f() { yield 1; } return typeof f()[Symbol.iterator];", "async"],
  ["async-gen-proto-differs-from-gen", "async function* a() {} function* b() {} return Object.getPrototypeOf(Object.getPrototypeOf(a())) === Object.getPrototypeOf(Object.getPrototypeOf(b()));", "async"],
  ["async-gen-object-literal-method", "var o = { async *m() { yield 1; } }; return Object.prototype.toString.call(o.m());", "async"],
  ["async-gen-class-method", "class AGCls { async *m() { yield 1; } } return Object.prototype.toString.call(new AGCls().m());", "async"],

  // formatToParts / formatRange / supportedLocalesOf.
  ["intl-nf-parts", "return new Intl.NumberFormat('de').formatToParts(-1234567.89).map(function (p) { return p.type + '=' + p.value; }).join(' ');", "unicode"],
  ["intl-nf-parts-currency", "return new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' }).formatToParts(-99.5).map(function (p) { return p.type; }).join(',');", "unicode"],
  ["intl-nf-parts-percent", "return new Intl.NumberFormat('de', { style: 'percent' }).formatToParts(0.256).map(function (p) { return p.type + '=' + p.value; }).join(' ');", "unicode"],
  ["intl-nf-parts-rejoin", "var f = new Intl.NumberFormat('de'); return f.formatToParts(-1234567.89).map(function (p) { return p.value; }).join('') === f.format(-1234567.89);", "unicode"],
  ["intl-dtf-parts", "return new Intl.DateTimeFormat('en').formatToParts(new Date(Date.UTC(2021, 4, 7))).map(function (p) { return p.type + '=' + p.value; }).join(' ');", "unicode"],
  ["intl-dtf-parts-long", "return new Intl.DateTimeFormat('de', { year: 'numeric', month: 'long', day: 'numeric' }).formatToParts(new Date(Date.UTC(2021, 4, 7))).map(function (p) { return p.type; }).join(',');", "unicode"],
  ["intl-dtf-parts-rejoin", "var f = new Intl.DateTimeFormat('hu'); var d = new Date(Date.UTC(2021, 4, 7)); return f.formatToParts(d).map(function (p) { return p.value; }).join('') === f.format(d);", "unicode"],
  ["intl-nf-supported", "return Intl.NumberFormat.supportedLocalesOf(['de', 'xx', 'sv-SE']).join('|');", "unicode"],
  ["intl-collator-supported", "return Intl.Collator.supportedLocalesOf(['fr', 'zz']).join('|');", "unicode"],
  ["intl-dtf-supported", "return Intl.DateTimeFormat.supportedLocalesOf(['ja']).join('|');", "unicode"],

  // PluralRules and ListFormat.
  ["intl-plural-en", "var p = new Intl.PluralRules('en'); return [0, 1, 2, 1.5].map(function (n) { return p.select(n); }).join(',');", "unicode"],
  ["intl-plural-pl", "var p = new Intl.PluralRules('pl'); return [1, 2, 5, 22, 25, 1.5].map(function (n) { return p.select(n); }).join(',');", "unicode"],
  ["intl-plural-ru", "var p = new Intl.PluralRules('ru'); return [1, 2, 5, 11, 21, 101].map(function (n) { return p.select(n); }).join(',');", "unicode"],
  ["intl-plural-cs", "var p = new Intl.PluralRules('cs'); return [1, 2, 5, 1.5].map(function (n) { return p.select(n); }).join(',');", "unicode"],
  ["intl-plural-fr-million", "return new Intl.PluralRules('fr').select(1000000);", "unicode"],
  ["intl-plural-ar-fallback", "return new Intl.PluralRules('ja').select(5);", "unicode"],
  ["intl-plural-ordinal-en", "var p = new Intl.PluralRules('en', { type: 'ordinal' }); return [1, 2, 3, 4, 11, 21].map(function (n) { return p.select(n); }).join(',');", "unicode"],
  ["intl-plural-ordinal-it", "var p = new Intl.PluralRules('it', { type: 'ordinal' }); return [8, 11, 80, 800, 5].map(function (n) { return p.select(n); }).join(',');", "unicode"],
  ["intl-plural-resolved", "var r = new Intl.PluralRules('pl').resolvedOptions(); return r.locale + ',' + r.type;", "unicode"],
  ["intl-list-en", "return new Intl.ListFormat('en').format(['a', 'b', 'c']);", "unicode"],
  ["intl-list-en-two", "return new Intl.ListFormat('en').format(['a', 'b']);", "unicode"],
  ["intl-list-de", "return new Intl.ListFormat('de').format(['a', 'b', 'c']);", "unicode"],
  ["intl-list-disjunction", "return new Intl.ListFormat('en', { type: 'disjunction' }).format(['a', 'b', 'c']);", "unicode"],
  ["intl-list-parts", "return new Intl.ListFormat('en').formatToParts(['a', 'b', 'c']).map(function (p) { return p.type + '=' + p.value; }).join(' ');", "unicode"],
  ["intl-list-single", "return new Intl.ListFormat('en').format(['only']);", "unicode"],

  ["uni-coll-total-order", "var w = ['Straße', 'Strasse', 'ǆ', 'dz']; var f = w.slice().sort(function (a, b) { return a.localeCompare(b); }).join('|'); var r = w.slice().reverse().sort(function (a, b) { return a.localeCompare(b); }).join('|'); return f === r;", "unicode"],

  // --- ES2019-2024 library ---------------------------------------------------
  // The change-by-copy quartet: each answers a NEW array and the receiver is
  // untouched, which is the only reason to prefer them over the in-place forms.
  ["arr-toSorted", "return [3, 1, 2].toSorted().join(',');", "es2023"],
  ["arr-toSorted-cmp", "return [3, 1, 2].toSorted(function (a, b) { return b - a; }).join(',');", "es2023"],
  ["arr-toSorted-pure", "var a = [3, 1, 2]; a.toSorted(); return a.join(',');", "es2023"],
  ["arr-toSorted-undefined-last", "return JSON.stringify([3, undefined, 1].toSorted());", "es2023"],
  ["arr-toSorted-holes", "var a = [3, , 1]; return JSON.stringify(a.toSorted());", "es2023"],
  ["arr-toSorted-badcmp", "try { [1, 2].toSorted(5); return 'no'; } catch (e) { return e.constructor.name; }", "es2023"],
  ["arr-toReversed", "return [1, 2, 3].toReversed().join(',');", "es2023"],
  ["arr-toReversed-pure", "var a = [1, 2, 3]; a.toReversed(); return a.join(',');", "es2023"],
  ["arr-toSpliced", "return JSON.stringify([1, 2, 3, 4].toSpliced(1, 2, 'a', 'b', 'c'));", "es2023"],
  ["arr-toSpliced-neg", "return JSON.stringify([1, 2, 3, 4].toSpliced(-2, 1));", "es2023"],
  ["arr-with", "return JSON.stringify([1, 2, 3].with(1, 'x'));", "es2023"],
  ["arr-with-neg", "return JSON.stringify([1, 2, 3].with(-1, 'z'));", "es2023"],
  ["arr-with-range", "try { [1, 2].with(9, 0); return 'no'; } catch (e) { return e.constructor.name; }", "es2023"],
  ["arr-findLast", "return [1, 2, 3, 4].findLast(function (x) { return x % 2 === 1; });", "es2023"],
  ["arr-findLastIndex", "return [1, 2, 3, 4].findLastIndex(function (x) { return x % 2 === 1; });", "es2023"],
  ["arr-findLast-miss", "return String([1, 2].findLast(function () { return false; })) + ',' + [1, 2].findLastIndex(function () { return false; });", "es2023"],
  ["arr-flatMap", "return JSON.stringify([1, 2, 3].flatMap(function (x) { return [x, x * 2]; }));", "es2019"],
  ["arr-flatMap-flat-once", "return JSON.stringify([1, 2].flatMap(function (x) { return [[x]]; }));", "es2019"],
  // includes compares with SameValueZero, which is the whole reason it exists
  // next to indexOf.
  ["arr-includes-nan", "return [NaN].includes(NaN);", "es2016"],
  ["arr-includes-indexOf-nan", "return [NaN].indexOf(NaN);", "es2016"],
  ["arr-includes-from", "return [1, 2, 3].includes(1, 1);", "es2016"],
  ["arr-includes-negfrom", "return [1, 2, 3].includes(3, -1);", "es2016"],
  ["arr-includes-hole", "return [, ].includes(undefined);", "es2016"],
  ["arr-includes-zero", "return [-0].includes(0);", "es2016"],

  // Promise combinators and finally.
  ["promise-allSettled-shape", "var p = Promise.allSettled([Promise.resolve(1)]); return typeof p.then;", "es2020"],
  ["promise-any-shape", "var p = Promise.any([Promise.resolve(1)]); p.catch(function () {}); return typeof p.then;", "es2021"],
  ["promise-withResolvers", "var w = Promise.withResolvers(); w.resolve(1); return typeof w.promise.then + ',' + typeof w.resolve + ',' + typeof w.reject;", "es2024"],
  ["promise-finally-exists", "return typeof Promise.prototype.finally + ',' + Promise.prototype.finally.length;", "es2018"],
  ["aggregate-error", "var e = new AggregateError([1, 2], 'm'); return e.name + ',' + e.message + ',' + e.errors.join('-') + ',' + (e instanceof Error);", "es2021"],
  ["aggregate-error-no-msg", "var e = new AggregateError([]); return e.message + '|' + e.errors.length;", "es2021"],
  ["aggregate-error-errors-hidden", "var e = new AggregateError([1]); return Object.keys(e).indexOf('errors');", "es2021"],

  // Object statics.
  ["object-fromEntries", "return JSON.stringify(Object.fromEntries([['a', 1], ['b', 2]]));", "es2019"],
  ["object-fromEntries-map", "return JSON.stringify(Object.fromEntries(new Map([['x', 9]])));", "es2019"],
  ["object-hasOwn", "return Object.hasOwn({ a: 1 }, 'a') + ',' + Object.hasOwn({ a: 1 }, 'b');", "es2022"],
  ["object-hasOwn-inherited", "return Object.hasOwn({}, 'toString');", "es2022"],
  ["object-gopds", "return JSON.stringify(Object.getOwnPropertyDescriptors({ a: 1 }));", "es2017"],
  ["object-gopds-accessor", "var o = {}; Object.defineProperty(o, 'g', { get: function () { return 1; }, configurable: true }); var d = Object.getOwnPropertyDescriptors(o); return typeof d.g.get + ',' + d.g.configurable;", "es2017"],
  ["object-groupBy", "return JSON.stringify(Object.groupBy([1, 2, 3], function (x) { return x % 2 ? 'odd' : 'even'; }));", "es2024"],
  // The result has a null prototype, so a group called "toString" is a group
  // and not a collision. Compared inside the guest: a returned null and a
  // returned undefined are the same value once bridged out.
  ["object-groupBy-nullproto", "return Object.getPrototypeOf(Object.groupBy([1], function () { return 'k'; })) === null;", "es2024"],
  ["object-groupBy-toString-key", "var g = Object.groupBy([1], function () { return 'toString'; }); return g.toString.length;", "es2024"],

  // String.matchAll: every match WITH its captures, unlike match with /g.
  ["string-matchAll", "return JSON.stringify(Array.from('a1b2'.matchAll(/[a-z](\\d)/g), function (m) { return m[0] + ':' + m[1] + '@' + m.index; }));", "es2020"],
  ["string-matchAll-empty", "return Array.from('abc'.matchAll(/x/g)).length;", "es2020"],
  ["string-matchAll-nonglobal", "try { 'ab'.matchAll(/a/); return 'no'; } catch (e) { return e.constructor.name; }", "es2020"],

  // Optional call.
  ["optional-call-absent", "var o = {}; return String(o.f?.());", "es2020"],
  ["optional-call-present", "var o = { f: function () { return 5; } }; return o.f?.();", "es2020"],
  ["optional-call-this", "var o = { v: 3, f: function () { return this.v; } }; return o.f?.();", "es2020"],
  ["optional-call-null-binding", "var f = null; return String(f?.());", "es2020"],
  ["optional-call-args-not-evaluated", "var n = 0; var o = {}; o.f?.(n++); return n;", "es2020"],

  // The weak collections. Nothing here is ever collected, which the spec
  // permits; what IS observable is the key check and the interface.
  ["weakmap-roundtrip", "var k = {}; var m = new WeakMap(); m.set(k, 1); return m.get(k) + ',' + m.has(k) + ',' + m.delete(k) + ',' + m.has(k);", "es2015"],
  ["weakmap-init", "var k = {}; return new WeakMap([[k, 7]]).get(k);", "es2015"],
  ["weakmap-primitive-key", "try { new WeakMap().set(1, 2); return 'no'; } catch (e) { return e.constructor.name; }", "es2015"],
  ["weakmap-get-primitive", "return String(new WeakMap().get(1)) + ',' + new WeakMap().has(1);", "es2015"],
  ["weakmap-tag", "return Object.prototype.toString.call(new WeakMap());", "es2015"],
  ["weakmap-no-iteration", "return typeof new WeakMap().forEach;", "es2015"],
  ["weakset-roundtrip", "var k = {}; var s = new WeakSet(); s.add(k); return s.has(k) + ',' + s.has({}) + ',' + s.delete(k) + ',' + s.has(k);", "es2015"],
  ["weakref-deref", "var o = { x: 1 }; return new WeakRef(o).deref().x;", "es2021"],
  ["weakref-primitive", "try { new WeakRef(1); return 'no'; } catch (e) { return e.constructor.name; }", "es2021"],
  ["finreg-register", "var f = new FinalizationRegistry(function () {}); f.register({}, 1); return typeof f.unregister;", "es2021"],
  ["finreg-noncallable", "try { new FinalizationRegistry(1); return 'no'; } catch (e) { return e.constructor.name; }", "es2021"],

  // --- class statics (ES2022) -----------------------------------------------
  // A static field ran as an INSTANCE field, so C.x was undefined and every
  // instance carried its own copy; a static block did not run at all.
  ["class-static-field", "class CsA { static x = 5; } return CsA.x;", "es2022"],
  ["class-static-field-not-on-instance", "class CsB { static x = 5; } return String(new CsB().x);", "es2022"],
  ["class-static-field-sees-class", "class CsC { static a = 2; static b = CsC.a * 3; } return CsC.b;", "es2022"],
  ["class-static-field-no-init", "class CsD { static n; } return String(CsD.n) + ',' + ('n' in CsD);", "es2022"],
  ["class-static-block", "class CsE { static x = 1; static { CsE.y = CsE.x + 1; } } return CsE.y;", "es2022"],
  ["class-static-block-this", "class CsF { static a = 1; static { this.b = this.a + 1; } } return CsF.b;", "es2022"],
  ["class-static-private", "class CsG { static #n = 3; static get() { return CsG.#n; } } return CsG.get();", "es2022"],
  ["class-static-order", "var L = []; class CsH { static a = L.push('a'); static { L.push('b'); } static c = L.push('c'); } return L.join('');", "es2022"],

  // --- RegExp (ES2018-2022) --------------------------------------------------
  ["re-dotall", "return /a.b/s.test('a\\nb');", "es2018"],
  ["re-dotall-off", "return /a.b/.test('a\\nb');", "es2018"],
  ["re-dotall-prop", "return /x/s.dotAll + ',' + /x/.dotAll;", "es2018"],
  ["re-flag-props", "var r = /x/gimsuy; return [r.global, r.ignoreCase, r.multiline, r.dotAll, r.unicode, r.sticky].join(',');", "es2018"],
  ["re-hasIndices-prop", "return /x/d.hasIndices + ',' + /x/.hasIndices;", "es2022"],
  ["re-named-group", "return /(?<y>\\d{4})-(?<m>\\d{2})/.exec('2024-05').groups.y;", "es2018"],
  ["re-named-groups-object", "var g = /(?<a>x)(?<b>y)/.exec('xy').groups; return g.a + g.b;", "es2018"],
  ["re-groups-undefined-when-unnamed", "return String(/(x)/.exec('x').groups);", "es2018"],
  ["re-named-optional", "var g = /(?<a>x)|(?<b>y)/.exec('y').groups; return String(g.a) + ',' + g.b;", "es2018"],
  ["re-named-backref", "return /(?<c>a)\\k<c>/.test('aa') + ',' + /(?<c>a)\\k<c>/.test('ab');", "es2018"],
  ["re-named-replace", "return '2024'.replace(/(?<y>\\d+)/, '[$<y>]');", "es2018"],
  ["re-named-replace-missing", "return 'x'.replace(/(?<a>x)/, '$<zz>!');", "es2018"],
  ["re-lookbehind", "return /(?<=a)b/.test('ab') + ',' + /(?<=a)b/.test('cb');", "es2018"],
  ["re-lookbehind-negative", "return /(?<!a)b/.test('cb') + ',' + /(?<!a)b/.test('ab');", "es2018"],
  ["re-lookbehind-quantified", "return /(?<=a+)b/.test('aaab');", "es2018"],
  ["re-lookbehind-index", "var m = /(?<=\\$)\\d+/.exec('cost $42'); return m[0] + '@' + m.index;", "es2018"],
  ["re-lookbehind-capture", "var m = /(?<=(\\w)x)y/.exec('axy'); return m[1];", "es2018"],
  ["re-indices", "return JSON.stringify(/a(b)/d.exec('xab').indices);", "es2022"],
  ["re-indices-groups", "return JSON.stringify(/(?<g>b)/d.exec('ab').indices.groups);", "es2022"],
  ["re-indices-absent", "return String(/x/.exec('x').indices);", "es2022"],
  ["re-ctor-u-flag", "return new RegExp('a', 'u').flags;", "es2015"],
  ["re-ctor-bad-flag", "try { new RegExp('a', 'q'); return 'no'; } catch (e) { return e.constructor.name; }", "es2015"],
  ["re-ctor-dup-flag", "try { new RegExp('a', 'gg'); return 'no'; } catch (e) { return e.constructor.name; }", "es2015"],
  ["re-matchAll-named", "return Array.from('a1'.matchAll(/(?<L>[a-z])(?<D>\\d)/g), function (m) { return m.groups.L + m.groups.D; }).join('');", "es2020"],

  // --- Set operations and iterator helpers (ES2025) --------------------------
  ["set-union", "return Array.from(new Set([1, 2]).union(new Set([2, 3]))).join(',');", "es2025"],
  ["set-intersection", "return Array.from(new Set([1, 2, 3]).intersection(new Set([2, 3, 4]))).join(',');", "es2025"],
  ["set-difference", "return Array.from(new Set([1, 2, 3]).difference(new Set([2]))).join(',');", "es2025"],
  ["set-symmetricDifference", "return Array.from(new Set([1, 2]).symmetricDifference(new Set([2, 3]))).join(',');", "es2025"],
  ["set-isSubsetOf", "return new Set([1]).isSubsetOf(new Set([1, 2])) + ',' + new Set([3]).isSubsetOf(new Set([1, 2]));", "es2025"],
  ["set-isSupersetOf", "return new Set([1, 2]).isSupersetOf(new Set([1])) + ',' + new Set([1]).isSupersetOf(new Set([1, 2]));", "es2025"],
  ["set-isDisjointFrom", "return new Set([1]).isDisjointFrom(new Set([2])) + ',' + new Set([1]).isDisjointFrom(new Set([1]));", "es2025"],
  // The argument is a SET-LIKE, not a Set: a Map has size, has and keys.
  ["set-op-setlike-map", "return Array.from(new Set([1, 2]).union(new Map([[3, 'x']]))).join(',');", "es2025"],
  ["set-op-subset-of-map", "return new Set([1, 2]).isSubsetOf(new Map([[1, 0], [2, 0], [3, 0]]));", "es2025"],
  ["set-op-non-object", "try { new Set([1]).union(5); return 'no'; } catch (e) { return e.constructor.name; }", "es2025"],
  ["set-op-order", "return Array.from(new Set([3, 1]).union(new Set([2, 3]))).join(',');", "es2025"],

  ["iter-map", "return [1, 2, 3].values().map(function (x) { return x * 2; }).toArray().join(',');", "es2025"],
  ["iter-filter", "return [1, 2, 3, 4].values().filter(function (x) { return x % 2 === 0; }).toArray().join(',');", "es2025"],
  ["iter-take", "return [1, 2, 3, 4].values().take(2).toArray().join(',');", "es2025"],
  ["iter-drop", "return [1, 2, 3, 4].values().drop(2).toArray().join(',');", "es2025"],
  ["iter-flatMap", "return [1, 2].values().flatMap(function (x) { return [x, x]; }).toArray().join(',');", "es2025"],
  ["iter-reduce", "return [1, 2, 3].values().reduce(function (a, b) { return a + b; }, 0);", "es2025"],
  ["iter-reduce-no-init", "return [1, 2, 3].values().reduce(function (a, b) { return a + b; });", "es2025"],
  ["iter-reduce-empty", "try { [].values().reduce(function (a, b) { return a + b; }); return 'no'; } catch (e) { return e.constructor.name; }", "es2025"],
  ["iter-toArray", "return [1, 2].values().toArray().join(',');", "es2025"],
  ["iter-forEach", "var s = 0; [1, 2].values().forEach(function (x) { s += x; }); return s;", "es2025"],
  ["iter-some", "return [1, 2].values().some(function (x) { return x === 2; }) + ',' + [1].values().some(function () { return false; });", "es2025"],
  ["iter-every", "return [1, 2].values().every(function (x) { return x > 0; }) + ',' + [1, 0].values().every(function (x) { return x > 0; });", "es2025"],
  ["iter-find", "return [1, 2, 3].values().find(function (x) { return x > 1; }) + ',' + String([1].values().find(function () { return false; }));", "es2025"],
  // A helper works on what is LEFT of a partly consumed iterator.
  ["iter-partial", "var it = [1, 2, 3].values(); it.next(); return it.map(function (x) { return x * 10; }).toArray().join(',');", "es2025"],
  ["iter-chain", "return [1, 2, 3, 4, 5].values().filter(function (x) { return x % 2; }).map(function (x) { return x * x; }).take(2).toArray().join(',');", "es2025"],
  ["iter-take-negative", "try { [1].values().take(-1); return 'no'; } catch (e) { return e.constructor.name; }", "es2025"],
  ["iter-on-set", "return new Set([1, 2, 3]).values().map(function (x) { return x + 1; }).toArray().join(',');", "es2025"],
  ["iter-on-map", "return new Map([[1, 'a']]).entries().map(function (e) { return e[0] + e[1]; }).toArray().join(',');", "es2025"],
  ["iter-on-string", "return 'ab'[Symbol.iterator]().map(function (c) { return c.toUpperCase(); }).toArray().join('');", "es2025"],
  ["Iterator-typeof", "return typeof Iterator;", "es2025"],
  ["Iterator-abstract", "try { new Iterator(); return 'no'; } catch (e) { return e.constructor.name; }", "es2025"],
  ["Iterator-instanceof", "return [].values() instanceof Iterator;", "es2025"],
  ["Iterator-from", "return Iterator.from([1, 2]).toArray().join(',');", "es2025"],
  ["Iterator-from-set", "return Iterator.from(new Set(['a'])).toArray().join(',');", "es2025"],

  // --- SharedArrayBuffer, buffer views and Atomics ---------------------------
  // A typed array over a buffer is a VIEW, which is what makes any of this
  // mean anything: two views over one buffer see one another's writes.
  ["view-over-buffer", "var b = new ArrayBuffer(8); var v = new Int32Array(b); return v.length + ',' + v.byteLength;", "es2015"],
  ["view-aliases", "var b = new ArrayBuffer(8); var a = new Int32Array(b); var c = new Int32Array(b); a[0] = 42; return c[0];", "es2015"],
  ["view-aliases-bytes", "var b = new ArrayBuffer(4); var i = new Int32Array(b); var u = new Uint8Array(b); i[0] = 1; return u.join(',');", "es2015"],
  ["view-dataview-alias", "var b = new ArrayBuffer(4); var i = new Int32Array(b); var d = new DataView(b); d.setInt32(0, 7, true); return i[0];", "es2015"],
  ["view-offset", "var b = new ArrayBuffer(16); var v = new Int32Array(b, 4, 2); return v.length + ',' + v.byteOffset + ',' + v.byteLength;", "es2015"],
  ["view-bad-offset", "try { new Int32Array(new ArrayBuffer(8), 3); return 'no'; } catch (e) { return e.constructor.name; }", "es2015"],
  ["view-too-long", "try { new Int32Array(new ArrayBuffer(8), 0, 9); return 'no'; } catch (e) { return e.constructor.name; }", "es2015"],
  ["view-buffer-identity", "var b = new ArrayBuffer(8); return new Int32Array(b).buffer === b;", "es2015"],

  ["sab-typeof", "return typeof SharedArrayBuffer;", "es2017"],
  ["sab-byteLength", "return new SharedArrayBuffer(8).byteLength;", "es2017"],
  ["sab-tag", "return Object.prototype.toString.call(new SharedArrayBuffer(8));", "es2017"],
  ["sab-instanceof", "return (new SharedArrayBuffer(8)) instanceof SharedArrayBuffer;", "es2017"],
  ["sab-slice-is-shared", "var q = new SharedArrayBuffer(8).slice(0, 4); return q.byteLength + ',' + (q instanceof SharedArrayBuffer);", "es2017"],
  ["sab-view", "var v = new Int32Array(new SharedArrayBuffer(8)); v[0] = 7; return v[0];", "es2017"],
  ["sab-growable", "return typeof new SharedArrayBuffer(8).grow + ',' + new SharedArrayBuffer(8).growable;", "es2024"],

  ["atomics-tag", "return Object.prototype.toString.call(Atomics);", "es2017"],
  ["atomics-add", "var v = new Int32Array(new SharedArrayBuffer(8)); Atomics.store(v, 0, 5); return Atomics.add(v, 0, 3) + ',' + Atomics.load(v, 0);", "es2017"],
  ["atomics-sub", "var v = new Int32Array(new SharedArrayBuffer(8)); Atomics.store(v, 0, 10); return Atomics.sub(v, 0, 4) + ',' + Atomics.load(v, 0);", "es2017"],
  ["atomics-and", "var v = new Int32Array(new SharedArrayBuffer(8)); Atomics.store(v, 0, 6); return Atomics.and(v, 0, 3) + ',' + v[0];", "es2017"],
  ["atomics-or", "var v = new Int32Array(new SharedArrayBuffer(8)); Atomics.store(v, 0, 5); return Atomics.or(v, 0, 2) + ',' + v[0];", "es2017"],
  ["atomics-xor", "var v = new Int32Array(new SharedArrayBuffer(8)); Atomics.store(v, 0, 5); return Atomics.xor(v, 0, 3) + ',' + v[0];", "es2017"],
  ["atomics-exchange", "var v = new Int32Array(new SharedArrayBuffer(8)); Atomics.store(v, 0, 1); return Atomics.exchange(v, 0, 9) + ',' + v[0];", "es2017"],
  ["atomics-compareExchange", "var v = new Int32Array(new SharedArrayBuffer(8)); Atomics.store(v, 0, 1); return Atomics.compareExchange(v, 0, 1, 9) + ',' + v[0];", "es2017"],
  ["atomics-compareExchange-miss", "var v = new Int32Array(new SharedArrayBuffer(8)); Atomics.store(v, 0, 1); return Atomics.compareExchange(v, 0, 5, 9) + ',' + v[0];", "es2017"],
  ["atomics-wraps", "var v = new Int8Array(new SharedArrayBuffer(4)); Atomics.store(v, 0, 127); return Atomics.add(v, 0, 1) + ',' + v[0];", "es2017"],
  ["atomics-through-buffer", "var b = new SharedArrayBuffer(8); var a = new Int32Array(b); var c = new Int32Array(b); Atomics.store(a, 0, 33); return c[0];", "es2017"],
  ["atomics-float-refused", "try { Atomics.load(new Float64Array(2), 0); return 'no'; } catch (e) { return e.constructor.name; }", "es2017"],
  ["atomics-non-typedarray", "try { Atomics.load([1, 2], 0); return 'no'; } catch (e) { return e.constructor.name; }", "es2017"],
  ["atomics-out-of-range", "try { Atomics.load(new Int32Array(2), 5); return 'no'; } catch (e) { return e.constructor.name; }", "es2017"],
  ["atomics-isLockFree", "return [1, 2, 4, 8, 3].map(function (n) { return Atomics.isLockFree(n); }).join(',');", "es2017"],
  ["atomics-notify", "var v = new Int32Array(new SharedArrayBuffer(8)); return Atomics.notify(v, 0, 1);", "es2017"],
  ["atomics-wait-not-equal", "var v = new Int32Array(new SharedArrayBuffer(8)); return Atomics.wait(v, 0, 7, 0);", "es2017"],
  ["atomics-wait-timed-out", "var v = new Int32Array(new SharedArrayBuffer(8)); return Atomics.wait(v, 0, 0, 0);", "es2017"],

  // --- BigInt (ES2020) -------------------------------------------------------
  // The whole point is the values a double cannot hold, so most of these are
  // written to fail if the arithmetic ever goes through one.
  ["bigint-typeof", "return typeof 10n;", "es2020"],
  ["bigint-literal", "return String(123n);", "es2020"],
  ["bigint-exact-above-2-53", "return String(9007199254740993n);", "es2020"],
  ["bigint-add", "return String(2n + 3n);", "es2020"],
  ["bigint-sub", "return String(5n - 8n);", "es2020"],
  ["bigint-mul-huge", "return String(123456789012345678901234567890n * 987654321098765432109876543210n);", "es2020"],
  ["bigint-factorial", "var f = 1n; for (var i = 1n; i <= 30n; i++) { f *= i; } return String(f);", "es2020"],
  ["bigint-div-truncates", "return String(7n / 2n) + ',' + String(-7n / 2n) + ',' + String(7n / -2n);", "es2020"],
  ["bigint-rem-sign", "return String(-7n % 3n) + ',' + String(7n % -3n);", "es2020"],
  ["bigint-pow", "return String(3n ** 40n);", "es2020"],
  ["bigint-pow-negative-exponent", "try { return String(2n ** -1n); } catch (e) { return e.constructor.name; }", "es2020"],
  ["bigint-div-zero", "try { return String(1n / 0n); } catch (e) { return e.constructor.name; }", "es2020"],
  ["bigint-shift-left", "return String(1n << 100n);", "es2020"],
  ["bigint-shift-right", "return String((1n << 100n) >> 50n);", "es2020"],
  ["bigint-shift-right-floors", "return String(-1n >> 1n) + ',' + String(-8n >> 2n) + ',' + String(-1n >> 100n);", "es2020"],
  ["bigint-and", "return String(12n & 10n) + ',' + String(-12n & 10n) + ',' + String(-12n & -10n);", "es2020"],
  ["bigint-or", "return String(12n | 10n) + ',' + String(-12n | 10n);", "es2020"],
  ["bigint-xor", "return String(12n ^ 10n) + ',' + String(-12n ^ 10n);", "es2020"],
  ["bigint-not", "return String(~5n) + ',' + String(~-5n) + ',' + String(~0n);", "es2020"],
  ["bigint-no-ushr", "try { return String(8n >>> 1n); } catch (e) { return e.constructor.name; }", "es2020"],
  ["bigint-increment", "var i = 1n; i++; ++i; return String(i);", "es2020"],
  ["bigint-decrement", "var i = 5n; i--; --i; return String(i);", "es2020"],
  ["bigint-compound", "var f = 2n; f *= 3n; f += 1n; f -= 2n; return String(f);", "es2020"],
  // Mixing with Number is a TypeError in arithmetic and legal in comparison.
  ["bigint-mix-add", "try { return String(1n + 1); } catch (e) { return e.constructor.name; }", "es2020"],
  ["bigint-mix-mul", "try { return String(1n * 2); } catch (e) { return e.constructor.name; }", "es2020"],
  ["bigint-unary-plus", "try { return String(+1n); } catch (e) { return e.constructor.name; }", "es2020"],
  ["bigint-unary-minus", "return String(-(5n));", "es2020"],
  ["bigint-compare-mixed", "return (1n < 2) + ',' + (2n > 1.5) + ',' + (1n < 1.5) + ',' + (2n <= 2) + ',' + (1n < NaN);", "es2020"],
  ["bigint-equality", "return (1n == 1) + ',' + (1n === 1) + ',' + (1n == '1') + ',' + (1n == 1.5) + ',' + (1n === 1n);", "es2020"],
  ["bigint-falsy", "return (0n ? 't' : 'f') + ',' + (1n ? 't' : 'f') + ',' + (!0n);", "es2020"],
  ["bigint-string-concat", "return 'x' + 1n + 'y';", "es2020"],
  ["bigint-template", "return `v=${42n}`;", "es2020"],
  ["bigint-ctor-number", "return String(BigInt(42));", "es2020"],
  ["bigint-ctor-string", "return String(BigInt('123456789012345678901234567890'));", "es2020"],
  ["bigint-ctor-radix-strings", "return String(BigInt('0xff')) + ',' + String(BigInt('0b101')) + ',' + String(BigInt('0o17'));", "es2020"],
  ["bigint-ctor-bad-string", "try { BigInt('12x'); return 'no'; } catch (e) { return e.constructor.name; }", "es2020"],
  ["bigint-ctor-fraction", "try { BigInt(1.5); return 'no'; } catch (e) { return e.constructor.name; }", "es2020"],
  ["bigint-ctor-nan", "try { BigInt(NaN); return 'no'; } catch (e) { return e.constructor.name; }", "es2020"],
  ["bigint-ctor-boolean", "return String(BigInt(true)) + ',' + String(BigInt(false));", "es2020"],
  ["bigint-not-a-constructor", "try { new BigInt(1); return 'no'; } catch (e) { return e.constructor.name; }", "es2020"],
  ["bigint-typeof-ctor", "return typeof BigInt;", "es2020"],
  ["bigint-toString-radix", "return (255n).toString(16) + ',' + (255n).toString(2) + ',' + (-255n).toString(36);", "es2020"],
  ["bigint-toString-bad-radix", "try { (1n).toString(99); return 'no'; } catch (e) { return e.constructor.name; }", "es2020"],
  ["bigint-asIntN", "return String(BigInt.asIntN(8, 255n)) + ',' + String(BigInt.asIntN(8, 128n)) + ',' + String(BigInt.asIntN(64, 2n ** 63n));", "es2020"],
  ["bigint-asUintN", "return String(BigInt.asUintN(8, -1n)) + ',' + String(BigInt.asUintN(64, -1n));", "es2020"],
  ["bigint-Number-of", "return Number(10n) + ',' + Number(2n ** 60n);", "es2020"],
  ["bigint-json-refused", "try { JSON.stringify({ a: 1n }); return 'no'; } catch (e) { return e.constructor.name; }", "es2020"],
  ["bigint-sort", "return [3n, 1n, 2n].sort(function (a, b) { return a < b ? -1 : a > b ? 1 : 0; }).join(',');", "es2020"],
  ["bigint64array", "var a = new BigInt64Array(2); a[0] = -1n; return String(a[0]) + ',' + a.length + ',' + a.BYTES_PER_ELEMENT;", "es2020"],
  ["biguint64array-wraps", "var a = new BigUint64Array(1); a[0] = -1n; return String(a[0]);", "es2020"],
  ["bigint64array-refuses-number", "try { var a = new BigInt64Array(1); a[0] = 5; return 'no'; } catch (e) { return e.constructor.name; }", "es2020"],
  ["bigint64array-over-buffer", "var b = new ArrayBuffer(8); var a = new BigInt64Array(b); var d = new DataView(b); a[0] = 258n; return d.getUint8(0) + ',' + d.getUint8(1);", "es2020"],
  ["dataview-bigint-roundtrip", "var d = new DataView(new ArrayBuffer(8)); d.setBigInt64(0, -2n); return String(d.getBigInt64(0)) + ',' + String(d.getBigUint64(0));", "es2020"],
  ["dataview-bigint-refuses-number", "try { new DataView(new ArrayBuffer(8)).setBigInt64(0, 5); return 'no'; } catch (e) { return e.constructor.name; }", "es2020"],

  // --- optional chaining: the WHOLE chain short-circuits ---------------------
  ["optchain-whole-chain", "var o = null; return String(o?.a.b.c);", "es2020"],
  ["optchain-call-in-chain", "var o = null; return String(o?.a());", "es2020"],
  ["optchain-index-in-chain", "var o = null; return String(o?.[0][1]);", "es2020"],
  ["optchain-deep-undefined", "var o = { a: undefined }; return String(o.a?.b.c.d);", "es2020"],
  ["optchain-fn-then-prop", "var o = {}; return String(o.f?.().x);", "es2020"],
  ["optchain-call-then-call", "var o = null; return String(o?.a().b());", "es2020"],
  ["optchain-after-call", "var o = { f: function () { return null; } }; return String(o.f()?.a.b);", "es2020"],
  ["optchain-rest-not-evaluated", "var n = 0; var o = null; var x = o?.a[n++].b; return n + ',' + String(x);", "es2020"],
  ["optchain-side-effect-once", "var n = 0; function g() { n++; return null; } var x = g()?.a.b; return n + ',' + String(x);", "es2020"],
  ["optchain-does-not-leak", "var n = 0; var o = null; o?.[n++]; return n;", "es2020"],
  ["optchain-arg-isolated", "function f(x) { return '[' + x + ']'; } var o = null; return f(o?.a.b) + '|ok';", "es2020"],
  ["optchain-not-nullish", "var o = { a: { b: { c: 7 } } }; return o?.a.b.c;", "es2020"],
  ["optchain-in-template", "var o = null; return `${o?.a.b}`;", "es2020"],

  // --- annexB accessor helpers ----------------------------------------------
  ["defineGetter", "var o = {}; o.__defineGetter__('x', function () { return 5; }); return o.x;", "annexB"],
  ["defineSetter", "var o = {}; var v; o.__defineSetter__('y', function (a) { v = a; }); o.y = 3; return v;", "annexB"],
  ["defineGetter-enumerable", "var o = {}; o.__defineGetter__('x', function () { return 1; }); return Object.keys(o).join(',');", "annexB"],
  ["defineGetter-noncallable", "try { ({}).__defineGetter__('x', 1); return 'no'; } catch (e) { return e.constructor.name; }", "annexB"],
  ["lookupGetter", "var o = { get x() { return 1; } }; return typeof o.__lookupGetter__('x');", "annexB"],
  ["lookupSetter", "var o = { set x(v) {} }; return typeof o.__lookupSetter__('x');", "annexB"],
  ["lookupGetter-up-chain", "var p = { get x() { return 1; } }; var o = Object.create(p); return typeof o.__lookupGetter__('x');", "annexB"],
  ["lookupGetter-shadowed", "var p = { get x() { return 1; } }; var o = Object.create(p); o.x = 2; return String(o.__lookupGetter__('x'));", "annexB"],
  ["lookupGetter-absent", "return String(({}).__lookupGetter__('nope'));", "annexB"],

  // --- ArrayBuffer transfer / resize (ES2024) --------------------------------
  ["ab-detached-false", "return new ArrayBuffer(8).detached;", "es2024"],
  ["ab-transfer", "var b = new ArrayBuffer(8); var c = b.transfer(); return c.byteLength + ',' + b.byteLength + ',' + b.detached;", "es2024"],
  ["ab-transfer-size", "return new ArrayBuffer(8).transfer(16).byteLength;", "es2024"],
  ["ab-transfer-twice", "var b = new ArrayBuffer(8); b.transfer(); try { b.transfer(); return 'no'; } catch (e) { return e.constructor.name; }", "es2024"],
  ["ab-transfer-keeps-bytes", "var b = new ArrayBuffer(4); new Uint8Array(b)[0] = 9; return new Uint8Array(b.transfer())[0];", "es2024"],
  ["ab-transfer-empties-view", "var b = new ArrayBuffer(4); var v = new Uint8Array(b); v[0] = 9; b.transfer(); return v[0];", "es2024"],
  ["ab-resizable", "var b = new ArrayBuffer(8, { maxByteLength: 16 }); return b.resizable + ',' + b.maxByteLength;", "es2024"],
  ["ab-not-resizable", "var b = new ArrayBuffer(8); return b.resizable + ',' + b.maxByteLength;", "es2024"],
  ["ab-resize", "var b = new ArrayBuffer(8, { maxByteLength: 16 }); b.resize(12); return b.byteLength;", "es2024"],
  ["ab-resize-too-big", "var b = new ArrayBuffer(8, { maxByteLength: 16 }); try { b.resize(20); return 'no'; } catch (e) { return e.constructor.name; }", "es2024"],
  ["ab-resize-fixed", "try { new ArrayBuffer(8).resize(4); return 'no'; } catch (e) { return e.constructor.name; }", "es2024"],

  // --- Map.groupBy -----------------------------------------------------------
  ["map-groupBy", "var m = Map.groupBy([1, 2, 3], function (x) { return x % 2 ? 'odd' : 'even'; }); return m.get('odd').join(',') + '|' + m.get('even').join(',');", "es2024"],
  ["map-groupBy-object-key", "var k = {}; var m = Map.groupBy([1, 2], function () { return k; }); return m.get(k).join(',');", "es2024"],
  ["map-groupBy-size", "return Map.groupBy([1, 2, 3, 4], function (x) { return x % 2; }).size;", "es2024"],
  ["map-groupBy-noncallable", "try { Map.groupBy([1], 5); return 'no'; } catch (e) { return e.constructor.name; }", "es2024"],

  // --- class fields: computed names, privacy, and derived ordering -----------
  ["class-field-computed", "var k = 'q'; class FcA { [k] = 7; } return new FcA().q;", "es2022"],
  ["class-static-field-computed", "var k = 's'; class FcB { static [k] = 8; } return FcB.s;", "es2022"],
  // A private field is not a property: no enumeration, no JSON, no read from
  // outside the class.
  ["class-private-not-enumerable", "class FcC { #a = 1; b = 2; } return Object.keys(new FcC()).join(',');", "es2022"],
  ["class-private-not-in-json", "class FcD { #a = 1; b = 2; } return JSON.stringify(new FcD());", "es2022"],
  ["class-private-not-in-gopn", "class FcE { #a = 1; b = 2; } return Object.getOwnPropertyNames(new FcE()).join(',');", "es2022"],
  ["class-private-not-in-forin", "class FcF { #a = 1; b = 2; } var out = []; for (var k in new FcF()) { out.push(k); } return out.join(',');", "es2022"],
  ["class-private-not-spread", "class FcG { #a = 1; b = 2; } return JSON.stringify(Object.assign({}, new FcG()));", "es2022"],
  ["class-private-brand-throws", "class FcH { #a = 1; static read(o) { return o.#a; } } try { FcH.read({}); return 'no'; } catch (e) { return e.constructor.name; }", "es2022"],
  ["class-private-brand-ok", "class FcI { #a = 7; static read(o) { return o.#a; } } return FcI.read(new FcI());", "es2022"],
  ["class-private-in", "class FcJ { #a = 1; static has(o) { return #a in o; } } return FcJ.has(new FcJ()) + ',' + FcJ.has({});", "es2022"],
  ["class-private-accessor", "class FcK { #v = 1; get v() { return this.#v; } set v(x) { this.#v = x; } } var c = new FcK(); c.v = 9; return c.v;", "es2022"],
  ["class-private-method", "class FcL { #m() { return 3; } run() { return this.#m(); } } return new FcL().run();", "es2022"],
  // §15.7.14: a derived class installs its fields when super() RETURNS, so the
  // base constructor cannot see them.
  ["class-derived-field-order", "class FcM { constructor() { this.init(); } init() {} } class FcN extends FcM { x = 5; init() { this.seen = this.x; } } var b = new FcN(); return String(b.seen) + ',' + b.x;", "es2022"],
  ["class-base-field-order", "class FcO { x = 5; constructor() { this.seen = this.x; } } return new FcO().seen;", "es2022"],
  ["class-derived-explicit-ctor", "class FcP { constructor() { this.init(); } init() {} } class FcQ extends FcP { x = 5; constructor() { super(); this.after = this.x; } init() { this.seen = this.x; } } var b = new FcQ(); return String(b.seen) + ',' + b.after;", "es2022"],

  // --- Unicode property escapes (ES2018) -------------------------------------
  ["re-prop-L", "return /\\p{L}/u.test('é') + ',' + /\\p{L}/u.test('1');", "es2018"],
  ["re-prop-Lu", "return /\\p{Lu}/u.test('A') + ',' + /\\p{Lu}/u.test('a');", "es2018"],
  ["re-prop-Ll", "return /^\\p{Ll}+$/u.test('abc');", "es2018"],
  ["re-prop-N", "return /\\p{N}/u.test('٣');", "es2018"],
  ["re-prop-Nd", "return /^\\p{Nd}+$/u.test('123');", "es2018"],
  ["re-prop-negated", "return /\\P{L}/u.test('1') + ',' + /\\P{L}/u.test('a');", "es2018"],
  ["re-prop-script-greek", "return /\\p{Script=Greek}/u.test('α') + ',' + /\\p{Script=Greek}/u.test('a');", "es2018"],
  ["re-prop-script-han", "return /\\p{Script=Han}/u.test('漢');", "es2018"],
  ["re-prop-sc-short", "return /\\p{sc=Latin}/u.test('a');", "es2018"],
  ["re-prop-gc-long", "return /\\p{General_Category=Lu}/u.test('Q');", "es2018"],
  ["re-prop-white-space", "return /\\p{White_Space}/u.test('\\u00a0');", "es2018"],
  ["re-prop-alphabetic", "return /\\p{Alphabetic}/u.test('ñ');", "es2018"],
  ["re-prop-ascii", "return /^\\p{ASCII}+$/u.test('hi') + ',' + /^\\p{ASCII}+$/u.test('hí');", "es2018"],
  ["re-prop-in-class", "return /^[\\p{L}\\p{Nd}]+$/u.test('ab12é');", "es2018"],
  ["re-prop-in-negated-class", "return /^[^\\p{L}]+$/u.test('123');", "es2018"],
  // An astral letter is one CODE POINT; a class that saw only the high
  // surrogate matched nothing.
  ["re-prop-astral", "return /\\p{L}/u.test('\\u{10400}');", "es2018"],
  ["re-prop-emoji", "return /\\p{Emoji}/u.test('😀');", "es2018"],
  ["re-prop-quantified", "return /\\p{L}+/u.exec('héllo world')[0];", "es2018"],
  ["re-prop-replace", "return 'a1b2'.replace(/\\p{Nd}/gu, '#');", "es2018"],
  ["re-prop-M", "return /\\p{M}/u.test('\\u0301');", "es2018"],
  ["re-prop-P", "return /\\p{P}/u.test('!');", "es2018"],
  ["re-prop-S", "return /\\p{S}/u.test('+');", "es2018"],
  ["re-prop-unknown-name", "try { new RegExp('\\\\p{Nope}', 'u'); return 'no'; } catch (e) { return e.constructor.name; }", "es2018"],
  // Without `u`, \p is an identity escape and means the letter p.
  ["re-prop-no-u-flag", "return /\\p{L}/.test('p{L}');", "es2018"],

  // Unicode-mode literals: a braced quantifier, a braced code point, and an
  // astral character, none of which the u-mode validator used to accept.
  ["re-u-braced-quantifier", "return /a{2}/u.test('aa') + ',' + /a{2,}/u.test('aaa') + ',' + /a{2,4}/u.test('aaa');", "es2015"],
  ["re-u-codepoint-escape", "return /\\u{41}/u.test('A');", "es2015"],
  ["re-u-astral-escape", "return /\\u{10400}/u.test('\\u{10400}');", "es2015"],
  ["re-u-astral-in-class", "return /[\\u{10400}]/u.test('\\u{10400}');", "es2015"],
  ["re-u-astral-dot", "return /./u.exec('\\u{10400}')[0].length;", "es2015"],
  ["string-astral-escape", "var s = '\\u{10400}'; return s.length + ',' + s.charCodeAt(0) + ',' + s.codePointAt(0);", "es2015"],

  // --- async iteration -------------------------------------------------------
  ["async-iterator-symbol-exists", "return typeof Symbol.asyncIterator;", "es2018"],

  // --- the `v` flag: a class is a SET EXPRESSION (ES2024) --------------------
  ["re-v-flags", "return /a/v.flags + ',' + /a/v.unicodeSets + ',' + /a/u.unicodeSets;", "es2024"],
  ["re-v-basic", "return /^[a-z]+$/v.test('abc');", "es2024"],
  ["re-v-difference", "return /[\\p{ASCII}--[a-z]]/v.test('A') + ',' + /[\\p{ASCII}--[a-z]]/v.test('a');", "es2024"],
  ["re-v-difference-literal", "var r = /^[[a-z]--[aeiou]]+$/v; return r.test('bcd') + ',' + r.test('abc');", "es2024"],
  ["re-v-intersection", "return /[\\p{L}&&\\p{Ll}]/v.test('a') + ',' + /[\\p{L}&&\\p{Ll}]/v.test('A');", "es2024"],
  ["re-v-intersection-literal", "var r = /^[[a-m]&&[g-z]]+$/v; return r.test('gh') + ',' + r.test('ab');", "es2024"],
  ["re-v-nested-union", "var r = /^[[a-c][0-9]]+$/v; return r.test('a1c') + ',' + r.test('z');", "es2024"],
  ["re-v-three-way", "var r = /^[[\\p{L}--[a-z]]--[A-Z]]+$/v; return r.test('é') + ',' + r.test('A');", "es2024"],
  // \q{...} is the one construct that puts multi-character STRINGS in a class.
  ["re-v-strings", "var r = /^[\\q{abc|d}]$/v; return r.test('abc') + ',' + r.test('d') + ',' + r.test('x');", "es2024"],
  ["re-v-strings-longest-wins", "return /^[\\q{abc|a}]$/v.test('abc');", "es2024"],
  ["re-v-strings-mixed-with-chars", "return /^[\\q{ab}c]+$/v.test('abc');", "es2024"],
  ["re-v-negated", "var r = /^[^a-z]+$/v; return r.test('ABC') + ',' + r.test('abc');", "es2024"],
  ["re-v-properties", "return /^\\p{L}+$/v.test('héllo');", "es2024"],
  ["re-v-astral", "return /^[\\p{L}]+$/v.test('\\u{10400}');", "es2024"],
  ["re-v-replace", "return 'a1b2'.replace(/[\\p{Nd}]/gv, '#');", "es2024"],
  // `u` and `v` are alternatives, not companions.
  ["re-v-u-conflict", "try { new RegExp('a', 'uv'); return 'no'; } catch (e) { return e.constructor.name; }", "es2024"],

  // --- surrogate pairs written as two escapes --------------------------------
  // A high escape followed by a low one is ONE character. On the code-point
  // target the halves are not representable individually, so they are combined
  // as they are read; on the byte target the pair is one four-byte sequence,
  // not two encoded halves, or the same character written two ways compares
  // unequal.
  ["string-surrogate-pair-escape", "var s = '\\ud801\\udc00'; return s.length + ',' + s.charCodeAt(0) + ',' + s.charCodeAt(1) + ',' + s.codePointAt(0);", "es2015"],
  ["string-pair-equals-codepoint", "return '\\ud801\\udc00' === '\\u{10400}';", "es2015"],
  ["string-pair-equals-literal", "return '\\u{1F600}' === '😀';", "es2015"],
  ["string-pair-in-middle", "var s = 'a\\ud801\\udc00b'; return s.length + ',' + s.codePointAt(1);", "es2015"],
  ["string-two-pairs", "var s = '\\ud83d\\ude00\\ud83d\\ude01'; return s.length + ',' + s.codePointAt(0) + ',' + s.codePointAt(2);", "es2015"],
  ["string-pair-then-text", "var s = '\\ud801\\udc00z'; return s.length + ',' + s.charCodeAt(2);", "es2015"],
  ["re-pair-escape-property", "return /\\p{L}/u.test('\\ud801\\udc00');", "es2018"],

  // --- trailing commas (ES2017) ---------------------------------------------
  ["trailing-comma-fn-decl", "function f(a, b,) { return a + b; } return f(1, 2,);", "es2017"],
  ["trailing-comma-arrow", "var f = (a, b,) => a + b; return f(1, 2);", "es2017"],
  ["trailing-comma-method", "class TcA { m(a,) { return a; } } return new TcA().m(3,);", "es2017"],
  ["trailing-comma-obj-method", "var o = { m(a, b,) { return a * b; } }; return o.m(2, 3,);", "es2017"],
  ["trailing-comma-fn-expr", "var f = function (a,) { return a; }; return f(9,);", "es2017"],
  ["trailing-comma-nested-call", "function g(x) { return x; } return g(g(1,),);", "es2017"],
  ["trailing-comma-new", "function C(a,) { this.a = a; } return new C(4,).a;", "es2017"],
  ["trailing-comma-defaults", "function f(a = 1, b = 2,) { return a + b; } return f();", "es2017"],
  ["trailing-comma-after-spread", "function f(a, b) { return a + b; } return f(...[1, 2],);", "es2017"],
  ["trailing-comma-destructure", "var [a, b,] = [1, 2]; var { c, d, } = { c: 3, d: 4 }; return a + b + c + d;", "es2017"],
  // ...but a rest parameter may NOT be followed by one.
  ["trailing-comma-after-rest-is-error", "try { eval('function q(...x,){}'); return 'accepted'; } catch (e) { return e.constructor.name; }", "es2017"],

  // --- optional chaining: the remaining forms --------------------------------
  ["optchain-computed", "var o = { a: [1, 2] }; return o?.a?.[1];", "es2020"],
  ["optchain-computed-nullish", "var o = null; return String(o?.['k']);", "es2020"],
  ["optchain-computed-call", "var o = { f: function () { return 7; } }; var k = 'f'; return o?.[k]();", "es2020"],
  ["optchain-computed-call-nullish", "var o = null; var k = 'f'; return String(o?.[k]());", "es2020"],
  ["optchain-call-spread", "var o = { f: function (a, b) { return a + b; } }; return o.f?.(...[1, 2]);", "es2020"],
  ["optchain-call-spread-nullish", "var o = null; return String(o?.f(...[1]));", "es2020"],
  ["optchain-method-spread", "var o = { f: function () { return arguments.length; } }; return o?.f(...[1, 2, 3]);", "es2020"],
  ["optchain-across-lines", "var o = { a: { b: 2 } }; return o\n  ?.a\n  ?.b;", "es2020"],
  ["optchain-delete", "var o = { a: { b: 1 } }; delete o?.a?.b; return JSON.stringify(o);", "es2020"],

  // --- logical assignment: the WRITE is skipped, not just the value ----------
  ["logical-or-assign", "var a = 0; a ||= 5; return a;", "es2021"],
  ["logical-and-assign", "var a = 1; a &&= 5; return a;", "es2021"],
  ["logical-nullish-assign", "var a = null; a ??= 5; return a;", "es2021"],
  // §13.15.2: a short-circuited form does not call the setter at all.
  ["logical-or-skips-setter", "var n = 0; var o = { get v() { return 1; }, set v(x) { n++; } }; o.v ||= 2; return n;", "es2021"],
  ["logical-or-calls-setter", "var n = 0; var o = { get v() { return 0; }, set v(x) { n++; } }; o.v ||= 2; return n;", "es2021"],
  ["logical-and-skips-setter", "var n = 0; var o = { get v() { return 0; }, set v(x) { n++; } }; o.v &&= 2; return n;", "es2021"],
  ["logical-nullish-skips-setter", "var n = 0; var o = { get v() { return 1; }, set v(x) { n++; } }; o.v ??= 2; return n;", "es2021"],
  ["logical-rhs-not-evaluated", "var n = 0; function rhs() { n++; return 9; } var a = 1; a ||= rhs(); return n;", "es2021"],
  ["logical-nullish-rhs-not-evaluated", "var n = 0; function rhs() { n++; return 9; } var a = 0; a ??= rhs(); return n + ',' + a;", "es2021"],

  // --- Error.cause (ES2022) --------------------------------------------------
  ["error-cause", "return new Error('x', { cause: 'why' }).cause;", "es2022"],
  ["error-cause-object", "var inner = new Error('inner'); return new Error('outer', { cause: inner }).cause.message;", "es2022"],
  ["error-cause-absent", "return ('cause' in new Error('x'));", "es2022"],
  ["error-cause-empty-options", "return ('cause' in new Error('x', {}));", "es2022"],
  ["error-cause-undefined-value", "var e = new Error('x', { cause: undefined }); return ('cause' in e) + ',' + String(e.cause);", "es2022"],
  ["error-cause-not-enumerable", "var e = new Error('x', { cause: 1 }); return Object.keys(e).join(',');", "es2022"],
  ["error-cause-subclass", "return new TypeError('t', { cause: 2 }).cause + ',' + new RangeError('r', { cause: 3 }).cause;", "es2022"],
  ["error-cause-without-new", "return Error('x', { cause: 4 }).cause;", "es2022"],
  ["error-cause-aggregate", "return new AggregateError([1], 'm', { cause: 5 }).cause;", "es2022"],
  ["error-cause-chain", "var a = new Error('a'); var b = new Error('b', { cause: a }); var c = new Error('c', { cause: b }); return c.cause.cause.message;", "es2022"],
  // An error's own name and message are NOT enumerable, so it serialises as {}.
  ["error-not-enumerable", "return Object.keys(new Error('x')).join(',');", "es5"],
  ["error-json", "return JSON.stringify(new Error('x'));", "es5"],
  ["error-message-descriptor", "return JSON.stringify(Object.getOwnPropertyDescriptor(new Error('x'), 'message'));", "es5"],
];

/**
 * Probes the evaluator does not yet handle. Each entry is a live assertion:
 * the suite fails if one of these starts working and is not removed, so the
 * list cannot drift away from reality.
 *
 * Recorded 2026-08-02 against gallery/game_engine/v2/interp.
 */
const KNOWN_GAPS = new Set<string>([
  // A map key literally named `__proto__` cannot be stored: the es6 target
  // compiles a Ranger string map to a plain JS object, and assigning that name
  // sets the prototype instead of creating a property. Fixing it means changing
  // how EVERY map write is emitted (Object.defineProperty on a hot path, or a
  // template that evaluates its key and value twice), which costs more than the
  // one behaviour it buys. Asserted in both directions so it cannot rot.
  "json-proto-is-ordinary-key",
  // The six that used to sit here -- for-of-expr-lhs, destr-swap,
  // iter-generator, obj-computed-key, err-optional-chain, err-nullish -- now
  // pass and have moved back into the ordinary probe set above. This assertion
  // is what forced the move: it failed the moment they started passing, which
  // is the whole point of listing a gap rather than deleting its probe.
  //
  // One carries a caveat worth keeping in view: generators are collected
  // EAGERLY at call time (ComponentEngine.makeGeneratorValue), so `iter-generator`
  // passing does not mean two-way next(v) or lazy consumption works. Those are
  // named at the implementation.
]);

/**
 * Probes that must run as a SCRIPT rather than inside a function, because what
 * they check IS the script's global scope: a top-level `var` and a function
 * declaration are properties of the global object, and top-level `this` is that
 * object. A function wrapper makes those names locals and the rules invisible.
 *
 * Each entry is a whole program that assigns its answer to `__out__`. Node runs
 * the same text in a `vm` context, which gives a real script global — `new
 * Function` would reintroduce exactly the wrapper being avoided.
 */
const SCRIPT_PROBES: Array<[name: string, src: string]> = [
  ["script-this-is-globalthis", "__out__ = String(this === globalThis);"],
  ["script-var-is-global-property", "var q = 3;\n__out__ = String(this.q);"],
  ["script-fndecl-is-global-property", "function f() { return 1; }\n__out__ = typeof this.f;"],
  ["script-var-in-block-is-global-property", "if (true) { var w = 4; }\n__out__ = String(this.w);"],
  ["script-var-in-try-is-global-property", "try { var t = 5; } catch (e) {}\n__out__ = String(this.t);"],
  ["script-var-property-tracks-reassignment", "var r = 1;\nr = 2;\n__out__ = String(this.r);"],
  ["script-let-is-not-global-property", "let m = 1;\n__out__ = String(this.m);"],
  ["script-const-is-not-global-property", "const k = 1;\n__out__ = String(this.k);"],
  ["script-hoisted-var-is-undefined-property", "__out__ = String(this.later);\nvar later = 9;"],
  ["script-implicit-global-is-property", "zz = 7;\n__out__ = String(this.zz);"],
  ["script-global-tostring-override", "var toString = function () { return '__THIS__'; };\n__out__ = String(this);"],
  ["script-function-local-var-is-not-global", "var s = 1;\nfunction g() { var s = 2; return s; }\ng();\n__out__ = String(this.s);"],
  ["script-var-initialiser-runs-in-order", "var a = 1;\nvar b = a + 1;\n__out__ = String(a) + String(b);"],
  ["script-call-before-var-fn-is-typeerror", "try { __f(); __out__ = 'no-throw'; } catch (e) { __out__ = e.name; }\nvar __f = function () { return 1; };"],
  ["script-for-head-var-is-hoisted", "try { idx = idx; __out__ = 'ok'; } catch (e) { __out__ = e.name; }\nfor (var idx = 0; idx < 2; idx++) { ; }"],
  // §10.5: a `var` buried in a try/if/loop is still a script var, so it exists
  // (holding undefined) from the first statement — a call through it is a
  // TypeError, not a ReferenceError.
  ["script-call-before-nested-var-fn-is-typeerror", "try { __g(); __out__ = 'no-throw'; } catch (e) { __out__ = e.name; }\ntry { var __g = function () { return 1; }; } catch (e2) {}"],
  ["script-nested-var-hoisted-to-undefined", "__out__ = String(typeof __h);\nif (true) { var __h = 1; }"],
  // The binding and the global object property are ONE location, in both
  // directions.
  ["script-global-property-write-visible-as-name", "this['dv'] = 'baloon';\n__out__ = String(dv);\nvar dv;"],
  ["script-global-var-is-dontdelete", "var dd = 1;\n__out__ = String(delete this['dd']) + String(delete dd) + String(dd);"],
  ["script-implicit-global-is-deletable", "ig = 1;\n__out__ = String(delete this['ig']) + String(typeof ig);"],
  // §12.10: a `var` in a with body belongs to the script, property and all.
  ["script-with-var-is-global-property", "var wo = { a: 2 };\nwith (wo) { var wf = function () { return 1; }; }\n__out__ = String(wo.hasOwnProperty('wf')) + String(typeof this.wf);"],
];

/**
 * Script-level probes that do NOT hold, asserted in both directions like
 * KNOWN_GAPS so a fix forces the list to be updated.
 */
const SCRIPT_KNOWN_GAPS = new Set<string>([]);

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

  // Dynamic import(). It answers a promise, so what each probe reports is
  // whatever the settled callbacks wrote into these bindings -- loadScript
  // drains the microtask queue before it returns, the same as a module job
  // finishing before the host runs anything else.
  "var dynNs = null;",
  "var dynMissingErr = 'never-settled';",
  "var dynAwaited = 'never-settled';",
  "var dynSameObject = 'never-settled';",
  "var dynTag = 'never-settled';",
  "import('ranger:probe').then(function (ns) { dynNs = ns; });",
  "import('ranger:notregistered').then(function () { dynMissingErr = 'RESOLVED'; }, function (e) { dynMissingErr = e.constructor.name; });",
  "(async function () { var ns = await import('ranger:probe'); dynAwaited = ns.twice(16); })();",
  "Promise.all([import('ranger:probe'), import('ranger:probe')]).then(function (rs) { dynSameObject = (rs[0] === rs[1]) ? 'same' : 'different'; dynTag = Object.prototype.toString.call(rs[0]); });",
  "function dynIsThenable() { return typeof import('ranger:probe').then; }",
  "function dynExpressionSpecifier() { var s = 'ranger:' + 'probe'; return typeof import(s).then; }",
  "function dynReadExport() { if (dynNs === null) { return '<never-settled>'; } return dynNs.exported; }",
  "function dynCallExport() { if (dynNs === null) { return -1; } return dynNs.twice(11); }",
  "function dynUnexportedStillReachable() { if (dynNs === null) { return '<never-settled>'; } if (dynNs.notShown === undefined) { return 'blocked'; } return 'REACHABLE'; }",
  "function dynMissingRejects() { return dynMissingErr; }",
  "function dynAwaitedValue() { return dynAwaited; }",
  "function dynIdentity() { return dynSameObject; }",
  "function dynToStringTag() { return dynTag; }",
  "function dynMatchesStaticNamespace() { if (dynNs === null) { return '<never-settled>'; } return (dynNs === NS) ? 'same' : 'different'; }",
].join("\n");

/** Cross-module checks that already hold. */
const MODULE_EXPECTATIONS: Array<[fn: string, expected: unknown, what: string]> = [
  ["readExportedConst", 20, "a named import of an exported const"],
  ["callExportedFn", 42, "a named import of an exported function"],
  ["readViaNamespace", 20, "namespace access to an exported const"],
  ["callViaNamespace", 40, "a namespace call to an exported function"],
  ["entryOnlyBinding", "undefined", "a binding the module never declared"],

  // Dynamic import(). These expectations are hand-written rather than derived
  // from Node, because `ranger:probe` is a specifier only this engine resolves.
  // Every one of them is a plain spec rule -- import() answers a promise, a
  // specifier that resolves to nothing rejects, and a module has ONE namespace.
  ["dynIsThenable", "function", "import() answers a promise"],
  ["dynExpressionSpecifier", "function", "a computed specifier expression"],
  ["dynReadExport", 20, "an exported const through a dynamic namespace"],
  ["dynCallExport", 22, "an exported function through a dynamic namespace"],
  ["dynMissingRejects", "TypeError", "an unresolvable specifier rejects"],
  ["dynAwaitedValue", 32, "await import(...) inside an async function"],
  ["dynIdentity", "same", "two import() calls answer the same namespace"],
  ["dynMatchesStaticNamespace", "same", "import() and `import * as` share one namespace"],
  ["dynToStringTag", "[object Module]", "a namespace is branded Module, not Object"],
];

/**
 * Cross-module checks that do NOT hold: `export` is not enforced, so every
 * top-level binding of a module is reachable through its namespace. Listed the
 * same way as KNOWN_GAPS so a fix forces an update.
 */
const MODULE_KNOWN_GAPS: Array<[fn: string, what: string]> = [
  ["reachUnexportedConst", "an unexported const is reachable through the namespace"],
  ["reachUnexportedFn", "an unexported function is reachable through the namespace"],
  ["dynUnexportedStillReachable", "an unexported binding is reachable through a dynamic namespace"],
];

function buildEngineModuleIfNeeded(): void {
  const migrateSrc = path.join(
    ROOT_DIR,
    "gallery",
    "game_engine",
    "v2",
    "interp",
    "migrate",
    "src"
  );
  const deps = [
    ENGINE_SOURCE,
    path.join(migrateSrc, "EvalValue.rgr"),
    path.join(migrateSrc, "EvHandle.rgr"),
    path.join(migrateSrc, "EvValueBridge.rgr"),
  ];
  const modMtime = fs.existsSync(ENGINE_MODULE)
    ? fs.statSync(ENGINE_MODULE).mtimeMs
    : 0;
  const upToDate =
    modMtime > 0 && deps.every((d) => modMtime >= fs.statSync(d).mtimeMs);
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
    // E4: kind lives on body:EvalValue — use is* predicates (valueType is gone).
    if (r.isNumber()) return r.numberOf();
    if (r.isString()) return r.stringOf();
    if (r.isBoolean()) return r.boolOf();
    if (r.isUndefined()) return undefined;
    if (r.isNull()) return "<null>";
    return "<kind " + r.kindName() + ">";
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
    EvalValue = mod.EvHandle;

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

  const scriptOutcome = (src: string) => {
    const wrapped = "var __out__ = '<unset>';\n" + src + "\n";
    const context: any = vm.createContext({});
    vm.runInContext(wrapped, context);
    const expected = String(context.__out__);

    const e = new ComponentEngine();
    e.quiet = true;
    const original = console.log;
    console.log = () => {};
    let actual: string;
    try {
      e.loadScript(wrapped + "function __read__() { return __out__; }\n");
      actual = String(engineValue(e, "__read__"));
    } finally {
      console.log = original;
    }
    return { expected, actual };
  };

  describe("script-level rules match Node running the same script", () => {
    for (const [name, src] of SCRIPT_PROBES) {
      if (SCRIPT_KNOWN_GAPS.has(name)) continue;
      it(name, () => {
        const { expected, actual } = scriptOutcome(src);
        expect(actual).toEqual(expected);
      });
    }
  });

  it("script-level known gaps still fail (remove one when it is fixed)", () => {
    const nowWorking: string[] = [];
    for (const [name, src] of SCRIPT_PROBES) {
      if (!SCRIPT_KNOWN_GAPS.has(name)) continue;
      const { expected, actual } = scriptOutcome(src);
      if (actual === expected) nowWorking.push(name);
    }
    expect(nowWorking).toEqual([]);
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
