// SPDX-License-Identifier: AGPL-3.0-or-later
//
// One small workload per kind of code (calls, property access, arrays,
// strings, closures, …), to find where CEr falls behind QuickJS. Each
// script runs its workload five times and reports the fastest, timed inside
// the script with performance.now, so parsing and setup are not counted.
// Every answer is checked against Node's before a time is shown.
//
//   node bench/features.mjs                          # cer-rust vs qjs
//   node bench/features.mjs --engines=cer-rust,qjs,cer-cpp
//   node bench/features.mjs --only=call,prop --scale=2 --json
//
// QuickJS: `qjs` on the PATH, or QJS=/path/to/qjs.
import { engines, build, runNode } from "./common.mjs";

const args = process.argv.slice(2);
const opt = (name, d) => {
  const a = args.find((x) => x.startsWith("--" + name + "="));
  return a ? a.slice(name.length + 3) : d;
};
const WANT = opt("engines", "cer-rust,qjs").split(",");
const SCALE = Number(opt("scale", "1"));
const ONLY = opt("only", "");
const asJson = args.includes("--json");
const n = (base) => Math.max(1, Math.round(base * SCALE));

// [group, name, setup (outside the timed function), body (returns a checksum)]
export const CASES = [
  // ---- core
  ["core", "int-loop", "", `var s = 0; for (var i = 0; i < ${n(1000000)}; i++) { s = (s + i) | 0; } return s;`],
  ["core", "float-arith", "", `var s = 0.5; for (var i = 0; i < ${n(500000)}; i++) { s = s * 1.000001 + i / 3; } return Math.round(s);`],
  ["core", "bitops", "", `var h = 0; for (var i = 0; i < ${n(500000)}; i++) { h = ((h << 5) - h + i) ^ (h >>> 3); h = h & 0xffffff; } return h;`],
  ["core", "branches", "", `var c = 0; for (var i = 0; i < ${n(500000)}; i++) { if (i % 3 === 0) c += 1; else if (i % 3 === 1) c -= 2; else c += 3; } return c;`],
  ["core", "switch", "", `var c = 0; for (var i = 0; i < ${n(300000)}; i++) { switch (i & 7) { case 0: c += 1; break; case 1: c += 2; break; case 2: c ^= 3; break; case 3: c -= 1; break; default: c += 5; } } return c;`],
  ["core", "let-block-loop", "", `let s = 0; for (let i = 0; i < ${n(500000)}; i++) { let j = i * 2; s += j; } return s;`],
  ["core", "global-var", `var G = 0;`, `for (var i = 0; i < ${n(300000)}; i++) { G += i; } return G;`],
  ["core", "captured-var", "", `var c = 0; function inc() { c++; } for (var i = 0; i < ${n(300000)}; i++) { c += i & 1; } inc(); return c;`],
  // ---- calls
  ["call", "plain-call", `function add(a, b) { return a + b; }`, `var s = 0; for (var i = 0; i < ${n(300000)}; i++) { s = add(s, i); } return s;`],
  ["call", "recursion-fib", `function fib(k) { return k < 2 ? k : fib(k - 1) + fib(k - 2); }`, `return fib(${n(22)});`],
  ["call", "method-call", `class P { constructor(x) { this.x = x; } get2() { return this.x * 2; } }`, `var p = new P(3); var s = 0; for (var i = 0; i < ${n(300000)}; i++) { s += p.get2(); } return s;`],
  ["call", "closure-call", "", `function mk(k) { return function (x) { return x + k; }; } var f = mk(3); var s = 0; for (var i = 0; i < ${n(300000)}; i++) { s = f(s) & 0xffff; } return s;`],
  ["call", "arrow-callback", "", `function each(n, cb) { for (var i = 0; i < n; i++) cb(i); } var s = 0; each(${n(300000)}, (x) => { s += x; }); return s;`],
  ["call", "arguments-obj", `function sum() { var t = 0; for (var i = 0; i < arguments.length; i++) t += arguments[i]; return t; }`, `var s = 0; for (var i = 0; i < ${n(100000)}; i++) { s += sum(i, 1, 2); } return s;`],
  ["call", "rest-spread", `function sum(...xs) { return xs[0] + xs[1] + xs[2]; }`, `var a = [1, 2, 3]; var s = 0; for (var i = 0; i < ${n(100000)}; i++) { s += sum(...a) + i; } return s;`],
  ["call", "call-apply", `function f(a, b) { return this.k + a + b; }`, `var o = { k: 1 }; var s = 0; for (var i = 0; i < ${n(100000)}; i++) { s += f.call(o, i, 2) + f.apply(o, [1, 2]); } return s;`],
  ["call", "bound-fn", `function f(a) { return this.k + a; }`, `var g = f.bind({ k: 2 }); var s = 0; for (var i = 0; i < ${n(200000)}; i++) { s += g(i); } return s;`],
  ["call", "new-class", `class V { constructor(x, y) { this.x = x; this.y = y; } }`, `var s = 0; for (var i = 0; i < ${n(200000)}; i++) { var v = new V(i, 1); s += v.x + v.y; } return s;`],
  ["call", "new-function", `function V(x, y) { this.x = x; this.y = y; }`, `var s = 0; for (var i = 0; i < ${n(200000)}; i++) { var v = new V(i, 1); s += v.x + v.y; } return s;`],
  ["call", "subclass-super", `class A { constructor(x) { this.x = x; } f() { return this.x; } } class B extends A { constructor(x) { super(x); } f() { return super.f() + 1; } }`, `var s = 0; for (var i = 0; i < ${n(100000)}; i++) { s += new B(i).f(); } return s;`],
  // ---- objects
  ["prop", "prop-get-set", "", `var o = { a: 1, b: 2, c: 3 }; for (var i = 0; i < ${n(500000)}; i++) { o.a = o.b + o.c; o.b = o.a & 0xff; } return o.a + o.b;`],
  ["prop", "polymorphic", "", `var os = [{ a: 1 }, { b: 2, a: 2 }, { c: 3, b: 1, a: 3 }, { d: 0, c: 0, b: 0, a: 4 }]; var s = 0; for (var i = 0; i < ${n(400000)}; i++) { s += os[i & 3].a; } return s;`],
  ["prop", "proto-chain", `function A() {} A.prototype.v = 1; function B() {} B.prototype = new A(); function C() {} C.prototype = new B();`, `var c = new C(); var s = 0; for (var i = 0; i < ${n(400000)}; i++) { s += c.v; } return s;`],
  ["prop", "obj-literal", "", `var s = 0; for (var i = 0; i < ${n(200000)}; i++) { var o = { x: i, y: 2, z: 3 }; s += o.x + o.z; } return s;`],
  ["prop", "dynamic-key", "", `var o = {}; for (var i = 0; i < ${n(200000)}; i++) { o["k" + (i % 100)] = i; } var t = 0; for (var k in o) t += o[k]; return t;`],
  ["prop", "getter-setter", "", `var o = { _v: 0, get v() { return this._v; }, set v(x) { this._v = x; } }; for (var i = 0; i < ${n(200000)}; i++) { o.v = o.v + 1; } return o.v;`],
  ["prop", "in-delete", "", `var s = 0; for (var i = 0; i < ${n(100000)}; i++) { var o = { a: 1, b: 2 }; delete o.a; if ("a" in o) s++; if ("b" in o) s += 2; } return s;`],
  ["prop", "object-keys", "", `var o = { a: 1, b: 2, c: 3, d: 4, e: 5 }; var s = 0; for (var i = 0; i < ${n(50000)}; i++) { s += Object.keys(o).length; } return s;`],
  ["prop", "destructuring", "", `var s = 0; for (var i = 0; i < ${n(200000)}; i++) { var { a, b } = { a: i, b: 1 }; var [x, y] = [a, b]; s += x + y; } return s;`],
  // ---- arrays
  ["array", "push-index", "", `var a = []; for (var i = 0; i < ${n(300000)}; i++) a.push(i); var t = 0; for (var j = 0; j < a.length; j++) t += a[j]; return t;`],
  ["array", "index-write", "", `var a = new Array(1000).fill(0); for (var i = 0; i < ${n(500000)}; i++) { a[i % 1000] += i; } return a[7];`],
  ["array", "array-literal", "", `var s = 0; for (var i = 0; i < ${n(200000)}; i++) { var a = [i, 1, 2, 3]; s += a[0] + a.length; } return s;`],
  ["array", "for-of-array", "", `var a = []; for (var i = 0; i < ${n(300000)}; i++) a.push(i); var t = 0; for (var x of a) t += x; return t;`],
  ["array", "foreach-map-reduce", "", `var a = []; for (var i = 0; i < ${n(100000)}; i++) a.push(i); var b = a.map(function (x) { return x * 2; }); var t = 0; b.forEach(function (x) { t += x; }); return t + b.reduce(function (p, x) { return p + x; }, 0);`],
  ["array", "sort-numbers", "", `var a = []; var x = 1; for (var i = 0; i < ${n(50000)}; i++) { x = (x * 1103515245 + 12345) & 0x7fffffff; a.push(x); } a.sort(function (p, q) { return p - q; }); return a[100];`],
  ["array", "typed-f64", "", `var a = new Float64Array(1000); for (var i = 0; i < ${n(500000)}; i++) { a[i % 1000] += i * 0.5; } return a[3];`],
  ["array", "typed-i32", "", `var a = new Int32Array(1000); for (var i = 0; i < ${n(500000)}; i++) { a[i % 1000] = (a[i % 1000] + i) | 0; } return a[3];`],
  ["array", "splice-shift", "", `var a = []; for (var i = 0; i < 1000; i++) a.push(i); var s = 0; for (var k = 0; k < ${n(20000)}; k++) { a.push(a.shift()); a.splice(500, 1, k); s += a[0]; } return s;`],
  ["array", "array-2d", "", `var g = []; for (var i = 0; i < 100; i++) { g.push(new Array(100).fill(0)); } for (var r = 0; r < ${n(50)}; r++) for (var y = 1; y < 99; y++) for (var x = 1; x < 99; x++) g[y][x] = (g[y - 1][x] + g[y][x - 1] + x) & 0xffff; return g[98][98];`],
  // ---- strings
  ["string", "concat", "", `var s = ""; for (var i = 0; i < ${n(100000)}; i++) { s += "ab"; } return s.length;`],
  ["string", "template", "", `var t = 0; for (var i = 0; i < ${n(100000)}; i++) { var s = \`id-\${i}-\${i & 7}\`; t += s.length; } return t;`],
  ["string", "char-code-at", "", `var s = "The quick brown fox jumps over the lazy dog"; var t = 0; for (var i = 0; i < ${n(500000)}; i++) { t += s.charCodeAt(i % 43); } return t;`],
  ["string", "index-char", "", `var s = "The quick brown fox jumps over the lazy dog"; var t = 0; for (var i = 0; i < ${n(300000)}; i++) { if (s[i % 43] === "o") t++; } return t;`],
  ["string", "split-join", "", `var s = "a,b,c,d,e,f,g,h,i,j"; var t = 0; for (var i = 0; i < ${n(50000)}; i++) { t += s.split(",").join("-").length; } return t;`],
  ["string", "indexof-slice", "", `var s = "The quick brown fox jumps over the lazy dog"; var t = 0; for (var i = 0; i < ${n(200000)}; i++) { t += s.slice(i % 10, 30).indexOf("o"); } return t;`],
  ["string", "num-to-string", "", `var t = 0; for (var i = 0; i < ${n(100000)}; i++) { t += String(i * 1.5).length; } return t;`],
  ["string", "parse-number", "", `var t = 0; for (var i = 0; i < ${n(100000)}; i++) { t += parseInt("12" + (i & 7)) + parseFloat("3.25"); } return t;`],
  ["string", "case-trim", "", `var t = 0; for (var i = 0; i < ${n(100000)}; i++) { t += "  Hello World ".trim().toUpperCase().length; } return t;`],
  // ---- regex
  ["regex", "regex-exec", "", `var re = /([a-z]+)\\s+(\\d+)/; var t = 0; for (var i = 0; i < ${n(50000)}; i++) { var m = re.exec("item " + i + " qty 42"); if (m) t += m[2].length; } return t;`],
  ["regex", "regex-test", "", `var re = /^[a-z]+\\d*$/i; var t = 0; for (var i = 0; i < ${n(100000)}; i++) { if (re.test("Abc" + i)) t++; } return t;`],
  ["regex", "regex-replace-g", "", `var s = "the cat sat on the mat with the hat"; var t = 0; for (var i = 0; i < ${n(30000)}; i++) { t += s.replace(/at/g, "og").length; } return t;`],
  // ---- collections, errors, misc
  ["misc", "map-set-get", "", `var m = new Map(); for (var i = 0; i < ${n(100000)}; i++) m.set(i, i * 2); var t = 0; for (var j = 0; j < ${n(100000)}; j++) t += m.get(j); return t;`],
  ["misc", "set-add-has", "", `var st = new Set(); for (var i = 0; i < ${n(100000)}; i++) st.add("k" + (i % 1000)); var t = 0; for (var j = 0; j < ${n(100000)}; j++) if (st.has("k" + (j % 2000))) t++; return t;`],
  ["misc", "try-catch-throw", "", `var t = 0; for (var i = 0; i < ${n(50000)}; i++) { try { if (i % 2) throw new Error("x"); t += 1; } catch (e) { t += 2; } } return t;`],
  ["misc", "try-no-throw", "", `var t = 0; for (var i = 0; i < ${n(300000)}; i++) { try { t += i & 3; } catch (e) { t = 0; } } return t;`],
  ["misc", "closure-create", "", `var fs = 0; for (var i = 0; i < ${n(200000)}; i++) { var f = function () { return i; }; fs += f() & 1; } return fs;`],
  ["misc", "generator", `function* gen(n) { for (var i = 0; i < n; i++) yield i; }`, `var t = 0; for (var x of gen(${n(100000)})) t += x; return t;`],
  ["misc", "json", "", `var o = { a: [1, 2, 3], b: { c: "hello", d: true }, e: 1.5 }; var t = 0; for (var i = 0; i < ${n(20000)}; i++) { t += JSON.parse(JSON.stringify(o)).a.length; } return t;`],
  ["misc", "math-fns", "", `var t = 0; for (var i = 1; i < ${n(300000)}; i++) { t += Math.floor(Math.sqrt(i)) + Math.max(i & 7, 3) + Math.abs(-i & 3); } return t;`],
];

