// L2: allocate N short-lived class instances. Same as L1 but the payload is an
// object with methods -- this is what the compiler does for every token.
var N = __N__;
class Token {
  constructor(kind, value) { this.kind = kind; this.value = value; }
  describe() { return this.kind + ":" + this.value; }
}
var checksum = 0;
for (var i = 0; i < N; i++) {
  var t = new Token("num", i);
  checksum += t.describe().length;
}
console.log("checksum " + checksum);
