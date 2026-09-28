// rustc E0072: `List` holds a `List` by value, so it has no size.
enum List {
    Cons(i32, List),
    Nil,
}

fn main() {
    let _l = List::Nil;
}
