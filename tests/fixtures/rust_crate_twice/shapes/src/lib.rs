// Uses geo's type: geo is written once, by whichever import reads it first.
use geo::Pt;
use ranger::prelude::*;
use std::cell::RefCell;
use std::rc::Rc;
mod rgr;
use crate::rgr::Label;

pub struct Seg {
    pub a: Pt,
    pub b: Pt,
}

impl Seg {
    pub fn new(a: Pt, b: Pt) -> Seg {
        Seg { a, b }
    }
    fn name(&self) -> Rc<RefCell<Label>> {
        Label::of("seg")
    }
    pub fn len(&self) -> f64 {
        self.a.dist(&self.b)
    }
}
