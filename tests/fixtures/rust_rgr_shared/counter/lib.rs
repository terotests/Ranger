//! A crate the app depends on (Cargo path dependency) that includes the same
//! shared/Bag.rgr as the app: one program, so Bag is one class.

use ranger::prelude::*;
#[allow(dead_code, unused, non_snake_case)]
mod rgr {
    ranger::import_rgr!("../shared/Bag");
}
use rgr::Bag;

pub struct Counter {
    bag: Rc<RefCell<Bag>>,
}

impl Counter {
    pub fn new() -> Counter {
        Counter { bag: Rc::new(RefCell::new(Bag::new())) }
    }

    pub fn add_all(&mut self, n: i64) -> i64 {
        let mut i: i64 = 0;
        while i < n {
            Bag::add(&self.bag, i.to_string());
            i += 1;
        }
        Bag::count(&self.bag)
    }
}
