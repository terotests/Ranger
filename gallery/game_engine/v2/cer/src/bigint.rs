// SPDX-License-Identifier: AGPL-3.0-or-later
//! BigInt arithmetic: a sign and a magnitude of 15-bit limbs, least
//! significant first, no leading zero limbs (zero is an empty magnitude and
//! never negative). 15 bits keep every limb product and carry inside 31
//! bits, the widest integer every Ranger target has.

use ranger::prelude::*;

pub const LIMB: int = 32768;
const BITS: int = 15;

#[derive(Clone, Debug, PartialEq)]
pub struct Big {
    pub neg: bool,
    pub mag: Vec<int>,
}

fn trim(m: &mut Vec<int>) {
    while !m.is_empty() && m[m.len() - 1] == 0 {
        m.pop();
    }
}

pub fn big(neg: bool, mag: Vec<int>) -> Big {
    let mut m = mag;
    trim(&mut m);
    let n = neg && !m.is_empty();
    Big { neg: n, mag: m }
}

pub fn zero() -> Big {
    Big { neg: false, mag: Vec::new() }
}

pub fn is_zero(a: &Big) -> bool {
    a.mag.is_empty()
}

pub fn from_int(v: int) -> Big {
    let mut x = if v < 0 { -v } else { v };
    let mut m: Vec<int> = Vec::new();
    while x > 0 {
        m.push(x % LIMB);
        x = x / LIMB;
    }
    big(v < 0, m)
}

/// An integral double (finite) as a BigInt: exact, as dividing by 2^15 is.
pub fn from_double(x: double) -> Big {
    let neg = x < 0.0;
    let mut v = if neg { -x } else { x };
    let mut m: Vec<int> = Vec::new();
    while v >= 1.0 {
        let r = v % 32768.0;
        m.push(r as int);
        v = (v - r) / 32768.0;
    }
    big(neg, m)
}

pub fn to_double(a: &Big) -> double {
    let mut v: double = 0.0;
    let mut i = a.mag.len();
    while i > 0 {
        i -= 1;
        v = v * 32768.0 + (a.mag[i] as double);
    }
    if a.neg {
        -v
    } else {
        v
    }
}

fn cmp_mag(a: &Vec<int>, b: &Vec<int>) -> int {
    if a.len() != b.len() {
        return if a.len() < b.len() { -1 } else { 1 };
    }
    let mut i = a.len();
    while i > 0 {
        i -= 1;
        if a[i] != b[i] {
            return if a[i] < b[i] { -1 } else { 1 };
        }
    }
    0
}

pub fn compare(a: &Big, b: &Big) -> int {
    if a.neg != b.neg {
        return if a.neg { -1 } else { 1 };
    }
    let c = cmp_mag(&a.mag, &b.mag);
    if a.neg {
        -c
    } else {
        c
    }
}

fn add_mag(a: &Vec<int>, b: &Vec<int>) -> Vec<int> {
    let mut out: Vec<int> = Vec::new();
    let mut carry: int = 0;
    let n = if a.len() > b.len() { a.len() } else { b.len() };
    let mut i: usize = 0;
    while i < n {
        let x = if i < a.len() { a[i] } else { 0 };
        let y = if i < b.len() { b[i] } else { 0 };
        let s = x + y + carry;
        out.push(s % LIMB);
        carry = s / LIMB;
        i += 1;
    }
    if carry > 0 {
        out.push(carry);
    }
    out
}

/// a - b for |a| >= |b|
fn sub_mag(a: &Vec<int>, b: &Vec<int>) -> Vec<int> {
    let mut out: Vec<int> = Vec::new();
    let mut borrow: int = 0;
    let mut i: usize = 0;
    while i < a.len() {
        let y = if i < b.len() { b[i] } else { 0 };
        let mut d = a[i] - y - borrow;
        if d < 0 {
            d += LIMB;
            borrow = 1;
        } else {
            borrow = 0;
        }
        out.push(d);
        i += 1;
    }
    trim(&mut out);
    out
}

