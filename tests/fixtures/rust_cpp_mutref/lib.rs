// `&mut` of a value type on C++ (tests/rust-cpp-mutref.test.ts).
use ranger::prelude::*;
use std::collections::HashMap;
pub struct S { pub items: Vec<int>, pub n: int }
fn add_all(v: &mut Vec<int>, k: int) { for i in 0..k { v.push(i); } }
fn grow(v: &mut Vec<int>) { add_all(v, 2); v.push(100); }
fn replace(v: &mut Vec<int>) { *v = vec![7, 8]; }
fn bump(n: &mut int) { *n += 5; }
fn shout(s: &mut String) { s.push_str("!"); }
fn count(m: &mut HashMap<String, int>, k: &str) { let c = m.get(k).copied().unwrap_or(0); m.insert(k.to_string(), c + 1); }
fn bytes(b: &mut Vec<u8>) { b.push(65); b.push(66); }
impl S {
    pub fn fill(&mut self) { add_all(&mut self.items, 3); bump(&mut self.n); }
}
pub fn run() -> String {
    let mut v: Vec<int> = Vec::new();
    grow(&mut v);
    let a = v.len();
    let mut w = vec![1];
    replace(&mut w);
    let mut n = 1;
    bump(&mut n);
    let mut s = String::from("hi");
    shout(&mut s);
    let mut m: HashMap<String, int> = HashMap::new();
    count(&mut m, "x");
    count(&mut m, "x");
    let mut b: Vec<u8> = Vec::new();
    bytes(&mut b);
    let mut st = S { items: Vec::new(), n: 0 };
    st.fill();
    st.fill();
    format!("{} {} {} {} {} {} {} {} {}", a, v[2], w[1], n, s, m.get("x").copied().unwrap_or(0), b.len(), st.items.len(), st.n)
}
