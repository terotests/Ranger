// A Rust data enum (a sum type) changed in place through `&mut self`:
// tests/rust-data-enum.test.ts compiles it to each target and compares the
// output with rustc.

#[derive(Clone, Debug)]
pub enum Obj {
    Null,
    Num(f64),
    Name(String),
    Arr(Vec<Obj>),
    Dict { keys: Vec<String>, items: Vec<Obj> },
}

impl Obj {
    pub fn set(&mut self, key: &str, v: Obj) {
        if let Obj::Dict { keys, items } = self {
            let mut i = 0;
            while i < keys.len() {
                if keys[i] == key { items[i] = v; return; }
                i += 1;
            }
            keys.push(key.to_string());
            items.push(v);
        }
    }
    pub fn push(&mut self, v: Obj) {
        if let Obj::Arr(a) = self { a.push(v); }
    }
    pub fn at(&self, key: &str) -> Obj {
        match self {
            Obj::Dict { keys, items } => {
                for (i, k) in keys.iter().enumerate() { if k == key { return items[i].clone(); } }
                Obj::Null
            }
            _ => Obj::Null,
        }
    }
    pub fn f(&self) -> f64 { match self { Obj::Num(n) => *n, _ => 0.0 } }
    pub fn len(&self) -> usize { match self { Obj::Arr(a) => a.len(), Obj::Dict { items, .. } => items.len(), _ => 0 } }
}

fn main() {
    let mut d = Obj::Dict { keys: vec![], items: vec![] };
    d.set("A", Obj::Num(1.0));
    d.set("B", Obj::Arr(vec![]));
    d.set("A", Obj::Num(2.0));
    let mut arr = d.at("B");
    arr.push(Obj::Num(5.0));
    let copy = d.clone();
    d.set("B", arr);
    let mut sum = 0.0;
    let mut i = 0;
    while i < 100000 { let mut x = Obj::Dict { keys: vec![], items: vec![] }; x.set("k", Obj::Num(i as f64)); sum += x.at("k").f(); i += 1; }
    println!("{} {} {} {} {}", d.at("A").f(), d.len(), d.at("B").len(), copy.at("B").len(), sum);
    let n = Obj::Name("x".to_string());
    if let Obj::Name(s) = &n { println!("{}", s); }
}
