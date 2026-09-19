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
struct TextTools { 
}
impl TextTools { 
  
  pub fn new() ->  TextTools {
    TextTools { 
    }
  }
  fn greet(name : &str) -> String {
    format!("{}{}", "hello ".to_string(), name).clone()
  }
  fn total(xs : &[i64]) -> i64 {
    let mut acc : i64 = 0;
    for v in xs.iter().copied() {
      acc += v;
    }
    acc
  }
  fn firstChar(s : &str) -> String {
    if  (s.chars().count() as i64) == 0 {
      return "".to_string().clone();
    }
    s.chars().take(1).collect::<String>().clone()
  }
  fn twice(&self, xs : &[i64]) -> i64 {
    TextTools::total(xs) + TextTools::total(xs)
  }
}
#[derive(Clone)]
struct SliceMain { 
}
impl SliceMain { 
  
  pub fn new() ->  SliceMain {
    SliceMain { 
    }
  }
}
fn main() {
  let __rg_main_thread = std::thread::Builder::new().stack_size(512 * 1024 * 1024)
    .spawn(__rg_main_body).expect("could not start the main thread");
  __rg_main_thread.join().expect("main thread panicked");
}
fn __rg_main_body() {
  let mut t : TextTools = TextTools::new();
  println!("{}", TextTools::greet("ada"));
  let mut xs : Vec<i64> = vec![1, 2, 3];
  println!("{}{}", "twice ".to_string(), t.twice(&xs));
  println!("{}{}", "first ".to_string(), TextTools::firstChar("grace"));
}
