//! A crate whose `import_rgr!` path leaves the crate's folder, imported by
//! a .rgr file in a subfolder (`Import "../lib.rs"`): the .rgr file is found
//! from lib.rs's folder, not from the importer's.

use ranger::prelude::*;
#[allow(dead_code, unused, non_snake_case)]
mod rgr {
    ranger::import_rgr!("../shared/Bag");
}
use rgr::Bag;

pub struct Holder {
    bag: Rc<RefCell<Bag>>,
}

impl Holder {
    pub fn new() -> Holder {
        Holder { bag: Rc::new(RefCell::new(Bag::new())) }
    }

    pub fn put(&mut self, s: &str) -> i64 {
        Bag::add(&self.bag, s.to_string());
        Bag::count(&self.bag)
    }
}
