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

#[derive(Clone)]
struct Stats { 
}
impl Stats { 
  
  pub fn new() ->  Stats {
    Stats { 
    }
  }
  fn total(xs : &[i64]) -> i64 {
    let mut acc : i64 = 0;
    for v in xs.iter().copied() {
      acc += v;
    }
    acc
  }
  fn evenCount(xs : &[i64]) -> i64 {
    let mut n : i64 = 0;
    for v in xs.iter().copied() {
      if  v % 2 == 0 {
        n += 1;
      }
    }
    n
  }
  fn doubled(xs : &[i64]) -> Vec<i64> {
    let mut out : Vec<i64> = Vec::new();
    for v in xs.iter().copied() {
      out.push(v * 2);
    }
    out.clone()
  }
  fn applyEach(xs : &[i64], f : &mut dyn FnMut(i64) -> i64) -> Vec<i64> {
    let mut out : Vec<i64> = Vec::new();
    for v in xs.iter().copied() {
      let next : i64 = f(v);
      out.push(next);
    }
    out.clone()
  }
}
#[derive(Clone)]
struct IterMain { 
}
impl IterMain { 
  
  pub fn new() ->  IterMain {
    IterMain { 
    }
  }
}
fn main() {
  let __rg_main_thread = std::thread::Builder::new().stack_size(512 * 1024 * 1024)
    .spawn(__rg_main_body).expect("could not start the main thread");
  __rg_main_thread.join().expect("main thread panicked");
}
fn __rg_main_body() {
  let mut s : Stats = Stats::new();
  let mut xs : Vec<i64> = vec![1, 2, 3, 4];
  println!("{}{}", "sum ".to_string(), Stats::total(&xs));
  println!("{}{}", "evens ".to_string(), Stats::evenCount(&xs));
  let mut twice : Vec<i64> = Stats::doubled(&xs);
  println!("{}{}", "doubled0 ".to_string(), twice[0]);
  let addOne : &mut dyn FnMut(i64) -> i64 = &mut |mut p| {
    return p + 1;
  };
  let mut bumped : Vec<i64> = Stats::applyEach(&xs, addOne);
  println!("{}{}", "bumped0 ".to_string(), bumped[0]);
}
