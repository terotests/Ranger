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
pub enum union_ParseOutcome {
    ParseOutcome_Ok(ParseOutcome_Ok),
    ParseOutcome_Err(Rc<RefCell<ParseOutcome_Err>>),
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
            (union_ParseOutcome::ParseOutcome_Err(a), union_ParseOutcome::ParseOutcome_Err(b)) => Rc::ptr_eq(a, b),
            _ => false,
        }
    }
}


#[derive(Clone, PartialEq)]
struct ParseOutcome_Ok { 
  value : i64, 
}
impl ParseOutcome_Ok { 
  
  pub fn new(value : i64) ->  ParseOutcome_Ok {
    let mut me = ParseOutcome_Ok { 
      value:0, 
    };
    me.value = value;
    me
  }
}
#[derive(Clone)]
struct ParseOutcome_Err { 
  message : String, 
}
impl ParseOutcome_Err { 
  
  pub fn new(message : String) ->  ParseOutcome_Err {
    let mut me = ParseOutcome_Err { 
      message:"".to_string(), 
    };
    me.message = message.clone();
    me
  }
}
#[derive(Clone)]
struct ParseOutcome__ops { 
}
impl ParseOutcome__ops { 
  
  pub fn new() ->  ParseOutcome__ops {
    ParseOutcome__ops { 
    }
  }
  pub fn equals(a : &union_ParseOutcome, b : &union_ParseOutcome) -> bool {
    if let union_ParseOutcome::ParseOutcome_Ok(__ea0) = &a { /* union case */
      if let union_ParseOutcome::ParseOutcome_Ok(__eb0) = &b { /* union case */
        if  __ea0.value != __eb0.value {
          return false;
        }
        return true;
      };
      return false;
    };
    if let union_ParseOutcome::ParseOutcome_Err(__ea1) = &a { /* union case */
      if let union_ParseOutcome::ParseOutcome_Err(__eb1) = &b { /* union case */
        if  __ea1.borrow().message != __eb1.borrow().message {
          return false;
        }
        return true;
      };
      return false;
    };
    false
  }
  pub fn notEquals(a : &union_ParseOutcome, b : &union_ParseOutcome) -> bool {
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
  
  pub fn new() ->  Lookup {
    Lookup { 
    }
  }
  fn findName(names : &[String], key : &str) -> Option<String> {
    let mut found : Option<String> = None;
    let __n_i = (names.len() as i64);
    for i in 0..__n_i {
      let mut n = names[i as usize].clone();
      if  n == key {
        found = Some(n.clone());
        return found.clone();
      }
    };
    found.clone()
  }
  fn parseInt(text : &str) -> union_ParseOutcome {
    if  text.is_empty() {
      return union_ParseOutcome::ParseOutcome_Err(Rc::new(RefCell::new(ParseOutcome_Err::new("empty".to_string()))));
    }
    let parsed : Option<i64> = text.parse::<i64>().ok();
    if  parsed.is_none() {
      return union_ParseOutcome::ParseOutcome_Err(Rc::new(RefCell::new(ParseOutcome_Err::new("not a number".to_string()))));
    }
    union_ParseOutcome::ParseOutcome_Ok(ParseOutcome_Ok::new(parsed.unwrap()))
  }
  fn describe(&self, r : &union_ParseOutcome) -> String {
    let mut out : String = "?".to_string();
    if let union_ParseOutcome::ParseOutcome_Ok(o) = &r { /* union case */
      out = format!("{}{}", "ok:".to_string(), o.value);
    };
    if let union_ParseOutcome::ParseOutcome_Err(e) = &r { /* union case */
      out = format!("{}{}", "err:".to_string(), e.borrow().message);
    };
    out.clone()
  }
}
#[derive(Clone)]
struct OptionResultMain { 
}
impl OptionResultMain { 
  
  pub fn new() ->  OptionResultMain {
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
  let mut r#box : Lookup = Lookup::new();
  let mut names : Vec<String> = vec!["ada".to_string(), "grace".to_string()];
  let hit : Option<String> = Lookup::findName(&names, "ada");
  println!("{}{}", "found ".to_string(), if hit.is_some() { hit.clone().unwrap() } else { "unknown".to_string() });
  let miss : Option<String> = Lookup::findName(&names, "alan");
  println!("{}{}", "miss ".to_string(), if miss.is_some() { miss.clone().unwrap() } else { "unknown".to_string() });
  if  miss.is_none() {
    println!("miss is empty");
  }
  println!("{}", r#box.describe(&Lookup::parseInt("42")));
  println!("{}", r#box.describe(&Lookup::parseInt("")));
  println!("{}", r#box.describe(&Lookup::parseInt("nope")));
}
