// R2: derived PartialEq on enums and structs whose fields are collections
// (Vec, HashMap, HashSet) compares them element by element.
use std::collections::{HashMap, HashSet};

// Debug + Clone only: no equality is derived, so none may be written.
#[derive(Debug, Clone)]
enum V {
    L(Vec<i32>),
    N(f64),
}

#[derive(Clone, PartialEq)]
enum Val {
    List(Vec<i64>),
    Nested(Vec<Vec<String>>),
    Map(HashMap<String, Vec<i64>>),
    Tags(HashSet<String>),
    Items(Vec<Val>),
    Num(f64),
    Nothing,
}

#[derive(Clone, PartialEq)]
struct Bag {
    name: String,
    items: Vec<Val>,
    counts: HashMap<i64, i64>,
}

fn show(label: &str, b: bool) {
    println!("{}: {}", label, b);
}

fn main() {
    let v = V::L(vec![1, 2, 3]);
    let w = v.clone();
    if let V::L(xs) = &w {
        println!("V len {}", xs.len());
    }
    let n = V::N(2.5);
    if let V::N(x) = n {
        println!("V num {}", x);
    }

    let a = Val::List(vec![1, 2, 3]);
    let b = Val::List(vec![1, 2, 3]);
    let c = Val::List(vec![1, 2]);
    let d = Val::List(vec![1, 2, 4]);
    show("list eq", a == b);
    show("list shorter", a == c);
    show("list differs", a == d);
    show("list ne", a != d);

    let n1 = Val::Nested(vec![vec!["a".to_string()], vec![]]);
    let n2 = Val::Nested(vec![vec!["a".to_string()], vec![]]);
    let n3 = Val::Nested(vec![vec!["b".to_string()], vec![]]);
    show("nested eq", n1 == n2);
    show("nested differs", n1 == n3);

    let mut m1: HashMap<String, Vec<i64>> = HashMap::new();
    m1.insert("x".to_string(), vec![1]);
    m1.insert("y".to_string(), vec![2, 3]);
    let mut m2: HashMap<String, Vec<i64>> = HashMap::new();
    m2.insert("y".to_string(), vec![2, 3]);
    m2.insert("x".to_string(), vec![1]);
    let mut m3 = m2.clone();
    m3.insert("y".to_string(), vec![2]);
    let mut m4 = m2.clone();
    m4.insert("z".to_string(), vec![]);
    show("map eq", Val::Map(m1.clone()) == Val::Map(m2.clone()));
    show("map value differs", Val::Map(m1.clone()) == Val::Map(m3));
    show("map extra key", Val::Map(m1) == Val::Map(m4));

    let mut s1: HashSet<String> = HashSet::new();
    s1.insert("p".to_string());
    s1.insert("q".to_string());
    let mut s2: HashSet<String> = HashSet::new();
    s2.insert("q".to_string());
    s2.insert("p".to_string());
    let mut s3 = s2.clone();
    s3.insert("r".to_string());
    show("set eq", Val::Tags(s1.clone()) == Val::Tags(s2));
    show("set differs", Val::Tags(s1) == Val::Tags(s3));

    let i1 = Val::Items(vec![Val::Num(1.0), Val::List(vec![5])]);
    let i2 = Val::Items(vec![Val::Num(1.0), Val::List(vec![5])]);
    let i3 = Val::Items(vec![Val::Num(1.0), Val::Nothing]);
    show("items eq", i1 == i2);
    show("items differs", i1 == i3);
    show("kinds differ", Val::Num(1.0) == Val::Nothing);
    show("nothing eq", Val::Nothing == Val::Nothing);

    let mut k1: HashMap<i64, i64> = HashMap::new();
    k1.insert(1, 10);
    let bag1 = Bag { name: "b".to_string(), items: vec![Val::Num(2.0)], counts: k1.clone() };
    let bag2 = Bag { name: "b".to_string(), items: vec![Val::Num(2.0)], counts: k1.clone() };
    let mut k2 = k1.clone();
    k2.insert(2, 20);
    let bag3 = Bag { name: "b".to_string(), items: vec![Val::Num(2.0)], counts: k2 };
    show("bag eq", bag1 == bag2);
    show("bag differs", bag1 == bag3);

    let xs = vec![vec![1, 2], vec![3]];
    let ys = vec![vec![1, 2], vec![3]];
    show("vec eq", xs == ys);
    show("vec ne", xs != vec![vec![1]]);
}
