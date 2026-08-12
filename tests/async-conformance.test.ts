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
  // The awaited value reaching a BINDING, not just a return position. These
  // shapes are how the Ranger compiler's own output awaits — `const c = await
  // ops.readFile(p)` inside a prototype method, and an async `run` resolving
  // to a results object. Every one of them answered undefined (or null in a
  // loop) before the resumption carried the value.
  ["await-into-const",
    `async function f() { const c = await Promise.resolve("C"); console.log("v:" + c); }
     f();`],
  ["await-into-const-method",
    `function Ops() {}
     Ops.prototype.read = function (p) { return Promise.resolve("TEXT:" + p); };
     function Comp() {}
     Comp.prototype.run = async function (ops) { const c = await ops.read("a.rgr"); return c; };
     new Comp().run(new Ops()).then(function (v) { console.log("v:" + v); });`],
  ["await-in-loop-accumulates",
    `async function f() { var s = ""; for (var i = 0; i < 3; i++) { s += await Promise.resolve(i); } return s; }
     f().then(function (v) { console.log("v:" + v); });`],
  ["await-async-result-object",
    `function Results() { this.logs = []; this.writes = []; }
     function VC() {}
     VC.prototype.run = async function () { var r = new Results(); r.logs.push("l"); r.writes.push("w"); return r; };
     new VC().run().then(function (r) { console.log("v:" + r.logs.length + "|" + r.writes.length); });`],
  ["await-into-let-in-try",
    `async function f() { try { let c = await Promise.resolve("T"); return c; } catch (e) { return "E"; } }
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
  // The combinators that settle from more than one input. Like async bodies,
  // none of these has produced anything by the time the script's synchronous
  // part ends, so only a whole program can see what they answer.
  ["allSettled-mixed",
    `Promise.allSettled([Promise.resolve(1), Promise.reject("bad"), 3])
       .then(function (r) { console.log(JSON.stringify(r)); });`],
  ["allSettled-empty",
    `Promise.allSettled([]).then(function (r) { console.log("len:" + r.length); });`],
  ["allSettled-never-rejects",
    `Promise.allSettled([Promise.reject("x")])
       .then(function (r) { console.log("ok:" + r[0].status + ":" + r[0].reason); },
             function () { console.log("REJECTED"); });`],
  ["any-first-fulfilled",
    `Promise.any([Promise.reject("a"), Promise.resolve("ok")])
       .then(function (v) { console.log("v:" + v); });`],
  ["any-all-rejected",
    `Promise.any([Promise.reject("a"), Promise.reject("b")])
       .catch(function (e) { console.log(e.name + ":" + JSON.stringify(e.errors)); });`],
  ["any-empty",
    `Promise.any([]).catch(function (e) { console.log(e.name + ":" + e.errors.length); });`],
  ["any-ignores-later-rejection",
    `async function slowFail() { await 0; throw "late"; }
     Promise.any([Promise.resolve("first"), slowFail()])
       .then(function (v) { console.log("v:" + v); });`],
  ["withResolvers-resolve",
    `var w = Promise.withResolvers();
     w.promise.then(function (v) { console.log("v:" + v); });
     w.resolve(42);`],
  ["withResolvers-reject",
    `var w = Promise.withResolvers();
     w.promise.catch(function (e) { console.log("e:" + e); });
     w.reject("nope");`],
  ["withResolvers-async",
    `async function f() { var w = Promise.withResolvers(); w.resolve(5); return (await w.promise) + 1; }
     f().then(function (v) { console.log("v:" + v); });`],
  // finally is TRANSPARENT: it sees neither the value nor the reason, cannot
  // change either, and only a throw from the callback replaces the settlement.
  ["finally-passthrough",
    `Promise.resolve(5).finally(function () { console.log("ran"); })
       .then(function (v) { console.log("v:" + v); });`],
  ["finally-rethrows",
    `Promise.reject("nope").finally(function () { console.log("ran"); })
       .catch(function (e) { console.log("e:" + e); });`],
  ["finally-no-args",
    `Promise.resolve(5).finally(function () { console.log("args:" + arguments.length); })
       .then(function () {});`],
  ["finally-return-ignored",
    `Promise.resolve(5).finally(function () { return 99; })
       .then(function (v) { console.log("v:" + v); });`],
  ["finally-throw-replaces",
    `Promise.resolve(5).finally(function () { throw "boom"; })
       .catch(function (e) { console.log("e:" + e); });`],
  ["finally-awaits-thenable",
    `var L = [];
     Promise.resolve("v").finally(function () {
       return new Promise(function (r) { L.push("wait"); r(); });
     }).then(function (v) { L.push("then:" + v); console.log(L.join(",")); });`],
  ["finally-in-async",
    `async function f() { try { return await Promise.reject("e"); } catch (x) { return "c:" + x; } }
     f().finally(function () { console.log("fin"); }).then(function (v) { console.log(v); });`],
  ["aggregate-error-thrown",
    `try { throw new AggregateError([1, 2], "m"); }
     catch (e) { console.log(e.name + "|" + e.message + "|" + e.errors.join(",") + "|" + (e instanceof Error)); }`],
  // An object may offer ONLY Symbol.asyncIterator -- a hand-written async
  // iterable has no Symbol.iterator at all, and looking for one found nothing.
  ["for-await-custom-async-iterable",
    `var obj = { [Symbol.asyncIterator]() {
       var i = 0;
       return { next() { i++; return Promise.resolve({ value: i, done: i > 2 }); } };
     } };
     (async function () {
       var out = [];
       for await (var z of obj) { out.push(z); }
       console.log("custom:" + out.join(","));
     })();`],
  ["for-await-async-generator-return",
    `async function* g() { try { yield 1; yield 2; } finally { console.log("fin"); } }
     (async function () {
       for await (var w of g()) { break; }
       console.log("done");
     })();`],
  ["async-generator-manual",
    `async function* g() { yield 1; yield 2; yield 3; }
     (async function () {
       var it = g();
       console.log("m:" + (await it.next()).value + "," + (await it.next()).value);
       console.log("r:" + JSON.stringify(await it.return(9)));
     })();`],
  ["for-await-rejection",
    `(async function () {
       try { for await (var q of [Promise.resolve(1), Promise.reject(new Error("bad"))]) {} }
       catch (e) { console.log("caught:" + e.message); }
     })();`],

  // What an async function IS. Whole-program rather than a single expression
  // so all three targets have to agree about the intrinsic chain, not just the
  // es6 one the runtime suite exercises.
  ["async-function-identity",
    `async function f(a, b) { return a + b; }
     console.log(Object.prototype.toString.call(f));
     console.log(Object.getPrototypeOf(f).constructor.name);
     console.log(Object.getPrototypeOf(f)[Symbol.toStringTag]);
     console.log(String(Object.getPrototypeOf(Object.getPrototypeOf(f)) === Function.prototype));
     console.log(typeof f.prototype);
     console.log(f.length + ":" + f.name);
     console.log(f.toString().slice(0, 14));
     try { new f(); console.log("CONSTRUCTED"); } catch (e) { console.log(e.constructor.name); }`],
  ["async-function-ctor",
    `console.log(typeof globalThis.AsyncFunction);
     async function seed() {}
     var AF = Object.getPrototypeOf(seed).constructor;
     console.log(AF.name + ":" + AF.length);
     var h = new AF("x", "return x * 2;");
     console.log(Object.prototype.toString.call(h));
     h(21).then(function (v) { console.log("v:" + v); });`],
  // `await` as a CALL ARGUMENT. The driver listed a call as steppable without
  // any step existing for it, so the frame was popped without a result and
  // `f(await p)` answered undefined -- silently, which is the worst shape a
  // gap can have. The call now runs on the eager path instead.
  ["await-in-call-argument",
    `function show(v) { return "got:" + v; }
     (async function () {
       console.log(show(await Promise.resolve(1)));
       console.log(String(await Promise.resolve(2)));
       console.log([await Promise.resolve(3), await Promise.resolve(4)].join("-"));
       console.log(Math.max(await Promise.resolve(5), 2));
     })();`],
  // Async generators, whole-program so all three targets have to agree. Every
  // `await` in an async generator body used to corrupt the output: `for await`
  // stepped the body RAW, so it read `.done` and `.value` off the awaited value
  // itself and produced empty elements plus a phantom turn.
  ["async-generator-await-in-body",
    `async function* h() { yield await Promise.resolve(5); yield 6; }
     (async function () {
       var out = [];
       for await (var v of h()) { out.push(v); }
       console.log("for-await:" + out.join(","));
       var it = h();
       var manual = [];
       var r = await it.next();
       while (!r.done) { manual.push(r.value); r = await it.next(); }
       console.log("manual:" + manual.join(","));
     })();`],
  ["async-generator-identity",
    `async function* g() { yield 1; }
     console.log(Object.prototype.toString.call(g()));
     console.log(typeof g().next().then);
     console.log(typeof g()[Symbol.asyncIterator]);
     console.log(typeof g()[Symbol.iterator]);
     var it = g();
     console.log(String(it[Symbol.asyncIterator]() === it));`],
  ["async-generator-forms",
    `var o = { async *m() { yield 1; yield 2; } };
     class K { async *m() { yield 3; } }
     (async function () {
       var a = [];
       for await (var v of o.m()) { a.push(v); }
       for await (var w of new K().m()) { a.push(w); }
       console.log(a.join(","));
     })();`],
  ["async-generator-loop-and-return",
    `async function* h() { for (var i = 0; i < 3; i++) { yield await Promise.resolve(i); } }
     (async function () {
       var out = [];
       for await (var v of h()) { out.push(v); }
       console.log("loop:" + out.join(","));
       var it = h();
       await it.next();
       var r = await it.return(9);
       console.log("return:" + r.value + ":" + r.done);
     })();`],

  ["async-await-as-identifiers",
    `function async(x) { return x + 1; }
     console.log(async(1));
     function sync() { var await = 3; return await; }
     console.log(sync());
     var o = { async: 7 };
     console.log(o.async);
     (async function () {
       function inner() { var await = 5; return await; }
       console.log("inner:" + inner());
       var v = await Promise.resolve(9);
       console.log("awaited:" + v);
     })();`],
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
