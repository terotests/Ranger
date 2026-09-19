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
  age : i64, 
  name : &'static str, 
}
impl User { 
  
  pub fn new() ->  User {
    User { 
      age:0, 
      name:"", 
    }
  }
  fn as_string(&self) -> String {
    format!("{} {}", self.name, self.age).clone()
  }
  fn label(&self) -> String {
    self.name.to_string()
  }
}
#[derive(Clone)]
struct Bot { 
  name : &'static str, 
}
impl Bot { 
  
  pub fn new() ->  Bot {
    Bot { 
      name:"", 
    }
  }
  fn as_string(&self) -> String {
    format!("{}{}", "bot:".to_string(), self.name).clone()
  }
  fn label(&self) -> String {
    self.name.to_string()
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
  fn show(mut who : &mut User) -> String {
    format!("{}{}{}{}", "label=".to_string(), who.label(), " text=".to_string(), who.as_string()).clone()
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
  u.name = "ada";
  u.age = 36;
  println!("{}", TraitsMain::show(&mut u));
  let mut b : Bot = Bot::new();
  b.name = "r2";
  println!("{}", b.as_string());
}
