// Tight numeric loop: the interpreter's dispatch cost, nothing else.
var s = 0;
for (var i = 0; i < 3000000; i++) { s = (s + i * 3) % 1000003; }
console.log("arith " + s);
