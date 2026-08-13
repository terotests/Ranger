// L5: the same tree WITH parent back-pointers -- the shape every real compiler
// AST has, and a reference cycle. Built and dropped exactly like L4, so any
// growth over L4 is the cycle failing to be collected, not the data itself.
var N = __N__;
class Node {
  constructor(kind) { this.kind = kind; this.children = []; this.parent = null; this.props = {}; }
  add(c) { c.parent = this; this.children.push(c); return this; }
}
function build(depth, fanout) {
  var n = new Node("n" + depth);
  if (depth > 0) { for (var i = 0; i < fanout; i++) { n.add(build(depth - 1, fanout)); } }
  return n;
}
function count(n) { var t = 1; for (var i = 0; i < n.children.length; i++) { t += count(n.children[i]); } return t; }
var total = 0;
for (var r = 0; r < N; r++) { total += count(build(4, 3)); }
console.log("nodes visited " + total);
