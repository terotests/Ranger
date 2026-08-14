// L9: fluent method chains returning `this`, plus polymorphic dispatch through
// a base class -- both are pervasive in the Ranger compiler's writers.
var N = __N__;
class Writer {
  constructor() { this.parts = []; }
  w(s) { this.parts.push(s); return this; }
  nl() { return this.w("\n"); }
  out() { return this.parts.join(""); }
}
class IndentWriter extends Writer {
  constructor() { super(); this.level = 0; }
  w(s) { return super.w("  ".repeat(this.level) + s); }
  indent() { this.level++; return this; }
}
var total = 0;
for (var r = 0; r < N; r++) {
  var wr = new IndentWriter();
  wr.w("class X {").nl().indent().w("fn y() {}").nl();
  total += wr.out().length;
}
console.log("chars " + total);
