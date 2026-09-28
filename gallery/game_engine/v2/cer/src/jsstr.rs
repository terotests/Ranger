// SPDX-License-Identifier: AGPL-3.0-or-later
//! JavaScript strings are sequences of UTF-16 units; ours are Rust strings
//! (UTF-8). Positions here are UTF-16 positions, as JavaScript counts them.
//! An ASCII string (the common case) is indexed by its bytes directly.

use ranger::prelude::*;

pub fn is_ascii(s: &str) -> bool {
    let r: bool = ranger::native!(
        rust: { ascii_scan(s) },
        es6: "/^[\\x00-\\x7f]*$/.test({s})",
    );
    r
}

fn ascii_scan(s: &str) -> bool {
    for b in s.bytes() {
        if b >= 128 {
            return false;
        }
    }
    true
}

pub fn units(s: &str) -> Vec<int> {
    let r: Vec<int> = ranger::native!(rust: { units_of(s) }, es6: "Array.from({{ length: {s}.length }}, (_, i) => {s}.charCodeAt(i))");
    r
}

fn units_of(s: &str) -> Vec<int> {
    let mut out: Vec<int> = Vec::new();
    for c in s.chars() {
        let cp = c as int;
        if cp >= 0x10000 {
            let v = cp - 0x10000;
            out.push(0xd800 + (v >> 10));
            out.push(0xdc00 + (v & 0x3ff));
        } else {
            out.push(cp);
        }
    }
    out
}

pub fn from_units(u: &Vec<int>, a: int, b: int) -> String {
    let mut s = String::new();
    let mut i = a;
    while i < b {
        let c = u[i as usize];
        if c >= 0xd800 && c <= 0xdbff && i + 1 < b {
            let d = u[(i + 1) as usize];
            if d >= 0xdc00 && d <= 0xdfff {
                let cp = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00);
                push_cp(&mut s, cp);
                i += 2;
                continue;
            }
        }
        push_cp(&mut s, c);
        i += 1;
    }
    s
}

pub fn push_cp(s: &mut String, cp: int) {
    match char::from_u32(cp as u32) {
        Some(c) => s.push(c),
        None => s.push('\u{fffd}'),
    }
}

pub fn from_unit(c: int) -> String {
    let mut s = String::new();
    push_cp(&mut s, c);
    s
}

/// The length in UTF-16 units: JavaScript's `length`.
pub fn len(s: &str) -> int {
    let n: int = ranger::native!(rust: { len_units(s) }, es6: "{s}.length");
    n
}

fn len_units(s: &str) -> int {
    let mut n: int = 0;
    let mut ascii = true;
    for x in s.bytes() {
        if x >= 128 {
            ascii = false;
            break;
        }
    }
    if ascii {
        return s.as_bytes().len() as int;
    }
    for c in s.chars() {
        n += if (c as int) >= 0x10000 { 2 } else { 1 };
    }
    n
}

/// The unit at `i`, -1 out of range.
pub fn at(s: &str, i: int) -> int {
    let c: int = ranger::native!(
        rust: { at_unit(s, i) },
        es6: "(({i}) >= 0 && ({i}) < {s}.length ? {s}.charCodeAt({i}) : -1)",
    );
    c
}

fn at_unit(s: &str, i: int) -> int {
    if i < 0 {
        return -1;
    }
    if (i as usize) < s.as_bytes().len() && is_ascii(s) {
        return s.as_bytes()[i as usize] as int;
    }
    let u = units(s);
    if i >= u.len() as int {
        return -1;
    }
    u[i as usize]
}

/// Units [a, b) clamped to the string.
pub fn slice(s: &str, a: int, b: int) -> String {
    let r: String = ranger::native!(rust: { slice_units(s, a, b) }, es6: "{s}.substring(Math.max(0, {a}), Math.max(Math.max(0, {a}), {b}))");
    r
}

fn slice_units(s: &str, a: int, b: int) -> String {
    if a >= b {
        return String::new();
    }
    if is_ascii(s) {
        let n = s.as_bytes().len() as int;
        let x = if a < 0 { 0 } else if a > n { n } else { a };
        let y = if b < 0 { 0 } else if b > n { n } else { b };
        if x >= y {
            return String::new();
        }
        return String::from(&s[(x as usize)..(y as usize)]);
    }
    let u = units(s);
    let n = u.len() as int;
    let x = if a < 0 { 0 } else if a > n { n } else { a };
    let y = if b < 0 { 0 } else if b > n { n } else { b };
    from_units(&u, x, y)
}

