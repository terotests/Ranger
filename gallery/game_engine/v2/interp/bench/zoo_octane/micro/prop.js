var o = {a:0};
for (var i = 0; i < 20000; i++) { o.a = o.a + 1; }
console.log("prop=" + o.a);
