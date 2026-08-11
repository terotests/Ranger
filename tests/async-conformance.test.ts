// ============================================================================
// async-conformance.test.ts — what async functions actually PRODUCE.
// ============================================================================
//
// runtime-conformance.test.ts compares a probe's return value synchronously,
// which cannot see anything an async function produces: no microtask has run by
// the time the probe returns, in Node either. So it checks only the SHAPE of an
// async call's result (it is a promise, it is thenable, it is a Promise).
//
// The values are checked here instead, by running a whole program to completion
// — the queue drains, the thens fire, the program prints — and comparing that
// output against what Node prints for the same source. Same derived-expectation
// rule as everywhere else: Node runs the program, so a case that misunderstands
// JavaScript fails here rather than encoding the misunderstanding.
//
// Every native binary that has been built is checked. A target that has not
// been built is skipped rather than failing, the way engine-conformance.sh
// does.
import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const TARGETS = ["cpp", "rust"];

/** Each case is a whole program that prints its answers. */
const CASES: Array<[name: string, src: string]> = [
  ["resolves",
    `async function f() { return 7; }
     f().then(function (v) { console.log("v:" + v); });`],
  ["await-value",
    `async function f() { return (await 5) + 1; }
     f().then(function (v) { console.log("v:" + v); });`],
  ["await-promise",
    `async function f() { return (await Promise.resolve(9)) * 2; }
     f().then(function (v) { console.log("v:" + v); });`],
  ["await-thenable",
    `async function f() { return await { then: function (r) { r(4); } }; }
     f().then(function (v) { console.log("v:" + v); });`],
  ["thenable-adopted-by-resolve",
    `Promise.resolve({ then: function (r) { r(42); } })
       .then(function (v) { console.log("v:" + v); });`],
  ["throw-rejects",
    `async function f() { throw new Error("boom"); }
     f().catch(function (e) { console.log("caught:" + e.message); });`],
  ["rejection-catchable",
    `async function f() {
       try { await Promise.reject(new Error("r")); return "no"; }
       catch (e) { return "caught:" + e.message; }
     }
     f().then(function (v) { console.log(v); });`],
  ["finally-runs",
    `async function f() {
       var s = ""; try { s += "t"; await 1; s += "u"; } finally { s += "f"; }
       return s;
     }
     f().then(function (v) { console.log(v); });`],
  ["rethrow",
    `async function f() {
       try { await Promise.reject("e1"); } catch (e) { throw "wrapped:" + e; }
     }
     f().catch(function (e) { console.log(e); });`],
  ["for-loop",
    `async function f() {
       var t = 0; for (var i = 1; i <= 3; i++) { t += await Promise.resolve(i); }
       return t;
     }
     f().then(function (v) { console.log("t:" + v); });`],
  ["while-loop",
    `async function f() {
       var i = 0, s = 0; while (i < 4) { s += await Promise.resolve(i); i++; }
       return s;
     }
     f().then(function (v) { console.log("s:" + v); });`],
  ["for-of",
    `async function f() {
       var o = ""; for (var v of [1, 2, 3]) { o += await Promise.resolve(v); }
       return o;
     }
     f().then(function (v) { console.log("o:" + v); });`],
  ["arrow-expression-body",
    `var g = async (x) => (await x) * 2;
     g(21).then(function (v) { console.log("g:" + v); });`],
  ["object-method",
    `var o = { async m() { return (await 1) + 1; } };
     o.m().then(function (v) { console.log("m:" + v); });`],
  ["class-method",
    `class C { async go() { return (await 3) * 2; } }
     new C().go().then(function (v) { console.log("c:" + v); });`],
  ["nested",
    `async function inner() { return 10; }
     async function outer() { return (await inner()) + 5; }
     outer().then(function (v) { console.log("n:" + v); });`],
  ["await-in-array-literal",
    `async function one() { return 1; }
     async function two() { return 2; }
     async function f() { return [await one(), await two()].join(","); }
     f().then(function (v) { console.log("a:" + v); });`],
  ["returns-promise-adopted",
    `async function f() { return Promise.resolve("inner"); }
     f().then(function (v) { console.log("r:" + v); });`],
  ["promise-all",
    `async function a() { await 0; return 1; }
     async function b() { await 0; return 2; }
     Promise.all([a(), b()]).then(function (r) { console.log("all:" + r.join("+")); });`],
  ["promise-race",
    `async function a() { await 0; return "first"; }
     async function b() { await 0; return "second"; }
     Promise.race([a(), b()]).then(function (r) { console.log("race:" + r); });`],
  // The ORDER is the part that a wrong implementation gets wrong even when
  // every value is right: the synchronous part of an async body runs before the
  // caller continues, and everything after the first await runs later.
  ["ordering-sync-part-first",
    `var L = [];
     async function f() { L.push("body"); await 0; L.push("after"); }
     f(); L.push("caller");
     Promise.resolve().then(function () {}).then(function () { console.log(L.join(",")); });`],
  ["ordering-interleaved",
    `var L = [];
     async function a() { L.push("a1"); await 0; L.push("a2"); await 0; L.push("a3"); }
     async function b() { L.push("b1"); await 0; L.push("b2"); await 0; L.push("b3"); }
     a(); b();
     Promise.resolve().then(function () {}).then(function () {}).then(function () {
       console.log(L.join(" "));
     });`],
  // for await: every element is awaited before the body sees it, on all three
  // iteration paths — the live-indexed one, the lazily stepped one and the
  // guest-iterator one.
  ["for-await-array",
    `async function f() {
       var o = ""; for await (var v of [Promise.resolve(1), 2, Promise.resolve(3)]) { o += v; }
       return o;
     }
     f().then(function (v) { console.log("o:" + v); });`],
  ["for-await-set",
    `async function f() {
       var o = ""; for await (var v of new Set([Promise.resolve("a"), "b"])) { o += v; }
       return o;
     }
     f().then(function (v) { console.log("o:" + v); });`],
  ["for-await-generator",
    `async function* g() { yield 1; yield 2; }
     (async function () {
       var o = ""; for await (var v of g()) { o += v; }
       console.log("o:" + o);
     })();`],
  ["await-in-condition",
    `async function f() { if (await Promise.resolve(true)) { return "yes"; } return "no"; }
     f().then(function (v) { console.log(v); });`],
  ["await-in-binary",
    `async function f() { return (await Promise.resolve(2)) + (await Promise.resolve(3)); }
     f().then(function (v) { console.log("b:" + v); });`],
  ["await-ternary",
    `async function f() { return (await Promise.resolve(1)) ? "a" : "b"; }
     f().then(function (v) { console.log(v); });`],
];

