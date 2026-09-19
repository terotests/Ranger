#![allow(unused_parens)]
#![allow(unused_mut)]
#![allow(unused_variables)]
#![allow(unused_assignments)]
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


pub trait NamedTrait: RgAnyRef {
  fn label(&self) -> String;
}

pub trait Sized2Trait: RgAnyRef {
  fn weight(&self) -> i64;
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

#[derive(Clone)]
struct User { 
  uname : &'static str, 
}
impl User { 
  
  pub fn new() ->  User {
    User { 
      uname:"", 
    }
  }
  fn label() -> String {
    "anon".to_string().clone()
  }
  fn weight() -> i64 {
    1
  }
}

impl RgAnyRef for User { fn rg_as_any(&self) -> &dyn std::any::Any { self } }
impl NamedTrait for User {
  fn label(&self) -> String {
    User::label()
  }
}
impl Sized2Trait for User {
  fn weight(&self) -> i64 {
    User::weight()
  }
}
#[derive(Clone)]
struct Bot { 
  id : i64, 
}
impl Bot { 
  
  pub fn new() ->  Bot {
    Bot { 
      id:0, 
    }
  }
  fn label() -> String {
    "anon".to_string().clone()
  }
}

impl RgAnyRef for Bot { fn rg_as_any(&self) -> &dyn std::any::Any { self } }
impl NamedTrait for Bot {
  fn label(&self) -> String {
    Bot::label()
  }
}
#[derive(Clone)]
struct TraitsMain { 
}
impl TraitsMain { 
  
  pub fn new() ->  TraitsMain {
    TraitsMain { 
    }
  }
  fn show(mut n : Rc<RefCell<dyn NamedTrait>>) -> String {
    return n.borrow().label().clone();
  }
}
fn main() {
  let __rg_main_thread = std::thread::Builder::new().stack_size(512 * 1024 * 1024)
    .spawn(__rg_main_body).expect("could not start the main thread");
  __rg_main_thread.join().expect("main thread panicked");
}
fn __rg_main_body() {
  let mut app : TraitsMain = TraitsMain::new();
  let mut u : User = User::new();
  let mut b : Bot = Bot::new();
  println!("{}{}", "user ".to_string(), TraitsMain::show(Rc::new(RefCell::new(u)).clone()));
  println!("{}{}", "bot ".to_string(), TraitsMain::show(Rc::new(RefCell::new(b)).clone()));
  println!("{}{}", "weight ".to_string(), User::weight());
}
