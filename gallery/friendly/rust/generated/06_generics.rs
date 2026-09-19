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
struct GenericsMain { 
}
impl GenericsMain { 
  
  pub fn new() ->  GenericsMain {
    GenericsMain { 
    }
  }
}
fn main() {
  let __rg_main_thread = std::thread::Builder::new().stack_size(512 * 1024 * 1024)
    .spawn(__rg_main_body).expect("could not start the main thread");
  __rg_main_thread.join().expect("main thread panicked");
}
fn __rg_main_body() {
  let mut ints : Stack_int = Stack_int::new();
  ints.put(7);
  ints.put(8);
  println!("{}{}", "int-size ".to_string(), ints.size());
  let top : Option<i64> = ints.peek();
  println!("{}{}", "int-top ".to_string(), if top.is_some() { top.unwrap() } else { 0 });
  let mut words : Stack_string = Stack_string::new();
  words.put("ada");
  words.put("grace");
  println!("{}{}", "str-size ".to_string(), words.size());
  let lastWord : Option<String> = words.peek();
  println!("{}{}", "str-top ".to_string(), if lastWord.is_some() { lastWord.clone().unwrap() } else { "?".to_string() });
}
#[derive(Clone)]
struct Stack_int { 
  items : Vec<i64>, 
}
impl Stack_int { 
  
  pub fn new() ->  Stack_int {
    Stack_int { 
      items: Vec::new(), 
    }
  }
  fn put(&mut self, item : i64) {
    self.items.push(item);
  }
  fn size(&self) -> i64 {
    self.items.len() as i64
  }
  fn peek(&self) -> Option<i64> {
    let mut found : Option<i64> = None;
    let n : i64 = self.items.len() as i64;
    if  n == 0 {
      return found;
    }
    found = Some(self.items[(n - 1) as usize]);
    found
  }
  fn _optionalInt(text : &str) -> Option<i64> {
    text.parse::<i64>().ok()
  }
}
#[derive(Clone)]
struct Stack_string { 
  items : Vec<String>, 
}
impl Stack_string { 
  
  pub fn new() ->  Stack_string {
    Stack_string { 
      items: Vec::new(), 
    }
  }
  fn put(&mut self, item : &str) {
    self.items.push(item.to_string());
  }
  fn size(&self) -> i64 {
    self.items.len() as i64
  }
  fn peek(&self) -> Option<String> {
    let mut found : Option<String> = None;
    let n : i64 = self.items.len() as i64;
    if  n == 0 {
      return found.clone();
    }
    found = Some(self.items[(n - 1) as usize].clone());
    found.clone()
  }
  fn _optionalInt(text : &str) -> Option<i64> {
    text.parse::<i64>().ok()
  }
}
