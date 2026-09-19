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
struct Point { 
  x : i64, 
  y : i64, 
}
impl Point { 
  
  pub fn new() ->  Point {
    Point { 
      x:0, 
      y:0, 
    }
  }
}
#[derive(Clone)]
struct OptionalParams { 
}
impl OptionalParams { 
  
  pub fn new() ->  OptionalParams {
    OptionalParams { 
    }
  }
  fn shown(maybe : Option<String>) -> String {
    if  maybe.is_none() {
      return "unknown".to_string().clone();
    }
    maybe.clone().unwrap().clone()
  }
  fn shownInt(a : Option<i64>) -> i64 {
    if  a.is_none() {
      return 0;
    }
    let r : i64 = a.unwrap();
    r
  }
  fn shownPoint(&self, mut p : Option<Rc<RefCell<Point>>>) -> i64 {
    if  p.is_none() {
      return 0;
    }
    let mut q : Rc<RefCell<Point>> = p.clone().unwrap();
    return q.borrow().x;
  }
}
fn main() {
  let __rg_main_thread = std::thread::Builder::new().stack_size(512 * 1024 * 1024)
    .spawn(__rg_main_body).expect("could not start the main thread");
  __rg_main_thread.join().expect("main thread panicked");
}
fn __rg_main_body() {
  let mut app : OptionalParams = OptionalParams::new();
  let mut hit : Option<String> = None;
  hit = Some("ada".to_string());
  println!("{}{}", "name ".to_string(), OptionalParams::shown(hit.clone()));
  let miss : Option<String> = None;
  println!("{}{}", "miss ".to_string(), OptionalParams::shown(miss.clone()));
  let mut n : Option<i64> = None;
  n = Some(41);
  println!("{}{}", "int ".to_string(), OptionalParams::shownInt(n));
  let mut p : Option<Rc<RefCell<Point>>> = None;
  let mut pt : Rc<RefCell<Point>> = Rc::new(RefCell::new(Point::new()));
  pt.borrow_mut().x = 7;
  p = Some(pt.clone());
  println!("{}{}", "point ".to_string(), app.shownPoint(p.clone()));
}
