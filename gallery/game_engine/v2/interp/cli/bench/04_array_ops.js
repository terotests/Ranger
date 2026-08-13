// Array index, push and pop.
var a = [];
for (var i = 0; i < 30000; i++) { a.push(i); }
var s = 0;
for (var r = 0; r < 8; r++) {
  for (var i = 0; i < a.length; i++) { s = (s + a[i]) % 1000003; }
}
while (a.length) { s += a.pop(); }
console.log("array " + s);
