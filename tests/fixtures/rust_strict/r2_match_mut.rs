// R2: a match through `&mut` binds `ref mut`: changes to a binding reach the
// variant (and the struct, tuple or Option) it was bound from.
#[derive(Debug, Clone)]
enum V {
    N(f64),
    S(String),
    P { x: i32, y: i32 },
    Unit,
}

fn bump(v: &mut V) {
    match v {
        V::N(n) => *n += 1.0,
        V::S(s) => s.push_str("!"),
        V::P { x, y } => {
            *x += 10;
            if *x > 100 {
                // the write-back happens before the early return
                return;
            }
            *y = *x * 2;
        }
        V::Unit => {}
    }
}

impl V {
    fn reset(&mut self) {
        match self {
            V::N(n) => *n = 0.0,
            V::S(s) => *s = String::from("-"),
            _ => {}
        }
    }
}

fn show(v: &V) -> String {
    match v {
        V::N(n) => format!("N({})", n),
        V::S(s) => format!("S({})", s),
        V::P { x, y } => format!("P({}, {})", x, y),
        V::Unit => String::from("Unit"),
    }
}

// `mut n` under a `&mut` subject is a copy: the variant keeps its value
fn copy_only(v: &mut V) -> f64 {
    match v {
        V::N(mut n) => {
            n += 5.0;
            n
        }
        _ => 0.0,
    }
}

#[derive(Debug, Clone, Copy)]
enum C {
    A(i32),
    B,
}

fn inc(c: &mut C) {
    if let C::A(k) = c {
        *k += 1;
    }
}

#[allow(dead_code)]
enum Outer {
    In(V),
    Nothing,
}

struct Holder {
    v: V,
    count: Option<i32>,
    pair: (i32, String),
}

fn main() {
    let a = V::N(1.0);
    let mut b = a.clone();
    bump(&mut b);
    let c = V::S(String::from("x"));
    let mut d = c.clone();
    bump(&mut d);
    println!("{} {} {} {}", show(&a), show(&b), show(&c), show(&d));

    let mut p = V::P { x: 1, y: 1 };
    bump(&mut p);
    println!("{}", show(&p));
    let mut q = V::P { x: 95, y: 1 };
    bump(&mut q);
    println!("{}", show(&q));

    let mut u = V::Unit;
    bump(&mut u);
    println!("{}", show(&u));

    let mut r = V::N(7.0);
    r.reset();
    let mut s = V::S(String::from("long"));
    s.reset();
    println!("{} {}", show(&r), show(&s));

    let mut w = V::N(2.0);
    let got = copy_only(&mut w);
    println!("{} {}", got, show(&w));

    // a Copy enum: the copy is not changed with the original
    let c1 = C::A(1);
    let mut c2 = c1;
    inc(&mut c2);
    inc(&mut c2);
    let mut c3 = C::B;
    inc(&mut c3);
    println!("{:?} {:?} {:?}", c1, c2, c3);

    // a nested enum
    let mut o = Outer::In(V::N(3.0));
    match &mut o {
        Outer::In(V::N(n)) => *n *= 2.0,
        Outer::In(_) => {}
        Outer::Nothing => {}
    }
    if let Outer::In(inner) = &o {
        println!("{}", show(inner));
    }

    // a struct field, an Option field and a tuple field through `&mut`
    let mut h = Holder { v: V::S(String::from("h")), count: Some(4), pair: (1, String::from("p")) };
    match &mut h.v {
        V::S(t) => t.push_str("ey"),
        _ => {}
    }
    if let Some(k) = &mut h.count {
        *k += 1;
    }
    let (n1, s1) = &mut h.pair;
    *n1 += 1;
    s1.push_str("q");
    println!("{} {:?} {} {}", show(&h.v), h.count, h.pair.0, h.pair.1);

    // `ref mut` on a place that is not a reference
    let mut e = V::N(1.5);
    match e {
        V::N(ref mut n) => *n += 1.0,
        _ => {}
    }
    println!("{}", show(&e));
}
