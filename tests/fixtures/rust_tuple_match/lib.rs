// `match (a, b)` without a tuple object (tests/rust-tuple-match.test.ts).
use ranger::prelude::*;
#[derive(Clone, Copy)]
pub enum K { A, B(int), C(double) }
pub struct P { pub x: int }
fn kind(i: int) -> K { if i == 0 { K::A } else if i % 2 == 1 { K::B(i) } else { K::C(i as double / 2.0) } }
fn cmp(a: K, b: K) -> int {
    match (a, b) {
        (K::A, K::A) => 1,
        (K::B(x), K::B(y)) => x + y,
        (K::C(x), _) => x as int * 100,
        (K::A, K::B(_)) | (K::B(_), K::A) => 7,
        _ => -1,
    }
}
fn bump_seen(mut n: int) -> int {
    match (n, 1) {
        (a, b) => { n += 10; a + b + n }
    }
}
fn names(s: &str, t: &str) -> String {
    match (s.len(), t) {
        (0, _) => String::from("empty"),
        (_, "x") => format!("{}-x", s),
        (k, other) => format!("{}:{}", k, other),
    }
}
fn objs(p: &P, q: &P) -> int {
    match (p.x > 0, q) {
        (true, P { x }) => *x,
        (false, _) => 0,
    }
}
pub fn run() -> String {
    let mut out = String::new();
    let mut i = 0;
    while i < 5 { let mut j = 0; while j < 5 { out.push_str(&format!("{} ", cmp(kind(i), kind(j)))); j += 1; } i += 1; }
    format!("{}| {} {} {} {} {} {}", out, bump_seen(5), names("", "y"), names("ab", "x"), names("ab", "z"), objs(&P { x: 3 }, &P { x: 9 }), objs(&P { x: 0 }, &P { x: 9 }))
}
