// L7: incremental string building -- the compiler's code writer appends to a
// buffer thousands of times. Transient intermediates, flat memory expected.
var N = __N__;
var total = 0;
for (var r = 0; r < N; r++) {
  var buf = "";
  for (var i = 0; i < 40; i++) { buf += "line " + i + ";\n"; }
  total += buf.length;
}
console.log("chars " + total);
