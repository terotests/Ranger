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

// ---- the async function driver: runs the function's generator, one
// step per settled await (the VM takes it out of the global object)
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
