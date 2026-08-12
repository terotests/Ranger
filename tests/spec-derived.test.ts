// ============================================================================
// spec-derived.test.ts — the features Node cannot be the oracle for.
// ============================================================================
//
// Every other suite here DERIVES its expectations: Node runs the probe, and the
// engine is compared against what Node produced. That rule is what keeps a
// probe that misunderstands JavaScript from encoding the misunderstanding.
//
// A few features cannot be checked that way in this repository, because no Node
// available here implements them:
//
//   RegExp.escape        ES2025, landed in V8 behind a flag after Node 22
//   pattern modifiers    `(?i:…)` / `(?-i:…)`, ES2025, same story
//   Promise.try          ES2025, same story
//
// (Checked, not assumed: the container has Node 20, 21 and 22; in all three
//  `new RegExp("(?i:a)")` is a SyntaxError, and `RegExp.escape` and
//  `Promise.try` are undefined.)
//
// So these expectations are SPEC-derived rather than Node-derived, and that is
// the whole reason this file is separate from runtime-conformance.test.ts —
// a reader can tell at a glance which guarantee each suite carries. The
// citations below are to the ECMAScript specification; when a Node that
// implements these reaches this repository, the right move is to move these
// probes into the derived suite and delete this file.
import { describe, it, expect, beforeAll } from "vitest";
import * as path from "path";
import * as fs from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const ENGINE_MODULE = path.join(
  ROOT_DIR, "gallery", "game_engine", "v2", "interp", "bin", "engine_module.cjs"
);

let ComponentEngine: any;
let EvalValue: any;

/** name, source, expected value. */
const CASES: Array<[name: string, body: string, want: unknown]> = [
  // §22.2.5.1 RegExp.escape. The result is a pattern that matches the input
  // LITERALLY, which is the property every case below is really testing.
  ["escape-is-a-function", "return typeof RegExp.escape;", "function"],
  // Every SyntaxCharacter, plus `/`, takes a backslash.
  ["escape-syntax-chars", "return RegExp.escape('^$\\\\.*+?()[]{}|/');",
    "\\^\\$\\\\\\.\\*\\+\\?\\(\\)\\[\\]\\{\\}\\|\\/"],
  // The FIRST code point is hex-escaped when it is an ASCII letter or digit,
  // so the result can never be read as the tail of a preceding \1 or \u.
  ["escape-leading-letter", "return RegExp.escape('hello');", "\\x68ello"],
  ["escape-leading-digit", "return RegExp.escape('1abc');", "\\x31abc"],
  // Whitespace is escaped wherever it appears; the control escapes keep their
  // short forms.
  ["escape-space", "return RegExp.escape('a b');", "\\x61\\x20b"],
  ["escape-controls", "return RegExp.escape('a\\tb\\nc');", "\\x61\\tb\\nc"],
  // A non-ASCII character is not special and is left alone.
  ["escape-keeps-unicode", "return RegExp.escape('héllo');", "\\x68éllo"],
  ["escape-rejects-non-string",
    "try { RegExp.escape(5); return 'no'; } catch (e) { return e.constructor.name; }",
    "TypeError"],
  // The property that matters: escape(s) matches s and nothing else.
  ["escape-roundtrip-dot",
    "var s = 'a.b'; var r = new RegExp(RegExp.escape(s)); return r.test('a.b') + ',' + r.test('axb');",
    "true,false"],
  ["escape-roundtrip-quantifier",
    "var s = '(a+b)'; var r = new RegExp(RegExp.escape(s)); return r.test('(a+b)') + ',' + r.test('aab');",
    "true,false"],
  ["escape-roundtrip-class",
    "var s = '[x]'; var r = new RegExp(RegExp.escape(s)); return r.test('[x]') + ',' + r.test('x');",
    "true,false"],
  ["escape-roundtrip-anchors",
    "var s = '^end$'; return new RegExp(RegExp.escape(s)).test('^end$');", true],
  ["escape-roundtrip-leading-digit",
    "var s = '1+1'; var r = new RegExp(RegExp.escape(s)); return r.test('1+1') + ',' + r.test('11');",
    "true,false"],

  // §22.2.1 pattern modifiers. A flag applies to the whole pattern; a modifier
  // applies to one group's subtree, and that scoping is the entire feature.
  ["modifier-i-on", "return new RegExp('(?i:ABC)').test('abc');", true],
  ["modifier-i-is-scoped",
    "var r = new RegExp('(?i:ab)c'); return r.test('ABc') + ',' + r.test('ABC');",
    "true,false"],
  ["modifier-i-off-inside-flag",
    "var r = new RegExp('(?-i:abc)', 'i'); return r.test('ABC') + ',' + r.test('abc');",
    "false,true"],
  ["modifier-s-on",
    "return new RegExp('(?s:a.b)').test('a\\nb') + ',' + new RegExp('a.b').test('a\\nb');",
    "true,false"],
  ["modifier-s-off-inside-flag",
    "return new RegExp('(?-s:a.b)', 's').test('a\\nb');", false],
  ["modifier-m-on", "return new RegExp('(?m:^b)').test('a\\nb');", true],
  ["modifier-combined", "return new RegExp('(?is:A.B)').test('a\\nb');", true],
  ["modifier-on-and-off",
    "var r = new RegExp('(?i-s:A.B)'); return r.test('a\\nb') + ',' + r.test('axb');",
    "false,true"],
  // The inner group turns `i` back off, so B must be uppercase — while a and c
  // around it stay insensitive. 'abC' therefore does NOT match: its middle
  // character is lowercase, and only the OUTER letters are forgiving.
  ["modifier-nested",
    "var r = new RegExp('(?i:a(?-i:B)c)'); return r.test('ABc') + ',' + r.test('abC') + ',' + r.test('abc');",
    "true,false,false"],
  // A modified group is NON-capturing.
  ["modifier-group-is-noncapturing",
    "var m = new RegExp('(?i:a)(b)').exec('Ab'); return m.length + ',' + m[1];", "2,b"],
  ["modifier-applies-to-class", "return new RegExp('(?i:[a-c])').test('B');", true],
  ["modifier-rejects-unknown-letter",
    "try { new RegExp('(?q:a)'); return 'no'; } catch (e) { return e.constructor.name; }",
    "SyntaxError"],

  // §27.2.4.6 Promise.try. Only the SYNCHRONOUS half is observable from a
  // probe that returns a value -- which is the interesting half anyway: the
  // callback runs immediately, and a throw from it becomes a rejection rather
  // than escaping the call.
  ["promise-try-is-a-function", "return typeof Promise.try;", "function"],
  ["promise-try-runs-synchronously", "var x = 0; Promise.try(function () { x = 1; }); return x;", 1],
  ["promise-try-answers-a-promise",
    "var p = Promise.try(function () { return 1; }); return (typeof p.then) + ',' + (p instanceof Promise);",
    "function,true"],
  ["promise-try-passes-arguments",
    "var seen = 0; Promise.try(function (a, b) { seen = a + b; }, 2, 3); return seen;", 5],
  ["promise-try-catches-a-throw",
    "var escaped = false; try { Promise.try(function () { throw new Error('x'); }).catch(function () {}); } catch (e) { escaped = true; } return escaped;",
    false],
  ["promise-try-rejects-non-callable",
    "var kind = 'none'; Promise.try(5).catch(function (e) { kind = e.constructor.name; }); return typeof Promise.try(5).catch;",
    "function"],
];

