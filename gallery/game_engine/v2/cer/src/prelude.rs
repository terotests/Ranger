// SPDX-License-Identifier: AGPL-3.0-or-later
//! Built-ins written in JavaScript: the ones that are only other built-ins
//! put together (Set methods, iterator helpers, `groupBy`, the Annex B
//! accessor methods, `Promise.allSettled` / `any` / `withResolvers`, …).
//! `Engine::new` runs this once, before any script. Every function here is
//! defined non-enumerable, and reports `[native code]` from `toString`.

pub const PRELUDE: &str = r#"(function () {
var defineProperty = Object.defineProperty;
var getPrototypeOf = Object.getPrototypeOf;
var create = Object.create;
function hide(o, name, v) { defineProperty(o, name, { value: v, writable: true, enumerable: false, configurable: true }); }
function tag(o, name) { defineProperty(o, Symbol.toStringTag, { value: name, writable: false, enumerable: false, configurable: true }); }
function isCallable(f) { return typeof f === 'function'; }
function isObject(v) { return (typeof v === 'object' && v !== null) || typeof v === 'function'; }
function toIntegerOrInfinity(v) { var n = Number(v); if (n !== n) return 0; if (n === Infinity || n === -Infinity) return n; return n < 0 ? -Math.floor(-n) : Math.floor(n); }

tag(Math, 'Math');
tag(JSON, 'JSON');
if (typeof Reflect === 'object') tag(Reflect, 'Reflect');

// ---- Set methods (ES2025): the argument is any set-like: size, has, keys
function setLike(o) {
  if (!isObject(o)) throw new TypeError('The argument must be a set-like object');
  var size = Number(o.size);
  if (size !== size) throw new TypeError("The 'size' property must be a number");
  var has = o.has, keys = o.keys;
  if (!isCallable(has)) throw new TypeError("The 'has' property must be a function");
  if (!isCallable(keys)) throw new TypeError("The 'keys' property must be a function");
  return { size: size, has: function (v) { return !!has.call(o, v); }, keys: function () { return keys.call(o); } };
}
function eachKey(sl, f) {
  var it = sl.keys();
  for (;;) { var r = it.next(); if (r.done) return; if (f(r.value) === false) { if (isCallable(it.return)) it.return(); return; } }
}
var SetProto = Set.prototype;
hide(SetProto, 'union', function union(other) {
  var o = setLike(other); var out = new Set(this);
  eachKey(o, function (v) { out.add(v); }); return out;
});
hide(SetProto, 'intersection', function intersection(other) {
  var o = setLike(other); var out = new Set(); var self = this;
  if (this.size <= o.size) { this.forEach(function (v) { if (o.has(v)) out.add(v); }); }
  else { eachKey(o, function (v) { if (self.has(v)) out.add(v); }); }
  return out;
});
hide(SetProto, 'difference', function difference(other) {
  var o = setLike(other); var out = new Set(); this.forEach(function (v) { if (!o.has(v)) out.add(v); }); return out;
});
hide(SetProto, 'symmetricDifference', function symmetricDifference(other) {
  var o = setLike(other); var out = new Set(this); var self = this;
  eachKey(o, function (v) { if (self.has(v)) out.delete(v); else out.add(v); }); return out;
});
hide(SetProto, 'isSubsetOf', function isSubsetOf(other) {
  var o = setLike(other); if (this.size > o.size) return false; var ok = true;
  this.forEach(function (v) { if (ok && !o.has(v)) ok = false; }); return ok;
});
hide(SetProto, 'isSupersetOf', function isSupersetOf(other) {
  var o = setLike(other); if (this.size < o.size) return false; var ok = true; var self = this;
  eachKey(o, function (v) { if (!self.has(v)) { ok = false; return false; } }); return ok;
});
hide(SetProto, 'isDisjointFrom', function isDisjointFrom(other) {
  var o = setLike(other); var ok = true; var self = this;
  if (this.size <= o.size) { this.forEach(function (v) { if (ok && o.has(v)) ok = false; }); }
  else { eachKey(o, function (v) { if (self.has(v)) { ok = false; return false; } }); }
  return ok;
});

// ---- Iterator (ES2025): the prototype every built-in iterator shares, and
// its helpers
var ArrayIteratorProto = getPrototypeOf([][Symbol.iterator]());
var IteratorProto = create(Object.prototype);
hide(IteratorProto, Symbol.iterator, function () { return this; });
Object.setPrototypeOf(ArrayIteratorProto, IteratorProto);
var GeneratorProto = getPrototypeOf(function* () {}).prototype;
Object.setPrototypeOf(GeneratorProto, IteratorProto);
function Iterator() {
  if (new.target === undefined || new.target === Iterator) throw new TypeError('Abstract class Iterator not directly constructable');
}
defineProperty(Iterator, 'prototype', { value: IteratorProto, writable: false, enumerable: false, configurable: false });
hide(IteratorProto, 'constructor', Iterator);
tag(IteratorProto, 'Iterator');
hide(globalThis, 'Iterator', Iterator);

var HelperProto = create(IteratorProto);
tag(HelperProto, 'Iterator Helper');
function helper(src, step) {
  var h = create(HelperProto); var done = false;
  var next = src.next;
  hide(h, 'next', function () {
    if (done) return { value: undefined, done: true };
    var r = step(src, next);
    if (r.done) done = true;
    return r;
  });
  hide(h, 'return', function () {
    done = true; if (isCallable(src.return)) src.return(); return { value: undefined, done: true };
  });
  return h;
}
function need(f) { if (!isCallable(f)) throw new TypeError(String(f) + ' is not a function'); }
function nextOf(it) { return it.next(); }
hide(IteratorProto, 'map', function map(f) {
  need(f); var i = 0;
  return helper(this, function (src, next) { var r = next.call(src); if (r.done) return r; return { value: f(r.value, i++), done: false }; });
});
hide(IteratorProto, 'filter', function filter(f) {
  need(f); var i = 0;
  return helper(this, function (src, next) { for (;;) { var r = next.call(src); if (r.done) return r; if (f(r.value, i++)) return { value: r.value, done: false }; } });
});
function count(n) {
  var v = Number(n); if (v !== v) throw new RangeError(String(n) + ' must be positive');
  v = toIntegerOrInfinity(v); if (v < 0) throw new RangeError(String(n) + ' must be positive'); return v;
}
hide(IteratorProto, 'take', function take(n) {
  var left = count(n);
  return helper(this, function (src, next) {
    if (left <= 0) { if (isCallable(src.return)) src.return(); return { value: undefined, done: true }; }
    left--; var r = next.call(src); return r.done ? r : { value: r.value, done: false };
  });
});
hide(IteratorProto, 'drop', function drop(n) {
  var left = count(n);
  return helper(this, function (src, next) {
    while (left > 0) { left--; var s = next.call(src); if (s.done) return s; }
    var r = next.call(src); return r.done ? r : { value: r.value, done: false };
  });
});
hide(IteratorProto, 'flatMap', function flatMap(f) {
  need(f); var i = 0; var inner = null;
  return helper(this, function (src, next) {
    for (;;) {
      if (inner) { var ir = inner.next(); if (!ir.done) return { value: ir.value, done: false }; inner = null; }
      var r = next.call(src); if (r.done) return r;
      var m = f(r.value, i++);
      if (!isObject(m) && typeof m !== 'string') throw new TypeError('flatMap mapper must return an iterable');
      inner = m[Symbol.iterator]();
    }
  });
});
hide(IteratorProto, 'reduce', function reduce(f) {
  need(f); var acc, i = 0, r;
  if (arguments.length < 2) { r = this.next(); if (r.done) throw new TypeError('Reduce of empty iterator with no initial value'); acc = r.value; i = 1; }
  else acc = arguments[1];
  for (;;) { r = this.next(); if (r.done) return acc; acc = f(acc, r.value, i++); }
});
hide(IteratorProto, 'toArray', function toArray() {
  var out = []; for (;;) { var r = this.next(); if (r.done) return out; out.push(r.value); }
});
hide(IteratorProto, 'forEach', function forEach(f) {
  need(f); var i = 0; for (;;) { var r = this.next(); if (r.done) return undefined; f(r.value, i++); }
});
hide(IteratorProto, 'some', function some(f) {
  need(f); var i = 0; for (;;) { var r = this.next(); if (r.done) return false; if (f(r.value, i++)) { if (isCallable(this.return)) this.return(); return true; } }
});
hide(IteratorProto, 'every', function every(f) {
  need(f); var i = 0; for (;;) { var r = this.next(); if (r.done) return true; if (!f(r.value, i++)) { if (isCallable(this.return)) this.return(); return false; } }
});
hide(IteratorProto, 'find', function find(f) {
  need(f); var i = 0; for (;;) { var r = this.next(); if (r.done) return undefined; if (f(r.value, i++)) { if (isCallable(this.return)) this.return(); return r.value; } }
});
var WrapProto = create(IteratorProto);
hide(Iterator, 'from', function from(o) {
  var it;
  if (typeof o === 'string' || isObject(o)) {
    var m = o[Symbol.iterator];
    if (m !== undefined && m !== null) { need(m); it = m.call(o); } else it = o;
  } else throw new TypeError(String(o) + ' is not an object');
  if (it instanceof Iterator) return it;
  var w = create(WrapProto);
  hide(w, 'next', function () { return it.next(); });
  hide(w, 'return', function () { return isCallable(it.return) ? it.return() : { value: undefined, done: true }; });
  return w;
});

