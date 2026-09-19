#![allow(unused_parens)]
#![allow(unused_mut)]
#![allow(unused_variables)]
#![allow(unused_assignments)]
#![allow(non_snake_case)]
#![allow(dead_code)]
// The clippy allows below cover shapes that mirror the Ranger source
// itself - statement-level clamp chains, nested ifs, function arity and
// type names - which the transpiler must not rewrite or rename.
#![allow(clippy::manual_clamp)]
#![allow(clippy::collapsible_if)]
#![allow(clippy::too_many_arguments)]
#![allow(clippy::upper_case_acronyms)]
#![allow(clippy::ptr_arg)]

use std::rc::Rc;
use std::rc::Weak;
use std::cell::RefCell;

pub trait RgAnyRef { fn rg_as_any(&self) -> &dyn std::any::Any; }
fn rg_downcast<T: 'static, D: ?Sized + RgAnyRef>(v: &Rc<RefCell<D>>) -> Rc<RefCell<T>> {
    assert!(v.borrow().rg_as_any().is::<T>(), "invalid downcast");
    let p = Rc::into_raw(v.clone()) as *const () as *const RefCell<T>;
    unsafe { Rc::from_raw(p) }
}
pub trait RgIdentical { fn rg_identical(&self, other: &Self) -> bool; }
impl<T: ?Sized> RgIdentical for Rc<RefCell<T>> {
    fn rg_identical(&self, other: &Self) -> bool { Rc::ptr_eq(self, other) }
}
// FxHash (rustc-hash style): these maps are keyed by short program
// strings; SipHash's DoS resistance cost ~14% of all instructions in
// map-heavy code. Swap back to std's default by deleting the alias.
#[derive(Default, Clone)]
struct FxHasher { hash: u64 }
impl std::hash::Hasher for FxHasher {
    #[inline]
    fn write(&mut self, bytes: &[u8]) {
        const SEED: u64 = 0x517cc1b727220a95;
        let mut b = bytes;
        while b.len() >= 8 {
            let v = u64::from_le_bytes([b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7]]);
            self.hash = (self.hash.rotate_left(5) ^ v).wrapping_mul(SEED);
            b = &b[8..];
        }
        for &x in b {
            self.hash = (self.hash.rotate_left(5) ^ (x as u64)).wrapping_mul(SEED);
        }
    }
    #[inline]
    fn finish(&self) -> u64 { self.hash }
}
// Insertion-ordered map (mirrors the C++ rg_ordered_map): entries in a
// vector plus an open-addressed FxHash index. Lookups hash once; keys()
// iterates in INSERTION order, which is what JS key enumeration needs.
// Aliased over the HashMap name so declarations stay untouched.
#[derive(Clone)]
struct RgOrderedMap<K, V> {
    entries: Vec<(K, V)>,
    index: Vec<i32>,
}
impl<K, V> Default for RgOrderedMap<K, V> {
    fn default() -> Self { RgOrderedMap { entries: Vec::new(), index: Vec::new() } }
}
impl<K, V> IntoIterator for RgOrderedMap<K, V> {
    type Item = (K, V);
    type IntoIter = std::vec::IntoIter<(K, V)>;
    fn into_iter(self) -> Self::IntoIter { self.entries.into_iter() }
}
impl<'a, K, V> IntoIterator for &'a RgOrderedMap<K, V> {
    type Item = &'a (K, V);
    type IntoIter = std::slice::Iter<'a, (K, V)>;
    fn into_iter(self) -> Self::IntoIter { self.entries.iter() }
}
impl<K: std::hash::Hash + Eq, V> RgOrderedMap<K, V> {
    fn rg_hash<Q: std::hash::Hash + ?Sized>(k: &Q) -> u64 {
        let mut h = FxHasher::default();
        k.hash(&mut h);
        std::hash::Hasher::finish(&h)
    }
    fn slot<Q>(&self, k: &Q) -> i32 where K: std::borrow::Borrow<Q>, Q: std::hash::Hash + Eq + ?Sized {
        if self.index.is_empty() { return -1; }
        let mask = self.index.len() - 1;
        let mut h = (Self::rg_hash(k) as usize) & mask;
        loop {
            let s = self.index[h];
            if s == -1 { return -1; }
            if self.entries[s as usize].0.borrow() == k { return s; }
            h = (h + 1) & mask;
        }
    }
    fn rehash(&mut self) {
        let mut cap = 8usize;
        while cap < (self.entries.len() + 1) * 2 { cap <<= 1; }
        self.index.clear();
        self.index.resize(cap, -1);
        for i in 0..self.entries.len() {
            let mut h = (Self::rg_hash(&self.entries[i].0) as usize) & (cap - 1);
            while self.index[h] != -1 { h = (h + 1) & (cap - 1); }
            self.index[h] = i as i32;
        }
    }
    fn insert(&mut self, k: K, v: V) -> Option<V> {
        let s = self.slot(&k);
        if s != -1 { return Some(std::mem::replace(&mut self.entries[s as usize].1, v)); }
        self.entries.push((k, v));
        if self.index.is_empty() || (self.entries.len() + 1) * 2 > self.index.len() {
            self.rehash();
        } else {
            let mask = self.index.len() - 1;
            let mut h = (Self::rg_hash(&self.entries[self.entries.len() - 1].0) as usize) & mask;
            while self.index[h] != -1 { h = (h + 1) & mask; }
            self.index[h] = (self.entries.len() - 1) as i32;
        }
        None
    }
    fn get<Q>(&self, k: &Q) -> Option<&V> where K: std::borrow::Borrow<Q>, Q: std::hash::Hash + Eq + ?Sized {
        let s = self.slot(k);
        if s == -1 { None } else { Some(&self.entries[s as usize].1) }
    }
    fn contains_key<Q>(&self, k: &Q) -> bool where K: std::borrow::Borrow<Q>, Q: std::hash::Hash + Eq + ?Sized {
        self.slot(k) != -1
    }
    fn keys(&self) -> impl Iterator<Item = &K> { self.entries.iter().map(|e| &e.0) }
    fn len(&self) -> usize { self.entries.len() }
    fn clear(&mut self) {
        self.entries.clear();
        for s in self.index.iter_mut() { *s = -1; }
    }
}
type HashMap<K, V> = RgOrderedMap<K, V>;
fn rg_index_of(s: &str, key: &str) -> i64 {
    match s.find(key) { Some(b) => s[..b].chars().count() as i64, None => -1 }
}
fn rg_index_of_from(s: &str, key: &str, start: i64) -> i64 {
    if start <= 0 { return rg_index_of(s, key); }
    let b0 = match s.char_indices().nth(start as usize) { Some((b, _)) => b, None => return -1 };
    match s[b0..].find(key) { Some(b) => start + s[b0..b0 + b].chars().count() as i64, None => -1 }
}
fn rg_last_index_of(s: &str, key: &str) -> i64 {
    match s.rfind(key) { Some(b) => s[..b].chars().count() as i64, None => -1 }
}

