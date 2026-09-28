// SPDX-License-Identifier: AGPL-3.0-or-later
//! ArrayBuffer, typed arrays and DataView: the storage and the element
//! access. A buffer (C_ARRAYBUFFER) keeps its bytes in `saved`, one int per
//! byte; `pos` is 1 once detached, `func` its maximum length (-1: fixed),
//! `home` 1 for a SharedArrayBuffer. A view (C_TYPED) has its buffer in
//! `env`, its kind in `func`, its byte offset in `pos` and its length in
//! `saved[0]` (-1: follows the buffer). The constructors and methods are
//! JavaScript in the prelude, over the natives here (`call_typed`).
//!
//! Numbers go to and from bytes through doubles only (no 64-bit integers:
//! the JavaScript target has none), IEEE 754 by hand.

use ranger::prelude::*;
use std::rc::Rc;

use crate::num::*;
use crate::value::*;
use crate::vm::*;

pub const TA_INT8: int = 0;
pub const TA_UINT8: int = 1;
pub const TA_UINT8C: int = 2;
pub const TA_INT16: int = 3;
pub const TA_UINT16: int = 4;
pub const TA_INT32: int = 5;
pub const TA_UINT32: int = 6;
pub const TA_FLOAT32: int = 7;
pub const TA_FLOAT64: int = 8;
pub const TA_BIGINT64: int = 9;
pub const TA_BIGUINT64: int = 10;
/// a DataView: a view of bytes
pub const TA_DATAVIEW: int = 20;

// the natives of the prelude's helper object
pub const NF_TA_FIRST: int = 400;
pub const NF_TA_BUFFER: int = 400;
pub const NF_TA_CREATE: int = 401;
pub const NF_TA_INFO: int = 402;
pub const NF_TA_BUFINFO: int = 403;
pub const NF_TA_RESIZE: int = 404;
pub const NF_TA_TRANSFER: int = 405;
pub const NF_TA_SLICE: int = 406;
pub const NF_TA_DVGET: int = 407;
pub const NF_TA_DVSET: int = 408;
pub const NF_TA_VIEW: int = 409;
pub const NF_TA_LAST: int = 409;

pub fn kind_size(k: int) -> int {
    if k == TA_INT16 || k == TA_UINT16 {
        2
    } else if k == TA_INT32 || k == TA_UINT32 || k == TA_FLOAT32 {
        4
    } else if k == TA_FLOAT64 || k == TA_BIGINT64 || k == TA_BIGUINT64 {
        8
    } else {
        1
    }
}

pub fn pow2d(e: int) -> double {
    (2.0 as double).powf(e as double)
}

/// The bytes of `x` as an IEEE 754 number of `mbits` mantissa bits and
/// `ebits` exponent bits, little-endian, `nbytes` of them.
fn encode_float(x: double, mbits: int, ebits: int, nbytes: int) -> Vec<int> {
    let bias = pow2d(ebits - 1) - 1.0;
    let emax = pow2d(ebits) - 1.0;
    let mut sign = 0.0;
    let mut e: double;
    let mut m: double;
    if is_nan(x) {
        e = emax;
        m = pow2d(mbits - 1);
    } else {
        let mut a = x;
        if x < 0.0 || (x == 0.0 && 1.0 / x < 0.0) {
            sign = 1.0;
            a = -x;
        }
        if a == 0.0 {
            e = 0.0;
            m = 0.0;
        } else if !is_finite(a) {
            e = emax;
            m = 0.0;
        } else {
            let mut ex = a.log2().floor();
            if pow2d(ex as int) > a {
                ex -= 1.0;
            }
            if pow2d((ex + 1.0) as int) <= a {
                ex += 1.0;
            }
            if ex + bias <= 0.0 {
                // subnormal
                m = round_half_even(a / pow2d((1.0 - bias) as int - mbits));
                e = 0.0;
                if m >= pow2d(mbits) {
                    e = 1.0;
                    m -= pow2d(mbits);
                }
            } else {
                m = round_half_even((a / pow2d(ex as int) - 1.0) * pow2d(mbits));
                e = ex + bias;
                if m >= pow2d(mbits) {
                    m = 0.0;
                    e += 1.0;
                }
                if e >= emax {
                    e = emax;
                    m = 0.0;
                }
            }
        }
    }
    // the bits: sign, exponent, mantissa, as one number below 2^(8 * nbytes)
    // split into bytes without leaving doubles
    let mut out: Vec<int> = Vec::new();
    let mut i: int = 0;
    let mut mm = m;
    let mut mb = mbits;
    while i < nbytes {
        out.push(0);
        i += 1;
    }
    // mantissa bytes from the bottom
    let mut k: usize = 0;
    while mb >= 8 {
        let b = mm % 256.0;
        out[k] = b as int;
        mm = (mm - b) / 256.0;
        mb -= 8;
        k += 1;
    }
    // the byte holding the rest of the mantissa and the start of the exponent
    let mut rest = mm + e * pow2d(mb) + sign * pow2d(mb + ebits);
    while k < nbytes as usize {
        let b = rest % 256.0;
        out[k] = b as int;
        rest = (rest - b) / 256.0;
        k += 1;
    }
    out
}

