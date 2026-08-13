// Closure creation and invocation.
function make(n) { return function (x) { return x + n; }; }
var s = 0;
for (var r = 0; r < 400000; r++) { var f = make(r); s = (s + f(r)) % 1000003; }
console.log("closures " + s);
