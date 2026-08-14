// Polymorphic method dispatch through a class hierarchy.
class Shape { constructor(n) { this.n = n; } area() { return 0; } }
class Sq extends Shape { area() { return this.n * this.n; } }
class Ci extends Shape { area() { return this.n * this.n * 3.14159; } }
class Tr extends Shape { area() { return this.n * this.n * 0.5; } }
var shapes = [];
for (var i = 0; i < 30000; i++) { var k = i % 3; shapes.push(k === 0 ? new Sq(i % 50) : k === 1 ? new Ci(i % 50) : new Tr(i % 50)); }
var s = 0;
for (var r = 0; r < 20; r++) { for (var i = 0; i < shapes.length; i++) { s += shapes[i].area(); } }
console.log("dispatch " + Math.round(s));
