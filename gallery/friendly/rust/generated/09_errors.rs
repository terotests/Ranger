#![allow(dead_code)]

use std::rc::Rc;
use std::cell::RefCell;

#[derive(Clone)]
pub enum union_Guarded {
    Guarded_Ok(Guarded_Ok),
    Guarded_Err(Guarded_Err),
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
            (union_Guarded::Guarded_Err(a), union_Guarded::Guarded_Err(b)) => a == b,
            _ => false,
        }
    }
}


#[derive(Clone, PartialEq)]
struct Guarded_Ok {
  value: i64,
}
impl Guarded_Ok {
  pub fn new(value: i64) -> Self {
    let mut me = Self {
      value: 0,
    };
    me.value = value;
    me
  }
}
#[derive(Clone, PartialEq)]
struct Guarded_Err {
  message: String,
}
impl Guarded_Err {
  pub fn new(message: String) -> Self {
    let mut me = Self {
      message: String::new(),
    };
    me.message = message.clone();
    me
  }
}
#[derive(Clone)]
struct Guarded__ops {
}
impl Guarded__ops {
  pub fn new() -> Self {
    Self {
    }
  }
  pub fn equals(a: &union_Guarded, b: &union_Guarded) -> bool {
    if let union_Guarded::Guarded_Ok(__ea0) = &a { /* union case */
      if let union_Guarded::Guarded_Ok(__eb0) = &b { /* union case */
        if  __ea0.value != __eb0.value {
          return false;
        }
        return true;
      }
      return false;
    }
    if let union_Guarded::Guarded_Err(__ea1) = &a { /* union case */
      if let union_Guarded::Guarded_Err(__eb1) = &b { /* union case */
        if  __ea1.message != __eb1.message {
          return false;
        }
        return true;
      }
      return false;
    }
    false
  }
  pub fn not_equals(a: &union_Guarded, b: &union_Guarded) -> bool {
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
  pub fn new() -> Self {
    Self {
    }
  }
  fn check(value: i64) -> union_Guarded {
    if  value < 0 {
      return union_Guarded::Guarded_Err(Guarded_Err::new("negative".to_string()));
    }
    union_Guarded::Guarded_Ok(Guarded_Ok::new(value))
  }
  fn describe(&self, g: &union_Guarded) -> String {
    let mut out: String = "?".to_string();
    match &g {
      union_Guarded::Guarded_Ok(o) => {
        out = format!("ok:{}", o.value);
      }
      union_Guarded::Guarded_Err(e) => {
        out = format!("err:{}", e.message);
      }
    }
    out.clone()
  }
}
#[derive(Clone)]
struct ErrorsMain {
}
impl ErrorsMain {
  pub fn new() -> Self {
    Self {
    }
  }
}
fn main() {
  let __rg_main_thread = std::thread::Builder::new().stack_size(512 * 1024 * 1024)
    .spawn(__rg_main_body).expect("could not start the main thread");
  __rg_main_thread.join().expect("main thread panicked");
}
fn __rg_main_body() {
  let mut g: Guard = Guard::new();
  println!("{}", g.describe(&Guard::check(3)));
  println!("{}", g.describe(&Guard::check(0 - 1)));
}
