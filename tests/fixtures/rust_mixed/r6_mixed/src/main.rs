use ranger::prelude::*;
use std::cell::RefCell;
use std::rc::Rc;

mod geometry;

#[allow(dead_code, unused)]
mod legacy {
    ranger::import_rgr!("legacy");
}

use geometry::Point;
use legacy::{Counter, Tally};

fn main() {
    let a = Point::new(1, 2);
    let b = Point::new(4, 6);
    println!("dist2 {}", a.dist2(&b));

    // a Ranger class is a shared handle on the Rust side
    let c = Rc::new(RefCell::new(Counter::new(String::from("steps"))));
    Counter::add(&c, a.dist2(&b));
    Counter::add(&c, 5);
    println!("{}", Counter::describe(&c));
    println!("total {} count {}", Counter::total(&c), c.borrow().count);

    let m = Counter::create("made");
    Counter::add(&m, 10);
    c.borrow_mut().label = String::from("renamed");
    println!("{} / {}", Counter::describe(&m), Counter::describe(&c));

    let t = Rc::new(RefCell::new(Tally::new()));
    Tally::keep(&t, Rc::clone(&c));
    Tally::keep(&t, Rc::clone(&m));
    // the handle is shared: the change is seen through the tally
    Counter::add(&c, 100);
    println!("sum {}", Tally::sum(&t));
}
