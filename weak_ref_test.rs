#![allow(unused_parens)]
#![allow(unused_mut)]
#![allow(unused_variables)]
#![allow(non_snake_case)]
#![allow(dead_code)]

use std::rc::Rc;
use std::rc::Weak;
use std::cell::RefCell;

#[derive(Clone)]
struct PDFWriter { 
  name : String, 
}
impl PDFWriter { 
  
  pub fn new() ->  PDFWriter {
    let mut me = PDFWriter { 
      name:"writer".to_string(), 
    };
    return me;
  }
  fn render() -> () {
    println!( "{}", "rendering".to_string() );
  }
}
#[derive(Clone)]
struct ImageMeasurer { 
  renderer : Option<Weak<RefCell<PDFWriter>>>, 
}
impl ImageMeasurer { 
  
  pub fn new() ->  ImageMeasurer {
    let mut me = ImageMeasurer { 
      renderer: None, 
    };
    return me;
  }
  fn setRenderer(&mut self, mut r : Rc<RefCell<PDFWriter>>) -> () {
    self.renderer = Some(Rc::downgrade(&r));
  }
  fn measure() -> i64 {
    return 100;
  }
}
#[derive(Clone)]
struct PDFContainer { 
  measurer : Option<ImageMeasurer>, 
  myWriter : Option<PDFWriter>, 
}
impl PDFContainer { 
  
  pub fn new() ->  PDFContainer {
    let mut me = PDFContainer { 
      measurer: None, 
      myWriter: None, 
    };
    let mut m : ImageMeasurer = ImageMeasurer::new();
    me.measurer = Some(m.clone());
    let mut w : PDFWriter = PDFWriter::new();
    me.myWriter = Some(w.clone());
    return me;
  }
  fn init(&mut self, mut selfRef : Rc<RefCell<PDFWriter>>) -> () {
    self.measurer.as_mut().unwrap().setRenderer(selfRef.clone());
  }
  fn write(&mut self, ) -> () {
    let size : i64 = ImageMeasurer::measure();
    println!( "{}", [&*"size: ".to_string(), &*(size.to_string())].concat() );
  }
}
#[derive(Clone)]
struct WeakRefTest { 
}
impl WeakRefTest { 
  
  pub fn new() ->  WeakRefTest {
    let mut me = WeakRefTest { 
    };
    return me;
  }
}
fn main() {
  println!( "{}", "Weak Reference Test".to_string() );
  let mut container : PDFContainer = PDFContainer::new();
  container.init(container.myWriter.clone());
  (container).write();
  println!( "{}", "Done".to_string() );
}
