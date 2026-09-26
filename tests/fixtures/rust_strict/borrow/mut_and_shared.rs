struct P {
    x: i64,
}

fn set_from(p: &mut P, v: &i64) {
    p.x = *v;
}

fn main() {
    let mut p = P { x: 1 };
    set_from(&mut p, &p.x);
    println!("{}", p.x);
}
