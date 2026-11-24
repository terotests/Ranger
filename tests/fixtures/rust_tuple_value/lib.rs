// A tuple of numbers is Copy (tests/rust-tuple-match.test.ts).
use ranger::prelude::*;
fn mm(v: &Vec<int>) -> (int, int) { let mut lo = v[0]; let mut hi = v[0]; for x in v.iter() { if *x < lo { lo = *x; } if *x > hi { hi = *x; } } (lo, hi) }
pub fn run() -> String {
    let mut pairs: Vec<(int, int)> = Vec::new();
    pairs.push((1, 2)); pairs.push((3, 4));
    let mut s = 0;
    for (x, y) in pairs.iter() { s += x * 10 + y; }
    pairs[0].1 = 9;
    let (lo, hi) = mm(&vec![4, 2, 8]);
    let t = pairs[1];
    let mut u = t; u.0 = 100;
    let o: Option<(int, int)> = Some((5, 6));
    let k = match o { Some((a, b)) => a + b, None => 0 };
    format!("{} {} {} {} {} {} {}", s, pairs[0].1, lo, hi, t.0, u.0, k)
}