// ---- groupBy (ES2024)
hide(Map, 'groupBy', function groupBy(items, f) {
  need(f); var m = new Map(); var i = 0;
  for (var v of items) { var k = f(v, i++); if (k === 0) k = 0; var g = m.get(k); if (g === undefined) { g = []; m.set(k, g); } g.push(v); }
  return m;
});
if (typeof Object.groupBy !== 'function') hide(Object, 'groupBy', function groupBy(items, f) {
  need(f); var o = create(null); var i = 0;
  for (var v of items) { var k = f(v, i++); if (typeof k !== 'symbol') k = String(k); if (!(k in o)) o[k] = []; o[k].push(v); }
  return o;
});

// ---- Annex B accessor methods
var OP = Object.prototype;
hide(OP, '__defineGetter__', function __defineGetter__(name, f) {
  need(f); defineProperty(Object(this), name, { get: f, enumerable: true, configurable: true });
});
hide(OP, '__defineSetter__', function __defineSetter__(name, f) {
  need(f); defineProperty(Object(this), name, { set: f, enumerable: true, configurable: true });
});
function lookup(o, name, which) {
  o = Object(o);
  while (o !== null) {
    var d = Object.getOwnPropertyDescriptor(o, name);
    if (d) return d[which];
    o = getPrototypeOf(o);
  }
  return undefined;
}
hide(OP, '__lookupGetter__', function __lookupGetter__(name) { return lookup(this, name, 'get'); });
hide(OP, '__lookupSetter__', function __lookupSetter__(name) { return lookup(this, name, 'set'); });

// ---- Promise statics
hide(Promise, 'allSettled', function allSettled(items) {
  var C = this;
  return new C(function (resolve, reject) {
    var out = [], left = 1, i = 0;
    for (var v of items) {
      (function (k) {
        left++;
        C.resolve(v).then(function (x) { out[k] = { status: 'fulfilled', value: x }; if (--left === 0) resolve(out); },
                          function (e) { out[k] = { status: 'rejected', reason: e }; if (--left === 0) resolve(out); });
      })(i++);
    }
    if (--left === 0) resolve(out);
  });
});
hide(Promise, 'any', function any(items) {
  var C = this;
  return new C(function (resolve, reject) {
    var errs = [], left = 1, i = 0;
    for (var v of items) {
      (function (k) {
        left++;
        C.resolve(v).then(resolve, function (e) { errs[k] = e; if (--left === 0) reject(new AggregateError(errs, 'All promises were rejected')); });
      })(i++);
    }
    if (--left === 0) reject(new AggregateError(errs, 'All promises were rejected'));
  });
});
hide(Promise, 'withResolvers', function withResolvers() {
  var out = {};
  out.promise = new this(function (res, rej) { out.resolve = res; out.reject = rej; });
  return out;
});
if (typeof Promise.race !== 'function') hide(Promise, 'race', function race(items) {
  var C = this;
  return new C(function (resolve, reject) { for (var v of items) C.resolve(v).then(resolve, reject); });
});

// ---- Array.prototype.toSpliced (ES2023)
hide(Array.prototype, 'toLocaleString', function toLocaleString() {
  var o = Object(this), n = o.length >>> 0, s = '';
  for (var i = 0; i < n; i++) {
    if (i > 0) s += ',';
    var e = o[i];
    if (e !== undefined && e !== null) s += String(e.toLocaleString());
  }
  return s;
});
hide(Array.prototype, 'toSpliced', function toSpliced(start, skip) {
  var o = Object(this); var len = o.length >>> 0;
  var s = toIntegerOrInfinity(start);
  s = s < 0 ? Math.max(len + s, 0) : Math.min(s, len);
  var n = arguments.length === 0 ? 0 : arguments.length === 1 ? len - s : Math.min(Math.max(toIntegerOrInfinity(skip), 0), len - s);
  var out = [];
  for (var i = 0; i < s; i++) out.push(o[i]);
  for (var j = 2; j < arguments.length; j++) out.push(arguments[j]);
  for (var k = s + n; k < len; k++) out.push(o[k]);
  return out;
});

// ---- WeakRef / FinalizationRegistry (ES2021): the collector never runs
// a callback, so a held object simply stays
function WeakRef(target) {
  if (new.target === undefined) throw new TypeError("Constructor WeakRef requires 'new'");
  if (!isObject(target)) throw new TypeError('WeakRef: invalid target');
  var t = target;
  hide(this, 'deref', function deref() { return t; });
}
tag(WeakRef.prototype, 'WeakRef');
hide(globalThis, 'WeakRef', WeakRef);
function FinalizationRegistry(cleanup) {
  if (new.target === undefined) throw new TypeError("Constructor FinalizationRegistry requires 'new'");
  if (!isCallable(cleanup)) throw new TypeError('FinalizationRegistry: cleanup must be callable');
}
hide(FinalizationRegistry.prototype, 'register', function register(target, held, token) {
  if (!isObject(target)) throw new TypeError('FinalizationRegistry.prototype.register: invalid target');
});
hide(FinalizationRegistry.prototype, 'unregister', function unregister(token) { return false; });
tag(FinalizationRegistry.prototype, 'FinalizationRegistry');
hide(globalThis, 'FinalizationRegistry', FinalizationRegistry);
// ---- ArrayBuffer, SharedArrayBuffer, the typed arrays, DataView,
// Atomics: over the natives of typed.rs
var TA = globalThis.__cerTA;
delete globalThis.__cerTA;
function getter(o, name, f) { defineProperty(o, name, { get: f, enumerable: false, configurable: true }); }
function buf(b) { if (!TA.bufInfo(b, 5)) throw new TypeError('Receiver is not an ArrayBuffer'); return b; }

var ABProto = TA.bufferProto;
function ArrayBuffer(len, opts) {
  if (new.target === undefined) throw new TypeError("Constructor ArrayBuffer requires 'new'");
  var max = (isObject(opts) && opts.maxByteLength !== undefined) ? opts.maxByteLength : undefined;
  var p = isObject(new.target.prototype) ? new.target.prototype : ABProto;
  return TA.buffer(p, len, max, false);
}
defineProperty(ArrayBuffer, 'prototype', { value: ABProto, writable: false, enumerable: false, configurable: false });
hide(ABProto, 'constructor', ArrayBuffer);
tag(ABProto, 'ArrayBuffer');
getter(ABProto, 'byteLength', function () { return TA.bufInfo(buf(this), 0); });
getter(ABProto, 'maxByteLength', function () { return TA.bufInfo(buf(this), 1); });
getter(ABProto, 'resizable', function () { return TA.bufInfo(buf(this), 3); });
getter(ABProto, 'detached', function () { return TA.bufInfo(buf(this), 2); });
hide(ABProto, 'slice', function slice(start, end) { return TA.slice(buf(this), start, end, getPrototypeOf(this)); });
hide(ABProto, 'resize', function resize(n) { TA.resize(buf(this), n); });
hide(ABProto, 'transfer', function transfer(n) { return TA.transfer(buf(this), n, true); });
hide(ABProto, 'transferToFixedLength', function transferToFixedLength(n) { return TA.transfer(buf(this), n, false); });
hide(ArrayBuffer, 'isView', function isView(v) { return TA.info(v, 4) >= 0; });
getter(ArrayBuffer, Symbol.species, function () { return this; });
hide(globalThis, 'ArrayBuffer', ArrayBuffer);

