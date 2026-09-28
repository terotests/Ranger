// SPDX-License-Identifier: AGPL-3.0-or-later
//! Numbers as JavaScript writes and reads them: Number::toString (the
//! shortest digits that read back, placed by the rules of ECMA-262 6.1.6.1.20),
//! ToNumber of a string, ToInt32 / ToUint32 and radix conversion.

use ranger::prelude::*;

pub fn is_nan(x: double) -> bool {
    x != x
}

pub fn is_finite(x: double) -> bool {
    x == x && (x - x) == 0.0
}

pub fn infinity() -> double {
    1.0 / 0.0
}

/// -0, made at run time: a constant `-0.0` folds to +0 where a target's
/// compiler evaluates constant expressions exactly (Go)
pub fn neg_zero() -> double {
    let z: double = 0.0;
    -z
}

pub fn nan() -> double {
    0.0 / 0.0
}

/// The shortest decimal digits of `x` (> 0, finite) and the exponent `n`
/// with x = 0.d1d2… × 10^n.
fn shortest(x: double) -> (String, int) {
    let text = format!("{}", x);
    // Rust writes 1e21 as 1000000000000000000000 and 1e-7 as 0.0000001; a
    // target's own printer may write an exponent -- read both.
    let mut mant = String::new();
    let mut exp: int = 0;
    let mut in_exp = false;
    let mut exp_text = String::new();
    for c in text.chars() {
        if c == 'e' || c == 'E' {
            in_exp = true;
            continue;
        }
        if in_exp {
            exp_text.push(c);
        } else {
            mant.push(c);
        }
    }
    if in_exp {
        exp = exp_text.parse::<i64>().unwrap_or(0);
    }
    let mut digits = String::new();
    let mut point: int = -1;
    let mut count: int = 0;
    for c in mant.chars() {
        if c == '.' {
            point = count;
            continue;
        }
        if c >= '0' && c <= '9' {
            digits.push(c);
            count += 1;
        }
    }
    if point < 0 {
        point = count;
    }
    // strip leading zeros
    let bytes = digits.chars().collect::<Vec<char>>();
    let mut lead: int = 0;
    while lead < bytes.len() as int - 1 && bytes[lead as usize] == '0' {
        lead += 1;
    }
    let mut end: int = bytes.len() as int;
    while end > lead + 1 && bytes[(end - 1) as usize] == '0' {
        end -= 1;
    }
    let mut out = String::new();
    let mut k = lead;
    while k < end {
        out.push(bytes[k as usize]);
        k += 1;
    }
    (out, point - lead + exp)
}

pub fn number_to_string(x: double) -> String {
    if is_nan(x) {
        return String::from("NaN");
    }
    if x == 0.0 {
        return String::from("0");
    }
    if x < 0.0 {
        return format!("-{}", number_to_string(-x));
    }
    if !is_finite(x) {
        return String::from("Infinity");
    }
    // an int of every target holds it (C++'s is 32 bits)
    if x < 2147483647.0 && x == ((x as int) as double) {
        return format!("{}", x as int);
    }
    let (digits, n) = shortest(x);
    let k = digits.as_bytes().len() as int;
    let mut out = String::new();
    if k <= n && n <= 21 {
        out.push_str(digits.as_str());
        let mut i = 0;
        while i < n - k {
            out.push('0');
            i += 1;
        }
        return out;
    }
    if 0 < n && n <= 21 {
        let b = digits.chars().collect::<Vec<char>>();
        let mut i: int = 0;
        while i < k {
            if i == n {
                out.push('.');
            }
            out.push(b[i as usize]);
            i += 1;
        }
        return out;
    }
    if -6 < n && n <= 0 {
        out.push_str("0.");
        let mut i = 0;
        while i < -n {
            out.push('0');
            i += 1;
        }
        out.push_str(digits.as_str());
        return out;
    }
    let b = digits.chars().collect::<Vec<char>>();
    out.push(b[0]);
    if k > 1 {
        out.push('.');
        let mut i: int = 1;
        while i < k {
            out.push(b[i as usize]);
            i += 1;
        }
    }
    out.push('e');
    let e = n - 1;
    if e >= 0 {
        out.push('+');
    }
    out.push_str(format!("{}", e).as_str());
    out
}

