function f(x) { return x + 1; }
var s = 0;
for (var i = 0; i < 20000; i++) { s = f(s); }
console.log("s=" + s);
