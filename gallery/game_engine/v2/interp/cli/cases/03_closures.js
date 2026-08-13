// Functions, closures, this-binding, arguments, recursion.
var acc = [];
function say(s) { acc.push(String(s)); }

function counter() { var n = 0; return function () { return ++n; }; }
var c = counter();
say(c() + "," + c() + "," + c());

var fns = [];
for (var i = 0; i < 3; i++) { fns.push(function () { return i; }); }
say(fns.map(function (f) { return f(); }).join(","));

var lets = [];
for (let k = 0; k < 3; k++) { lets.push(function () { return k; }); }
say(lets.map(function (f) { return f(); }).join(","));

function sum() { var t = 0; for (var a = 0; a < arguments.length; a++) { t += arguments[a]; } return t; }
say(sum(1, 2, 3, 4));

function fib(n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }
say(fib(20));

var obj = { n: 42, get: function () { return this.n; } };
say(obj.get());
var loose = obj.get;
say(typeof loose.call(obj));
say(loose.call({ n: 7 }));
say(loose.apply({ n: 8 }, []));
say(loose.bind({ n: 9 })());

function outer2() { var self = this; return function () { return self === undefined ? "undef" : typeof self; }; }
say(typeof outer2.call({})());

var memo = (function () {
  var cache = {};
  return function fact(n) {
    if (n <= 1) return 1;
    if (cache[n]) return cache[n];
    return (cache[n] = n * fact(n - 1));
  };
})();
say(memo(10));

say((function (a, b) { return a + b; }).length);
say((function named() {}).name);

var iife = (function () { return "iife"; })();
say(iife);

console.log(acc.join("\n"));
