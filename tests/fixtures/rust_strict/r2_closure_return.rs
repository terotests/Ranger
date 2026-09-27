// Functions that return closures (ISSUES.md #103): `impl Fn` and
// `Box<dyn Fn>` returns, a closure built from two others, and one that
// captured a String.

fn adder(k: i64) -> impl Fn(i64) -> i64 {
    move |x| x + k
}

fn compose(a: impl Fn(i64) -> i64, b: impl Fn(i64) -> i64) -> impl Fn(i64) -> i64 {
    move |x| b(a(x))
}

fn greeter(greeting: String) -> Box<dyn Fn(&str) -> String> {
    Box::new(move |name| format!("{}, {}!", greeting, name))
}

fn apply_twice(f: &dyn Fn(i64) -> i64, v: i64) -> i64 {
    f(f(v))
}

fn main() {
    let add5 = adder(5);
    println!("{}", add5(1));
    let f = compose(|x| x + 1, |x| x * 2);
    println!("{}", f(3));
    println!("{}", apply_twice(&add5, 10));
    let hello = greeter("Hello".to_string());
    println!("{}", hello("Ranger"));
    let chain = compose(adder(100), f);
    println!("{}", chain(1));
}
