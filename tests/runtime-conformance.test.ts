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
  // string literal is DROPPED, while escaped quotes in the middle survive.
  // Found while implementing eval; recorded rather than hidden, since it
  // corrupts string values silently.
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
];

/**
 * Probes the evaluator does not yet handle. Each entry is a live assertion:
 * the suite fails if one of these starts working and is not removed, so the
 * list cannot drift away from reality.
 *
 * Recorded 2026-08-02 against gallery/game_engine/v2/interp.
 */
const KNOWN_GAPS = new Set<string>([
  // Lexer drops an escaped quote adjacent to the string's own delimiters.
  "lex-escaped-quote-edges",
  "lex-escaped-quote-single",
  // No RegExp implementation.
  "regex-test",
  "regex-exec",
  "regex-flags",
  "regex-replace",
  // Sequence expressions, labelled break and named function-expression
  // recursion evaluate to nothing.
  "seq-expr",
  "labeled-break",
  "fn-expr-named",
  "for-of-expr-lhs",
  // Destructuring: swap produces the wrong value.
  "destr-swap",
  // Generators parse but do not run.
  "iter-generator",
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
