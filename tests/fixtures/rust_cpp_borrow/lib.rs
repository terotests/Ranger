// Borrowed structs and Rc<String> on C++ (tests/rust-cpp-borrow.test.ts).
use ranger::prelude::*;
use std::rc::Rc;
pub struct O { pub x: int, pub tag: String }
pub struct E { pub v: Vec<int> }
pub struct M { pub objs: Vec<O>, pub evs: Vec<E>, pub texts: Vec<Rc<String>>, pub src: Rc<String> }
pub fn obj_at(v: &Vec<O>, i: usize) -> &O { &v[i] }
fn count_a(s: &str) -> int { let mut n = 0; for c in s.chars() { if c == 'a' { n += 1; } } n }
impl M {
    pub fn ob(&self, i: int) -> &O { obj_at(&self.objs, i as usize) }
    pub fn first(&self) -> &E { &self.evs[0] }
    pub fn text(&self, i: usize) -> Rc<String> { self.texts[i].clone() }
}
pub fn run() -> String {
    let mut m = M { objs: Vec::new(), evs: Vec::new(), texts: Vec::new(), src: Rc::new(String::from("banana")) };
    m.objs.push(O { x: 5, tag: String::new() });
    m.evs.push(E { v: vec![1, 2] });
    m.texts.push(m.src.clone());
    m.texts.push(Rc::new(format!("{}!", m.src)));
    let t = m.text(1);
    let same = *m.texts[0] == *m.src;
    format!("{} {} {} {} {} {} {}", m.ob(0).x, m.first().v.len(), t, t.len(), count_a(&m.text(0)), same, m.texts[0].as_str() == "banana")
}
