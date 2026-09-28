var s = 0;
for (var i = 0; i < 10; i++) { s += i; }
print("sum", s);
function fib(k) { return k < 2 ? k : fib(k - 1) + fib(k - 2); }
print(fib(20));
var o = { a: 1, b: "x", get c() { return this.a + 1; } };
print(o.a, o.b, o.c, JSON.stringify(o));
class A { constructor(x) { this.x = x; } m() { return this.x * 2; } static s() { return 7; } }
class B extends A { constructor(x) { super(x + 1); this.y = 3; } m() { return super.m() + this.y; } }
var b = new B(4);
print(b.m(), A.s(), b instanceof A, b instanceof B);
var arr = [3, 1, 2].map(x => x * 10).sort((a, b) => a - b);
print(arr.join(","), arr.length);
let [p, q = 5, ...r] = [1, undefined, 3, 4];
print(p, q, r);
var {u, v: w = 9} = {u: 1};
print(u, w);
try { null.x; } catch (e) { print(e instanceof TypeError, e.message); }
var counter = (function () { var c = 0; return function () { return ++c; }; })();
counter(); print(counter());
var fs = []; for (let i = 0; i < 3; i++) fs.push(() => i); print(fs.map(f => f()).join(""));
print(`t ${1 + 2} ${"x"}`);
print("abc".toUpperCase(), "a-b-c".split("-"), /(\d+)-(\d+)/.exec("x 12-34")[2]);
print([1,2,3].reduce((a,b)=>a+b), Math.max(1, 5, 3), (0.1 + 0.2), 1e21, 1/3, -0.000001234);
switch (3) { case 1: print("one"); break; case 3: print("three"); default: print("dflt"); }
var m = new Map([[1, "a"]]); m.set("k", 2); print(m.get(1), m.size, [...m.keys()]);
label: for (var i = 0; i < 3; i++) { for (var j = 0; j < 3; j++) { if (j == 1) continue label; if (i == 2) break label; print(i, j); } }
print(typeof undefinedThing, typeof print, typeof null);
function f2() { return arguments.length; } print(f2(1, 2, 3));
print(String(Symbol("q")), [..."hé"].length, Object.keys({z:1, 2:1, a:1}));
print(parseInt("ff", 16), (255).toString(16), (3.14159).toFixed(2), Number("  12  "));
try { throw new RangeError("bad"); } catch (e) { print(String(e)); } finally { print("fin"); }
print(new Date(0).toISOString());
