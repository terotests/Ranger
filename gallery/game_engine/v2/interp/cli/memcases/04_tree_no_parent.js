// L4: an AST-shaped tree with child lists but NO parent pointers, built and
// then dropped. Acyclic, so a refcounting collector should reclaim all of it.
var N = __N__;
class Node {
  constructor(kind) { this.kind = kind; this.children = []; this.props = {}; }
  add(c) { this.children.push(c); return this; }
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
