// L6: a closure that captures the object holding it -- the other everyday way
// to make a cycle. Handler tables in the compiler look like this.
var N = __N__;
function makeVisitor(tag) {
  var self = { tag: tag, seen: 0 };
  self.visit = function (x) { self.seen++; return self.tag + x; };
  return self;
}
var checksum = 0;
for (var i = 0; i < N; i++) {
  var v = makeVisitor("t" + i);
  checksum += v.visit(i).length;
}
console.log("checksum " + checksum);