fn round_half_even(v: double) -> double {
    let f = v.floor();
    let d = v - f;
    if d > 0.5 {
        f + 1.0
    } else if d < 0.5 {
        f
    } else if f % 2.0 == 0.0 {
        f
    } else {
        f + 1.0
    }
}

fn decode_float(bytes: &Vec<int>, mbits: int, ebits: int) -> double {
    let n = bytes.len();
    let sign = if bytes[n - 1] >= 128 { -1.0 } else { 1.0 };
    // the mantissa: the low `mbits` bits; the exponent above them, below the
    // sign bit (each part fits a double exactly)
    let k0 = (mbits / 8) as usize;
    let r = mbits % 8;
    let mut k = k0;
    let low = pow2d(r);
    let mut m: double = (bytes[k0] as double) % low;
    while k > 0 {
        k -= 1;
        m = m * 256.0 + (bytes[k] as double);
    }
    let mut e: double = 0.0;
    let mut i = n;
    while i > k0 + 1 {
        i -= 1;
        let b = if i == n - 1 { bytes[i] % 128 } else { bytes[i] };
        e = e * 256.0 + (b as double);
    }
    e = e * pow2d(8 - r) + ((bytes[k0] as double) - (bytes[k0] as double) % low) / low;
    if k0 == n - 1 {
        // the top byte holds the sign too
        e = ((bytes[k0] % 128) as double - ((bytes[k0] % 128) as double) % low) / low;
    }
    let bias = pow2d(ebits - 1) - 1.0;
    let emax = pow2d(ebits) - 1.0;
    if e == emax {
        if m == 0.0 {
            return sign * infinity();
        }
        return nan();
    }
    if e == 0.0 {
        return sign * m * pow2d((1.0 - bias) as int - mbits);
    }
    sign * (1.0 + m / pow2d(mbits)) * pow2d((e - bias) as int)
}

/// `x` (a number) as the `size` bytes of an integer kind, little-endian.
fn int_bytes(x: double, size: int) -> Vec<int> {
    let mut v = if is_finite(x) { x.trunc() } else { 0.0 };
    let m = pow2d(8 * size);
    v = v % m;
    if v < 0.0 {
        v += m;
    }
    let mut out: Vec<int> = Vec::new();
    let mut i: int = 0;
    while i < size {
        let b = v % 256.0;
        out.push(b as int);
        v = (v - b) / 256.0;
        i += 1;
    }
    out
}

fn bytes_int(bytes: &Vec<int>, signed: bool) -> double {
    let mut v: double = 0.0;
    let mut i = bytes.len();
    while i > 0 {
        i -= 1;
        v = v * 256.0 + (bytes[i] as double);
    }
    let m = pow2d(8 * (bytes.len() as int));
    if signed && v >= m / 2.0 {
        v -= m;
    }
    v
}

pub fn encode(kind: int, x: double) -> Vec<int> {
    if kind == TA_FLOAT32 {
        return encode_float(x, 23, 8, 4);
    }
    if kind == TA_FLOAT64 {
        return encode_float(x, 52, 11, 8);
    }
    if kind == TA_UINT8C {
        let c = if is_nan(x) {
            0.0
        } else if x <= 0.0 {
            0.0
        } else if x >= 255.0 {
            255.0
        } else {
            round_half_even(x)
        };
        return vec![c as int];
    }
    int_bytes(x, kind_size(kind))
}

