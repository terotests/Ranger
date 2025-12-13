#![allow(unused_parens)]
#![allow(unused_mut)]
#![allow(unused_variables)]
#![allow(non_snake_case)]
#![allow(dead_code)]

#[derive(Clone)]
struct Test_ArrayPush { 
}
impl Test_ArrayPush { 
  
  pub fn new() ->  Test_ArrayPush {
    let mut me = Test_ArrayPush { 
    };
    return me;
  }
}
fn main() {
  let mut items : Vec<String> = Vec::new();
  items.push("hello".to_string().to_string());
  items.push("world".to_string().to_string());
  println!( "{}", "Done".to_string() );
}
