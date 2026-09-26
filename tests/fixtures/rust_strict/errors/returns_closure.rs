fn compose(a: impl Fn(i64) -> i64, b: impl Fn(i64) -> i64) -> impl Fn(i64) -> i64 {
    move |x| b(a(x))
}

fn main() {
    let f = compose(|x| x + 1, |x| x * 2);
    println!("{}", f(3));
}