var SABProto = create(Object.prototype);
function SharedArrayBuffer(len, opts) {
  if (new.target === undefined) throw new TypeError("Constructor SharedArrayBuffer requires 'new'");
  var max = (isObject(opts) && opts.maxByteLength !== undefined) ? opts.maxByteLength : undefined;
  return TA.buffer(isObject(new.target.prototype) ? new.target.prototype : SABProto, len, max, true);
}
defineProperty(SharedArrayBuffer, 'prototype', { value: SABProto, writable: false, enumerable: false, configurable: false });
hide(SABProto, 'constructor', SharedArrayBuffer);
tag(SABProto, 'SharedArrayBuffer');
getter(SABProto, 'byteLength', function () { return TA.bufInfo(buf(this), 0); });
getter(SABProto, 'maxByteLength', function () { return TA.bufInfo(buf(this), 1); });
getter(SABProto, 'growable', function () { return TA.bufInfo(buf(this), 3); });
hide(SABProto, 'slice', function slice(start, end) { return TA.slice(buf(this), start, end, getPrototypeOf(this)); });
hide(SABProto, 'grow', function grow(n) {
  if (n < TA.bufInfo(buf(this), 0)) throw new RangeError('SharedArrayBuffer.prototype.grow: Invalid length parameter');
  TA.resize(this, n);
});
hide(globalThis, 'SharedArrayBuffer', SharedArrayBuffer);

var KINDS = ['Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array', 'BigInt64Array', 'BigUint64Array'];
var SIZES = [1, 1, 1, 2, 2, 4, 4, 4, 8, 8, 8];
function TypedArray() { throw new TypeError('Abstract class TypedArray not directly constructable'); }
var TAProto = TypedArray.prototype;
function kindOf(o) { var k = TA.info(o, 4); if (k < 0 || k > 10) throw new TypeError('this is not a typed array.'); return k; }
function lenOf(o) { kindOf(o); return TA.info(o, 0); }
var CTORS = [];
function species(o, n) {
  var k = kindOf(o);
  var C = o.constructor;
  if (C === undefined) C = CTORS[k];
  else { var S = C[Symbol.species]; C = (S === undefined || S === null) ? CTORS[k] : S; }
  var r = new C(n);
  kindOf(r);
  return r;
}
getter(TAProto, 'length', function () { return lenOf(this); });
getter(TAProto, 'byteLength', function () { kindOf(this); return TA.info(this, 1); });
getter(TAProto, 'byteOffset', function () { kindOf(this); return TA.info(this, 2); });
getter(TAProto, 'buffer', function () { kindOf(this); return TA.info(this, 3); });
getter(TAProto, Symbol.toStringTag, function () { var k = TA.info(this, 4); return k >= 0 && k <= 10 ? KINDS[k] : undefined; });
hide(TAProto, 'set', function set(src, offset) {
  var n = lenOf(this); var off = toIntegerOrInfinity(offset);
  if (off < 0) throw new RangeError('offset is out of bounds');
  var o = Object(src); var m = o.length >>> 0;
  if (m + off > n) throw new RangeError('offset is out of bounds');
  var tmp = []; for (var i = 0; i < m; i++) tmp.push(o[i]);
  for (var j = 0; j < m; j++) this[off + j] = tmp[j];
});
function rel(v, n, d) { if (v === undefined) return d; var t = toIntegerOrInfinity(v); return t < 0 ? Math.max(n + t, 0) : Math.min(t, n); }
hide(TAProto, 'subarray', function subarray(begin, end) {
  var k = kindOf(this); var n = TA.info(this, 0);
  var b = rel(begin, n, 0); var e = rel(end, n, n); var cnt = Math.max(e - b, 0);
  var C = this.constructor === undefined ? CTORS[k] : this.constructor;
  return new C(TA.info(this, 3), TA.info(this, 2) + b * SIZES[k], cnt);
});
hide(TAProto, 'slice', function slice(begin, end) {
  var n = lenOf(this); var b = rel(begin, n, 0); var e = rel(end, n, n); var cnt = Math.max(e - b, 0);
  var r = species(this, cnt); for (var i = 0; i < cnt; i++) r[i] = this[b + i]; return r;
});
hide(TAProto, 'map', function map(f, t) {
  need(f); var n = lenOf(this); var r = species(this, n);
  for (var i = 0; i < n; i++) r[i] = f.call(t, this[i], i, this); return r;
});
hide(TAProto, 'filter', function filter(f, t) {
  need(f); var n = lenOf(this); var kept = [];
  for (var i = 0; i < n; i++) { var v = this[i]; if (f.call(t, v, i, this)) kept.push(v); }
  var r = species(this, kept.length); for (var j = 0; j < kept.length; j++) r[j] = kept[j]; return r;
});
hide(TAProto, 'fill', function fill(v, begin, end) {
  var n = lenOf(this); var x = Number(v); var b = rel(begin, n, 0); var e = rel(end, n, n);
  for (var i = b; i < e; i++) this[i] = x; return this;
});
hide(TAProto, 'reverse', function reverse() {
  var n = lenOf(this); for (var i = 0, j = n - 1; i < j; i++, j--) { var t = this[i]; this[i] = this[j]; this[j] = t; } return this;
});
hide(TAProto, 'sort', function sort(cmp) {
  if (cmp !== undefined) need(cmp);
  var n = lenOf(this); var a = []; for (var i = 0; i < n; i++) a.push(this[i]);
  a.sort(cmp === undefined ? function (x, y) {
    if (x !== x) return y !== y ? 0 : 1; if (y !== y) return -1;
    if (x < y) return -1; if (x > y) return 1;
    if (x === 0 && y === 0) return (1 / x < 0 ? -1 : 0) - (1 / y < 0 ? -1 : 0);
    return 0;
  } : cmp);
  for (var j = 0; j < n; j++) this[j] = a[j]; return this;
});
hide(TAProto, 'toReversed', function toReversed() { var n = lenOf(this); var r = new CTORS[kindOf(this)](n); for (var i = 0; i < n; i++) r[i] = this[n - 1 - i]; return r; });
hide(TAProto, 'toSorted', function toSorted(cmp) { var n = lenOf(this); var r = new CTORS[kindOf(this)](n); for (var i = 0; i < n; i++) r[i] = this[i]; return r.sort(cmp); });
hide(TAProto, 'with', function (idx, v) {
  var n = lenOf(this); var i = toIntegerOrInfinity(idx); if (i < 0) i += n;
  var x = Number(v);
  if (i < 0 || i >= n) throw new RangeError('Invalid typed array index');
  var r = new CTORS[kindOf(this)](n); for (var j = 0; j < n; j++) r[j] = this[j]; r[i] = x; return r;
});
hide(TAProto, 'copyWithin', function copyWithin(target, start, end) {
  var n = lenOf(this); var to = rel(target, n, 0); var from = rel(start, n, 0); var fin = rel(end, n, n);
  var cnt = Math.min(fin - from, n - to); var tmp = [];
  for (var i = 0; i < cnt; i++) tmp.push(this[from + i]);
  for (var j = 0; j < cnt; j++) this[to + j] = tmp[j]; return this;
});
['join', 'indexOf', 'lastIndexOf', 'includes', 'forEach', 'reduce', 'reduceRight', 'every', 'some', 'find', 'findIndex', 'findLast', 'findLastIndex', 'at', 'toLocaleString'].forEach(function (name) {
  var m = Array.prototype[name];
  if (typeof m === 'function') hide(TAProto, name, function () { kindOf(this); return m.apply(this, arguments); });
});
hide(TAProto, 'toString', Array.prototype.toString);
hide(TAProto, 'keys', function keys() { kindOf(this); return Array.prototype.keys.call(this); });
hide(TAProto, 'values', function values() { kindOf(this); return Array.prototype.values.call(this); });
hide(TAProto, 'entries', function entries() { kindOf(this); return Array.prototype.entries.call(this); });
hide(TAProto, Symbol.iterator, TAProto.values);
hide(TypedArray, 'from', function from(src, f, t) {
  var C = this; var items = [];
  if (src != null && typeof src[Symbol.iterator] === 'function') { for (var v of src) items.push(v); }
  else { var o = Object(src); var m = o.length >>> 0; for (var i = 0; i < m; i++) items.push(o[i]); }
  var r = new C(items.length);
  for (var j = 0; j < items.length; j++) r[j] = f === undefined ? items[j] : f.call(t, items[j], j);
  return r;
});
hide(TypedArray, 'of', function of() { var r = new this(arguments.length); for (var i = 0; i < arguments.length; i++) r[i] = arguments[i]; return r; });
getter(TypedArray, Symbol.species, function () { return this; });
KINDS.forEach(function (name, k) {
  var C = function () {
    if (new.target === undefined) throw new TypeError("Constructor " + name + " requires 'new'");
    return TA.create(k, isObject(new.target.prototype) ? new.target.prototype : P, arguments[0], arguments[1], arguments[2]);
  };
  defineProperty(C, 'name', { value: name, configurable: true });
  defineProperty(C, 'length', { value: 3, configurable: true });
  var P = create(TAProto);
  defineProperty(C, 'prototype', { value: P, writable: false, enumerable: false, configurable: false });
  hide(P, 'constructor', C);
  defineProperty(P, 'BYTES_PER_ELEMENT', { value: SIZES[k] });
  defineProperty(C, 'BYTES_PER_ELEMENT', { value: SIZES[k] });
  Object.setPrototypeOf(C, TypedArray);
  CTORS[k] = C;
  hide(globalThis, name, C);
});