pub fn add(a: &Big, b: &Big) -> Big {
    if a.neg == b.neg {
        return big(a.neg, add_mag(&a.mag, &b.mag));
    }
    let c = cmp_mag(&a.mag, &b.mag);
    if c == 0 {
        return zero();
    }
    if c > 0 {
        big(a.neg, sub_mag(&a.mag, &b.mag))
    } else {
        big(b.neg, sub_mag(&b.mag, &a.mag))
    }
}

pub fn neg(a: &Big) -> Big {
    big(!a.neg, a.mag.clone())
}

pub fn sub(a: &Big, b: &Big) -> Big {
    add(a, &neg(b))
}

pub fn mul(a: &Big, b: &Big) -> Big {
    if a.mag.is_empty() || b.mag.is_empty() {
        return zero();
    }
    let mut out: Vec<int> = Vec::new();
    let mut k: usize = 0;
    while k < a.mag.len() + b.mag.len() {
        out.push(0);
        k += 1;
    }
    let mut i: usize = 0;
    while i < a.mag.len() {
        let mut carry: int = 0;
        let mut j: usize = 0;
        while j < b.mag.len() {
            // below 2^30 + 2^16: inside 31 bits
            let t = out[i + j] + a.mag[i] * b.mag[j] + carry;
            out[i + j] = t % LIMB;
            carry = t / LIMB;
            j += 1;
        }
        let mut p = i + b.mag.len();
        while carry > 0 {
            let t = out[p] + carry;
            out[p] = t % LIMB;
            carry = t / LIMB;
            p += 1;
        }
        i += 1;
    }
    big(a.neg != b.neg, out)
}

/// |a| divided by a small positive d: (quotient, remainder).
fn divmod_small(a: &Vec<int>, d: int) -> (Vec<int>, int) {
    let mut q: Vec<int> = Vec::new();
    let mut k: usize = 0;
    while k < a.len() {
        q.push(0);
        k += 1;
    }
    let mut r: int = 0;
    let mut i = a.len();
    while i > 0 {
        i -= 1;
        // r < d <= 2^15, so r * 2^15 + limb < 2^30
        let cur = r * LIMB + a[i];
        q[i] = cur / d;
        r = cur % d;
    }
    trim(&mut q);
    (q, r)
}

fn bit_len(m: &Vec<int>) -> int {
    if m.is_empty() {
        return 0;
    }
    let top = m[m.len() - 1];
    let mut b: int = 0;
    let mut t = top;
    while t > 0 {
        b += 1;
        t = t / 2;
    }
    ((m.len() as int) - 1) * BITS + b
}

fn get_bit(m: &Vec<int>, i: int) -> int {
    let li = (i / BITS) as usize;
    if li >= m.len() {
        return 0;
    }
    (m[li] / pow2i(i % BITS)) % 2
}

fn pow2i(n: int) -> int {
    let mut v: int = 1;
    let mut i: int = 0;
    while i < n {
        v *= 2;
        i += 1;
    }
    v
}

/// |a| / |b| (b nonzero), truncated: (quotient, remainder) magnitudes, by
/// shift and subtract.
fn divmod_mag(a: &Vec<int>, b: &Vec<int>) -> (Vec<int>, Vec<int>) {
    if cmp_mag(a, b) < 0 {
        return (Vec::new(), a.clone());
    }
    if b.len() == 1 {
        let (q, r) = divmod_small(a, b[0]);
        let mut rm: Vec<int> = Vec::new();
        if r > 0 {
            rm.push(r);
        }
        return (q, rm);
    }
    let n = bit_len(a);
    let mut q: Vec<int> = Vec::new();
    let mut k: usize = 0;
    while k < a.len() {
        q.push(0);
        k += 1;
    }
    let mut r: Vec<int> = Vec::new();
    let mut i = n;
    while i > 0 {
        i -= 1;
        r = shl_mag(&r, 1);
        if get_bit(a, i) == 1 {
            if r.is_empty() {
                r.push(1);
            } else {
                r[0] += 1;
            }
        }
        if cmp_mag(&r, b) >= 0 {
            r = sub_mag(&r, b);
            let li = (i / BITS) as usize;
            q[li] += pow2i(i % BITS);
        }
    }
    trim(&mut q);
    (q, r)
}

