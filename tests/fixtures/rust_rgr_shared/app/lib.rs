//! The app crate: includes shared/Bag.rgr itself (by a path spelled another
//! way) and uses the counter crate, which includes it too.

use ranger::prelude::*;
use counter::Counter;
#[allow(dead_code, unused, non_snake_case)]
mod rgr {
    ranger::import_rgr!("../app/../shared/Bag");
}
use rgr::Bag;

pub struct Holder {
    bag: Rc<RefCell<Bag>>,
    counter: Counter,
}

impl Holder {
    pub fn new() -> Holder {
        Holder { bag: Rc::new(RefCell::new(Bag::new())), counter: Counter::new() }
    }

    pub fn put(&mut self, s: &str) -> i64 {
        Bag::add(&self.bag, s.to_string());
        Bag::count(&self.bag)
    }

    pub fn count_to(&mut self, n: i64) -> i64 {
        self.counter.add_all(n)
    }
}
