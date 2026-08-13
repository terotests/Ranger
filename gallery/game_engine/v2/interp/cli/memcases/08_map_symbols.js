// L8: symbol tables -- objects and Maps used as scoped dictionaries, created
// and dropped per scope, exactly like the compiler's scope chain.
var N = __N__;
var checksum = 0;
for (var r = 0; r < N; r++) {
  var scope = {};
  var m = new Map();
  for (var i = 0; i < 20; i++) {
    scope["sym_" + i] = { name: "sym_" + i, index: i };
    m.set("sym_" + i, i);
  }
  checksum += Object.keys(scope).length + m.size;
}
console.log("checksum " + checksum);