/// Truncating division and its remainder (sign of the dividend), as `/`
/// and `%` of BigInts.
pub fn divmod(a: &Big, b: &Big) -> (Big, Big) {
    let (q, r) = divmod_mag(&a.mag, &b.mag);
    (big(a.neg != b.neg, q), big(a.neg, r))
}

fn shl_mag(m: &Vec<int>, n: int) -> Vec<int> {
    if m.is_empty() {
        return Vec::new();
    }
    let limbs = n / BITS;
    let bits = n % BITS;
    let mut out: Vec<int> = Vec::new();
    let mut i: int = 0;
    while i < limbs {
        out.push(0);
        i += 1;
    }
    let mul = pow2i(bits);
    let mut carry: int = 0;
    for x in m.iter() {
        let t = *x * mul + carry;
        out.push(t % LIMB);
        carry = t / LIMB;
    }
    if carry > 0 {
        out.push(carry);
    }
    trim(&mut out);
    out
}

fn shr_mag(m: &Vec<int>, n: int) -> Vec<int> {
    let limbs = (n / BITS) as usize;
    let bits = n % BITS;
    if limbs >= m.len() {
        return Vec::new();
    }
    let div = pow2i(bits);
    let mut out: Vec<int> = Vec::new();
    let mut i = limbs;
    while i < m.len() {
        let lo = m[i] / div;
        let hi = if i + 1 < m.len() { (m[i + 1] % div) * (LIMB / div) } else { 0 };
        out.push(lo + hi);
        i += 1;
    }
    trim(&mut out);
    out
}

/// a << n (n may be negative: a >> -n); >> floors, as for BigInts.
pub fn shift_left(a: &Big, n: int) -> Big {
    if n >= 0 {
        return big(a.neg, shl_mag(&a.mag, n));
    }
    let k = -n;
    if !a.neg {
        return big(false, shr_mag(&a.mag, k));
    }
    // floor for negatives: -((|a| - 1) >> k) - 1
    let one = vec![1];
    let t = shr_mag(&sub_mag(&a.mag, &one), k);
    big(true, add_mag(&t, &one))
}

pub fn pow(a: &Big, e: int) -> Big {
    let mut result = from_int(1);
    let mut base = a.clone();
    let mut n = e;
    while n > 0 {
        if n % 2 == 1 {
            result = mul(&result, &base);
        }
        n = n / 2;
        if n > 0 {
            base = mul(&base, &base);
        }
    }
    result
}

/// The digits in `radix` (2..36).
pub fn to_string_radix(a: &Big, radix: int) -> String {
    if a.mag.is_empty() {
        return String::from("0");
    }
    let digits = "0123456789abcdefghijklmnopqrstuvwxyz";
    let dchars = digits.chars().collect::<Vec<char>>();
    let mut out: Vec<char> = Vec::new();
    let mut m = a.mag.clone();
    while !m.is_empty() {
        let (q, r) = divmod_small(&m, radix);
        out.push(dchars[r as usize]);
        m = q;
    }
    let mut s = String::new();
    if a.neg {
        s.push('-');
    }
    let mut i = out.len();
    while i > 0 {
        i -= 1;
        s.push(out[i]);
    }
    s
}

/// A string of digits in `radix` (no sign, no prefix); None when a
/// character is not a digit.
pub fn parse_digits(s: &str, radix: int) -> Option<Big> {
    let mut m: Vec<int> = Vec::new();
    let mut any = false;
    for c in s.chars() {
        let d = digit_value(c);
        if d < 0 || d >= radix {
            return None;
        }
        any = true;
        // m = m * radix + d
        let mut carry = d;
        let mut i: usize = 0;
        while i < m.len() {
            let t = m[i] * radix + carry;
            m[i] = t % LIMB;
            carry = t / LIMB;
            i += 1;
        }
        while carry > 0 {
            m.push(carry % LIMB);
            carry = carry / LIMB;
        }
    }
    if !any {
        return None;
    }
    Some(big(false, m))
}