fn is_js_space(c: char) -> bool {
    c == ' ' || c == '\t' || c == '\n' || c == '\r' || c == '\u{b}' || c == '\u{c}' || c == '\u{a0}' || c == '\u{feff}' || c == '\u{2028}' || c == '\u{2029}' || (c as int > 127 && c.is_whitespace())
}

pub fn js_trim(s: &str) -> String {
    let cs = s.chars().collect::<Vec<char>>();
    let mut a: int = 0;
    let mut b: int = cs.len() as int;
    while a < b && is_js_space(cs[a as usize]) {
        a += 1;
    }
    while b > a && is_js_space(cs[(b - 1) as usize]) {
        b -= 1;
    }
    let mut out = String::new();
    let mut i = a;
    while i < b {
        out.push(cs[i as usize]);
        i += 1;
    }
    out
}

pub fn js_trim_start(s: &str) -> String {
    let cs = s.chars().collect::<Vec<char>>();
    let mut a: int = 0;
    while a < cs.len() as int && is_js_space(cs[a as usize]) {
        a += 1;
    }
    let mut out = String::new();
    let mut i = a;
    while i < cs.len() as int {
        out.push(cs[i as usize]);
        i += 1;
    }
    out
}

pub fn js_trim_end(s: &str) -> String {
    let cs = s.chars().collect::<Vec<char>>();
    let mut b: int = cs.len() as int;
    while b > 0 && is_js_space(cs[(b - 1) as usize]) {
        b -= 1;
    }
    let mut out = String::new();
    let mut i: int = 0;
    while i < b {
        out.push(cs[i as usize]);
        i += 1;
    }
    out
}

fn digit_of(c: char) -> int {
    if c >= '0' && c <= '9' {
        return (c as int) - 48;
    }
    if c >= 'a' && c <= 'z' {
        return (c as int) - 87;
    }
    if c >= 'A' && c <= 'Z' {
        return (c as int) - 55;
    }
    99
}

/// A decimal literal as StringNumericLiteral reads it; NaN when it is not.
fn decimal(s: &str) -> double {
    let cs = s.chars().collect::<Vec<char>>();
    let n = cs.len() as int;
    let mut i: int = 0;
    if i < n && (cs[0] == '+' || cs[0] == '-') {
        i += 1;
    }
    let body_start = i;
    let mut rest = String::new();
    let mut k = i;
    while k < n {
        rest.push(cs[k as usize]);
        k += 1;
    }
    if rest.as_str() == "Infinity" {
        return if cs[0] == '-' { -infinity() } else { infinity() };
    }
    let mut digits = 0;
    while i < n && cs[i as usize] >= '0' && cs[i as usize] <= '9' {
        i += 1;
        digits += 1;
    }
    if i < n && cs[i as usize] == '.' {
        i += 1;
        while i < n && cs[i as usize] >= '0' && cs[i as usize] <= '9' {
            i += 1;
            digits += 1;
        }
    }
    if digits == 0 {
        return nan();
    }
    if i < n && (cs[i as usize] == 'e' || cs[i as usize] == 'E') {
        i += 1;
        if i < n && (cs[i as usize] == '+' || cs[i as usize] == '-') {
            i += 1;
        }
        let mut ed = 0;
        while i < n && cs[i as usize] >= '0' && cs[i as usize] <= '9' {
            i += 1;
            ed += 1;
        }
        if ed == 0 {
            return nan();
        }
    }
    if i != n {
        return nan();
    }
    let _ = body_start;
    let mut text = String::from(s);
    if text.starts_with("+") {
        text = String::from(&text[1..]);
    }
    if text.starts_with(".") {
        text = format!("0{}", text);
    } else if text.starts_with("-.") {
        text = format!("-0{}", &text[1..]);
    }
    text.parse::<f64>().unwrap_or(nan())
}

