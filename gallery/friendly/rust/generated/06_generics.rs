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



#[derive(Clone)]
struct GenericsMain { 
}
impl GenericsMain { 
  
  pub fn new() ->  GenericsMain {
    GenericsMain { 
    }
  }
}
fn main() {
  let __rg_main_thread = std::thread::Builder::new().stack_size(512 * 1024 * 1024)
    .spawn(__rg_main_body).expect("could not start the main thread");
  __rg_main_thread.join().expect("main thread panicked");
}
fn __rg_main_body() {
  let mut ints : Stack_int = Stack_int::new();
  ints.put(7);
  ints.put(8);
  println!("{}{}", "int-size ".to_string(), ints.size());
  let top : Option<i64> = ints.peek();
  println!("{}{}", "int-top ".to_string(), if top.is_some() { top.unwrap() } else { 0 });
  let mut words : Stack_string = Stack_string::new();
  words.put("ada");
  words.put("grace");
  println!("{}{}", "str-size ".to_string(), words.size());
  let last_word : Option<String> = words.peek();
  println!("{}{}", "str-top ".to_string(), if last_word.is_some() { last_word.clone().unwrap() } else { "?".to_string() });
}
#[derive(Clone)]
struct Stack_int { 
  items : Vec<i64>, 
}
impl Stack_int { 
  
  pub fn new() ->  Stack_int {
    Stack_int { 
      items: Vec::new(), 
    }
  }
  fn put(&mut self, item : i64) {
    self.items.push(item);
  }
  fn size(&self) -> i64 {
    self.items.len() as i64
  }
  fn peek(&self) -> Option<i64> {
    let mut found : Option<i64> = None;
    let n : i64 = self.items.len() as i64;
    if  n == 0 {
      return found;
    }
    found = Some(self.items[(n - 1) as usize]);
    found
  }
}
#[derive(Clone)]
struct Stack_string { 
  items : Vec<String>, 
}
impl Stack_string { 
  
  pub fn new() ->  Stack_string {
    Stack_string { 
      items: Vec::new(), 
    }
  }
  fn put(&mut self, item : &str) {
    self.items.push(item.to_string());
  }
  fn size(&self) -> i64 {
    self.items.len() as i64
  }
  fn peek(&self) -> Option<String> {
    let mut found : Option<String> = None;
    let n : i64 = self.items.len() as i64;
    if  n == 0 {
      return found.clone();
    }
    found = Some(self.items[(n - 1) as usize].clone());
    found.clone()
  }
}