fn digit_value(c: char) -> int {
    if c >= '0' && c <= '9' {
        return (c as int) - 48;
    }
    if c >= 'a' && c <= 'z' {
        return (c as int) - 87;
    }
    if c >= 'A' && c <= 'Z' {
        return (c as int) - 55;
    }
    -1
}

/// StringToBigInt: whitespace around, an optional sign for decimals, 0x /
/// 0o / 0b prefixes; the empty string is 0n.
pub fn parse(text: &str) -> Option<Big> {
    let t = crate::num::js_trim(text);
    if t.is_empty() {
        return Some(zero());
    }
    let cs = t.chars().collect::<Vec<char>>();
    if cs.len() > 2 && cs[0] == '0' {
        let p = cs[1];
        let radix = if p == 'x' || p == 'X' { 16 } else if p == 'o' || p == 'O' { 8 } else if p == 'b' || p == 'B' { 2 } else { 0 };
        if radix > 0 {
            let rest = crate::jsstr::slice(t.as_str(), 2, cs.len() as int);
            return parse_digits(rest.as_str(), radix);
        }
    }
    let mut neg = false;
    let mut start: int = 0;
    if cs[0] == '-' || cs[0] == '+' {
        neg = cs[0] == '-';
        start = 1;
    }
    let rest = crate::jsstr::slice(t.as_str(), start, cs.len() as int);
    match parse_digits(rest.as_str(), 10) {
        Some(b) => Some(big(neg, b.mag)),
        None => None,
    }
}

/// BigInt.asUintN(bits, a): a modulo 2^bits.
pub fn as_uint_n(bits: int, a: &Big) -> Big {
    let m = shl_mag(&vec![1], bits);
    let (_, r) = divmod_mag(&a.mag, &m);
    let rb = big(false, r);
    if a.neg && !is_zero(&rb) {
        return sub(&big(false, m), &rb);
    }
    rb
}

/// BigInt.asIntN(bits, a): a modulo 2^bits, read as signed.
pub fn as_int_n(bits: int, a: &Big) -> Big {
    if bits == 0 {
        return zero();
    }
    let u = as_uint_n(bits, a);
    let half = shl_mag(&vec![1], bits - 1);
    if cmp_mag(&u.mag, &half) >= 0 {
        return sub(&u, &big(false, shl_mag(&vec![1], bits)));
    }
    u
}

/// Two's complement bytes, little-endian, `n` of them.
pub fn to_bytes(a: &Big, n: int) -> Vec<int> {
    let u = as_uint_n(8 * n, a);
    let mut out: Vec<int> = Vec::new();
    let mut m = u.mag.clone();
    let mut i: int = 0;
    while i < n {
        let (q, r) = divmod_small(&m, 256);
        out.push(r);
        m = q;
        i += 1;
    }
    out
}

pub fn from_bytes(bytes: &Vec<int>, signed: bool) -> Big {
    let mut m: Vec<int> = Vec::new();
    let mut i = bytes.len();
    while i > 0 {
        i -= 1;
        // m = m * 256 + byte
        let mut carry = bytes[i];
        let mut k: usize = 0;
        while k < m.len() {
            let t = m[k] * 256 + carry;
            m[k] = t % LIMB;
            carry = t / LIMB;
            k += 1;
        }
        while carry > 0 {
            m.push(carry % LIMB);
            carry = carry / LIMB;
        }
    }
    let u = big(false, m);
    if signed {
        return as_int_n(8 * (bytes.len() as int), &u);
    }
    u
}

/// Bitwise and / or / xor (op 0 / 1 / 2) through two's complement.
pub fn bitwise(a: &Big, b: &Big, op: int) -> Big {
    let n = (if a.mag.len() > b.mag.len() { a.mag.len() } else { b.mag.len() }) as int + 1;
    let bytes = n * 2;
    let x = to_bytes(a, bytes);
    let y = to_bytes(b, bytes);
    let mut out: Vec<int> = Vec::new();
    let mut i: usize = 0;
    while i < x.len() {
        let v = if op == 0 { x[i] & y[i] } else if op == 1 { x[i] | y[i] } else { x[i] ^ y[i] };
        out.push(v);
        i += 1;
    }
    from_bytes(&out, true)
}
