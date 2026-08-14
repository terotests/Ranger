// Property read/write on same-shape objects -- the hidden-class path.
function P(x, y, z) { this.x = x; this.y = y; this.z = z; }
var objs = [];
for (var i = 0; i < 20000; i++) { objs.push(new P(i, i + 1, i + 2)); }
var s = 0;
for (var r = 0; r < 40; r++) {
  for (var i = 0; i < objs.length; i++) { var o = objs[i]; o.y = o.x + o.z; s += o.y; }
}
console.log("props " + s);