/// ToNumber of a string.
pub fn string_to_number(s: &str) -> double {
    let t = js_trim(s);
    if t.is_empty() {
        return 0.0;
    }
    if t.as_bytes().len() > 2 && t.as_bytes()[0] == 48 {
        let p = t.as_bytes()[1];
        let base: int = if p == 120 || p == 88 {
            16
        } else if p == 111 || p == 79 {
            8
        } else if p == 98 || p == 66 {
            2
        } else {
            0
        };
        if base > 0 {
            let mut v: double = 0.0;
            let mut first = true;
            for c in t.chars() {
                if first {
                    first = false;
                    continue;
                }
                if c == 'x' || c == 'X' || c == 'o' || c == 'O' || c == 'b' || c == 'B' {
                    if v == 0.0 {
                        continue;
                    }
                }
                let d = digit_of(c);
                if d >= base {
                    return nan();
                }
                v = v * (base as double) + (d as double);
            }
            return v;
        }
    }
    decimal(t.as_str())
}

/// parseFloat: the longest prefix that is a decimal literal.
pub fn parse_float(s: &str) -> double {
    let t = js_trim_start(s);
    let cs = t.chars().collect::<Vec<char>>();
    let n = cs.len() as int;
    let mut i: int = 0;
    if i < n && (cs[0] == '+' || cs[0] == '-') {
        i += 1;
    }
    let mut tail = String::new();
    let mut k = i;
    while k < n && k < i + 8 {
        tail.push(cs[k as usize]);
        k += 1;
    }
    if tail.starts_with("Infinity") {
        return if n > 0 && cs[0] == '-' { -infinity() } else { infinity() };
    }
    let mut end = i;
    let mut digits = 0;
    while end < n && cs[end as usize] >= '0' && cs[end as usize] <= '9' {
        end += 1;
        digits += 1;
    }
    if end < n && cs[end as usize] == '.' {
        let mut e2 = end + 1;
        let mut fd = 0;
        while e2 < n && cs[e2 as usize] >= '0' && cs[e2 as usize] <= '9' {
            e2 += 1;
            fd += 1;
        }
        if fd > 0 || digits > 0 {
            end = e2;
            digits += fd;
        }
    }
    if digits == 0 {
        return nan();
    }
    if end < n && (cs[end as usize] == 'e' || cs[end as usize] == 'E') {
        let mut e2 = end + 1;
        if e2 < n && (cs[e2 as usize] == '+' || cs[e2 as usize] == '-') {
            e2 += 1;
        }
        let mut ed = 0;
        while e2 < n && cs[e2 as usize] >= '0' && cs[e2 as usize] <= '9' {
            e2 += 1;
            ed += 1;
        }
        if ed > 0 {
            end = e2;
        }
    }
    let mut text = String::new();
    let mut j: int = 0;
    while j < end {
        text.push(cs[j as usize]);
        j += 1;
    }
    decimal(text.as_str())
}

/// parseInt(s, radix)
pub fn parse_int(s: &str, radix_in: int) -> double {
    let t = js_trim_start(s);
    let cs = t.chars().collect::<Vec<char>>();
    let n = cs.len() as int;
    let mut i: int = 0;
    let mut sign: double = 1.0;
    if i < n && (cs[0] == '+' || cs[0] == '-') {
        if cs[0] == '-' {
            sign = -1.0;
        }
        i += 1;
    }
    let mut radix = radix_in;
    let mut strip = true;
    if radix != 0 {
        if radix < 2 || radix > 36 {
            return nan();
        }
        if radix != 16 {
            strip = false;
        }
    } else {
        radix = 10;
    }
    if strip && i + 1 < n && cs[i as usize] == '0' && (cs[(i + 1) as usize] == 'x' || cs[(i + 1) as usize] == 'X') {
        i += 2;
        radix = 16;
    }
    let mut v: double = 0.0;
    let mut any = false;
    while i < n {
        let d = digit_of(cs[i as usize]);
        if d >= radix {
            break;
        }
        v = v * (radix as double) + (d as double);
        any = true;
        i += 1;
    }
    if !any {
        return nan();
    }
    sign * v
}