const script = (setup, body) => `${setup}
function work() { ${body}
}
var best = 1e18;
var r;
for (var k = 0; k < 5; k++) {
  var t0 = performance.now();
  r = work();
  var dt = performance.now() - t0;
  if (dt < best) best = dt;
}
print("RESULT " + r + " " + best);
`;

const cases = CASES.filter(([g, name]) => !ONLY || ONLY.split(",").some((o) => g === o || name === o));
build(WANT.filter((e) => e !== "node" && e !== "qjs"));
const runners = engines(WANT);
const rows = [];
for (const [group, name, setup, body] of cases) {
  const src = script(setup, body);
  const want = (runNode(src).find((l) => l.startsWith("RESULT ")) || "").split(" ")[1];
  const row = { group, name };
  for (const [eng, run] of Object.entries(runners)) {
    const out = run(src);
    const line = out.find((l) => l.startsWith("RESULT "));
    if (!line) {
      row[eng] = { error: out.slice(-2).join(" | ").slice(0, 120) };
      continue;
    }
    const [, value, ms] = line.split(" ");
    row[eng] = value === want ? { ms: Number(ms) } : { error: `answer ${value}, Node ${want}` };
  }
  rows.push(row);
  if (!asJson) {
    const cells = WANT.map((e) => (row[e] && row[e].ms !== undefined ? row[e].ms.toFixed(2).padStart(9) : "     FAIL"));
    process.stderr.write(`${group.padEnd(7)} ${name.padEnd(20)} ${cells.join(" ")}\n`);
  }
}

