// How many EvalValue objects does each benchmark case allocate, and how long
// does the case take? The two together give the value layer's share.
// Counts EvalValue constructions during a benchmark case. Point it at a COPY
// of the built engine module with a counter added to EvalValue's constructor:
//
//   cp ../../bin/engine_module.cjs /tmp/engine_counted.cjs
//   # add `globalThis.__EV_COUNT++;` as the first line of EvalValue's constructor
//   node count_allocations.cjs /tmp/engine_counted.cjs
const MODULE = process.argv[2] || (__dirname + "/engine_counted.cjs");
const { ComponentEngine, EvalValue } = require(MODULE);

const CASES = {
  loop: `var s = 0; for (var i = 0; i < 50000; i++) { s += i; } return s;`,
  fib: `function fib(k) { return k < 2 ? k : fib(k-1) + fib(k-2); } return fib(20);`,
  array: `var a = []; for (var i = 0; i < 20000; i++) { a.push(i * 2); } var t = 0; for (var j = 0; j < a.length; j++) { t += a[j]; } return t + a.length;`,
  object: `var o = {}; for (var i = 0; i < 20000; i++) { o["k" + (i % 50)] = i; } var t = 0; for (var k in o) { t += o[k]; } return t;`,
  method: `var s = "The quick brown fox"; var t = 0; for (var i = 0; i < 20000; i++) { t += s.slice(i % 10, 20).indexOf("o") + s.charCodeAt(i % 15); } return t;`,
};

const wrap = (body) => `function work() {${body}\n}\n__out__ = String(work());`;

for (const [name, body] of Object.entries(CASES)) {
  const src = wrap(body);
  const e = new ComponentEngine();
  e.quiet = true;
  const o = console.log;
  console.log = () => {};
  globalThis.__EV_COUNT = 0;
  const t0 = process.hrtime.bigint();
  try {
    e.loadScript("var __out__ = '';\n" + src + "\nfunction __t__() { return String(__out__); }\n");
    e.callFunction("__t__", EvalValue.null());
  } finally {
    console.log = o;
  }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  const n = globalThis.__EV_COUNT;
  // measured per-value cost on this machine, from the value-layer benchmark:
  // fat ~82 ns, small per-case object ~13 ns, tagged ~2 ns
  const fatShare = (n * 82) / 1e6;
  console.log(
    `${name.padEnd(8)} ${ms.toFixed(1).padStart(8)} ms   ${String(n).padStart(9)} EvalValues   ` +
    `~${fatShare.toFixed(1)} ms in allocation (${((fatShare / ms) * 100).toFixed(0)}% of the case)`
  );
}
