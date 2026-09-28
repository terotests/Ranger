// rustc E0072: `A` and `B` hold each other by value; Option does not help.
struct A {
    b: Option<B>,
}

struct B {
    a: A,
}

fn main() {
    let _a = A { b: None };
}
