#![allow(unused_parens)]
#![allow(unused_mut)]
#![allow(unused_variables)]
#![allow(non_snake_case)]
#![allow(dead_code)]

#[derive(Clone)]
struct Test_LocalArray { 
}
impl Test_LocalArray { 
  
  pub fn new() ->  Test_LocalArray {
    let mut me = Test_LocalArray { 
    };
    return me;
  }
}
fn main() {
  let mut items : Vec<String> = Vec::new();
  items.push("hello".to_string().to_string());
  items.push("world".to_string().to_string());
  println!( "{}", "hello".to_string() );
  println!( "{}", "world".to_string() );
}
