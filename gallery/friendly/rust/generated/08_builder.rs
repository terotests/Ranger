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
struct Request { 
  host : String, 
  path : String, 
  port : i64, 
}
impl Request { 
  
  pub fn new(host : String, path : String, port : i64) ->  Request {
    let mut me = Request { 
      host:"".to_string(), 
      path:"/".to_string(), 
      port:80, 
    };
    me.host = host.clone();
    me.path = path.clone();
    me.port = port;
    me
  }
}
#[derive(Clone)]
struct RequestBuild { 
}
impl RequestBuild { 
  
  pub fn new() ->  RequestBuild {
    RequestBuild { 
    }
  }
  fn withHost(&self, r : &Request, h : &str) -> Request {
    Request::new(h.to_string(), r.path.clone(), r.port).clone()
  }
  fn withPath(&self, r : &Request, p : &str) -> Request {
    Request::new(r.host.clone(), p.to_string(), r.port).clone()
  }
  fn withPort(&self, r : &Request, n : i64) -> Request {
    Request::new(r.host.clone(), r.path.clone(), n).clone()
  }
  fn url(&self, r : &Request) -> String {
    format!("{}:{}{}", r.host, r.port.to_string(), r.path).clone()
  }
}
#[derive(Clone)]
struct MutRequest { 
  host : String, 
  path : String, 
  port : i64, 
}
impl MutRequest { 
  
  pub fn new() ->  MutRequest {
    MutRequest { 
      host:"".to_string(), 
      path:"/".to_string(), 
      port:80, 
    }
  }
  fn withHost(&mut self, h : String) -> MutRequest {
    self.host = h.clone();
    self.clone()
  }
  fn withPath(&mut self, p : String) -> MutRequest {
    self.path = p.clone();
    self.clone()
  }
  fn withPort(&mut self, n : i64) -> MutRequest {
    self.port = n;
    self.clone()
  }
  fn url(&self) -> String {
    format!("{}:{}{}", self.host, self.port.to_string(), self.path).clone()
  }
}
#[derive(Clone)]
struct BuilderMain { 
}
impl BuilderMain { 
  
  pub fn new() ->  BuilderMain {
    BuilderMain { 
    }
  }
}
fn main() {
  let __rg_main_thread = std::thread::Builder::new().stack_size(512 * 1024 * 1024)
    .spawn(__rg_main_body).expect("could not start the main thread");
  __rg_main_thread.join().expect("main thread panicked");
}
fn __rg_main_body() {
  let mut b : RequestBuild = RequestBuild::new();
  let mut start : Request = Request::new("".to_string(), "/".to_string(), 80);
  let mut step1 : Request = b.withHost(&start, "localhost");
  let mut step2 : Request = b.withPort(&step1, 8080);
  let mut done : Request = b.withPath(&step2, "/api");
  println!("{}{}", "copy ".to_string(), b.url(&done));
  let mut m : MutRequest = MutRequest::new();
  let mut chained : MutRequest = m.withHost("localhost".to_string())
    .withPort(8080)
    .withPath("/api".to_string());
  println!("{}{}", "mut ".to_string(), chained.url());
}