pub fn decode(kind: int, bytes: &Vec<int>) -> double {
    if kind == TA_FLOAT32 {
        return decode_float(bytes, 23, 8);
    }
    if kind == TA_FLOAT64 {
        return decode_float(bytes, 52, 11);
    }
    let signed = kind == TA_INT8 || kind == TA_INT16 || kind == TA_INT32;
    bytes_int(bytes, signed)
}

impl Vm {
    pub fn is_typed(&self, o: int) -> bool {
        o >= 0 && self.objs[o as usize].class == C_TYPED && self.objs[o as usize].func != TA_DATAVIEW
    }

    /// The length of view `o` now (0 once its buffer is detached or has
    /// shrunk below it).
    pub fn ta_length(&self, o: int) -> int {
        let b = self.objs[o as usize].env;
        let kind = self.objs[o as usize].func;
        let size = if kind == TA_DATAVIEW { 1 } else { kind_size(kind) };
        let off = self.objs[o as usize].pos;
        let blen = self.objs[b as usize].saved.len() as int;
        if self.objs[b as usize].pos == 1 {
            return 0;
        }
        let fixed = self.objs[o as usize].saved[0];
        if fixed >= 0 {
            if off + fixed * size > blen {
                return 0;
            }
            return fixed;
        }
        if blen < off {
            return 0;
        }
        (blen - off) / size
    }

    pub fn ta_get(&self, o: int, i: int) -> Val {
        if i < 0 || i >= self.ta_length(o) {
            return Val::Undef;
        }
        let kind = self.objs[o as usize].func;
        let size = kind_size(kind);
        let b = self.objs[o as usize].env;
        let at = self.objs[o as usize].pos + i * size;
        let mut bytes: Vec<int> = Vec::new();
        let mut k: int = 0;
        while k < size {
            bytes.push(self.objs[b as usize].saved[(at + k) as usize]);
            k += 1;
        }
        if kind == TA_BIGINT64 || kind == TA_BIGUINT64 {
            return Val::Big(Rc::new(crate::bigint::from_bytes(&bytes, kind == TA_BIGINT64)));
        }
        Val::Num(decode(kind, &bytes))
    }

    /// The bytes a value is stored as in an element of `kind`.
    fn element_bytes(&mut self, kind: int, v: &Val) -> Vec<int> {
        if kind == TA_BIGINT64 || kind == TA_BIGUINT64 {
            let b = self.to_bigint(v, false);
            if let Val::Big(x) = &b {
                return crate::bigint::to_bytes(x, 8);
            }
            return Vec::new();
        }
        let x = self.to_number(v);
        encode(kind, x)
    }

    pub fn ta_set(&mut self, o: int, i: int, v: &Val) {
        let kind = self.objs[o as usize].func;
        let bytes = self.element_bytes(kind, v);
        if self.throwing || i < 0 || i >= self.ta_length(o) {
            return;
        }
        let size = kind_size(kind);
        let b = self.objs[o as usize].env;
        let at = self.objs[o as usize].pos + i * size;
        let mut k: int = 0;
        while k < size {
            self.objs[b as usize].saved[(at + k) as usize] = bytes[k as usize];
            k += 1;
        }
    }

    fn new_buffer(&mut self, proto: int, len: int, max: int, shared: bool) -> int {
        let b = self.alloc(C_ARRAYBUFFER, proto);
        let mut bytes: Vec<int> = Vec::new();
        let mut i: int = 0;
        while i < len {
            bytes.push(0);
            i += 1;
        }
        self.objs[b as usize].saved = bytes;
        self.objs[b as usize].func = max;
        self.objs[b as usize].home = if shared { 1 } else { -1 };
        b
    }

    fn new_view(&mut self, proto: int, kind: int, buf: int, off: int, len: int) -> int {
        let v = self.alloc(C_TYPED, proto);
        self.objs[v as usize].func = kind;
        self.objs[v as usize].env = buf;
        self.objs[v as usize].pos = off;
        self.objs[v as usize].saved = vec![len];
        v
    }