describe("ES2025 features with no Node oracle here", () => {
  let engine: any;
  const results = new Map<string, unknown>();

  beforeAll(() => {
    if (!fs.existsSync(ENGINE_MODULE)) {
      throw new Error("engine_module.cjs missing; run: bash scripts/build-engine-module.sh");
    }
    const require = createRequire(import.meta.url);
    const mod = require(ENGINE_MODULE);
    ComponentEngine = mod.ComponentEngine ?? mod.default?.ComponentEngine;
    // The module exports the handle type under EvHandle; `null()` on it is the
    // `this` a global function is called with.
    EvalValue = mod.EvHandle ?? mod.default?.EvHandle;
    engine = new ComponentEngine();
    engine.quiet = true;
    let src = "";
    for (const [name, body] of CASES) {
      src += "function probe_" + name.replace(/-/g, "_") + "() { " + body + " }\n";
    }
    const original = console.log;
    console.log = () => {};
    try {
      engine.loadScript(src);
    } finally {
      console.log = original;
    }
    for (const [name] of CASES) {
      const fn = "probe_" + name.replace(/-/g, "_");
      // Same read-out as runtime-conformance: the engine answers an EvHandle,
      // and the is* predicates say which primitive it holds.
      const r = engine.callFunction(fn, EvalValue.null());
      let out: unknown = "<missing>";
      if (r) {
        if (r.isNumber()) out = r.numberOf();
        else if (r.isString()) out = r.stringOf();
        else if (r.isBoolean()) out = r.boolOf();
        else if (r.isUndefined()) out = undefined;
        else if (r.isNull()) out = "<null>";
        else out = "<kind " + r.kindName() + ">";
      }
      results.set(name, out);
    }
  }, 120000);

  for (const [name, , want] of CASES) {
    it(`${name} matches the specification`, () => {
      expect(results.get(name)).toEqual(want);
    });
  }
});