var DVProto = create(Object.prototype);
function DataView(buffer, offset, length) {
  if (new.target === undefined) throw new TypeError("Constructor DataView requires 'new'");
  return TA.view(isObject(new.target.prototype) ? new.target.prototype : DVProto, buffer, offset, length);
}
defineProperty(DataView, 'prototype', { value: DVProto, writable: false, enumerable: false, configurable: false });
hide(DVProto, 'constructor', DataView);
tag(DVProto, 'DataView');
function dv(o) { if (TA.info(o, 4) !== 20) throw new TypeError('Receiver is not a DataView'); return o; }
getter(DVProto, 'buffer', function () { return TA.info(dv(this), 3); });
getter(DVProto, 'byteLength', function () { return TA.info(dv(this), 1); });
getter(DVProto, 'byteOffset', function () { return TA.info(dv(this), 2); });
[['Int8', 0], ['Uint8', 1], ['Int16', 3], ['Uint16', 4], ['Int32', 5], ['Uint32', 6], ['Float32', 7], ['Float64', 8], ['BigInt64', 9], ['BigUint64', 10]].forEach(function (e) {
  var k = e[1];
  hide(DVProto, 'get' + e[0], function (off, little) { return TA.dvGet(this, off, k, little); });
  hide(DVProto, 'set' + e[0], function (off, v, little) { TA.dvSet(this, off, k, little, v); });
});
hide(globalThis, 'DataView', DataView);

// Atomics: every operation is already atomic here
var Atomics = create(Object.prototype);
function intView(ta, idx) {
  var k = TA.info(ta, 4);
  if (k < 0 || k === 2 || k > 6) throw new TypeError('[object Array] is not an integer shared typed array.');
  var i = toIntegerOrInfinity(idx);
  if (i < 0 || i >= TA.info(ta, 0)) throw new RangeError('Invalid atomic access index');
  return i;
}
function rmw(op) {
  return function (ta, idx, v) { var i = intView(ta, idx); var old = ta[i]; ta[i] = op(old, Number(v)); return old; };
}
hide(Atomics, 'add', rmw(function (a, b) { return a + b; }));
hide(Atomics, 'sub', rmw(function (a, b) { return a - b; }));
hide(Atomics, 'and', rmw(function (a, b) { return a & b; }));
hide(Atomics, 'or', rmw(function (a, b) { return a | b; }));
hide(Atomics, 'xor', rmw(function (a, b) { return a ^ b; }));
hide(Atomics, 'exchange', rmw(function (a, b) { return b; }));
hide(Atomics, 'compareExchange', function compareExchange(ta, idx, expected, v) {
  var i = intView(ta, idx); var old = ta[i]; var probe = new CTORS[TA.info(ta, 4)](1); probe[0] = expected;
  if (old === probe[0]) ta[i] = v; return old;
});
hide(Atomics, 'load', function load(ta, idx) { var i = intView(ta, idx); return ta[i]; });
hide(Atomics, 'store', function store(ta, idx, v) { var i = intView(ta, idx); var x = toIntegerOrInfinity(v); ta[i] = x; return x; });
hide(Atomics, 'isLockFree', function isLockFree(n) { return n === 1 || n === 2 || n === 4 || n === 8; });
hide(Atomics, 'notify', function notify(ta, idx, count) { intView(ta, idx); return 0; });
hide(Atomics, 'wait', function wait(ta, idx, v, timeout) { var i = intView(ta, idx); return ta[i] !== v ? 'not-equal' : 'timed-out'; });
hide(Atomics, 'pause', function pause() {});
tag(Atomics, 'Atomics');
hide(globalThis, 'Atomics', Atomics);

// ---- Intl: prelude::INTL, compiled when a program first reaches for it
// (the global Intl, or a toLocaleString that is defined through it)
var IH = globalThis.__cerIntl;
delete globalThis.__cerIntl;
var intlK = { Object: Object, Date: Date, WeakMap: WeakMap, String: String, Number: Number, Math: Math, Symbol: Symbol,
  RangeError: RangeError, TypeError: TypeError, parseInt: parseInt, global: globalThis,
  defineProperty: defineProperty, create: create, isArray: Array.isArray,
  toLower: String.prototype.toLowerCase, toUpper: String.prototype.toUpperCase, dateNow: Date.now,
  getTime: Date.prototype.getTime, numValue: Number.prototype.valueOf };
var intlImpl;
function intl() { if (intlImpl === undefined) intlImpl = IH.load(IH, intlK); return intlImpl; }
defineProperty(globalThis, 'Intl', {
  get: function () { return intl().Intl; },
  set: function (v) { defineProperty(globalThis, 'Intl', { value: v, writable: true, enumerable: false, configurable: true }); },
  enumerable: false, configurable: true });
hide(Number.prototype, 'toLocaleString', function toLocaleString() { return intl().numberLocale(this, arguments[0], arguments[1]); });
hide(Date.prototype, 'toLocaleString', function toLocaleString() { return intl().dateLocale(this, arguments[0], 5); });
hide(Date.prototype, 'toLocaleDateString', function toLocaleDateString() { return intl().dateLocale(this, arguments[0], 0); });
hide(Date.prototype, 'toLocaleTimeString', function toLocaleTimeString() { return intl().dateLocale(this, arguments[0], 4); });

