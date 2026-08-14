// L3: same objects, but retained in a list. Memory must grow linearly in N --
// this is the honest baseline the leaking cases are measured against.
var N = __N__;
class Token {
  constructor(kind, value) { this.kind = kind; this.value = value; }
  describe() { return this.kind + ":" + this.value; }
}
var all = [];
for (var i = 0; i < N; i++) { all.push(new Token("num", i)); }
console.log("kept " + all.length + " last " + all[all.length - 1].describe());
