// Array sort with a JS comparator -- callback-heavy.
function mk(n) { var a = []; var x = 12345; for (var i = 0; i < n; i++) { x = (x * 1103515245 + 12345) % 2147483648; a.push(x % 100000); } return a; }
var s = 0;
for (var r = 0; r < 4; r++) {
  var a = mk(3000);
  a.sort(function (p, q) { return p - q; });
  s = (s + a[0] + a[a.length - 1]) % 1000003;
}
console.log("sort " + s);
