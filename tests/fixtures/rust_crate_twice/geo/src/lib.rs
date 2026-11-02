// A crate both of the .rgr programs import, and shapes depends on.
use ranger::prelude::*;
use std::cell::RefCell;
use std::rc::Rc;
mod rgr;
use crate::rgr::Label;
pub struct Pt {
    pub x: f64,
    pub y: f64,
}

impl Pt {
    pub fn new(x: f64, y: f64) -> Pt {
        Pt { x, y }
    }
    fn name(&self) -> Rc<RefCell<Label>> {
        Label::of("pt")
    }
    pub fn dist(&self, o: &Pt) -> f64 {
        ((self.x - o.x) * (self.x - o.x) + (self.y - o.y) * (self.y - o.y)).sqrt()
    }
}