#[derive(Clone)]
struct Point { 
  x : i64, 
  y : i64, 
}
impl Point { 
  
  pub fn new(x : i64, y : i64) ->  Point {
    let mut me = Point { 
      x:0, 
      y:0, 
    };
    me.x = x;
    me.y = y;
    me
  }
}
#[derive(Clone)]
struct PointOps { 
}
impl PointOps { 
  
  pub fn new() ->  PointOps {
    PointOps { 
    }
  }
  fn manhattan(&self, p : &Point) -> i64 {
    let mut ax : i64 = p.x;
    if  ax < 0 {
      ax = 0 - ax;
    }
    let mut ay : i64 = p.y;
    if  ay < 0 {
      ay = 0 - ay;
    }
    ax + ay
  }
  fn addPoints(&self, a : &Point, b : &Point) -> Point {
    Point::new(a.x + b.x, a.y + b.y).clone()
  }
}
#[derive(Clone)]
struct Counter { 
  value : i64, 
}
impl Counter { 
  
  pub fn new() ->  Counter {
    Counter { 
      value:0, 
    }
  }
  fn reading(__self_rc : &Rc<RefCell<Counter>>) -> i64 {
    __self_rc.borrow().value
  }
  fn add(__self_rc : &Rc<RefCell<Counter>>, amount : i64) {
    __self_rc.borrow_mut().value += amount;
  }
}
#[derive(Clone)]
struct TreeNode { 
  name : &'static str, 
  kids : Vec<Rc<RefCell<TreeNode>>>, 
  parent : Option<Weak<RefCell<TreeNode>>>, 
}
impl TreeNode { 
  
  pub fn new() ->  TreeNode {
    TreeNode { 
      name:"", 
      kids: Vec::new(), 
      parent: None, 
    }
  }
  fn adopt(__self_rc : &Rc<RefCell<TreeNode>>, mut c : Rc<RefCell<TreeNode>>) {
    c.borrow_mut().parent = Some(Rc::downgrade(__self_rc));
    __self_rc.borrow_mut().kids.push(c.clone());
  }
  fn childCount(__self_rc : &Rc<RefCell<TreeNode>>) -> i64 {
    __self_rc.borrow().kids.len() as i64
  }
}
#[derive(Clone)]
struct OwnershipMain { 
}
impl OwnershipMain { 
  
  pub fn new() ->  OwnershipMain {
    OwnershipMain { 
    }
  }
}
fn main() {
  let __rg_main_thread = std::thread::Builder::new().stack_size(512 * 1024 * 1024)
    .spawn(__rg_main_body).expect("could not start the main thread");
  __rg_main_thread.join().expect("main thread panicked");
}
fn __rg_main_body() {
  let mut ops : PointOps = PointOps::new();
  let mut origin : Point = Point::new(3, 4);
  println!("{}{}", "manhattan ".to_string(), ops.manhattan(&origin));
  let mut summed : Point = ops.addPoints(&origin, &origin);
  println!("{}{}", "sum.x ".to_string(), summed.x);
  let mut left : Rc<RefCell<Counter>> = Rc::new(RefCell::new(Counter::new()));
  let mut alias : Rc<RefCell<Counter>> = left.clone();
  Counter::add(&alias, 1);
  println!("{}{}", "shared ".to_string(), Counter::reading(&left));
  let mut root : Rc<RefCell<TreeNode>> = Rc::new(RefCell::new(TreeNode::new()));
  root.borrow_mut().name = "root";
  let mut leaf : Rc<RefCell<TreeNode>> = Rc::new(RefCell::new(TreeNode::new()));
  leaf.borrow_mut().name = "leaf";
  TreeNode::adopt(&root, leaf.clone());
  println!("{}{}", "kids ".to_string(), TreeNode::childCount(&root));
  if  leaf.borrow().parent.as_ref().and_then(|__w| __w.upgrade()).is_none() {
    println!("parent missing");
  } else {
    let mut back : Rc<RefCell<TreeNode>> = leaf.borrow().parent.clone().unwrap().upgrade().unwrap();
    println!("{}{}", "parent ".to_string(), back.borrow().name);
  }
}
