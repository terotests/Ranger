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

#[repr(i64)]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Color {
    Red = 0,
    Green = 1,
    Blue = 2,
}

#[derive(Clone)]
pub enum union_Message {
    Message_Ping(Message_Ping),
    Message_Text(Message_Text),
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
            (union_Message::Message_Text(a), union_Message::Message_Text(b)) => a == b,
            (union_Message::Message_Move(a), union_Message::Message_Move(b)) => a == b,
            _ => false,
        }
    }
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
#[derive(Clone, PartialEq)]
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
      }
      return false;
    }
    if let union_Message::Message_Text(__ea1) = &a { /* union case */
      if let union_Message::Message_Text(__eb1) = &b { /* union case */
        if  __ea1.body != __eb1.body {
          return false;
        }
        return true;
      }
      return false;
    }
    if let union_Message::Message_Move(__ea2) = &a { /* union case */
      if let union_Message::Message_Move(__eb2) = &b { /* union case */
        if  __ea2.dx != __eb2.dx {
          return false;
        }
        if  __ea2.dy != __eb2.dy {
          return false;
        }
        return true;
      }
      return false;
    }
    false
  }
  pub fn not_equals(a : &union_Message, b : &union_Message) -> bool {
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
  fn color_name(c : Color) -> String {
    if  c == Color::Red {
      return "red".to_string().clone();
    }
    if  c == Color::Green {
      return "green".to_string().clone();
    }
    "blue".to_string().clone()
  }
  fn describe(&self, m : &union_Message) -> String {
    let mut out : String = "?".to_string();
    match &m {
      union_Message::Message_Ping(__match0) => {
        out = "ping".to_string();
      }
      union_Message::Message_Text(t) => {
        out = format!("{}{}", "text:".to_string(), t.body);
      }
      union_Message::Message_Move(mv) => {
        out = format!("{}{}{}{}", "move:".to_string(), mv.dx, ",".to_string(), mv.dy);
      }
    }
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
  println!("{}{}", "color ".to_string(), EnumsMain::color_name(Color::Green));
  println!("{}", app.describe(&union_Message::Message_Ping(Message_Ping::new())));
  println!("{}", app.describe(&union_Message::Message_Text(Message_Text::new("hi".to_string()))));
  println!("{}", app.describe(&union_Message::Message_Move(Message_Move::new(2, 3))));
}