pub fn index_of(s: &str, pat: &str, from: int) -> int {
    let r: int = ranger::native!(rust: { index_of_units(s, pat, from) }, es6: "{s}.indexOf({pat}, Math.max(0, {from}))");
    r
}

fn index_of_units(s: &str, pat: &str, from: int) -> int {
    if is_ascii(s) && is_ascii(pat) {
        let n = s.as_bytes().len() as int;
        let start = if from < 0 { 0 } else { from };
        if start > n {
            return if pat.is_empty() { n } else { -1 };
        }
        return match s[(start as usize)..].find(pat) {
            Some(p) => start + (p as int),
            None => -1,
        };
    }
    let u = units(s);
    let p = units(pat);
    let n = u.len() as int;
    let m = p.len() as int;
    let mut i = if from < 0 { 0 } else { from };
    while i + m <= n {
        let mut k: int = 0;
        while k < m && u[(i + k) as usize] == p[k as usize] {
            k += 1;
        }
        if k == m {
            return i;
        }
        i += 1;
    }
    -1
}

pub fn last_index_of(s: &str, pat: &str, from: int) -> int {
    let u = units(s);
    let p = units(pat);
    let n = u.len() as int;
    let m = p.len() as int;
    let mut i = if from > n - m { n - m } else { from };
    while i >= 0 {
        let mut k: int = 0;
        while k < m && u[(i + k) as usize] == p[k as usize] {
            k += 1;
        }
        if k == m {
            return i;
        }
        i -= 1;
    }
    -1
}

/// Compares by UTF-16 units, as `<` on strings does.
pub fn compare(a: &str, b: &str) -> int {
    let r: int = ranger::native!(rust: { compare_units(a, b) }, es6: "({a} < {b} ? -1 : ({a} > {b} ? 1 : 0))");
    r
}

fn compare_units(a: &str, b: &str) -> int {
    if is_ascii(a) && is_ascii(b) {
        return if a < b {
            -1
        } else if a > b {
            1
        } else {
            0
        };
    }
    let x = units(a);
    let y = units(b);
    let n = if x.len() < y.len() { x.len() } else { y.len() };
    let mut i: usize = 0;
    while i < n {
        if x[i] != y[i] {
            return if x[i] < y[i] { -1 } else { 1 };
        }
        i += 1;
    }
    if x.len() < y.len() {
        -1
    } else if x.len() > y.len() {
        1
    } else {
        0
    }
}

pub fn to_upper(s: &str) -> String {
    let mut out = String::new();
    for c in s.chars() {
        if c == 'ß' {
            out.push_str("SS");
            continue;
        }
        out.push_str(c.to_uppercase().to_string().as_str());
    }
    out
}

pub fn to_lower(s: &str) -> String {
    let mut out = String::new();
    let cs = s.chars().collect::<Vec<char>>();
    let n = cs.len();
    let mut i: usize = 0;
    while i < n {
        let c = cs[i];
        if c == 'Σ' {
            // final sigma: a letter before, none after
            let before = i > 0 && cs[i - 1].is_alphabetic();
            let after = i + 1 < n && cs[i + 1].is_alphabetic();
            out.push(if before && !after { 'ς' } else { 'σ' });
            i += 1;
            continue;
        }
        out.push_str(c.to_lowercase().to_string().as_str());
        i += 1;
    }
    out
}

/// A canonical array index ("0", "17"; not "017" or "-1"), or -1.
pub fn array_index(s: &str) -> int {
    let n = s.as_bytes().len();
    // up to 9 digits: the value stays inside a 32-bit int
    if n == 0 || n > 9 {
        return -1;
    }
    if s.as_bytes()[0] == 48 && n > 1 {
        return -1;
    }
    let mut v: int = 0;
    for x in s.bytes() {
        if x < 48 || x > 57 {
            return -1;
        }
        v = v * 10 + ((x as int) - 48);
    }
    v
}