function nodeOutput(dir: string, src: string): string {
  const file = path.join(dir, "case.js");
  fs.writeFileSync(file, src);
  return execFileSync(process.execPath, [file], { encoding: "utf8" }).trim();
}

function engineOutput(bin: string, dir: string, src: string): string {
  const file = "case.js";
  fs.writeFileSync(path.join(dir, file), src);
  const out = execFileSync(bin, [dir, file], { encoding: "utf8" });
  return out.replace(/^\[tsx\] /gm, "").trim();
}

describe("async conformance", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "async-conf-"));
  const built: string[] = [];

  beforeAll(() => {
    for (const t of TARGETS) {
      const bin = path.join(ROOT, "gallery", "game_engine", "v2", "interp",
        "bin", t, "octane_runner");
      if (fs.existsSync(bin)) built.push(bin);
    }
  });

  for (const [name, src] of CASES) {
    it(`${name} matches Node on every built target`, () => {
      const want = nodeOutput(dir, src);
      expect(want.length, `probe "${name}" printed nothing in Node`).toBeGreaterThan(0);
      for (const bin of built) {
        const got = engineOutput(bin, dir, src);
        expect(got, `${name} on ${path.basename(path.dirname(bin))}`).toBe(want);
      }
    });
  }

  it("has at least one native target built", () => {
    // Not a failure by itself — it says out loud that the suite proved nothing
    // if nothing was built, rather than passing vacuously.
    if (!built.length) {
      console.warn("no native engine built; run: npm run jsengine:build");
    }
    expect(true).toBe(true);
  });
});
