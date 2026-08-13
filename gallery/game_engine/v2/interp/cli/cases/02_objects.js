// Objects, arrays, prototypes and property semantics.
var acc = [];
function say(s) { acc.push(String(s)); }

var o = { a: 1, b: "two", c: [3, 4], d: { e: 5 } };
say(Object.keys(o).join(","));
say(JSON.stringify(o));
say(JSON.stringify(JSON.parse('{"x":[1,{"y":null}],"z":true}')));
say(JSON.stringify(o, null, 2).split("\n").length);
say("a" in o);
say(o.hasOwnProperty("a") + ":" + o.hasOwnProperty("toString"));
delete o.a;
say(Object.keys(o).join(","));

var arr = [5, 3, 9, 1];
say(arr.length);
say(arr.slice(1, 3).join("-"));
say(arr.concat([7]).join("-"));
say(arr.map(function (x) { return x * 2; }).join("-"));
say(arr.filter(function (x) { return x > 3; }).join("-"));
say(arr.reduce(function (a, b) { return a + b; }, 0));
say(arr.indexOf(9));
say([].concat(arr).sort(function (a, b) { return a - b; }).join("-"));
say([].concat(arr).sort().join("-"));
say([].concat(arr).reverse().join("-"));
say(arr.join(","));
var sp = [1, 2, 3, 4, 5];
say(sp.splice(1, 2).join("-") + " left " + sp.join("-"));
say([1, [2, [3, [4]]]].join(","));
say(Array.isArray(arr) + ":" + Array.isArray("no"));
say(new Array(3).length);
say([1, 2, 3].some(function (x) { return x > 2; }));
say([1, 2, 3].every(function (x) { return x > 0; }));
say([1, 2, 3].forEach(function () {}) === undefined);

function Point(x, y) { this.x = x; this.y = y; }
Point.prototype.norm = function () { return Math.sqrt(this.x * this.x + this.y * this.y); };
Point.prototype.toString = function () { return "(" + this.x + "," + this.y + ")"; };
var p = new Point(3, 4);
say(p.norm());
say(String(p));
say(p instanceof Point);
say(Object.getPrototypeOf(p) === Point.prototype);

function Point3(x, y, z) { Point.call(this, x, y); this.z = z; }
Point3.prototype = Object.create(Point.prototype);
Point3.prototype.constructor = Point3;
var q = new Point3(1, 2, 3);
say(q instanceof Point3 && q instanceof Point);
say(q.norm().toFixed(4));

var getset = { _v: 1, get v() { return this._v * 10; }, set v(n) { this._v = n; } };
getset.v = 4;
say(getset.v);

var frozen = Object.freeze({ k: 1 });
try { frozen.k = 2; } catch (e) {}
say(frozen.k);

say(typeof undefined, typeof null, typeof 1, typeof "s", typeof {}, typeof [], typeof say);
say([typeof undefined, typeof null, typeof 1, typeof "s", typeof {}, typeof say].join(","));

console.log(acc.join("\n"));