if (asJson) {
  console.log(JSON.stringify(rows, null, 1));
} else {
  const [a, b] = WANT;
  const ratio = (r) => (r[a] && r[b] && r[a].ms !== undefined && r[b].ms !== undefined ? r[a].ms / r[b].ms : NaN);
  console.log(`\nms, best of 5; ${a} / ${b} (above 1: ${a} is slower)\n`);
  console.log(`${"group".padEnd(7)} ${"case".padEnd(20)} ${WANT.map((e) => e.padStart(9)).join(" ")}   ratio`);
  const sorted = rows.slice().sort((x, y) => (ratio(y) || 0) - (ratio(x) || 0));
  for (const r of sorted) {
    const cells = WANT.map((e) => (r[e] && r[e].ms !== undefined ? r[e].ms.toFixed(2).padStart(9) : "     FAIL"));
    const q = ratio(r);
    console.log(`${r.group.padEnd(7)} ${r.name.padEnd(20)} ${cells.join(" ")}   ${isNaN(q) ? "  -" : q.toFixed(2).padStart(5)}`);
  }
  const groups = [...new Set(rows.map((r) => r.group))];
  console.log(`\ngeometric mean of ${a} / ${b} by group`);
  for (const g of groups.concat(["all"])) {
    const qs = rows.filter((r) => g === "all" || r.group === g).map(ratio).filter((q) => q > 0);
    const gm = Math.exp(qs.reduce((s, q) => s + Math.log(q), 0) / qs.length);
    console.log(`${g.padEnd(7)} ${gm.toFixed(2)}  (${qs.length} cases)`);
  }
  for (const r of rows) {
    for (const e of WANT) {
      if (r[e] && r[e].error) console.log(`${r.name} ${e}: ${r[e].error}`);
    }
  }
}