// ---- the async function driver: runs the function's generator, one
// step per settled await (the VM takes it out of the global object)
// ---- async generators: the VM runs the body as a generator whose
// results say when it stopped at an await; this queues next / throw /
// return and settles their promises in order
var AsyncGenFnProto = getPrototypeOf(async function* () {});
var AsyncGenProto = AsyncGenFnProto.prototype;
var AsyncIterProto = getPrototypeOf(AsyncGenProto);
hide(AsyncIterProto, Symbol.asyncIterator, function () { return this; });
var agState = new WeakMap();
function agRun(st) {
  if (st.running || st.queue.length === 0) return;
  st.running = true;
  var req = st.queue[0];
  agStep(st, req.method, req.arg);
}
function agFinish(st, ok, v, done) {
  var req = st.queue.shift();
  st.running = false;
  if (ok) req.resolve({ value: v, done: done }); else req.reject(v);
  agRun(st);
}
function agStep(st, method, arg) {
  var r;
  try { r = st.gen[method](arg); } catch (e) { agFinish(st, false, e); return; }
  if (r.await) {
    Promise.resolve(r.value).then(function (v) { agStep(st, 'next', v); }, function (e) { agStep(st, 'throw', e); });
  } else if (r.done) {
    Promise.resolve(r.value).then(function (v) { agFinish(st, true, v, true); }, function (e) { agFinish(st, false, e); });
  } else {
    Promise.resolve(r.value).then(function (v) { agFinish(st, true, v, false); }, function (e) { agStep(st, 'throw', e); });
  }
}
function agEnqueue(self, method, arg) {
  var st = agState.get(self);
  return new Promise(function (resolve, reject) {
    if (!st) { reject(new TypeError(method + ' method called on incompatible receiver')); return; }
    st.queue.push({ method: method, arg: arg, resolve: resolve, reject: reject });
    agRun(st);
  });
}
hide(AsyncGenProto, 'next', function next(v) { return agEnqueue(this, 'next', v); });
hide(AsyncGenProto, 'return', function (v) { return agEnqueue(this, 'return', v); });
hide(AsyncGenProto, 'throw', function (v) { return agEnqueue(this, 'throw', v); });
hide(globalThis, '__cerAsyncIter', function (o) {
  if (o === null || o === undefined) throw new TypeError(String(o) + ' is not async iterable');
  var m = o[Symbol.asyncIterator];
  if (m !== undefined && m !== null) {
    var ai = m.call(o);
    if (!isObject(ai)) throw new TypeError('Result of the Symbol.asyncIterator method is not an object');
    return ai;
  }
  var sm = o[Symbol.iterator];
  if (!isCallable(sm)) throw new TypeError(typeof o + ' is not async iterable');
  var it = sm.call(o);
  return {
    next: function (v) {
      var r = it.next(v);
      var done = !!r.done;
      return Promise.resolve(r.value).then(function (x) { return { value: x, done: done }; });
    }
  };
});
hide(globalThis, '__cerAsyncGen', function (gen, proto) {
  var it = create(proto);
  agState.set(it, { gen: gen, queue: [], running: false });
  return it;
});
hide(globalThis, '__cerAsync', function (gen) {
  return new Promise(function (resolve, reject) {
    function step(method, arg) {
      var r;
      try { r = gen[method](arg); } catch (e) { reject(e); return; }
      if (r.done) { resolve(r.value); return; }
      Promise.resolve(r.value).then(function (v) { step('next', v); }, function (e) { step('throw', e); });
    }
    step('next', undefined);
  });
});
})();"#;

/// Intl, over the natives of `intl.rs`: ComponentEngine's D-INTL ported.
/// A function of the helper object and the intrinsics, compiled the first
/// time a program reaches for Intl (`__cerIntl.load`), so an engine that
/// never does pays nothing for it. The CLDR data covers 39 locales; any
/// other falls back to "en", and resolvedOptions().locale says so.
pub const INTL: &str = r#"(function (I, K) {
// the intrinsics, as they were when the engine started
var Object = K.Object, Date = K.Date, WeakMap = K.WeakMap, String = K.String, Number = K.Number, Math = K.Math, Symbol = K.Symbol;
var RangeError = K.RangeError, TypeError = K.TypeError, parseInt = K.parseInt, globalThis = K.global;
var defineProperty = K.defineProperty;
var create = K.create;
var isArray = K.isArray;
var toLower = K.toLower;
var toUpper = K.toUpper;
var dateNow = K.dateNow;
var getTime = K.getTime;
var numValue = K.numValue;
function hide(o, name, v) { defineProperty(o, name, { value: v, writable: true, enumerable: false, configurable: true }); }
function tag(o, name) { defineProperty(o, Symbol.toStringTag, { value: name, writable: false, enumerable: false, configurable: true }); }
function getter(o, name, f) { defineProperty(o, name, { get: f, enumerable: false, configurable: true }); }
function isObject(v) { return (typeof v === 'object' && v !== null) || typeof v === 'function'; }
function lower(s) { return toLower.call(s); }
function upper(s) { return toUpper.call(s); }

// the generated tables, fetched once each
var T = [];
function tab(k) { var t = T[k]; if (t === undefined) { t = I.table(k); T[k] = t; } return t; }
var TAGS = 0, NUMSTR = 1, NUMINT = 2, NAMES = 3, PATINT = 4, PATSTR = 5, CURSTR = 6, CURINT = 7;
var PTAGS = 8, PKEYS = 9, PENTRIES = 10, PPAIRS = 11, LISTSEPS = 12, CURCOUNT = 13;

// ---- locale tags
function requested(v) {
  if (v === undefined) return [];
  if (isArray(v)) return v.slice();
  return [v];
}
function firstTag(v) { var l = requested(v); return l.length ? String(l[0]) : ''; }
// IsStructurallyValidLanguageTag, to the depth used here: the language
// subtag is 2-3 or 5-8 letters, every later subtag 1-8 alphanumerics
function wellFormed(tag) {
  if (tag.length === 0) return false;
  var parts = tag.split('-');
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i], np = p.length;
    if (np === 0 || np > 8) return false;
    var alpha = true, alnum = true;
    for (var c = 0; c < np; c++) {
      var ch = p.charCodeAt(c);
      var isAl = (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122);
      var isDi = ch >= 48 && ch <= 57;
      if (!isAl) alpha = false;
      if (!isAl && !isDi) alnum = false;
    }
    if (!alnum) return false;
    if (i === 0 && (!alpha || np < 2 || np === 4)) return false;
  }
  return true;
}
function checkTags(v) {
  var l = requested(v);
  for (var i = 0; i < l.length; i++) {
    var s = String(l[i]);
    if (s.length === 0) continue;
    if (!wellFormed(s)) throw new RangeError('Incorrect locale information provided');
  }
}
// language lowercased, script title-cased, region uppercased
function canonical(tag) {
  var parts = tag.split('-'), out = '';
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i], np = p.length, piece = lower(p);
    if (i > 0) {
      if (np === 4) piece = upper(p.slice(0, 1)) + lower(p.slice(1));
      if (np === 2) piece = upper(p);
      if (np === 3 && /^[0-9]+$/.test(p)) piece = p;
    }
    if (i > 0) out += '-';
    out += piece;
  }
  return out;
}
// the index of a tag in a table of tags: the exact tag, else its language,
// else 0 ("en")
function indexIn(tags, tag) {
  if (tag.length === 0) return 0;
  var want = lower(tag);
  for (var i = 0; i < tags.length; i++) if (tags[i] === want) return i;
  var dash = want.indexOf('-');
  if (dash > 0) {
    var short = want.slice(0, dash);
    for (var j = 0; j < tags.length; j++) if (tags[j] === short) return j;
  }
  return 0;
}
function localeIndex(tag) { return indexIn(tab(TAGS), tag); }
function isSupported(tag) {
  var tags = tab(TAGS), want = lower(tag);
  for (var i = 0; i < tags.length; i++) if (tags[i] === want) return true;
  var dash = want.indexOf('-');
  if (dash > 0) {
    var short = want.slice(0, dash);
    for (var j = 0; j < tags.length; j++) if (tags[j] === short) return true;
  }
  return false;
}
function localeList(v, onlySupported) {
  checkTags(v);
  var l = requested(v), out = [];
  for (var i = 0; i < l.length; i++) {
    var c = canonical(String(l[i]));
    if (onlySupported && !isSupported(c)) continue;
    if (out.indexOf(c) < 0) out.push(c);
  }
  return out;
}
function resolvedLocale(idx) { return canonical(tab(TAGS)[idx]); }

