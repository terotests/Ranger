#![allow(unused_parens)]
#![allow(unused_mut)]
#![allow(unused_variables)]
#![allow(non_snake_case)]
#![allow(dead_code)]

#[derive(Clone)]
struct Item { 
  value : i64, 
}
impl Item { 
  
  pub fn new(v : i64) ->  Item {
    let mut me = Item { 
      value:0, 
    };
    me.value = v;
    return me;
  }
  pub fn create(v : i64) -> Item {
    return Item::new(v).clone();
  }
}
#[derive(Clone)]
struct Container { 
  items : Vec<Item>, 
}
impl Container { 
  
  pub fn new() ->  Container {
    let mut me = Container { 
      items: Vec::new(), 
    };
    me.init();
    return me;
  }
  fn init(&mut self, ) -> () {
    let mut i : i64 = 0;
    while i < 5 {
      self.items.push(Item::create(i));
      i = i + 1;
    }
  }
  fn getCount(&mut self, ) -> i64 {
    return self.items.len() as i64;
  }
}
#[derive(Clone)]
struct WhileLoopTest { 
}
impl WhileLoopTest { 
  
  pub fn new() ->  WhileLoopTest {
    let mut me = WhileLoopTest { 
    };
    return me;
  }
}
fn main() {
  let mut c : Container = Container::new();
  let cnt : i64 = c.getCount();
  println!( "{}", ["Count: ".to_string() , (cnt.to_string()) ].join("") );
  println!( "{}", "Done".to_string() );
}
