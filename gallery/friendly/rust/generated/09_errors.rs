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
pub enum union_Guarded {
    Guarded_Ok(Guarded_Ok),
    Guarded_Err(Rc<RefCell<Guarded_Err>>),
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
impl RgIdentical for union_Guarded {
    fn rg_identical(&self, other: &Self) -> bool {
        match (self, other) {
            (union_Guarded::Guarded_Ok(a), union_Guarded::Guarded_Ok(b)) => a == b,
            (union_Guarded::Guarded_Err(a), union_Guarded::Guarded_Err(b)) => Rc::ptr_eq(a, b),
            _ => false,
        }
    }
}


#[derive(Clone, PartialEq)]
struct Guarded_Ok { 
  value : i64, 
}
impl Guarded_Ok { 
  
  pub fn new(value : i64) ->  Guarded_Ok {
    let mut me = Guarded_Ok { 
      value:0, 
    };
    me.value = value;
    me
  }
}
#[derive(Clone)]
struct Guarded_Err { 
  message : String, 
}
impl Guarded_Err { 
  
  pub fn new(message : String) ->  Guarded_Err {
    let mut me = Guarded_Err { 
      message:"".to_string(), 
    };
    me.message = message.clone();
    me
  }
}
#[derive(Clone)]
struct Guarded__ops { 
}
impl Guarded__ops { 
  
  pub fn new() ->  Guarded__ops {
    Guarded__ops { 
    }
  }
  pub fn equals(a : &union_Guarded, b : &union_Guarded) -> bool {
    if let union_Guarded::Guarded_Ok(__ea0) = &a { /* union case */
      if let union_Guarded::Guarded_Ok(__eb0) = &b { /* union case */
        if  __ea0.value != __eb0.value {
          return false;
        }
        return true;
      };
      return false;
    };
    if let union_Guarded::Guarded_Err(__ea1) = &a { /* union case */
      if let union_Guarded::Guarded_Err(__eb1) = &b { /* union case */
        if  __ea1.borrow().message != __eb1.borrow().message {
          return false;
        }
        return true;
      };
      return false;
    };
    false
  }
  pub fn notEquals(a : &union_Guarded, b : &union_Guarded) -> bool {
    if  Guarded__ops::equals(a, b) {
      return false;
    }
    true
  }
}
#[derive(Clone)]
struct Guard { 
}
impl Guard { 
  
  pub fn new() ->  Guard {
    Guard { 
    }
  }
  fn check(value : i64) -> union_Guarded {
    if  value < 0 {
      return union_Guarded::Guarded_Err(Rc::new(RefCell::new(Guarded_Err::new("negative".to_string()))));
    }
    union_Guarded::Guarded_Ok(Guarded_Ok::new(value))
  }
  fn describe(&self, g : &union_Guarded) -> String {
    let mut out : String = "?".to_string();
    if let union_Guarded::Guarded_Ok(o) = &g { /* union case */
      out = format!("{}{}", "ok:".to_string(), o.value);
    };
    if let union_Guarded::Guarded_Err(e) = &g { /* union case */
      out = format!("{}{}", "err:".to_string(), e.borrow().message);
    };
    out.clone()
  }
}
#[derive(Clone)]
struct ErrorsMain { 
}
impl ErrorsMain { 
  
  pub fn new() ->  ErrorsMain {
    ErrorsMain { 
    }
  }
}
fn main() {
  let __rg_main_thread = std::thread::Builder::new().stack_size(512 * 1024 * 1024)
    .spawn(__rg_main_body).expect("could not start the main thread");
  __rg_main_thread.join().expect("main thread panicked");
}
fn __rg_main_body() {
  let mut g : Guard = Guard::new();
  println!("{}", g.describe(&Guard::check(3)));
  println!("{}", g.describe(&Guard::check(0 - 1)));
}