    fn index_arg(&mut self, v: &Val, what: &str) -> int {
        if matches!(v, Val::Undef) {
            return 0;
        }
        let n = self.to_number(v);
        let t = to_integer(n);
        if t < 0.0 || t > 9007199254740991.0 {
            self.throw_range(format!("Invalid {}", what).as_str());
            return -1;
        }
        if t > 2000000000.0 {
            self.throw_range("Array buffer allocation failed");
            return -1;
        }
        t as int
    }

    pub fn call_typed(&mut self, id: int, args: &Vec<Val>) -> Val {
        let a0 = if !args.is_empty() { args[0].clone() } else { Val::Undef };
        let a1 = if args.len() > 1 { args[1].clone() } else { Val::Undef };
        let a2 = if args.len() > 2 { args[2].clone() } else { Val::Undef };
        let a3 = if args.len() > 3 { args[3].clone() } else { Val::Undef };
        let a4 = if args.len() > 4 { args[4].clone() } else { Val::Undef };
        if id == NF_TA_BUFFER {
            // (proto, length, maxByteLength | undefined, shared)
            let proto = obj_of(&a0);
            let len = self.index_arg(&a1, "array buffer length");
            if self.throwing {
                return Val::Undef;
            }
            let mut max: int = -1;
            if !matches!(a2, Val::Undef) {
                max = self.index_arg(&a2, "array buffer max length");
                if self.throwing {
                    return Val::Undef;
                }
                if len > max {
                    self.throw_range("Invalid array buffer max length");
                    return Val::Undef;
                }
            }
            let b = self.new_buffer(proto, len, max, truthy(&a3));
            return Val::Obj(b);
        }
        if id == NF_TA_CREATE {
            // (kind, proto, a, b, c): new XArray(a, b, c)
            let kind = self.to_number(&a0) as int;
            let proto = obj_of(&a1);
            let size = kind_size(kind);
            let bp = self.array_buffer_proto;
            let src = obj_of(&a2);
            if src >= 0 && self.objs[src as usize].class == C_ARRAYBUFFER {
                if self.objs[src as usize].pos == 1 {
                    self.throw_type("Cannot perform Construct on a detached ArrayBuffer");
                    return Val::Undef;
                }
                let off = self.index_arg(&a3, "typed array offset");
                if self.throwing {
                    return Val::Undef;
                }
                if off % size != 0 {
                    self.throw_range(format!("start offset of {} should be a multiple of {}", kind_name(kind), size).as_str());
                    return Val::Undef;
                }
                let blen = self.objs[src as usize].saved.len() as int;
                let mut len: int = -1;
                if !matches!(a4, Val::Undef) {
                    len = self.index_arg(&a4, "typed array length");
                    if self.throwing {
                        return Val::Undef;
                    }
                    if off + len * size > blen {
                        self.throw_range(format!("Invalid typed array length: {}", len).as_str());
                        return Val::Undef;
                    }
                } else if self.objs[src as usize].func < 0 {
                    if blen % size != 0 {
                        self.throw_range(format!("byte length of {} should be a multiple of {}", kind_name(kind), size).as_str());
                        return Val::Undef;
                    }
                    if off > blen {
                        self.throw_range(format!("Start offset {} is outside the bounds of the buffer", off).as_str());
                        return Val::Undef;
                    }
                    len = (blen - off) / size;
                }
                let v = self.new_view(proto, kind, src, off, len);
                return Val::Obj(v);
            }
            if src >= 0 {
                // an array-like or iterable: its values
                self.temp_roots.push(a2.clone());
                let it = self.get(&a2, A_ITERATOR);
                let items = if self.is_callable(&it) { self.iterable_to_vec(&a2) } else { self.array_like_to_vec(&a2) };
                self.temp_roots.pop();
                if self.throwing {
                    return Val::Undef;
                }
                let n = items.len() as int;
                let b = self.new_buffer(bp, n * size, -1, false);
                let v = self.new_view(proto, kind, b, 0, n);
                self.temp_roots.push(Val::Obj(v));
                let mut i: int = 0;
                for x in items {
                    self.ta_set(v, i, &x);
                    if self.throwing {
                        self.temp_roots.pop();
                        return Val::Undef;
                    }
                    i += 1;
                }
                self.temp_roots.pop();
                return Val::Obj(v);
            }
            let n = self.index_arg(&a2, "typed array length");
            if self.throwing {
                return Val::Undef;
            }
            let b = self.new_buffer(bp, n * size, -1, false);
            let v = self.new_view(proto, kind, b, 0, n);
            return Val::Obj(v);
        }
        if id == NF_TA_VIEW {
            // (proto, buffer, byteOffset, byteLength): a DataView
            let proto = obj_of(&a0);
            let b = obj_of(&a1);
            if b < 0 || self.objs[b as usize].class != C_ARRAYBUFFER {
                self.throw_type("First argument to DataView constructor must be an ArrayBuffer");
                return Val::Undef;
            }
            let off = self.index_arg(&a2, "DataView offset");
            if self.throwing {
                return Val::Undef;
            }
            let blen = self.objs[b as usize].saved.len() as int;
            if off > blen {
                self.throw_range(format!("Start offset {} is outside the bounds of the buffer", off).as_str());
                return Val::Undef;
            }
            let mut len: int = -1;
            if !matches!(a3, Val::Undef) {
                len = self.index_arg(&a3, "DataView length");
                if self.throwing {
                    return Val::Undef;
                }
                if off + len > blen {
                    self.throw_range(format!("Invalid DataView length {}", len).as_str());
                    return Val::Undef;
                }
            } else if self.objs[b as usize].func < 0 {
                len = blen - off;
            }
            let v = self.new_view(proto, TA_DATAVIEW, b, off, len);
            return Val::Obj(v);
        }
        if id == NF_TA_INFO {
            // (view, what): 0 length, 1 byteLength, 2 byteOffset, 3 buffer,
            // 4 kind (-1: not a view)
            let o = obj_of(&a0);
            let what = self.to_number(&a1) as int;
            if o < 0 || self.objs[o as usize].class != C_TYPED {
                return if what == 4 { Val::Num(-1.0) } else { Val::Undef };
            }
            let kind = self.objs[o as usize].func;
            let n = self.ta_length(o);
            let size = if kind == TA_DATAVIEW { 1 } else { kind_size(kind) };
            let detached = self.objs[self.objs[o as usize].env as usize].pos == 1;
            return match what {
                0 => Val::Num(n as double),
                1 => Val::Num((n * size) as double),
                2 => Val::Num(if detached { 0.0 } else { self.objs[o as usize].pos as double }),
                3 => Val::Obj(self.objs[o as usize].env),
                _ => Val::Num(kind as double),
            };
        }
        if id == NF_TA_BUFINFO {
            // (buffer, what): 0 byteLength, 1 maxByteLength, 2 detached,
            // 3 resizable, 4 shared, 5 is a buffer
            let b = obj_of(&a0);
            let what = self.to_number(&a1) as int;
            let is_buf = b >= 0 && self.objs[b as usize].class == C_ARRAYBUFFER;
            if what == 5 {
                return Val::Bool(is_buf);
            }
            if !is_buf {
                self.throw_type("Receiver is not an ArrayBuffer");
                return Val::Undef;
            }
            let len = self.objs[b as usize].saved.len() as int;
            let max = self.objs[b as usize].func;
            return match what {
                0 => Val::Num(len as double),
                1 => Val::Num(if max >= 0 { max as double } else { len as double }),
                2 => Val::Bool(self.objs[b as usize].pos == 1),
                3 => Val::Bool(max >= 0),
                _ => Val::Bool(self.objs[b as usize].home == 1),
            };
        }
        if id == NF_TA_RESIZE {
            let b = obj_of(&a0);
            let n = self.index_arg(&a1, "length");
            if self.throwing {
                return Val::Undef;
            }
            let max = self.objs[b as usize].func;
            if max < 0 {
                self.throw_type("Method ArrayBuffer.prototype.resize called on incompatible receiver");
                return Val::Undef;
            }
            if n > max {
                self.throw_range("ArrayBuffer.prototype.resize: Invalid length parameter");
                return Val::Undef;
            }
            while (self.objs[b as usize].saved.len() as int) < n {
                self.objs[b as usize].saved.push(0);
            }
            self.objs[b as usize].saved.truncate(n as usize);
            return Val::Undef;
        }
        if id == NF_TA_TRANSFER {
            // (buffer, newLength | undefined, keep resizable)
            let b = obj_of(&a0);
            if self.objs[b as usize].pos == 1 {
                self.throw_type("Cannot perform ArrayBuffer.prototype.transfer on a detached ArrayBuffer");
                return Val::Undef;
            }
            let old = self.objs[b as usize].saved.len() as int;
            let n = if matches!(a1, Val::Undef) { old } else { self.index_arg(&a1, "length") };
            if self.throwing {
                return Val::Undef;
            }
            let proto = self.objs[b as usize].proto;
            let max = if truthy(&a2) { self.objs[b as usize].func } else { -1 };
            let nb = self.new_buffer(proto, n, max, false);
            let mut i: int = 0;
            while i < n && i < old {
                let x = self.objs[b as usize].saved[i as usize];
                self.objs[nb as usize].saved[i as usize] = x;
                i += 1;
            }
            self.objs[b as usize].saved = Vec::new();
            self.objs[b as usize].pos = 1;
            return Val::Obj(nb);
        }
        if id == NF_TA_SLICE {
            // (buffer, start, end, proto): a copy of the bytes
            let b = obj_of(&a0);
            let len = self.objs[b as usize].saved.len() as int;
            let s0 = self.to_number(&a1);
            let e0 = if matches!(a2, Val::Undef) { len as double } else { self.to_number(&a2) };
            let s = clamp_index(s0, len);
            let e = clamp_index(e0, len);
            let n = if e > s { e - s } else { 0 };
            let proto = obj_of(&a3);
            let shared = self.objs[b as usize].home == 1;
            let nb = self.new_buffer(proto, n, -1, shared);
            let mut i: int = 0;
            while i < n {
                let x = self.objs[b as usize].saved[(s + i) as usize];
                self.objs[nb as usize].saved[i as usize] = x;
                i += 1;
            }
            return Val::Obj(nb);
        }
        if id == NF_TA_DVGET || id == NF_TA_DVSET {
            // (view, byteOffset, kind, littleEndian[, value])
            let o = obj_of(&a0);
            if o < 0 || self.objs[o as usize].class != C_TYPED || self.objs[o as usize].func != TA_DATAVIEW {
                self.throw_type("Receiver is not a DataView");
                return Val::Undef;
            }
            let off = self.index_arg(&a1, "DataView offset");
            if self.throwing {
                return Val::Undef;
            }
            let kind = self.to_number(&a2) as int;
            let little = truthy(&a3);
            let size = kind_size(kind);
            let vbytes = if id == NF_TA_DVSET { self.element_bytes(kind, &a4) } else { Vec::new() };
            if self.throwing {
                return Val::Undef;
            }
            let vlen = self.ta_length(o);
            if off + size > vlen {
                self.throw_range("Offset is outside the bounds of the DataView");
                return Val::Undef;
            }
            let b = self.objs[o as usize].env;
            let at = self.objs[o as usize].pos + off;
            if id == NF_TA_DVSET {
                let bytes = vbytes;
                let mut k: int = 0;
                while k < size {
                    let bi = if little { k } else { size - 1 - k };
                    self.objs[b as usize].saved[(at + k) as usize] = bytes[bi as usize];
                    k += 1;
                }
                return Val::Undef;
            }
            let mut bytes: Vec<int> = Vec::new();
            let mut k: int = 0;
            while k < size {
                let bi = if little { k } else { size - 1 - k };
                bytes.push(self.objs[b as usize].saved[(at + bi) as usize]);
                k += 1;
            }
            if kind == TA_BIGINT64 || kind == TA_BIGUINT64 {
                return Val::Big(Rc::new(crate::bigint::from_bytes(&bytes, kind == TA_BIGINT64)));
            }
            return Val::Num(decode(kind, &bytes));
        }
        Val::Undef
    }
}

fn clamp_index(x: double, len: int) -> int {
    let t = if is_nan(x) { 0.0 } else { to_integer(x) };
    let l = len as double;
    let r = if t < 0.0 {
        if t + l < 0.0 { 0.0 } else { t + l }
    } else if t > l {
        l
    } else {
        t
    };
    r as int
}

pub fn kind_name(k: int) -> String {
    let names = vec!["Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array", "Float32Array", "Float64Array", "BigInt64Array", "BigUint64Array"];
    if k >= 0 && (k as usize) < names.len() {
        return String::from(names[k as usize]);
    }
    String::from("DataView")
}
