// Sloppy-mode this boxing, frozen arrays, the fused ops (assignment
// statements, x++ in expressions, this.x) and == / === on objects and null.
function g() { return this; } print(typeof g.call("s"), typeof g.call(7), typeof g.call(true), g.call(null) === this, g.call("ab").length, g.call(5) instanceof Number);
function h() { "use strict"; return this; } print(typeof h.call("s"), h.call(undefined), h.call(7));
String.prototype.me = function () { return typeof this; }; print("x".me(), (5).toString === Number.prototype.toString);
var f = function () { return this.valueOf() + 1; }; print(f.call(41), f.apply(1, []), f.bind(9)());
var arrow = () => typeof this; print(arrow.call("s"));
var fr = Object.freeze([1, 2]); fr[0] = 9; fr[1] = 8; fr[5] = 3; print(fr, fr.length, Object.isFrozen(fr));
for (var i = 0; i < 2; i++) { fr[i] = 7; } print(fr);
(function () { "use strict"; try { fr[0] = 5; print("no throw"); } catch (e) { print(e.constructor.name, e.message); } })();
try { fr.push(3); } catch (e) { print(e.constructor.name); } try { fr.sort(); print("sorted", fr); } catch (e) { print(e.constructor.name); }
var ok = [1, 2]; ok[0] = 5; Object.preventExtensions(ok); ok[1] = 6; ok[2] = 7; print(ok, ok.length);
var x = 0, y = 0, c = true; c ? (x = 1) : (y = 2); print(x, y); c = false; c ? (x = 5) : (y = 6); print(x, y);
c && (x = 9); print(x); var z = "3"; var w = z++; print(w, z, typeof w, typeof z); var q = "a"; print(q++, q, ++q);
var i = 5; var a = [i++, i++, ++i, i--, --i]; print(a, i); var o = { valueOf: function () { return 10; } }; var p = o++; print(p, o);
function F() { this.v = 3; this.get = function () { return this.v + this.w; }; } F.prototype.w = 4; var f = new F(); print(f.get(), f.v);
var n1 = null, u1; print(n1 == u1, n1 === u1, f == null, null != f, f === f, {} === {}, n1 == 0, u1 == false, 0 == null);
var k = 0; while (k < 3) { if (f == null) break; k++; } print(k); function g() { return this; } print(g.call(7) == 7, typeof g.call("s"));
var arr = [1,2,3]; for (var j = 0; j < arr.length; j++) { var t; t = arr[j] * 2; arr[j] = t; } print(arr, (function(){ var m = 1; m = m + 1; return m; })());
var cls = class { constructor() { this.x = 1; } get y() { return this.x + 1; } m() { return this.y * 2; } }; print(new cls().m());
var s = 0; for (var e = 0; e < 10; e++) { s = s - e * 2; } print(s, 1 - "2", "3" * "4", null - 1);
var o = {}, c = true, arr = [0, 0]; c ? (o.a = 1) : (o.b = 2); c = !c; c ? (o.a = 3) : (o.b = 4); print(o.a, o.b);
c && (arr[1] = 7); c || (arr[0] = 8); print(arr);
var p = { set x(v) { if (v > 1) throw new Error("big " + v); this._x = v; } }; try { p.x = 1; p.x = 5; } catch (e) { print(e.message, p._x); }
var fr = Object.freeze([1]); fr[0] = 9; print(fr[0]); "use strict"; var q = [1, 2]; q[5] = 3; print(q.length, q);
for (var i = 0; i < 3; i++) { o["k" + i] = i; arr[i] = i * i; } print(JSON.stringify(o), arr);
