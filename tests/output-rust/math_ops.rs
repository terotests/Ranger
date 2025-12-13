#![allow(unused_parens)]
#![allow(unused_mut)]
#![allow(unused_variables)]
#![allow(non_snake_case)]
#![allow(dead_code)]

#[derive(Clone)]
struct MathOpsTest { 
}
impl MathOpsTest { 
  
  pub fn new() ->  MathOpsTest {
    let mut me = MathOpsTest { 
    };
    return me;
  }
}
fn main() {
  let a : i64 = 10;
  let b : i64 = 3;
  let sum : i64 = a + b;
  println!( "{}", ["Sum: ".to_string() , (sum.to_string()) ].join("") );
  let diff : i64 = a - b;
  println!( "{}", ["Diff: ".to_string() , (diff.to_string()) ].join("") );
  let prod : i64 = a * b;
  println!( "{}", ["Prod: ".to_string() , (prod.to_string()) ].join("") );
  let quot : f64 = ((a) as f64 / (b) as f64);
  println!( "{}", ["Quot: ".to_string() , (quot.to_string()) ].join("") );
  if  a > b {
    println!( "{}", "a is greater".to_string() );
  }
  if  a >= 10 {
    println!( "{}", "a is at least 10".to_string() );
  }
  let x : bool = true;
  let y : bool = false;
  if  x && (false == y) {
    println!( "{}", "x is true and y is false".to_string() );
  }
  println!( "{}", "Done".to_string() );
}
