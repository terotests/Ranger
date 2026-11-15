// Option<Vec<_>>: None is no value, not an empty Vec; char::to_digit(radix)

fn conds(id: i64) -> Option<Vec<i64>> {
    let mut out: Vec<i64> = vec![];
    if id == 0 {
        return None;
    }
    out.push(id);
    Some(out)
}

fn pick(id: i64) -> Vec<i64> {
    if let Some(c) = conds(id) {
        return c;
    }
    vec![-1, -2]
}

fn main() {
    println!("{:?} {:?}", pick(0), pick(5));
    let none: Option<Vec<i64>> = None;
    println!("{}", none.is_none());
    match conds(0) {
        Some(v) => println!("some {}", v.len()),
        None => println!("none"),
    }
    for c in "09afAFgz".chars() {
        match c.to_digit(16) {
            Some(d) => print!("{} ", d),
            None => print!("- "),
        }
    }
    println!();
    println!("{:?} {:?}", '7'.to_digit(8), '8'.to_digit(8));
}