// ---- options
function stringOption(opts, key) {
  if (!isObject(opts)) return '';
  var v = opts[key];
  return v === undefined ? '' : String(v);
}
function intOption(opts, key, fallback) {
  if (!isObject(opts)) return fallback;
  var v = opts[key];
  if (v === undefined) return fallback;
  var n = Number(v);
  if (n !== n) throw new RangeError(key + ' value is out of range.');
  return n < 0 ? -Math.floor(-n) : Math.floor(n);
}
function boolOption(opts, key, fallback) {
  if (!isObject(opts)) return fallback;
  var v = opts[key];
  return v === undefined ? fallback : !!v;
}

// the internal slots of every Intl object
var slots = new WeakMap();
function slot(o, kind, what) {
  var s = isObject(o) ? slots.get(o) : undefined;
  if (s === undefined || s.kind !== kind) throw new TypeError('Method ' + what + ' called on incompatible receiver ' + String(o));
  return s;
}
function part(t, v) { return { type: t, value: v }; }
function joinParts(parts) { var s = ''; for (var i = 0; i < parts.length; i++) s += parts[i].value; return s; }
function makeCtor(name, kind, init, needsNew) {
  var proto = create(Object.prototype);
  var C = function () {
    if (needsNew && new.target === undefined) throw new TypeError("Constructor Intl." + name + " requires 'new'");
    var p = new.target !== undefined && isObject(new.target.prototype) ? new.target.prototype : proto;
    var o = create(p);
    var locales = arguments[0], options = arguments[1];
    checkTags(locales);
    var s = { kind: kind, tag: firstTag(locales) };
    s.loc = localeIndex(s.tag);
    init(s, options);
    slots.set(o, s);
    return o;
  };
  defineProperty(C, 'name', { value: name, writable: false, enumerable: false, configurable: true });
  defineProperty(C, 'length', { value: 0, writable: false, enumerable: false, configurable: true });
  defineProperty(C, 'prototype', { value: proto, writable: false, enumerable: false, configurable: false });
  hide(proto, 'constructor', C);
  tag(proto, 'Intl.' + name);
  hide(C, 'supportedLocalesOf', function supportedLocalesOf(locales) { return localeList(locales, true); });
  return C;
}

var Intl = create(Object.prototype);
tag(Intl, 'Intl');
hide(Intl, 'getCanonicalLocales', function getCanonicalLocales(locales) { return localeList(locales, false); });

// ---- Collator: three-level collation with the locale's tailoring
var Collator = makeCtor('Collator', 'collator', function (s, opts) {
  var sens = stringOption(opts, 'sensitivity');
  if (sens.length === 0) sens = 'variant';
  s.sensitivity = sens;
  s.numeric = boolOption(opts, 'numeric', false);
  s.usage = 'sort';
}, false);
// {numeric:true}: runs of digits compare by value
function numericCompare(a, b) {
  var ia = 0, ib = 0, na = a.length, nb = b.length;
  while (ia < na && ib < nb) {
    var ca = a.charCodeAt(ia), cb = b.charCodeAt(ib);
    var da = ca >= 48 && ca <= 57, db = cb >= 48 && cb <= 57;
    if (da && db) {
      var va = 0, vb = 0;
      while (ia < na) { var x = a.charCodeAt(ia); if (x < 48 || x > 57) break; va = va * 10 + (x - 48); ia++; }
      while (ib < nb) { var y = b.charCodeAt(ib); if (y < 48 || y > 57) break; vb = vb * 10 + (y - 48); ib++; }
      return va < vb ? -1 : (va > vb ? 1 : 0);
    }
    if (ca !== cb) return 0;
    ia++; ib++;
  }
  return 0;
}
function collatorCompare(s, a, b) {
  if (s.numeric) { var nc = numericCompare(a, b); if (nc !== 0) return nc; }
  var levels = 3;
  if (s.sensitivity === 'base' || s.sensitivity === 'case') levels = 1;
  if (s.sensitivity === 'accent') levels = 2;
  return I.collate(a, b, s.tag, levels);
}
getter(Collator.prototype, 'compare', function () {
  var s = slot(this, 'collator', 'get Intl.Collator.prototype.compare');
  if (s.bound === undefined) s.bound = function (x, y) { return collatorCompare(s, String(x), String(y)); };
  return s.bound;
});
hide(Collator.prototype, 'resolvedOptions', function resolvedOptions() {
  var s = slot(this, 'collator', 'Intl.Collator.prototype.resolvedOptions');
  return { locale: resolvedLocale(s.loc), usage: s.usage, sensitivity: s.sensitivity, ignorePunctuation: false, collation: 'default', numeric: s.numeric, caseFirst: 'false' };
});