fn floor(x: double) -> double {
    x.floor()
}

pub fn to_integer(x: double) -> double {
    if is_nan(x) {
        return 0.0;
    }
    if !is_finite(x) {
        return x;
    }
    if x < 0.0 {
        -floor(-x)
    } else {
        floor(x)
    }
}

pub fn to_uint32(x: double) -> double {
    if !is_finite(x) {
        return 0.0;
    }
    let t = to_integer(x);
    let m = t - floor(t / 4294967296.0) * 4294967296.0;
    m
}

pub fn to_int32(x: double) -> int {
    if x >= -2147483648.0 && x <= 2147483647.0 {
        // the common case: already in range
        return x as int;
    }
    let m = to_uint32(x);
    // in doubles: 2^31 and up does not fit a 32-bit int
    if m >= 2147483648.0 {
        (m - 4294967296.0) as int
    } else {
        m as int
    }
}

pub fn radix_string(x: double, radix: int) -> String {
    if radix == 10 {
        return number_to_string(x);
    }
    if is_nan(x) {
        return String::from("NaN");
    }
    if !is_finite(x) {
        return if x < 0.0 { String::from("-Infinity") } else { String::from("Infinity") };
    }
    let neg = x < 0.0;
    let mut v = if neg { -x } else { x };
    let digits = "0123456789abcdefghijklmnopqrstuvwxyz".chars().collect::<Vec<char>>();
    let mut ip = floor(v);
    let mut fp = v - ip;
    let mut int_part: Vec<char> = Vec::new();
    if ip == 0.0 {
        int_part.push('0');
    }
    let r = radix as double;
    while ip > 0.0 {
        let q = floor(ip / r);
        let d = (ip - q * r) as int;
        int_part.push(digits[d as usize]);
        ip = q;
    }
    let mut out = String::new();
    if neg {
        out.push('-');
    }
    let mut k = int_part.len() as int - 1;
    while k >= 0 {
        out.push(int_part[k as usize]);
        k -= 1;
    }
    if fp > 0.0 {
        out.push('.');
        let mut count = 0;
        while fp > 0.0 && count < 52 {
            fp = fp * r;
            let d = floor(fp) as int;
            out.push(digits[d as usize]);
            fp = fp - (d as double);
            count += 1;
        }
    }
    v = 0.0;
    let _ = v;
    out
}

/// Number.prototype.toFixed
pub fn to_fixed(x: double, d: int) -> String {
    if is_nan(x) {
        return String::from("NaN");
    }
    if x >= 1e21 || x <= -1e21 {
        return number_to_string(x);
    }
    let neg = x < 0.0;
    let v = if neg { -x } else { x };
    let mut scale: double = 1.0;
    let mut i = 0;
    while i < d {
        scale = scale * 10.0;
        i += 1;
    }
    let n = floor(v * scale + 0.5);
    let mut s = if n < 2147483647.0 { format!("{}", n as int) } else { number_to_string(n) };
    if d > 0 {
        while (s.as_bytes().len() as int) <= d {
            s = format!("0{}", s);
        }
        let len = s.as_bytes().len() as int;
        let head = String::from(&s[0..((len - d) as usize)]);
        let tail = String::from(&s[((len - d) as usize)..]);
        s = format!("{}.{}", head, tail);
    }
    if neg && n != 0.0 {
        return format!("-{}", s);
    }
    if neg && d > 0 {
        return format!("-{}", s);
    }
    s
}
