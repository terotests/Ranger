// raw_bench.js — run a benchmark case body RAW on the host JS engine.
// Works on both Node (process.argv) and QuickJS (scriptArgs).
// Adaptive reps: grows until the timed window exceeds 300 ms, reports ms/run.
"use strict";
var ARGS = (typeof scriptArgs !== "undefined") ? scriptArgs.slice(1) : process.argv.slice(2);

var cases = {
  loop: "var s = 0; for (var i = 0; i < 50000; i++) { s += i; } return s;",
  fib: "function fib(k) { return k < 2 ? k : fib(k - 1) + fib(k - 2); } return fib(20);",
  strcat: "var s = \"\"; for (var i = 0; i < 20000; i++) { s += \"ab\"; } return s.length;",
  array: "var a = []; for (var i = 0; i < 20000; i++) { a.push(i * 2); } var t = 0; for (var j = 0; j < a.length; j++) { t += a[j]; } return t + a.length;",
  object: "var o = {}; for (var i = 0; i < 20000; i++) { o[\"k\" + (i % 50)] = i; } var t = 0; for (var k in o) { t += o[k]; } return t;",
  method: "var s = \"The quick brown fox jumps over the lazy dog\"; var t = 0; for (var i = 0; i < 20000; i++) { t += s.slice(i % 10, 20).indexOf(\"o\") + s.charCodeAt(i % 40); } return t;",
  regex: "var re = /([a-z]+)\\s+(\\d+)/; var t = 0; for (var i = 0; i < 5000; i++) { var m = re.exec(\"item \" + i + \" qty 42\"); if (m) { t += m[2].length; } } return t;"
};

var name = ARGS[0];
var body = cases[name];
if (!body) { console.log("unknown case: " + name); }
else {
  var work = new Function(body);
  var answer = work(); // warmup 1 + correctness value
  work(); work();      // more warmup for the JIT tiers
  var reps = 1;
  var perRun = 0;
  for (;;) {
    var t0 = Date.now();
    for (var i = 0; i < reps; i++) { work(); }
    var t1 = Date.now();
    var elapsed = t1 - t0;
    if (elapsed > 300) { perRun = elapsed / reps; break; }
    reps = reps * 4;
  }
  console.log(name + " ms/run=" + perRun.toFixed(4) + " answer=" + answer);
}