// ---- NumberFormat
var NumberFormat = makeCtor('NumberFormat', 'numberformat', function (s, opts) {
  var style = stringOption(opts, 'style');
  if (style.length === 0) style = 'decimal';
  var cur = stringOption(opts, 'currency');
  if (style === 'currency') {
    if (cur.length === 0) throw new TypeError('Currency code is required with currency style.');
    cur = upper(cur);
  }
  var defMax = 3, defMin = 0;
  if (style === 'currency') { defMax = currencyDigits(cur); defMin = defMax; }
  if (style === 'percent') defMax = 0;
  var minF = intOption(opts, 'minimumFractionDigits', defMin);
  var maxF = intOption(opts, 'maximumFractionDigits', defMax < minF ? minF : defMax);
  if (minF < 0 || minF > 100 || maxF < 0 || maxF > 100) throw new RangeError('fractionDigits value is out of range.');
  if (maxF < minF) throw new RangeError('maximumFractionDigits value is out of range.');
  s.style = style;
  s.currency = cur;
  s.minF = minF;
  s.maxF = maxF;
  s.minI = intOption(opts, 'minimumIntegerDigits', 1);
  s.group = boolOption(opts, 'useGrouping', true);
}, false);
// ISO 4217 minor units: 2 but for these
function currencyDigits(code) {
  if (/^(BIF|CLP|DJF|GNF|ISK|JPY|KMF|KRW|PYG|RWF|UGX|UYI|VND|VUV|XAF|XOF|XPF)$/.test(code)) return 0;
  if (/^(BHD|IQD|JOD|KWD|LYD|OMR|TND)$/.test(code)) return 3;
  return 2;
}
// grouping from the right; the first group may differ (3 then 2 in South
// Asian locales), and a number shorter than the minimum is not grouped
function groupInteger(digits, loc, useGroup) {
  var sep = tab(NUMSTR)[loc * 22 + 1];
  if (!useGroup || sep.length === 0) return digits;
  var ni = tab(NUMINT);
  var primary = ni[loc * 5], secondary = ni[loc * 5 + 1], minGroup = ni[loc * 5 + 2];
  var n = digits.length;
  if (n <= primary || n < primary + minGroup) return digits;
  var groups = [], end = n, start = n - primary;
  groups.push(digits.slice(start, end));
  end = start;
  while (end > 0) {
    start = end - secondary;
    if (start < 0) start = 0;
    groups.push(digits.slice(start, end));
    end = start;
  }
  var out = '';
  for (var g = groups.length - 1; g >= 0; g--) { out += groups[g]; if (g > 0) out += sep; }
  return out;
}
function currencyEntry(loc, code) {
  var per = tab(CURCOUNT)[0], base = loc * per, cs = tab(CURSTR);
  for (var i = 0; i < per; i++) if (cs[(base + i) * 2] === code) return base + i;
  return -1;
}
function currencySymbol(loc, code) { var e = currencyEntry(loc, code); return e < 0 ? code : tab(CURSTR)[e * 2 + 1]; }
function currencyIsLetters(loc, code) { var e = currencyEntry(loc, code); return e < 0 ? true : tab(CURINT)[e] === 1; }
// the text outside the digits, recorded per locale with U+00A4 for the
// currency symbol
function affix(loc, style, neg, currency) {
  var base = loc * 22, off = 4;
  if (style === 'percent') off = 8;
  if (style === 'currency') off = currencyIsLetters(loc, currency) ? 12 : 16;
  if (neg) off += 2;
  var ns = tab(NUMSTR);
  var pre = ns[base + off], suf = ns[base + off + 1];
  if (style === 'currency') {
    var sym = currencySymbol(loc, currency);
    pre = pre.split('\u00a4').join(sym);
    suf = suf.split('\u00a4').join(sym);
  }
  return [pre, suf];
}
// an affix split into its literal, minus, percent and currency pieces
function pushAffix(out, text, minus, sym, style, pct) {
  if (text.length === 0) return;
  var marks = [minus], types = ['minusSign'];
  if (style === 'percent') { marks.push(pct); types.push('percentSign'); }
  if (style === 'currency') { marks.push(sym); types.push('currency'); }
  var rest = text;
  for (;;) {
    var bestAt = -1, bestI = -1;
    for (var mi = 0; mi < types.length; mi++) {
      var m = marks[mi];
      if (m.length === 0) continue;
      var at = rest.indexOf(m);
      if (at >= 0 && (bestAt < 0 || at < bestAt)) { bestAt = at; bestI = mi; }
    }
    if (bestI < 0) break;
    if (bestAt > 0) out.push(part('literal', rest.slice(0, bestAt)));
    out.push(part(types[bestI], marks[bestI]));
    rest = rest.slice(bestAt + marks[bestI].length);
  }
  if (rest.length > 0) out.push(part('literal', rest));
}
function numberParts(s, value) {
  var loc = s.loc, ns = tab(NUMSTR), out = [];
  var dec = ns[loc * 22], grp = ns[loc * 22 + 1], minus = ns[loc * 22 + 2], pct = ns[loc * 22 + 3];
  var v = value;
  if (s.style === 'percent') v = v * 100;
  if (v !== v) { out.push(part('nan', 'NaN')); return out; }
  var neg = false;
  if (v < 0) { neg = true; v = -v; }
  var aff = affix(loc, s.style, neg, s.currency);
  var sym = currencySymbol(loc, s.currency);
  pushAffix(out, aff[0], minus, sym, s.style, pct);
  if (v === Infinity) {
    out.push(part('infinity', '\u221e'));
    pushAffix(out, aff[1], minus, sym, s.style, pct);
    return out;
  }
  var body = v.toFixed(s.maxF);
  // toFixed answers in exponent form from 1e21 up: the digits written out
  if (body.indexOf('e') >= 0) body = plainDigits(String(v));
  var dot = body.indexOf('.');
  var intPart = body, fracPart = '';
  if (dot >= 0) { intPart = body.slice(0, dot); fracPart = body.slice(dot + 1); }
  var fl = fracPart.length;
  while (fl > s.minF && fracPart.charCodeAt(fl - 1) === 48) fl--;
  fracPart = fracPart.slice(0, fl);
  while (fracPart.length < s.minF) fracPart += '0';
  while (intPart.length < s.minI) intPart = '0' + intPart;
  var grouped = groupInteger(intPart, loc, s.group);
  if (grp.length === 0) {
    out.push(part('integer', grouped));
  } else {
    var rest = grouped;
    for (;;) {
      var at = rest.indexOf(grp);
      if (at < 0) break;
      out.push(part('integer', rest.slice(0, at)));
      out.push(part('group', grp));
      rest = rest.slice(at + grp.length);
    }
    out.push(part('integer', rest));
  }
  if (fracPart.length > 0) {
    out.push(part('decimal', dec));
    out.push(part('fraction', fracPart));
  }
  pushAffix(out, aff[1], minus, sym, s.style, pct);
  return out;
}
// the integer digits of a number written as "1.2345e+22"
function plainDigits(t) {
  var e = t.indexOf('e'), mant = t.slice(0, e), exp = Number(t.slice(e + 1));
  var dot = mant.indexOf('.');
  var digits = dot < 0 ? mant : mant.slice(0, dot) + mant.slice(dot + 1);
  var intLen = (dot < 0 ? mant.length : dot) + exp;
  while (digits.length < intLen) digits += '0';
  return digits.slice(0, intLen);
}
// formatRange: the two ends joined by an en dash, or one when they agree
function rangeParts(a, b) {
  if (joinParts(a) === joinParts(b)) return a;
  return a.concat([part('literal', '\u2013')], b);
}
getter(NumberFormat.prototype, 'format', function () {
  var s = slot(this, 'numberformat', 'get Intl.NumberFormat.prototype.format');
  if (s.bound === undefined) s.bound = function (x) { return joinParts(numberParts(s, Number(x))); };
  return s.bound;
});
hide(NumberFormat.prototype, 'formatToParts', function formatToParts(x) {
  var s = slot(this, 'numberformat', 'Intl.NumberFormat.prototype.formatToParts');
  return numberParts(s, Number(x));
});
hide(NumberFormat.prototype, 'formatRange', function formatRange(x, y) {
  var s = slot(this, 'numberformat', 'Intl.NumberFormat.prototype.formatRange');
  return joinParts(rangeParts(numberParts(s, Number(x)), numberParts(s, Number(y))));
});
hide(NumberFormat.prototype, 'formatRangeToParts', function formatRangeToParts(x, y) {
  var s = slot(this, 'numberformat', 'Intl.NumberFormat.prototype.formatRangeToParts');
  return rangeParts(numberParts(s, Number(x)), numberParts(s, Number(y)));
});
hide(NumberFormat.prototype, 'resolvedOptions', function resolvedOptions() {
  var s = slot(this, 'numberformat', 'Intl.NumberFormat.prototype.resolvedOptions');
  var r = { locale: resolvedLocale(s.loc), numberingSystem: 'latn', style: s.style };
  if (s.currency.length > 0) r.currency = s.currency;
  r.minimumIntegerDigits = s.minI;
  r.minimumFractionDigits = s.minF;
  r.maximumFractionDigits = s.maxF;
  r.useGrouping = s.group;
  return r;
});

