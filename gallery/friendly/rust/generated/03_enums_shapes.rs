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

#[derive(Clone)]
pub enum union_Message {
    Message_Ping(Message_Ping),
    Message_Text(Rc<RefCell<Message_Text>>),
    Message_Move(Message_Move),
}
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
impl RgIdentical for union_Message {
    fn rg_identical(&self, other: &Self) -> bool {
        match (self, other) {
            (union_Message::Message_Ping(a), union_Message::Message_Ping(b)) => a == b,
            (union_Message::Message_Text(a), union_Message::Message_Text(b)) => Rc::ptr_eq(a, b),
            (union_Message::Message_Move(a), union_Message::Message_Move(b)) => a == b,
            _ => false,
        }
    }
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

#[derive(Clone, PartialEq)]
struct Message_Ping { 
}
impl Message_Ping { 
  
  pub fn new() ->  Message_Ping {
    Message_Ping { 
    }
  }
}
#[derive(Clone)]
struct Message_Text { 
  body : String, 
}
impl Message_Text { 
  
  pub fn new(body : String) ->  Message_Text {
    let mut me = Message_Text { 
      body:"".to_string(), 
    };
    me.body = body.clone();
    me
  }
}
#[derive(Clone, PartialEq)]
struct Message_Move { 
  dx : i64, 
  dy : i64, 
}
impl Message_Move { 
  
  pub fn new(dx : i64, dy : i64) ->  Message_Move {
    let mut me = Message_Move { 
      dx:0, 
      dy:0, 
    };
    me.dx = dx;
    me.dy = dy;
    me
  }
}
#[derive(Clone)]
struct Message__ops { 
}
impl Message__ops { 
  
  pub fn new() ->  Message__ops {
    Message__ops { 
    }
  }
  pub fn equals(a : &union_Message, b : &union_Message) -> bool {
    if let union_Message::Message_Ping(__ea0) = &a { /* union case */
      if let union_Message::Message_Ping(__eb0) = &b { /* union case */
        return true;
      };
      return false;
    };
    if let union_Message::Message_Text(__ea1) = &a { /* union case */
      if let union_Message::Message_Text(__eb1) = &b { /* union case */
        if  __ea1.borrow().body != __eb1.borrow().body {
          return false;
        }
        return true;
      };
      return false;
    };
    if let union_Message::Message_Move(__ea2) = &a { /* union case */
      if let union_Message::Message_Move(__eb2) = &b { /* union case */
        if  __ea2.dx != __eb2.dx {
          return false;
        }
        if  __ea2.dy != __eb2.dy {
          return false;
        }
        return true;
      };
      return false;
    };
    false
  }
  pub fn notEquals(a : &union_Message, b : &union_Message) -> bool {
    if  Message__ops::equals(a, b) {
      return false;
    }
    true
  }
}
#[derive(Clone)]
struct EnumsMain { 
}
impl EnumsMain { 
  
  pub fn new() ->  EnumsMain {
    EnumsMain { 
    }
  }
  fn colorName(c : i64) -> String {
    if  c == 0 {
      return "red".to_string().clone();
    }
    if  c == 1 {
      return "green".to_string().clone();
    }
    "blue".to_string().clone()
  }
  fn describe(&self, m : &union_Message) -> String {
    let mut out : String = "?".to_string();
    if let union_Message::Message_Ping(__match0) = &m { /* union case */
      out = "ping".to_string();
    };
    if let union_Message::Message_Text(t) = &m { /* union case */
      out = format!("{}{}", "text:".to_string(), t.borrow().body);
    };
    if let union_Message::Message_Move(mv) = &m { /* union case */
      out = format!("{}{}{}{}", "move:".to_string(), mv.dx, ",".to_string(), mv.dy);
    };
    out.clone()
  }
}
fn main() {
  let __rg_main_thread = std::thread::Builder::new().stack_size(512 * 1024 * 1024)
    .spawn(__rg_main_body).expect("could not start the main thread");
  __rg_main_thread.join().expect("main thread panicked");
}
fn __rg_main_body() {
  let mut app : EnumsMain = EnumsMain::new();
  println!("{}{}", "color ".to_string(), EnumsMain::colorName(1));
  println!("{}", app.describe(&union_Message::Message_Ping(Message_Ping::new())));
  println!("{}", app.describe(&union_Message::Message_Text(Rc::new(RefCell::new(Message_Text::new("hi".to_string()))))));
  println!("{}", app.describe(&union_Message::Message_Move(Message_Move::new(2, 3))));
}
