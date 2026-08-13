// Recursive calls: function-call overhead, arithmetic, no allocation.
function fib(n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }
var acc = 0;
for (var i = 0; i < 3; i++) { acc += fib(27); }
console.log("fib " + acc);