// ---- DateTimeFormat: six patterns per locale (default date, long date,
// full date, short time, default time, date and time)
var DateTimeFormat = makeCtor('DateTimeFormat', 'datetimeformat', function (s, opts) {
  var dStyle = stringOption(opts, 'dateStyle'), tStyle = stringOption(opts, 'timeStyle');
  var month = stringOption(opts, 'month'), weekday = stringOption(opts, 'weekday');
  var hour = stringOption(opts, 'hour');
  var hasTime = hour.length > 0 || tStyle.length > 0;
  var hasDate = stringOption(opts, 'year').length > 0 || stringOption(opts, 'day').length > 0 || month.length > 0 || weekday.length > 0 || dStyle.length > 0;
  if (!hasDate && !hasTime) hasDate = true;
  var which;
  if (hasDate) {
    which = 0;
    if (month === 'long' || dStyle === 'long' || dStyle === 'medium') which = 1;
    if (weekday.length > 0 || dStyle === 'full') which = 2;
  } else {
    which = 3;
    if (stringOption(opts, 'second').length > 0 || tStyle === 'medium' || tStyle === 'long') which = 4;
  }
  s.which = which;
  // an explicit hour:'2-digit' pads where the locale's pattern does not
  s.hourW = hour === '2-digit' && tStyle !== 'full' ? 2 : 0;
}, false);
function patternOffset(loc, which) {
  var pi = tab(PATINT), p = 0;
  for (var i = 0; i < loc * 6 + which; i++) p += 1 + pi[p] * 3;
  return p;
}
function pad(n, width) { var s = String(n); while (s.length < width) s = '0' + s; return s; }
function dateParts(loc, which, t, hourWidth) {
  if (t !== t) throw new RangeError('Invalid time value');
  var d = new Date(t);
  var ni = tab(NUMINT), names = tab(NAMES), ns = tab(NUMSTR), ps = tab(PATSTR), pi = tab(PATINT);
  var year = d.getUTCFullYear() + ni[loc * 5 + 4];
  var month = d.getUTCMonth(), day = d.getUTCDate(), wday = d.getUTCDay();
  var hour = d.getUTCHours(), minute = d.getUTCMinutes(), second = d.getUTCSeconds();
  var hour12 = ni[loc * 5 + 3] === 1;
  var p = patternOffset(loc, which), cnt = pi[p], out = [];
  for (var i = 0; i < cnt; i++) {
    var field = pi[p + 1 + i * 3], lit = pi[p + 2 + i * 3], width = pi[p + 3 + i * 3];
    if (field === 0) out.push(part('literal', ps[lit]));
    else if (field === 1) out.push(part('year', String(year)));
    else if (field === 2) out.push(part('month', width === 0 ? names[loc * 38 + month] : pad(month + 1, width)));
    else if (field === 3) out.push(part('day', pad(day, width)));
    else if (field === 4) out.push(part('weekday', names[loc * 38 + 24 + wday]));
    else if (field === 5) {
      var h = hour;
      if (hour12) { h = h % 12; if (h === 0) h = 12; }
      out.push(part('hour', pad(h, hourWidth > 0 ? hourWidth : width)));
    }
    else if (field === 6) out.push(part('minute', pad(minute, width)));
    else if (field === 7) out.push(part('second', pad(second, width)));
    else if (field === 8) out.push(part('dayPeriod', ns[loc * 22 + 20 + (hour < 12 ? 0 : 1)]));
  }
  return out;
}
function timeArg(x) { return x === undefined ? dateNow() : Number(x); }
getter(DateTimeFormat.prototype, 'format', function () {
  var s = slot(this, 'datetimeformat', 'get Intl.DateTimeFormat.prototype.format');
  if (s.bound === undefined) s.bound = function (x) { return joinParts(dateParts(s.loc, s.which, timeArg(x), s.hourW)); };
  return s.bound;
});
hide(DateTimeFormat.prototype, 'formatToParts', function formatToParts(x) {
  var s = slot(this, 'datetimeformat', 'Intl.DateTimeFormat.prototype.formatToParts');
  return dateParts(s.loc, s.which, timeArg(x), s.hourW);
});
hide(DateTimeFormat.prototype, 'formatRange', function formatRange(x, y) {
  var s = slot(this, 'datetimeformat', 'Intl.DateTimeFormat.prototype.formatRange');
  return joinParts(rangeParts(dateParts(s.loc, s.which, timeArg(x), s.hourW), dateParts(s.loc, s.which, timeArg(y), s.hourW)));
});
hide(DateTimeFormat.prototype, 'formatRangeToParts', function formatRangeToParts(x, y) {
  var s = slot(this, 'datetimeformat', 'Intl.DateTimeFormat.prototype.formatRangeToParts');
  return rangeParts(dateParts(s.loc, s.which, timeArg(x), s.hourW), dateParts(s.loc, s.which, timeArg(y), s.hourW));
});
hide(DateTimeFormat.prototype, 'resolvedOptions', function resolvedOptions() {
  var s = slot(this, 'datetimeformat', 'Intl.DateTimeFormat.prototype.resolvedOptions');
  return { locale: resolvedLocale(s.loc), calendar: 'gregory', numberingSystem: 'latn', timeZone: 'UTC' };
});

// ---- PluralRules: the category is looked up by a key of the operands
var CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other'];
var PluralRules = makeCtor('PluralRules', 'pluralrules', function (s, opts) {
  var type = stringOption(opts, 'type');
  if (type.length === 0) type = 'cardinal';
  if (type !== 'cardinal' && type !== 'ordinal') throw new RangeError('Value ' + type + ' out of range for Intl.PluralRules options property type');
  s.type = type;
  s.ploc = indexIn(tab(PTAGS), s.tag);
}, true);
function pluralKey(v) {
  var a = v < 0 ? -v : v;
  var txt = String(a);
  if (txt.indexOf('e') >= 0) return 'b|0|0|0';
  var dot = txt.indexOf('.'), intTxt = txt, fracTxt = '';
  if (dot >= 0) { intTxt = txt.slice(0, dot); fracTxt = txt.slice(dot + 1); }
  var iv = parseInt(intTxt, 10) || 0;
  if (fracTxt.length === 0) {
    if (iv < 1001) return 's' + iv;
    var big = iv > 0 && iv % 1000000 === 0 ? 1 : 0;
    return 'b|' + (iv % 100) + '|' + (iv % 10) + '|' + big;
  }
  var fv = parseInt(fracTxt, 10) || 0;
  return 'd|' + (iv > 3 ? 3 : iv) + '|' + (fracTxt.length > 3 ? 3 : fracTxt.length) + '|' + (fv > 3 ? 3 : fv);
}
function pluralCategory(loc, ordinal, v) {
  var e = tab(PENTRIES), pairs = tab(PPAIRS), keys = tab(PKEYS);
  var base = (loc * 2 + (ordinal ? 1 : 0)) * 3;
  var off = e[base], cnt = e[base + 1], fb = e[base + 2];
  var key = pluralKey(v);
  for (var j = 0; j < cnt; j++) if (keys[pairs[(off + j) * 2]] === key) return pairs[(off + j) * 2 + 1];
  return fb;
}
hide(PluralRules.prototype, 'select', function select(x) {
  var s = slot(this, 'pluralrules', 'Intl.PluralRules.prototype.select');
  return CATEGORIES[pluralCategory(s.ploc, s.type === 'ordinal', Number(x))];
});
hide(PluralRules.prototype, 'resolvedOptions', function resolvedOptions() {
  var s = slot(this, 'pluralrules', 'Intl.PluralRules.prototype.resolvedOptions');
  return { locale: canonical(tab(PTAGS)[s.ploc]), type: s.type };
});

// ---- ListFormat: the pair separator for two items, the middle and end
// ones for more
var ListFormat = makeCtor('ListFormat', 'listformat', function (s, opts) {
  var type = stringOption(opts, 'type');
  if (type.length === 0) type = 'conjunction';
  s.type = type;
  s.ploc = indexIn(tab(PTAGS), s.tag);
}, true);
function listParts(s, list) {
  var items = [];
  if (list !== undefined) {
    var it = list[Symbol.iterator]();
    for (;;) {
      var r = it.next();
      if (r.done) break;
      if (typeof r.value !== 'string') throw new TypeError('Iterable yielded ' + String(r.value) + ' which is not a string');
      items.push(r.value);
    }
  }
  var seps = tab(LISTSEPS), base = s.ploc * 6 + (s.type === 'disjunction' ? 3 : 0);
  var n = items.length, out = [];
  for (var i = 0; i < n; i++) {
    if (i > 0) {
      var sep = n === 2 ? seps[base] : (i === n - 1 ? seps[base + 2] : seps[base + 1]);
      out.push(part('literal', sep));
    }
    out.push(part('element', items[i]));
  }
  return out;
}
hide(ListFormat.prototype, 'format', function format(list) {
  return joinParts(listParts(slot(this, 'listformat', 'Intl.ListFormat.prototype.format'), list));
});
hide(ListFormat.prototype, 'formatToParts', function formatToParts(list) {
  return listParts(slot(this, 'listformat', 'Intl.ListFormat.prototype.formatToParts'), list);
});
hide(ListFormat.prototype, 'resolvedOptions', function resolvedOptions() {
  var s = slot(this, 'listformat', 'Intl.ListFormat.prototype.resolvedOptions');
  return { locale: canonical(tab(PTAGS)[s.ploc]), type: s.type, style: 'long' };
});

hide(Intl, 'Collator', Collator);
hide(Intl, 'NumberFormat', NumberFormat);
hide(Intl, 'DateTimeFormat', DateTimeFormat);
hide(Intl, 'PluralRules', PluralRules);
hide(Intl, 'ListFormat', ListFormat);
hide(globalThis, 'Intl', Intl);

// ---- the toLocaleString family: defined as the Intl objects with the
// same arguments
// (the prelude's Number.prototype.toLocaleString and the Date ones call
// these)
function numberLocale(n, locales, options) {
  var x = numValue.call(n);
  return joinParts(numberParts(slots.get(new NumberFormat(locales, options)), x));
}
function dateLocale(d, locales, which) {
  var t = getTime.call(d);
  if (t !== t) return 'Invalid Date';
  checkTags(locales);
  return joinParts(dateParts(localeIndex(firstTag(locales)), which, t, 0));
}
return { Intl: Intl, numberLocale: numberLocale, dateLocale: dateLocale };
})"#;
