//! A Rust struct with a field of a class of an imported .rgr file: the
//! field's first value is that class's constructor.

use ranger::prelude::*;
#[allow(dead_code, unused, non_snake_case)]
mod rgr {
    ranger::import_rgr!("Bag");
}
use rgr::Bag;

pub struct Holder {
    bag: Rc<RefCell<Bag>>,
    pub name: String,
}

impl Holder {
    pub fn new() -> Holder {
        Holder { bag: Rc::new(RefCell::new(Bag::new())), name: String::from("h") }
    }

    pub fn put(&mut self, s: &str) -> i64 {
        Bag::add(&self.bag, s.to_string());
        Bag::count(&self.bag)
    }
}
