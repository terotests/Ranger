#![allow(unused_parens)]
#![allow(unused_mut)]
#![allow(unused_variables)]
#![allow(unused_assignments)]
#![allow(dead_code)]
// The clippy allows below cover shapes that mirror the Ranger source
// itself, which the transpiler must not rewrite or rename.
#![allow(clippy::collapsible_if)]
#![allow(clippy::ptr_arg)]

use std::rc::Rc;
use std::cell::RefCell;

#[derive(Clone)]
pub enum union_ParseOutcome {
    ParseOutcome_Ok(ParseOutcome_Ok),
    ParseOutcome_Err(ParseOutcome_Err),
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
impl RgIdentical for union_ParseOutcome {
    fn rg_identical(&self, other: &Self) -> bool {
        match (self, other) {
            (union_ParseOutcome::ParseOutcome_Ok(a), union_ParseOutcome::ParseOutcome_Ok(b)) => a == b,
            (union_ParseOutcome::ParseOutcome_Err(a), union_ParseOutcome::ParseOutcome_Err(b)) => a == b,
            _ => false,
        }
    }
}


#[derive(Clone, PartialEq)]
struct ParseOutcome_Ok {
  value: i64,
}
impl ParseOutcome_Ok {
  pub fn new(value: i64) -> Self {
    let mut me = ParseOutcome_Ok {
      value: 0,
    };
    me.value = value;
    me
  }
}
#[derive(Clone, PartialEq)]
struct ParseOutcome_Err {
  message: String,
}
impl ParseOutcome_Err {
  pub fn new(message: String) -> Self {
    let mut me = ParseOutcome_Err {
      message: "".to_string(),
    };
    me.message = message.clone();
    me
  }
}
#[derive(Clone)]
struct ParseOutcome__ops {
}
impl ParseOutcome__ops {
  pub fn new() -> Self {
    ParseOutcome__ops {
    }
  }
  pub fn equals(a: &union_ParseOutcome, b: &union_ParseOutcome) -> bool {
    if let union_ParseOutcome::ParseOutcome_Ok(__ea0) = &a { /* union case */
      if let union_ParseOutcome::ParseOutcome_Ok(__eb0) = &b { /* union case */
        if  __ea0.value != __eb0.value {
          return false;
        }
        return true;
      }
      return false;
    }
    if let union_ParseOutcome::ParseOutcome_Err(__ea1) = &a { /* union case */
      if let union_ParseOutcome::ParseOutcome_Err(__eb1) = &b { /* union case */
        if  __ea1.message != __eb1.message {
          return false;
        }
        return true;
      }
      return false;
    }
    false
  }
  pub fn not_equals(a: &union_ParseOutcome, b: &union_ParseOutcome) -> bool {
    if  ParseOutcome__ops::equals(a, b) {
      return false;
    }
    true
  }
}
#[derive(Clone)]
struct Lookup {
}
impl Lookup {
  pub fn new() -> Self {
    Lookup {
    }
  }
  fn find_name(names: &[String], key: &str) -> Option<String> {
    let mut found: Option<String> = None;
    for n in names.iter().cloned() {
      if  n == key {
        found = Some(n.clone());
        return found.clone();
      }
    }
    found.clone()
  }
  fn parse_int(text: &str) -> union_ParseOutcome {
    if  text.is_empty() {
      return union_ParseOutcome::ParseOutcome_Err(ParseOutcome_Err::new("empty".to_string()));
    }
    let parsed: Option<i64> = text.parse::<i64>().ok();
    if  parsed.is_none() {
      return union_ParseOutcome::ParseOutcome_Err(ParseOutcome_Err::new("not a number".to_string()));
    }
    union_ParseOutcome::ParseOutcome_Ok(ParseOutcome_Ok::new(parsed.unwrap()))
  }
  fn describe(&self, r: &union_ParseOutcome) -> String {
    let mut out: String = "?".to_string();
    match &r {
      union_ParseOutcome::ParseOutcome_Ok(o) => {
        out = format!("ok:{}", o.value);
      }
      union_ParseOutcome::ParseOutcome_Err(e) => {
        out = format!("err:{}", e.message);
      }
    }
    out.clone()
  }
}
#[derive(Clone)]
struct OptionResultMain {
}
impl OptionResultMain {
  pub fn new() -> Self {
    OptionResultMain {
    }
  }
}
fn main() {
  let __rg_main_thread = std::thread::Builder::new().stack_size(512 * 1024 * 1024)
    .spawn(__rg_main_body).expect("could not start the main thread");
  __rg_main_thread.join().expect("main thread panicked");
}
fn __rg_main_body() {
  let mut r#box: Lookup = Lookup::new();
  let mut names: Vec<String> = vec!["ada".to_string(), "grace".to_string()];
  let hit: Option<String> = Lookup::find_name(&names, "ada");
  println!("found {}", if hit.is_some() { hit.clone().unwrap() } else { "unknown".to_string() });
  let miss: Option<String> = Lookup::find_name(&names, "alan");
  println!("miss {}", if miss.is_some() { miss.clone().unwrap() } else { "unknown".to_string() });
  if  miss.is_none() {
    println!("miss is empty");
  }
  println!("{}", r#box.describe(&Lookup::parse_int("42")));
  println!("{}", r#box.describe(&Lookup::parse_int("")));
  println!("{}", r#box.describe(&Lookup::parse_int("nope")));
}
