// A Copy struct of scalars, read and written the ways rgrc's C++ writer
// holds by value (tests/rust-copy-value.test.ts).
use ranger::prelude::*;

#[derive(Clone, Copy)]
pub struct P {
    pub x: int,
    pub y: double,
    pub on: bool,
}

impl P {
    pub fn new(x: int, y: double) -> P {
        P { x: x, y: y, on: false }
    }
    pub fn sum(&self) -> double {
        (self.x as double) + self.y
    }
    pub fn bump(&mut self) {
        self.x += 1;
    }
}

/// a struct that holds one by value
pub struct Holder {
    pub p: P,
    pub ps: Vec<P>,
}

fn take(p: P) -> double {
    p.sum()
}

fn take_ref(p: &P) -> double {
    p.sum() * 2.0
}

fn bump_ref(p: &mut P) {
    p.bump();
    p.y += 0.5;
}

fn first(ps: &Vec<P>) -> Option<P> {
    if ps.is_empty() { None } else { Some(ps[0]) }
}

pub fn run() -> String {
    let mut out = String::new();
    let a = P::new(1, 2.5);
    let mut b = a;
    b.bump();
    // a is a copy: still 1
    out.push_str(&format!("{} {} ", a.x, b.x));
    let mut h = Holder { p: a, ps: Vec::new() };
    h.ps.push(a);
    h.ps.push(b);
    // through an index: writes land in the vector
    h.ps[0].x = 10;
    h.ps[1].bump();
    bump_ref(&mut h.p);
    out.push_str(&format!("{} {} {} {} ", h.ps[0].x, h.ps[1].x, h.p.x, h.p.y));
    // the copy taken before is unchanged
    let c = h.ps[0];
    h.ps[0].x = 20;
    out.push_str(&format!("{} {} ", c.x, h.ps[0].x));
    out.push_str(&format!("{} {} ", take(c), take_ref(&h.ps[1])));
    match first(&h.ps) {
        Some(p) => out.push_str(&format!("first {} ", p.x)),
        None => out.push_str("none "),
    }
    let empty: Vec<P> = Vec::new();
    if first(&empty).is_none() {
        out.push_str("empty");
    }
    out
}
