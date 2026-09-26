fn take(s: String) -> usize {
    s.chars().count()
}

fn main() {
    let a = String::from("x");
    let c = true;
    if c {
        take(a);
    }
    println!("{}", a);
}
