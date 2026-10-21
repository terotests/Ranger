// Option of a struct: matched None first, and two of them as a tuple
#[derive(Clone)]
struct Item {
    name: String,
    size: i64,
}

fn find(items: &Vec<Item>, name: &str) -> Option<Item> {
    for it in items.iter() {
        if it.name == name {
            return Some(it.clone());
        }
    }
    None
}

fn same(a: &Option<Item>, b: &Option<Item>) -> bool {
    match (a, b) {
        (None, None) => true,
        (Some(x), Some(y)) => x.name == y.name && x.size == y.size,
        _ => false,
    }
}

fn main() {
    let items = vec![Item { name: String::from("a"), size: 1 }, Item { name: String::from("b"), size: 2 }];
    for n in ["a", "c"].iter() {
        match find(&items, n) {
            None => println!("{} missing", n),
            Some(it) => println!("{} has size {}", n, it.size),
        }
    }
    let a = find(&items, "a");
    let b = find(&items, "b");
    let none: Option<Item> = None;
    println!("{} {} {} {}", same(&a, &a), same(&a, &b), same(&none, &none), same(&a, &none));
}
